import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/game/:levelId?',
    name: 'Game',
    component: () => import('@/views/Game.vue')
  },
  {
    path: '/levels',
    name: 'Levels',
    component: () => import('@/views/Levels.vue')
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/views/Ranking.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
