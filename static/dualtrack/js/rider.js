import { RIDER_CONFIG, SPEED_STATES, TRACK_WIDTH, TRACK_LENGTH } from './config.js';

export class Rider {
    constructor(riderType, isPlayer = false, startPosition = 0) {
        this.type = riderType;
        this.config = RIDER_CONFIG[riderType];
        this.isPlayer = isPlayer;
        
        this.x = 0;
        this.y = 0;
        this.distance = startPosition;
        this.lateralPosition = 0;
        this.targetLateralPosition = 0;
        
        this.speed = isPlayer ? 5 : 4;
        this.currentSpeedState = 'NORMAL';
        this.balance = 1;
        this.isCrashed = false;
        this.crashRecoveryTime = 0;
        
        this.heldItem = null;
        this.activeEffects = [];
        
        this.stopped = false;
        this.stopEndTime = 0;
        
        this.slowed = false;
        this.slowEndTime = 0;
        
        this.leanAngle = 0;
        this.wheelRotation = 0;
        
        this.startBoostUsed = false;
        this.finished = false;
        this.finishTime = 0;
    }

    update(deltaTime, input, track, isPlayer = false) {
        if (this.finished) return;
        
        if (this.stopped && Date.now() < this.stopEndTime) {
            this.speed = 0;
            return;
        }
        this.stopped = false;
        
        if (this.slowed && Date.now() > this.slowEndTime) {
            this.slowed = false;
        }
        
        this.updateBalance(deltaTime, input, track);
        
        if (this.balance <= 0 && !this.isCrashed) {
            this.crash();
        }
        
        if (this.isCrashed) {
            this.crashRecoveryTime -= deltaTime;
            if (this.crashRecoveryTime <= 0) {
                this.recoverFromCrash();
            }
            return;
        }
        
        this.updateSpeedState(input);
        this.calculateSpeed(deltaTime, track);
        this.updateLateralPosition(deltaTime, input, track);
        
        this.distance += this.speed * deltaTime * 0.2;
        this.distance = Math.max(0, Math.min(this.distance, TRACK_LENGTH));
        
        if (this.distance >= TRACK_LENGTH && !this.finished) {
            this.finished = true;
            this.finishTime = Date.now();
        }
        
        this.wheelRotation += this.speed * 0.1;
        this.updateEffects(deltaTime);
    }

    updateBalance(deltaTime, input, track) {
        if (this.isCrashed) return;
        
        const speedState = SPEED_STATES[this.currentSpeedState];
        let balanceChange = -speedState.balanceDrain * deltaTime * 0.001;
        
        if (input && input.left) balanceChange -= 0.02 * deltaTime * 0.001;
        if (input && input.right) balanceChange -= 0.02 * deltaTime * 0.001;
        
        const obstacle = track.getObstacleAt(this.distance);
        if (obstacle) {
            balanceChange -= obstacle.balanceDamage * deltaTime * 0.001;
        }
        
        if (input && input.up && this.currentSpeedState === 'FAST') {
            balanceChange -= 0.03 * deltaTime * 0.001;
        }
        
        if (input && input.down) {
            balanceChange += this.config.recoverySpeed * deltaTime * 0.001;
        }
        
        if (!input || (!input.left && !input.right && !input.up)) {
            balanceChange += this.config.recoverySpeed * 0.5 * deltaTime * 0.001;
        }
        
        this.balance = Math.max(0, Math.min(1, this.balance + balanceChange));
    }

    updateSpeedState(input) {
        if (!input) {
            this.currentSpeedState = 'NORMAL';
            return;
        }
        
        if (input.up) {
            this.currentSpeedState = 'FAST';
        } else if (input.down) {
            this.currentSpeedState = 'SLOW';
        } else {
            this.currentSpeedState = 'NORMAL';
        }
    }

