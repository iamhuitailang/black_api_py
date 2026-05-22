var GameConfig = (function() {
  var config = {};

  config.HAT_TYPES = {
    RABBIT: 'rabbit',
    EMPTY: 'empty',
    FAKE: 'fake'
  };

  config.GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_CLEAR: 'level_clear',
    GAME_OVER: 'game_over'
  };

  config.HAT_STATES = {
    CLOSED: 'closed',
    OPENING: 'opening',
    OPEN: 'open',
    CLOSING: 'closing'
  };

  config.COLORS = {
    hatBody: '#6a1b9a',
    hatBodyLight: '#ab47bc',
    hatBand: '#ff80ab',
    hatBandLight: '#ff80ab',
    hatInside: '#311b92',
    rabbitBody: '#f8bbd0',
    rabbitInner: '#fce4ec',
    rabbitCheek: '#ffab91',
    fakeBody: '#9e9e9e',
    fakeInner: '#bdbdbd',
    fakeCheek: '#ce93d8',
    stageFloor: '#7b1fa2',
    stageFloorLight: '#9c27b0',
    bgTop: '#fce4ec',
    bgMid: '#f3e5f5',
    bgBottom: '#e8eaf6',
    textDark: '#4a148c',
    textLight: '#fff',
    hudBg: 'rgba(106, 27, 154, 0.85)',
    hudBorder: '#ce93d8',
    hpFull: '#e91e63',
    hpEmpty: '#f8bbd0',
    timerNormal: '#fff',
    timerWarning: '#ff5722',
    timerDanger: '#f44336',
    fogColor: 'rgba(244, 143, 177, 0.5)',
    cloudColor: '#f8bbd0',
    cloudHighlight: '#fce4ec'
  };

  config.ANIM = {
    hatFlipSpeed: 0.08,
    hatOpenDuration: 400,
    hatLiftHeight: 40,
    swapDuration: 600,
    fogFadeIn: 800,
    fogHold: 2000,
    fogFadeOut: 800,
    cloudSpawnInterval: 3000,
    rabbitBounceSpeed: 0.003,
    sparkleSpeed: 0.02
  };

  config.BASE = {
    maxHp: 3,
    rabbitCount: 2,
    hatCount: 6,
    timeLimit: 60,
    fakeCount: 1,
    swapInterval: 0,
    fogEnabled: false,
    wrongDeduct: 1,
    scorePerRabbit: 100,
    timeBonus: 50,
    levelBonus: 200
  };

  function getLevelConfig(level) {
    var cfg = {};
    var l = level - 1;

    cfg.hatCount = Math.min(6 + Math.floor(l / 2), 14);
    cfg.rabbitCount = Math.min(2 + Math.floor(l / 3), 8);
    cfg.fakeCount = Math.min(1 + Math.floor(l / 2), 6);
    cfg.timeLimit = Math.max(60 - l * 3, 25);
    cfg.swapInterval = l >= 2 ? Math.max(8000 - l * 600, 2500) : 0;
    cfg.fogEnabled = l >= 4;
    cfg.fogInterval = l >= 4 ? Math.max(12000 - l * 500, 4000) : 0;
    cfg.wrongDeduct = Math.min(1 + Math.floor(l / 4), 3);
    cfg.scorePerRabbit = config.BASE.scorePerRabbit + l * 20;
    cfg.timeBonus = config.BASE.timeBonus + l * 10;
    cfg.levelBonus = config.BASE.levelBonus + l * 50;

    return cfg;
  }

  function getDifficultyLabel(level) {
    if (level <= 2) return '简单';
    if (level <= 5) return '普通';
    if (level <= 8) return '困难';
    return '地狱';
  }

  return {
    HAT_TYPES: config.HAT_TYPES,
    GAME_STATES: config.GAME_STATES,
    HAT_STATES: config.HAT_STATES,
    COLORS: config.COLORS,
    ANIM: config.ANIM,
    BASE: config.BASE,
    getLevelConfig: getLevelConfig,
    getDifficultyLabel: getDifficultyLabel
  };
})();
