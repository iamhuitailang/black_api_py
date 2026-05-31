<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h2>🎮 飞行棋管理</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2d3d"
        text-color="#c0c4cc"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/rooms">
          <el-icon><OfficeBuilding /></el-icon>
          <span>房间管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/items">
          <el-icon><Goods /></el-icon>
          <span>道具管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPage }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-avatar :size="32">{{ user?.nickname?.charAt(0) }}</el-avatar>
            <span>{{ user?.nickname }}</span>
            <el-tag type="warning" size="small">管理员</el-tag>
          </span>
          <el-button type="danger" size="small" @click="logout">
            <el-icon><SwitchButton /></el-icon> 退出
          </el-button>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser } from '@/utils/storage'
import { removeUser } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const user = ref(null)

const activeMenu = computed(() => route.path)

const currentPage = computed(() => {
  const titles = {
    '/admin/dashboard': '数据统计',
    '/admin/users': '用户管理',
    '/admin/rooms': '房间管理',
    '/admin/items': '道具管理'
  }
  return titles[route.path] || ''
})

const logout = () => {
  removeUser()
  router.push('/login')
}

onMounted(() => {
  user.value = getUser()
})
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}
.sidebar {
  background: #1f2d3d;
  color: white;
  display: flex;
  flex-direction: column;
}
.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #324157;
}
.logo h2 {
  margin: 0;
  font-size: 18px;
  color: #ffd04b;
}
:deep(.el-menu) {
  border-right: none;
}
.header {
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e4e7ed;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.main-content {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
