class InputManager {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.touchControls = {
            left: false,
            right: false,
            gas: false,
            brake: false,
            trick: false
        };
        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.key.toUpperCase()]) {
                this.keysJustPressed[e.key.toUpperCase()] = true;
            }
            this.keys[e.key.toUpperCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toUpperCase()] = false;
        });
    }

    setupTouch() {
        const buttons = {
            'btn-left': 'left',
            'btn-right': 'right',
            'btn-gas': 'gas',
            'btn-brake': 'brake',
            'btn-trick': 'trick'
        };

        for (const [btnId, control] of Object.entries(buttons)) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.touchControls[control] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.touchControls[control] = false;
                });
                btn.addEventListener('mousedown', () => {
                    this.touchControls[control] = true;
                });
                btn.addEventListener('mouseup', () => {
                    this.touchControls[control] = false;
                });
                btn.addEventListener('mouseleave', () => {
                    this.touchControls[control] = false;
                });
            }
        }
    }

    isGas() {
        return this.keys['ARROWUP'] || this.keys['W'] || this.touchControls.gas;
    }

    isBrake() {
        return this.keys['ARROWDOWN'] || this.keys['S'] || this.touchControls.brake;
    }

    isTiltLeft() {
        return this.keys['ARROWLEFT'] || this.keys['A'] || this.touchControls.left;
    }

    isTiltRight() {
        return this.keys['ARROWRIGHT'] || this.keys['D'] || this.touchControls.right;
    }

    isTrickJ() {
        return this.keys['J'];
    }

    isTrickK() {
        return this.keys['K'];
    }

    isTrickL() {
        return this.keys['L'];
    }

    isTrick() {
        return this.isTrickJ() || this.isTrickK() || this.isTrickL() || this.touchControls.trick;
    }

    isReset() {
        return this.keys['R'];
    }

    getTrickKeys() {
        const keys = [];
        if (this.isTrickJ()) keys.push('J');
        if (this.isTrickK()) keys.push('K');
        if (this.isTrickL()) keys.push('L');
        return keys;
    }

    isKeyJustPressed(key) {
        const pressed = this.keysJustPressed[key.toUpperCase()];
        this.keysJustPressed[key.toUpperCase()] = false;
        return pressed;
    }

    update() {
        this.keysJustPressed = {};
    }
}

const input = new InputManager();