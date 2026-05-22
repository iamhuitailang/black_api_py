var Lift = (function() {
  var liftState = {
    active: false,
    type: null,
    weight: 0,
    phase: null,
    phaseIndex: 0,
    phaseTimer: 0,
    phaseDuration: 0,
    power: 0,
    pullCount: 0,
    pullTimer: 0,
    lockHoldTimer: 0,
    isLocking: false,
    barHeight: 0,
    barSag: 0,
    result: null,
    success: false,
    elapsed: 0,
    barVelocity: 0,
    athleteY: 0,
    athleteState: 'idle',
    shakeAmount: 0,
    lastPullTime: 0,
    phasePower: 0,
    phaseStarted: false
  };

  function start(liftType, weight) {
    liftState.active = true;
    liftState.type = liftType;
    liftState.weight = weight;
    liftState.phase = liftType.phases[0];
    liftState.phaseIndex = 0;
    liftState.phaseTimer = 0;
    liftState.phaseDuration = CONFIG.phaseConfig[liftState.phase].duration;
    liftState.power = 0;
    liftState.phasePower = 0;
    liftState.pullCount = 0;
    liftState.pullTimer = 0;
    liftState.lockHoldTimer = 0;
    liftState.isLocking = false;
    liftState.barHeight = 0;
    liftState.barSag = 0;
    liftState.result = null;
    liftState.success = false;
    liftState.elapsed = 0;
    liftState.barVelocity = 0;
    liftState.athleteY = 0;
    liftState.athleteState = 'idle';
    liftState.shakeAmount = 0;
    liftState.lastPullTime = 0;
    liftState.phaseStarted = false;
  }

  function stop() {
    liftState.active = false;
  }

  function isActive() {
    return liftState.active;
  }

  function getState() {
    return liftState;
  }

  function getPhase() {
    return liftState.phase;
  }

  function getPhaseIndex() {
    return liftState.phaseIndex;
  }

  function getWeight() {
    return liftState.weight;
  }

  function getType() {
    return liftState.type;
  }

  function getThreshold() {
    var phaseCfg = CONFIG.phaseConfig[liftState.phase];
    if (!phaseCfg) return 50;
    return phaseCfg.powerNeeded;
  }

  function advancePhase() {
    liftState.phaseIndex++;
    if (liftState.phaseIndex >= liftState.type.phases.length) {
      liftState.success = true;
      liftState.active = false;
      liftState.result = 'good';
      return true;
    }
    liftState.phase = liftState.type.phases[liftState.phaseIndex];
    liftState.phaseTimer = 0;
    liftState.phaseDuration = CONFIG.phaseConfig[liftState.phase].duration;
    liftState.phasePower = 0;
    liftState.pullCount = 0;
    liftState.pullTimer = 0;
    liftState.isLocking = false;
    liftState.lockHoldTimer = 0;
    liftState.phaseStarted = false;
    return false;
  }

  function fail(reason) {
    liftState.active = false;
    liftState.success = false;
    liftState.result = reason || 'fail';
    liftState.shakeAmount = 15;
  }

  function onPull(data) {
    if (!liftState.active) return;
    if (liftState.phase === 'pull') {
      liftState.pullCount = data.count;
      liftState.lastPullTime = Date.now();
      var pullPower = Math.min(100, liftState.pullCount * 10);
      liftState.phasePower = Math.max(liftState.phasePower, pullPower);
      liftState.power = liftState.phasePower;
      liftState.barVelocity += 0.8;
    }
  }

  function onSquat() {
    if (!liftState.active) return;
    if (liftState.phase === 'squat' || liftState.phase === 'dip') {
      liftState.phasePower = 100;
      liftState.power = 100;
      liftState.athleteState = 'squat';
      liftState.phaseStarted = true;
    }
  }

  function onJerk() {
    if (!liftState.active) return;
    if (liftState.phase === 'stand' || liftState.phase === 'jerk') {
      liftState.phasePower = 100;
      liftState.power = 100;
      liftState.athleteState = 'jerk';
      liftState.phaseStarted = true;
    }
  }

  function onLock() {
    if (!liftState.active) return;
    if (liftState.phase === 'lock') {
      liftState.isLocking = true;
    }
  }

  function onLockRelease() {
    if (!liftState.active) return;
    if (liftState.phase === 'lock') {
      liftState.isLocking = false;
    }
  }

  function update(dt) {
    if (!liftState.active) return;

    liftState.elapsed += dt;
    liftState.phaseTimer += dt;

    if (liftState.shakeAmount > 0) {
      liftState.shakeAmount = Math.max(0, liftState.shakeAmount - dt * 30);
    }

    var phaseCfg = CONFIG.phaseConfig[liftState.phase];
    if (!phaseCfg) return;

    switch (liftState.phase) {
      case 'pull':
        var now = Date.now();
        if (now - liftState.lastPullTime > 500 && liftState.pullCount > 0) {
          liftState.phasePower = Math.max(0, liftState.phasePower - dt * 10);
          liftState.power = liftState.phasePower;
          liftState.pullCount = Math.max(0, liftState.pullCount - 1);
        }
        liftState.barHeight += liftState.barVelocity * dt * 50;
        liftState.barVelocity *= 0.95;
        liftState.barSag = Math.sin(liftState.elapsed * 20) * 3 * (liftState.weight / 200);

        if (liftState.phaseTimer >= liftState.phaseDuration) {
          var threshold = getThreshold();
          if (liftState.phasePower >= threshold) {
            advancePhase();
          } else {
            fail('pull_fail');
          }
        }
        break;

      case 'squat':
      case 'dip':
        liftState.barSag = Math.sin(liftState.elapsed * 15) * 2;

        if (liftState.phaseTimer >= liftState.phaseDuration) {
          var threshold2 = getThreshold();
          if (liftState.phasePower >= threshold2) {
            advancePhase();
          } else {
            fail('squat_fail');
          }
        }
        break;

      case 'stand':
      case 'jerk':
        liftState.barHeight += liftState.phasePower * dt * 25;
        liftState.barSag = Math.sin(liftState.elapsed * 18) * 3;

        if (liftState.phaseTimer >= liftState.phaseDuration) {
          var threshold3 = getThreshold();
          if (liftState.phasePower >= threshold3) {
            advancePhase();
          } else {
            fail('jerk_fail');
          }
        }
        break;

      case 'lock':
        liftState.barSag = 0;
        if (liftState.isLocking) {
          liftState.lockHoldTimer += dt;
          liftState.phasePower = 80;
          liftState.power = 80;
          if (liftState.lockHoldTimer >= CONFIG.gameConfig.lockHoldTime) {
            liftState.phasePower = 100;
            liftState.power = 100;
            advancePhase();
          }
        } else {
          liftState.phasePower = Math.max(0, liftState.phasePower - dt * 10);
          liftState.power = liftState.phasePower;
          if (liftState.phaseTimer >= liftState.phaseDuration + 2) {
            fail('lock_fail');
          }
        }
        break;
    }

    liftState.barHeight = Math.max(0, Math.min(250, liftState.barHeight));
  }

  function isComplete() {
    return liftState.success;
  }

  function isFailed() {
    return !liftState.active && !liftState.success && liftState.result !== null;
  }

  function getResult() {
    return liftState.result;
  }

  return {
    start: start,
    stop: stop,
    isActive: isActive,
    getState: getState,
    getPhase: getPhase,
    getPhaseIndex: getPhaseIndex,
    getWeight: getWeight,
    getType: getType,
    update: update,
    onPull: onPull,
    onSquat: onSquat,
    onJerk: onJerk,
    onLock: onLock,
    onLockRelease: onLockRelease,
    isComplete: isComplete,
    isFailed: isFailed,
    getResult: getResult,
    getThreshold: getThreshold,
    fail: fail
  };
})();