import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import LevelsPage from '@/pages/LevelsPage.vue'
import GamePage from '@/pages/GamePage.vue'
import ResultScreen from '@/components/ResultScreen.vue'

/** 路由配置 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: {
      title: '主菜单',
      transition: 'fade'
    }
  },
  {
    path: '/levels',
    name: 'levels',
    component: LevelsPage,
    meta: {
      title: '关卡选择',
      transition: 'slide-left'
    }
  },
  {
    path: '/game/:levelId',
    name: 'game',
    component: GamePage,
    meta: {
      title: '游戏',
      transition: 'slide-left'
    }
  },
  {
    path: '/result/:levelId',
    name: 'result',
    component: ResultScreen,
    meta: {
      title: '结算',
      transition: 'fade'
    }
  }
]

/** 创建路由实例 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

/** 路由守卫：设置页面标题 */
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `光与影 - ${to.meta.title}`
  }
  next()
})

export default router
