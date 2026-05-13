class Helicopter {
    constructor(type, x, y) {
        const config = CONFIG.HELICOPTER_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = config.size;
        this.height = config.size;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = config.maxSpeed;
        this.acceleration = config.acceleration;
        this.maxFuel = config.maxFuel;
        this.fuel = config.maxFuel;
        this.maxRopeLength = config.ropeLength;
        this.ropeLength = 0;
        this.ropeState = 'idle';
        this.isEngineRunning = true;
        this.isCrashed = false;
        this.passengers = [];
        this.rotation = 0;
        this.bladeAngle = 0;
        this.shortCircuitTime = 0;
        this.turbulenceTime = 0;
        this.damageLevel = 0;
        this.fuelLeak = false;
        this.fuelLeakTime = 0;
    }

    update(physics, input, deltaTime, hasActiveRescue = false) {
        if (this.isCrashed) return;

        if (this.shortCircuitTime > 0) {
            this.shortCircuitTime -= deltaTime;
            if (Math.random() > 0.5) return;
        }

        if (this.turbulenceTime > 0) {
            this.turbulenceTime -= deltaTime;
            this.vx += (Math.random() - 0.5) * 2;
            this.vy += (Math.random() - 0.5) * 2;
        }

        if (this.fuelLeak && this.fuelLeakTime > 0) {
            this.fuelLeakTime -= deltaTime;
            this.fuel -= 0.05;
        }

        const liftMultiplier = this.damageLevel > 0 ? 1 - (this.damageLevel * 0.2) : 1;

        if (input.up && this.fuel > 0) {
            this.vy -= this.acceleration * liftMultiplier;
            this.fuel -= 0.02;
        }
        if (input.down && this.fuel > 0) {
            this.vy += this.acceleration * 0.5;
            this.fuel -= 0.01;
        }
        if (input.left && this.fuel > 0) {
            this.vx -= this.acceleration * liftMultiplier;
            this.fuel -= 0.01;
        }
        if (input.right && this.fuel > 0) {
            this.vx += this.acceleration * liftMultiplier;
            this.fuel -= 0.01;
        }

        physics.update(this, deltaTime);

        this.rotation = this.vx * 0.05;

        this.bladeAngle += 0.3;

        this.updateRope(input, hasActiveRescue);

        this.fuel = Math.max(0, this.fuel);

        if (this.fuel <= 0) {
            this.vy += 0.1;
        }
    }

    updateRope(input, hasActiveRescue) {
        if (input.rope && this.ropeState === 'idle' && !hasActiveRescue) {
            this.ropeState = 'extending';
        }

        if (this.ropeState === 'extending') {
            this.ropeLength += CONFIG.GAME.ropeSpeed;
            if (this.ropeLength >= this.maxRopeLength) {
                this.ropeLength = this.maxRopeLength;
                this.ropeState = 'extended';
            }
        } else if (this.ropeState === 'retracting') {
            this.ropeLength -= CONFIG.GAME.ropeSpeed;
            if (this.ropeLength <= 0) {
                this.ropeLength = 0;
                this.ropeState = 'idle';
            }
        }
    }

    retractRope() {
        if (this.ropeState === 'extended' || this.ropeState === 'extending') {
            this.ropeState = 'retracting';
        }
    }

    holdRope() {
        if (this.ropeState === 'extending' || this.ropeState === 'extended') {
            this.ropeState = 'holding';
        }
    }

    releaseRope() {
        if (this.ropeState === 'holding') {
            this.ropeState = 'retracting';
        }
    }

    getRopeEndPosition() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height + this.ropeLength
        };
    }

    addPassenger(target) {
        this.passengers.push(target);
    }

    removePassengers() {
        const passengers = [...this.passengers];
        this.passengers = [];
        return passengers;
    }

    crash() {
        this.isCrashed = true;
        this.isEngineRunning = false;
    }

    applyEffect(effectType) {
        switch (effectType) {
            case 'shortCircuit':
                this.shortCircuitTime = 2000;
                break;
            case 'turbulence':
                this.turbulenceTime = 1000;
                break;
            case 'damage':
                this.damageLevel = Math.min(3, this.damageLevel + 1);
                break;
            case 'fuelLeak':
                this.fuelLeak = true;
                this.fuelLeakTime = 5000;
                break;
        }
    }

    isInSafeZone(safeZone, radius) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        return PhysicsEngine.checkCircleCollision(
            centerX, centerY, this.width / 2,
            safeZone.x, safeZone.y, radius
        );
    }

    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            fuel: this.fuel,
            ropeLength: this.ropeLength,
            ropeState: this.ropeState,
            passengers: this.passengers.map(p => p.id),
            damageLevel: this.damageLevel,
            fuelLeak: this.fuelLeak,
            fuelLeakTime: this.fuelLeakTime
        };
    }

    restoreState(state, targets) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.fuel = state.fuel;
        this.ropeLength = state.ropeLength;
        this.ropeState = state.ropeState;
        this.damageLevel = state.damageLevel || 0;
        this.fuelLeak = state.fuelLeak || false;
        this.fuelLeakTime = state.fuelLeakTime || 0;
        this.passengers = targets.filter(t => state.passengers.includes(t.id));
    }
}