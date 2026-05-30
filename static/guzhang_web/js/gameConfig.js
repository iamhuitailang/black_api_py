const GAME_CONFIG = {
  MAX_CHEER: 100,
  MAX_EMOTION: 100,
  COMBO_TIMEOUT: 2000,
  OPPONENT_ACTION_INTERVAL: 1500,
  AUDIENCE_SWITCH_INTERVAL: 3000
};

const BASIC_ACTIONS = {
  quickMove: {
    name: '轻快走位',
    cheerGain: 7,
    castTime: 40,
    recoveryTime: 140,
    range: 'close',
    key: 'J'
  },
  strongPose: {
    name: '强势定格',
    cheerGain: 13,
    castTime: 110,
    recoveryTime: 230,
    range: 'medium',
    key: 'K'
  },
  lightDance: {
    name: '轻快舞步',
    cheerGain: 6,
    castTime: 60,
    recoveryTime: 160,
    range: 'full',
    key: 'L'
  },
  explosiveMove: {
    name: '炸裂舞步',
    cheerGain: 16,
    castTime: 140,
    recoveryTime: 260,
    range: 'wide',
    key: 'U'
  }
};

const SPECIAL_SKILLS = {
  remoteSupport: {
    name: '隔空应援',
    cheerGain: 17,
    cooldown: 5000,
    effect: '远程拉拢观众人气',
    combo: ['ArrowDown', 'ArrowRight', 'action'],
    key: 'I'
  },
  stageSpotlight: {
    name: '舞台高光',
    cheerGain: 24,
    cooldown: 8000,
    effect: '短暂免干扰，强势涨观众人气',
    key: 'O'
  },
  beatJump: {
    name: '拍动连跳',
    cheerGain: 19,
    cooldown: 6000,
    effect: '多段连续叠加喝彩值',
    hits: 3,
    key: 'P'
  }
};
