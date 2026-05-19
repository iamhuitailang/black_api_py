import { INPUT_KEYS } from './config.js';

export const Input = {
    keys: {},
    pressedKeys: {},
    commandBuffer: [],
    BUFFER_TIME: 500,

    init() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('blur', () => this.reset());
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.reset();
            }
        });
    },

    reset() {
        this.keys = {};
        this.pressedKeys = {};
    },

    onKeyDown(e) {
        if (e.repeat) return;
        this.keys[e.code] = true;
        this.pressedKeys[e.code] = true;
        this.addToCommandBuffer(e.code);
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    },

    onKeyUp(e) {
        this.keys[e.code] = false;
    },

    isPressed(code) {
        return !!this.keys[code];
    },

    wasPressed(code) {
        const pressed = !!this.pressedKeys[code];
        return pressed;
    },

    clearPressed() {
        this.pressedKeys = {};
    },

    addToCommandBuffer(code) {
        const now = Date.now();
        let direction = null;
        let action = null;

        if (code === INPUT_KEYS.LEFT) direction = 'left';
        else if (code === INPUT_KEYS.RIGHT) direction = 'right';
        else if (code === INPUT_KEYS.UP) direction = 'up';
        else if (code === INPUT_KEYS.DOWN) direction = 'down';
        else if (code === INPUT_KEYS.LIGHT) action = 'light';
        else if (code === INPUT_KEYS.HEAVY) action = 'heavy';

        if (direction || action) {
            this.commandBuffer.push({ input: direction || action, time: now });
            this.cleanBuffer();
        }
    },

    cleanBuffer() {
        const now = Date.now();
        this.commandBuffer = this.commandBuffer.filter(item => now - item.time < this.BUFFER_TIME);
        if (this.commandBuffer.length > 10) {
            this.commandBuffer = this.commandBuffer.slice(-10);
        }
    },

    checkCommand(command) {
        if (this.commandBuffer.length < command.length) return false;
        
        const recent = this.commandBuffer.slice(-command.length);
        for (let i = 0; i < command.length; i++) {
            if (recent[i].input !== command[i]) return false;
        }
        return true;
    },

    clearBuffer() {
        this.commandBuffer = [];
    },

    getDirection() {
        const left = this.isPressed(INPUT_KEYS.LEFT);
        const right = this.isPressed(INPUT_KEYS.RIGHT);
        const up = this.isPressed(INPUT_KEYS.UP);
        const down = this.isPressed(INPUT_KEYS.DOWN);
        return { left, right, up, down };
    },

    endFrame() {
        this.pressedKeys = {};
    },
};
