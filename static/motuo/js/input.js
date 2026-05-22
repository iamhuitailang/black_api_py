var Input = (function () {
  var keys = {};
  var keyPressed = {};
  var keyTimers = {};
  var listeners = [];

  var KEY_MAP = {
    ArrowRight: 'right',
    ArrowLeft: 'left',
    ArrowUp: 'up',
    ArrowDown: 'down',
    KeyD: 'right',
    KeyA: 'left',
    KeyW: 'up',
    KeyS: 'down',
    Space: 'jump',
    Escape: 'pause',
    KeyP: 'pause'
  };

  function onKeyDown(e) {
    var action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();

    if (!keys[action]) {
      keyPressed[action] = true;
      keyTimers[action] = Date.now();
    }
    keys[action] = true;

    listeners.forEach(function (fn) {
      try { fn(action, 'down'); } catch (err) {}
    });
  }

  function onKeyUp(e) {
    var action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    keys[action] = false;
    keyTimers[action] = 0;

    listeners.forEach(function (fn) {
      try { fn(action, 'up'); } catch (err) {}
    });
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function isDown(action) {
    return !!keys[action];
  }

  function wasPressed(action) {
    if (keyPressed[action]) {
      keyPressed[action] = false;
      return true;
    }
    return false;
  }

  function getHoldTime(action) {
    if (!keys[action] || !keyTimers[action]) return 0;
    return Date.now() - keyTimers[action];
  }

  function clearPressed() {
    for (var k in keyPressed) {
      keyPressed[k] = false;
    }
  }

  function addListener(fn) {
    listeners.push(fn);
  }

  function removeListener(fn) {
    var idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  }

  return {
    init: init,
    isDown: isDown,
    wasPressed: wasPressed,
    getHoldTime: getHoldTime,
    clearPressed: clearPressed,
    addListener: addListener,
    removeListener: removeListener
  };
})();
