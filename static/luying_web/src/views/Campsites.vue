<template>
  <div class="campsites-page">
    <div class="page-header">
      <h1 class="page-title">营地探索</h1>
      <div class="search-area">
        <el-input
          v-model="keyword"
          placeholder="搜索营地名称或地点"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="difficulty" placeholder="难度" clearable style="width: 120px">
          <el-option label="简单" value="简单" />
          <el-option label="中等" value="中等" />
          <el-option label="困难" value="困难" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <div class="campsite-grid" v-loading="loading">
      <div v-for="campsite in list" :key="campsite.id" class="campsite-card pointer" @click="goDetail(campsite.id)">
        <div class="campsite-image">
          <img :src="campsite.cover_image || placeholderImage" alt="" />
          <div class="difficulty-tag">
            <el-tag :type="getDifficultyType(campsite.difficulty)" size="small">{{ campsite.difficulty || '中等' }}</el-tag>
          </div>
        </div>
        <div class="campsite-info">
          <h3 class="text-ellipsis">{{ campsite.name }}</h3>
          <p class="location"><el-icon><Location /></el-icon> {{ campsite.location || '未设置' }}</p>
          <div class="meta">
            <span class="tag-green" v-if="campsite.facilities">{{ campsite.facilities?.split(',').slice(0, 2).join('、') }}</span>
          </div>
          <div class="stats">
            <span><el-icon><View /></el-icon> {{ campsite.view_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[8, 12, 16, 24]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-empty v-if="!loading && list.length === 0" description="暂无营地数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCampsiteList } from '@/api/campsite'
import type { Campsite } from '@/types'

const router = useRouter()
const loading = ref(false)
const list = ref<Campsite[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(8)
const keyword = ref('')
const difficulty = ref('')

const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=250&fit=crop'

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getCampsiteList({
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined,
      difficulty: difficulty.value || undefined
    })
    if (res.code === 200) {
      list.value = res.data.items
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const goDetail = (id: number) => {
  router.push(`/campsite/${id}`)
}

const getDifficultyType = (difficulty?: string) => {
  const map: Record<string, string> = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return map[difficulty || ''] || 'warning'
}

onMounted(fetchList)
</script>

<style scoped>
.campsites-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-area {
  display: flex;
  gap: 12px;
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
  position: relative;
  height: 180px;
  overflow: hidden;
}

.campsite-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.difficulty-tag {
  position: absolute;
  top: 10px;
  right: 10px;
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

.campsite-info .meta {
  margin-bottom: 8px;
}

.campsite-info .stats {
  color: #909399;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .campsite-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
