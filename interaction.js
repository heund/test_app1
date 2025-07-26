// Interactive mode module for generative spectrograph
// Called from main script.js via startInteractiveMode()

// Global function to start interactive mode
function startInteractiveMode() {
  const mainView = document.getElementById('mainView');
  
  // Add full-height class for proper layout
  mainView.classList.add('full-height');
  
  // Create interactive content - full viewport canvas
  mainView.innerHTML = `
    <canvas id='specCanvas' style='position:fixed;top:0;left:0;background:#000;z-index:1;display:block;'></canvas>
    <div id='resultMsg' style='position: fixed; top: calc(60px + 2vh); left: 50%; transform: translateX(-50%); color: #fff; font-size: clamp(12px,2vw,16px); font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.9); background: rgba(0,0,0,0.85); padding: 0.8vh 1.5vw; border-radius: 6px; z-index: 100; max-width: 50vw; text-align: center; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.4);'></div>
  `;
  
  // Add the interactive UI elements as overlays that don't interfere with nav
  const interactiveOverlays = document.createElement('div');
  interactiveOverlays.id = 'interactiveOverlays';
  interactiveOverlays.innerHTML = `
    <button id='generateBtn' class='generate-button' style='position:fixed;top:calc(60px + 1.5vh);left:2vw;z-index:100;font-size:clamp(12px,2.5vw,16px);padding:1vh 2vw;background:#4a90e2;color:#fff;border:2px solid #fff;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:600;min-width:120px;'>Generate New Spectrograph</button>
    <div id='generationCounter' class='generation-counter' style='position:fixed;bottom:2vh;left:50%;transform:translateX(-50%);z-index:1001;font-size:clamp(14px,2.5vw,18px);color:#fff;background:rgba(0,0,0,0.8);padding:1vh 2vw;border-radius:6px;border:1px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:600;'>Generation: 1</div>
    <button id='debugToggle' class='debug-toggle' style='position:fixed;top:calc(60px + 1.5vh);right:2vw;z-index:100;font-size:clamp(12px,2.5vw,16px);padding:1vh 2vw;background:#e74c3c;color:#fff;border:2px solid #fff;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:600;min-width:100px;'>Show Anomaly</button>
    <div id='instructionOverlay' class='instruction-overlay' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(2px);'>
      <div class='overlay-content' style='text-align:center;color:#fff;max-width:400px;padding:2rem;background:rgba(0,0,0,0.7);border-radius:12px;border:2px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.5);'>
        <h2 style='font-size:1.8rem;margin-bottom:1rem;color:#fff;font-weight:600;'>Generative Spectrograph Mode</h2>
        <p style='font-size:1rem;line-height:1.4;margin-bottom:0.75rem;color:#ccc;'>Find the anomaly in the procedurally generated spectrograph.</p>
        <p style='font-size:1rem;line-height:1.4;margin-bottom:0.75rem;color:#ccc;'>Use "Generate" to create a new spectrograph with a different anomaly.</p>
        <button id='startBtn' class='start-button' style='background:linear-gradient(135deg,#4a90e2,#357abd);color:#fff;border:none;border-radius:8px;padding:0.75rem 2rem;font-size:1.1rem;font-weight:600;cursor:pointer;margin-top:1rem;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(74,144,226,0.3);'>Start Exploring</button>
      </div>
    </div>
  `;
  
  // Append overlays to body so they don't interfere with navigation
  document.body.appendChild(interactiveOverlays);
  
  // Store reference for cleanup
  window.currentInteractiveOverlays = interactiveOverlays;
  
  // Generative spectrograph state
  let generationCount = 1;
  let currentAnomalySpot = null;
  let spectrogramData = null;
  let debugMode = false;
  
  // Spectrograph generation parameters (randomized each generation)
  let spectrogramParams = {
    frequencyBands: 256,
    timeSlices: 512,
    baseIntensity: 0.2 + Math.random() * 0.4, // 0.2-0.6
    noiseLevel: 0.05 + Math.random() * 0.15,  // 0.05-0.2
    harmonicStrength: 0.3 + Math.random() * 0.5, // 0.3-0.8
    colorScheme: Math.floor(Math.random() * 4), // 0-3 different color schemes
    patternType: Math.floor(Math.random() * 3),  // 0-2 different pattern types
    grainSize: 0.5 + Math.random() * 2.0,       // 0.5-2.5 grain variation
    frequencyFocus: Math.random() * 256,        // Random frequency focus point
    timeModulation: 0.005 + Math.random() * 0.02 // 0.005-0.025 time mod speed
  };
  
  // Canvas and magnifier setup
  const canvas = document.getElementById('specCanvas');
  const ctx = canvas.getContext('2d');
  const resultMsg = document.getElementById('resultMsg');
  
  // Interaction variables
  let interacting = false;
  let magnifierActive = false;
  let magnifierX = 0;
  let magnifierY = 0;
  const magnifierRadius = 80; // Radius of the magnifying glass
  const magnificationFactor = 2.5; // How much to zoom in
  
  // Gesture detection variables
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let magnifierTimer = null; // Timer for delayed magnifier activation
  const HOLD_THRESHOLD = 200; // ms to distinguish tap from hold
  const DRAG_THRESHOLD = 10; // pixels to distinguish tap from drag
  
  // Setup canvas dimensions to fill entire viewport
  function setupCanvas() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas to fill entire viewport
    canvas.width = viewportWidth * devicePixelRatio;
    canvas.height = viewportHeight * devicePixelRatio;
    canvas.style.width = viewportWidth + 'px';
    canvas.style.height = viewportHeight + 'px';
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    return { width: viewportWidth, height: viewportHeight };
  }
  
  // Find optimal anomaly location based on local contrast and color distribution
  function findOptimalAnomalyLocation(radius) {
    const { frequencyBands, timeSlices } = spectrogramParams;
    const candidates = [];
    const sampleSize = 20; // Number of candidate locations to evaluate
    
    // Calculate responsive, device-aware margins for all screen sizes and orientations
    // Use viewport units and dynamic detection for iPad/mobile/desktop compatibility
    
    // Navigation height: responsive to viewport
    const navHeightVh = window.innerHeight * 0.08; // ~8vh for navigation
    
    // Button area: positioned at calc(60px + 1.5vh) with responsive sizing
    const buttonTopOffset = Math.max(60, window.innerHeight * 0.06) + (window.innerHeight * 0.015); // 60px or 6vh + 1.5vh
    const buttonHeightVh = window.innerHeight * 0.06; // ~6vh for button height including padding
    
    // Total exclusion zone: navigation + button positioning + button height + safety buffer
    const safetyBufferVh = window.innerHeight * 0.03; // 3vh safety buffer
    const totalTopOffset = Math.max(
      navHeightVh + buttonTopOffset + buttonHeightVh + safetyBufferVh,
      window.innerHeight * 0.18 // Minimum 18% of viewport height
    );
    
    const effectiveCanvasHeight = window.innerHeight - totalTopOffset;
    const canvasSize = { width: window.innerWidth, height: effectiveCanvasHeight };
    
    const visualRadiusX = (radius / timeSlices) * canvasSize.width;
    const visualRadiusY = (radius / frequencyBands) * canvasSize.height;
    
    // Convert visual margins back to data space with safety buffer
    const marginX = Math.ceil((visualRadiusX / canvasSize.width) * timeSlices) + 5;
    // Add extra top margin to account for navigation and button area
    const topMarginY = Math.ceil((totalTopOffset / window.innerHeight) * frequencyBands) + 10;
    const bottomMarginY = Math.ceil((visualRadiusY / window.innerHeight) * frequencyBands) + 5;
    const marginY = Math.max(topMarginY, bottomMarginY);
    
    // Generate candidate locations with viewport-aware bounds
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(marginX + Math.random() * (timeSlices - 2 * marginX));
      const y = Math.floor(marginY + Math.random() * (frequencyBands - 2 * marginY));
      
      // Analyze local area around this candidate
      let localIntensities = [];
      let minIntensity = 1;
      let maxIntensity = 0;
      
      // Sample the local area
      const sampleRadius = radius * 1.5;
      for (let dy = -sampleRadius; dy <= sampleRadius; dy += 2) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx += 2) {
          const sampleX = Math.max(0, Math.min(timeSlices - 1, x + dx));
          const sampleY = Math.max(0, Math.min(frequencyBands - 1, y + dy));
          
          // Ensure spectrogramData exists and has the required indices
          if (spectrogramData && spectrogramData[sampleY] && spectrogramData[sampleY][sampleX] !== undefined) {
            const intensity = spectrogramData[sampleY][sampleX];
            
            localIntensities.push(intensity);
            minIntensity = Math.min(minIntensity, intensity);
            maxIntensity = Math.max(maxIntensity, intensity);
          }
        }
      }
      
      // Skip this candidate if we couldn't collect enough data
      if (localIntensities.length === 0) {
        continue;
      }
      
      // Calculate local statistics
      const avgIntensity = localIntensities.reduce((a, b) => a + b, 0) / localIntensities.length;
      const contrast = maxIntensity - minIntensity;
      const variance = localIntensities.reduce((sum, val) => sum + Math.pow(val - avgIntensity, 2), 0) / localIntensities.length;
      
      // Determine best anomaly type for this location
      let anomalyType;
      let suitabilityScore;
      
      if (avgIntensity < 0.3 && contrast > 0.1) {
        // Dark area with some contrast - place bright anomaly
        anomalyType = 'bright';
        suitabilityScore = (0.3 - avgIntensity) * contrast * 10;
      } else if (avgIntensity > 0.7 && contrast > 0.1) {
        // Bright area with some contrast - place dark anomaly
        anomalyType = 'dark';
        suitabilityScore = (avgIntensity - 0.7) * contrast * 10;
      } else if (contrast > 0.2 && variance > 0.05) {
        // Area with good contrast and variation - place subtle shift
        anomalyType = 'shift';
        suitabilityScore = contrast * variance * 20;
      } else {
        // Poor location - low suitability
        anomalyType = 'bright';
        suitabilityScore = 0.1;
      }
      
      candidates.push({
        x, y, anomalyType, suitabilityScore,
        avgIntensity, contrast, variance
      });
    }
    
    // Sort by suitability score and pick the best location
    candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    // Fallback if no valid candidates found - use viewport-aware bounds
    if (candidates.length === 0) {
      return {
        anomalyX: Math.floor(marginX + Math.random() * (timeSlices - 2 * marginX)),
        anomalyY: Math.floor(marginY + Math.random() * (frequencyBands - 2 * marginY)),
        anomalyType: 'bright'
      };
    }
    
    // Add randomization to candidate selection - don't always pick the absolute best
    // This prevents the anomaly from appearing in predictable locations
    const topCandidates = candidates.slice(0, Math.min(5, candidates.length));
    const selectedCandidate = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    const best = selectedCandidate;
    
    return {
      anomalyX: best.x,
      anomalyY: best.y,
      anomalyType: best.anomalyType
    };
  }
  
  // Place intelligent anomaly after spectrogram data is generated
  function placeIntelligentAnomaly() {
    const { frequencyBands, timeSlices } = spectrogramParams;
    const anomalyRadius = 8 + Math.random() * 12;
    const { anomalyX, anomalyY, anomalyType } = findOptimalAnomalyLocation(anomalyRadius);
    
    // Calculate local average intensity around anomaly for better contrast
    let localAvgIntensity = 0;
    let localSamples = 0;
    const sampleRadius = anomalyRadius * 1.2;
  
    for (let f = Math.max(0, Math.floor(anomalyY - sampleRadius)); f < Math.min(frequencyBands, Math.ceil(anomalyY + sampleRadius)); f++) {
      for (let t = Math.max(0, Math.floor(anomalyX - sampleRadius)); t < Math.min(timeSlices, Math.ceil(anomalyX + sampleRadius)); t++) {
        const distance = Math.sqrt((t - anomalyX) ** 2 + (f - anomalyY) ** 2);
        if (distance > anomalyRadius && distance < sampleRadius) {
          localAvgIntensity += spectrogramData[f][t];
          localSamples++;
        }
      }
    }
    localAvgIntensity = localSamples > 0 ? localAvgIntensity / localSamples : 0.5;
  
    // Apply anomaly with enhanced contrast based on color scheme and local context
    for (let f = 0; f < frequencyBands; f++) {
      for (let t = 0; t < timeSlices; t++) {
        const distance = Math.sqrt((t - anomalyX) ** 2 + (f - anomalyY) ** 2);
        if (distance < anomalyRadius) {
          // Create subtle falloff that minimizes visible outer ring
          const normalizedDistance = distance / anomalyRadius;
          
          // Use a more aggressive falloff to reduce outer ring visibility
          // Square the distance to make the edge fade more quickly
          const squaredDistance = normalizedDistance * normalizedDistance;
          const smoothFactor = 0.5 * (1 + Math.cos(squaredDistance * Math.PI));
        
          // Reduce noise intensity to minimize visible boundaries
          const subtleNoise = (Math.random() - 0.5) * 0.06; // Much smaller noise
          const positionNoise = Math.sin(t * 0.3 + f * 0.7) * 0.02; // Reduced position noise
        
          // Only apply edge noise in the very outer edge (80%+) and make it much subtler
          const edgeNoise = normalizedDistance > 0.8 ? 
            (Math.random() - 0.5) * 0.08 * (normalizedDistance - 0.8) * 5 : 0;
        
          const factor = Math.max(0, Math.min(1, smoothFactor + subtleNoise + positionNoise + edgeNoise));
          const originalIntensity = spectrogramData[f][t];
        
          // Determine contrast strength based on color scheme
          let contrastMultiplier;
          if (spectrogramParams.colorScheme === 0) {
            // Blue-yellow-red: needs stronger contrast around 0.5 transition
            contrastMultiplier = originalIntensity > 0.4 && originalIntensity < 0.6 ? 0.8 : 0.6;
          } else if (spectrogramParams.colorScheme === 3) {
            // Monochrome: needs maximum contrast
            contrastMultiplier = 0.9;
          } else {
            // Purple-pink and green-cyan: moderate contrast
            contrastMultiplier = 0.7;
          }
        
          // Apply anomaly with GUARANTEED visible contrast
          // Use much stronger contrast values to ensure visibility across all color schemes
          if (anomalyType === 'bright') {
            // Force bright anomaly to be DRAMATICALLY bright - ensure visibility
            let targetIntensity;
            if (spectrogramParams.colorScheme === 0) {
              // Blue-yellow-red: force to very high intensity
              targetIntensity = 0.95;
            } else {
              // Other schemes: force to maximum brightness
              targetIntensity = 0.92;
            }
            // Use stronger blending to ensure visibility even at anomaly edges
            const strongFactor = Math.max(0.3, factor); // Minimum 30% anomaly strength
            spectrogramData[f][t] = Math.min(1, targetIntensity * strongFactor + originalIntensity * (1 - strongFactor));
            
          } else if (anomalyType === 'dark') {
            // Force dark anomaly to be DRAMATICALLY dark - fix intermittent invisibility
            let targetIntensity;
            if (spectrogramParams.colorScheme === 0) {
              // Blue-yellow-red: force to very low intensity
              targetIntensity = 0.05;
            } else {
              // Other schemes: force to very dark (especially for monochrome)
              targetIntensity = 0.08;
            }
            // Use stronger blending to ensure visibility even at anomaly edges
            const strongFactor = Math.max(0.3, factor); // Minimum 30% anomaly strength
            spectrogramData[f][t] = Math.max(0, targetIntensity * strongFactor + originalIntensity * (1 - strongFactor));
            
          } else { // 'shift'
            // Create dramatic intensity shift that's always visible
            if (originalIntensity < 0.5) {
              // If original is dark, make it bright
              spectrogramData[f][t] = Math.min(1, (0.8 + Math.random() * 0.2) * factor + originalIntensity * (1 - factor));
            } else {
              // If original is bright, make it dark
              spectrogramData[f][t] = Math.max(0, (0.1 + Math.random() * 0.1) * factor + originalIntensity * (1 - factor));
            }
          }
        }
      }
    }
    
    // Store anomaly info for detection
    currentAnomalySpot = { x: anomalyX, y: anomalyY, radius: anomalyRadius, type: anomalyType };
  }
  
  // Generate new spectrograph data
  function generateSpectrogramData() {
    const { frequencyBands, timeSlices } = spectrogramParams;
    spectrogramData = [];
    
    for (let f = 0; f < frequencyBands; f++) {
      spectrogramData[f] = [];
      for (let t = 0; t < timeSlices; t++) {
        let intensity = spectrogramParams.baseIntensity;
        
        // Add harmonic patterns
        const harmonicFactor = Math.sin((f / frequencyBands) * Math.PI * 4) * spectrogramParams.harmonicStrength;
        const timeFactor = Math.sin((t / timeSlices) * Math.PI * 2 + spectrogramParams.timeModulation * t) * 0.3;
        
        intensity += harmonicFactor + timeFactor;
        
        // Add noise
        intensity += (Math.random() - 0.5) * spectrogramParams.noiseLevel;
        
        // Clamp to valid range
        spectrogramData[f][t] = Math.max(0, Math.min(1, intensity));
      }
    }
    
    // Place intelligent anomaly after base data is ready
    placeIntelligentAnomaly();
  }
  
  // Draw spectrogram
  function drawSpectrogram() {
    if (!spectrogramData) return;
    
    // Use current canvas dimensions without resetting
    const canvasSize = { width: window.innerWidth, height: window.innerHeight };
    const { frequencyBands, timeSlices } = spectrogramParams;
    
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    const pixelWidth = canvasSize.width / timeSlices;
    const pixelHeight = canvasSize.height / frequencyBands;
    
    for (let f = 0; f < frequencyBands; f++) {
      for (let t = 0; t < timeSlices; t++) {
        const intensity = spectrogramData[f][t];
        
        // Color based on scheme
        let r, g, b;
        if (spectrogramParams.colorScheme === 0) {
          // Blue to yellow to red
          if (intensity < 0.5) {
            const factor = intensity * 2;
            r = 0;
            g = Math.floor(factor * 255);
            b = Math.floor((1 - factor * 0.5) * 255);
          } else {
            const factor = (intensity - 0.5) * 2;
            r = Math.floor(factor * 255);
            g = 255;
            b = 0;
          }
        } else if (spectrogramParams.colorScheme === 1) {
          // Purple to pink to white
          const mono = Math.floor(intensity * 255);
          r = Math.floor(mono * 0.8 + 50);
          g = Math.floor(mono * 0.6 + 30);
          b = Math.floor(mono * 0.9 + 80);
        } else if (spectrogramParams.colorScheme === 2) {
          // Green to cyan
          const mono = Math.floor(intensity * 255);
          r = Math.floor(mono * 0.3);
          g = Math.floor(mono * 0.9 + 50);
          b = Math.floor(mono * 0.7 + 30);
        } else {
          // Monochrome with tint
          const mono = Math.floor(intensity * 255);
          r = mono;
          g = mono;
          b = mono;
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          t * pixelWidth,
          (frequencyBands - f - 1) * pixelHeight,
          Math.ceil(pixelWidth),
          Math.ceil(pixelHeight)
        );
      }
    }
    
    // Draw debug overlay if enabled
    if (debugMode && currentAnomalySpot) {
      const canvasX = (currentAnomalySpot.x / timeSlices) * canvasSize.width;
      const canvasY = ((frequencyBands - currentAnomalySpot.y) / frequencyBands) * canvasSize.height;
      const canvasRadius = (currentAnomalySpot.radius / frequencyBands) * canvasSize.height;
      
      ctx.save();
      ctx.strokeStyle = '#ff00ff';
      ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, canvasRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw magnifying glass if active
    if (magnifierActive) {
      drawMagnifier();
    }
  }
  
  // Draw magnifying glass overlay
  function drawMagnifier() {
    if (!spectrogramData) return;
    
    const canvasSize = { width: window.innerWidth, height: window.innerHeight };
    const { frequencyBands, timeSlices } = spectrogramParams;
    
    // Calculate the area to magnify in data coordinates
    const centerDataX = (magnifierX / canvasSize.width) * timeSlices;
    const centerDataY = ((canvasSize.height - magnifierY) / canvasSize.height) * frequencyBands;
    
    // Calculate the size of the area to sample (smaller area = more zoom)
    const sampleRadius = magnifierRadius / magnificationFactor;
    const sampleRadiusX = (sampleRadius / canvasSize.width) * timeSlices;
    const sampleRadiusY = (sampleRadius / canvasSize.height) * frequencyBands;
    
    ctx.save();
    
    // Create circular clipping path for magnifier
    ctx.beginPath();
    ctx.arc(magnifierX, magnifierY, magnifierRadius, 0, 2 * Math.PI);
    ctx.clip();
    
    // Draw magnified content
    const pixelWidth = (magnifierRadius * 2) / (sampleRadiusX * 2);
    const pixelHeight = (magnifierRadius * 2) / (sampleRadiusY * 2);
    
    for (let f = 0; f < frequencyBands; f++) {
      for (let t = 0; t < timeSlices; t++) {
        // Check if this pixel is in the sample area
        const dataDistanceX = Math.abs(t - centerDataX);
        const dataDistanceY = Math.abs(f - centerDataY);
        
        if (dataDistanceX <= sampleRadiusX && dataDistanceY <= sampleRadiusY) {
          const intensity = spectrogramData[f][t];
          
          // Calculate color based on intensity and color scheme
          let r, g, b;
          if (spectrogramParams.colorScheme === 0) {
            // Blue to yellow to red
            if (intensity < 0.5) {
              const factor = intensity * 2;
              r = 0;
              g = Math.floor(factor * 255);
              b = Math.floor((1 - factor) * 255);
            } else {
              const factor = (intensity - 0.5) * 2;
              r = Math.floor(factor * 255);
              g = 255;
              b = 0;
            }
          } else if (spectrogramParams.colorScheme === 1) {
            // Purple to pink to white
            const mono = Math.floor(intensity * 255);
            r = Math.floor(mono * 0.8 + 50);
            g = Math.floor(mono * 0.6 + 30);
            b = Math.floor(mono * 0.9 + 80);
          } else if (spectrogramParams.colorScheme === 2) {
            // Green to cyan
            const mono = Math.floor(intensity * 255);
            r = Math.floor(mono * 0.3);
            g = Math.floor(mono * 0.9 + 50);
            b = Math.floor(mono * 0.7 + 30);
          } else {
            // Monochrome with tint
            const mono = Math.floor(intensity * 255);
            r = mono;
            g = mono;
            b = mono;
          }
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          
          // Calculate position in magnifier
          const relativeX = (t - centerDataX + sampleRadiusX) / (sampleRadiusX * 2);
          const relativeY = (f - centerDataY + sampleRadiusY) / (sampleRadiusY * 2);
          
          const magnifierPixelX = magnifierX - magnifierRadius + (relativeX * magnifierRadius * 2);
          const magnifierPixelY = magnifierY - magnifierRadius + ((1 - relativeY) * magnifierRadius * 2);
          
          ctx.fillRect(
            magnifierPixelX,
            magnifierPixelY,
            Math.ceil(pixelWidth),
            Math.ceil(pixelHeight)
          );
        }
      }
    }
    
    ctx.restore();
    
    // Draw magnifier border and handle
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3;
    
    // Outer border
    ctx.beginPath();
    ctx.arc(magnifierX, magnifierY, magnifierRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner border for depth
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(magnifierX, magnifierY, magnifierRadius - 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Magnifier handle
    const handleLength = 40;
    const handleAngle = Math.PI / 4; // 45 degrees
    const handleStartX = magnifierX + Math.cos(handleAngle) * magnifierRadius;
    const handleStartY = magnifierY + Math.sin(handleAngle) * magnifierRadius;
    const handleEndX = handleStartX + Math.cos(handleAngle) * handleLength;
    const handleEndY = handleStartY + Math.sin(handleAngle) * handleLength;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(handleStartX, handleStartY);
    ctx.lineTo(handleEndX, handleEndY);
    ctx.stroke();
    
    // Handle grip
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(handleStartX, handleStartY);
    ctx.lineTo(handleEndX, handleEndY);
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Generate new spectrogram
  function generateNewSpectrogram() {
    // Clear any pending magnifier timer and reset magnifier state
    if (magnifierTimer) {
      clearTimeout(magnifierTimer);
      magnifierTimer = null;
    }
    magnifierActive = false;
    isDragging = false;
    touchStartTime = 0;
    
    // Randomize parameters
    spectrogramParams = {
      frequencyBands: 256,
      timeSlices: 512,
      baseIntensity: 0.2 + Math.random() * 0.4,
      noiseLevel: 0.05 + Math.random() * 0.15,
      harmonicStrength: 0.3 + Math.random() * 0.5,
      colorScheme: Math.floor(Math.random() * 4),
      patternType: Math.floor(Math.random() * 3),
      grainSize: 0.5 + Math.random() * 2.0,
      frequencyFocus: Math.random() * 256,
      timeModulation: 0.005 + Math.random() * 0.02
    };
    
    generateSpectrogramData();
    drawSpectrogram();
    
    generationCount++;
    document.getElementById('generationCounter').textContent = `Generation: ${generationCount}`;
  }
  
  // Direct interaction - no magnification needed
  
  function checkAnomalyFound(x, y) {
    if (!currentAnomalySpot) return false;
    
    // Use current canvas dimensions without resetting
    const canvasSize = { width: window.innerWidth, height: window.innerHeight };
    const { frequencyBands, timeSlices } = spectrogramParams;
    
    const dataX = (x / canvasSize.width) * timeSlices;
    const dataY = ((canvasSize.height - y) / canvasSize.height) * frequencyBands;
    
    const distance = Math.sqrt((dataX - currentAnomalySpot.x) ** 2 + (dataY - currentAnomalySpot.y) ** 2);
    return distance < currentAnomalySpot.radius;
  }
  
  // Touch event handlers with gesture detection
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Record touch start details
    touchStartTime = Date.now();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    magnifierX = touchStartX;
    magnifierY = touchStartY;
    isDragging = false;
    
    // Set a timer to activate magnifier if held long enough
    magnifierTimer = setTimeout(() => {
      if (!isDragging && Date.now() - touchStartTime >= HOLD_THRESHOLD) {
        magnifierActive = true;
        drawSpectrogram(); // Redraw with magnifier
      }
    }, HOLD_THRESHOLD);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    // Check if movement exceeds drag threshold
    const deltaX = Math.abs(currentX - touchStartX);
    const deltaY = Math.abs(currentY - touchStartY);
    
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      isDragging = true;
      
      // Activate magnifier immediately on drag
      if (!magnifierActive) {
        magnifierActive = true;
      }
      
      // Update magnifier position
      magnifierX = currentX;
      magnifierY = currentY;
      drawSpectrogram(); // Redraw with updated magnifier position
    }
  });
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchDuration = Date.now() - touchStartTime;
    
    // Clear the magnifier timer to prevent delayed activation
    if (magnifierTimer) {
      clearTimeout(magnifierTimer);
      magnifierTimer = null;
    }
    
    if (magnifierActive) {
      // Magnifier was active - just hide it
      magnifierActive = false;
      drawSpectrogram(); // Redraw without magnifier
    } else if (!isDragging && touchDuration < HOLD_THRESHOLD) {
      // Quick tap - check for anomaly detection
      if (checkAnomalyFound(touchStartX, touchStartY)) {
        resultMsg.textContent = '🎉 Anomaly found! Generating new spectrograph...';
        resultMsg.style.background = 'rgba(0,150,0,0.8)';
        
        setTimeout(() => {
          generateNewSpectrogram();
          resultMsg.textContent = '';
          resultMsg.style.background = 'rgba(0,0,0,0.3)';
        }, 1200);
      } else {
        resultMsg.textContent = '🔍 Keep searching for the anomaly!';
        resultMsg.style.background = 'rgba(150,0,0,0.6)';
        
        setTimeout(() => {
          resultMsg.textContent = '';
          resultMsg.style.background = 'rgba(0,0,0,0.3)';
        }, 2000);
      }
    }
    
    // Reset gesture detection variables
    isDragging = false;
    touchStartTime = 0;
  });
  

  
  // Mouse event handlers for desktop testing (exploration only)
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    magnifierX = e.clientX - rect.left;
    magnifierY = e.clientY - rect.top;
    magnifierActive = true;
    drawSpectrogram(); // Redraw with magnifier
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (magnifierActive) {
      const rect = canvas.getBoundingClientRect();
      magnifierX = e.clientX - rect.left;
      magnifierY = e.clientY - rect.top;
      drawSpectrogram(); // Redraw with updated magnifier position
    }
  });
  
  canvas.addEventListener('mouseup', (e) => {
    if (magnifierActive) {
      // Magnifier disappears - no anomaly detection here
      magnifierActive = false;
      drawSpectrogram(); // Redraw without magnifier
    }
  });
  
  // Button event handlers
  document.getElementById('generateBtn').addEventListener('click', generateNewSpectrogram);
  
  document.getElementById('debugToggle').addEventListener('click', () => {
    debugMode = !debugMode;
    document.getElementById('debugToggle').textContent = debugMode ? 'Hide Anomaly' : 'Show Anomaly';
    drawSpectrogram();
  });
  
  document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('instructionOverlay').style.display = 'none';
    // Initialize canvas properly once
    setupCanvas();
    generateNewSpectrogram();
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    setupCanvas();
    drawSpectrogram();
  });
}
