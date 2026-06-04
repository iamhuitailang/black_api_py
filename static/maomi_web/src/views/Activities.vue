<template>
  <div class="activities-container">
    <div class="page-header">
      <h1 class="page-title">🎉 活动中心</h1>
      <p class="page-desc">举办活动，吸引更多客人~</p>
    </div>

    <div class="activities-list">
      <div 
        v-for="activity in activities" 
        :key="activity.id" 
        class="activity-card"
      >
        <div class="activity-header">
          <span class="activity-emoji">{{ activity.emoji }}</span>
          <div class="activity-info">
            <h3 class="activity-name">{{ activity.name }}</h3>
            <p class="activity-desc">{{ activity.description }}</p>
          </div>
        </div>
        
        <div class="activity-details">
          <div class="detail-item">
            <span class="detail-icon">⏱️</span>
            <span class="detail-text">{{ activity.duration }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">💰</span>
            <span class="detail-text">{{ activity.cost }} 金币</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">🎁</span>
            <span class="detail-text">+{{ activity.reward }} 声望</span>
          </div>
        </div>

        <div class="activity-footer">
          <div v-if="activity.active" class="active-status">
            <span class="status-dot"></span>
            进行中...
          </div>
          <button 
            v-else
            class="activity-btn"
            @click="handleStartActivity(activity)"
            :disabled="activity.cost > currentCoins"
          >
            {{ activity.cost > currentCoins ? '金币不足' : '开始活动' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="activities.length === 0" class="empty-state">
      <span class="empty-emoji">🎊</span>
      <p>暂无活动，敬请期待~</p>
    </div>

    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">主页</span>
      </router-link>
      <router-link to="/cats" class="nav-item">
        <span class="nav-icon">🐱</span>
        <span class="nav-text">猫咪</span>
      </router-link>
      <router-link to="/menu" class="nav-item">
        <span class="nav-icon">🍰</span>
        <span class="nav-text">菜单</span>
      </router-link>
      <router-link to="/shop" class="nav-item">
        <span class="nav-icon">🛒</span>
        <span class="nav-text">商店</span>
      </router-link>
      <router-link to="/activities" class="nav-item active">
        <span class="nav-icon">🎉</span>
        <span class="nav-text">活动</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store'
import { api } from '../api'

const userStore = useUserStore()

const activities = ref([])
const gameStatus = ref(null)

const currentCoins = computed(() => {
  return gameStatus.value?.profile?.coins || userStore.gameStatus?.profile?.coins || 0
})

const getActivityEmoji = (type, name) => {
  const emojiMap = {
    'beauty': '👑',
    'competition': '🏆',
    'party': '🎉',
    'adoption': '🏠',
    'photography': '📸',
    'coffee': '☕',
    'festival': '🎊',
    'meeting': '🐾'
  }
  if (type && emojiMap[type]) return emojiMap[type]
  if (name) {
    if (name.includes('选美')) return '👑'
    if (name.includes('比赛')) return '🏆'
    if (name.includes('派对') || name.includes('茶')) return '🍰'
    if (name.includes('领养')) return '🏠'
    if (name.includes('摄影')) return '📸'
    if (name.includes('咖啡') || name.includes('品鉴')) return '☕'
    if (name.includes('节日') || name.includes('庆典')) return '🎊'
    if (name.includes('见面') || name.includes('互动')) return '🐾'
  }
  return '🎉'
}

const transformActivity = (activity) => {
  const cost = activity.cost || Math.floor((activity.reward_coins || 100) / 10) || 50
  const isActive = activity.active !== undefined ? activity.active 
    : (activity.is_active === 1 || activity.is_active === true || activity.status === 'active')
  return {
    ...activity,
    emoji: activity.emoji || getActivityEmoji(activity.type, activity.name),
    cost: cost,
    reward: activity.reward || activity.reward_experience || activity.reward_coins || 50,
    duration: activity.duration || `${activity.duration_minutes || 30}分钟`,
    active: isActive
  }
}

const mergeActivities = (allActivities, activeActivities) => {
  const activeIds = new Set(activeActivities.map(a => a.id))
  return allActivities.map(activity => {
    const transformed = transformActivity(activity)
    const isActive = activeIds.has(activity.id) 
      || (activity.status === 'active') 
      || (activity.is_active === 1)
      || transformed.active
    return {
      ...transformed,
      active: isActive
    }
  })
}

const loadActivities = async () => {
  try {
    const [allRes, activeRes] = await Promise.all([
      api.getActivities(),
      api.getActiveActivities()
    ])
    
    if (allRes?.code === 0) {
      const allActivities = allRes.data.items || allRes.data || []
      const activeActivities = activeRes?.code === 0 ? (activeRes.data.items || activeRes.data || []) : []
      activities.value = mergeActivities(allActivities, activeActivities)
    }
  } catch (error) {
    console.error('Load activities error:', error)
    activities.value = [
      { id: 1, name: '猫咪见面会', emoji: '🐾', description: '邀请客人与猫咪亲密互动', duration: '30分钟', cost: 50, reward: 20, active: false },
      { id: 2, name: '下午茶派对', emoji: '🍰', description: '举办温馨的下午茶聚会', duration: '1小时', cost: 100, reward: 50, active: false },
      { id: 3, name: '猫咪摄影展', emoji: '📸', description: '展示可爱猫咪的照片', duration: '2小时', cost: 150, reward: 80, active: false },
      { id: 4, name: '领养日活动', emoji: '🏠', description: '帮助流浪猫咪找到新家', duration: '3小时', cost: 200, reward: 120, active: false },
      { id: 5, name: '咖啡品鉴会', emoji: '☕', description: '专业咖啡师现场教学', duration: '1.5小时', cost: 120, reward: 60, active: false },
      { id: 6, name: '节日庆典', emoji: '🎊', description: '特别节日主题活动', duration: '4小时', cost: 300, reward: 200, active: false }
    ]
  }
}

const loadGameStatus = async () => {
  gameStatus.value = userStore.gameStatus || { profile: { coins: 100 } }
  
  if (userStore.token) {
    try {
      const res = await api.getGameState()
      if (res?.code === 0 && res.data) {
        gameStatus.value = res.data
        userStore.setGameStatus(res.data)
      }
    } catch (error) {
      console.error('Load game status error:', error)
    }
  }
}

const updateActivity = (activityId, updates) => {
  const index = activities.value.findIndex(a => a.id === activityId)
  if (index !== -1) {
    activities.value[index] = { ...activities.value[index], ...updates }
  }
}

const handleStartActivity = async (activity) => {
  if (activity.active) {
    alert('该活动已经在进行中了~')
    return
  }
  
  const currentCoins = gameStatus.value?.profile?.coins || 0
  if (activity.cost > currentCoins) {
    alert(`金币不足！需要 ${activity.cost} 金币，当前只有 ${currentCoins} 金币`)
    return
  }
  
  if (confirm(`确定要花费 ${activity.cost} 金币开始「${activity.name}」活动吗？`)) {
    try {
      const res = await api.startActivity(activity.id)
      if (res?.code === 0) {
        updateActivity(activity.id, { active: true })
        alert(res.message || `活动「${activity.name}」已开始！预计持续 ${activity.duration}`)
        
        if (res.data?.game_status) {
          userStore.updateGameStatus(res.data.game_status)
          gameStatus.value = userStore.gameStatus
        } else if (res.data) {
          userStore.updateGameStatus(res.data)
          gameStatus.value = userStore.gameStatus
        }
        
        const durationMs = (activity.duration_minutes || 30) * 60 * 1000
        setTimeout(async () => {
          try {
            const endRes = await api.endActivity(activity.id)
            if (endRes?.code === 0) {
              updateActivity(activity.id, { active: false })
              const reward = endRes.data?.reward_coins || endRes.data?.reward_experience || activity.reward
              alert(endRes.message || `活动「${activity.name}」已结束！获得 ${reward} 奖励`)
              if (endRes.data?.game_status) {
                userStore.updateGameStatus(endRes.data.game_status)
                gameStatus.value = userStore.gameStatus
              } else if (endRes.data) {
                userStore.updateGameStatus(endRes.data)
                gameStatus.value = userStore.gameStatus
              }
            } else {
              updateActivity(activity.id, { active: false })
            }
          } catch (endError) {
            console.error('End activity error:', endError)
            updateActivity(activity.id, { active: false })
          }
        }, Math.min(durationMs, 10000))
      } else {
        alert(res?.message || '活动开启失败，请稍后重试')
        updateActivity(activity.id, { active: false })
      }
    } catch (error) {
      console.error('Start activity error:', error)
      alert('网络错误，请稍后重试')
      updateActivity(activity.id, { active: false })
    }
  }
}

onMounted(() => {
  loadActivities()
  loadGameStatus()
})
</script>

<style scoped>
.activities-container {
  min-height: 100vh;
  padding: 20px 20px 100px;
}

.page-header {
  text-align: center;
  margin-bottom: 25px;
}

.page-title {
  font-size: 28px;
  color: #FF69B4;
  margin: 0 0 8px 0;
}

.page-desc {
  color: #999;
  margin: 0;
  font-size: 14px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}

.activity-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.2);
  transition: all 0.3s;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 182, 193, 0.3);
}

.activity-header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
}

.activity-emoji {
  font-size: 48px;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
}

.activity-name {
  font-size: 18px;
  color: #333;
  margin: 0 0 6px 0;
  font-weight: 600;
}

.activity-desc {
  font-size: 14px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}

.activity-details {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 12px;
  background: #FFF5EE;
  border-radius: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.detail-icon {
  font-size: 16px;
}

.detail-text {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.activity-footer {
  display: flex;
  justify-content: flex-end;
}

.active-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FF69B4;
  font-weight: 600;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #FF69B4;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.activity-btn {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.activity-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.4);
}

.activity-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 15px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #999;
  padding: 5px 15px;
  border-radius: 12px;
  transition: all 0.3s;
}

.nav-item.active, .nav-item:hover {
  color: #FF69B4;
  background: rgba(255, 182, 193, 0.1);
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-text {
  font-size: 12px;
  font-weight: 500;
}
</style>
