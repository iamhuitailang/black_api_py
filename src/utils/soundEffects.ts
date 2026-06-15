let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function createNoiseBuffer(ctx: AudioContext, duration: number, decayRate: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * decayRate));
  }
  return buffer;
}

export function playGunshot(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const noiseBuffer = createNoiseBuffer(ctx, 0.12, 0.12);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    const highNoiseBuffer = createNoiseBuffer(ctx, 0.03, 0.05);
    const highNoise = ctx.createBufferSource();
    highNoise.buffer = highNoiseBuffer;

    const highGain = ctx.createGain();
    highGain.gain.setValueAtTime(0.3, now);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    const highFilter = ctx.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.value = 4000;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
    }
    distortion.curve = curve;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(distortion);
    distortion.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);

    highNoise.connect(highFilter);
    highFilter.connect(highGain);
    highGain.connect(ctx.destination);
    highNoise.start(now);
    highNoise.stop(now + 0.03);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    console.warn('Audio not supported');
  }
}

export function playHeadshot(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const crackBuffer = createNoiseBuffer(ctx, 0.08, 0.1);
    const crack = ctx.createBufferSource();
    crack.buffer = crackBuffer;

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(5000, now);
    crackFilter.Q.value = 2;

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.6, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(now);
    crack.stop(now + 0.08);

    const splatOsc = ctx.createOscillator();
    splatOsc.type = 'sawtooth';
    splatOsc.frequency.setValueAtTime(1200, now);
    splatOsc.frequency.exponentialRampToValueAtTime(100, now + 0.06);

    const splatGain = ctx.createGain();
    splatGain.gain.setValueAtTime(0.25, now);
    splatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    splatOsc.connect(splatGain);
    splatGain.connect(ctx.destination);
    splatOsc.start(now);
    splatOsc.stop(now + 0.06);

    const crunchOsc = ctx.createOscillator();
    crunchOsc.type = 'square';
    crunchOsc.frequency.setValueAtTime(400, now + 0.02);
    crunchOsc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

    const crunchGain = ctx.createGain();
    crunchGain.gain.setValueAtTime(0, now);
    crunchGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    crunchOsc.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunchOsc.start(now + 0.02);
    crunchOsc.stop(now + 0.07);
  } catch {
    console.warn('Audio not supported');
  }
}

export function playReloadOut(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const clickBuffer = createNoiseBuffer(ctx, 0.04, 0.1);
    const click = ctx.createBufferSource();
    click.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = 2000;
    clickFilter.Q.value = 3;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.04);

    const metalOsc = ctx.createOscillator();
    metalOsc.type = 'square';
    metalOsc.frequency.setValueAtTime(800, now);
    metalOsc.frequency.linearRampToValueAtTime(400, now + 0.08);

    const metalGain = ctx.createGain();
    metalGain.gain.setValueAtTime(0.2, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    metalOsc.connect(metalGain);
    metalGain.connect(ctx.destination);
    metalOsc.start(now);
    metalOsc.stop(now + 0.08);

    const slideOsc = ctx.createOscillator();
    slideOsc.type = 'sawtooth';
    slideOsc.frequency.setValueAtTime(500, now + 0.05);
    slideOsc.frequency.linearRampToValueAtTime(200, now + 0.15);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0, now);
    slideGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    slideOsc.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideOsc.start(now + 0.05);
    slideOsc.stop(now + 0.15);
  } catch {
    console.warn('Audio not supported');
  }
}

export function playReloadIn(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const clickBuffer = createNoiseBuffer(ctx, 0.03, 0.08);
    const click = ctx.createBufferSource();
    click.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = 3000;
    clickFilter.Q.value = 2;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.03);

    const snapOsc = ctx.createOscillator();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(300, now);
    snapOsc.frequency.linearRampToValueAtTime(600, now + 0.05);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.25, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.05);

    const rackOsc = ctx.createOscillator();
    rackOsc.type = 'triangle';
    rackOsc.frequency.setValueAtTime(150, now + 0.04);
    rackOsc.frequency.linearRampToValueAtTime(400, now + 0.07);

    const rackGain = ctx.createGain();
    rackGain.gain.setValueAtTime(0, now);
    rackGain.gain.linearRampToValueAtTime(0.15, now + 0.04);
    rackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    rackOsc.connect(rackGain);
    rackGain.connect(ctx.destination);
    rackOsc.start(now + 0.04);
    rackOsc.stop(now + 0.07);
  } catch {
    console.warn('Audio not supported');
  }
}

export function playZombieGroan(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const baseFreq = 80 + Math.random() * 40;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.linearRampToValueAtTime(baseFreq - 20, now + 0.15);
    osc1.frequency.linearRampToValueAtTime(baseFreq + 10, now + 0.3);
    osc1.frequency.linearRampToValueAtTime(baseFreq - 30, now + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(250, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.2);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.1);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.4);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch {
    console.warn('Audio not supported');
  }
}

export function playAlarm(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + i * 0.15);
      osc.frequency.setValueAtTime(660, now + i * 0.15 + 0.05);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.02);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.07);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.12);

      const distortion = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let j = 0; j < 256; j++) {
        const x = (j * 2) / 256 - 1;
        curve[j] = (Math.PI + 2) * x / (Math.PI + 2 * Math.abs(x));
      }
      distortion.curve = curve;

      osc.connect(gain);
      gain.connect(distortion);
      distortion.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.12);
    }
  } catch {
    console.warn('Audio not supported');
  }
}

export function playEmptyClick(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const clickBuffer = createNoiseBuffer(ctx, 0.02, 0.05);
    const click = ctx.createBufferSource();
    click.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 2000;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.02);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.08, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    console.warn('Audio not supported');
  }
}

export function playWaveStart(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [330, 440, 554, 660];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  } catch {
    console.warn('Audio not supported');
  }
}

export function playVictory(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now + i * 0.15);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, now + i * 0.15);
      gain2.gain.linearRampToValueAtTime(0.05, now + i * 0.15 + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + i * 0.15);
      osc2.stop(now + i * 0.15 + 0.3);
    });
  } catch {
    console.warn('Audio not supported');
  }
}

export function playGameOver(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [440, 392, 349.23, 293.66, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now + i * 0.25);
      filter.frequency.linearRampToValueAtTime(300, now + i * 0.25 + 0.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.25 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.35);
    });
  } catch {
    console.warn('Audio not supported');
  }
}
