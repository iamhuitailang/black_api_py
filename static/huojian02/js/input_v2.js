export class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'];
    }
    
    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'];
    }
    
    isUp() {
        return this.keys['ArrowUp'] || this.keys['KeyW'];
    }
    
    isDown() {
        return this.keys['ArrowDown'] || this.keys['KeyS'];
    }
    
    isJump() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
    }
    
    isJumpPressed() {
        const pressed = this.keysPressed['Space'] || this.keysPressed['ArrowUp'] || this.keysPressed['KeyW'];
        this.keysPressed['Space'] = false;
        this.keysPressed['ArrowUp'] = false;
        this.keysPressed['KeyW'] = false;
        return pressed;
    }
    
    isAction() {
        return this.keys['KeyE'];
    }
    
    isActionPressed() {
        const pressed = this.keysPressed['KeyE'];
        this.keysPressed['KeyE'] = false;
        return pressed;
    }
    
    isPause() {
        return this.keysPressed['Escape'] || this.keysPressed['KeyP'];
    }
    
    isPausePressed() {
        const pressed = this.keysPressed['Escape'] || this.keysPressed['KeyP'];
        this.keysPressed['Escape'] = false;
        this.keysPressed['KeyP'] = false;
        return pressed;
    }
    
    update() {
        this.keysPressed = {};
    }
}
