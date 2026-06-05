/**
 * 晨光森林关卡
 * 主题：绿色森林，阳光透过树叶
 * 特色：静态树影区域，利用树影躲避陷阱
 */

import type { PlatformConfig, MovingPlatformConfig, OneWayPlatformConfig } from '@/entities/platform'
import type { TrapConfig, SpikeTrapConfig, SawTrapConfig, FireTrapConfig } from '@/entities/trap'
import type { CollectibleConfig } from '@/entities/collectible'
import type { LightZoneConfig } from '@/entities/light'
import type { ShadowZoneConfig } from '@/entities/light'
import type { TorchConfig } from '@/entities/torch'
import type { Vector2 } from '@/utils/math'

/**
 * 关卡数据接口
 */
export interface LevelData {
  /** 关卡ID */
  id: number
  /** 关卡名称 */
  name: string
  /** 关卡描述 */
  description: string
  /** 关卡难度 1-5 */
  difficulty: number
  /** 关卡宽度（像素） */
  width: number
  /** 关卡高度（像素） */
  height: number
  /** 目标时间（秒） */
  targetTime: number
  /** 背景配置 */
  background: {
    /** 背景颜色 */
    backgroundColor: string
    /** 背景图片资源路径 */
    imageUrl?: string
    /** 视差滚动系数 */
    parallaxFactor: number
  }
  /** 玩家出生点 */
  spawnPoint: Vector2
  /** 终点位置 */
  exitPoint: Vector2
  /** 平台列表 */
  platforms: (PlatformConfig | OneWayPlatformConfig)[]
  /** 移动平台列表 */
  movingPlatforms: MovingPlatformConfig[]
  /** 陷阱列表 */
  traps: (TrapConfig | SpikeTrapConfig | SawTrapConfig | FireTrapConfig)[]
  /** 可收集物品列表 */
  collectibles: CollectibleConfig[]
  /** 光明区域列表 */
  lightZones: LightZoneConfig[]
  /** 阴影区域列表 */
  shadowZones: ShadowZoneConfig[]
  /** 火把列表 */
  torches: TorchConfig[]
}

/**
 * 晨光森林关卡数据
 */
