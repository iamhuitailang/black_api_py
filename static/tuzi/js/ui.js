var UI = (function() {
  var screens = {};
  var highScoreEl, highLevelEl;
  var finalLevelEl, finalScoreEl, finalHighEl;
  var clearedLevelEl;
  var gameOverTitleEl;

  function init() {
    screens.start = document.getElementById('start-screen');
    screens.howto = document.getElementById('howto-screen');
    screens.gameOver = document.getElementById('game-over-screen');
    screens.levelClear = document.getElementById('level-clear-screen');
    screens.pause = document.getElementById('pause-screen');

    highScoreEl = document.getElementById('highScore');
    highLevelEl = document.getElementById('highLevel');
    finalLevelEl = document.getElementById('finalLevel');
    finalScoreEl = document.getElementById('finalScore');
    finalHighEl = document.getElementById('finalHigh');
    clearedLevelEl = document.getElementById('clearedLevel');
    gameOverTitleEl = document.getElementById('gameOverTitle');

    document.getElementById('btn-start').addEventListener('click', function() {
      hideAllScreens();
      Game.startGame(1);
    });

    document.getElementById('btn-howto').addEventListener('click', function() {
      showScreen('howto');
    });

    document.getElementById('btn-back-start').addEventListener('click', function() {
      showScreen('start');
    });

    document.getElementById('btn-retry').addEventListener('click', function() {
      hideAllScreens();
      Game.startGame(1);
    });

    document.getElementById('btn-home').addEventListener('click', function() {
      Game.goToMenu();
      showScreen('start');
      refreshHighScores();
    });

    document.getElementById('btn-next').addEventListener('click', function() {
      hideAllScreens();
      Game.nextLevel();
    });

    document.getElementById('btn-resume').addEventListener('click', function() {
      hideAllScreens();
      Game.resume();
    });

    document.getElementById('btn-quit').addEventListener('click', function() {
      Game.goToMenu();
      showScreen('start');
      refreshHighScores();
    });

    refreshHighScores();

    Game.on('stateChange', function(newState) {
      if (newState === GameConfig.GAME_STATES.GAME_OVER) {
        setTimeout(function() {
          var s = Game.getState();
          finalLevelEl.textContent = s.level;
          finalScoreEl.textContent = s.score;
          finalHighEl.textContent = Storage.getHighScore();
          if (s.score >= Storage.getHighScore() && s.score > 0) {
            gameOverTitleEl.textContent = '🎉 新纪录！';
          } else {
            gameOverTitleEl.textContent = '游戏结束';
          }
          showScreen('gameOver');
        }, 800);
      } else if (newState === GameConfig.GAME_STATES.LEVEL_CLEAR) {
        setTimeout(function() {
          var s = Game.getState();
          clearedLevelEl.textContent = s.level;
          showScreen('levelClear');
        }, 600);
      } else if (newState === GameConfig.GAME_STATES.PAUSED) {
        showScreen('pause');
      } else if (newState === GameConfig.GAME_STATES.PLAYING) {
        hideAllScreens();
      } else if (newState === GameConfig.GAME_STATES.MENU) {
        showScreen('start');
        refreshHighScores();
      }
    });

    var pauseBtn = createPauseButton();
  }

  function createPauseButton() {
    var btn = document.createElement('button');
    btn.id = 'pause-btn';
    btn.textContent = '⏸';
    btn.style.cssText = 'position:absolute;top:16px;right:16px;z-index:20;' +
      'width:44px;height:44px;border-radius:50%;border:none;' +
      'background:rgba(106,27,154,0.85);color:#fff;font-size:22px;' +
      'cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);' +
      'display:none;pointer-events:auto;';
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var s = Game.getState();
      if (s.current === GameConfig.GAME_STATES.PLAYING) {
        Game.pause();
      }
    });
    document.getElementById('ui-layer').appendChild(btn);

    Game.on('stateChange', function(newState) {
      if (newState === GameConfig.GAME_STATES.PLAYING) {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    });

    return btn;
  }

  function refreshHighScores() {
    if (highScoreEl) highScoreEl.textContent = Storage.getHighScore();
    if (highLevelEl) highLevelEl.textContent = Storage.getHighLevel();
  }

  function showScreen(name) {
    hideAllScreens();
    if (screens[name]) {
      screens[name].classList.remove('hidden');
    }
  }

  function hideAllScreens() {
    for (var key in screens) {
      if (screens[key]) {
        screens[key].classList.add('hidden');
      }
    }
  }

  return {
    init: init,
    showScreen: showScreen,
    hideAllScreens: hideAllScreens,
    refreshHighScores: refreshHighScores
  };
})();
