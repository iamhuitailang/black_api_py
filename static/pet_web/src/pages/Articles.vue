<template>
  <Layout>
    <div class="articles-page page-container">
      <h2 class="page-title mb-20">科普文章</h2>
      <div class="article-list">
        <div class="article-card" v-for="item in articleList" :key="item.id" @click="viewDetail(item.id)">
          <div class="article-image">
            <img :src="item.cover_image || 'https://placehold.co/300x200?text=Article'" />
          </div>
          <div class="article-content">
            <h3 class="article-title">{{ item.title }}</h3>
            <p class="article-summary">{{ item.summary || item.content?.substring(0, 100) }}...</p>
            <div class="article-meta">
              <span><el-icon><View /></el-icon> {{ item.view_count || 0 }}</span>
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-if="articleList.length === 0 && !loading" description="暂无文章" />
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { View } from '@element-plus/icons-vue'
import { articleApi } from '@/api'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const articleList = ref([])
const loading = ref(false)

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function viewDetail(id) {
  router.push(`/article/${id}`)
}

async function fetchData() {
  loading.value = true
  try {
    const res = await articleApi.getList({ page_size: 50 })
    articleList.value = res.data?.list || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.articles-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
}

.mb-20 {
  margin-bottom: 20px;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.article-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.article-image {
  height: 180px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  padding: 16px;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-summary {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
