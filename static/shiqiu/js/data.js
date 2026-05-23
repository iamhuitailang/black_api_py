window.SIQIU = window.SIQIU || {};

SIQIU.CHARACTERS = [
  {
    id: 'striker',
    name: '神锋·阿厉',
    emoji: '⚽',
    color: '#ff5252',
    desc: '力量型射手，抽射威力强',
    stats: { power: 1.15, curve: 0.9, accuracy: 0.95 }
  },
  {
    id: 'playmaker',
    name: '艺匠·小西',
    emoji: '🎯',
    color: '#42a5f5',
    desc: '技术型射手，弧线球精准',
    stats: { power: 0.95, curve: 1.25, accuracy: 1.1 }
  },
  {
    id: 'allround',
    name: '全能·阿哲',
    emoji: '🏆',
    color: '#ffca28',
    desc: '均衡能力，适配各种招式',
    stats: { power: 1.0, curve: 1.0, accuracy: 1.0 }
  },
  {
    id: 'finisher',
    name: '冷面·马克',
    emoji: '🧊',
    color: '#8bc34a',
    desc: '稳健射手，准确度极高',
    stats: { power: 1.0, curve: 0.9, accuracy: 1.2 }
  }
];

SIQIU.STADIUMS = [
  {
    id: 'grass',
    name: '新手草坪场',
    desc: '无风环境，门将移动平缓',
    grass: '#4caf50',
    grassDark: '#388e3c',
    sky: '#87ceeb',
    wind: 0,
    friction: 0.985,
    gkSpeed: 1.0,
    gkReaction: 1.0,
    difficulty: 1
  },
  {
    id: 'outdoor',
    name: '露运动场',
    desc: '微风干扰，节奏常规',
    grass: '#66bb6a',
    grassDark: '#43a047',
    sky: '#b3e5fc',
    wind: 0.15,
    friction: 0.985,
    gkSpeed: 1.1,
    gkReaction: 1.1,
    difficulty: 2
  },
  {
    id: 'rain',
    name: '雨夜球场',
    desc: '场地湿滑，皮球易偏移',
    grass: '#2e7d32',
    grassDark: '#1b5e20',
    sky: '#263238',
    wind: 0.25,
    friction: 0.99,
    gkSpeed: 1.2,
    gkReaction: 1.15,
    difficulty: 3
  },
  {
    id: 'pro',
    name: '职业赛场',
    desc: '强风影响，门将反应迅捷',
    grass: '#43a047',
    grassDark: '#2e7d32',
    sky: '#546e7a',
    wind: 0.4,
    friction: 0.988,
    gkSpeed: 1.35,
    gkReaction: 1.3,
    difficulty: 4
  }
];

SIQIU.SHOT_TYPES = [
  {
    id: 'flat',
    name: '平射',
    key: '1',
    desc: '低平快球，直线推进',
    baseSpeed: 16,
    curve: 0,
    lift: 0,
    heightFactor: 0.1
  },
  {
    id: 'volley',
    name: '抽射',
    key: '2',
    desc: '爆发抽射，速度极快',
    baseSpeed: 22,
    curve: 0.35,
    lift: 0.25,
    heightFactor: 0.35
  },
  {
    id: 'lob',
    name: '弧线吊射',
    key: '3',
    desc: '空中弧线，绕开门将',
    baseSpeed: 13,
    curve: 1.6,
    lift: 1.3,
    heightFactor: 1.0
  }
];

SIQIU.GAME_CONFIG = {
  canvasW: 960,
  canvasH: 600,
  goalY: 80,
  goalLeft: 380,
  goalRight: 580,
  goalHeight: 140,
  goalDepth: 30,
  shoterX: 480,
  shoterY: 500,
  ballR: 10,
  maxRounds: 10,
  passScore: 60,
  baseScore: 10,
  comboMultiplierStep: 0.25,
  maxComboMultiplier: 3,
  powerChargeRate: 0.0035,
  maxPower: 1.8,
  minAngle: -60,
  maxAngle: 60
};
