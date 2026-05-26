<template>
  <div class="admin-layout">
    <div class="admin-header" style="height: 60px">
      <div class="admin-logo">🎬 影院管理系统</div>
      <div style="display: flex; align-items: center; gap: 16px">
        <span>{{ user?.nickname || '管理员' }}</span>
        <el-button type="danger" link @click="handleLogout">退出</el-button>
      </div>
    </div>
    <el-menu mode="horizontal" :default-active="activeMenu" @select="handleMenuSelect" style="background: #001529; border: none">
      <el-menu-item index="dashboard" style="color: white">数据统计</el-menu-item>
      <el-menu-item index="movies" style="color: white">影片管理</el-menu-item>
      <el-menu-item index="showtimes" style="color: white">场次管理</el-menu-item>
      <el-menu-item index="orders" style="color: white">订单管理</el-menu-item>
    </el-menu>
    <div class="admin-content">
      <h2 style="margin-bottom: 20px">数据统计</h2>
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">用户总数</div>
            <div class="stat-card-value">{{ stats.total_users }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">影片总数</div>
            <div class="stat-card-value">{{ stats.total_movies }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">上映中影片</div>
            <div class="stat-card-value">{{ stats.showing_movies }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">即将上映</div>
            <div class="stat-card-value">{{ stats.coming_movies }}</div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">场次总数</div>
            <div class="stat-card-value">{{ stats.total_showtimes }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">订单总数</div>
            <div class="stat-card-value">{{ stats.total_orders }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">今日票房</div>
            <div class="stat-card-value">¥{{ stats.today_revenue }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-card-title">累计票房</div>
            <div class="stat-card-value">¥{{ stats.total_revenue }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { User, Statistics } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('dashboard')
const user = ref<User | null>(userStore.user)
const stats = ref<Statistics>({
  total_users: 0,
  total_movies: 0,
  showing_movies: 0,
  coming_movies: 0,
  total_showtimes: 0,
  total_orders: 0,
  paid_orders: 0,
  verified_orders: 0,
  total_reviews: 0,
  today_revenue: 0,
  total_revenue: 0
})

function handleMenuSelect(index: string) {
  router.push(`/admin/${index}`)
}

async function fetchStats() {
  try {
    const res = await api.get<Statistics>('/movie/admin/statistics/get')
    stats.value = res.data
  } catch (e) {
    // handled
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    await api.post('/movie/admin/logout')
  } catch (e: any) {
    // ignore
  }
  userStore.logout()
  router.push('/admin/login')
}

onMounted(fetchStats)
</script>