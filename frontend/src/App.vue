<template>
  <div class="app-container">
    <StartScreen
      v-if="gameState === 'start'"
      @start="handleStartGame"
      :playerName="playerName"
      @update:playerName="playerName = $event"
    />

    <GameCanvas
      v-else-if="gameState === 'playing'"
      ref="gameCanvas"
      :dragonStatus="dragonStatus"
      :recordData="recordData"
      @gameOver="handleGameOver"
      @waveComplete="handleWaveComplete"
      @enemyKilled="handleEnemyKilled"
      @essenceCollected="handleEssenceCollected"
      @flameUpgrade="handleFlameUpgrade"
    />

    <GameOverScreen
      v-else-if="gameState === 'gameover'"
      :finalStats="finalStats"
      :dragonStatus="dragonStatus"
      @restart="handleRestart"
      @backToMenu="handleBackToMenu"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import StartScreen from './components/StartScreen.vue'
import GameCanvas from './components/GameCanvas.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import { gameApi } from './api/gameApi'

const gameState = ref('start')
const playerName = ref('DragonRider')

const recordData = reactive({
  id: null,
  player_name: 'DragonRider',
  wave_reached: 1,
  enemies_killed: 0,
  score: 0,
  status: 'playing'
})

const dragonStatus = reactive({
  id: null,
  player_name: 'DragonRider',
  record_id: null,
  flame_level: 1,
  flame_damage_multiplier: 1.0,
  essence_collected: 0,
  total_essence: 0,
  max_hp: 150,
  charge_damage: 30
})

const finalStats = reactive({
  wave_reached: 1,
  enemies_killed: 0,
  score: 0
})

const handleStartGame = async () => {
  try {
    const res = await gameApi.startGame(playerName.value)
    if (res.data.code === 0) {
      Object.assign(recordData, res.data.data.record)
      Object.assign(dragonStatus, res.data.data.dragon_status)
      gameState.value = 'playing'
    }
  } catch (e) {
    console.error('Failed to start game:', e)
    recordData.id = Date.now()
    recordData.player_name = playerName.value
    dragonStatus.record_id = recordData.id
    gameState.value = 'playing'
  }
}

const handleWaveComplete = async (wave, enemiesKilled, score) => {
  recordData.wave_reached = wave
  recordData.enemies_killed = enemiesKilled
  recordData.score = score
  if (recordData.id) {
    try {
      await gameApi.saveProgress(recordData.id, wave, enemiesKilled, score)
    } catch (e) {
      console.error('Save progress failed:', e)
    }
  }
}

const handleEnemyKilled = (enemiesKilled, score) => {
  recordData.enemies_killed = enemiesKilled
  recordData.score = score
}

const handleEssenceCollected = async (amount) => {
  dragonStatus.essence_collected += amount
  dragonStatus.total_essence += amount
  if (dragonStatus.id) {
    try {
      const res = await gameApi.collectEssence(dragonStatus.id, amount)
      if (res.data.code === 0) {
        Object.assign(dragonStatus, res.data.data)
      }
    } catch (e) {
      console.error('Collect essence failed:', e)
    }
  }
}

const handleFlameUpgrade = async () => {
  const cost = Math.ceil(dragonStatus.flame_level * 1.5)
  if (dragonStatus.essence_collected >= cost) {
    dragonStatus.flame_level += 1
    dragonStatus.flame_damage_multiplier = 1 + (dragonStatus.flame_level - 1) * 0.15
    dragonStatus.essence_collected -= cost
    if (dragonStatus.id) {
      try {
        const res = await gameApi.upgradeFlame(dragonStatus.id, cost)
        if (res.data.code === 0) {
          Object.assign(dragonStatus, res.data.data)
        }
      } catch (e) {
        console.error('Upgrade flame failed:', e)
      }
    }
    return true
  }
  return false
}

const handleGameOver = async (stats) => {
  Object.assign(finalStats, stats)
  recordData.wave_reached = stats.wave_reached
  recordData.enemies_killed = stats.enemies_killed
  recordData.score = stats.score
  gameState.value = 'gameover'
  if (recordData.id) {
    try {
      await gameApi.finishGame(recordData.id, stats.wave_reached, stats.enemies_killed, stats.score)
    } catch (e) {
      console.error('Finish game failed:', e)
    }
  }
}

const handleRestart = () => {
  Object.assign(recordData, {
    id: null,
    player_name: playerName.value,
    wave_reached: 1,
    enemies_killed: 0,
    score: 0,
    status: 'playing'
  })
  Object.assign(dragonStatus, {
    id: null,
    player_name: playerName.value,
    record_id: null,
    flame_level: 1,
    flame_damage_multiplier: 1.0,
    essence_collected: 0,
    total_essence: 0,
    max_hp: 150,
    charge_damage: 30
  })
  handleStartGame()
}

const handleBackToMenu = () => {
  gameState.value = 'start'
}
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 50%, #2a1a1a 100%);
}
</style>
