var SAVE_KEY = 'deepspace_towerdefense_save';

class App {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.gameLoop = new GameLoop(this);
    this.combatSystem = new CombatSystem();
    this.upgradeSystem = new UpgradeSystem();
    this.hud = new HUD();
    this.towerPanel = new TowerPanel(this);
    this.levelSelect = new LevelSelect(this);
    this.levelMap = null;
    this.towers = [];
    this.enemies = [];
    this.samples = 0;
    this.lives = 0;
    this.waveSystem = null;
    this.autoSaveInterval = null;
    this._isRestoring = false;

    this.bindCanvasEvents();
    this.bindHUDEvents();
    this.bindOverlayEvents();
  }

  init() {
    var globalSave = this.getGlobalSave();
    if (globalSave && globalSave.currentLevelId) {
      var levelSave = this.loadProgress(globalSave.currentLevelId);
      if (levelSave && levelSave.lives > 0) {
        this._isRestoring = true;
        this.levelSelect.selectLevel(globalSave.currentLevelId);
        return;
      }
    }
    this.levelSelect.show();
  }

  getSaveKeyForLevel(levelId) {
    return SAVE_KEY + '_level_' + levelId;
  }

  getGlobalSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY + '_global');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  setGlobalSave(data) {
    try {
      localStorage.setItem(SAVE_KEY + '_global', JSON.stringify(data));
    } catch (e) {}
  }

  _findEntryIndexForPath(path) {
    if (!this.levelMap || !path || path.length === 0) return 0;
    var startPt = path[0];
    var entries = this.levelMap.entryPoints || [];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].x === startPt.x && entries[i].y === startPt.y) {
        return i;
      }
    }
    return 0;
  }

  saveProgress() {
    if (!this.levelMap || !this.waveSystem) return;
    if (this.gameLoop.state === GAME_STATE.ENDED) return;

    try {
      var towerData = [];
      for (var i = 0; i < this.towers.length; i++) {
        var t = this.towers[i];
        towerData.push({
          type: t.type,
          gx: t.gx,
          gy: t.gy,
          level: t.level,
          totalInvested: t.totalInvested,
          acidFactor: t.acidFactor || 0,
          acidTimer: t.acidTimer || 0
        });
      }

      var enemyData = [];
      for (var j = 0; j < this.enemies.length; j++) {
        var e = this.enemies[j];
        if (e.dead || e.reachedExit) continue;
        var entryIndex = this._findEntryIndexForPath(e.path);
        enemyData.push({
          type: e.type,
          entryIndex: entryIndex,
          hp: e.hp,
          x: e.x,
          y: e.y,
          pathIndex: e.pathIndex,
          pathProgress: e.pathProgress,
          slowFactor: e.slowFactor,
          slowTimer: e.slowTimer,
          burnDps: e.burnDps,
          burnTimer: e.burnTimer,
          spawnTimer: e.spawnTimer || 0,
          spawnQueue: e.spawnQueue ? e.spawnQueue.slice() : [],
          pulsePhase: e.pulsePhase || 0,
          legPhase: e.legPhase || 0
        });
      }

      var waveState = {
        currentWaveIndex: this.waveSystem.currentWaveIndex,
        state: this.waveSystem.state,
        spawnQueue: this.waveSystem.spawnQueue ? this.waveSystem.spawnQueue.slice() : [],
        waveTimer: this.waveSystem.waveTimer || 0,
        enemiesAlive: this.waveSystem.enemiesAlive || 0
      };

      var save = {
        levelId: this.levelMap.id,
        samples: this.samples,
        lives: this.lives,
        gameLoopState: this.gameLoop.state,
        towers: towerData,
        enemies: enemyData,
        wave: waveState,
        timestamp: Date.now()
      };
      localStorage.setItem(this.getSaveKeyForLevel(this.levelMap.id), JSON.stringify(save));
      this.setGlobalSave({ currentLevelId: this.levelMap.id });
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  loadProgress(levelId) {
    try {
      var raw = localStorage.getItem(this.getSaveKeyForLevel(levelId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  clearProgress(levelId) {
    try {
      localStorage.removeItem(this.getSaveKeyForLevel(levelId));
      var gs = this.getGlobalSave();
      if (gs && gs.currentLevelId === levelId) {
        this.setGlobalSave({ currentLevelId: null });
      }
    } catch (e) {}
  }

  startLevel(levelData) {
    this.levelMap = new LevelMap(levelData);
    this.waveSystem = new WaveSystem(this.levelMap.waves);
    this.towers = [];
    this.enemies = [];
    this.samples = this.levelMap.startingSamples;
    this.lives = this.levelMap.startingLives;

    var saved = this.loadProgress(levelData.id);
    var savedGameLoopState = null;

    if (saved && saved.lives > 0) {
      this.samples = saved.samples;
      this.lives = saved.lives;
      savedGameLoopState = saved.gameLoopState;

      if (saved.towers && saved.towers.length > 0) {
        for (var i = 0; i < saved.towers.length; i++) {
          var td = saved.towers[i];
          var tower = new Tower(td.type, td.gx, td.gy);
          tower.level = td.level || 1;
          tower.totalInvested = td.totalInvested || TOWER_TYPES[td.type].cost;
          if (td.acidFactor) tower.applyAcid(td.acidFactor, td.acidTimer || 0);
          this.towers.push(tower);
        }

        for (var k = 0; k < this.towers.length; k++) {
          var tk = this.towers[k];
          this.levelMap.deployNodes = this.levelMap.deployNodes.map(function (n) {
            if (n.x === tk.gx && n.y === tk.gy) {
              return { x: n.x, y: n.y, tower: tk };
            }
            return n;
          });
        }
      }

      if (saved.wave) {
        this.waveSystem.currentWaveIndex = saved.wave.currentWaveIndex != null ? saved.wave.currentWaveIndex : -1;
        this.waveSystem.state = saved.wave.state || WAVE_STATE.WAITING;
        this.waveSystem.spawnQueue = saved.wave.spawnQueue ? saved.wave.spawnQueue.slice() : [];
        this.waveSystem.waveTimer = saved.wave.waveTimer || 0;
        this.waveSystem.enemiesAlive = saved.wave.enemiesAlive || 0;
      } else if (saved.nextWaveIndex != null && saved.nextWaveIndex >= -1) {
        this.waveSystem.currentWaveIndex = saved.nextWaveIndex;
      } else if (saved.currentWave != null && saved.currentWave >= -1) {
        this.waveSystem.currentWaveIndex = saved.currentWave;
      }

      if (saved.enemies && saved.enemies.length > 0) {
        for (var m = 0; m < saved.enemies.length; m++) {
          var ed = saved.enemies[m];
          var path = this.levelMap.getPathForEntry(ed.entryIndex);
          if (!path || path.length === 0) continue;
          var enemy = new Enemy(ed.type, path);
          enemy.hp = ed.hp;
          enemy.x = ed.x;
          enemy.y = ed.y;
          enemy.pathIndex = ed.pathIndex || 0;
          enemy.pathProgress = ed.pathProgress || 0;
          enemy.slowFactor = ed.slowFactor || 0;
          enemy.slowTimer = ed.slowTimer || 0;
          enemy.burnDps = ed.burnDps || 0;
          enemy.burnTimer = ed.burnTimer || 0;
          enemy.spawnTimer = ed.spawnTimer || 0;
          enemy.spawnQueue = ed.spawnQueue ? ed.spawnQueue.slice() : [];
          enemy.pulsePhase = ed.pulsePhase || 0;
          enemy.legPhase = ed.legPhase || 0;
          enemy.dead = false;
          enemy.reachedExit = false;
          this.enemies.push(enemy);
        }
        if (this.waveSystem.enemiesAlive < this.enemies.length) {
          this.waveSystem.enemiesAlive = this.enemies.length;
        }
      }
    }

    this.renderer.resize(this.levelMap.getCanvasWidth(), this.levelMap.getCanvasHeight());

    var initialState = GAME_STATE.PREP;
    if (savedGameLoopState === GAME_STATE.COMBAT
        && (this.waveSystem.state === WAVE_STATE.SPAWNING
            || this.waveSystem.state === WAVE_STATE.ACTIVE)
        && this.waveSystem.currentWaveIndex >= 0
        && this.waveSystem.currentWaveIndex < this.waveSystem.waves.length) {
      initialState = GAME_STATE.COMBAT;
    }
    this.gameLoop.setState(initialState);

    var displayWave = this.waveSystem.currentWaveIndex + 1;
    if (displayWave < 1) displayWave = 1;
    if (displayWave > this.waveSystem.getTotalWaves()) displayWave = this.waveSystem.getTotalWaves();

    this.hud.update({
      wave: displayWave,
      totalWaves: this.waveSystem.getTotalWaves(),
      lives: this.lives,
      samples: this.samples,
      state: initialState
    });

    if (!this.gameLoop.running) {
      this.gameLoop.start();
    }

    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    var self = this;
    this.autoSaveInterval = setInterval(function () {
      if (self.levelMap && self.waveSystem && self.gameLoop && self.gameLoop.state !== GAME_STATE.ENDED) {
        self.saveProgress();
      }
    }, 2000);

    this.towerPanel.updateTowerCardStates();
    this._isRestoring = false;
  }

  bindCanvasEvents() {
    var self = this;
    this.canvas.addEventListener('click', function (e) {
      if (!self.levelMap) return;
      var rect = self.canvas.getBoundingClientRect();
      var px = e.clientX - rect.left;
      var py = e.clientY - rect.top;
      var grid = self.levelMap.pixelToGrid(px, py);

      var node = self.levelMap.isDeployNode(grid.x, grid.y);
      if (node) {
        var existingTower = null;
        for (var i = 0; i < self.towers.length; i++) {
          if (self.towers[i].gx === grid.x && self.towers[i].gy === grid.y) {
            existingTower = self.towers[i];
            break;
          }
        }

        if (existingTower) {
          self.renderer.hoveredTower = existingTower;
          self.towerPanel.showUpgradePanel(existingTower);
          self.positionPanel('upgradePanel', existingTower.x, existingTower.y);
        } else {
          self.renderer.selectedNode = { x: grid.x, y: grid.y };
          self.towerPanel.showDeployPanel({ x: grid.x, y: grid.y });
          var nodePx = grid.x * CELL_SIZE + CELL_SIZE / 2;
          var nodePy = grid.y * CELL_SIZE + CELL_SIZE / 2;
          self.positionPanel('deployPanel', nodePx, nodePy);
        }
      } else {
        self.towerPanel.hideDeployPanel();
        self.towerPanel.hideUpgradePanel();
        self.renderer.selectedNode = null;
        self.renderer.hoveredTower = null;
      }
    });

    this.canvas.addEventListener('mousemove', function (e) {
      if (!self.levelMap) return;
      var rect = self.canvas.getBoundingClientRect();
      var px = e.clientX - rect.left;
      var py = e.clientY - rect.top;

      var found = false;
      for (var i = 0; i < self.towers.length; i++) {
        var t = self.towers[i];
        var dx = px - t.x;
        var dy = py - t.y;
        if (Math.sqrt(dx * dx + dy * dy) < 16) {
          self.renderer.hoveredTower = t;
          found = true;
          break;
        }
      }
      if (!found) {
        self.renderer.hoveredTower = null;
      }
    });
  }

  bindHUDEvents() {
    var self = this;

    this.hud.onSpeedChange = function (speed) {
      self.gameLoop.setSpeed(speed);
    };

    this.hud.onPauseToggle = function () {
      self.gameLoop.togglePause();
    };

    this.hud.onStartWave = function () {
      if (self.gameLoop.state === GAME_STATE.PREP) {
        self.gameLoop.setState(GAME_STATE.COMBAT);
        self.waveSystem.startNextWave();
        self.saveProgress();
      }
    };
  }

  bindOverlayEvents() {
    var self = this;

    var restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        self.hideGameOverlay();
        if (self.levelMap) self.clearProgress(self.levelMap.id);
        self.levelSelect.show();
      });
    }

    var menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        self.hideGameOverlay();
        if (self.levelMap) self.clearProgress(self.levelMap.id);
        self.gameLoop.stop();
        self.levelSelect.show();
      });
    }

    var pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
      var resumeBtn = document.getElementById('resumeBtn');
      if (resumeBtn) {
        resumeBtn.addEventListener('click', function () {
          self.gameLoop.resume();
          pauseOverlay.classList.remove('visible');
        });
      }
    }
  }

  onWaveComplete() {
    this.towerPanel.updateTowerCardStates();
    this.saveProgress();
    this.syncProgressToServer();
  }

  onTowerChange() {
    this.saveProgress();
  }

  onSamplesChange() {
    this.saveProgress();
  }

  onGameEnd(victory) {
    var overlay = document.getElementById('gameOverlay');
    var title = document.getElementById('overlayTitle');
    var message = document.getElementById('overlayMessage');

    if (overlay && title && message) {
      title.textContent = victory ? '研究站保卫成功' : '研究站已沦陷';
      title.style.color = victory ? '#39ff14' : '#ff1744';
      message.textContent = victory
        ? '所有异形已被消灭，剩余生命: ' + this.lives
        : '异形突破了防线，研究站失守';
      overlay.classList.add('visible');
    }

    if (victory && this.levelMap) {
      this.levelSelect.unlockLevel(this.levelMap.id + 1);
      this.clearProgress(this.levelMap.id);
    }
    if (!victory && this.levelMap) {
      this.clearProgress(this.levelMap.id);
    }
    this.syncProgressToServer();

    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  syncProgressToServer() {
    try {
      var completedLevels = [];
      try {
        var raw = localStorage.getItem('deepspace_towerdefense_save_completed');
        if (raw) completedLevels = JSON.parse(raw);
      } catch (e) {}
      fetch('/api/game/progress/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio_samples: this.samples,
          completed_levels: completedLevels,
          tower_upgrades: {}
        })
      });
    } catch (e) {}
  }

  hideGameOverlay() {
    var overlay = document.getElementById('gameOverlay');
    if (overlay) {
      overlay.classList.remove('visible');
    }
  }

  positionPanel(panelId, canvasX, canvasY) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var rect = this.canvas.getBoundingClientRect();
    var left = rect.left + canvasX + 30;
    var top = rect.top + canvasY - 40;

    if (left + 220 > window.innerWidth) {
      left = rect.left + canvasX - 230;
    }
    if (top + 200 > window.innerHeight) {
      top = window.innerHeight - 210;
    }
    if (top < 0) top = 10;

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  syncPauseOverlay() {
    var overlay = document.getElementById('pauseOverlay');
    if (!overlay) return;
    if (this.gameLoop.state === GAME_STATE.PAUSED) {
      overlay.classList.add('visible');
    } else {
      overlay.classList.remove('visible');
    }
  }
}

window.addEventListener('DOMContentLoaded', function () {
  var app = new App();
  app.init();
  window.gameApp = app;
});

window.addEventListener('beforeunload', function () {
  if (window.gameApp && window.gameApp.levelMap) {
    window.gameApp.saveProgress();
  }
});
