import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/Dashboard.vue') },
  { path: '/cycles', component: () => import('../views/CycleManagement.vue') },
  { path: '/self-review', component: () => import('../views/SelfReview.vue') },
  { path: '/self-review/:recordId', component: () => import('../views/SelfReviewDetail.vue') },
  { path: '/supervisor-review', component: () => import('../views/SupervisorReview.vue') },
  { path: '/supervisor-review/:recordId', component: () => import('../views/SupervisorReviewDetail.vue') },
  { path: '/statistics', component: () => import('../views/Statistics.vue') },
  { path: '/my-history', component: () => import('../views/MyHistory.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
