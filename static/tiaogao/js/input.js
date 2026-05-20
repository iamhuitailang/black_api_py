const InputSystem = {
    keys: {},
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    isTouching: false,
    longPressTimer: null,
    swipeThreshold: 30,
    longPressThreshold: 800,
    
    onJump: null,
    onJumpRelease: null,
    onPostureLeft: null,
    onPostureRight: null,
    onReset: null,
    
    init() {
        this.bindKeyboard();
        this.bindTouch();
    },
    
    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.keys[e.code]) return;
            this.keys[e.code] = true;
            
            switch (e.code) {
                case 'Space':
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.onJump) this.onJump();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (this.onPostureLeft) this.onPostureLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (this.onPostureRight) this.onPostureRight();
                    break;
                case 'KeyR':
                    e.preventDefault();
                    if (this.onReset) this.onReset();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            switch (e.code) {
                case 'Space':
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.onJumpRelease) this.onJumpRelease();
                    break;
            }
        });
        
        window.addEventListener('blur', () => {
            this.keys = {};
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
    },
    
    bindTouch() {
        const canvas = document.getElementById('gameCanvas');
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.isTouching = true;
            
            this.longPressTimer = setTimeout(() => {
                if (this.isTouching && this.onReset) {
                    this.onReset();
                    this.longPressTimer = null;
                }
            }, this.longPressThreshold);
            
            if (this.onJump) this.onJump();
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isTouching) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            
            if (Math.abs(deltaX) > this.swipeThreshold) {
                if (deltaX > 0) {
                    if (this.onPostureRight) this.onPostureRight();
                } else {
                    if (this.onPostureLeft) this.onPostureLeft();
                }
                this.touchStartX = touch.clientX;
            }
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            if (this.onJumpRelease) this.onJumpRelease();
        });
        
        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isTouching = false;
            
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
    },
    
    isKeyPressed(code) {
        return !!this.keys[code];
    }
};
