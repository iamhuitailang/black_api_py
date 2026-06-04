import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/patients',
    name: 'Patients',
    component: () => import('@/views/PatientsView.vue')
  },
  {
    path: '/dream/:patientId',
    name: 'Dream',
    component: () => import('@/views/DreamView.vue'),
    props: true
  },
  {
    path: '/memories',
    name: 'Memories',
    component: () => import('@/views/MemoriesView.vue')
  },
  {
    path: '/ending/:patientId/:endingId',
    name: 'Ending',
    component: () => import('@/views/EndingView.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
