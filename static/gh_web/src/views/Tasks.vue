<template>
  <div class="tasks container">
    <h1 class="mb-20">📜 委托任务</h1>

    <div class="task-tabs mb-20">
      <button 
        class="btn" 
        :class="activeTab === 'all' ? 'btn-primary' : 'btn-outline'"
        @click="activeTab = 'all'"
      >
        全部任务
      </button>
      <button 
        class="btn" 
        :class="activeTab === 'my' ? 'btn-primary' : 'btn-outline'"
        @click="activeTab = 'my'"
      >
        已接任务
      </button>
      <button 
        class="btn" 
        :class="activeTab === 'completed' ? 'btn-primary' : 'btn-outline'"
        @click="activeTab = 'completed'"
      >
        已完成
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="task-list">
      <div
        v-for="task in displayTasks"
        :key="task.id"
        class="task-card card"
      >
        <div class="task-header">
          <h3>{{ task.title }}</h3>
          <span class="badge" :class="'badge-' + getDifficultyClass(task.difficulty)">
            难度 {{ task.difficulty }}
          </span>
        </div>
        <p class="task-desc">{{ task.description }}</p>
        
        <div class="task-rewards">
          <span>💰 {{ task.reward_coins }} 金币</span>
          <span>⭐ {{ task.reward_exp }} 经验</span>
        </div>

        <div class="task-actions mt-20">
          <button 
            v-if="activeTab === 'all' && !isTaskAccepted(task.id)"
            class="btn btn-primary"
            @click="acceptTask(task.id)"
          >
            接受任务
          </button>
          <button 
            v-if="activeTab === 'all' && isTaskAccepted(task.id)"
            class="btn btn-outline"
            disabled
          >
            已接受
          </button>
          <router-link 
            v-if="activeTab !== 'all'"
            :to="'/explore'"
            class="btn btn-success"
          >
            开始探索
          </router-link>
        </div>
      </div>

      <div v-if="displayTasks.length === 0" class="text-center card" style="color: var(--text-secondary)">
        暂无任务
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToastStore } from '../store'
import { taskAPI, gameAPI } from '../services/api'

const toastStore = useToastStore()

const allTasks = ref([])
const myTasks = ref([])
const completedTasks = ref([])
const activeTab = ref('all')
const loading = ref(true)

const displayTasks = computed(() => {
  if (activeTab.value === 'all') return allTasks.value
  if (activeTab.value === 'my') return myTasks.value
  return completedTasks.value
})

const getDifficultyClass = (diff) => {
  if (diff <= 1) return 'success'
  if (diff <= 2) return 'warning'
  return 'danger'
}

const isTaskAccepted = (taskId) => {
  return myTasks.value.some(t => t.task_id === taskId)
}

const acceptTask = async (taskId) => {
  try {
    const res = await gameAPI.acceptTask(taskId)
    if (res.code === 200) {
      toastStore.success('任务已接受！')
      await loadMyTasks()
    }
  } catch (e) {
    toastStore.error('接受任务失败')
  }
}

const loadAllTasks = async () => {
  const res = await taskAPI.getAll()
  if (res.code === 200) {
    allTasks.value = res.data
  }
}

const loadMyTasks = async () => {
  const [pendingRes, completedRes] = await Promise.all([
    gameAPI.getMyTasks('pending'),
    gameAPI.getMyTasks('completed')
  ])
  if (pendingRes.code === 200) myTasks.value = pendingRes.data
  if (completedRes.code === 200) completedTasks.value = completedRes.data
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadAllTasks(), loadMyTasks()])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.task-tabs {
  display: flex;
  gap: 10px;
}

.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.task-header h3 {
  color: var(--text-primary);
}

.task-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.6;
}

.task-rewards {
  display: flex;
  gap: 20px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 14px;
}

.task-actions {
  display: flex;
  gap: 10px;
}
</style>
