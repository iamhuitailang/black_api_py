<template>
  <div class="wind-tunnel-container">
    <div class="page-header">
      <h1 class="page-title">风洞实验室</h1>
      <p class="page-subtitle">测试赛车的空气动力学性能</p>
    </div>

    <div v-loading="loading" class="wind-tunnel-layout">
      <div class="left-panel">
        <el-card class="control-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Setting /></el-icon>
              <span>测试设置</span>
            </h3>
          </div>

          <div class="control-section">
            <label class="control-label">选择测试车辆</label>
            <el-select v-model="selectedCarId" placeholder="请选择要测试的赛车" class="full-width">
              <el-option
                v-for="car in gameStore.cars"
                :key="car.id"
                :value="car.id"
                :label="car.name"
              >
                <div class="car-option">
                  <span class="car-option-name">{{ car.name }}</span>
                  <span :class="['tier-badge', 'tier-' + car.tier]">T{{ car.tier }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <div class="control-section">
            <label class="control-label">测试类型</label>
            <el-tabs v-model="activeTestType" class="test-type-tabs">
              <el-tab-pane label="风阻测试" name="drag">
                <div class="tab-desc">测量赛车的空气阻力系数，优化直线加速性能</div>
              </el-tab-pane>
              <el-tab-pane label="下压力测试" name="downforce">
                <div class="tab-desc">测试赛车在高速行驶时的抓地力表现</div>
              </el-tab-pane>
              <el-tab-pane label="综合平衡测试" name="balance">
                <div class="tab-desc">全面评估赛车的空气动力学平衡性能</div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <el-button
            type="primary"
            size="large"
            class="start-test-btn"
            :disabled="!selectedCarId || isTesting"
            :loading="isTesting"
            @click="startTest"
          >
            <el-icon v-if="!isTesting"><Aim /></el-icon>
            {{ isTesting ? '测试中...' : '开始测试' }}
          </el-button>

          <div v-if="isTesting" class="testing-indicator">
            <div class="wind-particles">
              <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
            </div>
            <div class="testing-text">
              <span class="pulse">风洞运行中</span>
              <el-progress
                :percentage="testProgress"
                :stroke-width="8"
                color="#ff6b00"
                :show-text="false"
                class="test-progress"
              />
            </div>
          </div>
        </el-card>

        <el-card class="history-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Document /></el-icon>
              <span>测试历史</span>
            </h3>
          </div>

          <div v-if="testHistory.length === 0" class="empty-history">
            <el-icon :size="32" class="empty-icon"><Document /></el-icon>
            <p>暂无测试记录</p>
          </div>

          <div v-else class="history-list">
            <div
              v-for="(record, index) in testHistory"
              :key="index"
              class="history-item"
              @click="loadTestResult(record)"
            >
              <div class="history-icon" :class="record.type">
                {{ getTestTypeIcon(record.type) }}
              </div>
              <div class="history-info">
                <div class="history-car">{{ record.car_name }}</div>
                <div class="history-type">{{ getTestTypeName(record.type) }}</div>
                <div class="history-time">{{ formatTime(record.created_at) }}</div>
              </div>
              <div class="history-score">
                <span class="score-value">{{ record.balance_score || record.cd_value || record.downforce_total }}</span>
                <span class="score-label">{{ getScoreLabel(record.type) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="results-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Setting /></el-icon>
              <span>测试结果</span>
            </h3>
            <div v-if="currentResult" class="result-car-info">
              <span :class="['tier-badge', 'tier-' + currentResult.car_tier]">T{{ currentResult.car_tier }}</span>
              <span class="car-name">{{ currentResult.car_name }}</span>
            </div>
          </div>

          <div v-if="!currentResult && !isTesting" class="no-result">
            <svg class="wind-tunnel-svg" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="tunnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#1a1a2e" />
                  <stop offset="50%" style="stop-color:#0a0a0f" />
                  <stop offset="100%" style="stop-color:#1a1a2e" />
                </linearGradient>
              </defs>
              <rect x="20" y="40" width="360" height="120" rx="10" fill="url(#tunnelGrad)" stroke="#2a2a4a" stroke-width="2" />
              <rect x="30" y="50" width="40" height="100" rx="5" fill="#2a2a4a" />
              <rect x="330" y="50" width="40" height="100" rx="5" fill="#2a2a4a" />
              <path
                d="M120 130 L140 100 L180 80 L280 80 L320 100 L340 130 L370 130 L370 150 L340 150 L330 165 L300 165 L290 150 L150 150 L140 165 L110 165 L100 150 L70 150 L70 130 Z"
                fill="#3a3a5e"
                opacity="0.5"
              />
              <text x="200" y="100" text-anchor="middle" fill="#555" font-size="14">选择车辆并开始测试</text>
            </svg>
          </div>

          <div v-else-if="isTesting" class="testing-animation">
            <svg class="testing-svg" viewBox="0 0 500 250">
              <defs>
                <linearGradient id="windGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#1a1a2e" />
                  <stop offset="50%" style="stop-color:#0a0a0f" />
                  <stop offset="100%" style="stop-color:#1a1a2e" />
                </linearGradient>
              </defs>
              <rect x="20" y="50" width="460" height="150" rx="15" fill="url(#windGrad)" stroke="#2a2a4a" stroke-width="2" />

              <g class="wind-flow">
                <path v-for="i in 8" :key="i" :d="getWindPath(i)" stroke="#ff6b00" stroke-width="2" fill="none" opacity="0.6">
                  <animate attributeName="opacity" values="0.2;0.8;0.2" :dur="(1 + i * 0.1) + 's'" repeatCount="indefinite" />
                </path>
              </g>

              <path
                d="M150 160 L170 130 L220 110 L350 110 L400 130 L420 160 L450 160 L450 180 L420 180 L410 195 L380 195 L370 180 L200 180 L190 195 L160 195 L150 180 L120 180 L120 160 Z"
                :fill="selectedCar?.color || '#ff6b00'"
                class="testing-car"
              >
                <animateTransform attributeName="transform" type="translate" values="0,0;-2,0;0,0;2,0;0,0" dur="0.5s" repeatCount="indefinite" />
              </path>

              <circle cx="180" cy="185" r="18" fill="#1a1a2e">
                <animateTransform attributeName="transform" type="rotate" from="0 180 185" to="360 180 185" dur="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="390" cy="185" r="18" fill="#1a1a2e">
                <animateTransform attributeName="transform" type="rotate" from="0 390 185" to="360 390 185" dur="0.3s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <div v-else class="results-grid">
            <div class="result-card drag-card">
              <div class="result-header">
                <span class="result-icon">🌪️</span>
                <span class="result-title">风阻系数 (Cd)</span>
              </div>
              <svg class="gauge-svg" viewBox="0 0 200 120">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#4ade80" />
                    <stop offset="50%" style="stop-color:#fbbf24" />
                    <stop offset="100%" style="stop-color:#ef4444" />
                  </linearGradient>
                </defs>
                <path
                  d="M20 100 A80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#2a2a4a"
                  stroke-width="12"
                  stroke-linecap="round"
                />
                <path
                  :d="getGaugePath(currentResult.cd_value)"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  stroke-width="12"
                  stroke-linecap="round"
                  class="gauge-fill"
                />
                <g transform="translate(100, 85)">
                  <line
                    x1="0"
                    y1="0"
                    :x2="getNeedleX(currentResult.cd_value)"
                    :y2="getNeedleY(currentResult.cd_value)"
                    stroke="#ff6b00"
                    stroke-width="3"
                    stroke-linecap="round"
                    class="needle"
                  />
                  <circle cx="0" cy="0" r="6" fill="#ff6b00" />
                </g>
                <text x="100" y="115" text-anchor="middle" fill="#888" font-size="10">0.20 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0.50</text>
              </svg>
              <div class="result-value">{{ currentResult.cd_value?.toFixed(3) || '--' }}</div>
              <div class="result-rating" :class="getCdRating(currentResult.cd_value).class">
                {{ getCdRating(currentResult.cd_value).text }}
              </div>
            </div>

            <div class="result-card downforce-card">
              <div class="result-header">
                <span class="result-icon">⬇️</span>
                <span class="result-title">下压力</span>
              </div>
              <div class="downforce-bars">
                <div class="bar-item">
                  <span class="bar-label">前轴</span>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill front"
                      :style="{ height: (currentResult.downforce_front || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-value">{{ currentResult.downforce_front || 0 }}</span>
                </div>
                <div class="bar-item">
                  <span class="bar-label">后轴</span>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill rear"
                      :style="{ height: (currentResult.downforce_rear || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-value">{{ currentResult.downforce_rear || 0 }}</span>
                </div>
                <div class="bar-item">
                  <span class="bar-label">总计</span>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill total"
                      :style="{ height: (currentResult.downforce_total || 0) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-value">{{ currentResult.downforce_total || 0 }}</span>
                </div>
              </div>
              <div class="balance-indicator">
                <span class="balance-label">前后平衡</span>
                <div class="balance-bar">
                  <div
                    class="balance-fill"
                    :style="{ left: getBalancePosition(currentResult) + '%' }"
                  ></div>
                </div>
                <span class="balance-value">{{ getBalanceRatio(currentResult) }}</span>
              </div>
            </div>

            <div class="result-card balance-card">
              <div class="result-header">
                <span class="result-icon">⚖️</span>
                <span class="result-title">综合评分</span>
              </div>
              <svg class="circle-svg" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b00" />
                    <stop offset="100%" style="stop-color:#ff8c00" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke="#2a2a4a"
                  stroke-width="10"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke="url(#circleGrad)"
                  stroke-width="10"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="getCircleOffset(currentResult.balance_score)"
                  transform="rotate(-90 80 80)"
                  class="circle-progress"
                />
                <text x="80" y="75" text-anchor="middle" fill="#fff" font-size="32" font-weight="bold" class="score-text">
                  {{ currentResult.balance_score || 0 }}
                </text>
                <text x="80" y="95" text-anchor="middle" fill="#888" font-size="12">/ 100</text>
              </svg>
              <div class="score-rating" :class="getScoreRating(currentResult.balance_score).class">
                {{ getScoreRating(currentResult.balance_score).text }}
              </div>
            </div>

            <div class="result-card speed-card">
              <div class="result-header">
                <span class="result-icon">🚀</span>
                <span class="result-title">预估最高速度</span>
              </div>
              <svg class="speed-svg" viewBox="0 0 200 150">
                <defs>
                  <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#3b82f6" />
                    <stop offset="50%" style="stop-color:#8b5cf6" />
                    <stop offset="100%" style="stop-color:#ff6b00" />
                  </linearGradient>
                </defs>
                <path
                  d="M30 120 L170 120"
                  stroke="#2a2a4a"
                  stroke-width="4"
                  stroke-linecap="round"
                />
                <g v-for="i in 6" :key="i" :transform="'translate(' + (30 + i * 28) + ', 120)'">
                  <line x1="0" y1="0" x2="0" y2="-10" stroke="#444" stroke-width="2" />
                  <text x="0" y="20" text-anchor="middle" fill="#666" font-size="10">{{ (i - 1) * 80 }}</text>
                </g>
                <g :transform="'translate(' + getSpeedPosition(currentResult.estimated_top_speed) + ', 120)'">
                  <polygon points="0,-25 -8,-15 8,-15" fill="#ff6b00" class="speed-pointer" />
                  <rect x="-25" y="-55" width="50" height="25" rx="5" fill="#ff6b00" />
                  <text x="0" y="-38" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">
                    {{ currentResult.estimated_top_speed || 0 }}
                  </text>
                </g>
              </svg>
              <div class="speed-unit">km/h</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Aim, Document } from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/game'
import { runTest, getUserTests } from '@/api/windTunnel'

const gameStore = useGameStore()

const loading = ref(false)
const isTesting = ref(false)
const testProgress = ref(0)
const selectedCarId = ref(null)
const activeTestType = ref('drag')
const testHistory = ref([])
const currentResult = ref(null)
const testTimer = ref(null)

const circumference = 2 * Math.PI * 65

const selectedCar = computed(() => {
  return gameStore.getCarById(selectedCarId.value)
})

onMounted(async () => {
  loading.value = true
  try {
    await gameStore.fetchCars()
    await loadTestHistory()
  } catch (error) {
    console.error('Load wind tunnel data error:', error)
  } finally {
    loading.value = false
  }
})

async function loadTestHistory() {
  try {
    const res = await getUserTests({ page: 1, page_size: 10 })
    if (res.code === 0 || res.code === 200) {
      testHistory.value = res.data?.list || res.data || []
    }
  } catch (error) {
    console.error('Load test history error:', error)
  }
}

function getParticleStyle(i) {
  const delay = (i * 0.1) % 2
  const top = 20 + (i % 5) * 15
  return {
    top: top + '%',
    animationDelay: delay + 's',
    animationDuration: (1.5 + Math.random()) + 's'
  }
}

function getTestTypeIcon(type) {
  const icons = {
    drag: '🌪️',
    downforce: '⬇️',
    balance: '⚖️'
  }
  return icons[type] || '📊'
}

function getTestTypeName(type) {
  const names = {
    drag: '风阻测试',
    downforce: '下压力测试',
    balance: '综合平衡测试'
  }
  return names[type] || '测试'
}

function getScoreLabel(type) {
  const labels = {
    drag: 'Cd值',
    downforce: '下压力',
    balance: '评分'
  }
  return labels[type] || ''
}

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getWindPath(i) {
  const y = 60 + i * 18
  return `M 40 ${y} Q 100 ${y - 10} 200 ${y} T 460 ${y}`
}

function getGaugePath(cd) {
  if (!cd) return ''
  const normalized = Math.max(0, Math.min(1, (cd - 0.2) / 0.3))
  const angle = Math.PI * normalized
  const startX = 20 + 80 * Math.cos(Math.PI)
  const startY = 100 + 80 * Math.sin(Math.PI)
  const endX = 20 + 80 * Math.cos(Math.PI + angle)
  const endY = 100 + 80 * Math.sin(Math.PI + angle)
  const largeArc = angle > Math.PI ? 1 : 0
  return `M ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY}`
}

function getNeedleX(cd) {
  if (!cd) return 0
  const normalized = Math.max(0, Math.min(1, (cd - 0.2) / 0.3))
  const angle = Math.PI * (1 + normalized)
  return Math.cos(angle) * 50
}

function getNeedleY(cd) {
  if (!cd) return -50
  const normalized = Math.max(0, Math.min(1, (cd - 0.2) / 0.3))
  const angle = Math.PI * (1 + normalized)
  return Math.sin(angle) * 50
}

function getCdRating(cd) {
  if (!cd) return { text: '--', class: '' }
  if (cd <= 0.28) return { text: '优秀', class: 'excellent' }
  if (cd <= 0.35) return { text: '良好', class: 'good' }
  if (cd <= 0.42) return { text: '一般', class: 'average' }
  return { text: '较差', class: 'poor' }
}

function getBalancePosition(result) {
  if (!result) return 50
  const front = result.downforce_front || 0
  const rear = result.downforce_rear || 0
  const total = front + rear
  if (total === 0) return 50
  return (front / total) * 100
}

function getBalanceRatio(result) {
  if (!result) return '--'
  const front = result.downforce_front || 0
  const rear = result.downforce_rear || 0
  const total = front + rear
  if (total === 0) return '--'
  const frontPercent = Math.round((front / total) * 100)
  const rearPercent = 100 - frontPercent
  return `${frontPercent}% : ${rearPercent}%`
}

function getCircleOffset(score) {
  if (!score) return circumference
  return circumference * (1 - score / 100)
}

function getScoreRating(score) {
  if (!score) return { text: '--', class: '' }
  if (score >= 90) return { text: '卓越', class: 'excellent' }
  if (score >= 75) return { text: '优秀', class: 'excellent' }
  if (score >= 60) return { text: '良好', class: 'good' }
  if (score >= 40) return { text: '一般', class: 'average' }
  return { text: '较差', class: 'poor' }
}

function getSpeedPosition(speed) {
  if (!speed) return 30
  const normalized = Math.max(0, Math.min(1, speed / 400))
  return 30 + normalized * 140
}

function loadTestResult(record) {
  currentResult.value = {
    ...record,
    car_name: record.car_name,
    car_tier: record.car_tier || 1,
    cd_value: record.cd_value,
    downforce_front: record.downforce_front,
    downforce_rear: record.downforce_rear,
    downforce_total: record.downforce_total,
    balance_score: record.balance_score,
    estimated_top_speed: record.estimated_top_speed,
    type: record.type
  }
}

async function startTest() {
  if (!selectedCarId.value) {
    ElMessage.warning('请先选择测试车辆')
    return
  }

  isTesting.value = true
  testProgress.value = 0

  testTimer.value = setInterval(() => {
    testProgress.value += Math.random() * 8
    if (testProgress.value >= 100) {
      testProgress.value = 100
      clearInterval(testTimer.value)
      finishTest()
    }
  }, 200)

  try {
    const res = await runTest({
      car_id: selectedCarId.value,
      test_type: activeTestType.value
    })

    if (res.code === 0 || res.code === 200) {
      setTimeout(() => {
        currentResult.value = {
          ...res.data,
          car_name: selectedCar.value?.name,
          car_tier: selectedCar.value?.tier || 1
        }
        loadTestHistory()
      }, 3000)
    } else {
      ElMessage.error(res.msg || '测试失败')
      isTesting.value = false
      clearInterval(testTimer.value)
    }
  } catch (error) {
    ElMessage.error('测试失败')
    isTesting.value = false
    clearInterval(testTimer.value)
  }
}

function finishTest() {
  isTesting.value = false
  ElMessage.success('测试完成！')
}
</script>

<style scoped>
.wind-tunnel-container {
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

.wind-tunnel-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.control-card,
.history-card,
.results-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%) !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 16px !important;
  animation: fadeInUp 0.6s ease-out backwards;
}

.control-card {
  animation-delay: 0.1s;
}

.history-card {
  animation-delay: 0.2s;
}

.results-card {
  animation-delay: 0.3s;
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

.control-section {
  margin-bottom: 24px;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 12px;
}

.full-width {
  width: 100%;
}

.car-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.car-option-name {
  color: #fff;
}

.test-type-tabs {
  margin-top: -8px;
}

.tab-desc {
  font-size: 13px;
  color: #888;
  padding: 12px 0;
  line-height: 1.5;
}

.start-test-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.start-test-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
}

.testing-indicator {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 12px;
}

.wind-particles {
  position: relative;
  height: 40px;
  margin-bottom: 12px;
  overflow: hidden;
}

.particle {
  position: absolute;
  left: -10px;
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff6b00, transparent);
  border-radius: 2px;
  animation: windFlow linear infinite;
}

