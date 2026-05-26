<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <div class="welcome">
        <span>你好，{{ userStore.user?.nickname || userStore.user?.username }}！</span>
        <span class="date">{{ todayLabel }}</span>
      </div>
    </div>

    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="flex justify-between items-center">
            <div>
              <div class="label">今日待办</div>
              <div class="value">{{ overview?.today_tasks || 0 }}</div>
            </div>
            <el-icon :size="48" class="opacity-30"><List /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="flex justify-between items-center">
            <div>
              <div class="label">已逾期</div>
              <div class="value">{{ overview?.overdue_tasks || 0 }}</div>
            </div>
            <el-icon :size="48" class="opacity-30"><Warning /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="flex justify-between items-center">
            <div>
              <div class="label">完成率</div>
              <div class="value">{{ overview?.completion_rate || 0 }}%</div>
            </div>
            <el-icon :size="48" class="opacity-30"><TrendCharts /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <div class="flex justify-between items-center">
            <div>
              <div class="label">进行中项目</div>
              <div class="value">{{ overview?.active_projects || 0 }}</div>
            </div>
            <el-icon :size="48" class="opacity-30"><FolderOpened /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card p-6 mb-6">
          <div class="section-header">
            <h3 class="section-title">今日任务</h3>
            <router-link to="/tasks" class="view-all">查看全部</router-link>
          </div>
          <div v-if="loading" class="text-center p-6">
            <el-icon :size="32" class="is-loading"><Loading /></el-icon>
          </div>
          <div v-else-if="todayTasks.length === 0" class="empty-state text-center p-6">
            <el-empty description="今天暂无任务，去创建一个吧" :image-size="80">
              <el-button type="primary" @click="$router.push('/tasks')">创建任务</el-button>
            </el-empty>
          </div>
          <div v-else class="task-list">
            <div
              v-for="task in todayTasks"
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="section-header">
            <h3 class="section-title">完成趋势（近7天）</h3>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card p-6 mb-6">
          <div class="section-header">
            <h3 class="section-title">快捷操作</h3>
          </div>
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/tasks')">
              <div class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon :size="28"><Plus /></el-icon>
              </div>
              <span>新建任务</span>
            </div>
            <div class="action-item" @click="$router.push('/projects')">
              <div class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <el-icon :size="28"><Folder /></el-icon>
              </div>
              <span>项目管理</span>
            </div>
            <div class="action-item" @click="$router.push('/kanban')">
              <div class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon :size="28"><Menu /></el-icon>
              </div>
              <span>看板视图</span>
            </div>
            <div class="action-item" @click="$router.push('/calendar')">
              <div class="action-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon :size="28"><Calendar /></el-icon>
              </div>
              <span>日历视图</span>
            </div>
          </div>
        </div>

        <div class="card p-6 mb-6">
          <div class="section-header">
            <h3 class="section-title">我的项目</h3>
            <router-link to="/projects" class="view-all">查看全部</router-link>
          </div>
          <div v-if="loading" class="text-center p-6">
            <el-icon :size="32" class="is-loading"><Loading /></el-icon>
          </div>
          <div v-else-if="recentProjects.length === 0" class="empty-state text-center p-6">
            <el-empty description="暂无项目" :image-size="60" />
          </div>
          <div v-else class="project-list">
            <div
              v-for="project in recentProjects"
              :key="project.id"
              class="project-item"
              @click="goToProjectTasks(project)"
            >
              <div class="project-icon" :style="{ backgroundColor: project.color || '#409eff' }">
                <el-icon :size="20"><Folder /></el-icon>
              </div>
              <div class="project-info">
                <div class="project-name">{{ project.name }}</div>
                <div class="project-progress">
                  <el-progress
                    :percentage="project.progress || 0"
                    :stroke-width="6"
                    :show-text="false"
                    style="width: 120px;"
                  />
                  <span class="progress-text">{{ project.progress || 0 }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="section-header">
            <h3 class="section-title">个人数据</h3>
            <router-link to="/profile" class="view-all">详情</router-link>
          </div>
          <div class="personal-stats">
            <div class="stat-item">
              <span class="stat-value">{{ personalStats?.total_tasks || 0 }}</span>
              <span class="stat-label">总任务数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ personalStats?.completed_tasks || 0 }}</span>
              <span class="stat-label">已完成</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ personalStats?.total_projects || 0 }}</span>
              <span class="stat-label">项目数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ personalStats?.average_completion_days || 0 }}</span>
              <span class="stat-label">平均完成(天)</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  List, Warning, TrendCharts, FolderOpened, Loading, Plus, Folder,
  Menu, Calendar, Clock
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import type { Task, Project, OverviewStatistics, TrendData, PersonalStats } from '@/types'
import { getOverviewStatistics, getTrendData, getPersonalStats } from '@/api/statistics'
import { getTodayTasks } from '@/api/task'
import { getAllProjects } from '@/api/project'
import { completeTask, startTask } from '@/api/task'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const trendChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

