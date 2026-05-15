const Input = {
    keys: {},
    
    init() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') {
                if (window.game && window.game.state === GAME_STATE.PLAYING) {
                    window.game.pause();
                } else if (window.game && window.game.state === GAME_STATE.PAUSED) {
                    window.game.resume();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },
    
    isPressed(keyCode) {
        return this.keys[keyCode] || false;
    },
    
    getMovement() {
        let direction = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) direction -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) direction += 1;
        return direction;
    },
    
    isJump() {
        return this.keys['ArrowUp'] || this.keys['KeyW'];
    },
    
    isCrouch() {
        return this.keys['ArrowDown'] || this.keys['KeyS'];
    },
    
    isLightAttack() {
        return this.keys['KeyA'];
    },
    
    isHeavyAttack() {
        return this.keys['KeyS'];
    },
    
    isThrow() {
        return this.keys['KeyD'];
    },
    
    isPin() {
        return this.keys['KeyW'];
    },
    
    isEscape() {
        return this.keys['KeyE'];
    }
};