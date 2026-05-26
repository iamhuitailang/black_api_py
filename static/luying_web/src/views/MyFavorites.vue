<template>
  <div class="my-favorites">
    <h1 class="page-title">我的收藏</h1>

    <div class="campsite-grid" v-loading="loading">
      <div v-for="campsite in list" :key="campsite.id" class="campsite-card pointer" @click="goDetail(campsite.id)">
        <div class="campsite-image">
          <img :src="campsite.cover_image || placeholderImage" alt="" />
        </div>
        <div class="campsite-info">
          <h3 class="text-ellipsis">{{ campsite.name }}</h3>
          <p class="location"><el-icon><Location /></el-icon> {{ campsite.location || '未设置' }}</p>
          <div class="stats">
            <span><el-icon><View /></el-icon> {{ campsite.view_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && list.length === 0" description="暂无收藏" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavorites } from '@/api/campsite'
import { useUserStore } from '@/stores/user'
import type { Campsite } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const list = ref<Campsite[]>([])
const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=250&fit=crop'

const fetchList = async () => {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await getFavorites(userStore.userInfo!.id)
    if (res.code === 200) {
      list.value = res.data.items
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goDetail = (id: number) => {
  router.push(`/campsite/${id}`)
}

onMounted(fetchList)
</script>

<style scoped>
.my-favorites {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.campsite-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.campsite-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.campsite-card:hover {
  transform: translateY(-4px);
}

.campsite-image {
  height: 160px;
  overflow: hidden;
}

.campsite-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.campsite-info {
  padding: 16px;
}

.campsite-info h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.campsite-info .location {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.campsite-info .stats {
  color: #909399;
  font-size: 14px;
}

@media (max-width: 768px) {
  .campsite-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
