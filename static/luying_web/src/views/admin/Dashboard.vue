<template>
  <div class="dashboard" v-loading="loading">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon :size="40" color="#409eff"><User /></el-icon>
            <div>
              <div class="stat-value">{{ statistics.user_count }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon :size="40" color="#67c23a"><Document /></el-icon>
            <div>
              <div class="stat-value">{{ statistics.plan_count }}</div>
              <div class="stat-label">计划总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon :size="40" color="#e6a23c"><Goods /></el-icon>
            <div>
              <div class="stat-value">{{ statistics.equipment_count }}</div>
              <div class="stat-label">装备总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon :size="40" color="#f56c6c"><Location /></el-icon>
            <div>
              <div class="stat-value">{{ statistics.campsite_count }}</div>
              <div class="stat-label">营地总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>最近7天数据趋势</span>
        </div>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近注册用户</span>
            </div>
          </template>
          <div v-for="user in statistics.recent_users" :key="user.id" class="recent-item">
            <el-avatar :size="32" :src="user.avatar">
              {{ user.nickname?.[0] || 'U' }}
            </el-avatar>
            <div class="recent-info">
              <span class="name">{{ user.nickname }}</span>
              <span class="time">{{ formatTime(user.created_at) }}</span>
            </div>
          </div>
          <el-empty v-if="statistics.recent_users.length === 0" :image-size="60" description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近发布帖子</span>
            </div>
          </template>
          <div v-for="post in statistics.recent_posts" :key="post.id" class="recent-item">
            <el-icon :size="24" color="#909399"><Document /></el-icon>
            <div class="recent-info">
              <span class="name text-ellipsis">{{ post.title }}</span>
              <span class="time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
          <el-empty v-if="statistics.recent_posts.length === 0" :image-size="60" description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { getStatistics } from '@/api/admin'
import * as echarts from 'echarts'
import type { Statistics } from '@/types'

const loading = ref(false)
const chartRef = ref<HTMLElement>()
const statistics = reactive<Statistics>({
  user_count: 0,
  plan_count: 0,
  equipment_count: 0,
  campsite_count: 0,
  post_count: 0,
  recent_users: [],
  recent_posts: [],
  daily_stats: []
})

let chart: echarts.ECharts | null = null

const fetchStatistics = async () => {
  loading.value = true
  try {
    const res = await getStatistics()
    if (res.code === 200) {
      Object.assign(statistics, res.data)
      renderChart()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value) return

  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartRef.value)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增用户', '新增帖子', '新增计划']
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
      data: statistics.daily_stats.map(d => d.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: statistics.daily_stats.map(d => d.new_users),
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
      },
      {
        name: '新增帖子',
        type: 'line',
        smooth: true,
        data: statistics.daily_stats.map(d => d.new_posts),
        itemStyle: { color: '#67c23a' },
        areaStyle: { color: 'rgba(103, 194, 58, 0.1)' }
      },
      {
        name: '新增计划',
        type: 'line',
        smooth: true,
        data: statistics.daily_stats.map(d => d.new_plans),
        itemStyle: { color: '#e6a23c' },
        areaStyle: { color: 'rgba(230, 162, 60, 0.1)' }
      }
    ]
  }

  chart.setOption(option)
}

const formatTime = (time?: string) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString()
}

const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  fetchStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  height: 350px;
}

.card-header {
  font-weight: 500;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-info .name {
  font-weight: 500;
}

.recent-info .time {
  color: #909399;
  font-size: 12px;
}
</style>
