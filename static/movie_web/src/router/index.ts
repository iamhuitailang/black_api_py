import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home.vue')
  },
  {
    path: '/movie/:id',
    name: 'MovieDetail',
    component: () => import('@/views/movie-detail.vue')
  },
  {
    path: '/seat/:showtimeId',
    name: 'SeatSelection',
    component: () => import('@/views/seat-selection.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/orders.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile.vue')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/login.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/dashboard.vue')
  },
  {
    path: '/admin/movies',
    name: 'AdminMovies',
    component: () => import('@/views/admin/movies.vue')
  },
  {
    path: '/admin/showtimes',
    name: 'AdminShowtimes',
    component: () => import('@/views/admin/showtimes.vue')
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/admin/orders.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('movie_token')
  const userStr = localStorage.getItem('movie_user')
  let user: any = null
  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch {}
  }

  const adminPaths = ['/admin/dashboard', '/admin/movies', '/admin/showtimes', '/admin/orders']

  if (adminPaths.includes(to.path)) {
    if (!token || !user || user.role !== 'admin') {
      next('/admin/login')
      return
    }
  }

  next()
})

export default router