class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'start';
    this.player = null;
    this.obstacles = [];
    this.powerups = [];
    this.camera = { x: 0 };
    this.stageIndex = 0;
    this.lastObstacleSpawn = 0;
    this.lastPowerupSpawn = 0;
    this.frame = 0;
    this.selectedCharacter = 'clown';
    this.hoveredCharacter = null;
    this.hasSave = false;
    this.stageBannerAlpha = 0;
    this.stageBannerText = '';
    this.stageBannerTimer = 0;
    this.transitionAlpha = 0;
    this.transitionColor = '#000';
    this.transitionTarget = null;
    this.saveTimer = 0;
    this.spawnedObstacleIds = [];
    this.running = false;

    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.worldScroll = 0;
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = GameConfig.CANVAS_WIDTH * this.dpr;
    this.canvas.height = GameConfig.CANVAS_HEIGHT * this.dpr;
    this.canvas.style.width = GameConfig.CANVAS_WIDTH + 'px';
    this.canvas.style.height = GameConfig.CANVAS_HEIGHT + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.imageSmoothingEnabled = true;

    Input.init();
    World.init();
    UI.init(this);

    const save = Storage.load();
    this.hasSave = !!save;

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    this.showTransition(() => {
      if (this.hasSave) {
        this.gameState = 'start';
      } else {
        this.gameState = 'character_select';
      }
      this.start();
    });
  }

  start() {
    this.running = true;
    this.gameLoop();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GameConfig.CANVAS_WIDTH / rect.width;
    const scaleY = GameConfig.CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (this.gameState === 'start') {
      if (this.hasSave) {
        this.loadGame();
      } else {
        this.gameState = 'character_select';
      }
    } else if (this.gameState === 'character_select') {
      const characters = Object.keys(GameConfig.CHARACTERS);
      const cardWidth = 260;
      const cardHeight = 300;
      const gap = 30;
      const totalWidth = cardWidth * 3 + gap * 2;
      const startX = (GameConfig.CANVAS_WIDTH - totalWidth) / 2;

      let clickedChar = null;
      for (let i = 0; i < characters.length; i++) {
        const cx = startX + i * (cardWidth + gap);
        const cy = 160;
        if (x >= cx && x <= cx + cardWidth && y >= cy && y <= cy + cardHeight) {
          clickedChar = characters[i];
          break;
        }
      }

      if (clickedChar) {
        if (this.selectedCharacter === clickedChar) {
          this.showTransition(() => {
            this.startNewGame(clickedChar);
          });
        } else {
          this.selectedCharacter = clickedChar;
        }
      } else if (this.selectedCharacter) {
        this.showTransition(() => {
          this.startNewGame(this.selectedCharacter);
        });
      }
    } else if (this.gameState === 'gameover' || this.gameState === 'victory') {
      Storage.clear();
      this.hasSave = false;
      this.showTransition(() => {
        this.gameState = 'character_select';
        this.selectedCharacter = 'clown';
      });
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GameConfig.CANVAS_WIDTH / rect.width;
    const scaleY = GameConfig.CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (this.gameState === 'character_select') {
      this.hoveredCharacter = null;
      const characters = Object.keys(GameConfig.CHARACTERS);
      const cardWidth = 260;
      const cardHeight = 300;
      const gap = 30;
      const totalWidth = cardWidth * 3 + gap * 2;
      const startX = (GameConfig.CANVAS_WIDTH - totalWidth) / 2;

      for (let i = 0; i < characters.length; i++) {
        const cx = startX + i * (cardWidth + gap);
        const cy = 160;
        if (x >= cx && x <= cx + cardWidth && y >= cy && y <= cy + cardHeight) {
          this.hoveredCharacter = characters[i];
          break;
        }
      }
    }
  }

  handleKeyDown(e) {
    if (e.code === 'KeyP' && (this.gameState === 'playing' || this.gameState === 'paused')) {
      if (this.gameState === 'playing') {
        this.gameState = 'paused';
      } else {
        this.gameState = 'playing';
      }
    }
    if (e.code === 'KeyN' && this.gameState === 'start' && this.hasSave) {
      Storage.clear();
      this.hasSave = false;
      this.gameState = 'character_select';
    }
    if (e.code === 'KeyR' && (this.gameState === 'gameover' || this.gameState === 'victory')) {
      Storage.clear();
      this.hasSave = false;
      this.gameState = 'character_select';
      this.selectedCharacter = 'clown';
    }
  }

  startNewGame(characterType) {
    this.player = new Player(characterType, 100, GameConfig.GROUND_Y);
    this.obstacles = [];
    this.powerups = [];
    this.camera = { x: 0 };
    this.stageIndex = 0;
    this.lastObstacleSpawn = Date.now();
    this.lastPowerupSpawn = Date.now() + 3000;
    this.frame = 0;
    this.gameState = 'playing';
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.worldScroll = 0;
    this.showStageBanner('前段撤离');
    this.saveGame();
  }

  loadGame() {
    const save = Storage.load();
    if (!save) return;

    const ps = save.player;
    this.player = new Player(ps.characterType, ps.x, ps.y);
    this.player.vx = ps.vx;
    this.player.vy = ps.vy;
    this.player.hp = ps.hp;
    this.player.maxHp = ps.maxHp;
    this.player.facing = ps.facing;
    this.player.isCrouching = ps.isCrouching;
    this.player.isSprinting = ps.isSprinting;
    this.player.activeEffects = ps.activeEffects || {};
    this.player.score = ps.score || 0;

    this.obstacles = save.obstacles.map(o => {
      const obs = new Obstacle(o.type, o.x, o.y, (save.stageIndex || 0) + 1);
      obs.vx = o.vx;
      obs.vy = o.vy;
      obs.rotation = o.rotation || 0;
      obs.rotationSpeed = o.rotationSpeed || 0;
      return obs;
    });

    this.powerups = save.powerups.map(p => {
      const pu = new Powerup(p.type, p.x, p.y);
      pu.collected = p.collected;
      return pu;
    });

    this.camera = save.camera || { x: 0 };
    this.stageIndex = save.stageIndex || 0;
    this.lastObstacleSpawn = Date.now();
    this.lastPowerupSpawn = Date.now();
    this.frame = save.frame || 0;
    this.spawnedObstacleIds = save.spawnedObstacleIds || [];
    this.gameState = 'playing';
    this.showStageBanner(GameConfig.STAGES[this.stageIndex]?.name || '前段撤离');
  }

  saveGame() {
    if (this.gameState !== 'playing') return;
    const save = Storage.buildSave(this);
    Storage.save(save);
    this.hasSave = true;
  }

  showStageBanner(text) {
    this.stageBannerText = text;
    this.stageBannerTimer = 180;
    this.stageBannerAlpha = 1;
    this.shakeIntensity = 14;
  }

  showTransition(callback) {
    if (callback) callback();
  }

  getStageConfig() {
    return GameConfig.STAGES[this.stageIndex];
  }

  spawnObstacle() {
    const now = Date.now();
    const stageIdx = this.stageIndex;
    const stageCfg = this.getStageConfig();
    const interval = stageCfg.obstacleInterval;

    if (now - this.lastObstacleSpawn < interval) return;
    this.lastObstacleSpawn = now;

    const allTypes = Object.keys(GameConfig.OBSTACLE_TYPES);
    const weights = stageCfg.obstacleWeights;

    const weightArr = allTypes.map(t => weights[t] || 0);
    const totalWeight = weightArr.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedType = allTypes[0];
    for (let i = 0; i < allTypes.length; i++) {
      random -= weightArr[i];
      if (random <= 0) {
        selectedType = allTypes[i];
        break;
      }
    }

    const cfg = GameConfig.OBSTACLE_TYPES[selectedType];
    let spawnX, spawnY;

    const viewStartX = this.camera.x + GameConfig.CANVAS_WIDTH + 30;

    if (cfg.isAnimal) {
      spawnX = Math.random() > 0.5
        ? viewStartX + Math.random() * 80
        : this.camera.x - 80 - Math.random() * 80;
      spawnY = GameConfig.GROUND_Y;
    } else if (cfg.y === 'ground') {
      spawnX = viewStartX + Math.random() * 100;
      spawnY = GameConfig.GROUND_Y;
    } else if (cfg.y === 'low') {
      spawnX = viewStartX + Math.random() * 100;
      spawnY = GameConfig.GROUND_Y - 30;
    } else if (cfg.y === 'high') {
      spawnX = viewStartX + Math.random() * 100;
      spawnY = GameConfig.GROUND_Y - 70;
    } else {
      spawnX = viewStartX + Math.random() * 100;
      spawnY = GameConfig.GROUND_Y - 20 - Math.random() * 60;
    }

    spawnX = Math.max(100, Math.min(GameConfig.SAFE_ZONE_X - 200, spawnX));

    const difficulty = stageIdx + 1;
    const obstacle = new Obstacle(selectedType, spawnX, spawnY, difficulty);
    
    if (!cfg.isAnimal && cfg.y !== 'ground') {
      obstacle.vx = -stageCfg.obstacleDrift * (0.8 + Math.random() * 0.4);
    }
    
    this.obstacles.push(obstacle);

    if (stageIdx >= 1 && Math.random() < 0.3) {
      setTimeout(() => {
        if (this.gameState === 'playing') {
          const extraType = Math.random() < 0.5 ? 'stone' : 'crate';
          const extraX = this.camera.x + GameConfig.CANVAS_WIDTH + 50 + Math.random() * 100;
          const extraY = GameConfig.GROUND_Y - 40 - Math.random() * 50;
          const extra = new Obstacle(extraType, extraX, extraY, difficulty);
          extra.vx = -stageCfg.obstacleDrift * (0.9 + Math.random() * 0.3);
          this.obstacles.push(extra);
        }
      }, 200 + Math.random() * 300);
    }

    if (stageIdx >= 2 && Math.random() < 0.4) {
      setTimeout(() => {
        if (this.gameState === 'playing') {
          const animalTypes = ['monkey', 'horse', 'bear'];
          const at = animalTypes[Math.floor(Math.random() * animalTypes.length)];
          const fromLeft = Math.random() < 0.5;
          const ax = fromLeft 
            ? this.camera.x - 100 - Math.random() * 50
            : this.camera.x + GameConfig.CANVAS_WIDTH + 50 + Math.random() * 50;
          const animal = new Obstacle(at, ax, GameConfig.GROUND_Y, difficulty);
          animal.vx = fromLeft ? Math.abs(animal.vx) : -Math.abs(animal.vx);
          this.obstacles.push(animal);
        }
      }, 100 + Math.random() * 200);
    }
  }

  spawnPowerup() {
    const now = Date.now();
    const stageCfg = this.getStageConfig();
    const interval = stageCfg.powerupInterval;

    if (now - this.lastPowerupSpawn < interval) return;
    this.lastPowerupSpawn = now;

    const types = Object.keys(GameConfig.POWERUP_TYPES);
    const selectedType = types[Math.floor(Math.random() * types.length)];

    const spawnX = this.camera.x + GameConfig.CANVAS_WIDTH + 100 + Math.random() * 200;
    const spawnY = GameConfig.GROUND_Y - 60 - Math.random() * 100;

    const clampedX = Math.max(100, Math.min(GameConfig.SAFE_ZONE_X - 100, spawnX));
    const powerup = new Powerup(selectedType, clampedX, spawnY);
    this.powerups.push(powerup);
  }

  checkCollisions() {
    const playerBox = this.player.getHitbox();

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      const obsBox = obstacle.getHitbox();

      if (this.rectsCollide(playerBox, obsBox)) {
        if (obstacle.isAnimal && this.player.activeEffects.smoke > 0) {
          continue;
        }
        this.player.takeDamage(obstacle.cfg.damage);
        World.addParticle(this.player.x, this.player.y - 40, '#FF4757');
        obstacle.active = false;
        this.shakeIntensity = 6;
      }
    }

    for (const powerup of this.powerups) {
      if (powerup.collected) continue;
      const puBox = powerup.getHitbox();

      if (this.rectsCollide(playerBox, puBox)) {
        powerup.collected = true;
        const cfg = powerup.cfg;
        this.player.applyEffect(cfg.effect, cfg.value, cfg.duration);
        this.player.score += 50;
        World.addParticle(powerup.x, powerup.y - 15, cfg.color);
      }
    }
  }

  rectsCollide(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  updateCamera() {
    const stageCfg = this.getStageConfig();
    const autoScroll = stageCfg.autoScrollSpeed;

    const targetX = this.player.x - GameConfig.CANVAS_WIDTH * 0.3;
    this.camera.x += (targetX - this.camera.x) * 0.1;

    this.camera.x += autoScroll;

    if (this.camera.x > this.player.x - 80) {
      this.player.x = this.camera.x + 80;
      this.player.vx = Math.max(this.player.vx, 2);
    }

    this.camera.x = Math.max(0, Math.min(GameConfig.WORLD_WIDTH - GameConfig.CANVAS_WIDTH, this.camera.x));
  }

  updateStage() {
    const px = this.player.x;
    let newStageIdx = 0;
    
    if (px >= GameConfig.STAGES[2].endX) {
      newStageIdx = 2;
    } else if (px >= GameConfig.STAGES[1].endX) {
      newStageIdx = 2;
    } else if (px >= GameConfig.STAGES[0].endX) {
      newStageIdx = 1;
    } else {
      newStageIdx = 0;
    }

    if (newStageIdx !== this.stageIndex) {
      const prevIdx = this.stageIndex;
      this.stageIndex = newStageIdx;
      if (newStageIdx > prevIdx) {
        this.showStageBanner(GameConfig.STAGES[this.stageIndex].name);
      }
    }
  }

  update(dt) {
    if (this.gameState !== 'playing') return;

    this.frame++;
    this.player.update(dt);
    this.updateStage();

    const stageCfg = this.getStageConfig();

    for (const obstacle of this.obstacles) {
      obstacle.update(dt, this.player);
      if (!obstacle.isAnimal && obstacle.falling === false && obstacle.vx === 0) {
        obstacle.x -= stageCfg.obstacleDrift;
      }
    }
    this.obstacles = this.obstacles.filter(o => o.active);

    for (const powerup of this.powerups) {
      powerup.update(dt);
    }
    this.powerups = this.powerups.filter(p => !p.collected);

    this.spawnObstacle();
    this.spawnPowerup();
    this.checkCollisions();
    this.updateCamera();

    this.player.score += stageCfg.scoreRate;

    World.update(dt);

    if (this.shakeIntensity > 0.3) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.88;
    } else {
      const stageCfg = this.getStageConfig();
      const baseShake = stageCfg.overlay.intensity * 0.8;
      if (baseShake > 0) {
        this.shakeX = (Math.random() - 0.5) * baseShake;
        this.shakeY = (Math.random() - 0.5) * baseShake;
      } else {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }

    if (this.player.hp <= 0) {
      this.gameState = 'gameover';
      Storage.clear();
      this.hasSave = false;
    }

    if (this.player.x >= GameConfig.SAFE_ZONE_X) {
      this.gameState = 'victory';
      const hpBonus = Math.floor(this.player.hp * 5);
      const stageBonus = (this.stageIndex + 1) * 100;
      this.player.score += hpBonus + stageBonus;
      Storage.clear();
      this.hasSave = false;
    }

    if (this.player.x < this.camera.x + 30) {
      this.player.x = this.camera.x + 30;
      this.player.vx = Math.max(0, this.player.vx);
      
      const stageCfg = this.getStageConfig();
      if (stageCfg.autoScrollSpeed >= 1.8) {
        if (this.frame % 30 === 0) {
          const damage = stageCfg.difficulty;
          this.player.hp -= damage;
          this.shakeIntensity = Math.max(this.shakeIntensity, 6);
          World.addParticle(this.player.x, this.player.y - 30, '#E74C3C');
        }
      }
    }

    this.saveTimer++;
    if (this.saveTimer >= 60) {
      this.saveTimer = 0;
      this.saveGame();
    }

    if (this.stageBannerTimer > 0) {
      this.stageBannerTimer--;
      if (this.stageBannerTimer < 30) {
        this.stageBannerAlpha = this.stageBannerTimer / 30;
      }
    }

    Input.clearPressed();
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    ctx.clearRect(-20, -20, GameConfig.CANVAS_WIDTH + 40, GameConfig.CANVAS_HEIGHT + 40);

    if (this.gameState === 'start') {
      World.renderBackground(ctx, 0);
      World.renderGround(ctx, 0);
      UI.renderStartScreen(ctx);
      ctx.restore();
      return;
    }

    if (this.gameState === 'character_select') {
      World.renderBackground(ctx, 0);
      World.renderGround(ctx, 0);
      UI.renderCharacterSelect(ctx);
      ctx.restore();
      return;
    }

    const camX = this.camera.x;

    const stageCfg = this.getStageConfig();
    World.setStageOverlay(stageCfg.overlay);

    World.renderBackground(ctx, camX);
    World.renderGround(ctx, camX);

    World.renderStartZone(ctx, camX);
    World.renderSafeZone(ctx, camX);
    World.renderProgressMarkers(ctx, camX, this.player.x);

    for (const powerup of this.powerups) {
      powerup.render(ctx, camX);
    }

    for (const obstacle of this.obstacles) {
      obstacle.render(ctx, camX);
    }

    this.player.render(ctx, camX);

    World.renderParticles(ctx, camX);

    UI.render(ctx);

    if (this.stageBannerTimer > 0) {
      UI.renderStageBanner(ctx, this.stageBannerText, this.stageBannerAlpha);
    }

    if (this.gameState === 'paused') {
      UI.renderPauseScreen(ctx);
    }

    if (this.gameState === 'gameover') {
      UI.renderGameOverScreen(ctx);
    }

    if (this.gameState === 'victory') {
      UI.renderVictoryScreen(ctx);
    }

    ctx.restore();
  }

  gameLoop() {
    if (!this.running) return;

    const dt = 16;
    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }
}
