class AudioManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playShoot() {
    this.playTone(800, 0.05, 'square', 0.15);
  }

  playGraze() {
    this.playTone(1200, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(1600, 0.06, 'sine', 0.15), 30);
  }

  playHit() {
    this.playTone(150, 0.2, 'sawtooth', 0.3);
  }

  playBomb() {
    this.playTone(100, 0.5, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(200, 0.4, 'square', 0.3), 50);
    setTimeout(() => this.playTone(300, 0.3, 'sine', 0.2), 100);
  }

  playBossAlert() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(440, 0.2, 'square', 0.3);
        setTimeout(() => this.playTone(880, 0.2, 'square', 0.3), 100);
      }, i * 300);
    }
  }

  playPowerUp() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(400 + i * 100, 0.1, 'sine', 0.2);
      }, i * 50);
    }
  }

  playStageClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.3, 'sine', 0.25), i * 150);
    });
  }

  playGameOver() {
    const notes = [400, 350, 300, 200];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.4, 'sawtooth', 0.25), i * 200);
    });
  }

  playSelect() {
    this.playTone(600, 0.1, 'sine', 0.2);
  }
}

export const audioManager = new AudioManager();
