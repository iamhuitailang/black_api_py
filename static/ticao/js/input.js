const Input = {
    keyState: {},
    touchState: {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isTouching: false,
        startTime: 0
    },
    swipeThreshold: 50,
    longPressThreshold: 500,
    longPressTimer: null,

    onKeyDown: null,
    onKeyUp: null,
    onSwipe: null,
    onLongPressStart: null,
    onLongPressEnd: null,
    onTouchTap: null,

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        }
    },

    handleKeyDown(e) {
        const key = e.key.toUpperCase();
        if (!this.keyState[key]) {
            this.keyState[key] = true;
            if (this.onKeyDown) {
                this.onKeyDown(key, e);
            }
        }
        
        if (key === ' ') {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
            }
            this.longPressTimer = setTimeout(() => {
                if (this.keyState[' '] && this.onLongPressStart) {
                    this.onLongPressStart();
                }
            }, this.longPressThreshold);
        }
        
        e.preventDefault();
    },

    handleKeyUp(e) {
        const key = e.key.toUpperCase();
        this.keyState[key] = false;
        if (this.onKeyUp) {
            this.onKeyUp(key, e);
        }
        
        if (key === ' ' && this.onLongPressEnd) {
            this.onLongPressEnd();
        }
    },

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchState.isTouching = true;
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
        this.touchState.startTime = Date.now();

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        
        this.longPressTimer = setTimeout(() => {
            if (this.touchState.isTouching && this.onLongPressStart) {
                this.onLongPressStart();
            }
        }, this.longPressThreshold);

        if (this.onTouchTap) {
            this.onTouchTap(touch.clientX, touch.clientY);
        }
    },

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchState.isTouching) return;
        
        const touch = e.touches[0];
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
    },

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchState.isTouching) return;
        
        this.touchState.isTouching = false;
        
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        const dx = this.touchState.currentX - this.touchState.startX;
        const dy = this.touchState.currentY - this.touchState.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > this.swipeThreshold || absDy > this.swipeThreshold) {
            let direction;
            if (absDx > absDy) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }
            if (this.onSwipe) {
                this.onSwipe(direction);
            }
        }

        if (this.onLongPressEnd) {
            this.onLongPressEnd();
        }
    },

    isKeyPressed(key) {
        return this.keyState[key.toUpperCase()] || false;
    },

    setKeyHandler(type, handler) {
        switch (type) {
            case 'keydown':
                this.onKeyDown = handler;
                break;
            case 'keyup':
                this.onKeyUp = handler;
                break;
            case 'swipe':
                this.onSwipe = handler;
                break;
            case 'longpressstart':
                this.onLongPressStart = handler;
                break;
            case 'longpressend':
                this.onLongPressEnd = handler;
                break;
            case 'touchtap':
                this.onTouchTap = handler;
                break;
        }
    },

    clearHandlers() {
        this.onKeyDown = null;
        this.onKeyUp = null;
        this.onSwipe = null;
        this.onLongPressStart = null;
        this.onLongPressEnd = null;
        this.onTouchTap = null;
    },

    getValidKeys() {
        return ['A', 'S', 'D', 'F', 'J', 'K', 'L'];
    }
};