    calculateSpeed(deltaTime, track) {
        const speedState = SPEED_STATES[this.currentSpeedState];
        let targetSpeed = this.config.maxSpeed * speedState.speed;
        
        if (this.slowed) {
            targetSpeed *= 0.5;
        }
        
        const boostEffect = this.activeEffects.find(e => e.type === 'boost');
        if (boostEffect) {
            targetSpeed *= boostEffect.multiplier;
        }
        
        const obstacle = track.getObstacleAt(this.distance);
        if (obstacle && obstacle.speedReduction) {
            targetSpeed *= obstacle.speedReduction;
        }
        
        const acceleration = 0.8;
        this.speed += (targetSpeed - this.speed) * acceleration * deltaTime * 0.005;
        this.speed = Math.max(0, this.speed);
    }

    updateLateralPosition(deltaTime, input, track) {
        const moveSpeed = 15;
        if (input) {
            if (input.left) {
                this.targetLateralPosition -= moveSpeed * deltaTime * 0.05;
            }
            if (input.right) {
                this.targetLateralPosition += moveSpeed * deltaTime * 0.05;
            }
        }
        
        const obstacle = track.getObstacleAt(this.distance);
        if (obstacle && obstacle.pushForce) {
            const windDirection = Math.sin(this.distance * 0.01) > 0 ? 1 : -1;
            this.targetLateralPosition += obstacle.pushForce * windDirection * deltaTime * 0.001;
        }
        
        this.targetLateralPosition = Math.max(-TRACK_WIDTH / 2 + 30, Math.min(TRACK_WIDTH / 2 - 30, this.targetLateralPosition));
        this.lateralPosition += (this.targetLateralPosition - this.lateralPosition) * 0.1;
    }

    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.remaining -= deltaTime;
            return effect.remaining > 0;
        });
    }

    crash() {
        this.isCrashed = true;
        this.crashRecoveryTime = 2000;
        this.speed = 0;
    }

    recoverFromCrash() {
        this.isCrashed = false;
        this.balance = 0.8;
        this.targetLateralPosition = 0;
    }

    pickupItem(item) {
        if (this.heldItem) return false;
        this.heldItem = item;
        return true;
    }

    useItem() {
        if (!this.heldItem) return null;
        const item = this.heldItem;
        this.heldItem = null;
        return item;
    }

    applyEffect(effect) {
        const existingIndex = this.activeEffects.findIndex(e => e.type === effect.type);
        if (existingIndex >= 0) {
            this.activeEffects[existingIndex].remaining = effect.duration;
        } else {
            this.activeEffects.push({
                ...effect,
                remaining: effect.duration
            });
        }
    }

    hasShield() {
        return this.activeEffects.some(e => e.type === 'shield');
    }

    takeBalanceDamage(amount) {
        if (this.hasShield()) return false;
        this.balance = Math.max(0, this.balance - amount);
        if (this.balance <= 0) this.crash();
        return true;
    }

    stop(duration) {
        this.stopped = true;
        this.stopEndTime = Date.now() + duration;
        this.speed = 0;
    }

    slow(duration) {
        this.slowed = true;
        this.slowEndTime = Date.now() + duration;
    }

    getRank(allRiders) {
        const sorted = [...allRiders].sort((a, b) => {
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.distance - a.distance;
        });
        return sorted.indexOf(this) + 1;
    }

    serialize() {
        return {
            type: this.type,
            isPlayer: this.isPlayer,
            distance: this.distance,
            lateralPosition: this.lateralPosition,
            targetLateralPosition: this.targetLateralPosition,
            speed: this.speed,
            currentSpeedState: this.currentSpeedState,
            balance: this.balance,
            isCrashed: this.isCrashed,
            crashRecoveryTime: this.crashRecoveryTime,
            heldItem: this.heldItem,
            activeEffects: this.activeEffects,
            finished: this.finished,
            finishTime: this.finishTime
        };
    }

    static deserialize(data) {
        const rider = new Rider(data.type, data.isPlayer, data.distance);
        rider.lateralPosition = data.lateralPosition;
        rider.targetLateralPosition = data.targetLateralPosition;
        rider.speed = data.speed;
        rider.currentSpeedState = data.currentSpeedState;
        rider.balance = data.balance;
        rider.isCrashed = data.isCrashed;
        rider.crashRecoveryTime = data.crashRecoveryTime;
        rider.heldItem = data.heldItem;
        rider.activeEffects = data.activeEffects || [];
        rider.finished = data.finished;
        rider.finishTime = data.finishTime;
        return rider;
    }
}
