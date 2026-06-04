import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '@/pages/MainMenu.vue'
import LevelSelect from '@/pages/LevelSelect.vue'
import Game from '@/pages/Game.vue'
import Shop from '@/pages/Shop.vue'
import CharacterSelect from '@/pages/CharacterSelect.vue'

const routes = [
  {
    path: '/',
    name: 'MainMenu',
    component: MainMenu,
  },
  {
    path: '/level-select',
    name: 'LevelSelect',
    component: LevelSelect,
  },
  {
    path: '/game',
    name: 'Game',
    component: Game,
  },
  {
    path: '/game/:levelId',
    name: 'GameWithLevel',
    component: Game,
  },
  {
    path: '/shop',
    name: 'Shop',
    component: Shop,
  },
  {
    path: '/character-select',
    name: 'CharacterSelect',
    component: CharacterSelect,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
