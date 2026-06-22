<template>
  <div class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition cursor-pointer"
       :class="{ 'border-indigo-500 bg-indigo-50': selected }"
       @click="$emit('select')">
    <div class="flex items-start justify-between mb-2">
      <h3 class="font-medium text-gray-800 text-sm line-clamp-1 flex-1">{{ opinion.title }}</h3>
      <span :class="statusClass" class="text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">{{ opinion.status_name }}</span>
    </div>
    <p class="text-xs text-gray-500 mb-3 line-clamp-2">{{ opinion.description }}</p>
    <div class="flex items-center justify-between text-xs text-gray-400">
      <span class="flex items-center gap-1">
        <component :is="categoryIcon" class="w-3.5 h-3.5" />
        {{ opinion.category_name }}
      </span>
      <span>{{ formatDate(opinion.created_at) }}</span>
    </div>
    <div v-if="opinion.rating" class="mt-2 flex items-center gap-0.5">
      <Star v-for="i in 5" :key="i"
            :class="i <= opinion.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'"
            class="w-3.5 h-3.5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, Leaf, ShieldCheck, Wrench, MoreHorizontal } from 'lucide-vue-next'
import type { Opinion } from '@/types'

const props = defineProps<{
  opinion: Opinion
  selected?: boolean
}>()

defineEmits<{
  (e: 'select'): void
}>()

const categoryIcon = computed(() => {
  const map: Record<string, any> = {
    environment: Leaf,
    security: ShieldCheck,
    facility: Wrench
  }
  return map[props.opinion.category] || MoreHorizontal
})

const statusClass = computed(() => {
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
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
