var Hat = (function() {
  function createHat(index, totalHats, canvasW, canvasH, type) {
    var cols = Math.ceil(Math.sqrt(totalHats));
    var rows = Math.ceil(totalHats / cols);
    var margin = 60;
    var usableW = canvasW - margin * 2;
    var usableH = canvasH - 200;
    var cellW = usableW / cols;
    var cellH = usableH / rows;
    var hatSize = Math.min(cellW * 0.7, cellH * 0.7, 100);

    var col = index % cols;
    var row = Math.floor(index / cols);

    var targetX = margin + cellW * col + cellW / 2;
    var targetY = 180 + cellH * row + cellH / 2;

    return {
      index: index,
      type: type,
      x: targetX,
      y: targetY,
      targetX: targetX,
      targetY: targetY,
      prevX: targetX,
      prevY: targetY,
      size: hatSize,
      state: GameConfig.HAT_STATES.CLOSED,
      flipProgress: 0,
      liftOffset: 0,
      opened: false,
      found: false,
      animating: false,
      animStartTime: 0,
      bouncePhase: Math.random() * Math.PI * 2,
      shakeOffsetX: 0,
      shakePhase: Math.random() * Math.PI * 2
    };
  }

  function update(h, dt, now) {
    if (h.state === GameConfig.HAT_STATES.OPENING) {
      h.flipProgress += GameConfig.ANIM.hatFlipSpeed;
      h.liftOffset = Math.sin(h.flipProgress * Math.PI) * GameConfig.ANIM.hatLiftHeight;
      if (h.flipProgress >= 1) {
        h.flipProgress = 1;
        h.state = GameConfig.HAT_STATES.OPEN;
        h.animating = false;
      }
    } else if (h.state === GameConfig.HAT_STATES.CLOSING) {
      h.flipProgress -= GameConfig.ANIM.hatFlipSpeed;
      h.liftOffset = Math.sin(h.flipProgress * Math.PI) * GameConfig.ANIM.hatLiftHeight;
      if (h.flipProgress <= 0) {
        h.flipProgress = 0;
        h.state = GameConfig.HAT_STATES.CLOSED;
        h.animating = false;
      }
    } else {
      h.liftOffset = 0;
    }

    var dx = h.targetX - h.x;
    var dy = h.targetY - h.y;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      h.x += dx * 0.12;
      h.y += dy * 0.12;
    } else {
      h.x = h.targetX;
      h.y = h.targetY;
    }
  }

  function open(h) {
    if (h.state === GameConfig.HAT_STATES.CLOSED && !h.animating && !h.opened) {
      h.state = GameConfig.HAT_STATES.OPENING;
      h.flipProgress = 0;
      h.opened = true;
      h.animating = true;
      h.animStartTime = Date.now();
    }
  }

  function close(h) {
    if (h.state === GameConfig.HAT_STATES.OPEN) {
      h.state = GameConfig.HAT_STATES.CLOSING;
      h.flipProgress = 1;
      h.animating = true;
      h.animStartTime = Date.now();
    }
  }

  function isInside(h, px, py) {
    var halfW = h.size * 0.5;
    var halfH = h.size * 0.6;
    var topY = h.y - h.liftOffset;
    return px >= h.x - halfW && px <= h.x + halfW &&
           py >= topY - halfH && py <= topY + halfH * 0.3;
  }

  function setTarget(h, tx, ty) {
    h.prevX = h.x;
    h.prevY = h.y;
    h.targetX = tx;
    h.targetY = ty;
  }

  return {
    create: createHat,
    update: update,
    open: open,
    close: close,
    isInside: isInside,
    setTarget: setTarget
  };
})();
