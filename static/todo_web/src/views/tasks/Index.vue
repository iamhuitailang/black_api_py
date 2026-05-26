<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">任务管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建任务</el-button>
    </div>

    <div class="filter-section card p-4 mb-6">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索任务标题"
            :prefix-icon="Search"
            clearable
            @keyup.enter="fetchTasks"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="queryParams.status" placeholder="任务状态" clearable @change="fetchTasks">
            <el-option label="待处理" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已暂停" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="queryParams.priority" placeholder="优先级" clearable @change="fetchTasks">
            <el-option label="低" :value="0" />
            <el-option label="中" :value="1" />
            <el-option label="高" :value="2" />
            <el-option label="紧急" :value="3" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="queryParams.project_id" placeholder="所属项目" clearable @change="fetchTasks">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="queryParams.sort_by" placeholder="排序方式" @change="fetchTasks">
            <el-option label="创建时间" value="created_at" />
            <el-option label="截止日期" value="due_date" />
            <el-option label="优先级" value="priority" />
            <el-option label="排序" value="sort_order" />
          </el-select>
        </el-col>
        <el-col :span="2">
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <div class="task-list">
      <div v-if="loading" class="text-center p-6">
        <el-icon :size="32" class="is-loading"><Loading /></el-icon>
      </div>
      <div v-else-if="tasks.length === 0" class="empty-state card p-6 text-center">
        <el-empty description="暂无任务，点击上方按钮创建第一个任务" />
      </div>
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        :class="{ completed: task.status === 2 }"
        :style="{ borderLeftColor: getPriorityColor(task.priority) }"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <el-checkbox
                :model-value="task.status === 2"
                @change="(val: boolean) => toggleTaskStatus(task, val)"
              />
              <span class="task-title text-lg font-medium">{{ task.title }}</span>
              <el-tag
                v-if="task.priority !== undefined"
                :type="getPriorityType(task.priority)"
                size="small"
              >
                {{ getPriorityText(task.priority) }}
              </el-tag>
              <el-tag v-if="task.project" :type="getProjectTagType" size="small">
                {{ task.project.name }}
              </el-tag>
              <el-tag v-if="isOverdue(task)" type="danger" size="small">已逾期</el-tag>
            </div>
            <p v-if="task.description" class="description text-gray-600 mb-3">{{ task.description }}</p>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span v-if="task.due_date" class="flex items-center gap-1">
                <el-icon><Clock /></el-icon>
                {{ formatDate(task.due_date) }}
              </span>
              <span v-if="task.estimated_time" class="flex items-center gap-1">
                <el-icon><Timer /></el-icon>
                预计 {{ task.estimated_time }} 分钟
              </span>
              <span v-if="task.actual_time" class="flex items-center gap-1">
                <el-icon><Odometer /></el-icon>
                实际 {{ task.actual_time }} 分钟
              </span>
              <span class="flex items-center gap-1">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(task.created_at) }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <el-dropdown @command="(cmd: string) => handleQuickAction(task, cmd)">
              <el-button size="small" :icon="MoreFilled" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item v-if="task.status === 0" command="start">
                    <el-icon><VideoPlay /></el-icon>
                    开始
                  </el-dropdown-item>
                  <el-dropdown-item v-if="task.status === 1" command="pause">
                    <el-icon><VideoPause /></el-icon>
                    暂停
                  </el-dropdown-item>
                  <el-dropdown-item v-if="task.status !== 2" command="complete">
                    <el-icon><Check /></el-icon>
                    完成
                  </el-dropdown-item>
                  <el-dropdown-item v-if="task.status !== 4" command="cancel">
                    <el-icon><Close /></el-icon>
                    取消
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
      </div>
    </div>

    <div class="pagination mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.page_size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchTasks"
        @current-change="fetchTasks"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingTask ? '编辑任务' : '新建任务'"
      width="600px"
      @closed="resetForm"
    >
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="100px">
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属项目">
              <el-select v-model="taskForm.project_id" placeholder="请选择项目" clearable style="width: 100%">
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="taskForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="低" :value="0" />
                <el-option label="中" :value="1" />
                <el-option label="高" :value="2" />
                <el-option label="紧急" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="taskForm.due_date"
                type="datetime"
                placeholder="选择截止日期"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计时间">
              <el-input-number
                v-model="taskForm.estimated_time"
                :min="0"
                placeholder="分钟"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="任务状态" v-if="editingTask">
          <el-radio-group v-model="taskForm.status">
            <el-radio :value="0">待处理</el-radio>
            <el-radio :value="1">进行中</el-radio>
            <el-radio :value="2">已完成</el-radio>
            <el-radio :value="3">已暂停</el-radio>
            <el-radio :value="4">已取消</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus, Search, Loading, MoreFilled, Edit, Delete, Check, Close,
  Clock, Timer, Odometer, Calendar, VideoPlay, VideoPause
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { Task, Project, TaskQueryParams } from '@/types'
import {
  getTaskList, createTask, updateTask, deleteTask,
  completeTask, startTask, pauseTask, cancelTask
} from '@/api/task'
import { getAllProjects } from '@/api/project'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const tasks = ref<Task[]>([])
const projects = ref<Project[]>([])
const total = ref(0)
const editingTask = ref<Task | null>(null)
const taskFormRef = ref<FormInstance>()

