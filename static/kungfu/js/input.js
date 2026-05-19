const Input = {
    keys: {},
    _justPressed: {},

    init() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (!this.keys[key]) {
                this._justPressed[key] = true;
            }
            this.keys[key] = true;

            if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });
    },

    isPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    },

    wasPressed(key) {
        const lowerKey = key.toLowerCase();
        if (this._justPressed[lowerKey]) {
            this._justPressed[lowerKey] = false;
            return true;
        }
        return false;
    },

    update() {
        this._justPressed = {};
    },

    getDebugInfo() {
        return {
            keys: {
                j: this.keys.j,
                k: this.keys.k,
                u: this.keys.u,
                i: this.keys.i,
                l: this.keys.l
            },
            justPressed: {
                j: this._justPressed.j,
                k: this._justPressed.k,
                u: this._justPressed.u,
                i: this._justPressed.i,
                l: this._justPressed.l
            }
        };
    },

    getPlayerInput() {
        return {
            left: this.isPressed('arrowleft') || this.isPressed('a'),
            right: this.isPressed('arrowright') || this.isPressed('d'),
            up: this.wasPressed('arrowup') || this.wasPressed('w'),
            down: this.isPressed('arrowdown') || this.isPressed('s'),
            lightPunch: this.wasPressed('j'),
            heavyPunch: this.wasPressed('k'),
            lightKick: this.wasPressed('u'),
            heavyKick: this.wasPressed('i'),
            ultimate: this.wasPressed('l'),
            pause: this.wasPressed('escape')
        };
    }
};
