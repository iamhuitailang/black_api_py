const GameObjects = {
    COLORS: {
        trackGray: '#2a2a3a',
        trackDark: '#1a1a28',
        neonBlue: '#00d4ff',
        neonPurple: '#a855f7',
        neonPink: '#ff4081',
        brightYellow: '#ffeb3b',
        orange: '#ff9800',
        red: '#f44336',
        green: '#4caf50',
        white: '#ffffff'
    }
};

class PlayerCar {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.width = 50;
        this.height = 70;
        this.lane = 1;
        this.targetLane = 1;
        this.moveSpeed = 0;
        this.maxMoveSpeed = 8;
        this.acceleration = 0.8;
        this.deceleration = 0.5;
        this.rotation = 0;
        this.isRotating = false;
        this.rotationTimer = 0;
        this.skidding = false;
        this.skidTimer = 0;
        this.nitroActive = false;
        this.nitroTimer = 0;
        this.driftAngle = 0;
        this.isMoving = false;
    }

    init(width, height) {
        const laneWidth = width / 3;
        this.lane = 1;
        this.targetLane = 1;
        this.x = laneWidth * 1 + laneWidth / 2 - this.width / 2;
        this.y = height - 120;
        this.moveSpeed = 0;
        this.rotation = 0;
        this.isRotating = false;
        this.skidding = false;
        this.nitroActive = false;
        this.isMoving = false;
    }

    moveLeft() {
        if (this.skidding || this.isMoving) return;
        if (this.targetLane > 0) {
            this.targetLane--;
            this.isMoving = true;
        }
    }

    moveRight() {
        if (this.skidding || this.isMoving) return;
        if (this.targetLane < 2) {
            this.targetLane++;
            this.isMoving = true;
        }
    }

    activateNitro() {
        if (this.game.nitroCount > 0 && !this.nitroActive) {
            this.game.nitroCount--;
            this.nitroActive = true;
            this.nitroTimer = 120;
            this.game.createEffect('nitroActivated', this.x + this.width / 2, this.y);
        }
    }

    hit(type) {
        if (this.nitroActive) return false;
        
        if (type === 'barrier') {
            this.skidding = true;
            this.skidTimer = 60;
            this.isRotating = true;
            this.rotationTimer = 60;
            return 1;
        }
        
        if (type === 'car') {
            return 0.5;
        }
        
        if (type === 'truck') {
            return 1.5;
        }
        
        return 0;
    }

    update(width) {
        if (width <= 0) return;
        
        const laneWidth = width / 3;
        const targetX = laneWidth * this.targetLane + laneWidth / 2 - this.width / 2;
        
        if (this.isMoving) {
            const diff = targetX - this.x;
            const moveAmount = diff * 0.12;
            
            this.x += moveAmount;
            this.skidding = true;
            this.driftAngle = diff > 0 ? 12 : -12;
            
            if (Math.random() > 0.6) {
                this.game.createEffect('skidMark', this.x + 10, this.y + this.height);
                this.game.createEffect('skidMark', this.x + this.width - 10, this.y + this.height);
            }
            
            if (Math.abs(diff) < 2) {
                this.x = targetX;
                this.lane = this.targetLane;
                this.isMoving = false;
                this.skidding = false;
            }
        } else {
            this.driftAngle = Utils.lerp(this.driftAngle, 0, 0.15);
        }
        
        this.x = Utils.clamp(this.x, 0, width - this.width);

        if (this.isRotating && this.rotationTimer > 0) {
            this.rotationTimer--;
            this.rotation += 12;
            if (this.rotation >= 360) {
                this.rotation = 0;
                this.isRotating = false;
            }
        }

        if (this.skidTimer > 0) {
            this.skidTimer--;
            if (this.skidTimer <= 0) {
                this.skidding = false;
                this.isMoving = false;
            }
        }

        if (this.nitroActive && this.nitroTimer > 0) {
            this.nitroTimer--;
            if (Math.random() > 0.2) {
                this.game.createEffect('flame', this.x + this.width / 2, this.y + this.height);
            }
            if (this.nitroTimer <= 0) {
                this.nitroActive = false;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        const totalRotation = this.rotation + this.driftAngle * 0.3;
        ctx.rotate(totalRotation * Math.PI / 180);
        
        if (this.skidding && !this.nitroActive) {
            this.drawSkidSmoke(ctx);
        }
        
        if (this.nitroActive) {
            this.drawNitroGlow(ctx);
        }
        
        this.drawCarBody(ctx);
        
        ctx.restore();
    }

    drawCarBody(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.fillStyle = GameObjects.COLORS.brightYellow;
        Utils.drawRoundRect(ctx, -w/2 + 5, -h/2 + 15, w - 10, h - 30, 12);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.neonBlue;
        Utils.drawRoundRect(ctx, -w/2 + 8, -h/2 + 18, w - 16, h - 36, 10);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.neonBlue;
        Utils.drawRoundRect(ctx, -w/2 + 8, -h/2, w - 16, 25, 10);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.neonPurple;
        ctx.beginPath();
        ctx.ellipse(0, -h/2 + 12, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.white;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 12, h/2 - 20, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 12, h/2 - 20, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.red;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 12, -h/2 + 25, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 12, -h/2 + 25, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 5, 0, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 5, 0, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.trackGray;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 5, 0, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 5, 0, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSkidSmoke(ctx) {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = GameObjects.COLORS.neonBlue;
            ctx.beginPath();
            ctx.arc(
                Utils.random(-this.width/2 - 10, this.width/2 + 10),
                this.height/2 + i * 8,
                5 + i * 2,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawNitroGlow(ctx) {
        ctx.shadowColor = GameObjects.COLORS.orange;
        ctx.shadowBlur = 30;
        ctx.fillStyle = GameObjects.COLORS.orange;
        ctx.globalAlpha = 0.5;
        
        const flameHeight = 20 + Math.random() * 15;
        ctx.beginPath();
        ctx.moveTo(-8, this.height/2 - 15);
        ctx.lineTo(0, this.height/2 + flameHeight);
        ctx.lineTo(8, this.height/2 - 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.brightYellow;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(-4, this.height/2 - 15);
        ctx.lineTo(0, this.height/2 + flameHeight * 0.6);
        ctx.lineTo(4, this.height/2 - 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

class EnemyCar {
    constructor(game, type, lane, y) {
        this.game = game;
        this.type = type;
        this.lane = lane;
        this.y = y;
        this.x = 0;
        this.setDimensions();
        this.hit = false;
        this.hitAlpha = 0;
        this.hitCooldown = 0;
    }

    setDimensions() {
        if (this.type === 'van') {
            this.width = 45;
            this.height = 65;
            this.color = GameObjects.COLORS.neonPink;
            this.secondColor = GameObjects.COLORS.white;
        } else if (this.type === 'watermelon') {
            this.width = 40;
            this.height = 60;
            this.color = GameObjects.COLORS.green;
            this.secondColor = GameObjects.COLORS.red;
        } else if (this.type === 'truck') {
            this.width = 45;
            this.height = 100;
            this.color = GameObjects.COLORS.neonPurple;
            this.secondColor = GameObjects.COLORS.neonBlue;
            this.lanes = 2;
        }
    }

    update(speed, width) {
        const laneWidth = width / 3;
        if (this.type === 'truck') {
            this.x = laneWidth * this.lane + laneWidth / 2 - this.width / 2;
        } else {
            this.x = laneWidth * this.lane + laneWidth / 2 - this.width / 2;
        }
        this.y += speed;
        
        if (this.hitAlpha > 0) {
            this.hitAlpha -= 0.05;
        }
        
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(180 * Math.PI / 180);
        
        if (this.hitAlpha > 0) {
            ctx.globalAlpha = 1 - this.hitAlpha * 0.5;
        }
        
        if (this.type === 'van') {
            this.drawVan(ctx);
        } else if (this.type === 'watermelon') {
            this.drawWatermelonCar(ctx);
        } else if (this.type === 'truck') {
            this.drawTruck(ctx);
        }
        
        ctx.restore();
    }

    drawVan(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.fillStyle = this.color;
        Utils.drawRoundRect(ctx, -w/2 + 3, -h/2 + 10, w - 6, h - 20, 10);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        Utils.drawRoundRect(ctx, -w/2 + 6, -h/2 + 20, w - 12, 20, 5);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.neonBlue;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, -h/2 + 30, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = GameObjects.COLORS.white;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 10, h/2 - 15, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 10, h/2 - 15, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 3, 0, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 3, 0, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWatermelonCar(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.fillStyle = this.color;
        Utils.drawRoundRect(ctx, -w/2 + 3, -h/2 + 10, w - 6, h - 20, 15);
        ctx.fill();
        
        ctx.strokeStyle = this.secondColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w/2 + 8, -h/2 + 15);
        ctx.lineTo(-w/2 + 8, h/2 - 15);
        ctx.moveTo(w/2 - 8, -h/2 + 15);
        ctx.lineTo(w/2 - 8, h/2 - 15);
        ctx.stroke();
        
        ctx.fillStyle = this.secondColor;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(
                Utils.random(-w/2 + 12, w/2 - 12),
                Utils.random(-h/2 + 25, h/2 - 25),
                3,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        Utils.drawRoundRect(ctx, -w/2 + 6, -h/2 + 12, w - 12, 18, 5);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 3, -h/3, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 3, -h/3, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-w/2 + 3, h/3, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 3, h/3, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTruck(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.fillStyle = this.secondColor;
        Utils.drawRoundRect(ctx, -w/2 + 3, -h/2, w - 6, 35, 8);
        ctx.fill();
        
        ctx.fillStyle = this.color;
        Utils.drawRoundRect(ctx, -w/2 + 5, -h/2 + 35, w - 10, h - 45, 8);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        Utils.drawRoundRect(ctx, -w/2 + 8, -h/2 + 8, w - 16, 18, 4);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.neonBlue;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, -h/2 + 17, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = this.secondColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-w/2 + 8, -h/2 + 55 + i * 15);
            ctx.lineTo(w/2 - 8, -h/2 + 55 + i * 15);
            ctx.stroke();
        }
        
        ctx.fillStyle = GameObjects.COLORS.trackDark;
        ctx.beginPath();
        ctx.ellipse(-w/2 + 3, -h/2 + 20, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 3, -h/2 + 20, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-w/2 + 3, h/2 - 20, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w/2 - 3, h/2 - 20, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x + 3,
            y: this.y + 3,
            width: this.width - 6,
            height: this.height - 6
        };
    }
}

class PowerUp {
    constructor(game, type, lane, y) {
        this.game = game;
        this.type = type;
        this.lane = lane;
        this.y = y;
        this.x = 0;
        this.width = 30;
        this.height = 30;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
        this.collectAlpha = 0;
    }

    update(speed, width, deltaTime) {
        const laneWidth = width / 3;
        this.x = laneWidth * this.lane + laneWidth / 2 - this.width / 2;
        this.y += speed;
        this.bobOffset += deltaTime * 0.003;
        
        if (this.collectAlpha > 0) {
            this.collectAlpha -= 0.05;
        }
    }

    draw(ctx) {
        ctx.save();
        
        const bobY = Math.sin(this.bobOffset) * 3;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bobY);
        
        if (this.collectAlpha > 0) {
            ctx.globalAlpha = 1 - this.collectAlpha;
            ctx.scale(1 + this.collectAlpha, 1 + this.collectAlpha);
        }
        
        if (this.type === 'fuel') {
            this.drawFuel(ctx);
        } else if (this.type === 'nitro') {
            this.drawNitro(ctx);
        } else if (this.type === 'barrier') {
            this.drawBarrier(ctx);
        } else if (this.type === 'checkpoint') {
            this.drawCheckpoint(ctx);
        }
        
        ctx.restore();
    }

    drawFuel(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.shadowColor = GameObjects.COLORS.brightYellow;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = GameObjects.COLORS.brightYellow;
        Utils.drawRoundRect(ctx, -w/2 + 5, -h/2 + 8, w - 10, h - 12, 4);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.orange;
        ctx.fillRect(-w/2 + 8, -h/2, w - 16, 10);
        
        ctx.fillStyle = GameObjects.COLORS.orange;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('F', 0, 5);
        
        ctx.shadowBlur = 0;
    }

    drawNitro(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.shadowColor = GameObjects.COLORS.neonBlue;
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = GameObjects.COLORS.neonBlue;
        Utils.drawRoundRect(ctx, -w/2 + 3, -h/2 + 5, w - 6, h - 10, 5);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.neonPurple;
        ctx.fillRect(-w/2 + 6, -h/2, w - 12, 8);
        
        ctx.fillStyle = GameObjects.COLORS.white;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 0, 5);
        
        ctx.shadowBlur = 0;
    }

    drawBarrier(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.shadowColor = GameObjects.COLORS.red;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = GameObjects.COLORS.red;
        Utils.drawRoundRect(ctx, -w/2, -h/2, w, h, 8);
        ctx.fill();
        
        ctx.fillStyle = GameObjects.COLORS.white;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-w/2, -h/2 + 8 + i * 10, w, 4);
        }
        
        ctx.fillStyle = GameObjects.COLORS.white;
        ctx.beginPath();
        ctx.arc(0, -h/2 - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    drawCheckpoint(ctx) {
        const w = this.width;
        const h = this.height;
        
        ctx.shadowColor = GameObjects.COLORS.green;
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = GameObjects.COLORS.green;
        Utils.drawRoundRect(ctx, -w/2, -h/2, w, h, 5);
        ctx.fill();
        
        ctx.strokeStyle = GameObjects.COLORS.white;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/2 + 5, -h/2 + 5);
        ctx.lineTo(-w/2 + 5, h/2 - 5);
        ctx.lineTo(w/2 - 5, h/2 - 5);
        ctx.lineTo(w/2 - 5, -h/2 + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-w/2 + 12, -h/2 + 10);
        ctx.lineTo(0, h/2 - 10);
        ctx.lineTo(w/2 - 12, -h/2 + 10);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Effect {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.life = 1;
        this.maxLife = 1;
        this.setProperties();
    }

    setProperties() {
        if (this.type === 'skidMark') {
            this.life = 0.8;
            this.maxLife = 0.8;
            this.width = 8;
            this.height = 15;
            this.color = Utils.hslToHex(Math.random() * 360, 80, 60);
        } else if (this.type === 'star') {
            this.life = 0.5;
            this.maxLife = 0.5;
            this.size = Utils.random(8, 15);
            this.vx = Utils.random(-2, 2);
            this.vy = Utils.random(-3, -1);
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Utils.random(-0.2, 0.2);
        } else if (this.type === 'flame') {
            this.life = 0.2;
            this.maxLife = 0.2;
            this.size = Utils.random(15, 25);
            this.vy = Utils.random(1, 3);
        } else if (this.type === 'nitroActivated') {
            this.life = 0.6;
            this.maxLife = 0.6;
            this.rings = [];
            for (let i = 0; i < 3; i++) {
                this.rings.push({
                    radius: 10 + i * 15,
                    maxRadius: 60 + i * 20
                });
            }
        } else if (this.type === 'hit') {
            this.life = 0.4;
            this.maxLife = 0.4;
            this.particles = [];
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.particles.push({
                    x: 0,
                    y: 0,
                    vx: Math.cos(angle) * Utils.random(2, 5),
                    vy: Math.sin(angle) * Utils.random(2, 5),
                    size: Utils.random(3, 6)
                });
            }
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67;
        this.life -= dt * 0.03;
        
        if (this.type === 'star' || this.type === 'flame') {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.type === 'star') {
                this.rotation += this.rotationSpeed;
            }
        }
        
        if (this.type === 'nitroActivated') {
            for (let ring of this.rings) {
                ring.radius += (ring.maxRadius - ring.radius) * 0.1;
            }
        }
        
        if (this.type === 'hit') {
            for (let p of this.particles) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 0.1 * dt;
            }
        }
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        if (alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (this.type === 'skidMark') {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha * 0.6;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
        } else if (this.type === 'flame') {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, GameObjects.COLORS.brightYellow);
            gradient.addColorStop(0.5, GameObjects.COLORS.orange);
            gradient.addColorStop(1, GameObjects.COLORS.red);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'nitroActivated') {
            for (let i = this.rings.length - 1; i >= 0; i--) {
                const ring = this.rings[i];
                ctx.strokeStyle = i === 0 ? GameObjects.COLORS.neonBlue : 
                                   i === 1 ? GameObjects.COLORS.neonPurple : GameObjects.COLORS.neonPink;
                ctx.lineWidth = 3;
                ctx.globalAlpha = alpha * (1 - i * 0.3);
                ctx.beginPath();
                ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (this.type === 'hit') {
            ctx.fillStyle = GameObjects.COLORS.brightYellow;
            for (let p of this.particles) {
                ctx.beginPath();
                ctx.arc(this.x + p.x, this.y + p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.fillStyle = GameObjects.COLORS.brightYellow;
        ctx.shadowColor = GameObjects.COLORS.brightYellow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isDead() {
        return this.life <= 0;
    }
}
