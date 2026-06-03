import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue')
      },
      {
        path: 'park',
        name: 'Park',
        component: () => import('@/pages/Park.vue')
      },
      {
        path: 'fossil',
        name: 'Fossil',
        component: () => import('@/pages/Fossil.vue')
      },
      {
        path: 'dinosaur',
        name: 'Dinosaur',
        component: () => import('@/pages/Dinosaur.vue')
      },
      {
        path: 'habitat',
        name: 'Habitat',
        component: () => import('@/pages/Habitat.vue')
      },
      {
        path: 'facility',
        name: 'Facility',
        component: () => import('@/pages/Facility.vue')
      },
      {
        path: 'gene',
        name: 'Gene',
        component: () => import('@/pages/Gene.vue')
      },
      {
        path: 'event',
        name: 'Event',
        component: () => import('@/pages/Event.vue')
      },
      {
        path: 'friend',
        name: 'Friend',
        component: () => import('@/pages/Friend.vue')
      },
      {
        path: 'share',
        name: 'Share',
        component: () => import('@/pages/Share.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
