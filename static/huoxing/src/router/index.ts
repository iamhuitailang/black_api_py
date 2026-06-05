import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import LaunchView from '@/views/LaunchView.vue'
import MarsHallView from '@/views/MarsHallView.vue'
import BaseView from '@/views/BaseView.vue'
import ExploreView from '@/views/ExploreView.vue'
import TechView from '@/views/TechView.vue'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import { hasSavedGame } from '@/utils/storage'

const routes = [
  {
    path: '/',
    name: 'launch',
    component: LaunchView,
  },
  {
    path: '/hall',
    name: 'hall',
    component: MarsHallView,
    meta: { requiresAuth: true },
  },
  {
    path: '/base',
    name: 'base',
    component: BaseView,
    meta: { requiresAuth: true },
  },
  {
    path: '/explore',
    name: 'explore',
    component: ExploreView,
    meta: { requiresAuth: true },
  },
  {
    path: '/tech',
    name: 'tech',
    component: TechView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let gameInitialized = false

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  if (to.meta.requiresAuth && !gameInitialized) {
    if (hasSavedGame()) {
      const gameStore = useGameStore()
      if (gameStore.loadSavedGame()) {
        gameEngine.init(gameStore)
        gameEngine.start()
        gameInitialized = true
        next()
      } else {
        next('/')
      }
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export function setGameInitialized(value: boolean) {
  gameInitialized = value
}

export default router
