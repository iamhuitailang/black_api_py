import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/templates'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', public: true }
  },
  {
    path: '/templates',
    name: 'Templates',
    component: () => import('@/views/Templates.vue'),
    meta: { title: '模板中心' }
  },
  {
    path: '/resume/create',
    name: 'CreateResume',
    component: () => import('@/views/ResumeEdit.vue'),
    meta: { title: '创建简历', requiresAuth: true }
  },
  {
    path: '/resume/edit/:id',
    name: 'EditResume',
    component: () => import('@/views/ResumeEdit.vue'),
    meta: { title: '编辑简历', requiresAuth: true }
  },
  {
    path: '/resume/preview/:id',
    name: 'PreviewResume',
    component: () => import('@/views/ResumePreview.vue'),
    meta: { title: '简历预览', requiresAuth: true }
  },
  {
    path: '/center',
    name: 'Center',
    component: () => import('@/views/Center.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue'),
    meta: { title: '管理员登录', public: true }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'resumes',
        name: 'AdminResumes',
        component: () => import('@/views/admin/Resumes.vue'),
        meta: { title: '简历管理' }
      },
      {
        path: 'templates',
        name: 'AdminTemplates',
        component: () => import('@/views/admin/Templates.vue'),
        meta: { title: '模板管理' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/Categories.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在', public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.initUserFromStorage()

  document.title = to.meta.title ? `${to.meta.title} - 简历在线制作平台` : '简历在线制作平台'

  if (to.meta.public) {
    next()
    return
  }

  if (to.meta.requiresAdmin) {
    if (!userStore.isAdminLoggedIn) {
      next('/admin/login')
      return
    }
  } else if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }
  }

  next()
})

export default router
