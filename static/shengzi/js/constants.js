const Constants = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  
  GAME_STATE: {
    MENU: 'menu',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FINISHED: 'finished'
  },
  
  GAME_MODE: {
    SINGLE: 'single',
    VERSUS: 'versus'
  },
  
  DIFFICULTY: {
    EASY: { name: '简单', timeWindow: 0.18, baseSpeed: 3.5 },
    MEDIUM: { name: '中等', timeWindow: 0.14, baseSpeed: 4.5 },
    HARD: { name: '困难', timeWindow: 0.11, baseSpeed: 5.5 },
    HELL: { name: '地狱', timeWindow: 0.09, baseSpeed: 6.5 }
  },
  
  PLAYER: {
    WIDTH: 50,
    HEIGHT: 70,
    START_Y: 500,
    FINISH_Y: 50
  },
  
  ROPE: {
    WIDTH: 8,
    COLOR: '#8B4513'
  },
  
  COMBO: {
    MAX_MULTIPLIER: 3,
    DECAY_RATE: 0.5,
    PENALTY_TIME: 0.5
  },
  
  COLORS: {
    P1: '#3498db',
    P2: '#e74c3c',
    ROPE: '#8B4513',
    BACKGROUND: '#87CEEB',
    GROUND: '#228B22',
    SKY_TOP: '#87CEEB',
    SKY_BOTTOM: '#E0F6FF'
  },
  
  STORAGE_KEYS: {
    HIGH_SCORES: 'climb_high_scores',
    GAME_STATE: 'climb_game_state'
  }
};
