/**
 * 游戏音效系统
 * 使用Web Audio API实现程序化音效生成
 * 支持音效与背景音乐分离控制、音量调节、淡入淡出等功能
 */

import type { SoundType, MusicType, GameSettings } from '../types'

/**
 * 音效池项
 */
interface SoundPoolItem {
  /** 音效节点 */
  oscillator: OscillatorNode
  /** 增益节点 */
  gainNode: GainNode
  /** 是否正在使用 */
  isActive: boolean
  /** 音效类型 */
  type: SoundType
}

/**
 * 程序化音效配置
 */
interface SoundConfig {
  /** 起始频率 */
  frequencyStart: number
  /** 结束频率（用于频率扫描） */
  frequencyEnd: number
  /** 波形类型 */
  type: OscillatorType
  /** 持续时间（秒） */
  duration: number
  /** 音量 */
  volume: number
  /** 攻击时间（秒） */
  attack: number
  /** 释放时间（秒） */
  release: number
  /** 是否启用频率扫描 */
  frequencySweep: boolean
}

/**
 * 背景音乐配置
 */
interface MusicConfig {
  /** 基础频率 */
  baseFrequency: number
  /** 和弦音符间隔（秒） */
  noteInterval: number
  /** 音量 */
  volume: number
}

/**
 * 音效系统类
 */
export class AudioSystem {
  /** AudioContext上下文 */
  private audioContext: AudioContext | null = null

  /** 主增益节点（音效） */
  private sfxMasterGain: GainNode | null = null

  /** 主增益节点（背景音乐） */
  private musicMasterGain: GainNode | null = null

  /** 音效池 */
  private soundPool: SoundPoolItem[] = []

  /** 当前背景音乐振荡器 */
  private musicOscillators: OscillatorNode[] = []

  /** 当前背景音乐增益节点 */
  private musicGainNodes: GainNode[] = []

  /** 背景音乐定时器 */
  private musicTimer: number | null = null

  /** 当前播放的背景音乐类型 */
  private currentMusicType: MusicType | null = null

  /** 音效是否静音 */
  private sfxMuted: boolean = false

  /** 背景音乐是否静音 */
  private musicMuted: boolean = false

  /** 音效音量 0-1 */
  private sfxVolume: number = 0.7

  /** 背景音乐音量 0-1 */
  private musicVolume: number = 0.5

  /** 音效池最大大小 */
  private readonly MAX_POOL_SIZE: number = 20

  /** 程序化音效配置表 */
  private readonly soundConfigs: Record<SoundType, SoundConfig> = {
    jump: {
      frequencyStart: 300,
      frequencyEnd: 600,
      type: 'square',
      duration: 0.15,
      volume: 0.3,
      attack: 0.01,
      release: 0.1,
      frequencySweep: true
    },
    landing: {
      frequencyStart: 150,
      frequencyEnd: 80,
      type: 'triangle',
      duration: 0.12,
      volume: 0.25,
      attack: 0.005,
      release: 0.08,
      frequencySweep: true
    },
    collect: {
      frequencyStart: 800,
      frequencyEnd: 1200,
      type: 'sine',
      duration: 0.2,
      volume: 0.35,
      attack: 0.005,
      release: 0.15,
      frequencySweep: true
    },
    hurt: {
      frequencyStart: 200,
      frequencyEnd: 100,
      type: 'sawtooth',
      duration: 0.25,
      volume: 0.4,
      attack: 0.005,
      release: 0.15,
      frequencySweep: true
    },
    death: {
      frequencyStart: 400,
      frequencyEnd: 50,
      type: 'sawtooth',
      duration: 0.8,
      volume: 0.5,
      attack: 0.01,
      release: 0.5,
      frequencySweep: true
    },
    levelComplete: {
      frequencyStart: 523,
      frequencyEnd: 1047,
      type: 'sine',
      duration: 0.5,
      volume: 0.4,
      attack: 0.02,
      release: 0.3,
      frequencySweep: true
    },
    buttonClick: {
      frequencyStart: 600,
      frequencyEnd: 600,
      type: 'square',
      duration: 0.08,
      volume: 0.2,
      attack: 0.005,
      release: 0.05,
      frequencySweep: false
    },
    menuSelect: {
      frequencyStart: 700,
      frequencyEnd: 900,
      type: 'sine',
      duration: 0.1,
      volume: 0.25,
      attack: 0.005,
      release: 0.06,
      frequencySweep: true
    },
    torchLight: {
      frequencyStart: 300,
      frequencyEnd: 800,
      type: 'triangle',
      duration: 0.3,
      volume: 0.3,
      attack: 0.05,
      release: 0.2,
      frequencySweep: true
    },
    portal: {
      frequencyStart: 200,
      frequencyEnd: 1000,
      type: 'sine',
      duration: 0.4,
      volume: 0.35,
      attack: 0.05,
      release: 0.25,
      frequencySweep: true
    },
    warning: {
      frequencyStart: 440,
      frequencyEnd: 880,
      type: 'square',
      duration: 0.3,
      volume: 0.4,
      attack: 0.01,
      release: 0.1,
      frequencySweep: true
    },
    pickup: {
      frequencyStart: 600,
      frequencyEnd: 900,
      type: 'sine',
      duration: 0.15,
      volume: 0.3,
      attack: 0.005,
      release: 0.1,
      frequencySweep: true
    },
    bounce: {
      frequencyStart: 200,
      frequencyEnd: 500,
      type: 'triangle',
      duration: 0.12,
      volume: 0.3,
      attack: 0.005,
      release: 0.08,
      frequencySweep: true
    },
    break: {
      frequencyStart: 300,
      frequencyEnd: 100,
      type: 'sawtooth',
      duration: 0.2,
      volume: 0.35,
      attack: 0.005,
      release: 0.15,
      frequencySweep: true
    }
  }

