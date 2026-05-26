<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import { searchApi, type Post } from '@/api/blog'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const doSearch = async () => {
  if (!keyword.value.trim()) {
    posts.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const res = await searchApi.posts(keyword.value.trim(), { page: page.value, page_size: pageSize.value })
    posts.value = res.data.items || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  router.replace({ query: { q: keyword.value.trim() } })
}

watch(
  () => route.query.q,
  (val) => {
    keyword.value = typeof val === 'string' ? val : ''
    doSearch()
  },
  { immediate: true }
)

onMounted(() => {
  if (!route.query.q && keyword.value) {
    doSearch()
  }
})
</script>

<template>
  <div class="search-page">
    <header class="search-header">
      <h1 class="title-1">搜索</h1>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="输入关键词搜索文章标题或内容..."
          size="large"
          :prefix-icon="SearchIcon"
          clearable
          @keyup.enter="handleSearch"
          @clear="doSearch"
        />
        <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
      </div>
    </header>

    <section class="search-results" v-loading="loading">
      <div v-if="keyword && total > 0" class="result-info muted" style="margin-bottom: 16px">
        找到 {{ total }} 篇关于 “{{ keyword }}” 的文章
      </div>
      <div v-if="keyword && posts.length === 0 && !loading" class="no-result">
        <el-empty description="没有找到相关内容，换个关键词试试吧" />
      </div>
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  max-width: 820px;
  margin: 0 auto;
}

.search-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    margin: 0 0 20px;
  }

  .search-bar {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
}

.no-result {
  padding: 48px 0;
}
</style>
