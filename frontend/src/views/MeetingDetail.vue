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
import { useRoute, useRouter } from 'vue-router'
import { meetingApi, actionItemApi, projectApi } from '../api'
import { formatDate, formatDateTime, getUrgencyStatus, getDaysUntil, getUrgencyText } from '../utils'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

const meeting = ref(null)
const actionItems = ref([])
const projects = ref([])
const loading = ref(false)

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

.empty-state.small {
  padding: 30px 20px;
}
</style>
