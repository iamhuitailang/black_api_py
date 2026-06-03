import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/garage',
    name: 'Garage',
    component: () => import('@/views/Garage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/design',
    name: 'Design',
    component: () => import('@/views/Design.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/parts',
    name: 'PartsShop',
    component: () => import('@/views/PartsShop.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/research',
    name: 'Research',
    component: () => import('@/views/Research.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/windtunnel',
    name: 'WindTunnel',
    component: () => import('@/views/WindTunnel.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/paint',
    name: 'Paint',
    component: () => import('@/views/Paint.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/races',
    name: 'Races',
    component: () => import('@/views/Races.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team',
    name: 'Team',
    component: () => import('@/views/Team.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  },
  {
    path: '/',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory('/static/sc_web/'),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = !!userStore.token

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
