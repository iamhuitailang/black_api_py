import { createRouter, createWebHistory } from 'vue-router'
import FortressGame from '@/pages/FortressGame.vue'

const routes = [
  {
    path: '/',
    name: 'game',
    component: FortressGame,
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