  /**
   * 背景音乐配置表
   */
  private readonly musicConfigs: Record<MusicType, MusicConfig> = {
    menu: {
      baseFrequency: 261.63,
      noteInterval: 0.8,
      volume: 0.15
    },
    level1: {
      baseFrequency: 329.63,
      noteInterval: 0.6,
      volume: 0.12
    },
    level2: {
      baseFrequency: 293.66,
      noteInterval: 0.5,
      volume: 0.14
    },
    level3: {
      baseFrequency: 349.23,
      noteInterval: 0.4,
      volume: 0.16
    },
    boss: {
      baseFrequency: 196,
      noteInterval: 0.3,
      volume: 0.18
    },
    victory: {
      baseFrequency: 523.25,
      noteInterval: 0.7,
      volume: 0.2
    },
    gameOver: {
      baseFrequency: 174.61,
      noteInterval: 1.0,
      volume: 0.15
    }
  }

  /**
   * 大调音阶（用于生成背景音乐旋律）
   */
  private readonly majorScale: number[] = [0, 2, 4, 5, 7, 9, 11, 12]

  /**
   * 初始化音频系统
   */
  public init(): void {
    if (this.audioContext) {
      return
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      this.sfxMasterGain = this.audioContext.createGain()
      this.sfxMasterGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume
      this.sfxMasterGain.connect(this.audioContext.destination)

      this.musicMasterGain = this.audioContext.createGain()
      this.musicMasterGain.gain.value = this.musicMuted ? 0 : this.musicVolume
      this.musicMasterGain.connect(this.audioContext.destination)

      this.initializeSoundPool()
    } catch (error) {
      console.warn('音频系统初始化失败:', error)
    }
  }

  /**
   * 初始化音效池
   */
  private initializeSoundPool(): void {
    if (!this.audioContext || !this.sfxMasterGain) {
      return
    }

    for (let i = 0; i < this.MAX_POOL_SIZE; i++) {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      gainNode.gain.value = 0
      oscillator.connect(gainNode)
      gainNode.connect(this.sfxMasterGain)

      this.soundPool.push({
        oscillator,
        gainNode,
        isActive: false,
        type: 'jump'
      })
    }
  }

