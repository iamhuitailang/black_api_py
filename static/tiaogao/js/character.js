class Character {
    constructor(charId) {
        const config = GameConfig.CHARACTERS.find(c => c.id === charId) || GameConfig.CHARACTERS[0];
        this.id = config.id;
        this.name = config.name;
        this.desc = config.desc;
        this.passive = config.passive;
        this.color = config.color;
        this.stats = { ...config.stats };

        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.animFrame = 0;
        this.isWalking = true;
        this.isFalling = false;
        this.fallVelocity = 0;
        this.balanceBoost = 0;
        this.windImmune = false;
        this.safetyRope = false;
        this.swingReduction = 1;
        this.passiveCooldown = 0;
    }

    getEffectiveBalanceMax() {
        return this.stats.balanceMax + this.balanceBoost;
    }

    applyPassiveSkill(balance) {
        if (this.passiveCooldown > 0) {
            this.passiveCooldown -= 16;
            return balance;
        }

        switch (this.id) {
            case 'walker':
                if (Math.abs(balance) < 20 && Math.abs(balance) > 5) {
                    return balance * 0.98;
                }
                break;
            case 'acrobat':
                this.swingReduction = 0.7;
                this.passiveCooldown = 2000;
                setTimeout(() => {
                    this.swingReduction = 1;
                }, 1000);
                break;
            case 'master':
                if (Math.abs(balance) > 40) {
                    return balance * 0.95;
                }
                break;
        }
        return balance;
    }

    updatePhysics(balance, dt, scene) {
        if (this.isFalling) {
            this.fallVelocity += GameConfig.PHYSICS.GRAVITY;
            this.y += this.fallVelocity;
            this.angle += this.angularVelocity;
            return;
        }

        const maxAngle = GameConfig.PHYSICS.MAX_SWING_ANGLE;
        const targetAngle = (balance / 100) * maxAngle;
        const swingSpeed = GameConfig.PHYSICS.SWING_SPEED * this.stats.moveSpeed * this.swingReduction;
        
        this.angle += (targetAngle - this.angle) * swingSpeed;
        this.angularVelocity = (targetAngle - this.angle) * 0.1;
        
        if (Math.abs(balance) > this.getEffectiveBalanceMax() * 0.8) {
            this.isWalking = false;
        } else {
            this.isWalking = true;
        }
        
        this.animFrame += dt * 0.01 * this.stats.moveSpeed;
    }

    reset() {
        this.angle = 0;
        this.angularVelocity = 0;
        this.animFrame = 0;
        this.isWalking = true;
        this.isFalling = false;
        this.fallVelocity = 0;
        this.balanceBoost = 0;
        this.windImmune = false;
        this.safetyRope = false;
        this.swingReduction = 1;
        this.passiveCooldown = 0;
    }

    startFall() {
        this.isFalling = true;
        this.fallVelocity = -2;
        this.angularVelocity = (Math.random() - 0.5) * 0.2;
    }
}
