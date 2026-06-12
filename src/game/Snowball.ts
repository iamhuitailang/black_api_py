import { Vector2 } from './utils'

export interface SnowballConfig {
  x: number
  y: number
  initialSize?: number
  maxSize?: number
  growthRate?: number
  effect?: string
}

export class Snowball {
  position: Vector2
  size: number
  maxSize: number
  growthRate: number
  rotation: number
  effect: string
  velocity: Vector2

  constructor(config: SnowballConfig) {
    this.position = new Vector2(config.x, config.y)
    this.size = config.initialSize || 20
    this.maxSize = config.maxSize || 500
    this.growthRate = config.growthRate || 0.1
    this.rotation = 0
    this.effect = config.effect || 'default'
    this.velocity = new Vector2()
  }

  update(deltaTime: number, speed: number, direction: Vector2): void {
    const growthMultiplier = speed * 0.01
    this.size += this.growthRate * growthMultiplier * deltaTime
    this.size = Math.min(this.size, this.maxSize)

    this.rotation += speed * 0.05 * deltaTime

    this.velocity = direction.mul(speed)
    this.position = this.position.add(this.velocity.mul(deltaTime * 0.016))
  }

  grow(amount: number): void {
    this.size = Math.min(this.size + amount, this.maxSize)
  }

  shrink(amount: number): void {
    this.size = Math.max(this.size - amount, 10)
  }

  shrinkByPercent(percent: number): void {
    this.size = Math.max(this.size * (1 - percent), 10)
  }

  getRadius(): number {
    return this.size / 2
  }

  getWeight(): number {
    return Math.pow(this.size / 20, 1.5)
  }
}
