const EnemyAI = {
    state: 'idle',
    targetAngle: 0,
    targetPower: 0,
    actionTimer: 0,
    dodgeDirection: 0,
    dodgeTimer: 0,

    reset() {
        this.state = 'idle';
        this.actionTimer = 0;
        this.dodgeTimer = 0;
    },

    update(enemyCannon, playerCannon, playerProjectiles, deltaTime) {
        const distance = Utils.distance(
            enemyCannon.x, enemyCannon.y,
            playerCannon.x, playerCannon.y
        );
        const distanceCategory = Utils.getDistanceCategory(distance);

        if (this.dodgeTimer > 0) {
            this.dodgeTimer -= deltaTime;
            if (this.dodgeTimer <= 0) {
                this.dodgeDirection = 0;
            }
        }

        this.tryDodge(playerProjectiles, enemyCannon, distanceCategory);

        switch (this.state) {
            case 'idle':
                this.startThinking(enemyCannon, playerCannon, distanceCategory);
                break;
            case 'aiming':
                this.updateAiming(enemyCannon, deltaTime);
                break;
            case 'charging':
                this.updateCharging(enemyCannon, deltaTime);
                break;
            case 'waiting':
                this.actionTimer -= deltaTime;
                if (this.actionTimer <= 0) {
                    this.state = 'idle';
                }
                break;
        }
    },

    startThinking(enemyCannon, playerCannon, distanceCategory) {
        const reactionTime = Utils.randomRange(
            GameConfig.ENEMY_AI.reactionTime.min,
            GameConfig.ENEMY_AI.reactionTime.max
        );

        this.actionTimer = reactionTime;
        this.state = 'waiting';

        setTimeout(() => {
            if (this.state === 'waiting') {
                this.calculateShot(enemyCannon, playerCannon, distanceCategory);
            }
        }, reactionTime);
    },

    calculateShot(enemyCannon, playerCannon, distanceCategory) {
        const accuracy = GameConfig.ENEMY_AI.accuracy[distanceCategory];
        const errorOffset = (1 - accuracy) * Utils.randomRange(-80, 80);

        const targetX = playerCannon.x + errorOffset;
        const targetY = playerCannon.y;

        let basePower;
        switch (distanceCategory) {
            case 'far':
                basePower = Utils.randomRange(75, 95);
                break;
            case 'medium':
                basePower = Utils.randomRange(55, 75);
                break;
            case 'close':
            default:
                basePower = Utils.randomRange(35, 55);
                break;
        }

        const dx = Math.abs(enemyCannon.x - targetX);
        const dy = targetY - enemyCannon.y;
        const g = GameConfig.GRAVITY;
        const v = 8 + (basePower / 100) * 12;
        const vSquared = v * v;

        const discriminant = vSquared * vSquared - g * (g * dx * dx + 2 * dy * vSquared);

        if (discriminant >= 0) {
            const sqrtDiscriminant = Math.sqrt(discriminant);
            const angle1 = Math.atan2(vSquared - sqrtDiscriminant, g * dx);
            const angle2 = Math.atan2(vSquared + sqrtDiscriminant, g * dx);
            const angleDeg1 = Utils.toDegrees(angle1);
            const angleDeg2 = Utils.toDegrees(angle2);
            this.targetAngle = Math.abs(angleDeg2) > Math.abs(angleDeg1) ? angleDeg2 : angleDeg1;
        } else {
            this.targetAngle = Utils.randomRange(40, 60);
        }

        this.targetAngle = Utils.clamp(this.targetAngle, GameConfig.MIN_ANGLE, GameConfig.MAX_ANGLE);
        this.targetAngle = 180 - this.targetAngle;
        this.targetPower = basePower;

        this.state = 'aiming';
        this.aimStartTime = Date.now();
        this.aimDuration = Utils.randomRange(800, 1500);
    },

    updateAiming(enemyCannon, deltaTime) {
        const currentAimTime = Date.now() - this.aimStartTime;
        const aimProgress = Math.min(1, currentAimTime / this.aimDuration);

        const easedProgress = Utils.easeInOutQuad(aimProgress);
        const currentAngle = Utils.lerp(enemyCannon.angle, this.targetAngle, easedProgress);
        enemyCannon.setAngle(currentAngle);

        if (aimProgress >= 1) {
            this.state = 'charging';
            enemyCannon.startCharging();
            this.chargeStartTime = Date.now();
            this.chargeDuration = (this.targetPower / 100) * 2000;
        }
    },

    updateCharging(enemyCannon, deltaTime) {
        const currentChargeTime = Date.now() - this.chargeStartTime;
        const chargeProgress = Math.min(1, currentChargeTime / this.chargeDuration);

        enemyCannon.power = chargeProgress * 100;

        if (chargeProgress >= 1) {
            const fireData = enemyCannon.fire(this.targetPower, this.targetAngle);
            if (fireData) {
                this.onFire?.(fireData);
            }
            enemyCannon.isCharging = false;
            this.state = 'waiting';
            this.actionTimer = Utils.randomRange(1000, 2000);
        }
    },

    tryDodge(playerProjectiles, enemyCannon, distanceCategory) {
        if (this.dodgeTimer > 0) return;

        const dodgeChance = GameConfig.ENEMY_AI.dodgeChance[distanceCategory];

        for (const projectile of playerProjectiles) {
            if (!projectile.active) continue;
            if (projectile.ignoreLowDodge) continue;

            const distance = Utils.distance(projectile.x, projectile.y, enemyCannon.x, enemyCannon.y);
            const timeToImpact = distance / (Math.sqrt(projectile.vx ** 2 + projectile.vy ** 2));

            if (timeToImpact < 30 && Math.random() < dodgeChance * 0.1) {
                this.dodgeTimer = 500;
                this.dodgeDirection = Math.random() > 0.5 ? 1 : -1;
                break;
            }
        }
    },

    isActing() {
        return this.state !== 'idle';
    },

    onFire: null
};
