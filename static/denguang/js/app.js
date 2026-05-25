const app = Vue.createApp({
  template: `
    <div class="app-container" :class="{ 'is-playing': isRehearsing }">
      <header class="app-header">
        <div class="header-left">
          <h1 class="app-title">
            <span class="title-icon">🎛️</span>
            灯光音响工作室
          </h1>
          <p class="app-subtitle">调配舞台灯光、调试音响音效，打造完美演艺现场</p>
        </div>
        <div class="header-right">
          <div class="score-display" v-if="highScore > 0">
            <span class="score-label">🏆 最高分</span>
            <span class="score-value">{{ highScore }}</span>
          </div>
          <button class="btn btn-icon" @click="resetGame" title="重置游戏">
            🔄
          </button>
        </div>
      </header>

      <main class="app-main">
        <div class="main-layout">
          <aside class="left-panel">
            <scene-selector 
              :current-scene-id="currentSceneId"
              :current-genre-id="currentGenreId"
              @select-scene="handleSelectScene"
              @select-genre="handleSelectGenre"
            />
          </aside>

          <section class="center-panel">
            <stage-view 
              :placed-equipment="placedEquipment"
              :current-scene="currentScene"
              :current-genre="currentGenre"
              :is-playing="isRehearsing"
              :light-params="lightParams"
              :audio-params="audioParams"
              @update-equipment="handleUpdateEquipment"
              @remove-equipment="handleRemoveEquipment"
              @select-equipment="handleSelectEquipment"
            />
          </section>

          <aside class="right-panel">
            <div class="panel-tabs">
              <button 
                class="panel-tab" 
                :class="{ active: activePanel === 'equipment' }"
                @click="activePanel = 'equipment'"
              >
                🎛️ 设备
              </button>
              <button 
                class="panel-tab" 
                :class="{ active: activePanel === 'control' }"
                @click="activePanel = 'control'"
              >
                ⚙️ 控制
              </button>
              <button 
                class="panel-tab" 
                :class="{ active: activePanel === 'rehearsal' }"
                @click="activePanel = 'rehearsal'"
              >
                🎬 彩排
              </button>
            </div>

            <div class="panel-content">
              <equipment-panel 
                v-if="activePanel === 'equipment'"
                :selected-equipment="placedEquipment"
                :unlocked-ids="unlockedEquipmentIds"
                :high-score="highScore"
                @add-equipment="handleAddEquipment"
                @remove-equipment="handleRemoveEquipmentFromPanel"
              />

              <control-panel 
                v-if="activePanel === 'control'"
                :audio-params="audioParams"
                :light-params="lightParams"
                @update-audio="handleUpdateAudio"
                @update-light="handleUpdateLight"
              />

              <rehearsal-panel 
                v-if="activePanel === 'rehearsal'"
                :audio-params="audioParams"
                :light-params="lightParams"
                :placed-equipment="placedEquipment"
                :current-scene="currentScene"
                :current-genre="currentGenre"
                :high-score="highScore"
                :initial-rehearsing="isRehearsing"
                @start="handleRehearsalStart"
                @stop="handleRehearsalStop"
                @update-score="handleUpdateScore"
                @update-rehearsing="handleUpdateRehearsing"
              />
            </div>
          </aside>
        </div>
      </main>

      <footer class="app-footer">
        <div class="footer-info">
          <span class="info-item">📍 场景: {{ currentScene?.name || '未选择' }}</span>
          <span class="info-item">🎵 曲风: {{ currentGenre?.name || '未选择' }}</span>
          <span class="info-item">🎛️ 设备: {{ placedEquipment.length }}</span>
          <span class="info-item">🏆 最高分: {{ highScore }}</span>
        </div>
      </footer>

      <div class="toast-container">
        <transition-group name="toast">
          <div 
            v-for="toast in toasts" 
            :key="toast.id"
            class="toast"
            :class="toast.type"
          >
            {{ toast.message }}
          </div>
        </transition-group>
      </div>
    </div>
  `,
  data() {
    return {
      currentSceneId: null,
      currentGenreId: null,
      placedEquipment: [],
      audioParams: {
        volume: 70,
        bass: 0,
        treble: 0,
        mid: 0,
        reverb: 30,
        echo: 20
      },
      lightParams: {
        brightness: 80,
        hue: 0,
        saturation: 100,
        speed: 50,
        pattern: 0
      },
      activePanel: 'equipment',
      isRehearsing: false,
      highScore: 0,
      unlockedEquipmentIds: [],
      toasts: [],
      selectedEquipment: null
    }
  },
  computed: {
    currentScene() {
      return window.GAME_DATA.SCENES.find(s => s.id === this.currentSceneId)
    },
    currentGenre() {
      return window.GAME_DATA.GENRES.find(g => g.id === this.currentGenreId)
    }
  },
  watch: {
    isRehearsing(val) {
      this.saveGameState()
    },
    activePanel(val) {
      this.saveGameState()
    }
  },
  mounted() {
    this.loadGameState()
    this.updateHighScore()
    this.loadUnlockedEquipment()
    this.initLightEngineOnLoad()
  },
  methods: {
    loadGameState() {
      const savedState = STORAGE.loadGameState()
      if (savedState) {
        this.currentSceneId = savedState.currentSceneId
        this.currentGenreId = savedState.currentGenreId
        this.placedEquipment = savedState.placedEquipment || []
        this.audioParams = { ...this.audioParams, ...savedState.audioParams }
        this.lightParams = { ...this.lightParams, ...savedState.lightParams }
        this.isRehearsing = savedState.isRehearsing || false
        this.activePanel = this.isRehearsing ? 'rehearsal' : (savedState.activePanel || 'equipment')
      }
    },

    saveGameState() {
      const state = {
        currentSceneId: this.currentSceneId,
        currentGenreId: this.currentGenreId,
        placedEquipment: this.placedEquipment,
        audioParams: this.audioParams,
        lightParams: this.lightParams,
        activePanel: this.activePanel,
        isRehearsing: this.isRehearsing
      }
      STORAGE.saveGameState(state)
    },

    initLightEngineOnLoad() {
      if (window.LIGHT_ENGINE && this.currentScene) {
        this.$nextTick(() => {
          window.LIGHT_ENGINE.init(this.currentScene, this.lightParams)
          
          this.placedEquipment.filter(eq => eq.type === 'lighting').forEach(eq => {
            window.LIGHT_ENGINE.addLight(eq.x, eq.y, eq.uid, {
              brightness: this.lightParams.brightness,
              hue: this.lightParams.hue,
              size: 40 + (eq.level || 1) * 10
            })
          })
          
          window.LIGHT_ENGINE.startAnimation()
        })
      }
    },

    updateHighScore() {
      const scores = STORAGE.getAllHighScores()
      const allScores = Object.values(scores)
      this.highScore = allScores.length > 0 ? Math.max(...allScores) : 0
    },

    loadUnlockedEquipment() {
      this.unlockedEquipmentIds = STORAGE.getUnlockedEquipment()
    },

    handleSelectScene(scene) {
      this.currentSceneId = scene.id
      
      if (scene.genres && scene.genres.length > 0) {
        const genre = window.GAME_DATA.GENRES.find(g => g.name === scene.genres[0])
        if (genre) {
          this.currentGenreId = genre.id
        }
      }

      this.applyScenePreset(scene)

      this.showToast(`已选择 ${scene.name}`, 'success')
      this.saveGameState()
    },

    handleSelectGenre(genre) {
      this.currentGenreId = genre.id
      
      if (this.currentScene && !this.currentScene.genres.includes(genre.name)) {
        this.showToast(`注意：${genre.name} 与 ${this.currentScene.name} 不完全匹配`, 'warning')
      } else {
        this.showToast(`已选择 ${genre.name}`, 'success')
      }

      this.applyGenrePreset(genre)
      this.saveGameState()
    },

    applyScenePreset(scene) {
      const presets = {
        livehouse: { light: { hue: 200, pattern: 2 } },
        outdoor: { light: { hue: 30, pattern: 1 } },
        banquet: { light: { hue: 50, pattern: 0 } },
        club: { light: { hue: 280, pattern: 3 } }
      }

      const preset = presets[scene.id]
      if (preset) {
        this.lightParams = { ...this.lightParams, ...preset.light }
      }
    },

    applyGenrePreset(genre) {
      const presets = {
        pop: { audio: { volume: 75, bass: 4, treble: 2 } },
        rap: { audio: { volume: 85, bass: 6, treble: 4 } },
        rock: { audio: { volume: 90, bass: 8, treble: 3 } },
        folk: { audio: { volume: 70, bass: 0, treble: 4 } },
        ballad: { audio: { volume: 65, bass: -2, treble: 3 } },
        classical: { audio: { volume: 60, bass: -4, treble: 6 } },
        edm: { audio: { volume: 95, bass: 10, treble: 2 } },
        dj: { audio: { volume: 92, bass: 9, treble: 1 } }
      }

      const preset = presets[genre.id]
      if (preset) {
        this.audioParams = { ...this.audioParams, ...preset.audio }
      }
    },

    handleAddEquipment(item) {
      const category = this.getEquipmentCategory(item.id)
      const existingCount = this.placedEquipment.filter(eq => eq.type === category).length

      if (existingCount >= 8) {
        this.showToast('该类别设备已达上限', 'warning')
        return
      }

      const positions = {
        audio: [
          { x: 20, y: 50 }, { x: 80, y: 50 }, { x: 30, y: 70 },
          { x: 70, y: 70 }, { x: 15, y: 35 }, { x: 85, y: 35 },
          { x: 25, y: 85 }, { x: 75, y: 85 }
        ],
        lighting: [
          { x: 30, y: 15 }, { x: 50, y: 10 }, { x: 70, y: 15 },
          { x: 15, y: 25 }, { x: 85, y: 25 }, { x: 40, y: 20 },
          { x: 60, y: 20 }, { x: 50, y: 5 }
        ],
        props: [
          { x: 50, y: 50 }, { x: 35, y: 60 }, { x: 65, y: 60 },
          { x: 40, y: 45 }, { x: 60, y: 45 }, { x: 50, y: 70 },
          { x: 30, y: 55 }, { x: 70, y: 55 }
        ]
      }

      const categoryPositions = positions[category] || positions.audio
      const usedPositions = this.placedEquipment
        .filter(eq => eq.type === category)
        .map(eq => ({ x: eq.x, y: eq.y }))
      
      let targetPosition = categoryPositions[existingCount % categoryPositions.length]
      
      for (const pos of categoryPositions) {
        const isUsed = usedPositions.some(used => 
          Math.abs(used.x - pos.x) < 10 && Math.abs(used.y - pos.y) < 10
        )
        if (!isUsed) {
          targetPosition = pos
          break
        }
      }

      const equipment = {
        ...item,
        uid: Date.now() + Math.random(),
        type: category,
        x: targetPosition.x,
        y: targetPosition.y
      }

      this.placedEquipment.push(equipment)
      
      if (category === 'lighting' && window.LIGHT_ENGINE) {
        window.LIGHT_ENGINE.addLight(equipment.x, equipment.y, equipment.uid, {
          brightness: this.lightParams.brightness,
          hue: this.lightParams.hue,
          size: 40 + (equipment.level || 1) * 10
        })
      }
      
      this.showToast(`已添加 ${item.name}`, 'success')
      this.saveGameState()
    },

    handleRemoveEquipmentFromPanel(item) {
      const index = this.placedEquipment.findIndex(eq => eq.id === item.id)
      if (index !== -1) {
        this.placedEquipment.splice(index, 1)
        this.showToast(`已移除 ${item.name}`, 'info')
        this.saveGameState()
      }
    },

    handleRemoveEquipment(equipment) {
      const index = this.placedEquipment.findIndex(eq => eq.uid === equipment.uid)
      if (index !== -1) {
        this.placedEquipment.splice(index, 1)
        this.showToast(`已移除 ${equipment.name}`, 'info')
        this.saveGameState()
      }
    },

    handleUpdateEquipment(equipment) {
      const index = this.placedEquipment.findIndex(eq => eq.uid === equipment.uid)
      if (index !== -1) {
        this.placedEquipment.splice(index, 1, { ...equipment })
        this.saveGameState()
      }
    },

    handleSelectEquipment(equipment) {
      this.selectedEquipment = equipment
    },

    getEquipmentCategory(itemId) {
      const categories = window.GAME_DATA.EQUIPMENT_CATEGORIES
      for (const [key, cat] of Object.entries(categories)) {
        if (cat.items.some(item => item.id === itemId)) {
          return key
        }
      }
      return 'audio'
    },

    handleUpdateAudio(params) {
      this.audioParams = { ...this.audioParams, ...params }
      this.saveGameState()
    },

    handleUpdateLight(params) {
      this.lightParams = { ...this.lightParams, ...params }
      this.saveGameState()
    },

    handleRehearsalStart() {
      this.isRehearsing = true
      this.saveGameState()
      
      if (window.LIGHT_ENGINE && this.currentScene) {
        window.LIGHT_ENGINE.init(this.currentScene, this.lightParams)
        this.placedEquipment.filter(eq => eq.type === 'lighting').forEach(eq => {
          window.LIGHT_ENGINE.addLight(eq.x, eq.y, eq.uid, {
            brightness: this.lightParams.brightness,
            hue: this.lightParams.hue,
            size: 40 + (eq.level || 1) * 10
          })
        })
        window.LIGHT_ENGINE.startAnimation()
      }
    },

    handleRehearsalStop() {
      this.isRehearsing = false
      this.saveGameState()
      
      if (window.LIGHT_ENGINE) {
        window.LIGHT_ENGINE.stopAnimation()
      }
    },

    handleUpdateRehearsing(isRehearsing) {
      this.isRehearsing = isRehearsing
      this.saveGameState()
    },

    handleUpdateScore(score) {
      this.updateHighScore()
      this.loadUnlockedEquipment()
    },

    resetGame() {
      if (confirm('确定要重置游戏吗？所有进度将被清除。')) {
        STORAGE.remove(STORAGE_KEYS.GAME_STATE)
        STORAGE.remove(STORAGE_KEYS.HIGH_SCORES)
        STORAGE.remove(STORAGE_KEYS.UNLOCKED_EQUIPMENT)
        
        this.currentSceneId = null
        this.currentGenreId = null
        this.placedEquipment = []
        this.audioParams = {
          volume: 70, bass: 0, treble: 0, mid: 0, reverb: 30, echo: 20
        }
        this.lightParams = {
          brightness: 80, hue: 0, saturation: 100, speed: 50, pattern: 0
        }
        this.highScore = 0
        this.unlockedEquipmentIds = []
        
        this.showToast('游戏已重置', 'info')
      }
    },

    showToast(message, type = 'info') {
      const toast = {
        id: Date.now() + Math.random(),
        message,
        type
      }
      this.toasts.push(toast)
      
      setTimeout(() => {
        const index = this.toasts.findIndex(t => t.id === toast.id)
        if (index !== -1) {
          this.toasts.splice(index, 1)
        }
      }, 3000)
    }
  }
})

app.component('scene-selector', window.SceneSelector)
app.component('equipment-panel', window.EquipmentPanel)
app.component('stage-view', window.StageView)
app.component('control-panel', window.ControlPanel)
app.component('rehearsal-panel', window.RehearsalPanel)

app.mount('#app')
