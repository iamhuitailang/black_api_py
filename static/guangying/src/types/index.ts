/**
 * 游戏全局类型定义
 * 定义所有游戏相关的接口、枚举和类型别名
 */

// ==================== 游戏状态相关 ====================

/**
 * 游戏场景类型
 * 标识游戏当前所处的场景
 */
export type GameScene = 
  | 'menu'           // 主菜单
  | 'levelSelect'    // 关卡选择
  | 'playing'        // 游戏进行中
  | 'paused'         // 暂停
  | 'levelComplete'  // 关卡完成
  | 'gameOver'       // 游戏结束
  | 'victory'        // 胜利
  | 'settings';      // 设置界面

/**
 * 画质等级
 */
export type GraphicsQuality = 'low' | 'medium' | 'high'

/**
 * localStorage 存储键名
 */
export const STORAGE_KEY = 'guangying_game_data'

/**
 * 关卡星级记录
 * key: 关卡ID，value: 星级 0-3
 */
export type LevelStars = Record<string, number>

/**
 * 最高分记录
 * key: 关卡ID，value: 分数
 */
export type HighScores = Record<string, number>

/**
 * 已解锁关卡列表
 */
export type UnlockedLevels = string[]

/**
 * 游戏内实时状态
 */
export interface GameRuntimeState {
  /** 生命值 */
  health: number
  /** 最大生命值 */
  maxHealth: number
  /** 已收集物数量 */
  collectibles: number
  /** 总收集物数量 */
  totalCollectibles: number
  /** 游戏时间（秒） */
  gameTime: number
  /** 是否暂停 */
  isPaused: boolean
  /** 当前分数 */
  score: number
  /** 当前光影状态 */
  shadowState: 'light' | 'shadow'
}

/**
 * 游戏持久化数据（存储到localStorage）
 */
export interface GamePersistentData {
  currentLevel: string
  unlockedLevels: UnlockedLevels
  levelStars: LevelStars
  totalParticles: number
  highScores: HighScores
  settings: GameSettings
}

/**
 * 游戏Store完整状态
 */
export interface GameStoreState extends GamePersistentData {
  currentScene: GameScene
  gameState: GameRuntimeState
}

/**
 * 游戏状态
 * 管理游戏全局状态
 */
export interface GameState {
  /** 当前场景 */
  currentScene: GameScene;
  /** 当前关卡ID */
  currentLevelId: number;
  /** 游戏是否暂停 */
  isPaused: boolean;
  /** 游戏总时间（秒） */
  totalPlayTime: number;
  /** 全局音量 0-1 */
  volume: number;
  /** 音效是否开启 */
  soundEnabled: boolean;
  /** 背景音乐是否开启 */
  musicEnabled: boolean;
  /** 游戏是否已初始化 */
  isInitialized: boolean;
}

// ==================== 玩家相关 ====================

/**
 * 玩家配置
 * 定义玩家的基础属性
 */
export interface PlayerConfig {
  /** 最大生命值 */
  maxHealth: number;
  /** 移动速度（像素/秒） */
  moveSpeed: number;
  /** 跳跃力度 */
  jumpForce: number;
  /** 重力加速度 */
  gravity: number;
  /** 最大下落速度 */
  maxFallSpeed: number;
  /** 角色宽度 */
  width: number;
  /** 角色高度 */
  height: number;
  /** 无敌时间（毫秒） */
  invincibilityDuration: number;
  /** 发光强度 */
  lightIntensity: number;
  /** 发光半径 */
  lightRadius: number;
}

/**
 * 玩家状态
 * 管理玩家当前状态
 */
export interface PlayerState {
  /** 当前位置 */
  position: Vector2;
  /** 速度 */
  velocity: Vector2;
  /** 当前生命值 */
  health: number;
  /** 是否在地面上 */
  isGrounded: boolean;
  /** 是否无敌 */
  isInvincible: boolean;
  /** 无敌剩余时间（毫秒） */
  invincibilityRemaining: number;
  /** 面朝方向：1为右，-1为左 */
  facingDirection: 1 | -1;
  /** 是否正在跳跃 */
  isJumping: boolean;
  /** 是否正在移动 */
  isMoving: boolean;
  /** 收集的物品数量 */
  collectedItems: number;
  /** 当前分数 */
  score: number;
  /** 当前在光明/黑暗区域 */
  inLight: boolean;
  /** 角色动画状态 */
  animationState: PlayerAnimationState;
}

/**
 * 玩家动画状态
 */
