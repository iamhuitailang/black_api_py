<script setup lang="ts">
import { Home, ShoppingBag, Palette, Map, User } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', name: '大厅', icon: Home },
  { path: '/shop', name: '商店', icon: ShoppingBag },
  { path: '/dress', name: '装扮', icon: Palette },
  { path: '/maps', name: '地图', icon: Map },
  { path: '/profile', name: '我的', icon: User },
]

const currentPath = computed(() => route.path)

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-ice-100 z-50">
    <div class="max-w-lg mx-auto flex justify-around items-center h-16 px-4">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="navigate(item.path)"
        class="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200"
        :class="currentPath === item.path ? 'text-ice-500 scale-110' : 'text-gray-400 hover:text-gray-600'"
      >
        <component :is="item.icon" :size="24" />
        <span class="text-xs font-medium">{{ item.name }}</span>
      </button>
    </div>
  </nav>
</template>
