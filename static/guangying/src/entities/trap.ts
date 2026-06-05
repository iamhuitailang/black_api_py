/**
 * 陷阱类
 * 包含陷阱基类、尖刺陷阱、移动锯片和周期性火焰
 */

import type { Vector2, Rect } from '@/utils/math'
import { rectIntersects, lerp, clamp } from '@/utils/math'
import type { Player } from './player'

/** 陷阱类型 */
export type TrapType = 'spike' | 'saw' | 'fire'

/** 陷阱配置 */
export interface TrapConfig {
  /** 类型 */
  type: TrapType
  /** 位置 */
  position: Vector2
  /** 尺寸 */
  size: { width: number; height: number }
  /** 伤害值 */
  damage: number
  /** 是否激活 */
  active: boolean
}

/** 尖刺陷阱配置 */
export interface SpikeTrapConfig extends TrapConfig {
  type: 'spike'
  /** 尖刺数量 */
  spikeCount: number
  /** 尖刺高度 */
  spikeHeight: number
}

/** 移动锯片配置 */
export interface SawTrapConfig extends TrapConfig {
  type: 'saw'
  /** 移动起始点 */
  startPoint: Vector2
  /** 移动结束点 */
  endPoint: Vector2
  /** 移动速度 */
  speed: number
  /** 锯片半径 */
  radius: number
  /** 旋转速度 */
  rotationSpeed: number
}

/** 周期性火焰配置 */
export interface FireTrapConfig extends TrapConfig {
  type: 'fire'
  /** 激活周期（秒） */
  cycleTime: number
  /** 激活持续时间（秒） */
  activeDuration: number
  /** 延迟开始时间（秒） */
  startDelay: number
  /** 火焰高度 */
  flameHeight: number
}

/**
 * 陷阱基类
 */
export abstract class Trap {
  /** 陷阱类型 */
  public readonly type: TrapType
  /** 位置 */
  public position: Vector2
  /** 尺寸 */
  public size: { width: number; height: number }
  /** 伤害值 */
  public damage: number
  /** 是否激活 */
  public active: boolean
  /** 是否造成伤害 */
  public dangerous: boolean

  /** 动画计时器 */
  protected animationTimer: number

  /**
   * 构造函数
   */
  constructor(config: TrapConfig) {
    this.type = config.type
    this.position = { ...config.position }
    this.size = { ...config.size }
    this.damage = config.damage
    this.active = config.active
    this.dangerous = true
    this.animationTimer = 0
  }

  /**
   * 更新陷阱状态
   */
  public abstract update(deltaTime: number, player?: Player): void

  /**
   * 绘制陷阱
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
   * 检查与玩家的碰撞
   */
  public checkCollision(player: Player): boolean {
    if (!this.active || !this.dangerous) return false

    const playerBounds = player.getBounds()
    const trapBounds = this.getDamageBounds()

    return rectIntersects(playerBounds, trapBounds)
  }

  /**
   * 获取伤害检测区域
   */
  protected abstract getDamageBounds(): Rect

  /**
   * 对玩家造成伤害
   */
  public dealDamage(player: Player): boolean {
    if (!this.active || !this.dangerous) return false
    return player.takeDamage(this.damage)
  }
}

/**
 * 尖刺陷阱类
 */
export class SpikeTrap extends Trap {
  /** 尖刺数量 */
  public spikeCount: number
  /** 尖刺高度 */
  public spikeHeight: number

  /**
   * 构造函数
   */
  constructor(config: SpikeTrapConfig) {
    super({ ...config, type: 'spike' })
    this.spikeCount = config.spikeCount
    this.spikeHeight = config.spikeHeight
  }

  /**
   * 更新尖刺陷阱
   */
  public update(deltaTime: number, player?: Player): void {
    this.animationTimer += deltaTime

    if (player && this.checkCollision(player)) {
      this.dealDamage(player)
    }
  }

  /**
   * 获取伤害检测区域
   */
  protected getDamageBounds(): Rect {
    return {
      x: this.position.x + 2,
      y: this.position.y,
      width: this.size.width - 4,
      height: this.spikeHeight,
    }
  }

