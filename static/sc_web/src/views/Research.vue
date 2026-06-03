<template>
  <div class="research-container">
    <div class="page-header">
      <h1 class="page-title">研发中心</h1>
      <p class="page-subtitle">研究新技术，解锁更高级的零件</p>
      <div class="header-stats">
        <div class="stat-badge">
          <span class="stat-icon">🔬</span>
          <span class="stat-label">研发点数</span>
          <span class="stat-value">{{ researchPoints }}</span>
        </div>
        <div class="stat-badge">
          <span class="stat-icon">💰</span>
          <span class="stat-label">金币</span>
          <span class="stat-value">{{ formatNumber(userStore.user?.coins || 0) }}</span>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="research-layout">
      <div class="main-content">
        <el-card class="active-research-card" shadow="hover" v-if="activeResearch">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Loading /></el-icon>
              <span>正在研发</span>
            </h3>
            <el-button type="danger" text size="small" @click="cancelResearch">
              <el-icon><Close /></el-icon>
              取消研发
            </el-button>
          </div>

          <div class="active-research-content">
            <div class="research-visual">
              <svg class="research-svg" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="researchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b00" />
                    <stop offset="100%" style="stop-color:#ff8c00" />
                  </linearGradient>
                </defs>
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#2a2a4a"
                  stroke-width="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="url(#researchGrad)"
                  stroke-width="12"
                  stroke-linecap="round"
                  :stroke-dasharray="researchCircumference"
                  :stroke-dashoffset="getResearchOffset(activeResearch.progress)"
                  transform="rotate(-90 100 100)"
                  class="research-progress-ring"
                />
                <g class="research-icon-center">
                  <text x="100" y="95" text-anchor="middle" font-size="40">{{ getPartTypeIcon(activeResearch.part_type) }}</text>
                  <text x="100" y="120" text-anchor="middle" fill="#fff" font-size="24" font-weight="bold">{{ activeResearch.progress }}%</text>
                </g>
                <g class="rotating-gears">
                  <path d="M160 50 L165 40 L175 45 L170 55 Z" fill="#ff6b00" opacity="0.6">
                    <animateTransform attributeName="transform" type="rotate" from="0 165 48" to="360 165 48" dur="3s" repeatCount="indefinite" />
                  </path>
                  <path d="M40 150 L35 160 L25 155 L30 145 Z" fill="#ff8c00" opacity="0.6">
                    <animateTransform attributeName="transform" type="rotate" from="360 32 152" to="0 32 152" dur="4s" repeatCount="indefinite" />
                  </path>
                </g>
              </svg>
            </div>

            <div class="research-info">
              <div class="research-part-type">
                <span class="part-type-badge">{{ getPartTypeName(activeResearch.part_type) }}</span>
                <span class="research-level">Lv.{{ activeResearch.target_level }}</span>
              </div>
              <h4 class="research-name">{{ activeResearch.part_name || '研发中...' }}</h4>
              <p class="research-desc">研发完成后将解锁更高级的{{ getPartTypeName(activeResearch.part_type) }}零件</p>

              <div class="research-progress-section">
                <div class="progress-header">
                  <span class="progress-label">研发进度</span>
                  <span class="progress-value">{{ activeResearch.progress }}%</span>
                </div>
                <el-progress
                  :percentage="activeResearch.progress"
                  :stroke-width="10"
                  color="url(#researchProgressGrad)"
                  :show-text="false"
                  class="main-progress"
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="researchProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#ff6b00" />
                      <stop offset="100%" style="stop-color:#ff8c00" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="progress-eta">
                  <el-icon><Document /></el-icon>
                  <span>预计还需 {{ getEstimatedTime(activeResearch) }}</span>
                </div>
              </div>

              <div class="research-actions">
                <el-button
                  type="primary"
                  size="large"
                  class="add-progress-btn"
                  :disabled="researchPoints <= 0"
                  @click="addResearchProgress"
                >
                  <el-icon><Plus /></el-icon>
                  添加进度 (消耗 {{ progressCost }} 点数)
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="showCompletionAnimation" class="completion-overlay">
            <div class="completion-content">
              <div class="completion-icon">🎉</div>
              <h3 class="completion-title">研发完成！</h3>
              <p class="completion-desc">已解锁新零件</p>
              <div class="unlocked-part">
                <span class="part-icon">{{ getPartTypeIcon(activeResearch.part_type) }}</span>
                <span class="part-name">{{ activeResearch.part_name }}</span>
                <span :class="['tier-badge', 'tier-' + activeResearch.target_level]">T{{ activeResearch.target_level }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="parts-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Tools /></el-icon>
              <span>零件研发</span>
            </h3>
          </div>

          <div class="parts-grid">
            <div
              v-for="part in partTypes"
              :key="part.type"
              class="part-card"
              :class="{ 'has-active': activeResearch?.part_type === part.type }"
            >
              <div class="part-header">
                <div class="part-icon-large">{{ part.icon }}</div>
                <div class="part-info">
                  <h4 class="part-type-name">{{ part.name }}</h4>
                  <div class="part-level">
                    <span class="level-label">当前等级</span>
                    <span class="level-value">Lv.{{ getCurrentLevel(part.type) }}</span>
                  </div>
                </div>
              </div>

              <div class="part-progress">
                <div class="progress-mini">
                  <div
                    class="progress-fill-mini"
                    :style="{ width: getPartProgress(part.type) + '%' }"
                  ></div>
                </div>
                <span class="progress-text-mini">{{ getPartProgress(part.type) }}%</span>
              </div>

              <div class="part-stats-preview">
                <div class="stat-preview-item">
                  <span class="stat-preview-icon">⚡</span>
                  <span class="stat-preview-value">+{{ getNextLevelBonus(part.type) }}</span>
                </div>
              </div>

              <div class="part-footer">
                <div class="research-cost">
                  <el-icon><Coin /></el-icon>
                  <span>{{ getResearchCost(part.type) }}</span>
                </div>
                <el-button
                  type="primary"
                  size="small"
                  class="start-research-btn"
                  :disabled="activeResearch || !canStartResearch(part.type)"
                  @click="startNewResearch(part.type)"
                >
                  <el-icon><VideoPlay /></el-icon>
                  开始研发
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="side-panel">
        <el-card class="history-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Trophy /></el-icon>
              <span>已解锁</span>
            </h3>
          </div>

          <div v-if="unlockedParts.length === 0" class="empty-history">
            <el-icon :size="32" class="empty-icon"><Box /></el-icon>
            <p>暂无解锁记录</p>
          </div>

          <div v-else class="history-list">
            <div
              v-for="(item, index) in unlockedParts"
              :key="index"
              class="history-item"
            >
              <div class="history-icon" :class="'tier-' + item.tier">
                {{ getPartTypeIcon(item.type) }}
              </div>
              <div class="history-info">
                <div class="history-name">{{ item.name }}</div>
                <div class="history-type">{{ getPartTypeName(item.type) }}</div>
              </div>
              <span :class="['tier-badge', 'tier-' + item.tier]">T{{ item.tier }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="tips-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><InfoFilled /></el-icon>
              <span>研发提示</span>
            </h3>
          </div>
          <div class="tips-list">
            <div class="tip-item">
              <el-icon class="tip-icon"><Aim /></el-icon>
              <span>参加比赛可获得研发点数</span>
            </div>
            <div class="tip-item">
              <el-icon class="tip-icon"><Aim /></el-icon>
              <span>高等级零件提供更多属性加成</span>
            </div>
            <div class="tip-item">
              <el-icon class="tip-icon"><Warning /></el-icon>
              <span>取消研发将损失已投入的资源</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading, Close, Tools, Plus, Coin, VideoPlay,
  Trophy, Box, InfoFilled, Aim, Warning, Document
} from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { startResearch, addProgress, cancelResearch as cancelResearchApi } from '@/api/research'

const gameStore = useGameStore()
const userStore = useUserStore()

const loading = ref(false)
const researchPoints = ref(150)
const progressCost = ref(10)
const showCompletionAnimation = ref(false)
const completionTimer = ref(null)

const researchCircumference = 2 * Math.PI * 80

const partTypes = [
  { type: 'engine', name: '引擎', icon: '⚙️' },
  { type: 'chassis', name: '底盘', icon: '🔩' },
  { type: 'suspension', name: '悬挂', icon: '🔧' },
  { type: 'tires', name: '轮胎', icon: '🛞' },
  { type: 'body', name: '车身', icon: '🚘' },
  { type: 'aerodynamics', name: '空力套件', icon: '🌬️' }
]

const activeResearch = computed(() => {
  return gameStore.researchList.find(r => r.status === 'active') || null
})

const unlockedParts = computed(() => {
  return gameStore.userParts
    .filter(p => p.tier >= 2)
    .sort((a, b) => b.tier - a.tier)
    .slice(0, 10)
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      gameStore.fetchResearch(),
      gameStore.fetchUserParts(),
      userStore.fetchCurrentUser()
    ])
  } catch (error) {
    console.error('Load research data error:', error)
  } finally {
    loading.value = false
  }
})

