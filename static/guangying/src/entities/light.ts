/**
 * 光影区域类
 * 包含光区域、影区域和过渡效果
 */

import type { Vector2, Rect } from '@/utils/math'
import { rectIntersects, lerp } from '@/utils/math'
import type { Player } from './player'

/** 区域类型 */
export type ZoneType = 'light' | 'shadow'

/** 区域形状 */
export type ZoneShape = 'rectangle' | 'circle' | 'ellipse'

/** 光影区域配置 */
export interface LightZoneConfig {
  /** 位置 */
  position: Vector2
  /** 尺寸（矩形时为宽高，圆形时为半径） */
  size: { width: number; height: number } | number
  /** 区域形状 */
  shape: ZoneShape
  /** 速度加成系数 */
  speedMultiplier: number
  /** 跳跃加成系数 */
  jumpMultiplier: number
  /** 光晕颜色 */
  glowColor: string
  /** 光晕强度 */
  glowIntensity: number
}

/** 影区域配置 */
export interface ShadowZoneConfig {
  /** 位置 */
  position: Vector2
  /** 尺寸（矩形时为宽高，圆形时为半径） */
  size: { width: number; height: number } | number
  /** 区域形状 */
  shape: ZoneShape
  /** 是否允许穿墙 */
  allowPhasing: boolean
  /** 光晕颜色 */
  glowColor: string
  /** 光晕强度 */
  glowIntensity: number
}

/**
 * 光区域类
 * 提供加速和增强跳跃能力，带有金色光晕
 */
export class LightZone {
  /** 位置 */
  public position: Vector2
  /** 尺寸 */
  public size: { width: number; height: number } | number
  /** 区域形状 */
  public shape: ZoneShape
  /** 速度加成系数 */
  public speedMultiplier: number
  /** 跳跃加成系数 */
  public jumpMultiplier: number
  /** 光晕颜色 */
  public glowColor: string
  /** 光晕强度 */
  public glowIntensity: number
  /** 是否激活 */
  public active: boolean

  /** 动画计时器 */
  private animationTimer: number
  /** 粒子系统 */
  private particles: LightParticle[]

  /**
   * 构造函数
   */
  constructor(config: LightZoneConfig) {
    this.position = { ...config.position }
    this.size = typeof config.size === 'number' ? config.size : { ...config.size }
    this.shape = config.shape
    this.speedMultiplier = config.speedMultiplier
    this.jumpMultiplier = config.jumpMultiplier
    this.glowColor = config.glowColor
    this.glowIntensity = config.glowIntensity
    this.active = true

    this.animationTimer = 0
    this.particles = []
    this.initParticles()
  }

