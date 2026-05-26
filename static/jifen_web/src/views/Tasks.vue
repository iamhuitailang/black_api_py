<template>
  <div class="tasks-container">
    <div class="page-header">
      <div class="header-content">
        <h1>📋 每日任务</h1>
        <div class="points-badge">
          <span>💰</span>
          <span>{{ userStore.userInfo?.points || 0 }}</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="signin-section">
        <div class="signin-card">
          <h2>📅 每日签到</h2>
          <div class="signin-status">
            <span v-if="signinInfo.today_signed" class="signed">✅ 今日已签到</span>
            <span v-else class="not-signed">⏰ 今日未签到</span>
            <span class="continuous-days">连续 {{ signinInfo.continuous_days }} 天</span>
          </div>
          <div class="signin-days">
            <div 
              v-for="(points, index) in signinPoints" 
              :key="index"
              class="day-item"
              :class="{ active: index < signinInfo.continuous_days, today: index === signinInfo.continuous_days && !signinInfo.today_signed }"
            >
              <span class="day-label">第{{ index + 1 }}天</span>
              <span class="day-points">+{{ points }}</span>
            </div>
          </div>
          <el-button 
            type="warning" 
            size="large" 
            class="signin-btn"
            @click="handleSignin"
            :disabled="signinInfo.today_signed"
            :loading="signingIn"
          >
            {{ signinInfo.today_signed ? '已签到' : '立即签到 +' + signinInfo.today_points }}
          </el-button>
        </div>
      </div>

      <div class="tasks-section">
        <h2 class="section-title">🎯 任务列表</h2>
        <div class="tasks-grid">
          <div 
            v-for="task in tasks" 
            :key="task.id"
            class="task-card"
            :class="{ completed: task.completed_count >= task.limit_count }"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-info">
              <h3 class="task-name">{{ task.name }}</h3>
              <p class="task-desc">{{ task.description }}</p>
              <div class="task-progress">
                <span>进度: {{ task.completed_count }}/{{ task.limit_count }}</span>
              </div>
            </div>
            <div class="task-action">
              <span class="task-points">+{{ task.points }}</span>
              <el-button 
                type="warning" 
                size="small"
                @click="completeTask(task.id)"
                :disabled="!task.can_complete"
                :loading="completingTask === task.id"
              >
                {{ task.completed_count >= task.limit_count ? '已完成' : '去完成' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { taskApi } from '@/api/task'

const userStore = useUserStore()

const tasks = ref<any[]>([])
const signinInfo = ref({
  today_signed: false,
  continuous_days: 0,
  signin_points: [10, 12, 14, 16, 18, 20, 50],
  today_points: 10
})
const signingIn = ref(false)
const completingTask = ref<number | null>(null)

const signinPoints = [10, 12, 14, 16, 18, 20, 50]

onMounted(async () => {
  await loadTasks()
  await loadSigninInfo()
})

async function loadTasks() {
  try {
    const res: any = await taskApi.getMyTasks()
    tasks.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function loadSigninInfo() {
  try {
    const res: any = await taskApi.getSigninInfo()
    signinInfo.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function handleSignin() {
  signingIn.value = true
  try {
    const res: any = await taskApi.signin()
    ElMessage.success(`签到成功！获得${res.data.points}积分`)
    userStore.updatePoints(res.data.user_points)
    await loadSigninInfo()
  } catch (error) {
    console.error(error)
  } finally {
    signingIn.value = false
  }
}

async function completeTask(taskId: number) {
  completingTask.value = taskId
  try {
    const res: any = await taskApi.completeTask(taskId)
    ElMessage.success(`任务完成！获得${res.data.points}积分`)
    userStore.updatePoints(res.data.user_points)
    await loadTasks()
  } catch (error) {
    console.error(error)
  } finally {
    completingTask.value = null
  }
}
</script>

<style scoped>
.tasks-container {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  padding: 20px 0;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.signin-section {
  margin-bottom: 30px;
}

.signin-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.15);
}

.signin-card h2 {
  font-size: 20px;
  margin-bottom: 15px;
}

.signin-status {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.signed {
  color: #67C23A;
  font-weight: 600;
}

.not-signed {
  color: #FF8C00;
  font-weight: 600;
}

.continuous-days {
  color: #666;
  font-size: 14px;
}

.signin-days {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px;
  background: #FFF8DC;
  border-radius: 12px;
}

.day-item {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.day-item.active {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
}

.day-item.today {
  background: #FFE4B5;
  animation: pulse 2s infinite;
}

.day-label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.day-points {
  display: block;
  font-weight: 600;
}

.signin-btn {
  width: 100%;
  font-size: 16px;
  font-weight: 600;
}

.tasks-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
}

.tasks-grid {
  display: grid;
  gap: 15px;
}

.task-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.task-card.completed {
  opacity: 0.6;
}

.task-icon {
  font-size: 32px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF8DC;
  border-radius: 12px;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.task-desc {
  color: #999;
  font-size: 13px;
  margin-bottom: 6px;
}

.task-progress {
  color: #FF8C00;
  font-size: 12px;
}

.task-action {
  text-align: center;
}

.task-points {
  display: block;
  color: #FF8C00;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
