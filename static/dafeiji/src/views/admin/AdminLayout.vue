<template>
  <div class="admin-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2 class="title-neon">作战指挥</h2>
        <span class="subtitle">COMMAND CENTER</span>
      </div>

      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/home" class="back-btn">
          ← 返回游戏
        </router-link>
      </div>
    </div>

    <div class="main-content">
      <div class="top-bar">
        <div class="top-left">
          <h3 class="page-title">{{ currentPageTitle }}</h3>
        </div>
        <div class="top-right">
          <span class="user-info">{{ userStore.user?.username }}</span>
          <span class="badge badge-admin">ADMIN</span>
        </div>
      </div>

      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { path: '/admin/dashboard', name: '数据概览', icon: '📊' },
  { path: '/admin/users', name: '用户管理', icon: '👥' },
  { path: '/admin/planes', name: '飞机管理', icon: '✈️' },
  { path: '/admin/waves', name: '波次管理', icon: '🌊' },
  { path: '/admin/statistics', name: '数据统计', icon: '📈' }
]

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => route.path.startsWith(m.path))
  return item?.name || '管理后台'
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: #050710;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, var(--color-bg-panel) 0%, var(--color-bg-dark) 100%);
  border-right: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 25px 20px;
  text-align: center;
  border-bottom: 2px solid var(--color-border);
}

.sidebar-header h2 {
  font-size: 18px;
  letter-spacing: 2px;
  margin-bottom: 5px;
}

.subtitle {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.nav-menu {
  flex: 1;
  padding: 15px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 14px;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.1);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: rgba(0, 212, 255, 0.15);
  color: var(--color-neon-blue);
  border-left-color: var(--color-neon-blue);
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--color-border);
}

.back-btn {
  display: block;
  text-align: center;
  padding: 10px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s;
}

.back-btn:hover {
  color: var(--color-neon-blue);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: rgba(18, 26, 43, 0.8);
  border-bottom: 2px solid var(--color-border);
}

.page-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  color: var(--color-neon-blue);
  letter-spacing: 2px;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  font-size: 14px;
  color: var(--color-text-primary);
}

.content-area {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
}
</style>
