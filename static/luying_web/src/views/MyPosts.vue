<template>
  <div class="my-posts">
    <h1 class="page-title">我的帖子</h1>

    <div class="post-list" v-loading="loading">
      <div v-for="post in list" :key="post.id" class="post-card pointer" @click="goDetail(post.id)">
        <div class="post-header">
          <h2 class="post-title text-ellipsis">{{ post.title }}</h2>
          <span class="time">{{ formatTime(post.created_at) }}</span>
        </div>
        <p class="post-content">{{ post.content }}</p>
        <div class="post-stats">
          <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
          <span><el-icon><Star /></el-icon> {{ post.like_count || 0 }}</span>
          <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
        </div>
        <div class="post-actions">
          <el-button size="small" type="danger" @click.stop="handleDelete(post.id)">删除</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && list.length === 0" description="暂无帖子" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostList, deletePost } from '@/api/community'
import { useUserStore } from '@/stores/user'
import type { Post } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const list = ref<Post[]>([])

const fetchList = async () => {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await getPostList({ user_id: userStore.userInfo!.id })
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
  router.push(`/post/${id}`)
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这个帖子吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deletePost(id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchList()
      }
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const formatTime = (time?: string) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString()
}

onMounted(fetchList)
</script>

<style scoped>
.my-posts {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.post-title {
  font-size: 18px;
  flex: 1;
  margin-right: 20px;
}

.time {
  color: #909399;
  font-size: 14px;
}

.post-content {
  color: #606266;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-stats {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

.post-actions {
  text-align: right;
}
</style>
