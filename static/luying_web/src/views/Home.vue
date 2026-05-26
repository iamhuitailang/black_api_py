<template>
  <div class="home">
    <section class="hero-section">
      <div class="hero-content">
        <h1>探索自然，享受露营</h1>
        <p>规划你的下一次野外露营之旅，记录装备，发现新营地</p>
        <div class="hero-buttons">
          <el-button type="primary" size="large" @click="$router.push('/plans')">开始规划</el-button>
          <el-button size="large" @click="$router.push('/campsites')">探索营地</el-button>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="features">
        <div class="feature-card">
          <el-icon :size="48" color="#409eff"><Document /></el-icon>
          <h3>露营计划</h3>
          <p>轻松创建和管理你的露营行程</p>
        </div>
        <div class="feature-card">
          <el-icon :size="48" color="#67c23a"><Goods /></el-icon>
          <h3>装备管理</h3>
          <p>记录和管理你的露营装备</p>
        </div>
        <div class="feature-card">
          <el-icon :size="48" color="#e6a23c"><Location /></el-icon>
          <h3>营地探索</h3>
          <p>发现热门营地，查看真实评价</p>
        </div>
        <div class="feature-card">
          <el-icon :size="48" color="#f56c6c"><ChatDotRound /></el-icon>
          <h3>社区分享</h3>
          <p>分享你的露营故事，与爱好者交流</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">热门营地</h2>
        <el-link type="primary" @click="$router.push('/campsites')">查看更多</el-link>
      </div>
      <div class="campsite-grid">
        <div v-for="campsite in campsites" :key="campsite.id" class="campsite-card pointer" @click="$router.push(`/campsite/${campsite.id}`)">
          <div class="campsite-image">
            <img :src="campsite.cover_image || placeholderImage" alt="" />
            <div class="difficulty-tag">
              <el-tag :type="getDifficultyType(campsite.difficulty)" size="small">{{ campsite.difficulty || '中等' }}</el-tag>
            </div>
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
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">社区动态</h2>
        <el-link type="primary" @click="$router.push('/community')">查看更多</el-link>
      </div>
      <div class="post-grid">
        <div v-for="post in posts" :key="post.id" class="post-card pointer" @click="$router.push(`/post/${post.id}`)">
          <div class="post-header">
            <el-avatar :size="36" :src="post.avatar">
              {{ post.nickname?.[0] || 'U' }}
            </el-avatar>
            <div class="post-user">
              <span class="nickname">{{ post.nickname }}</span>
              <span class="time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
          <h3 class="post-title text-ellipsis">{{ post.title }}</h3>
          <p class="post-content text-ellipsis">{{ post.content }}</p>
          <div class="post-stats">
            <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
            <span><el-icon><Star /></el-icon> {{ post.like_count || 0 }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCampsiteList } from '@/api/campsite'
import { getPostList } from '@/api/community'
import type { Campsite, Post } from '@/types'

const campsites = ref<Campsite[]>([])
const posts = ref<Post[]>([])
const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=250&fit=crop'

const fetchCampsites = async () => {
  try {
    const res = await getCampsiteList({ page: 1, page_size: 8 })
    if (res.code === 200) {
      campsites.value = res.data.items
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchPosts = async () => {
  try {
    const res = await getPostList({ page: 1, page_size: 6 })
    if (res.code === 200) {
      posts.value = res.data.items
    }
  } catch (error) {
    console.error(error)
  }
}

const getDifficultyType = (difficulty?: string) => {
  const map: Record<string, string> = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return map[difficulty || ''] || 'warning'
}

const formatTime = (time?: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

onMounted(() => {
  fetchCampsites()
  fetchPosts()
})
</script>

<style scoped>
.home {
  padding: 0 0 40px;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 24px 24px;
  padding: 60px 20px;
  text-align: center;
  color: #fff;
}

.hero-content h1 {
  font-size: 42px;
  margin-bottom: 16px;
}

.hero-content p {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 30px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.features-section {
  padding: 40px 0;
}

.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-card {
  text-align: center;
  padding: 30px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.feature-card h3 {
  margin: 16px 0 8px;
  color: #303133;
}

.feature-card p {
  color: #909399;
  font-size: 14px;
}

.section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  position: relative;
  height: 160px;
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

.campsite-info .stats {
  color: #909399;
  font-size: 14px;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.post-card:hover {
  transform: translateY(-4px);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-user {
  display: flex;
  flex-direction: column;
}

.post-user .nickname {
  font-weight: 500;
}

.post-user .time {
  color: #909399;
  font-size: 12px;
}

.post-title {
  font-size: 16px;
  margin-bottom: 8px;
}

.post-content {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-stats {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

@media (max-width: 768px) {
  .features,
  .campsite-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .post-grid {
    grid-template-columns: 1fr;
  }
}
</style>
