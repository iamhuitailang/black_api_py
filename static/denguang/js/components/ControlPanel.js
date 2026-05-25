const ControlPanel = {
  name: 'ControlPanel',
  template: `
    <div class="control-panel">
      <div class="control-tabs">
        <div 
          class="control-tab" 
          :class="{ active: activeTab === 'audio' }"
          @click="activeTab = 'audio'"
        >
          🔊 音响控制
        </div>
        <div 
          class="control-tab" 
          :class="{ active: activeTab === 'light' }"
          @click="activeTab = 'light'"
        >
          💡 灯光控制
        </div>
      </div>

      <div class="control-content" v-show="activeTab === 'audio'">
        <div class="param-group">
          <div 
            v-for="(param, key) in audioParams" 
            :key="key"
            class="param-item"
          >
            <div class="param-header">
              <span class="param-label">{{ paramDefs[key]?.label || key }}</span>
              <span class="param-value">{{ audioParams[key] }}{{ getUnit(key) }}</span>
            </div>
            <div class="slider-container">
              <input 
                type="range"
                :min="paramDefs[key]?.min || 0"
                :max="paramDefs[key]?.max || 100"
                :step="paramDefs[key]?.step || 1"
                :value="audioParams[key]"
                @input="updateAudioParam(key, $event.target.value)"
                class="param-slider"
              />
              <div class="slider-track">
                <div class="slider-fill" :style="getSliderFill(key, audioParams[key])"></div>
              </div>
            </div>
            <div class="param-marks">
              <span>{{ paramDefs[key]?.min }}</span>
              <span>{{ paramDefs[key]?.max }}</span>
            </div>
          </div>
        </div>

        <div class="preset-group">
          <h4 class="preset-title">快速预设</h4>
          <div class="preset-buttons">
            <button 
              v-for="preset in audioPresets" 
              :key="preset.name"
              class="preset-btn"
              @click="applyAudioPreset(preset)"
            >
              {{ preset.icon }} {{ preset.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="control-content" v-show="activeTab === 'light'">
        <div class="param-group">
          <div 
            v-for="(param, key) in lightParams" 
            :key="key"
            class="param-item"
          >
            <div class="param-header">
              <span class="param-label">{{ lightParamDefs[key]?.label || key }}</span>
              <span class="param-value">
                {{ key === 'pattern' ? lightParamDefs.pattern.options[lightParams[key]] : lightParams[key] }}{{ key === 'pattern' ? '' : getLightUnit(key) }}
              </span>
            </div>
            <div class="slider-container">
              <input 
                type="range"
                :min="lightParamDefs[key]?.min || 0"
                :max="lightParamDefs[key]?.max || 100"
                :step="lightParamDefs[key]?.step || 1"
                :value="lightParams[key]"
                @input="updateLightParam(key, $event.target.value)"
                class="param-slider"
                :style="{ background: key === 'hue' ? 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' : '' }"
              />
              <div class="slider-track">
                <div 
                  class="slider-fill" 
                  :style="getLightSliderFill(key, lightParams[key])"
                ></div>
              </div>
            </div>
            <div class="param-marks">
              <span>{{ key === 'pattern' ? lightParamDefs.pattern.options[0] : lightParamDefs[key]?.min }}</span>
              <span>{{ key === 'pattern' ? lightParamDefs.pattern.options[4] : lightParamDefs[key]?.max }}</span>
            </div>
          </div>
        </div>

        <div class="color-picker-group">
          <h4 class="preset-title">灯光色彩</h4>
          <div class="color-options">
            <div 
              v-for="color in colorOptions" 
              :key="color.hue"
              class="color-option"
              :class="{ active: lightParams.hue === color.hue }"
              :style="{ background: color.color }"
              @click="updateLightParam('hue', color.hue)"
            >
              <span class="color-label">{{ color.name }}</span>
            </div>
          </div>
        </div>

        <div class="preset-group">
          <h4 class="preset-title">场景预设</h4>
          <div class="preset-buttons">
            <button 
              v-for="preset in lightPresets" 
              :key="preset.name"
              class="preset-btn"
              @click="applyLightPreset(preset)"
            >
              {{ preset.icon }} {{ preset.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    audioParams: {
      type: Object,
      required: true
    },
    lightParams: {
      type: Object,
      required: true
    }
  },
  emits: ['update-audio', 'update-light'],
  data() {
    return {
      activeTab: 'audio',
      paramDefs: window.GAME_DATA.AUDIO_PARAMS,
      lightParamDefs: window.GAME_DATA.LIGHT_PARAMS,
      colorOptions: [
        { name: '红色', hue: 0, color: '#ff0000' },
        { name: '橙色', hue: 30, color: '#ff8c00' },
        { name: '黄色', hue: 60, color: '#ffff00' },
        { name: '绿色', hue: 120, color: '#00ff00' },
        { name: '青色', hue: 180, color: '#00ffff' },
        { name: '蓝色', hue: 210, color: '#4169e1' },
        { name: '紫色', hue: 270, color: '#9400d3' },
        { name: '粉色', hue: 330, color: '#ff69b4' }
      ],
      audioPresets: [
        { name: '流行', icon: '🎵', params: { volume: 75, bass: 4, treble: 2, mid: 0, reverb: 30, echo: 15 } },
        { name: '摇滚', icon: '🎸', params: { volume: 90, bass: 8, treble: 3, mid: 2, reverb: 40, echo: 20 } },
        { name: '古典', icon: '🎻', params: { volume: 60, bass: -4, treble: 6, mid: 2, reverb: 60, echo: 10 } },
        { name: '电音', icon: '⚡', params: { volume: 95, bass: 10, treble: 2, mid: 0, reverb: 25, echo: 30 } }
      ],
      lightPresets: [
        { name: '热情', icon: '🔥', params: { brightness: 100, hue: 0, saturation: 100, speed: 80, pattern: 4 } },
        { name: '梦幻', icon: '✨', params: { brightness: 70, hue: 270, saturation: 80, speed: 30, pattern: 1 } },
        { name: '动感', icon: '💫', params: { brightness: 90, hue: 180, saturation: 100, speed: 90, pattern: 2 } },
        { name: '柔和', icon: '🌸', params: { brightness: 50, hue: 330, saturation: 60, speed: 20, pattern: 0 } }
      ]
    }
  },
  methods: {
    updateAudioParam(key, value) {
      this.$emit('update-audio', { [key]: Number(value) })
    },
    updateLightParam(key, value) {
      this.$emit('update-light', { [key]: Number(value) })
    },
    getUnit(key) {
      if (['bass', 'treble', 'mid'].includes(key)) return 'dB'
      if (key === 'volume') return '%'
      return ''
    },
    getLightUnit(key) {
      if (key === 'hue') return '°'
      return '%'
    },
    getSliderFill(key, value) {
      const def = this.paramDefs[key]
      if (!def) return {}
      const percent = ((value - def.min) / (def.max - def.min)) * 100
      return { width: percent + '%' }
    },
    getLightSliderFill(key, value) {
      const def = this.lightParamDefs[key]
      if (!def) return {}
      const percent = ((value - def.min) / (def.max - def.min)) * 100
      const color = key === 'hue' ? `hsl(${value}, 100%, 50%)` : '#00bfff'
      return { 
        width: percent + '%',
        background: color
      }
    },
    applyAudioPreset(preset) {
      this.$emit('update-audio', preset.params)
    },
    applyLightPreset(preset) {
      this.$emit('update-light', preset.params)
    }
  }
}

window.ControlPanel = ControlPanel