  /**
   * 从音效池获取可用的音效项
   * @param type 音效类型
   * @returns 音效池项或null
   */
  private getPoolItem(type: SoundType): SoundPoolItem | null {
    let availableItem = this.soundPool.find(item => !item.isActive)

    if (!availableItem && this.soundPool.length < this.MAX_POOL_SIZE * 2) {
      if (!this.audioContext || !this.sfxMasterGain) {
        return null
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      gainNode.gain.value = 0
      oscillator.connect(gainNode)
      gainNode.connect(this.sfxMasterGain)

      availableItem = {
        oscillator,
        gainNode,
        isActive: false,
        type
      }

      this.soundPool.push(availableItem)
    }

    if (availableItem) {
      availableItem.isActive = true
      availableItem.type = type
    }

    return availableItem
  }

  /**
   * 播放音效
   * @param type 音效类型
   * @param volumeMultiplier 音量倍数（可选）
   */
  public playSound(type: SoundType, volumeMultiplier: number = 1): void {
    if (!this.audioContext || !this.sfxMasterGain || this.sfxMuted) {
      return
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const config = this.soundConfigs[type]
    if (!config) {
      return
    }

    const poolItem = this.getPoolItem(type)
    if (!poolItem) {
      return
    }

    const { oscillator, gainNode } = poolItem
    const now = this.audioContext.currentTime

    oscillator.type = config.type
    oscillator.frequency.setValueAtTime(config.frequencyStart, now)

    if (config.frequencySweep) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(config.frequencyEnd, 1),
        now + config.duration
      )
    }

    const volume = config.volume * this.sfxVolume * volumeMultiplier

    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + config.attack)
    gainNode.gain.linearRampToValueAtTime(0, now + config.duration - config.release)

    try {
      oscillator.start(now)
    } catch (e) {
      oscillator.frequency.setValueAtTime(config.frequencyStart, now)
    }

