const inputManager = {
    keys: {},
    
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },
    
    handleKeyDown(e) {
        switch (e.code) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Space':
                e.preventDefault();
                break;
        }
        this.keys[e.code] = true;
    },
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    },
    
    isUpPressed() {
        return this.keys['ArrowUp'];
    },
    
    isDownPressed() {
        return this.keys['ArrowDown'];
    },
    
    isLeftPressed() {
        return this.keys['ArrowLeft'];
    },
    
    isRightPressed() {
        return this.keys['ArrowRight'];
    },
    
    isSpacePressed() {
        return this.keys['Space'];
    },
    
    reset() {
        this.keys = {};
    }
};
