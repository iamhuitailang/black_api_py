class Game {
  constructor() {
    this.gameState = CONFIG.GAME_STATE.MENU;
    this.mode = null;
    this.weather = null;
    this.playerTeam = null;
    this.opponentTeams = [];
    this.currentLeg = 0;
    this.totalTime = 0;
    this.handoffResults = [];
    this.rankings = [];
    this.score = 0;
    this.finished = false;
    this.countdownValue = 3;
    this.handoffWindowActive = false;
    this.handoffPressed = false;
    this.tournamentRound = 1;
    this.tournamentMatches = [];
    this.playerAdvanced = false;
    this.lastFrameTime = 0;
    this.running = false;
    this.rafId = null;
  }

  init(mode) {
    this.mode = mode;
    this.weather = Weather.random();
    this.currentLeg = 0;
    this.totalTime = 0;
    this.handoffResults = [];
    this.score = 0;
    this.finished = false;
    this.countdownValue = 3;
    this.handoffWindowActive = false;
    this.handoffPressed = false;
    this.tournamentRound = 1;
    this.playerAdvanced = false;

    this.playerTeam = new Team({
      id: 'player',
      name: '我的队伍',
      color: CONFIG.TEAM_COLORS[0],
      lane: 3,
      isPlayer: true
    });
    this.playerTeam.initRunners(1.0);

    const modeConfig = CONFIG.MODES[mode];
    this.opponentTeams = [];

    for (let i = 0; i < modeConfig.teamCount - 1; i++) {
      const opponentType = this.pickOpponentType(mode, i);
      const opponentConfig = CONFIG.OPPONENTS[opponentType];
      let lane = i < 3 ? i : i + 1;
      if (lane >= 3) lane++;

      const team = new Team({
        id: `opponent_${i}`,
        name: CONFIG.TEAM_NAMES[i % CONFIG.TEAM_NAMES.length] + '队',
        color: CONFIG.TEAM_COLORS[(i + 1) % CONFIG.TEAM_COLORS.length],
        lane: Math.min(lane, CONFIG.LANE_COUNT - 1),
        isPlayer: false,
        opponentType: opponentType
      });
      team.initRunners(opponentConfig.speedMultiplier);
      this.opponentTeams.push(team);
    }

    this.gameState = CONFIG.GAME_STATE.COUNTDOWN;
    this.saveState();
  }

  pickOpponentType(mode, index) {
    if (mode === 'practice') return 'highschool';
    if (mode === 'friendly') {
      const pool = ['highschool', 'university', 'national'];
      return pool[index % pool.length];
    }
    if (mode === 'tournament') {
      const pool = ['highschool', 'university', 'national', 'worldrecord'];
      return pool[(index + this.tournamentRound - 1) % pool.length];
    }
    if (mode === 'olympic') {
      const pool = ['national', 'worldrecord', 'worldrecord'];
      return pool[index % pool.length];
    }
    return 'national';
  }

  start() {
    this.stop();
    this.running = true;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  loop() {
    if (!this.running) return;
    try {
      const now = performance.now();
      let dt = (now - this.lastFrameTime) / 1000;
      dt = Math.min(dt, 0.1);
      this.lastFrameTime = now;

      this.update(dt);
      Renderer.render(this);
      Renderer.updateEffects(dt);
      UI.updateHUD(this);

      if (this.gameState === CONFIG.GAME_STATE.COUNTDOWN) {
        Renderer.drawCountdown(this.countdownValue);
      }

      this.saveState();
    } catch (e) {
      console.error('Loop error:', e);
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    if (this.gameState === CONFIG.GAME_STATE.COUNTDOWN) {
      this.countdownTimer = (this.countdownTimer || 0) + dt;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdownValue--;
        if (this.countdownValue <= 0) {
          this.gameState = CONFIG.GAME_STATE.RUNNING;
          this.playerTeam.start();
          this.opponentTeams.forEach(t => t.start());
        }
      }
      return;
    }

    if (this.gameState !== CONFIG.GAME_STATE.RUNNING && this.gameState !== CONFIG.GAME_STATE.HANDOFF) {
      return;
    }

    const weatherEffect = Weather.getEffect(this.weather);

    this.playerTeam.update(dt, weatherEffect);

    this.opponentTeams.forEach(team => {
      team.update(dt, weatherEffect);
      const handoff = team.autoHandoff(this.weather);
      if (handoff) {
        team.totalTime += handoff.timePenalty;
      }
    });

    const playerRunner = this.playerTeam.getCurrentRunner();
    if (playerRunner && this.playerTeam.currentLegIndex < 3) {
      const legPos = playerRunner.position;

      if (playerRunner.hasFinished && !playerRunner.handoverComplete) {
        if (this.handoffPressed) {
          this.playerTeam.currentLegIndex++;
          this.playerTeam.totalDistance += playerRunner.position;
          const nextRunner = this.playerTeam.getCurrentRunner();
          if (nextRunner) {
            nextRunner.isRunning = true;
            nextRunner.velocity = playerRunner.velocity * 0.8;
          }
          playerRunner.handoverComplete = true;
          this.handoffPressed = false;
          this.handoffWindowActive = false;
          this.gameState = CONFIG.GAME_STATE.RUNNING;
        } else {
          this.playerTeam.dropCount++;
          this.handoffResults.push(CONFIG.HANDOFF_RESULT.DROP);
          this.playerTeam.handoffResults.push(CONFIG.HANDOFF_RESULT.DROP);
          Renderer.flashHandoffResult(CONFIG.HANDOFF_RESULT.DROP);
          this.playerTeam.totalTime += 1.0;
          this.playerTeam.currentLegIndex++;
          this.playerTeam.totalDistance += playerRunner.position;
          const nextRunner = this.playerTeam.getCurrentRunner();
          if (nextRunner) {
            nextRunner.isRunning = true;
            nextRunner.velocity = playerRunner.velocity * 0.6;
          }
          playerRunner.handoverComplete = true;
          this.handoffWindowActive = false;
          this.gameState = CONFIG.GAME_STATE.RUNNING;
        }
      } else if (!playerRunner.hasFinished) {
        if (Handoff.isInHandoffZone(legPos) && !this.handoffPressed) {
          this.handoffWindowActive = true;
          this.gameState = CONFIG.GAME_STATE.HANDOFF;
        } else if (!Handoff.isInHandoffZone(legPos) && !this.handoffPressed) {
          this.handoffWindowActive = false;
          if (this.gameState === CONFIG.GAME_STATE.HANDOFF) {
            this.gameState = CONFIG.GAME_STATE.RUNNING;
          }
        }
      }
    }

    if (playerRunner && playerRunner.hasFinished && this.playerTeam.currentLegIndex >= 3) {
      this.playerTeam.hasFinished = true;
      this.playerTeam.totalDistance = CONFIG.TRACK_LENGTH;
      playerRunner.handoverComplete = true;
    }

    const currentRunner = this.playerTeam.getCurrentRunner();
    if (currentRunner) {
      this.currentLeg = this.playerTeam.currentLegIndex;
      this.totalTime = this.playerTeam.totalTime;
    }

    if (this.playerTeam.hasFinished && !this.finished) {
      this.finished = true;
      this.gameState = CONFIG.GAME_STATE.FINISHED;
      this.calculateScore();
      UI.showResult(this);
      Storage.clear();
    }

    const allFinished = this.playerTeam.hasFinished &&
      this.opponentTeams.every(t => t.hasFinished);
    if (allFinished && !this.finished) {
      this.finished = true;
      this.gameState = CONFIG.GAME_STATE.FINISHED;
      this.calculateScore();
      UI.showResult(this);
      Storage.clear();
    }
  }

  onHandoff() {
    if (this.gameState !== CONFIG.GAME_STATE.RUNNING && this.gameState !== CONFIG.GAME_STATE.HANDOFF) return;
    if (this.handoffPressed) return;
    if (this.playerTeam.currentLegIndex >= 3) return;

    const runner = this.playerTeam.getCurrentRunner();
    if (!runner) return;

    const legPos = runner.position;
    const result = Handoff.getWindowResult(legPos, this.weather);

    if (result) {
      this.handoffPressed = true;
      this.handoffWindowActive = false;
      this.handoffResults.push(result.result);
      this.playerTeam.handoffResults.push(result.result);
      if (result.result === CONFIG.HANDOFF_RESULT.PERFECT) {
        this.playerTeam.perfectCount++;
      }
      if (result.result === CONFIG.HANDOFF_RESULT.DROP) {
        this.playerTeam.dropCount++;
      }
      this.playerTeam.totalTime += result.timePenalty;
      Renderer.flashHandoffResult(result.result);
      this.gameState = CONFIG.GAME_STATE.RUNNING;
    }
  }

  onAccelerate() {
    if (this.gameState !== CONFIG.GAME_STATE.RUNNING && this.gameState !== CONFIG.GAME_STATE.HANDOFF) return;
    const runner = this.playerTeam.getCurrentRunner();
    if (runner) {
      runner.tapAccelerate(performance.now());
    }
  }

  calculateScore() {
    const tiers = CONFIG.SCORING.tiers;
    let baseScore = 600;
    for (const tier of tiers) {
      if (this.totalTime < tier.maxTime) {
        baseScore = tier.baseScore;
        break;
      }
    }
    const perfectBonus = this.playerTeam.perfectCount * CONFIG.SCORING.perfectBonus;
    this.score = baseScore + perfectBonus;
  }

  pause() {
    if (this.gameState === CONFIG.GAME_STATE.RUNNING || this.gameState === CONFIG.GAME_STATE.HANDOFF) {
      this.previousState = this.gameState;
      this.gameState = CONFIG.GAME_STATE.PAUSED;
      UI.showScreen('pauseScreen');
    }
  }

  resume() {
    if (this.gameState === CONFIG.GAME_STATE.PAUSED) {
      this.gameState = this.previousState || CONFIG.GAME_STATE.RUNNING;
      this.lastFrameTime = performance.now();
      UI.showScreen('gameScreen');
    }
  }

  saveState() {
    Storage.save(this);
  }

  static loadState() {
    const data = Storage.load();
    if (!data) return null;

    const game = new Game();
    game.gameState = data.gameState;
    game.mode = data.mode;
    game.weather = data.weather;
    game.playerTeam = data.playerTeam ? Team.deserialize(data.playerTeam) : null;
    game.opponentTeams = (data.opponentTeams || []).map(t => Team.deserialize(t));
    game.currentLeg = data.currentLeg || 0;
    game.totalTime = data.totalTime || 0;
    game.handoffResults = data.handoffResults || [];
    game.rankings = data.rankings || [];
    game.score = data.score || 0;
    game.finished = data.finished || false;
    game.countdownValue = data.countdownValue || 3;
    game.handoffWindowActive = data.handoffWindowActive || false;
    game.handoffPressed = data.handoffPressed || false;
    game.tournamentRound = data.tournamentRound || 1;
    game.tournamentMatches = data.tournamentMatches || [];
    game.playerAdvanced = data.playerAdvanced || false;
    return game;
  }
}

const GameInstance = new Game();