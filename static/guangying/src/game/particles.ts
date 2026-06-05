/**
 * 游戏粒子系统
 * 实现高性能的2D粒子效果，使用对象池模式避免GC
 * 支持多种粒子类型、发射器模式和动画曲线
 */

import type { Vector2, Particle, ParticleConfig, EasingType, AlphaCurve, SizeCurve, ColorCurve } from '../types/index'
import { randomRange, clamp, lerp, vectorAdd, vectorMul } from '../utils/math'

/**
 * 粒子类型
 */
export type ParticleType = 'light' | 'shadow' | 'dust' | 'spark' | 'smoke' | 'firework'

/**
 * 发射器类型
 */
export type EmitterType = 'point' | 'ring' | 'cone' | 'random'

/**
 * 发射器配置
 */
export interface EmitterConfig {
  /** 发射器类型 */
  type: EmitterType
  /** 发射器位置 */
  position: Vector2
  /** 发射方向（弧度） */
  angle?: number
  /** 发射角度范围（弧度），用于锥形发射器 */
  angleRange?: number
  /** 环形发射器半径 */
  radius?: number
  /** 最小发射速度 */
  minSpeed?: number
  /** 最大发射速度 */
  maxSpeed?: number
}

/**
 * 预设粒子配置
 */
const PARTICLE_PRESETS: Record<ParticleType, Partial<ParticleConfig>> = {
  light: {
    color: '#FFE066',
    minSize: 3,
    maxSize: 8,
    minLifetime: 500,
    maxLifetime: 1200,
    velocity: { min: { x: -30, y: -50 }, max: { x: 30, y: -100 } },
    acceleration: { x: 0, y: 0 },
    gravity: 0,
    alphaOverLifetime: { start: 1, end: 0, easing: 'easeOut' },
    sizeOverLifetime: { start: 1, end: 0.3, easing: 'easeOut' },
    blendMode: 'additive',
  },
  shadow: {
    color: '#2D1B4E',
    minSize: 4,
    maxSize: 10,
    minLifetime: 800,
    maxLifetime: 1500,
    velocity: { min: { x: -20, y: 10 }, max: { x: 20, y: 30 } },
    acceleration: { x: 0, y: 10 },
    gravity: 0.2,
    alphaOverLifetime: { start: 0.8, end: 0, easing: 'easeInOut' },
    sizeOverLifetime: { start: 0.5, end: 1.5, easing: 'easeOut' },
    blendMode: 'normal',
  },
  dust: {
    color: '#C4B7A6',
    minSize: 1,
    maxSize: 3,
    minLifetime: 1000,
    maxLifetime: 3000,
    velocity: { min: { x: -5, y: -10 }, max: { x: 5, y: -20 } },
    acceleration: { x: 0, y: 5 },
    gravity: 0.05,
    alphaOverLifetime: { start: 0.6, end: 0, easing: 'linear' },
    sizeOverLifetime: { start: 1, end: 1, easing: 'linear' },
    blendMode: 'normal',
  },
  spark: {
    color: '#FF6B35',
    minSize: 2,
    maxSize: 4,
    minLifetime: 300,
    maxLifetime: 800,
    velocity: { min: { x: -100, y: -150 }, max: { x: 100, y: -250 } },
    acceleration: { x: 0, y: 300 },
    gravity: 0.8,
    alphaOverLifetime: { start: 1, end: 0, easing: 'easeIn' },
    sizeOverLifetime: { start: 1, end: 0.2, easing: 'easeIn' },
    blendMode: 'additive',
  },
  smoke: {
    color: '#6B6B6B',
    minSize: 8,
    maxSize: 15,
    minLifetime: 1500,
    maxLifetime: 3000,
    velocity: { min: { x: -10, y: -30 }, max: { x: 10, y: -60 } },
    acceleration: { x: 0, y: -10 },
    gravity: -0.1,
    alphaOverLifetime: { start: 0.5, end: 0, easing: 'easeOut' },
    sizeOverLifetime: { start: 0.3, end: 2, easing: 'easeOut' },
    blendMode: 'normal',
  },
  firework: {
    color: '#FF3366',
    minSize: 3,
    maxSize: 6,
    minLifetime: 800,
    maxLifetime: 1500,
    velocity: { min: { x: -200, y: -200 }, max: { x: 200, y: -300 } },
    acceleration: { x: 0, y: 150 },
    gravity: 0.5,
    alphaOverLifetime: { start: 1, end: 0, easing: 'easeOut' },
    sizeOverLifetime: { start: 1, end: 0.5, easing: 'easeOut' },
    colorOverLifetime: { start: '#FF3366', end: '#FFD700', easing: 'easeOut' },
    blendMode: 'additive',
  },
}

