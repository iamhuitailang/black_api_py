const Trap = (() => {
    class Trap {
        constructor(type, x, y, width, height) {
            const config = Constants.TRAP_TYPES[type];
            this.type = type;
            this.name = config.name;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.damage = config.damage;
            this.damagePerSecond = config.damagePerSecond;
            this.color = config.color;
            this.duration = config.duration;
            this.active = true;
            this.timer = 0;
            this.animationFrame = 0;
        }
        
        update(deltaTime) {
            this.timer += deltaTime;
            this.animationFrame += deltaTime;
            
            if (this.timer >= this.duration) {
                this.active = false;
            }
        }
        
        checkCollision(entity) {
            if (!this.active) return false;
            
            return (
                entity.x < this.x + this.width &&
                entity.x + entity.width > this.x &&
                entity.y < this.y + this.height &&
                entity.y + entity.height > this.y
            );
        }
        
        getDamage() {
            return this.damage;
        }
        
        getState() {
            return {
                type: this.type,
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                timer: this.timer,
                active: this.active
            };
        }
        
        restoreState(state) {
            this.timer = state.timer;
            this.active = state.active;
        }
    }
    
    const createTrap = (type, x, y, width, height) => {
        return new Trap(type, x, y, width, height);
    };
    
    const generateRandomTrap = (elevator) => {
        const types = Object.keys(Constants.TRAP_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        let x, y, width, height;
        
        switch (type) {
            case 'electric':
                width = 60 + Math.random() * 80;
                height = 20;
                x = elevator.x + 40 + Math.random() * (elevator.width - width - 80);
                y = elevator.y + elevator.height - height - 30;
                break;
                
            case 'falling':
                width = 50;
                height = 50;
                x = elevator.x + 50 + Math.random() * (elevator.width - width - 100);
                y = elevator.y - 20;
                const targetY = elevator.y + 100 + Math.random() * 300;
                return {
                    trap: new Trap(type, x, y, width, height),
                    targetY,
                    falling: true,
                    fallSpeed: 5
                };
                
            case 'laser':
                width = elevator.width - 60;
                height = 8;
                x = elevator.x + 30;
                y = elevator.y + 150 + Math.random() * 300;
                break;
                
            case 'malfunction':
                width = 80 + Math.random() * 60;
                height = 40 + Math.random() * 40;
                x = elevator.x + 50 + Math.random() * (elevator.width - width - 100);
                y = elevator.y + 150 + Math.random() * (elevator.height - height - 200);
                break;
        }
        
        return {
            trap: new Trap(type, x, y, width, height),
            falling: false
        };
    };
    
    return {
        Trap,
        createTrap,
        generateRandomTrap
    };
})();