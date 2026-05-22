var TiaoyuanInput = {
  _listeners: {},
  _spacePressed: false,
  _touchStart: null,

  init: function(canvas) {
    var self = this;
    this._listeners = {};
    this._spacePressed = false;
    this._touchStart = null;

    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!self._spacePressed) {
          self._spacePressed = true;
          self._emit('jump');
        }
      } else if (e.code === 'Escape') {
        self._emit('pause');
      } else if (e.code === 'Digit1') {
        self._emit('pose', 1);
      } else if (e.code === 'Digit2') {
        self._emit('pose', 2);
      } else if (e.code === 'Digit3') {
        self._emit('pose', 3);
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        self._spacePressed = false;
        self._emit('jumpRelease');
      }
    });

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var t = e.touches[0];
      self._touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
      self._emit('touchStart', { x: t.clientX, y: t.clientY });
    }, { passive: false });

    canvas.addEventListener('touchend', function(e) {
      e.preventDefault();
      if (self._touchStart) {
        var dt = Date.now() - self._touchStart.time;
        var t = e.changedTouches[0];
        var dx = t.clientX - self._touchStart.x;
        if (Math.abs(dx) > 40 && dt < 500) {
          self._emit('swipe', dx > 0 ? 'right' : 'left');
        } else {
          self._emit('tap', { x: t.clientX, y: t.clientY });
        }
        self._touchStart = null;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
  },

  on: function(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },

  clear: function() {
    this._listeners = {};
  },

  _emit: function(event, data) {
    if (this._listeners[event]) {
      for (var i = 0; i < this._listeners[event].length; i++) {
        try { this._listeners[event][i](data); } catch (e) { console.error(e); }
      }
    }
  }
};
