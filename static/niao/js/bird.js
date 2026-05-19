class Bird {
    constructor(canvas, characterKey = 'yellow', particleSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = CONFIG.BIRDS[characterKey];
        this.characterKey = characterKey;
        this.particleSystem = particleSystem;
        
        this.reset();
    }
    
    reset() {
        this.x = this.canvas.width * 0.3;
        this.y = this.canvas.height / 2;
        this.vy = 0;
        this.rotation = 0;
        this.wingAngle = 0;
        this.wingDirection = 1;
        this.isAlive = true;
        this.trailCounter = 0;
    }
    
    setCharacter(characterKey) {
        this.characterKey = characterKey;
        this.config = CONFIG.BIRDS[characterKey];
    }
    
    jump() {
        if (!this.isAlive) return;
        
        this.vy = -this.config.jumpForce;
        this.wingAngle = -0.8;
        
        if (this.characterKey === 'yellow') {
            this.particleSystem.emit(this.x - this.config.radius, this.y, this.config.particleColor, 3, 'feather');
        } else if (this.characterKey === 'red') {
            this.particleSystem.emit(this.x - this.config.radius, this.y, this.config.particleColor, 5, 'flame');
        }
    }
    
    update(deltaTime = 16) {
        if (!this.isAlive) return;
        
        const dt = deltaTime / 16.67;
        this.vy += this.config.gravity * 0.1 * dt;
        if (this.vy > this.config.maxVelocity) {
            this.vy = this.config.maxVelocity;
        }
        
        this.y += this.vy * dt;
        
        this.rotation = Math.min(Math.max(this.vy * 0.05, -0.5), 1.2);
        
        this.wingAngle += 0.15 * this.wingDirection;
        if (this.wingAngle > 0.5 || this.wingAngle < -0.8) {
            this.wingDirection *= -1;
        }
        
        this.trailCounter++;
        if (this.trailCounter >= 3) {
            this.trailCounter = 0;
            if (this.characterKey === 'blue') {
                this.particleSystem.emitTrail(
                    this.x - this.config.radius * 0.5,
                    this.y,
                    this.config.particleColor,
                    'trail'
                );
            } else if (this.characterKey === 'red') {
                this.particleSystem.emitTrail(
                    this.x - this.config.radius * 0.5,
                    this.y,
                    '#FF4500',
                    'flame'
                );
            }
        }
    }
    
    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);
        
        this.drawWing();
        this.drawBody();
        this.drawEye();
        this.drawBeak();
        
        this.ctx.restore();
    }
    
    drawWing() {
        this.ctx.save();
        this.ctx.translate(-this.config.radius * 0.2, 0);
        this.ctx.rotate(this.wingAngle);
        
        this.ctx.fillStyle = this.config.wingColor;
        this.ctx.beginPath();
        this.ctx.ellipse(
            0, 0,
            this.config.radius * 0.7,
            this.config.radius * 0.4,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawBody() {
        const gradient = this.ctx.createRadialGradient(
            -this.config.radius * 0.3, -this.config.radius * 0.3, 0,
            0, 0, this.config.radius
        );
        gradient.addColorStop(0, this.config.colorLight);
        gradient.addColorStop(1, this.config.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.config.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.config.color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawEye() {
        const eyeX = this.config.radius * 0.4;
        const eyeY = -this.config.radius * 0.2;
        const eyeRadius = this.config.radius * 0.25;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(eyeX + eyeRadius * 0.3, eyeY, eyeRadius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(eyeX + eyeRadius * 0.2, eyeY - eyeRadius * 0.2, eyeRadius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBeak() {
        const beakX = this.config.radius * 0.8;
        const beakY = 0;
        const beakLength = this.config.radius * 0.6;
        const beakHeight = this.config.radius * 0.35;
        
        this.ctx.fillStyle = this.config.beakColor;
        this.ctx.beginPath();
        this.ctx.moveTo(beakX, beakY - beakHeight * 0.5);
        this.ctx.lineTo(beakX + beakLength, beakY);
        this.ctx.lineTo(beakX, beakY + beakHeight * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    getHitbox() {
        const hitboxRadius = this.config.radius * this.config.hitboxScale;
        return {
            x: this.x,
            y: this.y,
            radius: hitboxRadius
        };
    }
    
    checkCollision(pipe) {
        const hitbox = this.getHitbox();
        
        if (pipe.isPassed) return false;
        
        const birdLeft = hitbox.x - hitbox.radius;
        const birdRight = hitbox.x + hitbox.radius;
        const birdTop = hitbox.y - hitbox.radius;
        const birdBottom = hitbox.y + hitbox.radius;
        
        if (birdRight < pipe.x || birdLeft > pipe.x + pipe.width) {
            return false;
        }
        
        if (birdTop < pipe.gapY || birdBottom > pipe.gapY + pipe.gapHeight) {
            return true;
        }
        
        return false;
    }
    
    checkBoundaryCollision() {
        const hitbox = this.getHitbox();
        const groundY = this.canvas.height - CONFIG.GAME.GROUND_HEIGHT;
        
        if (hitbox.y - hitbox.radius <= 0) {
            return true;
        }
        
        if (hitbox.y + hitbox.radius >= groundY) {
            return true;
        }
        
        if (hitbox.x - hitbox.radius <= 0 || hitbox.x + hitbox.radius >= this.canvas.width) {
            return true;
        }
        
        return false;
    }
}
