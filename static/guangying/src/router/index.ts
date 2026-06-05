import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import LevelsPage from '@/pages/LevelsPage.vue'
import GamePage from '@/pages/GamePage.vue'
import ResultScreen from '@/components/ResultScreen.vue'
import MainMenu from '@/components/MainMenu.vue'
import LevelSelect from '@/components/LevelSelect.vue'
import { useGameStore } from '@/store/gameStore'

/** 路由配置 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: MainMenu,
    meta: {
      title: '主菜单',
      transition: 'fade'
    }
  },
  {
    path: '/level-select',
    name: 'levelSelect',
    component: LevelSelect,
    meta: {
      title: '关卡选择',
      transition: 'slide-left'
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
      requiresUnlock: true,
      transition: 'slide-left'
    }
  },
  {
    path: '/result/:levelId',
    name: 'result',
    component: ResultScreen,
    meta: {
      title: '结算',
      requiresUnlock: true,
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

/** 路由守卫：检查关卡是否解锁 */
router.beforeEach((to, _from, next) => {
  const gameStore = useGameStore()

  if (to.meta.title) {
    document.title = `光与影 - ${to.meta.title}`
  }

  if (to.meta.requiresUnlock && to.params.levelId) {
    const levelId = to.params.levelId as string
    if (!gameStore.isLevelUnlocked(levelId)) {
      next({ name: 'levels' })
      return
    }
  }

  next()
})

export default router
