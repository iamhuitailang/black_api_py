/**
 * 平台类
 * 包含普通平台、移动平台和单向平台
 */

import type { Vector2, Rect } from '@/utils/math'
import { lerp, clamp } from '@/utils/math'
import type { Player } from './player'

/** 平台类型 */
export type PlatformType = 'normal' | 'moving' | 'oneWay'

/** 移动平台移动模式 */
export type MovingPlatformMode = 'path' | 'loop' | 'pingPong'

/** 平台配置 */
export interface PlatformConfig {
  /** 类型 */
  type: PlatformType
  /** 位置 */
  position: Vector2
  /** 尺寸 */
  size: { width: number; height: number }
  /** 是否可碰撞 */
  collidable: boolean
}

/** 移动平台路径点 */
export interface PathPoint {
  x: number
  y: number
  /** 到达该点后的停留时间（秒） */
  pauseTime?: number
}

/** 移动平台配置 */
export interface MovingPlatformConfig extends PlatformConfig {
  type: 'moving'
  /** 移动模式 */
  mode: MovingPlatformMode
  /** 路径点列表 */
  path: PathPoint[]
  /** 移动速度 */
  speed: number
  /** 是否自动开始 */
  autoStart: boolean
}

/** 单向平台配置 */
export interface OneWayPlatformConfig extends PlatformConfig {
  type: 'oneWay'
  /** 从下方穿过时的检测阈值 */
  passThroughThreshold: number
}

/**
 * 平台基类
 */
export abstract class Platform {
  /** 平台类型 */
  public readonly type: PlatformType
  /** 位置 */
  public position: Vector2
  /** 尺寸 */
  public size: { width: number; height: number }
  /** 是否可碰撞 */
  public collidable: boolean
  /** 是否激活 */
  public active: boolean

  /**
   * 构造函数
   */
  constructor(config: PlatformConfig) {
    this.type = config.type
    this.position = { ...config.position }
    this.size = { ...config.size }
    this.collidable = config.collidable
    this.active = true
  }

  /**
   * 更新平台状态
   */
  public abstract update(deltaTime: number, player?: Player): void

  /**
   * 绘制平台
   */
  public abstract draw(ctx: CanvasRenderingContext2D): void

  /**
   * 获取碰撞盒
   */
  public getBounds(): Rect {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    }
  }

  /**
   * 获取顶部碰撞检测线
   */
  public getTopBounds(): Rect {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: 4,
    }
  }
}

/**
 * 普通平台类
 */
export class NormalPlatform extends Platform {
  /** 平台颜色 */
  private color: string
  /** 描边颜色 */
  private strokeColor: string

  /**
   * 构造函数
   */
  constructor(
    config: PlatformConfig,
    color: string = '#8B7355',
    strokeColor: string = '#5D4E37'
  ) {
    super({ ...config, type: 'normal' })
    this.color = color
    this.strokeColor = strokeColor
  }

  /**
   * 更新普通平台
   */
  public update(deltaTime: number, player?: Player): void {
    // 普通平台不需要更新
  }

  /**
   * 绘制普通平台
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    const gradient = ctx.createLinearGradient(
      this.position.x, this.position.y,
      this.position.x, this.position.y + this.size.height
    )
    gradient.addColorStop(0, this.color)
    gradient.addColorStop(0.5, this.darkenColor(this.color, 0.1))
    gradient.addColorStop(1, this.darkenColor(this.color, 0.2))

    ctx.fillStyle = gradient
    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height,
      5
    )
    ctx.fill()

    ctx.strokeStyle = this.strokeColor
    ctx.lineWidth = 2
    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height,
      5
    )
    ctx.stroke()

    this.drawGrass(ctx)
    this.drawTexture(ctx)

    ctx.restore()
  }

  /**
   * 绘制草地装饰
   */
  private drawGrass(ctx: CanvasRenderingContext2D): void {
    const grassCount = Math.floor(this.size.width / 15)
    ctx.fillStyle = '#4CAF50'

    for (let i = 0; i < grassCount; i++) {
      const x = this.position.x + 5 + i * 15 + Math.sin(i) * 3
      const grassHeight = 6 + Math.sin(i * 2) * 3

      ctx.beginPath()
      ctx.moveTo(x, this.position.y)
      ctx.quadraticCurveTo(x - 2, this.position.y - grassHeight / 2, x - 1, this.position.y - grassHeight)
      ctx.quadraticCurveTo(x + 1, this.position.y - grassHeight / 2, x + 1, this.position.y)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(x + 3, this.position.y)
      ctx.quadraticCurveTo(x + 5, this.position.y - grassHeight / 2 - 2, x + 4, this.position.y - grassHeight - 2)
      ctx.quadraticCurveTo(x + 3, this.position.y - grassHeight / 2, x + 3, this.position.y)
      ctx.closePath()
      ctx.fill()
    }
  }

