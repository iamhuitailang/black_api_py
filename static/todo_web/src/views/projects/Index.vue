<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">项目管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建项目</el-button>
    </div>

    <div class="filter-section card p-4 mb-6">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索项目名称"
            :prefix-icon="Search"
            clearable
            @keyup.enter="fetchProjects"
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="queryParams.status" placeholder="项目状态" clearable @change="fetchProjects">
            <el-option label="进行中" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已归档" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <div v-if="loading" class="text-center p-6">
      <el-icon :size="32" class="is-loading"><Loading /></el-icon>
    </div>
    <div v-else-if="projects.length === 0" class="empty-state card p-6 text-center">
      <el-empty description="暂无项目，点击上方按钮创建第一个项目" />
    </div>
    <div v-else class="project-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card card"
        @click="goToProjectTasks(project)"
      >
        <div class="project-header">
          <div class="project-icon" :style="{ backgroundColor: project.color || '#409eff' }">
            <el-icon :size="24"><Folder /></el-icon>
          </div>
          <div class="flex gap-2">
            <el-dropdown @click.stop @command="(cmd: string) => handleAction(project, cmd)">
              <el-button size="small" :icon="MoreFilled" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item v-if="project.status !== 2" command="archive">
                    <el-icon><Box /></el-icon>
                    归档
                  </el-dropdown-item>
                  <el-dropdown-item v-else command="unarchive">
                    <el-icon><RefreshRight /></el-icon>
                    取消归档
                  </el-dropdown-item>
                  <el-dropdown-item divided command="delete" class="text-red-500">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <h3 class="project-title">{{ project.name }}</h3>
        <p v-if="project.description" class="project-desc">{{ project.description }}</p>

        <div class="project-stats">
          <div class="stat-item">
            <span class="stat-value">{{ project.task_count || 0 }}</span>
            <span class="stat-label">总任务</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ project.completed_count || 0 }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ getProgress(project) }}%</span>
            <span class="stat-label">进度</span>
          </div>
        </div>

        <el-progress
          :percentage="getProgress(project)"
          :color="getProgressColor(project)"
          :stroke-width="6"
        />

        <div class="project-footer">
          <el-tag :type="getStatusType(project.status)" size="small">
            {{ getStatusText(project.status) }}
          </el-tag>
          <span class="create-time">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(project.created_at) }}
          </span>
        </div>
      </div>
    </div>

    <div class="pagination mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.page_size"
        :total="total"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchProjects"
        @current-change="fetchProjects"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingProject ? '编辑项目' : '新建项目'"
      width="500px"
      @closed="resetForm"
    >
      <el-form ref="projectFormRef" :model="projectForm" :rules="projectRules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目颜色">
              <el-color-picker v-model="projectForm.color" show-alpha style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标">
              <el-input v-model="projectForm.icon" placeholder="选填，图标名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="排序">
          <el-input-number v-model="projectForm.sort_order" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="项目状态" v-if="editingProject">
          <el-radio-group v-model="projectForm.status">
            <el-radio :value="0">进行中</el-radio>
            <el-radio :value="1">已完成</el-radio>
            <el-radio :value="2">已归档</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus, Search, Loading, MoreFilled, Edit, Delete, Folder,
  Box, RefreshRight, Calendar
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { Project } from '@/types'
import {
  getProjectList, createProject, updateProject, deleteProject,
  archiveProject, unarchiveProject, getProjectProgress
} from '@/api/project'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const projects = ref<Project[]>([])
const total = ref(0)
const editingProject = ref<Project | null>(null)
const projectFormRef = ref<FormInstance>()

const queryParams = reactive({
  page: 1,
  page_size: 12,
  status: undefined as number | undefined,
  keyword: ''
})

const projectForm = reactive({
  name: '',
  description: '',
  color: '#409eff',
  icon: '',
  sort_order: 0,
  status: 0
})

const projectRules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度在 1 到 100 个字符', trigger: 'blur' }
  ]
}

