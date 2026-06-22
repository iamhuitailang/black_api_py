<template>
  <div class="h-full overflow-y-auto bg-gradient-to-b from-amber-50 to-white">
    <div class="max-w-6xl mx-auto p-6">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div class="flex items-center gap-3">
            <BookOpen class="w-10 h-10" />
            <div>
              <h1 class="text-2xl font-bold">社区治理公示栏</h1>
              <p class="text-white/80 text-sm mt-1">已解决的优秀案例展示，共建和谐美好社区</p>
            </div>
          </div>
        </div>

        <div class="p-4 border-b flex items-center justify-between">
          <div class="flex gap-2">
            <button v-for="c in [{ key: '', name: '全部' }, ...categories]" :key="c.key"
                    @click="activeCategory = c.key; loadList()"
                    :class="['px-3 py-1.5 rounded-md text-sm transition',
                      activeCategory === c.key ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100']">
              {{ c.name }}
            </button>
          </div>
          <span class="text-sm text-gray-500">共 {{ pagination.total }} 条公示</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div v-for="o in opinions" :key="o.id"
             class="bg-white rounded-xl border hover:shadow-lg transition cursor-pointer overflow-hidden"
             @click="selectOpinion(o.id)">
          <div v-if="o.photos && o.photos.length" class="h-40 overflow-hidden bg-gray-100">
            <img :src="o.photos[0]" class="w-full h-full object-cover" />
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-gray-800 line-clamp-1">{{ o.title }}</h3>
              <div class="flex items-center gap-0.5 flex-shrink-0">
                <Star v-for="i in 5" :key="i"
                      :class="i <= (o.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'"
                      class="w-4 h-4" />
              </div>
            </div>
            <p class="text-sm text-gray-500 line-clamp-2 mb-3">{{ o.description }}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span class="inline-flex items-center gap-1">
                <User class="w-3.5 h-3.5" /> {{ o.submitter_name || '居民' }}
              </span>
              <span class="inline-flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" /> {{ o.response_days }}天响应
              </span>
              <span>{{ formatDate(o.closed_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!opinions.length" class="text-center text-gray-400 py-20">
        <BookOpen class="w-16 h-16 mx-auto mb-3 opacity-30" />
        <p class="text-sm">暂无公示内容</p>
      </div>

      <div v-if="pagination.total > pagination.page_size" class="flex justify-center gap-2 mt-6">
        <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1"
                class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          上一页
        </button>
        <span class="px-4 py-1.5 text-sm text-gray-600">{{ pagination.page }} / {{ pagination.total_pages }}</span>
        <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.total_pages"
                class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          下一页
        </button>
      </div>
    </div>

    <div v-if="detailVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="detailVisible = false">
      <div class="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-semibold text-gray-800">意见详情</h3>
          <button @click="detailVisible = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div v-if="selectedOpinion" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div class="flex items-start justify-between mb-2">
              <h2 class="text-lg font-semibold text-gray-800">{{ selectedOpinion.title }}</h2>
              <div class="flex items-center gap-0.5">
                <Star v-for="i in 5" :key="i"
                      :class="i <= (selectedOpinion.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'"
                      class="w-5 h-5" />
              </div>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-gray-500">
              <span>{{ selectedOpinion.category_name }}</span>
              <span>响应天数：{{ selectedOpinion.response_days }} 天</span>
              <span>{{ formatDate(selectedOpinion.closed_at) }}</span>
            </div>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-1">问题描述</h4>
            <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ selectedOpinion.description }}</p>
            <div v-if="selectedOpinion.photos && selectedOpinion.photos.length" class="mt-2 flex gap-2 flex-wrap">
              <img v-for="(p, i) in selectedOpinion.photos" :key="i" :src="p"
                   class="w-24 h-24 object-cover rounded border cursor-pointer"
                   @click="openPhoto(p)" />
            </div>
          </div>
          <div v-if="timelines.length">
            <h4 class="text-sm font-medium text-gray-700 mb-2">处理过程</h4>
            <TimelineView :timelines="timelines" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BookOpen, Star, User, Clock, X } from 'lucide-vue-next'
import TimelineView from '@/components/TimelineView.vue'
import { opinionApi } from '@/api'
import type { Category, Opinion, Timeline } from '@/types'

const categories = ref<Category[]>([])
const activeCategory = ref('')
const opinions = ref<Opinion[]>([])
const pagination = ref({ page: 1, page_size: 10, total: 0, total_pages: 0 })

const detailVisible = ref(false)
const selectedOpinion = ref<Opinion | null>(null)
const timelines = ref<Timeline[]>([])

onMounted(async () => {
  const res = await opinionApi.categories()
  if (res.code === 0) categories.value = res.data
  loadList()
})

async function loadList() {
  const res = await opinionApi.publicList({
    category: activeCategory.value || undefined,
    page: pagination.value.page,
    page_size: pagination.value.page_size
  })
  if (res.code === 0) {
    opinions.value = res.data.items
    pagination.value = {
      page: res.data.page,
      page_size: res.data.page_size,
      total: res.data.total,
      total_pages: res.data.total_pages
    }
  }
}

function changePage(p: number) {
  pagination.value.page = p
  loadList()
}

async function selectOpinion(id: number) {
  const res = await opinionApi.detail(id)
  if (res.code === 0) {
    selectedOpinion.value = res.data.opinion
    timelines.value = res.data.timelines || []
    detailVisible.value = true
  }
}

function formatDate(s: string) {
  if (!s) return ''
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function openPhoto(url: string) {
  window.open(url, '_blank')
}
</script>
