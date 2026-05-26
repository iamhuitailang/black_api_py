<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="220px" class="admin-aside">
        <div class="logo">
          <h2>简历管理后台</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#1e293b"
          text-color="#cbd5e1"
          active-text-color="#409eff"
          class="admin-menu"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/resumes">
            <el-icon><Document /></el-icon>
            <span>简历管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/templates">
            <el-icon><Picture /></el-icon>
            <span>模板管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/categories">
            <el-icon><Menu /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="admin-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="admin-info">
                <el-avatar :size="32" :src="userStore.admin?.avatar">
                  {{ userStore.admin?.nickname?.charAt(0) || userStore.admin?.username?.charAt(0) }}
                </el-avatar>
                <span class="username">{{ userStore.admin?.nickname || userStore.admin?.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  User,
  Document,
  Picture,
  Menu,
  Setting
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = ref(route.path)

const currentPageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/admin/dashboard': '数据统计',
    '/admin/users': '用户管理',
    '/admin/resumes': '简历管理',
    '/admin/templates': '模板管理',
    '/admin/categories': '分类管理',
    '/admin/settings': '系统设置'
  }
  return titleMap[route.path] || '管理后台'
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.adminLogout()
    ElMessage.success('已退出登录')
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-aside {
  background: #1e293b;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #334155;
}

.logo h2 {
  color: #fff;
  font-size: 16px;
  margin: 0;
}

.admin-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.admin-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.admin-menu :deep(.el-menu-item:hover) {
  background: #334155;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: #334155;
}

.el-container {
  margin-left: 220px;
}

.admin-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 24px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.admin-main {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 24px;
}
</style>
