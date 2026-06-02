class DafeijiEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {};

    this.state = 'idle';
    this.score = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.itemsCollected = 0;
    this.playTime = 0;
    this.aircraftId = null;

    this.player = new DafeijiPlayer(canvas.width, canvas.height);
    this.enemyManager = new DafeijiEnemyManager(canvas.width, canvas.height);
    this.bulletManager = new DafeijiBulletManager();
    this.itemManager = new DafeijiItemManager(canvas.width, canvas.height);
    this.renderer = new DafeijiRenderer(canvas);
    this.waveController = new DafeijiWaveController(canvas.width, canvas.height);

    this.waveController.onStateChange = this._onWaveStateChange.bind(this);

    this.starLayers = this._createStarfield();
    this.keys = {};
    this.autoFire = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDt = 1;
    this.animFrameId = null;

    this.autoSaveInterval = 600;
    this.autoSaveTimer = 0;

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
  }

  _createStarfield() {
    let layers = [];
    let configs = [
      { count: 60, speed: 0.3, size: 1, brightness: 0.3, debris: 2 },
      { count: 40, speed: 0.7, size: 1.5, brightness: 0.5, debris: 1 },
      { count: 20, speed: 1.2, size: 2, brightness: 0.8, debris: 0 }
    ];

    configs.forEach(function(cfg) {
      let stars = [];
      for (let i = 0; i < cfg.count; i++) {
        stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: cfg.size + Math.random() * 0.5,
          brightness: cfg.brightness + Math.random() * 0.2
        });
      }

      let debris = [];
      for (let i = 0; i < cfg.debris; i++) {
        debris.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: 3 + Math.random() * 6,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.01,
          opacity: 0.15 + Math.random() * 0.15,
          speed: cfg.speed * 0.8
        });
      }

      layers.push({ stars: stars, speed: cfg.speed, debris: debris });
    }.bind(this));

    return layers;
  }

  _updateStarfield(dt) {
    this.starLayers.forEach(function(layer) {
      layer.stars.forEach(function(star) {
        star.y += layer.speed * dt;
        if (star.y > this.canvas.height) {
          star.y = 0;
          star.x = Math.random() * this.canvas.width;
        }
      }.bind(this));

      if (layer.debris) {
        layer.debris.forEach(function(d) {
          d.y += d.speed * dt;
          d.rotation += d.rotSpeed * dt;
          if (d.y > this.canvas.height + 10) {
            d.y = -10;
            d.x = Math.random() * this.canvas.width;
          }
        });
      }
    }.bind(this));
  }

  setAircraft(aircraftData) {
    this.player.setAircraft(aircraftData);
    this.aircraftId = aircraftData ? aircraftData.id : null;
    this.player.resetPosition();
  }

  start() {
    if (this.state === 'playing') return;

    this.state = 'playing';
    this.player.resetPosition();

    let waveConfig = this.waveController.startWave(this.wave);
    this.renderer.showWaveAnnouncement(this.wave, waveConfig.name);

    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);

    this.lastTime = performance.now();
    this._gameLoop(this.lastTime);

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ state: this.state, wave: this.wave, score: this.score });
    }
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ state: this.state, wave: this.wave, score: this.score });
    }
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTime = performance.now();
    this._gameLoop(this.lastTime);
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ state: this.state, wave: this.wave, score: this.score });
    }
  }

  reset() {
    this.state = 'idle';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.score = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.itemsCollected = 0;
    this.playTime = 0;
    this.autoSaveTimer = 0;

    this.player = new DafeijiPlayer(this.canvas.width, this.canvas.height);
    this.enemyManager.clear();
    this.bulletManager.clear();
    this.itemManager.clear();
    this.waveController.reset();

    this.starLayers = this._createStarfield();

    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);

    this.ctx.fillStyle = '#0a0a12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.reset();
    this.renderer.explosions = [];
    this.renderer.scorePopups = [];
    this.renderer.collectionFlashes = [];
    this.renderer.engineTrailParticles = [];
  }

  _onKeyDown(e) {
    this.keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) !== -1) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keys[e.key] = false;
  }

  _gameLoop(timestamp) {
    if (this.state !== 'playing') return;

    let elapsed = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (elapsed > 100) elapsed = 16.67;

    let dt = elapsed / 16.67;

    this._update(dt);
    this._render();

    this.animFrameId = requestAnimationFrame(this._gameLoop.bind(this));
  }

  _update(dt) {
    this.playTime += dt / 60;
    this.autoSaveTimer += dt;

    this._handleInput(dt);
    this.player.update(dt);
    this._updateStarfield(dt);
    this.waveController.update(dt, this.enemyManager);
    this.enemyManager.update(dt, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.bulletManager);
    this.bulletManager.update(dt);
    this.itemManager.update(dt, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    this.renderer.update(dt);

    this._checkBulletEnemyCollisions();
    this._checkBulletPlayerCollisions();
    this._checkEnemyPlayerCollisions();
    this._checkItemCollection();

    if (this.waveController.isWaveComplete() && this.waveController.pauseBetweenWaves) {
      this.wave = this.waveController.getCurrentWave() + 1;
    }

    this._addEngineTrailParticles();

    if (this.autoFire && this.state === 'playing') {
      let bullets = this.player.shoot();
      if (bullets.length > 0) {
        this.bulletManager.addPlayerBullets(bullets);
      }
    }

    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this._autoSave();
    }

    if (this.player.isDead()) {
      this._gameOver();
    }
  }

  _handleInput(dt) {
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.player.moveLeft(dt);
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.player.moveRight(dt);
    }
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.player.moveUp(dt);
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.player.moveDown(dt);
    }

    if (this.keys[' '] && !this.autoFire) {
      let bullets = this.player.shoot();
      if (bullets.length > 0) {
        this.bulletManager.addPlayerBullets(bullets);
      }
    }
  }

  movePlayer(dx, dy, dt) {
    if (this.state !== 'playing') return;
    if (dx !== 0) {
      this.player.x += dx * this.player.speed * dt;
      if (this.player.x < 0) this.player.x = 0;
      if (this.player.x + this.player.width > this.canvas.width) {
        this.player.x = this.canvas.width - this.player.width;
      }
    }
    if (dy !== 0) {
      this.player.y += dy * this.player.speed * dt;
      if (this.player.y < 0) this.player.y = 0;
      if (this.player.y + this.player.height > this.canvas.height) {
        this.player.y = this.canvas.height - this.player.height;
      }
    }
  }

  _checkBulletEnemyCollisions() {
    let hits = this.bulletManager.checkPlayerBulletHits(this.enemyManager.enemies);
    hits.forEach(function(hit) {
      hit.enemy.takeDamage(hit.bullet.damage);
      if (!hit.enemy.alive) {
        this.score += hit.enemy.score;
        this.enemiesKilled++;
        this.waveController.onEnemyKilled();
        this.renderer.createExplosion(
          hit.enemy.x + hit.enemy.width / 2,
          hit.enemy.y + hit.enemy.height / 2,
          hit.enemy.width,
          Math.floor(hit.enemy.width / 3)
        );
        this.renderer.addScorePopup(
          hit.enemy.x + hit.enemy.width / 2,
          hit.enemy.y,
          hit.enemy.score
        );
        this.itemManager.tryDropItem(
          hit.enemy.x + hit.enemy.width / 2 - 12,
          hit.enemy.y + hit.enemy.height / 2 - 12,
          hit.enemy.dropRate
        );
      } else {
        this.renderer.createExplosion(
          hit.bullet.x + hit.bullet.width / 2,
          hit.bullet.y,
          6,
          3
        );
      }
    }.bind(this));

    this.enemyManager.enemies = this.enemyManager.enemies.filter(function(e) {
      return e.alive;
    });

    if (hits.length > 0 && this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.score);
    }
  }

  _checkBulletPlayerCollisions() {
    let hits = this.bulletManager.checkEnemyBulletHits(this.player);
    hits.forEach(function(bullet) {
      let damage = this.player.takeDamage(bullet.damage);
      if (damage > 0) {
        this.renderer.createExplosion(
          bullet.x + bullet.width / 2,
          bullet.y + bullet.height / 2,
          8,
          5
        );
        if (this.player.shieldActive) {
          this.renderer.addCollectionFlash(bullet.x, bullet.y, '#00E5FF');
        }
      }
    }.bind(this));
  }

  _checkEnemyPlayerCollisions() {
    let hitEnemies = this.enemyManager.checkPlayerCollision(this.player);
    hitEnemies.forEach(function(enemy) {
      let damage = this.player.takeDamage(30);
      if (damage > 0) {
        this.renderer.triggerShake(4, 8);
      }
      enemy.hp -= 50;
      if (enemy.hp <= 0) {
        enemy.alive = false;
        this.score += enemy.score;
        this.enemiesKilled++;
        this.renderer.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.width,
          Math.floor(enemy.width / 3)
        );
      }
    }.bind(this));

    this.enemyManager.enemies = this.enemyManager.enemies.filter(function(e) {
      return e.alive;
    });
  }

  _checkItemCollection() {
    let collected = this.itemManager.checkCollection(this.player);
    collected.forEach(function(item) {
      let effect = this.itemManager.applyItem(item, this.player);

      this.renderer.addCollectionFlash(
        item.x + item.width / 2,
        item.y + item.height / 2,
        item.color
      );

      if (effect === 'bomb') {
        this._activateBomb();
      }

      this.itemsCollected = this.itemManager.itemsCollected;

      if (this.callbacks.onAchievementUnlock) {
        this.callbacks.onAchievementUnlock('item_collect', this.itemsCollected);
      }
    }.bind(this));
  }

  _activateBomb() {
    this.enemyManager.enemies.forEach(function(enemy) {
      enemy.alive = false;
      this.score += enemy.score;
      this.enemiesKilled++;
      this.waveController.onEnemyKilled();
      this.renderer.createExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width * 1.5,
        Math.floor(enemy.width / 2)
      );
    }.bind(this));
    this.enemyManager.enemies = [];
    this.bulletManager.enemyBullets = [];

    this.renderer.triggerShake(10, 20);

    let cx = this.canvas.width / 2;
    let cy = this.canvas.height / 2;
    this.renderer.createExplosion(cx, cy, 100, 40);
  }

  _addEngineTrailParticles() {
    if (this.state !== 'playing') return;
    let cx = this.player.x + this.player.width / 2;
    let by = this.player.y + this.player.height;
    if (Math.random() < 0.6) {
      this.renderer.addEngineTrailParticle(cx - 5, by);
    }
    if (Math.random() < 0.6) {
      this.renderer.addEngineTrailParticle(cx + 5, by);
    }
  }

  _render() {
    this.renderer.drawAll(
      this.player,
      this.score,
      this.waveController.getCurrentWave(),
      this.itemsCollected,
      this.bulletManager,
      this.enemyManager,
      this.itemManager,
      this.starLayers
    );
  }

  _gameOver() {
    this.state = 'gameOver';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);

    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver({
        score: this.score,
        wave: this.waveController.getCurrentWave(),
        enemiesKilled: this.enemiesKilled,
        itemsCollected: this.itemsCollected,
        playTime: this.playTime,
        aircraftId: this.aircraftId,
        weaponLevel: this.player.weaponLevel
      });
    }
  }

  _autoSave() {
    if (this.callbacks.onStateChange && this.state === 'playing') {
      this.callbacks.onStateChange({ state: 'autosave', data: this.saveState() });
    }
  }

  _onWaveStateChange(data) {
    if (data.wave && data.wave !== this.wave) {
      this.wave = data.wave;
      this.renderer.showWaveAnnouncement(data.wave, data.waveName);
    }
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ state: 'waveChange', wave: data.wave, waveName: data.waveName });
    }
  }

  saveState() {
    return {
      score: this.score,
      wave: this.waveController.getCurrentWave(),
      hp: this.player.hp,
      lives: this.player.lives,
      aircraft_id: this.aircraftId,
      weapon_level: this.player.weaponLevel,
      items: this.itemsCollected,
      enemies_killed: this.enemiesKilled,
      play_time: this.playTime,
      player_x: this.player.x,
      player_y: this.player.y,
      shield_active: this.player.shieldActive,
      shield_timer: this.player.shieldTimer,
      speed_boost_active: this.player.speedBoostActive,
      speed_boost_timer: this.player.speedBoostTimer
    };
  }

  loadState(stateObj) {
    if (!stateObj) return;

    this.score = stateObj.score || 0;
    this.wave = stateObj.wave || 1;
    this.enemiesKilled = stateObj.enemies_killed || 0;
    this.itemsCollected = stateObj.items || 0;
    this.playTime = stateObj.play_time || 0;
    this.aircraftId = stateObj.aircraft_id;

    this.player.hp = stateObj.hp || this.player.maxHp;
    this.player.lives = stateObj.lives || 3;
    this.player.weaponLevel = stateObj.weapon_level || 1;

    if (stateObj.player_x !== undefined) this.player.x = stateObj.player_x;
    if (stateObj.player_y !== undefined) this.player.y = stateObj.player_y;

    if (stateObj.shield_active) {
      this.player.activateShield(stateObj.shield_timer || 300);
    }
    if (stateObj.speed_boost_active) {
      this.player.activateSpeedBoost(stateObj.speed_boost_timer || 300);
    }

    this.itemManager.itemsCollected = this.itemsCollected;
  }
}

window.DafeijiEngine = DafeijiEngine;
