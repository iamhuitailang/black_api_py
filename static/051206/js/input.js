import { KEYS } from './config.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keyPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keyPressed[e.code] = false;
        });
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }

    isKeyPressed(keyCode) {
        const pressed = this.keyPressed[keyCode] === true;
        if (pressed) {
            this.keyPressed[keyCode] = false;
        }
        return pressed;
    }

    isLeft() {
        return KEYS.LEFT.some(key => this.isKeyDown(key));
    }

    isRight() {
        return KEYS.RIGHT.some(key => this.isKeyDown(key));
    }

    isUp() {
        return KEYS.UP.some(key => this.isKeyDown(key));
    }

    isDown() {
        return KEYS.DOWN.some(key => this.isKeyDown(key));
    }

    isJump() {
        return KEYS.UP.some(key => this.isKeyPressed(key));
    }

    isFire() {
        return KEYS.FIRE.some(key => this.isKeyPressed(key));
    }

    getDirection() {
        let dx = 0;
        if (this.isLeft()) dx -= 1;
        if (this.isRight()) dx += 1;
        return dx;
    }

    reset() {
        for (const key in this.keyPressed) {
            this.keyPressed[key] = false;
        }
    }
}

export const inputManager = new InputManager();