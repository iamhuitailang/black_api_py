<template>
  <div class="meeting-detail">
    <div class="page-header">
      <button class="btn btn-secondary" @click="goBack">
        ← 返回列表
      </button>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goToEdit">编辑</button>
        <button class="btn btn-danger" @click="handleDelete">删除</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="meeting" class="meeting-content">
      <div class="card">
        <div class="meeting-title-row">
          <h1>{{ meeting.title }}</h1>
          <span v-if="projectName" class="project-tag">{{ projectName }}</span>
        </div>
        <div class="meeting-meta">
          <span class="meta-item">
            <span class="meta-icon">📅</span>
            {{ formatDate(meeting.date) }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">👥</span>
            {{ meeting.attendees?.join('、') || '无参会人' }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">📝</span>
            创建于 {{ formatDateTime(meeting.created_at) }}
          </span>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">📋 会议纪要</h2>
        <div class="content-body" v-html="renderedContent"></div>
      </div>

      <div class="card">
        <h2 class="section-title">
          ✅ 待办事项
          <span class="count-badge">{{ actionItems.length }} 项</span>
        </h2>
        <div v-if="actionItems.length === 0" class="empty-state small">
          <p>暂无待办事项</p>
        </div>
        <div v-else class="action-list">
          <div
            v-for="item in actionItems"
            :key="item.id"
            class="action-item"
            :class="{ 'is-completed': item.completed }"
          >
            <label class="checkbox-wrapper">
              <input
                type="checkbox"
                :checked="item.completed"
                @change="toggleAction(item)"
              />
              <span class="checkmark"></span>
            </label>
            <div class="action-content">
              <p class="action-text">{{ item.content }}</p>
              <div class="action-meta">
                <span v-if="item.assignee" class="meta-tag">
                  👤 {{ item.assignee }}
                </span>
                <span v-if="item.due_date" class="meta-tag" :class="'status-' + getActionStatus(item)">
                  📅 {{ formatDate(item.due_date) }} ({{ getStatusText(item) }})
                </span>
                <span v-if="item.reminder_time" class="meta-tag reminder-tag" :class="{ 'reminder-sent': item.reminder_sent }">
                  🔔 {{ formatDateTime(item.reminder_time) }}
                  <span v-if="item.reminder_sent">(已发送)</span>
                  <span v-else class="reminder-email">{{ item.reminder_email }}</span>
                </span>
              </div>
            </div>
            <button
              v-if="!item.completed"
              class="btn btn-secondary btn-sm reminder-btn"
              @click="openReminderModal(item)"
              :title="item.reminder_time ? '修改提醒' : '设置提醒'"
            >
              🔔 {{ item.reminder_time ? '修改' : '提醒' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReminderModal" class="modal-overlay" @click.self="closeReminderModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>� 设置待办提醒</h3>
          <button class="modal-close" @click="closeReminderModal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">待办：<strong>{{ editingAction?.content }}</strong></p>

          <div class="reminder-type-tabs">
            <button
              class="type-tab"
              :class="{ active: reminderType === 'desktop' }"
              @click="reminderType = 'desktop'"
            >
              🖥️ 桌面通知
            </button>
            <button
              class="type-tab"
              :class="{ active: reminderType === 'email' }"
              @click="reminderType = 'email'"
            >
              📧 邮件提醒
            </button>
          </div>

          <div v-if="reminderType === 'desktop'" class="type-desc">
            <p class="desc-text">
              ✅ <strong>推荐！</strong>浏览器桌面通知，无需配置任何东西，打开网页就能用。
            </p>
            <p class="desc-text secondary">
              到点会在屏幕右下角弹出通知，点击可直接跳转到对应会议纪要。
            </p>
          </div>

          <div v-if="reminderType === 'email'" class="type-desc">
            <p class="desc-text">
              📧 邮件提醒需要后端配置 SMTP 邮件服务才能发送。
            </p>
            <p class="desc-text secondary">
              未配置时，提醒内容会打印到后端服务器控制台日志中。
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">提醒时间 *</label>
            <input
              type="datetime-local"
              class="form-input"
              v-model="reminderForm.reminder_time"
            />
            <div class="quick-times">
              <button class="quick-btn" @click="setQuickTime(60)">1小时后</button>
              <button class="quick-btn" @click="setQuickTime(120)">2小时后</button>
              <button class="quick-btn" @click="setQuickTime('tomorrow')">明天9点</button>
              <button class="quick-btn" @click="setQuickTime('due_day')">截止当天</button>
            </div>
          </div>

          <div v-if="reminderType === 'email'" class="form-group">
            <label class="form-label">接收邮箱 *</label>
            <input
              type="email"
              class="form-input"
              v-model="reminderForm.reminder_email"
              placeholder="example@company.com"
            />
          </div>

          <div class="test-row">
            <button class="btn btn-secondary btn-sm" @click="testNotification">
              🧪 发送测试通知
            </button>
            <span class="test-tip">点击预览提醒效果</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeReminderModal">取消</button>
          <button
            class="btn btn-secondary"
            @click="clearReminder"
            v-if="editingAction?.reminder_time"
          >
            清除提醒
          </button>
          <button class="btn btn-primary" @click="saveReminder" :disabled="savingReminder">
            {{ savingReminder ? '保存中...' : '保存提醒' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { meetingApi, actionItemApi, projectApi } from '../api'
import { formatDate, formatDateTime, getUrgencyStatus, getDaysUntil, getUrgencyText } from '../utils'
import { useReminder } from '../composables/useReminder'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

const { notificationEnabled, requestPermission, showNotification, clearNotified } = useReminder()

const meeting = ref(null)
const actionItems = ref([])
const projects = ref([])
const loading = ref(false)

const showReminderModal = ref(false)
const editingAction = ref(null)
const savingReminder = ref(false)
const reminderType = ref('desktop')
const reminderForm = reactive({
  reminder_time: '',
  reminder_email: ''
})

const projectName = computed(() => {
  if (!meeting.value?.project_id) return ''
  const p = projects.value.find(p => p.id === meeting.value.project_id)
  return p ? p.name : ''
})

const renderedContent = computed(() => {
  if (!meeting.value?.content) return '<p>暂无内容</p>'
  return marked(meeting.value.content)
})

function getActionStatus(item) {
  return getUrgencyStatus(item.due_date, item.completed)
}

function getStatusText(item) {
  const daysLeft = getDaysUntil(item.due_date)
  return getUrgencyText(getActionStatus(item), daysLeft)
}

function openReminderModal(item) {
  editingAction.value = item
  reminderType.value = item.reminder_email ? 'email' : 'desktop'
  setDefaultReminderTime(item)
  reminderForm.reminder_email = item.reminder_email || ''
  showReminderModal.value = true
}

function setDefaultReminderTime(item) {
  if (item.reminder_time) {
    const t = item.reminder_time.replace(' ', 'T').slice(0, 16)
    reminderForm.reminder_time = t
    return
  }
  const defaultTime = new Date()
  if (item.due_date) {
    const dueDate = new Date(item.due_date)
    if (dueDate > defaultTime) {
      defaultTime.setTime(dueDate.getTime() - 24 * 60 * 60 * 1000)
      defaultTime.setHours(9, 0, 0, 0)
      if (defaultTime < new Date()) {
        defaultTime.setTime(Date.now() + 60 * 60 * 1000)
      }
    } else {
      defaultTime.setTime(Date.now() + 60 * 60 * 1000)
    }
  } else {
    defaultTime.setTime(Date.now() + 60 * 60 * 1000)
  }
  reminderForm.reminder_time = defaultTime.toISOString().slice(0, 16)
}

function setQuickTime(type) {
  const d = new Date()
  if (typeof type === 'number') {
    d.setMinutes(d.getMinutes() + type)
  } else if (type === 'tomorrow') {
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
  } else if (type === 'due_day') {
    if (editingAction.value?.due_date) {
      d.setTime(new Date(editingAction.value.due_date).getTime())
      d.setHours(9, 0, 0, 0)
    } else {
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
    }
  }
  reminderForm.reminder_time = d.toISOString().slice(0, 16)
}

async function testNotification() {
  if (!notificationEnabled.value) {
    const granted = await requestPermission()
    if (!granted) {
      alert('请先允许浏览器通知权限，再测试提醒效果。')
      return
    }
  }
  showNotification('🧪 测试通知 - 待办提醒', {
    body: `${editingAction.value?.content || '测试待办'}\n这是一条测试通知，提醒功能正常工作！`,
    tag: 'test-notification'
  })
  alert('测试通知已发送！请查看桌面右下角的通知弹出。')
}

function closeReminderModal() {
  showReminderModal.value = false
  editingAction.value = null
  reminderForm.reminder_time = ''
  reminderForm.reminder_email = ''
}

async function saveReminder() {
  if (!reminderForm.reminder_time) {
    alert('请选择提醒时间')
    return
  }
  if (reminderType.value === 'email' && !reminderForm.reminder_email) {
    alert('请输入接收邮箱')
    return
  }

  if (reminderType.value === 'desktop' && !notificationEnabled.value) {
    const granted = await requestPermission()
    if (!granted) {
      alert('请先允许浏览器通知权限，桌面提醒才能正常工作。')
      return
    }
  }

  savingReminder.value = true
  try {
    const timeStr = reminderForm.reminder_time.replace('T', ' ') + ':00'
    const email = reminderType.value === 'email' ? reminderForm.reminder_email : ''
    await actionItemApi.setReminder(editingAction.value.id, timeStr, email)
    editingAction.value.reminder_time = timeStr
    editingAction.value.reminder_email = email
    editingAction.value.reminder_sent = false
    clearNotified(editingAction.value.id)
    alert('提醒设置成功！到点会自动提醒。')
    closeReminderModal()
  } catch (e) {
    console.error('设置提醒失败:', e)
    alert('设置失败: ' + e)
  } finally {
    savingReminder.value = false
  }
}

async function clearReminder() {
  if (!confirm('确定要清除此待办的提醒设置吗？')) return
  try {
    await actionItemApi.setReminder(editingAction.value.id, '', '')
    editingAction.value.reminder_time = ''
    editingAction.value.reminder_email = ''
    editingAction.value.reminder_sent = false
    clearNotified(editingAction.value.id)
    closeReminderModal()
  } catch (e) {
    alert('清除失败: ' + e)
  }
}

async function loadMeeting() {
  loading.value = true
  try {
    meeting.value = await meetingApi.getById(route.params.id)
    actionItems.value = meeting.value.action_items || []
  } catch (e) {
    console.error('加载会议详情失败:', e)
    alert('加载失败: ' + e)
  } finally {
    loading.value = false
  }
}

async function loadProjects() {
  try {
    projects.value = await projectApi.getList()
  } catch (e) {
    console.error('加载项目失败:', e)
  }
}

async function toggleAction(item) {
  try {
    await actionItemApi.updateStatus(item.id, !item.completed)
    item.completed = !item.completed
  } catch (e) {
    console.error('更新状态失败:', e)
    alert('更新失败: ' + e)
  }
}

function goBack() {
  router.push('/meetings')
}

function goToEdit() {
  router.push(`/meetings/${meeting.value.id}/edit`)
}

async function handleDelete() {
  if (!confirm('确定要删除这个会议纪要吗？')) return
  try {
    await meetingApi.delete(meeting.value.id)
    router.push('/meetings')
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败: ' + e)
  }
}

onMounted(() => {
  loadProjects()
  loadMeeting()
})
</script>

<style scoped>
.meeting-detail {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.meeting-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.meeting-title-row h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.project-tag {
  padding: 4px 12px;
  background-color: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.meeting-meta {
  display: flex;
  gap: 20px;
  color: #6b7280;
  font-size: 14px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  padding: 2px 10px;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.content-body {
  color: #374151;
  line-height: 1.8;
}

.content-body :deep(h1) {
  font-size: 22px;
  margin: 20px 0 12px;
}

.content-body :deep(h2) {
  font-size: 18px;
  margin: 18px 0 10px;
}

.content-body :deep(h3) {
  font-size: 16px;
  margin: 14px 0 8px;
}

.content-body :deep(p) {
  margin: 10px 0;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  margin: 10px 0;
  padding-left: 24px;
}

.content-body :deep(li) {
  margin: 4px 0;
}

.content-body :deep(strong) {
  font-weight: 600;
}

.content-body :deep(code) {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.content-body :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 16px;
  margin: 12px 0;
  color: #6b7280;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.action-item:hover {
  background-color: #f3f4f6;
}

.action-item.is-completed {
  opacity: 0.6;
}

.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
  cursor: pointer;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
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
  color: #374151;
  font-size: 14px;
}

.is-completed .action-text {
  text-decoration: line-through;
  color: #9ca3af;
}

.action-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reminder-tag {
  color: #2563eb;
  font-weight: 500;
  background-color: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.reminder-tag.reminder-sent {
  color: #6b7280;
  background-color: #f3f4f6;
}

.reminder-email {
  opacity: 0.8;
  font-weight: normal;
  margin-left: 4px;
}

.reminder-btn {
  flex-shrink: 0;
  align-self: flex-start;
}

.reminder-type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background-color: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
}

.type-tab {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.type-tab:hover {
  color: #374151;
}

.type-tab.active {
  background-color: white;
  color: #1f2937;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.type-desc {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.type-desc .desc-text {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #166534;
  line-height: 1.6;
}

.type-desc .desc-text.secondary {
  margin: 0;
  color: #15803d;
  opacity: 0.8;
}

.quick-times {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background-color: #eff6ff;
}

.test-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.test-tip {
  font-size: 12px;
  color: #9ca3af;
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
  width: 480px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
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

.modal-desc {
  margin: 0 0 16px 0;
  padding: 10px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.smtp-tip {
  margin-top: 16px;
  padding: 12px 14px;
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.7;
}

.tip-title {
  margin: 0 0 6px 0;
  font-weight: 600;
  font-size: 13px;
}

.smtp-tip ul {
  margin: 0;
  padding-left: 20px;
}

.smtp-tip code {
  background-color: #fef3c7;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.empty-state.small {
  padding: 30px 20px;
}

.status-overdue { color: #dc2626; font-weight: 500; }
.status-urgent  { color: #d97706; font-weight: 500; }
.status-normal  { color: #059669; }
</style>
