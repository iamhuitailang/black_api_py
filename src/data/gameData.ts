import type { HamsterSkin, SnowballEffect, Decoration, Item, MapData, Achievement } from '@/types/game'

export const HAMSTER_SKINS: HamsterSkin[] = [
  {
    id: 'default',
    name: '原始布丁',
    color: '#D4A574',
    bellyColor: '#FFF0E0',
    price: 0,
    currency: 'coins',
    rarity: 'common',
    description: '最经典的金黄色小仓鼠，温暖可爱',
    emoji: '🐹'
  },
  {
    id: 'white',
    name: '雪绒棉花',
    color: '#FFFFFF',
    bellyColor: '#FFF5F5',
    price: 500,
    currency: 'coins',
    rarity: 'common',
    description: '雪白的毛发，在雪地中完美隐身',
    emoji: '🐹'
  },
  {
    id: 'gray',
    name: '银灰绅士',
    color: '#A0A0A0',
    bellyColor: '#E8E8E8',
    price: 800,
    currency: 'coins',
    rarity: 'common',
    description: '优雅的银灰色，自带贵族气质',
    emoji: '🐹'
  },
  {
    id: 'brown',
    name: '可可巧克力',
    color: '#8B4513',
    bellyColor: '#DEB887',
    price: 1200,
    currency: 'coins',
    rarity: 'rare',
    description: '浓郁的巧克力色，甜甜的感觉',
    emoji: '🐹'
  },
  {
    id: 'pink',
    name: '草莓奶昔',
    color: '#FFB6C1',
    bellyColor: '#FFF0F5',
    price: 2000,
    currency: 'coins',
    rarity: 'rare',
    description: '粉嫩可爱，少女心爆棚',
    emoji: '🐹'
  },
  {
    id: 'blue',
    name: '冰蓝精灵',
    color: '#87CEEB',
    bellyColor: '#E0F7FF',
    price: 3000,
    currency: 'coins',
    rarity: 'epic',
    description: '来自冰雪世界的神秘仓鼠',
    emoji: '🐹'
  },
  {
    id: 'golden',
    name: '黄金传说',
    color: '#FFD700',
    bellyColor: '#FFFACD',
    price: 500,
    currency: 'diamonds',
    rarity: 'legendary',
    description: '传说中的黄金仓鼠，带来好运',
    emoji: '🐹'
  },
  {
    id: 'rainbow',
    name: '彩虹梦境',
    color: '#FF6B6B',
    bellyColor: '#E0FFFF',
    price: 800,
    currency: 'diamonds',
    rarity: 'legendary',
    description: '七彩光芒的神秘仓鼠，稀世珍藏',
    emoji: '🐹'
  }
]

export const SNOWBALL_EFFECTS: SnowballEffect[] = [
  {
    id: 'default',
    name: '纯净白雪',
    trailColor: 'rgba(255, 255, 255, 0.5)',
    particleColor: '#FFFFFF',
    price: 0,
    currency: 'coins',
    rarity: 'common',
    description: '最纯净的雪球，没有多余装饰'
  },
  {
    id: 'sparkle',
    name: '闪闪星光',
    trailColor: 'rgba(255, 215, 0, 0.6)',
    particleColor: '#FFD700',
    price: 800,
    currency: 'coins',
    rarity: 'rare',
    description: '闪闪发光的金色粒子拖尾'
  },
  {
    id: 'rainbow',
    name: '彩虹之尾',
    trailColor: 'rgba(138, 43, 226, 0.5)',
    particleColor: '#8A2BE2',
    price: 2000,
    currency: 'coins',
    rarity: 'epic',
    description: '七彩渐变的梦幻拖尾效果'
  },
  {
    id: 'fire',
    name: '烈焰寒霜',
    trailColor: 'rgba(255, 69, 0, 0.6)',
    particleColor: '#FF4500',
    price: 3000,
    currency: 'coins',
    rarity: 'epic',
    description: '冰与火的碰撞，独特视觉体验'
  },
  {
    id: 'aurora',
    name: '极光幻彩',
    trailColor: 'rgba(0, 255, 127, 0.5)',
    particleColor: '#00FF7F',
    price: 600,
    currency: 'diamonds',
    rarity: 'legendary',
    description: '北极光般的神秘绿色光芒'
  }
]

