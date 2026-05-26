<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">日历视图</h2>
      <div class="calendar-controls">
        <el-button :icon="ArrowLeft" circle @click="prevMonth" />
        <span class="current-month">{{ currentMonthLabel }}</span>
        <el-button :icon="ArrowRight" circle @click="nextMonth" />
        <el-button type="primary" @click="goToToday">今天</el-button>
      </div>
    </div>

    <div class="calendar-container card p-4">
      <div class="calendar-header">
        <div
          v-for="day in weekDays"
          :key="day"
          class="calendar-weekday"
          :class="{ weekend: day === '六' || day === '日' }"
        >
          {{ day }}
        </div>
      </div>

      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': day.date === selectedDate
          }"
          @click="selectDate(day)"
        >
          <div class="day-number" :class="{ 'weekend': day.isWeekend }">
            {{ day.day }}
          </div>
          <div class="day-tasks">
            <div
              v-for="task in getDayTasks(day.date)"
              :key="task.id"
              class="day-task-item"
              :style="{ borderLeftColor: getPriorityColor(task.priority) }"
              @click.stop="viewTask(task)"
            >
              <span class="task-dot" :style="{ backgroundColor: getPriorityColor(task.priority) }"></span>
              <span class="task-title">{{ task.title }}</span>
            </div>
          </div>
          <div v-if="day.taskCount > 3" class="more-tasks">
            +{{ day.taskCount - 3 }} 更多
          </div>
        </div>
      </div>
    </div>

    <div class="selected-date-tasks card p-6 mt-6">
      <h3 class="tasks-title">
        <el-icon><Calendar /></el-icon>
        {{ selectedDateLabel }}的任务
      </h3>
      <div v-if="selectedDateTasks.length === 0" class="empty-tasks text-center p-6">
        <el-empty description="当天暂无任务" />
      </div>
      <div v-else class="tasks-list">
        <div
          v-for="task in selectedDateTasks"
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
                <el-tag v-if="task.project" size="small">
                  {{ task.project.name }}
                </el-tag>
              </div>
              <p v-if="task.description" class="description text-gray-600 mb-3">{{ task.description }}</p>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span v-if="task.due_date" class="flex items-center gap-1">
                  <el-icon><Clock /></el-icon>
                  {{ formatDateTime(task.due_date) }}
                </span>
                <span class="flex items-center gap-1">
                  <el-tag :type="getStatusType(task.status)" size="small">
                    {{ getStatusText(task.status) }}
                  </el-tag>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="taskDetailVisible" title="任务详情" width="600px">
      <div v-if="currentTask" class="task-detail">
        <h3 class="detail-title">{{ currentTask.title }}</h3>
        <div class="detail-meta">
          <el-tag :type="getPriorityType(currentTask.priority)" size="small">
            {{ getPriorityText(currentTask.priority) }}
          </el-tag>
          <el-tag :type="getStatusType(currentTask.status)" size="small">
            {{ getStatusText(currentTask.status) }}
          </el-tag>
          <el-tag v-if="currentTask.project" size="small">
            {{ currentTask.project.name }}
          </el-tag>
        </div>
        <p v-if="currentTask.description" class="detail-desc">{{ currentTask.description }}</p>
        <div class="detail-info">
          <div v-if="currentTask.due_date" class="info-item">
            <span class="label">截止时间：</span>
            <span>{{ formatDateTime(currentTask.due_date) }}</span>
          </div>
          <div v-if="currentTask.estimated_time" class="info-item">
            <span class="label">预计时间：</span>
            <span>{{ currentTask.estimated_time }} 分钟</span>
          </div>
          <div v-if="currentTask.actual_time" class="info-item">
            <span class="label">实际时间：</span>
            <span>{{ currentTask.actual_time }} 分钟</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span>{{ formatDateTime(currentTask.created_at) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="taskDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Calendar, Clock } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { Task, CalendarData } from '@/types'
import { getCalendarData } from '@/api/statistics'
import { completeTask, startTask } from '@/api/task'

const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month())
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const calendarData = ref<CalendarData[]>([])
const taskDetailVisible = ref(false)
const currentTask = ref<Task | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  taskCount: number
}

