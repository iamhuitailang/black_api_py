import { MAX_TILT, TILT_SPEED } from './constants.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.tilt = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update() {
        let targetTiltX = 0;
        let targetTiltY = 0;

        if (this.keys['w'] || this.keys['arrowup']) {
            targetTiltY = -MAX_TILT;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            targetTiltY = MAX_TILT;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            targetTiltX = -MAX_TILT;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            targetTiltX = MAX_TILT;
        }

        this.tilt.x += (targetTiltX - this.tilt.x) * TILT_SPEED * 2;
        this.tilt.y += (targetTiltY - this.tilt.y) * TILT_SPEED * 2;

        return { ...this.tilt };
    }

    getTilt() {
        return { ...this.tilt };
    }

    reset() {
        this.tilt = { x: 0, y: 0 };
        this.keys = {};
    }
}
