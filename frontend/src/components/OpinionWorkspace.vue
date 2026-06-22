<template>
  <div class="flex h-full">
    <aside class="w-56 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
      <div class="p-4">
        <div class="relative mb-4">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="keyword" type="text" placeholder="搜索意见..."
                 class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                 @input="debounceSearch" />
        </div>

        <div class="space-y-1">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">意见类别</h3>
          <button
            v-for="c in categories" :key="c.key"
            @click="activeCategory = c.key; loadList()"
            :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2',
              activeCategory === c.key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50']">
            <component :is="categoryIcons[c.key] || MoreHorizontal" class="w-4 h-4" />
            {{ c.name }}
          </button>
        </div>

        <div class="mt-6 space-y-1">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">处理状态</h3>
          <button
            v-for="s in statuses" :key="s.key"
            @click="activeStatus = s.key; loadList()"
            :class="['w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between',
              activeStatus === s.key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50']">
            <span>{{ s.name }}</span>
          </button>
        </div>
      </div>
    </aside>

    <section class="flex-1 border-r border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
      <div class="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 class="font-medium text-gray-800">{{ listTitle }}</h2>
        <div class="flex items-center gap-2">
          <button v-if="showCreateBtn" @click="$emit('create')"
                  class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition flex items-center gap-1">
            <Plus class="w-4 h-4" /> 提交意见
          </button>
          <button @click="loadList()" class="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition">
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        <template v-if="loading">
          <div v-for="i in 5" :key="i" class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-pulse"></div>
            <div class="h-3 bg-gray-100 rounded w-full mb-1 animate-pulse"></div>
            <div class="h-3 bg-gray-100 rounded w-5/6 animate-pulse"></div>
          </div>
        </template>
        <template v-else-if="opinions.length">
          <OpinionCard v-for="o in opinions" :key="o.id" :opinion="o" :selected="selectedId === o.id"
                       @select="selectOpinion(o.id)" />
        </template>
        <template v-else>
          <div class="text-center text-gray-400 py-12">
            <Inbox class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p class="text-sm">暂无意见</p>
          </div>
        </template>
      </div>
      <div v-if="pagination.total > pagination.page_size" class="border-t border-gray-200 bg-white p-3 flex items-center justify-between">
        <span class="text-xs text-gray-500">共 {{ pagination.total }} 条</span>
        <div class="flex gap-1">
          <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1"
                  class="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            上一页
          </button>
          <span class="px-3 py-1 text-sm text-gray-600">{{ pagination.page }} / {{ pagination.total_pages }}</span>
          <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.total_pages"
                  class="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            下一页
          </button>
        </div>
      </div>
    </section>

    <aside class="w-[420px] bg-white overflow-y-auto flex-shrink-0">
      <slot name="detail" :opinion="selectedOpinion" :timelines="timelines" :rating="rating"></slot>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Search, Plus, RefreshCw, Inbox, MoreHorizontal, Leaf, ShieldCheck, Wrench } from 'lucide-vue-next'
import OpinionCard from './OpinionCard.vue'
import type { Opinion, Timeline, Rating, Category } from '@/types'

const props = defineProps<{
  listTitle: string
  showCreateBtn?: boolean
  categories: Category[]
  statuses: Array<{ key: string; name: string }>
  fetchList: (params: any) => Promise<any>
  fetchDetail?: (id: number) => Promise<any>
}>()

defineEmits<{
  (e: 'create'): void
  (e: 'select', opinion: Opinion, timelines: Timeline[], rating?: Rating): void
}>()

const categoryIcons: Record<string, any> = { environment: Leaf, security: ShieldCheck, facility: Wrench }

const keyword = ref('')
const activeCategory = ref('')
const activeStatus = ref('')
const loading = ref(false)
const opinions = ref<Opinion[]>([])
const pagination = ref({ page: 1, page_size: 20, total: 0, total_pages: 0 })
const selectedId = ref<number | null>(null)
const selectedOpinion = ref<Opinion | null>(null)
const timelines = ref<Timeline[]>([])
const rating = ref<Rating | undefined>(undefined)

let searchTimer: any = null
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadList(), 300)
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { page: pagination.value.page, page_size: pagination.value.page_size }
    if (activeCategory.value) params.category = activeCategory.value
    if (activeStatus.value) params.status = activeStatus.value
    if (keyword.value) params.keyword = keyword.value
    const res = await props.fetchList(params)
    if (res.code === 0) {
      opinions.value = res.data.items
      pagination.value = {
        page: res.data.page,
        page_size: res.data.page_size,
        total: res.data.total,
        total_pages: res.data.total_pages
      }
      if (opinions.value.length && !selectedId.value) {
        selectOpinion(opinions.value[0].id)
      }
    }
  } finally {
    loading.value = false
  }
}

function changePage(p: number) {
  pagination.value.page = p
  loadList()
}

async function selectOpinion(id: number) {
  selectedId.value = id
  if (!props.fetchDetail) return
  const res = await props.fetchDetail(id)
  if (res.code === 0) {
    selectedOpinion.value = res.data.opinion
    timelines.value = res.data.timelines || []
    rating.value = res.data.rating
  }
}

watch([activeCategory, activeStatus], () => {
  pagination.value.page = 1
})

onMounted(() => loadList())

defineExpose({ loadList, selectOpinion })
</script>
