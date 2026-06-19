import { createRouter, createWebHashHistory } from 'vue-router'
import { useGameStore } from '../stores/game'

const routes = [
  {
    path: '/',
    name: 'SaveSlot',
    component: () => import('../views/SaveSlot.vue'),
  },
  {
    path: '/starmap',
    name: 'StarMap',
    component: () => import('../views/StarMap.vue'),
  },
  {
    path: '/station',
    name: 'Station',
    component: () => import('../views/Station.vue'),
  },
  {
    path: '/combat',
    name: 'Combat',
    component: () => import('../views/Combat.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const store = useGameStore()

  if (to.name !== 'SaveSlot') {
    if (!store.saveId) {
      next({ name: 'SaveSlot' })
      return
    }
    await store.ensureStateReady()
    if (to.name === 'StarMap') {
      await store.ensurePlanetsReady()
    }
  }
  next()
})

export default router
