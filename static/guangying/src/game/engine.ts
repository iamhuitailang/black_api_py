/**
 * 游戏主引擎
 * 负责游戏循环、状态管理、系统集成、实体管理和游戏逻辑调度
 */

import type { GameScene, Vector2, Rect, GamePersistentData, GameRuntimeState, LevelStars, HighScores, UnlockedLevels, STORAGE_KEY, GameSettings } from '../types/index'
import type { LevelData } from '../levels/forest'
import { Player } from '../entities/player'
import { Platform, NormalPlatform, MovingPlatform, OneWayPlatform } from '../entities/platform'
import { Collectible, CollectibleGroup } from '../entities/collectible'
import { LightZone, ShadowZone } from '../entities/light'
import { Torch, TorchGroup } from '../entities/torch'
import { Trap, SpikeTrap, SawTrap, FireTrap } from '../entities/trap'
import { InputSystem, inputSystem } from './input'
import { PhysicsSystem, physicsSystem } from './physics'
import { ParticleSystem, particleSystem } from './particles'
import { AudioSystem, audioSystem } from './audio'
import { Renderer } from './renderer'
import { clamp } from '../utils/math'

/**
 * 游戏事件类型
 */
export type GameEventType =
  | 'levelStart'
  | 'levelComplete'
  | 'gameOver'
  | 'playerHurt'
  | 'playerHeal'
  | 'collectibleCollected'
  | 'torchLit'
  | 'torchExtinguished'
  | 'pause'
  | 'resume'
  | 'scoreChanged'
  | 'shadowStateChanged'

/**
 * 游戏事件数据
 */
export interface GameEvent {
  /** 事件类型 */
  type: GameEventType
  /** 事件数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
}

/**
 * 游戏事件监听器
 */
export type GameEventListener = (event: GameEvent) => void

/**
 * 游戏引擎配置
 */
export interface EngineConfig {
  /** 画布元素 */
  canvas: HTMLCanvasElement
  /** 画布宽度 */
  width: number
  /** 画布高度 */
  height: number
  /** 固定时间步长（秒） */
  fixedTimeStep: number
  /** 最大帧累积时间（秒） */
  maxFrameAccumulator: number
  /** 目标FPS */
  targetFPS: number
  /** 画质等级 */
  quality: 'low' | 'medium' | 'high'
}

/**
 * 关卡结算数据
 */
export interface LevelResult {
  /** 是否成功 */
  success: boolean
  /** 关卡ID */
  levelId: number
  /** 完成时间（秒） */
  completionTime: number
  /** 目标时间（秒） */
  targetTime: number
  /** 收集物数量 */
  collectedItems: number
  /** 总收集物数量 */
  totalItems: number
  /** 获得分数 */
  score: number
  /** 获得星星数 0-3 */
  stars: number
  /** 是否首次通关 */
  isNewRecord: boolean
}

/**
 * 游戏主引擎类
 */
export class GameEngine {
  /** 画布元素 */
  private canvas: HTMLCanvasElement
  /** 配置 */
  private config: EngineConfig

  /** 当前游戏场景 */
  private currentScene: GameScene = 'menu'
  /** 游戏是否暂停 */
  private isPaused: boolean = false
  /** 游戏是否正在运行 */
  private isRunning: boolean = false

  /** 游戏循环ID */
  private animationFrameId: number | null = null
  /** 上一帧时间戳 */
  private lastTime: number = 0
  /** 时间累积器（用于固定时间步长） */
  private accumulator: number = 0
  /** 帧时间平滑 */
  private deltaTimeSmooth: number = 0
  /** FPS计数器 */
  private fpsCounter: { frames: number; lastTime: number; current: number } = {
    frames: 0,
    lastTime: 0,
    current: 0,
  }

  /** 游戏内实时状态 */
  private gameState: GameRuntimeState
  /** 当前关卡ID */
  private currentLevelId: number = 0

