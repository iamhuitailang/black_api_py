const Input = {
    keys: {},
    keyPressed: {},
    keyReleased: {},

    init() {
        window.addEventListener('keydown', (e) => {
            const key = this.normalizeKey(e.key);
            if (!this.keys[key]) {
                this.keyPressed[key] = true;
            }
            this.keys[key] = true;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = this.normalizeKey(e.key);
            this.keys[key] = false;
            this.keyReleased[key] = true;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },

    normalizeKey(key) {
        const keyMap = {
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            ' ': 'space',
            'Shift': 'shift',
            'Escape': 'escape'
        };
        return keyMap[key] || key.toLowerCase();
    },

    isDown(key) {
        return !!this.keys[key];
    },

    wasPressed(key) {
        if (this.keyPressed[key]) {
            this.keyPressed[key] = false;
            return true;
        }
        return false;
    },

    wasReleased(key) {
        if (this.keyReleased[key]) {
            this.keyReleased[key] = false;
            return true;
        }
        return false;
    },

    clear() {
        this.keyPressed = {};
        this.keyReleased = {};
    }
};
