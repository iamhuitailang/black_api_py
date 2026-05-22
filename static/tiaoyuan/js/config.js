var TiaoyuanConfig = {
  WORLD: {
    groundY: 420,
    trackStartX: 0,
    trackEndX: 560,
    boardX: 540,
    boardWidth: 20,
    sandpitX: 560,
    sandpitEndX: 1000,
    worldEndX: 1400,
    scale: 60
  },

  CANVAS: {
    logicalWidth: 960,
    logicalHeight: 540
  },

  CAMERA: {
    lookAhead: 150,
    lerp: 0.12,
    minX: 0,
    maxX: 700
  },

  PHYSICS: {
    gravity: 1400,
    runAccel: 120,
    maxSpeed: 7.5,
    jumpAngle: 22 * Math.PI / 180,
    jumpVBase: 480,
    jumpVMax: 780,
    maxChargeTime: 0.22,
    foulTolerance: 0.015
  },

  MODES: [
    { id: 'training', name: '训练模式', desc: '练习起跳，不限次数', attempts: 9999, opponents: 0, unlockScore: 0 },
    { id: 'school', name: '校际赛', desc: '3次试跳，与校队选手竞争', attempts: 3, opponents: 3, opponentLevel: 'school', unlockScore: 0 },
    { id: 'national', name: '全国赛', desc: '6次试跳，与省级队竞争', attempts: 6, opponents: 5, opponentLevel: 'provincial', unlockScore: 700 },
    { id: 'olympic', name: '奥运决赛', desc: '12人决赛，6次试跳', attempts: 6, opponents: 11, opponentLevel: 'national', unlockScore: 850 }
  ],

  OPPONENT_LEVELS: {
    school:     { name: '校队',     bestDistance: 7.0,  difficulty: 0.70, color: '#4CAF50' },
    provincial: { name: '省级队',   bestDistance: 7.6,  difficulty: 0.85, color: '#2196F3' },
    national:   { name: '国家队',   bestDistance: 8.2,  difficulty: 1.00, color: '#FF9800' },
    wr:         { name: '世界纪录者', bestDistance: 8.9, difficulty: 1.30, color: '#E91E63' }
  },

  WEATHER: [
    { id: 'sunny',   name: '晴天',   effect: 1.00, probability: 0.60, icon: '☀',  color: '#FFD700' },
    { id: 'wind',    name: '顺风',   effect: 1.03, probability: 0.20, icon: '→',  color: '#4CAF50' },
    { id: 'headwind',name: '逆风',  effect: 0.97, probability: 0.15, icon: '←',  color: '#F44336' },
    { id: 'rain',    name: '雨后',   effect: 0.98, probability: 0.05, icon: '☔', color: '#607D8B' }
  ],

  SCORING: [
    { min: 8.5, score: 1000, rating: '世界级' },
    { min: 8.0, score: 900,  rating: '国家级' },
    { min: 7.5, score: 800,  rating: '省级'   },
    { min: 7.0, score: 700,  rating: '市级'   },
    { min: 0,   score: 600,  rating: '校级'   }
  ],

  RECORD_BONUS: 200,
  WORLD_RECORD: 8.95,

  POSES: [
    { id: 1, name: '挺身式', multiplier: 1.00, desc: '标准姿势' },
    { id: 2, name: '走步式', multiplier: 1.05, desc: '空中走步' },
    { id: 3, name: '蹲踞式', multiplier: 0.95, desc: '保守姿势' }
  ],

  getScore: function(distance) {
    for (var i = 0; i < this.SCORING.length; i++) {
      if (distance >= this.SCORING[i].min) return this.SCORING[i];
    }
    return this.SCORING[this.SCORING.length - 1];
  },

  getMode: function(id) {
    for (var i = 0; i < this.MODES.length; i++) {
      if (this.MODES[i].id === id) return this.MODES[i];
    }
    return this.MODES[0];
  },

  getPose: function(id) {
    for (var i = 0; i < this.POSES.length; i++) {
      if (this.POSES[i].id === id) return this.POSES[i];
    }
    return this.POSES[0];
  }
};
