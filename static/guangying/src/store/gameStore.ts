import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type {
  GameScene,
  GameSettings,
  GameRuntimeState,
  LevelStars,
  HighScores,
  UnlockedLevels,
  GamePersistentData,
  GraphicsQuality
} from '@/types'
import { STORAGE_KEY } from '@/types'

/**
 * 默认游戏设置
 */
const DEFAULT_SETTINGS: GameSettings = {
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  bgmEnabled: true,
  sfxEnabled: true,
  graphicsQuality: 'high',
  showFPS: false,
  showHitboxes: false
}

/**
 * 默认游戏内状态
 */
const DEFAULT_GAME_STATE: GameRuntimeState = {
  health: 3,
  maxHealth: 3,
  collectibles: 0,
  totalCollectibles: 0,
  gameTime: 0,
  isPaused: false,
  score: 0,
  shadowState: 'light'
}

/**
 * 默认持久化数据
 */
const DEFAULT_PERSISTENT_DATA: GamePersistentData = {
  currentLevel: 'level_1',
  unlockedLevels: ['level_1'],
  levelStars: {},
  totalParticles: 0,
  highScores: {},
  settings: { ...DEFAULT_SETTINGS }
}

export const useGameStore = defineStore('game', () => {
  /** 游戏场景 */
  const currentScene = ref<GameScene>('menu')

  /** 当前关卡 */
  const currentLevel = ref<string>(DEFAULT_PERSISTENT_DATA.currentLevel)

  /** 已解锁关卡 */
  const unlockedLevels = ref<UnlockedLevels>([...DEFAULT_PERSISTENT_DATA.unlockedLevels])

  /** 关卡星级记录 */
  const levelStars = ref<LevelStars>({ ...DEFAULT_PERSISTENT_DATA.levelStars })

  /** 总光粒子数 */
  const totalParticles = ref<number>(DEFAULT_PERSISTENT_DATA.totalParticles)

  /** 最高分记录 */
  const highScores = ref<HighScores>({ ...DEFAULT_PERSISTENT_DATA.highScores })

  /** 音效设置 */
  const settings = ref<GameSettings>({ ...DEFAULT_PERSISTENT_DATA.settings })

  /** 游戏内实时状态 */
  const gameState = ref<GameRuntimeState>({ ...DEFAULT_GAME_STATE })

  /**
   * 从localStorage加载游戏状态
   */
  const loadFromStorage = (): void => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data: GamePersistentData = JSON.parse(saved)
        currentLevel.value = data.currentLevel ?? DEFAULT_PERSISTENT_DATA.currentLevel
        unlockedLevels.value = data.unlockedLevels ?? [...DEFAULT_PERSISTENT_DATA.unlockedLevels]
        levelStars.value = data.levelStars ?? { ...DEFAULT_PERSISTENT_DATA.levelStars }
        totalParticles.value = data.totalParticles ?? DEFAULT_PERSISTENT_DATA.totalParticles
        highScores.value = data.highScores ?? { ...DEFAULT_PERSISTENT_DATA.highScores }
        settings.value = { ...DEFAULT_SETTINGS, ...data.settings }
      }
    } catch (error) {
      console.error('加载游戏存档失败:', error)
      resetPersistentData()
    }
  }

  /**
   * 保存游戏状态到localStorage
   */
  const saveToStorage = (): void => {
    try {
      const data: GamePersistentData = {
        currentLevel: currentLevel.value,
        unlockedLevels: unlockedLevels.value,
        levelStars: levelStars.value,
        totalParticles: totalParticles.value,
        highScores: highScores.value,
        settings: settings.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('保存游戏存档失败:', error)
    }
  }

  /**
   * 重置持久化数据到默认值
   */
  const resetPersistentData = (): void => {
    currentLevel.value = DEFAULT_PERSISTENT_DATA.currentLevel
    unlockedLevels.value = [...DEFAULT_PERSISTENT_DATA.unlockedLevels]
    levelStars.value = { ...DEFAULT_PERSISTENT_DATA.levelStars }
    totalParticles.value = DEFAULT_PERSISTENT_DATA.totalParticles
    highScores.value = { ...DEFAULT_PERSISTENT_DATA.highScores }
    settings.value = { ...DEFAULT_PERSISTENT_DATA.settings }
  }

  /**
   * 初始化游戏状态
   * 从localStorage加载存档，设置自动保存监听
   */
  const initGame = (): void => {
    loadFromStorage()
    setupAutoSave()
  }

  /**
   * 设置自动保存监听器
   * 当持久化状态变化时自动保存
   */
  const setupAutoSave = (): void => {
    watch(
      [currentLevel, unlockedLevels, levelStars, totalParticles, highScores, settings],
      () => {
        saveToStorage()
      },
      { deep: true }
    )
  }

  /**
   * 解锁关卡
   * @param levelId 关卡ID
   */
  const unlockLevel = (levelId: string): void => {
    if (!unlockedLevels.value.includes(levelId)) {
      unlockedLevels.value.push(levelId)
    }
  }

  /**
   * 检查关卡是否已解锁
   * @param levelId 关卡ID
   */
  const isLevelUnlocked = (levelId: string): boolean => {
    return unlockedLevels.value.includes(levelId)
  }

  /**
   * 记录关卡星级
   * 如果新星级更高则更新
   * @param levelId 关卡ID
   * @param stars 星级 0-3
   */
  const recordLevelStars = (levelId: string, stars: number): void => {
    const clampedStars = Math.max(0, Math.min(3, stars))
    const currentStars = levelStars.value[levelId] ?? 0
    if (clampedStars > currentStars) {
      levelStars.value[levelId] = clampedStars
    }
  }

  /**
   * 获取关卡星级
   * @param levelId 关卡ID
   */
  const getLevelStars = (levelId: string): number => {
    return levelStars.value[levelId] ?? 0
  }

  /**
   * 更新游戏设置
   * @param newSettings 新设置（部分更新）
   */
  const updateSettings = (newSettings: Partial<GameSettings>): void => {
    settings.value = { ...settings.value, ...newSettings }
  }

  /**
   * 设置画质等级
   * @param quality 画质等级
   */
  const setGraphicsQuality = (quality: GraphicsQuality): void => {
    settings.value.graphicsQuality = quality
  }

  /**
   * 切换音效开关
   */
  const toggleSoundEnabled = (): void => {
    settings.value.sfxEnabled = !settings.value.sfxEnabled
  }

  /**
   * 切换音乐开关
   */
  const toggleMusicEnabled = (): void => {
    settings.value.bgmEnabled = !settings.value.bgmEnabled
  }

  /**
   * 设置音效音量
   * @param volume 音量 0-1
   */
  const setSoundVolume = (volume: number): void => {
    settings.value.sfxVolume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 设置音乐音量
   * @param volume 音量 0-1
   */
  const setMusicVolume = (volume: number): void => {
    settings.value.bgmVolume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 保存进度
   * 手动触发保存
   */
  const saveProgress = (): void => {
    saveToStorage()
  }

  /**
   * 切换游戏场景
   * @param scene 目标场景
   */
  const changeScene = (scene: GameScene): void => {
    currentScene.value = scene
  }

  /**
   * 选择关卡
   * @param levelId 关卡ID
   */
  const selectLevel = (levelId: string): void => {
    if (isLevelUnlocked(levelId)) {
      currentLevel.value = levelId
    }
  }

  /**
   * 更新生命值
   * @param value 新的生命值或变化量
   * @param isDelta 是否为增量变化，默认为false（直接设置值）
   */
  const updateHealth = (value: number, isDelta: boolean = false): void => {
    if (isDelta) {
      gameState.value.health = Math.max(0, Math.min(gameState.value.maxHealth, gameState.value.health + value))
    } else {
      gameState.value.health = Math.max(0, Math.min(gameState.value.maxHealth, value))
    }
  }

  /**
   * 增加收集物
   * @param amount 数量，默认为1
   */
  const addCollectibles = (amount: number = 1): void => {
    gameState.value.collectibles += amount
    totalParticles.value += amount
  }

  /**
   * 更新游戏时间
   * @param deltaTime 时间增量（秒）
   */
  const updateGameTime = (deltaTime: number): void => {
    if (!gameState.value.isPaused) {
      gameState.value.gameTime += deltaTime
    }
  }

  /**
   * 暂停游戏
   */
  const pauseGame = (): void => {
    gameState.value.isPaused = true
    currentScene.value = 'paused'
  }

  /**
   * 恢复游戏
   */
  const resumeGame = (): void => {
    gameState.value.isPaused = false
    currentScene.value = 'playing'
  }

  /**
   * 更新分数
   * @param points 增加的分数
   */
  const addScore = (points: number): void => {
    gameState.value.score += points
  }

  /**
   * 记录最高分
   * 如果当前分数更高则更新
   * @param levelId 关卡ID
   */
  const recordHighScore = (levelId: string): void => {
    const currentScore = gameState.value.score
    const currentHigh = highScores.value[levelId] ?? 0
    if (currentScore > currentHigh) {
      highScores.value[levelId] = currentScore
    }
  }

  /**
   * 获取关卡最高分
   * @param levelId 关卡ID
   */
  const getHighScore = (levelId: string): number => {
    return highScores.value[levelId] ?? 0
  }

  /**
   * 重置关卡状态
   * 重置游戏内实时状态，用于开始新关卡或重新开始
   */
  const resetLevelState = (): void => {
    gameState.value = { ...DEFAULT_GAME_STATE }
  }

  /**
   * 完成关卡
   * 记录分数和星级，解锁下一关
   * @param stars 获得的星级
   * @param nextLevelId 下一关ID（可选）
   */
  const completeLevel = (stars: number, nextLevelId?: string): void => {
    recordLevelStars(currentLevel.value, stars)
    recordHighScore(currentLevel.value)
    if (nextLevelId) {
      unlockLevel(nextLevelId)
    }
    currentScene.value = 'victory'
  }

  /**
   * 游戏结束
   */
  const gameOver = (): void => {
    currentScene.value = 'gameOver'
  }

  /**
   * 计算属性：总星级数
   */
  const totalStars = computed<number>(() => {
    return Object.values(levelStars.value).reduce((sum, stars) => sum + stars, 0)
  })

  /**
   * 计算属性：当前生命值百分比
   */
  const healthPercentage = computed<number>(() => {
    if (gameState.value.maxHealth <= 0) return 0
    return (gameState.value.health / gameState.value.maxHealth) * 100
  })

  /**
   * 计算属性：是否为满血状态
   */
  const isFullHealth = computed<boolean>(() => {
    return gameState.value.health >= gameState.value.maxHealth
  })

  /**
   * 计算属性：是否游戏结束（生命值为0）
   */
  const isGameOver = computed<boolean>(() => {
    return gameState.value.health <= 0
  })

  return {
    currentScene,
    currentLevel,
    unlockedLevels,
    levelStars,
    totalParticles,
    highScores,
    settings,
    gameState,
    totalStars,
    healthPercentage,
    isFullHealth,
    isGameOver,
    initGame,
    loadFromStorage,
    saveToStorage,
    saveProgress,
    unlockLevel,
    isLevelUnlocked,
    recordLevelStars,
    getLevelStars,
    updateSettings,
    setGraphicsQuality,
    toggleSoundEnabled,
    toggleMusicEnabled,
    setSoundVolume,
    setMusicVolume,
    changeScene,
    selectLevel,
    updateHealth,
    addCollectibles,
    updateGameTime,
    pauseGame,
    resumeGame,
    addScore,
    recordHighScore,
    getHighScore,
    resetLevelState,
    completeLevel,
    gameOver,
    resetPersistentData
  }
})
