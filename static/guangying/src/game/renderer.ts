/**
 * Canvas 2D渲染系统
 * 实现分层渲染、相机系统、视差滚动、光影遮罩、后处理效果等高级渲染功能
 */

import type { Vector2, Rect, Level } from '../types/index'
import { clamp, lerp, rectIntersects } from '../utils/math'
import type { Player } from '../entities/player'
import type { Platform, NormalPlatform, MovingPlatform, OneWayPlatform } from '../entities/platform'
import type { Collectible, CollectibleGroup } from '../entities/collectible'
import type { LightZone, ShadowZone } from '../entities/light'
import type { Torch, TorchGroup } from '../entities/torch'
import type { Trap, SpikeTrap, SawTrap, FireTrap } from '../entities/trap'
import type { ParticleSystem } from './particles'

/**
 * 渲染层级
 */
export enum RenderLayer {
  BACKGROUND = 0,
  FAR_SCENE = 1,
  MID_SCENE = 2,
  NEAR_SCENE = 3,
  UI = 4,
}

/**
 * 视差滚动层配置
 */
export interface ParallaxLayer {
  /** 层名 */
  name: string
  /** 视差系数 0-1，0为不移动，1为与相机同步 */
  parallaxFactor: number
  /** 层级 */
  layer: RenderLayer
  /** 颜色（用于纯色层） */
  color?: string
  /** 绘制函数 */
  draw?: (ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, width: number, height: number) => void
}

/**
 * 后处理效果配置
 */
export interface PostProcessConfig {
  /** 是否启用光晕 */
  bloomEnabled: boolean
  /** 光晕强度 0-1 */
  bloomIntensity: number
  /** 光晕阈值 0-1 */
  bloomThreshold: number
  /** 是否启用模糊 */
  blurEnabled: boolean
  /** 模糊半径 */
  blurRadius: number
  /** 色彩调整 */
  colorAdjust: {
    /** 亮度 -1到1 */
    brightness: number
    /** 对比度 -1到1 */
    contrast: number
    /** 饱和度 -1到1 */
    saturation: number
  }
  /**  vignette 暗角效果 */
  vignette: {
    enabled: boolean
    strength: number
    radius: number
  }
}

/**
 * 相机配置
 */
export interface CameraConfig {
  /** 平滑跟随系数 0-1 */
  smoothness: number
  /** 目标偏移 */
  targetOffset: Vector2
  /** 边界限制 */
  bounds: {
    enabled: boolean
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  /** 死区范围（玩家在此范围内相机不移动） */
  deadZone: {
    enabled: boolean
    width: number
    height: number
  }
}

/**
 * 屏幕震动数据
 */
export interface ScreenShake {
  /** 持续时间（秒） */
  duration: number
  /** 强度（像素） */
  intensity: number
  /** 频率 */
  frequency: number
  /** 已过时间 */
  elapsed: number
}

/**
 * 可渲染实体接口
 */
export interface Renderable {
  draw(ctx: CanvasRenderingContext2D): void
  getBounds(): Rect
  active: boolean
}

/**
 * 渲染器配置
 */
export interface RendererConfig {
  /** 画布宽度 */
  width: number
  /** 画布高度 */
  height: number
  /** 是否启用离屏预渲染 */
  useOffscreenCanvas: boolean
  /** 是否启用后处理 */
  usePostProcessing: boolean
  /** 画质等级 */
  quality: 'low' | 'medium' | 'high'
}

/**
 * Canvas 2D渲染系统类
 */
export class Renderer {
  /** 主画布 */
  private canvas: HTMLCanvasElement
  /** 主渲染上下文 */
  private ctx: CanvasRenderingContext2D
  /** 离屏画布（用于预渲染静态背景） */
  private offscreenCanvas: HTMLCanvasElement | null = null
  /** 离屏上下文 */
  private offscreenCtx: CanvasRenderingContext2D | null = null
  /** 光影遮罩画布 */
  private lightMaskCanvas: HTMLCanvasElement
  /** 光影遮罩上下文 */
  private lightMaskCtx: CanvasRenderingContext2D
  /** 后处理画布 */
  private postProcessCanvas: HTMLCanvasElement
  /** 后处理上下文 */
  private postProcessCtx: CanvasRenderingContext2D

  /** 配置 */
  private config: RendererConfig

