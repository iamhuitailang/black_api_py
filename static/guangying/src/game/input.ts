/**
 * 游戏输入系统
 * 统一管理键盘、触摸等输入设备的状态和事件
 * 支持按键状态跟踪、输入缓冲和移动端虚拟按键
 */

import type { Vector2 } from '../types/index'

/**
 * 按键状态
 */
export type KeyState = 'released' | 'pressed' | 'held'

/**
 * 输入映射类型
 * 定义游戏中的动作与物理按键的对应关系
 */
export interface InputMapping {
  /** 向左移动 */
  left: string[]
  /** 向右移动 */
  right: string[]
  /** 向上移动（或跳跃） */
  up: string[]
  /** 向下移动 */
  down: string[]
  /** 跳跃 */
  jump: string[]
  /** 暂停 */
  pause: string[]
  /** 交互 */
  interact: string[]
  /** 攻击 */
  attack: string[]
}

/**
 * 触摸按钮配置
 */
export interface TouchButtonConfig {
  /** 按钮唯一标识 */
  id: string
  /** 按钮显示文本 */
  label: string
  /** 按钮位置（相对于画布的百分比 0-1） */
  position: Vector2
  /** 按钮半径（像素） */
  radius: number
  /** 关联的动作 */
  action: keyof InputMapping
  /** 颜色 */
  color: string
}

/**
 * 触摸事件数据
 */
interface TouchData {
  /** 触摸ID */
  id: number
  /** 当前位置 */
  position: Vector2
  /** 按下的按钮ID（如果有） */
  activeButtonId: string | null
}

/**
 * 输入缓冲条目
 */
interface InputBufferEntry {
  /** 动作名称 */
  action: keyof InputMapping
  /** 按下时间戳 */
  timestamp: number
  /** 持续时间（毫秒） */
  duration: number
}

/**
 * 默认输入映射
 */
const DEFAULT_MAPPING: InputMapping = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  pause: ['Escape'],
  interact: ['KeyE', 'Enter'],
  attack: ['KeyJ', 'KeyZ'],
}

/**
 * 输入系统类
 * 单例模式，通过 InputSystem.getInstance() 获取实例
 */
export class InputSystem {
  private static instance: InputSystem | null = null

  /** 当前按键状态映射 */
  private keyStates: Map<string, KeyState> = new Map()

  /** 上一帧按键状态映射 */
  private previousKeyStates: Map<string, KeyState> = new Map()

  /** 输入映射配置 */
  private mapping: InputMapping

  /** 输入缓冲队列 */
  private inputBuffer: InputBufferEntry[] = []

  /** 输入缓冲最大时间（毫秒） */
  private bufferMaxTime: number = 150

  /** 输入缓冲最大数量 */
  private bufferMaxSize: number = 10

  /** 是否启用触摸输入 */
  private touchEnabled: boolean = false

  /** 画布元素（用于触摸定位） */
  private canvas: HTMLCanvasElement | null = null

  /** 触摸按钮配置列表 */
  private touchButtons: TouchButtonConfig[] = []

  /** 当前活跃的触摸点 */
  private activeTouches: Map<number, TouchData> = new Map()

  /** 触摸按钮状态 */
  private touchButtonStates: Map<string, boolean> = new Map()

  /** 事件回调函数集合 */
  private listeners: Map<keyof InputMapping, Set<() => void>> = new Map()

  /** 是否已初始化 */
  private initialized: boolean = false

  /** 时间戳（用于计算持续时间） */
  private keyPressTimestamps: Map<string, number> = new Map()

  /**
   * 私有构造函数，强制使用单例
   */
  private constructor(mapping?: Partial<InputMapping>) {
    this.mapping = { ...DEFAULT_MAPPING, ...mapping }
  }

  /**
   * 获取输入系统单例实例
   */
  public static getInstance(mapping?: Partial<InputMapping>): InputSystem {
    if (!InputSystem.instance) {
      InputSystem.instance = new InputSystem(mapping)
    }
    return InputSystem.instance
  }

  /**
   * 初始化输入系统
   * @param canvas 画布元素，用于触摸输入
   * @param enableTouch 是否启用触摸输入
   */
  public init(canvas?: HTMLCanvasElement, enableTouch: boolean = false): void {
    if (this.initialized) {
      return
    }

    this.canvas = canvas || null
    this.touchEnabled = enableTouch

    this.attachKeyboardListeners()

    if (enableTouch && canvas) {
      this.attachTouchListeners()
      this.setupDefaultTouchButtons()
    }

    this.initialized = true
  }

