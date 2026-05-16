class InputManager {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.attackKeys = {
            scratch: false,
            push: false,
            bite: false,
            ultimate: false
        };
        this.pendingAttacks = [];
        this.setupListeners();
    }
    
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.down = true;
                    break;
                case 'z':
                case 'Z':
                    if (!this.attackKeys.scratch) {
                        this.attackKeys.scratch = true;
                        this.pendingAttacks.push('scratch');
                    }
                    break;
                case 'x':
                case 'X':
                    if (!this.attackKeys.push) {
                        this.attackKeys.push = true;
                        this.pendingAttacks.push('push');
                    }
                    break;
                case 'c':
                case 'C':
                    if (!this.attackKeys.bite) {
                        this.attackKeys.bite = true;
                        this.pendingAttacks.push('bite');
                    }
                    break;
                case 'v':
                case 'V':
                    if (!this.attackKeys.ultimate) {
                        this.attackKeys.ultimate = true;
                        this.pendingAttacks.push('ultimate');
                    }
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.down = false;
                    break;
                case 'z':
                case 'Z':
                    this.attackKeys.scratch = false;
                    break;
                case 'x':
                case 'X':
                    this.attackKeys.push = false;
                    break;
                case 'c':
                case 'C':
                    this.attackKeys.bite = false;
                    break;
                case 'v':
                case 'V':
                    this.attackKeys.ultimate = false;
                    break;
            }
        });
    }
    
    getPendingAttacks() {
        const attacks = [...this.pendingAttacks];
        this.pendingAttacks = [];
        return attacks;
    }
    
    reset() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.attackKeys = {
            scratch: false,
            push: false,
            bite: false,
            ultimate: false
        };
        this.pendingAttacks = [];
    }
}