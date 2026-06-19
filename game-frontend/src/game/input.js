const ACTION_MAP = {
  left: ['ArrowLeft', 'a', 'A'],
  right: ['ArrowRight', 'd', 'D'],
  attack: ['j', 'J'],
  jump: ['k', 'K'],
  dash: ['l', 'L'],
  pause: ['p', 'P', 'Escape'],
};

export class InputManager {
  constructor() {
    this._keysDown = new Set();
    this._keysJustPressed = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  _onKeyDown(e) {
    if (!this._keysDown.has(e.key)) {
      this._keysJustPressed.add(e.key);
    }
    this._keysDown.add(e.key);
    e.preventDefault();
  }

  _onKeyUp(e) {
    this._keysDown.delete(e.key);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._keysDown.clear();
    this._keysJustPressed.clear();
  }

  update() {
    this._keysJustPressed.clear();
  }

  isDown(key) {
    return this._keysDown.has(key);
  }

  justPressed(key) {
    return this._keysJustPressed.has(key);
  }

  isAction(action) {
    const keys = ACTION_MAP[action];
    if (!keys) return false;
    return keys.some((k) => this._keysDown.has(k));
  }

  isPressed(key) {
    return this._keysJustPressed.has(key);
  }
}
