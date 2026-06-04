import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'MainMenu',
    component: () => import('../views/MainMenu.vue')
  },
  {
    path: '/level-select',
    name: 'LevelSelect',
    component: () => import('../views/LevelSelect.vue')
  },
  {
    path: '/game/:levelId',
    name: 'Game',
    component: () => import('../views/GameView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
