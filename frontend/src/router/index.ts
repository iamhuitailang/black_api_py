import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import { getToken, api } from '@/utils/api'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/about',
    name: 'about',
    component: {
      template: '<div class="text-center text-xl p-8">About Page - Coming Soon</div>',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const token = getToken()
  if (to.name === 'login') {
    if (token) {
      try {
        const res = await api.checkAuth()
        if (res.code === 0) {
          next({ name: 'home' })
          return
        }
      } catch {}
    }
    next()
    return
  }
  if (!token) {
    next({ name: 'login' })
    return
  }
  next()
})

export default router
