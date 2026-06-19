import { createRouter, createWebHashHistory } from 'vue-router'

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

router.beforeEach((to, from, next) => {
  if (to.name !== 'SaveSlot') {
    const saveId = localStorage.getItem('current_save_id')
    if (!saveId) {
      next({ name: 'SaveSlot' })
      return
    }
  }
  next()
})

export default router
