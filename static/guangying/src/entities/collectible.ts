/**
 * 收集物类
 * 包含光粒子收集物，具有漂浮动画、收集效果和吸引效果
 */

import type { Vector2, Rect } from '@/utils/math'
import { distance, lerp, clamp } from '@/utils/math'
import type { Player } from './player'

/** 收集物类型 */
export type CollectibleType = 'lightParticle' | 'health' | 'star'

/** 收集物状态 */
export type CollectibleState = 'idle' | 'attracting' | 'collected' | 'disabled'

/** 收集物配置 */
export interface CollectibleConfig {
  /** 类型 */
  type: CollectibleType
  /** 位置 */
  position: Vector2
  /** 尺寸 */
  size: number
  /** 分值 */
  score: number
  /** 吸引范围 */
  attractRadius: number
  /** 吸引速度 */
  attractSpeed: number
  /** 自动收集范围 */
  collectRadius: number
}

/**
 * 光粒子收集物类
 */
export class Collectible {
  /** 收集物类型 */
  public readonly type: CollectibleType
  /** 位置 */
  public position: Vector2
  /** 尺寸 */
  public size: number
  /** 分值 */
  public score: number
  /** 吸引范围 */
  public attractRadius: number
  /** 吸引速度 */
  public attractSpeed: number
  /** 自动收集范围 */
  public collectRadius: number
  /** 状态 */
  public state: CollectibleState
  /** 是否激活 */
  public active: boolean

  /** 起始位置（用于漂浮动画） */
  private basePosition: Vector2
  /** 动画计时器 */
  private animationTimer: number
  /** 收集动画计时器 */
  private collectAnimationTimer: number
  /** 漂浮振幅 */
  private floatAmplitude: number
  /** 漂浮频率 */
  private floatFrequency: number
  /** 随机相位偏移 */
  private phaseOffset: number
  /** 收集粒子 */
  private particles: CollectibleParticle[]
  /** 旋转角度 */
  private rotation: number
  /** 旋转速度 */
  private rotationSpeed: number

  /**
   * 构造函数
   */
  constructor(config: CollectibleConfig) {
    this.type = config.type
    this.position = { ...config.position }
    this.basePosition = { ...config.position }
    this.size = config.size
    this.score = config.score
    this.attractRadius = config.attractRadius
    this.attractSpeed = config.attractSpeed
    this.collectRadius = config.collectRadius
    this.state = 'idle'
    this.active = true

    this.animationTimer = 0
    this.collectAnimationTimer = 0
    this.floatAmplitude = 8
    this.floatFrequency = 2
    this.phaseOffset = Math.random() * Math.PI * 2
    this.particles = []
    this.rotation = 0
    this.rotationSpeed = 1.5

    this.initIdleParticles()
  }

