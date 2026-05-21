const InputManager = {
    keys: {},
    keyPressed: {},
    commandBuffer: [],
    maxBufferLength: 10,
    initialized: false,
    
    init() {
        if (this.initialized) return;
        
        this.keys = {};
        this.keyPressed = {};
        this.commandBuffer = [];
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        this.initialized = true;
    },
    
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (!this.keys[key]) {
            this.keyPressed[key] = true;
            this.addToBuffer(key, 'down');
        }
        
        this.keys[key] = true;
        
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
            e.preventDefault();
        }
    },
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
        this.addToBuffer(key, 'up');
    },
    
    addToBuffer(key, action) {
        this.commandBuffer.push({
            key,
            action,
            time: Date.now()
        });
        
        if (this.commandBuffer.length > this.maxBufferLength) {
            this.commandBuffer.shift();
        }
    },
    
    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    },
    
    isKeyPressed(key) {
        const pressed = this.keyPressed[key.toLowerCase()] || false;
        this.keyPressed[key.toLowerCase()] = false;
        return pressed;
    },
    
    checkSpecialInput() {
        const now = Date.now();
        const windowTime = 500;
        
        const recentInputs = this.commandBuffer.filter(
            input => now - input.time < windowTime
        );
        
        const pattern = ['arrowdown', 'arrowright', 'a'];
        let patternIndex = 0;
        
        for (const input of recentInputs) {
            if (input.action === 'down' && input.key === pattern[patternIndex]) {
                patternIndex++;
                if (patternIndex === pattern.length) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    getDirection() {
        let x = 0;
        let y = 0;
        
        if (this.isKeyDown('arrowleft')) x -= 1;
        if (this.isKeyDown('arrowright')) x += 1;
        if (this.isKeyDown('arrowup')) y -= 1;
        if (this.isKeyDown('arrowdown')) y += 1;
        
        return { x, y };
    },
    
    getAttackInput() {
        if (this.isKeyPressed('a')) return 'lightJuggle';
        if (this.isKeyPressed('s')) return 'heavyStage';
        if (this.isKeyPressed('d')) return 'lightKick';
        if (this.isKeyPressed('f')) return 'heavyAirKick';
        if (this.isKeyPressed('g')) return 'special';
        return null;
    },
    
    reset() {
        this.keyPressed = {};
    },
    
    resetAll() {
        this.keys = {};
        this.keyPressed = {};
        this.commandBuffer = [];
    }
};