/**
 * 缓动函数集合
 */
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
}

/**
 * 粒子对象池
 * 复用粒子对象，避免频繁的GC
 */
class ParticlePool {
  /** 可用粒子队列 */
  private pool: Particle[] = []
  /** 最大池容量 */
  private maxSize: number
  /** 粒子ID计数器 */
  private idCounter: number = 0

  constructor(initialSize: number = 100, maxSize: number = 1000) {
    this.maxSize = maxSize
    this.expand(initialSize)
  }

  /**
   * 扩展池容量
   */
  private expand(count: number): void {
    const actualCount = Math.min(count, this.maxSize - this.pool.length)
    for (let i = 0; i < actualCount; i++) {
      this.pool.push(this.createParticle())
    }
  }

  /**
   * 创建新的粒子对象
   */
  private createParticle(): Particle {
    return {
      id: `particle_${this.idCounter++}`,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      size: 0,
      color: '#ffffff',
      alpha: 0,
      age: 0,
      lifetime: 0,
      rotation: 0,
      rotationSpeed: 0,
      isActive: false,
    }
  }

  /**
   * 获取一个可用粒子
   */
  public acquire(): Particle | null {
    if (this.pool.length === 0) {
      this.expand(Math.min(10, this.maxSize))
    }

    const particle = this.pool.pop()
    if (particle) {
      particle.isActive = true
    }
    return particle || null
  }

  /**
   * 归还粒子到池中
   */
  public release(particle: Particle): void {
    particle.isActive = false
    particle.age = 0
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle)
    }
  }

  /**
   * 获取当前池大小
   */
  public size(): number {
    return this.pool.length
  }

  /**
   * 清空池
   */
  public clear(): void {
    this.pool.length = 0
  }
}

/**
 * 粒子发射器类
 * 负责按配置发射粒子
 */
export class ParticleEmitter {
  /** 发射器配置 */
  private config: EmitterConfig
  /** 粒子配置 */
  private particleConfig: ParticleConfig
  /** 是否正在发射 */
  private emitting: boolean = false
  /** 发射计时器 */
  private emissionTimer: number = 0
  /** 已发射粒子数 */
  private emittedCount: number = 0
  /** 发射器存活时间 */
  private lifetime: number = 0
  /** 粒子池引用 */
  private pool: ParticlePool
  /** 活跃粒子列表 */
  private activeParticles: Particle[] = []
  /** 视口矩形，用于裁剪 */
  private viewport: { x: number; y: number; width: number; height: number } | null = null
  /** 最大活跃粒子数 */
  private maxActiveParticles: number = 500
  /** 是否启用视口裁剪 */
  private viewportCulling: boolean = true

  constructor(
    emitterConfig: EmitterConfig,
    particleConfig: ParticleConfig,
    pool: ParticlePool
  ) {
    this.config = { ...emitterConfig }
    this.particleConfig = { ...particleConfig }
    this.pool = pool
  }

  /**
   * 开始发射
   * @param duration 发射持续时间（毫秒），0为无限
   */
  public start(duration: number = 0): void {
    this.emitting = true
    this.lifetime = duration
    this.emittedCount = 0
    this.emissionTimer = 0
  }

  /**
   * 停止发射
   */
  public stop(): void {
    this.emitting = false
  }

