<template>
  <div class="layout-container">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/home')">
          <el-icon size="32" color="#409eff"><House /></el-icon>
          <span class="logo-text">宠物领养平台</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="nav-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/pets">宠物列表</el-menu-item>
          <el-menu-item index="/questions">问答社区</el-menu-item>
          <el-menu-item index="/articles">科普文章</el-menu-item>
          <el-menu-item index="/guide">领养指南</el-menu-item>
          <el-menu-item v-if="userStore.isLogin && userStore.isSender" index="/pet/publish">
            发布宠物
          </el-menu-item>
          <el-menu-item v-if="userStore.isLogin" index="/my-pets">我的宠物</el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/admin/users">管理后台</el-menu-item>
        </el-menu>
        <div class="user-area">
          <template v-if="userStore.isLogin">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
              <el-button type="primary" text @click="$router.push('/messages')">
                <el-icon size="20"><Bell /></el-icon>
              </el-button>
            </el-badge>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  {{ userStore.user?.nickname?.charAt(0) }}
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="favorites">我的收藏</el-dropdown-item>
                  <el-dropdown-item command="applications">我的申请</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
            <el-button @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <el-main class="main-content">
      <slot />
    </el-main>
    <el-footer class="footer">
      <div class="footer-content">
        <p>© 2024 宠物领养信息平台 版权所有</p>
        <p>用爱心为流浪宠物找到温暖的家</p>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { messageApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const unreadCount = ref(0)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/admin')) return '/admin/users'
  if (path.startsWith('/pet') && path !== '/pet/publish') return '/pets'
  if (path.startsWith('/question')) return '/questions'
  if (path.startsWith('/article')) return '/articles'
  return path
})

function handleMenuSelect(index) {
  router.push(index)
}

function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'favorites':
      router.push('/favorites')
      break
    case 'applications':
      router.push('/my-applications')
      break
    case 'logout':
      userStore.logout()
      router.push('/home')
      break
  }
}

async function fetchUnreadCount() {
  if (userStore.userId) {
    try {
      const res = await messageApi.getUnreadCount(userStore.userId)
      unreadCount.value = res.data?.unread_count || 0
    } catch (e) {
      console.error(e)
    }
  }
}

onMounted(() => {
  if (userStore.isLogin) {
    fetchUnreadCount()
  }
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 64px !important;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 40px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  margin-left: 10px;
  color: #303133;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  color: #606266;
}

.main-content {
  flex: 1;
  padding: 0;
}

.footer {
  background: #fff;
  border-top: 1px solid #ebeef5;
  text-align: center;
  color: #909399;
  padding: 20px 0 !important;
}

.footer-content p {
  margin: 4px 0;
}

.message-badge {
  margin-right: 10px;
}
</style>
