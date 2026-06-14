class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.heartbeatOscillator = null;
    this.heartbeatGain = null;
    this.heartbeatInterval = null;
  }

  _ensureContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  playFootstep() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }

  playKeyPickup() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const freqs = [880, 1320];
    const duration = 0.15;

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.02);
      osc.stop(ctx.currentTime + duration);
    });
  }

  playDoorOpen() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  startHeartbeat(distance) {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    this.stopHeartbeat();

    const baseInterval = 1000;
    const minInterval = 200;
    const maxDist = 8;
    const normalizedDist = Math.min(distance / maxDist, 1);
    const interval = baseInterval - (baseInterval - minInterval) * (1 - normalizedDist);

    const playBeat = () => {
      if (!this.audioContext) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    };

    playBeat();
    this.heartbeatInterval = setInterval(playBeat, interval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  updateHeartbeat(distance) {
    if (!this.enabled) {
      this.stopHeartbeat();
      return;
    }

    if (distance <= 8) {
      this.startHeartbeat(distance);
    } else {
      this.stopHeartbeat();
    }
  }

  playCaught() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noise = ctx.createBufferSource();

    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.2);
  }

  playVictory() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const notes = [
      { freq: 261.63, duration: 0.2, delay: 0 },
      { freq: 329.63, duration: 0.2, delay: 0.2 },
      { freq: 392.00, duration: 0.2, delay: 0.4 },
      { freq: 523.25, duration: 0.4, delay: 0.6 },
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + note.delay);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.delay + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.delay);
      osc.stop(ctx.currentTime + note.delay + note.duration);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopHeartbeat();
    }
    return this.enabled;
  }

  destroy() {
    this.stopHeartbeat();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
}
