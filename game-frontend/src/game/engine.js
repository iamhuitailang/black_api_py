import { InputManager } from './input.js';
import { Camera } from './camera.js';
import { ParticleSystem, ParticleType } from './particles.js';
import { BackgroundRenderer } from './background.js';
import { Player } from './player.js';
import { Soldier, Archer, Trap, Elite, Projectile } from './enemies.js';
import { Boss } from './boss.js';
import { getLevel } from './levels.js';
import { rectOverlap, stompCheck, dashThroughCheck } from './collision.js';

const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER',
  BOSS_PHASE_TRANSITION: 'BOSS_PHASE_TRANSITION',
};

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.input = new InputManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.particles = new ParticleSystem();
    this.background = new BackgroundRenderer(canvas.width, canvas.height);

    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    this.platforms = [];
    this.levelData = null;
    this.currentLevelId = 1;
    this.state = GameState.MENU;
    this.scoreStats = {
      time: 0,
      damageTaken: 0,
      collectiblesGathered: 0,
      maxCollectibles: 0,
    };
    this.boss = null;
    this.frameCount = 0;

    this._lastTime = 0;
    this._animationId = null;
    this._running = false;

    this._bindParticleEmitter();
  }

  _bindParticleEmitter() {
    this._emitParticlesBound = (type, x, y, config) => {
      this._emitParticles(type, x, y, config);
    };
  }

  loadLevel(levelId) {
    const level = getLevel(levelId);
    if (!level) return;

    this.levelData = level;
    this.currentLevelId = levelId;
    this.platforms = [...level.platforms];
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;

    this.collectibles = level.collectibles.map((c) => ({
      x: c.x,
      y: c.y,
      collected: false,
    }));

    this.scoreStats = {
      time: 0,
      damageTaken: 0,
      collectiblesGathered: 0,
      maxCollectibles: this.collectibles.length,
    };

    const startX = 50;
    const startY = level.groundY - 60;
    this.player = new Player(startX, startY);
    this.player.onEmitParticles = this._emitParticlesBound;

    for (const enemyConfig of level.enemies) {
      const enemy = this._createEnemy(enemyConfig.type, enemyConfig.x, enemyConfig.y, enemyConfig);
      if (enemy) {
        enemy.onEmitParticles = this._emitParticlesBound;
        this.enemies.push(enemy);
      }
    }

    if (level.bossLevel) {
      this.boss = new Boss(level.width * 0.5, level.groundY - 90);
      this.boss.onEmitParticles = this._emitParticlesBound;
    }

    this.camera.setBounds(0, level.width);
    this.camera.follow(this.player);

    this.background.setBgType(level.bgType);
    this.particles.clear();
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.input.init();
    this.state = GameState.PLAYING;
    this._lastTime = performance.now();
    this._gameLoop();
  }

  stop() {
    this._running = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  pause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('PAUSED');
      }
    }
  }

  resume() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this._lastTime = performance.now();
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange('PLAYING');
      }
    }
  }

  _gameLoop() {
    if (!this._running) return;

    const now = performance.now();
    const dt = now - this._lastTime;
    this._lastTime = now;

    if (this.state === GameState.PLAYING) {
      this._update(dt);
    }

    this._render();
    this.input.update();

    this._animationId = requestAnimationFrame(() => this._gameLoop());
  }

  _update(dt) {
    this.frameCount++;
    this.scoreStats.time += dt / 1000;

    if (this.input.justPressed('p') || this.input.justPressed('P') || this.input.justPressed('Escape')) {
      this.pause();
      return;
    }

    const normalizedDt = Math.min(dt / 16.67, 2);

    this.player.update(this.input, this.platforms);

    for (const enemy of this.enemies) {
      if (enemy.type === 'elite' || enemy.type === 'soldier' || enemy.type === 'archer') {
        enemy.update(this.player, this.platforms);
      } else {
        enemy.update(this.player, this.platforms);
      }

      if (enemy instanceof Archer) {
        for (const arrow of enemy.arrows) {
          if (arrow.active && !this.projectiles.includes(arrow)) {
            this.projectiles.push(arrow);
          }
        }
        enemy.arrows = enemy.arrows.filter((a) => a.active);
      }
    }

    if (this.boss) {
      const soldiers = this.enemies.filter((e) => e instanceof Soldier);
      this.boss.update(this.player, this.platforms, soldiers);

      for (const proj of this.boss.projectiles) {
        if (proj.active && !this.projectiles.includes(proj)) {
          this.projectiles.push(proj);
        }
      }

      if (this.boss.action === 'PHASE_TRANSITION' && this.state !== GameState.BOSS_PHASE_TRANSITION) {
        this.state = GameState.BOSS_PHASE_TRANSITION;
      } else if (this.boss.action !== 'PHASE_TRANSITION' && this.state === GameState.BOSS_PHASE_TRANSITION) {
        this.state = GameState.PLAYING;
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(this.platforms, this.levelData.width, this.canvas.height);
      if (!proj.active) {
        this.projectiles.splice(i, 1);
      }
    }

    this.particles.update(normalizedDt);
    this.background.update(dt);
    this.camera.update(dt);

    this._checkAttackCollisions();
    this._checkProjectileSlashes();
    this._checkStomps();
    this._checkDashThrough();
    this._checkPlayerDamage();

    for (const c of this.collectibles) {
      if (!c.collected) {
        const collectRect = { x: c.x - 12, y: c.y - 12, width: 24, height: 24 };
        if (rectOverlap(this.player, collectRect)) {
          c.collected = true;
          this.scoreStats.collectiblesGathered++;
          this._emitParticles(ParticleType.COLLECT_GLOW, c.x, c.y, {});
        }
      }
    }

    if (this.player.x >= this.levelData.exitX) {
      const allEnemiesDead = this.enemies.every((e) => e.isDead?.() || !e.active || e.type?.startsWith('trap'));
      const bossDefeated = !this.boss || this.boss.isDead();

      if (allEnemiesDead && bossDefeated) {
        this.state = GameState.LEVEL_COMPLETE;
        const grade = this._calculateGrade();
        const timeScore = Math.max(0, 100 - Math.floor(this.scoreStats.time));
        const damageScore = Math.max(0, 50 - this.scoreStats.damageTaken * 10);
        const collectRatio = this.scoreStats.maxCollectibles > 0 
          ? this.scoreStats.collectiblesGathered / this.scoreStats.maxCollectibles
          : 1;
        const collectScore = Math.floor(collectRatio * 50);
        const totalScore = timeScore + damageScore + collectScore;

        if (this.callbacks.onLevelComplete) {
          this.callbacks.onLevelComplete({
            levelId: this.currentLevelId,
            grade,
            score: totalScore,
            time: this.scoreStats.time,
            damageTaken: this.scoreStats.damageTaken,
            collectibles: this.scoreStats.collectiblesGathered,
            maxCollectibles: this.scoreStats.maxCollectibles,
          });
        }
        return;
      }
    }

    if (!this.player.isAlive()) {
      this.state = GameState.GAME_OVER;
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver({ levelId: this.currentLevelId });
      }
      return;
    }

    if (this.callbacks.onHudUpdate) {
      const bossInfo = this.boss
        ? {
            name: '墨龙',
            phase: this.boss.phase,
            hpPercent: this.boss.phaseMaxHp > 0 ? (this.boss.phaseHp / this.boss.phaseMaxHp) * 100 : 0,
            phaseHp: this.boss.phaseHp,
            phaseMaxHp: this.boss.phaseMaxHp,
          }
        : null;

      this.callbacks.onHudUpdate({
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        time: this.scoreStats.time,
        collectibles: this.scoreStats.collectiblesGathered,
        maxCollectibles: this.scoreStats.maxCollectibles,
        damageTaken: this.scoreStats.damageTaken,
        boss: bossInfo,
      });
    }
  }

  _render() {
    const ctx = this.ctx;
    const offset = this.camera.getOffset();

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.background.render(ctx, this.camera);

    ctx.save();
    ctx.translate(offset.x, offset.y);

    for (const platform of this.platforms) {
      const isSolid = platform.type === 'solid';
      ctx.fillStyle = isSolid ? '#2a2018' : '#3a3028';
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      ctx.fillStyle = isSolid ? '#1a1210' : '#2a2018';
      ctx.fillRect(platform.x, platform.y, platform.width, 4);

      if (!isSolid) {
        ctx.fillStyle = 'rgba(26,18,16,0.3)';
        for (let i = 0; i < platform.width; i += 20) {
          ctx.fillRect(platform.x + i, platform.y + 8, 10, 4);
        }
      }
    }

    for (const c of this.collectibles) {
      if (c.collected) continue;
      const pulse = Math.sin(this.frameCount * 0.1) * 2;
      const size = 8 + pulse;

      ctx.fillStyle = 'rgba(200,168,72,0.3)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, size + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c8a848';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - size);
      ctx.lineTo(c.x + size * 0.7, c.y);
      ctx.lineTo(c.x, c.y + size);
      ctx.lineTo(c.x - size * 0.7, c.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e8c868';
      ctx.beginPath();
      ctx.moveTo(c.x - 2, c.y - size + 2);
      ctx.lineTo(c.x + size * 0.4, c.y - 2);
      ctx.lineTo(c.x, c.y + 2);
      ctx.closePath();
      ctx.fill();
    }

    for (const proj of this.projectiles) {
      proj.render(ctx, { x: 0, y: 0 });
    }

    for (const enemy of this.enemies) {
      enemy.render(ctx, { x: 0, y: 0 });
    }

    if (this.boss) {
      this.boss.render(ctx, { x: 0, y: 0 });
    }

    this.player.render(ctx, { x: 0, y: 0 });

    this.particles.render(ctx, { x: 0, y: 0 });

    const exitX = this.levelData.exitX;
    const groundY = this.levelData.groundY;
    const allEnemiesDead = this.enemies.every((e) => e.isDead?.() || !e.active || e.type?.startsWith('trap'));
    const bossDefeated = !this.boss || this.boss.isDead();
    const canExit = allEnemiesDead && bossDefeated;

    if (canExit) {
      ctx.fillStyle = 'rgba(200,168,72,0.2)';
      ctx.fillRect(exitX - 5, groundY - 120, 10, 120);

      ctx.strokeStyle = '#c8a848';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(exitX, groundY - 120);
      ctx.lineTo(exitX, groundY);
      ctx.stroke();

      ctx.fillStyle = '#c8a848';
      ctx.beginPath();
      ctx.moveTo(exitX, groundY - 120);
      ctx.lineTo(exitX + 30, groundY - 105);
      ctx.lineTo(exitX, groundY - 90);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(100,100,100,0.3)';
      ctx.fillRect(exitX - 3, groundY - 80, 6, 80);
    }

    ctx.restore();
  }

  _checkAttackCollisions() {
    const hitbox = this.player.getHitbox();
    if (!hitbox) return;

    for (const enemy of this.enemies) {
      if (enemy.isDead?.() || !enemy.active || enemy.type?.startsWith('trap')) continue;
      if (rectOverlap(hitbox, enemy)) {
        enemy.takeDamage(1);
        if (enemy.isDead?.()) {
          const center = enemy.getCenter?.() || { x: enemy.x + enemy.width * 0.5, y: enemy.y + enemy.height * 0.5 };
          this._emitParticles(ParticleType.INK_SPLASH, center.x, center.y, { count: 15 });
        }
      }
    }

    if (this.boss && !this.boss.isDead() && !this.boss.invincible) {
      if (rectOverlap(hitbox, this.boss)) {
        this.boss.takeDamage(1);
        this.camera.shake(4, 200);
      }
    }
  }

  _checkProjectileSlashes() {
    if (!this.player.canSlashProjectiles) return;

    const hitbox = this.player.getHitbox();
    if (!hitbox) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.canBeSlashed && rectOverlap(hitbox, proj)) {
        proj.slash();
        this._emitParticles(ParticleType.INK_SPLASH, proj.x + proj.width * 0.5, proj.y + proj.height * 0.5, { count: 8 });
        this.projectiles.splice(i, 1);
      }
    }
  }

  _checkStomps() {
    for (const enemy of this.enemies) {
      if (enemy.isDead?.() || !enemy.active || enemy.type?.startsWith('trap')) continue;
      if (stompCheck(this.player, enemy)) {
        if (!enemy.isDead?.()) {
          enemy.stun(enemy.stunDuration || 90);
          this.player.stompBounce();
          const center = enemy.getCenter?.() || { x: enemy.x + enemy.width * 0.5, y: enemy.y };
          this._emitParticles(ParticleType.STUN_STARS, center.x, center.y - 10, { count: 4 });
        }
      }
    }
  }

  _checkDashThrough() {
    if (this.player.dashFrame <= 0) return;

    for (const enemy of this.enemies) {
      if (enemy.isDead?.() || !enemy.active || enemy.type?.startsWith('trap')) continue;
      if (rectOverlap(this.player, enemy)) {
        const center = enemy.getCenter?.() || { x: enemy.x + enemy.width * 0.5, y: enemy.y + enemy.height * 0.5 };
        this._emitParticles(ParticleType.INK_SPLASH, center.x, center.y, { count: 4 });
      }
    }
  }

  _checkPlayerDamage() {
    if (this.player.invincible > 0) return;

    for (const enemy of this.enemies) {
      if (enemy.isDead?.() || !enemy.active) continue;

      if (enemy.type?.startsWith('trap')) {
        if (enemy.state === 'ACTIVE' && rectOverlap(this.player, enemy)) {
          this.player.takeDamage(enemy.damage, enemy.x + enemy.width * 0.5);
          this.scoreStats.damageTaken += enemy.damage;
          this.camera.shake(5, 300);
          return;
        }
        continue;
      }

      if (enemy.state === 'ATTACK' && enemy.attackFrame > 0) {
        const attackRange = enemy.attackRange || 50;
        const facingPlayer =
          (this.player.x + this.player.width * 0.5 < enemy.x + enemy.width * 0.5 && enemy.facing === -1) ||
          (this.player.x + this.player.width * 0.5 > enemy.x + enemy.width * 0.5 && enemy.facing === 1);

        if (facingPlayer) {
          const attackHitbox = {
            x: enemy.facing === 1 ? enemy.x + enemy.width : enemy.x - attackRange,
            y: enemy.y + 4,
            width: attackRange,
            height: enemy.height - 8,
          };
          if (rectOverlap(this.player, attackHitbox)) {
            const damage = enemy.damage || 1;
            this.player.takeDamage(damage, enemy.x + enemy.width * 0.5);
            this.scoreStats.damageTaken += damage;
            this.camera.shake(5, 300);
            return;
          }
        }
      }

      if (enemy.state === 'LUNGE' && rectOverlap(this.player, enemy)) {
        const damage = enemy.damage || 2;
        this.player.takeDamage(damage, enemy.x + enemy.width * 0.5);
        this.scoreStats.damageTaken += damage;
        this.camera.shake(5, 300);
        return;
      }

      if (
        enemy.state !== 'STUNNED' &&
        !this.player.invincible &&
        this.player.dashFrame <= 0 &&
        rectOverlap(this.player, enemy)
      ) {
        const damage = 1;
        this.player.takeDamage(damage, enemy.x + enemy.width * 0.5);
        this.scoreStats.damageTaken += damage;
        this.camera.shake(5, 300);
        return;
      }
    }

    if (this.boss && !this.boss.isDead()) {
      const hitboxes = this.boss.getAttackHitboxes();
      for (const hb of hitboxes) {
        if (rectOverlap(this.player, hb)) {
          const damage = hb.damage || 1;
          this.player.takeDamage(damage, this.boss.x + this.boss.width * 0.5);
          this.scoreStats.damageTaken += damage;
          this.camera.shake(6, 400);
          return;
        }
      }

      if (!this.player.invincible && this.player.dashFrame <= 0 && rectOverlap(this.player, this.boss)) {
        const damage = 1;
        this.player.takeDamage(damage, this.boss.x + this.boss.width * 0.5);
        this.scoreStats.damageTaken += damage;
        this.camera.shake(5, 300);
        return;
      }
    }

    for (const proj of this.projectiles) {
      if (proj.active && rectOverlap(this.player, proj)) {
        const damage = proj.damage || 1;
        this.player.takeDamage(damage, proj.x + proj.width * 0.5);
        this.scoreStats.damageTaken += damage;
        proj.active = false;
        this.camera.shake(5, 300);
        return;
      }
    }
  }

  _createEnemy(type, x, y, config) {
    switch (type) {
      case 'soldier':
        return new Soldier(x, y, config.patrolLeft, config.patrolRight);
      case 'archer':
        return new Archer(x, y);
      case 'spike':
        return new Trap(x, y, 'SPIKE');
      case 'falling_rock':
        return new Trap(x, y, 'ROCK');
      case 'elite':
        return new Elite(x, y);
      default:
        return null;
    }
  }

  _emitParticles(type, x, y, config) {
    const particleType = ParticleType[type];
    if (particleType) {
      this.particles.emit(particleType, x, y, config);
    }
  }

  _calculateGrade() {
    const { time, damageTaken, collectiblesGathered, maxCollectibles } = this.scoreStats;
    const collectRatio = maxCollectibles > 0 ? collectiblesGathered / maxCollectibles : 1;

    if (time < 60 && damageTaken === 0 && collectRatio >= 1) {
      return 'S';
    }
    if (time < 90 && damageTaken <= 2 && collectRatio >= 0.75) {
      return 'A';
    }
    if (time < 120 && damageTaken <= 5 && collectRatio >= 0.5) {
      return 'B';
    }
    return 'C';
  }

  destroy() {
    this.stop();
    this.input.destroy();
    this.particles.clear();
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    this.boss = null;
  }
}

export { GameState };
