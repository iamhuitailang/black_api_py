class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = CONFIG.ITEMS[type];
        this.size = 20;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.05;
        this.lifetime = 30000;
        this.createdAt = Date.now();
    }

    update() {
        this.bobOffset += this.bobSpeed;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 5;
        
        ctx.save();
        ctx.translate(this.x, this.y + bobY);
        
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, 0, 0);
        
        ctx.restore();
    }

    isExpired() {
        return Date.now() - this.createdAt > this.lifetime;
    }

    applyEffect(player, game) {
        switch (this.config.effect) {
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + this.config.value);
                break;
            case 'bomb':
                game.killAllZombies();
                break;
            case 'speed':
                player.addBuff('speed', this.config.value);
                break;
            case 'shield':
                player.addBuff('shield', this.config.value);
                break;
            case 'coin':
                game.addScore(this.config.value);
                break;
        }
    }
}

class ItemManager {
    constructor() {
        this.items = [];
    }

    spawn(x, y) {
        const types = Object.keys(CONFIG.ITEMS);
        const weights = types.map(t => CONFIG.ITEMS[t].spawnChance);
        const type = Utils.weightedChoice(types, weights);
        this.items.push(new Item(x, y, type));
    }

    trySpawn(x, y, chance = 0.15) {
        if (Math.random() < chance) {
            this.spawn(x, y);
        }
    }

    update() {
        this.items.forEach(item => item.update());
        this.items = this.items.filter(item => !item.isExpired());
    }

    draw(ctx) {
        this.items.forEach(item => item.draw(ctx));
    }

    checkPlayerCollision(player, game) {
        this.items = this.items.filter(item => {
            const dist = Utils.distance(item.x, item.y, player.x, player.y);
            if (dist < item.size + player.size) {
                item.applyEffect(player, game);
                game.particleSystem.emitItemPickup(item.x, item.y, item.config.color);
                return false;
            }
            return true;
        });
    }

    clear() {
        this.items = [];
    }
}