  /** 玩家实体 */
  private player: Player | null = null
  /** 平台列表 */
  private platforms: Platform[] = []
  /** 收集物组 */
  private collectibles: CollectibleGroup = new CollectibleGroup()
  /** 光区域列表 */
  private lightZones: LightZone[] = []
  /** 影区域列表 */
  private shadowZones: ShadowZone[] = []
  /** 火把组 */
  private torches: TorchGroup = new TorchGroup()
  /** 陷阱列表 */
  private traps: Trap[] = []

  /** 渲染系统 */
  private renderer: Renderer
  /** 输入系统 */
  private inputSystem: InputSystem
  /** 物理系统 */
  private physicsSystem: PhysicsSystem
  /** 粒子系统 */
  private particleSystem: ParticleSystem
  /** 音效系统 */
  private audioSystem: AudioSystem

  /** 事件监听器映射 */
  private eventListeners: Map<GameEventType, Set<GameEventListener>> = new Map()
  /** 事件队列 */
  private eventQueue: GameEvent[] = []

  /** 游戏开始时间 */
  private gameStartTime: number = 0
  /** 游戏暂停时间累计 */
  private pausedTimeAccumulator: number = 0
  /** 暂停开始时间 */
  private pauseStartTime: number = 0

  /** 持久化数据 */
  private persistentData: GamePersistentData | null = null

  /** UI渲染回调 */
  private uiRenderCallback: ((ctx: CanvasRenderingContext2D) => void) | null = null

  /**
   * 构造函数
   * @param config 引擎配置
   */
  constructor(config: EngineConfig) {
    this.canvas = config.canvas
    this.config = {
      fixedTimeStep: 1 / 60,
      maxFrameAccumulator: 0.25,
      targetFPS: 60,
      quality: 'high',
      ...config,
    }

    this.canvas.width = this.config.width
    this.canvas.height = this.config.height

    this.gameState = {
      health: 3,
      maxHealth: 3,
      collectibles: 0,
      totalCollectibles: 0,
      gameTime: 0,
      isPaused: false,
      score: 0,
      shadowState: 'light',
    }

    this.renderer = new Renderer(this.canvas, {
      width: this.config.width,
      height: this.config.height,
      quality: this.config.quality,
    })

    this.inputSystem = inputSystem
    this.physicsSystem = physicsSystem
    this.particleSystem = particleSystem
    this.audioSystem = audioSystem

    this.loadPersistentData()
  }

  /**
   * 初始化游戏引擎
   */
  public init(): void {
    this.inputSystem.init(this.canvas, true)
    this.audioSystem.init()
    this.setupInputListeners()
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop(this.lastTime)
  }

  /**
   * 设置输入监听器
   */
  private setupInputListeners(): void {
    this.inputSystem.on('pause', () => {
      if (this.currentScene === 'playing') {
        this.togglePause()
      }
    })
  }

  /**
   * 游戏主循环
   * @param currentTime 当前时间戳
   */
  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return

    this.animationFrameId = requestAnimationFrame(this.gameLoop)

    const deltaTime = Math.min(
      (currentTime - this.lastTime) / 1000,
      this.config.maxFrameAccumulator
    )
    this.lastTime = currentTime

    this.updateFPS(deltaTime)
    this.deltaTimeSmooth = deltaTime

    if (!this.isPaused && this.currentScene === 'playing') {
      this.accumulator += deltaTime

      while (this.accumulator >= this.config.fixedTimeStep) {
        this.fixedUpdate(this.config.fixedTimeStep)
        this.accumulator -= this.config.fixedTimeStep
      }
    }

    this.update(deltaTime)
    this.render(deltaTime)
    this.processEventQueue()
  }

  /**
   * 更新FPS计数器
   */
  private updateFPS(deltaTime: number): void {
    this.fpsCounter.frames++
    this.fpsCounter.lastTime += deltaTime

    if (this.fpsCounter.lastTime >= 1) {
      this.fpsCounter.current = this.fpsCounter.frames
      this.fpsCounter.frames = 0
      this.fpsCounter.lastTime = 0
    }
  }

