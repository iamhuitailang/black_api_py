class Enemy {
    constructor(type, x, y) {
        this.type = type;
        const config = CONFIG.ENEMY_TYPES[type];
        
        this.name = config.name;
        this.maxHealth = config.health;
        this.health = config.health;
        this.attack = config.attack;
        this.speed = config.speed;
        this.score = config.score;
        this.color = config.color;
        
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        
        this.vx = 0;
        this.vy = 0;
        
        this.behavior = 'approach';
        this.behaviorTimer = 0;
        this.targetX = x;
        this.targetY = y;
        
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackCooldownMax = 2000;
        
        this.isDead = false;
        this.deathTimer = 0;
        
        this.hitFlash = 0;
        this.direction = 1;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(deltaTime, hippo) {
        if (this.isDead) {
            this.deathTimer += deltaTime;
            return this.deathTimer > 500;
        }
        
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        this.updateBehavior(hippo, deltaTime);
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = Utils.clamp(this.x, 50, CONFIG.CANVAS_WIDTH - 50);
        this.y = Utils.clamp(this.y, CONFIG.SWAMP_Y - 100, CONFIG.SWAMP_Y + 50);
        
        return false;
    }

    updateBehavior(hippo, deltaTime) {
        const distToHippo = Utils.distance(this.x, this.y, hippo.x, hippo.y);
        this.direction = hippo.x > this.x ? 1 : -1;
        
        this.behaviorTimer -= deltaTime;
        
        switch (this.behavior) {
            case 'approach':
                this.approachBehavior(hippo, distToHippo);
                break;
            case 'attack':
                this.attackBehavior(hippo, distToHippo);
                break;
            case 'flee':
                this.fleeBehavior(hippo);
                break;
            case 'evade':
                this.evadeBehavior(hippo);
                break;
            case 'idle':
                this.idleBehavior();
                break;
        }
        
        if (this.behaviorTimer <= 0) {
            this.decideBehavior(hippo, distToHippo);
        }
    }

    decideBehavior(hippo, distToHippo) {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent < 0.3 && distToHippo < 200) {
            this.behavior = 'flee';
            this.behaviorTimer = 1500;
        } else if (hippo.mouthOpen > 0.5 && distToHippo < 150) {
            this.behavior = 'evade';
            this.behaviorTimer = 500;
        } else if (distToHippo < 100 && this.attackCooldown <= 0) {
            this.behavior = 'attack';
            this.behaviorTimer = 800;
        } else if (distToHippo > 300) {
            this.behavior = 'approach';
            this.behaviorTimer = 1000;
        } else {
            this.behavior = 'idle';
            this.behaviorTimer = 500;
        }
    }

    approachBehavior(hippo, distToHippo) {
        const angle = Math.atan2(hippo.y - this.y, hippo.x - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed * 0.5;
    }

    attackBehavior(hippo, distToHippo) {
        if (distToHippo < 100 && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = this.attackCooldownMax;
            
            const angle = Math.atan2(hippo.y - this.y, hippo.x - this.x);
            this.vx = Math.cos(angle) * this.speed * 3;
            this.vy = Math.sin(angle) * this.speed * 2;
        } else {
            this.isAttacking = false;
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
    }

    fleeBehavior(hippo) {
        const angle = Math.atan2(this.y - hippo.y, this.x - hippo.x);
        this.vx = Math.cos(angle) * this.speed * 1.5;
        this.vy = Math.sin(angle) * this.speed;
    }

    evadeBehavior(hippo) {
        const evadeDir = Math.random() > 0.5 ? 1 : -1;
        this.vx = evadeDir * this.speed * 2;
        this.vy = -this.speed;
    }

    idleBehavior() {
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.vy += Math.sin(Date.now() * 0.005) * 0.1;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 200;
        
        this.vx = -this.direction * 5;
        this.vy = -3;
        
        ParticleSystem.createBurst(this.x, this.y, 8, {
            color: this.color,
            size: 6
        });
        
        if (this.health <= 0) {
            this.isDead = true;
            return true;
        }
        return false;
    }

    canDamage() {
        return this.isAttacking && this.attackCooldown > this.attackCooldownMax - 300;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.direction < 0) {
            ctx.scale(-1, 1);
        }
        
        if (this.isDead) {
            const deathProgress = this.deathTimer / 500;
            ctx.globalAlpha = 1 - deathProgress;
            ctx.translate(0, -deathProgress * 50);
            ctx.rotate(deathProgress * Math.PI);
        }
        
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2)';
        }
        
        switch (this.type) {
            case 'fish':
                this.drawFish(ctx);
                break;
            case 'frog':
                this.drawFrog(ctx);
                break;
            case 'snake':
                this.drawSnake(ctx);
                break;
            case 'crocodile':
                this.drawCrocodile(ctx);
                break;
        }
        
        ctx.filter = 'none';
        ctx.restore();
        
        if (!this.isDead) {
            this.drawHealthBar(ctx);
        }
    }

    drawFish(ctx) {
        const bounce = Math.sin(this.animFrame * Math.PI / 2) * 3;
        const tailWag = Math.sin(Date.now() * 0.01) * 5;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, bounce, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.color, 30);
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = this.darkenColor(this.color, 15);
        ctx.beginPath();
        ctx.moveTo(-20, bounce);
        ctx.quadraticCurveTo(-35 + tailWag, bounce - 12, -42 + tailWag, bounce);
        ctx.quadraticCurveTo(-35 + tailWag, bounce + 12, -20, bounce);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(15, bounce - 2, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(16, bounce - 1, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-5, bounce - 3, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFrog(ctx) {
        const hop = Math.abs(Math.sin(this.animFrame * Math.PI / 2)) * 8;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -hop, 22, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.color, 30);
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = this.lightenColor(this.color, 10);
        ctx.beginPath();
        ctx.ellipse(0, -hop - 14, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(9, -hop - 23, 7, 8, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-9, -hop - 23, 7, 8, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.color, 20);
        ctx.stroke();
        
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.ellipse(10, -hop - 22, 3, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-8, -hop - 22, 3, 4, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.darkenColor(this.color, 20);
        ctx.beginPath();
        ctx.ellipse(18, -hop + 5, 5, 10, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-18, -hop + 5, 5, 10, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-6, -hop - 16, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSnake(ctx) {
        const wave = Math.sin(this.animFrame * Math.PI / 2) * 5;
        
        const segmentColors = ['#32CD32', '#228B22', '#006400', '#004d00', '#003300'];
        
        for (let i = 4; i >= 0; i--) {
            const segX = -i * 12;
            const segY = Math.sin(i + wave * 0.3) * (5 - i);
            const segSize = 12 - i;
            
            ctx.fillStyle = segmentColors[i];
            ctx.beginPath();
            ctx.ellipse(segX, segY, segSize, segSize * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const headX = 15;
        const headY = Math.sin(wave * 0.2) * 2;
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(headX, headY, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#004d00';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(headX + 7, headY - 3, 4, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(headX + 8, headY - 2, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const tongueWave = Math.sin(Date.now() * 0.01) * 2;
        ctx.beginPath();
        ctx.moveTo(headX + 14, headY);
        ctx.lineTo(headX + 24 + tongueWave, headY - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(headX + 14, headY);
        ctx.lineTo(headX + 24 + tongueWave, headY + 4);
        ctx.stroke();
        
        ctx.fillStyle = '#9932CC';
        for (let i = 1; i < 4; i++) {
            const patX = -i * 14;
            const patY = Math.sin(i + wave * 0.2) * 3;
            ctx.beginPath();
            ctx.ellipse(patX, patY, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawCrocodile(ctx) {
        const bob = Math.sin(this.animFrame * Math.PI / 2) * 2;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, bob, 42, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.color, 40);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#6B8E23';
        ctx.beginPath();
        ctx.ellipse(38, bob, 28, 16, 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#2F4F4F';
        ctx.beginPath();
        ctx.moveTo(52, bob - 8);
        ctx.quadraticCurveTo(65, bob, 52, bob + 8);
        ctx.quadraticCurveTo(48, bob, 52, bob - 8);
        ctx.fill();
        
        ctx.fillStyle = '#FFFAF0';
        for (let i = 0; i < 5; i++) {
            const toothX = 50 + i * 3;
            ctx.beginPath();
            ctx.moveTo(toothX - 1.5, bob + 5);
            ctx.lineTo(toothX, bob + 1);
            ctx.lineTo(toothX + 1.5, bob + 5);
            ctx.closePath();
            ctx.fill();
        }
        for (let i = 0; i < 5; i++) {
            const toothX = 50 + i * 3;
            ctx.beginPath();
            ctx.moveTo(toothX - 1.5, bob - 5);
            ctx.lineTo(toothX, bob - 1);
            ctx.lineTo(toothX + 1.5, bob - 5);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(50, bob - 8, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(51, bob - 7, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.darkenColor(this.color, 25);
        ctx.beginPath();
        ctx.moveTo(-38, bob);
        ctx.lineTo(-65, bob - 12);
        ctx.lineTo(-65, bob + 12);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#2F4F4F';
        for (let i = 0; i < 5; i++) {
            const scaleX = -25 + i * 15;
            ctx.beginPath();
            ctx.ellipse(scaleX, bob - 18, 6, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const legColor = '#556B2F';
        ctx.fillStyle = legColor;
        ctx.beginPath();
        ctx.ellipse(-35, bob + 18, 12, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, bob + 18, 12, 8, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#6B8E23';
        ctx.beginPath();
        ctx.ellipse(-42, bob + 22, 7, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(37, bob + 22, 7, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(-15, bob - 8, 20, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.3)';
        ctx.beginPath();
        ctx.ellipse(60, bob - 2, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - 45;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#f44336';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    darkenColor(hex, amount) {
        const rgb = Utils.hexToRgb(hex);
        return Utils.colorToString(
            Math.max(0, rgb.r - amount),
            Math.max(0, rgb.g - amount),
            Math.max(0, rgb.b - amount)
        );
    }

    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            health: this.health,
            isDead: this.isDead
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.health = state.health;
        this.isDead = state.isDead;
    }
}