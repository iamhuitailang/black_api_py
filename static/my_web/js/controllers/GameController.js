const GameController = {
  gameState: null,
  gameLoopInterval: null,
  autoSaveInterval: null,
  isPaused: false,

  init() {
    const savedGame = StorageService.loadGame();
    
    if (savedGame) {
      this.gameState = savedGame;
      this.restoreNavigationState();
      eventBus.emit(CONSTANTS.EVENTS.UI_NOTIFICATION, {
        type: 'info',
        message: '欢迎回来，星际商人！进度已恢复。'
      });
    } else {
      this.gameState = new GameState();
      this.gameState.initialize();
      eventBus.emit(CONSTANTS.EVENTS.UI_NOTIFICATION, {
        type: 'success',
        message: '新游戏开始！祝你在银河中财源滚滚！'
      });
    }

    ThemeController.init(this.gameState.theme);
    this.startGameLoop();
    this.startAutoSave();

    window.addEventListener('beforeunload', () => {
      this.saveGame(true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveGame(true);
      }
    });

    window.addEventListener('pagehide', () => {
      this.saveGame(true);
    });

    eventBus.emit(CONSTANTS.EVENTS.GAME_START, { gameState: this.gameState });

    return this.gameState;
  },

  restoreNavigationState() {
    if (this.gameState.isNavigating && this.gameState.navigationStartTime) {
      const now = Date.now();
      const elapsed = now - this.gameState.navigationStartTime;
      
      if (elapsed >= this.gameState.navigationDuration) {
        this.gameState.completeNavigation();
      } else {
        this.gameState.navigationStartTime = now - elapsed;
      }
    }
  },

  startGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }

    this.gameLoopInterval = setInterval(() => {
      if (!this.isPaused) {
        this.gameState.tick(CONSTANTS.DAYS_PER_TICK);
        eventBus.emit(CONSTANTS.EVENTS.GAME_TICK, { gameState: this.gameState });
      }
    }, CONSTANTS.GAME_TICK_INTERVAL);
  },

  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      this.saveGame();
    }, CONSTANTS.AUTO_SAVE_INTERVAL);
  },

  saveGame(silent = false) {
    if (this.gameState) {
      this.gameState.theme = ThemeController.getCurrentTheme();
      const success = StorageService.saveGame(this.gameState);
      if (success && !silent) {
        eventBus.emit(CONSTANTS.EVENTS.UI_NOTIFICATION, {
          type: 'info',
          message: '游戏已自动保存'
        });
      }
    }
  },

  quickSave() {
    this.saveGame(true);
  },

  pauseGame() {
    this.isPaused = true;
    eventBus.emit(CONSTANTS.EVENTS.GAME_PAUSE, { paused: true });
  },

  resumeGame() {
    this.isPaused = false;
    eventBus.emit(CONSTANTS.EVENTS.GAME_PAUSE, { paused: false });
  },

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  },

  resetGame() {
    StorageService.deleteSave();
    this.gameState = new GameState();
    this.gameState.initialize();
    eventBus.emit(CONSTANTS.EVENTS.GAME_LOAD, { success: true, gameState: this.gameState });
    eventBus.emit(CONSTANTS.EVENTS.UI_NOTIFICATION, {
      type: 'info',
      message: '游戏已重置'
    });
    return this.gameState;
  },

  buyGood(goodId, quantity) {
    const result = TradeService.buyGood(this.gameState, goodId, quantity);
    if (result.success) this.quickSave();
    return result;
  },

  sellGood(goodId, quantity) {
    const result = TradeService.sellGood(this.gameState, goodId, quantity);
    if (result.success) this.quickSave();
    return result;
  },

  navigateTo(systemId) {
    const result = NavigationService.navigate(this.gameState, systemId);
    if (result) this.quickSave();
    return result;
  },

  purchaseUpgrade(type) {
    const result = UpgradeService.purchaseUpgrade(this.gameState, type);
    if (result.success) this.quickSave();
    return result;
  },

  repairShip(amount) {
    const result = UpgradeService.repairShip(this.gameState, amount);
    if (result.success) this.quickSave();
    return result;
  },

  rechargeShield(amount) {
    const result = UpgradeService.rechargeShield(this.gameState, amount);
    if (result.success) this.quickSave();
    return result;
  },

  refuel(amount) {
    const result = UpgradeService.refuel(this.gameState, amount);
    if (result.success) this.quickSave();
    return result;
  },

  startInvestment(investment) {
    const system = this.gameState.getCurrentSystem();
    const result = InvestmentService.startInvestment(this.gameState, system, investment);
    if (result.success) this.quickSave();
    return result;
  },

  resolveEvent(event, choiceIndex) {
    const result = EventService.resolveEvent(this.gameState, event, choiceIndex);
    if (result.success) this.quickSave();
    return result;
  },

  getGameState() {
    return this.gameState;
  },

  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveGame();
  }
};