  /**
   * 初始化光粒子
   */
  private initParticles(): void {
    const particleCount = 15
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  /**
   * 创建单个光粒子
   */
  private createParticle(): LightParticle {
    const angle = Math.random() * Math.PI * 2
    const radius = typeof this.size === 'number'
      ? this.size * 0.8
      : Math.min(this.size.width, this.size.height) * 0.4

    return {
      x: this.position.x + Math.cos(angle) * radius * Math.random(),
      y: this.position.y + Math.sin(angle) * radius * Math.random(),
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 10,
      size: 2 + Math.random() * 3,
      alpha: 0.3 + Math.random() * 0.5,
      life: 1 + Math.random() * 2,
      maxLife: 3,
    }
  }

  /**
   * 更新光区域
   */
  public update(deltaTime: number, player: Player): void {
    this.animationTimer += deltaTime

    if (!this.active) return

    const isPlayerInside = this.containsPoint(player.position.x, player.position.y - player.size.height / 2)
    player.isInLightZone = isPlayerInside

    this.updateParticles(deltaTime)
  }

  /**
   * 更新粒子
   */
  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.life -= deltaTime

      if (p.life <= 0) {
        this.particles[i] = this.createParticle()
      } else {
        p.alpha = (p.life / p.maxLife) * 0.6
      }

      if (!this.containsPoint(p.x, p.y)) {
        this.particles[i] = this.createParticle()
      }
    }
  }

  /**
   * 检查点是否在区域内
   */
  public containsPoint(x: number, y: number): boolean {
    if (!this.active) return false

    if (this.shape === 'circle') {
      const radius = this.size as number
      const dx = x - this.position.x
      const dy = y - this.position.y
      return dx * dx + dy * dy <= radius * radius
    } else if (this.shape === 'ellipse') {
      const size = this.size as { width: number; height: number }
      const dx = x - this.position.x
      const dy = y - this.position.y
      return (dx * dx) / (size.width * size.width / 4) + (dy * dy) / (size.height * size.height / 4) <= 1
    } else {
      const size = this.size as { width: number; height: number }
      const rect: Rect = {
        x: this.position.x - size.width / 2,
        y: this.position.y - size.height / 2,
        width: size.width,
        height: size.height,
      }
      return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
    }
  }

  /**
   * 检查与矩形的碰撞
   */
  public intersectsRect(rect: Rect): boolean {
    if (!this.active) return false

    if (this.shape === 'rectangle') {
      const size = this.size as { width: number; height: number }
      const zoneRect: Rect = {
        x: this.position.x - size.width / 2,
        y: this.position.y - size.height / 2,
        width: size.width,
        height: size.height,
      }
      return rectIntersects(rect, zoneRect)
    }

    const centerX = this.shape === 'circle' ? this.position.x : this.position.x
    const centerY = this.shape === 'circle' ? this.position.y : this.position.y
    const radius = this.shape === 'circle'
      ? (this.size as number)
      : Math.max((this.size as { width: number; height: number }).width, (this.size as { width: number; height: number }).height) / 2

    const closestX = Math.max(rect.x, Math.min(centerX, rect.x + rect.width))
    const closestY = Math.max(rect.y, Math.min(centerY, rect.y + rect.height))
    const dx = centerX - closestX
    const dy = centerY - closestY
    return dx * dx + dy * dy <= radius * radius
  }

  /**
   * 绘制光区域
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    const pulseSize = 1 + Math.sin(this.animationTimer * 2) * 0.05

    this.drawGlow(ctx, pulseSize)
    this.drawBoundary(ctx, pulseSize)
    this.drawParticles(ctx)

    ctx.restore()
  }

  /**
   * 绘制光晕
   */
  private drawGlow(ctx: CanvasRenderingContext2D, pulseSize: number): void {
    let gradient: CanvasGradient

    if (this.shape === 'circle') {
      const radius = (this.size as number) * pulseSize
      gradient = ctx.createRadialGradient(
        this.position.x, this.position.y, 0,
        this.position.x, this.position.y, radius
      )
    } else {
      const size = this.size as { width: number; height: number }
      const w = size.width * pulseSize
      const h = size.height * pulseSize
      const maxRadius = Math.max(w, h) / 2
      gradient = ctx.createRadialGradient(
        this.position.x, this.position.y, 0,
        this.position.x, this.position.y, maxRadius
      )
    }

    const baseAlpha = 0.15 * this.glowIntensity
    gradient.addColorStop(0, `rgba(255, 215, 0, ${baseAlpha})`)
    gradient.addColorStop(0.5, `rgba(255, 200, 0, ${baseAlpha * 0.6})`)
    gradient.addColorStop(1, 'rgba(255, 180, 0, 0)')

    ctx.fillStyle = gradient

    if (this.shape === 'circle') {
      const radius = (this.size as number) * pulseSize
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.shape === 'ellipse') {
      const size = this.size as { width: number; height: number }
      ctx.beginPath()
      ctx.ellipse(
        this.position.x, this.position.y,
        (size.width / 2) * pulseSize, (size.height / 2) * pulseSize,
        0, 0, Math.PI * 2
      )
      ctx.fill()
    } else {
      const size = this.size as { width: number; height: number }
      const w = size.width * pulseSize
      const h = size.height * pulseSize
      ctx.fillRect(this.position.x - w / 2, this.position.y - h / 2, w, h)
    }
  }

  /**
   * 绘制区域边界
   */
  private drawBoundary(ctx: CanvasRenderingContext2D, pulseSize: number): void {
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 * this.glowIntensity})`
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.lineDashOffset = -this.animationTimer * 30

    if (this.shape === 'circle') {
      const radius = (this.size as number) * pulseSize
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    } else if (this.shape === 'ellipse') {
      const size = this.size as { width: number; height: number }
      ctx.beginPath()
      ctx.ellipse(
        this.position.x, this.position.y,
        (size.width / 2) * pulseSize, (size.height / 2) * pulseSize,
        0, 0, Math.PI * 2
      )
      ctx.stroke()
    } else {
      const size = this.size as { width: number; height: number }
      const w = size.width * pulseSize
      const h = size.height * pulseSize
      ctx.strokeRect(this.position.x - w / 2, this.position.y - h / 2, w, h)
    }

    ctx.setLineDash([])
  }

  /**
   * 绘制粒子
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
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
    }
  }
}

/**
 * 影区域类
 * 提供穿墙能力，带有紫色光晕
 */
export class ShadowZone {
  /** 位置 */
  public position: Vector2
  /** 尺寸 */
  public size: { width: number; height: number } | number
  /** 区域形状 */
  public shape: ZoneShape
  /** 是否允许穿墙 */
  public allowPhasing: boolean
  /** 光晕颜色 */
  public glowColor: string
  /** 光晕强度 */
  public glowIntensity: number
  /** 是否激活 */
  public active: boolean

  /** 动画计时器 */
  private animationTimer: number
  /** 粒子系统 */
  private particles: ShadowParticle[]

  /**
   * 构造函数
   */
  constructor(config: ShadowZoneConfig) {
    this.position = { ...config.position }
    this.size = typeof config.size === 'number' ? config.size : { ...config.size }
    this.shape = config.shape
    this.allowPhasing = config.allowPhasing
    this.glowColor = config.glowColor
    this.glowIntensity = config.glowIntensity
    this.active = true

    this.animationTimer = 0
    this.particles = []
    this.initParticles()
  }

  /**
   * 初始化影粒子
   */
  private initParticles(): void {
    const particleCount = 12
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  /**
   * 创建单个影粒子
   */
  private createParticle(): ShadowParticle {
    const angle = Math.random() * Math.PI * 2
    const radius = typeof this.size === 'number'
      ? this.size * 0.8
      : Math.min(this.size.width, this.size.height) * 0.4

    return {
      x: this.position.x + Math.cos(angle) * radius * Math.random(),
      y: this.position.y + Math.sin(angle) * radius * Math.random(),
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      size: 3 + Math.random() * 4,
      alpha: 0.2 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      life: 2 + Math.random() * 2,
      maxLife: 4,
    }
  }

  /**
   * 更新影区域
   */
  public update(deltaTime: number, player: Player): void {
    this.animationTimer += deltaTime

    if (!this.active) return

    const isPlayerInside = this.containsPoint(player.position.x, player.position.y - player.size.height / 2)
    player.isInShadowZone = isPlayerInside

    this.updateParticles(deltaTime)
  }

  /**
   * 更新粒子
   */
  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      const angle = Math.atan2(p.y - this.position.y, p.x - this.position.x)
      p.vx += Math.cos(angle + Math.PI / 2) * 5 * deltaTime
      p.vy += Math.sin(angle + Math.PI / 2) * 5 * deltaTime

      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.rotation += p.rotationSpeed * deltaTime
      p.life -= deltaTime

      if (p.life <= 0) {
        this.particles[i] = this.createParticle()
      } else {
        p.alpha = (p.life / p.maxLife) * 0.5
      }

      if (!this.containsPoint(p.x, p.y)) {
        this.particles[i] = this.createParticle()
      }
    }
  }

  /**
   * 检查点是否在区域内
   */
  public containsPoint(x: number, y: number): boolean {
    if (!this.active) return false

    if (this.shape === 'circle') {
      const radius = this.size as number
      const dx = x - this.position.x
      const dy = y - this.position.y
      return dx * dx + dy * dy <= radius * radius
    } else if (this.shape === 'ellipse') {
      const size = this.size as { width: number; height: number }
      const dx = x - this.position.x
      const dy = y - this.position.y
      return (dx * dx) / (size.width * size.width / 4) + (dy * dy) / (size.height * size.height / 4) <= 1
    } else {
      const size = this.size as { width: number; height: number }
      const rect: Rect = {
        x: this.position.x - size.width / 2,
        y: this.position.y - size.height / 2,
        width: size.width,
        height: size.height,
      }
      return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
    }
  }

  /**
   * 检查与矩形的碰撞
   */
  public intersectsRect(rect: Rect): boolean {
    if (!this.active) return false

    if (this.shape === 'rectangle') {
      const size = this.size as { width: number; height: number }
      const zoneRect: Rect = {
        x: this.position.x - size.width / 2,
        y: this.position.y - size.height / 2,
        width: size.width,
        height: size.height,
      }
      return rectIntersects(rect, zoneRect)
    }

    const centerX = this.position.x
    const centerY = this.position.y
    const radius = this.shape === 'circle'
      ? (this.size as number)
      : Math.max((this.size as { width: number; height: number }).width, (this.size as { width: number; height: number }).height) / 2

    const closestX = Math.max(rect.x, Math.min(centerX, rect.x + rect.width))
    const closestY = Math.max(rect.y, Math.min(centerY, rect.y + rect.height))
    const dx = centerX - closestX
    const dy = centerY - closestY
    return dx * dx + dy * dy <= radius * radius
  }

  /**
   * 绘制影区域
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    const pulseSize = 1 + Math.sin(this.animationTimer * 1.5) * 0.03

    this.drawGlow(ctx, pulseSize)
    this.drawBoundary(ctx, pulseSize)
    this.drawParticles(ctx)

    ctx.restore()
  }

  /**
   * 绘制影晕
   */
  private drawGlow(ctx: CanvasRenderingContext2D, pulseSize: number): void {
    let gradient: CanvasGradient

    if (this.shape === 'circle') {
      const radius = (this.size as number) * pulseSize
      gradient = ctx.createRadialGradient(
        this.position.x, this.position.y, 0,
        this.position.x, this.position.y, radius
      )
    } else {
      const size = this.size as { width: number; height: number }
      const w = size.width * pulseSize
      const h = size.height * pulseSize
      const maxRadius = Math.max(w, h) / 2
      gradient = ctx.createRadialGradient(
        this.position.x, this.position.y, 0,
        this.position.x, this.position.y, maxRadius
      )
    }

    const baseAlpha = 0.2 * this.glowIntensity
    gradient.addColorStop(0, `rgba(138, 43, 226, ${baseAlpha})`)
    gradient.addColorStop(0.5, `rgba(128, 0, 128, ${baseAlpha * 0.7})`)
    gradient.addColorStop(1, 'rgba(75, 0, 130, 0)')

    ctx.fillStyle = gradient

    if (this.shape === 'circle') {
      const radius = (this.size as number) * pulseSize
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.shape === 'ellipse') {
      const size = this.size as { width: number; height: number }
      ctx.beginPath()
      ctx.ellipse(
        this.position.x, this.position.y,
        (size.width / 2) * pulseSize, (size.height / 2) * pulseSize,
        0, 0, Math.PI * 2
      )
      ctx.fill()
    } else {
      const size = this.size as { width: number; height: number }
      const w = size.width * pulseSize
      const h = size.height * pulseSize
      ctx.fillRect(this.position.x - w / 2, this.position.y - h / 2, w, h)
    }
  }

  /**
   * 绘制区域边界
   */
  private drawBoundary(ctx: CanvasRenderingContext2D, pulseSize: number): void {
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.5 * this.glowIntensity})`
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.lineDashOffset = this.animationTimer * 20

    if (this.shape === 'circle') {
      const radius = (this.size as number) * pulseSize
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    } else if (this.shape === 'ellipse') {
      const size = this.size as { width: number; height: number }
      ctx.beginPath()
      ctx.ellipse(
        this.position.x, this.position.y,
        (size.width / 2) * pulseSize, (size.height / 2) * pulseSize,
        0, 0, Math.PI * 2
      )
      ctx.stroke()
    } else {
      const size = this.size as { width: number; height: number }
      const w = size.width * pulseSize
      const h = size.height * pulseSize
      ctx.strokeRect(this.position.x - w / 2, this.position.y - h / 2, w, h)
    }

    ctx.setLineDash([])
  }

  /**
   * 绘制粒子
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
      gradient.addColorStop(0, `rgba(186, 85, 211, ${p.alpha})`)
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(75, 0, 130, ${p.alpha})`
      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.lineTo(-p.size * 0.6, p.size * 0.5)
      ctx.lineTo(p.size * 0.6, p.size * 0.5)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
    }
  }
}

/**
 * 光影过渡效果类
 * 用于在光区域和影区域之间创建平滑过渡
 */
