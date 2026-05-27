import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
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
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:levelId',
    name: 'Game',
    component: () => import('../views/Game.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/character',
    name: 'Character',
    component: () => import('../views/Character.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/levels',
    name: 'Levels',
    component: () => import('../views/Levels.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn()) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn()) {
    next('/home')
  } else {
    next()
  }
})

export default router
