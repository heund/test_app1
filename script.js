// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Global Audio Manager
class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.currentTrack = null; // 'A' or 'B'
    this.isPlaying = false;
    this.navAudioPlayer = null;
    this.tracks = {
      'A': { file: 'audioa.wav', title: 'Work A Audio' },
      'B': { file: 'audiob.wav', title: 'Work B Audio' }
    };
  }

  loadTrack(track) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    
    this.currentTrack = track;
    this.currentAudio = new Audio(this.tracks[track].file);
    
    // Set up event listeners
    this.currentAudio.addEventListener('play', () => {
      this.isPlaying = true;
      this.showNavPlayer();
      this.updateNavPlayerUI();
    });
    
    this.currentAudio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateNavPlayerUI();
    });
    
    this.currentAudio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updateNavPlayerUI();
    });
    
    return this.currentAudio;
  }

  play() {
    if (this.currentAudio) {
      this.currentAudio.play();
    }
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      this.updateNavPlayerUI();
    }
  }

  forward() {
    // Switch between tracks A and B
    const nextTrack = this.currentTrack === 'A' ? 'B' : 'A';
    const wasPlaying = this.isPlaying;
    const currentTime = this.currentAudio ? this.currentAudio.currentTime : 0;
    
    this.loadTrack(nextTrack);
    
    if (wasPlaying) {
      this.play();
    }
    
    this.updateNavPlayerUI();
  }

  showNavPlayer() {
    if (!this.navAudioPlayer) {
      this.createNavPlayer();
    }
    this.navAudioPlayer.style.display = 'flex';
  }

  hideNavPlayer() {
    if (this.navAudioPlayer) {
      this.navAudioPlayer.style.display = 'none';
    }
  }

  createNavPlayer() {
    const topNav = document.querySelector('.top-nav');
    
    this.navAudioPlayer = document.createElement('div');
    this.navAudioPlayer.className = 'nav-audio-player';
    this.navAudioPlayer.style.cssText = `
      display: none;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
      background: #222;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
    `;
    
    this.navAudioPlayer.innerHTML = `
      <span class='nav-audio-title'>Work A Audio</span>
      <button class='nav-audio-btn' id='navPlayPause'>⏸</button>
      <button class='nav-audio-btn' id='navStop'>⏹</button>
      <button class='nav-audio-btn' id='navForward'>⏭</button>
    `;
    
    // Add event listeners
    this.navAudioPlayer.querySelector('#navPlayPause').onclick = () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    };
    
    this.navAudioPlayer.querySelector('#navStop').onclick = () => {
      this.stop();
    };
    
    this.navAudioPlayer.querySelector('#navForward').onclick = () => {
      this.forward();
    };
    
    topNav.appendChild(this.navAudioPlayer);
  }

  updateNavPlayerUI() {
    if (!this.navAudioPlayer) return;
    
    const title = this.navAudioPlayer.querySelector('.nav-audio-title');
    const playPauseBtn = this.navAudioPlayer.querySelector('#navPlayPause');
    
    if (this.currentTrack) {
      title.textContent = this.tracks[this.currentTrack].title;
    }
    
    playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
  }
}

// Global audio manager instance
const audioManager = new AudioManager();

// Navigation logic
const mainView = document.getElementById('mainView');
const backBtn = document.getElementById('backBtn');
const homeBtn = document.getElementById('homeBtn');
const narrativeBtn = document.getElementById('narrativeModeBtn');
const interactiveBtn = document.getElementById('interactiveModeBtn');

// Navigation history stack (stores view functions and their params)
const navStack = [];

function navigate(viewFn, ...args) {
  navStack.push({viewFn, args});
  viewFn(...args);
}

// Navigation button handlers
backBtn.onclick = function() {
  if (navStack.length > 1) {
    navStack.pop(); // Remove current view
    const {viewFn, args} = navStack[navStack.length - 1];
    viewFn(...args);
    // Hide back/home if we're back at home
    if (navStack.length === 1) {
      backBtn.style.display = 'none';
      homeBtn.style.display = 'none';
    }
  } else if (navStack.length === 1) {
    navStack.pop();
    showHome();
  }
};

homeBtn.onclick = function() {
  navStack.length = 0;
  showHome();
};

