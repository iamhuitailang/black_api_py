<template>
  <div class="campsite-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :title="campsite?.name || '营地详情'" class="page-header" />

    <div v-if="campsite" class="detail-content">
      <div class="main-image">
        <img :src="campsite.cover_image || placeholderImage" alt="" />
        <div class="image-overlay">
          <h1>{{ campsite.name }}</h1>
          <div class="tags">
            <el-tag :type="getDifficultyType(campsite.difficulty)" size="large">{{ campsite.difficulty || '中等' }}</el-tag>
            <el-tag type="info" size="large" v-if="campsite.best_season">{{ campsite.best_season }}</el-tag>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="left-content">
          <div class="card">
            <h2 class="card-title">营地信息</h2>
            <div class="info-row" v-if="campsite.location">
              <el-icon><Location /></el-icon>
              <span>{{ campsite.location }}</span>
            </div>
            <div class="info-row" v-if="campsite.description">
              <p>{{ campsite.description }}</p>
            </div>
          </div>

          <div class="card" v-if="campsite.facilities">
            <h2 class="card-title">设施配置</h2>
            <div class="facilities">
              <el-tag v-for="f in campsite.facilities.split(',')" :key="f" size="large" class="tag-green">
                {{ f }}
              </el-tag>
            </div>
          </div>

          <div class="card" v-if="campsite.tips">
            <h2 class="card-title">温馨提示</h2>
            <p>{{ campsite.tips }}</p>
          </div>

          <div class="card" v-if="campsite.price_info">
            <h2 class="card-title">费用信息</h2>
            <p>{{ campsite.price_info }}</p>
          </div>

          <div class="card">
            <h2 class="card-title">用户评价</h2>
            <div class="review-form" v-if="userStore.isLoggedIn">
              <el-rate v-model="newReview.rating" />
              <el-input
                v-model="newReview.content"
                type="textarea"
                :rows="3"
                placeholder="分享你的露营体验..."
              />
              <el-button type="primary" :loading="submitting" @click="submitReview">发表评价</el-button>
            </div>
            <div class="review-list">
              <div v-for="review in reviews" :key="review.id" class="review-item">
                <div class="review-header">
                  <el-avatar :size="36" :src="review.avatar">
                    {{ review.nickname?.[0] || 'U' }}
                  </el-avatar>
                  <div class="review-user">
                    <span class="nickname">{{ review.nickname }}</span>
                    <el-rate :model-value="review.rating" disabled size="small" />
                  </div>
                  <span class="review-time">{{ formatTime(review.created_at) }}</span>
                </div>
                <p v-if="review.content" class="review-content">{{ review.content }}</p>
              </div>
            </div>
            <el-empty v-if="reviews.length === 0" description="暂无评价" />
          </div>
        </div>

        <div class="right-content">
          <div class="card actions-card">
            <el-button
              :type="campsite.is_favorited ? 'warning' : 'primary'"
              class="action-btn"
              @click="handleFavorite"
              :disabled="!userStore.isLoggedIn"
            >
              <el-icon><StarFilled v-if="campsite.is_favorited" /><Star v-else /></el-icon>
              {{ campsite.is_favorited ? '已收藏' : '收藏' }}
            </el-button>
            <el-button class="action-btn" @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>

          <div class="card stats-card">
            <div class="stat-item">
              <el-icon :size="24"><View /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ campsite.view_count || 0 }}</span>
                <span class="stat-label">浏览次数</span>
              </div>
            </div>
            <div class="stat-item">
              <el-icon :size="24"><Star /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ reviewCount }}</span>
                <span class="stat-label">评价数量</span>
              </div>
            </div>
          </div>

          <div class="card tip-card">
            <el-icon :size="32" color="#e6a23c"><Warning /></el-icon>
            <p>请爱护环境，文明露营，带走所有垃圾</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCampsiteDetail, createReview, getReviews, toggleFavorite } from '@/api/campsite'
import { useUserStore } from '@/stores/user'
import type { Campsite, Review } from '@/types'

const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const campsite = ref<Campsite | null>(null)
const reviews = ref<Review[]>([])
const reviewCount = ref(0)
const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=400&fit=crop'

const newReview = reactive({
  rating: 5,
  content: ''
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await getCampsiteDetail(id, userStore.userInfo?.id)
    if (res.code === 200) {
      campsite.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchReviews = async () => {
  try {
    const id = Number(route.params.id)
    const res = await getReviews(id, { page: 1, page_size: 50 })
    if (res.code === 200) {
      reviews.value = res.data.items
      reviewCount.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  }
}

const submitReview = async () => {
  if (!newReview.content && newReview.rating === 5) {
    ElMessage.warning('请输入评价内容或选择评分')
    return
  }
  submitting.value = true
  try {
    const id = Number(route.params.id)
    const res = await createReview(userStore.userInfo!.id, {
      campsite_id: id,
      rating: newReview.rating,
      content: newReview.content
    })
    if (res.code === 200) {
      ElMessage.success('评价成功')
      newReview.content = ''
      newReview.rating = 5
      fetchReviews()
    }
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const id = Number(route.params.id)
    const res = await toggleFavorite(id, userStore.userInfo!.id)
    if (res.code === 200) {
      campsite.value!.is_favorited = res.data.is_favorited
      ElMessage.success(res.data.is_favorited ? '收藏成功' : '取消收藏')
    }
  } catch (error) {
    console.error(error)
  }
}

const handleShare = () => {
  ElMessage.success('链接已复制到剪贴板')
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
  return new Date(time).toLocaleDateString()
}

onMounted(() => {
  fetchDetail()
  fetchReviews()
})
</script>

<style scoped>
.campsite-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.main-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.main-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
}

.image-overlay h1 {
  font-size: 28px;
  margin-bottom: 12px;
}

.tags {
  display: flex;
  gap: 10px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  margin-bottom: 12px;
}

.facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.review-form {
  margin-bottom: 20px;
}

.review-form .el-rate {
  margin-bottom: 12px;
}

.review-form .el-input {
  margin-bottom: 12px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.review-user {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.review-time {
  color: #909399;
  font-size: 12px;
}

.review-content {
  color: #606266;
  line-height: 1.6;
}

.actions-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
}

.stats-card {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.tip-card {
  text-align: center;
  background: #fdf6ec;
}

.tip-card p {
  color: #e6a23c;
  margin-top: 10px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
