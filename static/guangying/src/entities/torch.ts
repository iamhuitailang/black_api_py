/**
 * 火把类
 * 用于第三关，具有动态光影范围和火焰粒子效果
 */

import type { Vector2, Rect } from '@/utils/math'
import { lerp, clamp, degToRad } from '@/utils/math'
import type { Player } from './player'

/** 火把状态 */
export type TorchState = 'idle' | 'lit' | 'extinguished' | 'flickering'

/** 火把配置 */
export interface TorchConfig {
  /** 位置 */
  position: Vector2
  /** 尺寸 */
  size: { width: number; height: number }
  /** 基础光照范围 */
  baseLightRadius: number
  /** 最大光照范围 */
  maxLightRadius: number
  /** 火焰强度 */
  flameIntensity: number
  /** 是否可移动 */
  movable: boolean
  /** 是否可旋转 */
  rotatable: boolean
  /** 移动速度 */
  moveSpeed: number
  /** 旋转速度 */
  rotationSpeed: number
  /** 初始旋转角度（度） */
  initialRotation: number
  /** 是否默认点燃 */
  initiallyLit: boolean
}

/**
 * 火把类
 */
export class Torch {
  /** 位置 */
  public position: Vector2
  /** 尺寸 */
  public size: { width: number; height: number }
  /** 基础光照范围 */
  public baseLightRadius: number
  /** 最大光照范围 */
  public maxLightRadius: number
  /** 火焰强度 */
  public flameIntensity: number
  /** 是否可移动 */
  public movable: boolean
  /** 是否可旋转 */
  public rotatable: boolean
  /** 移动速度 */
  public moveSpeed: number
  /** 旋转速度 */
  public rotationSpeed: number
  /** 旋转角度（弧度） */
  public rotation: number
  /** 状态 */
  public state: TorchState
  /** 是否激活 */
  public active: boolean
  /** 当前光照范围 */
  public currentLightRadius: number

  /** 动画计时器 */
  private animationTimer: number
  /** 火焰粒子 */
  private particles: FireParticle[]
  /** 烟雾粒子 */
  private smokeParticles: SmokeParticle[]
  /** 闪烁计时器 */
  private flickerTimer: number
  /** 目标位置（用于移动） */
  private targetPosition: Vector2 | null
  /** 目标旋转角度（用于旋转） */
  private targetRotation: number | null
  /** 火焰高度 */
  private flameHeight: number
  /** 火焰宽度 */
  private flameWidth: number
  /** 上一帧位置 */
  private previousPosition: Vector2
  /** 移动速度向量 */
  private velocity: Vector2

  /**
   * 构造函数
   */
  constructor(config: TorchConfig) {
    this.position = { ...config.position }
    this.size = { ...config.size }
    this.baseLightRadius = config.baseLightRadius
    this.maxLightRadius = config.maxLightRadius
    this.flameIntensity = config.flameIntensity
    this.movable = config.movable
    this.rotatable = config.rotatable
    this.moveSpeed = config.moveSpeed
    this.rotationSpeed = config.rotationSpeed
    this.rotation = degToRad(config.initialRotation)
    this.state = config.initiallyLit ? 'lit' : 'extinguished'
    this.active = true
    this.currentLightRadius = config.initiallyLit ? config.baseLightRadius : 0

    this.animationTimer = 0
    this.particles = []
    this.smokeParticles = []
    this.flickerTimer = 0
    this.targetPosition = null
    this.targetRotation = null
    this.flameHeight = 30
    this.flameWidth = 15
    this.previousPosition = { ...config.position }
    this.velocity = { x: 0, y: 0 }
  }

  /**
   * 更新火把
   */
  public update(deltaTime: number, player?: Player): void {
    this.animationTimer += deltaTime
    this.flickerTimer += deltaTime

    if (!this.active) return

    this.updateMovement(deltaTime)
    this.updateRotation(deltaTime)

    if (this.state !== 'extinguished') {
      this.updateFlame(deltaTime)
      this.updateLightRadius(deltaTime)
      this.updateParticles(deltaTime)
    }

    this.velocity = {
      x: (this.position.x - this.previousPosition.x) / deltaTime,
      y: (this.position.y - this.previousPosition.y) / deltaTime,
    }
    this.previousPosition = { ...this.position }
  }

  /**
   * 更新移动
   */
  private updateMovement(deltaTime: number): void {
    if (!this.movable || !this.targetPosition) return

    const dx = this.targetPosition.x - this.position.x
    const dy = this.targetPosition.y - this.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 2) {
      this.position = { ...this.targetPosition }
      this.targetPosition = null
      return
    }

