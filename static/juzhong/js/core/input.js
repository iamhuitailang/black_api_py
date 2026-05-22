var Input = (function() {
  var listeners = {};
  var state = {
    spacePressed: false,
    spaceHoldTime: 0,
    spaceTapCount: 0,
    spaceTapTimer: 0,
    downArrow: false,
    upArrow: false,
    swipeStartY: 0,
    swipeStartTime: 0,
    isSwiping: false,
    touchTapCount: 0,
    touchTapTimer: 0,
    touchHoldTime: 0,
    isTouchHolding: false,
    activeTouchId: null
  };

  var callbacks = {
    onPull: null,
    onSquat: null,
    onJerk: null,
    onLock: null,
    onLockRelease: null,
    onMenuConfirm: null,
    onMenuUp: null,
    onMenuDown: null
  };

  var TAP_WINDOW = 300;
  var SWIPE_THRESHOLD = 50;
  var HOLD_THRESHOLD = 400;

  function on(event, cb) {
    callbacks[event] = cb;
  }

  function emit(event, data) {
    if (callbacks[event]) {
      callbacks[event](data);
    }
  }

  function handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.spacePressed) {
        state.spacePressed = true;
        state.spaceHoldTime = 0;
        var now = Date.now();
        if (now - state.spaceTapTimer < TAP_WINDOW) {
          state.spaceTapCount++;
        } else {
          state.spaceTapCount = 1;
        }
        state.spaceTapTimer = now;
        emit('onPull', { count: state.spaceTapCount, holdTime: 0 });
      }
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      if (!state.downArrow) {
        state.downArrow = true;
        emit('onSquat');
      }
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      if (!state.upArrow) {
        state.upArrow = true;
        emit('onJerk');
      }
    } else if (e.code === 'Enter') {
      emit('onMenuConfirm');
    }
  }

  function handleKeyUp(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.spacePressed) {
        state.spacePressed = false;
        if (state.spaceHoldTime >= HOLD_THRESHOLD) {
          emit('onLockRelease');
        }
        state.spaceHoldTime = 0;
      }
    } else if (e.code === 'ArrowDown') {
      state.downArrow = false;
    } else if (e.code === 'ArrowUp') {
      state.upArrow = false;
    }
  }

  function handleTouchStart(e) {
    e.preventDefault();
    var touch = e.changedTouches[0];
    if (!touch) return;

    state.activeTouchId = touch.identifier;
    state.swipeStartY = touch.clientY;
    state.swipeStartTime = Date.now();
    state.isSwiping = false;
    state.isTouchHolding = true;
    state.touchHoldTime = 0;

    var now = Date.now();
    if (now - state.touchTapTimer < TAP_WINDOW) {
      state.touchTapCount++;
    } else {
      state.touchTapCount = 1;
    }
    state.touchTapTimer = now;
    emit('onPull', { count: state.touchTapCount, holdTime: 0, source: 'touch' });
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (state.activeTouchId === null) return;

    var touch = null;
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === state.activeTouchId) {
        touch = e.changedTouches[i];
        break;
      }
    }
    if (!touch) return;

    var deltaY = touch.clientY - state.swipeStartY;
    var deltaTime = Date.now() - state.swipeStartTime;

    if (!state.isSwiping && deltaTime > 50 && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      state.isSwiping = true;
      if (deltaY > 0) {
        emit('onSquat');
      } else {
        emit('onJerk');
      }
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === state.activeTouchId) {
        state.activeTouchId = null;
        state.isSwiping = false;
        state.isTouchHolding = false;
        if (state.touchHoldTime >= HOLD_THRESHOLD) {
          emit('onLockRelease');
        }
        state.touchHoldTime = 0;
        break;
      }
    }
  }

  function handleTouchButtonClick(btnId) {
    switch (btnId) {
      case 'touch-lift':
        var now = Date.now();
        if (now - state.touchTapTimer < TAP_WINDOW) {
          state.touchTapCount++;
        } else {
          state.touchTapCount = 1;
        }
        state.touchTapTimer = now;
        emit('onPull', { count: state.touchTapCount, holdTime: 0, source: 'touch' });
        break;
      case 'touch-squat':
        emit('onSquat');
        break;
      case 'touch-jerk':
        emit('onJerk');
        break;
      case 'touch-lock':
        state.isTouchHolding = true;
        state.touchHoldTime = HOLD_THRESHOLD + 1;
        emit('onLock');
        break;
    }
  }

  function update(dt) {
    if (state.spacePressed) {
      state.spaceHoldTime += dt * 1000;
      if (state.spaceHoldTime >= HOLD_THRESHOLD) {
        emit('onLock', { holdTime: state.spaceHoldTime });
      }
    }
    if (state.isTouchHolding && state.activeTouchId !== null) {
      state.touchHoldTime += dt * 1000;
      if (state.touchHoldTime >= HOLD_THRESHOLD) {
        emit('onLock', { holdTime: state.touchHoldTime, source: 'touch' });
      }
    }
  }

  function init() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    var canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    var touchBtns = document.querySelectorAll('.touch-btn');
    for (var i = 0; i < touchBtns.length; i++) {
      (function(btn) {
        btn.addEventListener('touchstart', function(e) {
          e.preventDefault();
          e.stopPropagation();
          handleTouchButtonClick(btn.id);
        }, { passive: false });
        btn.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          handleTouchButtonClick(btn.id);
        });
        btn.addEventListener('mouseup', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (btn.id === 'touch-lock') {
            state.isTouchHolding = false;
            state.touchHoldTime = 0;
            emit('onLockRelease');
          }
        });
        btn.addEventListener('touchend', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (btn.id === 'touch-lock') {
            state.isTouchHolding = false;
            state.touchHoldTime = 0;
            emit('onLockRelease');
          }
        });
      })(touchBtns[i]);
    }
  }

  function getState() {
    return state;
  }

  return {
    init: init,
    update: update,
    on: on,
    getState: getState
  };
})();
