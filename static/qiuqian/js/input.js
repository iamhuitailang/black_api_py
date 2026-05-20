const Input = {
    keys: {},
    justPressed: {},
    
    init() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    },
    
    onKeyDown(e) {
        if (!this.keys[e.code]) {
            this.justPressed[e.code] = true;
        }
        this.keys[e.code] = true;
        
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    },
    
    onKeyUp(e) {
        this.keys[e.code] = false;
    },
    
    update() {
        this.justPressed = {};
    },
    
    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'];
    },
    
    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'];
    },
    
    isUp() {
        return this.keys['ArrowUp'] || this.keys['KeyW'];
    },
    
    isDown() {
        return this.keys['ArrowDown'] || this.keys['KeyS'];
    },
    
    isSpace() {
        return this.keys['Space'];
    },
    
    isSpacePressed() {
        return this.justPressed['Space'];
    },
    
    isSpaceReleased() {
        return this.keys['Space'] === false && this._spaceWasPressed;
    },
    
    getSwingDirection() {
        if (this.isLeft()) return -1;
        if (this.isRight()) return 1;
        return 0;
    },
    
    getAirInput() {
        return {
            left: this.isLeft(),
            right: this.isRight(),
            diving: this.isDown(),
            hovering: this.isUp()
        };
    },
    
    isPausePressed() {
        return this.justPressed['Escape'] || this.justPressed['KeyP'];
    }
};
