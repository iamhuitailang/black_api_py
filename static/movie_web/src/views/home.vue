<template>
  <div>
    <div class="nav-header">
      <div class="nav-logo">🎬 影院票务系统</div>
      <div class="nav-right">
        <el-button v-if="!isLoggedIn" type="primary" @click="$router.push('/login')">登录</el-button>
        <el-button v-if="!isLoggedIn" @click="$router.push('/register')">注册</el-button>
        <template v-else>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="user?.avatar">
                {{ user?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span style="margin-left: 8px">{{ user?.nickname || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item v-if="isAdmin" command="admin">管理后台</el-dropdown-item>
                <el-dropdown-item divided command="logout" style="color: #f56c6c">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="tabs-container">
      <el-tab-pane label="正在热映" name="showing" />
      <el-tab-pane label="即将上映" name="coming" />
      <el-tab-pane label="全部影片" name="all" />
    </el-tabs>

    <div class="container" style="margin-top: 20px">
      <div class="page-header">
        <h1 class="page-title">
          {{ tabTitles[activeTab] }}
        </h1>
        <el-input
          v-model="keyword"
          placeholder="搜索影片名称、导演、演员"
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div v-loading="loading" class="movie-grid">
        <div v-for="movie in movies" :key="movie.id" class="card-movie" @click="goDetail(movie.id)">
          <el-card :body-style="{ padding: '0' }" shadow="hover">
            <img v-if="movie.poster" :src="movie.poster" class="movie-poster" />
            <div v-else class="movie-poster-placeholder">{{ movie.title }}</div>
            <div style="padding: 12px">
              <h3 style="margin: 0 0 8px; font-size: 16px">{{ movie.title }}</h3>
              <div style="color: #909399; font-size: 13px; margin-bottom: 8px">
                {{ movie.genre }} · {{ movie.duration }}分钟
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <el-rate :model-value="movie.avg_rating / 2" disabled size="small" />
                <span style="color: #f56c6c; font-weight: bold">{{ movie.avg_rating }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <div v-if="!loading && movies.length === 0" class="empty-container">
        <el-empty description="暂无影片" />
      </div>

      <div v-if="total > 0" style="display: flex; justify-content: center; margin-top: 30px">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchMovies"
          @size-change="fetchMovies"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { Movie, PaginatedData } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)
const user = computed(() => userStore.user)

const activeTab = ref('showing')
const keyword = ref('')
const movies = ref<Movie[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const tabTitles: Record<string, string> = {
  showing: '正在热映',
  coming: '即将上映',
  all: '全部影片'
}

function getStatus(): number | undefined {
  if (activeTab.value === 'showing') return 0
  if (activeTab.value === 'coming') return 1
  return undefined
}

async function fetchMovies() {
  loading.value = true
  try {
    const status = getStatus()
    const res = await api.get<PaginatedData<Movie>>('/movie/list/get', {
      page: page.value,
      page_size: pageSize.value,
      status: status,
      keyword: keyword.value || undefined
    })
    movies.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchMovies()
}

function goDetail(id: number) {
  router.push(`/movie/${id}`)
}

async function handleCommand(command: string) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
      await api.post('/movie/logout')
    } catch (e: any) {
      // ignore
    }
    userStore.logout()
    router.push('/')
  } else if (command === 'orders') {
    router.push('/orders')
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'admin') {
    router.push('/admin/dashboard')
  }
}

watch(activeTab, () => {
  page.value = 1
  fetchMovies()
})

onMounted(fetchMovies)
</script>