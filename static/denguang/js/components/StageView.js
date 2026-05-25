const StageView = {
  name: 'StageView',
  template: `
    <div class="stage-view" :style="stageStyle">
      <canvas ref="lightCanvas" class="light-canvas"></canvas>
      
      <div class="ambient-lights" v-if="lightingEquipment.length > 0">
        <div 
          v-for="light in lightingEquipment" 
          :key="light.uid"
          class="ambient-light"
          :class="getLightAnimationClass(light)"
          :style="getLightStyle(light)"
        ></div>
      </div>

      <div class="stage-grid" v-if="showGrid">
        <div class="grid-line horizontal" v-for="i in 5" :key="'h'+i" :style="{ top: i * 20 + '%' }"></div>
        <div class="grid-line vertical" v-for="i in 5" :key="'v'+i" :style="{ left: i * 20 + '%' }"></div>
      </div>

      <div class="stage-zones" v-if="showZones">
        <div class="zone-label front" :style="zoneStyle('front')">前区</div>
        <div class="zone-label center" :style="zoneStyle('center')">中心</div>
        <div class="zone-label back" :style="zoneStyle('back')">后区</div>
        <div class="zone-label left" :style="zoneStyle('left')">左侧</div>
        <div class="zone-label right" :style="zoneStyle('right')">右侧</div>
      </div>

      <div 
        v-for="equipment in placedEquipment" 
        :key="equipment.uid"
        class="stage-equipment"
        :class="{ 
          dragging: draggingId === equipment.uid,
          selected: selectedId === equipment.uid,
          'is-light': equipment.type === 'lighting'
        }"
        :style="getEquipmentStyle(equipment)"
        @mousedown="startDrag($event, equipment)"
        @touchstart="startDrag($event, equipment)"
        @click.stop="selectEquipment(equipment)"
      >
        <div class="equipment-icon">{{ equipment.icon }}</div>
        <div class="equipment-label">{{ equipment.name }}</div>
        <div class="equipment-glow" v-if="equipment.type === 'lighting' && isPlaying" :style="getGlowStyle(equipment)"></div>
        <div v-if="selectedId === equipment.uid" class="equipment-controls">
          <button class="control-btn remove" @click.stop="removeEquipment(equipment)" title="移除">
            ✕
          </button>
        </div>
      </div>

      <div class="stage-info">
        <div class="info-item" v-if="currentScene">
          <span class="info-label">场景:</span>
          <span class="info-value">{{ currentScene.name }}</span>
        </div>
        <div class="info-item" v-if="currentGenre">
          <span class="info-label">曲风:</span>
          <span class="info-value">{{ currentGenre.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">设备数:</span>
          <span class="info-value">{{ placedEquipment.length }}</span>
        </div>
      </div>

      <div class="audio-visualizer" v-if="isPlaying">
        <div 
          v-for="(level, index) in visualizerLevels" 
          :key="index"
          class="viz-bar"
          :style="{ height: level + '%' }"
        ></div>
      </div>

      <div class="beat-indicator" v-if="isPlaying && showBeat">
        <div class="beat-ring"></div>
        <div class="beat-pulse"></div>
      </div>
    </div>
  `,
  props: {
    placedEquipment: {
      type: Array,
      default: () => []
    },
    currentScene: Object,
    currentGenre: Object,
    isPlaying: Boolean,
    showGrid: {
      type: Boolean,
      default: true
    },
    showZones: {
      type: Boolean,
      default: true
    },
    lightParams: Object,
    audioParams: Object
  },
  emits: ['update-equipment', 'remove-equipment', 'select-equipment'],
  data() {
    return {
      draggingId: null,
      selectedId: null,
      dragStartX: 0,
      dragStartY: 0,
      dragOrigX: 0,
      dragOrigY: 0,
      visualizerLevels: Array(24).fill(0),
      showBeat: false,
      beatInterval: null,
      vizInterval: null,
      lightAnimationFrame: null,
      beatTime: 0
    }
  },
  computed: {
    stageStyle() {
      const scene = this.currentScene
      if (!scene) return { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }
      
      const params = this.lightParams || {}
      const brightness = (params.brightness || 80) / 100
      const hue = params.hue || 0
      
      return {
        background: scene.ambientColor,
        boxShadow: `inset 0 0 100px hsla(${hue}, 100%, 50%, ${brightness * 0.3})`,
        filter: `brightness(${0.7 + brightness * 0.3}) hue-rotate(${hue * 0.1}deg)`
      }
    },
    lightingEquipment() {
      return this.placedEquipment.filter(eq => eq.type === 'lighting')
    }
  },
  mounted() {
    this.initCanvas()
    this.startVisualizer()
    this.initLightEngine()
  },
  beforeUnmount() {
    this.stopVisualizer()
    if (this.beatInterval) clearInterval(this.beatInterval)
    if (this.lightAnimationFrame) cancelAnimationFrame(this.lightAnimationFrame)
  },
  watch: {
    isPlaying(val) {
      if (val) {
        this.startBeatAnimation()
      } else {
        this.stopBeatAnimation()
      }
    },
    lightParams: {
      deep: true,
      handler() {
        this.updateLightEngineParams()
      }
    },
    currentScene(val) {
      if (val && window.LIGHT_ENGINE) {
        window.LIGHT_ENGINE.updateScene(val)
      }
    }
  },
  methods: {
    initCanvas() {
      const canvas = this.$refs.lightCanvas
      if (!canvas) return
      
      const resize = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
      
      resize()
      window.addEventListener('resize', resize)
    },

    initLightEngine() {
      if (window.LIGHT_ENGINE && this.currentScene) {
        window.LIGHT_ENGINE.init(this.currentScene, this.lightParams || {})
        
        this.placedEquipment.filter(eq => eq.type === 'lighting').forEach(eq => {
          window.LIGHT_ENGINE.addLight(eq.x, eq.y, eq.id, {
            brightness: this.lightParams?.brightness || 80,
            hue: this.lightParams?.hue || 0,
            size: 40 + (eq.level || 1) * 10
          })
        })
        
        window.LIGHT_ENGINE.startAnimation()
        this.startLightRender()
      }
    },

    updateLightEngineParams() {
      if (window.LIGHT_ENGINE && this.lightParams) {
        window.LIGHT_ENGINE.updateParams(this.lightParams)
      }
    },

    startLightRender() {
      const render = () => {
        if (window.LIGHT_ENGINE && this.$refs.lightCanvas) {
          window.LIGHT_ENGINE.renderLights(this.$refs.lightCanvas)
        }
        this.lightAnimationFrame = requestAnimationFrame(render)
      }
      this.lightAnimationFrame = requestAnimationFrame(render)
    },

    zoneStyle(zone) {
      const zones = window.GAME_DATA.STAGE_LAYOUT.zones
      const z = zones[zone]
      return {
        left: z.x + '%',
        top: z.y + '%',
        width: z.w + '%',
        height: z.h + '%'
      }
    },

    getEquipmentStyle(equipment) {
      return {
        left: equipment.x + '%',
        top: equipment.y + '%',
        zIndex: this.draggingId === equipment.uid ? 100 : 10
      }
    },

    getLightStyle(light) {
      const params = this.lightParams || {}
      const hue = params.hue || 0
      const saturation = params.saturation || 100
      const brightness = (params.brightness || 80) / 100
      const size = 50 + (light.level || 1) * 20
      
      return {
        left: light.x + '%',
        top: light.y + '%',
        width: size + 'px',
        height: size + 'px',
        background: `radial-gradient(circle, hsla(${hue}, ${saturation}%, 60%, ${brightness * 0.8}) 0%, hsla(${hue}, ${saturation}%, 50%, ${brightness * 0.4}) 50%, transparent 70%)`,
        boxShadow: `0 0 ${size / 2}px hsla(${hue}, ${saturation}%, 50%, ${brightness * 0.6})`
      }
    },

    getLightAnimationClass(light) {
      const params = this.lightParams || {}
      const pattern = params.pattern || 0
      const isPlaying = this.isPlaying
      
      const classes = []
      
      if (isPlaying) {
        switch (pattern) {
          case 0: classes.push('static-light'); break
          case 1: classes.push('breathing-light'); break
          case 2: classes.push('strobe-light'); break
          case 3: classes.push('flowing-light'); break
          case 4: classes.push('pulsing-light'); break
        }
      } else {
        classes.push('breathing-light')
      }
      
      if (this.currentScene?.lightPattern === 'beam') {
        classes.push('rainbow-light')
      }
      
      return classes
    },

    getGlowStyle(equipment) {
      const params = this.lightParams || {}
      const hue = params.hue || 0
      const saturation = params.saturation || 100
      const brightness = (params.brightness || 80) / 100
      
      return {
        background: `radial-gradient(circle, hsla(${hue}, ${saturation}%, 60%, ${brightness * 0.5}) 0%, transparent 70%)`,
        boxShadow: `0 0 20px hsla(${hue}, ${saturation}%, 50%, ${brightness * 0.8})`
      }
    },

    startDrag(event, equipment) {
      event.preventDefault()
      
      this.draggingId = equipment.uid
      this.selectedId = equipment.uid
      
      const clientX = event.touches ? event.touches[0].clientX : event.clientX
      const clientY = event.touches ? event.touches[0].clientY : event.clientY
      
      this.dragStartX = clientX
      this.dragStartY = clientY
      this.dragOrigX = equipment.x
      this.dragOrigY = equipment.y

      const moveHandler = (e) => this.onDrag(e, equipment)
      const endHandler = () => this.endDrag(equipment, moveHandler, endHandler)

      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', endHandler)
      document.addEventListener('touchmove', moveHandler, { passive: false })
      document.addEventListener('touchend', endHandler)
    },

    onDrag(event, equipment) {
      if (this.draggingId !== equipment.uid) return
      event.preventDefault()

      const stage = this.$el
      const rect = stage.getBoundingClientRect()
      
      const clientX = event.touches ? event.touches[0].clientX : event.clientX
      const clientY = event.touches ? event.touches[0].clientY : event.clientY

      const dx = ((clientX - this.dragStartX) / rect.width) * 100
      const dy = ((clientY - this.dragStartY) / rect.height) * 100

      let newX = this.dragOrigX + dx
      let newY = this.dragOrigY + dy

      newX = Math.max(5, Math.min(95, newX))
      newY = Math.max(5, Math.min(95, newY))

      equipment.x = newX
      equipment.y = newY

      if (window.LIGHT_ENGINE && equipment.type === 'lighting') {
        const light = window.LIGHT_ENGINE.lights.find(l => l.id === equipment.uid)
        if (light) {
          light.x = newX
          light.y = newY
        }
      }

      this.$emit('update-equipment', equipment)
    },

    endDrag(equipment, moveHandler, endHandler) {
      this.draggingId = null

      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', endHandler)
      document.removeEventListener('touchmove', moveHandler)
      document.removeEventListener('touchend', endHandler)
    },

    selectEquipment(equipment) {
      this.selectedId = equipment.uid
      this.$emit('select-equipment', equipment)
    },

    removeEquipment(equipment) {
      if (window.LIGHT_ENGINE && equipment.type === 'lighting') {
        window.LIGHT_ENGINE.removeLight(equipment.uid)
      }
      
      this.$emit('remove-equipment', equipment)
      if (this.selectedId === equipment.uid) {
        this.selectedId = null
      }
    },

    startVisualizer() {
      this.vizInterval = setInterval(() => {
        if (this.isPlaying) {
          this.visualizerLevels = this.visualizerLevels.map(() => 
            Math.random() * 80 + 20
          )
        } else {
          this.visualizerLevels = this.visualizerLevels.map(v => v * 0.95)
        }
      }, 50)
    },

    stopVisualizer() {
      if (this.vizInterval) {
        clearInterval(this.vizInterval)
        this.vizInterval = null
      }
    },

    startBeatAnimation() {
      this.beatInterval = setInterval(() => {
        this.showBeat = true
        this.beatTime = Date.now()
        setTimeout(() => {
          this.showBeat = false
        }, 150)
      }, 500)
    },

    stopBeatAnimation() {
      if (this.beatInterval) {
        clearInterval(this.beatInterval)
        this.beatInterval = null
      }
      this.showBeat = false
    }
  }
}

window.StageView = StageView