  /**
   * 绘制平台纹理
   */
  private drawTexture(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.lineWidth = 1

    const lineCount = Math.floor(this.size.height / 10)
    for (let i = 1; i <= lineCount; i++) {
      const y = this.position.y + i * 10
      ctx.beginPath()
      ctx.moveTo(this.position.x + 5, y)
      ctx.lineTo(this.position.x + this.size.width - 5, y)
      ctx.stroke()
    }
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  /**
   * 加深颜色
   */
  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount))
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount))
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount))
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`
  }
}

/**
 * 移动平台类
 * 支持路径移动、循环移动和往返移动
 */
export class MovingPlatform extends Platform {
  /** 移动模式 */
  public mode: MovingPlatformMode
  /** 路径点列表 */
  public path: PathPoint[]
  /** 移动速度 */
  public speed: number
  /** 是否正在移动 */
  public isMoving: boolean
  /** 移动方向（pingPong模式使用） */
  public movingForward: boolean
  /** 平台速度（用于传递给玩家） */
  public platformVelocity: Vector2

  /** 当前路径点索引 */
  private currentPathIndex: number
  /** 目标路径点索引 */
  private targetPathIndex: number
  /** 停留计时器 */
  private pauseTimer: number
  /** 上一帧位置 */
  private previousPosition: Vector2

  /**
   * 构造函数
   */
  constructor(config: MovingPlatformConfig) {
    super({ ...config, type: 'moving' })
    this.mode = config.mode
    this.path = config.path.map(p => ({ ...p }))
    this.speed = config.speed
    this.isMoving = config.autoStart
    this.movingForward = true
    this.platformVelocity = { x: 0, y: 0 }

    this.currentPathIndex = 0
    this.targetPathIndex = this.getNextPathIndex(0)
    this.pauseTimer = 0
    this.previousPosition = { ...this.position }

    if (this.path.length > 0) {
      this.position = { ...this.path[0] }
    }
  }

  /**
   * 获取下一个路径点索引
   */
  private getNextPathIndex(currentIndex: number): number {
    if (this.path.length <= 1) return currentIndex

    switch (this.mode) {
      case 'loop':
        return (currentIndex + 1) % this.path.length
      case 'pingPong':
        if (this.movingForward) {
          if (currentIndex >= this.path.length - 1) {
            this.movingForward = false
            return currentIndex - 1
          }
          return currentIndex + 1
        } else {
          if (currentIndex <= 0) {
            this.movingForward = true
            return currentIndex + 1
          }
          return currentIndex - 1
        }
      case 'path':
      default:
        return Math.min(currentIndex + 1, this.path.length - 1)
    }
  }

  /**
   * 更新移动平台
   */
  public update(deltaTime: number, player?: Player): void {
    if (!this.active || !this.isMoving || this.path.length <= 1) {
      this.platformVelocity = { x: 0, y: 0 }
      return
    }

    this.previousPosition = { ...this.position }

    if (this.pauseTimer > 0) {
      this.pauseTimer -= deltaTime
      this.platformVelocity = { x: 0, y: 0 }
      return
    }

    const targetPoint = this.path[this.targetPathIndex]
    const dx = targetPoint.x - this.position.x
    const dy = targetPoint.y - this.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 2) {
      this.position = { ...targetPoint }
      this.currentPathIndex = this.targetPathIndex

      const pauseTime = this.path[this.currentPathIndex].pauseTime || 0
      if (pauseTime > 0) {
        this.pauseTimer = pauseTime
      }

      if (this.mode === 'path' && this.currentPathIndex >= this.path.length - 1) {
        this.isMoving = false
      } else {
        this.targetPathIndex = this.getNextPathIndex(this.currentPathIndex)
      }

      this.platformVelocity = { x: 0, y: 0 }
      return
    }

    const moveDistance = this.speed * deltaTime
    const t = clamp(moveDistance / distance, 0, 1)

    this.position.x = lerp(this.position.x, targetPoint.x, t)
    this.position.y = lerp(this.position.y, targetPoint.y, t)

    this.platformVelocity = {
      x: (this.position.x - this.previousPosition.x) / deltaTime,
      y: (this.position.y - this.previousPosition.y) / deltaTime,
    }

    if (player && this.isPlayerOnPlatform(player)) {
      player.position.x += this.platformVelocity.x * deltaTime
      player.position.y += this.platformVelocity.y * deltaTime
    }
  }

  /**
   * 检查玩家是否在平台上
   */
  private isPlayerOnPlatform(player: Player): boolean {
    const playerBounds = player.getBounds()
    const platformTop = this.getTopBounds()

    return (
      playerBounds.x + playerBounds.width > platformTop.x &&
      playerBounds.x < platformTop.x + platformTop.width &&
      Math.abs(playerBounds.y + playerBounds.height - platformTop.y) < 5
    )
  }

  /**
   * 开始移动
   */
  public startMoving(): void {
    this.isMoving = true
  }

  /**
   * 停止移动
   */
  public stopMoving(): void {
    this.isMoving = false
    this.platformVelocity = { x: 0, y: 0 }
  }

  /**
   * 重置到起始位置
   */
  public reset(): void {
    if (this.path.length > 0) {
      this.position = { ...this.path[0] }
      this.currentPathIndex = 0
      this.targetPathIndex = this.getNextPathIndex(0)
      this.movingForward = true
      this.pauseTimer = 0
      this.platformVelocity = { x: 0, y: 0 }
    }
  }

  /**
   * 绘制移动平台
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    const gradient = ctx.createLinearGradient(
      this.position.x, this.position.y,
      this.position.x, this.position.y + this.size.height
    )
    gradient.addColorStop(0, '#6B8E23')
    gradient.addColorStop(0.5, '#556B2F')
    gradient.addColorStop(1, '#3D5229')

    ctx.fillStyle = gradient
    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height,
      6
    )
    ctx.fill()

    ctx.strokeStyle = '#2F4F2F'
    ctx.lineWidth = 2
    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height,
      6
    )
    ctx.stroke()

    this.drawPathIndicators(ctx)
    this.drawDirectionArrows(ctx)

    ctx.restore()
  }

  /**
   * 绘制路径指示器
   */
  private drawPathIndicators(ctx: CanvasRenderingContext2D): void {
    if (this.path.length <= 1) return

    ctx.strokeStyle = 'rgba(107, 142, 35, 0.3)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])

    ctx.beginPath()
    ctx.moveTo(this.path[0].x + this.size.width / 2, this.path[0].y + this.size.height / 2)

    for (let i = 1; i < this.path.length; i++) {
      ctx.lineTo(this.path[i].x + this.size.width / 2, this.path[i].y + this.size.height / 2)
    }

    if (this.mode === 'loop') {
      ctx.lineTo(this.path[0].x + this.size.width / 2, this.path[0].y + this.size.height / 2)
    }

    ctx.stroke()
    ctx.setLineDash([])

    for (let i = 0; i < this.path.length; i++) {
      const point = this.path[i]
      const isCurrent = i === this.currentPathIndex
      const isTarget = i === this.targetPathIndex

      ctx.fillStyle = isCurrent ? '#FFD700' : isTarget ? '#FFA500' : 'rgba(107, 142, 35, 0.5)'
      ctx.beginPath()
      ctx.arc(
        point.x + this.size.width / 2,
        point.y + this.size.height / 2,
        isCurrent ? 6 : 4,
        0,
        Math.PI * 2
      )
      ctx.fill()

      ctx.strokeStyle = '#2F4F2F'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  /**
   * 绘制方向箭头
   */
  private drawDirectionArrows(ctx: CanvasRenderingContext2D): void {
    if (!this.isMoving || this.platformVelocity.x === 0 && this.platformVelocity.y === 0) return

    const centerX = this.position.x + this.size.width / 2
    const centerY = this.position.y + this.size.height / 2
    const angle = Math.atan2(this.platformVelocity.y, this.platformVelocity.x)

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(angle)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.moveTo(15, 0)
    ctx.lineTo(5, -6)
    ctx.lineTo(5, 6)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

/**
 * 单向平台类
 * 可以从下方穿过，从上方落下时可以站立
 */
export class OneWayPlatform extends Platform {
  /** 从下方穿过时的检测阈值 */
  public passThroughThreshold: number

  /** 动画计时器 */
  private animationTimer: number

  /**
   * 构造函数
   */
  constructor(config: OneWayPlatformConfig) {
    super({ ...config, type: 'oneWay' })
    this.passThroughThreshold = config.passThroughThreshold
    this.animationTimer = 0
  }

  /**
   * 更新单向平台
   */
  public update(deltaTime: number, player?: Player): void {
    this.animationTimer += deltaTime

    if (!player || !this.active) return

    const playerBounds = player.getBounds()
    const platformTop = this.position.y

    const isOverlapping =
      playerBounds.x + playerBounds.width > this.position.x &&
      playerBounds.x < this.position.x + this.size.width &&
      playerBounds.y + playerBounds.height > this.position.y &&
      playerBounds.y < this.position.y + this.size.height

    if (isOverlapping && player.velocity.y > 0) {
      const playerBottom = playerBounds.y + playerBounds.height
      const distanceFromTop = playerBottom - platformTop

      if (distanceFromTop <= this.passThroughThreshold && distanceFromTop > 0) {
        player.position.y = platformTop
        player.velocity.y = 0
        player.onLand()
      }
    }
  }

  /**
   * 检查玩家是否可以穿过平台
   */
  public canPassThrough(player: Player): boolean {
    const playerBounds = player.getBounds()
    return playerBounds.y + playerBounds.height < this.position.y + 5 || player.velocity.y > 0
  }

  /**
   * 绘制单向平台
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    const alpha = 0.7 + Math.sin(this.animationTimer * 3) * 0.1

    const gradient = ctx.createLinearGradient(
      this.position.x, this.position.y,
      this.position.x, this.position.y + this.size.height
    )
    gradient.addColorStop(0, `rgba(135, 206, 250, ${alpha})`)
    gradient.addColorStop(1, `rgba(70, 130, 180, ${alpha * 0.8})`)

    ctx.fillStyle = gradient
    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height,
      4
    )
    ctx.fill()

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.lineDashOffset = -this.animationTimer * 20

    ctx.beginPath()
    ctx.moveTo(this.position.x + 5, this.position.y)
    ctx.lineTo(this.position.x + this.size.width - 5, this.position.y)
    ctx.stroke()

    ctx.setLineDash([])

    this.drawUpwardArrows(ctx, alpha)

    ctx.restore()
  }

  /**
   * 绘制向上箭头指示可穿过
   */
  private drawUpwardArrows(ctx: CanvasRenderingContext2D, alpha: number): void {
    const arrowCount = Math.floor(this.size.width / 30)
    const arrowY = this.position.y + this.size.height / 2

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`

    for (let i = 0; i < arrowCount; i++) {
      const x = this.position.x + 15 + i * 30

      ctx.beginPath()
      ctx.moveTo(x, arrowY - 4)
      ctx.lineTo(x - 4, arrowY + 2)
      ctx.lineTo(x + 4, arrowY + 2)
      ctx.closePath()
      ctx.fill()
    }
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

/**
 * 创建平台工厂函数
 */
export function createPlatform(config: PlatformConfig | MovingPlatformConfig | OneWayPlatformConfig): Platform {
  switch (config.type) {
    case 'moving':
      return new MovingPlatform(config as MovingPlatformConfig)
    case 'oneWay':
      return new OneWayPlatform(config as OneWayPlatformConfig)
    case 'normal':
    default:
      return new NormalPlatform(config)
  }
}
