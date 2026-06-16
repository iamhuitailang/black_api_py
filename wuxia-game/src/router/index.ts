import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'MainMenu',
      component: () => import('@/pages/MainMenu.vue')
    },
    {
      path: '/select-sect',
      name: 'SelectSect',
      component: () => import('@/pages/SelectSect.vue')
    },
    {
      path: '/story',
      name: 'Story',
      component: () => import('@/pages/Story.vue')
    },
    {
      path: '/battle',
      name: 'Battle',
      component: () => import('@/pages/Battle.vue')
    },
    {
      path: '/arena',
      name: 'Arena',
      component: () => import('@/pages/Arena.vue')
    },
    {
      path: '/ending',
      name: 'Ending',
      component: () => import('@/pages/Ending.vue')
    }
  ]
})

export default router
