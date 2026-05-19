class Player {
  constructor(id, controls, color, x) {
    this.id = id;
    this.controls = controls;
    this.color = color;
    this.x = x;
    this.y = Constants.PLAYER.START_Y;
    this.speed = 0;
    this.lastKey = null;
    this.lastKeyTime = 0;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.penaltyTimer = 0;
    this.finished = false;
    this.finishTime = 0;
    this.armSwing = 0;
    this.legSwing = 0;
  }

  reset() {
    this.y = Constants.PLAYER.START_Y;
    this.speed = 0;
    this.lastKey = null;
    this.lastKeyTime = 0;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.penaltyTimer = 0;
    this.finished = false;
    this.finishTime = 0;
  }

  handleKey(code, currentTime, difficulty) {
    if (this.finished) return;
    
    if (this.penaltyTimer > 0) return;

    const expectedKey = this.lastKey === this.controls.left ? this.controls.right : this.controls.left;
    
    if (code === this.controls.left || code === this.controls.right) {
      const timeSinceLastKey = currentTime - this.lastKeyTime;
      
      if (code !== this.lastKey && this.lastKey !== null) {
        if (timeSinceLastKey < difficulty.timeWindow) {
          this.combo++;
          this.comboMultiplier = Math.min(1 + this.combo * 0.2, Constants.COMBO.MAX_MULTIPLIER);
          
          const baseMove = difficulty.baseSpeed * this.comboMultiplier;
          this.y = Math.max(Constants.PLAYER.FINISH_Y, this.y - baseMove);
          
          this.armSwing = (this.armSwing + 1) % 2;
          this.legSwing = (this.legSwing + 1) % 2;
        } else {
          this.combo = 0;
          this.comboMultiplier = 1;
          
          const baseMove = difficulty.baseSpeed * 0.5;
          this.y = Math.max(Constants.PLAYER.FINISH_Y, this.y - baseMove);
        }
      } else if (this.lastKey === null) {
        this.combo = 0;
        this.comboMultiplier = 1;
        const baseMove = difficulty.baseSpeed * 0.3;
        this.y = Math.max(Constants.PLAYER.FINISH_Y, this.y - baseMove);
      } else {
        this.penaltyTimer = Constants.COMBO.PENALTY_TIME;
        this.combo = 0;
        this.comboMultiplier = 1;
      }
      
      this.lastKey = code;
      this.lastKeyTime = currentTime;
    }
  }

  update(deltaTime, currentTime) {
    if (this.finished) return;
    
    if (this.penaltyTimer > 0) {
      this.penaltyTimer -= deltaTime;
    }
    
    if (this.lastKey && currentTime - this.lastKeyTime > 1) {
      this.combo = Math.max(0, this.combo - Constants.COMBO.DECAY_RATE * deltaTime);
      this.comboMultiplier = Math.max(1, 1 + this.combo * 0.2);
    }
    
    if (this.y <= Constants.PLAYER.FINISH_Y) {
      this.finished = true;
      this.finishTime = currentTime;
      this.y = Constants.PLAYER.FINISH_Y;
    }
  }

  serialize() {
    return {
      id: this.id,
      y: this.y,
      combo: this.combo,
      comboMultiplier: this.comboMultiplier,
      penaltyTimer: this.penaltyTimer,
      finished: this.finished,
      finishTime: this.finishTime,
      lastKey: this.lastKey,
      lastKeyTime: this.lastKeyTime,
      armSwing: this.armSwing,
      legSwing: this.legSwing
    };
  }

  deserialize(data) {
    this.y = data.y;
    this.combo = data.combo;
    this.comboMultiplier = data.comboMultiplier;
    this.penaltyTimer = data.penaltyTimer;
    this.finished = data.finished;
    this.finishTime = data.finishTime;
    this.lastKey = data.lastKey;
    this.lastKeyTime = data.lastKeyTime;
    this.armSwing = data.armSwing;
    this.legSwing = data.legSwing;
  }
}

class Game {
  constructor() {
    this.state = Constants.GAME_STATE.MENU;
    this.mode = Constants.GAME_MODE.SINGLE;
    this.difficulty = 'EASY';
    this.players = [];
    this.startTime = 0;
    this.currentTime = 0;
    this.countdown = 3;
    this.countdownTimer = 0;
    this.winner = null;
    this.elapsedTime = 0;
  }

  init(mode, difficulty) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.state = Constants.GAME_STATE.COUNTDOWN;
    this.countdown = 3;
    this.countdownTimer = 0;
    this.winner = null;
    this.elapsedTime = 0;
    this.startTime = 0;
    this.currentTime = 0;
    
