import { Vector2, circleCollision, rectCircleCollision, clamp, randomRange, randomInt } from './utils'
import { Hamster } from './Hamster'
import { AIController } from './AIController'
import { MapItem } from './MapItem'
import { Obstacle } from './Obstacle'
import { MAPS, ITEMS, SPECIAL_GUESTS, HAMSTER_SKINS } from '@/data/gameData'
import type { Difficulty, AIType } from '@/types/game'

export interface GameEngineConfig {
  mapId: string
  difficulty: Difficulty
  playerSkin: string
  playerName: string
  selectedItems: string[]
}

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'finished'
  timeRemaining: number
  totalTime: number
  player: Hamster | null
  opponents: { hamster: Hamster; ai: AIController }[]
  items: MapItem[]
  obstacles: Obstacle[]
  map: typeof MAPS[0]
  rankings: { id: string; name: string; size: number; isPlayer: boolean }[]
  specialGuest: any
  specialGuestActive: boolean
  winner: string | null
  isPlayerWin: boolean
}

const AI_OPPONENT_NAMES = [
  '雪球小白', '冰雪萌萌', '南极探险家', '极光使者',
  '糖果甜心', '飞速豆豆', '聪明球球', '勇敢布丁'
]

const AI_TYPES: AIType[] = ['aggressive', 'defensive', 'balanced', 'tricky']

export class GameEngine {
  state: GameState
  canvasWidth: number = 800
  canvasHeight: number = 600
  camera: Vector2 = new Vector2()
  zoom: number = 1

  private lastTime: number = 0
  private animationFrameId: number = 0
  private onUpdateCallback: ((state: GameState) => void) | null = null
  private onFinishCallback: ((state: GameState) => void) | null = null
  private itemSpawnTimer: number = 0
  private itemSpawnInterval: number = 5000
  private maxItems: number = 8

  constructor(config: GameEngineConfig) {
    const map = MAPS.find(m => m.id === config.mapId) || MAPS[0]
    
    this.state = {
      status: 'idle',
      timeRemaining: 90,
      totalTime: 90,
      player: null,
      opponents: [],
      items: [],
      obstacles: [],
      map,
      rankings: [],
      specialGuest: null,
      specialGuestActive: false,
      winner: null,
      isPlayerWin: false
    }

    this.initPlayer(config.playerSkin, config.playerName)
    this.initOpponents(config.difficulty)
    this.initObstacles()
    this.initItems()
    this.trySpawnSpecialGuest()
  }

  private initPlayer(skinId: string, name: string): void {
    const skin = HAMSTER_SKINS.find(s => s.id === skinId) || HAMSTER_SKINS[0]
    const map = this.state.map
    
    this.state.player = new Hamster({
      id: 'player',
      name,
      x: map.width * 0.2,
      y: map.height * 0.5,
      color: skin.color,
      bellyColor: skin.bellyColor,
      skin: skinId,
      isPlayer: true,
      speed: 160
    })
  }

  private initOpponents(difficulty: Difficulty): void {
    const map = this.state.map
    const opponentCount = this.getOpponentCount(difficulty)
    
    const usedNames = new Set<string>()
    const usedTypes = new Set<AIType>()
    
    for (let i = 0; i < opponentCount; i++) {
      const skin = HAMSTER_SKINS[randomInt(1, 4)]
      
      let name = AI_OPPONENT_NAMES[randomInt(0, AI_OPPONENT_NAMES.length - 1)]
      while (usedNames.has(name)) {
        name = AI_OPPONENT_NAMES[randomInt(0, AI_OPPONENT_NAMES.length - 1)]
      }
      usedNames.add(name)
      
      let aiType: AIType = AI_TYPES[i % AI_TYPES.length]
      if (difficulty === 'hard' || difficulty === 'expert') {
        aiType = AI_TYPES[randomInt(0, AI_TYPES.length - 1)]
      }
      usedTypes.add(aiType)

      const hamster = new Hamster({
        id: `ai_${i}`,
        name,
        x: map.width * (0.5 + Math.random() * 0.3),
        y: map.height * (0.2 + Math.random() * 0.6),
        color: skin.color,
        bellyColor: skin.bellyColor,
        skin: skin.id,
        isPlayer: false,
        speed: 150
      })

      const ai = new AIController({
        hamster,
        difficulty,
        aiType,
        mapWidth: map.width,
        mapHeight: map.height
      })

      this.state.opponents.push({ hamster, ai })
    }
  }

