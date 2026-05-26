<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElTabs } from 'element-plus'
import type { TabPaneName } from 'element-plus'
import { EditPen, Collection } from '@element-plus/icons-vue'
import { categoryApi, tagApi, postApi, type Category, type Tag, type Post } from '@/api/blog'
import PostCard from '@/components/PostCard.vue'

const activeTab = ref<string>('category')
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const selectedCategory = ref<number | null>(null)
const selectedTag = ref<number | null>(null)
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const loadCategories = async () => {
  const res = await categoryApi.all()
  categories.value = res.data || []
}

const loadTags = async () => {
  const res = await tagApi.all()
  tags.value = res.data || []
}

const loadPosts = async () => {
  const params: Record<string, unknown> = { page: page.value, page_size: pageSize.value, status: 1 }
  if (activeTab.value === 'category' && selectedCategory.value) {
    params.category_id = selectedCategory.value
  }
  if (activeTab.value === 'tag' && selectedTag.value) {
    params.tag_id = selectedTag.value
  }
  const res = await postApi.list(params)
  posts.value = res.data.items || []
  total.value = res.data.total || 0
}

const handleTabChange = (name: TabPaneName) => {
  const tabName = String(name)
  activeTab.value = tabName
  selectedCategory.value = null
  selectedTag.value = null
  page.value = 1
  loadPosts()
}

const selectCategory = (id: number) => {
  selectedCategory.value = selectedCategory.value === id ? null : id
  page.value = 1
  loadPosts()
}

const selectTag = (id: number) => {
  selectedTag.value = selectedTag.value === id ? null : id
  page.value = 1
  loadPosts()
}

onMounted(() => {
  loadCategories()
  loadTags()
  loadPosts()
})
</script>

<template>
  <div class="categories-page">
    <header class="page-header">
      <h1 class="page-title title-1">分类与标签</h1>
      <p class="soft">按照分类或标签浏览，找到感兴趣的内容</p>
    </header>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="main-tabs">
      <el-tab-pane label="分类" name="category">
        <div class="group-list">
          <div
            v-for="cat in categories"
            :key="cat.id"
            :class="['group-card', 'card', { active: selectedCategory === cat.id }]"
            @click="selectCategory(cat.id)"
          >
            <div class="group-header" :style="cat.color ? { borderColor: cat.color } : undefined">
              <span class="icon" :style="cat.color ? { background: cat.color + '20', color: cat.color } : undefined">
                <el-icon><Collection /></el-icon>
              </span>
              <div>
                <h3 class="name">{{ cat.name }}</h3>
                <p class="muted" style="font-size: 12px; margin: 0">{{ cat.post_count || 0 }} 篇文章</p>
              </div>
            </div>
            <p class="desc soft" v-if="cat.description">{{ cat.description }}</p>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="标签" name="tag">
        <div class="tags-cloud">
          <span
            v-for="tag in tags"
            :key="tag.id"
            :class="['tag-item', { active: selectedTag === tag.id }]"
            :style="tag.color ? { background: tag.color + '15', color: tag.color, borderColor: tag.color } : undefined"
            @click="selectTag(tag.id)"
          >
            # {{ tag.name }}
            <small style="opacity: 0.7; margin-left: 4px">{{ tag.post_count || 0 }}</small>
          </span>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="results" v-if="posts.length > 0">
      <h3 class="section-title title-2">相关文章 ({{ total }})</h3>
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>

    <el-empty v-else-if="selectedCategory || selectedTag" description="没有找到相关文章" />
  </div>
</template>

<style lang="scss" scoped>
.categories-page {
  max-width: 920px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;

  .page-title {
    margin: 0 0 8px;
  }
}

.main-tabs {
  margin-bottom: 24px;
}

.group-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.group-card {
  padding: 20px;
  cursor: pointer;
  border: 1px solid var(--color-border-soft);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }
}

.group-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-soft);

  .icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 20px;
  }

  .name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.desc {
  font-size: 13px;
  margin: 0;
  line-height: 1.6;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 32px;
  justify-content: center;
}

.tag-item {
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-soft);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary);
    color: #fff !important;
    border-color: var(--color-primary);
  }
}

.section-title {
  margin: 24px 0 16px;
  font-size: 20px;
}

.results {
  margin-top: 16px;
}
</style>
