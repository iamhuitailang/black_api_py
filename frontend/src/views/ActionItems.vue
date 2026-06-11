<template>
  <div class="action-items-page">
    <div class="page-header">
      <h1>待办事项</h1>
      <div class="filter-tabs">
        <button
          class="tab-btn"
          :class="{ active: filter === 'pending' }"
          @click="filter = 'pending'"
        >
          未完成
          <span class="tab-count">{{ pendingCount }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: filter === 'overdue' }"
          @click="filter = 'overdue'"
        >
          已过期
          <span class="tab-count" style="background: #fee2e2; color: #dc2626;">{{ overdueCount }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
        >
          全部
        </button>
      </div>
    </div>

    <div class="filter-bar card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="form-label">项目</label>
          <select class="form-select" v-model="projectFilter" @change="loadActionItems">
            <option :value="null">全部项目</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="form-label">责任人</label>
          <select class="form-select" v-model="assigneeFilter" @change="loadActionItems">
            <option value="">全部责任人</option>
            <option v-for="a in allAssignees" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <div class="empty-state-icon">✅</div>
      <p>暂无待办事项</p>
    </div>

    <div v-else class="action-list">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="action-item-card card"
        :class="'urgency-' + item.status"
      >
        <div class="action-left">
          <label class="checkbox-wrapper">
            <input
              type="checkbox"
              :checked="item.completed"
              @change="toggleAction(item)"
            />
            <span class="checkmark"></span>
          </label>
          <div class="action-content">
            <p class="action-text" :class="{ completed: item.completed }">
              {{ item.content }}
            </p>
            <div class="action-meta">
              <span v-if="item.assignee" class="meta-item">
                👤 {{ item.assignee }}
              </span>
              <span v-if="item.due_date" class="meta-item" :class="'status-' + item.status">
                📅 {{ formatDate(item.due_date) }}
                <span class="status-text">({{ getStatusText(item) }})</span>
              </span>
              <span v-if="item.project_name" class="meta-item">
                📁 {{ item.project_name }}
              </span>
            </div>
          </div>
        </div>
        <button
          class="btn btn-secondary btn-sm go-btn"
          @click="goToMeeting(item.meeting_id)"
        >
          查看纪要 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { actionItemApi, projectApi } from '../api'
import { formatDate, getDaysUntil, getUrgencyText } from '../utils'

const router = useRouter()

const actionItems = ref([])
const projects = ref([])
const loading = ref(false)
const filter = ref('pending')
const projectFilter = ref(null)
const assigneeFilter = ref('')

const allAssignees = computed(() => {
  const set = new Set()
  actionItems.value.forEach(item => {
    if (item.assignee) set.add(item.assignee)
  })
  return Array.from(set).sort()
})

const pendingCount = computed(() => {
  return actionItems.value.filter(i => !i.completed).length
})

const overdueCount = computed(() => {
  return actionItems.value.filter(i => !i.completed && i.status === 'overdue').length
})

const filteredItems = computed(() => {
  let items = [...actionItems.value]

  if (filter.value === 'pending') {
    items = items.filter(i => !i.completed)
  } else if (filter.value === 'overdue') {
    items = items.filter(i => !i.completed && i.status === 'overdue')
  }

  if (projectFilter.value !== null) {
    items = items.filter(i => i.project_id === projectFilter.value)
  }

  if (assigneeFilter.value) {
    items = items.filter(i => i.assignee === assigneeFilter.value)
  }

  items.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })

  return items
})

function getStatusText(item) {
  const daysLeft = getDaysUntil(item.due_date)
  return getUrgencyText(item.status, daysLeft)
}

async function loadProjects() {
  try {
    projects.value = await projectApi.getList()
  } catch (e) {
    console.error('加载项目失败:', e)
  }
}

async function loadActionItems() {
  loading.value = true
  try {
    const params = {}
    if (projectFilter.value !== null) {
      params.project_id = projectFilter.value
    }
    actionItems.value = await actionItemApi.getList(params)
  } catch (e) {
    console.error('加载待办事项失败:', e)
  } finally {
    loading.value = false
  }
}

async function toggleAction(item) {
  try {
    await actionItemApi.updateStatus(item.id, !item.completed)
    item.completed = !item.completed
    if (item.completed) {
      item.status = 'completed'
    } else {
      item.status = getDaysUntil(item.due_date) < 0 ? 'overdue' :
                    getDaysUntil(item.due_date) <= 3 ? 'urgent' : 'normal'
    }
  } catch (e) {
    console.error('更新状态失败:', e)
    alert('更新失败: ' + e)
  }
}

function goToMeeting(meetingId) {
  router.push(`/meetings/${meetingId}`)
}

onMounted(() => {
  loadProjects()
  loadActionItems()
})
</script>

<style scoped>
.action-items-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background-color: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #374151;
}

.tab-btn.active {
  background-color: white;
  color: #1f2937;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-count {
  padding: 2px 8px;
  background-color: #e5e7eb;
  border-radius: 10px;
  font-size: 12px;
}

.filter-bar {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
}

.filter-item {
  flex: 1;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 0;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.action-item-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.urgency-overdue {
  border-left-color: #ef4444;
  background-color: #fef2f2;
}

.urgency-urgent {
  border-left-color: #f59e0b;
  background-color: #fffbeb;
}

.urgency-normal {
  border-left-color: #10b981;
  background-color: #f0fdf4;
}

.urgency-completed {
  border-left-color: #d1d5db;
}

.action-left {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  flex: 1;
}

.checkbox-wrapper {
  position: relative;
  display: flex;
  padding-top: 2px;
  cursor: pointer;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.checkbox-wrapper input:checked ~ .checkmark {
  background-color: #2563eb;
  border-color: #2563eb;
}

.checkbox-wrapper input:checked ~ .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.action-content {
  flex: 1;
}

.action-text {
  margin: 0 0 6px 0;
  color: #1f2937;
  font-size: 15px;
  font-weight: 500;
}

.action-text.completed {
  text-decoration: line-through;
  color: #9ca3af;
  font-weight: normal;
}

.action-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.status-overdue {
  color: #dc2626;
  font-weight: 500;
}

.meta-item.status-urgent {
  color: #d97706;
  font-weight: 500;
}

.meta-item.status-normal {
  color: #059669;
}

.status-text {
  font-size: 12px;
}

.go-btn {
  flex-shrink: 0;
}
</style>
