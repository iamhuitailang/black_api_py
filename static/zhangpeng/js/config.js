const GameConfig = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 540,
  GROUND_Y: 440,
  GRAVITY: 0.8,
  WORLD_WIDTH: 5500,
  SAFE_ZONE_X: 5300,

  STAGES: [
    {
      name: '前段撤离',
      endX: 1800,
      difficulty: 1,
      obstacleInterval: 2500,
      powerupInterval: 6000,
      obstacleDrift: 0.3,
      autoScrollSpeed: 0.2,
      scoreRate: 1,
      overlay: { color: 'rgba(0, 0, 0, 0)', intensity: 0 },
      obstacleWeights: {
        cloth: 45,
        beam: 35,
        crate: 20,
        stone: 0,
        monkey: 0,
        horse: 0,
        bear: 0
      }
    },
    {
      name: '中段脱险',
      endX: 3600,
      difficulty: 2,
      obstacleInterval: 900,
      powerupInterval: 4500,
      obstacleDrift: 2.5,
      autoScrollSpeed: 2.0,
      scoreRate: 2,
      overlay: { color: 'rgba(255, 140, 40, 0.12)', intensity: 1 },
      obstacleWeights: {
        cloth: 10,
        beam: 10,
        crate: 20,
        stone: 25,
        monkey: 22,
        horse: 10,
        bear: 3
      }
    },
    {
      name: '末段求生',
      endX: 5500,
      difficulty: 3,
      obstacleInterval: 350,
      powerupInterval: 3000,
      obstacleDrift: 5.5,
      autoScrollSpeed: 5.0,
      scoreRate: 4,
      overlay: { color: 'rgba(255, 40, 40, 0.18)', intensity: 2 },
      obstacleWeights: {
        cloth: 2,
        beam: 3,
        crate: 8,
        stone: 30,
        monkey: 25,
        horse: 20,
        bear: 12
      }
    }
  ],

  CHARACTERS: {
    clown: {
      name: '滑稽小丑',
      desc: '灵活轻盈，下蹲移速提升',
      hp: 80,
      speed: 5.5,
      jumpPower: 14,
      crouchSpeedBonus: 2,
      damageReduction: 0.15,
      airTimeBonus: 0,
      color: '#FF6B6B',
      accent: '#FFE66D',
      hat: '#EE5A24'
    },
    trainer: {
      name: '驯兽师',
      desc: '耐力更强，基础血量更高',
      hp: 120,
      speed: 4.5,
      jumpPower: 12,
      crouchSpeedBonus: 0,
      damageReduction: 0.2,
      airTimeBonus: 0,
      color: '#74B9FF',
      accent: '#A29BFE',
      hat: '#0984E3'
    },
    acrobat: {
      name: '空中杂技员',
      desc: '跳跃力顶尖，滞空时间更长',
      hp: 70,
      speed: 5,
      jumpPower: 18,
      crouchSpeedBonus: 1,
      damageReduction: 0.1,
      airTimeBonus: 0.4,
      color: '#A29BFE',
      accent: '#FD79A8',
      hat: '#E84393'
    }
  },

  OBSTACLE_TYPES: {
    cloth: {
      name: '帐幕碎布',
      damage: 5,
      width: 50,
      height: 20,
      y: 'low',
      color: '#E17055',
      spawnWeight: 25
    },
    beam: {
      name: '木质支架',
      damage: 15,
      width: 120,
      height: 20,
      y: 'high',
      color: '#8B4513',
      spawnWeight: 18
    },
    crate: {
      name: '滚落木箱',
      damage: 20,
      width: 45,
      height: 45,
      y: 'ground',
      color: '#D4A574',
      spawnWeight: 20
    },
    stone: {
      name: '松动石块',
      damage: 25,
      width: 35,
      height: 35,
      y: 'any',
      color: '#636E72',
      spawnWeight: 15
    },
    monkey: {
      name: '失控小猴子',
      damage: 18,
      width: 40,
      height: 45,
      y: 'ground',
      color: '#A0522D',
      isAnimal: true,
      speedX: 3,
      spawnWeight: 12
    },
    horse: {
      name: '狂奔野马',
      damage: 30,
      width: 70,
      height: 55,
      y: 'ground',
      color: '#8B4513',
      isAnimal: true,
      speedX: 7,
      spawnWeight: 6
    },
    bear: {
      name: '受惊狗熊',
      damage: 35,
      width: 60,
      height: 65,
      y: 'ground',
      color: '#4A4A4A',
      isAnimal: true,
      speedX: 1.5,
      spawnWeight: 4
    }
  },

  POWERUP_TYPES: {
    heart: {
      name: '爱心补给',
      desc: '恢复25点生命值',
      width: 30,
      height: 30,
      color: '#FF4757',
      effect: 'heal',
      value: 25,
      duration: 0
    },
    speed: {
      name: '疾风跑鞋',
      desc: '移动速度翻倍，5秒',
      width: 30,
      height: 30,
      color: '#00D2D3',
      effect: 'speed',
      value: 2,
      duration: 5000
    },
    shield: {
      name: '防护披风',
      desc: '免疫所有伤害，3秒',
      width: 30,
      height: 30,
      color: '#FDCB6E',
      effect: 'shield',
      value: 1,
      duration: 3000
    },
    smoke: {
      name: '隐身烟雾',
      desc: '野兽无视玩家，4秒',
      width: 30,
      height: 30,
      color: '#B2BEC3',
      effect: 'smoke',
      value: 1,
      duration: 4000
    }
  },

  KEYS: {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    JUMP: ['ArrowUp', 'KeyW', 'Space'],
    CROUCH: ['ArrowDown', 'KeyS'],
    SPRINT: ['ShiftLeft', 'ShiftRight']
  }
};