const queryParams = reactive<TaskQueryParams>({
  page: 1,
  page_size: 20,
  status: undefined,
  priority: undefined,
  project_id: undefined,
  keyword: '',
  sort_by: 'created_at',
  sort_order: 'desc'
})

const taskForm = reactive({
  title: '',
  description: '',
  project_id: undefined as number | undefined,
  status: 0,
  priority: 1,
  due_date: '',
  estimated_time: undefined as number | undefined
})

const taskRules: FormRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符', trigger: 'blur' }
  ]
}

onMounted(() => {
  fetchProjects()
  fetchTasks()
})

const fetchProjects = async () => {
  try {
    const res = await getAllProjects(0)
    if (res.code === 0) {
      projects.value = res.data
    }
  } catch (e) {
    console.error('Fetch projects error:', e)
  }
}

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await getTaskList(queryParams)
    if (res.code === 0) {
      tasks.value = res.data.items
      total.value = res.data.total
    }
  } catch (e) {
    console.error('Fetch tasks error:', e)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  queryParams.page = 1
  queryParams.page_size = 20
  queryParams.status = undefined
  queryParams.priority = undefined
  queryParams.project_id = undefined
  queryParams.keyword = ''
  queryParams.sort_by = 'created_at'
  queryParams.sort_order = 'desc'
  fetchTasks()
}

const openCreateDialog = () => {
  editingTask.value = null
  resetForm()
  dialogVisible.value = true
}

const resetForm = () => {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.project_id = undefined
  taskForm.status = 0
  taskForm.priority = 1
  taskForm.due_date = ''
  taskForm.estimated_time = undefined
  taskFormRef.value?.resetFields()
}

const submitTask = async () => {
  if (!taskFormRef.value) return

  const valid = await taskFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    let res
    if (editingTask.value) {
      res = await updateTask(editingTask.value.id, taskForm)
    } else {
      res = await createTask(taskForm as any)
    }

    if (res.code === 0) {
      ElMessage.success(editingTask.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchTasks()
    }
  } catch (e) {
    console.error('Submit task error:', e)
  } finally {
    submitting.value = false
  }
}

const toggleTaskStatus = async (task: Task, completed: boolean) => {
  try {
    let res
    if (completed) {
      res = await completeTask(task.id)
    } else {
      res = await startTask(task.id)
    }
    if (res.code === 0) {
      fetchTasks()
    }
  } catch (e) {
    console.error('Toggle task error:', e)
  }
}

const handleQuickAction = async (task: Task, action: string) => {
  try {
    if (action === 'edit') {
      editingTask.value = task
      taskForm.title = task.title
      taskForm.description = task.description || ''
      taskForm.project_id = task.project_id
      taskForm.status = task.status
      taskForm.priority = task.priority
      taskForm.due_date = task.due_date || ''
      taskForm.estimated_time = task.estimated_time
      dialogVisible.value = true
      return
    }

    if (action === 'delete') {
      await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      const res = await deleteTask(task.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchTasks()
      }
      return
    }

    let res
    switch (action) {
      case 'start':
        res = await startTask(task.id)
        break
      case 'pause':
        res = await pauseTask(task.id)
        break
      case 'complete':
        res = await completeTask(task.id)
        break
      case 'cancel':
        res = await cancelTask(task.id)
        break
    }
    if (res?.code === 0) {
      ElMessage.success('操作成功')
      fetchTasks()
    }
  } catch (e) {
    console.error('Quick action error:', e)
  }
}

const getPriorityColor = (priority: number) => {
  const colors = ['#909399', '#409eff', '#e6a23c', '#f56c6c']
  return colors[priority] || colors[1]
}

const getPriorityType = (priority: number) => {
  const types: any = { 0: 'info', 1: 'primary', 2: 'warning', 3: 'danger' }
  return types[priority] || 'primary'
}

const getPriorityText = (priority: number) => {
  const texts = ['低', '中', '高', '紧急']
  return texts[priority] || '中'
}

const getProjectTagType = (project: any) => {
  return project?.color ? '' : 'info'
}

const isOverdue = (task: Task) => {
  if (!task.due_date || task.status === 2) return false
  return dayjs(task.due_date).isBefore(dayjs())
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.filter-section {
  .el-select,
  .el-input {
    width: 100%;
  }
}

.task-item {
  .task-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }

  .description {
    font-size: 14px;
    color: #909399;
    line-height: 1.5;
  }

  &.completed {
    .task-title {
      text-decoration: line-through;
      color: #909399;
    }
  }
}

.empty-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
