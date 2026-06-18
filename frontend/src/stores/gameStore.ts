import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = '/api'

export interface GameState {
  id: number
  day: number
  phase: string
  time_of_day: number
  water: number
  arrows: number
  oil: number
  work_hours: number
  max_work_hours: number
  fortress_hp: number
  max_fortress_hp: number
  morale: number
  is_game_over: number
  is_siege_day: number
  next_siege_day: number
}

export interface Building {
  id: number
  game_state_id: number
  building_type: string
  position_x: number
  position_y: number
  hp: number
  max_hp: number
  level: number
  is_building: number
  build_progress: number
  build_time: number
}

export interface BuildingConfig {
  name: string
  description: string
  cost_work_hours: number
  cost_water?: number
  hp: number
  build_time: number
  color: string
  damage?: number
  range?: number
  water_per_day?: number
}

export interface EnemyWave {
  id: number
  game_state_id: number
  wave_number: number
  is_active: number
  enemies_remaining: number
  total_enemies: number
  is_siege: number
}

export interface GameLog {
  id: number
  game_state_id: number
  day: number
  log_type: string
  message: string
  created_at: string
}

export interface WormPosition {
  x: number
  y: number
  type: string
  detected: boolean
}

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState | null>(null)
  const buildings = ref<Building[]>([])
  const activeWave = ref<EnemyWave | null>(null)
  const logs = ref<GameLog[]>([])
  const buildingConfig = ref<Record<string, BuildingConfig>>({})
  const wormPositions = ref<WormPosition[]>([])
  const selectedBuildingType = ref<string | null>(null)
  const isPaused = ref(false)
  const gameLoopId = ref<number | null>(null)

  const isDay = computed(() => gameState.value?.phase === 'day')
  const isNight = computed(() => gameState.value?.phase === 'night')
  const isGameOver = computed(() => gameState.value?.is_game_over === 1)

  async function newGame() {
    try {
      const response = await axios.post(`${API_BASE}/fortress/newgame`)
      const data = response.data.data
      updateGameData(data)
      startGameLoop()
      return response.data
    } catch (error) {
      console.error('Failed to create new game:', error)
      throw error
    }
  }

  async function getGameState(stateId?: number) {
    try {
      const params = stateId ? { state_id: stateId } : {}
      const response = await axios.get(`${API_BASE}/fortress/getstate`, { params })
      if (response.data.data) {
        updateGameData(response.data.data)
        startGameLoop()
      }
      return response.data
    } catch (error) {
      console.error('Failed to get game state:', error)
      throw error
    }
  }

  function updateGameData(data: any) {
    gameState.value = data.state
    buildings.value = data.buildings || []
    activeWave.value = data.active_wave
    logs.value = data.logs || []
    buildingConfig.value = data.building_config || {}
  }

  async function buildStructure(buildingType: string, positionX: number, positionY: number) {
    if (!gameState.value) return
    
    try {
      const response = await axios.post(`${API_BASE}/fortress/build`, {
        state_id: gameState.value.id,
        building_type: buildingType,
        position_x: positionX,
        position_y: positionY
      })
      
      if (response.data.code === 0) {
        await getGameState(gameState.value.id)
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to build structure:', error)
      throw error
    }
  }

  async function advanceTime(delta: number = 0.05) {
    if (!gameState.value || gameState.value.is_game_over) return
    
    try {
      const response = await axios.post(`${API_BASE}/fortress/advancetime`, {
        state_id: gameState.value.id,
        delta: delta
      })
      
      if (response.data.code === 0) {
        updateGameData(response.data.data)
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to advance time:', error)
      throw error
    }
  }

  async function collectResource(resourceType: string, amount: number) {
    if (!gameState.value) return
    
    try {
      const response = await axios.post(`${API_BASE}/fortress/collectresource`, {
        state_id: gameState.value.id,
        resource_type: resourceType,
        amount: amount
      })
      
      if (response.data.code === 0) {
        updateGameData(response.data.data)
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to collect resource:', error)
      throw error
    }
  }

  async function deleteSave(stateId: number) {
    try {
      const response = await axios.delete(`${API_BASE}/fortress/save/delete`, {
        params: { state_id: stateId }
      })
      return response.data
    } catch (error) {
      console.error('Failed to delete save:', error)
      throw error
    }
  }

  async function getWormPositions() {
    if (!gameState.value) return
    
    try {
      const response = await axios.get(`${API_BASE}/fortress/getwormpositions`, {
        params: { state_id: gameState.value.id }
      })
      
      if (response.data.code === 0) {
        wormPositions.value = response.data.data.worm_positions || []
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to get worm positions:', error)
      throw error
    }
  }

  function startGameLoop() {
    if (gameLoopId.value) {
      clearInterval(gameLoopId.value)
    }
    
    gameLoopId.value = window.setInterval(() => {
      if (!isPaused.value && gameState.value && !gameState.value.is_game_over) {
        advanceTime(0.02)
      }
    }, 500)
  }

  function stopGameLoop() {
    if (gameLoopId.value) {
      clearInterval(gameLoopId.value)
      gameLoopId.value = null
    }
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function selectBuildingType(type: string | null) {
    selectedBuildingType.value = type
  }

  return {
    gameState,
    buildings,
    activeWave,
    logs,
    buildingConfig,
    wormPositions,
    selectedBuildingType,
    isPaused,
    isDay,
    isNight,
    isGameOver,
    newGame,
    getGameState,
    buildStructure,
    advanceTime,
    collectResource,
    getWormPositions,
    startGameLoop,
    stopGameLoop,
    togglePause,
    selectBuildingType
  }
})
