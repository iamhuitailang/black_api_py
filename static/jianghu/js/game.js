const Game = {
  canvas: null,
  ctx: null,
  player: null,
  ai: null,
  isRunning: false,
  isPaused: false,
  isGameOver: false,
  winner: null,
  lastTime: 0,
  animationId: null,
  autoSaveInterval: null,
  damageEffects: [],
  round: 1,
  playerWins: 0,
  aiWins: 0,
  selectedCharacter: 'jinyiwei',
  selectedAI: 'langzi',

  init(canvas) {
    if (canvas) {
      this.canvas = canvas;
    } else {
      this.canvas = document.getElementById('gameCanvas');
    }
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS.WIDTH;
    this.canvas.height = CONFIG.CANVAS.HEIGHT;

    this.setupEventListeners();
    Renderer.init();
  },

  startNewGame(playerChar, aiChar) {
    this.selectedCharacter = playerChar;
    this.selectedAI = aiChar;
    this.round = 1;
    this.playerWins = 0;
    this.aiWins = 0;
    this.start();
  },

  continueGame() {
    this.loadState();
  },

  pause() {
    this.isPaused = true;
    if (typeof UIManager !== 'undefined') {
      UIManager.showPauseScreen();
    }
  },

  resume() {
    this.isPaused = false;
    if (typeof UIManager !== 'undefined') {
      UIManager.hidePauseScreen();
    }
  },

  restartGame() {
    this.restart();
  },

  stop() {
    this.quit();
  },

  resetRound() {
    this.nextRound();
  },

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.isRunning && !this.isGameOver) {
          this.togglePause();
        }
      }
    });

    window.addEventListener('beforeunload', () => {
      this.saveState();
    });

    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => {
      if (this.isRunning && !this.isGameOver) {
        this.saveState();
      }
    }, 5000);
  },

  start() {
    this.player = createCharacter(this.selectedCharacter, 150, CONFIG.CANVAS.GROUND_Y - 100, true);
    this.ai = createCharacter(this.selectedAI, CONFIG.CANVAS.WIDTH - 200, CONFIG.CANVAS.GROUND_Y - 100, false);

    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.winner = null;
    this.damageEffects = [];
    this.lastTime = performance.now();

    this.gameLoop();
    this.saveState();
  },

  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (dt > 50) dt = 16.67;
    if (dt < 1) dt = 16.67;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt);
    }

    Renderer.render(this.ctx, this);

    if (typeof UIManager !== 'undefined') {
      UIManager.updateGameState();
    }

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  },

  update(dt) {
    this.handleInput();

    if (this.player && this.ai) {
      this.player.update(dt, this.ai);
      AIManager.update(this.ai, this.player, dt);
      this.ai.update(dt, this.player);

      this.checkCollisions();
      this.checkRoundEnd();
    }

    this.updateDamageEffects(dt);

    if (typeof InputManager !== 'undefined') {
      InputManager.update();
    }
  },

  handleInput() {
    if (!this.player || typeof InputManager === 'undefined') return;

    const controls = CONFIG.CONTROLS.PLAYER;

    if (InputManager.isDown(controls.LEFT)) {
      this.player.moveLeft();
    } else if (InputManager.isDown(controls.RIGHT)) {
      this.player.moveRight();
    }

    if (InputManager.wasPressed(controls.UP)) {
      this.player.jump();
    }

    if (InputManager.isDown(controls.DOWN)) {
      this.player.crouch();
    } else {
      this.player.standUp();
    }

    if (InputManager.isDown(controls.BLOCK)) {
      this.player.block();
    } else {
      this.player.stopBlock();
    }

    if (InputManager.wasPressed(controls.LIGHT_PUNCH)) {
      this.player.attack('lightPunch');
    }
    if (InputManager.wasPressed(controls.HEAVY_PUNCH)) {
      this.player.attack('heavyPunch');
    }
    if (InputManager.wasPressed(controls.LIGHT_KICK)) {
      this.player.attack('lightKick');
    }
    if (InputManager.wasPressed(controls.HEAVY_KICK)) {
      this.player.attack('heavyKick');
    }
    if (InputManager.wasPressed(controls.SKILL)) {
      this.player.useSkill(0);
    }
  },

  checkCollisions() {
    if (!this.player || !this.ai) return;

    this.checkAttackHit(this.player, this.ai);
    this.checkAttackHit(this.ai, this.player);
  },

  checkAttackHit(attacker, defender) {
    if (!attacker.isAttacking || defender.isDead) return;

    const hitbox = attacker.getHitbox();
    if (!hitbox) return;

    const bodyBox = defender.getBodyBox();
    if (!this.boxesIntersect(hitbox, bodyBox)) return;

    const damage = attacker.getAttackDamage();
    const actualDamage = defender.takeDamage(damage);

    this.addDamageEffect(defender.x + defender.bodyWidth / 2, defender.y, actualDamage);

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.isDead = true;
    }
  },

  boxesIntersect(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  },

  addDamageEffect(x, y, damage) {
    this.damageEffects.push({
      x: x,
      y: y,
      damage: damage,
      life: 700,
      vy: -1.5
    });
  },

  updateDamageEffects(dt) {
    for (let i = this.damageEffects.length - 1; i >= 0; i--) {
      const effect = this.damageEffects[i];
      effect.y += effect.vy;
      effect.life -= dt;

      if (effect.life <= 0) {
        this.damageEffects.splice(i, 1);
      }
    }
  },

  checkRoundEnd() {
    if (!this.player || !this.ai) return;

    if (this.player.isDead || this.ai.isDead) {
      this.isGameOver = true;

      if (this.player.isDead && this.ai.isDead) {
        this.winner = 'draw';
      } else if (this.player.isDead) {
        this.winner = 'ai';
        this.aiWins++;
      } else {
        this.winner = 'player';
        this.playerWins++;
      }

      if (this.playerWins < 2 && this.aiWins < 2) {
        setTimeout(() => {
          this.nextRound();
        }, 2000);
      } else {
        setTimeout(() => {
          this.showFinalResult();
        }, 2000);
      }

      this.saveState();
    }
  },

  nextRound() {
    if (!this.player || !this.ai) return;

    this.round++;
    this.player.reset();
    this.ai.reset();
    this.player.x = 150;
    this.ai.x = CONFIG.CANVAS.WIDTH - 200;
    this.isGameOver = false;
    this.winner = null;
    this.damageEffects = [];
    this.saveState();
  },

  showFinalResult() {
    this.isGameOver = true;
    if (typeof UIManager !== 'undefined') {
      UIManager.showGameOverScreen(this.winner);
    }
  },

  togglePause() {
    this.isPaused = !this.isPaused;
    if (typeof UIManager !== 'undefined') {
      if (this.isPaused) {
        UIManager.showPauseScreen();
      } else {
        UIManager.hidePauseScreen();
      }
    }
    this.saveState();
  },

  restart() {
    this.round = 1;
    this.playerWins = 0;
    this.aiWins = 0;
    this.isGameOver = false;
    this.winner = null;
    this.damageEffects = [];

    if (this.player) this.player.reset();
    if (this.ai) this.ai.reset();
    if (this.player) this.player.x = 150;
    if (this.ai) this.ai.x = CONFIG.CANVAS.WIDTH - 200;

    this.isPaused = false;
    if (typeof UIManager !== 'undefined') {
      UIManager.hidePauseScreen();
      UIManager.hideGameOverScreen();
    }

    this.saveState();
  },

  quit() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    StorageManager.clear();

    if (typeof UIManager !== 'undefined') {
      UIManager.showStartScreen();
    }
  },

  saveState() {
    if (!this.player || !this.ai) return;

    const state = {
      player: {
        type: this.player.type,
        x: this.player.x,
        y: this.player.y,
        hp: this.player.hp,
        mp: this.player.mp,
        isGrounded: this.player.isGrounded,
        isCrouching: this.player.isCrouching,
        facing: this.player.facing,
        vx: this.player.vx,
        vy: this.player.vy
      },
      ai: {
        type: this.ai.type,
        x: this.ai.x,
        y: this.ai.y,
        hp: this.ai.hp,
        mp: this.ai.mp,
        isGrounded: this.ai.isGrounded,
        isCrouching: this.ai.isCrouching,
        facing: this.ai.facing,
        vx: this.ai.vx,
        vy: this.ai.vy
      },
      round: this.round,
      playerWins: this.playerWins,
      aiWins: this.aiWins,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      winner: this.winner,
      selectedCharacter: this.selectedCharacter,
      selectedAI: this.selectedAI,
      timestamp: Date.now()
    };

    StorageManager.saveGame(state);
  },

  loadState() {
    const state = StorageManager.loadGame();
    if (!state) return;

    if (Date.now() - state.timestamp > 1000 * 60 * 60 * 2) {
      StorageManager.clear();
      return;
    }

    this.selectedCharacter = state.selectedCharacter || 'jinyiwei';
    this.selectedAI = state.selectedAI || 'langzi';
    this.round = state.round || 1;
    this.playerWins = state.playerWins || 0;
    this.aiWins = state.aiWins || 0;
    this.isPaused = state.isPaused || false;
    this.isGameOver = state.isGameOver || false;
    this.winner = state.winner || null;

    if (state.player && state.ai) {
      this.player = createCharacter(state.player.type, state.player.x, state.player.y, true);
      this.ai = createCharacter(state.ai.type, state.ai.x, state.ai.y, false);

      this.player.hp = state.player.hp;
      this.player.mp = state.player.mp;
      this.player.isGrounded = state.player.isGrounded;
      this.player.isCrouching = state.player.isCrouching;
      this.player.facing = state.player.facing;
      this.player.vx = state.player.vx || 0;
      this.player.vy = state.player.vy || 0;

      this.ai.hp = state.ai.hp;
      this.ai.mp = state.ai.mp;
      this.ai.isGrounded = state.ai.isGrounded;
      this.ai.isCrouching = state.ai.isCrouching;
      this.ai.facing = state.ai.facing;
      this.ai.vx = state.ai.vx || 0;
      this.ai.vy = state.ai.vy || 0;

      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop();

      if (this.isPaused && typeof UIManager !== 'undefined') {
        UIManager.showPauseScreen();
      }
      if (this.isGameOver && typeof UIManager !== 'undefined') {
        UIManager.showGameOverScreen(this.winner);
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Game;
}
