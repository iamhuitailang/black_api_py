const Input = {
    keys: {},
    touch: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },
    callbacks: {
        useItem: [],
        switchCharacter: []
    },

    init() {
        this.bindKeyboard();
        this.bindTouch();
        this.bindVirtualButtons();
    },

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.keys[e.code] = true;

            if (e.code === 'Space') {
                e.preventDefault();
                this.trigger('useItem');
            }
            if (e.code === 'Enter') {
                e.preventDefault();
                this.trigger('switchCharacter');
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });
    },

    bindTouch() {
        const canvas = document.getElementById('game-canvas');

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.touch.active = true;
                this.touch.startX = e.touches[0].clientX;
                this.touch.startY = e.touches[0].clientY;
                this.touch.currentX = this.touch.startX;
                this.touch.currentY = this.touch.startY;
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0 && this.touch.active) {
                this.touch.currentX = e.touches[0].clientX;
                this.touch.currentY = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchend', () => {
            this.touch.active = false;
        });
    },

    bindVirtualButtons() {
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const dir = btn.dataset.dir;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.setDirectionKey(dir, true);
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.setDirectionKey(dir, false);
            });

            btn.addEventListener('mousedown', () => {
                this.setDirectionKey(dir, true);
            });

            btn.addEventListener('mouseup', () => {
                this.setDirectionKey(dir, false);
            });

            btn.addEventListener('mouseleave', () => {
                this.setDirectionKey(dir, false);
            });
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            const action = btn.dataset.action;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (action === 'item') {
                    this.trigger('useItem');
                } else if (action === 'switch') {
                    this.trigger('switchCharacter');
                }
            });

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });
        });
    },

    setDirectionKey(dir, pressed) {
        const keyMap = {
            'up': 'ArrowUp',
            'down': 'ArrowDown',
            'left': 'ArrowLeft',
            'right': 'ArrowRight'
        };
        this.keys[keyMap[dir]] = pressed;
    },

    isKeyPressed(key) {
        return this.keys[key] || false;
    },

    getDirection() {
        let dx = 0, dy = 0;

        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('w') || this.isKeyPressed('W')) {
            dy -= 1;
        }
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s') || this.isKeyPressed('S')) {
            dy += 1;
        }
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a') || this.isKeyPressed('A')) {
            dx -= 1;
        }
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('d') || this.isKeyPressed('D')) {
            dx += 1;
        }

        if (this.touch.active) {
            const threshold = 20;
            const touchDx = this.touch.currentX - this.touch.startX;
            const touchDy = this.touch.currentY - this.touch.startY;

            if (Math.abs(touchDx) > Math.abs(touchDy)) {
                if (Math.abs(touchDx) > threshold) {
                    dx = touchDx > 0 ? 1 : -1;
                }
            } else {
                if (Math.abs(touchDy) > threshold) {
                    dy = touchDy > 0 ? 1 : -1;
                }
            }
        }

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { dx, dy };
    },

    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    },

    trigger(event) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb());
        }
    }
};