export class InputManager {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false,
            escape: false
        };
        
        this.keyPressed = {
            space: false,
            escape: false
        };
        
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        document.body.setAttribute('tabindex', '0');
        document.body.focus();
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                break;
            case 'Space':
                if (!this.keys.space) {
                    this.keyPressed.space = true;
                }
                this.keys.space = true;
                e.preventDefault();
                break;
            case 'Escape':
                if (!this.keys.escape) {
                    this.keyPressed.escape = true;
                }
                this.keys.escape = true;
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'Space':
                this.keys.space = false;
                break;
            case 'Escape':
                this.keys.escape = false;
                break;
        }
    }

    getInput() {
        const input = {
            left: this.keys.left,
            right: this.keys.right,
            up: this.keys.up,
            down: this.keys.down,
            useItem: this.keyPressed.space
        };
        this.keyPressed.space = false;
        return input;
    }

    wasSpacePressed() {
        const pressed = this.keyPressed.space;
        this.keyPressed.space = false;
        return pressed;
    }

    wasEscapePressed() {
        const pressed = this.keyPressed.escape;
        this.keyPressed.escape = false;
        return pressed;
    }

    reset() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false,
            escape: false
        };
        this.keyPressed = {
            space: false,
            escape: false
        };
    }
}
