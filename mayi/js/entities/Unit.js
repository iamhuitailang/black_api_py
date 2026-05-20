class Unit {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        
        const config = CONFIG.UNIT_TYPES[type];
        this.name = config.name;
        this.icon = config.icon;
        this.color = config.color;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.attack = config.attack;
        this.speed = config.speed;
        this.canGather = config.canGather;
        this.canAttack = config.canAttack;
        this.isFlying = config.isFlying || false;
        this.attackRange = config.attackRange || 40;
        this.attackCooldown = config.attackCooldown || 800;
        this.gatherAmount = config.gatherAmount || 5;
        this.size = config.size;
        
        this.state = 'idle';
        this.targetX = x;
        this.targetY = y;
        this.target = null;
        this.carrying = 0;
        this.lastAttackTime = 0;
        this.angle = 0;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
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
            carrying: this.carrying,
            lastAttackTime: this.lastAttackTime,
            angle: this.angle
        };
    }

    static deserialize(data) {
        const unit = new Unit(data.type, data.x, data.y);
        unit.maxHp = data.maxHp;
        unit.hp = data.hp;
        unit.state = data.state;
        unit.targetX = data.targetX;
        unit.targetY = data.targetY;
        unit.carrying = data.carrying;
        unit.lastAttackTime = data.lastAttackTime;
        unit.angle = data.angle;
        return unit;
    }
}
