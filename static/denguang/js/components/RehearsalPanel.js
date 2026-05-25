const RehearsalPanel = {
  name: 'RehearsalPanel',
  template: `
    <div class="rehearsal-panel">
      <div class="rehearsal-header">
        <h2 class="section-title">
          <span class="title-icon">🎬</span>
          彩排演出
        </h2>
      </div>

      <div class="rehearsal-status" v-if="isRehearsing">
        <div class="status-indicator">
          <div class="indicator-dot" :class="{ active: isPlaying }"></div>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <div class="rehearsal-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>
        
        <div class="audio-indicator" v-if="isAudioPlaying">
          <span class="audio-wave">🎵</span>
          <span class="audio-bars">
            <span class="audio-bar" v-for="i in 5" :key="i"></span>
          </span>
        </div>
      </div>

      <div class="rehearsal-controls">
        <button 
          v-if="!isRehearsing"
          class="btn btn-primary btn-large"
          @click="startRehearsal"
          :disabled="!canStart"
        >
          <span class="btn-icon">▶</span>
          开始彩排
        </button>
        <template v-else>
          <button 
            class="btn btn-danger btn-large"
            @click="stopRehearsal"
          >
            <span class="btn-icon">■</span>
            结束彩排
          </button>
        </template>
      </div>

      <div class="score-preview" v-if="showScorePreview && !isRehearsing">
        <h4 class="preview-title">预估评分</h4>
        <div class="score-breakdown">
          <div class="score-item">
            <span class="score-label">音响效果</span>
            <div class="score-bar">
              <div class="score-fill audio" :style="{ width: audioScore + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(audioScore) }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">灯光效果</span>
            <div class="score-bar">
              <div class="score-fill light" :style="{ width: lightScore + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(lightScore) }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">舞台布局</span>
            <div class="score-bar">
              <div class="score-fill layout" :style="{ width: layoutScore + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(layoutScore) }}</span>
          </div>
        </div>
        <div class="total-score">
          <span class="total-label">综合评分</span>
          <span class="total-value" :style="{ color: getScoreColor(totalScore) }">{{ totalScore }}</span>
        </div>
      </div>

      <div class="rehearsal-tips" v-if="!isRehearsing">
        <h4 class="tips-title">💡 彩排提示</h4>
        <ul class="tips-list">
          <li v-for="tip in tips" :key="tip">{{ tip }}</li>
        </ul>
      </div>

      <div class="result-modal" v-if="showResult" @click.self="closeResult">
        <div class="result-content" :class="resultClass">
          <div class="result-header">
            <div class="result-grade" :style="{ color: resultInfo.color }">{{ resultInfo.grade }}</div>
            <h3 class="result-title">{{ resultInfo.text }}</h3>
          </div>
          
          <div class="result-score">
            <div class="score-circle" :style="{ borderColor: resultInfo.color }">
              <span class="score-number">{{ finalScore }}</span>
            </div>
          </div>

          <div class="result-breakdown">
            <div class="result-item">
              <span class="result-label">🎵 音响</span>
              <span class="result-value">{{ Math.round(finalAudioScore) }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">💡 灯光</span>
              <span class="result-value">{{ Math.round(finalLightScore) }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">🎭 布局</span>
              <span class="result-value">{{ Math.round(finalLayoutScore) }}</span>
            </div>
          </div>

          <div class="result-highscore" v-if="isNewHighScore">
            <span class="highscore-icon">🏆</span>
            <span class="highscore-text">新纪录！</span>
          </div>

          <div class="result-unlocks" v-if="unlockedEquipment.length > 0">
            <h4 class="unlocks-title">🎉 解锁新设备</h4>
            <div class="unlocks-list">
              <div v-for="eq in unlockedEquipment" :key="eq.id" class="unlock-item">
                <span class="unlock-icon">{{ eq.icon }}</span>
                <span class="unlock-name">{{ eq.name }}</span>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button class="btn btn-secondary" @click="closeResult">继续调整</button>
            <button class="btn btn-primary" @click="replay">再来一次</button>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    audioParams: Object,
    lightParams: Object,
    placedEquipment: Array,
    currentScene: Object,
    currentGenre: Object,
    highScore: {
      type: Number,
      default: 0
    },
    initialRehearsing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['start', 'stop', 'update-score', 'update-beat', 'update-rehearsing'],
  data() {
    return {
      isRehearsing: this.initialRehearsing,
      progress: 0,
      rehearsalTimer: null,
      statusText: '准备中...',
      isPlaying: false,
      isAudioPlaying: false,
      showScorePreview: true,
      showResult: false,
      finalScore: 0,
      finalAudioScore: 0,
      finalLightScore: 0,
      finalLayoutScore: 0,
      isNewHighScore: false,
      unlockedEquipment: [],
      audioContext: null,
      audioOscillator: null,
      audioGain: null,
      audioInterval: null,
      beatCount: 0,
      startTime: 0,
      genreSoundConfig: {
        pop: {
          kickFreq: 100,
          snareFreq: 200,
          hihatFreq: 8000,
          bassFreq: 80,
          melodyFreq: 440,
          chordFreq: [261, 329, 392],
          rhythmPattern: [1, 0, 1, 0, 1, 0, 1, 0],
          tempoMultiplier: 1.0,
          waveType: 'sine'
        },
        rap: {
          kickFreq: 80,
          snareFreq: 180,
          hihatFreq: 10000,
          bassFreq: 60,
          melodyFreq: 330,
          chordFreq: [220, 261, 329],
          rhythmPattern: [1, 0, 0, 1, 1, 0, 1, 0],
          tempoMultiplier: 0.9,
          waveType: 'square'
        },
        rock: {
          kickFreq: 90,
          snareFreq: 250,
          hihatFreq: 6000,
          bassFreq: 70,
          melodyFreq: 494,
          chordFreq: [196, 246, 329],
          rhythmPattern: [1, 1, 1, 0, 1, 1, 0, 1],
          tempoMultiplier: 1.1,
          waveType: 'sawtooth'
        },
        folk: {
          kickFreq: 120,
          snareFreq: 220,
          hihatFreq: 5000,
          bassFreq: 100,
          melodyFreq: 392,
          chordFreq: [261, 329, 392],
          rhythmPattern: [1, 0, 1, 0, 0, 1, 0, 0],
          tempoMultiplier: 0.7,
          waveType: 'triangle'
        },
        ballad: {
          kickFreq: 110,
          snareFreq: 200,
          hihatFreq: 4000,
          bassFreq: 90,
          melodyFreq: 349,
          chordFreq: [261, 329, 392],
          rhythmPattern: [1, 0, 0, 0, 1, 0, 0, 0],
          tempoMultiplier: 0.6,
          waveType: 'sine'
        },
        classical: {
          kickFreq: 130,
          snareFreq: 180,
          hihatFreq: 3000,
          bassFreq: 110,
          melodyFreq: 440,
          chordFreq: [261, 329, 392, 523],
          rhythmPattern: [1, 0, 1, 0, 1, 0, 0, 0],
          tempoMultiplier: 0.5,
          waveType: 'triangle'
        },
        edm: {
          kickFreq: 70,
          snareFreq: 300,
          hihatFreq: 12000,
          bassFreq: 50,
          melodyFreq: 523,
          chordFreq: [261, 329, 392],
          rhythmPattern: [1, 1, 1, 1, 1, 1, 1, 1],
          tempoMultiplier: 1.2,
          waveType: 'sawtooth'
        },
        dj: {
          kickFreq: 65,
          snareFreq: 280,
          hihatFreq: 11000,
          bassFreq: 45,
          melodyFreq: 466,
          chordFreq: [261, 329, 392, 523],
          rhythmPattern: [1, 0, 1, 1, 1, 0, 1, 1],
          tempoMultiplier: 1.15,
          waveType: 'square'
        }
      }
    }
  },
  watch: {
    initialRehearsing(val) {
      if (val && !this.isRehearsing && this.canStart) {
        this.$nextTick(() => {
          this.startRehearsal()
        })
      }
    }
  },
  computed: {
    canStart() {
      return this.currentScene && this.currentGenre && this.placedEquipment.length > 0
    },
    audioScore() {
      return SCORE_CALCULATOR.calculateAudioScore(
        this.audioParams, 
        this.placedEquipment, 
        this.currentGenre?.id
      )
    },
    lightScore() {
      return SCORE_CALCULATOR.calculateLightScore(
        this.lightParams, 
        this.placedEquipment, 
        this.currentScene, 
        this.currentGenre?.id
      )
    },
    layoutScore() {
      return SCORE_CALCULATOR.calculateLayoutScore(
        this.placedEquipment, 
        window.GAME_DATA.STAGE_LAYOUT
      )
    },
    totalScore() {
      return SCORE_CALCULATOR.calculateOverallScore(
        this.audioScore,
        this.lightScore,
        this.layoutScore
      )
    },
    resultInfo() {
      return SCORE_CALCULATOR.getPerformanceGrade(this.finalScore)
    },
    resultClass() {
      return `grade-${this.resultInfo.grade.toLowerCase()}`
    },
    tips() {
      const tips = []
      if (!this.currentScene) tips.push('请先选择演出场所')
      if (!this.currentGenre) tips.push('请选择演出曲风')
      if (this.placedEquipment.length === 0) tips.push('至少放置一个设备')
      if (this.placedEquipment.length > 0) {
        const hasAudio = this.placedEquipment.some(eq => eq.type === 'audio')
        const hasLight = this.placedEquipment.some(eq => eq.type === 'lighting')
        if (!hasAudio) tips.push('建议添加音响设备以获得更好效果')
        if (!hasLight) tips.push('建议添加灯光设备以获得更好效果')
      }
      if (tips.length === 0) tips.push('一切就绪，开始彩排吧！')
      return tips
    }
  },
  mounted() {
    if (this.initialRehearsing && this.canStart) {
      this.$nextTick(() => {
        this.startRehearsal()
      })
    }
  },
  beforeUnmount() {
    this.stopRehearsal()
    this.cleanupAudio()
  },
  methods: {
    initAudio() {
      if (this.audioContext) return
      
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
        this.audioGain = this.audioContext.createGain()
        this.audioGain.connect(this.audioContext.destination)
        this.audioGain.gain.value = 0
      } catch (e) {
        console.warn('Audio context init failed:', e)
      }
    },

    getGenreConfig() {
      if (!this.currentGenre) return this.genreSoundConfig.pop
      return this.genreSoundConfig[this.currentGenre.id] || this.genreSoundConfig.pop
    },

    playNote(frequency, duration, type, volume, startTime) {
      if (!this.audioContext) return
      
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.type = type
      osc.frequency.value = frequency
      
      gain.gain.setValueAtTime(volume, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      osc.connect(gain)
      gain.connect(this.audioGain)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    },

    playDrum(frequency, duration, type, volume, startTime) {
      if (!this.audioContext) return
      
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.type = type
      osc.frequency.setValueAtTime(frequency, startTime)
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, startTime + duration * 0.5)
      
      filter.type = 'lowpass'
      filter.frequency.value = frequency * 2
      
      gain.gain.setValueAtTime(volume, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.audioGain)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    },

    startAudio() {
      if (!this.audioContext || !this.currentGenre) return
      
      const genre = this.currentGenre
      const config = this.getGenreConfig()
      const baseTempo = genre.tempo || 120
      const tempo = baseTempo * config.tempoMultiplier
      const beatDuration = 60 / tempo
      const stepDuration = beatDuration / 2
      
      const params = this.audioParams || {}
      const volume = (params.volume || 70) / 100
      const bassBoost = (params.bass || 0) / 12
      const trebleBoost = (params.treble || 0) / 12
      
      this.audioGain.gain.value = volume * 0.4
      this.isAudioPlaying = true
      this.beatCount = 0

      const playStep = () => {
        if (!this.isRehearsing || !this.audioContext) return
        
        const stepIndex = this.beatCount % 8
        const isDownbeat = stepIndex === 0
        const now = this.audioContext.currentTime
        
        if (config.rhythmPattern[stepIndex] === 1) {
          if (isDownbeat || stepIndex === 4) {
            const kickVolume = volume * (0.5 + bassBoost * 0.3)
            this.playDrum(config.kickFreq, stepDuration * 0.8, 'sine', kickVolume, now)
          }
          
          if (stepIndex === 2 || stepIndex === 6) {
            const snareVolume = volume * 0.3
            this.playDrum(config.snareFreq, stepDuration * 0.4, 'triangle', snareVolume, now)
          }
          
          const hihatVolume = volume * (0.1 + trebleBoost * 0.1)
          this.playDrum(config.hihatFreq, stepDuration * 0.2, 'square', hihatVolume, now)
        }
        
        if (stepIndex % 2 === 0) {
          const bassVolume = volume * (0.3 + bassBoost * 0.2)
          this.playNote(config.bassFreq, stepDuration * 1.5, 'sine', bassVolume, now)
        }
        
        if (stepIndex % 4 === 0) {
          const melodyVolume = volume * 0.2
          const noteIndex = Math.floor(this.beatCount / 4) % config.chordFreq.length
          this.playNote(config.chordFreq[noteIndex], stepDuration * 2, config.waveType, melodyVolume, now)
        }
        
        if (stepIndex === 0) {
          const leadVolume = volume * 0.15
          this.playNote(config.melodyFreq, beatDuration * 2, config.waveType, leadVolume, now)
        }
        
        this.beatCount++
        
        this.$emit('update-beat', { 
          isDownbeat: isDownbeat, 
          beatCount: this.beatCount,
          stepIndex 
        })
        
        if (window.LIGHT_ENGINE) {
          window.LIGHT_ENGINE.setBeat(isDownbeat, this.beatCount)
        }
      }

      this.audioInterval = setInterval(playStep, stepDuration * 1000)
    },

    stopAudio() {
      this.isAudioPlaying = false
      if (this.audioInterval) {
        clearInterval(this.audioInterval)
        this.audioInterval = null
      }
      if (this.audioGain) {
        this.audioGain.gain.value = 0
      }
    },

    cleanupAudio() {
      this.stopAudio()
      if (this.audioContext) {
        try {
          this.audioContext.close()
        } catch (e) {}
        this.audioContext = null
      }
    },

    startRehearsal() {
      if (!this.canStart) return
      
      this.initAudio()
      
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      this.isRehearsing = true
      this.progress = 0
      this.statusText = '演出开始...'
      this.isPlaying = true
      this.showResult = false
      this.startTime = Date.now()
      
      this.$emit('start')
      this.$emit('update-rehearsing', true)
      this.startAudio()

      const duration = 8000
      
      const updateProgress = () => {
        if (!this.isRehearsing) return
        
        const elapsed = Date.now() - this.startTime
        this.progress = Math.min(100, (elapsed / duration) * 100)
        
        if (this.progress < 20) {
          this.statusText = '🎵 序曲演奏中...'
        } else if (this.progress < 50) {
          this.statusText = '🎸 高潮迭起...'
        } else if (this.progress < 80) {
          this.statusText = '💫 精彩继续...'
        } else {
          this.statusText = '🎭 即将结束...'
        }

        if (this.progress >= 100) {
          this.finishRehearsal()
        } else {
          this.rehearsalTimer = requestAnimationFrame(updateProgress)
        }
      }
      
      this.rehearsalTimer = requestAnimationFrame(updateProgress)
    },

    stopRehearsal() {
      this.isRehearsing = false
      this.isPlaying = false
      this.progress = 0
      this.statusText = '已停止'
      
      this.stopAudio()
      
      if (this.rehearsalTimer) {
        cancelAnimationFrame(this.rehearsalTimer)
        this.rehearsalTimer = null
      }
      
      this.$emit('stop')
      this.$emit('update-rehearsing', false)
    },

    finishRehearsal() {
      if (this.rehearsalTimer) {
        cancelAnimationFrame(this.rehearsalTimer)
        this.rehearsalTimer = null
      }
      
      this.isRehearsing = false
      this.isPlaying = false
      this.progress = 100
      this.statusText = '演出结束'
      
      this.stopAudio()
      
      this.finalAudioScore = this.audioScore
      this.finalLightScore = this.lightScore
      this.finalLayoutScore = this.layoutScore
      this.finalScore = this.totalScore

      this.isNewHighScore = STORAGE.saveHighScore(this.currentScene.id, this.currentGenre.id, this.finalScore)

      this.unlockedEquipment = SCORE_CALCULATOR.checkUnlockConditions(this.finalScore, this.placedEquipment)
      this.unlockedEquipment.forEach(eq => {
        STORAGE.unlockEquipment(eq.id)
      })

      this.showResult = true
      
      this.$emit('update-score', this.finalScore)
      this.$emit('stop')
      this.$emit('update-rehearsing', false)
    },

    closeResult() {
      this.showResult = false
    },

    replay() {
      this.showResult = false
      this.startRehearsal()
    },

    getScoreColor(score) {
      if (score >= 90) return '#ffd700'
      if (score >= 80) return '#ff8c00'
      if (score >= 70) return '#4169e1'
      if (score >= 60) return '#32cd32'
      return '#808080'
    }
  }
}

window.RehearsalPanel = RehearsalPanel
