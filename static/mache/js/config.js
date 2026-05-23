var CONFIG = (function() {
  var CANVAS = {
    WIDTH: 800,
    HEIGHT: 600
  };

  var GROUND = {
    Y: 480,
    HEIGHT: 120
  };

  var LANE = {
    LEFT: 200,
    CENTER: 400,
    RIGHT: 600,
    WIDTH: 160,
    POSITIONS: [200, 400, 600]
  };

  var CARRIAGE_TYPES = {
    wooden: {
      id: 'wooden',
      name: '普通木马车',
      desc: '基础均衡款式\n上手门槛低',
      hp: 3,
      speed: 1.0,
      jumpPower: 1.0,
      scoreMultiplier: 1.0,
      color: '#8B4513',
      accentColor: '#D2691E',
      wheelColor: '#2F1B0C'
    },
    swift: {
      id: 'swift',
      name: '疾风轻马车',
      desc: '灵动竞速款式\n移动跳跃更灵活',
      hp: 2,
      speed: 1.3,
      jumpPower: 1.25,
      scoreMultiplier: 1.1,
      color: '#228B22',
      accentColor: '#32CD32',
      wheelColor: '#1B4D1B'
    },
    heavy: {
      id: 'heavy',
      name: '重甲铁马车',
      desc: '厚重防御款式\n容错生存能力更强',
      hp: 5,
      speed: 0.75,
      jumpPower: 0.75,
      scoreMultiplier: 0.9,
      color: '#4A4A4A',
      accentColor: '#696969',
      wheelColor: '#1C1C1C'
    }
  };

  var OBSTACLE_TYPES = {
    rock: {
      id: 'rock',
      name: '石块',
      width: 60,
      height: 40,
      damage: 1,
      color: '#696969',
      accentColor: '#808080',
      laneRequired: false,
      jumpable: true
    },
    pit: {
      id: 'pit',
      name: '深坑',
      width: 100,
      height: 80,
      damage: 2,
      color: '#1a0a05',
      accentColor: '#3d1f10',
      laneRequired: true,
      jumpable: true
    },
    post: {
      id: 'post',
      name: '木桩',
      width: 30,
      height: 90,
      damage: 1,
      color: '#8B4513',
      accentColor: '#A0522D',
      laneRequired: true,
      jumpable: false
    },
    beast: {
      id: 'beast',
      name: '野兽',
      width: 70,
      height: 55,
      damage: 2,
      color: '#8B0000',
      accentColor: '#CD5C5C',
      laneRequired: false,
      jumpable: true,
      moving: true
    }
  };

  var ITEM_TYPES = {
    coin: {
      id: 'coin',
      name: '金币',
      width: 24,
      height: 24,
      score: 10,
      color: '#FFD700',
      accentColor: '#FFA500'
    },
    shield: {
      id: 'shield',
      name: '护盾',
      width: 28,
      height: 32,
      duration: 8000,
      color: '#4169E1',
      accentColor: '#87CEEB'
    },
    boost: {
      id: 'boost',
      name: '加速',
      width: 28,
      height: 28,
      duration: 5000,
      multiplier: 1.8,
      color: '#FF4500',
      accentColor: '#FF8C00'
    },
    heart: {
      id: 'heart',
      name: '回血',
      width: 26,
      height: 24,
      healAmount: 1,
      color: '#FF1493',
      accentColor: '#FF69B4'
    }
  };

  var PHYSICS = {
    GRAVITY: 0.7,
    JUMP_FORCE: 16,
    MAX_JUMP_FORCE: 24,
    JUMP_CHARGE_RATE: 0.3,
    MOVE_SPEED: 7,
    GROUND_FRICTION: 0.85
  };

  var GAME_SPEED = {
    INITIAL: 4,
    MAX: 12,
    ACCELERATION: 0.00015,
    DISTANCE_STEP: 100
  };

  var SPAWN = {
    INITIAL_OBSTACLE_INTERVAL: 1800,
    MIN_OBSTACLE_INTERVAL: 700,
    INITIAL_ITEM_INTERVAL: 2500,
    MIN_ITEM_INTERVAL: 1200,
    INITIAL_COIN_INTERVAL: 800,
    MIN_COIN_INTERVAL: 400
  };

  var SCORE = {
    DISTANCE_POINTS: 1,
    COIN_POINTS: 10
  };

  var STATE_KEYS = {
    HIGH_SCORE: 'mache_high_score',
    HIGH_DISTANCE: 'mache_high_distance',
    GAME_STATE: 'mache_game_state',
    SELECTED_CARRIAGE: 'mache_selected_carriage'
  };

  var COLORS = {
    SKY_TOP: '#d4762f',
    SKY_BOTTOM: '#e8a060',
    GROUND_TOP: '#c4965a',
    GROUND_MIDDLE: '#8b6b3a',
    GROUND_BOTTOM: '#5c3d1a',
    ROAD: '#7a5c3a',
    ROAD_LINE: '#c4965a',
    SAND_DUNE: '#b8864a',
    SUN: '#FFD700',
    SUN_GLOW: 'rgba(255, 200, 50, 0.3)'
  };

  return {
    CANVAS: CANVAS,
    GROUND: GROUND,
    LANE: LANE,
    CARRIAGE_TYPES: CARRIAGE_TYPES,
    OBSTACLE_TYPES: OBSTACLE_TYPES,
    ITEM_TYPES: ITEM_TYPES,
    PHYSICS: PHYSICS,
    GAME_SPEED: GAME_SPEED,
    SPAWN: SPAWN,
    SCORE: SCORE,
    STATE_KEYS: STATE_KEYS,
    COLORS: COLORS
  };
})();
