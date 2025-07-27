// Test script for Interactive mode with magnifying glass
// Minimal version to isolate JS/CSS interaction issues

document.addEventListener('DOMContentLoaded', function() {
  const mainView = document.getElementById('mainView');
  const interactiveBtn = document.getElementById('interactiveModeBtn');
  
  // Set up Interactive mode button
  if (interactiveBtn) {
    interactiveBtn.onclick = showInteractive;
  }
  
  function showInteractive() {
    mainView.innerHTML = `
      <canvas id='specCanvas' style='position:fixed;top:0;left:0;background:#000;z-index:1;display:block;'></canvas>
      <div id='magnifier' style='display:none;position:fixed;pointer-events:none;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px #000;background:rgba(0,0,0,0.2);z-index:10;'></div>
      <div id='resultMsg' style='position:fixed;top:calc(50px + 6vh);left:50%;transform:translateX(-50%);color:#fff;font-size:clamp(16px,3vw,22px);font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.8);background:rgba(0,0,0,0.8);padding:2vh 3vw;border-radius:8px;z-index:100;max-width:80vw;text-align:center;border:1px solid rgba(255,255,255,0.3);box-shadow:0 4px 12px rgba(0,0,0,0.5);'></div>
      <button id='generateBtn' class='generate-button' style='position:fixed;top:calc(50px + 1.5vh);left:2vw;z-index:100;font-size:clamp(12px,2.5vw,16px);padding:1vh 2vw;background:#4a90e2;color:#fff;border:2px solid #fff;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:600;min-width:120px;'>Generate New Spectrograph</button>
      <div id='generationCounter' class='generation-counter' style='position:fixed;bottom:2vh;left:50%;transform:translateX(-50%);z-index:1001;font-size:clamp(14px,2.5vw,18px);color:#fff;background:rgba(0,0,0,0.8);padding:1vh 2vw;border-radius:6px;border:1px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:600;'>Generation: 1</div>
      <button id='debugToggle' class='debug-toggle' style='position:fixed;top:calc(50px + 1.5vh);right:2vw;z-index:100;font-size:clamp(12px,2.5vw,16px);padding:1vh 2vw;background:#e74c3c;color:#fff;border:2px solid #fff;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:600;min-width:100px;'>Show Anomaly</button>
      <div id='instructionOverlay' class='instruction-overlay' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:30;backdrop-filter:blur(2px);'>
        <div class='overlay-content' style='text-align:center;color:#fff;max-width:400px;padding:2rem;background:rgba(0,0,0,0.7);border-radius:12px;border:2px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.5);'>
          <h2 style='font-size:1.8rem;margin-bottom:1rem;color:#fff;font-weight:600;'>Generative Spectrograph Mode</h2>
          <p style='font-size:1rem;line-height:1.4;margin-bottom:0.75rem;color:#ccc;'>Find the anomaly in the procedurally generated spectrograph.</p>
          <p style='font-size:1rem;line-height:1.4;margin-bottom:0.75rem;color:#ccc;'>Use "Generate" to create a new spectrograph with a different anomaly.</p>
          <button id='startBtn' class='start-button' style='background:linear-gradient(135deg,#4a90e2,#357abd);color:#fff;border:none;border-radius:8px;padding:0.75rem 2rem;font-size:1.1rem;font-weight:600;cursor:pointer;margin-top:1rem;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(74,144,226,0.3);'>Start Exploring</button>
        </div>
      </div>
    `;
    
    // Add full-height class for proper layout
    mainView.classList.add('full-height');
    
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
    const magnifier = document.getElementById('magnifier');
    const resultMsg = document.getElementById('resultMsg');
    const instructionOverlay = document.getElementById('instructionOverlay');
    const startBtn = document.getElementById('startBtn');
    const generateBtn = document.getElementById('generateBtn');
    const generationCounter = document.getElementById('generationCounter');
    const debugToggle = document.getElementById('debugToggle');
    
    // Check if elements were found
    if (!canvas || !instructionOverlay || !startBtn) {
      console.error('Required elements not found:', { canvas, instructionOverlay, startBtn });
      return;
    }
    
    // Hide overlay and generate first spectrogram when start button is clicked
    startBtn.onclick = () => {
      instructionOverlay.style.display = 'none';
      // Generate the first spectrogram now
      createSpectrogramData();
      drawSpectrogram();
    };
    
    // Generation functions
    function updateGenerationCounter() {
      generationCounter.textContent = `Generation: ${generationCount}`;
    }
    
    function generateNewSpectrogram() {
      generationCount++;
      updateGenerationCounter();
      
      // Randomize parameters for each generation
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
      
      createSpectrogramData();
      drawSpectrogram();
    }
    
    // Set up generation event listener
    generateBtn.onclick = generateNewSpectrogram;
    
    // Debug toggle functionality
    debugToggle.onclick = () => {
      debugMode = !debugMode;
      debugToggle.textContent = debugMode ? 'Hide Anomaly' : 'Show Anomaly';
      drawSpectrogram();
    };
    
    // Canvas setup - full screen canvas without scaling issues
    function setupCanvas() {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Set canvas display size via CSS
      canvas.style.width = containerWidth + 'px';
      canvas.style.height = containerHeight + 'px';
      
      // Set canvas internal resolution to match display size (1:1 mapping)
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      // No scaling needed - direct 1:1 pixel mapping
      
      return { containerWidth, containerHeight };
    }
    
    // Initialize canvas and generate data immediately (but don't draw until user clicks start)
    setupCanvas();
    updateGenerationCounter();
    
    // Generate spectrogram data immediately so magnifier has data to work with
    createSpectrogramData();
    
    // Show blank canvas initially  
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, containerWidth, containerHeight);
    
    // Ensure overlay is visible
    if (instructionOverlay) {
      instructionOverlay.style.display = 'flex';
    }
    
    // Generate procedural spectrogram data
    function createSpectrogramData() {
      const { frequencyBands, timeSlices, patternType, grainSize, frequencyFocus, timeModulation } = spectrogramParams;
      spectrogramData = new Array(frequencyBands);
      
      for (let f = 0; f < frequencyBands; f++) {
        spectrogramData[f] = new Array(timeSlices);
        for (let t = 0; t < timeSlices; t++) {
          // Base spectrogram pattern with harmonics and noise
          let intensity = spectrogramParams.baseIntensity;
          
          // Variable harmonic patterns based on pattern type
          if (patternType === 0) {
            // Classic harmonic pattern
            intensity += Math.sin(f * 0.02 * grainSize + t * timeModulation) * spectrogramParams.harmonicStrength * 0.3;
            intensity += Math.sin(f * 0.05 * grainSize + t * timeModulation * 0.5) * spectrogramParams.harmonicStrength * 0.2;
            intensity += Math.sin(f * 0.1 * grainSize + t * timeModulation * 2) * spectrogramParams.harmonicStrength * 0.1;
          } else if (patternType === 1) {
            // Chaotic interference pattern
            intensity += Math.cos(f * 0.03 * grainSize + t * timeModulation * 1.5) * spectrogramParams.harmonicStrength * 0.25;
            intensity += Math.sin(f * 0.08 * grainSize - t * timeModulation * 0.8) * spectrogramParams.harmonicStrength * 0.3;
            intensity += Math.cos(f * 0.15 * grainSize + t * timeModulation * 3) * spectrogramParams.harmonicStrength * 0.15;
          } else {
            // Pulse-based pattern
            intensity += Math.sin(f * 0.04 * grainSize) * Math.cos(t * timeModulation * 4) * spectrogramParams.harmonicStrength * 0.4;
            intensity += Math.cos(f * 0.07 * grainSize) * Math.sin(t * timeModulation * 2.5) * spectrogramParams.harmonicStrength * 0.2;
          }
          
          // Variable frequency-based patterns with random focus
          const focusDistance1 = Math.abs(f - frequencyFocus);
          const focusDistance2 = Math.abs(f - (frequencyFocus + 64) % 256);
          const focusDistance3 = Math.abs(f - (frequencyFocus + 128) % 256);
          
          intensity += Math.exp(-Math.pow(focusDistance1 / (30 + Math.random() * 40), 2)) * (0.2 + Math.random() * 0.4);
          intensity += Math.exp(-Math.pow(focusDistance2 / (20 + Math.random() * 30), 2)) * (0.1 + Math.random() * 0.3);
          intensity += Math.exp(-Math.pow(focusDistance3 / (40 + Math.random() * 50), 2)) * (0.15 + Math.random() * 0.25);
          
          // Variable time-based modulation
          intensity *= (1 + (0.2 + Math.random() * 0.3) * Math.sin(t * timeModulation + f * 0.01));
          
          // Add variable grain noise
          intensity += (Math.random() - 0.5) * spectrogramParams.noiseLevel * grainSize;
          
          // Add occasional spikes for realism
          if (Math.random() < 0.001) {
            intensity += Math.random() * 0.5;
          }
          
          // Clamp values
          spectrogramData[f][t] = Math.max(0, Math.min(1, intensity));
        }
      }
      
      // Place subtle anomaly at random location
      placeSubtleAnomaly();
    }
    
    function placeSubtleAnomaly() {
      const { frequencyBands, timeSlices, grainSize, timeModulation } = spectrogramParams;
      
      // Random position for anomaly (avoid edges)
      const anomalyX = Math.floor(Math.random() * (timeSlices - 80)) + 40;
      const anomalyY = Math.floor(Math.random() * (frequencyBands - 80)) + 40;
      const anomalyRadius = 12 + Math.random() * 8; // 12-20 pixel radius (smaller)
      
      // Store anomaly position for detection
      currentAnomalySpot = {
        x: anomalyX / timeSlices,
        y: anomalyY / frequencyBands,
        radius: anomalyRadius / Math.min(timeSlices, frequencyBands)
      };
      
      // Create subtle anomaly - follows spectrogram logic but with slight variations
      for (let f = 0; f < frequencyBands; f++) {
        for (let t = 0; t < timeSlices; t++) {
          const distance = Math.sqrt((t - anomalyX) ** 2 + (f - anomalyY) ** 2);
          
          if (distance < anomalyRadius) {
            const falloff = 1 - (distance / anomalyRadius);
            const currentIntensity = spectrogramData[f][t];
            
            // Subtle anomaly: slightly different harmonic pattern
            let anomalyModification = 0;
            
            // Add slightly off-phase harmonics (subtle frequency shift) - made more noticeable
            anomalyModification += Math.sin((f + 3) * 0.02 * grainSize + (t + 1.5) * timeModulation) * 0.22 * falloff;
            anomalyModification += Math.cos((f - 2) * 0.05 * grainSize + (t - 0.8) * timeModulation) * 0.16 * falloff;
            
            // Slightly different grain pattern - more pronounced
            anomalyModification += (Math.random() - 0.5) * 0.12 * falloff * grainSize;
            
            // Subtle but noticeable intensity boost
            anomalyModification += 0.18 * falloff;
            
            // Add a very subtle frequency "signature" that makes it slightly more distinct
            const signature = Math.sin(distance * 0.8) * 0.08 * falloff;
            anomalyModification += signature;
            
            // Apply the subtle modification
            spectrogramData[f][t] = Math.max(0, Math.min(1, currentIntensity + anomalyModification));
          }
        }
      }
    }
    
    function drawSpectrogram() {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      ctx.clearRect(0, 0, containerWidth, containerHeight);
      
      // Add comprehensive null checks
      if (!spectrogramData || !spectrogramParams) {
        return;
      }
      
      const { frequencyBands, timeSlices } = spectrogramParams;
      const pixelWidth = containerWidth / timeSlices;
      const pixelHeight = containerHeight / frequencyBands;
      
      // Draw spectrogram with variable color schemes
      for (let f = 0; f < frequencyBands; f++) {
        if (!spectrogramData[f]) continue;
        for (let t = 0; t < timeSlices; t++) {
          const intensity = spectrogramData[f][t];
          if (intensity === undefined || intensity === null) continue;
          
          // Variable color schemes based on generation
          let r, g, b;
          
          if (spectrogramParams.colorScheme === 0) {
            // Classic blue to yellow to red
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
            if (intensity < 0.5) {
              const factor = intensity * 2;
              r = Math.floor(80 + factor * 100);
              g = Math.floor(factor * 150);
              b = Math.floor(120 + factor * 135);
            } else {
              const factor = (intensity - 0.5) * 2;
              r = Math.floor(180 + factor * 75);
              g = Math.floor(150 + factor * 105);
              b = Math.floor(255);
            }
          } else if (spectrogramParams.colorScheme === 2) {
            // Green to cyan to white
            if (intensity < 0.5) {
              const factor = intensity * 2;
              r = Math.floor(factor * 100);
              g = Math.floor(100 + factor * 155);
              b = Math.floor(factor * 200);
            } else {
              const factor = (intensity - 0.5) * 2;
              r = Math.floor(100 + factor * 155);
              g = 255;
              b = Math.floor(200 + factor * 55);
            }
          } else {
            // Monochrome with color tint
            const mono = Math.floor(intensity * 255);
            const tint = Math.sin(generationCount * 0.5) * 0.3 + 0.7;
            r = Math.floor(mono * (0.8 + 0.2 * tint));
            g = Math.floor(mono * (0.9 + 0.1 * Math.cos(generationCount * 0.7)));
            b = Math.floor(mono * (0.7 + 0.3 * Math.sin(generationCount * 0.3)));
          }
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(
            t * pixelWidth,
            (frequencyBands - f - 1) * pixelHeight, // Flip Y axis
            Math.ceil(pixelWidth),
            Math.ceil(pixelHeight)
          );
        }
      }
      
      // Draw debug overlay if enabled
      if (debugMode && currentAnomalySpot) {
        drawAnomalyOverlay(containerWidth, containerHeight);
      }
    }
    
    function drawAnomalyOverlay(containerWidth, containerHeight) {
      if (!currentAnomalySpot) return;
      
      const spotX = currentAnomalySpot.x * containerWidth;
      const spotY = (1 - currentAnomalySpot.y) * containerHeight; // Flip Y axis
      const spotRadius = currentAnomalySpot.radius * Math.min(containerWidth, containerHeight);
      
      // Draw colored circle overlay with high contrast colors
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 255, 0.4)'; // Bright magenta fill
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw bright border
      ctx.strokeStyle = 'rgba(0, 255, 0, 1.0)'; // Bright green border
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Draw second border for better visibility
      ctx.strokeStyle = 'rgba(255, 255, 0, 1.0)'; // Yellow outer border
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw center dot
      ctx.fillStyle = 'rgba(255, 0, 0, 1.0)'; // Bright red center
      ctx.beginPath();
      ctx.arc(spotX, spotY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add center dot border
      ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Get current anomaly spot coordinates
    function getCurrentAnomalySpot() {
      if (!currentAnomalySpot) return null;
      
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      return {
        x: currentAnomalySpot.x * containerWidth,
        y: (1 - currentAnomalySpot.y) * containerHeight, // Flip Y axis
        radius: currentAnomalySpot.radius * Math.min(containerWidth, containerHeight)
      };
    }
    
    // Magnifier variables
    let dragging = false;
    const canvasDimensions = setupCanvas();
    const magRadius = Math.min(canvasDimensions.containerWidth, canvasDimensions.containerHeight) * 0.15;
    const magZoom = 2.5;
    
    function showMagnifier(x, y) {
      magnifier.style.display = 'block';
      magnifier.style.width = (magRadius * 2) + 'px';
      magnifier.style.height = (magRadius * 2) + 'px';
      magnifier.style.left = (x - magRadius) + 'px';
      magnifier.style.top = (y - magRadius) + 'px';
      
      // Redraw with magnified area
      drawSpectrogram();
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, magRadius, 0, 2 * Math.PI);
      ctx.clip();
      
      // Draw magnified spectrogram data
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const { frequencyBands, timeSlices } = spectrogramParams;
      
      const sourceRadius = magRadius / magZoom;
      const sourceX = Math.max(0, Math.min(timeSlices - 1, (x / containerWidth) * timeSlices));
      const sourceY = Math.max(0, Math.min(frequencyBands - 1, ((containerHeight - y) / containerHeight) * frequencyBands));
      
      const pixelWidth = (containerWidth / timeSlices) * magZoom;
      const pixelHeight = (containerHeight / frequencyBands) * magZoom;
      
      for (let f = 0; f < frequencyBands; f++) {
        for (let t = 0; t < timeSlices; t++) {
          const distance = Math.sqrt((t - sourceX) ** 2 + (f - sourceY) ** 2);
          if (distance < sourceRadius) {
            // Add null check for spectrogramData
            if (!spectrogramData || !spectrogramData[f]) {
              continue;
            }
            const intensity = spectrogramData[f][t];
            
            // Use the same color scheme as the current spectrogram
            let r, g, b;
            
            if (spectrogramParams.colorScheme === 0) {
              // Classic blue to yellow to red
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
              if (intensity < 0.5) {
                const factor = intensity * 2;
                r = Math.floor(80 + factor * 100);
                g = Math.floor(factor * 150);
                b = Math.floor(120 + factor * 135);
              } else {
                const factor = (intensity - 0.5) * 2;
                r = Math.floor(180 + factor * 75);
                g = Math.floor(150 + factor * 105);
                b = Math.floor(255);
              }
            } else if (spectrogramParams.colorScheme === 2) {
              // Green to cyan to white
              if (intensity < 0.5) {
                const factor = intensity * 2;
                r = Math.floor(factor * 100);
                g = Math.floor(100 + factor * 155);
                b = Math.floor(factor * 200);
              } else {
                const factor = (intensity - 0.5) * 2;
                r = Math.floor(100 + factor * 155);
                g = 255;
                b = Math.floor(200 + factor * 55);
              }
            } else {
              // Monochrome with color tint
              const mono = Math.floor(intensity * 255);
              const tint = Math.sin(generationCount * 0.5) * 0.3 + 0.7;
              r = Math.floor(mono * (0.8 + 0.2 * tint));
              g = Math.floor(mono * (0.9 + 0.1 * Math.cos(generationCount * 0.7)));
              b = Math.floor(mono * (0.7 + 0.3 * Math.sin(generationCount * 0.3)));
            }
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(
              x - magRadius + (t - sourceX + sourceRadius) * pixelWidth,
              y - magRadius + (frequencyBands - f - 1 - sourceY + sourceRadius) * pixelHeight,
              Math.ceil(pixelWidth),
              Math.ceil(pixelHeight)
            );
          }
        }
      }
      
      ctx.restore();
    }
    
    function hideMagnifier() {
      magnifier.style.display = 'none';
      drawSpectrogram();
    }
    
    function checkFound(x, y) {
      // Add null check for spectrogramData
      if (!spectrogramData || !currentAnomalySpot) {
        return false;
      }
      const anomalySpot = getCurrentAnomalySpot();
      if (!anomalySpot) return false;
      return Math.sqrt((x - anomalySpot.x) ** 2 + (y - anomalySpot.y) ** 2) < anomalySpot.radius;
    }
    
    // Touch/mouse events
    canvas.addEventListener('pointerdown', e => {
      dragging = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      showMagnifier(x, y);
    });
    
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      showMagnifier(x, y);
    });
    
    canvas.addEventListener('pointerup', e => {
      dragging = false;
      hideMagnifier();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (checkFound(x, y)) {
        resultMsg.textContent = '🎉 Anomaly found! Generating new spectrogram...';
        resultMsg.style.background = 'rgba(0,150,0,0.8)';
        
        // Auto-generate new spectrogram after a short delay
        setTimeout(() => {
          generateNewSpectrogram();
          resultMsg.textContent = '';
          resultMsg.style.background = 'rgba(0,0,0,0.3)';
        }, 1500);
      } else {
        resultMsg.textContent = '🔍 Keep searching for the anomaly!';
        resultMsg.style.background = 'rgba(150,0,0,0.6)';
        
        setTimeout(() => {
          resultMsg.textContent = '';
          resultMsg.style.background = 'rgba(0,0,0,0.3)';
        }, 2000);
      }
    });
    
    canvas.addEventListener('pointerleave', () => {
      dragging = false;
      hideMagnifier();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      setupCanvas();
      drawSpectrogram();
    });
  }
});
