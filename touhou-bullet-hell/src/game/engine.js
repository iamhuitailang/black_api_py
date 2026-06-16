import { 
  GAME_WIDTH, GAME_HEIGHT, PLAYER_START_X, PLAYER_START_Y, 
  STAGES, BOSS, GRAZE_RADIUS 
} from './constants.js';
import { Player, Enemy, Boss, PowerUp, EnemyBullet, PlayerBullet } from './entities.js';
import { audioManager } from './audio.js';
import { saveGameState, loadGameState, updateHighScore, updateStageProgress, clearQuickSave } from './storage.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    
    this.keys = {};
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.animationId = null;
    
    this.reset();
    this.setupInput();
  }

  reset() {
    this.player = null;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.boss = null;
    
    this.score = 0;
    this.scoreMultiplier = 1.0;
    this.grazeCount = 0;
    this.consecutiveGraze = 0;
    this.grazeEffects = [];
    
    this.currentStage = 1;
    this.stageStartTime = 0;
    this.stageElapsed = 0;
    this.bossPhase = false;
    
    this.activeBomb = null;
    this.bombFlash = false;
    this.slowFieldActive = false;
    this.laserActive = false;
    
    this.gameOver = false;
    this.stageClear = false;
    this.allClear = false;
    this.isNewHighScore = false;
    
    this.enemySpawnTimer = 0;
    this.bulletSpawnTimer = 0;
    
    this.stars = this.generateStars();
  }

  generateStars() {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.5,
        brightness: Math.random()
      });
    }
    return stars;
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.player) this.player.slowMode = true;
      }
      
      if (e.code === 'KeyX' && !e.repeat) {
        if (this.player && this.activeBomb === null) {
          this.activateBomb();
        }
      }
      
      if (e.code === 'KeyZ' && !e.repeat) {
        if (this.player) {
          const newBullets = this.player.shoot(this.playerBullets, this.enemies[0] || this.boss);
          this.playerBullets.push(...newBullets);
        }
      }
      
      if (e.code === 'Escape' && !e.repeat) {
        this.togglePause();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.player) this.player.slowMode = false;
      }
    });
  }

  start(characterId) {
    this.reset();
    this.player = new Player(characterId, PLAYER_START_X, PLAYER_START_Y);
    this.running = true;
    this.paused = false;
    this.stageStartTime = Date.now();
    this.lastTime = performance.now();
    this._bindBeforeUnload();
    this.render();
    this.gameLoop();
  }

  startFromSave(saveData) {
    this.reset();
    
    const pData = saveData.player || {
      x: saveData.playerX, y: saveData.playerY,
      bombs: saveData.bombs, lives: saveData.lives, maxBombs: 3,
      invincible: false, invincibleTimer: 0, slowMode: false
    };
    
    this.player = new Player(saveData.characterId, pData.x, pData.y);
    this.player.bombs = pData.bombs;
    this.player.maxBombs = pData.maxBombs || 3;
    this.player.lives = pData.lives;
    this.player.invincible = pData.invincible || false;
    this.player.invincibleTimer = pData.invincibleTimer || 0;
    this.player.slowMode = pData.slowMode || false;
    
    this.score = saveData.score;
    this.scoreMultiplier = saveData.scoreMultiplier;
    this.grazeCount = saveData.grazeCount;
    this.consecutiveGraze = saveData.consecutiveGraze || 0;
    this.currentStage = saveData.currentStage;
    this.stageElapsed = saveData.stageElapsed;
    this.bossPhase = saveData.bossPhase;
    
    if (this.bossPhase && saveData.bossHp) {
      this.boss = new Boss();
      this.boss.hp = saveData.bossHp;
      this.boss.phase = saveData.bossPhaseIndex || 0;
      this.boss.x = saveData.bossX || this.boss.x;
      this.boss.y = saveData.bossY || this.boss.y;
      this.boss.targetX = saveData.bossTargetX || this.boss.targetX;
      this.boss.spiralAngle = saveData.bossSpiralAngle || 0;
      const hpPercent = this.boss.hp / this.boss.maxHp;
      if (hpPercent <= BOSS.phases[2].hpThreshold) this.boss.phase = 2;
      else if (hpPercent <= BOSS.phases[1].hpThreshold) this.boss.phase = 1;
    }
    
    if (saveData.activeBomb) {
      this.activeBomb = {
        type: saveData.activeBomb.type,
        duration: saveData.activeBomb.duration,
        startTime: saveData.activeBomb.startTime
      };
      const elapsed = Date.now() - this.activeBomb.startTime;
      if (elapsed >= this.activeBomb.duration) {
        this.activeBomb = null;
      } else {
        if (this.activeBomb.type === 'laser') this.laserActive = true;
        if (this.activeBomb.type === 'slowField') this.slowFieldActive = true;
      }
    }
    this.bombFlash = false;
    
    if (Array.isArray(saveData.playerBullets)) {
      this.playerBullets = saveData.playerBullets.map(b => {
        const pb = new PlayerBullet(b.x, b.y, b.vx, b.vy, b.damage);
        if (b.radius) pb.radius = b.radius;
        if (b.homing) pb.homing = b.homing;
        if (b.homingStrength) pb.homingStrength = b.homingStrength;
        return pb;
      });
    }
    
    if (Array.isArray(saveData.enemyBullets)) {
      this.enemyBullets = saveData.enemyBullets.map(b => {
        return new EnemyBullet(b.x, b.y, b.vx, b.vy, b.color, b.radius || 6);
      });
    }
    
    if (Array.isArray(saveData.enemies)) {
      this.enemies = saveData.enemies.map(eData => {
        const e = new Enemy(eData.type, eData.baseX || eData.x, -50);
        e.x = eData.x;
        e.y = eData.y;
        e.hp = eData.hp;
        e.maxHp = eData.maxHp;
        e.radius = eData.radius;
        e.speed = eData.speed;
        e.color = eData.color;
        e.shootInterval = eData.shootInterval;
        e.bulletSpeed = eData.bulletSpeed;
        e.score = eData.score;
        e.movePattern = eData.movePattern;
        e.moveTimer = eData.moveTimer;
        e.baseX = eData.baseX;
        e.shootCooldown = eData.shootCooldown;
        e.dropPowerUp = eData.dropPowerUp;
        e.active = true;
        return e;
      });
    }
    
    if (Array.isArray(saveData.powerUps)) {
      this.powerUps = saveData.powerUps.map(pData => {
        const p = new PowerUp(pData.x, pData.y, pData.type || 'P');
        if (pData.radius) p.radius = pData.radius;
        if (pData.vy) p.vy = pData.vy;
        if (pData.bobTimer) p.bobTimer = pData.bobTimer;
        return p;
      });
    }
    
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this._bindBeforeUnload();
    this.render();
    this.gameLoop();
  }

  startFromStage(characterId, stageId) {
    this.reset();
    this.player = new Player(characterId, PLAYER_START_X, PLAYER_START_Y);
    this.currentStage = stageId;
    this.running = true;
    this.paused = false;
    this.stageStartTime = Date.now();
    this.lastTime = performance.now();
    this._bindBeforeUnload();
    this.render();
    this.gameLoop();
  }

  _bindBeforeUnload() {
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    }
    if (this._pageHideHandler) {
      window.removeEventListener('pagehide', this._pageHideHandler);
    }
    if (this._visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this._visibilityChangeHandler);
    }
    this._beforeUnloadHandler = () => {
      this.saveNow();
    };
    this._pageHideHandler = () => {
      this.saveNow();
    };
    this._visibilityChangeHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.saveNow();
      }
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
    window.addEventListener('pagehide', this._pageHideHandler);
    document.addEventListener('visibilitychange', this._visibilityChangeHandler);
  }

  togglePause() {
    if (this.gameOver || this.stageClear) return;
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastTime = performance.now();
      this.gameLoop();
    } else {
      this.render();
      this.saveNow();
    }
  }

  gameLoop() {
    if (!this.running || this.paused) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    if (this.gameOver || this.stageClear) return;
    
    this.updateStars(deltaTime);
    this.player.update(this.keys, deltaTime, this.enemyBullets, this.enemies);
    
    if (this.keys['KeyZ']) {
      const newBullets = this.player.shoot(this.playerBullets, this.enemies[0] || this.boss);
      this.playerBullets.push(...newBullets);
    }
    
    if (this.activeBomb) {
      this.updateBomb(deltaTime);
    }
    
    this.playerBullets.forEach(b => b.update(this.enemies.concat(this.boss ? [this.boss] : [])));
    this.enemyBullets.forEach(b => b.update(this.slowFieldActive));
    this.enemies.forEach(e => e.update(deltaTime, this.player.x, this.player.y));
    this.powerUps.forEach(p => p.update());
    
    if (this.boss) {
      this.boss.update(deltaTime, this.player.x);
    }
    
    if (!this.bossPhase) {
      this.updateStage(deltaTime);
    } else if (this.boss) {
      const bossBullets = this.boss.shoot(this.player.x, this.player.y);
      this.enemyBullets.push(...bossBullets);
    }
    
    this.checkCollisions();
    this.cleanup();
    this.updateGrazeEffects(deltaTime);
    
    this.savePeriodically();
  }

  updateStars(deltaTime) {
    this.stars.forEach(star => {
      star.y += star.speed * (deltaTime / 16);
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * GAME_WIDTH;
      }
      star.brightness = 0.3 + Math.sin(Date.now() / 1000 + star.x) * 0.3;
    });
  }

  updateStage(deltaTime) {
    const stage = STAGES[this.currentStage - 1];
    if (!stage) {
      this.triggerBoss();
      return;
    }
    
    this.stageElapsed += deltaTime;
    
    if (this.stageElapsed >= stage.duration) {
      if (this.currentStage >= STAGES.length) {
        this.triggerBoss();
      } else {
        this.completeStage();
      }
      return;
    }
    
    this.enemySpawnTimer += deltaTime;
    const spawnInterval = 2500 - (this.currentStage - 1) * 300;
    if (this.enemySpawnTimer >= spawnInterval) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy(stage);
    }
    
    this.enemies.forEach(enemy => {
      const bullets = enemy.shoot(this.player.x, this.player.y);
      this.enemyBullets.push(...bullets);
    });
    
    this.bulletSpawnTimer += deltaTime;
    const bulletInterval = 1000 / stage.bulletsPerSecond;
    if (this.bulletSpawnTimer >= bulletInterval) {
      this.bulletSpawnTimer = 0;
      this.spawnRandomBullet();
    }
  }

  spawnEnemy(stage) {
    const maxEnemies = 3 + this.currentStage;
    if (this.enemies.length >= maxEnemies) return;
    const types = stage.enemyTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 50 + Math.random() * (GAME_WIDTH - 100);
    const y = -30;
    this.enemies.push(new Enemy(type, x, y));
  }

  spawnRandomBullet() {
    const x = Math.random() * GAME_WIDTH;
    const y = -10;
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = 1.5 + Math.random() * 1.5;
    this.enemyBullets.push(new EnemyBullet(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed
    ));
  }

  triggerBoss() {
    this.bossPhase = true;
    this.boss = new Boss();
    this.enemies = [];
    this.stageElapsed = 0;
    audioManager.playBossAlert();
  }

  completeStage() {
    updateStageProgress(this.currentStage);
    this.stageClear = true;
    audioManager.playStageClear();
    
    setTimeout(() => {
      this.currentStage++;
      this.stageClear = false;
      this.stageElapsed = 0;
      this.enemyBullets = [];
      this.stageStartTime = Date.now();
      saveGameState(this.getSaveData());
    }, 3000);
  }

  checkCollisions() {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      if (!bullet.active) continue;
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (!enemy.active) continue;
        
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist < bullet.radius + enemy.radius) {
          bullet.active = false;
          if (enemy.takeDamage(bullet.damage)) {
            this.score += Math.floor(enemy.score * this.scoreMultiplier);
            if (enemy.dropPowerUp) {
              this.powerUps.push(new PowerUp(enemy.x, enemy.y));
            }
          }
          break;
        }
      }
      
      if (bullet.active && this.boss && this.boss.active) {
        const dist = Math.hypot(bullet.x - this.boss.x, bullet.y - this.boss.y);
        if (dist < bullet.radius + this.boss.radius) {
          bullet.active = false;
          if (this.boss.takeDamage(bullet.damage)) {
            this.defeatBoss();
          }
        }
      }
    }
    
    if (this.laserActive && this.boss && this.boss.active) {
      this.boss.takeDamage(0.5);
      if (this.boss.hp <= 0) {
        this.defeatBoss();
      }
    }
    
    if (!this.player.invincible && !this.bombFlash) {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        if (!bullet.active) continue;
        
        const dist = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
        
        if (this.player.graze(bullet)) {
          this.onGraze(bullet);
        }
        
        if (dist < bullet.radius + this.player.radius) {
          this.onPlayerHit(bullet);
          return;
        }
      }
      
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist < enemy.radius + this.player.radius) {
          this.onPlayerHit(enemy);
          return;
        }
      }
    }
    
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      if (!powerUp.active) continue;
      
      const dist = Math.hypot(powerUp.x - this.player.x, powerUp.y - this.player.y);
      if (dist < powerUp.radius + 20) {
        powerUp.active = false;
        this.player.addBomb();
      }
    }
  }

  onGraze(bullet) {
    this.grazeCount++;
    this.consecutiveGraze++;
    this.score += Math.floor(500 * this.scoreMultiplier);
    audioManager.playGraze();
    
    if (this.consecutiveGraze >= 10) {
      this.consecutiveGraze = 0;
      this.scoreMultiplier += 0.1;
    }
    
    this.grazeEffects.push({
      x: bullet.x,
      y: bullet.y,
      text: '+500',
      life: 800
    });
  }

  onPlayerHit(hitSource) {
    audioManager.playHit();
    this.consecutiveGraze = 0;
    
    const result = this.player.die();
    if (result === 'revived') {
      this.enemyBullets = [];
      this.bombFlash = true;
      setTimeout(() => { this.bombFlash = false; }, 500);
    } else {
      this.gameOver = true;
      this.running = false;
      audioManager.playGameOver();
      this.isNewHighScore = updateHighScore(this.score);
      updateStageProgress(this.currentStage - 1, false);
    }
  }

  activateBomb() {
    const bomb = this.player.useBomb();
    if (!bomb) return;
    
    this.activeBomb = bomb;
    this.bombFlash = true;
    
    switch (bomb.type) {
      case 'screenClear':
        this.enemyBullets = [];
        this.enemies.forEach(e => {
          e.takeDamage(50);
          if (!e.active) {
            this.score += Math.floor(e.score * this.scoreMultiplier);
          }
        });
        this.enemies = this.enemies.filter(e => e.active);
        if (this.boss) {
          this.boss.takeDamage(100);
          if (this.boss.hp <= 0) this.defeatBoss();
        }
        break;
      
      case 'laser':
        this.laserActive = true;
        break;
      
      case 'slowField':
        this.slowFieldActive = true;
        break;
    }
    
    setTimeout(() => { this.bombFlash = false; }, 500);
  }

  updateBomb(deltaTime) {
    const elapsed = Date.now() - this.activeBomb.startTime;
    
    if (elapsed >= this.activeBomb.duration) {
      this.laserActive = false;
      this.slowFieldActive = false;
      this.activeBomb = null;
    }
    
    if (this.activeBomb.type === 'screenClear' && elapsed < 2000) {
      this.enemyBullets = this.enemyBullets.filter(b => {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        return dist > 100;
      });
    }
  }

  defeatBoss() {
    this.score += Math.floor(10000 * this.scoreMultiplier);
    this.allClear = true;
    this.gameOver = true;
    this.running = false;
    audioManager.playStageClear();
    this.isNewHighScore = updateHighScore(this.score);
    updateStageProgress(STAGES.length, true);
    
    clearQuickSave();
  }

  cleanup() {
    this.playerBullets = this.playerBullets.filter(b => b.active);
    this.enemyBullets = this.enemyBullets.filter(b => b.active);
    this.enemies = this.enemies.filter(e => e.active);
    this.powerUps = this.powerUps.filter(p => p.active);
  }

  updateGrazeEffects(deltaTime) {
    for (let i = this.grazeEffects.length - 1; i >= 0; i--) {
      this.grazeEffects[i].life -= deltaTime;
      this.grazeEffects[i].y -= 0.5;
      if (this.grazeEffects[i].life <= 0) {
        this.grazeEffects.splice(i, 1);
      }
    }
  }

  savePeriodically() {
    this._saveAccum = (this._saveAccum || 0) + 1;
    if (this._saveAccum >= 30) {
      this._saveAccum = 0;
      try {
        saveGameState(this.getSaveData());
      } catch (e) {
        console.warn('Save failed:', e);
      }
    }
  }

  getSaveData() {
    return {
      characterId: this.player.id,
      player: {
        x: this.player.x,
        y: this.player.y,
        bombs: this.player.bombs,
        maxBombs: this.player.maxBombs,
        lives: this.player.lives,
        invincible: this.player.invincible,
        invincibleTimer: this.player.invincibleTimer,
        slowMode: this.player.slowMode
      },
      score: this.score,
      scoreMultiplier: this.scoreMultiplier,
      grazeCount: this.grazeCount,
      consecutiveGraze: this.consecutiveGraze,
      currentStage: this.currentStage,
      stageElapsed: this.stageElapsed,
      bossPhase: this.bossPhase,
      bossHp: this.boss ? this.boss.hp : null,
      bossPhaseIndex: this.boss ? this.boss.phase : 0,
      bossX: this.boss ? this.boss.x : null,
      bossY: this.boss ? this.boss.y : null,
      bossTargetX: this.boss ? this.boss.targetX : null,
      bossSpiralAngle: this.boss ? this.boss.spiralAngle : null,
      activeBomb: this.activeBomb ? {
        type: this.activeBomb.type,
        duration: this.activeBomb.duration,
        startTime: this.activeBomb.startTime,
      } : null,
      bombFlash: this.bombFlash,
      slowFieldActive: this.slowFieldActive,
      laserActive: this.laserActive,
      playerBullets: this.playerBullets.map(b => ({
        x: b.x, y: b.y, vx: b.vx, vy: b.vy,
        damage: b.damage, radius: b.radius,
        homing: b.homing, homingStrength: b.homingStrength
      })),
      enemyBullets: this.enemyBullets.slice(-400).map(b => ({
        x: b.x, y: b.y, vx: b.vx, vy: b.vy,
        color: b.color, radius: b.radius
      })),
      enemies: this.enemies.map(e => ({
        type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
        radius: e.radius, speed: e.speed, color: e.color,
        shootInterval: e.shootInterval, bulletSpeed: e.bulletSpeed,
        score: e.score, movePattern: e.movePattern, moveTimer: e.moveTimer,
        baseX: e.baseX, shootCooldown: e.shootCooldown, dropPowerUp: e.dropPowerUp
      })),
      powerUps: this.powerUps.map(p => ({
        x: p.x, y: p.y, type: p.type, radius: p.radius, vy: p.vy, bobTimer: p.bobTimer
      })),
      timestamp: Date.now()
    };
  }

  render() {
    const ctx = this.ctx;
    const stage = STAGES[this.currentStage - 1];
    const bgColor = stage ? stage.bgColor : '#1a0a2e';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.renderStars();
    
    if (this.slowFieldActive) {
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, 150, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    if (this.laserActive) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(this.player.x - 30, 0, 60, this.player.y - 15);
      ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
      ctx.fillRect(this.player.x - 15, 0, 30, this.player.y - 15);
    }
    
    this.powerUps.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    if (this.boss) this.boss.draw(ctx);
    
    this.enemyBullets.forEach(b => b.draw(ctx));
    this.playerBullets.forEach(b => b.draw(ctx));
    
    this.player.draw(ctx);
    
    this.renderGrazeEffects();
    
    if (this.bombFlash) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  renderStars() {
    const ctx = this.ctx;
    this.stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.fill();
    });
  }

  renderGrazeEffects() {
    const ctx = this.ctx;
    this.grazeEffects.forEach(effect => {
      const alpha = effect.life / 800;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(effect.text, effect.x, effect.y);
      ctx.globalAlpha = 1;
    });
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  saveNow() {
    if (this.player && this.running && !this.gameOver) {
      saveGameState(this.getSaveData());
    }
  }

  destroy() {
    this.saveNow();
    this.stop();
    this.keys = {};
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
    if (this._pageHideHandler) {
      window.removeEventListener('pagehide', this._pageHideHandler);
      this._pageHideHandler = null;
    }
    if (this._visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this._visibilityChangeHandler);
      this._visibilityChangeHandler = null;
    }
  }
}
