<template>
  <div class="projects-page">
    <div class="page-header">
      <h1>项目管理</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        + 新建项目
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="projects.length === 0" class="empty-state">
      <div class="empty-state-icon">📁</div>
      <p>暂无项目</p>
      <button class="btn btn-primary" style="margin-top: 16px" @click="openCreateModal">
        创建第一个项目
      </button>
    </div>

    <div v-else class="project-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card card"
      >
        <div class="project-header">
          <h3 class="project-name">{{ project.name }}</h3>
          <div class="project-actions">
            <button class="icon-btn" @click="openEditModal(project)">✏️</button>
            <button class="icon-btn" @click="handleDelete(project)">🗑️</button>
          </div>
        </div>
        <p class="project-desc">{{ project.description || '暂无描述' }}</p>
        <div class="project-footer">
          <span class="project-meta">创建于 {{ formatDate(project.created_at) }}</span>
          <button class="btn btn-secondary btn-sm" @click="goToMeetings(project.id)">
            查看纪要 →
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content card">
        <h2>{{ editingProject ? '编辑项目' : '新建项目' }}</h2>
        <div class="form-group">
          <label class="form-label">项目名称 *</label>
          <input
            type="text"
            class="form-input"
            v-model="formData.name"
            placeholder="请输入项目名称"
          />
        </div>
        <div class="form-group">
          <label class="form-label">项目描述</label>
          <textarea
            class="form-textarea"
            v-model="formData.description"
            rows="4"
            placeholder="请输入项目描述"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="handleSave" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { projectApi, meetingApi } from '../api'
import { formatDate } from '../utils'

const router = useRouter()

const projects = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingProject = ref(null)

const formData = reactive({
  name: '',
  description: ''
})

async function loadProjects() {
  loading.value = true
  try {
    projects.value = await projectApi.getList()
  } catch (e) {
    console.error('加载项目失败:', e)
    alert('加载失败: ' + e)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingProject.value = null
  formData.name = ''
  formData.description = ''
  showModal.value = true
}

function openEditModal(project) {
  editingProject.value = project
  formData.name = project.name
  formData.description = project.description || ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProject.value = null
}

async function handleSave() {
  if (!formData.name.trim()) {
    alert('请输入项目名称')
    return
  }

  saving.value = true
  try {
    if (editingProject.value) {
      await projectApi.update({
        id: editingProject.value.id,
        name: formData.name.trim(),
        description: formData.description
      })
    } else {
      await projectApi.create({
        name: formData.name.trim(),
        description: formData.description
      })
    }
    closeModal()
    loadProjects()
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败: ' + e)
  } finally {
    saving.value = false
  }
}

async function handleDelete(project) {
  if (!confirm(`确定要删除项目「${project.name}」吗？`)) return
  try {
    await projectApi.delete(project.id)
    loadProjects()
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败: ' + e)
  }
}

function goToMeetings(projectId) {
  router.push({
    path: '/meetings',
    query: { project_id: projectId }
  })
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.projects-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.project-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0.6;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: #f3f4f6;
  opacity: 1;
}

.project-desc {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  flex: 1;
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.project-meta {
  font-size: 12px;
  color: #9ca3af;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
