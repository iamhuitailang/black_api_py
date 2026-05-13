const Input = {
    keys: {},
    keysJustPressed: {},
    touchControls: {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        attack: false,
        magic: false
    },
    touchJustPressed: {
        jump: false,
        attack: false,
        magic: false
    },
    
    init() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.setupMobileControls();
    },
    
    setupMobileControls() {
        const buttons = {
            'btn-left': 'left',
            'btn-right': 'right',
            'btn-up': 'up',
            'btn-down': 'down',
            'btn-jump': 'jump',
            'btn-attack': 'attack',
            'btn-magic': 'magic'
        };
        
        Object.entries(buttons).forEach(([id, control]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.touchControls[control] = true;
                    if (this.touchJustPressed.hasOwnProperty(control)) {
                        this.touchJustPressed[control] = true;
                    }
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.touchControls[control] = false;
                });
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.touchControls[control] = true;
                    if (this.touchJustPressed.hasOwnProperty(control)) {
                        this.touchJustPressed[control] = true;
                    }
                });
                btn.addEventListener('mouseup', () => {
                    this.touchControls[control] = false;
                });
                btn.addEventListener('mouseleave', () => {
                    this.touchControls[control] = false;
                });
            }
        });
    },
    
    onKeyDown(e) {
        if (!this.keys[e.code]) {
            this.keysJustPressed[e.code] = true;
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
        this.keysJustPressed = {};
        this.touchJustPressed = {
            jump: false,
            attack: false,
            magic: false
        };
    },
    
    left() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left;
    },
    
    right() {
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right;
    },
    
    up() {
        return this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up;
    },
    
    down() {
        return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down;
    },
    
    jump() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.jump;
    },
    
    jumpJustPressed() {
        return this.keysJustPressed['Space'] || this.keysJustPressed['ArrowUp'] || this.keysJustPressed['KeyW'] || this.touchJustPressed.jump;
    },
    
    attack() {
        return this.keys['KeyJ'] || this.keys['KeyK'] || this.keys['KeyE'] || this.touchControls.attack;
    },
    
    attackJustPressed() {
        return this.keysJustPressed['KeyJ'] || this.keysJustPressed['KeyK'] || this.keysJustPressed['KeyE'] || this.touchJustPressed.attack;
    },
    
    magic() {
        return this.keys['KeyL'] || this.keys['KeyQ'] || this.touchControls.magic;
    },
    
    magicJustPressed() {
        return this.keysJustPressed['KeyL'] || this.keysJustPressed['KeyQ'] || this.touchJustPressed.magic;
    },
    
    pause() {
        return this.keysJustPressed['Escape'] || this.keysJustPressed['KeyP'];
    }
};