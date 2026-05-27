<template>
  <Layout>
    <div class="home-page">
      <div class="banner">
        <div class="banner-content">
          <h1>用爱心为流浪宠物找到温暖的家</h1>
          <p>连接送养人与领养人，让每一个生命都被温柔以待</p>
          <div class="banner-buttons">
            <el-button type="primary" size="large" @click="$router.push('/pets')">
              <el-icon><Search /></el-icon>
              浏览宠物
            </el-button>
            <el-button size="large" @click="$router.push('/pet/publish')" v-if="userStore.isLogin">
              <el-icon><Plus /></el-icon>
              发布宠物
            </el-button>
          </div>
        </div>
      </div>

      <div class="page-container">
        <div class="section">
          <div class="section-header">
            <h2>待领养宠物</h2>
            <el-button type="primary" link @click="$router.push('/pets')">查看更多</el-button>
          </div>
          <el-row :gutter="20">
            <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="pet in petList" :key="pet.id">
              <div class="pet-card" @click="viewPetDetail(pet.id)">
                <div class="pet-image-wrapper">
                  <img :src="getFirstImage(pet.images)" class="pet-image" :alt="pet.name" />
                  <span :class="['status-tag', `status-${pet.status}`]">{{ getStatusText(pet.status) }}</span>
                </div>
                <div class="pet-info">
                  <h3 class="pet-name">{{ pet.name }}</h3>
                  <p class="pet-desc">{{ pet.breed }} · {{ pet.gender === 'male' ? '公' : '母' }} · {{ pet.age }}个月</p>
                  <p class="pet-address">
                    <el-icon size="14"><Location /></el-icon>
                    {{ pet.address }}
                  </p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>科普文章</h2>
            <el-button type="primary" link @click="$router.push('/articles')">查看更多</el-button>
          </div>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="8" v-for="article in articleList" :key="article.id">
              <div class="article-card" @click="viewArticleDetail(article.id)">
                <img :src="article.cover" class="article-cover" :alt="article.title" />
                <div class="article-info">
                  <span class="article-category">{{ getCategoryText(article.category) }}</span>
                  <h3 class="article-title">{{ article.title }}</h3>
                  <p class="article-meta">
                    <span><el-icon size="14"><View /></el-icon> {{ article.view_count }}</span>
                    <span>{{ formatDate(article.created_at) }}</span>
                  </p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="section">
          <div class="features">
            <el-row :gutter="40">
              <el-col :span="8">
                <div class="feature-item">
                  <div class="feature-icon">
                    <el-icon size="48"><Search /></el-icon>
                  </div>
                  <h3>智能匹配</h3>
                  <p>根据您的条件，智能推荐最适合的宠物</p>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <div class="feature-icon">
                    <el-icon size="48"><DocumentChecked /></el-icon>
                  </div>
                  <h3>严格审核</h3>
                  <p>所有宠物和领养人都经过严格审核</p>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <div class="feature-icon">
                    <el-icon size="48"><Heart /></el-icon>
                  </div>
                  <h3>持续跟进</h3>
                  <p>领养后持续跟进，确保宠物健康快乐</p>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { petApi, articleApi } from '@/api'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()
const petList = ref([])
const articleList = ref([])

const statusMap = {
  pending: '待审核',
  available: '可领养',
  adopted: '已领养',
  rejected: '已拒绝'
}

const categoryMap = {
  knowledge: '养宠知识',
  guide: '领养指南',
  news: '最新动态'
}

function getStatusText(status) {
  return statusMap[status] || status
}

function getCategoryText(category) {
  return categoryMap[category] || category
}

function getFirstImage(images) {
  if (!images) return 'https://placehold.co/300x200?text=No+Image'
  return images.split(',')[0]
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

function viewPetDetail(id) {
  router.push(`/pet/${id}`)
}

function viewArticleDetail(id) {
  router.push(`/article/${id}`)
}

async function fetchData() {
  try {
    const [petRes, articleRes] = await Promise.all([
      petApi.getList({ status: 'available', page_size: 8 }),
      articleApi.getList({ page_size: 6 })
    ])
    petList.value = petRes.data?.list || []
    articleList.value = articleRes.data?.list || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 80px 20px;
  text-align: center;
}

.banner-content h1 {
  font-size: 36px;
  margin-bottom: 16px;
}

.banner-content p {
  font-size: 18px;
  margin-bottom: 32px;
  opacity: 0.9;
}

.banner-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 24px;
  color: #303133;
}

.pet-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 20px;
}

.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.pet-image-wrapper {
  position: relative;
  height: 200px;
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #fff;
}

.status-pending {
  background: #e6a23c;
}

.status-available {
  background: #67c23a;
}

.status-adopted {
  background: #909399;
}

.status-rejected {
  background: #f56c6c;
}

.pet-info {
  padding: 16px;
}

.pet-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.pet-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.pet-address {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 20px;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.article-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.article-info {
  padding: 16px;
}

.article-category {
  display: inline-block;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.features {
  background: #fff;
  border-radius: 8px;
  padding: 40px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.feature-item {
  text-align: center;
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: #ecf5ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.feature-item h3 {
  font-size: 20px;
  color: #303133;
  margin-bottom: 12px;
}

.feature-item p {
  color: #606266;
  line-height: 1.6;
}
</style>