  /**
   * 初始化待机粒子
   */
  private initIdleParticles(): void {
    const particleCount = 5
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createIdleParticle())
    }
  }

  /**
   * 创建待机粒子
   */
  private createIdleParticle(): CollectibleParticle {
    const angle = Math.random() * Math.PI * 2
    const distance = this.size * (1 + Math.random() * 0.5)

    return {
      x: this.position.x + Math.cos(angle) * distance,
      y: this.position.y + Math.sin(angle) * distance,
      vx: 0,
      vy: 0,
      size: 2 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.4,
      life: 1 + Math.random() * 2,
      maxLife: 3,
      type: 'idle',
      angle,
      orbitSpeed: 0.5 + Math.random() * 0.5,
      orbitDistance: distance,
    }
  }

  /**
   * 更新收集物
   */
  public update(deltaTime: number, player: Player): void {
    this.animationTimer += deltaTime
    this.rotation += this.rotationSpeed * deltaTime

    if (!this.active) return

    switch (this.state) {
      case 'idle':
        this.updateIdle(deltaTime, player)
        break
      case 'attracting':
        this.updateAttracting(deltaTime, player)
        break
      case 'collected':
        this.updateCollected(deltaTime)
        break
    }

    this.updateParticles(deltaTime)
  }

  /**
   * 更新待机状态
   */
  private updateIdle(deltaTime: number, player: Player): void {
    const floatOffset = Math.sin(this.animationTimer * this.floatFrequency + this.phaseOffset) * this.floatAmplitude
    this.position.y = this.basePosition.y + floatOffset

    const distToPlayer = distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y - player.size.height / 2
    )

    if (distToPlayer <= this.attractRadius) {
      this.state = 'attracting'
    }
  }

  /**
   * 更新吸引状态
   */
  private updateAttracting(deltaTime: number, player: Player): void {
    const playerCenterX = player.position.x
    const playerCenterY = player.position.y - player.size.height / 2

    const distToPlayer = distance(
      this.position.x, this.position.y,
      playerCenterX, playerCenterY
    )

    if (distToPlayer <= this.collectRadius) {
      this.collect()
      return
    }

    const dx = playerCenterX - this.position.x
    const dy = playerCenterY - this.position.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const dirX = dx / length
    const dirY = dy / length

    const attractForce = lerp(this.attractSpeed * 0.5, this.attractSpeed * 2, 1 - distToPlayer / this.attractRadius)
    this.position.x += dirX * attractForce * deltaTime
    this.position.y += dirY * attractForce * deltaTime

    if (distToPlayer > this.attractRadius * 1.5) {
      this.state = 'idle'
    }
  }

  /**
   * 收集
   */
  public collect(): void {
    if (this.state === 'collected') return

    this.state = 'collected'
    this.collectAnimationTimer = 0
    this.createCollectEffect()
  }

  /**
   * 创建收集效果
   */
  private createCollectEffect(): void {
    this.particles = []
    const particleCount = 15

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = 80 + Math.random() * 120

      this.particles.push({
        x: this.position.x,
        y: this.position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        type: 'collect',
        angle,
        orbitSpeed: 0,
        orbitDistance: 0,
      })
    }
  }

  /**
   * 更新收集动画
   */
  private updateCollected(deltaTime: number): void {
    this.collectAnimationTimer += deltaTime

    if (this.collectAnimationTimer >= 0.8) {
      this.active = false
      this.state = 'disabled'
    }
  }

  /**
   * 更新粒子
   */
  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      if (p.type === 'idle') {
        p.angle += p.orbitSpeed * deltaTime
        p.x = this.position.x + Math.cos(p.angle) * p.orbitDistance
        p.y = this.position.y + Math.sin(p.angle) * p.orbitDistance
        p.life -= deltaTime
        p.alpha = 0.3 + Math.sin(this.animationTimer * 3 + p.angle) * 0.2

        if (p.life <= 0) {
          this.particles[i] = this.createIdleParticle()
        }
      } else if (p.type === 'collect') {
        p.x += p.vx * deltaTime
        p.y += p.vy * deltaTime
        p.vy += 200 * deltaTime
        p.life -= deltaTime
        p.alpha = p.life / p.maxLife
        p.size *= 0.98

        if (p.life <= 0) {
          this.particles.splice(i, 1)
        }
      }
    }
  }

  /**
   * 获取碰撞盒
   */
  public getBounds(): Rect {
    return {
      x: this.position.x - this.size,
      y: this.position.y - this.size,
      width: this.size * 2,
      height: this.size * 2,
    }
  }

  /**
   * 绘制收集物
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active && this.state !== 'collected') return

    ctx.save()

    if (this.state !== 'collected') {
      this.drawGlow(ctx)
      this.drawCore(ctx)
    }

    this.drawParticles(ctx)

    if (this.state === 'collected') {
      this.drawCollectEffect(ctx)
    }

    ctx.restore()
  }

  /**
   * 绘制光晕
   */
  private drawGlow(ctx: CanvasRenderingContext2D): void {
    const pulseSize = 1 + Math.sin(this.animationTimer * 4 + this.phaseOffset) * 0.15
    const glowSize = this.size * 3 * pulseSize

    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, glowSize
    )

    const color = this.getColor()
    gradient.addColorStop(0, `rgba(${color}, 0.4)`)
    gradient.addColorStop(0.5, `rgba(${color}, 0.2)`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, glowSize, 0, Math.PI * 2)
    ctx.fill()

    if (this.state === 'attracting') {
      const attractGradient = ctx.createRadialGradient(
        this.position.x, this.position.y, this.size * 2,
        this.position.x, this.position.y, this.attractRadius
      )
      attractGradient.addColorStop(0, 'rgba(255, 255, 200, 0.1)')
      attractGradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
      ctx.fillStyle = attractGradient
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, this.attractRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制核心
   */
  private drawCore(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.rotation)

    const color = this.getColor()
    const size = this.size * (1 + Math.sin(this.animationTimer * 3 + this.phaseOffset) * 0.1)

    if (this.type === 'lightParticle') {
      this.drawLightParticleCore(ctx, color, size)
    } else if (this.type === 'health') {
      this.drawHealthCore(ctx, color, size)
    } else {
      this.drawStarCore(ctx, color, size)
    }

    ctx.restore()
  }

  /**
   * 绘制光粒子核心
   */
  private drawLightParticleCore(ctx: CanvasRenderingContext2D, color: string, size: number): void {
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    outerGradient.addColorStop(0, `rgba(255, 255, 255, 1)`)
    outerGradient.addColorStop(0.3, `rgba(${color}, 1)`)
    outerGradient.addColorStop(1, `rgba(${color}, 0.5)`)

    ctx.fillStyle = outerGradient
    ctx.beginPath()
    ctx.arc(0, 0, size, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(-size * 0.2, -size * 0.2, size * 0.25, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(${color}, 0.6)`
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8)
      ctx.lineTo(Math.cos(angle) * size * 1.3, Math.sin(angle) * size * 1.3)
      ctx.stroke()
    }
  }

  /**
   * 绘制生命值核心
   */
  private drawHealthCore(ctx: CanvasRenderingContext2D, color: string, size: number): void {
    const heartGradient = ctx.createRadialGradient(0, -size * 0.2, 0, 0, 0, size)
    heartGradient.addColorStop(0, '#FF6B6B')
    heartGradient.addColorStop(1, '#E53935')

    ctx.fillStyle = heartGradient
    ctx.beginPath()
    const s = size * 0.8
    ctx.moveTo(0, s * 0.6)
    ctx.bezierCurveTo(-s, -s * 0.2, -s, -s * 0.8, 0, -s * 0.4)
    ctx.bezierCurveTo(s, -s * 0.8, s, -s * 0.2, 0, s * 0.6)
    ctx.fill()

    ctx.strokeStyle = '#B71C1C'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.ellipse(-s * 0.3, -s * 0.4, s * 0.2, s * 0.15, -0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制星星核心
   */
  private drawStarCore(ctx: CanvasRenderingContext2D, color: string, size: number): void {
    const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    starGradient.addColorStop(0, '#FFEB3B')
    starGradient.addColorStop(1, '#FFC107')

    ctx.fillStyle = starGradient
    ctx.beginPath()
    const spikes = 5
    const outerRadius = size
    const innerRadius = size * 0.4

    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#FF8F00'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(-size * 0.15, -size * 0.3, size * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制粒子
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (p.type === 'idle') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        gradient.addColorStop(0, `rgba(255, 255, 200, ${p.alpha})`)
        gradient.addColorStop(1, 'rgba(255, 200, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'collect') {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        gradient.addColorStop(0, `rgba(255, 255, 200, ${p.alpha})`)
        gradient.addColorStop(0.5, `rgba(255, 200, 0, ${p.alpha * 0.7})`)
        gradient.addColorStop(1, 'rgba(255, 150, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  /**
   * 绘制收集效果
   */
  private drawCollectEffect(ctx: CanvasRenderingContext2D): void {
    const progress = clamp(this.collectAnimationTimer / 0.5, 0, 1)
    const ringSize = lerp(this.size * 2, this.size * 6, progress)
    const ringAlpha = lerp(0.8, 0, progress)

    const color = this.getColor()
    ctx.strokeStyle = `rgba(${color}, ${ringAlpha})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, ringSize, 0, Math.PI * 2)
    ctx.stroke()

    if (progress < 0.5) {
      const textAlpha = lerp(1, 0, progress * 2)
      ctx.fillStyle = `rgba(255, 215, 0, ${textAlpha})`
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`+${this.score}`, this.position.x, this.position.y - 20 - progress * 30)
    }
  }

  /**
   * 获取颜色字符串
   */
  private getColor(): string {
    switch (this.type) {
      case 'lightParticle':
        return '255, 215, 0'
      case 'health':
        return '255, 100, 100'
      case 'star':
        return '255, 235, 59'
      default:
        return '255, 215, 0'
    }
  }

  /**
   * 重置收集物
   */
  public reset(): void {
    this.position = { ...this.basePosition }
    this.state = 'idle'
    this.active = true
    this.animationTimer = 0
    this.collectAnimationTimer = 0
    this.particles = []
    this.initIdleParticles()
  }
}

