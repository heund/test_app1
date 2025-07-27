// Narrative Player Module - Clean Implementation
// Contains only the functioning narrative player code
// Depends on: script2.js (audioManager, mainView, navigate, cleanupInteractiveMode)

function showNarrativeSelect() {
  if (typeof navigate === 'function') {
    navigate(showNarrativePlayer, 'A');
  } else {
    showNarrativePlayer('A');
  }
}

function showNarrativePlayer(currentWork = 'A') {
  // Check for required dependencies
  if (typeof cleanupInteractiveMode === 'function') {
    cleanupInteractiveMode();
  }
  
  // Get mainView element
  const mainView = document.getElementById('mainView') || window.mainView;
  if (!mainView) {
    console.error('mainView element not found');
    return;
  }
  
  // Hide dropdown navigation menu in narrative mode
  const dropdownIcon = document.getElementById('dropdownIcon');
  if (dropdownIcon) {
    dropdownIcon.style.display = 'none';
  }
  
  // Hide wheel navigation when in narrative mode
  const wheelNavContainer = document.getElementById('wheelNavContainer');
  if (wheelNavContainer) {
    wheelNavContainer.classList.remove('interaction-mode');
    // Force hide with inline style as backup
    wheelNavContainer.style.display = 'none';
    console.log('Wheel navigation hidden on showNarrativePlayer()');
  }
  
  // Add full-height class for immersive experience
  mainView.classList.add('full-height');
  
  // Create the unified narrative player interface
  mainView.innerHTML = `
    <div class="narrative-player-unified">
      <div class="narrative-content">
        <div class="work-header">
          <h1 class="work-title">Work ${currentWork}</h1>
          <p class="work-subtitle">Artisan Logic Companion</p>
        </div>
        <div class="narrative-text" id="narrativeText">
          <!-- Large, readable text content will be loaded here -->
        </div>
      </div>
    </div>
    
    <div class="integrated-audio-player">
      <div class="player-header">
        <div class="track-title-main">Work ${currentWork}</div>
        <div class="track-artist-main">Artisan Logic Companion</div>
      </div>
      
      <div class="progress-section">
        <div class="progress-container-main">
          <div class="progress-bar-main">
            <div class="progress-fill-main" id="progressFill"></div>
          </div>
        </div>
        <div class="time-display">
          <span class="current-time" id="currentTime">0:00</span>
          <span class="duration-time" id="durationTime">4:10</span>
        </div>
      </div>
      
      <div class="player-controls-section">
        <div class="main-controls">
          <button id="playBtn" class="control-btn-main">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button id="pauseBtn" class="control-btn-main" style="display:none">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="white">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button id="stopBtn" class="control-btn-main">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
          </button>
          <button id="nextBtn" class="control-btn-main">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="white">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
            </svg>
          </button>
        </div>
        
        <div class="volume-control">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input type="range" id="volumeSlider" class="volume-slider" min="0" max="100" value="75">
        </div>
      </div>
    </div>
  `;
  
  // Load narrative content
  loadNarrativeContent(currentWork);
  
  // Set up audio controls
  setupAudioControls(currentWork);
}

function loadNarrativeContent(work) {
  const narrativeText = document.getElementById('narrativeText');
  
  // Sample content for testing
  const content = `
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    
    <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
    
    <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.</p>
    
    <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
  `;
  
  if (narrativeText) {
    narrativeText.innerHTML = content;
    
    // Set up scroll-based text reveal
    setupScrollReveal();
  }
}

function setupScrollReveal() {
  const narrativeContent = document.querySelector('.narrative-content');
  const paragraphs = document.querySelectorAll('.narrative-text p');
  
  if (!narrativeContent || !paragraphs.length) return;
  
  function checkParagraphVisibility() {
    const viewportHeight = window.innerHeight;
    const revealPoint = viewportHeight * 0.5; // Middle of viewport
    
    paragraphs.forEach(paragraph => {
      const rect = paragraph.getBoundingClientRect();
      const paragraphTop = rect.top;
      
      // Reveal when paragraph reaches middle of viewport
      if (paragraphTop <= revealPoint && !paragraph.classList.contains('revealed')) {
        paragraph.classList.add('revealed');
      }
    });
  }
  
  // Check on scroll
  narrativeContent.addEventListener('scroll', checkParagraphVisibility);
  
  // Check initially
  setTimeout(checkParagraphVisibility, 100);
}

function setupAudioControls(work) {
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const nextBtn = document.getElementById('nextBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const progressFill = document.getElementById('progressFill');
  const currentTimeEl = document.getElementById('currentTime');
  const durationTimeEl = document.getElementById('durationTime');
  
  // Load track in audio manager
  if (typeof audioManager !== 'undefined' && audioManager.loadTrack) {
    audioManager.loadTrack(work);
  } else {
    console.error('audioManager not available - script2.js may not be loaded');
  }
  
  // Set up control handlers
  playBtn.onclick = () => {
    audioManager.play();
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
  };
  
  pauseBtn.onclick = () => {
    audioManager.pause();
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'block';
  };
  
  stopBtn.onclick = () => {
    audioManager.stop();
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'block';
    if (progressFill) progressFill.style.width = '0%';
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
  };
  
  nextBtn.onclick = () => {
    if (typeof audioManager !== 'undefined' && audioManager.forward) {
      audioManager.forward();
      const nextWork = audioManager.currentTrack;
      
      // COMPLETE REBUILD: Recreate the entire narrative section from scratch
      showNarrativePlayer(nextWork);
    } else {
      console.error('audioManager not available for track switching');
    }
  };
  
  // Volume control
  if (volumeSlider) {
    volumeSlider.oninput = (e) => {
      if (audioManager.currentAudio) {
        audioManager.currentAudio.volume = e.target.value / 100;
      }
    };
  }
  
  // Progress tracking
  function updateTimeDisplay() {
    if (audioManager.currentAudio && currentTimeEl && durationTimeEl && progressFill) {
      const current = audioManager.currentAudio.currentTime;
      const duration = audioManager.currentAudio.duration || 0;
      
      // Update time displays
      currentTimeEl.textContent = formatTime(current);
      durationTimeEl.textContent = formatTime(duration);
      
      // Update progress bar
      if (duration > 0) {
        const progress = (current / duration) * 100;
        progressFill.style.width = `${progress}%`;
      }
    }
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Set up time tracking
  if (audioManager.currentAudio) {
    audioManager.currentAudio.addEventListener('timeupdate', updateTimeDisplay);
    audioManager.currentAudio.addEventListener('loadedmetadata', updateTimeDisplay);
  }
  
  // Initial time display update
  updateTimeDisplay();
}