export class LightShadowTransition {
  /** 起始位置 */
  public startPosition: Vector2
  /** 结束位置 */
  public endPosition: Vector2
  /** 过渡宽度 */
  public width: number
  /** 过渡进度 0-1 */
  public progress: number
  /** 过渡方向 */
  public direction: 'lightToShadow' | 'shadowToLight'
  /** 是否激活 */
  public active: boolean

  /** 动画计时器 */
  private animationTimer: number
  /** 过渡粒子 */
  private particles: TransitionParticle[]

  /**
   * 构造函数
   */
  constructor(startPos: Vector2, endPos: Vector2, width: number) {
    this.startPosition = { ...startPos }
    this.endPosition = { ...endPos }
    this.width = width
    this.progress = 0
    this.direction = 'lightToShadow'
    this.active = false

    this.animationTimer = 0
    this.particles = []
  }

  /**
   * 开始过渡
   */
  public start(direction: 'lightToShadow' | 'shadowToLight'): void {
    this.direction = direction
    this.progress = 0
    this.active = true
    this.particles = []
  }

  /**
   * 更新过渡效果
   */
  public update(deltaTime: number): void {
    this.animationTimer += deltaTime

    if (!this.active) return

    this.progress = lerp(this.progress, 1, deltaTime * 3)

    if (this.progress >= 0.99) {
      this.active = false
      this.progress = 0
      this.particles = []
    }

    this.updateParticles(deltaTime)
  }

