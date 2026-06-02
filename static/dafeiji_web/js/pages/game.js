var GamePage = {
  engine: null,
  canvas: null,
  gameState: 'menu',
  score: 0,
  wave: 1,
  aircraftList: [],
  selectedAircraft: null,
  savedState: null,
  isMobile: false,
  joystick: {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
    baseX: 0,
    baseY: 0,
    radius: 50
  },
  apiBase: '/api/dafeiji',

  async render() {
    var app = document.getElementById('app');
    app.innerHTML = '<div class="game-page">' +
      '<canvas id="gameCanvas" class="game-canvas"></canvas>' +
      '<div id="gameOverlay" class="game-overlay">' +
        '<div id="menuScreen" class="game-menu">' +
          '<div class="game-title">MECHA STORM</div>' +
          '<div class="game-subtitle">Post-Apocalyptic Air Combat</div>' +
          '<div id="aircraftSelect" class="aircraft-select"></div>' +
          '<button id="btnStart" class="game-btn game-btn-primary" disabled>SELECT AIRCRAFT</button>' +
          '<button id="btnContinue" class="game-btn game-btn-secondary" style="display:none">CONTINUE</button>' +
        '</div>' +
        '<div id="pauseScreen" class="game-menu" style="display:none">' +
          '<div class="game-title">PAUSED</div>' +
          '<button id="btnResume" class="game-btn game-btn-primary">RESUME</button>' +
          '<button id="btnQuit" class="game-btn game-btn-secondary">QUIT</button>' +
        '</div>' +
        '<div id="gameOverScreen" class="game-menu" style="display:none">' +
          '<div class="game-title">MISSION FAILED</div>' +
          '<div id="gameOverStats" class="game-stats"></div>' +
          '<button id="btnRetry" class="game-btn game-btn-primary">RETRY</button>' +
          '<button id="btnMenu" class="game-btn game-btn-secondary">MENU</button>' +
        '</div>' +
      '</div>' +
      '<div id="pauseBtn" class="pause-btn" style="display:none">II</div>' +
      '<div id="joystickArea" class="joystick-area" style="display:none">' +
        '<div id="joystickBase" class="joystick-base">' +
          '<div id="joystickKnob" class="joystick-knob"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    this._injectStyles();
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.canvas = document.getElementById('gameCanvas');
    this._resizeCanvas();

    this.savedState = this._loadSavedState();
    await this._loadAircraftList();
    this._renderAircraftSelect();

    if (this.savedState) {
      document.getElementById('btnContinue').style.display = 'block';
    }

    this._bindEvents();
  },

  _injectStyles: function() {
    if (document.getElementById('gamePageStyles')) return;
    var style = document.createElement('style');
    style.id = 'gamePageStyles';
    style.textContent = '.game-page{position:relative;width:100vw;height:100vh;overflow:hidden;background:#0a0a12}' +
      '.game-canvas{display:block;width:100%;height:100%}' +
      '.game-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:10}' +
      '.game-overlay.active{pointer-events:auto;background:rgba(0,0,0,0.7)}' +
      '.game-menu{text-align:center;color:#fff;display:none;flex-direction:column;align-items:center;gap:16px;padding:30px}' +
      '.game-menu.visible{display:flex}' +
      '.game-title{font-family:monospace;font-size:32px;font-weight:bold;color:#00E5FF;text-shadow:0 0 20px rgba(0,229,255,0.5),0 0 40px rgba(0,229,255,0.3);letter-spacing:4px}' +
      '.game-subtitle{font-family:monospace;font-size:14px;color:#FF6B35;letter-spacing:2px;margin-top:-8px}' +
      '.game-btn{font-family:monospace;font-size:14px;padding:12px 32px;border:1px solid rgba(0,229,255,0.4);background:rgba(0,229,255,0.1);color:#00E5FF;cursor:pointer;letter-spacing:2px;transition:all 0.2s;min-width:200px}' +
      '.game-btn:hover{background:rgba(0,229,255,0.25);border-color:#00E5FF;box-shadow:0 0 15px rgba(0,229,255,0.3)}' +
      '.game-btn:disabled{opacity:0.3;cursor:not-allowed}' +
      '.game-btn-primary{border-color:rgba(0,229,255,0.6)}' +
      '.game-btn-secondary{border-color:rgba(255,107,53,0.4);color:#FF6B35;background:rgba(255,107,53,0.1)}' +
      '.game-btn-secondary:hover{background:rgba(255,107,53,0.25);border-color:#FF6B35;box-shadow:0 0 15px rgba(255,107,53,0.3)}' +
      '.aircraft-select{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:10px 0}' +
      '.aircraft-card{width:100px;padding:10px;border:1px solid rgba(0,229,255,0.2);background:rgba(0,229,255,0.05);cursor:pointer;transition:all 0.2s;text-align:center}' +
      '.aircraft-card:hover{border-color:rgba(0,229,255,0.5);background:rgba(0,229,255,0.1)}' +
      '.aircraft-card.selected{border-color:#00E5FF;background:rgba(0,229,255,0.2);box-shadow:0 0 15px rgba(0,229,255,0.3)}' +
      '.aircraft-name{font-family:monospace;font-size:11px;color:#00E5FF;margin-top:6px}' +
      '.aircraft-stats{font-family:monospace;font-size:9px;color:#888;margin-top:4px}' +
      '.game-stats{font-family:monospace;text-align:left;color:#aaa;font-size:13px;line-height:1.8}' +
      '.game-stats .stat-value{color:#FFD600}' +
      '.pause-btn{position:absolute;top:10px;right:10px;width:36px;height:36px;border:1px solid rgba(0,229,255,0.3);background:rgba(0,0,0,0.5);color:#00E5FF;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:15;font-family:monospace}' +
      '.joystick-area{position:absolute;bottom:40px;left:40px;z-index:15}' +
      '.joystick-base{width:100px;height:100px;border-radius:50%;border:2px solid rgba(0,229,255,0.3);background:rgba(0,229,255,0.05);display:flex;align-items:center;justify-content:center}' +
      '.joystick-knob{width:40px;height:40px;border-radius:50%;background:rgba(0,229,255,0.3);border:1px solid rgba(0,229,255,0.5);pointer-events:none;transition:none}';
    document.head.appendChild(style);
  },

  _resizeCanvas: function() {
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this._canvasW = window.innerWidth;
    this._canvasH = window.innerHeight;
  },

  _loadSavedState: function() {
    try {
      var saved = localStorage.getItem('dafeiji_game_state');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  _saveState: function(state) {
    try {
      localStorage.setItem('dafeiji_game_state', JSON.stringify(state));
    } catch (e) {}
  },

  _clearSavedState: function() {
    try {
      localStorage.removeItem('dafeiji_game_state');
    } catch (e) {}
  },

  _loadAircraftList: async function() {
    this.aircraftList = [
      { id: 'mecha_falcon', name: 'MECHA FALCON', hp: 100, speed: 5, attack: 10, defense: 2, lives: 3, weapon_level: 1, width: 48, height: 56 },
      { id: 'iron_hawk', name: 'IRON HAWK', hp: 120, speed: 4, attack: 12, defense: 4, lives: 3, weapon_level: 1, width: 52, height: 60 },
      { id: 'ghost_wasp', name: 'GHOST WASP', hp: 80, speed: 7, attack: 8, defense: 1, lives: 3, weapon_level: 2, width: 44, height: 52 }
    ];

    try {
      var response = await fetch(this.apiBase + '/aircraft/list');
      var result = await response.json();
      if (result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
        this.aircraftList = result.data.items;
      }
    } catch (e) {}
  },

  _renderAircraftSelect: function() {
    var container = document.getElementById('aircraftSelect');
    if (!container) return;
    var html = '';
    this.aircraftList.forEach(function(a, i) {
      html += '<div class="aircraft-card" data-index="' + i + '">' +
        '<canvas class="aircraft-preview" width="60" height="60" data-index="' + i + '"></canvas>' +
        '<div class="aircraft-name">' + a.name + '</div>' +
        '<div class="aircraft-stats">HP:' + a.hp + ' SPD:' + a.speed + ' ATK:' + a.attack + '</div>' +
      '</div>';
    });
    container.innerHTML = html;

    var self = this;
    container.querySelectorAll('.aircraft-card').forEach(function(card) {
      card.addEventListener('click', function() {
        container.querySelectorAll('.aircraft-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        self.selectedAircraft = self.aircraftList[parseInt(card.dataset.index)];
        document.getElementById('btnStart').disabled = false;
      });
    });

    this._drawAircraftPreviews();
  },

  _drawAircraftPreviews: function() {
    var self = this;
    document.querySelectorAll('.aircraft-preview').forEach(function(cvs) {
      var idx = parseInt(cvs.dataset.index);
      var aircraft = self.aircraftList[idx];
      if (!aircraft) return;
      var pctx = cvs.getContext('2d');
      pctx.fillStyle = '#0a0a12';
      pctx.fillRect(0, 0, 60, 60);

      var cx = 30;
      var cy = 28;
      var scale = 0.7;

      pctx.save();
      pctx.translate(cx, cy);
      pctx.scale(scale, scale);

      pctx.beginPath();
      pctx.moveTo(0, -24);
      pctx.lineTo(10, -8);
      pctx.lineTo(22, 0);
      pctx.lineTo(10, 20);
      pctx.lineTo(6, 24);
      pctx.lineTo(-6, 24);
      pctx.lineTo(-10, 20);
      pctx.lineTo(-22, 0);
      pctx.lineTo(-10, -8);
      pctx.closePath();
      var grad = pctx.createLinearGradient(-15, -24, 15, 24);
      grad.addColorStop(0, '#5a5a6a');
      grad.addColorStop(1, '#2a2a3a');
      pctx.fillStyle = grad;
      pctx.fill();
      pctx.strokeStyle = '#6a6a7a';
      pctx.lineWidth = 1;
      pctx.stroke();

      pctx.beginPath();
      pctx.moveTo(0, -18);
      pctx.lineTo(4, -6);
      pctx.lineTo(0, 6);
      pctx.lineTo(-4, -6);
      pctx.closePath();
      pctx.fillStyle = '#FF6B35';
      pctx.fill();

      pctx.shadowColor = '#00E5FF';
      pctx.shadowBlur = 6;
      pctx.beginPath();
      pctx.arc(-5, 26, 4, 0, Math.PI * 2);
      pctx.fillStyle = 'rgba(0,229,255,0.7)';
      pctx.fill();
      pctx.beginPath();
      pctx.arc(5, 26, 4, 0, Math.PI * 2);
      pctx.fill();

      pctx.restore();
    });
  },

  _bindEvents: function() {
    var self = this;

    document.getElementById('btnStart').addEventListener('click', function() {
      self._startGame();
    });

    document.getElementById('btnContinue').addEventListener('click', function() {
      self._continueGame();
    });

    document.getElementById('btnResume').addEventListener('click', function() {
      self._resumeGame();
    });

    document.getElementById('btnQuit').addEventListener('click', function() {
      self._quitToMenu();
    });

    document.getElementById('btnRetry').addEventListener('click', function() {
      self._retryGame();
    });

    document.getElementById('btnMenu').addEventListener('click', function() {
      self._quitToMenu();
    });

    document.getElementById('pauseBtn').addEventListener('click', function() {
      self._pauseGame();
    });

    window.addEventListener('resize', function() {
      if (self.canvas) {
        self._resizeCanvas();
        if (self.engine) {
          self.engine.player.canvasWidth = self._canvasW;
          self.engine.player.canvasHeight = self._canvasH;
          self.engine.enemyManager.canvasWidth = self._canvasW;
          self.engine.enemyManager.canvasHeight = self._canvasH;
          self.engine.itemManager.canvasWidth = self._canvasW;
          self.engine.itemManager.canvasHeight = self._canvasH;
          self.engine.waveController.canvasWidth = self._canvasW;
          self.engine.waveController.canvasHeight = self._canvasH;
        }
      }
    });

    window.addEventListener('beforeunload', function() {
      if (self.engine && self.engine.state === 'playing') {
        self.engine.pause();
        var state = self.engine.saveState();
        self._saveState(state);
      }
    });

    if (this.isMobile) {
      this._setupTouchControls();
    }

    document.addEventListener('visibilitychange', function() {
      if (document.hidden && self.engine && self.engine.state === 'playing') {
        self._pauseGame();
      }
    });
  },

  _setupTouchControls: function() {
    var self = this;
    var joystickArea = document.getElementById('joystickArea');
    var joystickBase = document.getElementById('joystickBase');
    var joystickKnob = document.getElementById('joystickKnob');

    joystickArea.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = joystickBase.getBoundingClientRect();
      self.joystick.active = true;
      self.joystick.baseX = rect.left + rect.width / 2;
      self.joystick.baseY = rect.top + rect.height / 2;
      self.joystick.startX = touch.clientX;
      self.joystick.startY = touch.clientY;
    }, { passive: false });

    joystickArea.addEventListener('touchmove', function(e) {
      e.preventDefault();
      if (!self.joystick.active) return;
      var touch = e.touches[0];
      var dx = touch.clientX - self.joystick.baseX;
      var dy = touch.clientY - self.joystick.baseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxDist = self.joystick.radius;

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      self.joystick.dx = dx / maxDist;
      self.joystick.dy = dy / maxDist;

      joystickKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    }, { passive: false });

    var endTouch = function() {
      self.joystick.active = false;
      self.joystick.dx = 0;
      self.joystick.dy = 0;
      joystickKnob.style.transform = 'translate(0px, 0px)';
    };

    joystickArea.addEventListener('touchend', endTouch);
    joystickArea.addEventListener('touchcancel', endTouch);
  },

  _showScreen: function(screenId) {
    var overlay = document.getElementById('gameOverlay');
    var screens = overlay.querySelectorAll('.game-menu');
    screens.forEach(function(s) { s.classList.remove('visible'); });

    if (screenId) {
      overlay.classList.add('active');
      document.getElementById(screenId).classList.add('visible');
    } else {
      overlay.classList.remove('active');
    }
  },

  _startGame: function() {
    if (!this.selectedAircraft) return;
    this._clearSavedState();

    this._resizeCanvas();
    this.engine = new DafeijiEngine(this.canvas, {
      onScoreUpdate: this._onScoreUpdate.bind(this),
      onGameOver: this._onGameOver.bind(this),
      onStateChange: this._onStateChange.bind(this),
      onAchievementUnlock: this._onAchievementUnlock.bind(this)
    });

    this.engine.setAircraft(this.selectedAircraft);
    this._showScreen(null);
    document.getElementById('pauseBtn').style.display = 'flex';
    if (this.isMobile) {
      document.getElementById('joystickArea').style.display = 'block';
    }
    this.gameState = 'playing';
    this.engine.start();
  },

  _continueGame: function() {
    if (!this.savedState) return;

    this._resizeCanvas();
    this.engine = new DafeijiEngine(this.canvas, {
      onScoreUpdate: this._onScoreUpdate.bind(this),
      onGameOver: this._onGameOver.bind(this),
      onStateChange: this._onStateChange.bind(this),
      onAchievementUnlock: this._onAchievementUnlock.bind(this)
    });

    var aircraft = this.aircraftList.find(function(a) { return a.id === this.savedState.aircraft_id; }.bind(this));
    if (aircraft) {
      this.engine.setAircraft(aircraft);
    } else {
      this.engine.setAircraft(this.aircraftList[0]);
    }

    this.engine.loadState(this.savedState);
    this._clearSavedState();

    this._showScreen(null);
    document.getElementById('pauseBtn').style.display = 'flex';
    if (this.isMobile) {
      document.getElementById('joystickArea').style.display = 'block';
    }
    this.gameState = 'playing';
    this.engine.start();
  },

  _pauseGame: function() {
    if (this.engine && this.engine.state === 'playing') {
      this.engine.pause();
      this.gameState = 'paused';
      this._showScreen('pauseScreen');
    }
  },

  _resumeGame: function() {
    if (this.engine && this.engine.state === 'paused') {
      this.engine.resume();
      this.gameState = 'playing';
      this._showScreen(null);
    }
  },

  _quitToMenu: function() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
    this._clearSavedState();
    this.gameState = 'menu';
    this.score = 0;
    this.wave = 1;
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('joystickArea').style.display = 'none';
    this._showScreen('menuScreen');
  },

  _retryGame: function() {
    if (this.engine) {
      this.engine.destroy();
    }
    this._clearSavedState();
    this._startGame();
  },

  _onScoreUpdate: function(score) {
    this.score = score;
  },

  _onGameOver: function(stats) {
    this.gameState = 'gameOver';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('joystickArea').style.display = 'none';

    var statsDiv = document.getElementById('gameOverStats');
    statsDiv.innerHTML =
      '<div>SCORE: <span class="stat-value">' + stats.score + '</span></div>' +
      '<div>WAVE: <span class="stat-value">' + stats.wave + '</span></div>' +
      '<div>ENEMIES: <span class="stat-value">' + stats.enemiesKilled + '</span></div>' +
      '<div>ITEMS: <span class="stat-value">' + stats.itemsCollected + '</span></div>' +
      '<div>TIME: <span class="stat-value">' + Math.floor(stats.playTime) + 's</span></div>';

    this._showScreen('gameOverScreen');
    this._submitScore(stats);
    this._checkAchievements(stats);
  },

  _onStateChange: function(data) {
    if (data.state === 'autosave' && data.data) {
      this._saveState(data.data);
    }
    if (data.state === 'waveChange') {
      this.wave = data.wave;
    }
  },

  _onAchievementUnlock: function(type, value) {
    this._checkAchievement(type, value);
  },

  _submitScore: async function(stats) {
    try {
      await fetch(this.apiBase + '/score/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: stats.score,
          wave: stats.wave,
          enemies_killed: stats.enemiesKilled,
          items_collected: stats.itemsCollected,
          play_time: stats.playTime,
          aircraft_id: stats.aircraftId
        })
      });
    } catch (e) {}
  },

  _checkAchievements: function(stats) {
    this._checkAchievement('score', stats.score);
    this._checkAchievement('wave', stats.wave);
    this._checkAchievement('enemies_killed', stats.enemiesKilled);
  },

  _checkAchievement: function(type, value) {
    var achievements = {
      score_1000: { type: 'score', threshold: 1000, name: 'First Blood' },
      score_5000: { type: 'score', threshold: 5000, name: 'War Veteran' },
      score_10000: { type: 'score', threshold: 10000, name: 'Ace Pilot' },
      wave_5: { type: 'wave', threshold: 5, name: 'Deep Strike' },
      wave_10: { type: 'wave', threshold: 10, name: 'Iron Will' },
      enemies_50: { type: 'enemies_killed', threshold: 50, name: 'Destroyer' },
      enemies_100: { type: 'enemies_killed', threshold: 100, name: 'Annihilator' },
      items_10: { type: 'item_collect', threshold: 10, name: 'Scavenger' },
      items_25: { type: 'item_collect', threshold: 25, name: 'Hoarder' }
    };

    var unlocked = [];
    try {
      unlocked = JSON.parse(localStorage.getItem('dafeiji_achievements') || '[]');
    } catch (e) {
      unlocked = [];
    }

    Object.keys(achievements).forEach(function(key) {
      var a = achievements[key];
      if (a.type === type && value >= a.threshold && unlocked.indexOf(key) === -1) {
        unlocked.push(key);
        try {
          fetch(this.apiBase + '/achievement/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ achievement_id: key })
          });
        } catch (e) {}
      }
    }.bind(this));

    try {
      localStorage.setItem('dafeiji_achievements', JSON.stringify(unlocked));
    } catch (e) {}
  },

  update: function() {
    if (this.engine && this.engine.state === 'playing' && this.joystick.active) {
      this.engine.movePlayer(this.joystick.dx, this.joystick.dy, 1);
    }
  }
};

var _gamePageRAF = null;
function _gamePageLoop() {
  GamePage.update();
  _gamePageRAF = requestAnimationFrame(_gamePageLoop);
}

var _origGamePageRender = GamePage.render.bind(GamePage);
GamePage.render = function() {
  _origGamePageRender().then(function() {
    if (_gamePageRAF) cancelAnimationFrame(_gamePageRAF);
    _gamePageLoop();
  });
};

window.GamePage = GamePage;
