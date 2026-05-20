class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        
        const config = CONFIG.ENEMY_TYPES[type];
        this.name = config.name;
        this.color = config.color;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.attack = config.attack;
        this.speed = config.speed;
        this.reward = config.reward;
        this.isBoss = config.isBoss || false;
        this.isFlying = config.isFlying || false;
        this.armor = config.armor || 0;
        this.size = config.size;
        
        this.targetX = CONFIG.COLONY.X;
        this.targetY = CONFIG.COLONY.Y;
        this.target = null;
        this.state = 'moving';
        this.lastAttackTime = 0;
        this.attackRange = config.attackRange || 30;
        this.attackCooldown = config.attackCooldown || 1000;
        this.angle = 0;
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount * (1 - this.armor));
        this.hp = Math.max(0, this.hp - actualDamage);
        return this.hp <= 0;
    }

    moveTo(x, y, deltaTime) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2) {
            this.x = x;
            this.y = y;
            return true;
        }
        
        const moveDistance = this.speed * (deltaTime / 16);
        const ratio = Math.min(1, moveDistance / distance);
        
        this.x += dx * ratio;
        this.y += dy * ratio;
        this.angle = Math.atan2(dy, dx);
        
        return false;
    }

    distanceTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            maxHp: this.maxHp,
            hp: this.hp,
            state: this.state,
            targetX: this.targetX,
            targetY: this.targetY,
            lastAttackTime: this.lastAttackTime,
            angle: this.angle
        };
    }

    static deserialize(data) {
        const enemy = new Enemy(data.type, data.x, data.y);
        enemy.maxHp = data.maxHp;
        enemy.hp = data.hp;
        enemy.state = data.state;
        enemy.targetX = data.targetX;
        enemy.targetY = data.targetY;
        enemy.lastAttackTime = data.lastAttackTime;
        enemy.angle = data.angle;
        return enemy;
    }
}
