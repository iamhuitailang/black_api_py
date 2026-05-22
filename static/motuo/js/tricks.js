var Tricks = (function () {
  var state = {
    inAir: false,
    airStartTime: 0,
    wheelieHoldTime: 0,
    stoopieHoldTime: 0,
    lastRotation: 0,
    totalAirRotation: 0,
    rotationDirection: 0,
    currentTrick: null,
    completedTricks: [],
    comboMultiplier: 1,
    lastTrickTime: 0,
    upDownAlternating: 0,
    lastUpDownTime: 0
  };

  function reset() {
    state.inAir = false;
    state.airStartTime = 0;
    state.wheelieHoldTime = 0;
    state.stoopieHoldTime = 0;
    state.lastRotation = 0;
    state.totalAirRotation = 0;
    state.rotationDirection = 0;
    state.currentTrick = null;
    state.completedTricks = [];
    state.comboMultiplier = 1;
    state.lastTrickTime = 0;
    state.upDownAlternating = 0;
    state.lastUpDownTime = 0;
  }

  function update(physState, input, dt, onTrickComplete) {
    var now = Date.now();
    var wasOnGround = !state.inAir;
    var isOnGround = physState.onGround || physState.onRamp;

    if (isOnGround) {
      if (state.inAir) {
        finishAirTricks(onTrickComplete);
        state.inAir = false;
        state.airStartTime = 0;
        state.totalAirRotation = 0;
        state.lastRotation = 0;
      }

      if (input.isDown('up') && physState.vx > 2) {
        state.wheelieHoldTime += dt;
        if (state.wheelieHoldTime > 500 && !state.currentTrick) {
          startTrick('wheelie', onTrickComplete);
        }
      } else {
        if (state.wheelieHoldTime > 500 && state.currentTrick === 'wheelie') {
          completeTrick('wheelie', Math.floor(state.wheelieHoldTime / 100), onTrickComplete);
        }
        state.wheelieHoldTime = 0;
      }

      if (input.isDown('down') && physState.vx > 2) {
        state.stoopieHoldTime += dt;
        if (state.stoopieHoldTime > 500 && !state.currentTrick) {
          startTrick('stoopie', onTrickComplete);
        }
      } else {
        if (state.stoopieHoldTime > 500 && state.currentTrick === 'stoopie') {
          completeTrick('stoopie', Math.floor(state.stoopieHoldTime / 100), onTrickComplete);
        }
        state.stoopieHoldTime = 0;
      }

      if (state.currentTrick && state.currentTrick !== 'wheelie' && state.currentTrick !== 'stoopie') {
        state.currentTrick = null;
      }
    } else {
      if (!state.inAir) {
        state.inAir = true;
        state.airStartTime = now;
        state.totalAirRotation = 0;
        state.lastRotation = physState.angle;
      }

      var rotationDelta = physState.angle - state.lastRotation;
      while (rotationDelta > Math.PI) rotationDelta -= Math.PI * 2;
      while (rotationDelta < -Math.PI) rotationDelta += Math.PI * 2;
      state.totalAirRotation += rotationDelta;
      state.lastRotation = physState.angle;

      if (input.wasPressed('up')) {
        if (state.upDownAlternating === 2 && now - state.lastUpDownTime < 300) {
          completeTrick('full_rotation', 200, onTrickComplete);
          state.upDownAlternating = 0;
        } else {
          state.upDownAlternating = 1;
          state.lastUpDownTime = now;
        }
      }
      if (input.wasPressed('down')) {
        if (state.upDownAlternating === 1 && now - state.lastUpDownTime < 300) {
          state.upDownAlternating = 2;
          state.lastUpDownTime = now;
        } else {
          state.upDownAlternating = 0;
        }
      }

      if (input.isDown('left') && !state.currentTrick) {
        startTrick('side_drift_left', onTrickComplete);
      }
      if (input.isDown('right') && !state.currentTrick) {
        startTrick('side_drift_right', onTrickComplete);
      }

      if (input.wasPressed('jump')) {
        if (state.totalAirRotation > 1.5 || state.totalAirRotation < -1.5) {
          var direction = state.totalAirRotation > 0 ? 'forward' : 'backward';
          completeTrick('flip_' + direction, 150, onTrickComplete);
        } else {
          completeTrick('air_jump', 50, onTrickComplete);
        }
        state.totalAirRotation = 0;
      }
    }
  }

  function startTrick(trickName, onTrickComplete) {
    if (state.currentTrick) return;
    state.currentTrick = trickName;
    if (onTrickComplete) onTrickComplete({ type: 'start', trick: trickName });
  }

  function completeTrick(trickName, baseScore, onTrickComplete) {
    var timeSinceLastTrick = Date.now() - state.lastTrickTime;
    if (timeSinceLastTrick < 2000 && state.completedTricks.length > 0) {
      state.comboMultiplier = Math.min(state.comboMultiplier + 0.5, 5);
    } else {
      state.comboMultiplier = 1;
    }

    var finalScore = Math.floor(baseScore * state.comboMultiplier);

    state.completedTricks.push({
      name: trickName,
      score: finalScore,
      time: Date.now()
    });
    state.lastTrickTime = Date.now();
    state.currentTrick = null;

    if (onTrickComplete) {
      onTrickComplete({
        type: 'complete',
        trick: trickName,
        score: finalScore,
        combo: state.comboMultiplier
      });
    }
  }

  function finishAirTricks(onTrickComplete) {
    if (state.totalAirRotation > 3) {
      completeTrick('triple_rotation', 300, onTrickComplete);
    } else if (state.totalAirRotation > 2) {
      completeTrick('double_rotation', 200, onTrickComplete);
    } else if (state.totalAirRotation > 1) {
      completeTrick('single_rotation', 100, onTrickComplete);
    }

    var airTime = Date.now() - state.airStartTime;
    if (airTime > 3000) {
      completeTrick('long_airtime', Math.floor(airTime / 30), onTrickComplete);
    }
  }

  function getState() {
    return state;
  }

  function getTrickName(trickId) {
    var names = {
      wheelie: '翘头',
      stoopie: '俯身',
      side_drift_left: '左侧漂移',
      side_drift_right: '右侧漂移',
      flip_forward: '前空翻',
      flip_backward: '后空翻',
      air_jump: '空中跳跃',
      single_rotation: '360°转体',
      double_rotation: '720°转体',
      triple_rotation: '1080°转体',
      long_airtime: '滞空大师',
      full_rotation: '全屏旋转'
    };
    return names[trickId] || trickId;
  }

  return {
    reset: reset,
    update: update,
    getState: getState,
    getTrickName: getTrickName
  };
})();