  private getOpponentCount(difficulty: Difficulty): number {
    const counts: Record<Difficulty, number> = {
      easy: 2,
      normal: 3,
      hard: 4,
      expert: 5
    }
    return counts[difficulty]
  }

  private initObstacles(): void {
    const map = this.state.map
    this.state.obstacles = map.obstacles.map(obs => new Obstacle(obs))
  }

  private initItems(): void {
    const map = this.state.map
    const spawnPoints = [...map.itemSpawnPoints]
    
    for (let i = 0; i < Math.min(5, spawnPoints.length); i++) {
      const idx = randomInt(0, spawnPoints.length - 1)
      const point = spawnPoints.splice(idx, 1)[0]
      this.spawnItem(point.x, point.y)
    }
  }

  private spawnItem(x: number, y: number): void {
    const availableItems = ITEMS.filter(item => item.rarity !== 'legendary')
    const weights = availableItems.map(item => {
      switch (item.rarity) {
        case 'common': return 50
        case 'rare': return 30
        case 'epic': return 15
        default: return 5
      }
    })
    
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight
    let selectedItem = availableItems[0]
    
    for (let i = 0; i < availableItems.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        selectedItem = availableItems[i]
        break
      }
    }

    const item = new MapItem({
      id: `item_${Date.now()}_${Math.random()}`,
      type: selectedItem.effect.type,
      x,
      y,
      emoji: selectedItem.emoji,
      name: selectedItem.name
    })