    this.players = [];
    
    if (mode === Constants.GAME_MODE.SINGLE) {
      this.players.push(new Player(
        1,
        { left: 'ArrowLeft', right: 'ArrowRight' },
        Constants.COLORS.P1,
        Constants.CANVAS_WIDTH / 2
      ));
    } else {
      this.players.push(new Player(
        1,
        { left: 'KeyA', right: 'KeyD' },
        Constants.COLORS.P1,
        Constants.CANVAS_WIDTH * 0.25
      ));
      this.players.push(new Player(
        2,
        { left: 'ArrowLeft', right: 'ArrowRight' },
        Constants.COLORS.P2,
        Constants.CANVAS_WIDTH * 0.75
      ));
    }
  }

  handleKey(code) {
    if (this.state !== Constants.GAME_STATE.PLAYING) return;
    
    const difficulty = Constants.DIFFICULTY[this.difficulty];
    this.players.forEach(player => {
      player.handleKey(code, this.currentTime, difficulty);
    });
  }

  update(deltaTime) {
    this.currentTime += deltaTime;
    
    if (this.state === Constants.GAME_STATE.COUNTDOWN) {
      this.countdownTimer += deltaTime;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdown--;
        if (this.countdown < 0) {
          this.state = Constants.GAME_STATE.PLAYING;
          this.startTime = this.currentTime;
        }
      }
    } else if (this.state === Constants.GAME_STATE.PLAYING) {
      this.elapsedTime = this.currentTime - this.startTime;
      
      this.players.forEach(player => {
        player.update(deltaTime, this.currentTime);
      });
      
      const finishedPlayers = this.players.filter(p => p.finished);
      if (finishedPlayers.length > 0) {
        this.winner = finishedPlayers.reduce((a, b) => 
          a.finishTime < b.finishTime ? a : b
        );
        this.state = Constants.GAME_STATE.FINISHED;
        
        if (this.mode === Constants.GAME_MODE.SINGLE) {
          const time = this.winner.finishTime - this.startTime;
          Storage.saveHighScore(this.mode, this.difficulty, time);
        }
      }
    }
  }

  pause() {
    if (this.state === Constants.GAME_STATE.PLAYING) {
      this.state = Constants.GAME_STATE.PAUSED;
    }
  }

  resume() {
    if (this.state === Constants.GAME_STATE.PAUSED) {
      this.state = Constants.GAME_STATE.PLAYING;
    }
  }

  restart() {
    this.init(this.mode, this.difficulty);
  }

  goToMenu() {
    this.state = Constants.GAME_STATE.MENU;
    this.players = [];
    Storage.clearGameState();
  }

  serialize() {
    return {
      state: this.state,
      mode: this.mode,
      difficulty: this.difficulty,
      startTime: this.startTime,
      currentTime: this.currentTime,
      countdown: this.countdown,
      countdownTimer: this.countdownTimer,
      winner: this.winner ? this.winner.id : null,
      elapsedTime: this.elapsedTime,
      players: this.players.map(p => p.serialize())
    };
  }

  deserialize(data) {
    this.state = data.state;
    this.mode = data.mode;
    this.difficulty = data.difficulty;
    this.startTime = data.startTime;
    this.currentTime = data.currentTime;
    this.countdown = data.countdown;
    this.countdownTimer = data.countdownTimer;
    this.elapsedTime = data.elapsedTime;
    
    this.players = [];
    if (data.mode === Constants.GAME_MODE.SINGLE) {
      const player = new Player(
        1,
        { left: 'ArrowLeft', right: 'ArrowRight' },
        Constants.COLORS.P1,
        Constants.CANVAS_WIDTH / 2
      );
      if (data.players[0]) player.deserialize(data.players[0]);
      this.players.push(player);
      this.winner = data.winner === 1 ? player : null;
    } else {
      const p1 = new Player(
        1,
        { left: 'KeyA', right: 'KeyD' },
        Constants.COLORS.P1,
        Constants.CANVAS_WIDTH * 0.25
      );
      const p2 = new Player(
        2,
        { left: 'ArrowLeft', right: 'ArrowRight' },
        Constants.COLORS.P2,
        Constants.CANVAS_WIDTH * 0.75
      );
      if (data.players[0]) p1.deserialize(data.players[0]);
      if (data.players[1]) p2.deserialize(data.players[1]);
      this.players.push(p1, p2);
      this.winner = data.winner === 1 ? p1 : (data.winner === 2 ? p2 : null);
    }
  }
}
