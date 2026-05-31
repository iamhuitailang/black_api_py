import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn, isAdmin, getUser } from '@/utils/storage'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/user/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/user/Register.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/user/Home.vue'),
    meta: { requiresAuth: true, title: '游戏大厅' }
  },
  {
    path: '/room/:id',
    name: 'Room',
    component: () => import('@/views/user/Room.vue'),
    meta: { requiresAuth: true, title: '房间' }
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: () => import('@/views/user/Game.vue'),
    meta: { requiresAuth: true, title: '游戏' }
  },
  {
    path: '/game/:id/spectator',
    name: 'Spectator',
    component: () => import('@/views/user/Spectator.vue'),
    meta: { requiresAuth: true, title: '观战' }
  },
  {
    path: '/rank',
    name: 'Rank',
    component: () => import('@/views/user/Rank.vue'),
    meta: { requiresAuth: true, title: '排行榜' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/Profile.vue'),
    meta: { requiresAuth: true, title: '个人中心' }
  },
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/dashboard',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: '管理后台' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: '数据统计' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: '用户管理' }
      },
      {
        path: 'rooms',
        name: 'AdminRooms',
        component: () => import('@/views/admin/Rooms.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: '房间管理' }
      },
      {
        path: 'items',
        name: 'AdminItems',
        component: () => import('@/views/admin/Items.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: '道具管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '飞行棋'
  
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/login')
  } else if (to.meta.requiresAdmin && !isAdmin()) {
    next('/')
  } else {
    next()
  }
})

export default router
