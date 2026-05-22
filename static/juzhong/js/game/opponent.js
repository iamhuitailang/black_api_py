var OpponentAI = (function() {
  var opponentState = {
    active: false,
    opponent: null,
    liftType: null,
    weight: 0,
    attempt: 0,
    result: null,
    attempts: [],
    bestResult: 0
  };

  function init(opponent) {
    opponentState.opponent = opponent;
    opponentState.attempts = [];
    opponentState.bestResult = 0;
  }

  function setOpponent(opponent) {
    opponentState.opponent = opponent;
  }

  function startAttempt(liftType, weight, attempt) {
    opponentState.active = true;
    opponentState.liftType = liftType;
    opponentState.weight = weight;
    opponentState.attempt = attempt;
    opponentState.result = null;
  }

  function simulate() {
    if (!opponentState.active || !opponentState.opponent) return null;

    var difficulty = opponentState.opponent.difficulty;
    var best = opponentState.opponent.best;
    var weight = opponentState.weight;

    var successChance = 0.9;
    if (weight > best) {
      var overRatio = (weight - best) / best;
      successChance -= overRatio * 2 / difficulty;
    } else {
      var underRatio = (best - weight) / best;
      successChance += underRatio * 0.3;
    }

    successChance = Math.max(0.1, Math.min(0.98, successChance * difficulty));

    var rand = Math.random();
    var success = rand < successChance;

    var result = {
      weight: weight,
      success: success,
      attempt: opponentState.attempt
    };

    opponentState.result = result;
    opponentState.attempts.push(result);
    opponentState.active = false;

    if (success) {
      opponentState.bestResult = Math.max(opponentState.bestResult, weight);
    }

    return result;
  }

  function getBestResult() {
    return opponentState.bestResult;
  }

  function getAttempts() {
    return opponentState.attempts;
  }

  function getAttempt(attempt) {
    for (var i = 0; i < opponentState.attempts.length; i++) {
      if (opponentState.attempts[i].attempt === attempt) {
        return opponentState.attempts[i];
      }
    }
    return null;
  }

  function getTotal() {
    var bestSnatch = 0;
    var bestCleanJerk = 0;
    for (var i = 0; i < opponentState.attempts.length; i++) {
      var a = opponentState.attempts[i];
      if (a.success && a.liftType === 'snatch') {
        bestSnatch = Math.max(bestSnatch, a.weight);
      } else if (a.success && a.liftType === 'cleanjerk') {
        bestCleanJerk = Math.max(bestCleanJerk, a.weight);
      }
    }
    return bestSnatch + bestCleanJerk;
  }

  function getOpponent() {
    return opponentState.opponent;
  }

  return {
    init: init,
    setOpponent: setOpponent,
    startAttempt: startAttempt,
    simulate: simulate,
    getBestResult: getBestResult,
    getAttempts: getAttempts,
    getAttempt: getAttempt,
    getTotal: getTotal,
    getOpponent: getOpponent
  };
})();
