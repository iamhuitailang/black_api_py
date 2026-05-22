const Input = {
  keys: {},
  touchStart: { x: 0, y: 0, time: 0 },
  touchCurrent: { x: 0, y: 0 },
  isTouching: false,
  swipeThreshold: 20,
  
  callbacks: {
    onJump: null,
    onSomersault: null,
    onTwist: null,
    onEntry: null,
    onActionSelect: null
  },

  init() {
    this.bindKeyboard();
    this.bindTouch();
  },

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      
      this.keys[e.code] = true;
      
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpaceDown();
      }
      
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.handleSomersault(1);
      }
      
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.handleSomersault(-1);
      }
      
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.handleTwist(-1);
      }
      
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.handleTwist(1);
      }
      
      if (e.code >= 'Digit1' && e.code <= 'Digit6') {
        const actionIndex = parseInt(e.code.replace('Digit', '')) - 1;
        this.handleActionSelect(actionIndex);
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpaceUp();
      }
    });
    
    window.addEventListener('blur', () => {
      this.keys = {};
      if (this.isTouching) {
        this.isTouching = false;
        this.handleTouchEnd(0, 0, 0);
      }
    });
  },

  bindTouch() {
    const container = document.getElementById('game-container');
    
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.isTouching = true;
      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      this.touchCurrent = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      this.handleTouchStart();
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isTouching) return;
      
      const touch = e.touches[0];
      const prevX = this.touchCurrent.x;
      const prevY = this.touchCurrent.y;
      
      this.touchCurrent = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      const deltaX = this.touchCurrent.x - prevX;
      const deltaY = this.touchCurrent.y - prevY;
      
      if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
        this.handleTouchSwipe(deltaX, deltaY);
      }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      const touchDuration = Date.now() - this.touchStart.time;
      const deltaX = this.touchCurrent.x - this.touchStart.x;
      const deltaY = this.touchCurrent.y - this.touchStart.y;
      
      this.handleTouchEnd(touchDuration, deltaX, deltaY);
      
      this.isTouching = false;
    }, { passive: false });
    
    container.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.isTouching = false;
      this.handleTouchEnd(0, 0, 0);
    }, { passive: false });
  },

  handleSpaceDown() {
    if (this.callbacks.onJump) {
      this.callbacks.onJump('press');
    }
  },

  handleSpaceUp() {
    if (this.callbacks.onJump) {
      this.callbacks.onJump('release');
    }
    if (this.callbacks.onEntry) {
      this.callbacks.onEntry('release');
    }
  },

  handleSomersault(direction) {
    if (this.callbacks.onSomersault) {
      this.callbacks.onSomersault(direction);
    }
  },

  handleTwist(direction) {
    if (this.callbacks.onTwist) {
      this.callbacks.onTwist(direction);
    }
  },

  handleActionSelect(index) {
    if (this.callbacks.onActionSelect) {
      this.callbacks.onActionSelect(index);
    }
  },

  handleTouchStart() {
    if (this.callbacks.onJump) {
      this.callbacks.onJump('press');
    }
  },

  handleTouchSwipe(deltaX, deltaY) {
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      const direction = deltaY > 0 ? -1 : 1;
      this.handleSomersault(direction);
    } else {
      const direction = deltaX > 0 ? 1 : -1;
      this.handleTwist(direction);
    }
  },

  handleTouchEnd(duration, deltaX, deltaY) {
    if (this.callbacks.onJump) {
      this.callbacks.onJump('release');
    }
    if (this.callbacks.onEntry) {
      this.callbacks.onEntry('release');
    }
  },

  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  },

  clearCallbacks() {
    this.callbacks = {
      onJump: null,
      onSomersault: null,
      onTwist: null,
      onEntry: null,
      onActionSelect: null
    };
  },

  isKeyPressed(code) {
    return !!this.keys[code];
  }
};
