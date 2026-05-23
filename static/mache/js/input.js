var Input = (function() {
  var keys = {};
  var keyPressed = {};
  var spaceHoldTime = 0;
  var spaceCharging = false;
  var jumpTriggered = false;

  function init() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
  }

  function onKeyDown(e) {
    var key = normalizeKey(e);
    if (key === null) return;

    if (e.repeat) {
      e.preventDefault();
      return;
    }

    keys[key] = true;
    keyPressed[key] = true;

    if (key === 'jump') {
      spaceCharging = true;
      spaceHoldTime = 0;
      jumpTriggered = false;
    }

    if (key === 'left' || key === 'right' || key === 'jump') {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    var key = normalizeKey(e);
    if (key === null) return;

    keys[key] = false;

    if (key === 'jump') {
      spaceCharging = false;
    }
  }

  function onBlur() {
    keys = {};
    spaceCharging = false;
    spaceHoldTime = 0;
  }

  function normalizeKey(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        return 'left';
      case 'ArrowRight':
      case 'KeyD':
        return 'right';
      case 'Space':
        return 'jump';
      case 'ArrowUp':
      case 'KeyW':
        return 'up';
      case 'ArrowDown':
      case 'KeyS':
        return 'down';
      case 'Escape':
      case 'KeyP':
        return 'pause';
      case 'Enter':
        return 'enter';
      default:
        return null;
    }
  }

  function update(deltaTime) {
    if (spaceCharging) {
      spaceHoldTime += deltaTime;
    }
  }

  function clearPressed() {
    keyPressed = {};
  }

  function isLeft() {
    return keys['left'] === true;
  }

  function isRight() {
    return keys['right'] === true;
  }

  function isUp() {
    return keys['up'] === true;
  }

  function isDown() {
    return keys['down'] === true;
  }

  function isJumpPressed() {
    return keyPressed['jump'] === true;
  }

  function isJumpHeld() {
    return keys['jump'] === true;
  }

  function getJumpCharge() {
    return spaceHoldTime;
  }

  function consumeJump() {
    var holdTime = spaceHoldTime;
    spaceCharging = false;
    spaceHoldTime = 0;
    jumpTriggered = true;
    return holdTime;
  }

  function isPausePressed() {
    return keyPressed['pause'] === true;
  }

  function isEnterPressed() {
    return keyPressed['enter'] === true;
  }

  function reset() {
    keys = {};
    keyPressed = {};
    spaceHoldTime = 0;
    spaceCharging = false;
    jumpTriggered = false;
  }

  return {
    init: init,
    update: update,
    clearPressed: clearPressed,
    isLeft: isLeft,
    isRight: isRight,
    isUp: isUp,
    isDown: isDown,
    isJumpPressed: isJumpPressed,
    isJumpHeld: isJumpHeld,
    getJumpCharge: getJumpCharge,
    consumeJump: consumeJump,
    isPausePressed: isPausePressed,
    isEnterPressed: isEnterPressed,
    reset: reset
  };
})();
