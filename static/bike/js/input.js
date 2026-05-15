export class InputManager {
    constructor() {
        this.keys = {};
        this.touch = {
            accel: false,
            brake: false,
            balanceX: 0,
            lastTapTime: 0,
            tapCount: 0
        };
        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupTouch() {
        const accelBtn = document.getElementById('touch-accel');
        const brakeBtn = document.getElementById('touch-brake');
        const balanceArea = document.getElementById('touch-balance');

        if (accelBtn) {
            accelBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touch.accel = true;
            });
            accelBtn.addEventListener('touchend', () => {
                this.touch.accel = false;
            });
        }

        if (brakeBtn) {
            brakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touch.brake = true;
            });
            brakeBtn.addEventListener('touchend', () => {
                this.touch.brake = false;
            });
        }

        if (balanceArea) {
            balanceArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const now = Date.now();
                if (now - this.touch.lastTapTime < 300) {
                    this.touch.tapCount++;
                } else {
                    this.touch.tapCount = 1;
                }
                this.touch.lastTapTime = now;
                this.updateBalance(e.touches[0], balanceArea);
            });

            balanceArea.addEventListener('touchmove', (e) => {
                e.preventDefault();
                this.updateBalance(e.touches[0], balanceArea);
            });

            balanceArea.addEventListener('touchend', () => {
                this.touch.balanceX = 0;
            });
        }
    }

    updateBalance(touch, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        this.touch.balanceX = (touch.clientX - centerX) / (rect.width / 2);
    }

    isAccelerating() {
        return this.keys['ArrowUp'] || this.keys['KeyW'] || this.touch.accel;
    }

    isBraking() {
        return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touch.brake;
    }

    getBalanceInput() {
        let input = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) input -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) input += 1;
        if (Math.abs(this.touch.balanceX) > 0.1) {
            input = this.touch.balanceX;
        }
        return input;
    }

    isTrick() {
        if (this.keys['Space'] || this.keys['KeyJ']) return true;
        if (this.touch.tapCount >= 2) {
            this.touch.tapCount = 0;
            return true;
        }
        return false;
    }

    isDoubleLeft() {
        return this.keys['ArrowLeft'] && this.keys['Space'];
    }

    isDoubleRight() {
        return this.keys['ArrowRight'] && this.keys['Space'];
    }

    reset() {
        this.keys = {};
        this.touch.tapCount = 0;
    }
}
