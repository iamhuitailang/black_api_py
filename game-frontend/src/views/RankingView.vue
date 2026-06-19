<template>
  <div class="screen-container">
    <div class="header">
      <button class="ink-btn small" @click="$emit('back')">← 返回</button>
      <h2 class="page-title">排行榜</h2>
      <div class="player-name">{{ playerName }}</div>
    </div>

    <div class="ranking-content">
      <!-- 总排行 -->
      <div class="ranking-section">
        <h3 class="section-title">全关总排行</h3>
        <div class="ranking-table">
          <div class="table-header">
            <span class="col-rank">排名</span>
            <span class="col-name">剑客</span>
            <span class="col-cleared">通关</span>
            <span class="col-s">S级</span>
            <span class="col-score">总分</span>
          </div>
          <div class="table-body">
            <div
              v-for="(row, i) in ranking"
              :key="i"
              class="table-row"
              :class="{ 'is-me': row.player_name === playerName }"
            >
              <span class="col-rank">
                <span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
              </span>
              <span class="col-name">{{ row.player_name }}</span>
              <span class="col-cleared">{{ row.levels_cleared }}/10</span>
              <span class="col-s">{{ row.s_count }}</span>
              <span class="col-score">{{ row.total_score }}</span>
            </div>
            <div v-if="!ranking || ranking.length === 0" class="empty-state">
              暂无记录，成为第一位闯关者吧！
            </div>
          </div>
        </div>
      </div>

      <!-- 各关最佳 -->
      <div class="ranking-section">
        <h3 class="section-title">各关最佳记录</h3>
        <div class="levels-best">
          <div
            v-for="level in levelsBest"
            :key="level.level_id"
            class="level-best-card"
          >
            <div class="level-num">第{{ level.level_id }}关</div>
            <div class="level-best-info">
              <span class="grade-badge" :class="'grade-' + level.grade">{{ level.grade }}</span>
              <span class="best-name">{{ level.player_name }}</span>
            </div>
            <div class="level-stats">
              {{ formatTime(level.completion_time) }} · 受伤{{ level.damage_taken }}
            </div>
          </div>
          <div v-if="!levelsBest || levelsBest.length === 0" class="empty-state small">
            暂无最佳记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getRanking } from '../api/index.js'

export default {
  name: 'RankingView',
  emits: ['back'],
  setup() {
    const playerName = ref(localStorage.getItem('playerName') || '剑客')
    const ranking = ref([])
    const levelsBest = ref([])

    function formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0')
      const s = (seconds % 60).toFixed(1).padStart(4, '0')
      return `${m}:${s}`
    }

    async function loadRanking() {
      const resp = await getRanking(20)
      if (resp.code === 0 && resp.data) {
        ranking.value = resp.data.ranking || []
        levelsBest.value = resp.data.levels_best || []
      }
    }

    onMounted(() => {
      loadRanking()
    })

    return {
      playerName,
      ranking,
      levelsBest,
      formatTime
    }
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

.ranking-content {
  display: flex;
  gap: 30px;
  width: 880px;
  margin: 60px auto 20px;
  height: 420px;
}

.ranking-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.25rem;
  color: #c8b898;
  letter-spacing: 0.15em;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3a3028;
}

.ranking-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  display: flex;
  padding: 8px 12px;
  color: #6a5a4a;
  font-size: 0.85rem;
  border-bottom: 1px solid #2a2218;
}

.table-body {
  flex: 1;
  overflow-y: auto;
}

.table-row {
  display: flex;
  padding: 10px 12px;
  align-items: center;
  border-bottom: 1px solid rgba(58, 48, 40, 0.3);
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(60, 50, 40, 0.2);
}

.table-row.is-me {
  background: rgba(200, 168, 72, 0.08);
}

.col-rank { width: 45px; }
.col-name { flex: 1; color: #e8e0d0; }
.col-cleared { width: 60px; text-align: center; color: #a09880; }
.col-s { width: 40px; text-align: center; color: #c8a848; }
.col-score { width: 60px; text-align: right; color: #c8b898; }

.rank-badge {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 50%;
  font-size: 0.9rem;
  color: #6a5a4a;
  background: rgba(58, 48, 40, 0.5);
}

.rank-1 { color: #c8a848; background: rgba(200, 168, 72, 0.2); box-shadow: 0 0 8px rgba(200, 168, 72, 0.3); }
.rank-2 { color: #a09880; background: rgba(160, 152, 128, 0.2); }
.rank-3 { color: #a06840; background: rgba(160, 104, 64, 0.2); }

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #5a4a3a;
  font-size: 0.95rem;
}

.empty-state.small {
  padding: 20px;
  font-size: 0.85rem;
}

.levels-best {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

.level-best-card {
  background: rgba(40, 32, 24, 0.3);
  border: 1px solid #2a2218;
  padding: 8px 10px;
}

.level-num {
  font-size: 0.8rem;
  color: #8a7a60;
  margin-bottom: 4px;
}

.level-best-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.grade-badge {
  font-size: 1.2rem;
  font-weight: bold;
  width: 24px;
  display: inline-block;
}

.grade-S { color: #c8a848; text-shadow: 0 0 8px rgba(200, 168, 72, 0.5); }
.grade-A { color: #e8e0d0; }
.grade-B { color: #a09880; }
.grade-C { color: #6a5a4a; }

.best-name {
  color: #e8e0d0;
  font-size: 0.9rem;
}

.level-stats {
  font-size: 0.75rem;
  color: #6a5a4a;
}
</style>
