<template>
  <div v-if="opinion" class="h-full flex flex-col">
    <div class="p-4 border-b">
      <div class="flex items-start justify-between gap-2 mb-2">
        <h2 class="text-base font-semibold text-gray-800 flex-1">{{ opinion.title }}</h2>
        <span :class="statusClass" class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{{ opinion.status_name }}</span>
      </div>
      <div class="flex flex-wrap gap-2 text-xs text-gray-500">
        <span class="inline-flex items-center gap-1">
          <Tag class="w-3.5 h-3.5" /> {{ opinion.category_name }}
        </span>
        <span v-if="opinion.community" class="inline-flex items-center gap-1">
          <MapPin class="w-3.5 h-3.5" /> {{ opinion.community }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Clock class="w-3.5 h-3.5" /> {{ formatDate(opinion.created_at) }}
        </span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-2">问题描述</h4>
        <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{{ opinion.description }}</p>
        <div v-if="opinion.photos && opinion.photos.length" class="mt-3 flex gap-2 flex-wrap">
          <img v-for="(p, i) in opinion.photos" :key="i" :src="p"
               class="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
               @click="openPhoto(p)" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="bg-gray-50 p-3 rounded-lg">
          <div class="text-gray-500 mb-1">提交人</div>
          <div class="text-gray-800 font-medium">{{ opinion.submitter_name || '匿名' }}</div>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <div class="text-gray-500 mb-1">处理人</div>
          <div class="text-gray-800 font-medium">{{ opinion.handler_name || '待分配' }}</div>
        </div>
        <div v-if="opinion.response_days != null" class="bg-gray-50 p-3 rounded-lg">
          <div class="text-gray-500 mb-1">响应天数</div>
          <div class="text-gray-800 font-medium">{{ opinion.response_days }} 天</div>
        </div>
        <div v-if="opinion.rating" class="bg-amber-50 p-3 rounded-lg">
          <div class="text-gray-500 mb-1">满意度评分</div>
          <div class="flex items-center gap-0.5">
            <Star v-for="i in 5" :key="i"
                  :class="i <= opinion.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'"
                  class="w-4 h-4" />
          </div>
        </div>
      </div>

      <slot name="actions"></slot>

      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
          <History class="w-4 h-4" /> 处理时间线
        </h4>
        <TimelineView :timelines="timelines || []" />
      </div>
    </div>
  </div>
  <div v-else class="h-full flex items-center justify-center text-gray-400">
    <div class="text-center">
      <FileText class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p class="text-sm">请选择一条意见查看详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tag, MapPin, Clock, Star, History, FileText } from 'lucide-vue-next'
import TimelineView from './TimelineView.vue'
import type { Opinion, Timeline } from '@/types'

const props = defineProps<{
  opinion: Opinion | null
  timelines: Timeline[]
}>()

const statusClass = computed(() => {
  if (!props.opinion) return ''
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    claimed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    resolved: 'bg-green-100 text-green-700',
    escalated: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-600'
  }
  return map[props.opinion.status] || 'bg-gray-100 text-gray-600'
})

function formatDate(s: string) {
  if (!s) return ''
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function openPhoto(url: string) {
  window.open(url, '_blank')
}
</script>
