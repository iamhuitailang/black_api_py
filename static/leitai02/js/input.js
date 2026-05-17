const Input = {
    keys: {},
    pressedKeys: {},
    keyDownCallbacks: {},
    keyUpCallbacks: {},
    
    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('blur', () => this.clearKeys());
    },
    
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
            e.preventDefault();
        }
        
        if (!this.keys[key]) {
            this.pressedKeys[key] = true;
            if (this.keyDownCallbacks[key]) {
                this.keyDownCallbacks[key]();
            }
        }
        
        this.keys[key] = true;
    },
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
        if (this.keyUpCallbacks[key]) {
            this.keyUpCallbacks[key]();
        }
    },
    
    clearKeys() {
        this.keys = {};
        this.pressedKeys = {};
    },
    
    isDown(key) {
        return !!this.keys[key.toLowerCase()];
    },
    
    wasPressed(key) {
        const pressed = !!this.pressedKeys[key.toLowerCase()];
        return pressed;
    },
    
    clearPressed() {
        this.pressedKeys = {};
    },
    
    onKeyDown(key, callback) {
        this.keyDownCallbacks[key.toLowerCase()] = callback;
    },
    
    onKeyUp(key, callback) {
        this.keyUpCallbacks[key.toLowerCase()] = callback;
    },
    
    getLeft() {
        return this.isDown('arrowleft') || this.isDown('a');
    },
    
    getRight() {
        return this.isDown('arrowright') || this.isDown('d');
    },
    
    getUp() {
        return this.wasPressed('arrowup') || this.wasPressed('w') || this.wasPressed(' ');
    },
    
    getDown() {
        return this.isDown('arrowdown') || this.isDown('s');
    },
    
    getLightPunch() {
        return this.wasPressed('j');
    },
    
    getHeavyPunch() {
        return this.wasPressed('k');
    },
    
    getLightKick() {
        return this.wasPressed('l');
    },
    
    getHeavyKick() {
        return this.wasPressed('u');
    },
    
    getSpecial() {
        return this.wasPressed('f');
    },
    
    getGrab() {
        return this.wasPressed('g');
    },
    
    getBlock() {
        return this.isDown('arrowdown');
    },
    
    getPause() {
        return this.wasPressed('escape');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Input;
}