    setTimeout(() => {
      try {
        oscillator.stop()
      } catch (e) {
        // 忽略已停止的错误
      }
      gainNode.gain.value = 0
      poolItem.isActive = false
    }, config.duration * 1000 + 50)
  }

  /**
   * 播放切换光影音效
   * 这是一个便捷方法，内部使用torchLight音效类型
   */
  public playLightSwitch(): void {
    this.playSound('torchLight', 1.2)
  }

  /**
   * 播放通关音效
   */
  public playVictory(): void {
    this.playSound('levelComplete', 1.0)
    setTimeout(() => this.playSound('collect', 0.8), 200)
    setTimeout(() => this.playSound('collect', 0.6), 400)
  }

  /**
   * 播放失败音效
   */
  public playGameOver(): void {
    this.playSound('death', 1.0)
  }

  /**
   * 播放背景音乐
   * @param type 背景音乐类型
   */
  public playMusic(type: MusicType): void {
    if (!this.audioContext || !this.musicMasterGain) {
      return
    }

    if (this.currentMusicType === type && this.musicTimer !== null) {
      return
    }

    this.stopMusic()
    this.currentMusicType = type

    const config = this.musicConfigs[type]
    if (!config) {
      return
    }

    let noteIndex = 0
    const playNote = () => {
      if (!this.audioContext || !this.musicMasterGain || this.currentMusicType !== type) {
        return
      }

      const semitone = this.majorScale[noteIndex % this.majorScale.length]
      const frequency = config.baseFrequency * Math.pow(2, semitone / 12)

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.value = frequency

      gainNode.gain.value = 0
      oscillator.connect(gainNode)
      gainNode.connect(this.musicMasterGain)

      const now = this.audioContext.currentTime
      const volume = config.volume * this.musicVolume

      gainNode.gain.linearRampToValueAtTime(volume, now + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, now + config.noteInterval - 0.1)

      oscillator.start(now)
      oscillator.stop(now + config.noteInterval)

      this.musicOscillators.push(oscillator)
      this.musicGainNodes.push(gainNode)

      setTimeout(() => {
        const oscIndex = this.musicOscillators.indexOf(oscillator)
        if (oscIndex > -1) {
          this.musicOscillators.splice(oscIndex, 1)
          this.musicGainNodes.splice(oscIndex, 1)
        }
      }, config.noteInterval * 1000 + 100)

      noteIndex++
    }

    playNote()
    this.musicTimer = window.setInterval(playNote, config.noteInterval * 1000)
  }

  /**
   * 停止背景音乐
   * @param fadeOutTime 淡出时间（秒）
   */
  public stopMusic(fadeOutTime: number = 0.5): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }

    this.currentMusicType = null

    if (!this.audioContext || !this.musicMasterGain) {
      return
    }

    const now = this.audioContext.currentTime

    this.musicGainNodes.forEach(gainNode => {
      try {
        gainNode.gain.cancelScheduledValues(now)
        gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime)
      } catch (e) {
        // 忽略已停止的节点
      }
    })

    setTimeout(() => {
      this.musicOscillators.forEach(osc => {
        try {
          osc.stop()
        } catch (e) {
          // 忽略已停止的错误
        }
      })
      this.musicOscillators = []
      this.musicGainNodes = []
    }, fadeOutTime * 1000)
  }

  /**
   * 设置音效音量
   * @param volume 音量 0-1
   */
  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))

    if (this.sfxMasterGain && !this.sfxMuted) {
      this.sfxMasterGain.gain.setTargetAtTime(this.sfxVolume, this.audioContext?.currentTime || 0, 0.1)
    }
  }

  /**
   * 设置背景音乐音量
   * @param volume 音量 0-1
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))

    if (this.musicMasterGain && !this.musicMuted) {
      this.musicMasterGain.gain.setTargetAtTime(this.musicVolume, this.audioContext?.currentTime || 0, 0.1)
    }
  }

  /**
   * 切换音效静音
   * @param muted 是否静音
   */
  public setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted

    if (this.sfxMasterGain && this.audioContext) {
      const targetValue = muted ? 0 : this.sfxVolume
      this.sfxMasterGain.gain.setTargetAtTime(targetValue, this.audioContext.currentTime, 0.1)
    }
  }

  /**
   * 切换背景音乐静音
   * @param muted 是否静音
   */
  public setMusicMuted(muted: boolean): void {
    this.musicMuted = muted

    if (this.musicMasterGain && this.audioContext) {
      const targetValue = muted ? 0 : this.musicVolume
      this.musicMasterGain.gain.setTargetAtTime(targetValue, this.audioContext.currentTime, 0.1)
    }
  }

  /**
   * 切换所有音频静音
   * @param muted 是否静音
   */
  public setAllMuted(muted: boolean): void {
    this.setSfxMuted(muted)
    this.setMusicMuted(muted)
  }

  /**
   * 从游戏设置应用配置
   * @param settings 游戏设置
   */
  public applySettings(settings: Partial<GameSettings>): void {
    if (settings.sfxVolume !== undefined) {
      this.setSfxVolume(settings.sfxVolume)
    }
    if (settings.bgmVolume !== undefined) {
      this.setMusicVolume(settings.bgmVolume)
    }
    if (settings.sfxEnabled !== undefined) {
      this.setSfxMuted(!settings.sfxEnabled)
    }
    if (settings.bgmEnabled !== undefined) {
      this.setMusicMuted(!settings.bgmEnabled)
    }
  }

  /**
   * 淡入背景音乐
   * @param type 背景音乐类型
   * @param fadeTime 淡入时间（秒）
   */
  public fadeInMusic(type: MusicType, fadeTime: number = 1.0): void {
    if (this.musicMasterGain && this.audioContext) {
      const originalVolume = this.musicVolume
      this.musicMasterGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.playMusic(type)
      this.musicMasterGain.gain.linearRampToValueAtTime(
        this.musicMuted ? 0 : originalVolume,
        this.audioContext.currentTime + fadeTime
      )
    } else {
      this.playMusic(type)
    }
  }

  /**
   * 淡出并停止背景音乐
   * @param fadeTime 淡出时间（秒）
   */
  public fadeOutMusic(fadeTime: number = 1.0): void {
    if (this.musicMasterGain && this.audioContext && this.currentMusicType) {
      this.musicMasterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime)
      setTimeout(() => {
        this.stopMusic(0)
      }, fadeTime * 1000)
    } else {
      this.stopMusic(0)
    }
  }

  /**
   * 获取音效音量
   */
  public getSfxVolume(): number {
    return this.sfxVolume
  }

  /**
   * 获取背景音乐音量
   */
  public getMusicVolume(): number {
    return this.musicVolume
  }

  /**
   * 音效是否静音
   */
  public isSfxMuted(): boolean {
    return this.sfxMuted
  }

  /**
   * 背景音乐是否静音
   */
  public isMusicMuted(): boolean {
    return this.musicMuted
  }

  /**
   * 恢复音频上下文（用于用户交互后恢复）
   */
  public resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  /**
   * 销毁音频系统
   */
  public dispose(): void {
    this.stopMusic(0)

    this.soundPool.forEach(item => {
      try {
        item.oscillator.stop()
      } catch (e) {
        // 忽略已停止的错误
      }
      item.oscillator.disconnect()
      item.gainNode.disconnect()
    })

    this.soundPool = []

    if (this.sfxMasterGain) {
      this.sfxMasterGain.disconnect()
      this.sfxMasterGain = null
    }

    if (this.musicMasterGain) {
      this.musicMasterGain.disconnect()
      this.musicMasterGain = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

/**
 * 全局音频系统单例
 */
export const audioSystem = new AudioSystem()
