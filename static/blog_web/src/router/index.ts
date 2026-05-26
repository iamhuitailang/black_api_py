import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import storage from '@/utils/storage'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: () => import('@/views/home/index.vue'), meta: { title: '首页' } },
  { path: '/post/:id', name: 'PostDetail', component: () => import('@/views/detail/index.vue'), meta: { title: '文章详情' } },
  { path: '/categories', name: 'Categories', component: () => import('@/views/categories/index.vue'), meta: { title: '分类与标签' } },
  { path: '/search', name: 'Search', component: () => import('@/views/search/index.vue'), meta: { title: '搜索' } },
  { path: '/editor', name: 'Editor', component: () => import('@/views/editor/index.vue'), meta: { title: '写文章', requiresAuth: true } },
  { path: '/editor/:id', name: 'EditorEdit', component: () => import('@/views/editor/index.vue'), meta: { title: '编辑文章', requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('@/views/profile/index.vue'), meta: { title: '个人中心', requiresAuth: true } },
  { path: '/login', name: 'Login', component: () => import('@/views/profile/login.vue'), meta: { title: '登录' } },
  { path: '/register', name: 'Register', component: () => import('@/views/profile/register.vue'), meta: { title: '注册' } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/home/index.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  NProgress.start()
  if (to.meta?.requiresAuth && !storage.getToken()) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.meta?.title) {
    document.title = `${to.meta.title} · 个人博客`
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
