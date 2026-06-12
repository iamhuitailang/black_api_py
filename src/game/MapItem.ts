import { Vector2 } from './utils'

export type ItemType = 'speed' | 'bomb' | 'shield' | 'slow' | 'magnet' | 'double' | 'teleport' | 'shrink'

export interface MapItemConfig {
  id: string
  type: ItemType
  x: number
  y: number
  emoji: string
  name: string
}

export class MapItem {
  id: string
  type: ItemType
  position: Vector2
  emoji: string
  name: string
  radius: number
  collected: boolean
  bobOffset: number
  bobSpeed: number

  constructor(config: MapItemConfig) {
    this.id = config.id
    this.type = config.type
    this.position = new Vector2(config.x, config.y)
    this.emoji = config.emoji
    this.name = config.name
    this.radius = 20
    this.collected = false
    this.bobOffset = Math.random() * Math.PI * 2
    this.bobSpeed = 2 + Math.random()
  }

  update(deltaTime: number): void {
    this.bobOffset += deltaTime * 0.003 * this.bobSpeed
  }

  getYOffset(): number {
    return Math.sin(this.bobOffset) * 5
  }
}