    const moveDistance = this.moveSpeed * deltaTime
    const t = clamp(moveDistance / distance, 0, 1)

    this.position.x = lerp(this.position.x, this.targetPosition.x, t)
    this.position.y = lerp(this.position.y, this.targetPosition.y, t)
  }

  /**
   * 更新旋转
   */
  private updateRotation(deltaTime: number): void {
    if (!this.rotatable || this.targetRotation === null) return

    const angleDiff = this.targetRotation - this.rotation
    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))

    if (Math.abs(normalizedDiff) < 0.02) {
      this.rotation = this.targetRotation
      this.targetRotation = null
      return
    }

    const rotateAmount = this.rotationSpeed * deltaTime * Math.sign(normalizedDiff)
    this.rotation += clamp(rotateAmount, -Math.abs(normalizedDiff), Math.abs(normalizedDiff))
  }

  /**
   * 更新火焰动画
   */
  private updateFlame(deltaTime: number): void {
    if (this.state === 'flickering') {
      this.flameIntensity = 0.3 + Math.random() * 0.4
      if (this.flickerTimer > 2) {
        this.state = 'lit'
        this.flameIntensity = 1
        this.flickerTimer = 0
      }
    }

    const baseHeight = 25 + this.flameIntensity * 15
    const baseWidth = 12 + this.flameIntensity * 8
    const flicker = Math.sin(this.animationTimer * 15) * 3 + Math.sin(this.animationTimer * 23) * 2

    this.flameHeight = baseHeight + flicker
    this.flameWidth = baseWidth + flicker * 0.5
  }

  /**
   * 更新光照范围
   */
  private updateLightRadius(deltaTime: number): void {
    if (this.state === 'extinguished') {
      this.currentLightRadius = lerp(this.currentLightRadius, 0, deltaTime * 3)
      return
    }

    const flickerAmount = Math.sin(this.animationTimer * 8) * 5 + Math.sin(this.animationTimer * 13) * 3
    const targetRadius = this.baseLightRadius * this.flameIntensity + flickerAmount
    this.currentLightRadius = lerp(this.currentLightRadius, targetRadius, deltaTime * 5)
    this.currentLightRadius = clamp(this.currentLightRadius, 0, this.maxLightRadius)
  }

  /**
   * 更新粒子
   */
  private updateParticles(deltaTime: number): void {
    this.updateFireParticles(deltaTime)
    this.updateSmokeParticles(deltaTime)
  }

  /**
   * 更新火焰粒子
   */
  private updateFireParticles(deltaTime: number): void {
    if (this.state === 'extinguished') {
      this.particles = []
      return
    }

    const particleRate = this.flameIntensity * 0.5
    if (Math.random() < particleRate) {
      this.particles.push(this.createFireParticle())
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.vy += -50 * deltaTime
      p.vx *= 0.98
      p.life -= deltaTime
      p.alpha = p.life / p.maxLife
      p.size *= 0.995

      if (p.life <= 0 || p.y < this.position.y - this.size.height - this.flameHeight * 1.5) {
        this.particles.splice(i, 1)
      }
    }

    if (this.particles.length > 40) {
      this.particles.splice(0, this.particles.length - 40)
    }
  }

  /**
   * 创建火焰粒子
   */
  private createFireParticle(): FireParticle {
    const offsetX = (Math.random() - 0.5) * this.flameWidth * 0.6
    const baseY = this.position.y - this.size.height

    return {
      x: this.position.x + offsetX,
      y: baseY,
      vx: (Math.random() - 0.5) * 20,
      vy: -40 - Math.random() * 60,
      size: 3 + Math.random() * 5,
      alpha: 1,
      life: 0.4 + Math.random() * 0.4,
      maxLife: 0.8,
      colorPhase: Math.random(),
    }
  }

  /**
   * 更新烟雾粒子
   */
  private updateSmokeParticles(deltaTime: number): void {
    if (this.state === 'extinguished') {
      if (Math.random() < 0.1 && this.smokeParticles.length < 10) {
        this.smokeParticles.push(this.createSmokeParticle(true))
      }
    } else if (Math.random() < 0.08) {
      this.smokeParticles.push(this.createSmokeParticle(false))
    }

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.vy -= 10 * deltaTime
      p.vx += Math.sin(this.animationTimer * 3 + i) * 5 * deltaTime
      p.life -= deltaTime
      p.alpha = p.life / p.maxLife * 0.4
      p.size *= 1.01

      if (p.life <= 0) {
        this.smokeParticles.splice(i, 1)
      }
    }

    if (this.smokeParticles.length > 25) {
      this.smokeParticles.splice(0, this.smokeParticles.length - 25)
    }
  }

  /**
   * 创建烟雾粒子
   */
  private createSmokeParticle(isExtinguishing: boolean): SmokeParticle {
    const offsetX = (Math.random() - 0.5) * 10
    const baseY = this.position.y - this.size.height - this.flameHeight * 0.3

    return {
      x: this.position.x + offsetX,
      y: baseY,
      vx: (Math.random() - 0.5) * 15,
      vy: isExtinguishing ? -20 - Math.random() * 30 : -30 - Math.random() * 20,
      size: isExtinguishing ? 6 + Math.random() * 6 : 4 + Math.random() * 4,
      alpha: isExtinguishing ? 0.6 : 0.3,
      life: isExtinguishing ? 1.5 + Math.random() * 1 : 1 + Math.random() * 0.5,
      maxLife: isExtinguishing ? 2.5 : 1.5,
    }
  }

  /**
   * 点燃火把
   */
  public light(): void {
    if (this.state === 'lit') return
    this.state = 'lit'
    this.flameIntensity = 1
    this.flickerTimer = 0
    this.smokeParticles = []
  }

  /**
   * 熄灭火把
   */
  public extinguish(): void {
    if (this.state === 'extinguished') return
    this.state = 'extinguished'
    this.flameIntensity = 0
    this.particles = []
  }

  /**
   * 切换火把状态
   */
  public toggle(): void {
    if (this.state === 'extinguished') {
      this.light()
    } else {
      this.extinguish()
    }
  }

  /**
   * 使火焰闪烁
   */
  public flicker(duration: number = 2): void {
    if (this.state === 'extinguished') return
    this.state = 'flickering'
    this.flickerTimer = 0
    setTimeout(() => {
      if (this.state === 'flickering') {
        this.state = 'lit'
        this.flameIntensity = 1
      }
    }, duration * 1000)
  }

  /**
   * 移动到目标位置
   */
  public moveTo(targetX: number, targetY: number): void {
    if (!this.movable) return
    this.targetPosition = { x: targetX, y: targetY }
  }

  /**
   * 旋转到目标角度
   */
  public rotateTo(angleDegrees: number): void {
    if (!this.rotatable) return
    this.targetRotation = degToRad(angleDegrees)
  }

  /**
   * 获取碰撞盒
   */
  public getBounds(): Rect {
    return {
      x: this.position.x - this.size.width / 2,
      y: this.position.y - this.size.height,
      width: this.size.width,
      height: this.size.height,
    }
  }

  /**
   * 获取光照区域
   */
  public getLightBounds(): Rect {
    return {
      x: this.position.x - this.currentLightRadius,
      y: this.position.y - this.size.height - this.currentLightRadius,
      width: this.currentLightRadius * 2,
      height: this.currentLightRadius * 2,
    }
  }

  /**
   * 检查点是否在光照范围内
   */
  public isPointLit(x: number, y: number): boolean {
    if (this.state === 'extinguished' || this.currentLightRadius <= 0) return false

    const lightCenterY = this.position.y - this.size.height / 2
    const dx = x - this.position.x
    const dy = y - lightCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= this.currentLightRadius
  }

  /**
   * 绘制火把
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    this.drawSmokeParticles(ctx)

    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.rotation)
    ctx.translate(-this.position.x, -this.position.y)

    this.drawTorchBody(ctx)
    this.drawTorchHead(ctx)

    if (this.state !== 'extinguished') {
      this.drawFireParticles(ctx)
      this.drawFlame(ctx)
      this.drawInnerFlame(ctx)
      this.drawLightGlow(ctx)
    }

    ctx.restore()
    ctx.restore()
  }

  /**
   * 绘制火把本体
   */
  private drawTorchBody(ctx: CanvasRenderingContext2D): void {
    const bodyGradient = ctx.createLinearGradient(
      this.position.x - this.size.width / 2, 0,
      this.position.x + this.size.width / 2, 0
    )
    bodyGradient.addColorStop(0, '#5D4037')
    bodyGradient.addColorStop(0.3, '#8D6E63')
    bodyGradient.addColorStop(0.7, '#6D4C41')
    bodyGradient.addColorStop(1, '#4E342E')

    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.roundRect(
      this.position.x - this.size.width / 2,
      this.position.y - this.size.height,
      this.size.width,
      this.size.height * 0.75,
      4
    )
    ctx.fill()

    ctx.strokeStyle = '#3E2723'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(
      this.position.x - this.size.width / 2,
      this.position.y - this.size.height,
      this.size.width,
      this.size.height * 0.75,
      4
    )
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = this.position.y - this.size.height + (this.size.height * 0.75 * i) / 4
      ctx.beginPath()
      ctx.moveTo(this.position.x - this.size.width / 2 + 3, y)
      ctx.lineTo(this.position.x + this.size.width / 2 - 3, y)
      ctx.stroke()
    }
  }

  /**
   * 绘制火把头部
   */
  private drawTorchHead(ctx: CanvasRenderingContext2D): void {
    const headY = this.position.y - this.size.height
    const headHeight = this.size.height * 0.25

    const headGradient = ctx.createLinearGradient(
      this.position.x - this.size.width / 2 - 2, headY,
      this.position.x + this.size.width / 2 + 2, headY
    )
    headGradient.addColorStop(0, '#4E342E')
    headGradient.addColorStop(0.3, '#795548')
    headGradient.addColorStop(0.7, '#6D4C41')
    headGradient.addColorStop(1, '#3E2723')

    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.roundRect(
      this.position.x - this.size.width / 2 - 3,
      headY - headHeight,
      this.size.width + 6,
      headHeight,
      3
    )
    ctx.fill()

    ctx.strokeStyle = '#2D1B16'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(
      this.position.x - this.size.width / 2 - 3,
      headY - headHeight,
      this.size.width + 6,
      headHeight,
      3
    )
    ctx.stroke()

    if (this.state !== 'extinguished') {
      const glowGradient = ctx.createRadialGradient(
        this.position.x, headY - headHeight / 2, 0,
        this.position.x, headY - headHeight / 2, this.size.width
      )
      glowGradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)')
      glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(this.position.x, headY - headHeight / 2, this.size.width, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制火焰
   */
  private drawFlame(ctx: CanvasRenderingContext2D): void {
    const baseY = this.position.y - this.size.height - this.size.height * 0.25
    const segments = 12

    for (let layer = 2; layer >= 0; layer--) {
      const layerOffset = layer * 3
      const layerAlpha = (0.3 + layer * 0.2) * this.flameIntensity
      const layerWidth = this.flameWidth * (0.9 - layer * 0.2)
      const layerHeight = this.flameHeight * (1 - layer * 0.15)

      const gradient = ctx.createLinearGradient(
        this.position.x, baseY,
        this.position.x, baseY - layerHeight
      )

      if (layer === 0) {
        gradient.addColorStop(0, `rgba(255, 100, 0, ${layerAlpha})`)
        gradient.addColorStop(0.5, `rgba(255, 50, 0, ${layerAlpha * 0.8})`)
        gradient.addColorStop(1, `rgba(200, 0, 0, 0)`)
      } else if (layer === 1) {
        gradient.addColorStop(0, `rgba(255, 200, 0, ${layerAlpha})`)
        gradient.addColorStop(0.5, `rgba(255, 150, 0, ${layerAlpha * 0.8})`)
        gradient.addColorStop(1, `rgba(255, 100, 0, 0)`)
      } else {
        gradient.addColorStop(0, `rgba(255, 255, 200, ${layerAlpha})`)
        gradient.addColorStop(0.5, `rgba(255, 255, 100, ${layerAlpha * 0.8})`)
        gradient.addColorStop(1, `rgba(255, 200, 0, 0)`)
      }

      ctx.fillStyle = gradient
      ctx.beginPath()

      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const x = this.position.x - layerWidth / 2 + layerWidth * t
        const waveOffset = Math.sin(t * Math.PI * 3 + this.animationTimer * 6 + layer) * (4 + layer * 2)
        const heightMultiplier = Math.sin(t * Math.PI)
        const y = baseY - layerHeight * heightMultiplier + waveOffset + layerOffset

        if (i === 0) {
          ctx.moveTo(x, baseY + 2)
        }
        ctx.quadraticCurveTo(x + layerWidth / segments / 2, y - 5, x, y)
      }

      ctx.lineTo(this.position.x + layerWidth / 2, baseY + 2)
      ctx.closePath()
      ctx.fill()
    }
  }

  /**
   * 绘制内焰
   */
  private drawInnerFlame(ctx: CanvasRenderingContext2D): void {
    const baseY = this.position.y - this.size.height - this.size.height * 0.25
    const innerHeight = this.flameHeight * 0.5
    const innerWidth = this.flameWidth * 0.4

    const gradient = ctx.createRadialGradient(
      this.position.x, baseY - innerHeight * 0.3, 0,
      this.position.x, baseY - innerHeight * 0.3, innerWidth
    )
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * this.flameIntensity})`)
    gradient.addColorStop(0.5, `rgba(255, 255, 200, ${0.5 * this.flameIntensity})`)
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(
      this.position.x,
      baseY - innerHeight * 0.3,
      innerWidth,
      innerHeight,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  /**
   * 绘制光晕
   */
  private drawLightGlow(ctx: CanvasRenderingContext2D): void {
    if (this.currentLightRadius <= 0) return

    const centerY = this.position.y - this.size.height / 2

    const glowGradient = ctx.createRadialGradient(
      this.position.x, centerY, 0,
      this.position.x, centerY, this.currentLightRadius
    )
    glowGradient.addColorStop(0, `rgba(255, 200, 100, ${0.15 * this.flameIntensity})`)
    glowGradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.08 * this.flameIntensity})`)
    glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)')

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(this.position.x, centerY, this.currentLightRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制火焰粒子
   */
  private drawFireParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      let r: number, g: number, b: number
      if (p.colorPhase < 0.3) {
        r = 255
        g = 255
        b = 200
      } else if (p.colorPhase < 0.6) {
        r = 255
        g = 200
        b = 50
      } else {
        r = 255
        g = 100
        b = 0
      }

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha})`)
      gradient.addColorStop(1, `rgba(${r}, ${g * 0.5}, 0, 0)`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制烟雾粒子
   */
  private drawSmokeParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.smokeParticles) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(100, 100, 100, ${p.alpha})`)
      gradient.addColorStop(1, 'rgba(50, 50, 50, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(80, 80, 80, ${p.alpha * 0.5})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 重置火把
   */
  public reset(): void {
    this.rotation = degToRad(0)
    this.state = 'lit'
    this.flameIntensity = 1
    this.currentLightRadius = this.baseLightRadius
    this.animationTimer = 0
    this.particles = []
    this.smokeParticles = []
    this.targetPosition = null
    this.targetRotation = null
  }
}

