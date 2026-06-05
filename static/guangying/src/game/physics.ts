/**
 * 2D游戏物理系统
 * 包含重力、AABB碰撞检测、平台碰撞、角色控制器等功能
 */

import type {
  Vector2,
  Rect,
  Platform,
  MovingPlatform,
  Trap,
  Collectible,
  LightZone,
  ShadowZone,
  PlayerState,
  PlayerConfig,
  CollisionResult,
  CollisionObjectType
} from '../types/index'

import {
  clamp,
  rectIntersects,
  getCollisionInfo,
  vectorAdd,
  vectorSub,
  vectorMul,
  vectorNormalize,
  vectorLength
} from '../utils/math'

/**
 * 空间网格单元格
 */
interface GridCell {
  /** 单元格内的平台列表 */
  platforms: Platform[]
  /** 单元格内的陷阱列表 */
  traps: Trap[]
  /** 单元格内的收集物列表 */
  collectibles: Collectible[]
}

/**
 * 碰撞检测配置
 */
export interface PhysicsConfig {
  /** 重力加速度 */
  gravity: number
  /** 最大下落速度 */
  maxFallSpeed: number
  /** 墙壁滑动速度 */
  wallSlideSpeed: number
  /** 墙壁跳跃力度 */
  wallJumpForce: Vector2
  /** 空中控制系数 */
  airControl: number
  /** 地面摩擦力 */
  groundFriction: number
  /** 空中阻力 */
  airResistance: number
  /** 跳跃缓冲时间（毫秒） */
  jumpBufferTime: number
  /** 土狼时间（毫秒） */
  coyoteTime: number
  /** 皮肤厚度（用于碰撞容差） */
  skinThickness: number
}

/**
 * 角色控制器输入
 */
export interface ControllerInput {
  /** 水平移动输入 -1到1 */
  horizontal: number
  /** 是否按下跳跃键 */
  jumpPressed: boolean
  /** 是否按住跳跃键 */
  jumpHeld: boolean
}

/**
 * 物理碰撞事件
 */
export interface PhysicsEvents {
  /** 落地时触发 */
  onLand?: () => void
  /** 跳跃时触发 */
  onJump?: () => void
  /** 受伤时触发 */
  onHurt?: (damage: number) => void
  /** 收集物品时触发 */
  onCollect?: (collectible: Collectible) => void
  /** 进入光明区域时触发 */
  onEnterLight?: (zone: LightZone) => void
  /** 进入阴影区域时触发 */
  onEnterShadow?: (zone: ShadowZone) => void
  /** 到达终点时触发 */
  onReachExit?: () => void
  /** 墙壁滑动时触发 */
  onWallSlide?: (direction: -1 | 1) => void
}

/**
 * 物理系统类
 */
export class PhysicsSystem {
  /** 物理配置 */
  private config: PhysicsConfig

  /** 空间划分网格 */
  private grid: Map<string, GridCell> = new Map()

  /** 网格单元格大小 */
  private gridCellSize: number = 128

  /** 关卡宽度 */
  private levelWidth: number = 0

  /** 关卡高度 */
  private levelHeight: number = 0

  /** 跳跃缓冲计时器 */
  private jumpBufferTimer: number = 0

  /** 土狼时间计时器 */
  private coyoteTimer: number = 0

  /** 上一帧是否在地面 */
  private wasGroundedLastFrame: boolean = false

  /** 当前墙壁接触方向 0无 -1左 1右 */
  private wallContactDirection: -1 | 0 | 1 = 0

  /** 墙壁跳跃冷却 */
  private wallJumpCooldown: number = 0

  /**
   * 构造函数
   * @param config 物理配置
   */
  constructor(config?: Partial<PhysicsConfig>) {
    this.config = {
      gravity: 1800,
      maxFallSpeed: 1200,
      wallSlideSpeed: 200,
      wallJumpForce: { x: 400, y: 500 },
      airControl: 0.6,
      groundFriction: 0.85,
      airResistance: 0.98,
      jumpBufferTime: 150,
      coyoteTime: 100,
      skinThickness: 2,
      ...config
    }
  }

  /**
   * 设置关卡尺寸并初始化空间网格
   * @param width 关卡宽度
   * @param height 关卡高度
   */
  public setLevelSize(width: number, height: number): void {
    this.levelWidth = width
    this.levelHeight = height
    this.grid.clear()
  }

