const Input = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    
    comboHistory: [],
    comboMaxLength: 3,
    comboTimeWindow: 500,
    
    spaceJustPressed: false,
    spaceWasPressed: false,
    
    init() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    },
    
    onKeyDown(e) {
        const key = e.key.toLowerCase();
        
        switch (key) {
            case 'arrowleft':
            case 'a':
                if (!this.left) this.addToHistory('left');
                this.left = true;
                break;
            case 'arrowright':
            case 'd':
                if (!this.right) this.addToHistory('right');
                this.right = true;
                break;
            case 'arrowup':
            case 'w':
                if (!this.up) this.addToHistory('up');
                this.up = true;
                break;
            case 'arrowdown':
            case 's':
                if (!this.down) this.addToHistory('down');
                this.down = true;
                break;
            case ' ':
                e.preventDefault();
                this.space = true;
                break;
        }
    },
    
    onKeyUp(e) {
        const key = e.key.toLowerCase();
        
        switch (key) {
            case 'arrowleft':
            case 'a':
                this.left = false;
                break;
            case 'arrowright':
            case 'd':
                this.right = false;
                break;
            case 'arrowup':
            case 'w':
                this.up = false;
                break;
            case 'arrowdown':
            case 's':
                this.down = false;
                break;
            case ' ':
                this.space = false;
                break;
        }
    },
    
    addToHistory(direction) {
        const now = Date.now();
        this.comboHistory.push({ direction, time: now });
        
        this.cleanOldHistory(now);
        
        if (this.comboHistory.length > this.comboMaxLength) {
            this.comboHistory.shift();
        }
    },
    
    cleanOldHistory(now) {
        while (this.comboHistory.length > 0) {
            const oldest = this.comboHistory[0];
            if (now - oldest.time > this.comboTimeWindow) {
                this.comboHistory.shift();
            } else {
                break;
            }
        }
    },
    
    checkUltimateCombo() {
        this.cleanOldHistory(Date.now());
        
        if (this.comboHistory.length < 3) return false;
        
        const recentMoves = this.comboHistory.slice(-3);
        const directions = recentMoves.map(m => m.direction);
        
        const targetCombo = ['down', 'right', 'up'];
        
        for (let i = 0; i < 3; i++) {
            if (directions[i] !== targetCombo[i]) return false;
        }
        
        return true;
    },
    
    update() {
        this.spaceJustPressed = this.space && !this.spaceWasPressed;
        this.spaceWasPressed = this.space;
    },
    
    reset() {
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        this.space = false;
        this.spaceJustPressed = false;
        this.spaceWasPressed = false;
        this.comboHistory = [];
    },
    
    getState() {
        return {
            left: this.left,
            right: this.right,
            up: this.up,
            down: this.down,
            space: this.space
        };
    }
};