class Clown {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONSTANTS.CLOWN.WIDTH;
        this.height = CONSTANTS.CLOWN.HEIGHT;
        this.angle = 0;
        this.targetAngle = 0;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargePower = 0;
        this.animationTime = 0;
        this.bobOffset = 0;
    }

    update(dt = 1) {
        this.animationTime += dt * 0.05;
        
        let bobAmount = 3;
        if (this.isCharging) {
            const chargeIntensity = this.getChargeProgress();
            bobAmount = 3 + chargeIntensity * 5;
        }
        this.bobOffset = Math.sin(this.animationTime * 2) * bobAmount;
        
        const angleDiff = this.targetAngle - this.angle;
        this.angle += angleDiff * 0.15;
        
        if (this.isCharging) {
            const elapsed = Date.now() - this.chargeStartTime;
            const maxDuration = CONSTANTS.LAUNCH.CHARGE_DURATION;
            this.chargePower = Math.min(1, elapsed / maxDuration);
        } else {
            this.chargePower = Math.max(0, this.chargePower - 0.05);
        }
    }

    setAngle(angle) {
        this.targetAngle = Utils.clamp(
            angle,
            CONSTANTS.LAUNCH.ANGLE_MIN,
            CONSTANTS.LAUNCH.ANGLE_MAX
        );
    }

    adjustAngle(delta) {
        this.targetAngle = Utils.clamp(
            this.targetAngle + delta,
            CONSTANTS.LAUNCH.ANGLE_MIN,
            CONSTANTS.LAUNCH.ANGLE_MAX
        );
    }

    startCharge() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargePower = 0;
    }

    endCharge() {
        const power = this.getLaunchPower();
        this.isCharging = false;
        this.chargePower = 0;
        return power;
    }

    getLaunchPower() {
        const elapsed = Date.now() - this.chargeStartTime;
        const t = Math.min(1, elapsed / CONSTANTS.LAUNCH.CHARGE_DURATION);
        
        return Utils.lerp(
            CONSTANTS.LAUNCH.TAP_POWER,
            CONSTANTS.LAUNCH.MAX_POWER,
            t
        );
    }

    getChargeProgress() {
        if (!this.isCharging) return 0;
        const elapsed = Date.now() - this.chargeStartTime;
        return Math.min(1, elapsed / CONSTANTS.LAUNCH.CHARGE_DURATION);
    }

    getLaunchDirection() {
        const rad = Utils.degToRad(-90 + this.angle);
        return {
            x: Math.cos(rad),
            y: Math.sin(rad)
        };
    }

    getLaunchPosition() {
        const dir = this.getLaunchDirection();
        const distance = 60;
        return {
            x: this.x + dir.x * distance,
            y: this.y + this.bobOffset + dir.y * distance
        };
    }

    launchBalloon() {
        const power = this.endCharge();
        const dir = this.getLaunchDirection();
        const pos = this.getLaunchPosition();
        
        const balloon = new Balloon(pos.x, pos.y);
        balloon.isLaunched = true;
        balloon.vx = dir.x * power;
        balloon.vy = dir.y * power;
        balloon.triggerSparkle();
        
        return balloon;
    }

    draw(ctx, cameraY = 0) {
        const drawY = this.y - cameraY;
        
        ctx.save();
        ctx.translate(this.x, drawY + this.bobOffset);
        
        this.drawBody(ctx);
        this.drawHead(ctx);
        this.drawHat(ctx);
        this.drawFace(ctx);
        this.drawArms(ctx);
        this.drawLauncher(ctx);
        
        ctx.restore();
        
        this.drawAimLine(ctx, drawY + this.bobOffset);
    }

    drawBody(ctx) {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(0, 20, 35, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.ellipse(0, 25, 25, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(0, 20, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHead(ctx) {
        ctx.fillStyle = '#FFEAA7';
        ctx.beginPath();
        ctx.arc(0, -30, 35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E17055';
        ctx.beginPath();
        ctx.ellipse(0, -5, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#E17055';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-35, -30);
        ctx.quadraticCurveTo(-40, -20, -38, -5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(35, -30);
        ctx.quadraticCurveTo(40, -20, 38, -5);
        ctx.stroke();
    }

    drawHat(ctx) {
        ctx.fillStyle = '#9B59B6';
        ctx.beginPath();
        ctx.moveTo(-25, -55);
        ctx.lineTo(0, -95);
        ctx.lineTo(25, -55);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.arc(0, -95, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#9B59B6';
        ctx.fillRect(-35, -60, 70, 8);
    }

    drawFace(ctx) {
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(-12, -35, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(12, -35, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-10, -37, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(14, -37, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(0, -22, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-2, -24, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -20, 15, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 150, 150, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-25, -25, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(25, -25, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawArms(ctx) {
        const chargeOffset = this.isCharging ? Math.sin(Date.now() * 0.02) * 5 : 0;
        
        ctx.fillStyle = '#FFEAA7';
        ctx.beginPath();
        ctx.ellipse(-40, 10 + chargeOffset, 12, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(-50, 8 + chargeOffset, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLauncher(ctx) {
        ctx.save();
        ctx.rotate(Utils.degToRad(this.angle));
        
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(0, -8, 50, 16);
        
        ctx.fillStyle = '#45B7AA';
        ctx.beginPath();
        ctx.arc(50, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.chargePower > 0) {
            const time = Date.now() * 0.005;
            const pulse = 1 + Math.sin(time) * 0.2;
            
            for (let i = 3; i >= 0; i--) {
                const glowRadius = 15 + this.chargePower * 15 + i * 5;
                const glowIntensity = (this.chargePower * 0.6) * (1 - i * 0.2) * pulse;
                
                ctx.beginPath();
                ctx.arc(50, 0, glowRadius, 0, Math.PI * 2);
                
                if (this.chargePower < 0.33) {
                    ctx.fillStyle = `rgba(78, 205, 196, ${glowIntensity})`;
                } else if (this.chargePower < 0.66) {
                    ctx.fillStyle = `rgba(255, 230, 109, ${glowIntensity})`;
                } else {
                    ctx.fillStyle = `rgba(255, 107, 107, ${glowIntensity})`;
                }
                ctx.fill();
            }
            
            ctx.beginPath();
            ctx.arc(50, 0, 12 + this.chargePower * 5, 0, Math.PI * 2);
            if (this.chargePower < 0.33) {
                ctx.fillStyle = '#4ECDC4';
            } else if (this.chargePower < 0.66) {
                ctx.fillStyle = '#FFE66D';
            } else {
                ctx.fillStyle = '#FF6B6B';
            }
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawAimLine(ctx, cameraY) {
        const dir = this.getLaunchDirection();
        const pos = this.getLaunchPosition();
        
        ctx.save();
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - cameraY);
        ctx.lineTo(pos.x + dir.x * 150, pos.y - cameraY + dir.y * 150);
        ctx.stroke();
        ctx.restore();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(pos.x + dir.x * 150, pos.y - cameraY + dir.y * 150, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            angle: this.angle,
            targetAngle: this.targetAngle
        };
    }

    static deserialize(data) {
        const clown = new Clown(data.x, data.y);
        clown.angle = data.angle;
        clown.targetAngle = data.targetAngle;
        return clown;
    }
}