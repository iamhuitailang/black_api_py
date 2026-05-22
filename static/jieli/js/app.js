(function() {
  const canvas = document.getElementById('gameCanvas');
  Renderer.init(canvas);
  UI.init();
  Input.init();

  function hasSavedGame() {
    return Storage.hasSavedState();
  }

  function startNewGame(mode) {
    GameInstance.init(mode);
    UI.showScreen('gameScreen');
    setTimeout(() => {
      Renderer.resize();
      GameInstance.start();
    }, 50);
  }

  function continueGame() {
    const saved = Game.loadState();
    if (saved) {
      const wasRunning = saved.gameState !== CONFIG.GAME_STATE.PAUSED;
      Object.assign(GameInstance, saved);
      if (GameInstance.gameState === CONFIG.GAME_STATE.PAUSED) {
        GameInstance.gameState = CONFIG.GAME_STATE.RUNNING;
      }
      GameInstance.running = false;
      GameInstance.lastFrameTime = 0;
      UI.showScreen('gameScreen');
      setTimeout(() => {
        Renderer.resize();
        GameInstance.start();
      }, 100);
    } else {
      Storage.clear();
      showMenu();
    }
  }

  function showMenu() {
    GameInstance.stop();
    UI.showScreen('menuScreen');
    UI.showSavedGameButton(hasSavedGame());
  }

  function showModeSelect() {
    UI.showScreen('modeScreen');
  }

  function goBackToMenu() {
    GameInstance.stop();
    Storage.clear();
    showMenu();
  }

  UI.bindContinueSaved(() => {
    continueGame();
  });

  UI.bindStart(() => {
    showModeSelect();
  });

  UI.bindModeSelect((mode) => {
    Storage.clear();
    startNewGame(mode);
  });

  UI.bindRestart(() => {
    const mode = GameInstance.mode;
    GameInstance.stop();
    Storage.clear();
    startNewGame(mode);
  });

  UI.bindBackToMenu(goBackToMenu);

  UI.bindResume(() => {
    GameInstance.resume();
  });

  UI.bindQuit(goBackToMenu);

  Input.onHandoff(() => {
    GameInstance.onHandoff();
  });

  Input.onAccelerate(() => {
    GameInstance.onAccelerate();
  });

  Input.onPause(() => {
    if (GameInstance.gameState === CONFIG.GAME_STATE.RUNNING ||
        GameInstance.gameState === CONFIG.GAME_STATE.HANDOFF) {
      GameInstance.pause();
    } else if (GameInstance.gameState === CONFIG.GAME_STATE.PAUSED) {
      GameInstance.resume();
    }
  });

  if (hasSavedGame()) {
    const saved = Game.loadState();
    if (saved && saved.gameState !== CONFIG.GAME_STATE.FINISHED && saved.gameState !== CONFIG.GAME_STATE.MENU) {
      continueGame();
    } else {
      Storage.clear();
      showMenu();
    }
  } else {
    showMenu();
  }
})();