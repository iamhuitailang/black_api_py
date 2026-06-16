export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

export const HITBOX_RADIUS = 3;
export const GRAZE_RADIUS = 8;

export const PLAYER_START_X = GAME_WIDTH / 2;
export const PLAYER_START_Y = GAME_HEIGHT - 100;

export const STORAGE_KEY = 'touhou_bullet_hell_save';

export const BULLET_COLORS = {
  player: '#ffd700',
  enemy: {
    red: '#ff4444',
    blue: '#4444ff',
    pink: '#ff6b9d',
    green: '#44ff44',
    purple: '#aa44ff',
    yellow: '#ffff44',
    cyan: '#44ffff'
  }
};

export const CHARACTERS = {
  reimu: {
    id: 'reimu',
    name: '博丽灵梦',
    emoji: '巫',
    color: '#ff6b9d',
    secondaryColor: '#ffffff',
    damage: 12,
    speed: 5,
    shotType: 'line',
    shotCount: 1,
    bombType: 'screenClear',
    bombDuration: 2000,
    description: '直线射击，伤害高，移动速度快',
    unlockLevel: 0
  },
  marisa: {
    id: 'marisa',
    name: '雾雨魔理沙',
    emoji: '魔',
    color: '#ffff00',
    secondaryColor: '#000000',
    damage: 8,
    speed: 4,
    shotType: 'spread',
    shotCount: 5,
    bombType: 'laser',
    bombDuration: 3000,
    description: '扩散射击，5方向，激光贯穿Bomb',
    unlockLevel: 0
  },
  sanae: {
    id: 'sanae',
    name: '东风谷早苗',
    emoji: '早',
    color: '#44ffff',
    secondaryColor: '#ffffff',
    damage: 15,
    speed: 4.5,
    shotType: 'homing',
    shotCount: 1,
    bombType: 'slowField',
    bombDuration: 3000,
    description: '追踪射击，伤害最高，减速场Bomb',
    unlockLevel: 1
  }
};

export const STAGES = [
  {
    id: 1,
    name: '第一关 - 春之樱',
    bulletsPerSecond: 3,
    duration: 30000,
    bgColor: '#1a0a2e',
    enemyTypes: ['small', 'medium']
  },
  {
    id: 2,
    name: '第二关 - 夏之绿',
    bulletsPerSecond: 4,
    duration: 35000,
    bgColor: '#0a1a1a',
    enemyTypes: ['small', 'medium', 'large']
  },
  {
    id: 3,
    name: '第三关 - 秋之红',
    bulletsPerSecond: 5,
    duration: 40000,
    bgColor: '#2e1a0a',
    enemyTypes: ['medium', 'large']
  },
  {
    id: 4,
    name: '第四关 - 冬之雪',
    bulletsPerSecond: 7,
    duration: 45000,
    bgColor: '#0a1a2e',
    enemyTypes: ['medium', 'large', 'elite']
  },
  {
    id: 5,
    name: '第五关 - 终焉',
    bulletsPerSecond: 9,
    duration: 50000,
    bgColor: '#2e0a1a',
    enemyTypes: ['large', 'elite']
  }
];

export const BOSS = {
  name: '最终Boss - 八云紫',
  maxHp: 1000,
  phases: [
    { hpThreshold: 1.0, pattern: 'ring', bulletsPerSecond: 5 },
    { hpThreshold: 0.6, pattern: 'fan', bulletsPerSecond: 7 },
    { hpThreshold: 0.3, pattern: 'spiral', bulletsPerSecond: 10 }
  ]
};