  /**
   * 将物体添加到空间网格
   * @param rect 物体矩形
   * @param type 物体类型
   * @param object 物体实例
   */
  private addToGrid<T extends { id: string; rect?: Rect; position?: Vector2 }>(
    rect: Rect,
    type: CollisionObjectType,
    object: T
  ): void {
    const cells = this.getGridCellsForRect(rect)
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, { platforms: [], traps: [], collectibles: [] })
      }
      const cell = this.grid.get(cellKey)!
      if (type === 'platform' || type === 'movingPlatform') {
        cell.platforms.push(object as unknown as Platform)
      } else if (type === 'trap') {
        cell.traps.push(object as unknown as Trap)
      } else if (type === 'collectible') {
        cell.collectibles.push(object as unknown as Collectible)
      }
    })
  }

  /**
   * 获取矩形覆盖的所有网格单元格
   * @param rect 矩形区域
   * @returns 单元格键数组
   */
  private getGridCellsForRect(rect: Rect): string[] {
    const cells: string[] = []
    const startX = Math.floor(rect.x / this.gridCellSize)
    const startY = Math.floor(rect.y / this.gridCellSize)
    const endX = Math.floor((rect.x + rect.width) / this.gridCellSize)
    const endY = Math.floor((rect.y + rect.height) / this.gridCellSize)

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x},${y}`)
      }
    }

    return cells
  }

  /**
   * 获取点所在的网格单元格键
   * @param x x坐标
   * @param y y坐标
   * @returns 单元格键
   */
  private getGridCellForPoint(x: number, y: number): string {
    return `${Math.floor(x / this.gridCellSize)},${Math.floor(y / this.gridCellSize)}`
  }

  /**
   * 重建空间网格
   * @param platforms 平台列表
   * @param traps 陷阱列表
   * @param collectibles 收集物列表
   */
  public rebuildGrid(
    platforms: Platform[],
    traps: Trap[],
    collectibles: Collectible[]
  ): void {
    this.grid.clear()

    platforms.forEach(platform => {
      this.addToGrid(platform.rect, platform.type === 'normal' ? 'platform' : 'platform', platform)
    })

    traps.forEach(trap => {
      this.addToGrid(trap.rect, 'trap', trap)
    })

    collectibles.forEach(collectible => {
      const rect: Rect = {
        x: collectible.position.x - 16,
        y: collectible.position.y - 16,
        width: 32,
        height: 32
      }
      this.addToGrid(rect, 'collectible', collectible)
    })
  }

  /**
   * 获取玩家碰撞矩形
   * @param player 玩家状态
   * @param config 玩家配置
   * @returns 碰撞矩形
   */
  public getPlayerRect(player: PlayerState, config: PlayerConfig): Rect {
    return {
      x: player.position.x - config.width / 2,
      y: player.position.y - config.height,
      width: config.width,
      height: config.height
    }
  }

  /**
   * AABB碰撞检测
   * @param rect1 矩形1
   * @param rect2 矩形2
   * @returns 碰撞结果
   */
  public checkAABBCollision(rect1: Rect, rect2: Rect): CollisionResult {
    const collided = rectIntersects(rect1, rect2)

    if (!collided) {
      return {
        collided: false,
        normal: { x: 0, y: 0 },
        depth: 0
      }
    }

    const info = getCollisionInfo(rect1, rect2)

    if (!info) {
      return {
        collided: false,
        normal: { x: 0, y: 0 },
        depth: 0
      }
    }

    let normal: Vector2 = { x: 0, y: 0 }

    switch (info.direction) {
      case 'top':
        normal = { x: 0, y: -1 }
        break
      case 'bottom':
        normal = { x: 0, y: 1 }
        break
      case 'left':
        normal = { x: -1, y: 0 }
        break
      case 'right':
        normal = { x: 1, y: 0 }
        break
    }

    return {
      collided: true,
      normal,
      depth: info.minOverlap
    }
  }

  /**
   * 检测与平台的碰撞
   * @param playerRect 玩家矩形
   * @param velocity 玩家速度
   * @param platforms 平台列表
   * @param isOneWayEnabled 是否启用单向平台检测
   * @returns 碰撞结果数组
   */
  public checkPlatformCollisions(
    playerRect: Rect,
    velocity: Vector2,
    platforms: Platform[],
    isOneWayEnabled: boolean = true
  ): (CollisionResult & { platform: Platform })[] {
    const results: (CollisionResult & { platform: Platform })[] = []

    for (const platform of platforms) {
      if (platform.isOneWay && !isOneWayEnabled) {
        continue
      }

      if (platform.isOneWay && velocity.y < 0) {
        continue
      }

      if (platform.isOneWay) {
        const playerBottom = playerRect.y + playerRect.height
        const platformTop = platform.rect.y
        const playerPrevBottom = playerBottom - velocity.y * 0.016

        if (playerPrevBottom > platformTop + this.config.skinThickness) {
          continue
        }
      }

      const collision = this.checkAABBCollision(playerRect, platform.rect)
      if (collision.collided) {
        results.push({ ...collision, platform })
      }
    }

    return results
  }

  /**
   * 解析平台碰撞
   * @param playerRect 玩家矩形
   * @param velocity 玩家速度
   * @param platforms 平台列表
   * @param dt 帧时间
   * @returns 处理后的位置和速度
   */
  public resolvePlatformCollisions(
    playerRect: Rect,
    velocity: Vector2,
    platforms: Platform[],
    dt: number
  ): {
      position: Vector2
      velocity: Vector2
      isGrounded: boolean
      wallContact: -1 | 0 | 1
      hitPlatform: Platform | null
    } {
    let newPosition: Vector2 = {
      x: playerRect.x + playerRect.width / 2,
      y: playerRect.y + playerRect.height
    }

    let newVelocity = { ...velocity }
    let isGrounded = false
    let wallContact: -1 | 0 | 1 = 0
    let hitPlatform: Platform | null = null

    let testRect = { ...playerRect }

    testRect.x += newVelocity.x * dt
    const horizontalCollisions = this.checkPlatformCollisions(testRect, newVelocity, platforms, false)

    for (const collision of horizontalCollisions) {
      if (collision.normal.x !== 0) {
        testRect.x += collision.normal.x * collision.depth
        newVelocity.x = 0

        if (collision.normal.x < 0) {
          wallContact = 1
        } else {
          wallContact = -1
        }
      }
    }

    testRect.y += newVelocity.y * dt
    const verticalCollisions = this.checkPlatformCollisions(testRect, newVelocity, platforms, newVelocity.y >= 0)

    for (const collision of verticalCollisions) {
      if (collision.normal.y !== 0) {
        testRect.y += collision.normal.y * collision.depth

        if (collision.normal.y < 0) {
          newVelocity.y = 0
          isGrounded = true
          hitPlatform = collision.platform
        } else {
          newVelocity.y = 0
        }
      }
    }

    newPosition = {
      x: testRect.x + testRect.width / 2,
      y: testRect.y + testRect.height
    }

    return {
      position: newPosition,
      velocity: newVelocity,
      isGrounded,
      wallContact,
      hitPlatform
    }
  }

  /**
   * 检测陷阱碰撞
   * @param playerRect 玩家矩形
   * @param traps 陷阱列表
   * @returns 碰撞的陷阱数组
   */
  public checkTrapCollisions(playerRect: Rect, traps: Trap[]): Trap[] {
    const collidedTraps: Trap[] = []

    const nearbyTraps = this.getNearbyObjects(playerRect, 'trap', traps)

    for (const trap of nearbyTraps) {
      if (!trap.isActive) {
        continue
      }

      const collision = this.checkAABBCollision(playerRect, trap.rect)
      if (collision.collided) {
        collidedTraps.push(trap)
      }
    }

    return collidedTraps
  }

  /**
   * 检测收集物碰撞
   * @param playerRect 玩家矩形
   * @param collectibles 收集物列表
   * @returns 碰撞的收集物数组
   */
  public checkCollectibleCollisions(
    playerRect: Rect,
    collectibles: Collectible[]
  ): Collectible[] {
    const collidedCollectibles: Collectible[] = []

    const nearbyCollectibles = this.getNearbyObjects(playerRect, 'collectible', collectibles)

    for (const collectible of nearbyCollectibles) {
      if (collectible.isCollected) {
        continue
      }

      const collectibleRect: Rect = {
        x: collectible.position.x - 16,
        y: collectible.position.y - 16,
        width: 32,
        height: 32
      }

      const collision = this.checkAABBCollision(playerRect, collectibleRect)
      if (collision.collided) {
        collidedCollectibles.push(collectible)
      }
    }

    return collidedCollectibles
  }

  /**
   * 检测光影区域检测
   * @param playerRect 玩家矩形
   * @param zones 区域列表
   * @returns 重叠的区域数组
   */
  public checkZoneOverlaps<T extends { rect: Rect }>(playerRect: Rect, zones: T[]): T[] {
    const overlapped: T[] = []

    for (const zone of zones) {
      const collision = this.checkAABBCollision(playerRect, zone.rect)
      if (collision.collided) {
        overlapped.push(zone)
      }
    }

    return overlapped
  }

  /**
   * 获取附近的物体（使用空间网格优化）
   * @param playerRect 玩家矩形
   * @param type 物体类型
   * @param allObjects 所有物体列表
   * @returns 附近的物体数组
   */
  private getNearbyObjects<T extends { id: string }>(
    playerRect: Rect,
    type: CollisionObjectType,
    allObjects: T[]
  ): T[] {
    const cellKeys = this.getGridCellsForRect(playerRect)
    const nearbyIds = new Set<string>()
    const nearbyObjects: T[] = []

    for (const key of cellKeys) {
      const cell = this.grid.get(key)
      if (cell) {
        let objects: { id: string }[] = []
        if (type === 'platform' || type === 'movingPlatform') {
          objects = cell.platforms
        } else if (type === 'trap') {
          objects = cell.traps
        } else if (type === 'collectible') {
          objects = cell.collectibles
        }
        objects.forEach(obj => nearbyIds.add(obj.id))
      }
    }

    for (const obj of allObjects) {
      if (nearbyIds.has(obj.id)) {
        nearbyObjects.push(obj)
      }
    }

    return nearbyObjects
  }

  /**
   * 获取附近的平台
   * @param playerRect 玩家矩形
   * @param allPlatforms 所有平台
   * @returns 附近的平台数组
   */
  public getNearbyPlatforms(playerRect: Rect, allPlatforms: Platform[]): Platform[] {
    return this.getNearbyObjects(playerRect, 'platform', allPlatforms)
  }

  /**
   * 更新移动平台
   * @param platforms 移动平台列表
   * @param dt 帧时间（秒）
   * @returns 平台移动的位移（用于带动玩家）
   */
  public updateMovingPlatforms(
    platforms: MovingPlatform[],
    dt: number
  ): Map<string, Vector2> {
    const platformDelta = new Map<string, Vector2>()

    for (const platform of platforms) {
      if (platform.pathPoints.length < 2) {
        platformDelta.set(platform.id, { x: 0, y: 0 })
        continue
      }

      const previousPosition = {
        x: platform.rect.x,
        y: platform.rect.y
      }

      const currentTarget = platform.pathPoints[platform.currentPathIndex]
      const nextIndex = platform.pingPong
        ? (platform.currentPathIndex + platform.direction + platform.pathPoints.length) % platform.pathPoints.length
        : platform.currentPathIndex + 1

      const nextTarget = platform.pathPoints[nextIndex % platform.pathPoints.length]

      const direction = {
        x: nextTarget.x - currentTarget.x,
        y: nextTarget.y - currentTarget.y
      }

      const distance = vectorLength(direction)
      if (distance === 0) {
        platformDelta.set(platform.id, { x: 0, y: 0 })
        continue
      }

      const normalizedDir = vectorNormalize(direction)
      const moveAmount = platform.moveSpeed * dt

      const newX = platform.rect.x + normalizedDir.x * moveAmount
      const newY = platform.rect.y + normalizedDir.y * moveAmount

      const toNext = {
        x: nextTarget.x - newX,
        y: nextTarget.y - newY
      }

      const distToNext = vectorLength(toNext)

      if (distToNext < moveAmount) {
        platform.rect.x = nextTarget.x
        platform.rect.y = nextTarget.y

        if (platform.pingPong) {
          if (nextIndex === 0 || nextIndex === platform.pathPoints.length - 1) {
            platform.direction = (platform.direction * -1) as 1 | -1
          }
        } else if (nextIndex >= platform.pathPoints.length) {
          if (platform.loop) {
            platform.currentPathIndex = 0
          }
        } else {
          platform.currentPathIndex = nextIndex
        }
      } else {
        platform.rect.x = newX
        platform.rect.y = newY
      }

      const delta = {
        x: platform.rect.x - previousPosition.x,
        y: platform.rect.y - previousPosition.y
      }

      platformDelta.set(platform.id, delta)
    }

    return platformDelta
  }

  /**
   * 角色控制器更新
   * @param player 玩家状态
   * @param config 玩家配置
   * @param input 控制器输入
   * @param platforms 平台列表
   * @param movingPlatforms 移动平台列表
   * @param traps 陷阱列表
   * @param collectibles 收集物列表
   * @param lightZones 光明区域列表
   * @param shadowZones 阴影区域列表
   * @param exitPoint 终点位置
   * @param dt 帧时间（秒）
   * @param events 物理事件回调
   * @returns 更新后的玩家状态
   */
  public updateController(
    player: PlayerState,
    config: PlayerConfig,
    input: ControllerInput,
    platforms: Platform[],
    movingPlatforms: MovingPlatform[],
    traps: Trap[],
    collectibles: Collectible[],
    lightZones: LightZone[],
    shadowZones: ShadowZone[],
    exitPoint: Vector2,
    dt: number,
    events?: PhysicsEvents
  ): PlayerState {
    const newPlayer: PlayerState = { ...player }

    if (input.jumpPressed && this.jumpBufferTimer <= 0) {
      this.jumpBufferTimer = this.config.jumpBufferTime
    }

    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt * 1000)
    this.wallJumpCooldown = Math.max(0, this.wallJumpCooldown - dt * 1000)

    if (newPlayer.isGrounded) {
      this.coyoteTimer = this.config.coyoteTime
    }
    this.coyoteTimer = Math.max(0, this.coyoteTimer - dt * 1000)

    this.wasGroundedLastFrame = newPlayer.isGrounded

    const platformDelta = this.updateMovingPlatforms(movingPlatforms, dt)

    const allPlatforms = [...platforms, ...movingPlatforms]

    let velocity = { ...newPlayer.velocity }

    const controlMultiplier = newPlayer.isGrounded ? 1 : this.config.airControl
    const targetVelocityX = input.horizontal * config.moveSpeed * controlMultiplier

    if (newPlayer.isGrounded) {
      velocity.x += (targetVelocityX - velocity.x) * (1 - this.config.groundFriction)
    } else {
      velocity.x += (targetVelocityX - velocity.x) * 0.2
      velocity.x *= this.config.airResistance
    }

    if (input.horizontal > 0) {
      newPlayer.facingDirection = 1
    } else if (input.horizontal < 0) {
      newPlayer.facingDirection = -1
    }

    velocity.y += this.config.gravity * dt
    velocity.y = Math.min(velocity.y, this.config.maxFallSpeed)

    const isWallSliding =
      !newPlayer.isGrounded &&
      this.wallContactDirection !== 0 &&
      velocity.y > 0 &&
      this.wallJumpCooldown <= 0

    if (isWallSliding) {
      velocity.y = Math.min(velocity.y, this.config.wallSlideSpeed)
      events?.onWallSlide?.(this.wallContactDirection as -1 | 1)
    }

    const canJump =
      this.jumpBufferTimer > 0 &&
      (newPlayer.isGrounded || this.coyoteTimer > 0 || isWallSliding)

    if (canJump && this.wallJumpCooldown <= 0) {
      if (isWallSliding) {
        velocity.x = -this.wallContactDirection * this.config.wallJumpForce.x
        velocity.y = -this.config.wallJumpForce.y
        this.wallJumpCooldown = 200
      } else {
        velocity.y = -config.jumpForce
      }

      newPlayer.isGrounded = false
      this.jumpBufferTimer = 0
      this.coyoteTimer = 0
      events?.onJump?.()
    }

    if (!input.jumpHeld && velocity.y < -200) {
      velocity.y *= 0.5
    }

    let playerRect = this.getPlayerRect(newPlayer, config)

    const resolution = this.resolvePlatformCollisions(
      playerRect, velocity, allPlatforms, dt)

    newPlayer.position = resolution.position
    newPlayer.velocity = resolution.velocity
    velocity = resolution.velocity
    this.wallContactDirection = resolution.wallContact

    const wasGrounded = newPlayer.isGrounded
    newPlayer.isGrounded = resolution.isGrounded

    if (newPlayer.isGrounded && !wasGrounded && velocity.y >= 0) {
      events?.onLand?.()
    }

    if (resolution.hitPlatform) {
      const delta = platformDelta.get(resolution.hitPlatform.id)
      if (delta) {
        newPlayer.position.x += delta.x
        newPlayer.position.y += delta.y
      }
    }

    const updatedPlayerRect = this.getPlayerRect(newPlayer, config)

    const hitTraps = this.checkTrapCollisions(updatedPlayerRect, traps)
    for (const trap of hitTraps) {
      if (!newPlayer.isInvincible) {
        newPlayer.health -= trap.damage
        newPlayer.isInvincible = true
        newPlayer.invincibilityRemaining = config.invincibilityDuration
        events?.onHurt?.(trap.damage)
      }
    }

    if (newPlayer.isInvincible) {
      newPlayer.invincibilityRemaining -= dt * 1000
      if (newPlayer.invincibilityRemaining <= 0) {
        newPlayer.isInvincible = false
      }
    }

    const hitCollectibles = this.checkCollectibleCollisions(updatedPlayerRect, collectibles)
    for (const collectible of hitCollectibles) {
      collectible.isCollected = true
      newPlayer.collectedItems++
      newPlayer.score += collectible.value
      events?.onCollect?.(collectible)
    }

    const overlappedLightZones = this.checkZoneOverlaps(updatedPlayerRect, lightZones)
    const wasInLight = newPlayer.inLight
    newPlayer.inLight = overlappedLightZones.length > 0

    if (newPlayer.inLight && !wasInLight && overlappedLightZones[0]) {
      events?.onEnterLight?.(overlappedLightZones[0])
    }

    const overlappedShadowZones = this.checkZoneOverlaps(updatedPlayerRect, shadowZones)
    if (overlappedShadowZones.length > 0 && !newPlayer.isInvincible) {
      for (const zone of overlappedShadowZones) {
        const damage = zone.damagePerSecond * zone.density * dt
        if (damage > 0) {
          newPlayer.health -= damage
          events?.onHurt?.(damage)
        }
      }
    }

    const exitRect: Rect = {
      x: exitPoint.x - 20,
      y: exitPoint.y - 40,
      width: 40,
      height: 40
    }

    const exitCollision = this.checkAABBCollision(updatedPlayerRect, exitRect)
    if (exitCollision.collided) {
      events?.onReachExit?.()
    }

    newPlayer.isMoving = Math.abs(newPlayer.velocity.x) > 10

    if (newPlayer.velocity.y < -50) {
      newPlayer.animationState = 'jumping'
    } else if (newPlayer.velocity.y > 200 && !newPlayer.isGrounded) {
      newPlayer.animationState = 'falling'
    } else if (newPlayer.isMoving && newPlayer.isGrounded) {
      newPlayer.animationState = 'running'
    } else if (newPlayer.isGrounded) {
      newPlayer.animationState = 'idle'
    }

    if (newPlayer.health <= 0) {
      newPlayer.animationState = 'death'
    }

    newPlayer.position.x = clamp(newPlayer.position.x, config.width / 2, this.levelWidth - config.width / 2)

    return newPlayer
  }

  /**
   * 重置物理系统状态
   */
  public reset(): void {
    this.jumpBufferTimer = 0
    this.coyoteTimer = 0
    this.wasGroundedLastFrame = false
    this.wallContactDirection = 0
    this.wallJumpCooldown = 0
  }

  /**
   * 设置物理配置
   * @param config 新的物理配置
   */
  public setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前物理配置
   * @returns 当前物理配置的只读副本
   */
  public getConfig(): Readonly<PhysicsConfig> {
    return { ...this.config }
  }

  /**
   * 销毁物理系统
   */
  public dispose(): void {
    this.grid.clear()
  }
}

/**
 * 全局物理系统单例
 */
export const physicsSystem = new PhysicsSystem()
