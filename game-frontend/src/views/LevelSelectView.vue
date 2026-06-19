<template>
  <div class="screen-container">
    <div class="header">
      <button class="ink-btn small" @click="$emit('back')">← 返回</button>
      <h2 class="page-title">选择关卡</h2>
      <div class="player-name">{{ playerName }}</div>
    </div>

    <div class="level-grid">
      <button
        v-for="level in LEVELS"
        :key="level.id"
        class="level-card"
        :class="{ locked: level.id > unlockedLevel, cleared: grades[level.id] }"
        :disabled="level.id > unlockedLevel"
        @click="selectLevel(level.id)"
      >
        <div class="level-number">第{{ level.id }}关</div>
        <div class="level-name">{{ level.name }}</div>
        <div class="level-subtitle">{{ level.subtitle }}</div>
        <div class="level-grade" v-if="grades[level.id]">
          <span class="grade-badge" :class="'grade-' + grades[level.id]">
            {{ grades[level.id] }}
          </span>
        </div>
        <div class="level-locked" v-else-if="level.id > unlockedLevel">
          <span class="lock-icon">⚔</span>
        </div>
      </button>
    </div>

    <div class="progress-info">
      <span>已通关：{{ clearedCount }} / 10</span>
      <span class="dot-sep">·</span>
      <span>S评分：{{ sCount }} 个</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { LEVELS } from '../game/levels.js'
import { getPlayerProgress } from '../api/index.js'

export default {
  name: 'LevelSelectView',
  emits: ['select', 'back'],
  setup(props, { emit }) {
    const playerName = ref(localStorage.getItem('playerName') || '剑客')
    const unlockedLevel = ref(1)
    const grades = ref({})
    const sCount = ref(0)
    const clearedCount = computed(() => Object.keys(grades.value).length)

    async function loadProgress() {
      const resp = await getPlayerProgress(playerName.value)
      if (resp.code === 0 && resp.data) {
        unlockedLevel.value = resp.data.unlocked_level
        grades.value = {}
        sCount.value = 0
        resp.data.grades.forEach(g => {
          grades.value[g.level_id] = g.grade
          if (g.grade === 'S') sCount.value++
        })
      }
    }

    function selectLevel(id) {
      if (id <= unlockedLevel.value) {
        emit('select', id)
      }
    }

    onMounted(() => {
      loadProgress()
    })

    return { LEVELS, playerName, unlockedLevel, grades, sCount, clearedCount, selectLevel }
  }
}
</script>

<style scoped>
.header {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ink-btn.small {
  width: 100px;
  padding: 0.4rem 0.8rem;
  font-size: 1rem;
  margin: 0;
}

.page-title {
  font-size: 1.8rem;
  color: #e8e0d0;
  letter-spacing: 0.2em;
  margin: 0;
}

.player-name {
  color: #a09880;
  font-size: 1rem;
  min-width: 100px;
  text-align: right;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  width: 820px;
  margin: 60px auto 20px;
}

.level-card {
  background: rgba(40, 32, 24, 0.3);
  border: 1px solid #3a3028;
  padding: 14px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  color: #d8d0c0;
  font-family: inherit;
}

.level-card:hover:not(:disabled) {
  border-color: #c8b898;
  background: rgba(60, 50, 40, 0.5);
  transform: translateY(-3px);
}

.level-card.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.level-card.cleared {
  border-color: #6a5a3a;
}

.level-number {
  font-size: 1.3rem;
  color: #c8b898;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.level-name {
  font-size: 1.15rem;
  color: #e8e0d0;
  margin-bottom: 4px;
}

.level-subtitle {
  font-size: 0.75rem;
  color: #6a5a4a;
  margin-bottom: 8px;
}

.grade-badge {
  display: inline-block;
  width: 36px;
  height: 36px;
  line-height: 36px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 50%;
}

.grade-S { color: #c8a848; text-shadow: 0 0 10px rgba(200, 168, 72, 0.5); }
.grade-A { color: #e8e0d0; }
.grade-B { color: #a09880; }
.grade-C { color: #6a5a4a; }

.level-locked .lock-icon {
  font-size: 1.5rem;
  opacity: 0.6;
}

.progress-info {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: #6a5a4a;
  font-size: 0.95rem;
}

.dot-sep {
  margin: 0 0.8rem;
  color: #4a3a2a;
}
</style>
