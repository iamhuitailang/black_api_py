<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">统计分析</h2>
      <div class="date-filter">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="fetchStatistics"
        />
      </div>
    </div>

    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="label">总任务数</div>
          <div class="value">{{ overview?.total_tasks || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="label">已完成</div>
          <div class="value">{{ overview?.completed_tasks || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="label">完成率</div>
          <div class="value">{{ overview?.completion_rate || 0 }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <div class="label">进行中</div>
          <div class="value">{{ overview?.in_progress_tasks || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card p-6 mb-6">
          <h3 class="chart-title">完成趋势（近30天）</h3>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card p-6 mb-6">
          <h3 class="chart-title">标签分布</h3>
          <div ref="tagChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card p-6 mb-6">
          <h3 class="chart-title">项目分布</h3>
          <div ref="projectChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card p-6 mb-6">
          <h3 class="chart-title">优先级分布</h3>
          <div ref="priorityChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <div class="card p-6">
      <h3 class="chart-title">任务状态分布</h3>
      <div ref="statusChartRef" class="chart-container" style="height: 300px;"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { OverviewStatistics, TrendData, TagDistribution, ProjectDistribution } from '@/types'
import {
  getOverviewStatistics, getTrendData, getTagDistribution, getProjectDistribution
} from '@/api/statistics'

const dateRange = ref<string[]>([])
const overview = ref<OverviewStatistics | null>(null)

const trendChartRef = ref<HTMLElement>()
const tagChartRef = ref<HTMLElement>()
const projectChartRef = ref<HTMLElement>()
const priorityChartRef = ref<HTMLElement>()
const statusChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let tagChart: echarts.ECharts | null = null
let projectChart: echarts.ECharts | null = null
let priorityChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null

const handleResize = () => {
  trendChart?.resize()
  tagChart?.resize()
  projectChart?.resize()
  priorityChart?.resize()
  statusChart?.resize()
}

onMounted(() => {
  fetchStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  tagChart?.dispose()
  projectChart?.dispose()
  priorityChart?.dispose()
  statusChart?.dispose()
})

const fetchStatistics = async () => {
  const params: any = {}
  if (dateRange.value?.length === 2) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }

  try {
    const [overviewRes, trendRes, tagRes, projectRes] = await Promise.all([
      getOverviewStatistics(params),
      getTrendData(30),
      getTagDistribution(),
      getProjectDistribution()
    ])

    if (overviewRes.code === 0) {
      overview.value = overviewRes.data
    }
    if (trendRes.code === 0) {
      await nextTick()
      renderTrendChart(trendRes.data)
    }
    if (tagRes.code === 0) {
      await nextTick()
      renderTagChart(tagRes.data)
    }
    if (projectRes.code === 0) {
      await nextTick()
      renderProjectChart(projectRes.data)
      renderPriorityChart()
      renderStatusChart()
    }
  } catch (e) {
    console.error('Fetch statistics error:', e)
  }
}

const renderTrendChart = (data: TrendData[]) => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const dates = data.map(item => item.date)
  const createdCounts = data.map(item => item.created_count)
  const completedCounts = data.map(item => item.completed_count)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['创建任务', '完成任务']
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
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '创建任务',
        type: 'line',
        smooth: true,
        data: createdCounts,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#667eea'
        },
        itemStyle: {
          color: '#667eea'
        }
      },
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
          color: '#43e97b'
        },
        itemStyle: {
          color: '#43e97b'
        }
      }
    ]
  })
}

const renderTagChart = (data: TagDistribution[]) => {
  if (!tagChartRef.value) return
  tagChart = echarts.init(tagChartRef.value)

  const chartData = data.map(item => ({
    value: item.count,
    name: item.name,
    itemStyle: {
      color: item.color || '#409eff'
    }
  }))

  tagChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData.length > 0 ? chartData : [{ value: 0, name: '暂无数据' }]
      }
    ]
  })
}

const renderProjectChart = (data: ProjectDistribution[]) => {
  if (!projectChartRef.value) return
  projectChart = echarts.init(projectChartRef.value)

  const names = data.map(item => item.name)
  const taskCounts = data.map(item => item.task_count)
  const completedCounts = data.map(item => item.completed_count)
  const colors = data.map(item => item.color || '#409eff')

  projectChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['总任务', '已完成']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '总任务',
        type: 'bar',
        data: taskCounts,
        itemStyle: {
          color: (params: any) => colors[params.dataIndex] || '#409eff'
        }
      },
      {
        name: '已完成',
        type: 'bar',
        data: completedCounts,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  })
}

const renderPriorityChart = () => {
  if (!priorityChartRef.value || !overview.value) return
  priorityChart = echarts.init(priorityChartRef.value)

  const data = [
    { value: overview.value.low_priority || 0, name: '低优先级', itemStyle: { color: '#909399' } },
    { value: overview.value.medium_priority || 0, name: '中优先级', itemStyle: { color: '#409eff' } },
    { value: overview.value.high_priority || 0, name: '高优先级', itemStyle: { color: '#e6a23c' } },
    { value: overview.value.urgent_priority || 0, name: '紧急', itemStyle: { color: '#f56c6c' } }
  ]

  priorityChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
}

const renderStatusChart = () => {
  if (!statusChartRef.value || !overview.value) return
  statusChart = echarts.init(statusChartRef.value)

  const data = [
    { value: overview.value.pending_tasks || 0, name: '待处理', itemStyle: { color: '#909399' } },
    { value: overview.value.in_progress_tasks || 0, name: '进行中', itemStyle: { color: '#409eff' } },
    { value: overview.value.completed_tasks || 0, name: '已完成', itemStyle: { color: '#67c23a' } },
    { value: overview.value.paused_tasks || 0, name: '已暂停', itemStyle: { color: '#e6a23c' } },
    { value: overview.value.cancelled_tasks || 0, name: '已取消', itemStyle: { color: '#f56c6c' } }
  ]

  statusChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      top: 'center',
      right: '10%',
      orient: 'vertical'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: data,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  })
}
</script>

<style scoped lang="scss">
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
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.date-filter {
  display: flex;
  gap: 12px;
}
</style>
