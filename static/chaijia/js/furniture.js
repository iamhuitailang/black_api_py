class Furniture {
    constructor(type, x, y) {
        const config = CONFIG.FURNITURE_TYPES[type];
        this.name = config.name;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.score = config.score;
        this.width = config.width;
        this.height = config.height;
        this.color = config.color;
        this.x = x;
        this.y = y;
        this.isDestroyed = false;
        this.damageAnim = 0;
        this.type = type;
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        this.damageAnim = 10;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDestroyed = true;
            return { destroyed: true, score: this.score };
        }
        return { destroyed: false, score: 0 };
    }
    
    update() {
        if (this.damageAnim > 0) {
            this.damageAnim--;
        }
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            isDestroyed: this.isDestroyed,
            width: this.width,
            height: this.height,
            color: this.color,
            name: this.name,
            score: this.score
        };
    }
    
    static loadState(state) {
        const furniture = new Furniture(state.type, state.x, state.y);
        furniture.hp = state.hp;
        furniture.maxHp = state.maxHp;
        furniture.isDestroyed = state.isDestroyed;
        furniture.width = state.width;
        furniture.height = state.height;
        furniture.color = state.color;
        furniture.name = state.name;
        furniture.score = state.score;
        return furniture;
    }
}

class FurnitureManager {
    constructor() {
        this.furnitures = [];
        this.particles = [];
    }
    
    reset() {
        this.furnitures = [];
        this.particles = [];
        this.initFurnitures();
    }
    
    initFurnitures() {
        const groundY = CONFIG.CANVAS_HEIGHT - 150;
        
        this.furnitures.push(new Furniture(0, 100, groundY - 50));
        this.furnitures.push(new Furniture(1, 500, groundY + 20));
        this.furnitures.push(new Furniture(2, 900, groundY + 10));
        this.furnitures.push(new Furniture(3, 530, groundY - 25));
        this.furnitures.push(new Furniture(4, 580, groundY - 10));
        this.furnitures.push(new Furniture(5, 750, groundY - 10));
        this.furnitures.push(new Furniture(2, 300, groundY + 10));
    }
    
    update() {
        this.furnitures.forEach(f => f.update());
        this.updateParticles();
    }
    
    checkCollision(catHitbox, attackResult) {
        if (!attackResult) return { hit: false };
        
        for (const furniture of this.furnitures) {
            if (furniture.isDestroyed) continue;
            
            const hitbox = furniture.getHitbox();
            if (this.isColliding(catHitbox, hitbox)) {
                const result = furniture.takeDamage(attackResult.damage);
                
                if (result.destroyed) {
                    this.addDestroyParticles(furniture);
                } else {
                    this.addHitParticles(furniture);
                }
                
                return {
                    hit: true,
                    furniture: furniture,
                    destroyed: result.destroyed,
                    score: result.score + attackResult.score
                };
            }
        }
        return { hit: false };
    }
    
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    addHitParticles(furniture) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: furniture.x + furniture.width / 2,
                y: furniture.y + furniture.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: furniture.color,
                size: Math.random() * 8 + 4
            });
        }
    }
    
    addDestroyParticles(furniture) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: furniture.x + furniture.width / 2,
                y: furniture.y + furniture.height / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 5,
                life: 60,
                color: furniture.color,
                size: Math.random() * 15 + 5
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.life--;
            return p.life > 0;
        });
    }
    
    getNearbyFurniture(catX, catY) {
        const nearby = [];
        for (const furniture of this.furnitures) {
            if (furniture.isDestroyed) continue;
            const dist = Math.abs(catX - furniture.x);
            if (dist < 150) {
                nearby.push(furniture);
            }
        }
        return nearby;
    }
    
    getState() {
        return {
            furnitures: this.furnitures.map(f => f.getState()),
            particles: this.particles
        };
    }
    
    loadState(state) {
        this.furnitures = state.furnitures.map(f => Furniture.loadState(f));
        this.particles = state.particles || [];
    }
}