  /** 相机位置 */
  public camera: Vector2
  /** 相机目标位置 */
  public cameraTarget: Vector2
  /** 相机配置 */
  public cameraConfig: CameraConfig

  /** 视差层列表 */
  private parallaxLayers: ParallaxLayer[] = []

  /** 屏幕震动 */
  private screenShake: ScreenShake | null = null
  /** 当前震动偏移 */
  private shakeOffset: Vector2 = { x: 0, y: 0 }

  /** 后处理配置 */
  public postProcessConfig: PostProcessConfig

  /** 静态背景是否已预渲染 */
  private backgroundPrerendered: boolean = false

  /** 视口矩形（用于裁剪） */
  private viewport: Rect = { x: 0, y: 0, width: 0, height: 0 }

  /** 绘制统计 */
  private stats = {
    drawCalls: 0,
    culledObjects: 0,
    totalObjects: 0,
  }

  /**
   * 构造函数
   * @param canvas 主画布元素
   * @param config 渲染器配置
   */
  constructor(canvas: HTMLCanvasElement, config: Partial<RendererConfig> = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!

    this.config = {
      width: canvas.width,
      height: canvas.height,
      useOffscreenCanvas: true,
      usePostProcessing: true,
      quality: 'high',
      ...config,
    }

    this.lightMaskCanvas = document.createElement('canvas')
    this.lightMaskCanvas.width = this.config.width
    this.lightMaskCanvas.height = this.config.height
    this.lightMaskCtx = this.lightMaskCanvas.getContext('2d')!

    this.postProcessCanvas = document.createElement('canvas')
    this.postProcessCanvas.width = this.config.width
    this.postProcessCanvas.height = this.config.height
    this.postProcessCtx = this.postProcessCanvas.getContext('2d')!

    if (this.config.useOffscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas')
      this.offscreenCanvas.width = this.config.width * 2
      this.offscreenCanvas.height = this.config.height * 2
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
    }

    this.camera = { x: 0, y: 0 }
    this.cameraTarget = { x: 0, y: 0 }

    this.cameraConfig = {
      smoothness: 0.08,
      targetOffset: { x: 0, y: -50 },
      bounds: {
        enabled: true,
        minX: 0,
        maxX: 2000,
        minY: -1000,
        maxY: 1000,
      },
      deadZone: {
        enabled: false,
        width: 100,
        height: 50,
      },
    }

    this.postProcessConfig = {
      bloomEnabled: true,
      bloomIntensity: 0.3,
      bloomThreshold: 0.6,
      blurEnabled: false,
      blurRadius: 2,
      colorAdjust: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
      vignette: {
        enabled: true,
        strength: 0.3,
        radius: 0.8,
      },
    }

    this.initDefaultParallaxLayers()
    this.updateViewport()
  }

