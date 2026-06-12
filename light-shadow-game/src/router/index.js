import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LevelSelect from '../views/LevelSelect.vue'
import Game from '../views/Game.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/levels', name: 'LevelSelect', component: LevelSelect },
  { path: '/game/:levelId', name: 'Game', component: Game, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
