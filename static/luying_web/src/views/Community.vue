<template>
  <div class="community-page">
    <div class="page-header flex-between">
      <h1 class="page-title">社区</h1>
      <el-button type="primary" @click="showPostDialog = true" :disabled="!userStore.isLoggedIn">
        <el-icon><Edit /></el-icon>
        发布帖子
      </el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索帖子"
        clearable
        style="width: 300px"
        @keyup.enter="fetchList"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="fetchList">搜索</el-button>
    </div>

    <div class="post-list" v-loading="loading">
      <div v-for="post in list" :key="post.id" class="post-card pointer" @click="goDetail(post.id)">
        <div class="post-header">
          <el-avatar :size="40" :src="post.avatar">
            {{ post.nickname?.[0] || 'U' }}
          </el-avatar>
          <div class="post-user">
            <span class="nickname">{{ post.nickname }}</span>
            <span class="time">{{ formatTime(post.created_at) }}</span>
          </div>
          <el-button
            v-if="userStore.isLoggedIn && post.user_id !== userStore.userInfo?.id"
            size="small"
            @click.stop="handleFollow(post.user_id)"
          >
            关注
          </el-button>
        </div>
        <h2 class="post-title">{{ post.title }}</h2>
        <p class="post-content">{{ post.content }}</p>
        <p v-if="post.location" class="post-location"><el-icon><Location /></el-icon> {{ post.location }}</p>
        <div class="post-stats">
          <span><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
          <span :class="{ liked: post.is_liked }" @click.stop="handleLike(post)">
            <el-icon><StarFilled v-if="post.is_liked" /><Star v-else /></el-icon>
            {{ post.like_count || 0 }}
          </span>
          <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && list.length === 0" description="暂无帖子" />

    <el-dialog v-model="showPostDialog" title="发布帖子" width="600px">
      <el-form :model="postForm" :rules="postRules" ref="postFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" placeholder="给你的帖子起个标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="postForm.content"
            type="textarea"
            :rows="6"
            placeholder="分享你的露营故事..."
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-input v-model="postForm.images" placeholder="图片URL（多张用逗号分隔）" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="postForm.location" placeholder="露营地点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPostDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getPostList, createPost, toggleLike, toggleFollow } from '@/api/community'
import { useUserStore } from '@/stores/user'
import type { Post } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const list = ref<Post[]>([])
const keyword = ref('')
const showPostDialog = ref(false)
const postFormRef = ref<FormInstance>()

const postForm = reactive({
  title: '',
  content: '',
  images: '',
  location: ''
})

const postRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getPostList({
      keyword: keyword.value || undefined,
      current_user_id: userStore.userInfo?.id
    })
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

const handleLike = async (post: Post) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await toggleLike(post.id, userStore.userInfo!.id)
    if (res.code === 200) {
      post.is_liked = res.data.is_liked
      post.like_count = res.data.is_liked ? (post.like_count || 0) + 1 : Math.max(0, (post.like_count || 0) - 1)
    }
  } catch (error) {
    console.error(error)
  }
}

const handleFollow = async (userId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await toggleFollow(userId, userStore.userInfo!.id)
    if (res.code === 200) {
      ElMessage.success(res.data.is_following ? '关注成功' : '取消关注')
    }
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = async () => {
  const valid = await postFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res = await createPost(userStore.userInfo!.id, postForm)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      showPostDialog.value = false
      fetchList()
      Object.assign(postForm, {
        title: '',
        content: '',
        images: '',
        location: ''
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
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

onMounted(fetchList)
</script>

<style scoped>
.community-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.post-list {
  display: flex;
  flex-direction: column;
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
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-user {
  flex: 1;
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
  font-size: 18px;
  margin-bottom: 8px;
}

.post-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-location {
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

.post-stats {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.post-stats .liked {
  color: #f56c6c;
}
</style>
