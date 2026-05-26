<template>
  <div class="dashboard-page">
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card blue">
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">总用户数</p>
              <p class="stat-value">{{ statistics?.total_users || 0 }}</p>
              <p class="stat-sub">今日新增：{{ statistics?.today_new_users || 0 }}</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card green">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">总简历数</p>
              <p class="stat-value">{{ statistics?.total_resumes || 0 }}</p>
              <p class="stat-sub">今日新增：{{ statistics?.today_new_resumes || 0 }}</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card orange">
            <div class="stat-icon">
              <el-icon><Picture /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">模板总数</p>
              <p class="stat-value">{{ statistics?.total_templates || 0 }}</p>
              <p class="stat-sub">已上架：{{ publishedTemplates }}</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card purple">
            <div class="stat-icon">
              <el-icon><Download /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">总下载量</p>
              <p class="stat-value">{{ statistics?.total_downloads || 0 }}</p>
              <p class="stat-sub">累计下载次数</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="charts-section mt-20">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <h3>用户增长趋势</h3>
            <el-empty v-if="!statistics?.user_growth?.length" description="暂无数据" />
            <div v-else class="chart-container">
              <div v-for="item in statistics.user_growth" :key="item.date" class="chart-item">
                <span class="chart-date">{{ item.date }}</span>
                <div class="chart-bar">
                  <div class="chart-fill" :style="{ width: getBarWidth(item.count, maxUserCount) + '%' }"></div>
                </div>
                <span class="chart-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <h3>简历生成趋势</h3>
            <el-empty v-if="!statistics?.resume_growth?.length" description="暂无数据" />
            <div v-else class="chart-container">
              <div v-for="item in statistics.resume_growth" :key="item.date" class="chart-item">
                <span class="chart-date">{{ item.date }}</span>
                <div class="chart-bar">
                  <div class="chart-fill green" :style="{ width: getBarWidth(item.count, maxResumeCount) + '%' }"></div>
                </div>
                <span class="chart-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="usage-section mt-20">
      <div class="chart-card">
        <h3>模板使用排行</h3>
        <el-table v-if="statistics?.template_usage?.length" :data="statistics.template_usage" style="width: 100%">
          <el-table-column prop="template_name" label="模板名称" />
          <el-table-column prop="use_count" label="使用次数" width="200">
            <template #default="scope">
              <el-tag type="primary">{{ scope.row.use_count }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="使用率" width="300">
            <template #default="scope">
              <el-progress :percentage="getUsagePercent(scope.row.use_count)" />
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  User,
  Document,
  Picture,
  Download
} from '@element-plus/icons-vue'
import { statisticsApi, templateApi } from '@/api'
import type { StatisticsData } from '@/types'

const statistics = ref<StatisticsData | null>(null)
const publishedTemplates = ref(0)

const maxUserCount = computed(() => {
  if (!statistics.value?.user_growth?.length) return 0
  return Math.max(...statistics.value.user_growth.map(item => item.count))
})

const maxResumeCount = computed(() => {
  if (!statistics.value?.resume_growth?.length) return 0
  return Math.max(...statistics.value.resume_growth.map(item => item.count))
})

const maxUseCount = computed(() => {
  if (!statistics.value?.template_usage?.length) return 0
  return Math.max(...statistics.value.template_usage.map(item => item.use_count))
})

const getBarWidth = (count: number, max: number) => {
  if (max === 0) return 0
  return Math.round((count / max) * 100)
}

const getUsagePercent = (count: number) => {
  if (maxUseCount.value === 0) return 0
  return Math.round((count / maxUseCount.value) * 100)
}

const loadStatistics = async () => {
  try {
    const res = await statisticsApi.getOverview()
    statistics.value = res
  } catch (error) {
    console.error('Load statistics error:', error)
  }
}

const loadTemplates = async () => {
  try {
    const res = await templateApi.getTemplateList({ page: 1, page_size: 100 })
    publishedTemplates.value = res.items.filter(item => item.status === 1).length
  } catch (error) {
    console.error('Load templates error:', error)
  }
}

onMounted(() => {
  loadStatistics()
  loadTemplates()
})
</script>

<style scoped>
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card.blue::before {
  background: #409eff;
}

.stat-card.green::before {
  background: #67c23a;
}

.stat-card.orange::before {
  background: #e6a23c;
}

.stat-card.purple::before {
  background: #909399;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-card.blue .stat-icon {
  background: linear-gradient(135deg, #66b1ff, #409eff);
}

.stat-card.green .stat-icon {
  background: linear-gradient(135deg, #85ce61, #67c23a);
}

.stat-card.orange .stat-icon {
  background: linear-gradient(135deg, #ebb563, #e6a23c);
}

.stat-card.purple .stat-icon {
  background: linear-gradient(135deg, #a6a9ad, #909399);
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.stat-sub {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-date {
  width: 100px;
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.chart-bar {
  flex: 1;
  height: 24px;
  background: #f0f2f5;
  border-radius: 12px;
  overflow: hidden;
}

.chart-fill {
  height: 100%;
  background: linear-gradient(90deg, #66b1ff, #409eff);
  border-radius: 12px;
  transition: width 0.5s;
}

.chart-fill.green {
  background: linear-gradient(90deg, #85ce61, #67c23a);
}

.chart-value {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
</style>
