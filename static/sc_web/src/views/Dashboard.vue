<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1 class="welcome-title">欢迎回来，{{ userStore.user?.nickname || '车手' }}</h1>
        <p class="welcome-subtitle">今天准备好征服赛道了吗？</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" class="action-btn" @click="navigateTo('/design')">
          <el-icon><Tools /></el-icon>
          <span>设计新车</span>
        </el-button>
        <el-button class="action-btn secondary" @click="navigateTo('/races')">
          <el-icon><Trophy /></el-icon>
          <span>参加比赛</span>
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon coins">
          <el-icon :size="28"><Coin /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(userStore.user?.coins || 0) }}</div>
          <div class="stat-label">总金币</div>
        </div>
        <div class="stat-trend positive">
          <el-icon><Cpu /></el-icon>
          <span>+12%</span>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon level">
          <el-icon :size="28"><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">Lv.{{ userStore.user?.level || 1 }}</div>
          <div class="stat-label">当前等级</div>
        </div>
        <div class="stat-progress">
          <el-progress 
            :percentage="levelProgress" 
            :show-text="false"
            :stroke-width="6"
            color="#ff6b00"
          />
          <span class="progress-text">{{ userStore.user?.exp || 0 }} / {{ expForNextLevel }}</span>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon reputation">
          <el-icon :size="28"><Aim /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ userStore.user?.reputation || 0 }}</div>
          <div class="stat-label">声望值</div>
        </div>
        <div class="stat-rank">
          <span class="rank-badge">排名 #{{ userStore.user?.rank || '999' }}</span>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon cars">
          <el-icon :size="28"><Monitor /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ gameStore.cars.length || 0 }}</div>
          <div class="stat-label">拥有赛车</div>
        </div>
        <div class="stat-action" @click="navigateTo('/garage')">
          <span>查看车库</span>
          <el-icon><SwitchButton /></el-icon>
        </div>
      </el-card>
    </div>

    <div class="main-content">
      <div class="content-left">
        <el-card class="active-car-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Monitor /></el-icon>
              <span>当前赛车</span>
            </h3>
            <el-button type="text" class="view-all" @click="navigateTo('/garage')">
              查看全部 <el-icon><SwitchButton /></el-icon>
            </el-button>
          </div>
          
          <div v-if="gameStore.activeCar" class="car-preview-section">
            <div class="car-preview">
              <div class="car-visual">
                <svg class="car-silhouette" viewBox="0 0 400 150" fill="none">
                  <path 
                    d="M50 100 L70 70 L120 50 L280 50 L330 70 L350 100 L380 100 L380 120 L350 120 L340 135 L310 135 L300 120 L100 120 L90 135 L60 135 L50 120 L20 120 L20 100 Z" 
                    :fill="gameStore.activeCar.color || '#ff6b00'"
                    opacity="0.9"
                  />
                  <path 
                    d="M130 55 L270 55 L250 35 L150 35 Z" 
                    fill="rgba(0,0,0,0.3)"
                  />
                  <ellipse cx="80" cy="125" rx="20" ry="15" fill="#1a1a2e"/>
                  <ellipse cx="320" cy="125" rx="20" ry="15" fill="#1a1a2e"/>
                  <ellipse cx="80" cy="125" rx="12" ry="8" fill="#333"/>
                  <ellipse cx="320" cy="125" rx="12" ry="8" fill="#333"/>
                </svg>
              </div>
              <div class="car-badge">
                <span class="tier-badge" :class="'tier-' + (gameStore.activeCar.tier || 1)">
                  Tier {{ gameStore.activeCar.tier || 1 }}
                </span>
              </div>
            </div>
            
            <div class="car-info">
              <h4 class="car-name">{{ gameStore.activeCar.name || '未命名赛车' }}</h4>
              <div class="car-stats">
                <div class="stat-item">
                  <span class="stat-name">速度</span>
                  <div class="stat-bar">
                    <div class="stat-fill" :style="{ width: (gameStore.activeCar.stats?.speed || 0) + '%' }"></div>
                  </div>
                  <span class="stat-num">{{ gameStore.activeCar.stats?.speed || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-name">加速</span>
                  <div class="stat-bar">
                    <div class="stat-fill" :style="{ width: (gameStore.activeCar.stats?.acceleration || 0) + '%' }"></div>
                  </div>
                  <span class="stat-num">{{ gameStore.activeCar.stats?.acceleration || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-name">操控</span>
                  <div class="stat-bar">
                    <div class="stat-fill" :style="{ width: (gameStore.activeCar.stats?.handling || 0) + '%' }"></div>
                  </div>
                  <span class="stat-num">{{ gameStore.activeCar.stats?.handling || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-name">耐久</span>
                  <div class="stat-bar">
                    <div class="stat-fill" :style="{ width: (gameStore.activeCar.stats?.durability || 0) + '%' }"></div>
                  </div>
                  <span class="stat-num">{{ gameStore.activeCar.stats?.durability || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-car">
            <el-icon :size="48" class="empty-icon"><Monitor /></el-icon>
            <p>还没有赛车</p>
            <el-button type="primary" @click="navigateTo('/design')">
              设计第一辆赛车
            </el-button>
          </div>
        </el-card>

        <el-card class="quick-actions-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Aim /></el-icon>
              <span>快捷操作</span>
            </h3>
          </div>
          <div class="quick-actions">
            <div class="action-card" @click="navigateTo('/design')">
              <div class="action-icon design">
                <el-icon :size="32"><Tools /></el-icon>
              </div>
              <h4>设计新车</h4>
              <p>打造独一无二的赛车</p>
            </div>
            <div class="action-card" @click="navigateTo('/races')">
              <div class="action-icon race">
                <el-icon :size="32"><Trophy /></el-icon>
              </div>
              <h4>参加比赛</h4>
              <p>赢取金币和声望</p>
            </div>
            <div class="action-card" @click="navigateTo('/garage')">
              <div class="action-icon garage">
                <el-icon :size="32"><Box /></el-icon>
              </div>
              <h4>查看车库</h4>
              <p>管理你的赛车收藏</p>
            </div>
            <div class="action-card" @click="navigateTo('/parts')">
              <div class="action-icon parts">
                <el-icon :size="32"><Setting /></el-icon>
              </div>
              <h4>部件商店</h4>
              <p>升级赛车性能</p>
            </div>
          </div>
        </el-card>
      </div>

      <div class="content-right">
        <el-card class="level-progress-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Setting /></el-icon>
              <span>等级进度</span>
            </h3>
          </div>
          <div class="level-info">
            <div class="level-display">
              <span class="current-level">Lv.{{ userStore.user?.level || 1 }}</span>
              <el-icon class="level-arrow"><SwitchButton /></el-icon>
              <span class="next-level">Lv.{{ (userStore.user?.level || 1) + 1 }}</span>
            </div>
            <el-progress 
              :percentage="levelProgress" 
              :stroke-width="12"
              :show-text="false"
              color="url(#progressGradient)"
              class="main-progress"
            >
              <template #default="{ percentage }">
                <span class="progress-percentage">{{ percentage }}%</span>
              </template>
            </el-progress>
            <svg width="0" height="0">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#ff6b00" />
                  <stop offset="100%" style="stop-color:#ff8c00" />
                </linearGradient>
              </defs>
            </svg>
            <div class="exp-info">
              <span>当前经验: {{ userStore.user?.exp || 0 }}</span>
              <span>升级所需: {{ expForNextLevel }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="activity-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Document /></el-icon>
              <span>最近活动</span>
            </h3>
            <el-button type="text" class="view-all" @click="navigateTo('/races')">
              查看全部
            </el-button>
          </div>
          <div class="activity-list">
            <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
              <div class="activity-icon" :class="activity.type">
                <el-icon>
                  <component :is="activity.icon" />
                </el-icon>
              </div>
              <div class="activity-info">
                <p class="activity-title">{{ activity.title }}</p>
                <p class="activity-desc">{{ activity.description }}</p>
              </div>
              <div class="activity-result" :class="activity.result">
                <span v-if="activity.reward">{{ activity.reward }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
            <div v-if="recentActivities.length === 0" class="no-activity">
              <el-icon :size="32" class="empty-icon"><Document /></el-icon>
              <p>暂无活动记录</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useGameStore } from '@/stores/game'
import { 
  Tools, Trophy, Coin, Monitor, Box, Setting, 
  Aim, SwitchButton, Document, Brush, Cpu, Edit, User
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const loading = ref(false)

const expForNextLevel = computed(() => {
  const level = userStore.user?.level || 1
  return level * 100
})

const levelProgress = computed(() => {
  const currentExp = userStore.user?.exp || 0
  const needed = expForNextLevel.value
  return Math.min(Math.round((currentExp / needed) * 100), 100)
})

const recentActivities = ref([
  {
    type: 'race',
    icon: Trophy,
    title: '城市赛道比赛',
    description: '完成了初级难度比赛',
    result: 'win',
    reward: '+500 金币',
    time: '10分钟前'
  },
  {
    type: 'design',
    icon: Tools,
    title: '改装赛车',
    description: '升级了引擎部件',
    result: 'success',
    reward: '+50 声望',
    time: '2小时前'
  },
  {
    type: 'race',
    icon: Trophy,
    title: '山地赛道比赛',
    description: '完成了中级难度比赛',
    result: 'lose',
    reward: '',
    time: '5小时前'
  },
  {
    type: 'unlock',
    icon: Aim,
    title: '解锁新部件',
    description: '获得了稀有涡轮增压器',
    result: 'success',
    reward: '新部件',
    time: '1天前'
  }
])

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const navigateTo = (path) => {
  router.push(path)
}

const fetchData = async () => {
  loading.value = true
  try {
    await Promise.all([
      userStore.fetchCurrentUser(),
      gameStore.fetchCars(),
      gameStore.fetchUserParts(),
      gameStore.fetchResearch()
    ])
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.welcome-subtitle {
  font-size: 14px;
  color: #888;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn:not(.secondary) {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
}

.action-btn:not(.secondary):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #2a2a4a;
  color: #fff;
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #3a3a5e;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%) !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.3s ease !important;
  animation: fadeInUp 0.6s ease-out backwards;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 107, 0, 0.3) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3) !important;
}

.stat-card :deep(.el-card__body) {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.coins {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%);
  color: #fbbf24;
}

.stat-icon.level {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  color: #ff6b00;
}

.stat-icon.reputation {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%);
  color: #c084fc;
}

.stat-icon.cars {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  color: #4ade80;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 2px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.stat-trend.positive {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.stat-progress {
  width: 100px;
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.stat-rank {
  text-align: right;
}

.rank-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #ff6b00;
}

.stat-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff6b00;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-action:hover {
  color: #ff8c00;
  gap: 8px;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.content-left,
.content-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.active-car-card,
.quick-actions-card,
.level-progress-card,
.activity-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%) !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 16px !important;
  animation: fadeInUp 0.6s ease-out backwards;
}

.active-car-card { animation-delay: 0.5s; }
.quick-actions-card { animation-delay: 0.6s; }
.level-progress-card { animation-delay: 0.5s; }
.activity-card { animation-delay: 0.6s; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.card-title .el-icon {
  color: #ff6b00;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff6b00;
  font-size: 13px;
  padding: 4px 8px;
}

.view-all:hover {
  color: #ff8c00;
}

.car-preview-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.car-preview {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid #2a2a4a;
}

.car-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.15) 0%, transparent 70%);
}

.car-visual {
  position: relative;
  z-index: 1;
  width: 90%;
}

.car-silhouette {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
}

.car-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.tier-1 { background: rgba(128, 128, 128, 0.3); color: #aaa; border: 1px solid rgba(128, 128, 128, 0.5); }
.tier-2 { background: rgba(0, 255, 0, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.5); }
.tier-3 { background: rgba(0, 112, 255, 0.2); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.5); }
.tier-4 { background: rgba(147, 51, 234, 0.2); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.5); }
.tier-5 { background: rgba(255, 215, 0, 0.2); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.5); }

.car-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.car-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
}

.car-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-name {
  width: 40px;
  font-size: 13px;
  color: #888;
}

.stat-bar {
  flex: 1;
  height: 8px;
  background: #2a2a4a;
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.stat-num {
  width: 30px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.no-car {
  text-align: center;
  padding: 40px;
  color: #888;
}

.empty-icon {
  color: #444;
  margin-bottom: 12px;
}

.no-car p {
  margin-bottom: 16px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 107, 0, 0.3);
  background: rgba(255, 107, 0, 0.05);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.15);
}

.action-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.design {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  color: #ff6b00;
}

.action-icon.race {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
  color: #ef4444;
}

.action-icon.garage {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  color: #4ade80;
}

.action-icon.parts {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
  color: #60a5fa;
}

.action-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.action-card p {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.level-info {
  text-align: center;
}

.level-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.current-level {
  font-size: 32px;
  font-weight: 800;
  color: #ff6b00;
}

.level-arrow {
  color: #444;
  font-size: 20px;
}

.next-level {
  font-size: 24px;
  font-weight: 600;
  color: #666;
}

.main-progress {
  margin-bottom: 12px;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #ff6b00;
}

.exp-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.race {
  background: rgba(255, 107, 0, 0.15);
  color: #ff6b00;
}

.activity-icon.design {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.activity-icon.unlock {
  background: rgba(147, 51, 234, 0.15);
  color: #c084fc;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
}

.activity-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-result {
  text-align: right;
  flex-shrink: 0;
}

.activity-result.win span:first-child {
  color: #4ade80;
  font-weight: 600;
}

.activity-result.lose span:first-child {
  color: #ef4444;
  font-weight: 600;
}

.activity-result.success span:first-child {
  color: #60a5fa;
  font-weight: 600;
}

.activity-result span {
  display: block;
}

.activity-time {
  font-size: 11px;
  color: #555;
  margin-top: 2px;
}

.no-activity {
  text-align: center;
  padding: 40px;
  color: #888;
}

.no-activity p {
  margin-top: 8px;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .car-preview-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
