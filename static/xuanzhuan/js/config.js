var CONFIG = (function () {

  var CHARACTERS = [
    {
      id: 'child',
      name: '萌趣孩童',
      emoji: '🧒',
      color: '#ffb450',
      stability: 70,
      moveSpeed: 4.5,
      resistPower: 0.85,
      recoverSpeed: 1.8,
      skillName: '童心闪耀',
      skillDuration: 2500,
      skillCooldown: 10000,
      description: '身形轻盈，易晃动，灵活易调整站位'
    },
    {
      id: 'youth',
      name: '健壮青年',
      emoji: '🧑',
      color: '#78b4ff',
      stability: 100,
      moveSpeed: 2.2,
      resistPower: 1.3,
      recoverSpeed: 0.9,
      skillName: '钢铁意志',
      skillDuration: 3500,
      skillCooldown: 14000,
      description: '重心沉稳，抗冲击强，移动偏迟缓'
    },
    {
      id: 'girl',
      name: '优雅少女',
      emoji: '👧',
      color: '#ff88cc',
      stability: 85,
      moveSpeed: 3.2,
      resistPower: 1.0,
      recoverSpeed: 2.8,
      skillName: '优雅回正',
      skillDuration: 2000,
      skillCooldown: 8000,
      description: '平衡天赋高，小幅偏移自动回正'
    }
  ];

  var THEMES = [
    {
      id: 'kids',
      name: '童趣乐园',
      emoji: '🎪',
      skyTop: '#87ceeb',
      skyBottom: '#b4e8f8',
      groundColor: '#c9e8a4',
      groundDark: '#7fb95a',
      platformColor: '#ffb450',
      platformEdge: '#e89a30',
      poleColor: '#c0392b',
      horseColors: ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#ff9f43', '#a55eea'],
      horseEmoji: '🎠',
      cloudColor: 'rgba(255, 255, 255, 0.9)',
      flagColors: ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff'],
      accentColor: '#ffb450',
      particleColor: '#fff176'
    },
    {
      id: 'sunset',
      name: '暮色游园',
      emoji: '🌆',
      skyTop: '#5c3d6e',
      skyBottom: '#f8c87a',
      groundColor: '#a88c5a',
      groundDark: '#6e5a3a',
      platformColor: '#c2617a',
      platformEdge: '#8e3e5a',
      poleColor: '#2d1b4e',
      horseColors: ['#f4a261', '#e9c46a', '#e76f51', '#f8c87a', '#d48fa5', '#b088c8'],
      horseEmoji: '🎠',
      cloudColor: 'rgba(255, 200, 150, 0.6)',
      flagColors: ['#f4a261', '#e9c46a', '#e76f51', '#d48fa5'],
      accentColor: '#f4a261',
      particleColor: '#ffd89b'
    },
    {
      id: 'night',
      name: '梦幻星夜',
      emoji: '✨',
      skyTop: '#0a0a1f',
      skyBottom: '#3a3a7a',
      groundColor: '#2a2a5a',
      groundDark: '#1a1a3a',
      platformColor: '#a78bfa',
      platformEdge: '#7c3aed',
      poleColor: '#4c1d95',
      horseColors: ['#a78bfa', '#818cf8', '#c084fc', '#f0abfc', '#67e8f9', '#fbbf24'],
      horseEmoji: '✨',
      cloudColor: 'rgba(167, 139, 250, 0.3)',
      flagColors: ['#a78bfa', '#818cf8', '#c084fc', '#67e8f9'],
      accentColor: '#a78bfa',
      particleColor: '#fbbf24'
    }
  ];

  var DIFFICULTY = {
    easy: {
      label: '简单',
      duration: 75,
      rotationSpeed: 0.3,
      bumpInterval: [5000, 9000],
      bumpPower: 0.6,
      windInterval: [8000, 14000],
      windPower: 0.7,
      tiltInterval: [10000, 16000],
      tiltPower: 0.6,
      aiSkill: 0.5
    },
    normal: {
      label: '普通',
      duration: 60,
      rotationSpeed: 0.5,
      bumpInterval: [4000, 7000],
      bumpPower: 0.85,
      windInterval: [6000, 10000],
      windPower: 0.9,
      tiltInterval: [7000, 12000],
      tiltPower: 0.85,
      aiSkill: 0.75
    },
    hard: {
      label: '困难',
      duration: 45,
      rotationSpeed: 0.75,
      bumpInterval: [3000, 5000],
      bumpPower: 1.1,
      windInterval: [4000, 7000],
      windPower: 1.15,
      tiltInterval: [5000, 8000],
      tiltPower: 1.1,
      aiSkill: 1.0
    }
  };

  var PLATFORM = {
    cx: 450,
    cy: 380,
    radius: 200,
    innerRadius: 170,
    width: 60,
    edgeBounce: 0.3
  };

  var EFFECTS = {
    bump: {
      name: '急速颠簸',
      icon: '💥',
      stabilityLoss: 30,
      duration: 800,
      visualClass: 'bump'
    },
    wind: {
      name: '侧方强风',
      icon: '💨',
      stabilityLoss: 10,
      duration: 1500,
      pushForce: 4.5,
      visualClass: 'wind'
    },
    tilt: {
      name: '场地倾斜',
      icon: '📐',
      stabilityLoss: 8,
      duration: 2500,
      tiltAngle: 0.15,
      visualClass: 'tilt'
    },
    rotate: {
      name: '匀速旋转',
      stabilityLoss: 2.5,
      perFrame: true
    }
  };

  var GAME = {
    canvasWidth: 900,
    canvasHeight: 600,
    maxStability: 100,
    minStability: 0,
    crouchBoost: 1.8,
    crouchMovePenalty: 0.4,
    skillInvulnerability: true,
    aiCountOptions: [2, 3, 4],
    defaultAiCount: 3,
    defaultDifficulty: 'normal',
    defaultTheme: 'kids',
    defaultCharacter: 'child',
    storageKey: 'xuanzhuan_game_save_v1'
  };

  return {
    CHARACTERS: CHARACTERS,
    THEMES: THEMES,
    DIFFICULTY: DIFFICULTY,
    PLATFORM: PLATFORM,
    EFFECTS: EFFECTS,
    GAME: GAME,
    getCharacter: function (id) {
      return CHARACTERS.find(function (c) { return c.id === id; }) || CHARACTERS[0];
    },
    getTheme: function (id) {
      return THEMES.find(function (t) { return t.id === id; }) || THEMES[0];
    },
    getDifficulty: function (id) {
      return DIFFICULTY[id] || DIFFICULTY.normal;
    }
  };

})();
