const Utils = {
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  chebyshevDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  },

  manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  },

  euclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  directionToAngle(dx, dy) {
    return Math.atan2(dy, dx);
  },

  angleDifference(angle1, angle2) {
    let diff = angle1 - angle2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff);
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  isInBounds(x, y, width, height) {
    return x >= 0 && x < width && y >= 0 && y < height;
  },

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
};

if (typeof window !== 'undefined') {
  window.Utils = Utils;
}
