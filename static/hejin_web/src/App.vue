<template>
  <div class="game-container">
    <MainMenu v-if="gameState === 'menu'" @start="startGame" @shop="openShop" />
    <Shop v-else-if="gameState === 'shop'" @back="backToMenu" @buy="buyItem" :coins="playerData.coins" :inventory="playerData.inventory" />
    <Game v-else-if="gameState === 'game'" :level="currentLevel" :playerData="playerData" @gameOver="handleGameOver" @levelComplete="handleLevelComplete" @updateCoins="updateCoins" />
    <GameOver v-else-if="gameState === 'gameover'" :score="finalScore" :level="currentLevel" @restart="restartGame" @menu="backToMenu" />
    <Victory v-else-if="gameState === 'victory'" :score="finalScore" @menu="backToMenu" />
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import MainMenu from './components/MainMenu.vue'
import Shop from './components/Shop.vue'
import Game from './components/Game.vue'
import GameOver from './components/GameOver.vue'
import Victory from './components/Victory.vue'

const SAVE_KEY = 'hejin_game_save'

const gameState = ref('menu')
const currentLevel = ref(1)
const finalScore = ref(0)

const defaultPlayerData = {
  coins: 500,
  maxHealth: 100,
  health: 100,
  currentWeapon: 'ak47',
  inventory: {
    ak47: true,
    shotgun: false,
    grenades: 3
  }
}

const playerData = reactive({ ...defaultPlayerData })

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      Object.assign(playerData, data.playerData)
      currentLevel.value = data.currentLevel || 1
      return true
    }
  } catch (e) {
    console.log('No save data found')
  }
  return false
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      playerData: {
        coins: playerData.coins,
        maxHealth: playerData.maxHealth,
        health: playerData.health,
        currentWeapon: playerData.currentWeapon,
        inventory: playerData.inventory
      },
      currentLevel: currentLevel.value
    }))
  } catch (e) {
    console.log('Save failed:', e)
  }
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY)
}

onMounted(() => {
  loadGame()
})

watch([playerData, currentLevel], () => {
  if (gameState.value !== 'menu') {
    saveGame()
  }
}, { deep: true })

function startGame() {
  currentLevel.value = 1
  playerData.health = playerData.maxHealth
  gameState.value = 'game'
  saveGame()
}

function openShop() {
  gameState.value = 'shop'
}

function backToMenu() {
  gameState.value = 'menu'
}

function buyItem(item) {
  if (item.type === 'health') {
    playerData.maxHealth += item.value
    playerData.health = playerData.maxHealth
  } else if (item.type === 'weapon') {
    playerData.inventory[item.id] = true
  } else if (item.type === 'grenade') {
    playerData.inventory.grenades += item.value
  }
  playerData.coins -= item.price
}

function updateCoins(amount) {
  playerData.coins += amount
}

function handleGameOver(score) {
  finalScore.value = score
  gameState.value = 'gameover'
}

function handleLevelComplete(score) {
  finalScore.value = score
  if (currentLevel.value >= 4) {
    gameState.value = 'victory'
  } else {
    currentLevel.value++
    playerData.health = playerData.maxHealth
  }
}

function restartGame() {
  currentLevel.value = 1
  playerData.health = playerData.maxHealth
  gameState.value = 'game'
}
</script>
