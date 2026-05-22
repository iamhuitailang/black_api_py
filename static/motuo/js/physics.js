var Physics = (function () {
  var GRAVITY = CONFIG.GRAVITY;
  var AIR_DRAG = 0.998;
  var GROUND_FRICTION = 0.985;
  var WHEEL_RADIUS = 14;

  var state = {
    x: 200,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
    onGround: true,
    onRamp: false,
    currentRamp: null,
    wheelSpin: 0,
    crashed: false,
    crashReason: null,
    flipCount: 0,
    totalRotation: 0,
    hitObstacle: null
  };

  var levelPhysics = {
    gravityMul: 1.0,
    frictionMul: 1.0,
    airDragMul: 1.0,
    safeLandingAngle: 0.9,
    maxSpeedMul: 1.0,
    accelMul: 1.0
  };

  function reset(groundY, physics) {
    state.x = 200;
    state.y = groundY - WHEEL_RADIUS;
    state.vx = 0;
    state.vy = 0;
    state.angle = 0;
    state.angularVel = 0;
    state.onGround = true;
    state.onRamp = false;
    state.currentRamp = null;
    state.wheelSpin = 0;
    state.crashed = false;
    state.crashReason = null;
    state.flipCount = 0;
    state.totalRotation = 0;
    state.hitObstacle = null;

    if (physics) {
      levelPhysics.gravityMul = physics.gravityMul;
      levelPhysics.frictionMul = physics.frictionMul;
      levelPhysics.airDragMul = physics.airDragMul;
      levelPhysics.safeLandingAngle = physics.safeLandingAngle;
      levelPhysics.maxSpeedMul = physics.maxSpeedMul || 1.0;
      levelPhysics.accelMul = physics.accelMul || 1.0;
    } else {
      levelPhysics.gravityMul = 1.0;
      levelPhysics.frictionMul = 1.0;
      levelPhysics.airDragMul = 1.0;
      levelPhysics.safeLandingAngle = 0.9;
      levelPhysics.maxSpeedMul = 1.0;
      levelPhysics.accelMul = 1.0;
    }
  }

  function update(groundY, ramps, obstacles, cameraX, bike, input, dt) {
    if (state.crashed) return;

    var dtFactor = dt / 16.67;
    var maxSpeed = bike.maxSpeed * levelPhysics.maxSpeedMul;

    if (state.onGround) {
      if (input.isDown('right')) {
        state.vx += bike.accel * levelPhysics.accelMul * dtFactor;
      }
      if (input.isDown('left')) {
        state.vx -= bike.accel * 1.5 * levelPhysics.accelMul * dtFactor;
      }

      state.vx = Math.max(-maxSpeed * 0.3, Math.min(maxSpeed, state.vx));

      if (!input.isDown('right') && !input.isDown('left')) {
        state.vx *= GROUND_FRICTION * levelPhysics.frictionMul;
        if (Math.abs(state.vx) < 0.05) state.vx = 0;
      }

      state.angularVel = 0;
      state.angle *= 0.85;
      if (Math.abs(state.angle) < 0.01) state.angle = 0;

      state.wheelSpin += state.vx * 0.1 * dtFactor;

      var rampHit = checkRampEntry(ramps, cameraX);
      if (rampHit) {
        state.onRamp = true;
        state.currentRamp = rampHit;
      }
    }

    if (state.onRamp && state.currentRamp) {
      var ramp = state.currentRamp;
      var rampEndX = ramp.x + ramp.width;

      if (state.x >= rampEndX) {
        state.onRamp = false;
        state.onGround = false;
        var launchAngle = ramp.angle * Math.PI / 180;
        var launchSpeed = Math.max(state.vx, bike.maxSpeed * levelPhysics.maxSpeedMul * 0.7);
        state.vx = launchSpeed * Math.cos(launchAngle);
        state.vy = -launchSpeed * Math.sin(launchAngle) * 1.2;
        state.angle = -launchAngle;
        state.angularVel = -0.02;
        state.currentRamp = null;
      } else {
        var rampAngle = ramp.angle * Math.PI / 180;
        state.angle = -rampAngle;

        var rampProgress = (state.x - ramp.x) / ramp.width;
        rampProgress = Math.max(0, Math.min(1, rampProgress));
        state.y = groundY - WHEEL_RADIUS - rampProgress * ramp.height;
      }
    }

    if (!state.onGround && !state.onRamp) {
      state.vy += GRAVITY * bike.weight * levelPhysics.gravityMul * dtFactor;

      if (input.isDown('up')) {
        state.angularVel -= bike.rotationSpeed * 0.8 * dtFactor;
      }
      if (input.isDown('down')) {
        state.angularVel += bike.rotationSpeed * 0.8 * dtFactor;
      }
      if (input.isDown('left')) {
        state.angularVel -= bike.rotationSpeed * 0.3 * dtFactor;
        state.vx -= bike.airControl * 0.5 * levelPhysics.accelMul * dtFactor;
      }
      if (input.isDown('right')) {
        state.angularVel += bike.rotationSpeed * 0.3 * dtFactor;
        state.vx += bike.airControl * 0.5 * levelPhysics.accelMul * dtFactor;
      }

      state.angularVel *= 0.995;
      state.angle += state.angularVel * dtFactor;
      state.totalRotation += Math.abs(state.angularVel * dtFactor);

      state.vx *= AIR_DRAG * levelPhysics.airDragMul;
      state.vy *= AIR_DRAG * levelPhysics.airDragMul;

      state.x += state.vx * dtFactor;
      state.y += state.vy * dtFactor;
      state.wheelSpin += state.vx * 0.08 * dtFactor;

      checkGroundCollision(groundY, bike);
    } else {
      state.x += state.vx * dtFactor;
    }

    if (obstacles && obstacles.length > 0) {
      checkObstacleCollision(obstacles, cameraX, groundY);
    }

    return state;
  }

  function checkRampEntry(ramps, cameraX) {
    if (!ramps) return null;
    for (var i = 0; i < ramps.length; i++) {
      var ramp = ramps[i];
      if (ramp.hit) continue;
      var wheelBottom = state.y + WHEEL_RADIUS;

      if (state.x >= ramp.x - 10 &&
          state.x <= ramp.x + 30 &&
          wheelBottom >= state.y - 5 &&
          state.vx > 1) {
        ramp.hit = true;
        return ramp;
      }
    }
    return null;
  }

  function checkGroundCollision(groundY, bike) {
    var wheelBottom = state.y + WHEEL_RADIUS;
    if (wheelBottom >= groundY) {
      state.y = groundY - WHEEL_RADIUS;

      var normalizedAngle = normalizeAngle(state.angle);
      var impactAngle = Math.abs(normalizedAngle);

      if (impactAngle > levelPhysics.safeLandingAngle) {
        state.crashed = true;
        state.crashReason = 'landing';
        state.vx = 0;
        state.vy = 0;
        state.angularVel = 0;
        return;
      }

      var bounceFactor = 0.3;
      if (state.vy > 0) {
        state.vy = -state.vy * bounceFactor * (1 - impactAngle * 0.8);
      }
      state.vx *= bike.grip * levelPhysics.frictionMul;

      state.angle = normalizedAngle;
      state.angularVel = 0;

      if (Math.abs(state.vy) < 2 && Math.abs(state.angle) < 0.3) {
        state.onGround = true;
        state.vy = 0;
      }
    }
  }

  function checkObstacleCollision(obstacles, cameraX, groundY) {
    if (state.crashed) return;

    var bikeHalfWidth = 35;
    var bikeTop = state.y - 30;
    var bikeBottom = state.y + WHEEL_RADIUS + 5;

    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      if (ob.hit) continue;

      var obLeft = ob.x - 5;
      var obRight = ob.x + ob.width + 5;
      var obTop = groundY - ob.height - 5;

      if (state.x + bikeHalfWidth > obLeft &&
          state.x - bikeHalfWidth < obRight &&
          bikeBottom > obTop &&
          bikeTop < groundY + 10) {

        if (ob.type === 'oil' || ob.type === 'mud') {
          state.vx *= 0.5;
          state.vy *= 0.8;
          ob.hit = true;
        } else if (ob.type === 'laser' || ob.type === 'glitch') {
          state.crashed = true;
          state.crashReason = 'obstacle';
          state.vx = 0;
          state.vy = 0;
          state.angularVel = 0;
          state.hitObstacle = ob;
          return;
        } else {
          if (!state.onGround && state.vy < 0 && state.y < groundY - ob.height - 20) {
            ob.hit = true;
            state.vy = -state.vy * 0.4;
            state.vx *= 0.6;
          } else {
            state.crashed = true;
            state.crashReason = 'obstacle';
            state.vx = 0;
            state.vy = 0;
            state.angularVel = 0;
            state.hitObstacle = ob;
            return;
          }
        }
      }
    }
  }

  function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  function isOnGround() {
    return state.onGround;
  }

  function isCrashed() {
    return state.crashed;
  }

  function getState() {
    return state;
  }

  function getWheelRadius() {
    return WHEEL_RADIUS;
  }

  return {
    reset: reset,
    update: update,
    isOnGround: isOnGround,
    isCrashed: isCrashed,
    getState: getState,
    getWheelRadius: getWheelRadius
  };
})();
