<template>
  <div class="archive container">
    <h1 class="mb-20">📚 灵异事件档案</h1>

    <div class="archive-stats card mb-20">
      <div class="stats-grid grid grid-4">
        <div class="stat-item">
          <span class="stat-icon">👻</span>
          <span class="stat-value">{{ discoveredCount }} 已发现</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⚔️</span>
          <span class="stat-value">{{ totalDefeated }} 已击败</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🔍</span>
          <span class="stat-value">{{ totalEncounters }} 遭遇</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📖</span>
          <span class="stat-value">{{ totalGhosts }} 鬼魂种类</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="ghost-archive-grid">
      <div
        v-for="ghost in archiveWithDetails"
        :key="ghost.id"
        class="ghost-card card"
        :class="{ undiscovered: !ghost.discovered }"
      >
        <div class="ghost-header">
          <span class="ghost-icon">{{ ghost.discovered ? '👻' : '❓' }}</span>
          <h3>{{ ghost.discovered ? ghost.name : '???' }}</h3>
        </div>
        
        <div v-if="ghost.discovered" class="ghost-details">
          <p class="ghost-desc">{{ ghost.description }}</p>
          
          <div class="ghost-stats">
            <div class="stat-row">
              <span>难度:</span>
              <span class="badge" :class="'badge-' + getDifficultyClass(ghost.difficulty)">
                {{ ghost.difficulty }}
              </span>
            </div>
            <div class="stat-row">
              <span>弱点:</span>
              <span class="weakness">{{ ghost.weakness }}</span>
            </div>
            <div class="stat-row">
              <span>遭遇次数:</span>
              <span>{{ ghost.encounters || 0 }}</span>
            </div>
            <div class="stat-row">
              <span>击败次数:</span>
              <span>{{ ghost.defeated || 0 }}</span>
            </div>
          </div>

          <div v-if="ghost.story_unlocked" class="ghost-story mt-20">
            <h4>📖 背景故事</h4>
            <p>{{ ghost.story_unlocked }}</p>
          </div>
        </div>
        
        <div v-else class="undiscovered-message">
          <p>尚未发现此鬼魂</p>
          <p class="hint">继续探索以解锁更多档案</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToastStore } from '../store'
import { ghostAPI, gameAPI } from '../services/api'

const toastStore = useToastStore()

const allGhosts = ref([])
const userArchive = ref([])
const loading = ref(true)

const archiveWithDetails = computed(() => {
  return allGhosts.value.map(ghost => {
    const archive = userArchive.value.find(a => a.ghost_type_id === ghost.id)
    return {
      ...ghost,
      discovered: archive?.discovered || false,
      encounters: archive?.encounters || 0,
      defeated: archive?.defeated || 0,
      story_unlocked: archive?.story_unlocked
    }
  })
})

const discoveredCount = computed(() => archiveWithDetails.value.filter(g => g.discovered).length)
const totalDefeated = computed(() => userArchive.value.reduce((sum, a) => sum + (a.defeated || 0), 0))
const totalEncounters = computed(() => userArchive.value.reduce((sum, a) => sum + (a.encounters || 0), 0))
const totalGhosts = computed(() => allGhosts.value.length)

const getDifficultyClass = (diff) => {
  if (diff <= 1) return 'success'
  if (diff <= 2) return 'warning'
  return 'danger'
}

const loadData = async () => {
  loading.value = true
  try {
    const [ghostRes, archiveRes] = await Promise.all([
      ghostAPI.getAll(),
      gameAPI.getArchive()
    ])
    
    if (ghostRes.code === 200) allGhosts.value = ghostRes.data
    if (archiveRes.code === 200) userArchive.value = archiveRes.data
  } catch (e) {
    toastStore.error('加载档案失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-weight: 600;
}

.ghost-archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.ghost-card {
  transition: all 0.3s;
}

.ghost-card.undiscovered {
  opacity: 0.6;
}

.ghost-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.ghost-icon {
  font-size: 36px;
}

.ghost-header h3 {
  color: var(--text-primary);
  font-size: 18px;
}

.ghost-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.6;
}

.ghost-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stat-row span:first-child {
  color: var(--text-secondary);
}

.weakness {
  color: var(--accent-warning);
  font-weight: 500;
}

.ghost-story {
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.ghost-story h4 {
  color: var(--accent-primary);
  margin-bottom: 10px;
}

.ghost-story p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.undiscovered-message {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

.undiscovered-message .hint {
  font-size: 12px;
  margin-top: 10px;
}
</style>
