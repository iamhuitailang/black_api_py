<template>
  <div class="layout-container">
    <el-container class="main-container">
      <el-aside width="220px" class="sidebar">
        <div class="logo-section">
          <span class="logo-icon">🦕</span>
          <span class="logo-text">恐龙公园</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="transparent"
          text-color="#fff"
          active-text-color="#667eea"
          router
        >
          <el-menu-item index="/">
            <el-icon><DataAnalysis /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          <el-menu-item index="/park">
            <el-icon><OfficeBuilding /></el-icon>
            <span>我的公园</span>
          </el-menu-item>
          <el-menu-item index="/fossil">
            <el-icon><Search /></el-icon>
            <span>化石发掘</span>
          </el-menu-item>
          <el-menu-item index="/dinosaur">
            <el-icon><Food /></el-icon>
            <span>恐龙管理</span>
          </el-menu-item>
          <el-menu-item index="/habitat">
            <el-icon><House /></el-icon>
            <span>栖息地</span>
          </el-menu-item>
          <el-menu-item index="/facility">
            <el-icon><Setting /></el-icon>
            <span>设施建设</span>
          </el-menu-item>
          <el-menu-item index="/gene">
            <el-icon><Connection /></el-icon>
            <span>基因改造</span>
          </el-menu-item>
          <el-menu-item index="/event">
            <el-icon><Warning /></el-icon>
            <span>突发事件</span>
          </el-menu-item>
          <el-menu-item index="/friend">
            <el-icon><UserFilled /></el-icon>
            <span>好友</span>
          </el-menu-item>
          <el-menu-item index="/share">
            <el-icon><Share /></el-icon>
            <span>分享</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="header">
          <div class="header-left">
            <span class="page-title">{{ pageTitle }}</span>
          </div>
          <div class="header-right">
            <div class="balance-display">
              <span class="balance-item">
                <span class="balance-icon">💰</span>
                <span>{{ userStore.userInfo?.coins?.toLocaleString() }}</span>
              </span>
              <span class="balance-item">
                <span class="balance-icon">💎</span>
                <span>{{ userStore.userInfo?.diamonds?.toLocaleString() }}</span>
              </span>
              <span class="balance-item">
                <span class="balance-icon">⭐</span>
                <span>Lv.{{ userStore.userInfo?.level }}</span>
              </span>
            </div>
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="32" class="user-avatar">
                  {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userStore.userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/': '控制台',
    '/park': '我的公园',
    '/fossil': '化石发掘',
    '/dinosaur': '恐龙管理',
    '/habitat': '栖息地',
    '/facility': '设施建设',
    '/gene': '基因改造',
    '/event': '突发事件',
    '/friend': '好友',
    '/share': '分享',
    '/profile': '个人中心'
  }
  return titles[route.path] || '恐龙公园'
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

onMounted(() => {
  if (userStore.isAuthenticated && !userStore.userInfo) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.main-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-right: none;
}

.logo-section {
  display: flex;
  align-items: center;
  padding: 20px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 28px;
  margin-right: 8px;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-menu {
  border: none;
  margin-top: 10px;
}

.sidebar-menu .el-menu-item {
  margin: 5px 10px;
  border-radius: 8px;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e8e8e8;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.balance-display {
  display: flex;
  gap: 20px;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  color: #666;
}

.balance-icon {
  font-size: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 20px;
  background: #f5f5f5;
  transition: all 0.3s;
}

.user-info:hover {
  background: #e8e8e8;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.username {
  font-weight: 500;
  color: #333;
}

.main-content {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