  /**
   * 固定时间步长更新（物理逻辑）
   * @param deltaTime 固定时间步长
   */
  private fixedUpdate(deltaTime: number): void {
    if (!this.player || !this.currentLevel) return

    this.updateInput(deltaTime)
    this.updateEntities(deltaTime)
    this.checkCollisions()
    this.checkLightShadow()
    this.updateGameState(deltaTime)
    this.checkWinLoseConditions()
  }

  /**
   * 每帧更新（动画、粒子等）
   * @param deltaTime 帧时间
   */
  private update(deltaTime: number): void {
    this.inputSystem.update(deltaTime * 1000)
    this.particleSystem.update(deltaTime * 1000)

    if (this.player && this.currentScene === 'playing' && !this.isPaused) {
      this.renderer.updateCamera(this.player.position, deltaTime)
      this.renderer.updateParticleViewport(this.particleSystem)
    }

    this.gameState.gameTime = this.getCurrentGameTime()
  }

  /**
   * 更新玩家输入
   */
  private updateInput(deltaTime: number): void {
    if (!this.player) return

    const moveVector = this.inputSystem.getMoveVector()
    const jumpPressed = this.inputSystem.isActionPressed('jump')
    const jumpHeld = this.inputSystem.isActionHeld('jump')
    const interactPressed = this.inputSystem.isActionPressed('interact')

    this.player.setInput({
      horizontal: moveVector.x,
      jumpPressed,
      jumpHeld,
      shadowToggle: interactPressed,
    })
  }

  /**
   * 更新所有实体
   */
  private updateEntities(deltaTime: number): void {
    if (!this.player || !this.currentLevel) return

    this.player.update(deltaTime)

    for (const platform of this.platforms) {
      platform.update(deltaTime, this.player)
    }

    const scoreGained = this.collectibles.update(deltaTime, this.player)
    if (scoreGained > 0) {
      this.gameState.score += scoreGained
      this.gameState.collectibles = this.collectibles.collectedCount
      this.emitEvent('scoreChanged', { score: this.gameState.score })
      this.audioSystem.playSound('collect')
      this.particleSystem.playEffect('light', this.player.position, 15)
    }

    for (const zone of this.lightZones) {
      zone.update(deltaTime, this.player)
    }

    for (const zone of this.shadowZones) {
      zone.update(deltaTime, this.player)
    }

    this.torches.update(deltaTime, this.player)

    for (const trap of this.traps) {
      trap.update(deltaTime, this.player)
    }
  }

  /**
   * 碰撞检测调度
   */
  private checkCollisions(): void {
    if (!this.player) return

    for (const trap of this.traps) {
      if (trap.checkCollision(this.player)) {
        if (trap.dealDamage(this.player)) {
          this.emitEvent('playerHurt', { damage: trap.damage })
          this.audioSystem.playSound('hurt')
          this.renderer.addScreenShake(8, 0.3)
          this.particleSystem.playEffect('shadow', this.player.position, 20)

          if (this.player.health <= 0) {
            this.gameOver()
          }
        }
      }
    }
  }

  /**
   * 光影检测调度
   */
  private checkLightShadow(): void {
    if (!this.player) return

    let inLight = false
    let inShadow = false

    for (const zone of this.lightZones) {
      if (zone.containsPoint(this.player.position.x, this.player.position.y - this.player.size.height / 2)) {
        inLight = true
        break
      }
    }

    for (const zone of this.shadowZones) {
      if (zone.containsPoint(this.player.position.x, this.player.position.y - this.player.size.height / 2)) {
        inShadow = true
        break
      }
    }

    if (inLight !== this.player.isInLightZone) {
      this.player.isInLightZone = inLight
    }

    if (inShadow !== this.player.isInShadowZone) {
      this.player.isInShadowZone = inShadow
      if (inShadow) {
        this.particleSystem.playEffect('shadow', this.player.position, 10)
      }
    }
  }

