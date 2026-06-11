<template>
  <div class="stats-page">
    <div class="page-header">
      <h1>统计分析</h1>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="stats.length === 0" class="empty-state">
      <div class="empty-state-icon">📊</div>
      <p>暂无统计数据</p>
      <p class="sub-text">创建项目和会议后这里会显示统计信息</p>
    </div>

    <div v-else class="stats-container">
      <div class="summary-cards">
        <div class="summary-card card">
          <div class="card-icon">📁</div>
          <div class="card-content">
            <div class="card-value">{{ totalProjects }}</div>
            <div class="card-label">项目总数</div>
          </div>
        </div>
        <div class="summary-card card">
          <div class="card-icon">📋</div>
          <div class="card-content">
            <div class="card-value">{{ totalMeetings }}</div>
            <div class="card-label">会议总数</div>
          </div>
        </div>
        <div class="summary-card card">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <div class="card-value">{{ totalActionItems }}</div>
            <div class="card-label">待办总数</div>
          </div>
        </div>
        <div class="summary-card card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <div class="card-value">{{ overallCompletionRate }}%</div>
            <div class="card-label">整体完成率</div>
          </div>
        </div>
      </div>

      <div class="stats-section card">
        <h2 class="section-title">📊 各项目统计</h2>
        <div class="project-stats">
          <div
            v-for="project in stats"
            :key="project.project_id"
            class="project-stat-item"
          >
            <div class="project-stat-header">
              <h3 class="project-name">{{ project.project_name }}</h3>
              <span class="meeting-count">{{ project.meeting_count }} 次会议</span>
            </div>
            <div class="progress-section">
              <div class="progress-label">
                <span>待办完成率</span>
                <span class="progress-value">
                  {{ project.action_completed }} / {{ project.action_total }}
                  ({{ project.completion_rate }}%)
                </span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: project.completion_rate + '%' }"
                  :class="getProgressClass(project.completion_rate)"
                ></div>
              </div>
            </div>
            <div v-if="project.top_assignees && project.top_assignees.length > 0" class="assignees-section">
              <div class="assignees-title">🏆 参与人排名</div>
              <div class="assignees-list">
                <div
                  v-for="(assignee, index) in project.top_assignees"
                  :key="assignee.assignee"
                  class="assignee-item"
                >
                  <span class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
                  <span class="assignee-name">{{ assignee.assignee }}</span>
                  <span class="assignee-stats">
                    {{ assignee.completed }}/{{ assignee.total }} 完成
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { statsApi } from '../api'

const stats = ref([])
const loading = ref(false)

const totalProjects = computed(() => stats.value.length)

const totalMeetings = computed(() => {
  return stats.value.reduce((sum, p) => sum + p.meeting_count, 0)
})

const totalActionItems = computed(() => {
  return stats.value.reduce((sum, p) => sum + p.action_total, 0)
})

const overallCompletionRate = computed(() => {
  const total = totalActionItems.value
  if (total === 0) return 0
  const completed = stats.value.reduce((sum, p) => sum + p.action_completed, 0)
  return Math.round((completed / total) * 100)
})

function getProgressClass(rate) {
  if (rate >= 80) return 'progress-high'
  if (rate >= 50) return 'progress-medium'
  return 'progress-low'
}

async function loadStats() {
  loading.value = true
  try {
    stats.value = await statsApi.getProjectStats()
  } catch (e) {
    console.error('加载统计数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 24px 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.sub-text {
  color: #9ca3af;
  font-size: 14px;
  margin-top: 8px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.card-icon {
  font-size: 36px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.card-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.stats-section {
  padding: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.project-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-stat-item {
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.project-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.meeting-count {
  font-size: 13px;
  color: #6b7280;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

.progress-value {
  font-weight: 500;
  color: #374151;
}

.progress-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-high {
  background-color: #10b981;
}

.progress-medium {
  background-color: #f59e0b;
}

.progress-low {
  background-color: #ef4444;
}

.assignees-section {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.assignees-title {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.assignees-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.assignee-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background-color: #e5e7eb;
  color: #6b7280;
}

.rank-1 {
  background-color: #fef3c7;
  color: #b45309;
}

.rank-2 {
  background-color: #f3f4f6;
  color: #6b7280;
}

.rank-3 {
  background-color: #fed7aa;
  color: #c2410c;
}

.assignee-name {
  flex: 1;
  color: #374151;
}

.assignee-stats {
  color: #9ca3af;
  font-size: 12px;
}
</style>
