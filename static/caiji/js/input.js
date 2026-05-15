export class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        this.keyReleased = {};
        this.commandBuffer = [];
        this.maxBufferSize = 10;
        this.lastInputTime = 0;
        this.commandTimeout = 500;
        
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        if (!this.keys[e.code]) {
            this.keyPressed[e.code] = true;
            this.addToBuffer(e.code);
        }
        this.keys[e.code] = true;
        this.lastInputTime = Date.now();
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
        this.keyReleased[e.code] = true;
    }

    addToBuffer(code) {
        const directionMap = {
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'KeyA': '←',
            'KeyD': '→',
            'KeyW': '↑',
            'KeyS': '↓'
        };

        const attackMap = {
            'KeyJ': '啄',
            'KeyK': '啄',
            'KeyU': '拍',
            'KeyI': '拍'
        };

        let input = directionMap[code] || attackMap[code];
        
        if (input) {
            this.commandBuffer.push({
                input: input,
                time: Date.now()
            });
            
            if (this.commandBuffer.length > this.maxBufferSize) {
                this.commandBuffer.shift();
            }
        }
    }

    getBufferString() {
        const now = Date.now();
        this.commandBuffer = this.commandBuffer.filter(
            cmd => now - cmd.time < this.commandTimeout
        );
        return this.commandBuffer.map(cmd => cmd.input).join('');
    }

    checkUltimate() {
        const buffer = this.getBufferString();
        
        if (buffer.includes('↓→啄') || buffer.includes('↓→啄')) {
            return 'flyingPeck';
        }
        if (buffer.includes('↓←拍') || buffer.includes('←↓拍')) {
            return 'wingSpin';
        }
        if (buffer.includes('←↓→啄') || buffer.includes('→↓←啄')) {
            return 'slidePeck';
        }
        
        return null;
    }

    isKeyDown(code) {
        return this.keys[code] || false;
    }

    wasKeyPressed(code) {
        const pressed = this.keyPressed[code];
        this.keyPressed[code] = false;
        return pressed || false;
    }

    wasKeyReleased(code) {
        const released = this.keyReleased[code];
        this.keyReleased[code] = false;
        return released || false;
    }

    getMovement() {
        let x = 0;
        let y = 0;

        if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) x -= 1;
        if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) x += 1;
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) y -= 1;
        if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) y += 1;

        return { x, y };
    }

    getAttack() {
        if (this.wasKeyPressed('KeyJ')) return 'lightPeck';
        if (this.wasKeyPressed('KeyK')) return 'heavyPeck';
        if (this.wasKeyPressed('KeyU')) return 'lightWing';
        if (this.wasKeyPressed('KeyI')) return 'heavyWing';
        return null;
    }

    clearBuffer() {
        this.commandBuffer = [];
    }

    update() {
        Object.keys(this.keyPressed).forEach(key => {
            this.keyPressed[key] = false;
        });
        Object.keys(this.keyReleased).forEach(key => {
            this.keyReleased[key] = false;
        });
    }
}