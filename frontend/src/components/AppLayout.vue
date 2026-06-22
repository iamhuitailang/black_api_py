<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <MessageSquare class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-semibold text-gray-800">社区意见处理平台</h1>
          <p class="text-xs text-gray-500">{{ roleName }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button
          v-for="item in navItems"
          :key="item.key"
          @click="$emit('navigate', item.key)"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition',
            currentPage === item.key
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-100'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 inline mr-1.5" />
          {{ item.label }}
        </button>
        <div class="h-6 w-px bg-gray-200"></div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User class="w-4 h-4 text-gray-600" />
          </div>
          <span class="text-sm text-gray-700">{{ user?.real_name || user?.username }}</span>
        </div>
        <button
          @click="handleLogout"
          class="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition"
        >
          <LogOut class="w-4 h-4 inline mr-1" />
          退出
        </button>
      </div>
    </header>
    <div class="flex-1 overflow-hidden">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  MessageSquare, User, LogOut, FileText, PlusCircle, Inbox, ClipboardList,
  Database, BarChart3, FileBarChart, BookOpen
} from 'lucide-vue-next'
import { getUser, clearToken, authApi } from '@/api'
import type { Component } from 'vue'

const props = defineProps<{
  role: 'resident' | 'staff' | 'admin'
  currentPage: string
}>()

defineEmits<{
  (e: 'navigate', key: string): void
}>()

const router = useRouter()
const user = getUser()

const roleName = computed(() => {
  const map = { resident: '居民端', staff: '工作人员端', admin: '街道管理员端' }
  return map[props.role]
})

const navItems = computed<Array<{ key: string; label: string; icon: Component }>>(() => {
  if (props.role === 'resident') {
    return [
      { key: 'list', label: '我的意见', icon: FileText },
      { key: 'submit', label: '提交意见', icon: PlusCircle },
      { key: 'public', label: '公示栏', icon: BookOpen }
    ]
  } else if (props.role === 'staff') {
    return [
      { key: 'pending', label: '待认领', icon: Inbox },
      { key: 'my', label: '我的任务', icon: ClipboardList },
      { key: 'public', label: '公示栏', icon: BookOpen }
    ]
  } else {
    return [
      { key: 'all', label: '全量数据', icon: Database },
      { key: 'stats', label: '统计分析', icon: BarChart3 },
      { key: 'report', label: '月度报告', icon: FileBarChart },
      { key: 'public', label: '公示栏', icon: BookOpen }
    ]
  }
})

async function handleLogout() {
  try {
    await authApi.logout()
  } catch (e) {}
  clearToken()
  router.push('/login')
}
</script>
