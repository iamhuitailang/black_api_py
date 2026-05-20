class BalanceSystem {
    constructor(character) {
        this.character = character;
        this.balance = 0;
        this.targetBalance = 0;
        this.velocity = 0;
        this.naturalSway = 0;
        this.time = 0;
        this.criticalTime = 0;
        this.isFallingState = false;
    }

    getBalancePercent() {
        const max = this.character.getEffectiveBalanceMax();
        return Math.max(-100, Math.min(100, (this.balance / max) * 100));
    }

    isFalling() {
        return this.isFallingState;
    }

    isCritical() {
        return Math.abs(this.balance) > this.character.getEffectiveBalanceMax() * 0.75;
    }

    tiltLeft(amount) {
        this.velocity -= amount * 5;
        this.balance -= amount * 8;
    }

    tiltRight(amount) {
        this.velocity += amount * 5;
        this.balance += amount * 8;
    }

    calm() {
        this.velocity *= 0.1;
        this.balance *= 0.3;
        this.targetBalance = 0;
        this.criticalTime = 0;
    }

    applyWind(strength, direction) {
        if (this.character.windImmune) return;
        const effectiveStrength = strength * (1 - this.character.stats.windResist);
        this.velocity += direction * effectiveStrength * 0.5;
    }

    applyImpact(amount) {
        this.velocity += amount;
    }

    update(dt) {
        if (this.isFallingState) return;

        this.time += dt;

        this.naturalSway = Math.sin(this.time * 0.002) * 1.5;
        this.velocity += this.naturalSway * 0.01;

        const recoveryRate = GameConfig.PHYSICS.RECOVERY_RATE * this.character.stats.recoverySpeed;
        if (Math.abs(this.balance) > 5) {
            this.velocity -= this.balance * recoveryRate * 0.001;
        }

        this.balance = this.character.applyPassiveSkill(this.balance);

        this.velocity *= 0.985;
        this.balance += this.velocity * dt * 0.06;

        const maxBalance = this.character.getEffectiveBalanceMax();
        const fallThreshold = maxBalance * 0.85;

        if (Math.abs(this.balance) > fallThreshold) {
            this.criticalTime += dt;
            if (this.criticalTime > 2000) {
                this.isFallingState = true;
                return;
            }
        } else {
            this.criticalTime = Math.max(0, this.criticalTime - dt * 0.5);
        }

        if (Math.abs(this.balance) > maxBalance * 1.1) {
            this.isFallingState = true;
            return;
        }
    }

    reset() {
        this.balance = 0;
        this.targetBalance = 0;
        this.velocity = 0;
        this.naturalSway = 0;
        this.time = 0;
        this.criticalTime = 0;
        this.isFallingState = false;
    }

    serialize() {
        return {
            balance: this.balance,
            targetBalance: this.targetBalance,
            velocity: this.velocity,
            naturalSway: this.naturalSway,
            time: this.time,
            criticalTime: this.criticalTime,
            isFallingState: this.isFallingState
        };
    }

    deserialize(data) {
        if (data) {
            this.balance = data.balance || 0;
            this.targetBalance = data.targetBalance || 0;
            this.velocity = data.velocity || 0;
            this.naturalSway = data.naturalSway || 0;
            this.time = data.time || 0;
            this.criticalTime = data.criticalTime || 0;
            this.isFallingState = data.isFallingState || false;
        }
    }
}
