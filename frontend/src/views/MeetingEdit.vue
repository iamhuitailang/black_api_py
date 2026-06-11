<template>
  <div class="meeting-edit">
    <div class="page-header">
      <button class="btn btn-secondary" @click="goBack">
        ← 返回
      </button>
      <h1>{{ isEdit ? '编辑会议纪要' : '新建会议纪要' }}</h1>
      <div class="header-right">
        <span v-if="hasDraft" class="draft-hint">有未保存的草稿</span>
        <button class="btn btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="form-card card">
      <div class="form-group">
        <label class="form-label">会议主题 *</label>
        <input
          type="text"
          class="form-input"
          v-model="form.title"
          placeholder="请输入会议主题"
        />
      </div>

      <div class="row">
        <div class="form-group">
          <label class="form-label">会议日期 *</label>
          <input
            type="date"
            class="form-input"
            v-model="form.date"
          />
        </div>
        <div class="form-group">
          <label class="form-label">关联项目</label>
          <select class="form-select" v-model="form.project_id">
            <option :value="0">不关联项目</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">参会人（用逗号分隔）</label>
        <input
          type="text"
          class="form-input"
          v-model="attendeesText"
          placeholder="例如：张三, 李四, 王五"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          纪要内容（支持 Markdown）
          <span class="help-text">支持标题、列表、粗体等 Markdown 格式</span>
        </label>
        <textarea
          class="form-textarea"
          v-model="form.content"
          rows="12"
          placeholder="# 会议主题

## 议题一
讨论内容...

## 议题二
讨论内容..."
        ></textarea>
      </div>
    </div>

    <div class="form-card card">
      <div class="section-header">
        <h2 class="section-title">待办事项</h2>
        <button class="btn btn-secondary btn-sm" @click="addActionItem">
          + 添加待办
        </button>
      </div>

      <div v-if="form.action_items.length === 0" class="empty-state small">
        <p>暂无待办事项，点击上方按钮添加</p>
      </div>

      <div v-else class="action-list">
        <div
          v-for="(item, index) in form.action_items"
          :key="index"
          class="action-item-row"
        >
          <div class="action-index">{{ index + 1 }}</div>
          <div class="action-fields">
            <input
              type="text"
              class="form-input"
              v-model="item.content"
              placeholder="待办内容"
            />
            <div class="action-subrow">
              <input
                type="text"
                class="form-input"
                v-model="item.assignee"
                placeholder="责任人"
                style="flex: 1"
              />
              <input
                type="date"
                class="form-input"
                v-model="item.due_date"
                style="flex: 1"
              />
            </div>
          </div>
          <button class="btn btn-danger btn-sm" @click="removeActionItem(index)">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { meetingApi, projectApi } from '../api'

const route = useRoute()
const router = useRouter()

const DRAFT_KEY_PREFIX = 'meeting_draft_'

const isEdit = computed(() => !!route.params.id && route.params.id !== 'new')
const saving = ref(false)
const projects = ref([])
const hasDraft = ref(false)
let autoSaveTimer = null

const form = reactive({
  project_id: 0,
  title: '',
  date: new Date().toISOString().split('T')[0],
  content: '',
  action_items: []
})

const attendeesText = ref('')

function getDraftKey() {
  if (isEdit.value) {
    return DRAFT_KEY_PREFIX + 'edit_' + route.params.id
  }
  return DRAFT_KEY_PREFIX + 'new'
}

function saveDraft() {
  const draft = {
    project_id: form.project_id,
    title: form.title,
    date: form.date,
    content: form.content,
    action_items: [...form.action_items],
    attendeesText: attendeesText.value,
    savedAt: Date.now()
  }
  try {
    localStorage.setItem(getDraftKey(), JSON.stringify(draft))
    hasDraft.value = true
  } catch (e) {
    console.warn('保存草稿失败:', e)
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(getDraftKey())
    if (raw) {
      const draft = JSON.parse(raw)
      if (confirm(`检测到未保存的草稿（${new Date(draft.savedAt).toLocaleString()}），是否恢复？`)) {
        form.project_id = draft.project_id || 0
        form.title = draft.title || ''
        form.date = draft.date || new Date().toISOString().split('T')[0]
        form.content = draft.content || ''
        form.action_items = draft.action_items || []
        attendeesText.value = draft.attendeesText || ''
        hasDraft.value = true
        return true
      } else {
        localStorage.removeItem(getDraftKey())
      }
    }
  } catch (e) {
    console.warn('加载草稿失败:', e)
  }
  hasDraft.value = false
  return false
}

