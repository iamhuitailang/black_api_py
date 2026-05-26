<template>
  <div class="points-container">
    <div class="page-header">
      <div class="header-content">
        <h1>💰 我的积分</h1>
      </div>
    </div>

    <div class="main-content">
      <div class="points-overview">
        <div class="overview-card">
          <div class="overview-item">
            <span class="label">当前积分</span>
            <span class="value highlight">{{ summary.current_points || 0 }}</span>
          </div>
          <div class="overview-item">
            <span class="label">累计获得</span>
            <span class="value">{{ summary.total_points || 0 }}</span>
          </div>
          <div class="overview-item">
            <span class="label">今日获得</span>
            <span class="value success">+{{ summary.today_points || 0 }}</span>
          </div>
          <div class="overview-item">
            <span class="label">本月获得</span>
            <span class="value success">+{{ summary.month_points || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="records-section">
        <div class="section-header">
          <h2>📊 积分明细</h2>
          <div class="filter-tabs">
            <span 
              :class="{ active: activeType === '' }"
              @click="filterByType('')"
            >全部</span>
            <span 
              :class="{ active: activeType === 'task' }"
              @click="filterByType('task')"
            >任务</span>
            <span 
              :class="{ active: activeType === 'exchange' }"
              @click="filterByType('exchange')"
            >兑换</span>
            <span 
              :class="{ active: activeType === 'signin' }"
              @click="filterByType('signin')"
            >签到</span>
          </div>
        </div>
        <div class="records-list">
          <div v-for="record in records" :key="record.id" class="record-item">
            <div class="record-info">
              <span class="record-desc">{{ record.description }}</span>
              <span class="record-time">{{ formatTime(record.created_at) }}</span>
            </div>
            <div class="record-points" :class="{ positive: record.points > 0 }">
              {{ record.points > 0 ? '+' : '' }}{{ record.points }}
            </div>
          </div>
          <div v-if="records.length === 0" class="empty-state">
            暂无积分记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pointsApi } from '@/api/points'

const summary = ref({
  current_points: 0,
  total_points: 0,
  today_points: 0,
  month_points: 0
})

const records = ref<any[]>([])
const activeType = ref('')

onMounted(async () => {
  await loadSummary()
  await loadRecords()
})

async function loadSummary() {
  try {
    const res: any = await pointsApi.getSummary()
    summary.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function loadRecords() {
  try {
    const params: any = { page: 1, page_size: 50 }
    if (activeType.value) {
      params.points_type = activeType.value
    }
    const res: any = await pointsApi.getRecords(params)
    records.value = res.data
  } catch (error) {
    console.error(error)
  }
}

function filterByType(type: string) {
  activeType.value = type
  loadRecords()
}

function formatTime(time: string) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.points-container {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  padding: 20px 0;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.points-overview {
  margin-bottom: 30px;
}

.overview-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.15);
}

.overview-item {
  text-align: center;
}

.overview-item .label {
  display: block;
  color: #999;
  font-size: 13px;
  margin-bottom: 8px;
}

.overview-item .value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.overview-item .value.highlight {
  color: #FF8C00;
  font-size: 32px;
}

.overview-item .value.success {
  color: #67C23A;
}

.records-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
}

.filter-tabs span {
  padding: 6px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.3s;
}

.filter-tabs span.active {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
}

.records-list {
  max-height: 500px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-desc {
  font-size: 14px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-points {
  font-weight: 700;
  font-size: 16px;
  color: #F56C6C;
}

.record-points.positive {
  color: #67C23A;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