  /**
   * 销毁输入系统，移除所有事件监听
   */
  public destroy(): void {
    this.detachKeyboardListeners()
    this.detachTouchListeners()
    this.keyStates.clear()
    this.previousKeyStates.clear()
    this.inputBuffer.length = 0
    this.activeTouches.clear()
    this.touchButtonStates.clear()
    this.listeners.clear()
    this.initialized = false
  }

  /**
   * 每帧更新，处理状态转换和输入缓冲
   * @param deltaTime 帧间隔时间（毫秒）
   */
  public update(deltaTime: number): void {
    const now = performance.now()

    for (const [key, state] of this.keyStates) {
      if (state === 'pressed') {
        this.keyStates.set(key, 'held')
      }
      this.previousKeyStates.set(key, state)
    }

    this.inputBuffer = this.inputBuffer.filter(entry => {
      return now - entry.timestamp < this.bufferMaxTime
    })

    if (this.inputBuffer.length > this.bufferMaxSize) {
      this.inputBuffer = this.inputBuffer.slice(-this.bufferMaxSize)
    }
  }

  /**
   * 检查动作是否在当前帧刚按下
   * @param action 动作名称
   */
  public isActionPressed(action: keyof InputMapping): boolean {
    const keys = this.mapping[action]
    for (const key of keys) {
      if (this.keyStates.get(key) === 'pressed') {
        return true
      }
    }

    if (this.touchEnabled) {
      const buttonConfig = this.touchButtons.find(b => b.action === action)
      if (buttonConfig && this.touchButtonStates.get(buttonConfig.id) === true) {
        return true
      }
    }

    return false
  }

  /**
   * 检查动作是否正在持续按住
   * @param action 动作名称
   */
  public isActionHeld(action: keyof InputMapping): boolean {
    const keys = this.mapping[action]
    for (const key of keys) {
      const state = this.keyStates.get(key)
      if (state === 'held' || state === 'pressed') {
        return true
      }
    }

    if (this.touchEnabled) {
      const buttonConfig = this.touchButtons.find(b => b.action === action)
      if (buttonConfig && this.touchButtonStates.get(buttonConfig.id) === true) {
        return true
      }
    }

    return false
  }

  /**
   * 检查动作是否在当前帧刚释放
   * @param action 动作名称
   */
  public isActionReleased(action: keyof InputMapping): boolean {
    const keys = this.mapping[action]
    for (const key of keys) {
      const current = this.keyStates.get(key)
      const previous = this.previousKeyStates.get(key)
      if (current === 'released' && (previous === 'held' || previous === 'pressed')) {
        return true
      }
    }

    return false
  }

  /**
   * 获取动作按下的持续时间（毫秒）
   * @param action 动作名称
   */
  public getActionDuration(action: keyof InputMapping): number {
    const keys = this.mapping[action]
    for (const key of keys) {
      const timestamp = this.keyPressTimestamps.get(key)
      const state = this.keyStates.get(key)
      if (timestamp !== undefined && (state === 'held' || state === 'pressed')) {
        return performance.now() - timestamp
      }
    }
    return 0
  }

  /**
   * 获取移动输入向量
   * X轴：-1（左）到 1（右）
   * Y轴：-1（下）到 1（上）
   */
  public getMoveVector(): Vector2 {
    let x = 0
    let y = 0

    if (this.isActionHeld('left')) x -= 1
    if (this.isActionHeld('right')) x += 1
    if (this.isActionHeld('up')) y -= 1
    if (this.isActionHeld('down')) y += 1

    const length = Math.sqrt(x * x + y * y)
    if (length > 0) {
      x /= length
      y /= length
    }

    return { x, y }
  }

  /**
   * 检查输入缓冲中是否有指定动作
   * @param action 动作名称
   * @param maxAge 最大允许的缓冲时间（毫秒），不传则使用默认值
   */
  public hasBufferedAction(action: keyof InputMapping, maxAge?: number): boolean {
    const now = performance.now()
    const ageLimit = maxAge !== undefined ? maxAge : this.bufferMaxTime

    return this.inputBuffer.some(entry => 
      entry.action === action && now - entry.timestamp < ageLimit
    )
  }

  /**
   * 消费输入缓冲中的指定动作
   * @param action 动作名称
   * @returns 是否成功消费
   */
  public consumeBufferedAction(action: keyof InputMapping): boolean {
    const index = this.inputBuffer.findIndex(entry => entry.action === action)
    if (index !== -1) {
      this.inputBuffer.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 注册动作按下事件监听
   * @param action 动作名称
   * @param callback 回调函数
   */
  public on(action: keyof InputMapping, callback: () => void): void {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set())
    }
    this.listeners.get(action)!.add(callback)
  }