export type PlayerAnimationState = 
  | 'idle'        // 待机
  | 'running'     // 奔跑
  | 'jumping'     // 跳跃
  | 'falling'     // 下落
  | 'landing'     // 落地
  | 'hurt'        // 受伤
  | 'death';      // 死亡

// ==================== 关卡相关 ====================

/**
 * 关卡背景
 */
export interface LevelBackground {
  /** 背景图片资源路径 */
  imageUrl: string;
  /** 视差滚动系数（0-1），0为不滚动，1为与玩家同步 */
  parallaxFactor: number;
  /** 背景颜色（当没有图片时使用） */
  backgroundColor: string;
  /** 背景图层级 */
  layer: number;
}

/**
 * 平台
 * 静态或动态的碰撞平台
 */
export interface Platform {
  /** 平台唯一ID */
  id: string;
  /** 位置和尺寸 */
  rect: Rect;
  /** 平台类型 */
  type: 'normal' | 'ice' | 'breakable' | 'bouncy';
  /** 摩擦力系数 */
  friction: number;
  /** 是否可穿透（单向平台） */
  isOneWay: boolean;
  /** 平台颜色 */
  color: string;
}

/**
 * 移动平台
 * 可以在路径上移动的平台
 */
export interface MovingPlatform extends Platform {
  /** 移动路径点 */
  pathPoints: Vector2[];
  /** 移动速度 */
  moveSpeed: number;
  /** 当前路径索引 */
  currentPathIndex: number;
  /** 是否循环移动 */
  loop: boolean;
  /** 是否往返移动 */
  pingPong: boolean;
  /** 移动方向 1正向 -1反向 */
  direction: 1 | -1;
}

/**
 * 陷阱
 * 会对玩家造成伤害的物体
 */
export interface Trap {
  /** 陷阱唯一ID */
  id: string;
  /** 位置和尺寸 */
  rect: Rect;
  /** 陷阱类型 */
  type: 'spike' | 'fire' | 'saw' | 'pit';
  /** 伤害值 */
  damage: number;
  /** 是否激活 */
  isActive: boolean;
  /** 激活间隔（毫秒），0为始终激活 */
  activationInterval: number;
  /** 剩余激活时间（毫秒） */
  activationTimer: number;
  /** 颜色 */
  color: string;
}

/**
 * 可收集物品
 */
export interface Collectible {
  /** 物品唯一ID */
  id: string;
  /** 位置 */
  position: Vector2;
  /** 物品类型 */
  type: 'gem' | 'coin' | 'heart' | 'key' | 'star';
  /** 物品价值 */
  value: number;
  /** 是否已收集 */
  isCollected: boolean;
  /** 收集时触发的效果 */
  effect?: CollectibleEffect;
  /** 旋转速度 */
  rotationSpeed: number;
  /** 当前旋转角度 */
  rotation: number;
  /** 浮动幅度 */
  floatAmplitude: number;
  /** 浮动速度 */
  floatSpeed: number;
}

/**
 * 收集品效果类型
 */
export type CollectibleEffect = 
  | 'heal'        // 恢复生命
  | 'shield'      // 护盾
  | 'speedBoost'  // 速度提升
  | 'doubleJump'; // 二段跳

/**
 * 光明区域
 * 玩家在此区域内获得增益
 */
export interface LightZone {
  /** 区域唯一ID */
  id: string;
  /** 位置和尺寸 */
  rect: Rect;
  /** 光强 0-1 */
  intensity: number;
  /** 颜色 */
  color: string;
  /** 是否闪烁 */
  isFlickering: boolean;
  /** 闪烁频率 */
  flickerFrequency: number;
}

/**
 * 阴影区域
 * 玩家在此区域内受到减益或伤害
 */
export interface ShadowZone {
  /** 区域唯一ID */
  id: string;
  /** 位置和尺寸 */
  rect: Rect;
  /** 阴影浓度 0-1 */
  density: number;
  /** 每秒伤害（浓度为1时） */
  damagePerSecond: number;
  /** 是否逐渐扩散 */
  isSpreading: boolean;
  /** 扩散速度 */
  spreadSpeed: number;
}

/**
 * 火把
 * 可以点亮的光源
 */
export interface Torch {
  /** 火把唯一ID */
  id: string;
  /** 位置 */
  position: Vector2;
  /** 光照半径 */
  lightRadius: number;
  /** 光强 */
  lightIntensity: number;
  /** 是否已点燃 */
  isLit: boolean;
  /** 点燃所需时间（毫秒） */
  igniteTime: number;
  /** 当前点燃进度 0-1 */
  igniteProgress: number;
  /** 颜色 */
  color: string;
}

