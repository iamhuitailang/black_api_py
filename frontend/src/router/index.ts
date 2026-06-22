import { createRouter, createWebHistory } from 'vue-router'
import { getUser } from '@/api'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/resident',
    name: 'resident',
    component: () => import('@/pages/ResidentPage.vue'),
    meta: { role: 'resident' },
  },
  {
    path: '/staff',
    name: 'staff',
    component: () => import('@/pages/StaffPage.vue'),
    meta: { role: 'staff' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/AdminPage.vue'),
    meta: { role: 'admin' },
  },
  {
    path: '/public',
    name: 'public',
    component: () => import('@/pages/PublicBoard.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const user = getUser()
  if (to.meta.role) {
    if (!user) {
      next({ path: '/login' })
      return
    }
    if (to.meta.role !== user.role) {
      if (user.role === 'admin') next({ path: '/admin' })
      else if (user.role === 'staff') next({ path: '/staff' })
      else next({ path: '/resident' })
      return
    }
  }
  next()
})

export default router
