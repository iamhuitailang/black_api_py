export const COLORS = ['#ff3366', '#ffdd33', '#3399ff', '#33ff99'] as const;

export const COLOR_NAMES = ['红', '黄', '蓝', '绿'] as const;

export const GAME_CONFIG = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 720,
  BALL_RADIUS: 12,
  BALL_X: 240,
  BALL_START_Y: 180,
  GRAVITY: 0.3,
  JUMP_FORCE: -7.5,
  COLOR_CHANGE_INTERVAL: 800,
  RING_SPEED: 1.5,
  RING_SPACING_MIN: 220,
  RING_SPACING_MAX: 320,
  RING_RADIUS: 60,
  RING_THICKNESS: 10,
  DOUBLE_RING_CHANCE: 0.12,
  DOUBLE_RING_SPACING: 220,
  INITIAL_LIVES: 3,
  FRENZY_THRESHOLD: 15,
  FRENZY_DURATION: 5000,
  DIFFICULTY_INCREASE_INTERVAL: 8,
  DIFFICULTY_INCREASE_AMOUNT: 0.05,
  STAR_SCORE: 100,
  RING_PASS_SCORE: 10,
  STAR_CHANCE: 0.35,
  TRAIL_LENGTH: 20,
  MAX_PARTICLES: 100,
  RING_ROTATION_SPEED: 0.015,
} as const;

export const SKINS = [
  { id: 'default', name: '经典球', unlockScore: 0, color: '#ffffff' },
  { id: 'neon', name: '霓虹球', unlockScore: 500, color: '#ff00ff' },
  { id: 'rainbow', name: '彩虹球', unlockScore: 2000, color: '#ff0000' },
  { id: 'fire', name: '火焰球', unlockScore: 5000, color: '#ff6600' },
] as const;

export const STORAGE_KEY = 'color-switch-extreme-save';

export const AUDIO_CONFIG = {
  JUMP_FREQUENCY: 600,
  JUMP_DURATION: 0.1,
  SCORE_FREQUENCY: 880,
  SCORE_DURATION: 0.15,
  STAR_FREQUENCY: 1200,
  STAR_DURATION: 0.2,
  HIT_FREQUENCY: 150,
  HIT_DURATION: 0.3,
  GAMEOVER_FREQUENCY: 100,
  GAMEOVER_DURATION: 0.5,
  FRENZY_FREQUENCY: 440,
  FRENZY_DURATION: 0.3,
} as const;