function getPartTypeIcon(type) {
  const icons = {
    engine: '⚙️',
    chassis: '🔩',
    suspension: '🔧',
    tires: '🛞',
    body: '🚘',
    aerodynamics: '🌬️'
  }
  return icons[type] || '🔧'
}

function getPartTypeName(type) {
  const names = {
    engine: '引擎',
    chassis: '底盘',
    suspension: '悬挂',
    tires: '轮胎',
    body: '车身',
    aerodynamics: '空力套件'
  }
  return names[type] || '零件'
}

function getCurrentLevel(type) {
  const research = gameStore.researchList.find(r => r.part_type === type)
  if (research) {
    return research.current_level || 1
  }
  const parts = gameStore.userParts.filter(p => p.type === type)
  if (parts.length > 0) {
    return Math.max(...parts.map(p => p.tier || 1))
  }
  return 1
}

function getPartProgress(type) {
  const research = gameStore.researchList.find(r => r.part_type === type)
  if (research && research.status === 'active') {
    return research.progress || 0
  }
  return 0
}

function getNextLevelBonus(type) {
  const currentLevel = getCurrentLevel(type)
  return (currentLevel + 1) * 5
}

function getResearchCost(type) {
  const currentLevel = getCurrentLevel(type)
  return currentLevel * 500
}

