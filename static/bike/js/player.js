import { CONFIG } from './config.js';

export class Player {
    constructor(canvas, bikeType = 'MOUNTAIN') {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.x = 100;
        this.y = this.height * 0.65 - 50;
        this.vx = 2;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        
        this.isGrounded = true;
        this.isFalling = false;
        this.fallTimer = 0;
        this.airTime = 0;
        
        this.bikeType = bikeType;
        this.bikeStats = CONFIG.BIKES[bikeType];
        
        this.wheelRadius = 15;
        this.bikeLength = 60;
    }

    loadState(savedState) {
        if (!savedState) return;
        this.x = savedState.x;
        this.y = savedState.y;
        this.vx = savedState.vx;
        this.vy = savedState.vy;
        this.angle = savedState.angle;
        this.angularVelocity = savedState.angularVelocity;
        this.isGrounded = savedState.isGrounded;
        this.isFalling = savedState.isFalling;
        this.fallTimer = savedState.fallTimer || 0;
    }

    reset() {
        this.x = 100;
        this.y = this.height * 0.65 - 50;
        this.vx = 2;
        this.vy = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.isGrounded = true;
        this.isFalling = false;
        this.fallTimer = 0;
        this.airTime = 0;
    }

    update(input, terrain, deltaTime) {
        if (this.isFalling) {
            this.fallTimer -= deltaTime;
            if (this.fallTimer <= 0) {
                this.isFalling = false;
                this.vx = 2;
                this.vy = 0;
                this.angle = 0;
                this.angularVelocity = 0;
            }
            return;
        }

        const segmentConfig = terrain.getSegmentConfig(this.x);
        const groundAngle = terrain.getGroundAngle(this.x);
        
        const controlMult = 0.5 + this.bikeStats.control * 0.2;
        const balanceMult = 0.5 + this.bikeStats.balance * 0.2;

        if (input.isAccelerating()) {
            const accel = CONFIG.PHYSICS.ACCELERATION * segmentConfig.speedMult * controlMult;
            this.vx = Math.min(this.vx + accel, CONFIG.PHYSICS.MAX_SPEED);
        }

        if (input.isBraking()) {
            this.vx = Math.max(this.vx - CONFIG.PHYSICS.BRAKE, 0);
        }

        this.vx *= (1 - CONFIG.PHYSICS.FRICTION);
        this.vx = Math.max(this.vx, 0.5);

        const balanceInput = input.getBalanceInput();
        this.angularVelocity += balanceInput * 0.1 * controlMult;

        if (this.isGrounded) {
            const angleDiff = -this.angle + groundAngle;
            this.angularVelocity += angleDiff * 0.25 * balanceMult;
            
            const speedStability = Math.min(this.vx / 3, 1) * 0.5;
            this.angularVelocity *= (0.7 - speedStability * 0.1);
        }

        this.angularVelocity *= 0.9;
        this.angle += this.angularVelocity;

        this.angle = Math.max(-CONFIG.PHYSICS.MAX_ANGLE * Math.PI / 180,
            Math.min(CONFIG.PHYSICS.MAX_ANGLE * Math.PI / 180, this.angle));

        if (this.isGrounded) {
            const fallAngleRad = CONFIG.PHYSICS.FALL_ANGLE * Math.PI / 180;
            
            if (Math.abs(this.angle - groundAngle) > fallAngleRad) {
                this.fall();
            }
        }

        this.vy += CONFIG.PHYSICS.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        const groundHeight = terrain.getGroundHeight(this.x);
        const bikeBottom = this.y + this.wheelRadius;

        if (bikeBottom >= groundHeight) {
            if (!this.isGrounded && this.airTime > 100) {
                this.checkLanding(groundAngle);
            }
            
            this.y = groundHeight - this.wheelRadius;
            this.vy = 0;
            this.isGrounded = true;
            this.airTime = 0;
        } else {
            this.isGrounded = false;
            this.airTime += deltaTime;
        }

        const obstacle = terrain.checkObstacleCollision(this.x, this.y, this.bikeLength, 30);
        if (obstacle && this.isGrounded) {
            this.vy = -6;
            this.isGrounded = false;
        }
    }

    checkLanding(groundAngle) {
        const landingAngle = Math.abs(this.angle - groundAngle);
        const maxSafeAngle = 35 * Math.PI / 180;
        
        if (landingAngle > maxSafeAngle) {
            this.fall();
        }
    }

    fall() {
        this.isFalling = true;
        this.fallTimer = CONFIG.PHYSICS.FALL_RECOVERY_TIME;
        this.vx = 1;
        this.angularVelocity = 0;
        this.angle = 0;
    }

    render(ctx, cameraX) {
        const screenX = this.x - cameraX;
        
        ctx.save();
        ctx.translate(screenX, this.y);
        ctx.rotate(this.angle);

        if (this.isFalling) {
            ctx.globalAlpha = 0.5;
        }

        this.drawBike(ctx);
        this.drawRider(ctx);

        ctx.restore();
    }

    drawBike(ctx) {
        const wheelRadius = this.wheelRadius;
        const halfLength = this.bikeLength / 2;

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-halfLength, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(halfLength, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-halfLength, 0);
        ctx.lineTo(0, -wheelRadius - 15);
        ctx.lineTo(halfLength, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -wheelRadius - 15);
        ctx.lineTo(halfLength * 0.7, -wheelRadius - 30);
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(halfLength * 0.5, -wheelRadius - 25, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRider(ctx) {
        const halfLength = this.bikeLength / 2;
        
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(halfLength * 0.5, -this.wheelRadius - 45, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(halfLength * 0.5, -this.wheelRadius - 33);
        ctx.lineTo(halfLength * 0.3, -this.wheelRadius - 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(halfLength * 0.3, -this.wheelRadius - 25);
        ctx.lineTo(halfLength * 0.8, -this.wheelRadius - 28);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(halfLength * 0.3, -this.wheelRadius - 15);
        ctx.lineTo(-halfLength * 0.3, -this.wheelRadius - 12);
        ctx.stroke();
    }

    canDoTrick() {
        return !this.isGrounded && !this.isFalling && this.airTime > 200;
    }
}
