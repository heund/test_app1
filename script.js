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
  mainView.innerHTML = `
    <h1>Artisan Logic Companion</h1>
    <p>Select a mode:</p>
    <div class='mode-buttons'>
      <button id='narrativeModeBtn'>Narrative Mode</button>
      <button id='interactiveModeBtn'>Interactive Mode</button>
    </div>
  `;
  backBtn.style.display = 'none';
  homeBtn.style.display = 'none';
  document.getElementById('narrativeModeBtn').onclick = () => navigate(showNarrativeSelect);
  document.getElementById('interactiveModeBtn').onclick = () => navigate(showInteractive);
  // Push home view if navStack is empty
  if (navStack.length === 0) navStack.push({viewFn: showHome, args: []});
}

function showNarrativeSelect() {
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

function showInteractive() {
  mainView.innerHTML = `
    <h2>Interactive Mode</h2>
    <div class='interactive-area'>
      <p>Drag the magnifier to search for the hidden spot. Release to select.</p>
      <div class='image-container' style='position:relative;width:100%;max-width:90vw;margin:0 auto;'>
        <canvas id='specCanvas' style='width:100%;height:auto;background:#000;display:block;border-radius:12px;'></canvas>
        <div id='magnifier' style='display:none;position:absolute;pointer-events:none;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px #000;background:rgba(0,0,0,0.2);'></div>
        <div id='resultMsg' style='position:absolute;top:10px;left:50%;transform:translateX(-50%);color:#fff;font-size:1.2em;font-weight:bold;text-shadow:0 0 5px #000;'></div>
      </div>
    </div>
  `;
  backBtn.style.display = 'inline-block';
  homeBtn.style.display = 'inline-block';

  // Responsive canvas setup
  const canvas = document.getElementById('specCanvas');
  const ctx = canvas.getContext('2d');
  const magnifier = document.getElementById('magnifier');
  const resultMsg = document.getElementById('resultMsg');
  const img = new window.Image();
  
  // Setup responsive canvas dimensions
  function setupCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas size to match container with proper DPR
    const displayWidth = containerWidth;
    const displayHeight = displayWidth * (2/3); // 3:2 aspect ratio for better iPad fit
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Set actual canvas resolution (accounting for device pixel ratio)
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    
    // Scale context to match device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    return { displayWidth, displayHeight, devicePixelRatio };
  }
  
  const canvasDimensions = setupCanvas();
  
  img.src = 'spec1.png';
  img.onload = () => {
    // Draw image to fill canvas while maintaining aspect ratio
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasDimensions.displayWidth / canvasDimensions.displayHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgAspect > canvasAspect) {
      // Image is wider - fit to height
      drawHeight = canvasDimensions.displayHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasDimensions.displayWidth - drawWidth) / 2;
    } else {
      // Image is taller - fit to width
      drawWidth = canvasDimensions.displayWidth;
      drawHeight = drawWidth / imgAspect;
      offsetY = (canvasDimensions.displayHeight - drawHeight) / 2;
    }
    
    ctx.clearRect(0, 0, canvasDimensions.displayWidth, canvasDimensions.displayHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };
  
  let dragging = false, mx = 0, my = 0;
  // Responsive magnifier size based on canvas size
  const magRadius = Math.min(canvasDimensions.displayWidth, canvasDimensions.displayHeight) * 0.08; // 8% of smaller dimension
  const magZoom = 2;
  
  // Demo: hidden area - make it proportional to canvas size
  const hiddenX = canvasDimensions.displayWidth * 0.6;
  const hiddenY = canvasDimensions.displayHeight * 0.4;
  const hiddenR = magRadius * 0.6;

  function showMagnifier(x, y) {
    magnifier.style.display = 'block';
    magnifier.style.width = magnifier.style.height = magRadius*2 + 'px';
    magnifier.style.left = (x/canvasDimensions.displayWidth*canvas.offsetWidth-magRadius) + 'px';
    magnifier.style.top = (y/canvasDimensions.displayHeight*canvas.offsetHeight-magRadius) + 'px';
    
    // Redraw the base image with proper aspect ratio
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasDimensions.displayWidth / canvasDimensions.displayHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgAspect > canvasAspect) {
      drawHeight = canvasDimensions.displayHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasDimensions.displayWidth - drawWidth) / 2;
    } else {
      drawWidth = canvasDimensions.displayWidth;
      drawHeight = drawWidth / imgAspect;
      offsetY = (canvasDimensions.displayHeight - drawHeight) / 2;
    }
    
    ctx.clearRect(0, 0, canvasDimensions.displayWidth, canvasDimensions.displayHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // Create perfect circular magnified area (no aspect ratio compensation needed)
    ctx.save();
    
    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(x, y, magRadius, 0, 2*Math.PI);
    ctx.clip();
    
    // Calculate the source area to magnify
    const sourceRadius = magRadius / magZoom;
    const sourceX = x - sourceRadius;
    const sourceY = y - sourceRadius;
    const sourceSize = sourceRadius * 2;
    
    // Draw the magnified portion
    const destX = x - magRadius;
    const destY = y - magRadius;
    const destSize = magRadius * 2;
    
    ctx.drawImage(
      img,
      // Source coordinates relative to original image
      (sourceX - offsetX) * (img.width / drawWidth), 
      (sourceY - offsetY) * (img.height / drawHeight),
      sourceSize * (img.width / drawWidth),
      sourceSize * (img.height / drawHeight),
      // Destination coordinates on canvas
      destX, destY, destSize, destSize
    );
    
    ctx.restore();
    
    // Draw perfect circular border
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, magRadius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.restore();
  }
  
  function hideMagnifier() {
    magnifier.style.display = 'none';
    
    // Redraw the base image with proper aspect ratio
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasDimensions.displayWidth / canvasDimensions.displayHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgAspect > canvasAspect) {
      drawHeight = canvasDimensions.displayHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasDimensions.displayWidth - drawWidth) / 2;
    } else {
      drawWidth = canvasDimensions.displayWidth;
      drawHeight = drawWidth / imgAspect;
      offsetY = (canvasDimensions.displayHeight - drawHeight) / 2;
    }
    
    ctx.clearRect(0, 0, canvasDimensions.displayWidth, canvasDimensions.displayHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
  
  function checkFound(x, y) {
    // Check if (x, y) is inside the hidden circle
    return Math.sqrt((x-hiddenX)**2 + (y-hiddenY)**2) < hiddenR;
  }
  
  // Get responsive coordinates from touch/mouse events
  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasDimensions.displayWidth / rect.width;
    const scaleY = canvasDimensions.displayHeight / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  
  canvas.addEventListener('pointerdown', e => {
    dragging = true;
    const coords = getCanvasCoordinates(e);
    mx = coords.x;
    my = coords.y;
    showMagnifier(mx, my);
  });
  
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const coords = getCanvasCoordinates(e);
    mx = coords.x;
    my = coords.y;
    showMagnifier(mx, my);
  });
  
  canvas.addEventListener('pointerup', e => {
    dragging = false;
    hideMagnifier();
    const coords = getCanvasCoordinates(e);
    mx = coords.x;
    my = coords.y;
    if (checkFound(mx, my)) {
      resultMsg.textContent = 'You found it!';
    } else {
      resultMsg.textContent = 'Try again!';
    }
    setTimeout(()=>{resultMsg.textContent='';}, 1200);
  });
  
  canvas.addEventListener('pointerleave', e => {
    dragging = false;
    hideMagnifier();
  });
  
  // Handle window resize for responsive behavior
  window.addEventListener('resize', () => {
    const newDimensions = setupCanvas();
    Object.assign(canvasDimensions, newDimensions);
    
    // Redraw image with new dimensions
    if (img.complete) {
      hideMagnifier(); // This will redraw the image
    }
  });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  navStack.length = 0;
  showHome();
});