if (narrativeBtn) narrativeBtn.onclick = () => navigate(showNarrativeSelect);
if (interactiveBtn) interactiveBtn.onclick = () => navigate(showInteractive);

// View Functions
function showHome() {
  // Clean up any interactive overlays
  cleanupInteractiveMode();
  
  mainView.innerHTML = `
    <h1>Artisan Logic Companion</h1>
    <p>Choose your experience:</p>
    <div class='mode-buttons'>
      <button id='narrativeModeBtn' class='mode-btn'>Narrative Mode</button>
      <button id='interactiveModeBtn' class='mode-btn'>Interactive Mode</button>
    </div>
  `;
  
  // Remove full-height class
  mainView.classList.remove('full-height');
  
  // Hide navigation buttons
  backBtn.style.display = 'none';
  homeBtn.style.display = 'none';
  
  // Set up mode buttons
  document.getElementById('narrativeModeBtn').onclick = () => {
    cleanupInteractiveMode();
    showNarrativeSelect();
  };
  document.getElementById('interactiveModeBtn').onclick = showInteractive;
  
  // Push home view if navStack is empty
  if (navStack.length === 0) navStack.push({viewFn: showHome, args: []});
}

function showNarrativeSelect() {
  // Clean up any interactive overlays
  cleanupInteractiveMode();
  
  mainView.innerHTML = `
    <h2>Narrative Mode</h2>
    <p>Select a work:</p>
    <div class='mode-buttons'>
      <button id='workABtn'>Work A</button>
      <button id='workBBtn'>Work B</button>
    </div>
  `;
  backBtn.style.display = 'inline-block';
  homeBtn.style.display = 'inline-block';
  document.getElementById('workABtn').onclick = () => navigate(showNarrative, 'A');
  document.getElementById('workBBtn').onclick = () => navigate(showNarrative, 'B');
}

function showNarrative(work) {
  // Remove full-height class (Narrative mode uses default layout)
  mainView.classList.remove('full-height');
  
  // Lorem ipsum content for testing scrollable text
  const narrativeContent = `
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    
    <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
    
    <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.</p>
    
    <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
    
    <p>Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.</p>
    
    <p>Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.</p>
    
    <p>Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    
    <p>Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.</p>
    
    <p>Nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.</p>
  `;
  
  // Load the appropriate track in the audio manager
  const currentAudio = audioManager.loadTrack(work);
  
  mainView.innerHTML = `
    <div class='narrative-mode'>
      <div class='audio-panel'>
        <h3>Work ${work} Audio</h3>
        <div class='audio-controls'>
          <button id='playBtn' class='audio-btn'>▶ Play</button>
          <button id='pauseBtn' class='audio-btn'>⏸ Pause</button>
          <button id='stopBtn' class='audio-btn'>⏹ Stop</button>
          <div class='audio-info'>
            <span id='audioTitle'>${audioManager.tracks[work].title}</span>
          </div>
        </div>
      </div>
      <div class='text-panel'>
        <h3>Work ${work} Narrative</h3>
        <div class='scrollable-text'>
          ${narrativeContent}
        </div>
      </div>
    </div>
  `;
  
  // Set up audio control event listeners
  document.getElementById('playBtn').onclick = () => audioManager.play();
  document.getElementById('pauseBtn').onclick = () => audioManager.pause();
  document.getElementById('stopBtn').onclick = () => audioManager.stop();
  
  backBtn.style.display = 'inline-block';
  homeBtn.style.display = 'inline-block';
}

// Cleanup function for interactive overlays
function cleanupInteractiveMode() {
  // Remove interactive overlays if they exist
  if (window.currentInteractiveOverlays) {
    document.body.removeChild(window.currentInteractiveOverlays);
    window.currentInteractiveOverlays = null;
  }
  
  // Remove full-height class
  mainView.classList.remove('full-height');
}

function showInteractive() {
  // Clean up any existing interactive overlays first
  cleanupInteractiveMode();
  
  // Show navigation buttons
  backBtn.style.display = 'inline-block';
  homeBtn.style.display = 'inline-block';
  
  // Call the interactive mode from interaction.js
  if (typeof startInteractiveMode === 'function') {
    startInteractiveMode();
  } else {
    console.error('Interactive mode not available - interaction.js may not be loaded');
    mainView.innerHTML = '<h2>Interactive Mode</h2><p>Loading...</p>';
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  navStack.length = 0;
  showHome();
});
