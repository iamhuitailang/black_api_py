var HUD = (function() {
  var overlay = null;
  var canvas = null;
  var ctx = null;
  var width = 0;
  var height = 0;

  var uiElements = [];

  function init() {
    overlay = document.getElementById('hud-overlay');
    canvas = document.getElementById('game-canvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
    }
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  function clear() {
    uiElements = [];
  }

  function addText(x, y, text, options) {
    uiElements.push({
      type: 'text',
      x: x,
      y: y,
      text: text,
      fontSize: options.fontSize || 24,
      color: options.color || '#fff',
      align: options.align || 'left',
      baseline: options.baseline || 'top',
      bold: options.bold || false,
      shadow: options.shadow || false,
      shadowColor: options.shadowColor || 'rgba(0,0,0,0.5)',
      opacity: options.opacity !== undefined ? options.opacity : 1
    });
  }

  function addRect(x, y, w, h, options) {
    uiElements.push({
      type: 'rect',
      x: x,
      y: y,
      w: w,
      h: h,
      color: options.color || 'rgba(0,0,0,0.7)',
      borderColor: options.borderColor || null,
      borderWidth: options.borderWidth || 0,
      radius: options.radius || 0,
      opacity: options.opacity !== undefined ? options.opacity : 1
    });
  }

  function addBar(x, y, w, h, value, maxValue, options) {
    uiElements.push({
      type: 'bar',
      x: x,
      y: y,
      w: w,
      h: h,
      value: value,
      maxValue: maxValue,
      bgColor: options.bgColor || 'rgba(0,0,0,0.5)',
      fillColor: options.fillColor || '#e94560',
      borderColor: options.borderColor || '#fff',
      borderWidth: options.borderWidth || 2,
      radius: options.radius || 4,
      showText: options.showText || false,
      text: options.text || '',
      opacity: options.opacity !== undefined ? options.opacity : 1
    });
  }

  function addButton(x, y, w, h, text, options) {
    uiElements.push({
      type: 'button',
      x: x,
      y: y,
      w: w,
      h: h,
      text: text,
      bgColor: options.bgColor || 'rgba(233,69,96,0.8)',
      textColor: options.textColor || '#fff',
      fontSize: options.fontSize || 20,
      radius: options.radius || 8,
      onClick: options.onClick || null,
      opacity: options.opacity !== undefined ? options.opacity : 1,
      hover: false,
      active: false
    });
  }

  function render() {
    if (!ctx) return;

    ctx.save();

    for (var i = 0; i < uiElements.length; i++) {
      var el = uiElements[i];
      ctx.globalAlpha = el.opacity;

      switch (el.type) {
        case 'text':
          drawText(el);
          break;
        case 'rect':
          drawRect(el);
          break;
        case 'bar':
          drawBar(el);
          break;
        case 'button':
          drawButton(el);
          break;
      }
    }

    ctx.restore();
  }

  function drawText(el) {
    ctx.font = (el.bold ? 'bold ' : '') + el.fontSize + 'px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.textAlign = el.align;
    ctx.textBaseline = el.baseline;
    if (el.shadow) {
      ctx.shadowColor = el.shadowColor;
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    ctx.fillStyle = el.color;
    ctx.fillText(el.text, Math.round(el.x), Math.round(el.y));
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function drawRect(el) {
    ctx.fillStyle = el.color;
    if (el.radius > 0) {
      roundRect(ctx, el.x, el.y, el.w, el.h, el.radius);
      ctx.fill();
    } else {
      ctx.fillRect(el.x, el.y, el.w, el.h);
    }
    if (el.borderColor && el.borderWidth > 0) {
      ctx.strokeStyle = el.borderColor;
      ctx.lineWidth = el.borderWidth;
      if (el.radius > 0) {
        roundRect(ctx, el.x, el.y, el.w, el.h, el.radius);
        ctx.stroke();
      } else {
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      }
    }
  }

  function drawBar(el) {
    ctx.fillStyle = el.bgColor;
    roundRect(ctx, Math.round(el.x), Math.round(el.y), el.w, el.h, el.radius);
    ctx.fill();

    var ratio = Math.max(0, Math.min(1, el.value / el.maxValue));
    if (ratio > 0) {
      ctx.fillStyle = el.fillColor;
      roundRect(ctx, Math.round(el.x) + 2, Math.round(el.y) + 2, (el.w - 4) * ratio, el.h - 4, Math.max(1, el.radius - 2));
      ctx.fill();
    }

    if (el.borderColor && el.borderWidth > 0) {
      ctx.strokeStyle = el.borderColor;
      ctx.lineWidth = el.borderWidth;
      roundRect(ctx, Math.round(el.x), Math.round(el.y), el.w, el.h, el.radius);
      ctx.stroke();
    }

    if (el.showText && el.text) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.floor(el.h * 0.6) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.text, Math.round(el.x + el.w / 2), Math.round(el.y + el.h / 2));
    }
  }

  function drawButton(el) {
    var bgColor = el.bgColor;
    if (el.hover) bgColor = lightenColor(bgColor, 25);
    if (el.active) bgColor = darkenColor(bgColor, 25);

    ctx.fillStyle = bgColor;
    roundRect(ctx, Math.round(el.x), Math.round(el.y), el.w, el.h, el.radius);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, Math.round(el.x), Math.round(el.y), el.w, el.h, el.radius);
    ctx.stroke();

    ctx.fillStyle = el.textColor;
    ctx.font = 'bold ' + el.fontSize + 'px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(el.text, Math.round(el.x + el.w / 2), Math.round(el.y + el.h / 2));
    ctx.shadowBlur = 0;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function lightenColor(color, amount) {
    var hex = color.replace('#', '');
    if (hex.length < 6) return color;
    var r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    var g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    var b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function darkenColor(color, amount) {
    var hex = color.replace('#', '');
    if (hex.length < 6) return color;
    var r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    var g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    var b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function handleClick(x, y) {
    for (var i = 0; i < uiElements.length; i++) {
      var el = uiElements[i];
      if (el.type === 'button' && el.onClick) {
        if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
          el.onClick();
          return true;
        }
      }
    }
    return false;
  }

  function handleHover(x, y) {
    for (var i = 0; i < uiElements.length; i++) {
      var el = uiElements[i];
      if (el.type === 'button') {
        el.hover = (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h);
      }
    }
  }

  function getWidth() { return width; }
  function getHeight() { return height; }

  return {
    init: init,
    resize: resize,
    clear: clear,
    addText: addText,
    addRect: addRect,
    addBar: addBar,
    addButton: addButton,
    render: render,
    handleClick: handleClick,
    handleHover: handleHover,
    getWidth: getWidth,
    getHeight: getHeight
  };
})();