@keyframes windFlow {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(380px);
    opacity: 0;
  }
}

.testing-text {
  text-align: center;
}

.pulse {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: #ff6b00;
  margin-bottom: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.test-progress {
  width: 100%;
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(255, 107, 0, 0.05);
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateX(4px);
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

.history-icon.drag {
  background: rgba(59, 130, 246, 0.2);
}

.history-icon.downforce {
  background: rgba(34, 197, 94, 0.2);
}

.history-icon.balance {
  background: rgba(255, 107, 0, 0.2);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-car {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
}

.history-type {
  font-size: 12px;
  color: #888;
  margin-bottom: 2px;
}

.history-time {
  font-size: 11px;
  color: #555;
}

.history-score {
  text-align: right;
  flex-shrink: 0;
}

.score-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #ff6b00;
}

.score-label {
  font-size: 11px;
  color: #666;
}

.result-car-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.car-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.no-result {
  padding: 40px;
  text-align: center;
}

.wind-tunnel-svg {
  width: 100%;
  max-width: 400px;
  height: auto;
}

.testing-animation {
  padding: 20px;
}

.testing-svg {
  width: 100%;
  height: auto;
}

.testing-car {
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
}

.results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.result-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.result-card:hover {
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateY(-4px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.result-icon {
  font-size: 20px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.gauge-svg {
  width: 100%;
  height: auto;
  margin-bottom: 12px;
}

.gauge-fill {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawGauge 1.5s ease-out forwards;
}

@keyframes drawGauge {
  to {
    stroke-dashoffset: 0;
  }
}

.needle {
  transform-origin: 100px 85px;
  animation: swingNeedle 1.5s ease-out;
}

@keyframes swingNeedle {
  0% {
    transform: rotate(-90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.result-value {
  text-align: center;
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.result-rating {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
}

.result-rating.excellent {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.result-rating.good {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.result-rating.average {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.result-rating.poor {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.downforce-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 180px;
  margin-bottom: 20px;
  padding: 20px 10px 0;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 12px;
  color: #888;
  order: 3;
}

.bar-wrapper {
  width: 40px;
  height: 140px;
  background: #2a2a4a;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  order: 2;
}

.bar-fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  transition: height 1s ease-out;
}

.bar-fill.front {
  background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
}

.bar-fill.rear {
  background: linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%);
}

.bar-fill.total {
  background: linear-gradient(180deg, #ff6b00 0%, #cc5500 100%);
}

.bar-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  order: 1;
}

.balance-indicator {
  padding-top: 16px;
  border-top: 1px solid #2a2a4a;
}

.balance-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 12px;
  text-align: center;
}

.balance-bar {
  position: relative;
  height: 8px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ff6b00 100%);
  border-radius: 4px;
  margin-bottom: 8px;
}

.balance-fill {
  position: absolute;
  top: -4px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: left 1s ease-out;
}

.balance-value {
  display: block;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #ff6b00;
}

.circle-svg {
  width: 160px;
  height: 160px;
  display: block;
  margin: 0 auto 12px;
}

.circle-progress {
  transition: stroke-dashoffset 1.5s ease-out;
}

.score-text {
  animation: scorePop 1s ease-out;
}

@keyframes scorePop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.score-rating {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
}

.score-rating.excellent {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.score-rating.good {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.score-rating.average {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.score-rating.poor {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.speed-svg {
  width: 100%;
  height: auto;
  margin-bottom: 12px;
}

.speed-pointer {
  transition: transform 1.5s ease-out;
}

.speed-unit {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #888;
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

:deep(.el-tabs__item) {
  font-size: 13px;
}

:deep(.el-tabs__active-bar) {
  background-color: #ff6b00;
}

:deep(.el-tabs__item.is-active) {
  color: #ff6b00;
}

@media (max-width: 1200px) {
  .wind-tunnel-layout {
    grid-template-columns: 1fr;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .wind-tunnel-container {
    padding: 16px;
  }

  .downforce-bars {
    height: 150px;
  }

  .bar-wrapper {
    width: 32px;
  }
}
</style>
