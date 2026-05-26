<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElPagination } from 'element-plus'
import { postApi, categoryApi, type Post, type Category } from '@/api/blog'
import PostCard from '@/components/PostCard.vue'
import { formatFromNow } from '@/utils/format'

const posts = ref<Post[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(8)
const loading = ref(false)
const activeCategory = ref<number | ''>('')

const loadPosts = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, page_size: pageSize.value, status: 1 }
    if (activeCategory.value) {
      params.category_id = activeCategory.value
    }
    const res = await postApi.list(params)
    posts.value = res.data.items || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  const res = await categoryApi.all()
  categories.value = res.data || []
}

const handlePageChange = (val: number) => {
  page.value = val
  loadPosts()
}

const filterByCategory = (catId: number | '') => {
  activeCategory.value = catId
  page.value = 1
  loadPosts()
}

onMounted(() => {
  loadPosts()
  loadCategories()
})
</script>

<template>
  <div class="home-page">
    <section class="hero card" v-loading="false">
      <div class="hero-inner">
        <h1 class="hero-title title-1">记录思考 · 分享洞见</h1>
        <p class="hero-subtitle soft">一个极简的个人博客，专注于内容创作与阅读体验</p>
      </div>
    </section>

    <section class="layout-grid">
      <div class="main-column">
        <div class="section-header">
          <h2 class="section-title title-2">最新文章</h2>
          <div class="category-tabs">
            <span :class="['tab', { active: activeCategory === '' }]" @click="filterByCategory('')">全部</span>
            <span
              v-for="cat in categories.slice(0, 6)"
              :key="cat.id"
              :class="['tab', { active: activeCategory === cat.id }]"
              @click="filterByCategory(cat.id)"
            >
              {{ cat.name }}
            </span>
          </div>
        </div>
        <div class="post-list" v-loading="loading">
          <PostCard v-for="post in posts" :key="post.id" :post="post" />
          <el-empty v-if="!loading && posts.length === 0" description="暂无文章" />
        </div>
        <div class="pagination-wrap" v-if="total > 0">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :total="total"
            :current-page="page"
            :page-size="pageSize"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <aside class="side-column">
        <div class="card side-card">
          <h3 class="side-title">关于</h3>
          <p class="soft" style="font-size: 14px; line-height: 1.7">
            欢迎来到我的个人博客。这里记录我的技术笔记、阅读感想和生活思考。
            写作是最好的思考方式，分享是最好的学习路径。
          </p>
        </div>

        <div class="card side-card">
          <h3 class="side-title">分类</h3>
          <div class="category-list">
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="category-item"
              :class="{ active: activeCategory === cat.id }"
              @click="filterByCategory(cat.id)"
            >
              <span class="name">{{ cat.name }}</span>
              <span class="count">{{ cat.post_count || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="card side-card">
          <h3 class="side-title">热门文章</h3>
          <div class="popular-list">
            <div v-for="(post, index) in posts.slice(0, 5)" :key="post.id" class="popular-item">
              <span class="rank" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
              <div class="info">
                <p class="title">{{ post.title }}</p>
                <span class="muted" style="font-size: 12px">{{ formatFromNow(post.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  display: block;
}

.hero {
  padding: 56px 48px;
  margin-bottom: 28px;
  text-align: center;
  background: linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-bg-elevated) 100%);
  border: 1px solid var(--color-border-soft);
}

.hero-title {
  margin: 0 0 12px;
  letter-spacing: 0.5px;
}

.hero-subtitle {
  font-size: 16px;
  margin: 0;
}

.layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 28px;
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
  .hero {
    padding: 36px 20px;
  }
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 12px;
}

.category-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);

  .tab {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    color: var(--color-text-soft);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-bg-soft);
      color: var(--color-text);
    }

    &.active {
      background: var(--color-primary);
      color: #fff;
    }
  }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.side-card {
  padding: 20px 22px;
  margin-bottom: 20px;
}

.side-title {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-soft);
  transition: background 0.2s ease;

  &:hover {
    background: var(--color-bg-soft);
    color: var(--color-text);
  }

  &.active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  .count {
    background: var(--color-bg-soft);
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
  }
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popular-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
  padding: 4px 0;

  .rank {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: var(--color-bg-soft);
    color: var(--color-text-mute);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
    margin-top: 2px;

    &.top3 {
      background: var(--color-primary);
      color: #fff;
    }
  }

  .info {
    min-width: 0;
    flex: 1;

    .title {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--color-text);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  &:hover .info .title {
    color: var(--color-primary);
  }
}
</style>
