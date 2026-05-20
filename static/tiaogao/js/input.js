class InputSystem {
    constructor() {
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        this.callbacks = {};
        this.cooldowns = {};
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleKeyDown(e) {
        if (this.keys[e.code]) return;
        this.keys[e.code] = true;

        if (this.isOnCooldown(e.code)) return;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.trigger('tiltLeft', 'small');
                this.setCooldown(e.code, GameConfig.INPUT.TILT_SMALL_DURATION);
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.trigger('tiltRight', 'small');
                this.setCooldown(e.code, GameConfig.INPUT.TILT_SMALL_DURATION);
                break;
            case 'KeyQ':
                this.trigger('tiltLeft', 'big');
                this.setCooldown(e.code, GameConfig.INPUT.TILT_BIG_DURATION);
                break;
            case 'KeyE':
                this.trigger('tiltRight', 'big');
                this.setCooldown(e.code, GameConfig.INPUT.TILT_BIG_DURATION);
                break;
            case 'Space':
                this.trigger('calm');
                this.setCooldown(e.code, GameConfig.INPUT.CALM_DURATION);
                e.preventDefault();
                break;
            case 'Digit1':
                this.trigger('useItem', 0);
                break;
            case 'Digit2':
                this.trigger('useItem', 1);
                break;
            case 'Digit3':
                this.trigger('useItem', 2);
                break;
            case 'Digit4':
                this.trigger('useItem', 3);
                break;
            case 'Escape':
                this.trigger('pause');
                break;
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isTouching = true;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isTouching) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        if (Math.abs(deltaX) > 50 && !this.isOnCooldown('touch_tilt')) {
            if (deltaX > 0) {
                this.trigger('tiltRight', Math.abs(deltaX) > 150 ? 'big' : 'small');
            } else {
                this.trigger('tiltLeft', Math.abs(deltaX) > 150 ? 'big' : 'small');
            }
            this.setCooldown('touch_tilt', 200);
            this.touchStartX = touch.clientX;
        }

        if (deltaY < -100 && !this.isOnCooldown('touch_calm')) {
            this.trigger('calm');
            this.setCooldown('touch_calm', 500);
            this.touchStartY = touch.clientY;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isTouching = false;
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    setCooldown(key, duration) {
        this.cooldowns[key] = Date.now() + duration;
    }

    isOnCooldown(key) {
        return this.cooldowns[key] && Date.now() < this.cooldowns[key];
    }

    reset() {
        this.keys = {};
        this.cooldowns = {};
    }
}
