import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/',
    name: 'Game',
    component: () => import('../views/Game.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cats',
    name: 'Cats',
    component: () => import('../views/Cats.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/menu',
    name: 'Menu',
    component: () => import('../views/Menu.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../views/Shop.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('../views/Activities.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

let initialized = false

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
    return
  }
  
  if ((to.path === '/login' || to.path === '/register') && userStore.token) {
    next('/')
    return
  }
  
  if (!initialized && userStore.token && to.path === '/') {
    const savedRoute = userStore.currentRoute
    if (savedRoute && savedRoute !== '/' && savedRoute !== '/login' && savedRoute !== '/register') {
      initialized = true
      next(savedRoute)
      return
    }
  }
  
  initialized = true
  
  if (to.meta.requiresAuth && userStore.token) {
    userStore.setCurrentRoute(to.path)
  }
  
  next()
})

router.afterEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && userStore.token && initialized) {
    userStore.setCurrentRoute(to.path)
  }
})

export default router
