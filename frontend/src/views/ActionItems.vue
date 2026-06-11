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
              <span v-if="item.reminder_time" class="meta-item reminder-meta">
                🔔 {{ formatDateTime(item.reminder_time) }}
                <span v-if="item.reminder_sent" class="reminder-sent">(已发送)</span>
              </span>
            </div>
          </div>
        </div>
        <div class="action-actions">
          <button
            v-if="!item.completed"
            class="btn btn-secondary btn-sm"
            @click="openReminderModal(item)"
          >
            🔔 提醒
          </button>
          <button
            class="btn btn-secondary btn-sm go-btn"
            @click="goToMeeting(item.meeting_id)"
          >
            查看纪要 →
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReminderModal" class="modal-overlay" @click.self="closeReminderModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>设置邮件提醒</h3>
          <button class="modal-close" @click="closeReminderModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">提醒时间 *</label>
            <input
              type="datetime-local"
              class="form-input"
              v-model="reminderForm.reminder_time"
            />
          </div>
          <div class="form-group">
            <label class="form-label">接收邮箱 *</label>
            <input
              type="email"
              class="form-input"
              v-model="reminderForm.reminder_email"
              placeholder="example@company.com"
            />
          </div>
          <div class="form-tip">
            💡 未配置 SMTP 邮件服务时，提醒会打印到后端控制台日志中。
            配置方式：设置环境变量 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、SMTP_FROM
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeReminderModal">取消</button>
          <button class="btn btn-secondary" @click="clearReminder" v-if="currentItem?.reminder_time">
            清除提醒
          </button>
          <button class="btn btn-primary" @click="saveReminder" :disabled="savingReminder">
            {{ savingReminder ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

const showReminderModal = ref(false)
const currentItem = ref(null)
const savingReminder = ref(false)
const reminderForm = reactive({
  reminder_time: '',
  reminder_email: ''
})

function formatDateTime(dt) {
  if (!dt) return ''
  try {
    const d = new Date(dt.replace(' ', 'T'))
    return d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return dt
  }
}

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

function openReminderModal(item) {
  currentItem.value = item
  if (item.reminder_time) {
    const t = item.reminder_time.replace(' ', 'T').slice(0, 16)
    reminderForm.reminder_time = t
  } else {
    const defaultTime = new Date()
    defaultTime.setDate(defaultTime.getDate() + 1)
    defaultTime.setHours(9, 0, 0, 0)
    reminderForm.reminder_time = defaultTime.toISOString().slice(0, 16)
  }
  reminderForm.reminder_email = item.reminder_email || ''
  showReminderModal.value = true
}

function closeReminderModal() {
  showReminderModal.value = false
  currentItem.value = null
  reminderForm.reminder_time = ''
  reminderForm.reminder_email = ''
}

async function saveReminder() {
  if (!reminderForm.reminder_time) {
    alert('请选择提醒时间')
    return
  }
  if (!reminderForm.reminder_email) {
    alert('请输入接收邮箱')
    return
  }

  savingReminder.value = true
  try {
    const timeStr = reminderForm.reminder_time.replace('T', ' ') + ':00'
    await actionItemApi.setReminder(currentItem.value.id, timeStr, reminderForm.reminder_email)
    currentItem.value.reminder_time = timeStr
    currentItem.value.reminder_email = reminderForm.reminder_email
    currentItem.value.reminder_sent = false
    alert('提醒设置成功')
    closeReminderModal()
  } catch (e) {
    console.error('设置提醒失败:', e)
    alert('设置失败: ' + e)
  } finally {
    savingReminder.value = false
  }
}

async function clearReminder() {
  if (!confirm('确定要清除此待办的提醒吗？')) return
  try {
    await actionItemApi.setReminder(currentItem.value.id, '', '')
    currentItem.value.reminder_time = ''
    currentItem.value.reminder_email = ''
    currentItem.value.reminder_sent = false
    closeReminderModal()
  } catch (e) {
    alert('清除失败: ' + e)
  }
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

.reminder-meta {
  color: #2563eb;
  font-weight: 500;
}

.reminder-sent {
  color: #059669;
  font-weight: normal;
}

.status-text {
  font-size: 12px;
}

.action-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.go-btn {
  flex-shrink: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.form-tip {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