    this.state.items.push(item)
  }

  private trySpawnSpecialGuest(): void {
    for (const guest of SPECIAL_GUESTS) {
      if (Math.random() < guest.spawnChance) {
        this.state.specialGuest = guest
        break
      }
    }
  }

  start(): void {
    this.state.status = 'playing'
    this.lastTime = performance.now()
    this.gameLoop()
  }

  pause(): void {
    this.state.status = 'paused'
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing'
      this.lastTime = performance.now()
      this.gameLoop()
    }
  }

  private gameLoop(): void {
    if (this.state.status !== 'playing') return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.update(deltaTime)

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.state)
    }

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop())
  }

  private update(deltaTime: number): void {
    this.state.timeRemaining -= deltaTime / 1000
    if (this.state.timeRemaining <= 0) {
      this.finishGame()
      return
    }

    if (this.state.player) {
      this.state.player.update(deltaTime)
      this.checkItemCollision(this.state.player)
      this.checkObstacleCollision(this.state.player)
    }

    for (const { hamster, ai } of this.state.opponents) {
      const allHamsters = this.getAllHamsters()
      const { direction, useItem } = ai.update(deltaTime, allHamsters, this.state.items, this.state.obstacles)
      
      hamster.move(direction, deltaTime, { width: this.state.map.width, height: this.state.map.height })
      hamster.update(deltaTime)
      
      this.checkItemCollision(hamster)
      this.checkObstacleCollision(hamster)
    }

    for (const item of this.state.items) {
      item.update(deltaTime)
    }

    for (const obstacle of this.state.obstacles) {
      obstacle.update(deltaTime)
    }

    this.itemSpawnTimer += deltaTime
    if (this.itemSpawnTimer >= this.itemSpawnInterval && this.state.items.length < this.maxItems) {
      this.itemSpawnTimer = 0
      const spawnPoints = this.state.map.itemSpawnPoints
      const point = spawnPoints[randomInt(0, spawnPoints.length - 1)]
      this.spawnItem(point.x, point.y)
    }

    this.updateRankings()
    this.checkHamsterCollisions()
    this.updateCamera()
  }

  private getAllHamsters(): Hamster[] {
    const hamsters: Hamster[] = []
    if (this.state.player) {
      hamsters.push(this.state.player)
    }
    for (const { hamster } of this.state.opponents) {
      hamsters.push(hamster)
    }
    return hamsters
  }

  private checkItemCollision(hamster: Hamster): void {
    const snowballPos = hamster.getSnowballPosition()
    const snowballRadius = hamster.snowball.getRadius()

    for (const item of this.state.items) {
      if (item.collected) continue

      if (circleCollision(
        snowballPos.x, snowballPos.y, snowballRadius,
        item.position.x, item.position.y, item.radius
      )) {
        item.collected = true
        this.applyItemEffect(item, hamster)
        
        setTimeout(() => {
          const idx = this.state.items.indexOf(item)
          if (idx > -1) {
            this.state.items.splice(idx, 1)
          }
        }, 100)
      }
    }
  }

  private applyItemEffect(item: MapItem, hamster: Hamster): void {
    switch (item.type) {
      case 'speed':
        hamster.addBuff({ type: 'speed', value: 1.5, duration: 5000, source: item.id })
        break
      case 'shield':
        hamster.addBuff({ type: 'shield', value: 1, duration: 3000, source: item.id })
        break
      case 'slow':
        this.applySlowToNearestOpponent(hamster)
        break
      case 'double':
        hamster.addBuff({ type: 'double_growth', value: 2, duration: 8000, source: item.id })
        break
      case 'magnet':
        hamster.addBuff({ type: 'magnet', value: 200, duration: 6000, source: item.id })
        break
      case 'bomb':
      case 'shrink':
        this.applyDamageToLargestOpponent(hamster, item.type === 'bomb' ? 0.3 : 0.25)
        break
      case 'teleport':
        this.teleportHamster(hamster)
        break
    }
  }

  private applySlowToNearestOpponent(hamster: Hamster): void {
    let nearest: Hamster | null = null
    let minDist = Infinity

    for (const other of this.getAllHamsters()) {
      if (other.id === hamster.id) continue
      const dist = hamster.getSnowballPosition().distanceTo(other.getSnowballPosition())
      if (dist < minDist) {
        minDist = dist
        nearest = other
      }
    }

    if (nearest && !nearest.hasShield()) {
      nearest.addBuff({ type: 'slow', value: 0.6, duration: 4000, source: 'slow_debuff' })
    }
  }

  private applyDamageToLargestOpponent(hamster: Hamster, damage: number): void {
    let largest: Hamster | null = null
    let maxSize = 0

    for (const other of this.getAllHamsters()) {
      if (other.id === hamster.id) continue
      if (other.getSnowballSize() > maxSize && !other.hasShield()) {
        maxSize = other.getSnowballSize()
        largest = other
      }
    }

    if (largest) {
      largest.snowball.shrinkByPercent(damage)
    }
  }

  private teleportHamster(hamster: Hamster): void {
    const map = this.state.map
    const newX = randomRange(100, map.width - 100)
    const newY = randomRange(100, map.height - 100)
    
    hamster.snowball.position.set(newX, newY)
    hamster.position.set(newX - 30, newY)
  }

  private checkObstacleCollision(hamster: Hamster): void {
    const snowballPos = hamster.getSnowballPosition()
    const snowballRadius = hamster.snowball.getRadius()

    for (const obstacle of this.state.obstacles) {
      if (rectCircleCollision(
        obstacle.position.x, obstacle.position.y,
        obstacle.width, obstacle.height,
        snowballPos.x, snowballPos.y, snowballRadius
      )) {
        this.applyObstacleEffect(obstacle, hamster)
      }
    }
  }

  private applyObstacleEffect(obstacle: Obstacle, hamster: Hamster): void {
    if (hamster.hasShield()) return

    switch (obstacle.type) {
      case 'snowdrift':
        hamster.addBuff({ type: 'slow', value: 0.5, duration: 500, source: 'snowdrift' })
        hamster.snowball.shrink(0.5)
        break
      case 'ice_crack':
        hamster.snowball.shrinkByPercent(0.1)
        break
      case 'ice_ramp':
        hamster.addBuff({ type: 'speed', value: 1.8, duration: 800, source: 'ice_ramp' })
        break
      case 'bounce_pad':
        break
      case 'rock':
        hamster.snowball.shrink(1)
        break
    }
  }

  private checkHamsterCollisions(): void {
    const hamsters = this.getAllHamsters()
    
    for (let i = 0; i < hamsters.length; i++) {
      for (let j = i + 1; j < hamsters.length; j++) {
        const h1 = hamsters[i]
        const h2 = hamsters[j]
        
        const pos1 = h1.getSnowballPosition()
        const pos2 = h2.getSnowballPosition()
        const r1 = h1.snowball.getRadius()
        const r2 = h2.snowball.getRadius()

        if (circleCollision(pos1.x, pos1.y, r1, pos2.x, pos2.y, r2)) {
          this.resolveHamsterCollision(h1, h2)
        }
      }
    }
  }

  private resolveHamsterCollision(h1: Hamster, h2: Hamster): void {
    const pos1 = h1.getSnowballPosition()
    const pos2 = h2.getSnowballPosition()
    
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist === 0) return

    const overlap = (h1.snowball.getRadius() + h2.snowball.getRadius() - dist) / 2
    const nx = dx / dist
    const ny = dy / dist

    const sizeDiff = h1.getSnowballSize() - h2.getSnowballSize()
    
    if (Math.abs(sizeDiff) > 20) {
      const bigger = sizeDiff > 0 ? h1 : h2
      const smaller = sizeDiff > 0 ? h2 : h1
      
      if (!smaller.hasShield()) {
        const transferAmount = Math.min(Math.abs(sizeDiff) * 0.05, smaller.getSnowballSize() * 0.1)
        smaller.snowball.shrink(transferAmount)
        bigger.snowball.grow(transferAmount * 0.5)
      }
    }

    h1.snowball.position.x -= nx * overlap
    h1.snowball.position.y -= ny * overlap
    h2.snowball.position.x += nx * overlap
    h2.snowball.position.y += ny * overlap
  }

  private updateRankings(): void {
    const hamsters = this.getAllHamsters()
    this.state.rankings = hamsters
      .map(h => ({
        id: h.id,
        name: h.name,
        size: h.getSnowballSize(),
        isPlayer: h.isPlayer
      }))
      .sort((a, b) => b.size - a.size)
  }

  private updateCamera(): void {
    if (!this.state.player) return
    
    const targetX = this.state.player.getSnowballPosition().x - this.canvasWidth / 2
    const targetY = this.state.player.getSnowballPosition().y - this.canvasHeight / 2
    
    this.camera.x += (targetX - this.camera.x) * 0.1
    this.camera.y += (targetY - this.camera.y) * 0.1

    const map = this.state.map
    this.camera.x = clamp(this.camera.x, 0, Math.max(0, map.width - this.canvasWidth))
    this.camera.y = clamp(this.camera.y, 0, Math.max(0, map.height - this.canvasHeight))
  }

  movePlayer(direction: Vector2): void {
    if (!this.state.player || this.state.status !== 'playing') return
    
    this.state.player.move(
      direction,
      16,
      { width: this.state.map.width, height: this.state.map.height }
    )
  }

  playerUseItem(itemIndex: number): boolean {
    if (!this.state.player) return false
    return true
  }

  private finishGame(): void {
    this.state.status = 'finished'
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    this.updateRankings()
    
    const playerRank = this.state.rankings.findIndex(r => r.isPlayer)
    this.state.isPlayerWin = playerRank === 0
    this.state.winner = this.state.rankings[0]?.name || null

    if (this.onFinishCallback) {
      this.onFinishCallback(this.state)
    }
  }

  onUpdate(callback: (state: GameState) => void): void {
    this.onUpdateCallback = callback
  }

  onFinish(callback: (state: GameState) => void): void {
    this.onFinishCallback = callback
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}
