export const GAME_CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 600,
  GRAVITY: 0.15,
  MAX_FALL_SPEED: 10,
  PLAYER_SPEED: 5,
  PLAYER_JUMP_FORCE: -8,
  MAX_CHARGE: 100,
  CHARGE_RATE: 1.5,
  MIN_BULLET_SPEED: 5,
  MAX_BULLET_SPEED: 15,
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 60,
  GROUND_HEIGHT: 50,
  DOUBLE_CLICK_DELAY: 300,
  SKILL_COOLDOWN: 10000
}

export const SCENE_CONFIGS = {
  space: {
    name: 'space',
    displayName: '星空战场',
    backgroundColor: '#0a0a1a',
    groundColor: '#1a1a2e',
    accentColor: '#4a90d9',
    stars: true
  },
  city: {
    name: 'city',
    displayName: '都市天空',
    backgroundColor: '#1a1a3e',
    groundColor: '#2a2a4e',
    accentColor: '#ff6b6b',
    buildings: true
  },
  desert: {
    name: 'desert',
    displayName: '沙漠风暴',
    backgroundColor: '#3d2e1a',
    groundColor: '#5a4a2e',
    accentColor: '#ffa94d',
    clouds: true
  }
}

export const BULLET_TYPES = {
  normal: {
    name: 'normal',
    damage: 10,
    speed: 8,
    size: 8,
    color: '#ff6b6b',
    tracking: false
  },
  heavy: {
    name: 'heavy',
    damage: 25,
    speed: 5,
    size: 14,
    color: '#ff8c00',
    tracking: false
  },
  rapid: {
    name: 'rapid',
    damage: 5,
    speed: 12,
    size: 5,
    color: '#4ecdc4',
    tracking: false
  },
  tracking: {
    name: 'tracking',
    damage: 15,
    speed: 6,
    size: 10,
    color: '#9b59b6',
    tracking: true
  }
}

export const ENEMY_STATES = {
  IDLE: 'idle',
  CIRCLING: 'circling',
  DODGING: 'dodging',
  CHARGING: 'charging',
  ATTACKING: 'attacking',
  RUSHING: 'rushing'
}
