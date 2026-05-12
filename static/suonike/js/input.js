class InputManager {
    constructor() {
        this.keys = {};
        this.keyJustPressed = {};
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keyJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            this.keyJustPressed = {};
        });
    }

    update() {
        this.keyJustPressed = {};
    }

    isKeyPressed(code) {
        return this.keys[code] || false;
    }

    isKeyJustPressed(code) {
        return this.keyJustPressed[code] || false;
    }

    get left() {
        return this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA');
    }

    get right() {
        return this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD');
    }

    get up() {
        return this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW');
    }

    get down() {
        return this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS');
    }

    get jump() {
        return this.isKeyJustPressed('Space') || this.isKeyJustPressed('KeyZ');
    }

    get attack() {
        return this.isKeyJustPressed('KeyX') || this.isKeyJustPressed('KeyC');
    }

    get pause() {
        return this.isKeyJustPressed('Escape') || this.isKeyJustPressed('KeyP');
    }

    getDirection() {
        let dx = 0;
        let dy = 0;

        if (this.left) dx -= 1;
        if (this.right) dx += 1;
        if (this.up) dy -= 1;
        if (this.down) dy += 1;

        return { x: dx, y: dy };
    }
}

const input = new InputManager();
