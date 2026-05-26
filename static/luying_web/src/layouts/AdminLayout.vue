<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="aside">
      <div class="logo-area pointer" @click="$router.push('/admin/dashboard')">
        <el-icon :size="28"><Compass /></el-icon>
        <span class="logo-text">管理后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="admin-menu"
        background-color="#001529"
        text-color="#ffffff"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/equipments">
          <el-icon><Goods /></el-icon>
          <span>装备管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/campsites">
          <el-icon><Location /></el-icon>
          <span>营地管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/plans">
          <el-icon><Document /></el-icon>
          <span>计划管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/posts">
          <el-icon><ChatDotRound /></el-icon>
          <span>帖子管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div class="flex-between">
          <div class="page-title">{{ route.meta.title }}</div>
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info pointer">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                {{ userStore.userInfo?.nickname?.[0] || 'A' }}
              </el-avatar>
              <span>{{ userStore.userInfo?.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">返回前台</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command: string) => {
  if (command === 'home') {
    router.push('/home')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.aside {
  background: #001529;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-menu {
  border-right: none;
}

.admin-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.admin-main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