export const DECORATIONS: Decoration[] = [
  {
    id: 'santa_hat',
    name: '圣诞帽',
    type: 'hat',
    price: 1000,
    currency: 'coins',
    rarity: 'rare',
    description: '节日限定的红色圣诞帽',
    emoji: '🎅'
  },
  {
    id: 'scarf',
    name: '温暖围巾',
    type: 'accessory',
    price: 600,
    currency: 'coins',
    rarity: 'common',
    description: '暖暖的红色围巾，冬天必备',
    emoji: '🧣'
  },
  {
    id: 'sunglasses',
    name: '酷炫墨镜',
    type: 'accessory',
    price: 1500,
    currency: 'coins',
    rarity: 'rare',
    description: '戴上墨镜，全场最酷',
    emoji: '🕶️'
  },
  {
    id: 'crown',
    name: '小皇冠',
    type: 'hat',
    price: 300,
    currency: 'diamonds',
    rarity: 'epic',
    description: '闪闪发光的金色小皇冠',
    emoji: '👑'
  },
  {
    id: 'bow',
    name: '蝴蝶结',
    type: 'accessory',
    price: 800,
    currency: 'coins',
    rarity: 'common',
    description: '可爱的粉色蝴蝶结',
    emoji: '🎀'
  },
  {
    id: 'angel_wings',
    name: '天使翅膀',
    type: 'back',
    price: 500,
    currency: 'diamonds',
    rarity: 'legendary',
    description: '洁白的天使翅膀，神圣优雅',
    emoji: '🪽'
  }
]

export const ITEMS: Item[] = [
  {
    id: 'speed_boots',
    name: '加速冰鞋',
    description: '临时提升移动速度 50%，持续 5 秒',
    price: 100,
    currency: 'coins',
    rarity: 'common',
    effect: { type: 'speed', value: 1.5, duration: 5000 },
    emoji: '⛸️',
    duration: 5000
  },
  {
    id: 'snowball_bomb',
    name: '雪球炸弹',
    description: '投掷后炸碎目标雪球，减少其 30% 大小',
    price: 300,
    currency: 'coins',
    rarity: 'rare',
    effect: { type: 'bomb', value: 0.3 },
    emoji: '💣'
  },
  {
    id: 'shield',
    name: '护盾',
    description: '获得 3 秒无敌状态，免疫所有负面效果',
    price: 250,
    currency: 'coins',
    rarity: 'rare',
    effect: { type: 'shield', value: 1, duration: 3000 },
    emoji: '🛡️',
    duration: 3000
  },
  {
    id: 'slow_slime',
    name: '减速粘液',
    description: '让最近的对手移动速度降低 40%，持续 4 秒',
    price: 150,
    currency: 'coins',
    rarity: 'common',
    effect: { type: 'slow', value: 0.6, duration: 4000 },
    emoji: '🟢',
    duration: 4000
  },
  {
    id: 'magnet',
    name: '道具磁铁',
    description: '吸引周围 200 像素内的道具，持续 6 秒',
    price: 400,
    currency: 'coins',
    rarity: 'epic',
    effect: { type: 'magnet', value: 200, duration: 6000 },
    emoji: '🧲',
    duration: 6000
  },
  {
    id: 'double_growth',
    name: '双倍雪球',
    description: '雪球增长速度翻倍，持续 8 秒',
    price: 500,
    currency: 'coins',
    rarity: 'epic',
    effect: { type: 'double', value: 2, duration: 8000 },
    emoji: '✨',
    duration: 8000
  },
  {
    id: 'teleport',
    name: '传送门',
    description: '随机传送到地图上的安全位置',
    price: 350,
    currency: 'coins',
    rarity: 'rare',
    effect: { type: 'teleport', value: 1 },
    emoji: '🌀'
  },
  {
    id: 'shrink_ray',
    name: '缩小光线',
    description: '让最大的对手雪球缩小 25%',
    price: 600,
    currency: 'coins',
    rarity: 'epic',
    effect: { type: 'shrink', value: 0.25 },
    emoji: '🔫'
  }
]

