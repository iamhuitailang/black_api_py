import { Vector2, clamp } from './utils'
import { Snowball } from './Snowball'

export interface HamsterConfig {
  id: string
  name: string
  x: number
  y: number
  color?: string
  bellyColor?: string
  speed?: number
  isPlayer?: boolean
  skin?: string
  direction?: number
}

export class Hamster {
  id: string
  name: string
  position: Vector2
  direction: number
  speed: number
  baseSpeed: number
  color: string
  bellyColor: string
  skin: string
  isPlayer: boolean
  snowball: Snowball
  isMoving: boolean
  animationFrame: number
  animationTime: number

  activeBuffs: Buff[] = []

  constructor(config: HamsterConfig) {
    this.id = config.id
    this.name = config.name
    this.position = new Vector2(config.x, config.y)
    this.direction = config.direction || 0
    this.baseSpeed = config.speed || 150
    this.speed = this.baseSpeed
    this.color = config.color || '#D4A574'
    this.bellyColor = config.bellyColor || '#FFF0E0'
    this.skin = config.skin || 'default'
    this.isPlayer = config.isPlayer || false
    this.isMoving = false
    this.animationFrame = 0
    this.animationTime = 0

    this.snowball = new Snowball({
      x: config.x + 30,
      y: config.y,
      initialSize: 25,
      maxSize: 500,
      growthRate: 0.08
    })
  }

  update(deltaTime: number): void {
    this.updateBuffs(deltaTime)

    if (this.isMoving) {
      this.animationTime += deltaTime
      this.animationFrame = Math.floor(this.animationTime / 100) % 4
    }

    const direction = new Vector2(
      Math.cos(this.direction),
      Math.sin(this.direction)
    )

    const currentSpeed = this.isMoving ? this.speed : 0
    this.snowball.update(deltaTime, currentSpeed, direction)

    const snowballOffset = this.snowball.getRadius() + 5
    this.position.x = this.snowball.position.x - Math.cos(this.direction) * snowballOffset
    this.position.y = this.snowball.position.y - Math.sin(this.direction) * snowballOffset
  }

  updateBuffs(deltaTime: number): void {
    this.speed = this.baseSpeed
    
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      const buff = this.activeBuffs[i]
      buff.duration -= deltaTime

      if (buff.type === 'speed') {
        this.speed *= buff.value
      } else if (buff.type === 'slow') {
        this.speed *= buff.value
      }

      if (buff.duration <= 0) {
        this.activeBuffs.splice(i, 1)
      }
    }
  }

  addBuff(buff: Buff): void {
    const existingIndex = this.activeBuffs.findIndex(b => b.type === buff.type)
    if (existingIndex >= 0) {
      this.activeBuffs[existingIndex].duration = Math.max(
        this.activeBuffs[existingIndex].duration,
        buff.duration
      )
    } else {
      this.activeBuffs.push({ ...buff })
    }
  }

  hasBuff(type: string): boolean {
    return this.activeBuffs.some(b => b.type === type)
  }

  hasShield(): boolean {
    return this.hasBuff('shield')
  }

  move(direction: Vector2, deltaTime: number, bounds: { width: number; height: number }): void {
    if (direction.length() === 0) {
      this.isMoving = false
      return
    }

    this.isMoving = true
    const dir = direction.normalize()
    this.direction = dir.angle()

    const moveSpeed = this.speed * deltaTime * 0.001
    const newX = this.snowball.position.x + dir.x * moveSpeed
    const newY = this.snowball.position.y + dir.y * moveSpeed

    const radius = this.snowball.getRadius()
    this.snowball.position.x = clamp(newX, radius, bounds.width - radius)
    this.snowball.position.y = clamp(newY, radius, bounds.height - radius)
  }

  getSnowballPosition(): Vector2 {
    return this.snowball.position.clone()
  }

  getSnowballSize(): number {
    return this.snowball.size
  }
}

export interface Buff {
  type: string
  value: number
  duration: number
  source?: string
}
