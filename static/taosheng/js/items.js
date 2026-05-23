class Item {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.active = true;
        this.pickedUp = false;
        
        switch (type) {
            case 'speed':
                this.radius = GameConfig.ITEMS.SPEED_BOOST.RADIUS;
                this.color = GameConfig.ITEMS.SPEED_BOOST.COLOR;
                this.duration = GameConfig.ITEMS.SPEED_BOOST.DURATION;
                this.multiplier = GameConfig.ITEMS.SPEED_BOOST.SPEED_MULTIPLIER;
                this.name = '加速靴';
                break;
            case 'shield':
                this.radius = GameConfig.ITEMS.SHIELD.RADIUS;
                this.color = GameConfig.ITEMS.SHIELD.COLOR;
                this.duration = GameConfig.ITEMS.SHIELD.DURATION;
                this.name = '防护盾';
                break;
            case 'heal':
                this.radius = GameConfig.ITEMS.HEAL.RADIUS;
                this.color = GameConfig.ITEMS.HEAL.COLOR;
                this.amount = GameConfig.ITEMS.HEAL.AMOUNT;
                this.name = '急救包';
                break;
            case 'clear':
                this.radius = GameConfig.ITEMS.CLEAR.ITEM_RADIUS;
                this.clearRadius = GameConfig.ITEMS.CLEAR.RADIUS;
                this.color = GameConfig.ITEMS.CLEAR.COLOR;
                this.name = '驱散剂';
                break;
        }
        
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobTimer = 0;
    }
    
    update(deltaTime) {
        this.bobTimer += deltaTime;
    }
    
    getRect() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            w: this.radius * 2,
            h: this.radius * 2
        };
    }
    
    checkPickup(player) {
        if (!this.active || this.pickedUp) return false;
        
        const dist = Utils.distance(
            this.x, this.y,
            player.getCenterX(), player.getCenterY()
        );
        
        return dist < this.radius + 15;
    }
    
    apply(player, crowdManager) {
        if (this.pickedUp) return;
        
        this.pickedUp = true;
        this.active = false;
        
        switch (this.type) {
            case 'speed':
                player.applySpeedBoost(this.duration, this.multiplier);
                break;
            case 'shield':
                player.applyShield(this.duration);
                break;
            case 'heal':
                player.heal(this.amount);
                break;
            case 'clear':
                if (crowdManager) {
                    crowdManager.clearArea(player.getCenterX(), player.getCenterY(), this.clearRadius);
                }
                break;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const bob = Math.sin(this.bobTimer / 300 + this.bobOffset) * 3;
        
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, this.radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '33';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch (this.type) {
            case 'speed':
                ctx.fillText('⚡', this.x, this.y + bob);
                break;
            case 'shield':
                ctx.fillText('🛡', this.x, this.y + bob);
                break;
            case 'heal':
                ctx.fillText('♥', this.x, this.y + bob);
                break;
            case 'clear':
                ctx.fillText('✦', this.x, this.y + bob);
                break;
        }
        
        ctx.restore();
    }
}

class ItemManager {
    constructor() {
        this.items = [];
        this.spawnTimer = 0;
    }
    
    reset() {
        this.items = [];
        this.spawnTimer = 0;
    }
    
    update(deltaTime, scene) {
        this.items = this.items.filter(item => item.active);
        
        this.items.forEach(item => item.update(deltaTime));
        
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= GameConfig.ITEMS.SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            this.spawnItem(scene);
        }
    }
    
    spawnItem(scene) {
        const types = ['speed', 'shield', 'heal', 'clear'];
        const chances = [
            GameConfig.ITEMS.SPEED_BOOST.SPAWN_CHANCE,
            GameConfig.ITEMS.SHIELD.SPAWN_CHANCE,
            GameConfig.ITEMS.HEAL.SPAWN_CHANCE,
            GameConfig.ITEMS.CLEAR.SPAWN_CHANCE
        ];
        
        let type = 'heal';
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += chances[i];
            if (rand < cumulative) {
                type = types[i];
                break;
            }
        }
        
        let x, y;
        let attempts = 0;
        const maxAttempts = 30;
        
        do {
            x = Utils.randomRange(100, GameConfig.CANVAS_WIDTH - 100);
            y = Utils.randomRange(100, GameConfig.CANVAS_HEIGHT - 100);
            attempts++;
            
            const rect = { x: x - 20, y: y - 20, w: 40, h: 40 };
            if (!scene.checkObstacleCollision(rect) && !scene.isInCollapseZone(rect)) {
                break;
            }
        } while (attempts < maxAttempts);
        
        if (attempts < maxAttempts) {
            const item = new Item(type, x, y);
            this.items.push(item);
        }
    }
    
    checkPlayerPickup(player, crowdManager) {
        this.items.forEach(item => {
            if (item.checkPickup(player)) {
                item.apply(player, crowdManager);
            }
        });
    }
    
    render(ctx) {
        this.items.forEach(item => item.render(ctx));
    }
    
    getState() {
        return {
            items: this.items.map(item => ({
                type: item.type,
                x: item.x,
                y: item.y,
                active: item.active
            })),
            spawnTimer: this.spawnTimer
        };
    }
    
    loadState(state, scene) {
        if (!state) return;
        
        this.items = state.items.map(data => {
            const item = new Item(data.type, data.x, data.y);
            item.active = data.active;
            return item;
        });
        this.spawnTimer = state.spawnTimer;
    }
}
