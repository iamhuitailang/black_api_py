const Input = {
  keys: {},
  listeners: [],
  
  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  },
  
  handleKeyDown(e) {
    if (this.keys[e.code]) return;
    this.keys[e.code] = true;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    
    this.listeners.forEach(listener => {
      if (listener.type === 'keydown') {
        listener.callback(e.code);
      }
    });
  },
  
  handleKeyUp(e) {
    this.keys[e.code] = false;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    
    this.listeners.forEach(listener => {
      if (listener.type === 'keyup') {
        listener.callback(e.code);
      }
    });
  },
  
  onKeyDown(callback) {
    this.listeners.push({ type: 'keydown', callback });
  },
  
  onKeyUp(callback) {
    this.listeners.push({ type: 'keyup', callback });
  },
  
  isPressed(code) {
    return this.keys[code] || false;
  },
  
  clear() {
    this.keys = {};
    this.listeners = [];
  }
};
