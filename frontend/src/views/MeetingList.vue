<template>
  <div class="meetings-page">
    <div class="page-header">
      <h1>会议纪要</h1>
      <button class="btn btn-primary" @click="goToCreate">
        + 新建纪要
      </button>
    </div>

    <div class="filter-card card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="form-label">关键词</label>
          <input
            type="text"
            class="form-input"
            placeholder="搜索标题或内容..."
            v-model="filters.keyword"
            @keyup.enter="loadMeetings"
          />
        </div>
        <div class="filter-item">
          <label class="form-label">开始日期</label>
          <input
            type="date"
            class="form-input"
            v-model="filters.start_date"
            @change="loadMeetings"
          />
        </div>
        <div class="filter-item">
          <label class="form-label">结束日期</label>
          <input
            type="date"
            class="form-input"
            v-model="filters.end_date"
            @change="loadMeetings"
          />
        </div>
        <div class="filter-item">
          <label class="form-label">项目</label>
          <select class="form-select" v-model="filters.project_id" @change="loadMeetings">
            <option :value="null">全部项目</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="form-label">参会人</label>
          <select class="form-select" v-model="filters.attendee" @change="loadMeetings">
            <option value="">全部参会人</option>
            <option v-for="a in allAttendees" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="filter-item filter-actions">
          <button class="btn btn-secondary" @click="resetFilters">重置</button>
          <button class="btn btn-primary" @click="loadMeetings">搜索</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="meetings.length === 0" class="empty-state">
      <div class="empty-state-icon">📭</div>
      <p>暂无会议纪要</p>
      <button class="btn btn-primary" style="margin-top: 16px" @click="goToCreate">
        创建第一条纪要
      </button>
    </div>

    <div v-else class="timeline">
      <div
        v-for="group in groupedMeetings"
        :key="group.date"
        class="timeline-group"
      >
        <div class="timeline-date">
          <span class="date-label">{{ group.dateLabel }}</span>
        </div>
        <div class="timeline-items">
          <div
            v-for="meeting in group.items"
            :key="meeting.id"
            class="timeline-item card"
            @click="goToDetail(meeting.id)"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="meeting-header">
                <h3 class="meeting-title" v-html="highlightText(meeting.title)"></h3>
                <span v-if="meeting.project_name" class="project-tag">{{ meeting.project_name }}</span>
              </div>
              <div class="meeting-meta">
                <span class="meta-item">
                  <span class="meta-icon">📅</span>
                  {{ formatDate(meeting.date) }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">👥</span>
                  {{ meeting.attendees?.join('、') || '无' }}
                </span>
              </div>
              <p class="meeting-preview" v-html="highlightText(truncate(meeting.content, 150))"></p>
              <div v-if="meeting.action_items && meeting.action_items.length > 0" class="meeting-actions-preview">
                <span class="actions-count">待办 {{ meeting.action_items.length }} 项</span>
                <span
                  v-for="item in meeting.action_items.slice(0, 2)"
                  :key="item.id"
                  class="action-dot"
                  :class="'dot--' + getActionStatus(item)"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <button
        class="btn btn-secondary btn-sm"
        :disabled="page <= 1"
        @click="changePage(page - 1)"
      >
        上一页
      </button>
      <span class="page-info">第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
      <button
        class="btn btn-secondary btn-sm"
        :disabled="page >= totalPages"
        @click="changePage(page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { meetingApi, projectApi } from '../api'
import { formatDate, highlightKeyword, getUrgencyStatus } from '../utils'

const router = useRouter()

const meetings = ref([])
const projects = ref([])
const allAttendees = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({
  keyword: '',
  start_date: '',
  end_date: '',
  attendee: '',
  project_id: null
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const groupedMeetings = computed(() => {
  const groups = {}
  meetings.value.forEach(meeting => {
    const dateStr = meeting.date
    if (!groups[dateStr]) {
      groups[dateStr] = {
        date: dateStr,
        dateLabel: formatDate(dateStr),
        items: []
      }
    }
    groups[dateStr].items.push(meeting)
  })
  return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date))
})

function highlightText(text) {
  if (!filters.keyword) return text
  return highlightKeyword(text, filters.keyword)
}

function truncate(text, maxLen) {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function getActionStatus(item) {
  return getUrgencyStatus(item.due_date, item.completed)
}

async function loadProjects() {
  try {
    projects.value = await projectApi.getList()
  } catch (e) {
    console.error('加载项目失败:', e)
  }
}

async function loadAttendees() {
  try {
    allAttendees.value = await meetingApi.getAttendees()
  } catch (e) {
    console.error('加载参会人失败:', e)
  }
}

async function loadMeetings() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value
    }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.attendee) params.attendee = filters.attendee
    if (filters.project_id !== null && filters.project_id !== undefined) {
      params.project_id = filters.project_id
    }

    const result = await meetingApi.getList(params)
    meetings.value = result.items
    total.value = result.total

    meetings.value.forEach(m => {
      const project = projects.value.find(p => p.id === m.project_id)
      m.project_name = project ? project.name : ''
    })
  } catch (e) {
    console.error('加载会议列表失败:', e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.start_date = ''
  filters.end_date = ''
  filters.attendee = ''
  filters.project_id = null
  page.value = 1
  loadMeetings()
}

function changePage(newPage) {
  page.value = newPage
  loadMeetings()
}

function goToCreate() {
  router.push('/meetings/new')
}

function goToDetail(id) {
  router.push(`/meetings/${id}`)
}

onMounted(() => {
  loadProjects()
  loadAttendees()
  loadMeetings()
})
</script>

<style scoped>
.meetings-page {
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
}

.filter-card {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 140px;
}

.filter-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.timeline {
  position: relative;
}

.timeline-group {
  margin-bottom: 24px;
}

.timeline-date {
  margin-bottom: 12px;
}

.date-label {
  display: inline-block;
  padding: 4px 12px;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.timeline-items {
  position: relative;
  padding-left: 24px;
}

.timeline-items::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e7eb;
}

.timeline-item {
  position: relative;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 24px;
  width: 10px;
  height: 10px;
  background-color: #2563eb;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #2563eb;
}

.timeline-content {
  padding: 4px 0;
}

.meeting-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.meeting-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.project-tag {
  padding: 2px 8px;
  background-color: #eff6ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 12px;
}

.meeting-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  color: #6b7280;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 14px;
}

.meeting-preview {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.meeting-actions-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions-count {
  font-size: 12px;
  color: #6b7280;
}

.action-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot--overdue {
  background-color: #ef4444;
}

.dot--urgent {
  background-color: #f59e0b;
}

.dot--normal {
  background-color: #10b981;
}

.dot--completed {
  background-color: #d1d5db;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-info {
  color: #6b7280;
  font-size: 14px;
}
</style>
