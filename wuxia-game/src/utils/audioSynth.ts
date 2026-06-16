let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playSwordSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(1200, now)
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.15)

  filter.type = 'highpass'
  filter.frequency.setValueAtTime(800, now)

  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.2)
}

export function playFistSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const noiseGain = ctx.createGain()
  const noiseFilter = ctx.createBiquadFilter()

  const bufferSize = ctx.sampleRate * 0.15
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)

  gain.gain.setValueAtTime(0.4, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.setValueAtTime(600, now)

  noiseGain.gain.setValueAtTime(0.3, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

  osc.connect(gain)
  gain.connect(ctx.destination)

  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.15)
  noise.start(now)
  noise.stop(now + 0.15)
}

export function playNeedleSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(2000, now)
  osc.frequency.exponentialRampToValueAtTime(5000, now + 0.08)
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.15)

  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.15)
}

export function playInnerSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()

  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(220, now)
  osc1.frequency.linearRampToValueAtTime(440, now + 0.3)

  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(330, now)
  osc2.frequency.linearRampToValueAtTime(660, now + 0.3)

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.2, now + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 0.5)
  osc2.stop(now + 0.5)
}

export function playHitSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.setValueAtTime(200, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.08)

  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.1)
}

export function playHealSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, now)
  osc.frequency.linearRampToValueAtTime(1047, now + 0.2)

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.3)
}

export function playVictorySound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now + i * 0.12)
    gain.gain.setValueAtTime(0, now + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.12)
    osc.stop(now + i * 0.12 + 0.3)
  })
}

export function playDefeatSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const notes = [392, 330, 262, 196]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, now + i * 0.18)
    gain.gain.setValueAtTime(0, now + i * 0.18)
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.18 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.18)
    osc.stop(now + i * 0.18 + 0.4)
  })
}

export function playSkillSound(type: 'sword' | 'fist' | 'needle' | 'inner') {
  switch (type) {
    case 'sword':
      playSwordSound()
      break
    case 'fist':
      playFistSound()
      break
    case 'needle':
      playNeedleSound()
      break
    case 'inner':
      playInnerSound()
      break
  }
}
