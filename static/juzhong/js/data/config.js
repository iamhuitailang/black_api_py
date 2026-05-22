var CONFIG = (function() {
  var opponents = [
    { id: 1, name: '新手', best: 100, difficulty: 0.7, color: '#4ecdc4' },
    { id: 2, name: '业余', best: 130, difficulty: 0.85, color: '#45b7d1' },
    { id: 3, name: '职业', best: 160, difficulty: 1.0, color: '#f9ca24' },
    { id: 4, name: '世界纪录', best: 190, difficulty: 1.3, color: '#e94560' }
  ];

  var environments = [
    { id: 1, name: '室内', effect: '无影响', probability: 1.0 }
  ];

  var scoreTable = [
    { min: 190, score: 1000, rank: '传奇', color: '#ffd700' },
    { min: 170, score: 900, rank: '大师', color: '#c0c0c0' },
    { min: 150, score: 800, rank: '专业', color: '#cd7f32' },
    { min: 130, score: 700, rank: '业余', color: '#87ceeb' },
    { min: 0, score: 600, rank: '新手', color: '#90ee90' }
  ];

  var recordBonus = 200;

  var weightStep = 2.5;

  var liftTypes = [
    { id: 'snatch', name: '抓举', phases: ['pull', 'squat', 'stand', 'lock'] },
    { id: 'cleanjerk', name: '挺举', phases: ['pull', 'squat', 'stand', 'jerk', 'dip', 'lock'] }
  ];

  var phaseConfig = {
    pull: { duration: 1.8, powerNeeded: 55, label: '提铃' },
    squat: { duration: 0.7, powerNeeded: 40, label: '下蹲' },
    stand: { duration: 0.9, powerNeeded: 35, label: '起立' },
    jerk: { duration: 0.9, powerNeeded: 50, label: '上挺' },
    dip: { duration: 0.6, powerNeeded: 30, label: '预蹲' },
    lock: { duration: 1.2, powerNeeded: 20, label: '锁定' }
  };

  var gameConfig = {
    maxAttempts: 3,
    minWeight: 60,
    maxWeight: 250,
    startWeight: 80,
    canvasWidth: 1280,
    canvasHeight: 720,
    targetFPS: 60,
    barSagFactor: 0.02,
    lockHoldTime: 1.5,
    failThreshold: 0.4
  };

  function getScoreForWeight(weight) {
    for (var i = 0; i < scoreTable.length; i++) {
      if (weight >= scoreTable[i].min) {
        return scoreTable[i];
      }
    }
    return scoreTable[scoreTable.length - 1];
  }

  function getOpponent(id) {
    for (var i = 0; i < opponents.length; i++) {
      if (opponents[i].id === id) return opponents[i];
    }
    return opponents[0];
  }

  function getLiftType(id) {
    for (var i = 0; i < liftTypes.length; i++) {
      if (liftTypes[i].id === id) return liftTypes[i];
    }
    return liftTypes[0];
  }

  return {
    opponents: opponents,
    environments: environments,
    scoreTable: scoreTable,
    recordBonus: recordBonus,
    weightStep: weightStep,
    liftTypes: liftTypes,
    phaseConfig: phaseConfig,
    gameConfig: gameConfig,
    getScoreForWeight: getScoreForWeight,
    getOpponent: getOpponent,
    getLiftType: getLiftType
  };
})();
