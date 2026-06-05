import { createRouter, createWebHistory } from 'vue-router'
import LaunchView from '@/views/LaunchView.vue'
import MarsHallView from '@/views/MarsHallView.vue'
import BaseView from '@/views/BaseView.vue'
import ExploreView from '@/views/ExploreView.vue'
import TechView from '@/views/TechView.vue'

const routes = [
  {
    path: '/',
    name: 'launch',
    component: LaunchView,
  },
  {
    path: '/hall',
    name: 'hall',
    component: MarsHallView,
  },
  {
    path: '/base',
    name: 'base',
    component: BaseView,
  },
  {
    path: '/explore',
    name: 'explore',
    component: ExploreView,
  },
  {
    path: '/tech',
    name: 'tech',
    component: TechView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
