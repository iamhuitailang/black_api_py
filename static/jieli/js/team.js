class Team {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.color = config.color;
    this.lane = config.lane;
    this.isPlayer = config.isPlayer || false;
    this.opponentType = config.opponentType || null;
    this.runners = [];
    this.currentLegIndex = 0;
    this.totalDistance = 0;
    this.totalTime = 0;
    this.hasFinished = false;
    this.finishTime = null;
    this.handoffResults = [];
    this.perfectCount = 0;
    this.dropCount = 0;
    this.dropPenalty = 0;
  }

  initRunners(speedMultiplier) {
    this.runners = [];
    for (let i = 0; i < 4; i++) {
      const runner = new Runner({
        id: `${this.id}_runner_${i}`,
        teamId: this.id,
        legIndex: i,
        color: this.color,
        speedMultiplier: speedMultiplier
      });
      this.runners.push(runner);
    }
  }

  getCurrentRunner() {
    return this.runners[this.currentLegIndex];
  }

  getNextRunner() {
    if (this.currentLegIndex < 3) {
      return this.runners[this.currentLegIndex + 1];
    }
    return null;
  }

  start() {
    const runner = this.getCurrentRunner();
    if (runner) runner.start();
  }

  update(dt, weatherEffect) {
    if (this.hasFinished) return;

    const currentRunner = this.getCurrentRunner();
    if (!currentRunner) return;

    currentRunner.update(dt, weatherEffect);

    if (currentRunner.hasFinished && !currentRunner.handoverComplete) {
      if (this.isPlayer) {
        // Player team: handoff handled by game logic
      } else {
        if (this.currentLegIndex < 3) {
          this.currentLegIndex++;
          this.totalDistance += currentRunner.position;
          const nextRunner = this.getCurrentRunner();
          if (nextRunner) {
            nextRunner.isRunning = true;
            nextRunner.velocity = currentRunner.velocity * 0.8;
          }
        } else {
          this.hasFinished = true;
          this.totalDistance = CONFIG.TRACK_LENGTH;
        }
        currentRunner.handoverComplete = true;
      }
    }

    this.totalTime += dt;
  }

  autoHandoff(weather) {
    const currentRunner = this.getCurrentRunner();
    if (!currentRunner || this.isPlayer) return null;

    const legPos = currentRunner.position;
    if (legPos >= CONFIG.HANDOFF_ZONE_START && legPos <= CONFIG.HANDOFF_ZONE_END) {
      const quality = Math.random();
      let result, timePenalty = 0;
      const dropChanceBonus = weather ? weather.dropChance : 0;

      if (quality < 0.4 - dropChanceBonus) {
        result = CONFIG.HANDOFF_RESULT.PERFECT;
        this.perfectCount++;
      } else if (quality < 0.85 - dropChanceBonus) {
        result = CONFIG.HANDOFF_RESULT.GOOD;
        timePenalty = 0.2;
      } else {
        result = CONFIG.HANDOFF_RESULT.DROP;
        this.dropCount++;
        timePenalty = 1.0;
      }

      this.handoffResults.push(result);
      return { result, timePenalty, position: legPos };
    }
    return null;
  }

  getTotalProgress() {
    let total = 0;
    for (let i = 0; i < this.currentLegIndex; i++) {
      total += CONFIG.LEG_LENGTH;
    }
    const current = this.getCurrentRunner();
    if (current && !current.hasFinished) {
      total += current.position;
    } else {
      total += CONFIG.LEG_LENGTH;
    }
    return Math.min(total, CONFIG.TRACK_LENGTH);
  }

  getDisplayTime() {
    let time = this.totalTime;
    if (this.hasFinished && this.finishTime !== null) {
      time = this.finishTime;
    }
    return time;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      lane: this.lane,
      isPlayer: this.isPlayer,
      opponentType: this.opponentType,
      currentLegIndex: this.currentLegIndex,
      totalDistance: this.totalDistance,
      totalTime: this.totalTime,
      hasFinished: this.hasFinished,
      finishTime: this.finishTime,
      handoffResults: this.handoffResults,
      perfectCount: this.perfectCount,
      dropCount: this.dropCount,
      dropPenalty: this.dropPenalty,
      runners: this.runners.map(r => r.serialize())
    };
  }

  static deserialize(data) {
    const team = new Team({
      id: data.id,
      name: data.name,
      color: data.color,
      lane: data.lane,
      isPlayer: data.isPlayer,
      opponentType: data.opponentType
    });
    team.currentLegIndex = data.currentLegIndex;
    team.totalDistance = data.totalDistance;
    team.totalTime = data.totalTime;
    team.hasFinished = data.hasFinished;
    team.finishTime = data.finishTime;
    team.handoffResults = data.handoffResults || [];
    team.perfectCount = data.perfectCount || 0;
    team.dropCount = data.dropCount || 0;
    team.dropPenalty = data.dropPenalty || 0;
    team.runners = (data.runners || []).map(r => Runner.deserialize(r));
    return team;
  }
}