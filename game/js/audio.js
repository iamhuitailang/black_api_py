const AudioSystem = {
  audioContext: null,
  enabled: true,

  init() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
        this.enabled = false;
      }
    }
  },

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  createTone(frequency, duration, type = 'sine', volume = 0.3, startOffset = 0) {
    if (!this.enabled || !this.audioContext) return;
    this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    const now = this.audioContext.currentTime + startOffset;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + duration / 1000);
  },

  createSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    const now = this.audioContext.currentTime;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration / 1000);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + duration / 1000);
  },

  createNoise(duration, volume = 0.2, filterFreq = null) {
    if (!this.enabled || !this.audioContext) return;
    this.init();
    const bufferSize = this.audioContext.sampleRate * duration / 1000;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    const gain = this.audioContext.createGain();
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    let node = noise;
    if (filterFreq) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      node.connect(filter);
      filter.connect(gain);
    } else {
      node.connect(gain);
    }
    gain.connect(this.audioContext.destination);
    noise.start(now);
    noise.stop(now + duration / 1000);
  },

  playEatNormal() {
    this.createTone(600, 60, 'square', 0.2);
  },

  playEatSpeed() {
    this.createSweep(440, 880, 150, 'sawtooth', 0.25);
  },

  playEatSlow() {
    this.createSweep(1200, 400, 100, 'sine', 0.2);
  },

  playSpeedUp() {
    this.createTone(660, 100, 'triangle', 0.25);
    this.createTone(880, 100, 'triangle', 0.2);
  },

  playDeath() {
    this.createTone(150, 400, 'sawtooth', 0.3);
    this.createNoise(400, 0.15, 300);
  },

  playTeleport() {
    this.createSweep(440, 660, 80, 'sine', 0.2);
  }
};
