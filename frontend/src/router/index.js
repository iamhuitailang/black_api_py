import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { noAuth: true } },
  { path: '/', component: () => import('../views/Dashboard.vue') },
  { path: '/cycles', component: () => import('../views/CycleManagement.vue'), meta: { roles: ['admin'] } },
  { path: '/self-review', component: () => import('../views/SelfReview.vue'), meta: { roles: ['admin', 'manager', 'employee'] } },
  { path: '/self-review/:recordId', component: () => import('../views/SelfReviewDetail.vue'), meta: { roles: ['admin', 'manager', 'employee'] } },
  { path: '/supervisor-review', component: () => import('../views/SupervisorReview.vue'), meta: { roles: ['admin', 'manager'] } },
  { path: '/supervisor-review/:recordId', component: () => import('../views/SupervisorReviewDetail.vue'), meta: { roles: ['admin', 'manager'] } },
  { path: '/statistics', component: () => import('../views/Statistics.vue'), meta: { roles: ['admin'] } },
  { path: '/my-history', component: () => import('../views/MyHistory.vue'), meta: { roles: ['admin', 'manager', 'employee'] } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('kpi_token')
  const userStr = localStorage.getItem('kpi_user')
  
  if (to.meta.noAuth) {
    if (token && userStr) {
      next('/')
    } else {
      next()
    }
    return
  }
  
  if (!token || !userStr) {
    next('/login')
    return
  }
  
  const role = localStorage.getItem('kpi_role')
  if (to.meta.roles && role && !to.meta.roles.includes(role)) {
    alert('您没有访问此页面的权限')
    next(from.path || '/')
    return
  }
  
  next()
})

export default router
