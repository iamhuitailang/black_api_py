class Banana {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GameConfig.BANANA.WIDTH;
        this.height = GameConfig.BANANA.HEIGHT;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.collected = false;
        this.collectedBy = null;
        this.collectAnim = 0;
    }

    update(deltaTime) {
        this.floatOffset += deltaTime * 0.003;
        this.y = this.baseY + Math.sin(this.floatOffset) * GameConfig.BANANA.FLOAT_AMPLITUDE;
        this.rotation += this.rotationSpeed;
        
        if (this.collected && this.collectAnim < 1) {
            this.collectAnim += deltaTime * 0.005;
        }
    }

    draw(ctx) {
        if (this.collected && this.collectAnim >= 1) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.collected) {
            const scale = 1 + this.collectAnim * 0.5;
            const alpha = 1 - this.collectAnim;
            ctx.globalAlpha = alpha;
            ctx.scale(scale, scale);
        }
        
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = GameConfig.COLORS.BANANA;
        ctx.beginPath();
        ctx.moveTo(-15, -5);
        ctx.quadraticCurveTo(-5, -20, 15, -10);
        ctx.quadraticCurveTo(20, -5, 15, 5);
        ctx.quadraticCurveTo(5, 15, -10, 10);
        ctx.quadraticCurveTo(-18, 5, -15, -5);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(15, -10);
        ctx.lineTo(20, -15);
        ctx.lineTo(18, -8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(-15, -5);
        ctx.lineTo(-18, -8);
        ctx.lineTo(-13, -7);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    collect(by = 'player') {
        this.collected = true;
        this.collectedBy = by;
        this.collectAnim = 0;
    }

    isReadyToRemove() {
        return this.collected && this.collectAnim >= 1;
    }

    toJSON() {
        return {
            x: this.x,
            y: this.baseY,
            collected: this.collected,
            collectedBy: this.collectedBy
        };
    }

    static fromJSON(data) {
        const banana = new Banana(data.x, data.y);
        banana.collected = data.collected || false;
        banana.collectedBy = data.collectedBy || null;
        return banana;
    }
}

class BananaManager {
    constructor() {
        this.bananas = [];
        this.spawnTimer = 0;
    }

    init(savedBananas = []) {
        this.bananas = [];
        for (let data of savedBananas) {
            this.bananas.push(Banana.fromJSON(data));
        }
        this.spawnTimer = 0;
    }

    spawnBanana() {
        if (this.bananas.filter(b => !b.collected).length >= GameConfig.BANANA.MAX_ON_SCREEN) {
            return;
        }
        
        const x = Math.random() * (GameConfig.CANVAS.WIDTH - 100) + 50;
        const y = Math.random() * 300 + 100;
        
        const banana = new Banana(x, y);
        this.bananas.push(banana);
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= GameConfig.BANANA.SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            this.spawnBanana();
        }
        
        for (let i = this.bananas.length - 1; i >= 0; i--) {
            this.bananas[i].update(deltaTime);
            if (this.bananas[i].isReadyToRemove()) {
                this.bananas.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let banana of this.bananas) {
            banana.draw(ctx);
        }
    }

    checkPickup(entity) {
        const pickupRange = entity.getPickupRange();
        let collected = 0;
        
        for (let banana of this.bananas) {
            if (banana.collected) continue;
            
            const bananaBounds = banana.getBounds();
            if (this.isColliding(pickupRange, bananaBounds)) {
                banana.collect(entity instanceof AIPlayer ? 'ai' : 'player');
                collected++;
            }
        }
        
        return collected;
    }

    grabAll(by = 'player') {
        let collected = 0;
        for (let banana of this.bananas) {
            if (!banana.collected) {
                banana.collect(by);
                collected++;
            }
        }
        return collected;
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    getActiveBananas() {
        return this.bananas.filter(b => !b.collected);
    }

    toJSON() {
        return this.bananas.map(b => b.toJSON());
    }
}
