<template>
  <div v-if="!isLoginPage" id="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">📊</span>
        <span class="logo-text">KPI 管理系统</span>
      </div>
      <nav class="nav-menu">
        <router-link to="/" class="nav-item" exact>
          <span class="nav-icon">🏠</span><span>工作台</span>
        </router-link>
        <router-link v-if="currentRole === 'admin'" to="/cycles" class="nav-item">
          <span class="nav-icon">📅</span><span>考核周期管理</span>
        </router-link>
        <router-link to="/self-review" class="nav-item">
          <span class="nav-icon">✍️</span><span>员工自评</span>
        </router-link>
        <router-link v-if="currentRole === 'admin' || currentRole === 'manager'" to="/supervisor-review" class="nav-item">
          <span class="nav-icon">✅</span><span>上级评分</span>
        </router-link>
        <router-link v-if="currentRole === 'admin'" to="/statistics" class="nav-item">
          <span class="nav-icon">📈</span><span>统计分析</span>
        </router-link>
        <router-link to="/my-history" class="nav-item">
          <span class="nav-icon">📜</span><span>我的历史</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <div class="breadcrumb">
          <span>{{ currentPageTitle }}</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ currentUser?.name || '-' }}</span>
          <span :class="['tag', 'tag-role-' + currentRole]">{{ roleText }}</span>
          <button class="btn btn-sm" @click="handleLogout">退出登录</button>
        </div>
      </header>
      <div class="content-area">
        <router-view v-if="currentUser" :key="$route.fullPath" :user="currentUser" />
        <div v-else class="loading-box">加载中...</div>
      </div>
    </main>
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from './utils/api'

const route = useRoute()
const router = useRouter()
const currentUser = ref(null)
const currentRole = ref('')

const pageTitles = {
  '/': '工作台',
  '/cycles': '考核周期管理',
  '/self-review': '员工自评',
  '/self-review-detail': '自评详情',
  '/supervisor-review': '上级评分',
  '/supervisor-review-detail': '评分详情',
  '/statistics': '统计分析',
  '/my-history': '我的历史绩效'
}

const isLoginPage = computed(() => route.path === '/login')

const currentPageTitle = computed(() => {
  if (route.path.startsWith('/self-review/')) return '自评详情'
  if (route.path.startsWith('/supervisor-review/')) return '评分详情'
  return pageTitles[route.path] || '绩效考核系统'
})

const roleText = computed(() => {
  const map = { admin: '管理员', manager: '组长', employee: '员工' }
  return map[currentRole.value] || '-'
})

const loadCurrentUser = async () => {
  try {
    const userStr = localStorage.getItem('kpi_user')
    if (!userStr) return
    const authUser = JSON.parse(userStr)
    const res = await api.getEmployeeByUser(authUser.id)
    if (res.code === 0 && res.data) {
      currentUser.value = res.data
      currentRole.value = res.data.role || 'employee'
      localStorage.setItem('kpi_role', currentRole.value)
    }
  } catch (e) {
    console.error('加载当前用户失败', e)
  }
}

const handleLogout = async () => {
  if (!confirm('确定要退出登录吗？')) return
  try {
    await api.logout()
  } catch (e) {}
  localStorage.removeItem('kpi_token')
  localStorage.removeItem('kpi_user')
  localStorage.removeItem('kpi_role')
  currentUser.value = null
  currentRole.value = ''
  router.push('/login')
}

onMounted(() => {
  if (!isLoginPage.value) {
    loadCurrentUser()
  }
})

watch(() => route.path, (newPath) => {
  if (newPath !== '/login' && !currentUser.value) {
    loadCurrentUser()
  }
})
</script>
