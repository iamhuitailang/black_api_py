window.SIQIU = window.SIQIU || {};

SIQIU.Utils = {
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  },

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  deg2rad(d) {
    return d * Math.PI / 180;
  },

  rad2deg(r) {
    return r * 180 / Math.PI;
  },

  dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  },

  rand(min, max) {
    return Math.random() * (max - min) + min;
  },

  randInt(min, max) {
    return Math.floor(this.rand(min, max + 1));
  },

  circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
    const closestX = this.clamp(cx, rx, rx + rw);
    const closestY = this.clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (r * r);
  },

  formatScore(n) {
    return Math.round(n).toString();
  }
};