/**
 * 收集物组类
 * 用于管理多个收集物
 */
export class CollectibleGroup {
  /** 收集物列表 */
  public collectibles: Collectible[]
  /** 已收集数量 */
  public collectedCount: number
  /** 总数量 */
  public totalCount: number

  /**
   * 构造函数
   */
  constructor() {
    this.collectibles = []
    this.collectedCount = 0
    this.totalCount = 0
  }

  /**
   * 添加收集物
   */
  public add(collectible: Collectible): void {
    this.collectibles.push(collectible)
    this.totalCount++
  }

  /**
   * 更新所有收集物
   */
  public update(deltaTime: number, player: Player): number {
    let scoreGained = 0

    for (const collectible of this.collectibles) {
      const wasCollected = collectible.state === 'collected'
      collectible.update(deltaTime, player)

      if (!wasCollected && collectible.state === 'collected') {
        this.collectedCount++
        scoreGained += collectible.score
      }
    }

    return scoreGained
  }

  /**
   * 绘制所有收集物
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    for (const collectible of this.collectibles) {
      collectible.draw(ctx)
    }
  }

  /**
   * 检查是否全部收集
   */
  public isAllCollected(): boolean {
    return this.collectedCount >= this.totalCount
  }

  /**
   * 重置所有收集物
   */
  public reset(): void {
    for (const collectible of this.collectibles) {
      collectible.reset()
    }
    this.collectedCount = 0
  }

  /**
   * 获取激活的收集物数量
   */
  public getActiveCount(): number {
    return this.collectibles.filter(c => c.active && c.state !== 'disabled').length
  }
}

/** 收集物粒子接口 */
interface CollectibleParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  type: 'idle' | 'collect'
  angle?: number
  orbitSpeed?: number
  orbitDistance?: number
}
