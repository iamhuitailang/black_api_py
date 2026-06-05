/**
 * 玩家角色类 - 可爱小狐狸
 * 包含完整的物理系统、状态管理、动画控制和特殊能力
 */

import type { Vector2, Rect } from '@/utils/math'
import { clamp } from '@/utils/math'

/** 玩家朝向 */
export type PlayerDirection = 'left' | 'right'

/** 玩家光影状态 */
export type PlayerShadowState = 'light' | 'shadow'

/** 玩家动画状态 */
export type PlayerAnimationState = 'idle' | 'run' | 'jump' | 'fall' | 'land'

/** 玩家配置参数 */
export interface PlayerConfig {
  /** 最大水平速度 */
  maxSpeed: number
  /** 水平加速度 */
  acceleration: number
  /** 水平减速度（摩擦力） */
  deceleration: number
  /** 空中减速度 */
  airDeceleration: number
  /** 跳跃初速度 */
  jumpForce: number
  /** 二段跳初速度 */
  doubleJumpForce: number
  /** 重力加速度 */
  gravity: number
  /** 最大下落速度 */
  maxFallSpeed: number
  /** 跳跃缓冲时间（秒） */
  jumpBufferTime: number
  /** 土狼时间（秒）- 离开平台后仍可跳跃的时间 */
  coyoteTime: number
  /** 无敌时间（秒） */
  invincibleTime: number
  /** 光区速度加成系数 */
  lightSpeedMultiplier: number
  /** 光区跳跃加成系数 */
  lightJumpMultiplier: number
  /** 碰撞盒宽度 */
  width: number
  /** 碰撞盒高度 */
  height: number
}

/** 玩家输入状态 */
export interface PlayerInput {
  /** 水平移动输入 -1 到 1 */
  horizontal: number
  /** 是否按下跳跃键 */
  jumpPressed: boolean
  /** 是否按住跳跃键（用于可变跳跃高度） */
  jumpHeld: boolean
  /** 是否切换光影状态 */
  shadowToggle: boolean
}

/**
 * 玩家角色类
 */
export class Player {
  /** 位置向量 */
  public position: Vector2
  /** 速度向量 */
  public velocity: Vector2
  /** 碰撞盒尺寸 */
  public size: { width: number; height: number }
  /** 朝向 */
  public direction: PlayerDirection
  /** 光影状态 */
  public shadowState: PlayerShadowState
  /** 动画状态 */
  public animationState: PlayerAnimationState
  /** 生命值 */
  public health: number
  /** 最大生命值 */
  public maxHealth: number
  /** 是否在地面上 */
  public isGrounded: boolean
  /** 是否无敌 */
  public isInvincible: boolean
  /** 是否可以二段跳 */
  public canDoubleJump: boolean
  /** 是否正在穿墙（影区能力） */
  public isPhasing: boolean
  /** 是否在光区内 */
  public isInLightZone: boolean
  /** 是否在影区内 */
  public isInShadowZone: boolean

  /** 配置参数 */
  private config: PlayerConfig
  /** 输入状态 */
  private input: PlayerInput
  /** 无敌剩余时间 */
  private invincibleTimer: number
  /** 跳跃缓冲剩余时间 */
  private jumpBufferTimer: number
  /** 土狼时间剩余 */
  private coyoteTimer: number
  /** 动画计时器 */
  private animationTimer: number
  /** 动画帧索引 */
  private animationFrame: number
  /** 落地动画计时器 */
  private landTimer: number
  /** 上一帧是否在地面（用于检测落地） */
  private wasGrounded: boolean
  /** 受伤闪烁计时器 */
  private hurtFlashTimer: number

  /**
   * 构造函数
   * @param x 初始x坐标
   * @param y 初始y坐标
   * @param maxHealth 最大生命值
   */
  constructor(x: number, y: number, maxHealth: number = 3) {
    this.position = { x, y }
    this.velocity = { x: 0, y: 0 }
    this.size = { width: 40, height: 50 }
    this.direction = 'right'
    this.shadowState = 'light'
    this.animationState = 'idle'
    this.health = maxHealth
    this.maxHealth = maxHealth
    this.isGrounded = false
    this.isInvincible = false
    this.canDoubleJump = true
    this.isPhasing = false
    this.isInLightZone = false
    this.isInShadowZone = false

    this.config = {
      maxSpeed: 300,
      acceleration: 1200,
      deceleration: 800,
      airDeceleration: 300,
      jumpForce: 550,
      doubleJumpForce: 480,
      gravity: 1800,
      maxFallSpeed: 900,
      jumpBufferTime: 0.15,
      coyoteTime: 0.1,
      invincibleTime: 1.5,
      lightSpeedMultiplier: 1.3,
      lightJumpMultiplier: 1.2,
      width: 40,
      height: 50,
    }

    this.input = {
      horizontal: 0,
      jumpPressed: false,
      jumpHeld: false,
      shadowToggle: false,
    }

    this.invincibleTimer = 0
    this.jumpBufferTimer = 0
    this.coyoteTimer = 0
    this.animationTimer = 0
    this.animationFrame = 0
    this.landTimer = 0
    this.wasGrounded = false
    this.hurtFlashTimer = 0
  }

