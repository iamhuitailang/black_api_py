<template>
  <div class="dashboard">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.total_users || 0 }}</span>
          <span class="stat-label">总用户数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">✈️</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.total_planes || 0 }}</span>
          <span class="stat-label">战机种类</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">🌊</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.total_waves || 0 }}</span>
          <span class="stat-label">波次数量</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🎮</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.today_players || 0 }}</span>
          <span class="stat-label">今日玩家</span>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="panel chart-panel">
        <div class="panel-header">近7日活跃</div>
        <div class="panel-body">
          <div class="bar-chart">
            <div
              v-for="(day, index) in stats.last_7_days || []"
              :key="index"
              class="bar-item"
            >
              <div class="bar-wrapper">
                <div class="bar" :style="{ height: getBarHeight(day.games) + '%' }"></div>
              </div>
              <span class="bar-label">{{ formatDate(day.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel chart-panel">
        <div class="panel-header">波次通关分布</div>
        <div class="panel-body">
          <div class="wave-chart">
            <div
              v-for="(item, index) in stats.wave_distribution || []"
              :key="index"
              class="wave-item"
            >
              <span class="wave-label">Wave {{ item.wave }}</span>
              <div class="wave-bar">
                <div class="wave-fill" :style="{ width: getWaveBarWidth(item.count) + '%' }"></div>
              </div>
              <span class="wave-count">{{ item.count }}人</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel top-scores-panel">
      <div class="panel-header">
        <span>最高分数排行</span>
        <span class="header-sub">TOP 10</span>
      </div>
      <div class="panel-body">
        <table class="table">
          <thead>
            <tr>
              <th>排名</th>
              <th>玩家</th>
              <th>分数</th>
              <th>波次</th>
              <th>机型</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(score, index) in stats.top_scores || []" :key="index">
              <td>
                <span v-if="index < 3" class="rank-badge" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
                <span v-else>{{ index + 1 }}</span>
              </td>
              <td>{{ score.username }}</td>
              <td class="score-cell">{{ formatNumber(score.score) }}</td>
              <td>{{ score.wave }}</td>
              <td>{{ score.plane_id }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'

const stats = ref<any>({
  overview: {},
  last_7_days: [],
  wave_distribution: [],
  top_scores: []
})

onMounted(async () => {
  await loadStats()
})

const loadStats = async () => {
  try {
    const res = await adminApi.getStatistics()
    if (res.code === 0 && res.data) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const getBarHeight = (value: number) => {
  const maxGames = Math.max(...(stats.value.last_7_days?.map((d: any) => d.games) || [1]))
  return maxGames > 0 ? (value / maxGames) * 80 + 20 : 0
}

const getWaveBarWidth = (value: number) => {
  const maxCount = Math.max(...(stats.value.wave_distribution?.map((d: any) => d.count) || [1]))
  return maxCount > 0 ? (value / maxCount) * 100 : 0
}

const formatDate = (dateStr: string) => {
  const parts = dateStr.split('-')
  return `${parts[1]}/${parts[2]}`
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num?.toString() || '0'
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--color-border);
  border-radius: 50%;
}

.stat-icon.blue { border-color: var(--color-neon-blue); }
.stat-icon.orange { border-color: var(--color-neon-orange); }
.stat-icon.green { border-color: var(--color-neon-green); }
.stat-icon.purple { border-color: #9932cc; }

.stat-info {
  flex: 1;
}

.stat-number {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-panel {
  min-height: 250px;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding-top: 20px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.bar-wrapper {
  height: 160px;
  width: 30px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, var(--color-neon-blue) 0%, rgba(0, 212, 255, 0.3) 100%);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.wave-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wave-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wave-label {
  width: 60px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.wave-bar {
  flex: 1;
  height: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
}

.wave-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-neon-orange) 0%, rgba(255, 140, 0, 0.3) 100%);
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
  transition: width 0.5s ease;
}

.wave-count {
  width: 60px;
  text-align: right;
  font-size: 12px;
  color: var(--color-text-muted);
}

.top-scores-panel {
  flex: 1;
}

.header-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.score-cell {
  color: var(--color-neon-blue);
  font-weight: bold;
  font-family: 'Orbitron', sans-serif;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-weight: bold;
  font-size: 12px;
}

.rank-1 { color: var(--color-neon-orange); }
.rank-2 { color: #c0c0c0; }
.rank-3 { color: #cd7f32; }

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
