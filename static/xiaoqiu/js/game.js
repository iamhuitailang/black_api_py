// game.js - 主游戏循环、碰撞检测、阶段控制

const Game = {
  canvas: null,
  ctx: null,
  player: null,
  input: { up: false, down: false, left: false, right: false, dash: false, skill: false },
  lastTime: 0,
  dt: 0,
  elapsedTime: 0,
  stage: null,
  stageIdx: 0,
  stageTimer: 0,
  paused: false,
  gameOver: false,
  running: false,
  animFrame: null,
  saveTimer: 0,
  SAVE_INTERVAL: 1000,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS.WIDTH;
    this.canvas.height = CONFIG.CANVAS.HEIGHT;
    this.bindEvents();
    Theme.set(GameState.data.lastTheme || 'hell');
  },

  bindEvents() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  },

  onKeyDown(e) {
    const key = e.key;
    if (KEYS.UP.includes(key)) this.input.up = true;
    if (KEYS.DOWN.includes(key)) this.input.down = true;
    if (KEYS.LEFT.includes(key)) this.input.left = true;
    if (KEYS.RIGHT.includes(key)) this.input.right = true;
    if (KEYS.DASH.includes(key)) {
      this.input.dash = true;
      if (this.running && !this.paused) {
        this.player.tryDash(performance.now());
      }
    }
    if (KEYS.SKILL.includes(key)) {
      this.input.skill = true;
      if (this.running && !this.paused) {
        this.player.trySkill(EnemyManager.enemies, performance.now());
      }
      e.preventDefault();
    }
    if (KEYS.PAUSE.includes(key)) {
      if (this.running) {
        this.togglePause();
      }
    }
  },

  onKeyUp(e) {
    const key = e.key;
    if (KEYS.UP.includes(key)) this.input.up = false;
    if (KEYS.DOWN.includes(key)) this.input.down = false;
    if (KEYS.LEFT.includes(key)) this.input.left = false;
    if (KEYS.RIGHT.includes(key)) this.input.right = false;
    if (KEYS.DASH.includes(key)) this.input.dash = false;
    if (KEYS.SKILL.includes(key)) this.input.skill = false;
  },

  start(charId) {
    charId = charId || GameState.data.lastChar || 'balanced';
    GameState.data.lastChar = charId;
    GameState.save();

    Storage.clearGame();

    this.player = new Player(charId);
    EnemyManager.reset();
    SkillSystem.reset();

    this.elapsedTime = 0;
    this.stageIdx = 0;
    this.stage = CONFIG.STAGES[0];
    this.stageTimer = 0;
    this.paused = false;
    this.gameOver = false;
    this.running = true;
    this.lastTime = performance.now();
    this.saveTimer = 0;

    UI.showGame();
    this.loop();
  },

  resume() {
    const save = Storage.loadGame();
    if (!save) {
      this.start(GameState.data.lastChar);
      return;
    }

    const ps = save.player;
    this.player = new Player(ps.charId);
    this.player.x = ps.x;
    this.player.y = ps.y;
    this.player.hp = ps.hp;
    this.player.maxHp = ps.maxHp;
    this.player.skillCooldown = ps.skillCooldown;
    this.player.dashCooldown = ps.dashCooldown;
    this.player.shieldActive = ps.shieldActive;
    this.player.shieldUntil = ps.shieldUntil;
    this.player.invincible = ps.invincible;
    this.player.invincibleUntil = ps.invincibleUntil;
    this.player.frozen = ps.frozen;
    this.player.frozenUntil = ps.frozenUntil;
    this.player.dashing = ps.dashing;
    this.player.dashTime = ps.dashTime;

    this.elapsedTime = save.elapsedTime;
    this.stageIdx = save.stageIdx;
    this.stage = CONFIG.STAGES[Math.min(this.stageIdx, CONFIG.STAGES.length - 1)];
    this.stageTimer = save.stageTimer;
    this.paused = save.paused;
    this.gameOver = false;
    this.running = true;
    this.lastTime = performance.now();
    this.saveTimer = 0;

    EnemyManager.reset();
    save.enemies.forEach(es => {
      EnemyManager.enemies.push({
        type: es.type,
        x: es.x, y: es.y,
        vx: es.vx, vy: es.vy,
        radius: es.radius,
        damage: es.damage,
        slowFactor: es.slowFactor,
        slowUntil: es.slowUntil,
        exploding: es.exploding,
        explodeStartTime: es.explodeStartTime,
      });
    });

    SkillSystem.reset();
    save.slowFields.forEach(f => {
      SkillSystem.slowFields.push({
        x: f.x, y: f.y, radius: f.radius,
        duration: f.duration, startTime: f.startTime,
        slowFactor: f.slowFactor,
      });
    });

    UI.showGame();
    if (this.paused) {
      UI.updatePause(true);
    }
    this.loop();
  },

  togglePause() {
    this.paused = !this.paused;
    UI.updatePause(this.paused);
    if (!this.paused) {
      this.lastTime = performance.now();
    } else {
      Storage.saveGame(this);
    }
  },

  loop() {
    if (!this.running) return;

    const now = performance.now();
    this.dt = Math.min(50, now - this.lastTime);
    this.lastTime = now;

    if (!this.paused && !this.gameOver) {
      this.update(now);
    }

    this.render(now);

    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update(now) {
    this.elapsedTime += this.dt;
    this.stageTimer += this.dt;
    this.saveTimer += this.dt;

    if (this.saveTimer >= this.SAVE_INTERVAL) {
      this.saveTimer = 0;
      Storage.saveGame(this);
    }

    if (this.stageIdx < CONFIG.STAGES.length - 1 && this.stageTimer >= this.stage.duration) {
      this.stageIdx++;
      this.stage = CONFIG.STAGES[this.stageIdx];
      this.stageTimer = 0;
      UI.showStageBanner(this.stage.name);
    }

    this.player.update(this.input, this, now);

    EnemyManager.update(this, this.player, now);
    SkillSystem.update(this.player, EnemyManager.enemies, now);

    const hit = EnemyManager.checkPlayerCollision(this.player, now);
    if (hit && hit.damaged) {
      const actualDmg = this.player.takeDamage(hit.damage, now);
      if (actualDmg > 0) {
        UI.shake();
      }
    }

    const explosionDmg = EnemyManager.checkExplosionDamage(this.player, now);
    if (explosionDmg !== null) {
      this.player.takeDamage(explosionDmg, now);
      UI.shake();
    }

    if (this.player.hp <= 0) {
      this.endGame(false);
    }

    if (this.elapsedTime >= CONFIG.WIN_SURVIVAL_TIME) {
      this.endGame(true);
    }

    UI.updateHUD(this);
  },

  render(now) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    Theme.drawBackground(ctx, w, h, now);

    SkillSystem.drawEffects(ctx, now);
    EnemyManager.draw(ctx, now);

    if (this.player) {
      this.player.draw(ctx, now);
    }
  },

  endGame(won) {
    this.gameOver = true;
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }

    Storage.clearGame();

    const seconds = Math.floor(this.elapsedTime / 1000);
    Storage.recordRun(this.elapsedTime, this.stageIdx);

    UI.showGameOver(won, {
      time: seconds,
      stage: this.stage.name,
      stageIdx: this.stageIdx,
      charId: this.player.charId,
    });
  },

  stop() {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
  },
};