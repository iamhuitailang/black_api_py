class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        this.health = CONFIG.PLAYER_MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER_MAX_HEALTH;
        this.facingRight = true;
        this.isGrounded = false;
        this.isGliding = false;
        this.isSwinging = false;
        this.isAttacking = false;
        this.attackFrame = 0;
        
        this.grapple = {
            active: false,
            targetX: 0,
            targetY: 0,
            anchorX: 0,
            anchorY: 0,
            ropeLength: 0,
            angle: 0,
            angularVelocity: 0
        };
        
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(platforms, enemies) {
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame > 20) {
                this.isAttacking = false;
                this.attackFrame = 0;
            }
        }
        
        if (this.grapple.active) {
            this.updateSwing();
        } else {
            this.updateMovement(platforms);
        }
        
        this.checkGlide();
        
        if (InputManager.mouse.clicked && !this.grapple.active) {
            this.shootGrapple(platforms);
        }
        
        if (InputManager.isKeyPressed('KeyJ') && !this.isAttacking && this.isGrounded) {
            this.attack(enemies);
        }
    }
    
    updateMovement(platforms) {
        if (InputManager.isKeyPressed('KeyA')) {
            this.vx = -CONFIG.PLAYER_SPEED;
            this.facingRight = false;
        } else if (InputManager.isKeyPressed('KeyD')) {
            this.vx = CONFIG.PLAYER_SPEED;
            this.facingRight = true;
        } else {
            this.vx *= 0.8;
        }
        
        if (InputManager.isKeyPressed('KeyW') && this.isGrounded) {
            this.vy = -CONFIG.JUMP_FORCE;
            this.isGrounded = false;
        }
        
        if (this.isGliding && this.vy > 0) {
            this.vy = Math.min(this.vy, CONFIG.GLIDE_FALL_SPEED);
        } else {
            this.vy += CONFIG.GRAVITY;
        }
        
        if (isNaN(this.vx)) this.vx = 0;
        if (isNaN(this.vy)) this.vy = 0;
        
        const maxVx = 12;
        const maxVy = 15;
        this.vx = Math.max(-maxVx, Math.min(maxVx, this.vx));
        this.vy = Math.max(-maxVy, Math.min(maxVy, this.vy));
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (isNaN(this.x)) this.x = 100;
        if (isNaN(this.y)) this.y = Game.canvas.height - 150;
        
        this.handleCollisions(platforms);
        
        this.x = Math.max(this.width / 2, Math.min(Game.canvas.width - this.width / 2, this.x));
        this.y = Math.max(-50, Math.min(Game.canvas.height + 50, this.y));
        
        if (this.y > Game.canvas.height + 100) {
            this.health = 0;
        }
    }
    
    handleCollisions(platforms) {
        this.isGrounded = false;
        
        for (const platform of platforms) {
            if (this.checkPlatformCollision(platform)) {
                if (this.vy > 0 && this.y - this.height / 2 < platform.y) {
                    this.y = platform.y - this.height / 2;
                    this.vy = 0;
                    this.isGrounded = true;
                    
                    if (this.grapple.active) {
                        this.releaseGrapple();
                    }
                }
            }
        }
    }
    
    checkPlatformCollision(platform) {
        return this.x + this.width / 2 > platform.x &&
               this.x - this.width / 2 < platform.x + platform.width &&
               this.y + this.height / 2 > platform.y &&
               this.y - this.height / 2 < platform.y + platform.height;
    }
    
    checkGlide() {
        const levelConfig = CONFIG.LEVELS[Game.currentLevel];
        if (levelConfig && levelConfig.hasGlide) {
            this.isGliding = InputManager.isKeyPressed('Space') && !this.isGrounded && !this.grapple.active;
        } else {
            this.isGliding = false;
        }
    }
    
    shootGrapple(platforms) {
        const mx = InputManager.mouse.x;
        const my = InputManager.mouse.y;
        
        for (const platform of platforms) {
            if (mx >= platform.x && mx <= platform.x + platform.width &&
                my >= platform.y && my <= platform.y + platform.height) {
                
                const hitY = Math.max(platform.y, my);
                const hitX = Math.max(platform.x, Math.min(platform.x + platform.width, mx));
                
                const dist = Math.sqrt(Math.pow(hitX - this.x, 2) + Math.pow(hitY - this.y, 2));
                if (dist < 500 && dist > 20) {
                    this.grapple.active = true;
                    this.grapple.anchorX = hitX;
                    this.grapple.anchorY = hitY;
                    this.grapple.ropeLength = dist;
                    this.grapple.angle = Math.atan2(this.y - hitY, this.x - hitX);
                    this.grapple.angularVelocity = 0;
                    break;
                }
            }
        }
    }
    
    updateSwing() {
        const maxAngularVelocity = 0.08;
        const g = 0.4;
        
        if (!this.grapple.ropeLength || this.grapple.ropeLength < 10) {
            this.grapple.ropeLength = 100;
        }
        
        const angularAcceleration = -(g / this.grapple.ropeLength) * Math.sin(this.grapple.angle);
        
        if (!isNaN(angularAcceleration)) {
            this.grapple.angularVelocity += angularAcceleration;
        }
        
        this.grapple.angularVelocity *= 0.995;
        
        if (isNaN(this.grapple.angularVelocity)) {
            this.grapple.angularVelocity = 0;
        }
        
        this.grapple.angularVelocity = Math.max(-maxAngularVelocity, Math.min(maxAngularVelocity, this.grapple.angularVelocity));
        
        this.grapple.angle += this.grapple.angularVelocity;
        
        if (isNaN(this.grapple.angle)) {
            this.grapple.angle = 0;
        }
        
        const newX = this.grapple.anchorX + Math.cos(this.grapple.angle) * this.grapple.ropeLength;
        const newY = this.grapple.anchorY + Math.sin(this.grapple.angle) * this.grapple.ropeLength;
        
        if (!isNaN(newX) && !isNaN(newY)) {
            this.x = newX;
            this.y = newY;
        }
        
        if (InputManager.isKeyPressed('KeyA')) {
            this.grapple.angularVelocity -= 0.003;
        }
        if (InputManager.isKeyPressed('KeyD')) {
            this.grapple.angularVelocity += 0.003;
        }
        
        if (!InputManager.mouse.pressed) {
            this.releaseGrapple();
        }
    }
    
    releaseGrapple() {
        if (this.grapple.active) {
            const tangentX = -Math.sin(this.grapple.angle);
            const tangentY = Math.cos(this.grapple.angle);
            
            const speed = Math.abs(this.grapple.angularVelocity) * this.grapple.ropeLength * 2;
            const safeSpeed = Math.min(speed, 12);
            
            this.vx = tangentX * safeSpeed * Math.sign(this.grapple.angularVelocity);
            this.vy = tangentY * safeSpeed * Math.sign(this.grapple.angularVelocity);
            
            this.vy = Math.min(this.vy, 8);
            
            this.vx *= 0.7;
            
            this.grapple.active = false;
            this.isSwinging = false;
        }
    }
    
    attack(enemies) {
        this.isAttacking = true;
        this.attackFrame = 0;
        
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            
            const dist = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
            const facingEnemy = (this.facingRight && enemy.x > this.x) || (!this.facingRight && enemy.x < this.x);
            
            if (dist < CONFIG.ATTACK_RANGE && facingEnemy) {
                CombatManager.hitEnemy(enemy, CONFIG.ATTACK_DAMAGE, this);
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        if (this.health <= 0) {
            Game.gameOver();
        }
    }
    
    draw(ctx) {
        const safeX = isNaN(this.x) ? 100 : this.x;
        const safeY = isNaN(this.y) ? 300 : this.y;
        
        const safeAnchorX = isNaN(this.grapple.anchorX) ? safeX : this.grapple.anchorX;
        const safeAnchorY = isNaN(this.grapple.anchorY) ? safeY - 100 : this.grapple.anchorY;
        
        if (this.grapple.active) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(safeX, safeY - 20);
            ctx.lineTo(safeAnchorX, safeAnchorY);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(safeAnchorX, safeAnchorY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        ctx.save();
        ctx.translate(safeX, safeY);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        if (this.isGliding || !this.isGrounded) {
            ctx.fillStyle = '#1a1a3e';
            
            ctx.beginPath();
            ctx.moveTo(-15, -20);
            ctx.quadraticCurveTo(-40, 10, -50, 40);
            ctx.lineTo(-10, 20);
            ctx.lineTo(-15, -20);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(15, -20);
            ctx.quadraticCurveTo(40, 10, 50, 40);
            ctx.lineTo(10, 20);
            ctx.lineTo(15, -20);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.fillStyle = '#2a2a5a';
        ctx.beginPath();
        ctx.ellipse(0, 5, 15, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(-12, -5, 24, 4);
        ctx.fillRect(-10, 5, 20, 3);
        ctx.fillRect(-8, 15, 16, 3);
        
        ctx.fillStyle = '#3a3a6a';
        ctx.beginPath();
        ctx.ellipse(0, -25, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-5, -27, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -27, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath();
        ctx.moveTo(-12, -35);
        ctx.lineTo(-8, -42);
        ctx.lineTo(-4, -32);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(12, -35);
        ctx.lineTo(8, -42);
        ctx.lineTo(4, -32);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.stroke();
        
        ctx.fillStyle = '#2a2a5a';
        
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 5;
        ctx.fillRect(-12, 25, 8, 15 + (this.isGrounded ? legOffset : 0));
        ctx.fillRect(4, 25, 8, 15 + (this.isGrounded ? -legOffset : 0));
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-12, 25, 8, 15 + (this.isGrounded ? legOffset : 0));
        ctx.strokeRect(4, 25, 8, 15 + (this.isGrounded ? -legOffset : 0));
        
        if (this.isAttacking) {
            ctx.fillRect(15, -5, 20, 8);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(25, 0, 30, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillRect(15, 0, 8, 15);
            ctx.fillRect(-23, 0, 8, 15);
            
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(15, 0, 8, 15);
            ctx.strokeRect(-23, 0, 8, 15);
        }
        
        ctx.restore();
    }
}