  /**
   * 一次性发射指定数量的粒子
   * @param count 粒子数量
   */
  public burst(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.activeParticles.length < this.maxActiveParticles) {
        this.emitParticle()
      }
    }
  }

  /**
   * 更新发射器和粒子
   * @param deltaTime 帧间隔时间（毫秒）
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000

    if (this.emitting && this.particleConfig.loop) {
      this.emissionTimer += deltaTime
      const emissionInterval = 1000 / this.particleConfig.emissionRate

      while (this.emissionTimer >= emissionInterval && 
             this.activeParticles.length < this.maxActiveParticles) {
        this.emitParticle()
        this.emissionTimer -= emissionInterval
      }

      if (this.lifetime > 0) {
        this.lifetime -= deltaTime
        if (this.lifetime <= 0) {
          this.emitting = false
        }
      }
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i]
      this.updateParticle(particle, dt)

      if (this.shouldCull(particle)) {
        this.pool.release(particle)
        this.activeParticles.splice(i, 1)
        continue
      }

      if (particle.age >= particle.lifetime) {
        this.pool.release(particle)
        this.activeParticles.splice(i, 1)
      }
    }
  }

  /**
   * 渲染所有活跃粒子
   * @param ctx 画布渲染上下文
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.activeParticles) {
      if (!particle.isActive) continue

      ctx.save()
      ctx.globalAlpha = particle.alpha

      if (this.particleConfig.blendMode === 'additive') {
        ctx.globalCompositeOperation = 'lighter'
      } else if (this.particleConfig.blendMode === 'multiply') {
        ctx.globalCompositeOperation = 'multiply'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.translate(particle.position.x, particle.position.y)
      ctx.rotate(particle.rotation)

      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  /**
   * 发射单个粒子
   */
  private emitParticle(): void {
    const particle = this.pool.acquire()
    if (!particle) return

    const config = this.particleConfig

    particle.position = this.calculateSpawnPosition()
    particle.velocity = this.calculateSpawnVelocity()
    particle.size = randomRange(config.minSize, config.maxSize)
    particle.lifetime = randomRange(config.minLifetime, config.maxLifetime)
    particle.age = 0
    particle.color = config.color
    particle.alpha = this.calculateAlpha(0, config.alphaOverLifetime)
    particle.rotation = randomRange(0, Math.PI * 2)
    particle.rotationSpeed = randomRange(-2, 2)
    particle.isActive = true

    this.activeParticles.push(particle)
    this.emittedCount++
  }

  /**
   * 计算粒子生成位置
   */
  private calculateSpawnPosition(): Vector2 {
    const pos = { ...this.config.position }

    switch (this.config.type) {
      case 'point':
        return pos

      case 'ring': {
        const radius = this.config.radius || 50
        const angle = randomRange(0, Math.PI * 2)
        return {
          x: pos.x + Math.cos(angle) * radius,
          y: pos.y + Math.sin(angle) * radius,
        }
      }

      case 'cone': {
        const radius = (this.config.radius || 0) * randomRange(0, 1)
        const angle = randomRange(
          (this.config.angle || 0) - (this.config.angleRange || Math.PI / 4),
          (this.config.angle || 0) + (this.config.angleRange || Math.PI / 4)
        )
        return {
          x: pos.x + Math.cos(angle) * radius,
          y: pos.y + Math.sin(angle) * radius,
        }
      }

      case 'random': {
        const radius = this.config.radius || 100
        const angle = randomRange(0, Math.PI * 2)
        const dist = randomRange(0, radius)
        return {
          x: pos.x + Math.cos(angle) * dist,
          y: pos.y + Math.sin(angle) * dist,
        }
      }

      default:
        return pos
    }
  }

  /**
   * 计算粒子初始速度
   */
  private calculateSpawnVelocity(): Vector2 {
    const config = this.particleConfig
    let velocity: Vector2 = {
      x: randomRange(config.velocity.min.x, config.velocity.max.x),
      y: randomRange(config.velocity.min.y, config.velocity.max.y),
    }

    switch (this.config.type) {
      case 'ring': {
        const angle = Math.atan2(
          velocity.y - this.config.position.y,
          velocity.x - this.config.position.x
        )
        const speed = randomRange(
          this.config.minSpeed || 50,
          this.config.maxSpeed || 150
        )
        velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        }
        break
      }

      case 'cone': {
        const baseAngle = this.config.angle || 0
        const angleRange = this.config.angleRange || Math.PI / 4
        const angle = randomRange(baseAngle - angleRange, baseAngle + angleRange)
        const speed = randomRange(
          this.config.minSpeed || 100,
          this.config.maxSpeed || 200
        )
        velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        }
        break
      }

      case 'random': {
        const angle = randomRange(0, Math.PI * 2)
        const speed = randomRange(
          this.config.minSpeed || 50,
          this.config.maxSpeed || 150
        )
        velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        }
        break
      }
    }

    return velocity
  }

  /**
   * 更新单个粒子
   */
  private updateParticle(particle: Particle, dt: number): void {
    particle.age += dt * 1000

    const t = clamp(particle.age / particle.lifetime, 0, 1)
    const config = this.particleConfig

    const gravity = { x: 0, y: config.gravity * 980 }
    const totalAcceleration = vectorAdd(config.acceleration, gravity)

    particle.velocity = vectorAdd(
      particle.velocity,
      vectorMul(totalAcceleration, dt)
    )

    particle.position = vectorAdd(
      particle.position,
      vectorMul(particle.velocity, dt)
    )

    particle.rotation += particle.rotationSpeed * dt

    particle.alpha = this.calculateAlpha(t, config.alphaOverLifetime)

    const sizeMultiplier = this.calculateSize(t, config.sizeOverLifetime)
    const baseSize = particle.size
    particle.size = baseSize * sizeMultiplier

    if (config.colorOverLifetime) {
      particle.color = this.calculateColor(t, config.colorOverLifetime)
    }
  }

  /**
   * 计算粒子透明度
   */
  private calculateAlpha(t: number, curve: AlphaCurve): number {
    const easedT = this.applyEasing(t, curve.easing)
    return lerp(curve.start, curve.end, easedT)
  }

  /**
   * 计算粒子大小倍数
   */
  private calculateSize(t: number, curve: SizeCurve): number {
    const easedT = this.applyEasing(t, curve.easing)
    return lerp(curve.start, curve.end, easedT)
  }

  /**
   * 计算粒子颜色
   */
  private calculateColor(t: number, curve: ColorCurve): string {
    const easedT = this.applyEasing(t, curve.easing)
    return this.lerpColor(curve.start, curve.end, easedT)
  }

  /**
   * 应用缓动函数
   */
  private applyEasing(t: number, easing: EasingType): number {
    const easingFn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.linear
    return easingFn(t)
  }

  /**
   * 颜色插值
   */
  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1)
    const c2 = this.hexToRgb(color2)

    if (!c1 || !c2) return color1

    const r = Math.round(lerp(c1.r, c2.r, t))
    const g = Math.round(lerp(c1.g, c2.g, t))
    const b = Math.round(lerp(c1.b, c2.b, t))

    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * 十六进制颜色转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    }
    return null
  }

  /**
   * 判断粒子是否应该被裁剪
   */
  private shouldCull(particle: Particle): boolean {
    if (!this.viewportCulling || !this.viewport) return false

    return (
      particle.position.x < this.viewport.x - particle.size ||
      particle.position.x > this.viewport.x + this.viewport.width + particle.size ||
      particle.position.y < this.viewport.y - particle.size ||
      particle.position.y > this.viewport.y + this.viewport.height + particle.size
    )
  }

  /**
   * 设置视口用于裁剪
   */
  public setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = { x, y, width, height }
  }

  /**
   * 设置是否启用视口裁剪
   */
  public setViewportCulling(enabled: boolean): void {
    this.viewportCulling = enabled
  }

  /**
   * 设置最大活跃粒子数
   */
  public setMaxActiveParticles(max: number): void {
    this.maxActiveParticles = Math.max(1, max)
  }

  /**
   * 设置发射器位置
   */
  public setPosition(x: number, y: number): void {
    this.config.position.x = x
    this.config.position.y = y
  }

  /**
   * 获取发射器位置
   */
  public getPosition(): Vector2 {
    return { ...this.config.position }
  }

  /**
   * 获取当前活跃粒子数
   */
  public getActiveParticleCount(): number {
    return this.activeParticles.length
  }

  /**
   * 检查发射器是否正在发射
   */
  public isEmitting(): boolean {
    return this.emitting
  }

  /**
   * 清除所有活跃粒子
   */
  public clear(): void {
    for (const particle of this.activeParticles) {
      this.pool.release(particle)
    }
    this.activeParticles.length = 0
  }
}

