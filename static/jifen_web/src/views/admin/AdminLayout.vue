<template>
  <el-container class="admin-layout">
    <el-aside width="220px">
      <div class="logo">🎁 管理后台</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#2c3e50"
        text-color="#ecf0f1"
        active-text-color="#FF8C00"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <div class="header-content">
          <span class="title">{{ $route.meta.title }}</span>
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32">{{ userStore.userInfo?.nickname?.[0] || 'A' }}</el-avatar>
              <span>{{ userStore.userInfo?.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToHome">
                  返回首页
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Goods, List, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

function goToHome() {
  router.push('/home')
}

function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.el-aside {
  background: #2c3e50;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid #34495e;
}

.el-menu {
  border-right: none;
  flex: 1;
}

.el-menu-item {
  height: 50px;
  line-height: 50px;
}

.el-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.el-main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
