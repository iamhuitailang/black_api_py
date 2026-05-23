var Game = (function() {
  var STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
  };

  var game = {
    state: STATE.MENU,
    canvas: null,
    ctx: null,
    carriage: null,
    obstacles: [],
    items: [],
    particles: [],
    score: 0,
    distance: 0,
    gameSpeed: CONFIG.GAME_SPEED.INITIAL,
    highScore: 0,
    highDistance: 0,
    lastTime: 0,
    animationId: null,
    saveTimer: 0
  };

  function init() {
    game.canvas = document.getElementById('game-canvas');
    game.ctx = game.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    game.highScore = Storage.getHighScore();
    game.highDistance = Storage.getHighDistance();

    Input.init();
    Render.init(game.canvas);
    UI.init();

    var savedState = Storage.loadGameState();
    if (savedState && (savedState.state === STATE.PLAYING || savedState.state === STATE.PAUSED || savedState.state === STATE.GAMEOVER)) {
      restoreState(savedState);
      if (savedState.state === STATE.PAUSED) {
        UI.showPause();
      } else if (savedState.state === STATE.GAMEOVER) {
        setTimeout(function() {
          UI.showGameOver();
        }, 500);
      }
    } else {
      UI.showMenu();
    }

    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function resizeCanvas() {
    var container = document.getElementById('game-container');
    var w = container.clientWidth;
    var h = container.clientHeight;

    var targetRatio = CONFIG.CANVAS.WIDTH / CONFIG.CANVAS.HEIGHT;
    var canvasW, canvasH;

    if (w / h > targetRatio) {
      canvasH = h;
      canvasW = h * targetRatio;
    } else {
      canvasW = w;
      canvasH = w / targetRatio;
    }

    game.canvas.width = CONFIG.CANVAS.WIDTH;
    game.canvas.height = CONFIG.CANVAS.HEIGHT;
    game.canvas.style.width = canvasW + 'px';
    game.canvas.style.height = canvasH + 'px';

    var ctx = game.canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function gameLoop(currentTime) {
    var deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    if (deltaTime > 100) deltaTime = 16;

    update(deltaTime);
    render();

    game.animationId = requestAnimationFrame(gameLoop);
  }

  function update(deltaTime) {
    Input.update(deltaTime);

    if (game.state === STATE.MENU) {
      if (Input.isEnterPressed()) {
        Input.clearPressed();
        startGame(Storage.getSelectedCarriage());
      }
      return;
    }

    if (game.state === STATE.PAUSED) {
      if (Input.isPausePressed()) {
        Input.clearPressed();
        resumeGame();
      }
      return;
    }

    if (game.state === STATE.GAMEOVER) {
      if (Input.isEnterPressed()) {
        Input.clearPressed();
        startGame(Storage.getSelectedCarriage());
      }
      return;
    }

    if (game.state !== STATE.PLAYING) return;

    if (Input.isPausePressed()) {
      Input.clearPressed();
      pauseGame();
      return;
    }

    updatePlaying(deltaTime);
    Input.clearPressed();
  }

  function updatePlaying(deltaTime) {
    var carriage = game.carriage;

    var baseSpeed = game.gameSpeed * carriage.type.speed * carriage.boostMultiplier;

    if (Input.isLeft()) {
      carriage.moveLeft();
    }
    if (Input.isRight()) {
      carriage.moveRight();
    }

    if (Input.isJumpPressed() && carriage.isOnGround) {
    }

    if (Input.isJumpHeld() && carriage.isOnGround) {
    } else if (!Input.isJumpHeld() && Input.getJumpCharge() > 0 && carriage.isOnGround) {
      var holdTime = Input.consumeJump();
      carriage.jump(holdTime);
    }

    if (Input.isJumpPressed() && carriage.isOnGround) {
      Input.consumeJump();
      carriage.jump(0);
    }

    carriage.x = Physics.clampToLanes(carriage.x);
    carriage.update(deltaTime);

    game.distance += baseSpeed * deltaTime * 0.05;
    game.score = Math.floor(game.distance * CONFIG.SCORE.DISTANCE_POINTS * carriage.type.scoreMultiplier);

    var speedProgress = Math.min(game.distance / 5000, 1);
    game.gameSpeed = CONFIG.GAME_SPEED.INITIAL +
      (CONFIG.GAME_SPEED.MAX - CONFIG.GAME_SPEED.INITIAL) * speedProgress;

    Spawner.update(deltaTime, game, game.gameSpeed);

    for (var i = game.obstacles.length - 1; i >= 0; i--) {
      var obs = game.obstacles[i];
      obs.update(deltaTime, game.gameSpeed);

      if (!obs.passed && Physics.checkCarriageObstacleCollision(carriage, obs)) {
        obs.passed = true;
        handleObstacleCollision(obs);
      }

      if (obs.isOffScreen()) {
        game.obstacles.splice(i, 1);
      }
    }

    for (var j = game.items.length - 1; j >= 0; j--) {
      var item = game.items[j];
      item.update(deltaTime, game.gameSpeed);

      if (!item.collected && Physics.checkCarriageItemCollision(carriage, item)) {
        item.collected = true;
        handleItemCollect(item);
      }

      if (item.isOffScreen() || item.collected) {
        game.items.splice(j, 1);
      }
    }

    for (var k = game.particles.length - 1; k >= 0; k--) {
      game.particles[k].update(deltaTime);
      if (game.particles[k].isDead()) {
        game.particles.splice(k, 1);
      }
    }

    game.saveTimer += deltaTime;
    if (game.saveTimer > 1000) {
      game.saveTimer = 0;
      saveState();
    }

    if (carriage.hp <= 0) {
      gameOver();
    }
  }

  function handleObstacleCollision(obstacle) {
    var carriage = game.carriage;
    var isDead = carriage.takeDamage(obstacle.type.damage);

    createHitParticles(carriage.x, carriage.y + carriage.height / 2);

    if (isDead) {
      gameOver();
    }
  }

  function handleItemCollect(item) {
    var carriage = game.carriage;

    switch (item.typeId) {
      case 'coin':
        var coinScore = CONFIG.ITEM_TYPES.coin.score * carriage.type.scoreMultiplier;
        game.score += coinScore;
        game.distance += coinScore * 0.5;
        createCollectParticles(item.x, item.y, '#FFD700');
        break;
      case 'shield':
        carriage.applyShield(CONFIG.ITEM_TYPES.shield.duration);
        createCollectParticles(item.x, item.y, '#4169E1');
        break;
      case 'boost':
        carriage.applyBoost(CONFIG.ITEM_TYPES.boost.duration, CONFIG.ITEM_TYPES.boost.multiplier);
        createCollectParticles(item.x, item.y, '#FF4500');
        break;
      case 'heart':
        carriage.heal(CONFIG.ITEM_TYPES.heart.healAmount);
        createCollectParticles(item.x, item.y, '#FF1493');
        break;
    }
  }

  function createHitParticles(x, y) {
    var colors = ['#ff4444', '#ff8800', '#ffaa00'];
    for (var i = 0; i < 15; i++) {
      var color = colors[Math.floor(Math.random() * colors.length)];
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      var p = new Entities.Particle(
        x, y, color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 2,
        400 + Math.random() * 300,
        3 + Math.random() * 4
      );
      game.particles.push(p);
    }
  }

  function createCollectParticles(x, y, color) {
    for (var i = 0; i < 10; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3;
      var p = new Entities.Particle(
        x, y, color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 3,
        500 + Math.random() * 300,
        2 + Math.random() * 3
      );
      game.particles.push(p);
    }
  }

  function render() {
    Render.clear();

    Render.drawBackground(game.gameSpeed, 16);

    if (game.state === STATE.PLAYING || game.state === STATE.PAUSED || game.state === STATE.GAMEOVER) {
      var items = game.items.slice().sort(function(a, b) {
        return a.y - b.y;
      });

      var obstacles = game.obstacles.slice().sort(function(a, b) {
        return a.y - b.y;
      });

      for (var i = 0; i < obstacles.length; i++) {
        Render.drawObstacle(obstacles[i]);
      }

      for (var j = 0; j < items.length; j++) {
        if (items[j].y < game.carriage.y) {
          Render.drawItem(items[j]);
        }
      }

      if (game.carriage) {
        Render.drawCarriage(game.carriage);
      }

      for (var k = 0; k < items.length; k++) {
        if (items[k].y >= game.carriage.y) {
          Render.drawItem(items[k]);
        }
      }

      Render.drawParticles(game.particles);

      if (game.state === STATE.PLAYING) {
        Render.drawJumpIndicator(game.carriage);
      }
    }

    if (game.state === STATE.PLAYING) {
      Render.drawHUD(game);
    }
  }

  function startGame(carriageTypeId) {
    game.state = STATE.PLAYING;
    UI.hideAll();

    game.score = 0;
    game.distance = 0;
    game.gameSpeed = CONFIG.GAME_SPEED.INITIAL;
    game.obstacles = [];
    game.items = [];
    game.particles = [];
    game.saveTimer = 0;

    var startX = CONFIG.LANE.CENTER;
    var startY = CONFIG.GROUND.Y - 70;
    game.carriage = new Entities.Carriage(carriageTypeId, startX, startY);
    game.carriage.invincible = true;
    game.carriage.invincibleTimer = 2000;

    Spawner.reset();
    Input.reset();

    saveState();
  }

  function pauseGame() {
    game.state = STATE.PAUSED;
    saveState();
    UI.showPause();
  }

  function resumeGame() {
    game.state = STATE.PLAYING;
    UI.hideAll();
    game.lastTime = performance.now();
  }

  function gameOver() {
    game.state = STATE.GAMEOVER;

    Storage.setHighScore(game.score);
    Storage.setHighDistance(Math.floor(game.distance));

    game.highScore = Storage.getHighScore();
    game.highDistance = Storage.getHighDistance();

    saveState();

    setTimeout(function() {
      UI.showGameOver();
    }, 500);
  }

  function backToMenu() {
    game.state = STATE.MENU;
    game.obstacles = [];
    game.items = [];
    game.particles = [];
    Storage.clearGameState();
    UI.showMenu();
  }

  function saveState() {
    var state = {
      state: game.state,
      score: game.score,
      distance: game.distance,
      gameSpeed: game.gameSpeed,
      carriage: null
    };

    if (game.carriage) {
      state.carriage = {
        typeId: game.carriage.typeId,
        x: game.carriage.x,
        y: game.carriage.y,
        vx: game.carriage.vx,
        vy: game.carriage.vy,
        hp: game.carriage.hp,
        maxHp: game.carriage.maxHp,
        shielded: game.carriage.shielded,
        shieldTimer: game.carriage.shieldTimer,
        boosted: game.carriage.boosted,
        boostTimer: game.carriage.boostTimer,
        boostMultiplier: game.carriage.boostMultiplier,
        invincible: game.carriage.invincible,
        invincibleTimer: game.carriage.invincibleTimer,
        isOnGround: game.carriage.isOnGround,
        isJumping: game.carriage.isJumping
      };
    }

    state.obstacles = [];
    for (var i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i];
      state.obstacles.push({
        typeId: o.typeId,
        x: o.x,
        y: o.y,
        lane: o.lane
      });
    }

    state.items = [];
    for (var j = 0; j < game.items.length; j++) {
      var it = game.items[j];
      state.items.push({
        typeId: it.typeId,
        x: it.x,
        y: it.y
      });
    }

    Storage.saveGameState(state);
  }

  function restoreState(state) {
    game.state = state.state;
    game.score = state.score;
    game.distance = state.distance;
    game.gameSpeed = state.gameSpeed || CONFIG.GAME_SPEED.INITIAL;
    game.obstacles = [];
    game.items = [];
    game.particles = [];

    if (state.carriage) {
      var c = state.carriage;
      game.carriage = new Entities.Carriage(c.typeId, c.x, c.y);
      game.carriage.vx = c.vx;
      game.carriage.vy = c.vy;
      game.carriage.hp = c.hp;
      game.carriage.maxHp = c.maxHp;
      game.carriage.shielded = c.shielded;
      game.carriage.shieldTimer = c.shieldTimer;
      game.carriage.boosted = c.boosted;
      game.carriage.boostTimer = c.boostTimer;
      game.carriage.boostMultiplier = c.boostMultiplier;
      game.carriage.invincible = c.invincible;
      game.carriage.invincibleTimer = c.invincibleTimer;
      game.carriage.isOnGround = c.isOnGround !== undefined ? c.isOnGround : true;
      game.carriage.isJumping = c.isJumping !== undefined ? c.isJumping : false;

      if (game.state === STATE.PLAYING) {
        game.carriage.invincible = true;
        game.carriage.invincibleTimer = Math.max(game.carriage.invincibleTimer || 0, 1500);
      }
    }

    if (state.obstacles) {
      for (var i = 0; i < state.obstacles.length; i++) {
        var o = state.obstacles[i];
        game.obstacles.push(new Entities.Obstacle(o.typeId, o.x, o.y, o.lane));
      }
    }

    if (state.items) {
      for (var j = 0; j < state.items.length; j++) {
        var it = state.items[j];
        game.items.push(new Entities.Item(it.typeId, it.x, it.y));
      }
    }

    UI.hideAll();
  }

  return {
    init: init,
    startGame: startGame,
    pauseGame: pauseGame,
    resumeGame: resumeGame,
    gameOver: gameOver,
    backToMenu: backToMenu,
    getState: function() { return game; },
    saveNow: saveState
  };
})();
