const GameEngine = {
  state: null,
  canvas: null,
  ctx: null,
  animationId: null,
  lastSaveTime: 0,

  createState() {
    const saveData = Storage.load();
    const savedGameState = Storage.loadGameState();

    return {
      worm: Worm.create(savedGameState?.worm),
      food: null,
      score: savedGameState?.score || 0,
      foodsEaten: savedGameState?.foodsEaten || 0,
      currentSkin: saveData.currentSkin || 'default',
      saveData: saveData,
      isPaused: false,
      isGameOver: false,
      notifications: []
    };
  },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GameConfig.CANVAS_WIDTH;
    this.canvas.height = GameConfig.CANVAS_HEIGHT;
    this.state = this.createState();
    this.state.food = FoodSystem.spawn(this.state.worm, null);
    Effects.clear();
    AudioSystem.init();
    this.bindEvents();
  },

  bindEvents() {
    const keyMap = {
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 },
      'w': { x: 0, y: -1 },
      'W': { x: 0, y: -1 },
      's': { x: 0, y: 1 },
      'S': { x: 0, y: 1 },
      'a': { x: -1, y: 0 },
      'A': { x: -1, y: 0 },
      'd': { x: 1, y: 0 },
      'D': { x: 1, y: 0 }
    };

    document.addEventListener('keydown', (e) => {
      AudioSystem.resume();
      if (keyMap[e.key]) {
        e.preventDefault();
        Worm.setDirection(this.state.worm, keyMap[e.key]);
      }
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
    });
  },

  start() {
    if (this.animationId) return;
    const loop = (time) => {
      this.update(time);
      this.render(time);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  },

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },

  togglePause() {
    if (this.state.isGameOver) return;
    this.state.isPaused = !this.state.isPaused;
  },

  restart() {
    this.stop();
    Storage.clearGameState();
    this.state = this.createState();
    this.state.food = FoodSystem.spawn(this.state.worm, null);
    Effects.clear();
    this.start();
  },

  update(time) {
    if (this.state.isPaused || this.state.isGameOver) {
      Effects.update();
      return;
    }

    const worm = this.state.worm;

    if (worm.isDead) {
      if (worm.deathAnimation && time - worm.deathAnimation.startTime > worm.bodySegments * 50 + 1000) {
        this.state.isGameOver = true;
        Storage.updateHighScore(this.state.score);
        Storage.clearGameState();
      }
      Effects.update();
      return;
    }

    const teleported = Worm.update(worm, time);

    if (teleported) {
      AudioSystem.playTeleport();
      Effects.addGridRipple(worm.x, worm.y);
    }

    if (Worm.checkSelfCollision(worm)) {
      this.handleDeath();
    }

    if (FoodSystem.checkCollision(worm, this.state.food)) {
      this.handleFoodEaten(time);
    }

    Renderer.drawStatusEffects(this.ctx, worm, time);
    Effects.update();

    if (time - this.lastSaveTime > 2000) {
      this.saveProgress();
      this.lastSaveTime = time;
    }
  },

  handleFoodEaten(time) {
    const food = this.state.food;
    const worm = this.state.worm;

    this.state.score += food.type.score;
    this.state.foodsEaten++;

    const permanentSpeedUp = Worm.eatFood(worm, food, time);

    const updatedData = Storage.addFoodsEaten(1);
    this.state.saveData = updatedData;

    this.checkSkinUnlocks(updatedData);

    Effects.addParticle(food.x, food.y, food.type.color, 'spark');
    Effects.addGridRipple(food.x, food.y);

    if (food.type.id === 'normal') {
      AudioSystem.playEatNormal();
    } else if (food.type.id === 'speed') {
      AudioSystem.playEatSpeed();
    } else if (food.type.id === 'slow') {
      AudioSystem.playEatSlow();
    }

    if (permanentSpeedUp) {
      AudioSystem.playSpeedUp();
      this.addNotification('速度提升! +0.3px/帧', '#22c55e');
    }

    this.state.food = FoodSystem.spawn(worm, null);
  },

  checkSkinUnlocks(saveData) {
    const newlyUnlocked = GameConfig.WORM_SKINS.filter(skin =>
      saveData.totalFoodsEaten >= skin.unlockAt &&
      saveData.unlockedSkins.includes(skin.id) &&
      saveData.totalFoodsEaten - 1 < skin.unlockAt
    );
    newlyUnlocked.forEach(skin => {
      this.addNotification(`解锁新皮肤: ${skin.name}!`, skin.colors[0]);
    });
  },

  addNotification(text, color) {
    this.state.notifications.push({
      text,
      color,
      startTime: Date.now(),
      duration: 2000
    });
  },

  handleDeath() {
    Worm.die(this.state.worm);
    AudioSystem.playDeath();
    Storage.updateHighScore(this.state.score);
    Storage.clearGameState();
  },

  saveProgress() {
    if (this.state.worm.isDead) return;
    const gameState = {
      worm: Worm.serialize(this.state.worm),
      score: this.state.score,
      foodsEaten: this.state.foodsEaten
    };
    Storage.saveGameState(gameState);
  },

  setSkin(skinId) {
    if (Storage.setCurrentSkin(skinId)) {
      this.state.currentSkin = skinId;
      this.state.saveData.currentSkin = skinId;
      return true;
    }
    return false;
  },

  render(time) {
    const ctx = this.ctx;
    Renderer.clear(ctx);
    Effects.drawGrid(ctx, time);
    Renderer.drawBorder(ctx);
    Renderer.drawFood(ctx, this.state.food, time);
    Renderer.drawWorm(ctx, this.state.worm, this.state.currentSkin, time);
    Effects.drawParticles(ctx);
    this.renderNotifications(ctx);

    if (this.state.isPaused) {
      this.renderPauseOverlay(ctx);
    }
  },

  renderNotifications(ctx) {
    const now = Date.now();
    this.state.notifications = this.state.notifications.filter(n => {
      const elapsed = now - n.startTime;
      if (elapsed > n.duration) return false;

      const alpha = 1 - elapsed / n.duration;
      const yOffset = elapsed * 0.03;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(n.text, GameConfig.CANVAS_WIDTH / 2, 80 - yOffset);
      ctx.restore();

      return true;
    });
  },

  renderPauseOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂停', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 - 10);
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('按空格键继续', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 30);
    ctx.restore();
  },

  getState() {
    return this.state;
  }
};
