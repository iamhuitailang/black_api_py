const AUDIO_ENGINE = {
  audioContext: null,
  analyser: null,
  dataArray: null,
  oscillator: null,
  gainNode: null,
  bassFilter: null,
  trebleFilter: null,
  reverbNode: null,
  echoNode: null,
  isPlaying: false,
  currentGenre: null,
  onBeat: null,

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
      this.setupAudioNodes()
      return true
    } catch (e) {
      console.warn('Audio context init failed:', e)
      return false
    }
  },

  setupAudioNodes() {
    if (!this.audioContext) return

    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = 0.7

    this.bassFilter = this.audioContext.createBiquadFilter()
    this.bassFilter.type = 'lowshelf'
    this.bassFilter.frequency.value = 200

    this.trebleFilter = this.audioContext.createBiquadFilter()
    this.trebleFilter.type = 'highshelf'
    this.trebleFilter.frequency.value = 3200

    this.reverbNode = this.audioContext.createConvolver()
    this.reverbNode.buffer = this.createReverbImpulse()

    this.echoNode = this.audioContext.createDelay()
    this.echoNode.delayTime.value = 0.3

    this.connectNodes()
  },

  connectNodes() {
    if (!this.audioContext) return

    if (this.oscillator) {
      this.oscillator.disconnect()
      this.oscillator.connect(this.bassFilter)
    }

    this.bassFilter.connect(this.trebleFilter)
    this.trebleFilter.connect(this.gainNode)
    this.gainNode.connect(this.reverbNode)
    this.reverbNode.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  },

  createReverbImpulse() {
    if (!this.audioContext) return null
    const duration = 2
    const rate = this.audioContext.sampleRate
    const impulse = this.audioContext.createBuffer(2, rate * duration, rate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 2)
      }
    }
    return impulse
  },

  play(genre) {
    if (!this.audioContext && !this.init()) return

    this.stop()
    this.currentGenre = genre
    this.isPlaying = true

    const genreData = window.GAME_DATA.GENRES.find(g => g.id === genre)
    if (!genreData) return

    const tempo = genreData.tempo
    const beatInterval = 60000 / tempo

    this.startBeatLoop(beatInterval)
  },

  startBeatLoop(interval) {
    if (this.beatInterval) clearInterval(this.beatInterval)
    
    let beatCount = 0
    this.beatInterval = setInterval(() => {
      if (!this.isPlaying) return
      
      beatCount++
      if (this.onBeat) {
        this.onBeat(beatCount % 4 === 1, beatCount)
      }
    }, interval)
  },

  stop() {
    this.isPlaying = false
    if (this.beatInterval) {
      clearInterval(this.beatInterval)
      this.beatInterval = null
    }
    this.currentGenre = null
  },

  updateParams(params) {
    if (!this.audioContext) return

    if (this.gainNode) {
      this.gainNode.gain.value = (params.volume || 70) / 100 * 0.8
    }

    if (this.bassFilter) {
      this.bassFilter.gain.value = params.bass || 0
    }

    if (this.trebleFilter) {
      this.trebleFilter.gain.value = params.treble || 0
    }

    if (this.echoNode) {
      this.echoNode.delayTime.value = (params.echo || 20) / 100
    }
  },

  getFrequencyData() {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray)
      return Array.from(this.dataArray)
    }
    return new Array(128).fill(0)
  },

  getLevel() {
    const data = this.getFrequencyData()
    const sum = data.reduce((a, b) => a + b, 0)
    return sum / data.length / 255
  }
}

window.AUDIO_ENGINE = AUDIO_ENGINE
