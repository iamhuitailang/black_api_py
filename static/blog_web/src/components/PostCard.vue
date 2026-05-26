<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Clock, View, Comment, PriceTag, ArrowRight } from '@element-plus/icons-vue'
import type { Post } from '@/api/blog'
import { formatFromNow, excerpt } from '@/utils/format'

const props = defineProps<{
  post: Post
}>()

const router = useRouter()

const goDetail = () => {
  router.push({ name: 'PostDetail', params: { id: props.post.id } })
}
</script>

<template>
  <article class="post-card card" @click="goDetail">
    <div class="card-body">
      <div class="card-header">
        <div class="meta">
          <span class="badge" v-if="post.category" :style="post.category.color ? { background: post.category.color + '20', color: post.category.color } : undefined">
            {{ post.category.name }}
          </span>
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            {{ formatFromNow(post.published_at || post.created_at) }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            {{ post.view_count || 0 }}
          </span>
          <span class="meta-item">
            <el-icon><Comment /></el-icon>
            {{ post.comment_count || 0 }}
          </span>
        </div>
      </div>
      <h3 class="card-title">{{ post.title }}</h3>
      <p class="card-summary soft">{{ excerpt(post.summary || post.content || '') }}</p>
      <div class="card-footer">
        <div class="tags">
          <span class="badge tag" v-for="tag in (post.tags || []).slice(0, 3)" :key="tag.id" :style="tag.color ? { background: tag.color + '15', color: tag.color } : undefined">
            <el-icon size="12"><PriceTag /></el-icon>
            {{ tag.name }}
          </span>
        </div>
        <span class="read-more">
          阅读全文 <el-icon><ArrowRight /></el-icon>
        </span>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.post-card {
  cursor: pointer;
  padding: 24px 28px;
  margin-bottom: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

.card-header {
  margin-bottom: 12px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--color-text-mute);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-title {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--color-text);
  line-height: 1.4;
}

.card-summary {
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
