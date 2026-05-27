import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/pets',
    name: 'PetList',
    component: () => import('@/pages/PetList.vue'),
    meta: { title: '宠物列表' }
  },
  {
    path: '/pet/:id',
    name: 'PetDetail',
    component: () => import('@/pages/PetDetail.vue'),
    meta: { title: '宠物详情' }
  },
  {
    path: '/pet/publish',
    name: 'PetPublish',
    component: () => import('@/pages/PetPublish.vue'),
    meta: { title: '发布宠物', requiresAuth: true, requiresSender: true }
  },
  {
    path: '/pet/edit/:id',
    name: 'PetEdit',
    component: () => import('@/pages/PetEdit.vue'),
    meta: { title: '编辑宠物', requiresAuth: true, requiresSender: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/pages/Favorites.vue'),
    meta: { title: '我的收藏', requiresAuth: true }
  },
  {
    path: '/my-applications',
    name: 'MyApplications',
    component: () => import('@/pages/MyApplications.vue'),
    meta: { title: '我的申请', requiresAuth: true }
  },
  {
    path: '/my-pets',
    name: 'MyPets',
    component: () => import('@/pages/MyPets.vue'),
    meta: { title: '我的宠物', requiresAuth: true }
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('@/pages/Applications.vue'),
    meta: { title: '领养申请', requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/pages/Messages.vue'),
    meta: { title: '消息中心', requiresAuth: true }
  },
  {
    path: '/questions',
    name: 'Questions',
    component: () => import('@/pages/Questions.vue'),
    meta: { title: '问答社区' }
  },
  {
    path: '/question/:id',
    name: 'QuestionDetail',
    component: () => import('@/pages/QuestionDetail.vue'),
    meta: { title: '问题详情' }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('@/pages/Articles.vue'),
    meta: { title: '科普文章' }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('@/pages/ArticleDetail.vue'),
    meta: { title: '文章详情' }
  },
  {
    path: '/guide',
    name: 'AdoptionGuide',
    component: () => import('@/pages/AdoptionGuide.vue'),
    meta: { title: '领养指南' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/dashboard',
    meta: { title: '管理后台', requiresAdmin: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/pages/admin/Dashboard.vue'),
    meta: { title: '数据概览', requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/pages/admin/Users.vue'),
    meta: { title: '用户管理', requiresAdmin: true }
  },
  {
    path: '/admin/pets',
    name: 'AdminPets',
    component: () => import('@/pages/admin/Pets.vue'),
    meta: { title: '宠物管理', requiresAdmin: true }
  },
  {
    path: '/admin/applications',
    name: 'AdminApplications',
    component: () => import('@/pages/admin/Applications.vue'),
    meta: { title: '领养管理', requiresAdmin: true }
  },
  {
    path: '/admin/articles',
    name: 'AdminArticles',
    component: () => import('@/pages/admin/Articles.vue'),
    meta: { title: '文章管理', requiresAdmin: true }
  },
  {
    path: '/admin/notices',
    name: 'AdminNotices',
    component: () => import('@/pages/admin/Notices.vue'),
    meta: { title: '公告管理', requiresAdmin: true }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('@/pages/admin/Reports.vue'),
    meta: { title: '举报管理', requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.initUser()

  document.title = to.meta.title ? `${to.meta.title} - 宠物领养信息平台` : '宠物领养信息平台'

  if (to.meta.requiresAuth && !userStore.isLogin) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/home')
  } else if (to.meta.requiresSender && !userStore.isSender) {
    next('/home')
  } else {
    next()
  }
})

export default router
