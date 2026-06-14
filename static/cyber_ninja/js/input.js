class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (!this.keys[key]) {
                this.keyPressed[key] = true;
            }
            this.keys[key] = true;
            
            if (['w', 'a', 's', 'd', 'j', 'k', ' '].includes(key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            this.keyPressed = {};
        });
    }

    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    isKeyPressed(key) {
        const pressed = this.keyPressed[key.toLowerCase()] || false;
        this.keyPressed[key.toLowerCase()] = false;
        return pressed;
    }

    isLeft() {
        return this.isKeyDown('a');
    }

    isRight() {
        return this.isKeyDown('d');
    }

    isJump() {
        return this.isKeyPressed('w') || this.isKeyPressed(' ');
    }

    isAttack() {
        return this.isKeyPressed('j');
    }

    isShuriken() {
        return this.isKeyPressed('k');
    }

    isPause() {
        return this.isKeyPressed('escape');
    }

    clear() {
        this.keyPressed = {};
    }

    update() {
        this.keyPressed = {};
    }
}

const inputManager = new InputManager();