/**
 * 关卡定义
 */
export interface Level {
  /** 关卡ID */
  id: number;
  /** 关卡名称 */
  name: string;
  /** 关卡描述 */
  description: string;
  /** 关卡难度 1-5 */
  difficulty: number;
  /** 关卡宽度（像素） */
  width: number;
  /** 关卡高度（像素） */
  height: number;
  /** 目标时间（秒） */
  targetTime: number;
  /** 背景配置 */
  background: LevelBackground;
  /** 平台列表 */
  platforms: Platform[];
  /** 移动平台列表 */
  movingPlatforms: MovingPlatform[];
  /** 陷阱列表 */
  traps: Trap[];
  /** 可收集物品列表 */
  collectibles: Collectible[];
  /** 光明区域列表 */
  lightZones: LightZone[];
  /** 阴影区域列表 */
  shadowZones: ShadowZone[];
  /** 火把列表 */
  torches: Torch[];
  /** 玩家出生点 */
  spawnPoint: Vector2;
  /** 终点位置 */
  exitPoint: Vector2;
  /** 关卡解锁条件 */
  unlockCondition: UnlockCondition;
}

/**
 * 解锁条件
 */
export interface UnlockCondition {
  /** 需要完成的关卡ID列表 */
  requiredLevels: number[];
  /** 需要的星星总数 */
  requiredStars: number;
  /** 需要的分数 */
  requiredScore: number;
}

// ==================== 存档数据 ====================

/**
 * 关卡分数记录
 */
export interface LevelScore {
  /** 关卡ID */
  levelId: number;
  /** 最高分数 */
  highScore: number;
  /** 最快通关时间（秒） */
  bestTime: number;
  /** 获得的星星数 0-3 */
  stars: number;
  /** 是否已完成 */
  isCompleted: boolean;
  /** 收集的物品百分比 0-100 */
  completionPercentage: number;
  /** 最后游玩时间戳 */
  lastPlayedAt: number;
}

/**
 * 存档数据
 */
export interface SaveData {
  /** 存档版本号 */
  version: string;
  /** 玩家名称 */
  playerName: string;
  /** 总分数 */
  totalScore: number;
  /** 总星星数 */
  totalStars: number;
  /** 各关卡分数记录 */
  levelScores: Record<number, LevelScore>;
  /** 已解锁的关卡ID列表 */
  unlockedLevels: number[];
  /** 游戏设置 */
  settings: GameSettings;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后保存时间戳 */
  lastSavedAt: number;
}

/**
 * 游戏设置
 */
export interface GameSettings {
  /** 背景音乐音量 0-1 */
  bgmVolume: number
  /** 音效音量 0-1 */
  sfxVolume: number
  /** 是否开启背景音乐 */
  bgmEnabled: boolean
  /** 是否开启音效 */
  sfxEnabled: boolean
  /** 画质等级 */
  graphicsQuality: GraphicsQuality
  /** 显示FPS */
  showFPS: boolean
  /** 显示碰撞盒 */
  showHitboxes: boolean
}

// ==================== 物理相关 ====================

/**
 * 二维向量
 */
export interface Vector2 {
  /** X轴分量 */
  x: number;
  /** Y轴分量 */
  y: number;
}

/**
 * 矩形区域
 */