  /**
   * 绘制尖刺陷阱
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return

    ctx.save()

    this.drawBase(ctx)
    this.drawSpikes(ctx)

    ctx.restore()
  }

  /**
   * 绘制底座
   */
  private drawBase(ctx: CanvasRenderingContext2D): void {
    const baseGradient = ctx.createLinearGradient(
      this.position.x, this.position.y + this.spikeHeight,
      this.position.x, this.position.y + this.size.height
    )
    baseGradient.addColorStop(0, '#4A4A4A')
    baseGradient.addColorStop(1, '#2A2A2A')

    ctx.fillStyle = baseGradient
    ctx.fillRect(
      this.position.x,
      this.position.y + this.spikeHeight,
      this.size.width,
      this.size.height - this.spikeHeight
    )

    ctx.strokeStyle = '#1A1A1A'
    ctx.lineWidth = 2
    ctx.strokeRect(
      this.position.x,
      this.position.y + this.spikeHeight,
      this.size.width,
      this.size.height - this.spikeHeight
    )
  }

  /**
   * 绘制尖刺
   */
  private drawSpikes(ctx: CanvasRenderingContext2D): void {
    const spikeWidth = this.size.width / this.spikeCount
    const wobble = Math.sin(this.animationTimer * 5) * 0.5

    for (let i = 0; i < this.spikeCount; i++) {
      const x = this.position.x + i * spikeWidth
      const centerX = x + spikeWidth / 2

      const spikeGradient = ctx.createLinearGradient(
        centerX, this.position.y + this.spikeHeight,
        centerX, this.position.y
      )
      spikeGradient.addColorStop(0, '#606060')
      spikeGradient.addColorStop(0.5, '#A0A0A0')
      spikeGradient.addColorStop(1, '#E0E0E0')

      ctx.fillStyle = spikeGradient
      ctx.beginPath()
      ctx.moveTo(x, this.position.y + this.spikeHeight)
      ctx.lineTo(centerX + wobble, this.position.y)
      ctx.lineTo(x + spikeWidth, this.position.y + this.spikeHeight)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = '#404040'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, this.position.y + this.spikeHeight)
      ctx.lineTo(centerX + wobble, this.position.y)
      ctx.lineTo(x + spikeWidth, this.position.y + this.spikeHeight)
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.moveTo(centerX - spikeWidth * 0.2, this.position.y + this.spikeHeight * 0.3)
      ctx.lineTo(centerX + wobble - 1, this.position.y + 2)
      ctx.lineTo(centerX + wobble + 1, this.position.y + 2)
      ctx.lineTo(centerX + spikeWidth * 0.2, this.position.y + this.spikeHeight * 0.3)
      ctx.closePath()
      ctx.fill()
    }
  }
}

/**
 * 移动锯片类
 */
export class SawTrap extends Trap {
  /** 移动起始点 */
  public startPoint: Vector2
  /** 移动结束点 */
  public endPoint: Vector2
  /** 移动速度 */
  public speed: number
  /** 锯片半径 */
  public radius: number
  /** 旋转速度 */
  public rotationSpeed: number

  /** 当前移动进度 0-1 */
  private moveProgress: number
  /** 移动方向 */
  private movingForward: boolean
  /** 当前旋转角度 */
  private rotation: number
  /** 锯片粒子 */
  private particles: SawParticle[]

  /**
   * 构造函数
   */
  constructor(config: SawTrapConfig) {
    super({ ...config, type: 'saw' })
    this.startPoint = { ...config.startPoint }
    this.endPoint = { ...config.endPoint }
    this.speed = config.speed
    this.radius = config.radius
    this.rotationSpeed = config.rotationSpeed

    this.moveProgress = 0
    this.movingForward = true
    this.rotation = 0
    this.particles = []

    this.position = { ...this.startPoint }
  }

  /**
   * 更新移动锯片
   */
  public update(deltaTime: number, player?: Player): void {
    this.animationTimer += deltaTime
    this.rotation += this.rotationSpeed * deltaTime

    if (this.active) {
      this.updateMovement(deltaTime)
      this.updateParticles(deltaTime)
    }

    if (player && this.checkCollision(player)) {
      this.dealDamage(player)
    }
  }

  /**
   * 更新移动
   */
  private updateMovement(deltaTime: number): void {
    const dx = this.endPoint.x - this.startPoint.x
    const dy = this.endPoint.y - this.startPoint.y
    const totalDistance = Math.sqrt(dx * dx + dy * dy)
    const moveAmount = (this.speed * deltaTime) / totalDistance

    if (this.movingForward) {
      this.moveProgress = clamp(this.moveProgress + moveAmount, 0, 1)
      if (this.moveProgress >= 1) {
        this.movingForward = false
      }
    } else {
      this.moveProgress = clamp(this.moveProgress - moveAmount, 0, 1)
      if (this.moveProgress <= 0) {
        this.movingForward = true
      }
    }

    this.position.x = lerp(this.startPoint.x, this.endPoint.x, this.moveProgress)
    this.position.y = lerp(this.startPoint.y, this.endPoint.y, this.moveProgress)
  }

