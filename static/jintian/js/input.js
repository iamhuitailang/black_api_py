const Input = {
    keys: {},
    keyDownQueue: [],
    
    init() {
        console.log('Input system initializing...');
        
        this.keys = {};
        this.keyDownQueue = [];
        
        document.addEventListener('keydown', (e) => {
            const key = e.code;
            this.keys[key] = true;
            this.keyDownQueue.push(key);
            
            const gameKeys = [
                GameConfig.KEYS.LEFT,
                GameConfig.KEYS.RIGHT,
                GameConfig.KEYS.UP,
                GameConfig.KEYS.DOWN,
                GameConfig.KEYS.LIGHT_PALM,
                GameConfig.KEYS.HEAVY_PALM,
                GameConfig.KEYS.LIGHT_KICK,
                GameConfig.KEYS.HEAVY_KICK,
                GameConfig.KEYS.SWITCH_FACE,
                GameConfig.KEYS.SPECIAL,
                GameConfig.KEYS.PAUSE
            ];
            
            if (gameKeys.includes(key)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
        
        document.addEventListener('keyup', (e) => {
            const key = e.code;
            this.keys[key] = false;
        }, true);
        
        window.addEventListener('blur', () => {
            this.keys = {};
        });
        
        console.log('Input system initialized');
    },
    
    isDown(key) {
        return this.keys[key] === true;
    },
    
    wasPressed(key) {
        const index = this.keyDownQueue.indexOf(key);
        if (index !== -1) {
            this.keyDownQueue.splice(index, 1);
            return true;
        }
        return false;
    },
    
    endFrame() {
    },
    
    reset() {
        this.keys = {};
        this.keyDownQueue = [];
    }
};
