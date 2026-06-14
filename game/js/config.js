const GameConfig = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,
  BASE_SPEED: 4,
  SPEED_INCREMENT: 0.3,
  FOODS_FOR_SPEED_BOOST: 3,
  PATH_HISTORY_LENGTH: 200,
  BODY_SEGMENT_INTERVAL: 5,
  INITIAL_BODY_SEGMENTS: 5,
  SEGMENTS_PER_FOOD: 3,
  COLLISION_SAFE_SEGMENTS: 3,
  SPEED_BOOST_DURATION: 5000,
  SPEED_BOOST_MULTIPLIER: 1.5,
  SLOW_DURATION: 3000,
  SLOW_MULTIPLIER: 0.5,
  FOOD_TYPES: {
    NORMAL: {
      id: 'normal',
      name: '普通食物',
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.6)',
      score: 10,
      probability: 0.75,
      shape: 'circle'
    },
    SPEED: {
      id: 'speed',
      name: '加速食物',
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.6)',
      score: 20,
      probability: 0.20,
      shape: 'lightning'
    },
    SLOW: {
      id: 'slow',
      name: '减速食物',
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.6)',
      score: 5,
      probability: 0.05,
      shape: 'snowflake'
    }
  },
  WORM_SKINS: [
    {
      id: 'default',
      name: '绿色条纹虫',
      unlockAt: 0,
      colors: ['#22c55e', '#16a34a', '#15803d'],
      type: 'striped'
    },
    {
      id: 'fire',
      name: '红色火焰虫',
      unlockAt: 50,
      colors: ['#ef4444', '#f97316', '#fbbf24'],
      type: 'fire'
    },
    {
      id: 'ice',
      name: '蓝色冰晶虫',
      unlockAt: 100,
      colors: ['#06b6d4', '#3b82f6', '#8b5cf6'],
      type: 'ice'
    },
    {
      id: 'rainbow',
      name: '彩虹渐变虫',
      unlockAt: 200,
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
      type: 'rainbow'
    }
  ],
  STORAGE_KEY: 'greedy_worm_save_data_v1'
};