  /**
   * 更新粒子
   */
  private updateParticles(deltaTime: number): void {
    if (Math.random() < 0.2) {
      const angle = Math.random() * Math.PI * 2
      this.particles.push({
        x: this.position.x + Math.cos(angle) * this.radius,
        y: this.position.y + Math.sin(angle) * this.radius,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        size: 2 + Math.random() * 3,
        alpha: 0.8,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
      })
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

    if (this.particles.length > 20) {
      this.particles.splice(0, this.particles.length - 20)
    }
  }

  /**
   * 获取伤害检测区域
   */
  protected getDamageBounds(): Rect {
    return {
      x: this.position.x - this.radius,
      y: this.position.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    }
  }

  /**
   * 绘制移动锯片
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    this.drawTrack(ctx)
    this.drawParticles(ctx)

    if (this.active) {
      this.drawSawBlade(ctx)
    }

    ctx.restore()
  }

  /**
   * 绘制移动轨道
   */
  private drawTrack(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(this.startPoint.x, this.startPoint.y)
    ctx.lineTo(this.endPoint.x, this.endPoint.y)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(60, 60, 60, 0.5)'
    ctx.lineWidth = 4

    ctx.beginPath()
    ctx.moveTo(this.startPoint.x, this.startPoint.y)
    ctx.lineTo(this.endPoint.x, this.endPoint.y)
    ctx.stroke()

    const drawEndpoint = (point: Vector2) => {
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 12)
      gradient.addColorStop(0, '#555')
      gradient.addColorStop(1, '#333')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
      ctx.fill()
    }

    drawEndpoint(this.startPoint)
    drawEndpoint(this.endPoint)
  }

  /**
   * 绘制锯片
   */
  private drawSawBlade(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.rotation)

