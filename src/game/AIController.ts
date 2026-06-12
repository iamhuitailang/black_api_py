import { Vector2, randomRange, randomInt } from './utils'
import { Hamster } from './Hamster'
import type { Difficulty, AIType } from '@/types/game'

export interface AIControllerConfig {
  hamster: Hamster
  difficulty: Difficulty
  aiType: AIType
  mapWidth: number
  mapHeight: number
}

const DIFFICULTY_SETTINGS = {
  easy: {
    reactionTime: 500,
    decisionInterval: 1500,
    accuracy: 0.6,
    itemUsageChance: 0.2,
    mistakeChance: 0.3,
    speedMultiplier: 0.85
  },
  normal: {
    reactionTime: 300,
    decisionInterval: 1000,
    accuracy: 0.75,
    itemUsageChance: 0.4,
    mistakeChance: 0.15,
    speedMultiplier: 1.0
  },
  hard: {
    reactionTime: 150,
    decisionInterval: 600,
    accuracy: 0.9,
    itemUsageChance: 0.6,
    mistakeChance: 0.05,
    speedMultiplier: 1.1
  },
  expert: {
    reactionTime: 50,
    decisionInterval: 300,
    accuracy: 0.97,
    itemUsageChance: 0.8,
    mistakeChance: 0.01,
    speedMultiplier: 1.2
  }
}

export class AIController {
  hamster: Hamster
  difficulty: Difficulty
  aiType: AIType
  mapWidth: number
  mapHeight: number
  
  settings: typeof DIFFICULTY_SETTINGS.easy
  currentDecision: Vector2 | null = null
  decisionTimer: number = 0
  reactionTimer: number = 0
  targetItem: any = null
  targetOpponent: Hamster | null = null
  state: 'exploring' | 'chasing_item' | 'chasing_opponent' | 'avoiding' | 'using_item' = 'exploring'
  stateTimer: number = 0
  items: string[] = []
  lastItemUseTime: number = 0

  constructor(config: AIControllerConfig) {
    this.hamster = config.hamster
    this.difficulty = config.difficulty
    this.aiType = config.aiType
    this.mapWidth = config.mapWidth
    this.mapHeight = config.mapHeight
    this.settings = DIFFICULTY_SETTINGS[config.difficulty]
    
    this.hamster.baseSpeed *= this.settings.speedMultiplier
    this.hamster.speed = this.hamster.baseSpeed
  }

