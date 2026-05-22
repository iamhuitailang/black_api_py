const Input = (function() {
  const handlers = {
    handoff: null,
    accelerate: null
  };

  let isDKeyPressed = false;

  function init() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('click', onClick);
  }

  function onKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (handlers.handoff) handlers.handoff();
    }
    if (e.code === 'KeyD') {
      if (!isDKeyPressed) {
        isDKeyPressed = true;
        if (handlers.accelerate) handlers.accelerate();
      }
    }
    if (e.code === 'Escape') {
      if (handlers.pause) handlers.pause();
    }
  }

  function onKeyUp(e) {
    if (e.code === 'KeyD') {
      isDKeyPressed = false;
    }
  }

  function onTouchStart(e) {
    if (e.touches.length > 1) {
      if (handlers.handoff) handlers.handoff();
    }
  }

  function onClick(e) {
    if (e.target.closest('.handoff-btn')) {
      if (handlers.handoff) handlers.handoff();
    }
    if (e.target.closest('.accel-btn')) {
      if (handlers.accelerate) handlers.accelerate();
    }
  }

  function onHandoff(callback) {
    handlers.handoff = callback;
  }

  function onAccelerate(callback) {
    handlers.accelerate = callback;
  }

  function onPause(callback) {
    handlers.pause = callback;
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('click', onClick);
  }

  return { init, onHandoff, onAccelerate, onPause, destroy };
})();