class SoundManager {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.enabled = true
    this.alarmOscillator = null
    this.alarmGain = null
    this.alarmInterval = null
  }

  init() {
    if (this.audioContext) return
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.3
      this.masterGain.connect(this.audioContext.destination)
    } catch (e) {
      console.warn('Web Audio API 不支持:', e)
      this.enabled = false
    }
  }

  playPickup() {
    if (!this.enabled || !this.audioContext) return
    
    const now = this.audioContext.currentTime
    
    const osc1 = this.audioContext.createOscillator()
    const gain1 = this.audioContext.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(200, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
    osc1.connect(gain1)
    gain1.connect(this.masterGain)
    osc1.start(now)
    osc1.stop(now + 0.15)
    
    const osc2 = this.audioContext.createOscillator()
    const gain2 = this.audioContext.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(600, now)
    gain2.gain.setValueAtTime(0.2, now)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    osc2.connect(gain2)
    gain2.connect(this.masterGain)
    osc2.start(now)
    osc2.stop(now + 0.1)
  }

  playAlarm() {
    if (!this.enabled || !this.audioContext) return
    
    const now = this.audioContext.currentTime
    const duration = 0.5
    
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1000, now)
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.setValueAtTime(0.15, now + 0.05)
    gain.gain.setValueAtTime(0, now + 0.15)
    gain.gain.setValueAtTime(0.15, now + 0.25)
    gain.gain.setValueAtTime(0, now + 0.35)
    gain.gain.setValueAtTime(0.15, now + 0.4)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + duration)
  }

  playThrust() {
    if (!this.enabled || !this.audioContext) return
    
    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, now)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  playUpgrade() {
    if (!this.enabled || !this.audioContext) return
    
    const now = this.audioContext.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50]
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.08)
      gain.gain.setValueAtTime(0, now + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2)
      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.2)
    })
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export const soundManager = new SoundManager()
