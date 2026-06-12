import { Vector2 } from './utils'

export type ObstacleType = 'snowdrift' | 'ice_crack' | 'ice_ramp' | 'bounce_pad' | 'rock'

export interface ObstacleConfig {
  type: ObstacleType
  x: number
  y: number
  width: number
  height: number
  effect: string
}

export class Obstacle {
  type: ObstacleType
  position: Vector2
  width: number
  height: number
  effect: string
  animationTime: number

  constructor(config: ObstacleConfig) {
    this.type = config.type
    this.position = new Vector2(config.x, config.y)
    this.width = config.width
    this.height = config.height
    this.effect = config.effect
    this.animationTime = 0
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime
  }

  getCenter(): Vector2 {
    return new Vector2(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    )
  }
}
