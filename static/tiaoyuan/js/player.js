function TiaoyuanPlayer() {
  this.x = 100;
  this.y = TiaoyuanConfig.WORLD.groundY;
  this.vx = 0;
  this.vy = 0;
  this.state = 'idle';
  this.speed = 0;
  this.chargeTime = 0;
  this.pose = 1;
  this.isFoul = false;
  this.foulDistance = 0;
  this.jumpStartX = 0;
  this.landingDistance = 0;
  this.airborneTime = 0;
  this.runDistance = 0;
  this._landed = false;
}

TiaoyuanPlayer.prototype.reset = function() {
  this.x = 100;
  this.y = TiaoyuanConfig.WORLD.groundY;
  this.vx = 0;
  this.vy = 0;
  this.state = 'idle';
  this.speed = 0;
  this.chargeTime = 0;
  this.pose = 1;
  this.isFoul = false;
  this.foulDistance = 0;
  this.jumpStartX = 0;
  this.landingDistance = 0;
  this.airborneTime = 0;
  this.runDistance = 0;
  this._landed = false;
};

TiaoyuanPlayer.prototype.startRun = function() {
  this.state = 'running';
  this.speed = 0;
};

TiaoyuanPlayer.prototype.update = function(dt) {
  var W = TiaoyuanConfig.WORLD;
  var P = TiaoyuanConfig.PHYSICS;

  if (this.state === 'running') {
    this.speed += P.runAccel * dt;
    if (this.speed > P.maxSpeed) this.speed = P.maxSpeed;
    this.x += this.speed * W.scale * dt;
    this.runDistance = (this.x - 100) / W.scale;

    if (this.x >= W.boardX - 3) {
      this.x = W.boardX - 3;
      this.state = 'atBoard';
    }
  } else if (this.state === 'atBoard') {
    this.x = W.boardX - 3;
  } else if (this.state === 'charging') {
    this.chargeTime += dt;
    if (this.chargeTime > P.maxChargeTime) {
      this.chargeTime = P.maxChargeTime;
    }
  } else if (this.state === 'jumping') {
    this.airborneTime += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += P.gravity * dt;

    if (this.y >= W.groundY && !this._landed) {
      this.y = W.groundY;
      this._landed = true;
      this.state = 'landed';
      var raw = (this.x - W.boardX) / W.scale;
      if (raw < 0) raw = 0;
      this.landingDistance = raw;
    }
  }
};

TiaoyuanPlayer.prototype.chargeJump = function() {
  if (this.state === 'running' || this.state === 'atBoard') {
    this.state = 'charging';
    this.chargeTime = 0;
  }
};

TiaoyuanPlayer.prototype.releaseJump = function() {
  if (this.state !== 'charging') return;

  var W = TiaoyuanConfig.WORLD;
  var P = TiaoyuanConfig.PHYSICS;

  if (this.x > W.boardX + W.boardWidth) {
    this.isFoul = true;
    this.foulDistance = (this.x - W.boardX - W.boardWidth) / W.scale;
  }

  this.jumpStartX = this.x;
  var chargeRatio = this.chargeTime / P.maxChargeTime;
  var speedRatio = this.speed / P.maxSpeed;

  var jumpV = P.jumpVBase + chargeRatio * (P.jumpVMax - P.jumpVBase) + speedRatio * 180;
  this.vx = jumpV * Math.cos(P.jumpAngle);
  this.vy = -jumpV * Math.sin(P.jumpAngle);

  this.state = 'jumping';
  this.airborneTime = 0;
  this._landed = false;
};

TiaoyuanPlayer.prototype.setPose = function(poseId) {
  this.pose = poseId;
};

TiaoyuanPlayer.prototype.getFinalDistance = function() {
  if (this.isFoul) return -1;
  var raw = this.landingDistance;

  var pose = TiaoyuanConfig.getPose(this.pose);
  raw *= pose.multiplier;
  raw = TiaoyuanWeather.applyEffect(raw);

  if (raw < 0) raw = 0;
  return Math.round(raw * 100) / 100;
};

TiaoyuanPlayer.prototype.getSpeedRatio = function() {
  return this.speed / TiaoyuanConfig.PHYSICS.maxSpeed;
};

TiaoyuanPlayer.prototype.getChargeRatio = function() {
  return this.chargeTime / TiaoyuanConfig.PHYSICS.maxChargeTime;
};
