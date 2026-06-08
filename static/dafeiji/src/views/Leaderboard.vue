<template>
  <div class="leaderboard-page">
    <div class="top-nav">
      <div class="nav-left">
        <button class="btn btn-sm" @click="goBack">← 返回</button>
        <h2 class="nav-title">战斗排行榜</h2>
      </div>
      <div class="nav-right">
        <div class="tab-switcher">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: activeTab === tab.value }"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="panel leaderboard-panel">
        <div class="panel-header">
          <span>{{ tabs.find(t => t.value === activeTab)?.label }}排行榜</span>
          <span class="header-sub">TOP 50</span>
        </div>
        <div class="panel-body">
          <div class="top-three" v-if="scores.length >= 3">
            <div class="podium podium-second">
              <div class="podium-number">2</div>
              <div class="podium-info">
                <div class="player-name">{{ scores[1]?.username }}</div>
                <div class="player-score">{{ formatNumber(scores[1]?.score || 0) }}</div>
              </div>
            </div>
            <div class="podium podium-first">
              <div class="podium-crown">👑</div>
              <div class="podium-number">1</div>
              <div class="podium-info">
                <div class="player-name">{{ scores[0]?.username }}</div>
                <div class="player-score">{{ formatNumber(scores[0]?.score || 0) }}</div>
              </div>
            </div>
            <div class="podium podium-third">
              <div class="podium-number">3</div>
              <div class="podium-info">
                <div class="player-name">{{ scores[2]?.username }}</div>
                <div class="player-score">{{ formatNumber(scores[2]?.score || 0) }}</div>
              </div>
            </div>
          </div>

          <div class="rank-list">
            <div
              v-for="(item, index) in scores.slice(3)"
              :key="item.id"
              class="rank-item"
            >
              <div class="rank-num">{{ index + 4 }}</div>
              <div class="rank-name">{{ item.username }}</div>
              <div class="rank-detail">
                <span class="rank-wave">波次 {{ item.wave }}</span>
                <span class="rank-plane">{{ item.plane_id }}</span>
              </div>
              <div class="rank-score">{{ formatNumber(item.score) }}</div>
            </div>
          </div>

          <div v-if="scores.length === 0" class="empty-state">
            <p>暂无排行数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gameApi } from '@/api/game'
import type { ScoreItem } from '@/types'

const router = useRouter()

const tabs = [
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '总榜', value: 'all' }
]

const activeTab = ref('daily')
const scores = ref<ScoreItem[]>([])
const loading = ref(false)

onMounted(() => {
  loadLeaderboard()
})

watch(activeTab, () => {
  loadLeaderboard()
})

const loadLeaderboard = async () => {
  loading.value = true
  try {
    const res = await gameApi.getLeaderboard(activeTab.value, 50)
    if (res.code === 0 && res.data) {
      scores.value = res.data
    }
  } catch (e) {
    console.error('加载排行榜失败', e)
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: string) => {
  activeTab.value = tab
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const goBack = () => {
  router.push('/home')
}
</script>

<style scoped>
.leaderboard-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #050710;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(18, 26, 43, 0.9);
  border-bottom: 2px solid var(--color-border);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  color: var(--color-neon-blue);
  letter-spacing: 3px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 12px;
}

.tab-switcher {
  display: flex;
  border: 2px solid var(--color-border);
}

.tab-btn {
  padding: 8px 20px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-neon-blue);
  color: #000;
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.leaderboard-panel {
  width: 100%;
  max-width: 600px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.podium {
  text-align: center;
  position: relative;
}

.podium-first {
  order: 2;
}

.podium-second {
  order: 1;
}

.podium-third {
  order: 3;
}

.podium-crown {
  font-size: 32px;
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
}

.podium-number {
  width: 50px;
  height: 50px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: bold;
  background: var(--color-bg-panel-alt);
  border: 2px solid var(--color-border-light);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

.podium-first .podium-number {
  width: 60px;
  height: 60px;
  font-size: 28px;
  border-color: var(--color-neon-orange);
  color: var(--color-neon-orange);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.5);
}

.podium-second .podium-number {
  border-color: #c0c0c0;
  color: #c0c0c0;
}

.podium-third .podium-number {
  border-color: #cd7f32;
  color: #cd7f32;
}

.podium-info {
  min-width: 100px;
}

.player-name {
  font-size: 14px;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-score {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  color: var(--color-neon-blue);
  font-weight: bold;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: rgba(26, 37, 64, 0.5);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.rank-item:hover {
  border-color: var(--color-border-light);
  background: rgba(26, 37, 64, 0.8);
}

.rank-num {
  width: 40px;
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  color: var(--color-text-muted);
  font-weight: bold;
}

.rank-name {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary);
}

.rank-detail {
  display: flex;
  gap: 15px;
  margin-right: 20px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.rank-wave {
  color: var(--color-neon-orange);
}

.rank-score {
  font-family: 'Orbitron', sans-serif;
  font-size: 15px;
  color: var(--color-neon-blue);
  font-weight: bold;
  min-width: 80px;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}
</style>
