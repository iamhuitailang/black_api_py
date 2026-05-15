class Motorcycle {
    constructor(x, y, motorcycleType = 'offroad') {
        this.type = motorcycleType;
        this.config = CONFIG.MOTORCYCLES[motorcycleType];
        
        this.wheelbase = CONFIG.WHEELBASE;
        this.wheelRadius = CONFIG.WHEEL_RADIUS;
        
        this.frontWheel = new Wheel(x + this.wheelbase / 2, y, this.wheelRadius);
        this.rearWheel = new Wheel(x - this.wheelbase / 2, y, this.wheelRadius);
        
        this.chassisX = x;
        this.chassisY = y;
        this.rotation = 0;
        
        this.isGrounded = false;
        this.airTime = 0;
        this.landed = false;
        
        this.totalRotations = 0;
        this.lastRotation = 0;
        
        this.wheelieTime = 0;
        this.stoppieTime = 0;
    }

    updatePosition() {
        const frontPos = this.frontWheel.getPosition();
        const rearPos = this.rearWheel.getPosition();
        
        const dx = frontPos.x - rearPos.x;
        const dy = frontPos.y - rearPos.y;
        
        this.rotation = Math.atan2(dy, dx);
        
        this.chassisX = (frontPos.x + rearPos.x) / 2;
        this.chassisY = (frontPos.y + rearPos.y) / 2;
    }

    getPosition() {
        return new Vector2(this.chassisX, this.chassisY);
    }

    update(input, terrain, dt, cameraX, canvasWidth) {
        const wasGrounded = this.isGrounded;
        
        this.frontWheel.update(terrain, dt);
        this.rearWheel.update(terrain, dt);
        
        this.isGrounded = this.frontWheel.grounded || this.rearWheel.grounded;
        
        if (!this.isGrounded) {
            this.airTime += dt;
        } else {
            if (this.airTime > 0.1) {
                this.landed = true;
            }
            this.airTime = 0;
        }
        
        if (!wasGrounded && this.isGrounded) {
            this.onLanding();
        }
        
        this.applyControls(input, dt);
        this.updatePosition();
        this.updateWheelie(input, dt);
        
        const rotDiff = this.rotation - this.lastRotation;
        if (Math.abs(rotDiff) > Math.PI * 0.1) {
            this.totalRotations += rotDiff > 0 ? rotDiff / (Math.PI * 2) : rotDiff / (Math.PI * 2);
        }
        this.lastRotation = this.rotation;
    }

    applyControls(input, dt) {
        const speed = this.getSpeed();
        const maxSpeed = CONFIG.MAX_SPEED * this.config.speed;
        
        if (input.isGas()) {
            const accel = CONFIG.ACCELERATION * this.config.acceleration * dt;
            
            if (this.rearWheel.grounded) {
                const forceX = Math.cos(this.rotation) * accel;
                const forceY = Math.sin(this.rotation) * accel;
                this.rearWheel.vx += forceX;
                this.rearWheel.vy += forceY * 0.3;
                this.frontWheel.vx += forceX * 0.5;
            }
        }
        
        if (input.isBrake()) {
            if (this.isGrounded) {
                this.frontWheel.vx *= 0.95;
                this.rearWheel.vx *= 0.98;
            }
        }
        
        if (input.isTiltLeft()) {
            if (this.isGrounded && speed > 50) {
                this.wheelieTime += dt;
                this.rearWheel.vy -= 200 * dt;
            }
        }
        
        if (input.isTiltRight()) {
            if (this.isGrounded && speed > 50) {
                this.stoppieTime += dt;
                this.frontWheel.vy -= 200 * dt;
            }
        }
        
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            this.frontWheel.vx *= scale;
            this.rearWheel.vx *= scale;
        }
    }

    updateWheelie(input, dt) {
        const frontUp = !this.frontWheel.grounded;
        const rearUp = !this.rearWheel.grounded;
        
        if (frontUp && this.rearWheel.grounded && input.isGas()) {
            this.wheelieTime += dt;
        } else if (rearUp && this.frontWheel.grounded && input.isBrake()) {
            this.stoppieTime += dt;
        } else {
            this.wheelieTime = Math.max(0, this.wheelieTime - dt * 2);
            this.stoppieTime = Math.max(0, this.stoppieTime - dt * 2);
        }
    }

    onLanding() {
        const impactAngle = Math.abs(this.normalizeAngle(this.rotation));
        
        if (impactAngle > CONFIG.MAX_ROTATION) {
            return 'crashed';
        }
        
        return 'landed';
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    getSpeed() {
        const vel = this.getVelocity();
        return vel.length();
    }

    getVelocity() {
        const fv = this.frontWheel.getVelocity();
        const rv = this.rearWheel.getVelocity();
        return new Vector2((fv.x + rv.x) / 2, (fv.y + rv.y) / 2);
    }

    getRotation() {
        return this.rotation;
    }

    isInAir() {
        return !this.isGrounded;
    }

    getAirTime() {
        return this.airTime;
    }

    getFlipCount() {
        return Math.abs(this.totalRotations);
    }

    getFlipDirection() {
        return Math.sign(this.totalRotations);
    }

    reset(x, y) {
        this.frontWheel.setPosition(x + this.wheelbase / 2, y);
        this.rearWheel.setPosition(x - this.wheelbase / 2, y);
        this.frontWheel.setVelocity(0, 0);
        this.rearWheel.setVelocity(0, 0);
        this.rotation = 0;
        this.airTime = 0;
        this.totalRotations = 0;
        this.wheelieTime = 0;
        this.stoppieTime = 0;
    }

    getState() {
        return {
            type: this.type,
            frontWheel: {
                position: { x: this.frontWheel.x, y: this.frontWheel.y },
                velocity: { x: this.frontWheel.vx, y: this.frontWheel.vy }
            },
            rearWheel: {
                position: { x: this.rearWheel.x, y: this.rearWheel.y },
                velocity: { x: this.rearWheel.vx, y: this.rearWheel.vy }
            },
            rotation: this.rotation,
            airTime: this.airTime,
            totalRotations: this.totalRotations
        };
    }

    restoreState(state) {
        this.type = state.type;
        this.config = CONFIG.MOTORCYCLES[state.type];
        this.frontWheel.x = state.frontWheel.position.x;
        this.frontWheel.y = state.frontWheel.position.y;
        this.frontWheel.vx = state.frontWheel.velocity.x;
        this.frontWheel.vy = state.frontWheel.velocity.y;
        this.rearWheel.x = state.rearWheel.position.x;
        this.rearWheel.y = state.rearWheel.position.y;
        this.rearWheel.vx = state.rearWheel.velocity.x;
        this.rearWheel.vy = state.rearWheel.velocity.y;
        this.rotation = state.rotation;
        this.airTime = state.airTime;
        this.totalRotations = state.totalRotations;
    }
}