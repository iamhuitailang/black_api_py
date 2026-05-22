const Game = {
  state: GameData.GAME_STATE.MENU,
  phase: GameData.DIVE_PHASE.READY,
  diver: null,
  currentAction: null,
  selectedAction: null,
  isRunning: false,
  isPaused: false,
  lastTime: 0,
  animationId: null,
  jumpCharging: false,
  jumpPower: 0,
  entryTimer: 0,
  entryAutoCompleteDelay: 3000,
  
  init() {
    this.diver = new Diver();
    Renderer.init();
    Input.init();
    UI.init();
    Physics.init();
    
    this.bindInputCallbacks();
    this.bindUICallbacks();
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
    
    setTimeout(() => {
      this.checkSavedState();
    }, 500);
  },
  
  bindInputCallbacks() {
    Input.setCallback('onJump', (type) => this.handleJumpInput(type));
    Input.setCallback('onSomersault', (direction) => this.handleSomersaultInput(direction));
    Input.setCallback('onTwist', (direction) => this.handleTwistInput(direction));
    Input.setCallback('onEntry', (type) => this.handleEntryInput(type));
    Input.setCallback('onActionSelect', (index) => this.handleActionSelectInput(index));
  },
  
  bindUICallbacks() {
    UI.setCallback('onStartClick', () => this.onStartClick());
    UI.setCallback('onPracticeClick', () => this.onPracticeClick());
    UI.setCallback('onModeSelect', (mode) => this.onModeSelect(mode));
    UI.setCallback('onOpponentSelect', (level) => this.onOpponentSelect(level));
    UI.setCallback('onNextDive', () => this.onNextDive());
    UI.setCallback('onContinue', () => this.onContinue());
    UI.setCallback('onReplay', () => this.onReplay());
    UI.setCallback('onHome', () => this.onHome());
    UI.setCallback('onResume', () => this.onResume());
    UI.setCallback('onQuit', () => this.onQuit());
    UI.setCallback('onContinueGame', () => this.onContinueGame());
  },
  
  checkSavedState() {
    const savedState = Storage.loadGameState();
    console.log('[Game] 检查保存的状态:', savedState ? {
      round: savedState.currentRound,
      totalRounds: savedState.totalRounds,
      hasPlayer: !!savedState.player,
      hasOpponents: !!savedState.opponents,
      opponentCount: savedState.opponents ? savedState.opponents.length : 0
    } : 'null');
    
    if (savedState && 
        savedState.currentRound && 
        typeof savedState.currentRound === 'number' &&
        savedState.currentRound > 0 &&
        savedState.currentRound <= GameData.TOTAL_ROUNDS && 
        savedState.player && 
        savedState.opponents &&
        Array.isArray(savedState.opponents) &&
        savedState.opponents.length > 0) {
      console.log('[Game] 显示继续比赛按钮');
      UI.showContinueButton(true, savedState);
    } else {
      console.log('[Game] 没有有效的保存状态，隐藏继续按钮');
      UI.showContinueButton(false);
      if (savedState) {
        Competition.clearState();
      }
    }
  },
  
  onStartClick() {
    UI.showContinueButton(false);
    UI.showScreen('modeSelect');
  },
  
  onPracticeClick() {
    UI.showContinueButton(false);
    Competition.init('preliminary', 'junior');
    this.showActionSelect();
  },
  
  onContinueGame() {
    UI.showContinueButton(false);
    if (Competition.loadState()) {
      this.showActionSelect();
    } else {
      UI.showScreen('modeSelect');
    }
  },
  
  onModeSelect(mode) {
    UI.showContinueButton(false);
    Competition.mode = mode;
    UI.showScreen('opponentSelect');
  },
  
  onOpponentSelect(level) {
    Competition.init(Competition.mode, level);
    this.showActionSelect();
  },
  
  showActionSelect() {
    this.state = GameData.GAME_STATE.ACTION_SELECT;
    this.phase = GameData.DIVE_PHASE.READY;
    this.selectedAction = null;
    this.jumpCharging = false;
    this.jumpPower = 0;
    
    Competition.saveState();
    
    UI.showScreen('actionSelect');
    UI.renderActionList(GameData.DIVING_ACTIONS, null, (action) => {
      this.selectedAction = action;
    });
    
    UI.showHUD(false);
    
    setTimeout(() => {
      this.addActionConfirmButton();
    }, 100);
  },
  
  addActionConfirmButton() {
    const actionSelect = document.getElementById('action-select');
    const existingBtn = document.getElementById('action-confirm-btn');
    if (existingBtn) existingBtn.remove();
    
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'action-confirm-btn';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.style.cssText = 'margin-top: 20px; min-width: 200px;';
    confirmBtn.textContent = '开始跳水 (回车)';
    confirmBtn.addEventListener('click', () => {
      if (this.selectedAction) {
        this.startDive();
      }
    });
    
    const menuContent = actionSelect.querySelector('.menu-content');
    if (menuContent) {
      menuContent.appendChild(confirmBtn);
    }
  },
  
  startDive() {
    if (!this.selectedAction) {
      this.selectedAction = GameData.DIVING_ACTIONS[0];
    }
    
    this.currentAction = this.selectedAction;
    this.state = GameData.GAME_STATE.DIVING;
    this.phase = GameData.DIVE_PHASE.READY;
    this.jumpCharging = false;
    this.jumpPower = 0;
    this.entryTimer = 0;
    
    this.diver.prepareForDive(this.currentAction);
    
    UI.showScreen(null);
    UI.showHUD(true);
    UI.updateHUD(Competition);
    UI.updateDifficulty(this.currentAction.difficulty);
    UI.updateControlHint('按住 [空格] 或 点击屏幕 蓄力起跳');
    
    if (Competition.environment) {
      UI.showEnvironmentHint(Competition.environment);
    }
    
    Competition.saveState();
  },
  
  handleJumpInput(type) {
    if (this.state !== GameData.GAME_STATE.DIVING) return;
    
    if (type === 'press') {
      if (this.phase === GameData.DIVE_PHASE.READY && !this.jumpCharging) {
        this.jumpCharging = true;
        this.jumpPower = 0;
        this.diver.startJumpCharge();
        this.phase = GameData.DIVE_PHASE.JUMPING;
        UI.updateControlHint('蓄力中... 松开起跳');
      } else if (this.phase === GameData.DIVE_PHASE.ENTRY) {
        this.completeDive();
      }
    }
    
    if (type === 'release') {
      if (this.phase === GameData.DIVE_PHASE.JUMPING && this.jumpCharging) {
        this.executeJump();
      }
    }
  },
  
  handleSomersaultInput(direction) {
    if (this.state !== GameData.GAME_STATE.DIVING) return;
    if (!this.diver.isInAir) return;
    
    Physics.applySomersault(this.diver, direction);
  },
  
  handleTwistInput(direction) {
    if (this.state !== GameData.GAME_STATE.DIVING) return;
    if (!this.diver.isInAir) return;
    
    if (this.diver.canTwist) {
      Physics.applyTwist(this.diver, direction);
    }
  },
  
  handleEntryInput(type) {
    if (this.state !== GameData.GAME_STATE.DIVING) return;
    
    if (this.phase === GameData.DIVE_PHASE.JUMPING && this.jumpCharging) {
      this.executeJump();
      return;
    }
    
    if (this.phase === GameData.DIVE_PHASE.ENTRY) {
      if (type === 'release') {
        this.completeDive();
      }
    }
  },
  
  handleActionSelectInput(index) {
    if (this.state !== GameData.GAME_STATE.ACTION_SELECT) return;
    
    const actions = GameData.DIVING_ACTIONS;
    if (index < actions.length) {
      this.selectedAction = actions[index];
      UI.renderActionList(actions, this.selectedAction.id, (action) => {
        this.selectedAction = action;
      });
    }
  },
  
  update(deltaTime) {
    if (!this.isRunning || this.isPaused) return;
    
    if (this.state === GameData.GAME_STATE.DIVING) {
      this.updateDiving(deltaTime);
    }
    
    if (this.diver) {
      this.diver.update();
    }
  },
  
  updateDiving(deltaTime) {
    switch (this.phase) {
      case GameData.DIVE_PHASE.JUMPING:
        if (this.jumpCharging) {
          this.jumpPower = Math.min(1, this.jumpPower + deltaTime * 0.001);
          UI.updatePowerBar(this.jumpPower);
          
          if (!Input.isKeyPressed('Space') && !Input.isTouching) {
            this.executeJump();
          }
        }
        break;
        
      case GameData.DIVE_PHASE.SOMERSAULT:
      case GameData.DIVE_PHASE.TWIST:
        if (this.diver.hasEnteredWater) {
          this.phase = GameData.DIVE_PHASE.ENTRY;
          this.entryTimer = 0;
          UI.updateControlHint('按 [空格] 或 点击 完成入水');
        }
        break;
        
      case GameData.DIVE_PHASE.ENTRY:
        this.entryTimer += deltaTime;
        if (this.entryTimer >= this.entryAutoCompleteDelay) {
          this.completeDive();
        }
        break;
    }
  },
  
  executeJump() {
    this.jumpCharging = false;
    this.diver.jumpPower = this.jumpPower;
    
    if (this.diver.executeJump()) {
      this.phase = GameData.DIVE_PHASE.SOMERSAULT;
      UI.updateControlHint('空中控制: ↑/↓ 翻腾, ←/→ 转体');
      UI.updatePowerBar(0);
    }
  },
  
  completeDive() {
    this.phase = GameData.DIVE_PHASE.COMPLETE;
    
    const entryQuality = this.diver.getEntryScore();
    const scoreResult = Competition.calculatePlayerScore(entryQuality, this.currentAction);
    
    Competition.recordPlayerScore(scoreResult);
    
    Storage.saveHighScore(parseFloat(Competition.getTotalScore()));
    
    UI.showScoreScreen(scoreResult);
  },
  
  onNextDive() {
    if (Competition.nextRound()) {
      Competition.saveState();
      this.showRankThenAction();
    } else {
      this.showEndScreen();
    }
  },
  
  showRankThenAction() {
    const rankList = Competition.getCurrentRankList();
    UI.showRankScreen(rankList);
  },
  
  onContinue() {
    this.showActionSelect();
  },
  
  showEndScreen() {
    const rank = Competition.getRank();
    const totalScore = Competition.getTotalScore();
    const rankList = Competition.getCurrentRankList();
    
    Storage.saveHighScore(parseFloat(totalScore));
    Competition.clearState();
    
    UI.showEndScreen(rank, totalScore, rankList);
    UI.showHUD(false);
    UI.showContinueButton(false);
  },
  
  onReplay() {
    Competition.clearState();
    Storage.remove('diving_game_progress');
    UI.showContinueButton(false);
    this.state = GameData.GAME_STATE.MENU;
    UI.showScreen('modeSelect');
  },
  
  onHome() {
    Competition.clearState();
    Storage.remove('diving_game_progress');
    UI.showContinueButton(false);
    this.state = GameData.GAME_STATE.MENU;
    UI.showScreen('mainMenu');
    UI.showHUD(false);
  },
  
  onResume() {
    this.isPaused = false;
    UI.showScreen(null);
    UI.showHUD(true);
  },
  
  onQuit() {
    Competition.clearState();
    Storage.remove('diving_game_progress');
    UI.showContinueButton(false);
    this.isPaused = false;
    this.state = GameData.GAME_STATE.MENU;
    UI.showScreen('mainMenu');
    UI.showHUD(false);
  },
  
  pause() {
    if (this.state === GameData.GAME_STATE.DIVING) {
      this.isPaused = true;
      UI.showPauseMenu();
    }
  },
  
  gameLoop() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    
    this.update(deltaTime);
    this.render();
    
    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
  },
  
  render() {
    const env = Competition.environment || GameData.ENVIRONMENTS[0];
    Renderer.render(this.state, this.diver, Competition, env);
  },
  
  destroy() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
};
