window.SIQIU = window.SIQIU || {};

SIQIU.Game = {
  state: null,

  createInitialState() {
    const cfg = SIQIU.GAME_CONFIG;
    const character = SIQIU.CHARACTERS.find(c => c.id === SIQIU.Storage.load().character) || SIQIU.CHARACTERS[0];
    const stadium = SIQIU.STADIUMS.find(s => s.id === SIQIU.Storage.load().stadium) || SIQIU.STADIUMS[0];
    const ball = SIQIU.Physics.createBall({ x: cfg.shoterX, y: cfg.shoterY - 38, r: cfg.ballR });
    const gk = SIQIU.Goalkeeper.create(stadium);
    return {
      phase: 'aim',
      round: 1,
      score: 0,
      combo: 0,
      maxCombo: 0,
      goals: 0,
      aimAngle: 0,
      power: 1,
      charging: false,
      character,
      stadium,
      shotType: SIQIU.SHOT_TYPES[0],
      ball,
      goalkeeper: gk,
      messages: [],
      floatingTexts: [],
      result: null,
      roundResultTimer: 0,
      pendingResult: null
    };
  },

  start() {
    this.state = this.createInitialState();
    this._persistProgress();
    return this.state;
  },

  loadOrStart() {
    const save = SIQIU.Storage.load();
    if (save.progress && save.progress.phase && save.progress.phase !== 'done' && save.progress.round <= SIQIU.GAME_CONFIG.maxRounds) {
      try {
        const s = save.progress;
        const character = SIQIU.CHARACTERS.find(c => c.id === s.characterId) || SIQIU.CHARACTERS[0];
        const stadium = SIQIU.STADIUMS.find(st => st.id === s.stadiumId) || SIQIU.STADIUMS[0];
        const cfg = SIQIU.GAME_CONFIG;
        const ball = s.ball && s.ball.state === 'flying'
          ? Object.assign(SIQIU.Physics.createBall({ x: cfg.shoterX, y: cfg.shoterY - 38, r: cfg.ballR }), s.ball)
          : SIQIU.Physics.createBall({ x: cfg.shoterX, y: cfg.shoterY - 38, r: cfg.ballR });
        if (!ball.trail) ball.trail = [];
        const gk = Object.assign(SIQIU.Goalkeeper.create(stadium), s.goalkeeper || {});
        const shotType = SIQIU.SHOT_TYPES.find(t => t.id === s.shotTypeId) || SIQIU.SHOT_TYPES[0];
        this.state = {
          phase: s.phase || 'aim',
          round: s.round || 1,
          score: s.score || 0,
          combo: s.combo || 0,
          maxCombo: s.maxCombo || 0,
          goals: s.goals || 0,
          aimAngle: s.aimAngle || 0,
          power: s.power || 1,
          charging: false,
          character,
          stadium,
          shotType,
          ball,
          goalkeeper: gk,
          messages: [],
          floatingTexts: [],
          result: null,
          roundResultTimer: 0,
          pendingResult: null
        };
        return this.state;
      } catch (e) {
        console.warn('恢复进度失败，重新开始', e);
      }
    }
    return this.start();
  },

  _persistProgress() {
    const s = this.state;
    if (!s) return;
    SIQIU.Storage.update({
      progress: {
        phase: s.phase,
        round: s.round,
        score: s.score,
        combo: s.combo,
        maxCombo: s.maxCombo,
        goals: s.goals,
        aimAngle: s.aimAngle,
        power: s.power,
        characterId: s.character.id,
        stadiumId: s.stadium.id,
        shotTypeId: s.shotType.id,
        ball: {
          x: s.ball.x, y: s.ball.y, z: s.ball.z,
          vx: s.ball.vx, vy: s.ball.vy, vz: s.ball.vz,
          state: s.ball.state, angle: s.ball.angle,
          power: s.ball.power, spin: s.ball.spin,
          type: s.ball.type, wind: s.ball.wind,
          friction: s.ball.friction
        },
        goalkeeper: {
          x: s.goalkeeper.x,
          state: s.goalkeeper.state,
          jumpZ: s.goalkeeper.jumpZ,
          reactionCooldown: s.goalkeeper.reactionCooldown
        }
      }
    });
  },

  setCharacter(id) {
    const c = SIQIU.CHARACTERS.find(c => c.id === id);
    if (c) {
      SIQIU.Storage.update({ character: id });
      if (this.state) this.state.character = c;
    }
  },

  setStadium(id) {
    const s = SIQIU.STADIUMS.find(st => st.id === id);
    if (s) {
      SIQIU.Storage.update({ stadium: id });
      if (this.state) {
        this.state.stadium = s;
        this.state.goalkeeper = SIQIU.Goalkeeper.create(s);
      }
    }
  },

  setShotType(id) {
    const t = SIQIU.SHOT_TYPES.find(t => t.id === id);
    if (t && this.state) this.state.shotType = t;
  },

  onDrag({ dx, dy }) {
    const s = this.state;
    if (!s || s.phase !== 'aim') return;
    const cfg = SIQIU.GAME_CONFIG;
    s.aimAngle = SIQIU.Utils.clamp(s.aimAngle - dx * 0.35, cfg.minAngle, cfg.maxAngle);
    const deltaPower = -dy * 0.012;
    s.power = SIQIU.Utils.clamp(s.power + deltaPower, 1, cfg.maxPower);
    this._persistProgress();
  },

  onPressStart() {
    const s = this.state;
    if (!s || s.phase !== 'aim') return;
    s.charging = true;
  },

  onPressEnd() {
    const s = this.state;
    if (!s) return;
    if (s.phase === 'aim' && s.charging) {
      s.charging = false;
      this.shoot();
    }
  },

  updateCharging(dt) {
    const s = this.state;
    if (!s || !s.charging || s.phase !== 'aim') return;
    const cfg = SIQIU.GAME_CONFIG;
    s.power = SIQIU.Utils.clamp(s.power + cfg.powerChargeRate * dt, 1, cfg.maxPower);
  },

  shoot() {
    const s = this.state;
    const cfg = SIQIU.GAME_CONFIG;
    SIQIU.Physics.shoot(s.ball, s.shotType, s.character, s.aimAngle, s.power, s.stadium);
    s.phase = 'flying';
    this._persistProgress();
  },

  update(dt) {
    const s = this.state;
    if (!s) return;
    const cfg = SIQIU.GAME_CONFIG;

    if (s.phase === 'aim') {
      this.updateCharging(dt);
      return;
    }

    if (s.phase === 'flying') {
      const steps = 2;
      for (let i = 0; i < steps; i++) {
        SIQIU.Physics.update(s.ball, 1);
        SIQIU.Goalkeeper.update(s.goalkeeper, s.ball, s.round - 1);
        if (this._checkCollision()) break;
      }
      this._persistProgress();
      return;
    }

    if (s.phase === 'roundResult') {
      s.roundResultTimer -= dt;
      if (s.roundResultTimer <= 0) {
        this._advanceRound();
      }
      return;
    }
  },

  _checkCollision() {
    const s = this.state;
    const cfg = SIQIU.GAME_CONFIG;
    const b = s.ball;

    if (SIQIU.Goalkeeper.checkSave(s.goalkeeper, b)) {
      s.ball.state = 'saved';
      s.phase = 'roundResult';
      s.roundResultTimer = 1.6;
      s.pendingResult = 'saved';
      s.combo = 0;
      this._addFloatingText('扑救成功!', '#ff5252', cfg.canvasW / 2, 220);
      return true;
    }

    if (b.y <= cfg.goalY + 5) {
      const inGoalX = b.x > cfg.goalLeft + 10 && b.x < cfg.goalRight - 10;
      const inGoalZ = b.z < cfg.goalHeight - 10;
      if (inGoalX && inGoalZ) {
        s.ball.state = 'goal';
        s.phase = 'roundResult';
        s.roundResultTimer = 1.6;
        s.pendingResult = 'goal';
        s.combo += 1;
        s.maxCombo = Math.max(s.maxCombo, s.combo);
        s.goals += 1;
        const comboMult = 1 + Math.min(s.combo - 1, 8) * cfg.comboMultiplierStep;
        const gain = Math.round(cfg.baseScore * comboMult);
        s.score += gain;
        this._addFloatingText(`GOAL! +${gain}`, '#ffeb3b', cfg.canvasW / 2, 220);
        if (s.combo >= 2) {
          this._addFloatingText(`${s.combo}连击! x${comboMult.toFixed(2)}`, '#ff9800', cfg.canvasW / 2, 260);
        }
        return true;
      } else {
        s.ball.state = 'miss';
        s.phase = 'roundResult';
        s.roundResultTimer = 1.6;
        s.pendingResult = 'miss';
        s.combo = 0;
        this._addFloatingText('偏出门框!', '#90a4ae', cfg.canvasW / 2, 220);
        return true;
      }
    }

    if (b.y < -50 || b.x < -80 || b.x > cfg.canvasW + 80) {
      s.ball.state = 'miss';
      s.phase = 'roundResult';
      s.roundResultTimer = 1.6;
      s.pendingResult = 'miss';
      s.combo = 0;
      this._addFloatingText('射偏了!', '#90a4ae', cfg.canvasW / 2, 220);
      return true;
    }
    return false;
  },

  _advanceRound() {
    const s = this.state;
    const cfg = SIQIU.GAME_CONFIG;
    s.floatingTexts = s.floatingTexts.filter(t => Date.now() - t.start < 1200);

    if (s.round >= cfg.maxRounds) {
      this._finishGame();
      return;
    }
    s.round += 1;
    s.phase = 'aim';
    s.power = 1;
    s.aimAngle = 0;
    s.ball = SIQIU.Physics.createBall({ x: cfg.shoterX, y: cfg.shoterY - 38, r: cfg.ballR });
    SIQIU.Goalkeeper.reset(s.goalkeeper);
    s.goalkeeper = SIQIU.Goalkeeper.create(s.stadium);
    s.goalkeeper.difficultyRound = s.round;
    s.pendingResult = null;
    this._persistProgress();
  },

  _finishGame() {
    const s = this.state;
    const cfg = SIQIU.GAME_CONFIG;
    s.phase = 'done';
    const cleared = s.score >= cfg.passScore;
    const save = SIQIU.Storage.load();
    const newBest = Math.max(save.best, s.score);
    const newClears = save.clears + (cleared ? 1 : 0);
    SIQIU.Storage.update({
      best: newBest,
      clears: newClears,
      shots: save.shots + cfg.maxRounds,
      goals: save.goals + s.goals,
      maxCombo: Math.max(save.maxCombo, s.maxCombo),
      progress: null
    });
    s.result = {
      cleared,
      score: s.score,
      goals: s.goals,
      maxCombo: s.maxCombo
    };
  },

  _addFloatingText(text, color, x, y) {
    this.state.floatingTexts.push({ text, color, x, y, start: Date.now() });
  },

  quit() {
    if (this.state && this.state.phase !== 'done') {
      this._persistProgress();
    }
  }
};
