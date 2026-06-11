import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/meetings'
  },
  {
    path: '/meetings',
    name: 'Meetings',
    component: () => import('../views/MeetingList.vue')
  },
  {
    path: '/meetings/:id',
    name: 'MeetingDetail',
    component: () => import('../views/MeetingDetail.vue')
  },
  {
    path: '/meetings/new',
    name: 'MeetingNew',
    component: () => import('../views/MeetingEdit.vue')
  },
  {
    path: '/meetings/:id/edit',
    name: 'MeetingEdit',
    component: () => import('../views/MeetingEdit.vue')
  },
  {
    path: '/action-items',
    name: 'ActionItems',
    component: () => import('../views/ActionItems.vue')
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/Projects.vue')
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/Stats.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
