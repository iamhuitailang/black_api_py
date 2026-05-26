<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElButton, ElMessage } from 'element-plus'
import { Share, Star, View, Comment as CommentIcon, Clock, ArrowLeft, EditPen } from '@element-plus/icons-vue'
import { postApi, type Post } from '@/api/blog'
import { commentApi, type Comment } from '@/api/comment'
import { formatDate, formatFromNow } from '@/utils/format'
import { useUserStore } from '@/stores'

const route = useRoute()
const userStore = useUserStore()

const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(false)
const commentContent = ref('')
const submitting = ref(false)

const postId = computed(() => Number(route.params.id))

const loadPost = async () => {
  if (!postId.value) return
  loading.value = true
  try {
    const res = await postApi.detail(postId.value)
    post.value = res.data
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  if (!postId.value) return
  const res = await commentApi.list(postId.value, { page: 1, page_size: 100 })
  comments.value = (res.data as any)?.items || []
}

const handleLike = async () => {
  if (!post.value) return
  await postApi.like(post.value.id)
  post.value.like_count = (post.value.like_count || 0) + 1
  ElMessage.success('已点赞')
}

const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  if (!userStore.user) {
    ElMessage.warning('请先登录')
    return
  }
  submitting.value = true
  try {
    await commentApi.create({
      post_id: postId.value,
      content: commentContent.value.trim()
    })
    ElMessage.success('评论成功')
    commentContent.value = ''
    loadComments()
  } finally {
    submitting.value = false
  }
}

const handleShare = async (type: string) => {
  if (!post.value) return
  const url = window.location.href
  if (type === 'copy') {
    try {
      await navigator.clipboard.writeText(url)
      ElMessage.success('链接已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }
}

onMounted(() => {
  loadPost()
  loadComments()
})
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <div class="back-bar" v-if="post">
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <el-button
        v-if="userStore.user?.id === post.user_id"
        type="primary"
        text
        @click="$router.push({ name: 'EditorEdit', params: { id: post.id } })"
      >
        <el-icon><EditPen /></el-icon>
        编辑文章
      </el-button>
    </div>

    <article v-if="post" class="article card">
      <header class="article-header">
        <h1 class="article-title title-1">{{ post.title }}</h1>
        <div class="article-meta">
          <div class="meta-left">
            <span class="badge" v-if="post.category" :style="post.category.color ? { background: post.category.color + '20', color: post.category.color } : undefined">
              {{ post.category.name }}
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ formatDate(post.published_at || post.created_at, 'YYYY年MM月DD日') }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ post.view_count || 0 }} 阅读
            </span>
            <span class="meta-item">
              <el-icon><CommentIcon /></el-icon>
              {{ comments.length }} 评论
            </span>
          </div>
          <div class="meta-right">
            <span class="meta-item">
              <el-avatar :size="24" :src="post.author?.avatar">{{ post.author?.nickname?.[0] }}</el-avatar>
              {{ post.author?.nickname || post.author?.username }}
            </span>
          </div>
        </div>
      </header>

      <div class="article-content prose">
        <div v-html="post.content || ''" class="markdown-body"></div>
      </div>

      <footer class="article-footer">
        <div class="tags">
          <span class="badge tag" v-for="tag in post.tags" :key="tag.id" :style="tag.color ? { background: tag.color + '15', color: tag.color } : undefined">
            # {{ tag.name }}
          </span>
        </div>
        <div class="article-actions">
          <el-button :icon="Star" @click="handleLike">
            点赞 {{ post.like_count || 0 }}
          </el-button>
          <el-dropdown trigger="click" @command="handleShare">
            <el-button :icon="Share">分享</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="copy">复制链接</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </footer>
    </article>

    <section class="comments-section card" v-if="post">
      <h3 class="section-title title-2">评论 ({{ comments.length }})</h3>
      <div class="comment-input">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          :placeholder="userStore.user ? '写下你的评论...' : '请先登录后评论'"
          :disabled="!userStore.user"
        />
        <div class="comment-actions">
          <el-button type="primary" :loading="submitting" @click="handleSubmitComment">发表评论</el-button>
        </div>
      </div>
      <div class="comment-list">
        <div class="empty" v-if="comments.length === 0">暂无评论，来发表第一条评论吧~</div>
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <el-avatar :size="32" :src="comment.user?.avatar">{{ comment.user?.nickname?.[0] }}</el-avatar>
            <div class="info">
              <span class="name">{{ comment.user?.nickname || comment.user?.username || '匿名' }}</span>
              <span class="time muted">{{ formatFromNow(comment.created_at) }}</span>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-actions-row">
            <el-button text size="small">
              <el-icon><Star /></el-icon>
              {{ comment.like_count || 0 }}
            </el-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.detail-page {
  max-width: 820px;
  margin: 0 auto;
}

.back-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.article {
  padding: 48px 56px;

  @media (max-width: 700px) {
    padding: 28px 20px;
  }
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-soft);
}

.article-title {
  margin: 0 0 16px;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--color-text-mute);

  .meta-left,
  .meta-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.article-content {
  min-height: 300px;
  margin-bottom: 32px;
}

.article-footer {
  padding-top: 24px;
  border-top: 1px solid var(--color-border-soft);

  .tags {
    margin-bottom: 16px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 3px 10px;
    }
  }

  .article-actions {
    display: flex;
    gap: 10px;
  }
}

.comments-section {
  margin-top: 24px;
  padding: 32px 40px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 20px;
}

.comment-input {
  margin-bottom: 24px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty {
  text-align: center;
  color: var(--color-text-mute);
  padding: 32px 0;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border-soft);

  &:last-child {
    border-bottom: none;
  }
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .name {
      font-weight: 500;
      font-size: 14px;
      color: var(--color-text);
    }

    .time {
      font-size: 12px;
    }
  }
}

.comment-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-soft);
  margin-bottom: 6px;
}

.comment-actions-row {
  display: flex;
  gap: 12px;
  color: var(--color-text-mute);
  font-size: 12px;
}
</style>
