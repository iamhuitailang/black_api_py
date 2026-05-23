class InputManager {
    constructor() {
        this.keys = {};
        this.spacePressed = false;
        this.spaceHoldTime = 0;
        this.spacePressedAt = 0;
        this.onJump = null;
        this.onChargeJump = null;
        this.onPause = null;
        this.onRestart = null;
        this.init();
    }
    
    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        const key = e.code;
        this.keys[key] = true;
        
        if (key === 'Space' && !this.spacePressed) {
            this.spacePressed = true;
            this.spacePressedAt = Date.now();
            e.preventDefault();
        }
        
        if (key === 'Escape' && this.onPause) {
            this.onPause();
        }
        
        if (key === 'KeyR' && this.onRestart) {
            this.onRestart();
        }
    }
    
    handleKeyUp(e) {
        const key = e.code;
        
        if (key === 'Space' && this.spacePressed) {
            const holdTime = Date.now() - this.spacePressedAt;
            const isCharged = holdTime >= 500;
            
            if (isCharged && this.onChargeJump) {
                this.onChargeJump(holdTime);
            } else if (this.onJump) {
                this.onJump();
            }
            
            this.spacePressed = false;
            this.spaceHoldTime = 0;
            e.preventDefault();
        }
        
        this.keys[key] = false;
    }
    
    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'];
    }
    
    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'];
    }
    
    isSpacePressed() {
        return this.spacePressed;
    }
    
    getSpaceHoldTime() {
        if (this.spacePressed) {
            return Date.now() - this.spacePressedAt;
        }
        return 0;
    }
    
    reset() {
        this.keys = {};
        this.spacePressed = false;
        this.spaceHoldTime = 0;
        this.spacePressedAt = 0;
    }
}

window.InputManager = InputManager;