function clearDraft() {
  try {
    localStorage.removeItem(getDraftKey())
    hasDraft.value = false
  } catch (e) {}
}

function startAutoSave() {
  stopAutoSave()
  autoSaveTimer = setInterval(() => {
    if (form.title || form.content || form.action_items.length > 0 || attendeesText.value) {
      saveDraft()
    }
  }, 5000)
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

watch(
  () => [form.title, form.content, attendeesText.value, form.action_items.length],
  () => {
    if (form.title || form.content || attendeesText.value) {
      hasDraft.value = true
    }
  }
)

async function loadProjects() {
  try {
    projects.value = await projectApi.getList()
  } catch (e) {
    console.error('加载项目失败:', e)
  }
}

async function loadMeeting() {
  if (!isEdit.value) return
  try {
    const data = await meetingApi.getById(route.params.id)
    if (data) {
      const hasRestored = loadDraft()
      if (!hasRestored) {
        form.project_id = data.project_id || 0
        form.title = data.title
        form.date = data.date
        form.content = data.content || ''
        form.action_items = (data.action_items || []).map(item => ({
          id: item.id,
          content: item.content,
          assignee: item.assignee || '',
          due_date: item.due_date || '',
          completed: item.completed || false,
          reminder_time: item.reminder_time || '',
          reminder_email: item.reminder_email || ''
        }))
        attendeesText.value = (data.attendees || []).join(', ')
      }
    }
  } catch (e) {
    console.error('加载会议失败:', e)
    alert('加载失败: ' + e)
  }
}

function addActionItem() {
  form.action_items.push({
    content: '',
    assignee: '',
    due_date: '',
    completed: false
  })
}

function removeActionItem(index) {
  form.action_items.splice(index, 1)
}

function parseAttendees() {
  if (!attendeesText.value.trim()) return []
  return attendeesText.value.split(/[,，]/).map(s => s.trim()).filter(s => s)
}

async function handleSave() {
  if (!form.title.trim()) {
    alert('请输入会议主题')
    return
  }
  if (!form.date) {
    alert('请选择会议日期')
    return
  }

  saving.value = true
  try {
    const data = {
      project_id: form.project_id || 0,
      title: form.title.trim(),
      date: form.date,
      attendees: parseAttendees(),
      content: form.content,
      action_items: form.action_items.filter(item => item.content.trim())
    }

    if (isEdit.value) {
      await meetingApi.update({ id: parseInt(route.params.id), ...data })
    } else {
      await meetingApi.create(data)
    }

    clearDraft()
    router.push('/meetings')
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败: ' + e)
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (hasDraft.value && !confirm('有未保存的内容，确定要离开吗？')) {
    return
  }
  if (isEdit.value) {
    router.push(`/meetings/${route.params.id}`)
  } else {
    router.push('/meetings')
  }
}

onMounted(() => {
  loadProjects()
  if (!isEdit.value) {
    loadDraft()
  }
  loadMeeting()
  startAutoSave()
})

onUnmounted(() => {
  stopAutoSave()
})
</script>

<style scoped>
.meeting-edit {
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
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.draft-hint {
  font-size: 13px;
  color: #d97706;
  background-color: #fef3c7;
  padding: 4px 10px;
  border-radius: 4px;
}

.form-card {
  margin-bottom: 20px;
}

.row {
  display: flex;
  gap: 16px;
}

.row > * {
  flex: 1;
}

.help-text {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
  margin-left: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.action-index {
  width: 24px;
  height: 24px;
  background-color: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
}

.action-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-subrow {
  display: flex;
  gap: 8px;
}

.empty-state.small {
  padding: 30px 20px;
}
</style>
