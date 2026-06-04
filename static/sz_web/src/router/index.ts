import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'game',
    component: {
      template: '<div></div>',
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
