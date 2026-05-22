const UI = {
  screens: {},
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
  },

  cacheElements() {
    this.screens = {
      mainMenu: document.getElementById('main-menu'),
      modeSelect: document.getElementById('mode-select'),
      opponentSelect: document.getElementById('opponent-select'),
      actionSelect: document.getElementById('action-select'),
      gameHud: document.getElementById('game-hud'),
      scoreScreen: document.getElementById('score-screen'),
      rankScreen: document.getElementById('rank-screen'),
      endScreen: document.getElementById('end-screen'),
      howtoScreen: document.getElementById('howto-screen'),
      pauseMenu: document.getElementById('pause-menu')
    };

    this.elements = {
      currentRound: document.getElementById('current-round'),
      actionList: document.getElementById('action-list'),
      actionDesc: document.getElementById('action-desc'),
      actionDifficulty: document.getElementById('action-difficulty'),
      hudRound: document.getElementById('hud-round'),
      hudCurrentScore: document.getElementById('hud-current-score'),
      hudTotalScore: document.getElementById('hud-total-score'),
      hudDifficulty: document.getElementById('hud-difficulty'),
      hudRank: document.getElementById('hud-rank'),
      controlHint: document.getElementById('control-hint'),
      powerFill: document.getElementById('power-fill'),
      judgeScores: document.getElementById('judge-scores'),
      avgScore: document.getElementById('avg-score'),
      diffCoef: document.getElementById('diff-coef'),
      finalScore: document.getElementById('final-score'),
      ratingText: document.getElementById('rating-text'),
      rankList: document.getElementById('rank-list'),
      endRankList: document.getElementById('end-rank-list'),
      endTitle: document.getElementById('end-title'),
      endRank: document.getElementById('end-rank'),
      endScore: document.getElementById('end-score'),
      envHint: document.getElementById('env-hint'),
      slowmoEffect: document.getElementById('slowmo-effect'),
      continueBtn: document.getElementById('btn-continue-game')
    };
  },

  bindEvents() {
    document.getElementById('btn-continue-game').addEventListener('click', () => this.onContinueGame());
    document.getElementById('btn-start').addEventListener('click', () => this.onStartClick());
    document.getElementById('btn-practice').addEventListener('click', () => this.onPracticeClick());
    document.getElementById('btn-howto').addEventListener('click', () => this.showScreen('howtoScreen'));
    
    document.getElementById('btn-prelim').addEventListener('click', () => this.onModeSelect('preliminary'));
    document.getElementById('btn-final').addEventListener('click', () => this.onModeSelect('final'));
    document.getElementById('btn-back-mode').addEventListener('click', () => this.showScreen('mainMenu'));
    
    document.querySelectorAll('.opponent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = btn.dataset.level;
        this.onOpponentSelect(level);
      });
    });
    document.getElementById('btn-back-opponent').addEventListener('click', () => this.showScreen('modeSelect'));
    
    document.getElementById('btn-next-dive').addEventListener('click', () => this.onNextDive());
    document.getElementById('btn-continue').addEventListener('click', () => this.onContinue());
    document.getElementById('btn-replay').addEventListener('click', () => this.onReplay());
    document.getElementById('btn-home').addEventListener('click', () => this.onHome());
    document.getElementById('btn-back-howto').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('btn-resume').addEventListener('click', () => this.onResume());
    document.getElementById('btn-quit').addEventListener('click', () => this.onQuit());
  },

  callbacks: {
    onStartClick: null,
    onPracticeClick: null,
    onModeSelect: null,
    onOpponentSelect: null,
    onActionSelect: null,
    onNextDive: null,
    onContinue: null,
    onReplay: null,
    onHome: null,
    onResume: null,
    onQuit: null,
    onContinueGame: null
  },

  setCallback(name, callback) {
    if (this.callbacks.hasOwnProperty(name)) {
      this.callbacks[name] = callback;
    }
  },

  onStartClick() {
    if (this.callbacks.onStartClick) {
      this.callbacks.onStartClick();
    }
  },

  onPracticeClick() {
    if (this.callbacks.onPracticeClick) {
      this.callbacks.onPracticeClick();
    }
  },

  onModeSelect(mode) {
    if (this.callbacks.onModeSelect) {
      this.callbacks.onModeSelect(mode);
    }
  },

  onOpponentSelect(level) {
    if (this.callbacks.onOpponentSelect) {
      this.callbacks.onOpponentSelect(level);
    }
  },

  onNextDive() {
    if (this.callbacks.onNextDive) {
      this.callbacks.onNextDive();
    }
  },

  onContinue() {
    if (this.callbacks.onContinue) {
      this.callbacks.onContinue();
    }
  },

  onReplay() {
    if (this.callbacks.onReplay) {
      this.callbacks.onReplay();
    }
  },

  onHome() {
    if (this.callbacks.onHome) {
      this.callbacks.onHome();
    }
  },

  onResume() {
    if (this.callbacks.onResume) {
      this.callbacks.onResume();
    }
  },

  onQuit() {
    if (this.callbacks.onQuit) {
      this.callbacks.onQuit();
    }
  },

  onContinueGame() {
    if (this.callbacks.onContinueGame) {
      this.callbacks.onContinueGame();
    }
  },

  showContinueButton(show, savedState) {
    const btn = this.elements.continueBtn;
    if (show && savedState) {
      btn.classList.remove('hidden');
      const round = savedState.currentRound || 1;
      const total = savedState.totalRounds || 6;
      const score = savedState.player ? savedState.player.totalScore.toFixed(1) : '0';
      btn.textContent = `继续比赛 (第 ${round}/${total} 跳, 总分 ${score})`;
    } else {
      btn.classList.add('hidden');
    }
  },

  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.add('hidden');
    });
    
    if (this.screens[screenName]) {
      this.screens[screenName].classList.remove('hidden');
    }
  },

  showHUD(show) {
    if (show) {
      this.screens.gameHud.classList.remove('hidden');
    } else {
      this.screens.gameHud.classList.add('hidden');
    }
  },

  updateHUD(competition) {
    this.elements.hudRound.textContent = competition.currentRound;
    this.elements.hudCurrentScore.textContent = competition.getCurrentScore();
    this.elements.hudTotalScore.textContent = competition.getTotalScore();
    this.elements.hudRank.textContent = competition.getRank();
  },

  updateDifficulty(difficulty) {
    this.elements.hudDifficulty.textContent = difficulty;
  },

  updatePowerBar(power) {
    this.elements.powerFill.style.width = `${power * 100}%`;
  },

  updateControlHint(text) {
    this.elements.controlHint.textContent = text;
  },

  renderActionList(actions, selectedId, onSelect) {
    this.elements.actionList.innerHTML = '';
    this.elements.currentRound.textContent = Competition.currentRound;
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = `action-btn${action.id === selectedId ? ' selected' : ''}`;
      btn.innerHTML = `
        <span class="action-name">${action.code}</span>
        <span class="action-detail">${action.name}</span>
      `;
      btn.addEventListener('click', () => {
        this.elements.actionDesc.textContent = `${action.code} - ${action.name}`;
        this.elements.actionDifficulty.textContent = `难度系数: ${action.difficulty}`;
        
        document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        if (onSelect) {
          onSelect(action);
        }
      });
      this.elements.actionList.appendChild(btn);
    });
  },

  showScoreScreen(scoreResult, onNext) {
    this.elements.judgeScores.innerHTML = '';
    
    scoreResult.judgeScores.forEach((score, index) => {
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      
      const scoreEl = document.createElement('div');
      scoreEl.className = 'judge-score';
      scoreEl.textContent = score.toFixed(1);
      scoreEl.style.animationDelay = `${index * 0.1}s`;
      
      const label = document.createElement('div');
      label.className = 'judge-label';
      label.textContent = `裁判${index + 1}`;
      
      container.appendChild(scoreEl);
      container.appendChild(label);
      this.elements.judgeScores.appendChild(container);
    });
    
    this.elements.avgScore.textContent = scoreResult.avgScore;
    this.elements.diffCoef.textContent = scoreResult.difficulty;
    this.elements.finalScore.textContent = scoreResult.finalScore;
    
    this.elements.ratingText.textContent = scoreResult.rating.rating;
    this.elements.ratingText.className = `rating ${scoreResult.rating.className}`;
    
    if (scoreResult.rating.className === 'perfect') {
      this.showSlowmoEffect();
    }
    
    this.showScreen('scoreScreen');
  },

  showRankScreen(rankList, onContinue) {
    this.elements.rankList.innerHTML = '';
    
    rankList.forEach(item => {
      const div = document.createElement('div');
      div.className = `rank-item${item.isCurrent ? ' current' : ''}`;
      
      if (item.rank === 1) div.classList.add('gold');
      else if (item.rank === 2) div.classList.add('silver');
      else if (item.rank === 3) div.classList.add('bronze');
      
      div.innerHTML = `
        <span class="rank-number">${item.rank}</span>
        <span class="rank-name">${item.name}</span>
        <span class="rank-score">${item.score.toFixed(1)}</span>
      `;
      
      this.elements.rankList.appendChild(div);
    });
    
    this.showScreen('rankScreen');
  },

  showEndScreen(rank, totalScore, rankList) {
    this.elements.endRank.textContent = `第 ${rank} 名`;
    this.elements.endScore.textContent = `总分: ${totalScore}`;
    
    if (rank === 1) {
      this.elements.endTitle.textContent = '🏆 冠军！';
    } else if (rank <= 3) {
      this.elements.endTitle.textContent = '🎉 恭喜获奖！';
    } else {
      this.elements.endTitle.textContent = '比赛结束';
    }
    
    this.elements.endRankList.innerHTML = '';
    rankList.forEach(item => {
      const div = document.createElement('div');
      div.className = `rank-item${item.isCurrent ? ' current' : ''}`;
      
      if (item.rank === 1) div.classList.add('gold');
      else if (item.rank === 2) div.classList.add('silver');
      else if (item.rank === 3) div.classList.add('bronze');
      
      div.innerHTML = `
        <span class="rank-number">${item.rank}</span>
        <span class="rank-name">${item.name}</span>
        <span class="rank-score">${item.score.toFixed(1)}</span>
      `;
      
      this.elements.endRankList.appendChild(div);
    });
    
    this.showScreen('endScreen');
  },

  showEnvironmentHint(environment) {
    if (environment.id !== 'indoor') {
      this.elements.envHint.textContent = `${environment.name} - ${environment.effect}`;
      this.elements.envHint.classList.remove('hidden');
      
      setTimeout(() => {
        this.elements.envHint.classList.add('hidden');
      }, 2000);
    }
  },

  showSlowmoEffect() {
    this.elements.slowmoEffect.classList.remove('hidden');
    setTimeout(() => {
      this.elements.slowmoEffect.classList.add('hidden');
    }, 1000);
  },

  showPauseMenu() {
    this.showScreen('pauseMenu');
  }
};
