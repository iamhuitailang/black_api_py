const Input = {
    keys: {},
    keyPressed: {},
    keySequence: [],
    sequenceTimeout: null,

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },

    handleKeyDown(e) {
        if (!this.keys[e.code]) {
            this.keyPressed[e.code] = true;
        }
        this.keys[e.code] = true;
        
        if (['ArrowDown', 'ArrowRight', 'ArrowLeft', 'KeyZ'].includes(e.code)) {
            this.addToSequence(e.code);
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    },

    handleKeyUp(e) {
        this.keys[e.code] = false;
    },

    addToSequence(code) {
        this.keySequence.push(code);
        
        if (this.keySequence.length > 5) {
            this.keySequence.shift();
        }

        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }
        
        this.sequenceTimeout = setTimeout(() => {
            this.keySequence = [];
        }, 500);
    },

    checkTopspinSequence() {
        const seq = this.keySequence;
        const len = seq.length;
        
        if (len < 3) return false;
        
        for (let i = 0; i <= len - 3; i++) {
            if (seq[i] === 'ArrowDown' && 
                seq[i + 1] === 'ArrowRight' && 
                seq[i + 2] === 'KeyZ') {
                this.keySequence = [];
                return true;
            }
        }
        return false;
    },

    isKeyDown(code) {
        return this.keys[code] || false;
    },

    isKeyPressed(code) {
        const pressed = this.keyPressed[code];
        this.keyPressed[code] = false;
        return pressed || false;
    },

    clearPressed() {
        this.keyPressed = {};
    },

    getLeft() {
        return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA');
    },

    getRight() {
        return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD');
    },

    getUp() {
        return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW');
    },

    getDown() {
        return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS');
    },

    getNormalShot() {
        return this.isKeyPressed('KeyZ');
    },

    getSmash() {
        return this.isKeyPressed('KeyX');
    },

    getFlick() {
        return this.isKeyPressed('KeyC');
    },

    getPause() {
        return this.isKeyPressed('Escape') || this.isKeyPressed('KeyP');
    }
};