export const forestLevel: LevelData = {
  id: 1,
  name: '晨光森林',
  description: '阳光透过树叶洒下斑驳的光影，学会利用光与影的力量穿越这片神秘的森林。',
  difficulty: 1,
  width: 3000,
  height: 720,
  targetTime: 120,
  background: {
    backgroundColor: '#2D5A27',
    parallaxFactor: 0.5,
  },
  spawnPoint: { x: 100, y: 550 },
  exitPoint: { x: 2900, y: 550 },

  platforms: [
    {
      type: 'normal',
      position: { x: 0, y: 620 },
      size: { width: 400, height: 100 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 500, y: 620 },
      size: { width: 300, height: 100 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 900, y: 550 },
      size: { width: 200, height: 30 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 1150, y: 480 },
      size: { width: 150, height: 30 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 1350, y: 620 },
      size: { width: 250, height: 100 },
      collidable: true,
    },
    {
      type: 'oneWay',
      position: { x: 1650, y: 520 },
      size: { width: 180, height: 20 },
      collidable: true,
      passThroughThreshold: 10,
    },
    {
      type: 'normal',
      position: { x: 1880, y: 620 },
      size: { width: 200, height: 100 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 2130, y: 500 },
      size: { width: 150, height: 30 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 2330, y: 420 },
      size: { width: 150, height: 30 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 2530, y: 500 },
      size: { width: 150, height: 30 },
      collidable: true,
    },
    {
      type: 'normal',
      position: { x: 2730, y: 620 },
      size: { width: 270, height: 100 },
      collidable: true,
    },
  ],

  movingPlatforms: [],

  traps: [
    {
      type: 'spike',
      position: { x: 400, y: 580 },
      size: { width: 100, height: 40 },
      damage: 1,
      active: true,
      spikeCount: 5,
      spikeHeight: 25,
    },
    {
      type: 'spike',
      position: { x: 800, y: 580 },
      size: { width: 100, height: 40 },
      damage: 1,
      active: true,
      spikeCount: 5,
      spikeHeight: 25,
    },
    {
      type: 'spike',
      position: { x: 1600, y: 580 },
      size: { width: 50, height: 40 },
      damage: 1,
      active: true,
      spikeCount: 3,
      spikeHeight: 25,
    },
    {
      type: 'fire',
      position: { x: 2080, y: 600 },
      size: { width: 50, height: 20 },
      damage: 1,
      active: true,
      cycleTime: 3,
      activeDuration: 1.5,
      startDelay: 0,
      flameHeight: 60,
    },
  ],

  collectibles: [
    {
      type: 'lightParticle',
      position: { x: 200, y: 520 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 350, y: 480 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 600, y: 520 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 750, y: 450 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 1000, y: 480 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 1225, y: 410 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 1450, y: 550 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 1740, y: 450 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 1980, y: 550 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 2205, y: 430 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 2405, y: 350 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 2605, y: 430 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 2800, y: 550 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 550, y: 380 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 1300, y: 350 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'lightParticle',
      position: { x: 2450, y: 550 },
      size: 12,
      score: 100,
      attractRadius: 80,
      attractSpeed: 300,
      collectRadius: 25,
    },
    {
      type: 'health',
      position: { x: 1500, y: 400 },
      size: 15,
      score: 0,
      attractRadius: 60,
      attractSpeed: 250,
      collectRadius: 20,
    },
    {
      type: 'star',
      position: { x: 2405, y: 280 },
      size: 14,
      score: 500,
      attractRadius: 100,
      attractSpeed: 350,
      collectRadius: 30,
    },
  ],

  lightZones: [
    {
      position: { x: 200, y: 500 },
      size: { width: 250, height: 200 },
      shape: 'rectangle',
      speedMultiplier: 1.5,
      jumpMultiplier: 1.2,
      glowColor: '#FFD700',
      glowIntensity: 0.8,
    },
    {
      position: { x: 650, y: 500 },
      size: { width: 200, height: 200 },
      shape: 'rectangle',
      speedMultiplier: 1.5,
      jumpMultiplier: 1.2,
      glowColor: '#FFD700',
      glowIntensity: 0.8,
    },
    {
      position: { x: 1475, y: 450 },
      size: { width: 150, height: 150 },
      shape: 'circle',
      speedMultiplier: 1.5,
      jumpMultiplier: 1.3,
      glowColor: '#FFD700',
      glowIntensity: 0.9,
    },
    {
      position: { x: 2205, y: 380 },
      size: { width: 180, height: 180 },
      shape: 'ellipse',
      speedMultiplier: 1.4,
      jumpMultiplier: 1.2,
      glowColor: '#FFD700',
      glowIntensity: 0.8,
    },
    {
      position: { x: 2700, y: 500 },
      size: { width: 200, height: 200 },
      shape: 'rectangle',
      speedMultiplier: 1.5,
      jumpMultiplier: 1.2,
      glowColor: '#FFD700',
      glowIntensity: 0.8,
    },
  ],

  shadowZones: [
    {
      position: { x: 850, y: 550 },
      size: { width: 120, height: 150 },
      shape: 'rectangle',
      allowPhasing: true,
      glowColor: '#8A2BE2',
      glowIntensity: 0.7,
    },
    {
      position: { x: 1550, y: 550 },
      size: { width: 100, height: 150 },
      shape: 'rectangle',
      allowPhasing: true,
      glowColor: '#8A2BE2',
      glowIntensity: 0.7,
    },
    {
      position: { x: 1740, y: 420 },
      size: { width: 150, height: 120 },
      shape: 'circle',
      allowPhasing: true,
      glowColor: '#8A2BE2',
      glowIntensity: 0.8,
    },
    {
      position: { x: 2030, y: 550 },
      size: { width: 100, height: 150 },
      shape: 'rectangle',
      allowPhasing: true,
      glowColor: '#8A2BE2',
      glowIntensity: 0.7,
    },
    {
      position: { x: 2500, y: 400 },
      size: { width: 120, height: 120 },
      shape: 'ellipse',
      allowPhasing: true,
      glowColor: '#8A2BE2',
      glowIntensity: 0.7,
    },
  ],

  torches: [],
}
