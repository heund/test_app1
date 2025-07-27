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
    <div id='instructionOverlay' class='instruction-overlay' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(2px);'>
      <div class='overlay-content' style='text-align:center;color:#fff;max-width:500px;opacity:0;transform:translateY(20px);transition:all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);'>
        <h1 class='popup-title' style='font-size:3rem;margin-bottom:2rem;font-weight:700;background:linear-gradient(135deg,#ffffff,#cccccc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.02em;line-height:1.1;opacity:0;transform:translateY(30px);transition:all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);'>Generative Spectrograph Mode</h1>
        <p class='popup-subtitle' style='font-size:1.1rem;line-height:1.6;margin-bottom:1rem;color:rgba(255,255,255,0.8);font-weight:400;opacity:0;transform:translateY(20px);transition:all 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);transition-delay:0.3s;'>Find the anomaly in the procedurally generated spectrograph.</p>
        <p class='popup-description' style='font-size:1rem;line-height:1.6;margin-bottom:3rem;color:rgba(255,255,255,0.6);font-weight:400;opacity:0;transform:translateY(20px);transition:all 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);transition-delay:0.5s;'>Use the refresh tool to create new spectrograms with different anomalies.</p>
        <button id='startBtn' class='glass-start-button' style='background:rgba(255,255,255,0.08);backdrop-filter:blur(15px);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px 32px;font-size:1.1rem;font-weight:500;cursor:pointer;transition:all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);box-shadow:0 8px 32px rgba(0,0,0,0.3);opacity:0;transform:translateY(20px);transition-delay:0.7s;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'>Start Exploring</button>
      </div>
    </div>
  `;
  
  // Append overlays to body so they don't interfere with navigation
  document.body.appendChild(interactiveOverlays);
  
  // Store reference for cleanup
  window.currentInteractiveOverlays = interactiveOverlays;
  
  // Generative spectrograph state
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
  const magnifierRadius = 120; // Radius of the magnifying glass (increased for wider coverage)
  const magnificationFactor = 2.5; // How much to zoom in
  
  // Display offset for magnifier circle (to avoid finger obstruction)
  const magnifierDisplayOffsetX = 60; // Offset right
  const magnifierDisplayOffsetY = -60; // Offset up
  
  // Gesture detection variables
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let magnifierTimer = null; // Timer for delayed magnifier activation
  const HOLD_THRESHOLD = 200; // ms to distinguish tap from hold
  const DRAG_THRESHOLD = 10; // pixels to distinguish tap from drag
  
  // Advanced color control system
  const colorControl = {
    // Base color values for spectrograph (0-1 range)
    spectrograph: {
      hue: 0.6,        // Blue-ish starting point
      saturation: 0.8,
      brightness: 0.9
    },
    // Anomaly color offset from spectrograph (maintains difference)
    anomaly: {
      hueOffset: 0.3,     // Different hue offset
      saturationOffset: -0.2,
      brightnessOffset: 0.1
    },
    // Animation and interaction state
    isDialActive: false,
    currentRotation: 0,
    targetRotation: 0,
    animationSpeed: 0.1,
    isDragging: false,
    lastMouseAngle: 0
  };
  
  // Sound Effects System
  const soundEffects = {
    clickSound: null,
    correctSound: null,
    incorrectSound: null,
    lastRotaryTime: 0,
    rotaryVelocity: 0,
    minClickInterval: 50, // Minimum ms between clicks for velocity control
  
    // Initialize sound system
    init() {
      try {
        this.clickSound = new Audio('click.wav');
        this.correctSound = new Audio('correct.wav');
        this.incorrectSound = new Audio('incorrect.wav');
        
        // Configure audio properties for responsiveness
        this.clickSound.preload = 'auto';
        this.correctSound.preload = 'auto';
        this.incorrectSound.preload = 'auto';
        
        // Set volumes
        this.clickSound.volume = 0.6;
        this.correctSound.volume = 0.8;
        this.incorrectSound.volume = 0.7;
        
        console.log('Sound effects initialized successfully');
      } catch (error) {
        console.warn('Sound effects could not be initialized:', error);
      }
    },
  
    // Play velocity-sensitive click sound for rotary movement
    playRotaryClick(velocity = 1) {
      if (!this.clickSound) return;
      
      const now = Date.now();
      const timeSinceLastClick = now - this.lastRotaryTime;
      
      // Calculate dynamic interval based on velocity (faster = more frequent)
      const dynamicInterval = Math.max(this.minClickInterval, this.minClickInterval * (2 - velocity));
      
      if (timeSinceLastClick >= dynamicInterval) {
        try {
          // Reset and play for immediate response
          this.clickSound.currentTime = 0;
          this.clickSound.playbackRate = 0.8 + (velocity * 0.4); // 0.8x to 1.2x speed based on velocity
          this.clickSound.play().catch(e => console.warn('Click sound play failed:', e));
          this.lastRotaryTime = now;
        } catch (error) {
          console.warn('Error playing click sound:', error);
        }
      }
    },
  
    // Play correct anomaly detection sound
    playCorrect() {
      if (!this.correctSound) return;
      
      try {
        this.correctSound.currentTime = 0;
        this.correctSound.play().catch(e => console.warn('Correct sound play failed:', e));
      } catch (error) {
        console.warn('Error playing correct sound:', error);
      }
    },
  
    // Play incorrect anomaly detection sound
    playIncorrect() {
      if (!this.incorrectSound) return;
      
      try {
        this.incorrectSound.currentTime = 0;
        this.incorrectSound.play().catch(e => console.warn('Incorrect sound play failed:', e));
      } catch (error) {
        console.warn('Error playing incorrect sound:', error);
      }
    }
  };
  
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
        
        // Advanced color control system - smooth HSB-based colors
        const baseHue = colorControl.spectrograph.hue;
        const baseSaturation = colorControl.spectrograph.saturation;
        const baseBrightness = colorControl.spectrograph.brightness;
        
        // Apply intensity-based variations while maintaining base color
        const intensityHue = (baseHue + (intensity * 0.1)) % 1.0; // Slight hue shift with intensity
        const intensitySaturation = Math.max(0, Math.min(1, baseSaturation * (0.5 + intensity * 0.5)));
        const intensityBrightness = Math.max(0, Math.min(1, baseBrightness * intensity));
        
        // Convert HSB to RGB
        const rgb = hsbToRgb(intensityHue, intensitySaturation, intensityBrightness);
        let r = rgb.r;
        let g = rgb.g;
        let b = rgb.b;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          t * pixelWidth,
          (frequencyBands - f - 1) * pixelHeight,
          Math.ceil(pixelWidth),
          Math.ceil(pixelHeight)
        );
      }
    }
    
    // Draw sophisticated iOS-style debug overlay if enabled
    if (debugMode && currentAnomalySpot) {
      const canvasX = (currentAnomalySpot.x / timeSlices) * canvasSize.width;
      const canvasY = ((frequencyBands - currentAnomalySpot.y) / frequencyBands) * canvasSize.height;
      const canvasRadius = (currentAnomalySpot.radius / frequencyBands) * canvasSize.height;
      
      // Sophisticated animation timing
      const time = Date.now() * 0.0008; // Smooth, elegant timing
      const breathe = 1 + Math.sin(time * 0.7) * 0.03; // Very subtle breathing
      const rotation = time * 0.3; // Gentle rotation
      const pulse = 0.8 + Math.sin(time * 1.2) * 0.2; // Opacity pulse
      
      ctx.save();
      
      // Glassmorphism background circle - subtle depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, canvasRadius * 1.1, 0, 2 * Math.PI);
      ctx.fill();
      
      // Clear shadow for precision elements
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Segmented arc ring - iOS Activity Ring style
      const segments = 8; // Number of arc segments
      const segmentAngle = (2 * Math.PI) / segments;
      const gapAngle = segmentAngle * 0.15; // Gap between segments
      const arcAngle = segmentAngle - gapAngle;
      
      ctx.translate(canvasX, canvasY);
      ctx.rotate(rotation);
      
      // Calculate anomaly color with offset from spectrograph (once per anomaly)
      const anomalyHue = (colorControl.spectrograph.hue + colorControl.anomaly.hueOffset) % 1.0;
      const anomalySaturation = Math.max(0, Math.min(1, colorControl.spectrograph.saturation + colorControl.anomaly.saturationOffset));
      const anomalyBrightness = Math.max(0, Math.min(1, colorControl.spectrograph.brightness + colorControl.anomaly.brightnessOffset));
      const anomalyRgb = hsbToRgb(anomalyHue, anomalySaturation, anomalyBrightness);
      
      // Draw segmented arcs with gradient-like opacity variation
      for (let i = 0; i < segments; i++) {
        const startAngle = i * segmentAngle;
        const endAngle = startAngle + arcAngle;
        
        // Create gradient-like opacity effect
        const segmentProgress = (i + (rotation / segmentAngle)) % segments;
        const opacity = 0.3 + (Math.sin(segmentProgress * Math.PI / segments) * 0.6) * pulse;
        
        ctx.strokeStyle = `rgba(${anomalyRgb.r}, ${anomalyRgb.g}, ${anomalyRgb.b}, ${opacity})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round'; // Rounded ends for elegance
        
        ctx.beginPath();
        ctx.arc(0, 0, canvasRadius * breathe, startAngle, endAngle);
        ctx.stroke();
      }
      
      // Inner concentric ring - thinner, more subtle
      ctx.strokeStyle = `rgba(${anomalyRgb.r}, ${anomalyRgb.g}, ${anomalyRgb.b}, ${0.4 * pulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]); // Elegant dashed pattern
      ctx.beginPath();
      ctx.arc(0, 0, canvasRadius * 0.7 * breathe, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
      
      // Reset transformations for center elements
      ctx.rotate(-rotation);
      
      // Precision center crosshair - minimal and clean
      ctx.strokeStyle = `rgba(${anomalyRgb.r}, ${anomalyRgb.g}, ${anomalyRgb.b}, ${0.8 * pulse})`;
      ctx.lineWidth = 1;
      const crossSize = 4;
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(-crossSize, 0);
      ctx.lineTo(crossSize, 0);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(0, -crossSize);
      ctx.lineTo(0, crossSize);
      ctx.stroke();
      
      // Center dot - bright and precise
      ctx.fillStyle = `rgba(${anomalyRgb.r}, ${anomalyRgb.g}, ${anomalyRgb.b}, ${0.9 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Optional: Add subtle corner brackets (iOS-style focus indicator)
      const bracketSize = canvasRadius * 0.3;
      const bracketOffset = canvasRadius * 1.1;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      
      // Top-left bracket (using transformed coordinates - origin is now at anomaly center)
      ctx.beginPath();
      ctx.moveTo(-bracketOffset, -bracketOffset + bracketSize);
      ctx.lineTo(-bracketOffset, -bracketOffset);
      ctx.lineTo(-bracketOffset + bracketSize, -bracketOffset);
      ctx.stroke();
      
      // Top-right bracket
      ctx.beginPath();
      ctx.moveTo(bracketOffset - bracketSize, -bracketOffset);
      ctx.lineTo(bracketOffset, -bracketOffset);
      ctx.lineTo(bracketOffset, -bracketOffset + bracketSize);
      ctx.stroke();
      
      // Bottom-left bracket
      ctx.beginPath();
      ctx.moveTo(-bracketOffset, bracketOffset - bracketSize);
      ctx.lineTo(-bracketOffset, bracketOffset);
      ctx.lineTo(-bracketOffset + bracketSize, bracketOffset);
      ctx.stroke();
      
      // Bottom-right bracket
      ctx.beginPath();
      ctx.moveTo(bracketOffset - bracketSize, bracketOffset);
      ctx.lineTo(bracketOffset, bracketOffset);
      ctx.lineTo(bracketOffset, bracketOffset - bracketSize);
      ctx.stroke();
      
      ctx.restore();
      
      // Very subtle animation - only when needed
      if (breathe !== 1) {
        requestAnimationFrame(() => drawSpectrogram());
      }
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
    
    // Calculate display position (offset from touch position for visibility)
    const displayX = magnifierX + magnifierDisplayOffsetX;
    const displayY = magnifierY + magnifierDisplayOffsetY;
    
    ctx.save();
    
    // Create circular clipping path for magnifier (using display position)
    ctx.beginPath();
    ctx.arc(displayX, displayY, magnifierRadius, 0, 2 * Math.PI);
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
          
          // Use the same advanced color control system as main spectrogram
          const baseHue = colorControl.spectrograph.hue;
          const baseSaturation = colorControl.spectrograph.saturation;
          const baseBrightness = colorControl.spectrograph.brightness;
          
          // Apply intensity-based variations while maintaining base color
          const intensityHue = (baseHue + (intensity * 0.1)) % 1.0; // Slight hue shift with intensity
          const intensitySaturation = Math.max(0, Math.min(1, baseSaturation * (0.5 + intensity * 0.5)));
          const intensityBrightness = Math.max(0, Math.min(1, baseBrightness * intensity));
          
          // Convert HSB to RGB using the same function as main spectrogram
          const rgb = hsbToRgb(intensityHue, intensitySaturation, intensityBrightness);
          const r = rgb.r;
          const g = rgb.g;
          const b = rgb.b;
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          
          // Calculate position in magnifier
          const relativeX = (t - centerDataX + sampleRadiusX) / (sampleRadiusX * 2);
          const relativeY = (f - centerDataY + sampleRadiusY) / (sampleRadiusY * 2);
          
          const magnifierPixelX = displayX - magnifierRadius + (relativeX * magnifierRadius * 2);
          const magnifierPixelY = displayY - magnifierRadius + ((1 - relativeY) * magnifierRadius * 2);
          
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
    
    // Pure magnified content - no borders or graphics
    ctx.restore();
  }
  
  // Generate new spectrogram
  function generateNewSpectrogram() {
    // Clear any pending magnifier timer and reset magnifier state
    if (magnifierTimer) {
      clearTimeout(magnifierTimer);
      magnifierTimer = null;
    }
    
    generateSpectrogramData();
    drawSpectrogram();
  }
  
  // Color control system functions
  function toggleColorControlDial() {
    colorControl.isDialActive = !colorControl.isDialActive;
    
    if (colorControl.isDialActive) {
      showColorControlDial();
    } else {
      hideColorControlDial();
    }
  }
  
  function showColorControlDial() {
    // Add visual dial overlay to the wheel navigation
    const wheelContainer = document.querySelector('.wheel-container');
    if (!wheelContainer) return;
    
    // Create dial overlay
    let dialOverlay = document.getElementById('colorDialOverlay');
    if (!dialOverlay) {
      dialOverlay = document.createElement('div');
      dialOverlay.id = 'colorDialOverlay';
      dialOverlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        pointer-events: auto;
        z-index: 15;
      `;
      wheelContainer.appendChild(dialOverlay);
    }
    
    // Draw the rotary dial
    drawColorDial(dialOverlay);
    
    // Add interaction handlers
    setupDialInteraction(dialOverlay);
  }
  
  function hideColorControlDial() {
    const dialOverlay = document.getElementById('colorDialOverlay');
    if (dialOverlay) {
      dialOverlay.remove();
    }
  }
  
  function drawColorDial(container) {
    // Create canvas for the dial
    let dialCanvas = container.querySelector('canvas');
    if (!dialCanvas) {
      dialCanvas = document.createElement('canvas');
      dialCanvas.width = 200;
      dialCanvas.height = 200;
      dialCanvas.style.cssText = `
        width: 100%;
        height: 100%;
        cursor: grab;
      `;
      container.appendChild(dialCanvas);
    }
    
    const dialCtx = dialCanvas.getContext('2d');
    const centerX = 100;
    const centerY = 100;
    const radius = 90;
    
    // Clear canvas
    dialCtx.clearRect(0, 0, 200, 200);
    
    // Draw outer ring
    dialCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    dialCtx.lineWidth = 2;
    dialCtx.beginPath();
    dialCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    dialCtx.stroke();
    
    // Draw tick marks around the edge
    const tickCount = 24;
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * 2 * Math.PI;
      const tickLength = i % 6 === 0 ? 12 : 6; // Longer ticks every 6th mark
      const innerRadius = radius - tickLength;
      
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;
      
      dialCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      dialCtx.lineWidth = i % 6 === 0 ? 2 : 1;
      dialCtx.beginPath();
      dialCtx.moveTo(x1, y1);
      dialCtx.lineTo(x2, y2);
      dialCtx.stroke();
    }
    
    // Draw current position indicator
    const currentAngle = colorControl.currentRotation;
    const indicatorX = centerX + Math.cos(currentAngle) * (radius - 15);
    const indicatorY = centerY + Math.sin(currentAngle) * (radius - 15);
    
    dialCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    dialCtx.beginPath();
    dialCtx.arc(indicatorX, indicatorY, 4, 0, 2 * Math.PI);
    dialCtx.fill();
    
    // Draw center dot
    dialCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    dialCtx.beginPath();
    dialCtx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    dialCtx.fill();
  }
  
  function setupDialInteraction(container) {
    const dialCanvas = container.querySelector('canvas');
    if (!dialCanvas) return;
    
    function getMouseAngle(event) {
      const rect = dialCanvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = event.clientX - centerX;
      const mouseY = event.clientY - centerY;
      return Math.atan2(mouseY, mouseX);
    }
    
    function updateRotation(angle) {
      colorControl.currentRotation = angle;
      
      // Apply color changes based on rotation
      const normalizedRotation = (angle + Math.PI) / (2 * Math.PI); // 0-1 range
      applyColorFromRotation(normalizedRotation);
      
      // Redraw dial and spectrogram
      drawColorDial(container);
      drawSpectrogram();
    }
    
    // Mouse events
    dialCanvas.addEventListener('mousedown', (e) => {
      colorControl.isDragging = true;
      colorControl.lastMouseAngle = getMouseAngle(e);
      dialCanvas.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!colorControl.isDragging) return;
      
      const currentAngle = getMouseAngle(e);
      updateRotation(currentAngle);
      e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
      if (colorControl.isDragging) {
        colorControl.isDragging = false;
        dialCanvas.style.cursor = 'grab';
      }
    });
    
    // Touch events for mobile
    dialCanvas.addEventListener('touchstart', (e) => {
      colorControl.isDragging = true;
      const touch = e.touches[0];
      colorControl.lastMouseAngle = getMouseAngle(touch);
      e.preventDefault();
    });
    
    dialCanvas.addEventListener('touchmove', (e) => {
      if (!colorControl.isDragging) return;
      
      const touch = e.touches[0];
      const currentAngle = getMouseAngle(touch);
      updateRotation(currentAngle);
      e.preventDefault();
    });
    
    dialCanvas.addEventListener('touchend', () => {
      colorControl.isDragging = false;
    });
  }
  
  function applyColorFromRotation(normalizedRotation) {
    // Smooth color transitions based on rotation (0-1 range)
    const hueShift = normalizedRotation * 0.5; // Max 0.5 hue shift
    
    // Apply gradual changes to spectrograph colors
    colorControl.spectrograph.hue = (0.6 + hueShift) % 1.0;
    colorControl.spectrograph.saturation = 0.7 + (normalizedRotation * 0.3);
    colorControl.spectrograph.brightness = 0.8 + (normalizedRotation * 0.2);
  }
  
  // Convert HSB to RGB
  function hsbToRgb(h, s, b) {
    const c = b * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = b - c;
    
    let r, g, blue;
    
    if (h < 1/6) {
      r = c; g = x; blue = 0;
    } else if (h < 2/6) {
      r = x; g = c; blue = 0;
    } else if (h < 3/6) {
      r = 0; g = c; blue = x;
    } else if (h < 4/6) {
      r = 0; g = x; blue = c;
    } else if (h < 5/6) {
      r = x; g = 0; blue = c;
    } else {
      r = c; g = 0; blue = x;
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((blue + m) * 255)
    };
  }
  
  // Generate new spectrogram
  function generateNewSpectrogram() {
    // Reset debug mode when generating new image
    debugMode = false;
    
    // Generate new parameters for variety - including color scheme rotation
    const newColorScheme = Math.floor(Math.random() * 4);
    
    spectrogramParams.baseIntensity = 0.2 + Math.random() * 0.4;
    spectrogramParams.noiseLevel = 0.1 + Math.random() * 0.3;
    spectrogramParams.frequencyShift = Math.random() * 0.2 - 0.1;
    spectrogramParams.timeWarp = 0.8 + Math.random() * 0.4;
    spectrogramParams.colorScheme = newColorScheme;
    
    // generateSpectrogramData() already calls placeIntelligentAnomaly(), so no need to call it again
    generateSpectrogramData();
    drawSpectrogram();
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
        soundEffects.playCorrect();
        // showSimpleIcon('✓'); // Clean white checkmark - hidden for now
        setTimeout(() => {
          generateNewSpectrogram();
        }, 600);
      } else {
        soundEffects.playIncorrect();
        // showSimpleIcon('✕'); // Clean white X - hidden for now
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
  
  // Old generate and debug buttons removed - now using wheel tools
  
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
  
  // Simple white icon feedback - top center, no background
  function showSimpleIcon(icon) {
    // Create or get the simple icon element
    let iconElement = document.getElementById('simpleIcon');
    if (!iconElement) {
      iconElement = document.createElement('div');
      iconElement.id = 'simpleIcon';
      iconElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        font-size: 48px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: none;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      document.body.appendChild(iconElement);
    }
    
    // Show icon with elegant animation
    iconElement.textContent = icon;
    iconElement.style.opacity = '1';
    iconElement.style.transform = 'translate(-50%, -50%) scale(1)';
    
    // Hide after short duration
    setTimeout(() => {
      iconElement.style.opacity = '0';
      iconElement.style.transform = 'translate(-50%, -50%) scale(0.8)';
    }, 1200);
  }

  // Floating Wheel Navigation Functionality
  function initializeWheelNavigation() {
    const wheelContainer = document.getElementById('wheelNavContainer');
    const wheelTrigger = document.getElementById('wheelNavTrigger');
    const wheelContent = document.getElementById('wheelNavContent');
    const wheelItems = document.querySelectorAll('.wheel-item');
    
    if (!wheelContainer || !wheelTrigger || !wheelContent) {
      console.log('Wheel navigation elements not found, skipping initialization');
      return;
    }

    // Show wheel navigation in interactive mode
    document.body.classList.add('interactive-mode');
    
    let isWheelExpanded = false;
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 50;
    const SWIPE_TIME_THRESHOLD = 300;
    
    // Current active tool
    let activeTool = null;
    
    // Rotary control state
    let isRotaryMode = false;
    let rotaryAngle = 0;
    let isDragging = false;
    let wheelBackground = null;
    let ticksCanvas = null;
    let rotaryIndicator = null;
    let positionDot = null;
    
    // Initialize rotating wheel structure
    function initializeRotatingWheel() {
      const wheelContent = document.getElementById('wheelNavContent');
      const wheelContainer = document.querySelector('.wheel-container');
      
      if (!wheelContent || !wheelContainer) return;
      
      // Create rotating background
      wheelBackground = document.createElement('div');
      wheelBackground.className = 'wheel-background';
      wheelBackground.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 1;
      `;
      
      // Create ticks canvas
      ticksCanvas = document.createElement('canvas');
      ticksCanvas.width = 350;
      ticksCanvas.height = 350;
      ticksCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      `;
      
      // Create fixed position indicator
      rotaryIndicator = document.createElement('div');
      rotaryIndicator.className = 'rotary-indicator';
      rotaryIndicator.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
        pointer-events: none;
        z-index: 25;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      
      // Get position dot reference
      positionDot = wheelContainer.querySelector('.wheel-container::after') || 
                    wheelContainer.querySelector('.position-dot');
      
      // Insert background before container
      wheelBackground.appendChild(ticksCanvas);
      wheelContent.insertBefore(wheelBackground, wheelContainer);
      wheelContent.appendChild(rotaryIndicator);
      
      // Ensure container has proper z-index
      wheelContainer.style.zIndex = '10';
      wheelContainer.style.position = 'relative';
      
      // Draw ticks
      drawTicks();
      
      // Setup rotary interaction after background is created
      setTimeout(() => setupRotaryInteraction(), 0);
    }
    
    // Draw ticks on canvas
    function drawTicks() {
      if (!ticksCanvas) return;
      
      const ctx = ticksCanvas.getContext('2d');
      const centerX = 175;
      const centerY = 175;
      const radius = 165;
      const tickCount = 16;
      
      ctx.clearRect(0, 0, 350, 350);
      
      for (let i = 0; i < tickCount; i++) {
        const angle = (i * 360 / tickCount) * Math.PI / 180;
        const isMajor = i % 2 === 0;
        
        const innerRadius = isMajor ? radius - 12 : radius - 8;
        const outerRadius = radius;
        
        const x1 = centerX + Math.cos(angle - Math.PI/2) * innerRadius;
        const y1 = centerY + Math.sin(angle - Math.PI/2) * innerRadius;
        const x2 = centerX + Math.cos(angle - Math.PI/2) * outerRadius;
        const y2 = centerY + Math.sin(angle - Math.PI/2) * outerRadius;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${isMajor ? 0.4 : 0.25})`;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }
    }
    
    // Highlight ticks during rotary mode
    function highlightTicks(highlight) {
      if (!ticksCanvas) return;
      
      const ctx = ticksCanvas.getContext('2d');
      const centerX = 175;
      const centerY = 175;
      const radius = 165;
      const tickCount = 16;
      
      ctx.clearRect(0, 0, 350, 350);
      
      const baseOpacity = highlight ? 0.6 : 0.4;
      const minorOpacity = highlight ? 0.4 : 0.25;
      
      for (let i = 0; i < tickCount; i++) {
        const angle = (i * 360 / tickCount) * Math.PI / 180;
        const isMajor = i % 2 === 0;
        
        const innerRadius = isMajor ? radius - 12 : radius - 8;
        const outerRadius = radius;
        
        const x1 = centerX + Math.cos(angle - Math.PI/2) * innerRadius;
        const y1 = centerY + Math.sin(angle - Math.PI/2) * innerRadius;
        const x2 = centerX + Math.cos(angle - Math.PI/2) * outerRadius;
        const y2 = centerY + Math.sin(angle - Math.PI/2) * outerRadius;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${isMajor ? baseOpacity : minorOpacity})`;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }
    }
    
    // Update wheel rotation
    function updateWheelRotation() {
      if (!wheelBackground) return;
      wheelBackground.style.transform = `rotate(${rotaryAngle}deg)`;
    }
    
    // Setup rotary interaction
    function setupRotaryInteraction() {
      if (!wheelContent) return;
      
      let startAngle = 0;
      
      function getEventCoords(event) {
        if (event.touches && event.touches[0]) {
          return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
      }
      
      function handleRotaryStart(event) {
        if (!isRotaryMode) return;
        
        // Check if click is on an icon or interactive element
        const target = event.target;
        const isIcon = target.closest('.wheel-item') || target.closest('.wheel-center');
        if (isIcon) {
          // Let icon clicks work normally
          return;
        }
        
        // Don't prevent default immediately - let icon clicks work
        // Only set dragging flag, don't prevent default yet
        isDragging = false; // Start as false, only set true on actual movement
        
        const coords = getEventCoords(event);
        const rect = wheelContent.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = coords.x - centerX;
        const deltaY = coords.y - centerY;
        startAngle = Math.atan2(deltaX, -deltaY) * 180 / Math.PI;
      }
      
      function handleRotaryDrag(event) {
        if (!isRotaryMode) return;
        
        const coords = getEventCoords(event);
        const rect = wheelContent.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = coords.x - centerX;
        const deltaY = coords.y - centerY;
        
        // Check if there's significant movement to start dragging
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (!isDragging && distance > 10) {
          // Only start dragging if moved more than 10px from start
          isDragging = true;
          event.preventDefault();
        }
        
        if (!isDragging) return;
        
        event.preventDefault();
        
        let angle = Math.atan2(deltaX, -deltaY) * 180 / Math.PI;
        angle = (angle + 360) % 360;
        
        // Calculate velocity for sound effects
        const previousAngle = rotaryAngle;
        const angleDelta = Math.abs(angle - previousAngle);
        // Handle angle wraparound (e.g., 359° to 1°)
        const normalizedDelta = Math.min(angleDelta, 360 - angleDelta);
        const velocity = Math.min(normalizedDelta / 15, 1.5); // Normalize to 0-1.5 range
        
        rotaryAngle = angle;
        updateWheelRotation();
        
        // Convert rotary angle (0-360°) to color values and apply to color control system
        const normalizedAngle = angle / 360; // Convert to 0-1 range
        
        // Update spectrograph colors based on rotary position
        colorControl.spectrograph.hue = normalizedAngle; // Full hue range (0-1)
        colorControl.spectrograph.saturation = 0.7 + (Math.sin(normalizedAngle * Math.PI * 2) * 0.2); // 0.5-0.9 range with variation
        colorControl.spectrograph.brightness = 0.8 + (Math.cos(normalizedAngle * Math.PI * 4) * 0.1); // 0.7-0.9 range with variation
        
        // Redraw spectrogram with new colors
        drawSpectrogram();
        
        // Play velocity-sensitive click sound for rotary movement
        if (velocity > 0.05) { // Lower threshold for more responsive sound
          console.log('Playing rotary click sound with velocity:', velocity);
          soundEffects.playRotaryClick(velocity);
        } else {
          console.log('Velocity too low for sound:', velocity);
        }
      }
      
      function handleRotaryEnd(event) {
        if (!isRotaryMode) return;
        isDragging = false;
      }
      
      // Mouse events - attach to wheel content with icon protection
      if (wheelContent) {
        wheelContent.addEventListener('mousedown', handleRotaryStart);
      }
      document.addEventListener('mousemove', handleRotaryDrag);
      document.addEventListener('mouseup', handleRotaryEnd);
      
      // Touch events - attach to wheel content with icon protection
      if (wheelContent) {
        wheelContent.addEventListener('touchstart', handleRotaryStart, { passive: false });
      }
      document.addEventListener('touchmove', handleRotaryDrag, { passive: false });
      document.addEventListener('touchend', handleRotaryEnd);
    }
    
    // Toggle rotary mode with proper icon state coordination
    function toggleRotaryMode() {
      isRotaryMode = !isRotaryMode;
      
      const paletteIcon = document.querySelector('[data-tool="palette"]');
      
      if (isRotaryMode) {
        // Ensure palette icon shows as active when rotary mode is on
        if (paletteIcon && activeTool === 'palette') {
          paletteIcon.classList.add('active');
        }
        
        // Show fixed position indicator
        if (rotaryIndicator) rotaryIndicator.style.opacity = '1';
        
        // Hide original position dot
        const wheelContainer = document.querySelector('.wheel-container');
        if (wheelContainer) {
          const afterElement = window.getComputedStyle(wheelContainer, '::after');
          if (afterElement) {
            wheelContainer.style.setProperty('--position-dot-opacity', '0');
          }
        }
        
        // Highlight ticks
        highlightTicks(true);
        
        // Initialize wheel rotation
        updateWheelRotation();
        
        console.log('Rotary mode activated - wheel will rotate, icons stay fixed');
      } else {
        // Remove active state from palette icon when rotary mode is off
        // Only if palette is still the active tool (not switching to another tool)
        if (paletteIcon && activeTool === 'palette') {
          paletteIcon.classList.remove('active');
          activeTool = null; // Clear active tool only when manually deactivating palette
        }
        
        // Hide position indicator
        if (rotaryIndicator) rotaryIndicator.style.opacity = '0';
        
        // Show original position dot
        const wheelContainer = document.querySelector('.wheel-container');
        if (wheelContainer) {
          wheelContainer.style.setProperty('--position-dot-opacity', '1');
        }
        
        // Remove tick highlighting
        highlightTicks(false);
        
        // DON'T reset wheel rotation - preserve user's color selection
        // rotaryAngle = 0;
        // updateWheelRotation();
        
        console.log('Rotary mode deactivated - color selection preserved');
      }
    }
    
    // Tool functionality mapping - properly linked to functions
    const toolActions = {
      palette: () => {
        // Toggle rotary mode for color adjustment
        toggleRotaryMode();
      },
      magnify: () => {
        // Magnify tool functionality
        console.log('Magnify tool activated');
      },
      refresh: () => {
        // Generate new spectrogram
        generateNewSpectrogram();
      },
      filter: () => {
        // Filter tool functionality
        console.log('Filter tool activated');
      },
      measure: () => {
        // Measure tool functionality
        console.log('Measure tool activated');
      },
      anomaly: () => {
        // Light bulb icon - toggle debug/anomaly mode
        debugMode = !debugMode;
        drawSpectrogram();
        console.log(`Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
      },
      enhance: () => {
        // Enhance tool functionality
        console.log('Enhance tool activated');
      },
      export: () => {
        // Export tool functionality
        console.log('Export tool activated');
      },
      settings: () => {
        // Settings tool functionality
        console.log('Settings tool activated');
      }
    };
    
    // Expand wheel function
    function expandWheel() {
      if (!isWheelExpanded) {
        wheelContainer.classList.add('wheel-expanded');
        isWheelExpanded = true;
        
        // Add stagger animation to wheel items
        wheelItems.forEach((item, index) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = item.style.transform.replace('scale(0)', 'scale(1)');
          }, index * 50);
        });
      }
    }
    
    // Collapse wheel function
    function collapseWheel() {
      if (isWheelExpanded) {
        wheelContainer.classList.remove('wheel-expanded');
        isWheelExpanded = false;
      }
    }
    
    // Set active tool with toggle functionality
    function setActiveTool(toolName) {
      const selectedItem = document.querySelector(`[data-tool="${toolName}"]`);
      
      // Check if this tool is already active - if so, deselect it
      if (activeTool === toolName) {
        // Deselect the active tool
        wheelItems.forEach(item => item.classList.remove('active'));
        
        // Handle tool-specific deactivation
        if (toolName === 'palette') {
          // Exit rotary mode when deselecting palette (if it's active)
          if (isRotaryMode) {
            toggleRotaryMode();
          }
        } else if (toolName === 'anomaly' && debugMode) {
          // Turn off debug mode when deselecting anomaly
          debugMode = false;
          drawSpectrogram();
          console.log('Debug mode disabled');
        }
        
        activeTool = null;
        console.log(`${toolName} tool deselected`);
      } else {
        // Handle switching away from palette tool - preserve color state
        if (activeTool === 'palette' && isRotaryMode) {
          // Exit rotary mode when switching away from palette but preserve color
          isRotaryMode = false;
          
          // Clean up rotary mode visuals only
          if (rotaryIndicator) rotaryIndicator.style.opacity = '0';
          const wheelContainer = document.querySelector('.wheel-container');
          if (wheelContainer) {
            wheelContainer.style.setProperty('--position-dot-opacity', '1');
          }
          highlightTicks(false);
          // DON'T reset rotary angle - preserve user's color selection
          
          console.log('Rotary mode deactivated due to tool switch - color preserved');
        }
        
        // Remove active class from all items
        wheelItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to selected tool
        if (selectedItem) {
          selectedItem.classList.add('active');
          activeTool = toolName;
          
          // Execute tool action
          if (toolActions[toolName]) {
            toolActions[toolName]();
          }
          
          console.log(`${toolName} tool activated`);
        }
      }
      
      // Wheel stays open after tool selection - only closes when clicking away
    }
    
    // Click handlers
    wheelTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isWheelExpanded) {
        collapseWheel();
      } else {
        expandWheel();
      }
    });
    
    // Close button removed for icon-only design
    
    // Wheel item click handlers
    wheelItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const toolName = item.getAttribute('data-tool');
        setActiveTool(toolName);
      });
    });
    
    // Center refresh button click handler
    const wheelCenter = document.querySelector('.wheel-center');
    if (wheelCenter) {
      wheelCenter.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveTool('refresh');
      });
    }
    
    // Touch gesture handlers for swipe up
    wheelTrigger.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });
    
    wheelTrigger.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    wheelTrigger.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      const swipeDistance = touchStartY - touchEndY;
      
      // Check for swipe up gesture
      if (swipeDistance > SWIPE_THRESHOLD && touchDuration < SWIPE_TIME_THRESHOLD) {
        expandWheel();
      } else if (swipeDistance < -SWIPE_THRESHOLD && touchDuration < SWIPE_TIME_THRESHOLD) {
        // Swipe down to collapse
        collapseWheel();
      }
    }, { passive: true });
    
    // Simple backdrop click to close wheel
    const wheelBackdrop = document.getElementById('wheelNavBackdrop');
    if (wheelBackdrop) {
      wheelBackdrop.addEventListener('click', () => {
        collapseWheel();
      });
    }
    
    // Keyboard shortcuts
    console.log('Wheel navigation initialized successfully');
    
    // Initialize rotating wheel structure
    initializeRotatingWheel();
  }
  
  // Trigger fade-in animation after a brief delay
  setTimeout(() => {
    const overlayContent = document.querySelector('.overlay-content');
    const title = document.querySelector('.popup-title');
    const subtitle = document.querySelector('.popup-subtitle');
    const description = document.querySelector('.popup-description');
    const button = document.querySelector('.glass-start-button');
    
    if (overlayContent && title && subtitle && description && button) {
      // Trigger sequential fade-in animations
      overlayContent.style.opacity = '1';
      overlayContent.style.transform = 'translateY(0)';
      
      title.style.opacity = '1';
      title.style.transform = 'translateY(0)';
      
      subtitle.style.opacity = '1';
      subtitle.style.transform = 'translateY(0)';
      
      description.style.opacity = '1';
      description.style.transform = 'translateY(0)';
      
      button.style.opacity = '1';
      button.style.transform = 'translateY(0)';
    }
  }, 200);
  
  // Set up start button with glass button hover effects
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    // Add hover and active states for glass button
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.background = 'rgba(255,255,255,0.12)';
      startBtn.style.borderColor = 'rgba(255,255,255,0.3)';
      startBtn.style.transform = 'translateY(-2px)';
      startBtn.style.boxShadow = '0 12px 48px rgba(0,0,0,0.4)';
    });
    
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.background = 'rgba(255,255,255,0.08)';
      startBtn.style.borderColor = 'rgba(255,255,255,0.2)';
      startBtn.style.transform = 'translateY(0)';
      startBtn.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    });
    
    startBtn.addEventListener('mousedown', () => {
      startBtn.style.transform = 'translateY(0) scale(0.98)';
    });
    
    startBtn.addEventListener('mouseup', () => {
      startBtn.style.transform = 'translateY(-2px) scale(1)';
    });
    
    startBtn.addEventListener('click', () => {
      document.getElementById('instructionOverlay').style.display = 'none';
      // Interactive mode is already initialized - just hide the overlay
    });
  }
  
  // Initialize wheel navigation after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializeWheelNavigation();
  }, 100);
  
  // Initialize sound effects system
  soundEffects.init();
}

// Call the startInteractiveMode function
startInteractiveMode();