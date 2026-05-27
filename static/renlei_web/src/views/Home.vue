<template>
  <div class="home-container">
    <div class="header">
      <h1>🎪 人类一败涂地</h1>
      <div class="user-info">
        <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
        <button @click="logout" class="btn btn-warning logout-btn">退出登录</button>
      </div>
    </div>

    <div class="content">
      <div class="card menu-card">
        <h2>选择你的冒险</h2>
        
        <div class="menu-buttons">
          <router-link :to="'/game/' + (userStore.userInfo?.current_level_id || 1)" class="menu-btn play-btn">
            <span class="icon">🎮</span>
            <span class="text">开始游戏</span>
          </router-link>
          
          <router-link to="/levels" class="menu-btn levels-btn">
            <span class="icon">🗺️</span>
            <span class="text">选择关卡</span>
          </router-link>
          
          <router-link to="/character" class="menu-btn character-btn">
            <span class="icon">🎭</span>
            <span class="text">选择角色</span>
          </router-link>
        </div>

        <div class="progress-section">
          <h3>游戏进度</h3>
          <div class="progress-grid">
            <div class="progress-item" v-for="level in levels" :key="level.id">
              <div class="level-name">{{ level.name }}</div>
              <div class="level-status" :class="getLevelStatus(level.id)">
                {{ getLevelStatusText(level.id) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="controls-hint">
      <h3>操作说明</h3>
      <div class="hint-grid">
        <div class="hint-item"><span class="key">←→</span> 左右移动</div>
        <div class="hint-item"><span class="key">↑</span> 跳跃/起身</div>
        <div class="hint-item"><span class="key">↓</span> 俯身/下蹲</div>
        <div class="hint-item"><span class="key">Q</span> 左手抓取</div>
        <div class="hint-item"><span class="key">E</span> 右手抓取</div>
        <div class="hint-item"><span class="key">R</span> 重置关卡</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { useGameStore } from '../store/game'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const levels = ref([])
const progress = ref([])

onMounted(async () => {
  await userStore.getCharacters()
  await userStore.getLevels()
  await userStore.getProgress()
  levels.value = userStore.levels
  progress.value = userStore.progress
})

const logout = () => {
  gameStore.clearSession()
  userStore.logout()
  router.push('/login')
}

const getLevelStatus = (levelId) => {
  const p = progress.value.find(p => p.level_id === levelId)
  if (p?.is_completed) return 'completed'
  if (p?.attempts > 0) return 'attempted'
  return 'locked'
}

const getLevelStatusText = (levelId) => {
  const p = progress.value.find(p => p.level_id === levelId)
  if (p?.is_completed) return '✓ 已通关'
  if (p?.attempts > 0) return `尝试 ${p.attempts} 次`
  return '未开始'
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 30px;
  color: white;
}

.header h1 {
  font-size: 32px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-size: 18px;
  font-weight: 600;
}

.logout-btn {
  padding: 8px 16px;
  font-size: 14px;
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.menu-card {
  text-align: center;
}

.menu-card h2 {
  color: #333;
  margin-bottom: 32px;
  font-size: 28px;
}

.menu-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border-radius: 16px;
  text-decoration: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.levels-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.character-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.menu-btn .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.menu-btn .text {
  font-size: 18px;
}

.progress-section {
  text-align: left;
}

.progress-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 20px;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.progress-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.level-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.level-status {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

.level-status.completed {
  background: #d4edda;
  color: #155724;
}

.level-status.attempted {
  background: #fff3cd;
  color: #856404;
}

.level-status.locked {
  background: #e2e3e5;
  color: #6c757d;
}

.controls-hint {
  max-width: 800px;
  margin: 30px auto;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
}

.controls-hint h3 {
  margin-bottom: 16px;
  text-align: center;
}

.hint-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-family: monospace;
}

@media (max-width: 768px) {
  .menu-buttons {
    grid-template-columns: 1fr;
  }
  
  .progress-grid {
    grid-template-columns: 1fr;
  }
  
  .hint-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
