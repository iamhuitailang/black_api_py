<template>
  <div class="statistics-page">
    <h3 class="section-title">数据统计分析</h3>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.total_users || 0 }}</span>
          <span class="stat-label">总用户数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">🎮</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.today_players || 0 }}</span>
          <span class="stat-label">今日活跃</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">🌊</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.total_waves || 0 }}</span>
          <span class="stat-label">波次总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">✈️</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.overview?.total_planes || 0 }}</span>
          <span class="stat-label">战机种类</span>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="panel chart-panel">
        <div class="panel-header">近7日游戏场次</div>
        <div class="panel-body">
          <div class="bar-chart">
            <div
              v-for="(day, index) in stats.last_7_days || []"
              :key="index"
              class="bar-col"
            >
              <div class="bar-tooltip">{{ day.games }} 场</div>
              <div class="bar-wrap">
                <div class="bar bar-games" :style="{ height: getBarHeight(day.games, 'games') + '%' }"></div>
              </div>
              <div class="bar-label">{{ formatDate(day.date) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel chart-panel">
        <div class="panel-header">近7日活跃玩家</div>
        <div class="panel-body">
          <div class="bar-chart">
            <div
              v-for="(day, index) in stats.last_7_days || []"
              :key="index"
              class="bar-col"
            >
              <div class="bar-tooltip">{{ day.players }} 人</div>
              <div class="bar-wrap">
                <div class="bar bar-players" :style="{ height: getBarHeight(day.players, 'players') + '%' }"></div>
              </div>
              <div class="bar-label">{{ formatDate(day.date) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="panel chart-panel">
        <div class="panel-header">波次通关分布</div>
        <div class="panel-body">
          <div class="wave-distribution">
            <div
              v-for="(item, index) in stats.wave_distribution || []"
              :key="index"
              class="wave-item"
            >
              <div class="wave-label">Wave {{ item.wave }}</div>
              <div class="wave-bar-container">
                <div class="wave-bar-fill" :style="{ width: getWaveBarWidth(item.count) + '%' }">
                  <span class="wave-count">{{ item.count }} 人</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel chart-panel">
        <div class="panel-header">平均分趋势</div>
        <div class="panel-body">
          <div class="line-chart">
            <div class="line-chart-canvas">
              <svg :viewBox="`0 0 600 200`" preserveAspectRatio="none" class="chart-svg">
                <polyline
                  :points="avgScorePoints"
                  fill="none"
                  stroke="#00d4ff"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle
                  v-for="(p, i) in avgScorePointsArray"
                  :key="i"
                  :cx="p.x"
                  :cy="p.y"
                  r="4"
                  fill="#00d4ff"
                />
              </svg>
            </div>
            <div class="chart-labels">
              <span v-for="(day, i) in stats.last_7_days || []" :key="i" class="chart-label">
                {{ formatDate(day.date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <span>全服高分榜</span>
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
              <th>击杀数</th>
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
              <td>{{ score.kills }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

const getBarHeight = (value: number, type: string) => {
  const data = stats.value.last_7_days || []
  if (data.length === 0) return 0
  const max = Math.max(...data.map((d: any) => d[type] || 0))
  return max > 0 ? (value / max) * 80 + 20 : 0
}

const getWaveBarWidth = (value: number) => {
  const data = stats.value.wave_distribution || []
  if (data.length === 0) return 0
  const max = Math.max(...data.map((d: any) => d.count || 0))
  return max > 0 ? (value / max) * 100 : 0
}

const avgScorePointsArray = computed(() => {
  const data = stats.value.last_7_days || []
  if (data.length === 0) return []
  
  const maxAvg = Math.max(...data.map((d: any) => d.avg_score || 0)) || 1
  const width = 600
  const height = 200
  const padding = 20
  
  return data.map((d: any, i: number) => ({
    x: padding + (width - 2 * padding) * (i / (data.length - 1 || 1)),
    y: height - padding - ((d.avg_score || 0) / maxAvg) * (height - 2 * padding)
  }))
})

const avgScorePoints = computed(() => {
  return avgScorePointsArray.value.map(p => `${p.x},${p.y}`).join(' ')
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return `${parts[1]}/${parts[2]}`
}

const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>

<style scoped>
.statistics-page {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  color: var(--color-neon-blue);
  letter-spacing: 2px;
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

.stat-info { flex: 1; }

.stat-number {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 26px;
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

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-panel {
  min-height: 280px;
}

.header-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding-top: 20px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.bar-tooltip {
  position: absolute;
  top: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity 0.3s;
}

.bar-col:hover .bar-tooltip {
  opacity: 1;
}

.bar-wrap {
  height: 160px;
  width: 35px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: flex-end;
  margin-bottom: 10px;
}

.bar {
  width: 100%;
  transition: height 0.5s ease;
}

.bar-games {
  background: linear-gradient(180deg, var(--color-neon-blue) 0%, rgba(0, 212, 255, 0.3) 100%);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.bar-players {
  background: linear-gradient(180deg, var(--color-neon-green) 0%, rgba(0, 255, 136, 0.3) 100%);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.bar-label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.wave-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wave-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.wave-label {
  width: 70px;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: 'Orbitron', sans-serif;
}

.wave-bar-container {
  flex: 1;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  position: relative;
}

.wave-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-neon-orange) 0%, rgba(255, 140, 0, 0.3) 100%);
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.4);
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  min-width: 60px;
}

.wave-count {
  font-size: 11px;
  color: #fff;
  font-weight: bold;
}

.line-chart {
  height: 220px;
}

.line-chart-canvas {
  height: 180px;
  position: relative;
}

.chart-svg {
  width: 100%;
  height: 100%;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 5px;
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
  
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
