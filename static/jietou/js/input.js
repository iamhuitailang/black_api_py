class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        this.commandBuffer = [];
        this.maxBufferLength = 10;
        this.bufferTime = 1000;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keyPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            this.addToBuffer(e.code);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keyPressed[e.code] = false;
        });
    }

    addToBuffer(keyCode) {
        const now = Date.now();
        this.commandBuffer.push({ key: keyCode, time: now });
        
        while (this.commandBuffer.length > this.maxBufferLength) {
            this.commandBuffer.shift();
        }
        
        this.cleanBuffer();
    }

    cleanBuffer() {
        const now = Date.now();
        this.commandBuffer = this.commandBuffer.filter(
            entry => now - entry.time < this.bufferTime
        );
    }

    isKeyPressed(keyCode) {
        return this.keyPressed[keyCode];
    }

    isKeyHeld(keyCode) {
        return this.keys[keyCode];
    }

    consumeKeyPress(keyCode) {
        const pressed = this.keyPressed[keyCode];
        this.keyPressed[keyCode] = false;
        return pressed;
    }

    checkCommand(commandSequence) {
        if (this.commandBuffer.length < commandSequence.length) {
            return false;
        }

        const recentInputs = this.commandBuffer.slice(-commandSequence.length);
        
        for (let i = 0; i < commandSequence.length; i++) {
            if (recentInputs[i].key !== commandSequence[i]) {
                return false;
            }
        }
        
        return true;
    }

    getDirection() {
        if (this.isKeyHeld('ArrowLeft') && this.isKeyHeld('ArrowDown')) {
            return 'down_left';
        }
        if (this.isKeyHeld('ArrowRight') && this.isKeyHeld('ArrowDown')) {
            return 'down_right';
        }
        if (this.isKeyHeld('ArrowLeft')) {
            return 'left';
        }
        if (this.isKeyHeld('ArrowRight')) {
            return 'right';
        }
        if (this.isKeyHeld('ArrowDown')) {
            return 'down';
        }
        return 'neutral';
    }

    reset() {
        this.keys = {};
        this.keyPressed = {};
        this.commandBuffer = [];
    }
}