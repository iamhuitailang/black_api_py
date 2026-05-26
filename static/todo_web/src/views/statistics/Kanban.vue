<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">看板视图</h2>
      <div class="filter-bar">
        <el-select v-model="selectedProject" placeholder="选择项目" clearable @change="fetchKanbanData" style="width: 200px; margin-right: 12px;">
          <el-option
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建任务</el-button>
      </div>
    </div>

    <div v-if="loading" class="text-center p-6">
      <el-icon :size="32" class="is-loading"><Loading /></el-icon>
    </div>
    <div v-else class="kanban-board">
      <div
        v-for="column in columns"
        :key="column.status"
        class="kanban-column"
        @dragover.prevent="onDragOver($event, column.status)"
        @drop="onDrop($event, column.status)"
        :class="{ 'drag-over': dragOverStatus === column.status }"
      >
        <div class="kanban-column-header" :style="{ borderColor: column.color }">
          <span class="column-title">{{ column.title }}</span>
          <el-tag :type="column.tagType" size="small">
            {{ getColumnTasks(column.status)?.length || 0 }}
          </el-tag>
        </div>

        <div class="kanban-tasks">
          <div
            v-for="task in getColumnTasks(column.status)"
            :key="task.id"
            class="kanban-task"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            @dragend="onDragEnd"
            :style="{ borderLeftColor: getPriorityColor(task.priority) }"
          >
            <div class="task-header">
              <span class="task-title">{{ task.title }}</span>
              <el-dropdown @click.stop @command="(cmd: string) => handleAction(task, cmd)">
                <el-button size="small" :icon="MoreFilled" circle />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item divided command="delete" class="text-red-500">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <p v-if="task.description" class="task-desc">{{ task.description }}</p>
            <div class="task-footer">
              <el-tag
                v-if="task.priority !== undefined"
                :type="getPriorityType(task.priority)"
                size="small"
              >
                {{ getPriorityText(task.priority) }}
              </el-tag>
              <el-tag v-if="task.project" size="small">
                {{ task.project.name }}
              </el-tag>
              <span v-if="task.due_date" class="due-date" :class="{ overdue: isOverdue(task) }">
                <el-icon><Clock /></el-icon>
                {{ formatDate(task.due_date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
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
import { Plus, Loading, MoreFilled, Edit, Delete, Clock } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { Task, Project, KanbanData } from '@/types'
import { getKanbanData } from '@/api/statistics'
import { getAllProjects } from '@/api/project'
import { createTask, updateTask, deleteTask } from '@/api/task'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const kanbanData = ref<KanbanData | null>(null)
const projects = ref<Project[]>([])
const selectedProject = ref<number | undefined>()
const editingTask = ref<Task | null>(null)
const taskFormRef = ref<FormInstance>()

const draggedTask = ref<Task | null>(null)
const dragOverStatus = ref<number | null>(null)

const columns = [
  { status: 0, title: '待处理', color: '#909399', tagType: 'info' },
  { status: 1, title: '进行中', color: '#409eff', tagType: 'primary' },
  { status: 3, title: '已暂停', color: '#e6a23c', tagType: 'warning' },
  { status: 2, title: '已完成', color: '#67c23a', tagType: 'success' },
  { status: 4, title: '已取消', color: '#f56c6c', tagType: 'danger' }
]

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
  fetchKanbanData()
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

const fetchKanbanData = async () => {
  loading.value = true
  try {
    const res = await getKanbanData(selectedProject.value)
    if (res.code === 0) {
      kanbanData.value = res.data
    }
  } catch (e) {
    console.error('Fetch kanban error:', e)
  } finally {
    loading.value = false
  }
}

const getColumnTasks = (status: number) => {
  if (!kanbanData.value) return []
  const map: Record<number, Task[]> = {
    0: kanbanData.value.pending || [],
    1: kanbanData.value.in_progress || [],
    2: kanbanData.value.completed || [],
    3: kanbanData.value.paused || [],
    4: kanbanData.value.cancelled || []
  }
  return map[status] || []
}

const onDragStart = (e: DragEvent, task: Task) => {
  draggedTask.value = task
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(task.id))
  }
}

const onDragOver = (e: DragEvent, status: number) => {
  dragOverStatus.value = status
}

const onDragEnd = () => {
  draggedTask.value = null
  dragOverStatus.value = null
}

const onDrop = async (e: DragEvent, status: number) => {
  e.preventDefault()
  if (!draggedTask.value || draggedTask.value.status === status) {
    onDragEnd()
    return
  }

  try {
    const res = await updateTask(draggedTask.value.id, { status })
    if (res.code === 0) {
      ElMessage.success('状态更新成功')
      fetchKanbanData()
    }
  } catch (e) {
    console.error('Drop error:', e)
  } finally {
    onDragEnd()
  }
}

const openCreateDialog = () => {
  editingTask.value = null
  resetForm()
  dialogVisible.value = true
}

const resetForm = () => {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.project_id = selectedProject.value
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
      fetchKanbanData()
    }
  } catch (e) {
    console.error('Submit task error:', e)
  } finally {
    submitting.value = false
  }
}

const handleAction = async (task: Task, action: string) => {
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
        fetchKanbanData()
      }
    }
  } catch (e) {
    console.error('Action error:', e)
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

const isOverdue = (task: Task) => {
  if (!task.due_date || task.status === 2) return false
  return dayjs(task.due_date).isBefore(dayjs())
}

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  align-items: center;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  min-height: calc(100vh - 200px);
}

.kanban-column {
  background: #f0f2f5;
  border-radius: 8px;
  padding: 16px;
  min-height: 400px;
  transition: background 0.2s;

  &.drag-over {
    background: #e8f4ff;
    border: 2px dashed #409eff;
  }
}

.kanban-column-header {
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .column-title {
    font-size: 15px;
    color: #303133;
  }
}

.kanban-tasks {
  min-height: 100px;
}

.kanban-task {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border-left: 4px solid #409eff;
  cursor: grab;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &:active {
    cursor: grabbing;
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;

    .task-title {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      line-height: 1.4;
      flex: 1;
    }
  }

  .task-desc {
    font-size: 12px;
    color: #909399;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .task-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;

    .due-date {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      color: #909399;

      &.overdue {
        color: #f56c6c;
      }
    }
  }
}
</style>
