var Tournament = (function() {
  var tournamentState = {
    active: false,
    opponent: null,
    environment: null,
    currentLiftType: null,
    currentAttempt: 1,
    playerWeight: 0,
    playerResults: {
      snatch: [],
      cleanjerk: []
    },
    opponentResults: {
      snatch: [],
      cleanjerk: []
    },
    playerBest: {
      snatch: 0,
      cleanjerk: 0
    },
    opponentBest: {
      snatch: 0,
      cleanjerk: 0
    },
    currentTurn: 'player',
    completed: false,
    winner: null,
    isRecordBroken: false
  };

  function init(opponent) {
    tournamentState.active = true;
    tournamentState.opponent = opponent;
    tournamentState.environment = CONFIG.environments[0];
    tournamentState.currentLiftType = 'snatch';
    tournamentState.currentAttempt = 1;
    tournamentState.playerWeight = Math.max(
      CONFIG.gameConfig.startWeight,
      Math.floor((opponent.best * 0.5) / CONFIG.weightStep) * CONFIG.weightStep
    );
    tournamentState.playerResults = { snatch: [], cleanjerk: [] };
    tournamentState.opponentResults = { snatch: [], cleanjerk: [] };
    tournamentState.playerBest = { snatch: 0, cleanjerk: 0 };
    tournamentState.opponentBest = { snatch: 0, cleanjerk: 0 };
    tournamentState.currentTurn = 'player';
    tournamentState.completed = false;
    tournamentState.winner = null;
    tournamentState.isRecordBroken = false;

    OpponentAI.init(opponent);
  }

  function getState() {
    return tournamentState;
  }

  function getCurrentLiftType() {
    return tournamentState.currentLiftType;
  }

  function getCurrentAttempt() {
    return tournamentState.currentAttempt;
  }

  function getPlayerWeight() {
    return tournamentState.playerWeight;
  }

  function setPlayerWeight(weight) {
    tournamentState.playerWeight = weight;
  }

  function getOpponent() {
    return tournamentState.opponent;
  }

  function getCurrentTurn() {
    return tournamentState.currentTurn;
  }

  function isActive() {
    return tournamentState.active;
  }

  function isCompleted() {
    return tournamentState.completed;
  }

  function getWinner() {
    return tournamentState.winner;
  }

  function recordPlayerResult(liftType, weight, success) {
    var result = {
      weight: weight,
      success: success,
      attempt: tournamentState.currentAttempt,
      liftType: liftType
    };
    tournamentState.playerResults[liftType].push(result);
    if (success && weight > tournamentState.playerBest[liftType]) {
      tournamentState.playerBest[liftType] = weight;
    }
  }

  function recordOpponentResult(liftType, weight, success) {
    var result = {
      weight: weight,
      success: success,
      attempt: tournamentState.currentAttempt,
      liftType: liftType
    };
    tournamentState.opponentResults[liftType].push(result);
    if (success && weight > tournamentState.opponentBest[liftType]) {
      tournamentState.opponentBest[liftType] = weight;
    }
  }

  function getPlayerTotal() {
    return tournamentState.playerBest.snatch + tournamentState.playerBest.cleanjerk;
  }

  function getOpponentTotal() {
    return tournamentState.opponentBest.snatch + tournamentState.opponentBest.cleanjerk;
  }

  function getPlayerScore() {
    var total = getPlayerTotal();
    var scoreInfo = CONFIG.getScoreForWeight(total);
    var score = scoreInfo.score;
    if (tournamentState.isRecordBroken) {
      score += CONFIG.recordBonus;
    }
    return score;
  }

  function nextTurn() {
    if (tournamentState.currentTurn === 'player') {
      tournamentState.currentTurn = 'opponent';
    } else {
      tournamentState.currentTurn = 'player';
      tournamentState.currentAttempt++;

      if (tournamentState.currentAttempt > CONFIG.gameConfig.maxAttempts) {
        if (tournamentState.currentLiftType === 'snatch') {
          tournamentState.currentLiftType = 'cleanjerk';
          tournamentState.currentAttempt = 1;
          tournamentState.playerWeight = Math.max(
            tournamentState.playerBest.snatch + CONFIG.weightStep,
            tournamentState.playerWeight + CONFIG.weightStep
          );
        } else {
          tournamentState.completed = true;
          tournamentState.active = false;
          determineWinner();
        }
      }
    }
  }

  function determineWinner() {
    var playerTotal = getPlayerTotal();
    var opponentTotal = getOpponentTotal();

    if (playerTotal > opponentTotal) {
      tournamentState.winner = 'player';
    } else if (opponentTotal > playerTotal) {
      tournamentState.winner = 'opponent';
    } else {
      var playerLightest = getLightestSuccessfulWeight(tournamentState.playerResults);
      var opponentLightest = getLightestSuccessfulWeight(tournamentState.opponentResults);
      if (playerLightest < opponentLightest) {
        tournamentState.winner = 'player';
      } else if (opponentLightest < playerLightest) {
        tournamentState.winner = 'opponent';
      } else {
        tournamentState.winner = 'draw';
      }
    }

    var records = Storage.loadRecords();
    if (playerTotal > records.bestTotal) {
      tournamentState.isRecordBroken = true;
    }
    Storage.updateRecord('total', playerTotal);
    Storage.updateRecord('snatch', tournamentState.playerBest.snatch);
    Storage.updateRecord('cleanjerk', tournamentState.playerBest.cleanjerk);

    if (tournamentState.winner === 'player' && tournamentState.opponent) {
      Storage.markOpponentBeaten(tournamentState.opponent.id);
    }
  }

  function getLightestSuccessfulWeight(results) {
    var lightest = Infinity;
    var allResults = results.snatch.concat(results.cleanjerk);
    for (var i = 0; i < allResults.length; i++) {
      if (allResults[i].success && allResults[i].weight < lightest) {
        lightest = allResults[i].weight;
      }
    }
    return lightest === Infinity ? 0 : lightest;
  }

  function getOpponentWeightForAttempt() {
    var opponent = tournamentState.opponent;
    var baseWeight = opponent.best * opponent.difficulty * 0.7;

    if (tournamentState.currentLiftType === 'cleanjerk') {
      baseWeight = opponent.best * opponent.difficulty * 0.85;
    }

    var attemptMod = (tournamentState.currentAttempt - 1) * CONFIG.weightStep * 2;
    var weight = Math.round((baseWeight + attemptMod) / CONFIG.weightStep) * CONFIG.weightStep;

    weight = Math.max(CONFIG.gameConfig.minWeight, Math.min(CONFIG.gameConfig.maxWeight, weight));
    return weight;
  }

  function restore(savedState) {
    if (!savedState) return;
    for (var key in savedState) {
      if (savedState.hasOwnProperty(key)) {
        tournamentState[key] = savedState[key];
      }
    }
    if (tournamentState.opponent) {
      OpponentAI.setOpponent(tournamentState.opponent);
    }
  }

  function isRecordBroken() {
    return tournamentState.isRecordBroken;
  }

  return {
    init: init,
    restore: restore,
    getState: getState,
    getCurrentLiftType: getCurrentLiftType,
    getCurrentAttempt: getCurrentAttempt,
    getPlayerWeight: getPlayerWeight,
    setPlayerWeight: setPlayerWeight,
    getOpponent: getOpponent,
    getCurrentTurn: getCurrentTurn,
    isActive: isActive,
    isCompleted: isCompleted,
    getWinner: getWinner,
    recordPlayerResult: recordPlayerResult,
    recordOpponentResult: recordOpponentResult,
    getPlayerTotal: getPlayerTotal,
    getOpponentTotal: getOpponentTotal,
    getPlayerScore: getPlayerScore,
    nextTurn: nextTurn,
    getOpponentWeightForAttempt: getOpponentWeightForAttempt,
    isRecordBroken: isRecordBroken
  };
})();
