const GameEngine = {
  state: null,
  canvas: null,
  ctx: null,
  animationId: null,
  lastSaveTime: 0,
  _eventBound: false,
  _keyHandler: null,
  debug: {
    lastKeyPressed: null,
    lastKeyTime: 0,
    keyPressCount: 0,
    directionChanges: 0,
    updateCount: 0,
    saveCount: 0,
    lastSaveData: null
  },

  createState() {
    const saveData = Storage.load();
    const savedGameState = Storage.loadGameState();

    console.log('[GameEngine.createState] Loading savedGameState:',
      savedGameState ? 'EXISTS' : 'NONE',
      savedGameState);
    console.log('[GameEngine.createState] Loading saveData.unlockedSkins:', saveData.unlockedSkins);
    console.log('[GameEngine.createState] Loading saveData.highScore:', saveData.highScore);
    console.log('[GameEngine.createState] Loading saveData.totalFoodsEaten:', saveData.totalFoodsEaten);

    const state = {
      worm: Worm.create(savedGameState?.worm),
      food: null,
      score: savedGameState?.score || 0,
      foodsEaten: savedGameState?.foodsEaten || 0,
      currentSkin: saveData.currentSkin || 'default',
      saveData: saveData,
      isPaused: false,
      isGameOver: false,
      notifications: [],
      invincibleUntil: 0
    };

    if (savedGameState?.food) {
      state.food = {
        x: savedGameState.food.x,
        y: savedGameState.food.y,
        radius: savedGameState.food.radius || 12,
        type: savedGameState.food.type,
        pulsePhase: Math.random() * Math.PI * 2,
        spawnTime: Date.now()
      };
      console.log('[GameEngine.createState] Restored food at:',
        state.food.x.toFixed(1), state.food.y.toFixed(1),
        'type:', state.food.type.id);
    } else {
      console.log('[GameEngine.createState] No saved food, will spawn new');
    }

    console.log('[GameEngine.createState] Worm created: x=' +
      state.worm.x.toFixed(1) + ', y=' + state.worm.y.toFixed(1) +
      ', direction=(' + state.worm.direction.x + ',' + state.worm.direction.y + ')' +
      ', bodySegments=' + state.worm.bodySegments +
      ', pathHistory.length=' + state.worm.pathHistory.length);

    return state;
  },

  init(canvas) {
    console.log('[GameEngine.init] Starting initialization...');

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GameConfig.CANVAS_WIDTH;
    this.canvas.height = GameConfig.CANVAS_HEIGHT;
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none';

    this.state = this.createState();
    if (!this.state.food) {
      this.state.food = FoodSystem.spawn(this.state.worm, null);
      console.log('[GameEngine.init] Spawned new food at:',
        this.state.food.x.toFixed(1), this.state.food.y.toFixed(1));
    }

    Effects.clear();
    AudioSystem.init();
    this.bindEvents();

    this.state.invincibleUntil = performance.now() + 3000;

    console.log('[GameEngine.init] Initialization complete.');
    console.log('[GameEngine.init] Worm position:',
      this.state.worm.x.toFixed(1), this.state.worm.y.toFixed(1));
    console.log('[GameEngine.init] Worm direction:',
      this.state.worm.direction.x, this.state.worm.direction.y);
    console.log('[GameEngine.init] Base speed:', this.state.worm.baseSpeed);
    console.log('[GameEngine.init] Invincible for 3 seconds');
  },

  bindEvents() {
    if (this._eventBound) {
      console.log('[GameEngine.bindEvents] Already bound, skipping');
      return;
    }
    this._eventBound = true;
    console.log('[GameEngine.bindEvents] Binding events...');

    const keyMap = {
      'ArrowUp': { x: 0, y: -1, name: '↑' },
      'ArrowDown': { x: 0, y: 1, name: '↓' },
      'ArrowLeft': { x: -1, y: 0, name: '←' },
      'ArrowRight': { x: 1, y: 0, name: '→' },
      'w': { x: 0, y: -1, name: 'W' },
      'W': { x: 0, y: -1, name: 'W' },
      's': { x: 0, y: 1, name: 'S' },
      'S': { x: 0, y: 1, name: 'S' },
      'a': { x: -1, y: 0, name: 'A' },
      'A': { x: -1, y: 0, name: 'A' },
      'd': { x: 1, y: 0, name: 'D' },
      'D': { x: 1, y: 0, name: 'D' }
    };

    this._keyHandler = (e) => {
      if (!this.state) {
        console.log('[GameEngine._keyHandler] No state, ignoring key:', e.key);
        return;
      }

      this.debug.lastKeyPressed = e.key;
      this.debug.lastKeyTime = Date.now();
      this.debug.keyPressCount++;

      AudioSystem.resume();

      if (keyMap[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        const dir = keyMap[e.key];
        const oldDir = { ...this.state.worm.nextDirection };
        Worm.setDirection(this.state.worm, dir);
        this.debug.directionChanges++;

        console.log('[GameEngine._keyHandler] Direction key:', dir.name,
          'old:', '(' + oldDir.x + ',' + oldDir.y + ')',
          'new:', '(' + this.state.worm.nextDirection.x + ',' + this.state.worm.nextDirection.y + ')');

        if (this.canvas) {
          this.canvas.focus({ preventScroll: true });
        }
        return;
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        console.log('[GameEngine._keyHandler] Toggle pause key:', e.key);
        this.togglePause();
      }
    };

    window.addEventListener('keydown', this._keyHandler, true);
    document.addEventListener('keydown', this._keyHandler, true);

    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[GameEngine.canvas] Clicked, focusing canvas');
        this.canvas.focus({ preventScroll: true });
        AudioSystem.resume();
      });

      this.canvas.addEventListener('focus', () => {
        console.log('[GameEngine.canvas] Canvas focused');
      });

      this.canvas.addEventListener('blur', () => {
        console.log('[GameEngine.canvas] Canvas blurred');
      });
    }

    setTimeout(() => {
      if (this.canvas) {
        this.canvas.focus({ preventScroll: true });
        console.log('[GameEngine.init] Auto-focused canvas');
      }
    }, 200);

    console.log('[GameEngine.bindEvents] Events bound successfully');
  },

  unbindEvents() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler, true);
      document.removeEventListener('keydown', this._keyHandler, true);
      this._keyHandler = null;
      console.log('[GameEngine.unbindEvents] Events unbound');
    }
    this._eventBound = false;
  },

  start() {
    if (this.animationId) {
      console.log('[GameEngine.start] Already running, skipping');
      return;
    }
    console.log('[GameEngine.start] Starting game loop...');

    const loop = (time) => {
      try {
        this.update(time);
        this.render(time);
      } catch (e) {
        console.error('[GameEngine.loop] Error in game loop:', e);
      }
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  },

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('[GameEngine.stop] Game loop stopped');
    }
  },

  togglePause() {
    if (!this.state || this.state.isGameOver) return;
    this.state.isPaused = !this.state.isPaused;
    console.log('[GameEngine.togglePause] Paused:', this.state.isPaused);
  },

  restart() {
    console.log('[GameEngine.restart] Restarting game...');
    this.stop();
    Storage.clearGameState();
    console.log('[GameEngine.restart] Cleared saved game state');

    this.state = this.createState();
    this.state.food = FoodSystem.spawn(this.state.worm, null);
    this.state.invincibleUntil = performance.now() + 3000;
    Effects.clear();
    this.lastSaveTime = 0;
    this.debug.updateCount = 0;
    this.debug.saveCount = 0;
    this.start();
    console.log('[GameEngine.restart] Restart complete, invincible for 3 seconds');
  },

  update(time) {
    if (!this.state) return;
    this.debug.updateCount++;

    if (this.debug.updateCount % 180 === 0) {
      console.log('[GameEngine.update] Running, frame:', this.debug.updateCount,
        'worm pos:', this.state.worm.x.toFixed(1), this.state.worm.y.toFixed(1));
    }

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
        console.log('[GameEngine.update] Game over. Score:', this.state.score);
      }
      Effects.update();
      return;
    }

    const oldPos = { x: worm.x, y: worm.y };
    const teleported = Worm.update(worm, time);

    if (this.debug.updateCount % 180 === 0) {
      console.log('[GameEngine.update] Moved from',
        oldPos.x.toFixed(1), oldPos.y.toFixed(1), 'to',
        worm.x.toFixed(1), worm.y.toFixed(1),
        'teleported:', teleported);
    }

    if (teleported) {
      AudioSystem.playTeleport();
      Effects.addGridRipple(worm.x, worm.y);
      console.log('[GameEngine.update] Teleported! New pos:',
        worm.x.toFixed(1), worm.y.toFixed(1));
    }

    const isInvincible = time < this.state.invincibleUntil;
    if (!isInvincible && Worm.checkSelfCollision(worm)) {
      console.log('[GameEngine.update] Self collision detected!');
      this.handleDeath(time);
    }

    if (FoodSystem.checkCollision(worm, this.state.food)) {
      console.log('[GameEngine.update] Food collision!');
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

    const oldScore = this.state.score;
    this.state.score += food.type.score;
    this.state.foodsEaten++;

    console.log('[GameEngine.handleFoodEaten] Ate', food.type.id,
      'food! Score:', oldScore, '→', this.state.score,
      'Foods eaten (total):', this.state.foodsEaten);

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
      console.log('[GameEngine.handleFoodEaten] Permanent speed up! New baseSpeed:',
        worm.baseSpeed.toFixed(1));
    }

    this.state.food = FoodSystem.spawn(worm, null);
    console.log('[GameEngine.handleFoodEaten] New food spawned at:',
      this.state.food.x.toFixed(1), this.state.food.y.toFixed(1),
      'type:', this.state.food.type.id);

    this.saveProgress();
  },

  checkSkinUnlocks(saveData) {
    const newlyUnlocked = GameConfig.WORM_SKINS.filter(skin =>
      saveData.totalFoodsEaten >= skin.unlockAt &&
      saveData.unlockedSkins.includes(skin.id) &&
      saveData.totalFoodsEaten - 1 < skin.unlockAt
    );
    newlyUnlocked.forEach(skin => {
      console.log('[GameEngine.checkSkinUnlocks] Unlocked skin:', skin.name);
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

  handleDeath(time) {
    console.log('[GameEngine.handleDeath] Worm died at position:',
      this.state.worm.x.toFixed(1), this.state.worm.y.toFixed(1));
    Worm.die(this.state.worm, time);
    AudioSystem.playDeath();
    Storage.updateHighScore(this.state.score);
    Storage.clearGameState();
  },

  saveProgress() {
    if (!this.state || this.state.worm.isDead) {
      console.log('[GameEngine.saveProgress] Skipping save - dead or no state');
      return;
    }

    const gameState = {
      worm: Worm.serialize(this.state.worm),
      food: this.state.food ? {
        x: this.state.food.x,
        y: this.state.food.y,
        radius: this.state.food.radius,
        type: this.state.food.type
      } : null,
      score: this.state.score,
      foodsEaten: this.state.foodsEaten,
      savedAt: Date.now()
    };

    this.debug.saveCount++;
    this.debug.lastSaveData = gameState;

    try {
      Storage.saveGameState(gameState);
      console.log('[GameEngine.saveProgress] Saved! #' + this.debug.saveCount,
        'score:', gameState.score,
        'worm pos:', gameState.worm.x.toFixed(1), gameState.worm.y.toFixed(1),
        'food pos:', gameState.food ? gameState.food.x.toFixed(1) + ',' + gameState.food.y.toFixed(1) : 'none');
    } catch (e) {
      console.error('[GameEngine.saveProgress] Save failed:', e);
    }
  },

  setSkin(skinId) {
    if (Storage.setCurrentSkin(skinId)) {
      this.state.currentSkin = skinId;
      this.state.saveData.currentSkin = skinId;
      console.log('[GameEngine.setSkin] Changed skin to:', skinId);
      return true;
    }
    console.log('[GameEngine.setSkin] Failed to set skin:', skinId);
    return false;
  },

  getDebugInfo() {
    if (!this.state) return null;
    const now = performance.now();
    return {
      ...this.debug,
      wormX: this.state.worm.x,
      wormY: this.state.worm.y,
      directionX: this.state.worm.direction.x,
      directionY: this.state.worm.direction.y,
      nextDirectionX: this.state.worm.nextDirection.x,
      nextDirectionY: this.state.worm.nextDirection.y,
      baseSpeed: this.state.worm.baseSpeed,
      currentSpeed: Worm.getCurrentSpeed(this.state.worm, now),
      bodySegments: this.state.worm.bodySegments,
      pathHistoryLen: this.state.worm.pathHistory.length,
      isDead: this.state.worm.isDead,
      isPaused: this.state.isPaused,
      isGameOver: this.state.isGameOver,
      isInvincible: now < this.state.invincibleUntil,
      invincibleTimeLeft: Math.max(0, Math.ceil((this.state.invincibleUntil - now) / 1000)),
      score: this.state.score,
      foodsEaten: this.state.foodsEaten,
      hasFood: !!this.state.food,
      foodX: this.state.food?.x,
      foodY: this.state.food?.y
    };
  },

  render(time) {
    if (!this.ctx || !this.state) return;
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
  },

  destroy() {
    console.log('[GameEngine.destroy] Destroying...');
    this.saveProgress();
    this.stop();
    this.unbindEvents();
    this.state = null;
  }
};
