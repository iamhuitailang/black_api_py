var GAME_STATE = {
  MENU: 'menu',
  PREP: 'prep',
  COMBAT: 'combat',
  PAUSED: 'paused',
  ENDED: 'ended'
};

class GameLoop {
  constructor(app) {
    this.app = app;
    this.state = GAME_STATE.MENU;
    this.previousState = null;
    this.running = false;
    this.rafId = null;
    this.lastTime = 0;
    this.gameSpeed = 1;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  loop(timestamp) {
    if (!this.running) return;

    var rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    var dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.state === GAME_STATE.MENU || this.state === GAME_STATE.ENDED) {
      return;
    }
    if (this.state === GAME_STATE.PAUSED) return;

    var app = this.app;
    var spawned = app.waveSystem.update(dt);

    for (var i = 0; i < spawned.length; i++) {
      var item = spawned[i];
      var path = app.levelMap.getPathForEntry(item.entryIndex);
      if (path && path.length > 0) {
        var enemy = new Enemy(item.type, path);
        app.enemies.push(enemy);
      }
    }

    for (var i = 0; i < app.enemies.length; i++) {
      app.enemies[i].update(dt);
    }

    app.combatSystem.processTowers(app.towers, app.enemies, dt);

    var deathResult = app.combatSystem.processEnemyDeaths(app.enemies, app.towers);
    var killRewards = app.combatSystem.getTotalKillRewards();
    app.samples += killRewards;

    var spawnQueue = app.combatSystem.getSpawnQueue();
    for (var i = 0; i < spawnQueue.length; i++) {
      var sp = spawnQueue[i];
      var enemy = new Enemy(sp.type, sp.path);
      enemy.x = sp.x;
      enemy.y = sp.y;
      enemy.pathIndex = sp.pathIndex;
      app.enemies.push(enemy);
      app.waveSystem.enemiesAlive++;
    }

    var toRemove = [];
    for (var i = app.enemies.length - 1; i >= 0; i--) {
      var e = app.enemies[i];
      if (e.isDead()) {
        app.waveSystem.onEnemyDied();
        toRemove.push(i);
      } else if (e.hasReachedExit()) {
        app.lives--;
        app.waveSystem.onEnemyReachedExit();
        toRemove.push(i);
      }
    }

    for (var i = 0; i < toRemove.length; i++) {
      app.enemies.splice(toRemove[i], 1);
    }

    if (app.waveSystem.checkWaveComplete()) {
      var reward = app.waveSystem.getWaveReward();
      app.samples += reward;

      if (app.waveSystem.isAllWavesComplete()) {
        this.state = GAME_STATE.ENDED;
        app.onGameEnd(true);
      } else {
        this.state = GAME_STATE.PREP;
        app.onWaveComplete();
      }
    }

    if (app.lives <= 0) {
      app.lives = 0;
      this.state = GAME_STATE.ENDED;
      app.onGameEnd(false);
    }

    app.hud.update({
      wave: app.waveSystem.getCurrentWaveIndex() + 1,
      totalWaves: app.waveSystem.getTotalWaves(),
      lives: app.lives,
      samples: app.samples,
      state: this.state
    });
  }

  render() {
    if (this.state === GAME_STATE.MENU) return;
    this.app.renderer.render(this.app.levelMap, this.app.towers, this.app.enemies, []);
  }

  setState(newState) {
    if (this.state === GAME_STATE.PAUSED) {
      this.previousState = null;
    } else {
      this.previousState = this.state;
    }
    this.state = newState;
  }

  pause() {
    if (this.state !== GAME_STATE.PAUSED && this.state !== GAME_STATE.MENU && this.state !== GAME_STATE.ENDED) {
      this.previousState = this.state;
      this.state = GAME_STATE.PAUSED;
      this.app.syncPauseOverlay();
    }
  }

  resume() {
    if (this.state === GAME_STATE.PAUSED && this.previousState) {
      this.state = this.previousState;
      this.app.syncPauseOverlay();
    }
  }

  togglePause() {
    if (this.state === GAME_STATE.PAUSED) {
      this.resume();
    } else {
      this.pause();
    }
  }

  setSpeed(speed) {
    this.gameSpeed = speed;
  }
}
