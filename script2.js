// Global Navigation and Audio Overlay Module
// Contains only navigation logic and top expandable audio player

// Global Audio Manager
class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.currentTrack = null; // 'A' or 'B'
    this.isPlaying = false;
    this.isLooping = false;
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
    
    // Apply loop setting
    this.currentAudio.loop = this.isLooping;
    
    // Set up event listeners
    this.currentAudio.addEventListener('play', () => {
      this.isPlaying = true;
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

  toggleLoop() {
    this.isLooping = !this.isLooping;
    if (this.currentAudio) {
      this.currentAudio.loop = this.isLooping;
    }
    return this.isLooping;
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
    const topNav = document.querySelector('.icon-bar');
    
    if (!topNav) {
      console.error('Navigation bar (.icon-bar) not found');
      return;
    }
    
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
const backIcon = document.getElementById('backIcon');
const dropdownIcon = document.getElementById('dropdownIcon');
const menuIcon = document.getElementById('menuIcon');
const narrativeBtn = document.getElementById('narrativeModeBtn');
const interactiveBtn = document.getElementById('interactiveModeBtn');

// Navigation history stack (stores view functions and their params)
const navStack = [];

function navigate(viewFn, ...args) {
  navStack.push({ fn: viewFn, args });
  viewFn(...args);
}

// Navigation button handlers
// Back icon - always returns to landing page (SPA behavior)
if (backIcon) {
  backIcon.onclick = () => {
    // Always go back to the landing page for consistent SPA navigation
    showHome();
  };
}

// Dropdown icon - triggers iOS-native translucent audio overlay
if (dropdownIcon) {
  dropdownIcon.onclick = () => {
    toggleAudioOverlay();
  };
}

// Menu icon - no functionality assigned (placeholder for future use)
if (menuIcon) {
  // No click handler assigned - icon is inactive
}

if (narrativeBtn) narrativeBtn.onclick = () => {
  if (typeof showNarrativeSelect === 'function') {
    navigate(showNarrativeSelect);
  } else {
    console.error('showNarrativeSelect not available - player.js may not be loaded');
  }
};
if (interactiveBtn) interactiveBtn.onclick = () => navigate(showInteractive);

// Global audio overlay state
let audioOverlayVisible = false;
let audioOverlayElement = null;

function toggleAudioOverlay() {
  if (audioOverlayVisible) {
    hideAudioOverlay();
  } else {
    showAudioOverlay();
  }
}

function showAudioOverlay() {
  if (audioOverlayVisible) return;
  
  // Create invisible full-screen click catcher
  const clickCatcher = document.createElement('div');
  clickCatcher.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1999;
    background: transparent;
    pointer-events: auto;
  `;
  clickCatcher.onclick = () => hideAudioOverlay();
  document.body.appendChild(clickCatcher);
  
  audioOverlayElement = document.createElement('div');
  audioOverlayElement.className = 'nav-audio-overlay';
  audioOverlayElement.style.zIndex = '2001'; // Above the click catcher
  audioOverlayElement.innerHTML = `
    <div class="nav-audio-content">
      <div class="nav-audio-header">
        <div class="nav-track-title">Work ${audioManager.currentTrack || 'A'}</div>
        <div class="nav-controls">
          <button class="nav-control-btn" id="navPlayPause">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button class="nav-control-btn" id="navStop">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
          </button>
          <button class="nav-control-btn" id="navNext">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
            </svg>
          </button>
        </div>
        <div class="nav-loop-controls">
          <button class="nav-control-btn nav-loop-btn" id="navLoopBtn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>
        <button class="nav-close-btn" id="navCloseOverlay">×</button>
      </div>
      
      <div class="nav-progress-section">
        <div class="nav-progress-bar">
          <div class="nav-progress-fill" id="navProgressFill"></div>
        </div>
        <div class="nav-time-display">
          <span id="navCurrentTime">0:00</span>
          <span id="navDuration">4:10</span>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(audioOverlayElement);
  
  // Trigger slide down animation
  setTimeout(() => {
    audioOverlayElement.classList.add('nav-audio-visible');
  }, 10);
  
  // Click-outside-to-close is now handled by the invisible overlay
  
  audioOverlayVisible = true;
  setupNavOverlayControls();
}

function hideAudioOverlay() {
  if (!audioOverlayVisible || !audioOverlayElement) return;
  
  // Trigger slide up animation
  audioOverlayElement.classList.remove('nav-audio-visible');
  
  setTimeout(() => {
    if (audioOverlayElement) {
      // Click listener cleanup no longer needed with invisible overlay approach
      
      // Remove the click catcher
      const clickCatcher = document.querySelector('div[style*="z-index: 1999"]');
      if (clickCatcher) {
        document.body.removeChild(clickCatcher);
      }
      
      document.body.removeChild(audioOverlayElement);
      audioOverlayElement = null;
      audioOverlayVisible = false;
    }
  }, 300);
}

// handleOverlayOutsideClick function removed - now using invisible overlay approach

function setupNavOverlayControls() {
  const playPauseBtn = document.getElementById('navPlayPause');
  const stopBtn = document.getElementById('navStop');
  const nextBtn = document.getElementById('navNext');
  const closeBtn = document.getElementById('navCloseOverlay');
  const loopBtn = document.getElementById('navLoopBtn');
  
  playPauseBtn.onclick = (e) => {
    e.stopPropagation();
    if (audioManager.isPlaying) {
      audioManager.pause();
    } else {
      audioManager.play();
    }
    updateNavOverlayUI();
  };
  
  stopBtn.onclick = (e) => {
    e.stopPropagation();
    audioManager.stop();
    updateNavOverlayUI();
  };
  
  nextBtn.onclick = (e) => {
    e.stopPropagation();
    audioManager.forward();
    updateNavOverlayUI();
  };
  
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    hideAudioOverlay();
  };
  
  loopBtn.onclick = (e) => {
    e.stopPropagation();
    const isLooping = audioManager.toggleLoop();
    
    // Update loop button appearance
    if (isLooping) {
      loopBtn.classList.add('active');
    } else {
      loopBtn.classList.remove('active');
    }
  };
  
  // Set up progress tracking - ensure it works even if audio loads later
  function setupProgressTracking() {
    if (audioManager.currentAudio) {
      // Remove any existing listeners to prevent duplicates
      audioManager.currentAudio.removeEventListener('timeupdate', updateNavOverlayProgress);
      audioManager.currentAudio.removeEventListener('loadedmetadata', updateNavOverlayProgress);
      
      // Add fresh listeners
      audioManager.currentAudio.addEventListener('timeupdate', updateNavOverlayProgress);
      audioManager.currentAudio.addEventListener('loadedmetadata', updateNavOverlayProgress);
      
      // Update immediately
      updateNavOverlayProgress();
    }
  }
  
  // Set up initial tracking
  setupProgressTracking();
  
  // Also set up tracking when audio changes (for next button)
  const originalForward = audioManager.forward;
  audioManager.forward = function() {
    originalForward.call(this);
    setTimeout(setupProgressTracking, 100); // Small delay to ensure audio is loaded
  };
  
  // Restore loop button state based on audio manager setting
  if (loopBtn && audioManager.isLooping) {
    loopBtn.classList.add('active');
  }
  
  // Initial UI update
  updateNavOverlayUI();
  
  // Force an immediate progress update
  updateNavOverlayProgress();
}

function updateNavOverlayUI() {
  if (!audioOverlayElement) return;
  
  const playPauseBtn = document.getElementById('navPlayPause');
  const trackTitle = document.querySelector('.nav-track-title');
  
  if (playPauseBtn) {
    playPauseBtn.innerHTML = audioManager.isPlaying ? 
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' :
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
  }
  
  if (trackTitle && audioManager.currentTrack) {
    trackTitle.textContent = `Work ${audioManager.currentTrack}`;
  }
}

function updateNavOverlayProgress() {
  if (!audioOverlayElement || !audioManager.currentAudio) return;
  
  const progressFill = document.getElementById('navProgressFill');
  const currentTimeEl = document.getElementById('navCurrentTime');
  const durationEl = document.getElementById('navDuration');
  
  const current = audioManager.currentAudio.currentTime;
  const duration = audioManager.currentAudio.duration || 0;
  
  if (progressFill && duration > 0) {
    const progress = (current / duration) * 100;
    progressFill.style.width = `${progress}%`;
  }
  
  if (currentTimeEl) {
    const mins = Math.floor(current / 60);
    const secs = Math.floor(current % 60);
    currentTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  if (durationEl && duration > 0) {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    durationEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// View Functions
function showHome() {
  // Clean up any existing overlays
  cleanupInteractiveMode();
  
  // Show dropdown navigation menu when leaving narrative mode
  const dropdownIcon = document.getElementById('dropdownIcon');
  if (dropdownIcon) {
    dropdownIcon.style.display = 'block';
  }
  
  // Hide wheel navigation when leaving interaction mode
  const wheelNavContainer = document.getElementById('wheelNavContainer');
  if (wheelNavContainer) {
    wheelNavContainer.classList.remove('interaction-mode');
    // Force hide with inline style as backup
    wheelNavContainer.style.display = 'none';
    console.log('Wheel navigation hidden on showHome()');
  }
  
  // Remove full-height class
  mainView.classList.remove('full-height');
  
  mainView.innerHTML = `
    <div class="work-header">
      <h1 class="work-title">Exhibition</h1>
      <p class="work-subtitle">Test app for data visualization wall I</p>
    </div>
    <div class="mode-buttons">
      <button id="narrativeModeBtn" class="glass-mode-button">Narrative</button>
      <button id="interactiveModeBtn" class="glass-mode-button">Patterns</button>
    </div>
  `;
  
  // Set up mode buttons
  document.getElementById('narrativeModeBtn').onclick = () => {
    if (typeof showNarrativeSelect === 'function') {
      showNarrativeSelect();
    } else {
      console.error('showNarrativeSelect not available - player.js may not be loaded');
    }
  };
  document.getElementById('interactiveModeBtn').onclick = () => {
    showInteractive();
  };
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
  
  // Show dropdown navigation menu when leaving narrative mode
  const dropdownIcon = document.getElementById('dropdownIcon');
  if (dropdownIcon) {
    dropdownIcon.style.display = 'block';
  }
  
  // Show wheel navigation for interaction mode
  const wheelNavContainer = document.getElementById('wheelNavContainer');
  if (wheelNavContainer) {
    wheelNavContainer.classList.add('interaction-mode');
    // Force show with inline style as backup
    wheelNavContainer.style.display = 'block';
    
    // Reset wheel to collapsed state for consistent UX
    const wheelContainer = wheelNavContainer.querySelector('.wheel-container');
    if (wheelContainer) {
      wheelContainer.classList.remove('wheel-expanded');
    }
    
    console.log('Wheel navigation shown and reset to collapsed state');
  }
  
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
  
  // Load default audio track so dropdown audio player works on landing page
  if (audioManager && audioManager.loadTrack) {
    audioManager.loadTrack('A'); // Load Work A by default
  }
  
  showHome();
});
