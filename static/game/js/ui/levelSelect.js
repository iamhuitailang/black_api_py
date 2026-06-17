class LevelSelect {
  constructor(app) {
    this.app = app;
    this.overlay = document.getElementById('levelSelectOverlay');
    this.grid = document.getElementById('levelGrid');
    this.levels = [];
    this.unlockedLevels = [1];
    this.init();
  }

  init() {
    this.loadLevels();
  }

  async loadLevels() {
    try {
      var response = await fetch('/api/game/level/list/get');
      var result = await response.json();
      this.levels = (result.code === 0 && result.data) ? result.data : this.getDefaultLevels();
    } catch (e) {
      this.levels = this.getDefaultLevels();
    }

    this.renderLevels();
  }

  getDefaultLevels() {
    return [
      { id: 1, name: '研究站Alpha', difficulty: 1, description: '初始区域，走廊简单' },
      { id: 2, name: '研究站Beta', difficulty: 2, description: '双入口走廊，更多分支' },
      { id: 3, name: '研究站Gamma', difficulty: 3, description: '迷宫式走廊，精英异形' }
    ];
  }

  renderLevels() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    for (var i = 0; i < this.levels.length; i++) {
      var level = this.levels[i];
      var isUnlocked = this.unlockedLevels.indexOf(level.id) >= 0 || level.is_unlocked;

      var card = document.createElement('div');
      card.className = 'level-card' + (isUnlocked ? '' : ' locked');
      card.innerHTML =
        '<div class="level-card-difficulty">' +
        this.renderDifficulty(level.difficulty) +
        '</div>' +
        '<div class="level-card-name">' + level.name + '</div>' +
        '<div class="level-card-desc">' + (level.description || '') + '</div>' +
        (isUnlocked ? '' : '<div class="level-card-lock">🔒</div>');

      if (isUnlocked) {
        card.addEventListener('click', (function (id) {
          return function () {
            this.selectLevel(id);
          }.bind(this);
        }.bind(this))(level.id));
      }

      this.grid.appendChild(card);
    }
  }

  renderDifficulty(diff) {
    var stars = '';
    for (var i = 0; i < 3; i++) {
      stars += i < diff ? '★' : '☆';
    }
    return stars;
  }

  async selectLevel(levelId) {
    try {
      var response = await fetch('/api/game/level/get?level_id=' + levelId);
      var result = await response.json();
      if (result.code === 0 && result.data && result.data.map_config) {
        var mc = result.data.map_config;
        var waves = [];
        for (var w = 0; w < mc.waves.length; w++) {
          var wave = mc.waves[w];
          var enemies = [];
          for (var e = 0; e < wave.enemies.length; e++) {
            var en = wave.enemies[e];
            enemies.push({
              type: en.type,
              count: en.count,
              interval: en.spawn_interval || en.interval || 1000,
              entry: en.entry_index != null ? en.entry_index : (en.entry || 0)
            });
          }
          waves.push({ enemies: enemies, reward: wave.reward || 30 });
        }
        var levelData = {
          id: result.data.id,
          name: result.data.name,
          width: mc.width || 20,
          height: mc.height || 15,
          grid: mc.grid,
          entryPoints: mc.entry_points,
          exitPoint: mc.exit_point,
          deployNodes: mc.deploy_nodes,
          waves: waves,
          startingSamples: 200,
          startingLives: 20
        };
        this.app.startLevel(levelData);
      } else {
        var defaultLevel = this.getDefaultLevelData(levelId);
        this.app.startLevel(defaultLevel);
      }
    } catch (e) {
      var defaultLevel = this.getDefaultLevelData(levelId);
      this.app.startLevel(defaultLevel);
    }
    this.hide();
  }

  getDefaultLevelData(levelId) {
    var grid = [
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
    ];

    var deployNodes = [
      {x:1,y:1},{x:4,y:2},{x:8,y:2},{x:16,y:1},
      {x:4,y:4},{x:10,y:4},{x:1,y:6},{x:4,y:7},
      {x:8,y:6},{x:8,y:10},{x:15,y:9},{x:2,y:12}
    ];

    var waves = [
      {
        enemies: [
          {type:'normal', count:8, interval:1200, entry:0},
          {type:'normal', count:5, interval:1200, entry:1}
        ],
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
    ];

    if (levelId === 2) {
      waves = waves.concat([
        {
          enemies: [
            {type:'shell', count:8, interval:800, entry:0},
            {type:'mother', count:4, interval:2500, entry:1}
          ],
          reward: 120
        }
      ]);
    }

    if (levelId === 3) {
      waves = waves.concat([
        {
          enemies: [
            {type:'normal', count:15, interval:400, entry:0},
            {type:'acid', count:10, interval:500, entry:1},
            {type:'shell', count:8, interval:800, entry:0},
            {type:'mother', count:5, interval:2000, entry:1}
          ],
          reward: 150
        }
      ]);
    }

    return {
      id: levelId,
      name: '研发区' + ['走廊','通道','核心'][levelId - 1],
      width: 20,
      height: 15,
      grid: grid,
      entryPoints: [{x:2, y:0}, {x:17, y:0}],
      exitPoint: {x:11, y:14},
      deployNodes: deployNodes,
      waves: waves,
      startingSamples: 200,
      startingLives: 20
    };
  }

  show() {
    if (this.overlay) {
      this.overlay.classList.add('visible');
    }
    this.loadLevels();
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('visible');
    }
  }

  unlockLevel(levelId) {
    if (this.unlockedLevels.indexOf(levelId) < 0) {
      this.unlockedLevels.push(levelId);
    }
    try {
      fetch('/api/game/progress/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_levels: this.unlockedLevels })
      });
    } catch (e) {}
  }
}
