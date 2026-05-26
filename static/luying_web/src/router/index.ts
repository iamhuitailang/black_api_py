import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'campsites',
        name: 'Campsites',
        component: () => import('@/views/Campsites.vue'),
        meta: { title: '营地探索' }
      },
      {
        path: 'campsite/:id',
        name: 'CampsiteDetail',
        component: () => import('@/views/CampsiteDetail.vue'),
        meta: { title: '营地详情' }
      },
      {
        path: 'plans',
        name: 'Plans',
        component: () => import('@/views/Plans.vue'),
        meta: { title: '露营计划' }
      },
      {
        path: 'plan/create',
        name: 'CreatePlan',
        component: () => import('@/views/CreatePlan.vue'),
        meta: { title: '创建计划' }
      },
      {
        path: 'plan/:id',
        name: 'PlanDetail',
        component: () => import('@/views/PlanDetail.vue'),
        meta: { title: '计划详情' }
      },
      {
        path: 'packing-list/:id',
        name: 'PackingList',
        component: () => import('@/views/PackingList.vue'),
        meta: { title: '打包清单' }
      },
      {
        path: 'equipments',
        name: 'Equipments',
        component: () => import('@/views/Equipments.vue'),
        meta: { title: '装备库' }
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/Community.vue'),
        meta: { title: '社区' }
      },
      {
        path: 'post/:id',
        name: 'PostDetail',
        component: () => import('@/views/PostDetail.vue'),
        meta: { title: '帖子详情' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'my-posts',
        name: 'MyPosts',
        component: () => import('@/views/MyPosts.vue'),
        meta: { title: '我的帖子' }
      },
      {
        path: 'my-favorites',
        name: 'MyFavorites',
        component: () => import('@/views/MyFavorites.vue'),
        meta: { title: '我的收藏' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAdmin: true },
    children: [
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
        path: 'equipments',
        name: 'AdminEquipments',
        component: () => import('@/views/admin/Equipments.vue'),
        meta: { title: '装备管理' }
      },
      {
        path: 'campsites',
        name: 'AdminCampsites',
        component: () => import('@/views/admin/Campsites.vue'),
        meta: { title: '营地管理' }
      },
      {
        path: 'campsite/create',
        name: 'AdminCreateCampsite',
        component: () => import('@/views/admin/CreateCampsite.vue'),
        meta: { title: '添加营地' }
      },
      {
        path: 'plans',
        name: 'AdminPlans',
        component: () => import('@/views/admin/Plans.vue'),
        meta: { title: '计划管理' }
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('@/views/admin/Posts.vue'),
        meta: { title: '帖子管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.initUser()

  document.title = `${to.meta.title || '露营管理系统'} - 野外露营管理系统`

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/home')
    return
  }

  next()
})

export default router
