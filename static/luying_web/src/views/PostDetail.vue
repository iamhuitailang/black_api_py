<template>
  <div class="post-detail" v-loading="loading">
    <el-page-header @back="$router.back()" title="帖子详情" class="page-header" />

    <div v-if="post" class="detail-content">
      <div class="post-header">
        <el-avatar :size="48" :src="post.avatar">
          {{ post.nickname?.[0] || 'U' }}
        </el-avatar>
        <div class="post-user">
          <span class="nickname">{{ post.nickname }}</span>
          <span class="time">{{ formatTime(post.created_at) }}</span>
        </div>
      </div>

      <h1 class="post-title">{{ post.title }}</h1>

      <p v-if="post.content" class="post-content">{{ post.content }}</p>

      <p v-if="post.location" class="post-location"><el-icon><Location /></el-icon> {{ post.location }}</p>

      <div class="post-actions">
        <span :class="{ liked: post.is_liked }" @click="handleLike">
          <el-icon><StarFilled v-if="post.is_liked" /><Star v-else /></el-icon>
          {{ post.like_count || 0 }}
        </span>
        <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
        <span><el-icon><ChatDotRound /></el-icon> {{ comments.length }}</span>
      </div>

      <div class="comment-section">
        <h3 class="section-title">评论 ({{ comments.length }})</h3>

        <div class="comment-input" v-if="userStore.isLoggedIn">
          <el-avatar :size="36" :src="userStore.userInfo?.avatar">
            {{ userStore.userInfo?.nickname?.[0] || 'U' }}
          </el-avatar>
          <div class="input-area">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="2"
              placeholder="写下你的评论..."
            />
            <el-button type="primary" @click="submitComment">发表</el-button>
          </div>
        </div>

        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <el-avatar :size="36" :src="comment.avatar">
              {{ comment.nickname?.[0] || 'U' }}
            </el-avatar>
            <div class="comment-content">
              <div class="comment-header">
                <span class="nickname">{{ comment.nickname }}</span>
                <span class="time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
          </div>
        </div>

        <el-empty v-if="comments.length === 0" description="暂无评论" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostDetail, getComments, createComment, toggleLike } from '@/api/community'
import { useUserStore } from '@/stores/user'
import type { Post, Comment } from '@/types'

const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const newComment = ref('')

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await getPostDetail(id, userStore.userInfo?.id)
    if (res.code === 200) {
      post.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const id = Number(route.params.id)
    const res = await getComments(id)
    if (res.code === 200) {
      comments.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn || !post.value) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await toggleLike(post.value.id, userStore.userInfo!.id)
    if (res.code === 200) {
      post.value.is_liked = res.data.is_liked
      post.value.like_count = res.data.is_liked
        ? (post.value.like_count || 0) + 1
        : Math.max(0, (post.value.like_count || 0) - 1)
    }
  } catch (error) {
    console.error(error)
  }
}

const submitComment = async () => {
  if (!newComment.value.trim() || !post.value) return
  try {
    const res = await createComment(userStore.userInfo!.id, {
      post_id: post.value.id,
      content: newComment.value
    })
    if (res.code === 200) {
      ElMessage.success('评论成功')
      newComment.value = ''
      fetchComments()
    }
  } catch (error) {
    console.error(error)
  }
}

const formatTime = (time?: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(() => {
  fetchDetail()
  fetchComments()
})
</script>

<style scoped>
.post-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.detail-content {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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
  font-size: 24px;
  margin-bottom: 16px;
}

.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 16px;
}

.post-location {
  color: #909399;
  margin-bottom: 20px;
}

.post-actions {
  display: flex;
  gap: 30px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 30px;
}

.post-actions span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  cursor: pointer;
}

.post-actions .liked {
  color: #f56c6c;
}

.comment-section {
  margin-top: 20px;
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.input-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-header .nickname {
  font-weight: 500;
}

.comment-header .time {
  color: #909399;
  font-size: 12px;
}

.comment-content p {
  color: #606266;
  line-height: 1.6;
}
</style>