  update(deltaTime: number, allHamsters: Hamster[], items: any[], obstacles: any[]): { direction: Vector2; useItem: boolean } {
    this.decisionTimer -= deltaTime
    this.reactionTimer -= deltaTime
    this.stateTimer -= deltaTime

    if (this.stateTimer <= 0) {
      this.decideState(allHamsters, items, obstacles)
    }

    let direction = this.currentDirection()
    let useItem = false

    if (Math.random() < this.settings.mistakeChance * 0.01) {
      direction = new Vector2(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize()
    }

    if (this.shouldUseItem(allHamsters)) {
      useItem = true
      this.lastItemUseTime = Date.now()
    }

    return { direction, useItem }
  }

  private decideState(allHamsters: Hamster[], items: any[], obstacles: any[]): void {
    if (this.decisionTimer > 0) return
    
    this.decisionTimer = this.settings.decisionInterval

    const nearestItem = this.findNearestItem(items)
    const nearestOpponent = this.findNearestOpponent(allHamsters)
    const nearbyThreat = this.findNearbyThreat(allHamsters, obstacles)

    if (nearbyThreat && this.aiType !== 'aggressive') {
      this.state = 'avoiding'
      this.stateTimer = 1000
      return
    }

    switch (this.aiType) {
      case 'aggressive':
        if (nearestOpponent && this.isBiggerThan(nearestOpponent)) {
          this.state = 'chasing_opponent'
          this.targetOpponent = nearestOpponent
          this.stateTimer = 2000
        } else if (nearestItem) {
          this.state = 'chasing_item'
          this.targetItem = nearestItem
          this.stateTimer = 3000
        } else {
          this.state = 'exploring'
          this.stateTimer = 2000
        }
        break

      case 'defensive':
        if (nearestItem) {
          this.state = 'chasing_item'
          this.targetItem = nearestItem
          this.stateTimer = 3000
        } else {
          this.state = 'exploring'
          this.stateTimer = 2500
        }
        break

      case 'balanced':
        const rand = Math.random()
        if (nearestItem && rand < 0.6) {
          this.state = 'chasing_item'
          this.targetItem = nearestItem
          this.stateTimer = 2500
        } else if (nearestOpponent && rand < 0.8 && this.isBiggerThan(nearestOpponent)) {
          this.state = 'chasing_opponent'
          this.targetOpponent = nearestOpponent
          this.stateTimer = 1500
        } else {
          this.state = 'exploring'
          this.stateTimer = 2000
        }
        break

      case 'tricky':
        if (nearestItem && Math.random() < 0.7) {
          this.state = 'chasing_item'
          this.targetItem = nearestItem
          this.stateTimer = 2000
        } else if (nearestOpponent) {
          this.state = 'chasing_opponent'
          this.targetOpponent = nearestOpponent
          this.stateTimer = 2000
        } else {
          this.state = 'exploring'
          this.stateTimer = 1500
        }
        break
    }
  }

  private currentDirection(): Vector2 {
    let target: Vector2 | null = null

    switch (this.state) {
      case 'chasing_item':
        if (this.targetItem) {
          target = this.targetItem.position.clone()
        }
        break

      case 'chasing_opponent':
        if (this.targetOpponent) {
          target = this.targetOpponent.getSnowballPosition()
        }
        break

      case 'avoiding':
        return this.getAvoidDirection()

      case 'exploring':
      default:
        return this.getExploreDirection()
    }

    if (target) {
      const dir = target.sub(this.hamster.getSnowballPosition()).normalize()
      if (Math.random() > this.settings.accuracy) {
        const angleOffset = (Math.random() - 0.5) * Math.PI * 0.5
        const angle = Math.atan2(dir.y, dir.x) + angleOffset
        return new Vector2(Math.cos(angle), Math.sin(angle))
      }
      return dir
    }

    return new Vector2(1, 0)
  }

  private findNearestItem(items: any[]): any {
    let nearest: any = null
    let minDist = Infinity

    for (const item of items) {
      if (item.collected) continue
      const dist = this.hamster.getSnowballPosition().distanceTo(item.position)
      if (dist < minDist) {
        minDist = dist
        nearest = item
      }
    }

    return nearest
  }

  private findNearestOpponent(allHamsters: Hamster[]): Hamster | null {
    let nearest: Hamster | null = null
    let minDist = Infinity

    for (const hamster of allHamsters) {
      if (hamster.id === this.hamster.id) continue
      const dist = this.hamster.getSnowballPosition().distanceTo(hamster.getSnowballPosition())
      if (dist < minDist) {
        minDist = dist
        nearest = hamster
      }
    }

    return nearest
  }

  private findNearbyThreat(allHamsters: Hamster[], obstacles: any[]): Hamster | null {
    for (const hamster of allHamsters) {
      if (hamster.id === this.hamster.id) continue
      const dist = this.hamster.getSnowballPosition().distanceTo(hamster.getSnowballPosition())
      if (dist < 150 && hamster.getSnowballSize() > this.hamster.getSnowballSize()) {
        return hamster
      }
    }
    return null
  }

  private isBiggerThan(opponent: Hamster): boolean {
    return this.hamster.getSnowballSize() > opponent.getSnowballSize() * 0.9
  }

  private getExploreDirection(): Vector2 {
    const centerX = this.mapWidth / 2
    const centerY = this.mapHeight / 2
    const pos = this.hamster.getSnowballPosition()
    
    const distToEdge = Math.min(
      pos.x, pos.y,
      this.mapWidth - pos.x,
      this.mapHeight - pos.y
    )

    if (distToEdge < 100) {
      return new Vector2(centerX - pos.x, centerY - pos.y).normalize()
    }

    if (!this.currentDecision || this.decisionTimer <= 0) {
      const angle = Math.random() * Math.PI * 2
      this.currentDecision = new Vector2(Math.cos(angle), Math.sin(angle))
      this.decisionTimer = randomRange(1000, 3000)
    }

    return this.currentDecision || new Vector2(1, 0)
  }

  private getAvoidDirection(): Vector2 {
    const pos = this.hamster.getSnowballPosition()
    const centerX = this.mapWidth / 2
    const centerY = this.mapHeight / 2
    
    const awayFromCenter = new Vector2(
      pos.x - centerX,
      pos.y - centerY
    ).normalize()

    return awayFromCenter
  }

  private shouldUseItem(allHamsters: Hamster[]): boolean {
    if (Date.now() - this.lastItemUseTime < 3000) return false
    if (Math.random() > this.settings.itemUsageChance * 0.02) return false
    if (this.items.length === 0) return false

    return true
  }

  addItem(itemId: string): void {
    if (this.items.length < 4) {
      this.items.push(itemId)
    }
  }

  useItem(): string | null {
    if (this.items.length === 0) return null
    const item = this.items.shift()
    return item || null
  }
}
