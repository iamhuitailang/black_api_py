var Input = (function () {

  var state = {
    left: false,
    right: false,
    down: false,
    space: false,
    spacePressed: false,
    leftPressed: false,
    rightPressed: false,
    downPressed: false
  };

  var listeners = {};

  function init() {
    document.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          state.left = true;
          state.leftPressed = true;
          emit('leftPress');
          break;
        case 'ArrowRight':
        case 'KeyD':
          state.right = true;
          state.rightPressed = true;
          emit('rightPress');
          break;
        case 'ArrowDown':
        case 'KeyS':
          state.down = true;
          state.downPressed = true;
          emit('downPress');
          break;
        case 'Space':
          if (!state.space) {
            state.space = true;
            state.spacePressed = true;
            emit('skillPress');
          }
          e.preventDefault();
          break;
      }
    });

    document.addEventListener('keyup', function (e) {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          state.left = false;
          emit('leftRelease');
          break;
        case 'ArrowRight':
        case 'KeyD':
          state.right = false;
          emit('rightRelease');
          break;
        case 'ArrowDown':
        case 'KeyS':
          state.down = false;
          emit('downRelease');
          break;
        case 'Space':
          state.space = false;
          emit('skillRelease');
          break;
      }
    });
  }

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  }

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(function (cb) { cb(data); });
    }
  }

  function consumePressed() {
    var pressed = {
      space: state.spacePressed,
      left: state.leftPressed,
      right: state.rightPressed,
      down: state.downPressed
    };
    state.spacePressed = false;
    state.leftPressed = false;
    state.rightPressed = false;
    state.downPressed = false;
    return pressed;
  }

  function isDown() {
    return {
      left: state.left,
      right: state.right,
      down: state.down,
      space: state.space
    };
  }

  function reset() {
    state.left = false;
    state.right = false;
    state.down = false;
    state.space = false;
    state.spacePressed = false;
    state.leftPressed = false;
    state.rightPressed = false;
    state.downPressed = false;
  }

  return {
    init: init,
    on: on,
    isDown: isDown,
    consumePressed: consumePressed,
    reset: reset
  };

})();
