window.SIQIU = window.SIQIU || {};

SIQIU.Input = {
  init(canvas, handlers) {
    this.canvas = canvas;
    this.handlers = handlers || {};
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.charging = false;
    this.chargeStart = 0;

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd);
    window.addEventListener('keydown', this._onKeyDown);
  },

  destroy() {
    const c = this.canvas;
    if (!c) return;
    c.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    c.removeEventListener('touchstart', this._onTouchStart);
    c.removeEventListener('touchmove', this._onTouchMove);
    c.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('keydown', this._onKeyDown);
  },

  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  },

  _onMouseDown(e) {
    const p = this._canvasPos(e);
    this.dragging = true;
    this.charging = true;
    this.lastX = p.x;
    this.lastY = p.y;
    this.chargeStart = Date.now();
    if (this.handlers.onPressStart) this.handlers.onPressStart(p);
  },

  _onMouseMove(e) {
    if (!this.dragging) return;
    const p = this._canvasPos(e);
    const dx = p.x - this.lastX;
    const dy = p.y - this.lastY;
    this.lastX = p.x;
    this.lastY = p.y;
    if (this.handlers.onDrag) this.handlers.onDrag({ dx, dy, x: p.x, y: p.y });
  },

  _onMouseUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    this.charging = false;
    if (this.handlers.onPressEnd) this.handlers.onPressEnd({});
  },

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    const p = this._canvasPos(t);
    this.dragging = true;
    this.charging = true;
    this.lastX = p.x;
    this.lastY = p.y;
    this.chargeStart = Date.now();
    if (this.handlers.onPressStart) this.handlers.onPressStart(p);
  },

  _onTouchMove(e) {
    e.preventDefault();
    if (!this.dragging || e.touches.length === 0) return;
    const t = e.touches[0];
    const p = this._canvasPos(t);
    const dx = p.x - this.lastX;
    const dy = p.y - this.lastY;
    this.lastX = p.x;
    this.lastY = p.y;
    if (this.handlers.onDrag) this.handlers.onDrag({ dx, dy, x: p.x, y: p.y });
  },

  _onTouchEnd(e) {
    if (!this.dragging) return;
    this.dragging = false;
    this.charging = false;
    if (this.handlers.onPressEnd) this.handlers.onPressEnd({});
  },

  _onKeyDown(e) {
    if (e.key === '1' && this.handlers.onShotType) this.handlers.onShotType('flat');
    else if (e.key === '2' && this.handlers.onShotType) this.handlers.onShotType('volley');
    else if (e.key === '3' && this.handlers.onShotType) this.handlers.onShotType('lob');
    else if (e.key === 'Escape' && this.handlers.onEscape) this.handlers.onEscape();
  },

  isCharging() { return this.charging; }
};
