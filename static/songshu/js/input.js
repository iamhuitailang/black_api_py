class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        this.touchControls = {};
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.setupKeyboard();
        this.setupTouchControls();
    }

    setupKeyboard() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    setupTouchControls() {
        const buttons = [
            { id: 'btn-up', action: 'UP' },
            { id: 'btn-down', action: 'DOWN' },
            { id: 'btn-left', action: 'LEFT' },
            { id: 'btn-right', action: 'RIGHT' },
            { id: 'btn-jump', action: 'JUMP' },
            { id: 'btn-action', action: 'ACTION' }
        ];

        buttons.forEach(({ id, action }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.setKey(action, true);
                }, { passive: false });
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.setKey(action, false);
                }, { passive: false });
                
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.setKey(action, true);
                });
                
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.setKey(action, false);
                });
                
                btn.addEventListener('mouseleave', () => {
                    this.setKey(action, false);
                });
            }
        });
    }

    onKeyDown(e) {
        const key = this.mapKey(e.code);
        if (key) {
            if (!this.keys[key]) {
                this.keysPressed[key] = true;
            }
            this.keys[key] = true;
            e.preventDefault();
        }
    }

    onKeyUp(e) {
        const key = this.mapKey(e.code);
        if (key) {
            this.keys[key] = false;
            this.keysReleased[key] = true;
            e.preventDefault();
        }
    }

    mapKey(code) {
        for (const [action, codes] of Object.entries(CONFIG.KEYS)) {
            if (codes.includes(code)) {
                return action;
            }
        }
        return null;
    }

    setKey(action, pressed) {
        if (pressed && !this.keys[action]) {
            this.keysPressed[action] = true;
        }
        this.keys[action] = pressed;
        if (!pressed) {
            this.keysReleased[action] = true;
        }
    }

    isDown(action) {
        return this.keys[action] || false;
    }

    wasPressed(action) {
        const pressed = this.keysPressed[action];
        return pressed || false;
    }

    wasReleased(action) {
        const released = this.keysReleased[action];
        return released || false;
    }

    update() {
        this.keysPressed = {};
        this.keysReleased = {};
    }

    reset() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
    }

    getDirection(playerNum = 1) {
        if (playerNum === 1) {
            return {
                x: (this.isDown('RIGHT') ? 1 : 0) - (this.isDown('LEFT') ? 1 : 0),
                y: (this.isDown('DOWN') ? 1 : 0) - (this.isDown('UP') ? 1 : 0)
            };
        } else {
            return {
                x: (this.isDown('P2_RIGHT') ? 1 : 0) - (this.isDown('P2_LEFT') ? 1 : 0),
                y: (this.isDown('P2_DOWN') ? 1 : 0) - (this.isDown('P2_UP') ? 1 : 0)
            };
        }
    }

    isJumping(playerNum = 1) {
        if (playerNum === 1) {
            return this.wasPressed('JUMP') || this.wasPressed('UP');
        }
        return this.wasPressed('P2_JUMP') || this.wasPressed('P2_UP');
    }

    isAction(playerNum = 1) {
        if (playerNum === 1) {
            return this.wasPressed('ACTION');
        }
        return this.wasPressed('P2_ACTION');
    }

    isHoldingAction(playerNum = 1) {
        if (playerNum === 1) {
            return this.isDown('ACTION');
        }
        return this.isDown('P2_ACTION');
    }

    isCrouching(playerNum = 1) {
        if (playerNum === 1) {
            return this.isDown('DOWN');
        }
        return this.isDown('P2_DOWN');
    }

    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}

const Input = new InputManager();
