<template>
  <Layout>
    <div class="article-detail-page page-container" v-loading="loading">
      <el-button link @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
      <div class="article-detail" v-if="article">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span><el-icon><View /></el-icon> {{ article.view_count || 0 }}</span>
          <span>{{ formatDate(article.created_at) }}</span>
        </div>
        <div class="article-content" v-html="article.content"></div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, View } from '@element-plus/icons-vue'
import { articleApi } from '@/api'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const article = ref(null)
const loading = ref(false)

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

async function fetchArticle() {
  loading.value = true
  try {
    const res = await articleApi.getById(route.params.id)
    article.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.article-detail-page {
  padding-top: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.article-detail {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 20px;
  text-align: center;
}

.article-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-content {
  font-size: 15px;
  line-height: 2;
  color: #606266;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin: 24px 0 16px;
  font-weight: 600;
  color: #303133;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}
</style>
