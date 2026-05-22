var TiaoyuanGame = {
  canvas: null,
  player: null,
  opponents: [],
  mode: null,
  phase: 'menu',
  currentAttempt: 0,
  maxAttempts: 0,
  bestDistance: 0,
  validAttempts: 0,
  rankings: [],
  lastResult: null,
  showMarker: false,
  markerDistance: 0,
  markerFoul: false,
  countdown: 3,
  _countdownTimer: null,
  _autoJumpTimer: null,
  paused: false,
  _rafId: null,
  _lastTime: 0,
  _splashDone: false,
  _saveCounter: 0,

  init: function() {
    this.canvas = document.getElementById('game-canvas');
    this._setupCanvas();

    TiaoyuanRenderer.init(this.canvas);
    TiaoyuanInput.init(this.canvas);
    TiaoyuanUI.init(this);
    TiaoyuanStorage.load();

    var self = this;
    TiaoyuanInput.on('jump', function() { self._onJump(); });
    TiaoyuanInput.on('jumpRelease', function() { self._onJumpRelease(); });
    TiaoyuanInput.on('pose', function(id) { self._onPose(id); });
    TiaoyuanInput.on('pause', function() {
      if (self.phase !== 'menu' && self.phase !== 'gameover' && !self.paused) self.pause();
    });
    TiaoyuanInput.on('tap', function() { self._onTap(); });
    TiaoyuanInput.on('swipe', function(dir) {
      if (self.player && self.player.state === 'jumping') {
        self._onPose(dir === 'left' ? 1 : 3);
      }
    });

    this._checkResume();
  },

  _setupCanvas: function() {
    var c = this.canvas;
    var logicalW = TiaoyuanConfig.CANVAS.logicalWidth;
    var logicalH = TiaoyuanConfig.CANVAS.logicalHeight;
    var dpr = window.devicePixelRatio || 1;

    c.width = logicalW * dpr;
    c.height = logicalH * dpr;

    this._logicalW = logicalW;
    this._logicalH = logicalH;
    this._dpr = dpr;
  },

  _checkResume: function() {
    var saved = TiaoyuanStorage.loadGameState();
    if (saved && saved.mode && saved.phase && saved.phase !== 'menu' && saved.phase !== 'gameover') {
      if (confirm('检测到未完成的比赛，是否继续？')) {
        this._resumeFromSave(saved);
        return;
      } else {
        TiaoyuanStorage.clearGameState();
      }
    }
    TiaoyuanUI.showModeSelect();
  },

  _resumeFromSave: function(saved) {
    this.mode = saved.mode;
    this.phase = saved.phase;
    this.currentAttempt = saved.currentAttempt || 0;
    this.maxAttempts = saved.maxAttempts || 0;
    this.bestDistance = saved.bestDistance || 0;
    this.validAttempts = saved.validAttempts || 0;
    this.rankings = saved.rankings || [];
    this.lastResult = saved.lastResult || null;

    if (saved.weather) TiaoyuanWeather.set(saved.weather);

    var modeObj = TiaoyuanConfig.getMode(this.mode);
    this.opponents = TiaoyuanOpponent.createOpponents(modeObj);
    if (saved.opponentAttempts) {
      for (var i = 0; i < this.opponents.length && i < saved.opponentAttempts.length; i++) {
        this.opponents[i].attempts = saved.opponentAttempts[i].attempts || [];
        this.opponents[i].bestAttempt = saved.opponentAttempts[i].bestAttempt || 0;
        this.opponents[i].fouls = saved.opponentAttempts[i].fouls || 0;
      }
    }

    this.player = new TiaoyuanPlayer();
    this.player.reset();
    this.showMarker = false;
    this.markerDistance = 0;
    this.markerFoul = false;

    TiaoyuanRenderer.cameraX = 0;
    TiaoyuanRenderer.sandParticles = [];

    if (this.phase === 'result' && this.lastResult) {
      TiaoyuanUI.showResult(this.lastResult, this._getState());
      this._startLoop();
    } else {
      this._startCountdown();
    }
  },

  _getState: function() {
    return {
      mode: this.mode,
      phase: this.phase,
      currentAttempt: this.currentAttempt,
      maxAttempts: this.maxAttempts,
      bestDistance: this.bestDistance,
      validAttempts: this.validAttempts,
      rankings: this.rankings,
      countdown: this.countdown
    };
  },

  _saveGame: function() {
    if (this.phase === 'gameover' || this.phase === 'menu') return;

    var oppData = [];
    for (var i = 0; i < this.opponents.length; i++) {
      oppData.push({
        attempts: this.opponents[i].attempts,
        bestAttempt: this.opponents[i].bestAttempt,
        fouls: this.opponents[i].fouls
      });
    }

    var state = {
      mode: this.mode,
      phase: this.phase,
      currentAttempt: this.currentAttempt,
      maxAttempts: this.maxAttempts,
      bestDistance: this.bestDistance,
      validAttempts: this.validAttempts,
      rankings: this.rankings,
      weather: TiaoyuanWeather.get().id,
      opponentAttempts: oppData,
      lastResult: this.lastResult,
      playerState: this.player ? {
        x: this.player.x,
        state: this.player.state,
        pose: this.player.pose
      } : null,
      showMarker: this.showMarker,
      markerDistance: this.markerDistance,
      markerFoul: this.markerFoul
    };

    TiaoyuanStorage.saveGameState(state);
    console.log('[DEBUG] Saved state:', state.phase, 'mode:', state.mode, 'attempt:', state.currentAttempt);
  },

  startGame: function(modeId) {
    this.mode = modeId;
    var m = TiaoyuanConfig.getMode(modeId);
    this.maxAttempts = m.attempts;
    this.currentAttempt = 0;
    this.bestDistance = 0;
    this.validAttempts = 0;
    this.rankings = [];
    this.opponents = TiaoyuanOpponent.createOpponents(m);

    TiaoyuanWeather.roll();
    this._newAttempt();
    TiaoyuanUI.showToast('天气: ' + TiaoyuanWeather.get().name + ' | 按空格开始助跑', 'success');
    this._startCountdown();
  },

  _newAttempt: function() {
    this.player = new TiaoyuanPlayer();
    this.player.reset();
    this.showMarker = false;
    this.markerDistance = 0;
    this.markerFoul = false;
    this._splashDone = false;
    TiaoyuanRenderer.cameraX = 0;
    TiaoyuanRenderer.sandParticles = [];
    if (this._autoJumpTimer) { clearTimeout(this._autoJumpTimer); this._autoJumpTimer = null; }
  },

  _startCountdown: function() {
    this.phase = 'countdown';
    this.countdown = 3;
    var self = this;

    if (this._countdownTimer) clearInterval(this._countdownTimer);

    this._countdownTimer = setInterval(function() {
      self.countdown--;
      if (self.countdown <= 0) {
        clearInterval(self._countdownTimer);
        self._countdownTimer = null;
        self.phase = 'ready';
      }
      TiaoyuanUI.updateHUD(self._getState());
    }, 700);

    TiaoyuanUI.updateHUD(this._getState());
    this._startLoop();
    this._saveGame();
  },

  _onJump: function() {
    if (this.paused) return;
    if (this.phase === 'ready') {
      this.phase = 'running';
      this.player.startRun();
      this._scheduleAutoJump();
      TiaoyuanUI.updateHUD(this._getState());
    } else if (this.phase === 'running') {
      if (this.player.state === 'running' || this.player.state === 'atBoard') {
        this.player.chargeJump();
      }
    }
  },

  _onJumpRelease: function() {
    if (this.paused) return;
    if (this.phase === 'running' && this.player.state === 'charging') {
      this.player.releaseJump();
      if (this._autoJumpTimer) { clearTimeout(this._autoJumpTimer); this._autoJumpTimer = null; }
    }
  },

  _onPose: function(id) {
    if (this.paused) return;
    if (this.player && this.player.state === 'jumping') {
      this.player.setPose(id);
    }
  },

  _onTap: function() {
    if (this.phase === 'ready') {
      this._onJump();
    } else if (this.phase === 'running') {
      if (this.player.state === 'running' || this.player.state === 'atBoard') {
        this.player.chargeJump();
        var self = this;
        setTimeout(function() {
          if (self.player && self.player.state === 'charging') {
            self.player.releaseJump();
          }
        }, 100);
        if (this._autoJumpTimer) { clearTimeout(this._autoJumpTimer); this._autoJumpTimer = null; }
      }
    }
  },

  _scheduleAutoJump: function() {
    var self = this;
    if (this._autoJumpTimer) clearTimeout(this._autoJumpTimer);

    var W = TiaoyuanConfig.WORLD;
    var P = TiaoyuanConfig.PHYSICS;
    var distToBoard = (W.boardX - 100) / W.scale;
    var avgSpeed = P.maxSpeed * 0.7;
    var timeToBoard = (distToBoard / avgSpeed) * 1000;

    this._autoJumpTimer = setTimeout(function() {
      if (self.phase === 'running' && (self.player.state === 'running' || self.player.state === 'atBoard')) {
        self.player.state = 'atBoard';
        self.player.chargeJump();
        setTimeout(function() {
          if (self.player && self.player.state === 'charging') {
            self.player.releaseJump();
          }
        }, 80);
      }
    }, timeToBoard);
  },

  _updateOpponents: function() {
    TiaoyuanOpponent.catchUpAttempts(this.opponents, this.currentAttempt);
    this.rankings = TiaoyuanOpponent.getRankings(this.opponents, this.bestDistance);
  },

  _onLand: function() {
    if (this._splashDone) return;
    this._splashDone = true;

    TiaoyuanRenderer.spawnSandSplash(this.player.x, this.player.y);

    var distance = this.player.getFinalDistance();
    var isFoul = this.player.isFoul;

    this.currentAttempt++;
    if (!isFoul) {
      this.validAttempts++;
      if (distance > this.bestDistance) this.bestDistance = distance;
      var si = TiaoyuanConfig.getScore(distance);
      var wr = TiaoyuanStorage.get('worldRecord') || TiaoyuanConfig.WORLD_RECORD;
      var isWR = distance > wr;
      var total = si.score + (isWR ? TiaoyuanConfig.RECORD_BONUS : 0);
      TiaoyuanStorage.updateBest(distance, total);
      if (isWR) TiaoyuanStorage.set('worldRecord', distance);
    }

    this._updateOpponents();

    this.lastResult = { distance: distance, foul: isFoul, foulDistance: this.player.foulDistance };
    this.showMarker = true;
    this.markerDistance = distance;
    this.markerFoul = isFoul;

    this._saveGame();

    var self = this;
    setTimeout(function() { self._showResultScreen(); }, 700);
  },

  _showResultScreen: function() {
    TiaoyuanUI.updateHUD(this._getState());

    if (this.currentAttempt >= this.maxAttempts) {
      this.phase = 'gameover';
      TiaoyuanStorage.clearGameState();
      TiaoyuanUI.showFinalResult(this._getState());
    } else {
      this.phase = 'result';
      TiaoyuanUI.showResult(this.lastResult, this._getState());
      this._saveGame();
    }
  },

  nextAttempt: function() {
    this._newAttempt();
    TiaoyuanWeather.roll();
    TiaoyuanUI.updateHUD(this._getState());
    TiaoyuanUI.showToast('天气: ' + TiaoyuanWeather.get().name + ' | 按空格开始助跑', 'success');
    this._startCountdown();
  },

  pause: function() {
    if (this.paused) return;
    this.paused = true;
    TiaoyuanUI.showPause();
  },

  resume: function() {
    this.paused = false;
    TiaoyuanUI._hide();
    TiaoyuanUI.updateHUD(this._getState());
  },

  restart: function() {
    if (this.mode) this.startGame(this.mode);
  },

  exitToMenu: function() {
    this.phase = 'menu';
    TiaoyuanStorage.clearGameState();
    if (this._countdownTimer) { clearInterval(this._countdownTimer); this._countdownTimer = null; }
    if (this._autoJumpTimer) { clearTimeout(this._autoJumpTimer); this._autoJumpTimer = null; }
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.player = null;
    TiaoyuanUI.showModeSelect();
  },

  _startLoop: function() {
    if (this._rafId) return;
    var self = this;
    this._lastTime = performance.now();

    function frame(time) {
      var dt = Math.min((time - self._lastTime) / 1000, 0.05);
      self._lastTime = time;

      if (!self.paused) {
        self._tick(dt);
      }
      self._render();

      self._saveCounter++;
      if (self._saveCounter >= 30) {
        self._saveCounter = 0;
        self._saveGame();
      }

      self._rafId = requestAnimationFrame(frame);
    }

    this._rafId = requestAnimationFrame(frame);
  },

  _tick: function(dt) {
    if (this.phase === 'menu' || this.phase === 'gameover' || this.phase === 'result') return;
    if (!this.player) return;

    this.player.update(dt);

    if (this.player.state === 'landed') {
      this._onLand();
    }
  },

  _render: function() {
    if (!this.player) return;
    TiaoyuanRenderer.render(
      this.player,
      this._getState(),
      this.showMarker,
      this.markerDistance,
      this.markerFoul
    );
  }
};
