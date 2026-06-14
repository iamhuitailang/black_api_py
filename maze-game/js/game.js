class GameController {
  constructor() {
    this.maze = null;
    this.player = null;
    this.guards = [];
    this.keys = [];
    this.fog = null;
    this.currentFloor = 1;
    this.maxFloor = 1;
    this.totalTime = 0;
    this.floorBestTimes = {};
    this.floorStartTime = 0;
    this.gameStartTime = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.doorOpen = false;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
    this.soundManager = new SoundManager();
    this.storage = new GameStorage();
    this.onStateChange = null;
    this.onNeedSave = null;
  }

  newGame() {
    this.currentFloor = 1;
    this.maxFloor = 1;
    this.totalTime = 0;
    this.floorBestTimes = {};
    this.isGameOver = false;
    this.isVictory = false;
    this.gameStartTime = performance.now();

    this._generateFloor(1);

    if (this.player) {
      this.player.lives = GameConstants.PLAYER_LIVES;
    }

    this._notifyStateChange();
  }

  _generateFloor(floorNum) {
    this.maze = new MazeGenerator(GameConstants.MAZE_WIDTH, GameConstants.MAZE_HEIGHT);
    this.maze.generate();

    if (!this.player) {
      this.player = new Player(this.maze.startPos.x, this.maze.startPos.y);
    } else {
      this.player.setStartPosition(this.maze.startPos.x, this.maze.startPos.y);
      this.player.resetFloor();
    }

    this.keys = this.maze.generateKeys(GameConstants.KEYS_PER_FLOOR);

    this.fog = new FogOfWar(GameConstants.MAZE_WIDTH, GameConstants.MAZE_HEIGHT);
    this.fog.update(this.player.x, this.player.y, this.maze);

    const guardCount = Math.min(floorNum, GameConstants.MAX_GUARDS);
    this.guards = [];

    for (let i = 0; i < guardCount; i++) {
      const guardPos = this.maze.getRandomFloorPosition([
        this.maze.startPos,
        this.maze.exitPos,
        ...this.keys,
        ...this.guards.map(g => ({ x: g.x, y: g.y })),
      ]);

      if (guardPos) {
        const path = this.maze.generatePatrolPath(guardPos.x, guardPos.y, 6 + floorNum);
        const guard = new Guard(guardPos.x, guardPos.y, path);
        guard.lastMoveTime = performance.now();
        guard.prevX = guardPos.x;
        guard.prevY = guardPos.y;
        this.guards.push(guard);
      }
    }

    this.floorStartTime = performance.now();
    this.doorOpen = false;
  }

  nextFloor() {
    const floorTime = performance.now() - this.floorStartTime;
    const currentBest = this.floorBestTimes[this.currentFloor] || Infinity;
    if (floorTime < currentBest) {
      this.floorBestTimes[this.currentFloor] = floorTime;
    }

    this.currentFloor++;
    if (this.currentFloor > this.maxFloor) {
      this.maxFloor = this.currentFloor;
    }

    if (this.currentFloor > GameConstants.TOTAL_FLOORS) {
      this.victory();
      return;
    }

    this.soundManager.playDoorOpen();
    this._generateFloor(this.currentFloor);
    this._notifyStateChange();
    this._requestSave();
  }

  victory() {
    this.isVictory = true;
    this.isRunning = false;
    this.totalTime = performance.now() - this.gameStartTime;
    this.soundManager.playVictory();
    this._notifyStateChange();
  }

  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this._notifyStateChange();
  }

  movePlayer(dx, dy) {
    if (!this.isRunning || this.isPaused || this.player.isMoving) return false;
    if (this.isGameOver || this.isVictory) return false;

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    if (!this.maze.isWalkable(nx, ny)) return false;

    this.player.moveTo(nx, ny);
    this.soundManager.playFootstep();

    this.keys.forEach(key => {
      if (!key.collected && key.x === nx && key.y === ny) {
        key.collected = true;
        this.player.collectKey(key.color);
        this.soundManager.playKeyPickup();

        if (this.player.hasAllKeys() && !this.doorOpen) {
          this.doorOpen = true;
          this.soundManager.playDoorOpen();
        }
      }
    });

    if (this.doorOpen && nx === this.maze.exitPos.x && ny === this.maze.exitPos.y) {
      this.nextFloor();
    }

    this._requestSave();
    return true;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    const now = performance.now();
    this.guards.forEach(g => {
      g.lastMoveTime = now;
      g.prevX = g.x;
      g.prevY = g.y;
    });
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isGameOver || this.isVictory) return;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    const now = performance.now();
    this.guards.forEach(g => {
      g.lastMoveTime = now;
      g.prevX = g.x;
      g.prevY = g.y;
    });
  }

  stop() {
    this.isRunning = false;
  }

  tick(currentTime) {
    if (!this.isRunning || this.isPaused) return;
    if (this.isGameOver || this.isVictory) return;

    this._update(currentTime);
  }

  _update(currentTime) {
    this.player.update(currentTime);
    this.fog.update(Math.floor(this.player.x), Math.floor(this.player.y), this.maze);

    let nearestGuardDist = Infinity;

    this.guards.forEach(guard => {
      guard.update(currentTime, this.maze, this.player.x, this.player.y);

      const dist = Utils.euclideanDistance(
        guard.renderX, guard.renderY,
        this.player.renderX, this.player.renderY
      );

      if (guard.state !== 'chase' &&
          guard.canSeePlayer(this.player.x, this.player.y, this.maze) &&
          this.fog.isVisible(Math.floor(guard.x), Math.floor(guard.y))) {
        guard.startChase(this.player.x, this.player.y, currentTime);
      }

      if (guard.state === 'chase') {
        guard.chaseTarget = { x: this.player.x, y: this.player.y };
      }

      if (dist < nearestGuardDist) {
        nearestGuardDist = dist;
      }

      if (guard.isAtPlayer(this.player.x, this.player.y)) {
        this._playerCaught();
      }
    });

    if (nearestGuardDist < 10) {
      this.soundManager.updateHeartbeat(nearestGuardDist);
    } else {
      this.soundManager.stopHeartbeat();
    }
  }

  _playerCaught() {
    this.soundManager.playCaught();
    this.soundManager.stopHeartbeat();

    if (window.gameRenderer) {
      window.gameRenderer.triggerScreenShake(200, 6);
      window.gameRenderer.triggerRedFlash(300);
    }

    const alive = this.player.loseLife();
    if (!alive) {
      this.gameOver();
      return;
    }

    this.player.resetPosition();
    this.guards.forEach(guard => {
      guard.state = 'patrol';
      guard.chaseTarget = null;
    });

    this._notifyStateChange();
  }

  hasSaveGame() {
    return this.storage.hasSave();
  }

  loadGame() {
    const data = this.storage.load();
    if (!data) return false;

    try {
      this.currentFloor = data.currentFloor || 1;
      this.maxFloor = data.maxFloor || 1;
      this.totalTime = data.totalTime || 0;
      this.floorBestTimes = data.floorBestTimes || {};
      this.floorStartTime = data.floorStartTime || performance.now();

      if (data.maze) {
        this.maze = MazeGenerator.fromJSON(data.maze);
      }

      if (data.player) {
        this.player = Player.fromJSON(data.player);
      }

      if (data.keys) {
        this.keys = data.keys.map(k => ({ ...k }));
      }

      if (data.guards) {
        this.guards = data.guards.map(g => Guard.fromJSON(g));
        const now = performance.now();
        this.guards.forEach(g => {
          g.lastMoveTime = now;
          g.prevX = g.x;
          g.prevY = g.y;
        });
      }

      if (data.fog) {
        this.fog = FogOfWar.fromJSON(data.fog);
      }

      this.doorOpen = this.player && this.player.hasAllKeys();
      this.isGameOver = false;
      this.isVictory = false;
      this.gameStartTime = performance.now() - this.totalTime;

      this._notifyStateChange();
      return true;
    } catch (e) {
      console.error('Load game failed:', e);
      return false;
    }
  }

  saveGame() {
    const gameState = {
      currentFloor: this.currentFloor,
      maxFloor: this.maxFloor,
      totalTime: this.totalTime + (performance.now() - this.gameStartTime),
      floorBestTimes: this.floorBestTimes,
      player: this.player,
      maze: this.maze,
      keys: this.keys,
      guards: this.guards,
      fog: this.fog,
      floorStartTime: this.floorStartTime,
    };

    return this.storage.save(gameState);
  }

  _requestSave() {
    if (this.onNeedSave) {
      this.onNeedSave();
    }
  }

  _notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange('state');
    }
  }

  getState() {
    return {
      currentFloor: this.currentFloor,
      maxFloor: this.maxFloor,
      totalTime: this.totalTime,
      floorBestTimes: this.floorBestTimes,
      player: this.player,
      maze: this.maze,
      keys: this.keys,
      guards: this.guards,
      fog: this.fog,
      doorOpen: this.doorOpen,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
      floorStartTime: this.floorStartTime,
      soundEnabled: this.soundManager.enabled,
    };
  }

  toggleSound() {
    return this.soundManager.toggle();
  }

  destroy() {
    this.stop();
    this.soundManager.destroy();
  }
}

if (typeof window !== 'undefined') {
  window.GameController = GameController;
}
