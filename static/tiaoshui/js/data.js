const GameData = {
  DIVING_ACTIONS: [
    { id: 1, code: '107B', name: '向前翻腾三周半屈体', difficulty: 3.1, type: 'forward', somersault: 3.5, twist: 0, position: 'pike' },
    { id: 2, code: '207C', name: '向后翻腾三周半抱膝', difficulty: 3.3, type: 'backward', somersault: 3.5, twist: 0, position: 'tuck' },
    { id: 3, code: '307C', name: '反身翻腾三周半抱膝', difficulty: 3.4, type: 'reverse', somersault: 3.5, twist: 0, position: 'tuck' },
    { id: 4, code: '407C', name: '向内翻腾三周半抱膝', difficulty: 3.2, type: 'inward', somersault: 3.5, twist: 0, position: 'tuck' },
    { id: 5, code: '5156B', name: '向前翻腾两周半转体三周屈体', difficulty: 3.8, type: 'forward', somersault: 2.5, twist: 3, position: 'pike' },
    { id: 6, code: '5255B', name: '向后翻腾两周半转体两周半屈体', difficulty: 3.6, type: 'backward', somersault: 2.5, twist: 2.5, position: 'pike' },
    { id: 7, code: '109C', name: '向前翻腾四周半抱膝', difficulty: 4.1, type: 'forward', somersault: 4.5, twist: 0, position: 'tuck' },
    { id: 8, code: '209B', name: '向后翻腾四周半屈体', difficulty: 4.2, type: 'backward', somersault: 4.5, twist: 0, position: 'pike' },
    { id: 9, code: '5172B', name: '向前翻腾三周半转体一周屈体', difficulty: 3.6, type: 'forward', somersault: 3.5, twist: 1, position: 'pike' },
    { id: 10, code: '5353B', name: '反身翻腾两周半转体一周半屈体', difficulty: 3.5, type: 'reverse', somersault: 2.5, twist: 1.5, position: 'pike' },
    { id: 11, code: '113B', name: '向前翻腾一周半屈体', difficulty: 2.0, type: 'forward', somersault: 1.5, twist: 0, position: 'pike' },
    { id: 12, code: '213B', name: '向后翻腾一周半屈体', difficulty: 2.0, type: 'backward', somersault: 1.5, twist: 0, position: 'pike' }
  ],

  OPPONENT_LEVELS: {
    junior: { name: '少年队', avgScore: 6.5, diffMultiplier: 0.7, color: '#90CAF9' },
    provincial: { name: '省队', avgScore: 7.8, diffMultiplier: 0.85, color: '#64B5F6' },
    national: { name: '国家队', avgScore: 8.5, diffMultiplier: 1.0, color: '#42A5F5' },
    champion: { name: '奥运冠军', avgScore: 9.2, diffMultiplier: 1.3, color: '#1E88E5' }
  },

  OPPONENT_NAMES: [
    '李明', '王强', '张伟', '刘洋', '陈杰',
    '杨帆', '黄磊', '周涛', '吴浩', '郑勇',
    '孙浩', '马超', '朱峰', '胡军', '林辉',
    '郭雷', '何俊', '高翔', '罗斌', '梁宇'
  ],

  ENVIRONMENTS: [
    { id: 'indoor', name: '室内', effect: '无影响', probability: 0.7, effectValue: 0 },
    { id: 'outdoor_wind', name: '室外有风', effect: '姿态+5%', probability: 0.2, effectValue: 0.05 },
    { id: 'backlight', name: '逆光', effect: '视线干扰', probability: 0.1, effectValue: -0.08 }
  ],

  SCORE_RATINGS: [
    { min: 9.0, score: 100, rating: '完美', className: 'perfect' },
    { min: 8.0, score: 90, rating: '优秀', className: 'excellent' },
    { min: 7.0, score: 80, rating: '良好', className: 'good' },
    { min: 6.0, score: 70, rating: '一般', className: 'normal' },
    { min: 0, score: 60, rating: '失误', className: 'miss' }
  ],

  GAME_STATE: {
    MENU: 'menu',
    MODE_SELECT: 'mode_select',
    OPPONENT_SELECT: 'opponent_select',
    ACTION_SELECT: 'action_select',
    DIVING: 'diving',
    SCORING: 'scoring',
    RANK: 'rank',
    END: 'end',
    PAUSED: 'paused'
  },

  DIVE_PHASE: {
    READY: 'ready',
    JUMPING: 'jumping',
    SOMERSAULT: 'somersault',
    TWIST: 'twist',
    ENTRY: 'entry',
    COMPLETE: 'complete'
  },

  CANVAS_CONFIG: {
    width: 800,
    height: 600,
    platformHeight: 100,
    platformWidth: 60,
    waterLevel: 520,
    platformX: 400,
    platformY: 120
  },

  PHYSICS_CONFIG: {
    gravity: 0.3,
    jumpForce: 12,
    maxSomersaultSpeed: 0.15,
    maxTwistSpeed: 0.12,
    entrySpeedThreshold: 0.1
  },

  TOTAL_ROUNDS: 6,
  PRELIMINARY_COUNT: 8,
  FINAL_COUNT: 12
};
