class InputManager {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    update() {
        this.keysJustPressed = {};
    }

    isKeyDown(code) {
        return this.keys[code] === true;
    }

    isKeyJustPressed(code) {
        return this.keysJustPressed[code] === true;
    }

    get left() {
        return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA');
    }

    get right() {
        return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD');
    }

    get up() {
        return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW');
    }

    get jump() {
        return this.isKeyJustPressed('Space') || this.isKeyJustPressed('ArrowUp') || this.isKeyJustPressed('KeyW');
    }

    get attack() {
        return this.isKeyJustPressed('KeyJ') || this.isKeyJustPressed('KeyZ');
    }

    get spell() {
        return this.isKeyJustPressed('KeyK') || this.isKeyJustPressed('KeyX');
    }

    get dash() {
        return this.isKeyJustPressed('ShiftLeft') || this.isKeyJustPressed('ShiftRight');
    }

    get pause() {
        return this.isKeyJustPressed('Escape') || this.isKeyJustPressed('KeyP');
    }
}