const currentMonthLabel = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const selectedDateLabel = computed(() => {
  const date = dayjs(selectedDate.value)
  const today = dayjs()
  const diff = date.diff(today, 'day')
  
  if (diff === 0) return '今天'
  if (diff === -1) return '昨天'
  if (diff === 1) return '明天'
  
  return `${date.month() + 1}月${date.date()}日`
})

const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = dayjs(`${currentYear.value}-${currentMonth.value + 1}-01`)
  const startDay = firstDay.startOf('week')
  const days: CalendarDay[] = []
  const today = dayjs().format('YYYY-MM-DD')

  for (let i = 0; i < 42; i++) {
    const date = startDay.add(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const dayData = calendarData.value.find(d => d.date === dateStr)
    
    days.push({
      date: dateStr,
      day: date.date(),
      isCurrentMonth: date.month() === currentMonth.value,
      isToday: dateStr === today,
      isWeekend: date.day() === 0 || date.day() === 6,
      taskCount: dayData?.tasks?.length || 0
    })
  }

  return days
})

const selectedDateTasks = computed<Task[]>(() => {
  const dayData = calendarData.value.find(d => d.date === selectedDate.value)
  return dayData?.tasks || []
})

onMounted(() => {
  fetchCalendarData()
})

const fetchCalendarData = async () => {
  try {
    const res = await getCalendarData(currentYear.value, currentMonth.value + 1)
    if (res.code === 0) {
      calendarData.value = res.data
    }
  } catch (e) {
    console.error('Fetch calendar error:', e)
  }
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  fetchCalendarData()
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  fetchCalendarData()
}

const goToToday = () => {
  currentYear.value = dayjs().year()
  currentMonth.value = dayjs().month()
  selectedDate.value = dayjs().format('YYYY-MM-DD')
  fetchCalendarData()
}

const selectDate = (day: CalendarDay) => {
  selectedDate.value = day.date
}

const getDayTasks = (date: string) => {
  const dayData = calendarData.value.find(d => d.date === date)
  return dayData?.tasks?.slice(0, 3) || []
}

const viewTask = (task: Task) => {
  currentTask.value = task
  taskDetailVisible.value = true
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
      ElMessage.success('状态更新成功')
      fetchCalendarData()
    }
  } catch (e) {
    console.error('Toggle task error:', e)
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

const getStatusType = (status: number) => {
  const types: any = { 0: 'info', 1: 'primary', 2: 'success', 3: 'warning', 4: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts = ['待处理', '进行中', '已完成', '已暂停', '已取消']
  return texts[status] || '未知'
}

const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.calendar-controls {
  display: flex;
  align-items: center;
  gap: 12px;

  .current-month {
    font-size: 18px;
    font-weight: 600;
    min-width: 120px;
    text-align: center;
  }
}

.calendar-container {
  user-select: none;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 2px solid #ebeef5;
  margin-bottom: 8px;

  .calendar-weekday {
    padding: 12px;
    text-align: center;
    font-weight: 600;
    color: #606266;

    &.weekend {
      color: #f56c6c;
    }
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  min-height: 120px;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: #f5f7fa;
    border-color: #409eff;
  }

  &.other-month {
    background: #fafafa;
    color: #c0c4cc;

    .day-number {
      color: #c0c4cc;
    }
  }

  &.today {
    background: #ecf5ff;
    border-color: #409eff;

    .day-number {
      background: #409eff;
      color: #fff;
      border-radius: 50%;
    }
  }

  &.selected {
    border: 2px solid #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .day-number {
    display: inline-block;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    font-weight: 500;
    margin-bottom: 8px;

    &.weekend {
      color: #f56c6c;
    }
  }

  .day-tasks {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .day-task-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    background: #f5f7fa;
    border-left: 3px solid #409eff;
    border-radius: 2px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #e8f4ff;
    }

    .task-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .task-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .more-tasks {
    position: absolute;
    bottom: 4px;
    right: 8px;
    font-size: 11px;
    color: #909399;
  }
}

.tasks-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-item {
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 12px;
  border-left: 4px solid #e4e7ed;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.completed {
    opacity: 0.7;

    .task-title {
      text-decoration: line-through;
      color: #909399;
    }
  }

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
}

.task-detail {
  .detail-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }

  .detail-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .detail-desc {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .detail-info {
    .info-item {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f0f2f5;

      &:last-child {
        border-bottom: none;
      }

      .label {
        width: 100px;
        color: #909399;
        flex-shrink: 0;
      }
    }
  }
}
</style>
