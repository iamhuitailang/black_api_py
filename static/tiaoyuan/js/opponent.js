var TiaoyuanOpponent = {
  _names: ['张伟', '李强', '王磊', '刘洋', '陈明', '赵鹏', '孙浩', '周涛', '吴俊', '郑宇', '冯超', '何勇'],

  createOpponents: function(mode) {
    var opponents = [];
    var levelKey = mode.opponentLevel;
    var level = TiaoyuanConfig.OPPONENT_LEVELS[levelKey];
    if (!level) return opponents;

    for (var i = 0; i < mode.opponents; i++) {
      var variance = 0.12;
      var best = level.bestDistance * (1 + (Math.random() - 0.5) * variance);
      var diff = level.difficulty * (0.92 + Math.random() * 0.16);

      opponents.push({
        id: 'opp_' + i,
        name: this._names[i % this._names.length] + (i >= this._names.length ? String(i - this._names.length + 2) : ''),
        level: level.name,
        bestDistance: Math.round(best * 100) / 100,
        difficulty: Math.round(diff * 100) / 100,
        color: level.color,
        attempts: [],
        bestAttempt: 0,
        fouls: 0
      });
    }

    opponents.sort(function(a, b) { return b.bestDistance - a.bestDistance; });
    return opponents;
  },

  simulateJump: function(opponent) {
    var base = opponent.bestDistance * (0.85 + Math.random() * 0.3);
    var foulChance = 0.06 + (1 - opponent.difficulty) * 0.12;
    var isFoul = Math.random() < foulChance;

    var dist = -1;
    if (!isFoul) {
      dist = TiaoyuanWeather.applyEffect(base);
      dist = Math.round(dist * 100) / 100;
    }

    opponent.attempts.push(dist);
    if (dist > opponent.bestAttempt) opponent.bestAttempt = dist;
    if (isFoul) opponent.fouls++;
    return dist;
  },

  catchUpAttempts: function(opponents, currentAttempt) {
    for (var i = 0; i < opponents.length; i++) {
      while (opponents[i].attempts.length < currentAttempt) {
        this.simulateJump(opponents[i]);
      }
    }
  },

  getRankings: function(opponents, playerBest) {
    var all = [];
    for (var i = 0; i < opponents.length; i++) {
      all.push({ name: opponents[i].name, isPlayer: false, best: opponents[i].bestAttempt, color: opponents[i].color });
    }
    all.push({ name: '你', isPlayer: true, best: playerBest, color: '#FFD700' });

    all.sort(function(a, b) { return b.best - a.best; });

    for (var j = 0; j < all.length; j++) {
      all[j].rank = j + 1;
    }
    return all;
  }
};
