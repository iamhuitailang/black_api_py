class Player {
    constructor(type, isAI = false) {
        const config = GameConfig.CHARACTERS[type];
        
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.name = config.name;
        this.emoji = config.emoji;
        this.isAI = isAI;
        
        this.maxHp = config.maxHp;
        this.hp = config.maxHp;
        this.throwSpeed = config.throwSpeed;
        this.catchTolerance = config.catchTolerance;
        this.skillCooldown = config.skillCooldown;
        this.errorResistance = config.errorResistance;
        this.skillName = config.skillName;
        this.skillDesc = config.skillDesc;
        
        this.score = 0;
        this.x = 0;
        this.y = 0;
        this.position = 0;
        
        this.isStunned = false;
        this.stunEndTime = 0;
        this.isEliminated = false;
        this.skillCooldownEnd = 0;
        this.hasShield = false;
        
        this.targetX = 0;
        this.moveSpeed = GameConfig.GAME.playerSpeed;
    }
    
    update(deltaTime) {
        if (this.isEliminated) return;
        
        if (this.isStunned && Date.now() > this.stunEndTime) {
            this.isStunned = false;
        }
        
        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 1) {
            this.x += Math.sign(dx) * this.moveSpeed * (this.isAI ? GameConfig.AI.moveSpeed : 1);
        }
    }
    
    takeDamage(amount) {
        if (this.hasShield) {
            this.hasShield = false;
            return false;
        }
        
        const actualDamage = amount / this.errorResistance;
        this.hp -= actualDamage;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isEliminated = true;
            return true;
        }
        
        this.isStunned = true;
        this.stunEndTime = Date.now() + GameConfig.GAME.stunDuration;
        return false;
    }
    
    addScore(amount) {
        this.score += amount;
    }
    
    canUseSkill() {
        return !this.isStunned && !this.isEliminated && Date.now() >= this.skillCooldownEnd;
    }
    
    useSkill() {
        if (!this.canUseSkill()) return false;
        this.skillCooldownEnd = Date.now() + this.skillCooldown;
        return true;
    }
    
    getSkillCooldownPercent() {
        if (this.isEliminated) return 0;
        const remaining = Math.max(0, this.skillCooldownEnd - Date.now());
        return 1 - (remaining / this.skillCooldown);
    }
    
    moveLeft(bounds) {
        if (this.isStunned || this.isEliminated) return;
        this.targetX = Math.max(bounds.minX, this.targetX - this.moveSpeed * 2);
    }
    
    moveRight(bounds) {
        if (this.isStunned || this.isEliminated) return;
        this.targetX = Math.min(bounds.maxX, this.targetX + this.moveSpeed * 2);
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}