const progressCache = ref<Map<number, number>>(new Map())

onMounted(() => {
  fetchProjects()
})

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await getProjectList(queryParams)
    if (res.code === 0) {
      projects.value = res.data.items
      total.value = res.data.total
      projects.value.forEach(p => {
        fetchProgress(p.id)
      })
    }
  } catch (e) {
    console.error('Fetch projects error:', e)
  } finally {
    loading.value = false
  }
}

const fetchProgress = async (projectId: number) => {
  try {
    const res = await getProjectProgress(projectId)
    if (res.code === 0) {
      progressCache.value.set(projectId, res.data.progress || 0)
      const project = projects.value.find(p => p.id === projectId)
      if (project) {
        project.task_count = res.data.total_tasks
        project.completed_count = res.data.completed_tasks
      }
    }
  } catch (e) {
    console.error('Fetch progress error:', e)
  }
}

const getProgress = (project: Project) => {
  return progressCache.value.get(project.id) || 0
}

const resetFilters = () => {
  queryParams.page = 1
  queryParams.page_size = 12
  queryParams.status = undefined
  queryParams.keyword = ''
  fetchProjects()
}

const openCreateDialog = () => {
  editingProject.value = null
  resetForm()
  dialogVisible.value = true
}

const resetForm = () => {
  projectForm.name = ''
  projectForm.description = ''
  projectForm.color = '#409eff'
  projectForm.icon = ''
  projectForm.sort_order = 0
  projectForm.status = 0
  projectFormRef.value?.resetFields()
}

const submitProject = async () => {
  if (!projectFormRef.value) return

  const valid = await projectFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    let res
    if (editingProject.value) {
      res = await updateProject(editingProject.value.id, projectForm)
    } else {
      res = await createProject(projectForm as any)
    }

    if (res.code === 0) {
      ElMessage.success(editingProject.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchProjects()
    }
  } catch (e) {
    console.error('Submit project error:', e)
  } finally {
    submitting.value = false
  }
}

const goToProjectTasks = (project: Project) => {
  router.push({
    path: '/tasks',
    query: { project_id: String(project.id) }
  })
}

const handleAction = async (project: Project, action: string) => {
  try {
    if (action === 'edit') {
      editingProject.value = project
      projectForm.name = project.name
      projectForm.description = project.description || ''
      projectForm.color = project.color || '#409eff'
      projectForm.icon = project.icon || ''
      projectForm.sort_order = project.sort_order || 0
      projectForm.status = project.status
      dialogVisible.value = true
      return
    }

    if (action === 'delete') {
      await ElMessageBox.confirm('确定要删除这个项目吗？项目下的任务不会被删除。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      const res = await deleteProject(project.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchProjects()
      }
      return
    }

    let res
    if (action === 'archive') {
      res = await archiveProject(project.id)
    } else if (action === 'unarchive') {
      res = await unarchiveProject(project.id)
    }
    if (res?.code === 0) {
      ElMessage.success('操作成功')
      fetchProjects()
    }
  } catch (e) {
    console.error('Action error:', e)
  }
}

const getProgressColor = (project: Project) => {
  const progress = getProgress(project)
  if (progress >= 100) return '#67c23a'
  if (progress >= 70) return '#409eff'
  if (progress >= 40) return '#e6a23c'
  return '#f56c6c'
}

const getStatusType = (status: number) => {
  const types: any = { 0: 'primary', 1: 'success', 2: 'info' }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts = ['进行中', '已完成', '已归档']
  return texts[status] || '未知'
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}
</script>

<style scoped lang="scss">
.filter-section {
  .el-select,
  .el-input {
    width: 100%;
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.project-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.project-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.project-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 12px 0;
  background: #f5f7fa;
  border-radius: 8px;

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }

    .stat-label {
      font-size: 12px;
      color: #909399;
    }
  }
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;

  .create-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #909399;
  }
}

.empty-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