const overview = ref<OverviewStatistics | null>(null)
const personalStats = ref<PersonalStats | null>(null)
const todayTasks = ref<Task[]>([])
const recentProjects = ref<Project[]>([])

const todayLabel = computed(() => {
  const today = dayjs()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${today.format('YYYY年MM月DD日')} ${weekDays[today.day()]}`
})

const handleResize = () => {
  trendChart?.resize()
}

onMounted(() => {
  fetchDashboardData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
})

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [overviewRes, todayRes, projectsRes, statsRes, trendRes] = await Promise.all([
      getOverviewStatistics(),
      getTodayTasks(),
      getAllProjects(0),
      getPersonalStats(),
      getTrendData(7)
    ])

    if (overviewRes.code === 0) {
      overview.value = overviewRes.data
    }
    if (todayRes.code === 0) {
      todayTasks.value = todayRes.data
    }
    if (projectsRes.code === 0) {
      recentProjects.value = projectsRes.data.slice(0, 5)
      recentProjects.value.forEach(p => {
        p.progress = Math.floor(Math.random() * 100)
      })
    }
    if (statsRes.code === 0) {
      personalStats.value = statsRes.data
    }
    if (trendRes.code === 0) {
      await nextTick()
      renderTrendChart(trendRes.data)
    }
  } catch (e) {
    console.error('Fetch dashboard error:', e)
  } finally {
    loading.value = false
  }
}

const renderTrendChart = (data: TrendData[]) => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const dates = data.map(item => dayjs(item.date).format('MM-DD'))
  const completedCounts = data.map(item => item.completed_count)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '完成任务',
        type: 'line',
        smooth: true,
        data: completedCounts,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(67, 233, 123, 0.5)' },
            { offset: 1, color: 'rgba(67, 233, 123, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#43e97b',
          width: 3
        },
        itemStyle: {
          color: '#43e97b'
        }
      }
    ]
  })
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
      fetchDashboardData()
    }
  } catch (e) {
    console.error('Toggle task error:', e)
  }
}

const goToProjectTasks = (project: Project) => {
  router.push({
    path: '/tasks',
    query: { project_id: String(project.id) }
  })
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

const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<script lang="ts">
import { computed } from 'vue'
export default { name: 'Dashboard' }
</script>

<style scoped lang="scss">
.welcome {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;

  .date {
    font-size: 14px;
    color: #909399;
  }
}

.stat-card {
  color: #fff;
  border-radius: 12px;
  padding: 24px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .label {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 8px;
  }

  .value {
    font-size: 32px;
    font-weight: 700;
  }

  .opacity-30 {
    opacity: 0.3;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .view-all {
    font-size: 14px;
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.chart-container {
  height: 250px;
  width: 100%;
}

.task-item {
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
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
    font-size: 15px;
    font-weight: 500;
    color: #303133;
  }

  .description {
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 12px;
    border-radius: 12px;
    background: #fafafa;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .action-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
  }
}

.project-list {
  .project-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    background: #fafafa;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #f0f2f5;
    }

    .project-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .project-info {
      flex: 1;

      .project-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 6px;
      }

      .project-progress {
        display: flex;
        align-items: center;
        gap: 8px;

        .progress-text {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.personal-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .stat-item {
    text-align: center;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #909399;
    }
  }
}

.empty-state {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
