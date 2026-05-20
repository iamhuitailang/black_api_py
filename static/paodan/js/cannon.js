class Cannon {
    constructor(type, x, y, isPlayer = true) {
        this.type = type;
        this.config = GameConfig.CANNONS[type];
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;

        this.maxHealth = this.config.maxHealth;
        this.health = this.maxHealth;
        this.basePower = this.config.basePower;

        this.angle = isPlayer ? 45 : 135;
        this.targetAngle = this.angle;
        this.power = 0;
        this.isCharging = false;
        this.chargeStartTime = 0;

        this.recoilOffset = 0;
        this.hitFlash = 0;
        this.animTime = 0;

        this.lastFireTime = 0;
        this.fireCooldown = 500;
    }

    update(deltaTime) {
        this.animTime += deltaTime;

        const angleDiff = this.targetAngle - this.angle;
        this.angle += angleDiff * 0.15;

        if (this.isCharging) {
            const chargeTime = Date.now() - this.chargeStartTime;
            this.power = Math.min(GameConfig.MAX_POWER, (chargeTime / 2000) * GameConfig.MAX_POWER);
        }

        if (this.recoilOffset > 0) {
            this.recoilOffset *= 0.85;
            if (this.recoilOffset < 0.5) this.recoilOffset = 0;
        }

        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 0.01;
            if (this.hitFlash < 0) this.hitFlash = 0;
        }
    }

    setAngle(angle) {
        if (this.isPlayer) {
            this.targetAngle = Utils.clamp(angle, GameConfig.MIN_ANGLE, GameConfig.MAX_ANGLE);
        } else {
            this.targetAngle = Utils.clamp(angle, 180 - GameConfig.MAX_ANGLE, 180 - GameConfig.MIN_ANGLE);
        }
    }

    adjustAngle(delta) {
        this.setAngle(this.targetAngle + delta);
    }

    startCharging() {
        if (!this.isCharging && Date.now() - this.lastFireTime > this.fireCooldown) {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
            this.power = 0;
        }
    }

    stopCharging() {
        if (this.isCharging) {
            this.isCharging = false;
            return this.fire();
        }
        return null;
    }

    fire(customPower = null, customAngle = null) {
        const firePower = customPower !== null ? customPower : this.power;
        const fireAngle = customAngle !== null ? customAngle : this.angle;

        if (firePower < 5) {
            this.power = 0;
            return null;
        }

        this.lastFireTime = Date.now();
        this.recoilOffset = 20;
        this.power = 0;

        const projectileConfig = firePower >= 70 ?
            this.config.projectiles.charged :
            this.config.projectiles.normal;

        const muzzleX = this.getMuzzlePosition().x;
        const muzzleY = this.getMuzzlePosition().y;

        return {
            x: muzzleX,
            y: muzzleY,
            angle: fireAngle,
            power: firePower,
            config: projectileConfig,
            isPlayer: this.isPlayer
        };
    }

    getMuzzlePosition() {
        const radians = Utils.toRadians(this.isPlayer ? this.angle : 180 - this.angle);
        const barrelLength = 50 - this.recoilOffset;
        return {
            x: this.x + Math.cos(radians) * barrelLength,
            y: this.y + Math.sin(radians) * barrelLength * (this.isPlayer ? -1 : 1)
        };
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.hitFlash = 1;
        return this.health <= 0;
    }

    isDead() {
        return this.health <= 0;
    }

    getHealthPercent() {
        return (this.health / this.maxHealth) * 100;
    }

    checkSpecialSkill(power, angle) {
        const skills = GameConfig.SPECIAL_SKILLS;

        if (angle >= skills.highAngle.condition.angle && power >= skills.highAngle.condition.power) {
            return skills.highAngle;
        }

        if (angle <= skills.lowAngle.condition.angle && power <= skills.lowAngle.condition.power && power >= 10) {
            return skills.lowAngle;
        }

        return null;
    }
}

const CannonFactory = {
    createPlayerCannon(type) {
        return new Cannon(type, GameConfig.COLORS.playerCannon.x, GameConfig.COLORS.playerCannon.y, true);
    },

    createEnemyCannon(type = null) {
        const types = ['basic', 'flame', 'wind'];
        const selectedType = type || types[Utils.randomInt(0, types.length - 1)];
        return new Cannon(selectedType, GameConfig.COLORS.enemyCannon.x, GameConfig.COLORS.enemyCannon.y, false);
    }
};
