import type { CharacterStats } from '@/types/game';

export const GAME_VERSION = '1.0.0';
export const SAVE_KEY = 'pixel_game_save';

export const GRAVITY = 0.6;
export const JUMP_FORCE = -14;
export const MOVE_SPEED = 5;
export const FRICTION = 0.8;
export const ICE_FRICTION = 0.95;
export const BOUNCE_FORCE = -18;

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;
export const TILE_SIZE = 32;

export const PLAYER_WIDTH = 28;
export const PLAYER_HEIGHT = 36;
export const ATTACK_RANGE = 40;
export const ATTACK_COOLDOWN = 300;
export const INVINCIBLE_DURATION = 2000;
export const BOOST_DURATION = 10000;

export const CHARACTERS: Record<string, CharacterStats> = {
  hero: {
    id: 'hero',
    name: '像素英雄',
    health: 5,
    speed: 5,
    attack: 1,
    description: '均衡型角色，适合新手玩家'
  },
  ninja: {
    id: 'ninja',
    name: '忍者',
    health: 3,
    speed: 8,
    attack: 0.5,
    price: 500,
    description: '高速型角色，移动迅速但血量较低'
  },
  knight: {
    id: 'knight',
    name: '骑士',
    health: 8,
    speed: 3,
    attack: 1.5,
    price: 800,
    description: '高血型角色，皮糙肉厚但移动较慢'
  },
  mage: {
    id: 'mage',
    name: '法师',
    health: 4,
    speed: 4,
    attack: 2,
    ranged: true,
    price: 1000,
    description: '远程型角色，可发射魔法弹攻击'
  }
};

export const ITEM_PRICES: Record<string, number> = {
  health: 50,
  invincible: 200,
  speed: 100,
  power: 150,
  shield: 120
};

export const ITEM_NAMES: Record<string, string> = {
  health: '生命药水',
  invincible: '无敌星星',
  speed: '速度靴',
  power: '力量药水',
  shield: '护盾',
  coin: '金币'
};

export const ITEM_DESCRIPTIONS: Record<string, string> = {
  health: '恢复1点生命值',
  invincible: '10秒无敌状态',
  speed: '移动速度提升30%',
  power: '攻击力翻倍',
  shield: '抵挡1次伤害'
};

export const ENEMY_STATS: Record<string, { health: number; damage: number; speed: number }> = {
  wolf: { health: 2, damage: 1, speed: 2 },
  bee: { health: 1, damage: 1, speed: 3 },
  vine: { health: 3, damage: 1, speed: 0 },
  slime: { health: 2, damage: 1, speed: 1.5 },
  lavaworm: { health: 3, damage: 2, speed: 1 },
  dragon: { health: 5, damage: 2, speed: 2.5 },
  snowball: { health: 2, damage: 1, speed: 2 },
  bat: { health: 1, damage: 1, speed: 3 },
  giant: { health: 6, damage: 2, speed: 1 },
  robot: { health: 3, damage: 2, speed: 2 },
  turret: { health: 4, damage: 1, speed: 0 },
  blackhole: { health: 999, damage: 1, speed: 0 }
};

export const BOSS_STATS: Record<string, { name: string; health: number; damage: number }> = {
  forest_king: { name: '森林之王', health: 30, damage: 2 },
  volcano_lord: { name: '火山领主', health: 45, damage: 3 },
  ice_queen: { name: '冰雪女王', health: 40, damage: 2 },
  space_emperor: { name: '宇宙帝王', health: 60, damage: 3 }
};

export const LEVEL_NAMES: Record<string, string> = {
  forest: '森林关卡',
  volcano: '火山关卡',
  ice: '冰原关卡',
  space: '太空关卡'
};

export const COLORS = {
  forest: {
    bg: '#1a472a',
    ground: '#2d5016',
    accent: '#4a7c23',
    platform: '#8b4513'
  },
  volcano: {
    bg: '#2d0a0a',
    ground: '#4a1c1c',
    accent: '#ff4500',
    platform: '#5c3317'
  },
  ice: {
    bg: '#0a1628',
    ground: '#1e3a5f',
    accent: '#87ceeb',
    platform: '#b0e0e6'
  },
  space: {
    bg: '#0a001a',
    ground: '#1a0a33',
    accent: '#8a2be2',
    platform: '#4b0082'
  }
};

export const KEY_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space'],
  attack: ['KeyJ', 'KeyK'],
  pause: ['Escape', 'KeyP']
};