/**
 * 粒子系统管理器
 * 统一管理所有粒子发射器
 */
export class ParticleSystem {
  private static instance: ParticleSystem | null = null

  /** 对象池 */
  private pool: ParticlePool

  /** 活跃发射器列表 */
  private emitters: ParticleEmitter[] = []

  /** 全局最大粒子数 */
  private maxTotalParticles: number = 2000

  /** 全局暂停状态 */
  private paused: boolean = false

  /**
   * 私有构造函数
   */
  private constructor(initialPoolSize: number = 200, maxPoolSize: number = 2000) {
    this.pool = new ParticlePool(initialPoolSize, maxPoolSize)
    this.maxTotalParticles = maxPoolSize
  }

  /**
   * 获取粒子系统单例
   */
  public static getInstance(initialPoolSize?: number, maxPoolSize?: number): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem(initialPoolSize, maxPoolSize)
    }
    return ParticleSystem.instance
  }

  /**
   * 创建粒子发射器
   * @param emitterConfig 发射器配置
   * @param particleConfig 粒子配置，或预设粒子类型
   */
  public createEmitter(
    emitterConfig: EmitterConfig,
    particleConfig: ParticleConfig | ParticleType
  ): ParticleEmitter {
    let config: ParticleConfig

    if (typeof particleConfig === 'string') {
      const preset = PARTICLE_PRESETS[particleConfig]
      config = {
        color: '#ffffff',
        count: 10,
        emissionRate: 10,
        minSize: 2,
        maxSize: 5,
        minLifetime: 500,
        maxLifetime: 1000,
        velocity: { min: { x: -50, y: -50 }, max: { x: 50, y: 50 } },
        acceleration: { x: 0, y: 0 },
        gravity: 0,
        loop: false,
        duration: 0,
        alphaOverLifetime: { start: 1, end: 0, easing: 'linear' },
        sizeOverLifetime: { start: 1, end: 1, easing: 'linear' },
        blendMode: 'normal',
        ...preset,
      }
    } else {
      config = { ...particleConfig }
    }

    const emitter = new ParticleEmitter(emitterConfig, config, this.pool)
    this.emitters.push(emitter)
    return emitter
  }

  /**
   * 创建预设类型的粒子发射器
   * @param type 粒子类型
   * @param position 发射器位置
   * @param emitterType 发射器类型
   */
  public createPresetEmitter(
    type: ParticleType,
    position: Vector2,
    emitterType: EmitterType = 'point'
  ): ParticleEmitter {
    const emitterConfig: EmitterConfig = {
      type: emitterType,
      position,
      angle: 0,
      angleRange: Math.PI / 4,
      radius: 50,
      minSpeed: 50,
      maxSpeed: 150,
    }

    return this.createEmitter(emitterConfig, type)
  }

  /**
   * 移除发射器
   */
  public removeEmitter(emitter: ParticleEmitter): void {
    const index = this.emitters.indexOf(emitter)
    if (index !== -1) {
      emitter.stop()
      emitter.clear()
      this.emitters.splice(index, 1)
    }
  }

  /**
   * 更新所有发射器
   * @param deltaTime 帧间隔时间（毫秒）
   */
  public update(deltaTime: number): void {
    if (this.paused) return

    let totalActive = 0
    for (const emitter of this.emitters) {
      totalActive += emitter.getActiveParticleCount()
    }

    if (totalActive < this.maxTotalParticles) {
      for (const emitter of this.emitters) {
        emitter.update(deltaTime)
      }
    } else {
      for (const emitter of this.emitters) {
        emitter.update(deltaTime)
      }
    }
  }

  /**
   * 渲染所有发射器
   * @param ctx 画布渲染上下文
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const emitter of this.emitters) {
      emitter.render(ctx)
    }
  }

  /**
   * 暂停所有粒子效果
   */
  public pause(): void {
    this.paused = true
  }

  /**
   * 恢复所有粒子效果
   */
  public resume(): void {
    this.paused = false
  }

  /**
   * 检查是否暂停
   */
  public isPaused(): boolean {
    return this.paused
  }

  /**
   * 获取总活跃粒子数
   */
  public getTotalActiveParticles(): number {
    return this.emitters.reduce((sum, emitter) => sum + emitter.getActiveParticleCount(), 0)
  }

  /**
   * 获取发射器数量
   */
  public getEmitterCount(): number {
    return this.emitters.length
  }

  /**
   * 设置全局视口用于裁剪
   */
  public setViewport(x: number, y: number, width: number, height: number): void {
    for (const emitter of this.emitters) {
      emitter.setViewport(x, y, width, height)
    }
  }

  /**
   * 设置全局视口裁剪开关
   */
  public setViewportCulling(enabled: boolean): void {
    for (const emitter of this.emitters) {
      emitter.setViewportCulling(enabled)
    }
  }

  /**
   * 清除所有发射器和粒子
   */
  public clear(): void {
    for (const emitter of this.emitters) {
      emitter.stop()
      emitter.clear()
    }
    this.emitters.length = 0
    this.pool.clear()
  }

  /**
   * 播放一次性粒子效果
   * @param type 粒子类型
   * @param position 播放位置
   * @param count 粒子数量
   */
  public playEffect(type: ParticleType, position: Vector2, count: number = 20): void {
    const emitter = this.createPresetEmitter(type, position, 'random')
    emitter.burst(count)

    setTimeout(() => {
      this.removeEmitter(emitter)
    }, 3000)
  }

  /**
   * 获取粒子预设配置
   * @param type 粒子类型
   */
  public getPresetConfig(type: ParticleType): Partial<ParticleConfig> {
    return { ...PARTICLE_PRESETS[type] }
  }

  /**
   * 获取所有预设粒子类型
   */
  public getPresetTypes(): ParticleType[] {
    return Object.keys(PARTICLE_PRESETS) as ParticleType[]
  }

  /**
   * 销毁粒子系统
   */
  public destroy(): void {
    this.clear()
    ParticleSystem.instance = null
  }
}

/**
 * 导出默认实例
 */
export const particleSystem = ParticleSystem.getInstance()
