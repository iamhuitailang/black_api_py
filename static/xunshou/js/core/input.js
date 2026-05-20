const Input = {
    keys: {},
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    isTouchDevice: false,
    
    callbacks: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        doubleJump: false,
        duck: false
    },
    
    init(canvas) {
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        this.setupMobileControls();
    },
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.callbacks.left = true;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.callbacks.right = true;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            this.callbacks.jump = true;
            e.preventDefault();
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.callbacks.duck = true;
            this.callbacks.down = true;
        }
        if (e.code === 'Escape' || e.code === 'KeyP') {
            if (this.onPause) {
                this.onPause();
            }
        }
    },
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.callbacks.left = false;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.callbacks.right = false;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            this.callbacks.jump = false;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.callbacks.duck = false;
            this.callbacks.down = false;
        }
    },
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    },
    
    handleTouchMove(e) {
        e.preventDefault();
    },
    
    handleTouchEnd(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        const deltaX = endX - this.touchStartX;
        const deltaY = endY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;
        
        if (duration < 300 && Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) {
            this.callbacks.jump = true;
            setTimeout(() => {
                this.callbacks.jump = false;
            }, 100);
        } else if (deltaY < -50) {
            this.callbacks.jump = true;
            setTimeout(() => {
                this.callbacks.jump = false;
            }, 100);
        } else if (deltaY > 50) {
            this.callbacks.duck = true;
            this.callbacks.down = true;
            setTimeout(() => {
                this.callbacks.duck = false;
                this.callbacks.down = false;
            }, 500);
        }
    },
    
    setupMobileControls() {
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const jumpBtn = document.getElementById('jump-btn');
        const downBtn = document.getElementById('down-btn');
        
        const addTouchEvents = (btn, key) => {
            if (!btn) return;
            
            const start = (e) => {
                e.preventDefault();
                this.callbacks[key] = true;
            };
            
            const end = (e) => {
                e.preventDefault();
                this.callbacks[key] = false;
            };
            
            btn.addEventListener('touchstart', start);
            btn.addEventListener('touchend', end);
            btn.addEventListener('touchcancel', end);
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };
        
        addTouchEvents(leftBtn, 'left');
        addTouchEvents(rightBtn, 'right');
        addTouchEvents(downBtn, 'duck');
        addTouchEvents(downBtn, 'down');
        
        if (jumpBtn) {
            const jumpStart = (e) => {
                e.preventDefault();
                this.callbacks.jump = true;
            };
            const jumpEnd = (e) => {
                e.preventDefault();
                this.callbacks.jump = false;
            };
            jumpBtn.addEventListener('touchstart', jumpStart);
            jumpBtn.addEventListener('touchend', jumpEnd);
            jumpBtn.addEventListener('touchcancel', jumpEnd);
            jumpBtn.addEventListener('mousedown', jumpStart);
            jumpBtn.addEventListener('mouseup', jumpEnd);
            jumpBtn.addEventListener('mouseleave', jumpEnd);
        }
        
        if (this.isTouchDevice) {
            document.getElementById('mobile-controls').classList.add('show');
        }
    },
    
    isLeft() {
        return this.callbacks.left;
    },
    
    isRight() {
        return this.callbacks.right;
    },
    
    isJump() {
        return this.callbacks.jump;
    },
    
    isDuck() {
        return this.callbacks.duck;
    },
    
    consumeJump() {
        if (this.callbacks.jump) {
            this.callbacks.jump = false;
            return true;
        }
        return false;
    },
    
    reset() {
        this.callbacks = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            doubleJump: false,
            duck: false
        };
        this.keys = {};
    }
};
