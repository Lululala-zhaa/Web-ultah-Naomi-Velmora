const CAT_IMAGES = ['cat1.png', 'cat2.png', 'cat3.png', 'cat4.png'];

const bgMusic = document.getElementById('bg-music');
const audioToggle = document.getElementById('audio-toggle');
let musicOn = false;

function tryPlayMusic() {
  bgMusic.volume = 0.35;
  bgMusic.play().then(() => {
    musicOn = true;
    audioToggle.textContent = '🔊';
  }).catch(() => {});
}

window.addEventListener('click', () => {
  if (!musicOn) tryPlayMusic();
}, { once: true });

audioToggle.addEventListener('click', (e) => {
  e.stopPropagation(); 
  if (musicOn) {
    bgMusic.pause();
    musicOn = false;
    audioToggle.textContent = '🔇';
  } else {
    tryPlayMusic();
  }
});

let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(freq = 880, dur = 0.08, type = 'sine', vol = 0.15) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function catchSound() { beep(660, 0.06); setTimeout(() => beep(880, 0.08), 60); setTimeout(() => beep(1100, 0.1), 120); }
function missSound() { beep(200, 0.2, 'sawtooth', 0.1); }

const screenMenu    = document.getElementById('screen-menu');
const screenGame    = document.getElementById('screen-game');
const screenMenang  = document.getElementById('screen-menang');
const gameContainer = document.getElementById('game-container');
const tanganBox     = document.getElementById('tangan-box');
const skorDisplay   = document.getElementById('skor-display');
const progressBar   = document.getElementById('progress-bar');
const comboPill     = document.getElementById('combo-pill');
const comboDisplay  = document.getElementById('combo-display');
const tombolSurat   = document.getElementById('tombol-surat');
const isiSurat      = document.getElementById('isi-surat');
const btnJumpscare  = document.getElementById('btn-jumpscare');
const bsodOverlay   = document.getElementById('bsod-overlay');

let skor = 0, combo = 0, gameAktif = false, spawnInterval;
let keys = { ArrowLeft: false, ArrowRight: false };
let playerX = 270; 
let bsodActive = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
  if (e.key === 'ArrowRight') keys.ArrowRight = true;
  
  if (e.key === 'Escape' && bsodActive) {
    bsodOverlay.style.display = 'none';
    bsodActive = false;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
  if (e.key === 'ArrowRight') keys.ArrowRight = false;
});

function gameLoop() {
  if (!gameAktif) return;

  const speed = 8; 
  if (keys.ArrowLeft) playerX -= speed;
  if (keys.ArrowRight) playerX += speed;

  const maxX = gameContainer.offsetWidth - tanganBox.offsetWidth;
  playerX = Math.max(0, Math.min(playerX, maxX));
  tanganBox.style.left = playerX + 'px';

  requestAnimationFrame(gameLoop);
}

document.getElementById('btn-mulai').addEventListener('click', async (e) => {
  e.stopPropagation(); 
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.log("Fullscreen blocked:", err);
  }

  tryPlayMusic();
  screenMenu.style.display = 'none';
  screenGame.style.display = 'flex';
  gameAktif = true;
  
  requestAnimationFrame(gameLoop);
  spawnInterval = setInterval(spawnCat, 1000);
});

function spawnCat() {
  if (!gameAktif) return;
  const cat = document.createElement('div');
  cat.classList.add('kucing-elem');
  
  const imgSrc = CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
  cat.innerHTML = `<img src="${imgSrc}" alt="Cat">`;

  const maxX = gameContainer.offsetWidth - 56;
  cat.style.left = Math.random() * maxX + 'px';
  cat.style.top  = '-60px';

  gameContainer.appendChild(cat);

  let y = -60;
  const speed = 4 + Math.random() * 2;

  const loop = setInterval(() => {
    if (!gameAktif) { cat.remove(); clearInterval(loop); return; }
    y += speed;
    cat.style.top = y + 'px';

    if (y > gameContainer.offsetHeight - 120) cat.classList.add('wobbly');

    const cR = cat.getBoundingClientRect();
    const tR = tanganBox.getBoundingClientRect();
    if (cR.bottom >= tR.top && cR.top <= tR.bottom &&
        cR.right  >= tR.left && cR.left <= tR.right) {
      caught(cat, loop);
      return;
    }

    if (y > gameContainer.offsetHeight + 10) {
      combo = 0;
      comboPill.style.display = 'none';
      missSound();
      cat.remove();
      clearInterval(loop);
    }
  }, 12);
}