  /**
   * 移除动作按下事件监听
   * @param action 动作名称
   * @param callback 回调函数
   */
  public off(action: keyof InputMapping, callback: () => void): void {
    const listeners = this.listeners.get(action)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 触发动作事件
   * @param action 动作名称
   */
  private emit(action: keyof InputMapping): void {
    const listeners = this.listeners.get(action)
    if (listeners) {
      for (const callback of listeners) {
        callback()
      }
    }
  }

  /**
   * 设置输入映射
   * @param mapping 新的输入映射配置
   */
  public setMapping(mapping: Partial<InputMapping>): void {
    this.mapping = { ...this.mapping, ...mapping }
  }

  /**
   * 获取当前输入映射
   */
  public getMapping(): InputMapping {
    return { ...this.mapping }
  }

  /**
   * 重置输入映射为默认值
   */
  public resetMapping(): void {
    this.mapping = { ...DEFAULT_MAPPING }
  }

  /**
   * 添加自定义触摸按钮
   * @param config 按钮配置
   */
  public addTouchButton(config: TouchButtonConfig): void {
    this.touchButtons.push(config)
    this.touchButtonStates.set(config.id, false)
  }

  /**
   * 移除触摸按钮
   * @param id 按钮ID
   */
  public removeTouchButton(id: string): void {
    const index = this.touchButtons.findIndex(b => b.id === id)
    if (index !== -1) {
      this.touchButtons.splice(index, 1)
      this.touchButtonStates.delete(id)
    }
  }

  /**
   * 获取所有触摸按钮配置
   */
  public getTouchButtons(): TouchButtonConfig[] {
    return [...this.touchButtons]
  }

  /**
   * 渲染触摸按钮到画布
   * @param ctx 画布渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  public renderTouchButtons(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.touchEnabled) return

    for (const button of this.touchButtons) {
      const x = button.position.x * canvasWidth
      const y = button.position.y * canvasHeight
      const isActive = this.touchButtonStates.get(button.id) || false

      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, button.radius, 0, Math.PI * 2)
      ctx.fillStyle = isActive 
        ? button.color 
        : this.hexToRgba(button.color, 0.5)
      ctx.fill()
      ctx.strokeStyle = this.hexToRgba('#ffffff', isActive ? 1 : 0.7)
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(button.label, x, y)
      ctx.restore()
    }
  }

  /**
   * 设置输入缓冲最大时间
   * @param time 缓冲时间（毫秒）
   */
  public setBufferMaxTime(time: number): void {
    this.bufferMaxTime = Math.max(0, time)
  }

  /**
   * 设置输入缓冲最大数量
   * @param size 缓冲数量
   */
  public setBufferMaxSize(size: number): void {
    this.bufferMaxSize = Math.max(1, size)
  }

  /**
   * 清除所有输入状态和缓冲
   */
  public clearAll(): void {
    this.keyStates.clear()
    this.previousKeyStates.clear()
    this.inputBuffer.length = 0
    this.keyPressTimestamps.clear()
    this.touchButtonStates.forEach((_, key) => {
      this.touchButtonStates.set(key, false)
    })
    this.activeTouches.clear()
  }

  /**
   * 挂载键盘事件监听
   */
  private attachKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.handleWindowBlur)
  }

  /**
   * 移除键盘事件监听
   */
  private detachKeyboardListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.handleWindowBlur)
  }

  /**
   * 键盘按下处理
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.code

    if (this.keyStates.get(key) === 'held' || this.keyStates.get(key) === 'pressed') {
      return
    }

    this.keyStates.set(key, 'pressed')
    this.keyPressTimestamps.set(key, performance.now())

    for (const action of Object.keys(this.mapping) as (keyof InputMapping)[]) {
      if (this.mapping[action].includes(key)) {
        this.addToBuffer(action)
        this.emit(action)

        if (action === 'jump') {
          e.preventDefault()
        }
      }
    }
  }

  /**
   * 键盘释放处理
   */
  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.code
    this.keyStates.set(key, 'released')
    this.keyPressTimestamps.delete(key)
  }

  /**
   * 窗口失去焦点时重置所有按键状态
   */
  private handleWindowBlur = (): void => {
    this.keyStates.forEach((_, key) => {
      this.keyStates.set(key, 'released')
    })
    this.keyPressTimestamps.clear()
    this.activeTouches.clear()
    this.touchButtonStates.forEach((_, key) => {
      this.touchButtonStates.set(key, false)
    })
  }

  /**
   * 挂载触摸事件监听
   */
  private attachTouchListeners(): void {
    if (!this.canvas) return

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel, { passive: false })
  }

  /**
   * 移除触摸事件监听
   */
  private detachTouchListeners(): void {
    if (!this.canvas) return

    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
    this.canvas.removeEventListener('touchcancel', this.handleTouchCancel)
  }

  /**
   * 触摸开始处理
   */
  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault()

    for (const touch of e.changedTouches) {
      const position = this.getTouchPosition(touch)
      const buttonId = this.getButtonAtPosition(position)

      const touchData: TouchData = {
        id: touch.identifier,
        position,
        activeButtonId: buttonId,
      }

      this.activeTouches.set(touch.identifier, touchData)

      if (buttonId) {
        this.touchButtonStates.set(buttonId, true)
        const buttonConfig = this.touchButtons.find(b => b.id === buttonId)
        if (buttonConfig) {
          this.addToBuffer(buttonConfig.action)
          this.emit(buttonConfig.action)
        }
      }
    }
  }

  /**
   * 触摸移动处理
   */
  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault()

    for (const touch of e.changedTouches) {
      const touchData = this.activeTouches.get(touch.identifier)
      if (!touchData) continue

      const position = this.getTouchPosition(touch)
      const buttonId = this.getButtonAtPosition(position)

      if (buttonId !== touchData.activeButtonId) {
        if (touchData.activeButtonId) {
          this.touchButtonStates.set(touchData.activeButtonId, false)
        }
        if (buttonId) {
          this.touchButtonStates.set(buttonId, true)
          const buttonConfig = this.touchButtons.find(b => b.id === buttonId)
          if (buttonConfig) {
            this.addToBuffer(buttonConfig.action)
            this.emit(buttonConfig.action)
          }
        }
        touchData.activeButtonId = buttonId
      }

      touchData.position = position
    }
  }

  /**
   * 触摸结束处理
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault()

    for (const touch of e.changedTouches) {
      const touchData = this.activeTouches.get(touch.identifier)
      if (touchData && touchData.activeButtonId) {
        this.touchButtonStates.set(touchData.activeButtonId, false)
      }
      this.activeTouches.delete(touch.identifier)
    }
  }

  /**
   * 触摸取消处理
   */
  private handleTouchCancel = (e: TouchEvent): void => {
    e.preventDefault()

    for (const touch of e.changedTouches) {
      const touchData = this.activeTouches.get(touch.identifier)
      if (touchData && touchData.activeButtonId) {
        this.touchButtonStates.set(touchData.activeButtonId, false)
      }
      this.activeTouches.delete(touch.identifier)
    }
  }

  /**
   * 获取触摸在画布上的位置
   */
  private getTouchPosition(touch: Touch): Vector2 {
    if (!this.canvas) return { x: 0, y: 0 }

    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }
  }

  /**
   * 获取指定位置下的触摸按钮
   */
  private getButtonAtPosition(position: Vector2): string | null {
    if (!this.canvas) return null

    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height

    for (const button of this.touchButtons) {
      const buttonX = button.position.x * canvasWidth
      const buttonY = button.position.y * canvasHeight
      const dx = position.x - buttonX
      const dy = position.y - buttonY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= button.radius) {
        return button.id
      }
    }

    return null
  }

  /**
   * 设置默认的触摸按钮布局
   */
  private setupDefaultTouchButtons(): void {
    this.addTouchButton({
      id: 'dpad-left',
      label: '←',
      position: { x: 0.1, y: 0.85 },
      radius: 35,
      action: 'left',
      color: '#4CAF50',
    })

    this.addTouchButton({
      id: 'dpad-right',
      label: '→',
      position: { x: 0.25, y: 0.85 },
      radius: 35,
      action: 'right',
      color: '#4CAF50',
    })

    this.addTouchButton({
      id: 'button-jump',
      label: '跳',
      position: { x: 0.9, y: 0.85 },
      radius: 40,
      action: 'jump',
      color: '#2196F3',
    })

    this.addTouchButton({
      id: 'button-pause',
      label: 'Ⅱ',
      position: { x: 0.9, y: 0.1 },
      radius: 25,
      action: 'pause',
      color: '#FF9800',
    })
  }

  /**
   * 添加动作到输入缓冲
   * @param action 动作名称
   */
  private addToBuffer(action: keyof InputMapping): void {
    this.inputBuffer.push({
      action,
      timestamp: performance.now(),
      duration: 0,
    })

    if (this.inputBuffer.length > this.bufferMaxSize) {
      this.inputBuffer.shift()
    }
  }

  /**
   * 十六进制颜色转RGBA
   */
  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return hex
  }
}

/**
 * 导出默认实例
 */
export const inputSystem = InputSystem.getInstance()
