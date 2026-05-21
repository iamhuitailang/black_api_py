const Input = {
    keys: {},
    touch: {
        active: false,
        joystick: {
            active: false,
            x: 0,
            y: 0,
            centerX: 0,
            centerY: 0
        },
        taps: [],
        lastTapTime: 0
    },
    callbacks: {},

    init() {
        this.setupKeyboard();
        this.setupTouch();
    },

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleKeyPress(e.key);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    },

    setupTouch() {
        const joystickArea = document.getElementById('joystick-area');
        const joystick = document.getElementById('joystick');
        
        if (joystickArea) {
            const rect = joystickArea.getBoundingClientRect();
            this.touch.joystick.centerX = rect.left + rect.width / 2;
            this.touch.joystick.centerY = rect.top + rect.height / 2;

            joystickArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touch.joystick.active = true;
                this.touch.active = true;
                this.updateJoystick(e.touches[0]);
            });

            joystickArea.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (this.touch.joystick.active) {
                    this.updateJoystick(e.touches[0]);
                }
            });

            joystickArea.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touch.joystick.active = false;
                this.touch.joystick.x = 0;
                this.touch.joystick.y = 0;
                joystick.style.transform = 'translate(-50%, -50%)';
            });
        }

        const receiveBtn = document.getElementById('btn-receive');
        const spikeBtn = document.getElementById('btn-spike');
        const blockBtn = document.getElementById('btn-block');

        if (receiveBtn) {
            receiveBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerCallback('receive');
            });
        }

        if (spikeBtn) {
            spikeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerCallback('spike');
            });
        }

        if (blockBtn) {
            blockBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerCallback('block');
            });
        }

        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.touch-controls') || e.target.closest('.menu-screen')) {
                return;
            }
            
            const now = Date.now();
            if (now - this.touch.lastTapTime < 300) {
                this.touch.taps.push(e.touches[0]);
                if (this.touch.taps.length >= 2) {
                    this.triggerCallback('spike');
                    this.touch.taps = [];
                }
            } else if (now - this.touch.lastTapTime < 500) {
                if (e.touches.length >= 3) {
                    this.triggerCallback('block');
                }
            } else {
                this.touch.taps = [e.touches[0]];
                this.triggerCallback('receive');
            }
            this.touch.lastTapTime = now;
        });
    },

    updateJoystick(touch) {
        const joystick = document.getElementById('joystick');
        if (!joystick) return;

        const maxRadius = 45;
        let dx = touch.clientX - this.touch.joystick.centerX;
        let dy = touch.clientY - this.touch.joystick.centerY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }

        this.touch.joystick.x = dx / maxRadius;
        this.touch.joystick.y = dy / maxRadius;

        joystick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    },

    handleKeyPress(key) {
        if (CONFIG.KEYS.RECEIVE.includes(key)) {
            this.triggerCallback('receive');
        } else if (CONFIG.KEYS.SPIKE.includes(key)) {
            this.triggerCallback('spike');
        } else if (CONFIG.KEYS.BLOCK.includes(key)) {
            this.triggerCallback('block');
        } else if (CONFIG.KEYS.PAUSE.includes(key)) {
            this.triggerCallback('pause');
        }
    },

    on(action, callback) {
        this.callbacks[action] = callback;
    },

    triggerCallback(action) {
        if (this.callbacks[action]) {
            this.callbacks[action]();
        }
    },

    isKeyPressed(keyGroup) {
        return CONFIG.KEYS[keyGroup]?.some(key => this.keys[key]) || false;
    },

    getMovement() {
        let dx = 0;
        let dy = 0;

        if (this.isKeyPressed('LEFT')) dx -= 1;
        if (this.isKeyPressed('RIGHT')) dx += 1;
        if (this.isKeyPressed('UP')) dy -= 1;
        if (this.isKeyPressed('DOWN')) dy += 1;

        if (this.touch.joystick.active) {
            dx = this.touch.joystick.x;
            dy = this.touch.joystick.y;
        }

        return { dx, dy };
    },

    serialize() {
        return {
            keys: this.keys,
            touch: this.touch
        };
    },

    deserialize(data) {
        this.keys = data.keys || {};
    }
};