    const bladeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius)
    bladeGradient.addColorStop(0, '#808080')
    bladeGradient.addColorStop(0.7, '#C0C0C0')
    bladeGradient.addColorStop(1, '#606060')

    ctx.fillStyle = bladeGradient
    ctx.beginPath()
    const teethCount = 12
    for (let i = 0; i < teethCount * 2; i++) {
      const angle = (i * Math.PI) / teethCount
      const r = i % 2 === 0 ? this.radius : this.radius * 0.75
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#404040'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#303030'
    ctx.beginPath()
    ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2)
    ctx.fill()

    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.25)
    innerGradient.addColorStop(0, '#505050')
    innerGradient.addColorStop(1, '#202020')
    ctx.fillStyle = innerGradient
    ctx.beginPath()
    ctx.arc(0, 0, this.radius * 0.25, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FF4444'
    ctx.beginPath()
    ctx.arc(0, 0, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    if (this.active) {
      const glowGradient = ctx.createRadialGradient(
        this.position.x, this.position.y, 0,
        this.position.x, this.position.y, this.radius * 1.5
      )
      glowGradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)')
      glowGradient.addColorStop(1, 'rgba(255, 50, 50, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, this.radius * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制粒子
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(255, 200, 100, ${p.alpha})`)
      gradient.addColorStop(1, 'rgba(255, 100, 50, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(255, 255, 200, ${p.alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/**
 * 周期性火焰类
 */
export class FireTrap extends Trap {
  /** 激活周期（秒） */
  public cycleTime: number
  /** 激活持续时间（秒） */
  public activeDuration: number
  /** 延迟开始时间（秒） */
  public startDelay: number
  /** 火焰高度 */
  public flameHeight: number

  /** 周期计时器 */
  private cycleTimer: number
  /** 是否正在喷发 */
  private isErupting: boolean
  /** 喷发进度 0-1 */
  private eruptProgress: number
  /** 火焰粒子 */
  private particles: FireParticle[]

  /**
   * 构造函数
   */
  constructor(config: FireTrapConfig) {
    super({ ...config, type: 'fire' })
    this.cycleTime = config.cycleTime
    this.activeDuration = config.activeDuration
    this.startDelay = config.startDelay
    this.flameHeight = config.flameHeight

    this.cycleTimer = -this.startDelay
    this.isErupting = false
    this.eruptProgress = 0
    this.particles = []
    this.dangerous = false
  }

  /**
   * 更新周期性火焰
   */
  public update(deltaTime: number, player?: Player): void {
    this.animationTimer += deltaTime
    this.cycleTimer += deltaTime

    if (this.cycleTimer < 0) {
      this.isErupting = false
      this.dangerous = false
      this.eruptProgress = 0
    } else if (this.cycleTimer < this.activeDuration) {
      this.isErupting = true
      this.dangerous = true
      this.eruptProgress = lerp(this.eruptProgress, 1, deltaTime * 5)
    } else if (this.cycleTimer < this.cycleTime) {
      this.isErupting = false
      this.dangerous = false
      this.eruptProgress = lerp(this.eruptProgress, 0, deltaTime * 8)
    } else {
      this.cycleTimer = 0
    }

    if (this.isErupting) {
      this.updateParticles(deltaTime)
    }

    if (player && this.checkCollision(player)) {
      this.dealDamage(player)
    }
  }

  /**
   * 更新火焰粒子
   */
  private updateParticles(deltaTime: number): void {
    const particleCount = Math.floor(this.eruptProgress * 3)
    for (let i = 0; i < particleCount; i++) {
      if (Math.random() < 0.5) {
        const x = this.position.x + this.size.width * (0.2 + Math.random() * 0.6)
        this.particles.push({
          x,
          y: this.position.y,
          vx: (Math.random() - 0.5) * 30,
          vy: -50 - Math.random() * 100,
          size: 5 + Math.random() * 10,
          alpha: 0.8 + Math.random() * 0.2,
          life: 0.5 + Math.random() * 0.5,
          maxLife: 1,
        })
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.vy += 50 * deltaTime
      p.vx *= 0.98
      p.life -= deltaTime
      p.alpha = (p.life / p.maxLife) * this.eruptProgress
      p.size *= 0.99

      if (p.life <= 0 || p.y < this.position.y - this.flameHeight * this.eruptProgress) {
        this.particles.splice(i, 1)
      }
    }

    if (this.particles.length > 50) {
      this.particles.splice(0, this.particles.length - 50)
    }
  }

  /**
   * 获取伤害检测区域
   */
  protected getDamageBounds(): Rect {
    return {
      x: this.position.x,
      y: this.position.y - this.flameHeight * this.eruptProgress,
      width: this.size.width,
      height: this.flameHeight * this.eruptProgress + this.size.height,
    }
  }

  /**
   * 绘制周期性火焰
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()

    this.drawBase(ctx)
    this.drawWarningIndicator(ctx)

    if (this.eruptProgress > 0.01) {
      this.drawFlame(ctx)
      this.drawParticles(ctx)
    }

    ctx.restore()
  }

  /**
   * 绘制底座
   */
  private drawBase(ctx: CanvasRenderingContext2D): void {
    const baseGradient = ctx.createLinearGradient(
      this.position.x, this.position.y,
      this.position.x, this.position.y + this.size.height
    )
    baseGradient.addColorStop(0, '#4A3728')
    baseGradient.addColorStop(1, '#2D1F14')

    ctx.fillStyle = baseGradient
    ctx.fillRect(
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height
    )

    ctx.strokeStyle = '#1A0F08'
    ctx.lineWidth = 2
    ctx.strokeRect(
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height
    )

    const holeWidth = this.size.width * 0.6
    const holeX = this.position.x + (this.size.width - holeWidth) / 2
    const holeGradient = ctx.createLinearGradient(
      holeX, this.position.y,
      holeX, this.position.y + 5
    )
    holeGradient.addColorStop(0, '#000')
    holeGradient.addColorStop(1, '#1A0F08')
    ctx.fillStyle = holeGradient
    ctx.fillRect(holeX, this.position.y, holeWidth, 5)
  }

  /**
   * 绘制警告指示器
   */
  private drawWarningIndicator(ctx: CanvasRenderingContext2D): void {
    const timeToErupt = this.cycleTime - this.cycleTimer
    const isNearEruption = timeToErupt < 1 && timeToErupt > 0 && this.cycleTimer >= 0

    if (isNearEruption || (this.cycleTimer < 0 && this.cycleTimer > -1)) {
      const flashAlpha = Math.sin(this.animationTimer * 10) * 0.3 + 0.5

      ctx.fillStyle = `rgba(255, 100, 0, ${flashAlpha * 0.5})`
      ctx.fillRect(
        this.position.x,
        this.position.y - this.flameHeight * 0.3,
        this.size.width,
        this.flameHeight * 0.3
      )

      ctx.fillStyle = `rgba(255, 200, 0, ${flashAlpha})`
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        '!',
        this.position.x + this.size.width / 2,
        this.position.y - 5
      )
    }
  }

  /**
   * 绘制火焰主体
   */
  private drawFlame(ctx: CanvasRenderingContext2D): void {
    if (this.eruptProgress <= 0.01) return

    const currentHeight = this.flameHeight * this.eruptProgress
    const centerX = this.position.x + this.size.width / 2
    const baseY = this.position.y
    let maxLayerWidth = 0

    for (let layer = 2; layer >= 0; layer--) {
      const layerOffset = layer * 5
      const layerAlpha = 0.3 + layer * 0.2
      const layerWidth = this.size.width * (0.8 - layer * 0.2)
      if (layerWidth > maxLayerWidth) maxLayerWidth = layerWidth

      const gradient = ctx.createLinearGradient(
        centerX, baseY,
        centerX, baseY - currentHeight
      )

      if (layer === 0) {
        gradient.addColorStop(0, `rgba(255, 255, 200, ${layerAlpha})`)
        gradient.addColorStop(0.3, `rgba(255, 255, 100, ${layerAlpha * 0.8})`)
        gradient.addColorStop(0.7, `rgba(255, 200, 0, ${layerAlpha * 0.5})`)
        gradient.addColorStop(1, `rgba(255, 100, 0, 0)`)
      } else if (layer === 1) {
        gradient.addColorStop(0, `rgba(255, 200, 0, ${layerAlpha})`)
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${layerAlpha * 0.8})`)
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`)
      } else {
        gradient.addColorStop(0, `rgba(255, 50, 0, ${layerAlpha})`)
        gradient.addColorStop(0.5, `rgba(200, 0, 0, ${layerAlpha * 0.8})`)
        gradient.addColorStop(1, `rgba(150, 0, 0, 0)`)
      }

      ctx.fillStyle = gradient
      ctx.beginPath()

      const segments = 8
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const x = centerX - layerWidth / 2 + layerWidth * t
        const waveOffset = Math.sin(t * Math.PI * 3 + this.animationTimer * 5 + layer) * (5 + layer * 2)
        const heightMultiplier = Math.sin(t * Math.PI)
        const y = baseY - currentHeight * heightMultiplier * this.eruptProgress + waveOffset + layerOffset

        if (i === 0) {
          ctx.moveTo(x, baseY + 2)
        }
        ctx.quadraticCurveTo(x + layerWidth / segments / 2, y - 5, x, y)
      }

      ctx.lineTo(centerX + layerWidth / 2, baseY + 2)
      ctx.closePath()
      ctx.fill()
    }

    const heatGradient = ctx.createRadialGradient(
      centerX, baseY - currentHeight / 2, 0,
      centerX, baseY - currentHeight / 2, Math.max(maxLayerWidth, currentHeight) * 0.8
    )
    heatGradient.addColorStop(0, 'rgba(255, 150, 50, 0.2)')
    heatGradient.addColorStop(1, 'rgba(255, 100, 0, 0)')
    ctx.fillStyle = heatGradient
    ctx.beginPath()
    ctx.arc(centerX, baseY - currentHeight / 2, Math.max(maxLayerWidth, currentHeight) * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制火焰粒子
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(255, 255, 200, ${p.alpha})`)
      gradient.addColorStop(0.5, `rgba(255, 200, 50, ${p.alpha * 0.7})`)
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 重置火焰周期
   */
  public reset(): void {
    this.cycleTimer = -this.startDelay
    this.isErupting = false
    this.dangerous = false
    this.eruptProgress = 0
    this.particles = []
  }
}

/**
 * 创建陷阱工厂函数
 */
export function createTrap(config: TrapConfig | SpikeTrapConfig | SawTrapConfig | FireTrapConfig): Trap {
  switch (config.type) {
    case 'spike':
      return new SpikeTrap(config as SpikeTrapConfig)
    case 'saw':
      return new SawTrap(config as SawTrapConfig)
    case 'fire':
      return new FireTrap(config as FireTrapConfig)
    default:
      return new SpikeTrap(config as SpikeTrapConfig)
  }
}

/** 锯片粒子接口 */
interface SawParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
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
}