/**
 * 火把组类
 * 用于管理多个火把
 */
export class TorchGroup {
  /** 火把列表 */
  public torches: Torch[]

  /**
   * 构造函数
   */
  constructor() {
    this.torches = []
  }

  /**
   * 添加火把
   */
  public add(torch: Torch): void {
    this.torches.push(torch)
  }

  /**
   * 更新所有火把
   */
  public update(deltaTime: number, player?: Player): void {
    for (const torch of this.torches) {
      torch.update(deltaTime, player)
    }
  }

  /**
   * 绘制所有火把
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    for (const torch of this.torches) {
      torch.draw(ctx)
    }
  }

  /**
   * 点燃所有火把
   */
  public lightAll(): void {
    for (const torch of this.torches) {
      torch.light()
    }
  }

  /**
   * 熄灭所有火把
   */
  public extinguishAll(): void {
    for (const torch of this.torches) {
      torch.extinguish()
    }
  }

  /**
   * 检查点是否被任何火把照亮
   */
  public isPointLit(x: number, y: number): boolean {
    for (const torch of this.torches) {
      if (torch.isPointLit(x, y)) {
        return true
      }
    }
    return false
  }

  /**
   * 获取总光照范围（用于阴影遮罩）
   */
  public getCombinedLightMask(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.globalCompositeOperation = 'lighter'

    for (const torch of this.torches) {
      if (torch.state === 'extinguished' || torch.currentLightRadius <= 0) continue

      const centerY = torch.position.y - torch.size.height / 2
      const gradient = ctx.createRadialGradient(
        torch.position.x, centerY, 0,
        torch.position.x, centerY, torch.currentLightRadius
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(torch.position.x, centerY, torch.currentLightRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'source-over'
  }

  /**
   * 重置所有火把
   */
  public reset(): void {
    for (const torch of this.torches) {
      torch.reset()
    }
  }
}

/** 火焰粒子接口 */
interface FireParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  colorPhase: number
}

/** 烟雾粒子接口 */
interface SmokeParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}
