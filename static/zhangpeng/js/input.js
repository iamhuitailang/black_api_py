const Input = {
  keys: {},
  pressed: {},

  init() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.pressed[e.code] = true;
      }
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });
  },

  isDown(codes) {
    return codes.some(c => this.keys[c]);
  },

  wasPressed(codes) {
    return codes.some(c => this.pressed[c]);
  },

  clearPressed() {
    this.pressed = {};
  },

  left() { return this.isDown(GameConfig.KEYS.LEFT); },
  right() { return this.isDown(GameConfig.KEYS.RIGHT); },
  jump() { return this.wasPressed(GameConfig.KEYS.JUMP); },
  crouch() { return this.isDown(GameConfig.KEYS.CROUCH); },
  sprint() { return this.isDown(GameConfig.KEYS.SPRINT); }
};
