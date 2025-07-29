// Tone.js synth setup
let synth;

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
    this.el.addEventListener('touchstart', () => {
      getSynth().triggerAttackRelease('E4', '8n');
      this.el.setAttribute('scale', '1.2 1.2 1.2');
      setTimeout(() => this.el.setAttribute('scale', '1 1 1'), 150);
    });
  }
});

