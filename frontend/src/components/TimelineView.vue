<template>
  <div class="space-y-0">
    <div v-for="(item, idx) in timelines" :key="item.id" class="relative pl-8 pb-6 last:pb-0">
      <div v-if="idx < timelines.length - 1" class="absolute left-3 top-6 w-0.5 h-full bg-gray-200"></div>
      <div class="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center"
           :class="typeBg[item.type] || 'bg-gray-200'">
        <component :is="typeIcon[item.type] || Circle" class="w-3.5 h-3.5 text-white" />
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-gray-800">{{ item.type_name }}</span>
          <span class="text-xs text-gray-400">{{ formatDate(item.created_at) }}</span>
        </div>
        <div v-if="item.operator_name" class="text-xs text-gray-500 mb-1">{{ item.operator_name }}</div>
        <div v-if="item.content" class="text-sm text-gray-600 whitespace-pre-wrap">{{ item.content }}</div>
        <div v-if="item.photos && item.photos.length" class="mt-2 flex gap-2 flex-wrap">
          <img v-for="(p, i) in item.photos" :key="i" :src="p" class="w-20 h-20 object-cover rounded border" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageSquarePlus, UserCheck, Wrench, CheckCircle2, AlertTriangle, Star, XCircle, StickyNote, Circle } from 'lucide-vue-next'
import type { Timeline } from '@/types'

defineProps<{
  timelines: Timeline[]
}>()

const typeIcon: Record<string, any> = {
  submit: MessageSquarePlus,
  assign: UserCheck,
  claim: UserCheck,
  process: Wrench,
  resolve: CheckCircle2,
  escalate: AlertTriangle,
  rating: Star,
  close: XCircle,
  note: StickyNote
}

const typeBg: Record<string, string> = {
  submit: 'bg-indigo-500',
  assign: 'bg-blue-500',
  claim: 'bg-blue-500',
  process: 'bg-indigo-400',
  resolve: 'bg-green-500',
  escalate: 'bg-red-500',
  rating: 'bg-amber-500',
  close: 'bg-gray-500',
  note: 'bg-gray-400'
}

function formatDate(s: string) {
  if (!s) return ''
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