export const MAPS: MapData[] = [
  {
    id: 'ice_world',
    name: '冰雪世界',
    description: '经典的冰雪地图，适合新手练习',
    bgGradient: ['#87CEEB', '#E0F7FA'],
    groundColor: '#F0F8FF',
    width: 1200,
    height: 800,
    obstacles: [
      { type: 'snowdrift', x: 200, y: 200, width: 80, height: 80, effect: 'slow' },
      { type: 'snowdrift', x: 900, y: 500, width: 100, height: 100, effect: 'slow' },
      { type: 'ice_ramp', x: 500, y: 350, width: 120, height: 40, effect: 'speed' },
      { type: 'rock', x: 700, y: 200, width: 60, height: 60, effect: 'block' },
      { type: 'rock', x: 300, y: 600, width: 70, height: 70, effect: 'block' }
    ],
    itemSpawnPoints: [
      { x: 300, y: 300 },
      { x: 800, y: 400 },
      { x: 500, y: 600 },
      { x: 1000, y: 200 },
      { x: 150, y: 650 }
    ],
    weather: 'snow',
    difficulty: 1,
    unlockCondition: '初始解锁',
    unlockLevel: 1,
    previewEmoji: '🏔️'
  },
  {
    id: 'south_pole',
    name: '南极之巅',
    description: '寒冷的南极大陆，机关更多更危险',
    bgGradient: ['#4682B4', '#B0C4DE'],
    groundColor: '#E6F2FF',
    width: 1400,
    height: 900,
    obstacles: [
      { type: 'ice_crack', x: 400, y: 300, width: 150, height: 30, effect: 'damage' },
      { type: 'ice_crack', x: 800, y: 600, width: 180, height: 35, effect: 'damage' },
      { type: 'snowdrift', x: 200, y: 500, width: 100, height: 100, effect: 'slow' },
      { type: 'snowdrift', x: 1100, y: 250, width: 90, height: 90, effect: 'slow' },
      { type: 'bounce_pad', x: 600, y: 450, width: 80, height: 20, effect: 'bounce' },
      { type: 'rock', x: 350, y: 150, width: 80, height: 80, effect: 'block' },
      { type: 'rock', x: 950, y: 700, width: 70, height: 70, effect: 'block' },
      { type: 'ice_ramp', x: 750, y: 200, width: 100, height: 35, effect: 'speed' }
    ],
    itemSpawnPoints: [
      { x: 250, y: 200 },
      { x: 700, y: 300 },
      { x: 1100, y: 500 },
      { x: 500, y: 700 },
      { x: 900, y: 150 },
      { x: 200, y: 750 }
    ],
    weather: 'blizzard',
    difficulty: 3,
    unlockCondition: '等级达到 5 级',
    unlockLevel: 5,
    previewEmoji: '🐧'
  },
  {
    id: 'aurora_snowfield',
    name: '极光雪原',
    description: '神秘的极光下的雪原，充满魔力',
    bgGradient: ['#1a1a2e', '#16213e'],
    groundColor: '#E8E8F0',
    width: 1500,
    height: 1000,
    obstacles: [
      { type: 'ice_crack', x: 300, y: 400, width: 200, height: 40, effect: 'damage' },
      { type: 'ice_crack', x: 900, y: 200, width: 180, height: 35, effect: 'damage' },
      { type: 'ice_crack', x: 700, y: 700, width: 160, height: 30, effect: 'damage' },
      { type: 'snowdrift', x: 500, y: 250, width: 120, height: 120, effect: 'slow' },
      { type: 'snowdrift', x: 1200, y: 600, width: 100, height: 100, effect: 'slow' },
      { type: 'bounce_pad', x: 400, y: 600, width: 90, height: 25, effect: 'bounce' },
      { type: 'bounce_pad', x: 1000, y: 400, width: 90, height: 25, effect: 'bounce' },
      { type: 'ice_ramp', x: 200, y: 200, width: 120, height: 40, effect: 'speed' },
      { type: 'ice_ramp', x: 1200, y: 800, width: 120, height: 40, effect: 'speed' },
      { type: 'rock', x: 600, y: 500, width: 90, height: 90, effect: 'block' },
      { type: 'rock', x: 1100, y: 150, width: 80, height: 80, effect: 'block' }
    ],
    itemSpawnPoints: [
      { x: 200, y: 500 },
      { x: 600, y: 150 },
      { x: 1000, y: 300 },
      { x: 400, y: 800 },
      { x: 800, y: 600 },
      { x: 1300, y: 450 },
      { x: 350, y: 350 }
    ],
    weather: 'aurora',
    difficulty: 4,
    unlockCondition: '等级达到 10 级',
    unlockLevel: 10,
    previewEmoji: '🌌'
  },
  {
    id: 'candy_ice',
    name: '糖果冰原',
    description: '甜蜜的糖果世界，充满惊喜',
    bgGradient: ['#FFB6C1', '#FFE4E1'],
    groundColor: '#FFF5EE',
    width: 1300,
    height: 850,
    obstacles: [
      { type: 'snowdrift', x: 250, y: 300, width: 90, height: 90, effect: 'slow' },
      { type: 'snowdrift', x: 950, y: 500, width: 100, height: 100, effect: 'slow' },
      { type: 'bounce_pad', x: 500, y: 250, width: 100, height: 25, effect: 'bounce' },
      { type: 'bounce_pad', x: 750, y: 600, width: 100, height: 25, effect: 'bounce' },
      { type: 'ice_ramp', x: 350, y: 550, width: 110, height: 35, effect: 'speed' },
      { type: 'ice_ramp', x: 900, y: 200, width: 110, height: 35, effect: 'speed' },
      { type: 'rock', x: 600, y: 400, width: 70, height: 70, effect: 'block' },
      { type: 'rock', x: 200, y: 700, width: 60, height: 60, effect: 'block' },
      { type: 'rock', x: 1100, y: 300, width: 65, height: 65, effect: 'block' }
    ],
    itemSpawnPoints: [
      { x: 200, y: 200 },
      { x: 700, y: 350 },
      { x: 1100, y: 600 },
      { x: 450, y: 700 },
      { x: 900, y: 100 },
      { x: 300, y: 500 }
    ],
    weather: 'clear',
    difficulty: 2,
    unlockCondition: '等级达到 3 级',
    unlockLevel: 3,
    previewEmoji: '🍬'
  }
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: '初露锋芒',
    description: '赢得第一场比赛',
    reward: { type: 'coins', amount: 200 },
    condition: { type: 'win_count', value: 1 },
    emoji: '🏆'
  },
  {
    id: 'ten_wins',
    name: '雪球高手',
    description: '累计赢得 10 场比赛',
    reward: { type: 'coins', amount: 500 },
    condition: { type: 'win_count', value: 10 },
    emoji: '🥇'
  },
  {
    id: 'fifty_wins',
    name: '雪地王者',
    description: '累计赢得 50 场比赛',
    reward: { type: 'diamonds', amount: 100 },
    condition: { type: 'win_count', value: 50 },
    emoji: '👑'
  },
  {
    id: 'hundred_games',
    name: '百战仓鼠',
    description: '累计进行 100 场比赛',
    reward: { type: 'coins', amount: 800 },
    condition: { type: 'total_games', value: 100 },
    emoji: '💯'
  },
  {
    id: 'max_snowball_100',
    name: '雪球学徒',
    description: '单局最大雪球达到 100',
    reward: { type: 'coins', amount: 300 },
    condition: { type: 'max_snowball', value: 100 },
    emoji: '⚪'
  },
  {
    id: 'max_snowball_300',
    name: '雪球大师',
    description: '单局最大雪球达到 300',
    reward: { type: 'coins', amount: 1000 },
    condition: { type: 'max_snowball', value: 300 },
    emoji: '🔵'
  },
  {
    id: 'max_snowball_500',
    name: '雪球传说',
    description: '单局最大雪球达到 500',
    reward: { type: 'diamonds', amount: 200 },
    condition: { type: 'max_snowball', value: 500 },
    emoji: '🌐'
  },
  {
    id: 'level_5',
    name: '成长中的仓鼠',
    description: '等级达到 5 级',
    reward: { type: 'coins', amount: 500 },
    condition: { type: 'level', value: 5 },
    emoji: '⭐'
  },
  {
    id: 'level_10',
    name: '资深玩家',
    description: '等级达到 10 级',
    reward: { type: 'diamonds', amount: 150 },
    condition: { type: 'level', value: 10 },
    emoji: '🌟'
  },
  {
    id: 'rich_hamster',
    name: '小富翁',
    description: '累计获得 10000 金币',
    reward: { type: 'diamonds', amount: 100 },
    condition: { type: 'total_coins', value: 10000 },
    emoji: '💰'
  }
]

export const SPECIAL_GUESTS = [
  {
    id: 'golden_hamster',
    name: '黄金仓鼠',
    emoji: '🐹✨',
    description: '传说中的黄金仓鼠，遇到它会获得额外金币奖励',
    reward: { type: 'coins', amount: 500 },
    spawnChance: 0.1
  },
  {
    id: 'snow_fairy',
    name: '雪之精灵',
    emoji: '🧚',
    description: '神秘的雪之精灵，会赠送随机道具',
    reward: { type: 'item', amount: 2 },
    spawnChance: 0.08
  },
  {
    id: 'ice_dragon',
    name: '冰龙宝宝',
    emoji: '🐲',
    description: '可爱的冰龙宝宝，会让所有雪球暂时变大',
    reward: { type: 'buff', value: 1.2 },
    spawnChance: 0.05
  }
]