  /**
   * 初始化默认视差层
   */
  private initDefaultParallaxLayers(): void {
    this.parallaxLayers = [
      {
        name: 'sky',
        parallaxFactor: 0.1,
        layer: RenderLayer.BACKGROUND,
        color: '#1a0a2e',
        draw: (ctx, cameraX, cameraY, width, height) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, height)
          gradient.addColorStop(0, '#0d0620')
          gradient.addColorStop(0.5, '#1a0a2e')
          gradient.addColorStop(1, '#2d1b4e')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, width, height)

          const starCount = 100
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          for (let i = 0; i < starCount; i++) {
            const x = ((i * 137.5 + cameraX * 0.05) % width + width) % width
            const y = ((i * 89.3 + cameraY * 0.02) % height + height) % height
            const size = (i % 3) + 1
            const alpha = 0.3 + (i % 7) * 0.1
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1
        },
      },
      {
        name: 'mountains',
        parallaxFactor: 0.3,
        layer: RenderLayer.FAR_SCENE,
        draw: (ctx, cameraX, cameraY, width, height) => {
          const baseY = height * 0.6
          ctx.fillStyle = '#1a0f3a'
          this.drawMountains(ctx, cameraX * 0.3, baseY, width, height, 3, 150, '#1a0f3a')
          ctx.fillStyle = '#251545'
          this.drawMountains(ctx, cameraX * 0.5, baseY + 50, width, height, 4, 100, '#251545')
        },
      },
      {
        name: 'trees',
        parallaxFactor: 0.6,
        layer: RenderLayer.MID_SCENE,
        draw: (ctx, cameraX, cameraY, width, height) => {
          const baseY = height * 0.75
          ctx.fillStyle = '#0f0a1f'
          for (let i = 0; i < 20; i++) {
            const x = ((i * 150 - cameraX * 0.6) % (width + 200) + width + 200) % (width + 200) - 100
            const treeHeight = 80 + (i % 5) * 20
            this.drawTree(ctx, x, baseY, treeHeight, '#0f0a1f')
          }
        },
      },
      {
        name: 'fog',
        parallaxFactor: 0.8,
        layer: RenderLayer.NEAR_SCENE,
        draw: (ctx, cameraX, cameraY, width, height) => {
          const time = Date.now() * 0.0003
          ctx.fillStyle = 'rgba(100, 50, 150, 0.05)'
          for (let i = 0; i < 5; i++) {
            const y = height * 0.6 + Math.sin(time + i) * 30
            const fogHeight = 80 + Math.sin(time * 2 + i) * 20
            ctx.fillRect(0, y - fogHeight / 2, width, fogHeight)
          }
        },
      },
    ]
  }

  /**
   * 绘制山脉
   */
  private drawMountains(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    baseY: number,
    width: number,
    height: number,
    peaks: number,
    maxHeight: number,
    color: string
  ): void {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, height)

    const segmentWidth = (width + 400) / peaks
    for (let i = 0; i <= peaks; i++) {
      const x = i * segmentWidth - 200 - (offsetX % segmentWidth)
      const peakHeight = maxHeight * (0.5 + Math.sin(i * 1.5) * 0.5)
      ctx.lineTo(x + segmentWidth * 0.3, baseY - peakHeight * 0.7)
      ctx.lineTo(x + segmentWidth * 0.5, baseY - peakHeight)
      ctx.lineTo(x + segmentWidth * 0.7, baseY - peakHeight * 0.6)
    }

    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
  }

  /**
   * 绘制树木剪影
   */
  private drawTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height: number,
    color: string
  ): void {
    ctx.fillStyle = color

    ctx.fillRect(x - 4, y - height * 0.3, 8, height * 0.3)

    ctx.beginPath()
    ctx.moveTo(x, y - height)
    ctx.lineTo(x - 25, y - height * 0.3)
    ctx.lineTo(x + 25, y - height * 0.3)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x, y - height * 0.85)
    ctx.lineTo(x - 20, y - height * 0.2)
    ctx.lineTo(x + 20, y - height * 0.2)
    ctx.closePath()
    ctx.fill()
  }

  /**
   * 设置关卡配置
   * @param level 关卡数据
   */
  public setLevel(level: any): void {
    this.cameraConfig.bounds.minX = 0
    this.cameraConfig.bounds.maxX = level.width
    this.cameraConfig.bounds.minY = -level.height
    this.cameraConfig.bounds.maxY = 0
    this.backgroundPrerendered = false
  }

  /**
   * 设置相机边界
   * @param minX 最小X
   * @param minY 最小Y
   * @param maxX 最大X
   * @param maxY 最大Y
   */
  public setCameraBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.cameraConfig.bounds.minX = minX
    this.cameraConfig.bounds.minY = minY
    this.cameraConfig.bounds.maxX = maxX
    this.cameraConfig.bounds.maxY = maxY
  }

  /**
   * 预渲染静态背景
   * @param platforms 平台列表
   * @param backgroundColor 背景颜色
   */
  public prerenderBackground(platforms: Platform[], backgroundColor: string = '#150a28'): void {
    if (!this.offscreenCtx || !this.offscreenCanvas) return

    const levelWidth = this.cameraConfig.bounds.maxX
    const levelHeight = this.cameraConfig.bounds.maxY - this.cameraConfig.bounds.minY

    this.offscreenCanvas.width = levelWidth
    this.offscreenCanvas.height = levelHeight

    this.offscreenCtx.clearRect(0, 0, levelWidth, levelHeight)

    this.offscreenCtx.fillStyle = backgroundColor
    this.offscreenCtx.fillRect(0, 0, levelWidth, levelHeight)

    for (const platform of platforms) {
      if (platform.type === 'normal') {
        ;(platform as NormalPlatform).draw(this.offscreenCtx)
      }
    }

    this.backgroundPrerendered = true
  }

  /**
   * 更新相机位置
   * @param target 目标位置（通常是玩家位置）
   * @param deltaTime 时间增量
   */
  public updateCamera(target: Vector2, deltaTime: number): void {
    let targetX = target.x + this.cameraConfig.targetOffset.x
    let targetY = target.y + this.cameraConfig.targetOffset.y

    if (this.cameraConfig.deadZone.enabled) {
      const halfWidth = this.cameraConfig.deadZone.width / 2
      const halfHeight = this.cameraConfig.deadZone.height / 2

      if (target.x < this.camera.x - halfWidth) {
        targetX = target.x + halfWidth
      } else if (target.x > this.camera.x + halfWidth) {
        targetX = target.x - halfWidth
      } else {
        targetX = this.camera.x
      }

      if (target.y < this.camera.y - halfHeight) {
        targetY = target.y + halfHeight
      } else if (target.y > this.camera.y + halfHeight) {
        targetY = target.y - halfHeight
      } else {
        targetY = this.camera.y
      }
    }

    this.cameraTarget.x = targetX
    this.cameraTarget.y = targetY

    const smoothness = 1 - Math.pow(1 - this.cameraConfig.smoothness, deltaTime * 60)
    this.camera.x = lerp(this.camera.x, this.cameraTarget.x, smoothness)
    this.camera.y = lerp(this.camera.y, this.cameraTarget.y, smoothness)

    if (this.cameraConfig.bounds.enabled) {
      const halfWidth = this.config.width / 2
      const halfHeight = this.config.height / 2
      this.camera.x = clamp(
        this.camera.x,
        this.cameraConfig.bounds.minX + halfWidth,
        this.cameraConfig.bounds.maxX - halfWidth
      )
      this.camera.y = clamp(
        this.camera.y,
        this.cameraConfig.bounds.minY + halfHeight,
        this.cameraConfig.bounds.maxY - halfHeight
      )
    }

    this.updateViewport()
  }

  /**
   * 更新视口矩形
   */
  private updateViewport(): void {
    this.viewport = {
      x: this.camera.x - this.config.width / 2,
      y: this.camera.y - this.config.height / 2,
      width: this.config.width,
      height: this.config.height,
    }
  }

  /**
   * 添加屏幕震动效果
   * @param intensity 强度（像素）
   * @param duration 持续时间（秒）
   * @param frequency 频率
   */
  public addScreenShake(intensity: number, duration: number, frequency: number = 30): void {
    this.screenShake = {
      intensity,
      duration,
      frequency,
      elapsed: 0,
    }
  }

  /**
   * 更新屏幕震动
   * @param deltaTime 时间增量
   */
  private updateScreenShake(deltaTime: number): void {
    if (!this.screenShake) {
      this.shakeOffset = { x: 0, y: 0 }
      return
    }

    this.screenShake.elapsed += deltaTime

    if (this.screenShake.elapsed >= this.screenShake.duration) {
      this.screenShake = null
      this.shakeOffset = { x: 0, y: 0 }
      return
    }

    const progress = this.screenShake.elapsed / this.screenShake.duration
    const decay = 1 - progress * progress
    const intensity = this.screenShake.intensity * decay

    const time = this.screenShake.elapsed * this.screenShake.frequency * Math.PI * 2
    this.shakeOffset.x = (Math.sin(time) + Math.sin(time * 1.3)) * intensity * 0.5
    this.shakeOffset.y = (Math.cos(time * 0.7) + Math.cos(time * 1.1)) * intensity * 0.5
  }

  /**
   * 检查实体是否在视口内
   * @param bounds 实体边界
   * @param padding 外扩边距
   */
  public isInViewport(bounds: Rect, padding: number = 50): boolean {
    const expandedBounds = {
      x: this.viewport.x - padding,
      y: this.viewport.y - padding,
      width: this.viewport.width + padding * 2,
      height: this.viewport.height + padding * 2,
    }
    return rectIntersects(bounds, expandedBounds)
  }

  /**
   * 更新视口，供粒子系统使用
   */
  public updateParticleViewport(particleSystem: ParticleSystem): void {
    particleSystem.setViewport(
      this.viewport.x,
      this.viewport.y,
      this.viewport.width,
      this.viewport.height
    )
  }

  /**
   * 主渲染方法
   * @param deltaTime 时间增量
   * @param player 玩家
   * @param platforms 平台列表
   * @param collectibles 收集物组
   * @param lightZones 光区域列表
   * @param shadowZones 影区域列表
   * @param torches 火把组
   * @param traps 陷阱列表
   * @param particleSystem 粒子系统
   * @param renderUI UI渲染回调
   */
  public render(
    deltaTime: number,
    player: Player,
    platforms: Platform[],
    collectibles: CollectibleGroup,
    lightZones: LightZone[],
    shadowZones: ShadowZone[],
    torches: TorchGroup,
    traps: Trap[],
    particleSystem: ParticleSystem,
    renderUI?: (ctx: CanvasRenderingContext2D) => void
  ): void {
    this.stats = { drawCalls: 0, culledObjects: 0, totalObjects: 0 }

    this.updateScreenShake(deltaTime)

    if (this.config.usePostProcessing) {
      this.renderToPostProcess(
        deltaTime,
        player,
        platforms,
        collectibles,
        lightZones,
        shadowZones,
        torches,
        traps,
        particleSystem
      )
      this.applyPostProcessing()
      this.ctx.drawImage(this.postProcessCanvas, 0, 0)
    } else {
      this.renderScene(
        this.ctx,
        deltaTime,
        player,
        platforms,
        collectibles,
        lightZones,
        shadowZones,
        torches,
        traps,
        particleSystem
      )
    }

    if (renderUI) {
      this.ctx.save()
      renderUI(this.ctx)
      this.ctx.restore()
    }
  }

  /**
   * 渲染场景到后处理画布
   */
  private renderToPostProcess(
    deltaTime: number,
    player: Player,
    platforms: Platform[],
    collectibles: CollectibleGroup,
    lightZones: LightZone[],
    shadowZones: ShadowZone[],
    torches: TorchGroup,
    traps: Trap[],
    particleSystem: ParticleSystem
  ): void {
    this.postProcessCtx.clearRect(0, 0, this.config.width, this.config.height)
    this.renderScene(
      this.postProcessCtx,
      deltaTime,
      player,
      platforms,
      collectibles,
      lightZones,
      shadowZones,
      torches,
      traps,
      particleSystem
    )
  }

  /**
   * 渲染主场景
   */
  private renderScene(
    ctx: CanvasRenderingContext2D,
    deltaTime: number,
    player: Player,
    platforms: Platform[],
    collectibles: CollectibleGroup,
    lightZones: LightZone[],
    shadowZones: ShadowZone[],
    torches: TorchGroup,
    traps: Trap[],
    particleSystem: ParticleSystem
  ): void {
    ctx.clearRect(0, 0, this.config.width, this.config.height)

    ctx.save()
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y)

    this.renderParallaxLayers(ctx, RenderLayer.BACKGROUND)

    ctx.save()
    ctx.translate(-this.viewport.x, -this.viewport.y)

    if (this.offscreenCanvas && this.backgroundPrerendered && this.offscreenCtx) {
      ctx.drawImage(
        this.offscreenCanvas,
        this.viewport.x,
        this.viewport.y,
        this.viewport.width,
        this.viewport.height,
        this.viewport.x,
        this.viewport.y,
        this.viewport.width,
        this.viewport.height
      )
    }

    this.renderParallaxLayers(ctx, RenderLayer.FAR_SCENE)
    this.renderParallaxLayers(ctx, RenderLayer.MID_SCENE)

    this.renderPlatforms(ctx, platforms)
    this.renderZones(ctx, lightZones, shadowZones)
    this.renderTraps(ctx, traps)
    this.renderCollectibles(ctx, collectibles)
    this.renderTorches(ctx, torches)
    this.renderPlayer(ctx, player)

    particleSystem.render(ctx)
    this.stats.drawCalls++

    this.renderParallaxLayers(ctx, RenderLayer.NEAR_SCENE)

    ctx.restore()

    this.renderLightMask(ctx, player, torches, lightZones)

    ctx.restore()
  }

  /**
   * 渲染指定层级的视差层
   */
  private renderParallaxLayers(ctx: CanvasRenderingContext2D, layer: RenderLayer): void {
    for (const parallax of this.parallaxLayers) {
      if (parallax.layer !== layer) continue

      ctx.save()

      const cameraX = this.camera.x * parallax.parallaxFactor
      const cameraY = this.camera.y * parallax.parallaxFactor

      if (parallax.draw) {
        parallax.draw(ctx, cameraX, cameraY, this.config.width, this.config.height)
      } else if (parallax.color) {
        ctx.fillStyle = parallax.color
        ctx.fillRect(0, 0, this.config.width, this.config.height)
      }

      ctx.restore()
    }
  }

  /**
   * 渲染平台
   */
  private renderPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[]): void {
    this.stats.totalObjects += platforms.length

    for (const platform of platforms) {
      if (!platform.active) continue

      const bounds = platform.getBounds()
      if (!this.isInViewport(bounds)) {
        this.stats.culledObjects++
        continue
      }

      if (platform.type === 'normal' && this.backgroundPrerendered) {
        continue
      }

      platform.draw(ctx)
      this.stats.drawCalls++
    }
  }

  /**
   * 渲染光影区域
   */
  private renderZones(
    ctx: CanvasRenderingContext2D,
    lightZones: LightZone[],
    shadowZones: ShadowZone[]
  ): void {
    this.stats.totalObjects += lightZones.length + shadowZones.length

    for (const zone of lightZones) {
      if (!zone.active) continue
      zone.draw(ctx)
      this.stats.drawCalls++
    }

    for (const zone of shadowZones) {
      if (!zone.active) continue
      zone.draw(ctx)
      this.stats.drawCalls++
    }
  }

  /**
   * 渲染陷阱
   */
  private renderTraps(ctx: CanvasRenderingContext2D, traps: Trap[]): void {
    this.stats.totalObjects += traps.length

    for (const trap of traps) {
      if (!trap.active) continue

      const bounds = trap.getBounds()
      if (!this.isInViewport(bounds)) {
        this.stats.culledObjects++
        continue
      }

      trap.draw(ctx)
      this.stats.drawCalls++
    }
  }

  /**
   * 渲染收集物
   */
  private renderCollectibles(ctx: CanvasRenderingContext2D, collectibles: CollectibleGroup): void {
    this.stats.totalObjects += collectibles.collectibles.length

    for (const collectible of collectibles.collectibles) {
      if (!collectible.active && collectible.state !== 'collected') continue

      const bounds = collectible.getBounds()
      if (!this.isInViewport(bounds)) {
        this.stats.culledObjects++
        continue
      }

      collectible.draw(ctx)
      this.stats.drawCalls++
    }
  }

  /**
   * 渲染火把
   */
  private renderTorches(ctx: CanvasRenderingContext2D, torches: TorchGroup): void {
    this.stats.totalObjects += torches.torches.length

    for (const torch of torches.torches) {
      if (!torch.active) continue

      const bounds = torch.getBounds()
      if (!this.isInViewport(bounds)) {
        this.stats.culledObjects++
        continue
      }

      torch.draw(ctx)
      this.stats.drawCalls++
    }
  }

  /**
   * 渲染玩家
   */
  private renderPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
    const bounds = player.getBounds()
    if (!this.isInViewport(bounds, 100)) {
      this.stats.culledObjects++
      return
    }

    player.draw(ctx)
    this.stats.drawCalls++
  }

  /**
   * 渲染光影遮罩
   */
  private renderLightMask(
    ctx: CanvasRenderingContext2D,
    player: Player,
    torches: TorchGroup,
    lightZones: LightZone[]
  ): void {
    this.lightMaskCtx.clearRect(0, 0, this.config.width, this.config.height)

    this.lightMaskCtx.fillStyle = 'rgba(5, 2, 15, 0.85)'
    this.lightMaskCtx.fillRect(0, 0, this.config.width, this.config.height)

    this.lightMaskCtx.globalCompositeOperation = 'destination-out'

    const playerScreenX = player.position.x - this.viewport.x
    const playerScreenY = player.position.y - player.size.height / 2 - this.viewport.y

    const playerLightRadius = player.shadowState === 'light' ? 150 : 80
    const gradient = this.lightMaskCtx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      0,
      playerScreenX,
      playerScreenY,
      playerLightRadius
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    this.lightMaskCtx.fillStyle = gradient
    this.lightMaskCtx.beginPath()
    this.lightMaskCtx.arc(playerScreenX, playerScreenY, playerLightRadius, 0, Math.PI * 2)
    this.lightMaskCtx.fill()

    for (const torch of torches.torches) {
      if (torch.state === 'extinguished' || torch.currentLightRadius <= 0) continue

      const torchScreenX = torch.position.x - this.viewport.x
      const torchScreenY = torch.position.y - torch.size.height / 2 - this.viewport.y

      const torchGradient = this.lightMaskCtx.createRadialGradient(
        torchScreenX,
        torchScreenY,
        0,
        torchScreenX,
        torchScreenY,
        torch.currentLightRadius
      )
      torchGradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
      torchGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)')
      torchGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      this.lightMaskCtx.fillStyle = torchGradient
      this.lightMaskCtx.beginPath()
      this.lightMaskCtx.arc(torchScreenX, torchScreenY, torch.currentLightRadius, 0, Math.PI * 2)
      this.lightMaskCtx.fill()
    }

    for (const zone of lightZones) {
      if (!zone.active) continue

      const zoneScreenX = zone.position.x - this.viewport.x
      const zoneScreenY = zone.position.y - this.viewport.y

      let zoneRadius: number
      if (typeof zone.size === 'number') {
        zoneRadius = zone.size
      } else {
        zoneRadius = Math.max(zone.size.width, zone.size.height) / 2
      }

      const zoneGradient = this.lightMaskCtx.createRadialGradient(
        zoneScreenX,
        zoneScreenY,
        0,
        zoneScreenX,
        zoneScreenY,
        zoneRadius
      )
      zoneGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
      zoneGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      this.lightMaskCtx.fillStyle = zoneGradient
      this.lightMaskCtx.beginPath()

      if (zone.shape === 'circle') {
        this.lightMaskCtx.arc(zoneScreenX, zoneScreenY, zoneRadius, 0, Math.PI * 2)
      } else if (zone.shape === 'ellipse') {
        const size = zone.size as { width: number; height: number }
        this.lightMaskCtx.ellipse(
          zoneScreenX,
          zoneScreenY,
          size.width / 2,
          size.height / 2,
          0,
          0,
          Math.PI * 2
        )
      } else {
        const size = zone.size as { width: number; height: number }
        this.lightMaskCtx.fillRect(
          zoneScreenX - size.width / 2,
          zoneScreenY - size.height / 2,
          size.width,
          size.height
        )
      }
      this.lightMaskCtx.fill()
    }

    this.lightMaskCtx.globalCompositeOperation = 'source-over'

    ctx.drawImage(this.lightMaskCanvas, 0, 0)
  }

  /**
   * 应用后处理效果
   */
  private applyPostProcessing(): void {
    const imageData = this.postProcessCtx.getImageData(0, 0, this.config.width, this.config.height)
    const data = imageData.data

    if (this.postProcessConfig.blurEnabled && this.config.quality !== 'low') {
      this.applyBlur(data, this.postProcessConfig.blurRadius)
    }

    const { brightness, contrast, saturation } = this.postProcessConfig.colorAdjust
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      if (brightness !== 0) {
        const brightnessOffset = brightness * 255
        r = clamp(r + brightnessOffset, 0, 255)
        g = clamp(g + brightnessOffset, 0, 255)
        b = clamp(b + brightnessOffset, 0, 255)
      }

      if (contrast !== 0) {
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
        r = clamp(factor * (r - 128) + 128, 0, 255)
        g = clamp(factor * (g - 128) + 128, 0, 255)
        b = clamp(factor * (b - 128) + 128, 0, 255)
      }

      if (saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const sat = 1 + saturation
        r = clamp(gray + sat * (r - gray), 0, 255)
        g = clamp(gray + sat * (g - gray), 0, 255)
        b = clamp(gray + sat * (b - gray), 0, 255)
      }

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    this.postProcessCtx.putImageData(imageData, 0, 0)

    if (this.postProcessConfig.bloomEnabled && this.config.quality === 'high') {
      this.applyBloom()
    }

    if (this.postProcessConfig.vignette.enabled) {
      this.applyVignette()
    }
  }

  /**
   * 应用模糊效果
   */
  private applyBlur(data: Uint8ClampedArray, radius: number): void {
    const width = this.config.width
    const height = this.config.height
    const temp = new Uint8ClampedArray(data.length)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const px = x + dx
            const py = y + dy
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4
              r += data[idx]
              g += data[idx + 1]
              b += data[idx + 2]
              count++
            }
          }
        }

        const idx = (y * width + x) * 4
        temp[idx] = r / count
        temp[idx + 1] = g / count
        temp[idx + 2] = b / count
        temp[idx + 3] = data[idx + 3]
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = temp[i]
    }
  }

  /**
   * 应用光晕效果
   */
  private applyBloom(): void {
    const threshold = this.postProcessConfig.bloomThreshold * 255
    const intensity = this.postProcessConfig.bloomIntensity

    const imageData = this.postProcessCtx.getImageData(0, 0, this.config.width, this.config.height)
    const data = imageData.data

    const brightCanvas = document.createElement('canvas')
    brightCanvas.width = this.config.width
    brightCanvas.height = this.config.height
    const brightCtx = brightCanvas.getContext('2d')!
    const brightData = brightCtx.createImageData(this.config.width, this.config.height)

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (brightness > threshold) {
        const factor = (brightness - threshold) / (255 - threshold)
        brightData.data[i] = data[i] * factor * intensity
        brightData.data[i + 1] = data[i + 1] * factor * intensity
        brightData.data[i + 2] = data[i + 2] * factor * intensity
        brightData.data[i + 3] = 255
      }
    }

    brightCtx.putImageData(brightData, 0, 0)

    const blurCanvas = document.createElement('canvas')
    blurCanvas.width = this.config.width
    blurCanvas.height = this.config.height
    const blurCtx = blurCanvas.getContext('2d')!
    blurCtx.filter = 'blur(10px)'
    blurCtx.drawImage(brightCanvas, 0, 0)

    this.postProcessCtx.globalCompositeOperation = 'lighter'
    this.postProcessCtx.drawImage(blurCanvas, 0, 0)
    this.postProcessCtx.globalCompositeOperation = 'source-over'
  }

  /**
   * 应用暗角效果
   */
  private applyVignette(): void {
    const { strength, radius } = this.postProcessConfig.vignette
    const centerX = this.config.width / 2
    const centerY = this.config.height / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY) * radius

    const gradient = this.postProcessCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxDist
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`)

    this.postProcessCtx.fillStyle = gradient
    this.postProcessCtx.fillRect(0, 0, this.config.width, this.config.height)
  }

  /**
   * 添加自定义视差层
   * @param layer 视差层配置
   */
  public addParallaxLayer(layer: ParallaxLayer): void {
    this.parallaxLayers.push(layer)
    this.parallaxLayers.sort((a, b) => a.layer - b.layer)
  }

  /**
   * 移除视差层
   * @param name 层名
   */
  public removeParallaxLayer(name: string): void {
    this.parallaxLayers = this.parallaxLayers.filter(l => l.name !== name)
  }

  /**
   * 获取渲染统计
   */
  public getStats(): { drawCalls: number; culledObjects: number; totalObjects: number } {
    return { ...this.stats }
  }

  /**
   * 重置相机
   * @param position 初始位置
   */
  public resetCamera(position: Vector2): void {
    this.camera = {
      x: position.x + this.cameraConfig.targetOffset.x,
      y: position.y + this.cameraConfig.targetOffset.y,
    }
    this.cameraTarget = { ...this.camera }
    this.updateViewport()
  }

  /**
   * 调整画布大小
   * @param width 新宽度
   * @param height 新高度
   */
  public resize(width: number, height: number): void {
    this.config.width = width
    this.config.height = height
    this.canvas.width = width
    this.canvas.height = height
    this.lightMaskCanvas.width = width
    this.lightMaskCanvas.height = height
    this.postProcessCanvas.width = width
    this.postProcessCanvas.height = height
    this.updateViewport()
  }

  /**
   * 重置背景预渲染标记
   */
  public invalidateBackground(): void {
    this.backgroundPrerendered = false
  }

  /**
   * 设置画质等级
   * @param quality 画质等级
   */
  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    this.config.quality = quality
    this.postProcessConfig.bloomEnabled = quality === 'high'
    this.postProcessConfig.blurEnabled = quality !== 'low'

    if (quality === 'low') {
      this.config.useOffscreenCanvas = false
      this.config.usePostProcessing = false
    } else {
      this.config.useOffscreenCanvas = true
      this.config.usePostProcessing = true
    }
  }
}
