const CONFIG = {
  TRACK_LENGTH: 400,
  LEG_LENGTH: 100,
  HANDOFF_ZONE_START: 80,
  HANDOFF_ZONE_END: 100,
  HANDOFF_PERFECT_MIN: 88,
  HANDOFF_PERFECT_MAX: 94,
  HANDOFF_GOOD_MIN: 84,
  HANDOFF_GOOD_MAX: 98,
  LANE_COUNT: 8,
  LANE_WIDTH: 20,
  RUNNER_BASE_SPEED: 8.5,
  ACCEL_BOOST_PER_TAP: 0.15,
  ACCEL_DECAY_RATE: 0.08,
  ACCEL_MAX_BOOST: 2.5,
  TAP_WINDOW: 200,

  MODES: {
    practice: { name: '练习模式', description: '只练交接', teamCount: 1, isPractice: true },
    friendly: { name: '友谊赛', description: '3队角逐', teamCount: 3, isPractice: false },
    tournament: { name: '锦标赛', description: '淘汰制', teamCount: 8, isPractice: false, elimination: true },
    olympic: { name: '奥运决赛', description: '最强8队', teamCount: 8, isPractice: false, elimination: false }
  },

  OPPONENTS: {
    highschool: {
      name: '高中队',
      speedMultiplier: 0.7,
      totalTimeRange: [44, 46],
      color: '#4CAF50',
      difficulty: 0.7
    },
    university: {
      name: '大学队',
      speedMultiplier: 0.85,
      totalTimeRange: [41, 43],
      color: '#2196F3',
      difficulty: 0.85
    },
    national: {
      name: '国家队',
      speedMultiplier: 1.0,
      totalTimeRange: [38, 39.5],
      color: '#FF9800',
      difficulty: 1.0
    },
    worldrecord: {
      name: '世界纪录队',
      speedMultiplier: 1.3,
      totalTimeRange: [37, 37.5],
      color: '#E91E63',
      difficulty: 1.3
    }
  },

  OPPONENT_POOL: ['highschool', 'university', 'national', 'worldrecord'],

  TEAM_COLORS: [
    '#E53935', '#1E88E5', '#43A047', '#FB8C00',
    '#8E24AA', '#00ACC1', '#F4511E', '#546E7A'
  ],

  TEAM_NAMES: [
    '中国队', '美国队', '牙买加队', '日本队',
    '英国队', '加拿大队', '德国队', '法国队'
  ],

  WEATHER: {
    sunny: { name: '晴天', effect: 0, dropChance: 0, probability: 0.6, icon: '☀️' },
    tailwind: { name: '顺风', effect: 0.03, dropChance: 0, probability: 0.2, icon: '🌬️' },
    headwind: { name: '逆风', effect: -0.03, dropChance: 0, probability: 0.15, icon: '🌬️' },
    rainy: { name: '雨天', effect: 0, dropChance: 0.15, probability: 0.05, icon: '🌧️' }
  },

  SCORING: {
    tiers: [
      { maxTime: 38, baseScore: 1000 },
      { maxTime: 40, baseScore: 900 },
      { maxTime: 42, baseScore: 800 },
      { maxTime: 44, baseScore: 700 },
      { maxTime: Infinity, baseScore: 600 }
    ],
    perfectBonus: 100
  },

  HANDOFF_RESULT: {
    PERFECT: 'perfect',
    GOOD: 'good',
    DROP: 'drop'
  },

  GAME_STATE: {
    MENU: 'menu',
    MODE_SELECT: 'mode_select',
    COUNTDOWN: 'countdown',
    RUNNING: 'running',
    HANDOFF: 'handoff',
    FINISHED: 'finished',
    PAUSED: 'paused'
  },

  STORAGE_KEY: 'jieli_game_state_v1'
};