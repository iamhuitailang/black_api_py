const SceneSelector = {
  name: 'SceneSelector',
  template: `
    <div class="scene-selector">
      <h2 class="section-title">
        <span class="title-icon">🎭</span>
        选择演出场所
      </h2>
      <div class="scene-grid">
        <div 
          v-for="scene in scenes" 
          :key="scene.id"
          class="scene-card"
          :class="{ active: currentSceneId === scene.id, matched: isGenreMatched(scene) }"
          @click="selectScene(scene)"
        >
          <div class="scene-header">
            <div class="scene-icon" :style="getSceneIconStyle(scene)">{{ getSceneIcon(scene) }}</div>
            <div class="scene-info">
              <h3 class="scene-name">{{ scene.name }}</h3>
              <span class="scene-style">{{ scene.style }}</span>
            </div>
          </div>
          <div class="scene-genres">
            <span 
              v-for="genre in scene.genres" 
              :key="genre"
              class="genre-tag"
              :class="{ matched: currentGenreId && getGenreId(genre) === currentGenreId }"
            >
              {{ genre }}
            </span>
          </div>
          <p class="scene-desc">{{ scene.description }}</p>
          <div class="scene-light-preview">
            <span class="light-preview-label">灯光效果:</span>
            <span class="light-preview-value" :style="{ color: scene.lightColor }">
              {{ getLightTypeName(scene.lightType) }}
            </span>
          </div>
        </div>
      </div>

      <div class="genre-selector" v-if="currentScene">
        <h3 class="subsection-title">选择演出曲风</h3>
        <div class="genre-options">
          <div 
            v-for="genre in genres" 
            :key="genre.id"
            class="genre-option"
            :class="{ 
              active: currentGenreId === genre.id,
              matched: currentScene.genres.includes(genre.name)
            }"
            @click="selectGenre(genre)"
          >
            <span class="genre-emoji">{{ getGenreEmoji(genre.id) }}</span>
            <span class="genre-name">{{ genre.name }}</span>
            <span class="genre-tempo">{{ genre.tempo }}BPM</span>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    currentSceneId: String,
    currentGenreId: String
  },
  emits: ['select-scene', 'select-genre'],
  data() {
    return {
      scenes: window.GAME_DATA.SCENES,
      genres: window.GAME_DATA.GENRES
    }
  },
  computed: {
    currentScene() {
      return this.scenes.find(s => s.id === this.currentSceneId)
    }
  },
  methods: {
    selectScene(scene) {
      this.$emit('select-scene', scene)
    },
    selectGenre(genre) {
      this.$emit('select-genre', genre)
    },
    getSceneIcon(scene) {
      const icons = {
        livehouse: '🏢',
        outdoor: '🌳',
        banquet: '🏛️',
        club: '🎆'
      }
      return icons[scene.id] || '🎭'
    },
    getSceneIconStyle(scene) {
      return {
        background: `linear-gradient(135deg, ${scene.lightColor}30, ${scene.lightColor}10)`,
        color: scene.lightColor
      }
    },
    getGenreId(genreName) {
      const genre = this.genres.find(g => g.name === genreName)
      return genre ? genre.id : null
    },
    isGenreMatched(scene) {
      if (!this.currentGenreId) return false
      const genre = this.genres.find(g => g.id === this.currentGenreId)
      return genre && scene.genres.includes(genre.name)
    },
    getGenreEmoji(genreId) {
      const emojis = {
        pop: '🎵',
        rap: '🎤',
        rock: '🎸',
        folk: '🍃',
        ballad: '💝',
        classical: '🎻',
        edm: '⚡',
        dj: '🎧'
      }
      return emojis[genreId] || '🎶'
    },
    getLightTypeName(type) {
      const names = {
        cold_strobe: '冷色频闪',
        warm_follow: '暖光追光',
        soft_diffuse: '柔和漫射',
        rgb_beam: '七彩光束'
      }
      return names[type] || type
    }
  }
}

window.SceneSelector = SceneSelector
