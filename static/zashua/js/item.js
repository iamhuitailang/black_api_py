class Item {
    constructor(config) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.config = config;
        
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        
        this.fromPlayer = null;
        this.toPlayer = null;
        this.isActive = true;
        
        this.particles = [];
    }
    
    update(gravity, speedMultiplier = 1) {
        if (!this.isActive) return;
        
        this.vy += gravity * speedMultiplier;
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;
        this.rotation += this.rotationSpeed;
    }
    
    throw(fromX, fromY, toX, toY, speed, heightFactor = 1) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        const gravity = GameConfig.GAME.gravity;
        const baseForce = GameConfig.GAME.baseThrowForce;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const time = distance / (baseForce * speed);
        
        this.vx = dx / time;
        this.vy = -baseForce * heightFactor * speed;
        
        this.x = fromX;
        this.y = fromY;
    }
    
    getDangerColor() {
        switch (this.config.dangerLevel) {
            case 'low': return '#ffaa00';
            case 'medium': return '#ff6600';
            case 'high': return '#ff3300';
            case 'fatal': return '#ff0000';
            default: return '#ff6600';
        }
    }
}

const ItemFactory = {
    createRandomItem(includeDanger = true, includeBuff = true) {
        const items = [...GameConfig.NORMAL_ITEMS];
        
        if (includeDanger) {
            items.push(...GameConfig.DANGER_ITEMS);
        }
        
        if (includeBuff) {
            items.push(...GameConfig.BUFF_ITEMS);
        }
        
        const weights = items.map(item => {
            if (item.type === 'normal') return 5;
            if (item.type === 'danger') return 3;
            if (item.type === 'buff') return 1;
            return 3;
        });
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return new Item(items[i]);
            }
        }
        
        return new Item(items[0]);
    },
    
    createNormalItem() {
        const items = GameConfig.NORMAL_ITEMS;
        return new Item(items[Math.floor(Math.random() * items.length)]);
    },
    
    createDangerItem() {
        const items = GameConfig.DANGER_ITEMS;
        return new Item(items[Math.floor(Math.random() * items.length)]);
    },
    
    createBuffItem() {
        const items = GameConfig.BUFF_ITEMS;
        return new Item(items[Math.floor(Math.random() * items.length)]);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Item, ItemFactory };
}