class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        this.commandBuffer = [];
        this.maxBufferSize = 10;
        this.lastInputTime = 0;
        this.inputTimeout = 1000;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.key]) {
                this.keyPressed[e.key] = true;
            }
            this.keys[e.key] = true;
            this.lastInputTime = Date.now();
            this.addToBuffer(e.key);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keyPressed[e.key] = false;
        });
    }

    addToBuffer(key) {
        const direction = this.getDirectionFromKey(key);
        if (direction) {
            this.commandBuffer.push({
                direction,
                time: Date.now()
            });
        }
        
        const action = this.getActionFromKey(key);
        if (action) {
            this.commandBuffer.push({
                action,
                time: Date.now()
            });
        }

        if (this.commandBuffer.length > this.maxBufferSize) {
            this.commandBuffer.shift();
        }
    }

    getDirectionFromKey(key) {
        switch (key) {
            case 'ArrowLeft': return 'left';
            case 'ArrowRight': return 'right';
            case 'ArrowUp': return 'up';
            case 'ArrowDown': return 'down';
            default: return null;
        }
    }

    getActionFromKey(key) {
        switch (key.toLowerCase()) {
            case 'j': return 'punch';
            case 'k': return 'punch';
            case 'u': return 'kick';
            case 'i': return 'kick';
            default: return null;
        }
    }

    checkSpecialMove(command) {
        const now = Date.now();
        const recentInputs = this.commandBuffer.filter(
            input => now - input.time < this.inputTimeout
        );

        const directions = recentInputs.map(i => i.direction || i.action);
        
        for (let i = 0; i <= directions.length - command.length; i++) {
            let match = true;
            for (let j = 0; j < command.length; j++) {
                if (directions[i + j] !== command[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                this.commandBuffer = [];
                return true;
            }
        }
        return false;
    }

    isKeyPressed(key) {
        const pressed = this.keyPressed[key];
        this.keyPressed[key] = false;
        return pressed;
    }

    isKeyDown(key) {
        return this.keys[key];
    }

    getLeft() {
        return this.keys['ArrowLeft'];
    }

    getRight() {
        return this.keys['ArrowRight'];
    }

    getUp() {
        return this.keyPressed['ArrowUp'];
    }

    getDown() {
        return this.keys['ArrowDown'];
    }

    getLightPunch() {
        return this.keyPressed['j'] || this.keyPressed['J'];
    }

    getHeavyPunch() {
        return this.keyPressed['k'] || this.keyPressed['K'];
    }

    getLightKick() {
        return this.keyPressed['u'] || this.keyPressed['U'];
    }

    getHeavyKick() {
        return this.keyPressed['i'] || this.keyPressed['I'];
    }

    getPause() {
        return this.keyPressed['Escape'];
    }
}

const input = new InputManager();