const Input = {
    pressedKeys: new Set(),
    justPressedKeys: new Set(),
    justReleasedKeys: new Set(),

    init() {
        console.log('Input system initialized');
        
        window.addEventListener('keydown', (e) => {
            const key = e.key;
            console.log('Key DOWN:', key, '| Repeat:', e.repeat);
            if (!this.pressedKeys.has(key)) {
                this.justPressedKeys.add(key);
            }
            this.pressedKeys.add(key);
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key;
            console.log('Key UP:', key);
            this.pressedKeys.delete(key);
            this.justReleasedKeys.add(key);
        });
    },

    update() {
        this.justPressedKeys.clear();
        this.justReleasedKeys.clear();
    },

    isPressed(key) {
        return this.pressedKeys.has(key) || 
               this.pressedKeys.has(key.toLowerCase()) ||
               this.pressedKeys.has(key.toUpperCase());
    },

    justPressed(key) {
        return this.justPressedKeys.has(key) || 
               this.justPressedKeys.has(key.toLowerCase()) ||
               this.justPressedKeys.has(key.toUpperCase());
    },

    justReleased(key) {
        return this.justReleasedKeys.has(key) || 
               this.justReleasedKeys.has(key.toLowerCase()) ||
               this.justReleasedKeys.has(key.toUpperCase());
    },

    getDirection() {
        let x = 0;
        let y = 0;
        
        if (this.isPressed('ArrowLeft') || this.isPressed('a')) x -= 1;
        if (this.isPressed('ArrowRight') || this.isPressed('d')) x += 1;
        if (this.isPressed('ArrowUp') || this.isPressed('w')) y -= 1;
        if (this.isPressed('ArrowDown') || this.isPressed('s')) y += 1;
        
        return { x, y };
    },

    getDirectionName(facing) {
        const dir = this.getDirection();
        const x = dir.x * facing;
        const y = dir.y;
        
        if (x === 0 && y === 0) return null;
        if (x === 1 && y === 0) return 'right';
        if (x === -1 && y === 0) return 'left';
        if (x === 0 && y === 1) return 'down';
        if (x === 0 && y === -1) return 'up';
        if (x === 1 && y === 1) return 'down-right';
        if (x === -1 && y === 1) return 'down-left';
        if (x === 1 && y === -1) return 'up-right';
        if (x === -1 && y === -1) return 'up-left';
        
        return null;
    },

    handlePlayerInput(player) {
        if (!player) return;
        
        const dir = this.getDirection();
        
        if (dir.x < 0) {
            player.moveLeft();
        } else if (dir.x > 0) {
            player.moveRight();
        }
        
        if (dir.y < 0 && (this.justPressed('ArrowUp') || this.justPressed('w'))) {
            player.jump();
        }
        
        if (dir.y > 0) {
            player.crouch();
        } else {
            player.standUp();
        }
        
        const dirName = this.getDirectionName(player.facing);
        if (dirName) {
            player.addComboInput(dirName);
        }
        
        if (this.justPressed('j')) {
            console.log('J pressed!');
            if (player.checkSpecialCombo() && player.special >= CONFIG.SPECIAL_COST) {
                console.log('SPECIAL ATTACK!');
                player.specialAttack();
            } else {
                console.log('Light attack!');
                player.lightAttack();
            }
        }
        
        if (this.justPressed('k')) {
            console.log('K pressed - starting charge!');
            player.startCharge();
        }
        
        if (this.justReleased('k') && player.isCharging) {
            console.log('K released - HEAVY ATTACK!');
            player.heavyAttack();
        }
    }
};