class Runner {
  constructor(config) {
    this.id = config.id;
    this.teamId = config.teamId;
    this.legIndex = config.legIndex;
    this.color = config.color;
    this.name = config.name || `第${config.legIndex + 1}棒`;
    this.baseSpeed = CONFIG.RUNNER_BASE_SPEED;
    this.speedMultiplier = config.speedMultiplier || 1.0;
    this.position = 0;
    this.velocity = 0;
    this.accelBoost = 0;
    this.lastTapTime = 0;
    this.isRunning = false;
    this.hasFinished = false;
    this.finishTime = null;
    this.handoverComplete = false;
    this.x = 0;
    this.y = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  start() {
    this.isRunning = true;
    this.velocity = this.baseSpeed * this.speedMultiplier * 0.6;
  }

  update(dt, weatherEffect) {
    if (!this.isRunning || this.hasFinished) return;

    if (this.accelBoost > 0) {
      this.accelBoost -= CONFIG.ACCEL_DECAY_RATE * dt;
      if (this.accelBoost < 0) this.accelBoost = 0;
    }

    const targetSpeed = this.baseSpeed * this.speedMultiplier * (1 + weatherEffect) + this.accelBoost;
    this.velocity += (targetSpeed - this.velocity) * Math.min(dt * 3, 1);

    this.position += this.velocity * dt;

    if (this.position >= CONFIG.LEG_LENGTH) {
      this.position = CONFIG.LEG_LENGTH;
      this.hasFinished = true;
      this.finishTime = this.position / this.velocity;
    }

    this.animTimer += dt;
    if (this.animTimer > 0.1) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTimer = 0;
    }
  }

  tapAccelerate(currentTime) {
    if (!this.isRunning) return;
    if (currentTime - this.lastTapTime < CONFIG.TAP_WINDOW) {
      this.accelBoost = Math.min(this.accelBoost + CONFIG.ACCEL_BOOST_PER_TAP, CONFIG.ACCEL_MAX_BOOST);
    } else {
      this.accelBoost = CONFIG.ACCEL_BOOST_PER_TAP;
    }
    this.lastTapTime = currentTime;
  }

  getSpeedPercent() {
    const maxSpeed = this.baseSpeed * this.speedMultiplier * 1.5;
    return Math.min(this.velocity / maxSpeed, 1);
  }

  serialize() {
    return {
      id: this.id,
      teamId: this.teamId,
      legIndex: this.legIndex,
      color: this.color,
      name: this.name,
      baseSpeed: this.baseSpeed,
      speedMultiplier: this.speedMultiplier,
      position: this.position,
      velocity: this.velocity,
      accelBoost: this.accelBoost,
      isRunning: this.isRunning,
      hasFinished: this.hasFinished,
      finishTime: this.finishTime,
      handoverComplete: this.handoverComplete
    };
  }

  static deserialize(data) {
    const runner = new Runner({
      id: data.id,
      teamId: data.teamId,
      legIndex: data.legIndex,
      color: data.color,
      name: data.name,
      speedMultiplier: data.speedMultiplier
    });
    runner.position = data.position;
    runner.velocity = data.velocity;
    runner.accelBoost = data.accelBoost;
    runner.isRunning = data.isRunning;
    runner.hasFinished = data.hasFinished;
    runner.finishTime = data.finishTime;
    runner.handoverComplete = data.handoverComplete;
    return runner;
  }
}