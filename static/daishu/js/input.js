const Input = {
    keys: {},
    
    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },
    
    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'];
    },
    
    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'];
    },
    
    isJump() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
    },
    
    isPause() {
        return this.keys['KeyP'];
    },
    
    consumeJump() {
        const jumped = this.isJump();
        if (jumped) {
            this.keys['Space'] = false;
            this.keys['ArrowUp'] = false;
            this.keys['KeyW'] = false;
        }
        return jumped;
    },
    
    consumePause() {
        const paused = this.isPause();
        if (paused) {
            this.keys['KeyP'] = false;
        }
        return paused;
    }
};