  /**
   * 更新游戏状态
   */
  private updateGameState(deltaTime: number): void {
    if (!this.player) return

    this.gameState.health = this.player.health
    this.gameState.maxHealth = this.player.maxHealth
  }

  /**
   * 检查胜利/失败条件
   */
  private checkWinLoseConditions(): void {
    if (!this.player || !this.currentLevel) return

    if (this.player.health <= 0) {
      this.gameOver()
      return
    }

    const exitPoint = this.currentLevel.exitPoint
    const exitRect: Rect = {
      x: exitPoint.x - 30,
      y: exitPoint.y - 60,
      width: 60,
      height: 60,
    }

    const playerBounds = this.player.getBounds()
    const dx = playerBounds.x + playerBounds.width / 2 - exitPoint.x
    const dy = playerBounds.y + playerBounds.height / 2 - exitPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 40) {
      this.levelComplete()
    }
  }

  /**
   * 渲染游戏
   */
  private render(deltaTime: number): void {
    if (!this.player || !this.currentLevel) {
      this.renderMenuBackground()
      return
    }

    this.renderer.render(
      deltaTime,
      this.player,
      this.platforms,
      this.collectibles,
      this.lightZones,
      this.shadowZones,
      this.torches,
      this.traps,
      this.particleSystem,
      this.uiRenderCallback || undefined
    )
  }

  /**
   * 渲染菜单背景
   */
  private renderMenuBackground(): void {
    const ctx = this.canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height)
    gradient.addColorStop(0, '#0d0620')
    gradient.addColorStop(0.5, '#1a0a2e')
    gradient.addColorStop(1, '#2d1b4e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.config.width, this.config.height)

    const time = Date.now() * 0.001
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137.5 + time * 10) % this.config.width + this.config.width) % this.config.width
      const y = ((i * 89.3) % this.config.height + this.config.height) % this.config.height
      const size = (i % 3) + 1
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /** 当前关卡数据 */
  private currentLevel: LevelData | null = null

  /**
   * 加载关卡
   * @param level 关卡数据
   */
  public loadLevel(level: LevelData): void {
    this.currentLevel = level
    this.currentLevelId = level.id

    this.physicsSystem.setLevelSize(level.width, level.height)

    this.clearEntities()

    this.player = new Player(
      level.spawnPoint.x,
      level.spawnPoint.y,
      3
    )

    this.platforms = []
    
    for (const platformData of level.platforms) {
      if (platformData.type === 'oneWay') {
        this.platforms.push(new OneWayPlatform({
          type: 'oneWay',
          position: platformData.position,
          size: platformData.size,
          collidable: true,
          passThroughThreshold: (platformData as any).passThroughThreshold || 10,
        }))
      } else {
        this.platforms.push(new NormalPlatform({
          type: 'normal',
          position: platformData.position,
          size: platformData.size,
          collidable: true,
        }))
      }
    }

    for (const platformData of level.movingPlatforms) {
      this.platforms.push(new MovingPlatform({
        type: 'moving',
        position: platformData.position,
        size: platformData.size,
        collidable: true,
        mode: (platformData as any).loop ? 'loop' : (platformData as any).pingPong ? 'pingPong' : 'path',
        path: (platformData as any).pathPoints?.map((p: any) => ({ x: p.x, y: p.y })) || [],
        speed: (platformData as any).moveSpeed || 50,
        autoStart: true,
      }))
    }

    for (const collectibleData of level.collectibles) {
      const collectible = new Collectible({
        type: collectibleData.type as any || 'lightParticle',
        position: collectibleData.position,
        size: 12,
        score: (collectibleData as any).value || 100,
        attractRadius: 80,
        attractSpeed: 300,
        collectRadius: 25,
      })
      this.collectibles.add(collectible)
    }

    for (const zoneData of level.lightZones) {
      const zoneSize = typeof zoneData.size === 'number' 
        ? { width: zoneData.size, height: zoneData.size }
        : zoneData.size
      const zone = new LightZone({
        position: {
          x: zoneData.position.x + zoneSize.width / 2,
          y: zoneData.position.y + zoneSize.height / 2,
        },
        size: zoneSize,
        shape: 'rectangle',
        speedMultiplier: 1.3,
        jumpMultiplier: 1.2,
        glowColor: '#FFD700',
        glowIntensity: (zoneData as any).intensity || 0.5,
      })
      this.lightZones.push(zone)
    }

    for (const zoneData of level.shadowZones) {
      const zoneSize = typeof zoneData.size === 'number' 
        ? { width: zoneData.size, height: zoneData.size }
        : zoneData.size
      const zone = new ShadowZone({
        position: {
          x: zoneData.position.x + zoneSize.width / 2,
          y: zoneData.position.y + zoneSize.height / 2,
        },
        size: zoneSize,
        shape: 'rectangle',
        allowPhasing: true,
        glowColor: '#8A2BE2',
        glowIntensity: (zoneData as any).density || 0.5,
      })
      this.shadowZones.push(zone)
    }

    for (const torchData of level.torches) {
      const torch = new Torch({
        position: torchData.position,
        size: { width: 20, height: 40 },
        baseLightRadius: (torchData as any).lightRadius || 150,
        maxLightRadius: (torchData as any).lightRadius ? (torchData as any).lightRadius * 1.5 : 225,
        flameIntensity: (torchData as any).lightIntensity || 0.8,
        movable: false,
        rotatable: false,
        moveSpeed: 0,
        rotationSpeed: 0,
        initialRotation: 0,
        initiallyLit: (torchData as any).isLit !== false,
      })
      this.torches.add(torch)
    }

    for (const trapData of level.traps) {
      let trap: Trap
      if (trapData.type === 'spike') {
        trap = new SpikeTrap({
          type: 'spike',
          position: trapData.position,
          size: trapData.size,
          damage: (trapData as any).damage || 1,
          active: (trapData as any).isActive !== false,
          spikeCount: Math.max(3, Math.floor(trapData.size.width / 20)),
          spikeHeight: Math.min(trapData.size.height, 20),
        })
      } else if (trapData.type === 'saw') {
        trap = new SawTrap({
          type: 'saw',
          position: trapData.position,
          size: trapData.size,
          damage: (trapData as any).damage || 1,
          active: (trapData as any).isActive !== false,
          startPoint: { x: trapData.position.x, y: trapData.position.y },
          endPoint: { x: trapData.position.x + 100, y: trapData.position.y },
          speed: 100,
          radius: Math.min(trapData.size.width, trapData.size.height) / 2,
          rotationSpeed: 10,
        })
      } else if (trapData.type === 'fire') {
        trap = new FireTrap({
          type: 'fire',
          position: trapData.position,
          size: trapData.size,
          damage: (trapData as any).damage || 1,
          active: (trapData as any).isActive !== false,
          cycleTime: 3,
          activeDuration: 1.5,
          startDelay: 0,
          flameHeight: 60,
        })
      } else {
        trap = new SpikeTrap({
          type: 'spike',
          position: trapData.position,
          size: trapData.size,
          damage: (trapData as any).damage || 1,
          active: (trapData as any).isActive !== false,
          spikeCount: Math.max(3, Math.floor(trapData.size.width / 20)),
          spikeHeight: Math.min(trapData.size.height, 20),
        })
      }
      this.traps.push(trap)
    }

    this.renderer.resetCamera(level.spawnPoint)
    this.renderer.prerenderBackground(this.platforms.filter(p => p.type === 'normal'), level.background.backgroundColor)

    this.gameState = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      collectibles: 0,
      totalCollectibles: level.collectibles.length,
      gameTime: 0,
      isPaused: false,
      score: 0,
      shadowState: 'light',
    }

    this.gameStartTime = performance.now()
    this.pausedTimeAccumulator = 0

    this.emitEvent('levelStart', { levelId: level.id, levelName: level.name })
    this.audioSystem.fadeInMusic('level1', 1)
  }

  /**
   * 开始游戏
   */
  public startGame(): void {
    this.currentScene = 'playing'
    this.isPaused = false
    this.gameStartTime = performance.now()
    this.pausedTimeAccumulator = 0
    this.audioSystem.resume()
  }

  /**
   * 暂停游戏
   */
  public pause(): void {
    if (this.isPaused) return
    this.isPaused = true
    this.gameState.isPaused = true
    this.pauseStartTime = performance.now()
    this.particleSystem.pause()
    this.audioSystem.setMusicVolume(this.audioSystem.getMusicVolume() * 0.3)
    this.emitEvent('pause', {})
  }

  /**
   * 继续游戏
   */
  public resume(): void {
    if (!this.isPaused) return
    this.isPaused = false
    this.gameState.isPaused = false
    this.pausedTimeAccumulator += performance.now() - this.pauseStartTime
    this.particleSystem.resume()
    this.audioSystem.setMusicVolume(this.audioSystem.getMusicVolume() / 0.3)
    this.emitEvent('resume', {})
  }

  /**
   * 切换暂停状态
   */
  public togglePause(): void {
    if (this.isPaused) {
      this.resume()
    } else {
      this.pause()
    }
  }

  /**
   * 关卡完成
   */
  private levelComplete(): void {
    if (!this.currentLevel || !this.player) return

    this.currentScene = 'levelComplete'
    this.isPaused = true
    this.audioSystem.playVictory()
    this.audioSystem.fadeOutMusic(0.5)

    const completionTime = this.getCurrentGameTime()
    const collectedItems = this.collectibles.collectedCount
    const totalItems = this.collectibles.totalCount
    const score = this.calculateScore(completionTime, collectedItems, totalItems)
    const stars = this.calculateStars(completionTime, this.currentLevel.targetTime, collectedItems, totalItems)

    const result: LevelResult = {
      success: true,
      levelId: this.currentLevel.id,
      completionTime,
      targetTime: this.currentLevel.targetTime,
      collectedItems,
      totalItems,
      score,
      stars,
      isNewRecord: this.isNewScore(this.currentLevel.id, score),
    }

    this.saveLevelResult(result)
    this.emitEvent('levelComplete', result)
  }

  /**
   * 游戏结束
   */
  private gameOver(): void {
    if (!this.currentLevel || !this.player) return

    this.currentScene = 'gameOver'
    this.isPaused = true
    this.audioSystem.playGameOver()
    this.audioSystem.fadeOutMusic(0.5)

    const result: LevelResult = {
      success: false,
      levelId: this.currentLevel.id,
      completionTime: this.getCurrentGameTime(),
      targetTime: this.currentLevel.targetTime,
      collectedItems: this.collectibles.collectedCount,
      totalItems: this.collectibles.totalCount,
      score: this.gameState.score,
      stars: 0,
      isNewRecord: false,
    }

    this.emitEvent('gameOver', result)
  }

  /**
   * 重新开始当前关卡
   */
  public restartLevel(): void {
    if (!this.currentLevel) return

    this.resetLevelState()
    this.loadLevel(this.currentLevel)
    this.startGame()
  }

  /**
   * 重置关卡状态
   */
  private resetLevelState(): void {
    this.player = null
    this.platforms = []
    this.collectibles = new CollectibleGroup()
    this.lightZones = []
    this.shadowZones = []
    this.torches = new TorchGroup()
    this.traps = []
    this.particleSystem.clear()
    this.accumulator = 0
  }

  /**
   * 清空所有实体
   */
  private clearEntities(): void {
    this.resetLevelState()
  }

  /**
   * 计算分数
   */
  private calculateScore(time: number, collected: number, total: number): number {
    const baseScore = collected * 100
    const timeBonus = Math.max(0, Math.floor((300 - time) * 10))
    const completionBonus = collected === total ? 500 : 0
    return baseScore + timeBonus + completionBonus
  }

  /**
   * 计算星级
   */
  private calculateStars(
    time: number,
    targetTime: number,
    collected: number,
    total: number
  ): number {
    let stars = 1

    if (time <= targetTime * 1.5) {
      stars++
    }

    if (collected === total && time <= targetTime) {
      stars++
    }

    return stars
  }

  /**
   * 检查是否新纪录
   */
  private isNewScore(levelId: number, score: number): boolean {
    if (!this.persistentData) return true
    const highScore = this.persistentData.highScores[levelId.toString()] || 0
    return score > highScore
  }

  /**
   * 保存关卡结果
   */
  private saveLevelResult(result: LevelResult): void {
    if (!this.persistentData) return

    const levelIdStr = result.levelId.toString()

    if (result.success) {
      if (!this.persistentData.unlockedLevels.includes(levelIdStr)) {
        this.persistentData.unlockedLevels.push(levelIdStr)
      }

      const currentStars = this.persistentData.levelStars[levelIdStr] || 0
      if (result.stars > currentStars) {
        this.persistentData.levelStars[levelIdStr] = result.stars
      }

      const currentHighScore = this.persistentData.highScores[levelIdStr] || 0
      if (result.score > currentHighScore) {
        this.persistentData.highScores[levelIdStr] = result.score
      }
    }

    this.savePersistentData()
  }

  /**
   * 获取当前游戏时间（扣除暂停时间）
   */
  private getCurrentGameTime(): number {
    const elapsed = (performance.now() - this.gameStartTime - this.pausedTimeAccumulator) / 1000
    return Math.max(0, elapsed)
  }

  /**
   * 加载持久化数据
   */
  private loadPersistentData(): void {
    try {
      const data = localStorage.getItem('guangying_game_data')
      if (data) {
        this.persistentData = JSON.parse(data)
      } else {
        this.persistentData = {
          currentLevel: '1',
          unlockedLevels: ['1'],
          levelStars: {},
          totalParticles: 0,
          highScores: {},
          settings: {
            bgmVolume: 0.5,
            sfxVolume: 0.7,
            bgmEnabled: true,
            sfxEnabled: true,
            graphicsQuality: 'high',
            showFPS: false,
            showHitboxes: false,
          },
        }
      }
    } catch (e) {
      console.warn('加载存档失败:', e)
      this.persistentData = {
        currentLevel: '1',
        unlockedLevels: ['1'],
        levelStars: {},
        totalParticles: 0,
        highScores: {},
        settings: {
          bgmVolume: 0.5,
          sfxVolume: 0.7,
          bgmEnabled: true,
          sfxEnabled: true,
          graphicsQuality: 'high',
          showFPS: false,
          showHitboxes: false,
        },
      }
    }
  }

  /**
   * 保存持久化数据
   */
  private savePersistentData(): void {
    if (!this.persistentData) return
    try {
      localStorage.setItem('guangying_game_data', JSON.stringify(this.persistentData))
    } catch (e) {
      console.warn('保存存档失败:', e)
    }
  }

  /**
   * 添加事件监听器
   */
  public on(eventType: GameEventType, listener: GameEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  public off(eventType: GameEventType, listener: GameEventListener): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 发送事件
   */
  private emitEvent(eventType: GameEventType, data?: any): void {
    const event: GameEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
    }
    this.eventQueue.push(event)
  }

  /**
   * 处理事件队列
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      const listeners = this.eventListeners.get(event.type)
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(event)
          } catch (e) {
            console.error('事件监听器错误:', e)
          }
        }
      }
    }
  }

  /**
   * 添加实体
   */
  public addEntity(entity: any): void {
    if (entity instanceof Platform) {
      this.platforms.push(entity)
      this.renderer.invalidateBackground()
    } else if (entity instanceof Collectible) {
      this.collectibles.add(entity)
    } else if (entity instanceof LightZone) {
      this.lightZones.push(entity)
    } else if (entity instanceof ShadowZone) {
      this.shadowZones.push(entity)
    } else if (entity instanceof Torch) {
      this.torches.add(entity)
    } else if (entity instanceof Trap) {
      this.traps.push(entity)
    }
  }

  /**
   * 移除实体
   */
  public removeEntity(entity: any): void {
    if (entity instanceof Platform) {
      const index = this.platforms.indexOf(entity)
      if (index > -1) {
        this.platforms.splice(index, 1)
        this.renderer.invalidateBackground()
      }
    } else if (entity instanceof Collectible) {
      const index = this.collectibles.collectibles.indexOf(entity)
      if (index > -1) {
        this.collectibles.collectibles.splice(index, 1)
      }
    } else if (entity instanceof LightZone) {
      const index = this.lightZones.indexOf(entity)
      if (index > -1) {
        this.lightZones.splice(index, 1)
      }
    } else if (entity instanceof ShadowZone) {
      const index = this.shadowZones.indexOf(entity)
      if (index > -1) {
        this.shadowZones.splice(index, 1)
      }
    } else if (entity instanceof Torch) {
      const index = this.torches.torches.indexOf(entity)
      if (index > -1) {
        this.torches.torches.splice(index, 1)
      }
    } else if (entity instanceof Trap) {
      const index = this.traps.indexOf(entity)
      if (index > -1) {
        this.traps.splice(index, 1)
      }
    }
  }

  /**
   * 设置UI渲染回调
   */
  public setUIRenderCallback(callback: (ctx: CanvasRenderingContext2D) => void): void {
    this.uiRenderCallback = callback
  }

  /**
   * 获取当前FPS
   */
  public getFPS(): number {
    return this.fpsCounter.current
  }

  /**
   * 获取游戏状态
   */
  public getGameState(): GameRuntimeState {
    return { ...this.gameState }
  }

  /**
   * 获取当前场景
   */
  public getCurrentScene(): GameScene {
    return this.currentScene
  }

  /**
   * 设置当前场景
   */
  public setScene(scene: GameScene): void {
    this.currentScene = scene
    if (scene === 'menu' || scene === 'levelSelect') {
      this.audioSystem.fadeOutMusic(0.5)
    }
  }

  /**
   * 获取渲染器
   */
  public getRenderer(): Renderer {
    return this.renderer
  }

  /**
   * 获取输入系统
   */
  public getInputSystem(): InputSystem {
    return this.inputSystem
  }

  /**
   * 获取物理系统
   */
  public getPhysicsSystem(): PhysicsSystem {
    return this.physicsSystem
  }

  /**
   * 获取粒子系统
   */
  public getParticleSystem(): ParticleSystem {
    return this.particleSystem
  }

  /**
   * 获取音效系统
   */
  public getAudioSystem(): AudioSystem {
    return this.audioSystem
  }

  /**
   * 获取玩家
   */
  public getPlayer(): Player | null {
    return this.player
  }

  /**
   * 获取当前关卡
   */
  public getCurrentLevel(): LevelData | null {
    return this.currentLevel
  }

  /**
   * 获取持久化数据
   */
  public getPersistentData(): GamePersistentData | null {
    return this.persistentData ? { ...this.persistentData } : null
  }

  /**
   * 应用游戏设置
   */
  public applySettings(settings: Partial<GameSettings>): void {
    this.audioSystem.applySettings(settings)

    if (settings.graphicsQuality) {
      this.renderer.setQuality(settings.graphicsQuality)
    }

    if (this.persistentData) {
      this.persistentData.settings = {
        ...this.persistentData.settings,
        ...settings,
      }
      this.savePersistentData()
    }
  }

  /**
   * 销毁游戏引擎
   */
  public destroy(): void {
    this.isRunning = false

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.inputSystem.destroy()
    this.audioSystem.dispose()
    this.particleSystem.destroy()
    this.physicsSystem.dispose()
    this.clearEntities()
    this.eventListeners.clear()
    this.eventQueue.length = 0
  }
}
