import { createRouter, createWebHashHistory } from 'vue-router'
import { storage } from '@/utils/storage'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/',
    name: 'Game',
    component: () => import('@/views/Game.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = storage.getToken()
  const user = storage.getUser()
  
  if (to.meta.requiresAuth && (!token || !user)) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token && user) {
    next('/')
  } else {
    next()
  }
})

export default router
