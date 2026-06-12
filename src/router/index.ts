import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Hall',
    component: () => import('@/views/Hall.vue'),
    meta: { title: '大厅' }
  },
  {
    path: '/game/prepare',
    name: 'GamePrepare',
    component: () => import('@/views/GamePrepare.vue'),
    meta: { title: '游戏准备' }
  },
  {
    path: '/game/play',
    name: 'GamePlay',
    component: () => import('@/views/GamePlay.vue'),
    meta: { title: '游戏对战' }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('@/views/Shop.vue'),
    meta: { title: '商店' }
  },
  {
    path: '/dress',
    name: 'Dress',
    component: () => import('@/views/Dress.vue'),
    meta: { title: '装扮' }
  },
  {
    path: '/maps',
    name: 'Maps',
    component: () => import('@/views/Maps.vue'),
    meta: { title: '地图' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '仓鼠推雪球'} - 可爱冰雪竞技`
  next()
})

export default router
