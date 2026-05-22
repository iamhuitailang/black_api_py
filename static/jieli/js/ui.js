const UI = (function() {
  const elements = {};

  function init() {
    elements.menuScreen = document.getElementById('menuScreen');
    elements.modeScreen = document.getElementById('modeScreen');
    elements.gameScreen = document.getElementById('gameScreen');
    elements.resultScreen = document.getElementById('resultScreen');
    elements.pauseScreen = document.getElementById('pauseScreen');

    elements.currentLeg = document.getElementById('currentLeg');
    elements.totalTime = document.getElementById('totalTime');
    elements.handoffStatus = document.getElementById('handoffStatus');
    elements.rankDisplay = document.getElementById('rankDisplay');
    elements.scoreDisplay = document.getElementById('scoreDisplay');
    elements.weatherDisplay = document.getElementById('weatherDisplay');

    elements.handoffBtn = document.getElementById('handoffBtn');
    elements.accelBtn = document.getElementById('accelBtn');
    elements.pauseBtn = document.getElementById('pauseBtn');

    elements.finalTime = document.getElementById('finalTime');
    elements.finalScore = document.getElementById('finalScore');
    elements.finalRank = document.getElementById('finalRank');
    elements.handoffSummary = document.getElementById('handoffSummary');

    elements.modeButtons = document.querySelectorAll('.mode-btn');
    elements.startBtn = document.getElementById('startBtn');
    elements.restartBtn = document.getElementById('restartBtn');
    elements.backToMenuBtn = document.getElementById('backToMenuBtn');
    elements.resumeBtn = document.getElementById('resumeBtn');
    elements.quitBtn = document.getElementById('quitBtn');
    elements.continueSavedBtn = document.getElementById('continueSavedBtn');
  }

  function showScreen(name) {
    ['menuScreen', 'modeScreen', 'gameScreen', 'resultScreen', 'pauseScreen'].forEach(s => {
      if (elements[s]) {
        elements[s].classList.toggle('active', s === name);
      }
    });
  }

  function updateHUD(game) {
    if (elements.currentLeg) {
      elements.currentLeg.textContent = `${game.currentLeg + 1}/4 棒`;
    }
    if (elements.totalTime) {
      elements.totalTime.textContent = `${game.totalTime.toFixed(2)}s`;
    }
    if (elements.handoffStatus) {
      const last = game.handoffResults[game.handoffResults.length - 1];
      if (last) {
        elements.handoffStatus.textContent = Handoff.getResultText(last);
        elements.handoffStatus.className = `handoff-status ${last}`;
      } else {
        elements.handoffStatus.textContent = '等待交接';
        elements.handoffStatus.className = 'handoff-status';
      }
    }
    if (elements.rankDisplay) {
      const rank = calculateRank(game);
      elements.rankDisplay.textContent = rank > 0 ? `第 ${rank} 名` : '-';
    }
    if (elements.scoreDisplay) {
      elements.scoreDisplay.textContent = game.score > 0 ? `${game.score} 分` : '-';
    }
    if (elements.weatherDisplay && game.weather) {
      elements.weatherDisplay.textContent = `${game.weather.icon} ${game.weather.name}`;
    }
  }

  function calculateRank(game) {
    const player = game.playerTeam;
    if (!player) return 0;
    const playerProgress = player.getTotalProgress();
    let rank = 1;
    game.opponentTeams.forEach(team => {
      if (team.getTotalProgress() > playerProgress) rank++;
    });
    return rank;
  }

  function showResult(game) {
    if (elements.finalTime) {
      elements.finalTime.textContent = `${game.totalTime.toFixed(2)}s`;
    }
    if (elements.finalScore) {
      elements.finalScore.textContent = `${game.score} 分`;
    }
    if (elements.finalRank) {
      const rank = calculateRank(game);
      elements.finalRank.textContent = `第 ${rank} 名`;
    }
    if (elements.handoffSummary) {
      const perfect = game.handoffResults.filter(r => r === CONFIG.HANDOFF_RESULT.PERFECT).length;
      const good = game.handoffResults.filter(r => r === CONFIG.HANDOFF_RESULT.GOOD).length;
      const drop = game.handoffResults.filter(r => r === CONFIG.HANDOFF_RESULT.DROP).length;
      elements.handoffSummary.textContent = `完美:${perfect} 良好:${good} 掉棒:${drop}`;
    }
    showScreen('resultScreen');
  }

  function bindModeSelect(callback) {
    if (elements.modeButtons) {
      elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          callback(btn.dataset.mode);
        });
      });
    }
  }

  function bindStart(callback) {
    if (elements.startBtn) elements.startBtn.addEventListener('click', callback);
  }

  function bindRestart(callback) {
    if (elements.restartBtn) elements.restartBtn.addEventListener('click', callback);
  }

  function bindBackToMenu(callback) {
    if (elements.backToMenuBtn) elements.backToMenuBtn.addEventListener('click', callback);
  }

  function bindResume(callback) {
    if (elements.resumeBtn) elements.resumeBtn.addEventListener('click', callback);
  }

  function bindQuit(callback) {
    if (elements.quitBtn) elements.quitBtn.addEventListener('click', callback);
  }

  function bindContinueSaved(callback) {
    if (elements.continueSavedBtn) elements.continueSavedBtn.addEventListener('click', callback);
  }

  function showSavedGameButton(show) {
    if (elements.continueSavedBtn) {
      elements.continueSavedBtn.style.display = show ? 'block' : 'none';
    }
  }

  return {
    init, showScreen, updateHUD, showResult, bindModeSelect, bindStart, bindRestart,
    bindBackToMenu, bindResume, bindQuit, bindContinueSaved, showSavedGameButton
  };
})();