  /**
   * 更新玩家状态
   * @param deltaTime 时间增量（秒）
   */
  public update(deltaTime: number): void {
    this.updateTimers(deltaTime)
    this.updateMovement(deltaTime)
    this.updateJump(deltaTime)
    this.updateGravity(deltaTime)
    this.updateAnimationState(deltaTime)
    this.updateShadowAbility()

    this.wasGrounded = this.isGrounded
  }

  /**
   * 更新各种计时器
   */
  private updateTimers(deltaTime: number): void {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= deltaTime
      this.isInvincible = this.invincibleTimer > 0
      this.hurtFlashTimer += deltaTime
    } else {
      this.hurtFlashTimer = 0
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime
    }

    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= deltaTime
    }

    if (this.landTimer > 0) {
      this.landTimer -= deltaTime
    }

    this.animationTimer += deltaTime
  }

  /**
   * 更新水平移动
   */
  private updateMovement(deltaTime: number): void {
    let targetSpeed = this.input.horizontal * this.getCurrentMaxSpeed()

    let currentAcceleration: number
    if (this.input.horizontal !== 0) {
      currentAcceleration = this.config.acceleration
      if (this.input.horizontal > 0) {
        this.direction = 'right'
      } else {
        this.direction = 'left'
      }
    } else {
      currentAcceleration = this.isGrounded ? this.config.deceleration : this.config.airDeceleration
      targetSpeed = 0
    }

    this.velocity.x += currentAcceleration * (targetSpeed - this.velocity.x) * deltaTime
    this.velocity.x = clamp(this.velocity.x, -this.getCurrentMaxSpeed(), this.getCurrentMaxSpeed())
  }

  /**
   * 获取当前最大速度（考虑光区加成）
   */
  private getCurrentMaxSpeed(): number {
    const baseSpeed = this.config.maxSpeed
    return this.isInLightZone ? baseSpeed * this.config.lightSpeedMultiplier : baseSpeed
  }

  /**
   * 获取当前跳跃力（考虑光区加成）
   */
  private getCurrentJumpForce(): number {
    const baseForce = this.config.jumpForce
    return this.isInLightZone ? baseForce * this.config.lightJumpMultiplier : baseForce
  }

  /**
   * 更新跳跃逻辑
   */
  private updateJump(deltaTime: number): void {
    if (this.input.jumpPressed) {
      this.jumpBufferTimer = this.config.jumpBufferTime
      this.input.jumpPressed = false
    }

    const canJump = this.isGrounded || this.coyoteTimer > 0
    const canUseBuffer = this.jumpBufferTimer > 0

    if (canJump && canUseBuffer) {
      this.velocity.y = -this.getCurrentJumpForce()
      this.isGrounded = false
      this.canDoubleJump = true
      this.jumpBufferTimer = 0
      this.coyoteTimer = 0
    } else if (!canJump && canUseBuffer && this.canDoubleJump) {
      this.velocity.y = -this.config.doubleJumpForce
      this.canDoubleJump = false
      this.jumpBufferTimer = 0
    }

    if (!this.input.jumpHeld && this.velocity.y < 0) {
      this.velocity.y += this.config.gravity * 0.5 * deltaTime
    }
  }

  /**
   * 更新重力
   */
  private updateGravity(deltaTime: number): void {
    this.velocity.y += this.config.gravity * deltaTime
    this.velocity.y = Math.min(this.velocity.y, this.config.maxFallSpeed)
  }

  /**
   * 更新动画状态
   */
  private updateAnimationState(deltaTime: number): void {
    if (this.landTimer > 0) {
      this.animationState = 'land'
      return
    }

    if (!this.isGrounded) {
      if (this.velocity.y < 0) {
        this.animationState = 'jump'
      } else {
        this.animationState = 'fall'
      }
    } else if (Math.abs(this.velocity.x) > 10) {
      this.animationState = 'run'
      this.animationFrame = Math.floor(this.animationTimer * 10) % 6
    } else {
      this.animationState = 'idle'
      this.animationFrame = Math.floor(this.animationTimer * 3) % 4
    }

    if (this.isGrounded && !this.wasGrounded && this.velocity.y >= 0) {
      this.landTimer = 0.2
      this.animationState = 'land'
    }
  }

  /**
   * 更新光影能力状态
   */
  private updateShadowAbility(): void {
    if (this.input.shadowToggle) {
      this.shadowState = this.shadowState === 'light' ? 'shadow' : 'light'
      this.input.shadowToggle = false
    }

    this.isPhasing = this.shadowState === 'shadow' && this.isInShadowZone
  }

  /**
   * 设置输入状态
   */
  public setInput(input: Partial<PlayerInput>): void {
    Object.assign(this.input, input)
  }

  /**
   * 当落地时调用
   */
  public onLand(): void {
    this.isGrounded = true
    this.canDoubleJump = true
    this.coyoteTimer = this.config.coyoteTime
  }

  /**
   * 当离开地面时调用
   */
  public onLeaveGround(): void {
    this.isGrounded = false
    this.coyoteTimer = this.config.coyoteTime
  }

  /**
   * 受伤
   * @param damage 伤害值
   * @returns 是否真正受伤（无敌时返回false）
   */
  public takeDamage(damage: number = 1): boolean {
    if (this.isInvincible) return false

    this.health = Math.max(0, this.health - damage)
    this.isInvincible = true
    this.invincibleTimer = this.config.invincibleTime
    this.hurtFlashTimer = 0

    return true
  }

  /**
   * 恢复生命值
   * @param amount 恢复量
   */
  public heal(amount: number = 1): void {
    this.health = Math.min(this.maxHealth, this.health + amount)
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
   * 绘制玩家 - 可爱小狐狸
   * @param ctx Canvas 2D上下文
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.position.x, this.position.y - this.size.height / 2)

    if (this.direction === 'left') {
      ctx.scale(-1, 1)
    }

    if (this.isInvincible && Math.floor(this.hurtFlashTimer * 15) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    const bounceOffset = this.getAnimationBounce()
    ctx.translate(0, bounceOffset)

    this.drawFoxShadow(ctx)
    this.drawFoxBody(ctx)
    this.drawFoxHead(ctx)
    this.drawFoxEars(ctx)
    this.drawFoxFace(ctx)
    this.drawFoxTail(ctx)
    this.drawFoxLegs(ctx)

    if (this.shadowState === 'shadow') {
      this.drawShadowAura(ctx)
    } else {
      this.drawLightAura(ctx)
    }

    ctx.restore()
  }

  /**
   * 获取动画弹跳偏移
   */
  private getAnimationBounce(): number {
    switch (this.animationState) {
      case 'idle':
        return Math.sin(this.animationTimer * 3) * 2
      case 'run':
        return Math.abs(Math.sin(this.animationTimer * 15)) * 4
      case 'jump':
        return -2
      case 'fall':
        return 2
      case 'land':
        return this.landTimer > 0 ? (0.2 - this.landTimer) * 20 : 0
      default:
        return 0
    }
  }

  /**
   * 绘制阴影
   */
  private drawFoxShadow(ctx: CanvasRenderingContext2D): void {
    const shadowY = this.size.height / 2 - 2
    const shadowScale = this.isGrounded ? 1 : 0.5
    ctx.save()
    ctx.translate(0, shadowY)
    ctx.scale(shadowScale, shadowScale * 0.3)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  /**
   * 绘制狐狸身体
   */
  private drawFoxBody(ctx: CanvasRenderingContext2D): void {
    const bodyGradient = ctx.createRadialGradient(-5, -5, 0, 0, 5, 30)
    bodyGradient.addColorStop(0, '#FF8C42')
    bodyGradient.addColorStop(0.7, '#FF6B35')
    bodyGradient.addColorStop(1, '#E55A2B')

    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.ellipse(0, 5, 18, 15, 0, 0, Math.PI * 2)
    ctx.fill()

    const bellyGradient = ctx.createRadialGradient(0, 10, 0, 0, 10, 15)
    bellyGradient.addColorStop(0, '#FFE4C4')
    bellyGradient.addColorStop(1, '#FFDAB9')
    ctx.fillStyle = bellyGradient
    ctx.beginPath()
    ctx.ellipse(0, 12, 10, 8, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制狐狸头部
   */
  private drawFoxHead(ctx: CanvasRenderingContext2D): void {
    const headGradient = ctx.createRadialGradient(-3, -18, 0, 0, -15, 20)
    headGradient.addColorStop(0, '#FF9F5C')
    headGradient.addColorStop(0.7, '#FF8C42')
    headGradient.addColorStop(1, '#FF6B35')

    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.ellipse(2, -12, 16, 14, 0.1, 0, Math.PI * 2)
    ctx.fill()

    const faceGradient = ctx.createRadialGradient(5, -10, 0, 5, -10, 10)
    faceGradient.addColorStop(0, '#FFE4C4')
    faceGradient.addColorStop(1, '#FFDAB9')
    ctx.fillStyle = faceGradient
    ctx.beginPath()
    ctx.ellipse(5, -8, 8, 7, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制狐狸耳朵
   */
  private drawFoxEars(ctx: CanvasRenderingContext2D): void {
    const earWiggle = Math.sin(this.animationTimer * 5) * 0.05

    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.moveTo(-8, -22)
    ctx.quadraticCurveTo(-14 + earWiggle * 10, -35, -5, -25)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.moveTo(6, -24)
    ctx.quadraticCurveTo(12 - earWiggle * 10, -37, 12, -26)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.moveTo(-7, -23)
    ctx.quadraticCurveTo(-11 + earWiggle * 8, -32, -5, -25)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.moveTo(7, -25)
    ctx.quadraticCurveTo(10 - earWiggle * 8, -33, 11, -26)
    ctx.closePath()
    ctx.fill()
  }

  /**
   * 绘制狐狸脸部
   */
  private drawFoxFace(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2D2D2D'
    ctx.beginPath()
    ctx.ellipse(8, -12, 2.5, 3, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(9, -13, 1, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#2D2D2D'
    ctx.beginPath()
    ctx.ellipse(13, -8, 2.5, 2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#2D2D2D'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(11, -6)
    ctx.quadraticCurveTo(13, -4, 15, -5)
    ctx.stroke()

    if (this.animationState === 'idle') {
      const blushAlpha = 0.3 + Math.sin(this.animationTimer * 2) * 0.2
      ctx.fillStyle = `rgba(255, 150, 150, ${blushAlpha})`
      ctx.beginPath()
      ctx.ellipse(2, -6, 4, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * 绘制狐狸尾巴
   */
  private drawFoxTail(ctx: CanvasRenderingContext2D): void {
    const tailWag = Math.sin(this.animationTimer * 8) * 0.3
    const tailBaseX = -15
    const tailBaseY = 0

    ctx.save()
    ctx.translate(tailBaseX, tailBaseY)
    ctx.rotate(tailWag - 0.3)

    const tailGradient = ctx.createLinearGradient(0, 0, -25, -10)
    tailGradient.addColorStop(0, '#FF8C42')
    tailGradient.addColorStop(0.6, '#FF6B35')
    tailGradient.addColorStop(1, '#FFFFFF')

    ctx.fillStyle = tailGradient
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-15, -5, -25, -15)
    ctx.quadraticCurveTo(-15, -20, -10, -10)
    ctx.quadraticCurveTo(-5, -5, 0, 5)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(-22, -15, 6, 5, -0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * 绘制狐狸腿
   */
  private drawFoxLegs(ctx: CanvasRenderingContext2D): void {
    const legOffset = this.animationState === 'run' ? Math.sin(this.animationTimer * 15) * 5 : 0

    ctx.fillStyle = '#E55A2B'
    ctx.beginPath()
    ctx.ellipse(-8, 18 - legOffset, 4, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(8, 18 + legOffset, 4, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFDAB9'
    ctx.beginPath()
    ctx.ellipse(-8, 21 - legOffset, 3.5, 2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(8, 21 + legOffset, 3.5, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制光晕效果 - 光状态
   */
  private drawLightAura(ctx: CanvasRenderingContext2D): void {
    const glowSize = 30 + Math.sin(this.animationTimer * 3) * 5
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize)
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
    gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.1)')
    gradient.addColorStop(1, 'rgba(255, 180, 0, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * 绘制影晕效果 - 影状态
   */
  private drawShadowAura(ctx: CanvasRenderingContext2D): void {
    const glowSize = 30 + Math.sin(this.animationTimer * 3) * 5
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize)
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)')
    gradient.addColorStop(0.5, 'rgba(128, 0, 128, 0.1)')
    gradient.addColorStop(1, 'rgba(75, 0, 130, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2)
    ctx.fill()
  }
}
