var MOCK_LEVEL = {
  id: 1,
  name: '研发区走廊',
  width: 20,
  height: 15,
  grid: [
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0]
  ],
  entryPoints: [{x:2, y:0}, {x:17, y:0}],
  exitPoint: {x:11, y:14},
  deployNodes: [
    {x:1,y:1},{x:4,y:2},{x:8,y:2},{x:16,y:1},
    {x:4,y:4},{x:10,y:4},{x:1,y:6},{x:4,y:7},
    {x:8,y:6},{x:8,y:10},{x:15,y:9},{x:2,y:12}
  ],
  waves: [
    {
      enemies: [{type:'normal', count:8, interval:1200, entry:0}, {type:'normal', count:5, interval:1200, entry:1}],
      reward: 30
    },
    {
      enemies: [
        {type:'normal', count:6, interval:1000, entry:0},
        {type:'acid', count:3, interval:1500, entry:1}
      ],
      reward: 40
    },
    {
      enemies: [
        {type:'normal', count:8, interval:800, entry:0},
        {type:'acid', count:4, interval:1200, entry:1},
        {type:'shell', count:3, interval:2000, entry:0}
      ],
      reward: 50
    },
    {
      enemies: [
        {type:'normal', count:10, interval:600, entry:0},
        {type:'shell', count:5, interval:1500, entry:1},
        {type:'mother', count:2, interval:4000, entry:0}
      ],
      reward: 80
    },
    {
      enemies: [
        {type:'acid', count:8, interval:700, entry:0},
        {type:'shell', count:6, interval:1000, entry:1},
        {type:'mother', count:3, interval:3000, entry:0}
      ],
      reward: 100
    }
  ],
  startingSamples: 200,
  startingLives: 20
};

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

    this.bindCanvasEvents();
    this.bindHUDEvents();
    this.bindOverlayEvents();
  }

  init() {
    this.levelSelect.show();
  }

  startLevel(levelData) {
    this.levelMap = new LevelMap(levelData);
    this.waveSystem = new WaveSystem(this.levelMap.waves);
    this.towers = [];
    this.enemies = [];
    this.samples = this.levelMap.startingSamples;
    this.lives = this.levelMap.startingLives;

    this.renderer.resize(this.levelMap.getCanvasWidth(), this.levelMap.getCanvasHeight());
    this.gameLoop.setState(GAME_STATE.PREP);

    this.hud.update({
      wave: 0,
      totalWaves: this.waveSystem.getTotalWaves(),
      lives: this.lives,
      samples: this.samples,
      state: GAME_STATE.PREP
    });

    if (!this.gameLoop.running) {
      this.gameLoop.start();
    }
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
      }
    };
  }

  bindOverlayEvents() {
    var self = this;

    var restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        self.hideGameOverlay();
        self.levelSelect.show();
      });
    }

    var menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        self.hideGameOverlay();
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
    }
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
