const InputManager = {
  keys: {},
  pressed: {},

  init() {
    this.keys = {};
    this.pressed = {};

    window.addEventListener('keydown', (e) => {
      const key = e.key;
      
      if (!this.keys[key]) {
        this.pressed[key] = true;
      }
      this.keys[key] = true;

      const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'j', 'J', 'k', 'K', 'u', 'U', 'i', 'I', 'o', 'O', 'l', 'L', 'Escape'];
      if (gameKeys.includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key;
      this.keys[key] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.pressed = {};
    });
  },

  isDown(key) {
    if (this.keys[key] === true) return true;
    if (key && key.length === 1) {
      if (this.keys[key.toLowerCase()] === true) return true;
      if (this.keys[key.toUpperCase()] === true) return true;
    }
    return false;
  },

  wasPressed(key) {
    let found = false;
    
    if (this.pressed[key] === true) {
      found = true;
    }
    if (key && key.length === 1) {
      if (this.pressed[key.toLowerCase()] === true) found = true;
      if (this.pressed[key.toUpperCase()] === true) found = true;
    }
    
    if (found) {
      this.pressed[key] = false;
      if (key && key.length === 1) {
        this.pressed[key.toLowerCase()] = false;
        this.pressed[key.toUpperCase()] = false;
      }
      return true;
    }
    return false;
  },

  update() {
    this.pressed = {};
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputManager;
}
