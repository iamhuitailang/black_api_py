<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card p-6 mb-6">
          <div class="profile-header">
            <el-avatar :size="100" :src="userStore.user?.avatar">
              {{ userStore.user?.nickname?.charAt(0) || userStore.user?.username?.charAt(0) || 'U' }}
            </el-avatar>
            <h3 class="username">{{ userStore.user?.nickname || userStore.user?.username }}</h3>
            <p class="user-email">{{ userStore.user?.email }}</p>
          </div>

          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane label="基本信息" name="basic">
              <el-form
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-width="80px"
                class="profile-form"
              >
                <el-form-item label="用户名">
                  <el-input v-model="profileForm.username" disabled />
                </el-form-item>
                <el-form-item label="昵称" prop="nickname">
                  <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="简介">
                  <el-input
                    v-model="profileForm.bio"
                    type="textarea"
                    :rows="3"
                    placeholder="介绍一下自己"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="profileSubmitting" @click="updateProfile">
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="80px"
                class="password-form"
              >
                <el-form-item label="原密码" prop="old_password">
                  <el-input
                    v-model="passwordForm.old_password"
                    type="password"
                    placeholder="请输入原密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="new_password">
                  <el-input
                    v-model="passwordForm.new_password"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirm_password">
                  <el-input
                    v-model="confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="passwordSubmitting" @click="changePassword">
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>

      <el-col :span="16">
        <div class="card p-6 mb-6">
          <h3 class="section-title">任务统计</h3>
          <el-row :gutter="20" class="stats-grid">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color: #667eea;">{{ personalStats?.total_tasks || 0 }}</div>
                <div class="stat-label">总任务数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color: #67c23a;">{{ personalStats?.completed_tasks || 0 }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color: #409eff;">{{ personalStats?.in_progress_tasks || 0 }}</div>
                <div class="stat-label">进行中</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color: #e6a23c;">{{ personalStats?.overdue_tasks || 0 }}</div>
                <div class="stat-label">已逾期</div>
              </div>
            </el-col>
          </el-row>

          <div class="stats-detail">
            <div class="detail-item">
              <span class="detail-label">完成率</span>
              <el-progress
                :percentage="personalStats?.completion_rate || 0"
                :color="getProgressColor(personalStats?.completion_rate || 0)"
              />
            </div>
            <div class="detail-item">
              <span class="detail-label">平均完成时间</span>
              <span class="detail-value">{{ personalStats?.average_completion_days || 0 }} 天</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">注册时间</span>
              <span class="detail-value">{{ formatDate(userStore.user?.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="card p-6 mb-6">
          <h3 class="section-title">项目统计</h3>
          <el-row :gutter="20" class="stats-grid">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value" style="color: #667eea;">{{ personalStats?.total_projects || 0 }}</div>
                <div class="stat-label">总项目数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value" style="color: #409eff;">{{ personalStats?.active_projects || 0 }}</div>
                <div class="stat-label">进行中</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value" style="color: #67c23a;">{{ personalStats?.completed_projects || 0 }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="card p-6">
          <h3 class="section-title">近30天完成趋势</h3>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import type { PersonalStats, TrendData } from '@/types'
import { updateProfile, changePassword } from '@/api/user'
import { getPersonalStats, getTrendData } from '@/api/statistics'

const userStore = useUserStore()

const activeTab = ref('basic')
const profileSubmitting = ref(false)
const passwordSubmitting = ref(false)
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const confirmPassword = ref('')
const trendChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

const personalStats = ref<PersonalStats | null>(null)

const profileForm = reactive({
  username: userStore.user?.username || '',
  nickname: userStore.user?.nickname || '',
  email: userStore.user?.email || '',
  bio: ''
})

const passwordForm = reactive({
  old_password: '',
  new_password: ''
})

const profileRules: FormRules = {
  nickname: [
    { min: 1, max: 50, message: '昵称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  old_password: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleResize = () => {
  trendChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
})

const fetchData = async () => {
  try {
    const [statsRes, trendRes] = await Promise.all([
      getPersonalStats(),
      getTrendData(30)
    ])

    if (statsRes.code === 0) {
      personalStats.value = statsRes.data
    }
    if (trendRes.code === 0) {
      await nextTick()
      renderTrendChart(trendRes.data)
    }
  } catch (e) {
    console.error('Fetch profile data error:', e)
  }
}

const updateProfile = async () => {
  if (!profileFormRef.value) return

  const valid = await profileFormRef.value.validate().catch(() => false)
  if (!valid) return

  profileSubmitting.value = true
  try {
    const res = await updateProfile({
      nickname: profileForm.nickname,
      email: profileForm.email,
      bio: profileForm.bio
    })
    if (res.code === 0) {
      ElMessage.success('更新成功')
      userStore.updateUser(res.data)
    }
  } catch (e) {
    console.error('Update profile error:', e)
  } finally {
    profileSubmitting.value = false
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (confirmPassword.value !== passwordForm.new_password) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  passwordSubmitting.value = true
  try {
    const res = await changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
    if (res.code === 0) {
      ElMessage.success('密码修改成功')
      passwordForm.old_password = ''
      passwordForm.new_password = ''
      confirmPassword.value = ''
      passwordFormRef.value?.resetFields()
    }
  } catch (e) {
    console.error('Change password error:', e)
  } finally {
    passwordSubmitting.value = false
  }
}

const renderTrendChart = (data: TrendData[]) => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const dates = data.map(item => dayjs(item.date).format('MM-DD'))
  const completedCounts = data.map(item => item.completed_count)
  const createdCounts = data.map(item => item.created_count)

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

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#409eff'
  if (percentage >= 30) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.profile-header {
  text-align: center;
  padding: 20px 0 30px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 24px;

  .username {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 12px 0 4px;
  }

  .user-email {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.profile-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
}

.stats-grid {
  margin-bottom: 24px;

  .stat-item {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8f4ff 100%);
    border-radius: 12px;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}

.stats-detail {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;

  .detail-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f2f5;

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      width: 120px;
      color: #909399;
      font-size: 14px;
      flex-shrink: 0;
    }

    .detail-value {
      flex: 1;
      color: #303133;
      font-size: 14px;
      font-weight: 500;
    }

    .el-progress {
      flex: 1;
    }
  }
}

.chart-container {
  height: 300px;
  width: 100%;
}
</style>
