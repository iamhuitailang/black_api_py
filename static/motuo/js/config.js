var CONFIG = (function () {
  var GRAVITY = 0.55;
  var GROUND_Y_RATIO = 0.78;

  var BIKES = [
    {
      id: 'light',
      name: '轻便小摩托',
      emoji: '🏍️',
      accel: 0.25,
      maxSpeed: 9,
      airControl: 0.08,
      rotationSpeed: 0.06,
      jumpPower: 14,
      weight: 0.8,
      grip: 0.92,
      color: '#ff6b6b',
      colorDark: '#c94a4a',
      style: {
        bodyType: 'scooter',
        wheelSize: 14,
        bodyLen: 55,
        bodyH: 16,
        seatH: 10,
        hasBasket: true,
        hasExhaust: false,
        riderStyle: 'casual'
      }
    },
    {
      id: 'sport',
      name: '竞速跑车',
      emoji: '🏎️',
      accel: 0.3,
      maxSpeed: 11,
      airControl: 0.05,
      rotationSpeed: 0.05,
      jumpPower: 12,
      weight: 1.2,
      grip: 0.95,
      color: '#4ecdc4',
      colorDark: '#2a9d8f',
      style: {
        bodyType: 'sport',
        wheelSize: 13,
        bodyLen: 62,
        bodyH: 18,
        seatH: 6,
        hasBasket: false,
        hasExhaust: true,
        riderStyle: 'racer'
      }
    },
    {
      id: 'dirt',
      name: '越野摩托',
      emoji: '🚜',
      accel: 0.22,
      maxSpeed: 8,
      airControl: 0.1,
      rotationSpeed: 0.07,
      jumpPower: 15,
      weight: 0.9,
      grip: 0.88,
      color: '#f4a261',
      colorDark: '#b5743c',
      style: {
        bodyType: 'dirt',
        wheelSize: 16,
        bodyLen: 58,
        bodyH: 14,
        seatH: 8,
        hasBasket: false,
        hasExhaust: true,
        riderStyle: 'offroad'
      }
    }
  ];

  var THEMES = [
    {
      id: 'city',
      name: '街头都市',
      emoji: '🏙️',
      sky: ['#1a1a3e', '#2d1b4e', '#4a2c6a'],
      ground: '#2a2a4a',
      groundLine: '#ff6b9d',
      rampColor: '#ff6b9d',
      rampDark: '#c44d7a',
      buildingColor: '#1e1e3a',
      buildingWindow: '#ffd700',
      neonColors: ['#ff6b9d', '#00ffff', '#ffd700', '#ff6b6b'],
      accent: '#ff6b9d',
      bgElements: 'city',
      obstacles: [
        { type: 'cone', color: '#ff6b6b' },
        { type: 'barrier', color: '#ffd700' },
        { type: 'oil', color: '#2a2a2a' }
      ]
    },
    {
      id: 'wild',
      name: '荒野越野',
      emoji: '🌿',
      sky: ['#87CEEB', '#98D8C8', '#B8E6B8'],
      ground: '#8B7355',
      groundLine: '#5D4037',
      rampColor: '#D2691E',
      rampDark: '#8B4513',
      buildingColor: '#228B22',
      buildingWindow: '#90EE90',
      neonColors: ['#90EE90', '#FFD700', '#FF6347'],
      accent: '#228B22',
      bgElements: 'wild',
      obstacles: [
        { type: 'rock', color: '#696969' },
        { type: 'log', color: '#8B4513' },
        { type: 'mud', color: '#5D4037' }
      ]
    },
    {
      id: 'cyber',
      name: '赛博极速',
      emoji: '💜',
      sky: ['#0a0015', '#1a0030', '#2d0052'],
      ground: '#1a0030',
      groundLine: '#ff00ff',
      rampColor: '#00ffff',
      rampDark: '#0088aa',
      buildingColor: '#150028',
      buildingWindow: '#ff00ff',
      neonColors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080'],
      accent: '#00ffff',
      bgElements: 'cyber',
      obstacles: [
        { type: 'laser', color: '#ff00ff' },
        { type: 'barrier', color: '#00ffff' },
        { type: 'glitch', color: '#ffff00' }
      ]
    }
  ];

  function genObstacles(levelId, themeId) {
    var theme = THEMES.find(function (t) { return t.id === themeId; }) || THEMES[0];
    var obs = [];
    var count, spacing, minSpacing;

    if (levelId === 'level1') {
      count = 8;
      minSpacing = 300;
    } else if (levelId === 'level2') {
      count = 14;
      minSpacing = 220;
    } else {
      count = 20;
      minSpacing = 180;
    }

    var lastX = 400;
    for (var i = 0; i < count; i++) {
      var typeIdx = Math.floor(Math.random() * theme.obstacles.length);
      var obType = theme.obstacles[typeIdx];
      var gap = minSpacing + Math.random() * 150;
      lastX += gap;
      var obHeight = 20 + Math.random() * 30;
      var obWidth = 25 + Math.random() * 25;

      if (obType.type === 'oil' || obType.type === 'mud') {
        obHeight = 8 + Math.random() * 8;
        obWidth = 50 + Math.random() * 40;
      }

      obs.push({
        x: lastX,
        type: obType.type,
        color: obType.color,
        width: obWidth,
        height: obHeight,
        hit: false
      });
    }
    return obs;
  }

  var LEVELS = [
    {
      id: 'level1',
      name: '新手试炼',
      difficulty: 1,
      ramps: [
        { x: 800, width: 120, height: 60, angle: 20 },
        { x: 1600, width: 100, height: 50, angle: 18 },
        { x: 2400, width: 140, height: 70, angle: 22 },
        { x: 3200, width: 120, height: 65, angle: 20 },
        { x: 4000, width: 150, height: 80, angle: 25 }
      ],
      obstacles: [],
      length: 4800,
      physics: {
        gravityMul: 0.55,
        frictionMul: 1.15,
        airDragMul: 1.05,
        safeLandingAngle: 1.5,
        maxSpeedMul: 0.75,
        accelMul: 0.8
      }
    },
    {
      id: 'level2',
      name: '城市狂飙',
      difficulty: 2,
      ramps: [
        { x: 550, width: 180, height: 130, angle: 40 },
        { x: 1200, width: 120, height: 80, angle: 30 },
        { x: 1900, width: 200, height: 160, angle: 48 },
        { x: 2600, width: 160, height: 110, angle: 35 },
        { x: 3400, width: 220, height: 180, angle: 52 },
        { x: 4200, width: 180, height: 140, angle: 42 },
        { x: 5100, width: 240, height: 200, angle: 58 }
      ],
      obstacles: [],
      length: 6000,
      physics: {
        gravityMul: 1.0,
        frictionMul: 0.95,
        airDragMul: 0.98,
        safeLandingAngle: 0.8,
        maxSpeedMul: 1.1,
        accelMul: 1.1
      }
    },
    {
      id: 'level3',
      name: '极限挑战',
      difficulty: 3,
      ramps: [
        { x: 400, width: 220, height: 200, angle: 65 },
        { x: 950, width: 180, height: 140, angle: 50 },
        { x: 1500, width: 250, height: 220, angle: 70 },
        { x: 2100, width: 200, height: 160, angle: 55 },
        { x: 2750, width: 280, height: 250, angle: 75 },
        { x: 3450, width: 220, height: 180, angle: 60 },
        { x: 4200, width: 300, height: 280, angle: 80 },
        { x: 5000, width: 250, height: 200, angle: 65 },
        { x: 5900, width: 320, height: 300, angle: 85 }
      ],
      obstacles: [],
      length: 7200,
      physics: {
        gravityMul: 1.6,
        frictionMul: 0.82,
        airDragMul: 0.88,
        safeLandingAngle: 0.35,
        maxSpeedMul: 1.4,
        accelMul: 1.4
      }
    }
  ];

  return {
    GRAVITY: GRAVITY,
    GROUND_Y_RATIO: GROUND_Y_RATIO,
    BIKES: BIKES,
    THEMES: THEMES,
    LEVELS: LEVELS,
    getBike: function (id) {
      return BIKES.find(function (b) { return b.id === id; }) || BIKES[0];
    },
    getTheme: function (id) {
      return THEMES.find(function (t) { return t.id === id; }) || THEMES[0];
    },
    getLevel: function (id) {
      return LEVELS.find(function (l) { return l.id === id; }) || LEVELS[0];
    },
    genObstacles: genObstacles
  };
})();