function caught(cat, loop) {
  const rect = cat.getBoundingClientRect();
  const gcRect = gameContainer.getBoundingClientRect();
  const cx = rect.left - gcRect.left + 26;
  const cy = rect.top  - gcRect.top  + 26;

  cat.remove();
  clearInterval(loop);
  catchSound();

  combo++;
  skor++; 
  skorDisplay.textContent = skor;
  progressBar.style.width = (skor / 10 * 100) + '%';

  if (combo > 1) {
    comboPill.style.display = '';
    comboDisplay.textContent = combo;
  }

  const pop = document.createElement('div');
  pop.classList.add('score-pop');
  pop.textContent = combo > 2 ? `+${combo}x!` : '+1';
  pop.style.left = cx + 'px';
  pop.style.top  = cy + 'px';
  gameContainer.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove());

  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.textContent = ['⚡','✨','💥','💖'][Math.floor(Math.random()*4)];
    p.style.left = (cx - 20 + Math.random() * 40) + 'px';
    p.style.top  = (cy - 10) + 'px';
    gameContainer.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  tanganBox.classList.remove('catch-flash');
  void tanganBox.offsetWidth;
  tanganBox.classList.add('catch-flash');

  if (skor >= 10) menang();
}

function menang() {
  gameAktif = false;
  clearInterval(spawnInterval);
  launchConfetti();
  setTimeout(() => {
    screenGame.style.display = 'none';
    screenMenang.style.display = 'block';
  }, 400);
}

tombolSurat.addEventListener('click', () => {
  tombolSurat.classList.add('hidden');
  isiSurat.style.display = 'block';
  beep(523, 0.12); setTimeout(() => beep(659, 0.12), 120); setTimeout(() => beep(784, 0.2), 240);
});

btnJumpscare.addEventListener('click', () => {
  // Matikan musik otomatis saat prank aktif
  if (musicOn) {
    bgMusic.pause();
    musicOn = false;
    audioToggle.textContent = '🔇';
  }

  bsodOverlay.style.display = 'flex';
  bsodActive = true;
  
  for (let i = 0; i < 10; i++) {
    setTimeout(() => beep(120 + Math.random()*350, 0.12, 'sawtooth', 0.25), i * 70);
  }

  let pct = 0;
  const el = document.getElementById('pct');
  function tick() {
    if (!bsodActive) return; 
    if (pct >= 100) return;
    let step = pct < 60 ? (Math.random()*4+1) : pct < 85 ? (Math.random()*1.5+0.2) : 0.1;
    pct = Math.min(100, pct + step);
    el.textContent = Math.floor(pct);
    setTimeout(tick, pct < 60 ? 100 : pct < 85 ? 250 : 500);
  }
  setTimeout(tick, 600);
});

function launchConfetti() {
  const colors = ['#000000','#ff6b9d','#ffdfeb','#ffd700','#00cec9'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('div');
    c.classList.add('confetti-piece');
    c.style.cssText = `
      left:${Math.random()*100}vw;
      top:-20px;
      width:${8 + Math.random()*8}px;
      height:${8 + Math.random()*8}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${1.5 + Math.random()*2}s;
      animation-delay:${Math.random()*0.5}s;
    `;
    document.body.appendChild(c);
    c.addEventListener('animationend', () => c.remove());
  }
}