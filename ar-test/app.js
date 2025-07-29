// Tone.js synth setup
let synth;
let arSceneStarted = false;

// Initialize AR scene and camera after user gesture
function startARExperience() {
  if (arSceneStarted) return;
  
  // Initialize Tone.js audio context (required for iOS)
  if (Tone.context.state !== 'running') {
    Tone.start();
  }
  
  // Hide instructions and show AR scene
  const instructions = document.getElementById('instructions');
  const scene = document.querySelector('a-scene');
  
  if (instructions) instructions.classList.add('hidden');
  if (scene) {
    scene.style.display = 'block';
    // Force AR.js to initialize camera
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; trackingMethod: best;');
  }
  
  arSceneStarted = true;
}

AFRAME.registerComponent('sound-box', {
  init: function () {
    // Lazy-init synth on first interaction (for iOS/WebAudio policy)
    const getSynth = () => {
      if (!synth) {
        synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.5 }
        }).toDestination();
      }
      return synth;
    };

    this.el.addEventListener('click', () => {
      getSynth().triggerAttackRelease('C4', '8n');
      this.el.setAttribute('scale', '1.2 1.2 1.2');
      setTimeout(() => this.el.setAttribute('scale', '1 1 1'), 150);
    });
    // Touch support for mobile
    this.el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      getSynth().triggerAttackRelease('E4', '8n');
      this.el.setAttribute('scale', '1.2 1.2 1.2');
      setTimeout(() => this.el.setAttribute('scale', '1 1 1'), 150);
    });
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('startButton');
  const scene = document.querySelector('a-scene');
  
  // Initially hide the AR scene
  if (scene) scene.style.display = 'none';
  
  // Start button click handler
  if (startButton) {
    startButton.addEventListener('click', startARExperience);
    startButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startARExperience();
    });
  }
});

