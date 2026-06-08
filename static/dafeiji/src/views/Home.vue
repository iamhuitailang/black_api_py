<template>
  <div class="home-page">
    <div class="top-nav">
      <div class="nav-left">
        <h2 class="nav-title">末日机甲</h2>
      </div>
      <div class="nav-right">
        <span class="user-info">{{ userStore.user?.username }}</span>
        <span v-if="userStore.isAdmin" class="badge badge-admin" style="margin-right: 15px;">ADMIN</span>
        <button class="btn btn-sm" @click="goToProfile">个人中心</button>
        <button v-if="userStore.isAdmin" class="btn btn-sm btn-warning" @click="goToAdmin">管理后台</button>
        <button class="btn btn-sm btn-danger" @click="handleLogout">退出</button>
      </div>
    </div>

    <div class="main-content">
      <div class="section-title">
        <h3 class="title-neon">选择机甲</h3>
        <span class="subtitle">SELECT YOUR MECH</span>
      </div>

      <div class="plane-grid">
        <div
          v-for="plane in planes"
          :key="plane.id"
          class="plane-card"
          :class="{ active: selectedPlane?.plane_id === plane.plane_id }"
          @click="selectPlane(plane)"
        >
          <div class="plane-preview" :style="{ '--plane-color': plane.color }">
            <div class="plane-icon"></div>
          </div>
          <div class="plane-info">
            <h4 class="plane-name" :style="{ color: plane.color }">{{ plane.name }}</h4>
            <div class="plane-stats">
              <div class="stat-row">
                <span class="stat-label">速度</span>
                <div class="stat-bar">
                  <div class="stat-fill" :style="{ width: (plane.speed / 350 * 100) + '%' }"></div>
                </div>
              </div>
              <div class="stat-row">
                <span class="stat-label">装甲</span>
                <div class="stat-bar">
                  <div class="stat-fill hp" :style="{ width: (plane.hp / 350 * 100) + '%' }"></div>
                </div>
              </div>
              <div class="stat-row">
                <span class="stat-label">火力</span>
                <div class="stat-bar">
                  <div class="stat-fill dmg" :style="{ width: (plane.weapon_damage / 40 * 100) + '%' }"></div>
                </div>
              </div>
            </div>
            <div class="plane-skill">
              <span class="skill-label">技能:</span>
              <span class="skill-name">{{ plane.skill_name }}</span>
              <p class="skill-desc">{{ plane.skill_description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary btn-large" @click="startGame" :disabled="!selectedPlane">
          开始战斗
        </button>
        <button v-if="hasSavedGame" class="btn btn-warning" @click="continueGame">
          继续游戏
        </button>
        <button class="btn" @click="goToLeaderboard">排行榜</button>
        <button class="btn" @click="goToAchievements">成就</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { gameApi } from '@/api/game'
import type { Plane, GameState } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const planes = ref<Plane[]>([])
const selectedPlane = ref<Plane | null>(null)
const hasSavedGame = ref(false)
const savedState = ref<GameState | null>(null)

onMounted(async () => {
  await loadPlanes()
  await checkSavedGame()
})

const loadPlanes = async () => {
  try {
    const res = await gameApi.getPlanes()
    if (res.code === 0 && res.data) {
      planes.value = res.data
      if (planes.value.length > 0) {
        selectedPlane.value = planes.value[0]
      }
    }
  } catch (e) {
    console.error('加载飞机列表失败', e)
  }
}

const checkSavedGame = async () => {
  try {
    const res = await gameApi.loadState()
    if (res.code === 0 && res.data) {
      hasSavedGame.value = true
      savedState.value = res.data
    }
  } catch (e) {
    // 没有存档也正常
  }
}

const selectPlane = (plane: Plane) => {
  selectedPlane.value = plane
}

const startGame = () => {
  if (!selectedPlane.value) return
  router.push({
    path: '/game',
    query: { plane: selectedPlane.value.plane_id }
  })
}

const continueGame = () => {
  if (!savedState.value) return
  router.push({
    path: '/game',
    query: { continue: '1' }
  })
}

const goToLeaderboard = () => {
  router.push('/leaderboard')
}

const goToAchievements = () => {
  router.push('/achievements')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToAdmin = () => {
  router.push('/admin')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #050710 0%, #0a0e17 100%);
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(18, 26, 43, 0.9);
  border-bottom: 2px solid var(--color-border);
}

.nav-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  color: var(--color-neon-blue);
  letter-spacing: 3px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  color: var(--color-text-primary);
  font-size: 14px;
  margin-right: 10px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 12px;
}

.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
}

.section-title h3 {
  font-size: 24px;
  letter-spacing: 4px;
  margin-bottom: 5px;
}

.section-title .subtitle {
  font-size: 11px;
  color: var(--color-text-muted);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.plane-grid {
  display: flex;
  gap: 25px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.plane-card {
  width: 280px;
  background: var(--color-bg-panel);
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
}

.plane-card:hover {
  border-color: var(--color-neon-blue);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
}

.plane-card.active {
  border-color: var(--color-neon-blue);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1);
}

.plane-preview {
  height: 120px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.plane-icon {
  width: 60px;
  height: 80px;
  background: var(--plane-color, '#00d4ff');
  clip-path: polygon(50% 0%, 100% 60%, 80% 100%, 20% 100%, 0% 60%);
  box-shadow: 0 0 20px var(--plane-color, '#00d4ff');
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.plane-info {
  padding: 18px;
}

.plane-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  letter-spacing: 1px;
}

.plane-stats {
  margin-bottom: 15px;
}

.stat-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.stat-label {
  width: 40px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 1px;
}

.stat-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--color-border);
}

.stat-fill {
  height: 100%;
  background: var(--color-neon-blue);
  box-shadow: 0 0 5px var(--color-neon-blue);
  transition: width 0.3s ease;
}

.stat-fill.hp {
  background: var(--color-neon-green);
  box-shadow: 0 0 5px var(--color-neon-green);
}

.stat-fill.dmg {
  background: var(--color-neon-orange);
  box-shadow: 0 0 5px var(--color-neon-orange);
}

.plane-skill {
  font-size: 12px;
  color: var(--color-text-secondary);
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.skill-label {
  color: var(--color-text-muted);
}

.skill-name {
  color: var(--color-neon-orange);
  font-weight: 600;
  margin-left: 4px;
}

.skill-desc {
  margin-top: 5px;
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-large {
  padding: 15px 40px;
  font-size: 18px;
}
</style>
