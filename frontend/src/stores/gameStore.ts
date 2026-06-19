import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = '/api'
const STORAGE_KEY = 'fortress_game_state_id'

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
  const isRunning = ref(false)
  const lastTickTime = ref<number>(0)
  const tickCount = ref(0)

  const isDay = computed(() => gameState.value?.phase === 'day')
  const isNight = computed(() => gameState.value?.phase === 'night')
  const isGameOver = computed(() => gameState.value?.is_game_over === 1)

  async function newGame() {
    console.log('[newGame] === 开始新游戏 ===')
    try {
      const response = await axios.post(`${API_BASE}/fortress/newgame`)
      console.log('[newGame] API 返回:', response.data)
      
      const data = response.data.data
      if (!data || !data.state) {
        console.error('[newGame] 返回数据无效:', data)
        throw new Error('API 返回数据无效')
      }
      
      updateGameData(data)
      console.log('[newGame] gameState 已设置:', gameState.value)
      
      if (data.state?.id) {
        localStorage.setItem(STORAGE_KEY, String(data.state.id))
        console.log('[newGame] 已保存存档 ID:', data.state.id)
      }
      
      isPaused.value = false
      console.log('[newGame] 调用 startGameLoop')
      startGameLoop()
      
      return response.data
    } catch (error) {
      console.error('[newGame] 失败:', error)
      throw error
    }
  }

  async function getGameState(stateId?: number) {
    console.log('[getGameState] 调用, stateId:', stateId)
    try {
      const params = stateId ? { state_id: stateId } : {}
      const response = await axios.get(`${API_BASE}/fortress/getstate`, { params })
      console.log('[getGameState] API 返回:', response.data)
      
      if (response.data.data) {
        updateGameData(response.data.data)
        console.log('[getGameState] gameState 已设置:', gameState.value)
        
        if (response.data.data.state?.id) {
          localStorage.setItem(STORAGE_KEY, String(response.data.data.state.id))
          console.log('[getGameState] 已保存存档 ID:', response.data.data.state.id)
        }
        
        startGameLoop()
      }
      return response.data
    } catch (error) {
      console.error('[getGameState] 失败:', error)
      throw error
    }
  }

  async function autoLoadGame(): Promise<boolean> {
    console.log('[autoLoadGame] === 自动加载存档 ===')
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (!savedId) {
      console.log('[autoLoadGame] 没有保存的游戏ID')
      return false
    }
    
    try {
      console.log('[autoLoadGame] 尝试加载存档 ID:', savedId)
      await getGameState(parseInt(savedId, 10))
      
      if (gameState.value && gameState.value.is_game_over !== 1) {
        console.log('[autoLoadGame] 加载成功，当前天数:', gameState.value.day)
        return true
      } else {
        console.log('[autoLoadGame] 加载失败：gameState 为空或游戏已结束')
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
    } catch (e) {
      console.warn('[autoLoadGame] 异常:', e)
      localStorage.removeItem(STORAGE_KEY)
      return false
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
    if (!gameState.value) {
      console.log('[advanceTime] 跳过: gameState 为空')
      return
    }
    if (gameState.value.is_game_over === 1) {
      console.log('[advanceTime] 跳过: 游戏已结束')
      return
    }
    
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
      console.error('[advanceTime] 失败:', error)
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

  let gameLoopTimeoutId: number | null = null
  let isAdvancingTime = false

  async function tickGameLoop() {
    console.log('[tickGameLoop] === 触发一次 tick ===')
    console.log('[tickGameLoop] isPaused=', isPaused.value, 
                'gameState exists=', !!gameState.value,
                'is_game_over=', gameState.value?.is_game_over,
                'isAdvancingTime=', isAdvancingTime)
    
    const canRun = !isPaused.value 
                && gameState.value !== null 
                && gameState.value.is_game_over !== 1
                && !isAdvancingTime
    
    console.log('[tickGameLoop] canRun=', canRun)
    
    if (canRun) {
      isAdvancingTime = true
      try {
        console.log('[tickGameLoop] 调用 advanceTime(0.05)')
        await advanceTime(0.05)
        tickCount.value++
        lastTickTime.value = Date.now()
        console.log('[tickGameLoop] tick 完成, count=', tickCount.value, 
                    'time=', gameState.value?.time_of_day)
      } catch (e) {
        console.error('[tickGameLoop] tick error:', e)
      } finally {
        isAdvancingTime = false
      }
    }
    
    gameLoopTimeoutId = window.setTimeout(tickGameLoop, 300)
  }

  function startGameLoop() {
    stopGameLoop()
    console.log('[startGameLoop] 启动游戏循环')
    isRunning.value = true
    tickGameLoop()
  }

  function stopGameLoop() {
    if (gameLoopTimeoutId) {
      clearTimeout(gameLoopTimeoutId)
      gameLoopTimeoutId = null
      console.log('[stopGameLoop] 停止游戏循环')
    }
    isRunning.value = false
  }

  function togglePause() {
    isPaused.value = !isPaused.value
    console.log('[togglePause] isPaused=', isPaused.value)
  }

  function forceStartGame() {
    console.log('[forceStartGame] === 强制启动游戏 ===')
    isPaused.value = false
    if (!gameState.value) {
      console.log('[forceStartGame] gameState 为空，先新建游戏')
      newGame()
    } else {
      console.log('[forceStartGame] gameState 存在，直接启动循环')
      startGameLoop()
    }
  }

  function clearSave() {
    console.log('[clearSave] 清除存档')
    localStorage.removeItem(STORAGE_KEY)
    stopGameLoop()
    gameState.value = null
    buildings.value = []
    activeWave.value = null
    logs.value = []
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
    isRunning,
    lastTickTime,
    tickCount,
    isDay,
    isNight,
    isGameOver,
    newGame,
    getGameState,
    autoLoadGame,
    buildStructure,
    advanceTime,
    collectResource,
    getWormPositions,
    startGameLoop,
    stopGameLoop,
    togglePause,
    selectBuildingType,
    forceStartGame,
    clearSave
  }
})