function canStartResearch(type) {
  const cost = getResearchCost(type)
  return (userStore.user?.coins || 0) >= cost
}

function getResearchOffset(progress) {
  if (!progress) return researchCircumference
  return researchCircumference * (1 - progress / 100)
}

function getEstimatedTime(research) {
  if (!research) return '--'
  const remaining = 100 - (research.progress || 0)
  const pointsNeeded = Math.ceil(remaining / 10) * progressCost.value
  if (researchPoints.value >= pointsNeeded) {
    return '可立即完成'
  }
  return `约 ${Math.ceil(pointsNeeded / 50)} 场比赛`
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

async function startNewResearch(type) {
  const cost = getResearchCost(type)

  try {
    await ElMessageBox.confirm(
      `确定要花费 ${cost} 金币开始研发${getPartTypeName(type)}吗？`,
      '开始研发',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await startResearch({
      part_type: type,
      target_level: getCurrentLevel(type) + 1
    })

    if (res.code === 0 || res.code === 200) {
      ElMessage.success('研发已开始')
      await gameStore.fetchResearch()
    } else {
      ElMessage.error(res.msg || '开始研发失败')
    }
  } catch (error) {
    ElMessage.error('开始研发失败')
  } finally {
    loading.value = false
  }
}

async function addResearchProgress() {
  if (!activeResearch.value || researchPoints.value < progressCost.value) return

  loading.value = true
  try {
    const res = await addProgress({
      research_id: activeResearch.value.id,
      points: progressCost.value
    })

    if (res.code === 0 || res.code === 200) {
      researchPoints.value -= progressCost.value
      await gameStore.fetchResearch()

      const updated = gameStore.researchList.find(r => r.id === activeResearch.value.id)
      if (updated && updated.progress >= 100) {
        triggerCompletionAnimation()
      } else {
        ElMessage.success(`已添加 ${progressCost.value} 点研发进度`)
      }
    } else {
      ElMessage.error(res.msg || '添加进度失败')
    }
  } catch (error) {
    ElMessage.error('添加进度失败')
  } finally {
    loading.value = false
  }
}

async function cancelResearch() {
  if (!activeResearch.value) return

  try {
    await ElMessageBox.confirm(
      '取消研发将损失已投入的资源，确定要取消吗？',
      '取消研发',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续研发',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await cancelResearchApi(activeResearch.value.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('已取消研发')
      await gameStore.fetchResearch()
    } else {
      ElMessage.error(res.msg || '取消研发失败')
    }
  } catch (error) {
    ElMessage.error('取消研发失败')
  } finally {
    loading.value = false
  }
}

function triggerCompletionAnimation() {
  showCompletionAnimation.value = true
  if (completionTimer.value) {
    clearTimeout(completionTimer.value)
  }
  completionTimer.value = setTimeout(() => {
    showCompletionAnimation.value = false
    ElMessage.success('研发完成！新零件已解锁')
  }, 3000)
}
</script>

<style scoped>
.research-container {
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 32px;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-stats {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
}

.stat-icon {
  font-size: 20px;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b00;
}

.research-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.main-content,
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.active-research-card,
.parts-card,
.history-card,
.tips-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%) !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 16px !important;
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.active-research-card {
  animation-delay: 0.1s;
}

.parts-card {
  animation-delay: 0.2s;
}

.history-card {
  animation-delay: 0.3s;
}

.tips-card {
  animation-delay: 0.4s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.card-title .el-icon {
  color: #ff6b00;
}

.active-research-content {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 32px;
  align-items: center;
}

.research-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.research-svg {
  width: 200px;
  height: 200px;
}

.research-progress-ring {
  transition: stroke-dashoffset 0.5s ease-out;
}

.research-part-type {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.part-type-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.research-level {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
}

.research-name {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.research-desc {
  font-size: 14px;
  color: #888;
  margin-bottom: 24px;
}

.research-progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  color: #888;
}

.progress-value {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b00;
}

.main-progress {
  margin-bottom: 12px;
}

.progress-eta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.progress-eta .el-icon {
  color: #ff6b00;
}

.add-progress-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.add-progress-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
}

.completion-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 15, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  animation: fadeIn 0.3s ease;
}

.completion-content {
  text-align: center;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.completion-icon {
  font-size: 80px;
  margin-bottom: 16px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.completion-title {
  font-size: 32px;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 8px;
}

.completion-desc {
  font-size: 16px;
  color: #888;
  margin-bottom: 24px;
}

.unlocked-part {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 32px;
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 12px;
}

.unlocked-part .part-icon {
  font-size: 32px;
}

.unlocked-part .part-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.parts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.part-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.part-card:hover {
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.1);
}

.part-card.has-active {
  border-color: rgba(255, 107, 0, 0.5);
  background: rgba(255, 107, 0, 0.05);
}

.part-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.part-icon-large {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.part-info {
  flex: 1;
}

.part-type-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.part-level {
  display: flex;
  align-items: center;
  gap: 6px;
}

.level-label {
  font-size: 12px;
  color: #666;
}

.level-value {
  font-size: 14px;
  font-weight: 600;
  color: #ff6b00;
}

.part-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-mini {
  flex: 1;
  height: 6px;
  background: #2a2a4a;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text-mini {
  font-size: 12px;
  font-weight: 600;
  color: #ff6b00;
  min-width: 36px;
  text-align: right;
}

.part-stats-preview {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 8px;
}

.stat-preview-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.stat-preview-icon {
  font-size: 16px;
}

.stat-preview-value {
  color: #4ade80;
  font-weight: 600;
}

.part-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.research-cost {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #fbbf24;
  font-weight: 600;
}

.research-cost .el-icon {
  font-size: 16px;
}

.start-research-btn {
  font-size: 13px;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.empty-icon {
  color: #444;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(255, 107, 0, 0.05);
  border-color: rgba(255, 107, 0, 0.3);
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.history-icon.tier-2 { background: rgba(74, 222, 128, 0.2); }
.history-icon.tier-3 { background: rgba(96, 165, 250, 0.2); }
.history-icon.tier-4 { background: rgba(192, 132, 252, 0.2); }
.history-icon.tier-5 { background: rgba(251, 191, 36, 0.2); }

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
}

.history-type {
  font-size: 12px;
  color: #888;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  font-size: 13px;
  color: #888;
  line-height: 1.5;
}

.tip-icon {
  color: #ff6b00;
  flex-shrink: 0;
  margin-top: 1px;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.tier-1 { background: rgba(128, 128, 128, 0.2); color: #aaa; }
.tier-2 { background: rgba(0, 255, 0, 0.2); color: #4ade80; }
.tier-3 { background: rgba(0, 112, 255, 0.2); color: #60a5fa; }
.tier-4 { background: rgba(147, 51, 234, 0.2); color: #c084fc; }
.tier-5 { background: rgba(255, 215, 0, 0.2); color: #fbbf24; }

@media (max-width: 1200px) {
  .research-layout {
    grid-template-columns: 1fr;
  }

  .parts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .research-container {
    padding: 16px;
  }

  .header-stats {
    flex-wrap: wrap;
  }

  .active-research-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .parts-grid {
    grid-template-columns: 1fr;
  }

  .completion-title {
    font-size: 24px;
  }
}
</style>