  /**
   * 更新过渡粒子
   */
  private updateParticles(deltaTime: number): void {
    if (Math.random() < 0.3) {
      this.particles.push(this.createParticle())
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.life -= deltaTime
      p.alpha = p.life / p.maxLife

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  /**
   * 创建过渡粒子
   */
  private createParticle(): TransitionParticle {
    const t = this.progress
    const x = lerp(this.startPosition.x, this.endPosition.x, t)
    const y = lerp(this.startPosition.y, this.endPosition.y, t)

    return {
      x: x + (Math.random() - 0.5) * this.width,
      y: y + (Math.random() - 0.5) * this.width,
      vx: (Math.random() - 0.5) * 100,
      vy: (Math.random() - 0.5) * 100 - 50,
      size: 2 + Math.random() * 4,
      alpha: 1,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      isLight: this.direction === 'lightToShadow',
    }
  }

  /**
   * 绘制过渡效果
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    const t = this.progress
    const currentX = lerp(this.startPosition.x, this.endPosition.x, t)
    const currentY = lerp(this.startPosition.y, this.endPosition.y, t)

    const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, this.width)

    if (this.direction === 'lightToShadow') {
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)')
      gradient.addColorStop(0.3, 'rgba(138, 43, 226, 0.6)')
      gradient.addColorStop(1, 'rgba(75, 0, 130, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)')
      gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.6)')
      gradient.addColorStop(1, 'rgba(255, 200, 0, 0)')
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(currentX, currentY, this.width, 0, Math.PI * 2)
    ctx.fill()

    this.drawParticles(ctx)

    ctx.restore()
  }

  /**
   * 绘制粒子
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const color = p.isLight ? '255, 215, 0' : '138, 43, 226'
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(${color}, ${p.alpha})`)
      gradient.addColorStop(1, `rgba(${color}, 0)`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(${color}, ${p.alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** 光粒子接口 */
interface LightParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}

/** 影粒子接口 */
interface ShadowParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  rotation: number
  rotationSpeed: number
  life: number
  maxLife: number
}

/** 过渡粒子接口 */
interface TransitionParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  isLight: boolean
}
