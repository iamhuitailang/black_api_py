<template>
  <div id="app" class="app-container">
    <router-view v-if="isLoginPage" />
    <template v-else>
      <el-container class="main-container">
        <el-aside width="220px" class="sidebar">
          <div class="logo">
            <el-icon :size="32"><Monitor /></el-icon>
            <span>SpeedCraft</span>
          </div>
          <el-menu
            :default-active="activeMenu"
            class="menu"
            router
            background-color="transparent"
            text-color="#fff"
            active-text-color="#ff6b00"
          >
            <el-menu-item index="/dashboard">
              <el-icon><Trophy /></el-icon>
              <span>控制台</span>
            </el-menu-item>
            <el-menu-item index="/garage">
              <el-icon><Tools /></el-icon>
              <span>我的车库</span>
            </el-menu-item>
            <el-menu-item index="/design">
              <el-icon><Edit /></el-icon>
              <span>设计赛车</span>
            </el-menu-item>
            <el-menu-item index="/parts">
              <el-icon><Box /></el-icon>
              <span>零件商店</span>
            </el-menu-item>
            <el-menu-item index="/research">
              <el-icon><Cpu /></el-icon>
              <span>零件研发</span>
            </el-menu-item>
            <el-menu-item index="/windtunnel">
              <el-icon><Aim /></el-icon>
              <span>风洞测试</span>
            </el-menu-item>
            <el-menu-item index="/paint">
              <el-icon><Brush /></el-icon>
              <span>涂装自定义</span>
            </el-menu-item>
            <el-menu-item index="/races">
              <el-icon><Trophy /></el-icon>
              <span>赛事中心</span>
            </el-menu-item>
            <el-menu-item index="/team">
              <el-icon><User /></el-icon>
              <span>车队管理</span>
            </el-menu-item>
          </el-menu>
          <div class="user-info">
            <el-avatar :size="40" :src="userStore.user?.avatar">
              {{ userStore.user?.nickname?.charAt(0) }}
            </el-avatar>
            <div class="user-detail">
              <div class="username">{{ userStore.user?.nickname }}</div>
              <div class="user-coins">
                <el-icon :size="14" color="#ffd700"><Coin /></el-icon>
                {{ userStore.user?.coins?.toLocaleString() }}
              </div>
            </div>
            <el-button type="danger" size="small" @click="logout">
              <el-icon><SwitchButton /></el-icon>
            </el-button>
          </div>
        </el-aside>
        <el-main class="content">
          <router-view />
        </el-main>
      </el-container>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  Cpu, Trophy, Tools, Edit, Box, Monitor, Aim,
  Brush, User, Coin, SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLoginPage = computed(() => 
  route.path === '/login' || route.path === '/register'
)

const activeMenu = computed(() => route.path)

onMounted(() => {
  if (!isLoginPage.value && !userStore.token) {
    router.push('/login')
  }
})

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #0a0a0f;
}

.main-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-right: 1px solid #2a2a4a;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  color: #ff6b00;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #2a2a4a;
}

.menu {
  flex: 1;
  border-right: none !important;
  padding-top: 16px;
}

.menu :deep(.el-menu-item) {
  margin: 4px 12px;
  border-radius: 8px;
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 107, 0, 0.1);
}

.menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 107, 0, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #2a2a4a;
}

.user-detail {
  flex: 1;
  min-width: 0;
}

.username {
  color: #fff;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-coins {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffd700;
  font-size: 13px;
}

.content {
  background: #0a0a0f;
  padding: 24px;
  overflow-y: auto;
}
</style>