export interface Rect {
  /** 左上角X坐标 */
  x: number;
  /** 左上角Y坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 碰撞检测结果
 */
export interface CollisionResult {
  /** 是否发生碰撞 */
  collided: boolean;
  /** 碰撞法线方向 */
  normal: Vector2;
  /** 碰撞深度 */
  depth: number;
  /** 碰撞的物体ID */
  collidedWithId?: string;
  /** 碰撞的物体类型 */
  collidedWithType?: CollisionObjectType;
}

/**
 * 可碰撞物体类型
 */
export type CollisionObjectType = 
  | 'platform'
  | 'movingPlatform'
  | 'trap'
  | 'collectible'
  | 'lightZone'
  | 'shadowZone'
  | 'torch'
  | 'player'
  | 'exit';

// ==================== 粒子相关 ====================

/**
 * 粒子配置
 * 定义粒子发射器的属性
 */
export interface ParticleConfig {
  /** 粒子纹理图片 */
  textureUrl?: string;
  /** 粒子颜色 */
  color: string;
  /** 粒子数量 */
  count: number;
  /** 发射速率（每秒） */
  emissionRate: number;
  /** 粒子最小尺寸 */
  minSize: number;
  /** 粒子最大尺寸 */
  maxSize: number;
  /** 粒子最小生命周期（毫秒） */
  minLifetime: number;
  /** 粒子最大生命周期（毫秒） */
  maxLifetime: number;
  /** 初始速度范围 */
  velocity: {
    min: Vector2;
    max: Vector2;
  };
  /** 加速度 */
  acceleration: Vector2;
  /** 重力系数 */
  gravity: number;
  /** 是否循环发射 */
  loop: boolean;
  /** 发射持续时间（毫秒），0为无限 */
  duration: number;
  /** 透明度随时间变化 */
  alphaOverLifetime: AlphaCurve;
  /** 大小随时间变化 */
  sizeOverLifetime: SizeCurve;
  /** 颜色随时间变化 */
  colorOverLifetime?: ColorCurve;
  /** 混合模式 */
  blendMode: 'normal' | 'additive' | 'multiply';
}

/**
 * 透明度曲线
 */
export interface AlphaCurve {
  /** 开始透明度 0-1 */
  start: number;
  /** 结束透明度 0-1 */
  end: number;
  /** 缓动函数类型 */
  easing: EasingType;
}

/**
 * 大小曲线
 */
export interface SizeCurve {
  /** 开始大小倍数 */
  start: number;
  /** 结束大小倍数 */
  end: number;
  /** 缓动函数类型 */
  easing: EasingType;
}

/**
 * 颜色曲线
 */
export interface ColorCurve {
  /** 开始颜色 */
  start: string;
  /** 结束颜色 */
  end: string;
  /** 缓动函数类型 */
  easing: EasingType;
}

/**
 * 缓动函数类型
 */
export type EasingType = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad';

/**
 * 粒子实例
 * 运行时的单个粒子状态
 */
export interface Particle {
  /** 粒子唯一ID */
  id: string;
  /** 当前位置 */
  position: Vector2;
  /** 当前速度 */
  velocity: Vector2;
  /** 当前大小 */
  size: number;
  /** 当前颜色 */
  color: string;
  /** 当前透明度 0-1 */
  alpha: number;
  /** 已存活时间（毫秒） */
  age: number;
  /** 总生命周期（毫秒） */
  lifetime: number;
  /** 旋转角度 */
  rotation: number;
  /** 旋转速度 */
  rotationSpeed: number;
  /** 是否活跃 */
  isActive: boolean;
}

// ==================== 音效相关 ====================

/**
 * 音效类型
 */
export type SoundType = 
  | 'jump'          // 跳跃
  | 'landing'       // 落地
  | 'collect'       // 收集物品
  | 'hurt'          // 受伤
  | 'death'         // 死亡
  | 'levelComplete' // 关卡完成
  | 'buttonClick'   // 按钮点击
  | 'menuSelect'    // 菜单选择
  | 'torchLight'    // 火把点亮
  | 'portal'        // 传送门
  | 'warning'       // 警告
  | 'pickup'        // 拾取
  | 'bounce'        // 弹跳
  | 'break';        // 破碎

/**
 * 音频配置
 */
export interface AudioConfig {
  /** 音效资源路径 */
  url: string;
  /** 音量 0-1 */
  volume: number;
  /** 是否循环 */
  loop: boolean;
  /** 播放速度 0.5-2 */
  playbackRate: number;
  /** 声道 'left' | 'center' | 'right' */
  pan: number;
  /** 优先级，高优先级的音效不会被打断 */
  priority: number;
  /** 是否可以被打断 */
  interruptible: boolean;
  /** 最大同时播放数量 */
  maxInstances: number;
}

/**
 * 背景音乐类型
 */
export type MusicType = 
  | 'menu'           // 主菜单
  | 'level1'         // 关卡1
  | 'level2'         // 关卡2
  | 'level3'         // 关卡3
  | 'boss'           // Boss战
  | 'victory'        // 胜利
  | 'gameOver';      // 游戏结束

// ==================== 通用工具类型 ====================

/**
 * 可选属性工具类型
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * 只读属性工具类型
 */
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * 可为空类型
 */
export type Nullable<T> = T | null;

/**
 * 游戏时间戳（毫秒）
 */
export type Timestamp = number;

/**
 * 游戏帧时间（秒）
 */
export type DeltaTime = number;

/**
 * 像素单位
 */
export type Pixels = number;

/**
 * 百分比 0-1
 */
export type Percentage = number;
