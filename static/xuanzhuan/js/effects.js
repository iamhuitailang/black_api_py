var Effects = (function () {

  var activeEffects = [];
  var nextBumpTime = 0;
  var nextWindTime = 0;
  var nextTiltTime = 0;
  var currentTiltAngle = 0;
  var currentTiltDirection = 0;
  var onEffectTrigger = null;

  function init(callback) {
    activeEffects.length = 0;
    nextBumpTime = 0;
    nextWindTime = 0;
    nextTiltTime = 0;
    currentTiltAngle = 0;
    currentTiltDirection = 0;
    onEffectTrigger = callback || null;
  }

  function scheduleFirst(difficulty, now) {
    nextBumpTime = now + randomRange(difficulty.bumpInterval[0], difficulty.bumpInterval[1]);
    nextWindTime = now + randomRange(difficulty.windInterval[0], difficulty.windInterval[1]);
    nextTiltTime = now + randomRange(difficulty.tiltInterval[0], difficulty.tiltInterval[1]);
  }

  function update(now, dt, difficulty, game) {
    if (now >= nextBumpTime) {
      triggerBump(difficulty, game);
      nextBumpTime = now + randomRange(difficulty.bumpInterval[0], difficulty.bumpInterval[1]);
    }

    if (now >= nextWindTime) {
      triggerWind(difficulty, game);
      nextWindTime = now + randomRange(difficulty.windInterval[0], difficulty.windInterval[1]);
    }

    if (now >= nextTiltTime) {
      triggerTilt(difficulty, game);
      nextTiltTime = now + randomRange(difficulty.tiltInterval[0], difficulty.tiltInterval[1]);
    }

    var chars = game.characters;
    var i, j, eff, ch;

    for (i = activeEffects.length - 1; i >= 0; i--) {
      eff = activeEffects[i];
      eff.elapsed += dt;

      if (eff.type === 'tilt') {
        var progress = eff.elapsed / eff.duration;
        if (progress < 0.2) {
          currentTiltAngle = (progress / 0.2) * eff.angle;
        } else if (progress > 0.8) {
          currentTiltAngle = ((1 - progress) / 0.2) * eff.angle;
        } else {
          currentTiltAngle = eff.angle;
        }
        currentTiltDirection = eff.direction;
      }

      if (eff.type === 'wind' && eff.elapsed < eff.duration) {
        var dtScale = dt / 16.67;
        var dir = eff.direction;
        var pushForce = eff.pushForce * dtScale;
        var stabLoss = CONFIG.EFFECTS.wind.stabilityLoss * dt / 1000;
        for (j = 0; j < chars.length; j++) {
          ch = chars[j];
          if (ch.alive && !ch.skillActive) {
            Character.applyPush(ch, pushForce, dir);
            Character.applyStabilityLoss(ch, stabLoss);
          }
        }
      }

      if (eff.type === 'tilt' && eff.elapsed < eff.duration) {
        var tiltPush = currentTiltAngle * 3;
        var tiltDir = tiltPush > 0 ? 1 : -1;
        var tiltForce = Math.abs(tiltPush) * dt / 16.67;
        var tiltLoss = CONFIG.EFFECTS.tilt.stabilityLoss * dt / 1000;
        for (j = 0; j < chars.length; j++) {
          ch = chars[j];
          if (ch.alive && !ch.skillActive) {
            Character.applyPush(ch, tiltForce, tiltDir);
            Character.applyStabilityLoss(ch, tiltLoss);
          }
        }
      }

      if (eff.elapsed >= eff.duration) {
        if (eff.type === 'tilt') {
          currentTiltAngle = 0;
          currentTiltDirection = 0;
        }
        activeEffects.splice(i, 1);
      }
    }
  }

  function triggerBump(difficulty, game) {
    var power = CONFIG.EFFECTS.bump.stabilityLoss * difficulty.bumpPower;
    var chars = game.characters;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch.alive && !ch.skillActive) {
        Character.applyStabilityLoss(ch, power);
        var dir = Math.random() < 0.5 ? -1 : 1;
        Character.applyPush(ch, 3 * difficulty.bumpPower, dir);
      }
    }

    activeEffects.push({
      type: 'bump',
      elapsed: 0,
      duration: CONFIG.EFFECTS.bump.duration,
      power: power
    });
    fireEffect(activeEffects[activeEffects.length - 1]);
  }

  function triggerWind(difficulty, game) {
    var dir = Math.random() < 0.5 ? -1 : 1;
    var pushForce = CONFIG.EFFECTS.wind.pushForce * difficulty.windPower;
    var effect = {
      type: 'wind',
      elapsed: 0,
      duration: CONFIG.EFFECTS.wind.duration,
      direction: dir,
      pushForce: pushForce,
      power: CONFIG.EFFECTS.wind.stabilityLoss * difficulty.windPower
    };
    activeEffects.push(effect);
    fireEffect(effect);

    var chars = game.characters;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i].isAI && chars[i].alive) {
        AI.applyEffectResponse(chars[i], effect, game);
      }
    }
  }

  function triggerTilt(difficulty, game) {
    var dir = Math.random() < 0.5 ? -1 : 1;
    var angle = CONFIG.EFFECTS.tilt.tiltAngle * difficulty.tiltPower * dir;
    var effect = {
      type: 'tilt',
      elapsed: 0,
      duration: CONFIG.EFFECTS.tilt.duration,
      direction: dir,
      angle: angle,
      power: CONFIG.EFFECTS.tilt.stabilityLoss * difficulty.tiltPower
    };
    activeEffects.push(effect);
    fireEffect(effect);

    var chars = game.characters;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i].isAI && chars[i].alive) {
        AI.applyEffectResponse(chars[i], effect, game);
      }
    }
  }

  function fireEffect(effect) {
    if (onEffectTrigger) onEffectTrigger(effect);
  }

  function getActiveEffects() {
    return activeEffects;
  }

  function getCurrentTilt() {
    return { angle: currentTiltAngle, direction: currentTiltDirection };
  }

  function hasEffect(type) {
    for (var i = 0; i < activeEffects.length; i++) {
      if (activeEffects[i].type === type) return true;
    }
    return false;
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  return {
    init: init,
    update: update,
    scheduleFirst: scheduleFirst,
    getActiveEffects: getActiveEffects,
    getCurrentTilt: getCurrentTilt,
    hasEffect: hasEffect
  };

})();
