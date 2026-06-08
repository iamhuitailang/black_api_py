<template>
  <div class="app-container">
    <div class="screen-flash" :class="{ active: showFlash }"></div>

    <nav class="navbar">
      <div class="logo" @click="goHome">
        <span class="logo-text">🎱 霓虹弹珠台</span>
      </div>

      <ul class="nav-links">
        <li><router-link to="/game">游戏</router-link></li>
        <li><router-link to="/leaderboard">排行榜</router-link></li>
        <li><router-link to="/achievements">成就</router-link></li>
        <li v-if="userStore.isAdmin">
          <router-link to="/admin">管理</router-link>
        </li>
      </ul>

      <div class="user-section">
        <template v-if="userStore.isLoggedIn">
          <span class="username">{{ userStore.user?.username }}</span>
          <span v-if="userStore.isAdmin" class="admin-badge">管理员</span>
          <router-link to="/profile" class="profile-link">
            <span class="profile-icon">👤</span>
          </router-link>
          <button @click="handleLogout" class="logout-btn">退出</button>
        </template>
        <template v-else>
          <router-link to="/login" class="login-link">登录</router-link>
          <router-link to="/register" class="register-btn">注册</router-link>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div v-if="achievementStore.newlyUnlocked.length > 0" class="achievement-popup">
      <div v-for="ach in achievementStore.newlyUnlocked" :key="ach.code" class="achievement-toast">
        <span class="ach-icon">{{ ach.icon }}</span>
        <div class="ach-info">
          <div class="ach-title">成就解锁！</div>
          <div class="ach-name">{{ ach.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useAchievementStore, useGameStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()
const achievementStore = useAchievementStore()
const gameStore = useGameStore()

const showFlash = ref(false)

onMounted(async () => {
  if (userStore.token) {
    await userStore.fetchUser()
  }
})

function goHome() {
  router.push('/game')
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

watch(
  () => gameStore.combo,
  (combo) => {
    if (combo >= 2) {
      showFlash.value = true
      setTimeout(() => {
        showFlash.value = false
      }, 200)
    }
  }
)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: rgba(26, 26, 46, 0.95);
  border-bottom: 1px solid var(--border-glow);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  cursor: pointer;
}

.logo-text {
  font-size: 22px;
  font-weight: bold;
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.nav-links {
  display: flex;
  gap: 28px;
  list-style: none;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-links a:hover {
  color: var(--neon-blue);
}

.nav-links a.router-link-active {
  color: var(--neon-blue);
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.username {
  color: var(--text-primary);
  font-size: 14px;
}

.admin-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-orange));
  border-radius: 10px;
  color: white;
  font-weight: bold;
}

.profile-link {
  color: var(--neon-blue);
  font-size: 20px;
  text-decoration: none;
}

.logout-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 0, 255, 0.1);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
}

.login-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
}

.login-link:hover {
  color: var(--neon-blue);
}

.register-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-pink));
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
}

.main-content {
  flex: 1;
}

.screen-flash {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 50;
  border: 6px solid transparent;
  transition: border-color 0.15s ease;
}

.screen-flash.active {
  border-color: var(--neon-pink);
  box-shadow: inset 0 0 60px rgba(255, 0, 255, 0.4);
}

.achievement-popup {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
  border: 1px solid var(--neon-yellow);
  border-radius: 10px;
  animation: slideIn 0.5s ease-out;
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
}

.ach-icon {
  font-size: 32px;
}

.ach-info {
  display: flex;
  flex-direction: column;
}

.ach-title {
  font-size: 12px;
  color: var(--neon-yellow);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ach-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .navbar {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
    gap: 18px;
  }

  .logo-text {
    font-size: 18px;
  }
}
</style>
