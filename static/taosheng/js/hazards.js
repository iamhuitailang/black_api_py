class Hazard {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.active = true;
        this.landed = false;
        this.landTimer = 0;
        
        switch (type) {
            case 'rock':
                this.size = Utils.randomInt(GameConfig.HAZARDS.ROCK.MIN_SIZE, GameConfig.HAZARDS.ROCK.MAX_SIZE);
                this.width = this.size;
                this.height = this.size;
                this.speed = Utils.randomRange(GameConfig.HAZARDS.ROCK.MIN_SPEED, GameConfig.HAZARDS.ROCK.MAX_SPEED);
                this.damage = GameConfig.HAZARDS.ROCK.DAMAGE;
                this.color = '#7f8c8d';
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = Utils.randomRange(-0.1, 0.1);
                break;
            case 'rail':
                this.width = GameConfig.HAZARDS.RAIL.WIDTH;
                this.height = GameConfig.HAZARDS.RAIL.HEIGHT;
                this.speed = Utils.randomRange(GameConfig.HAZARDS.RAIL.MIN_SPEED, GameConfig.HAZARDS.RAIL.MAX_SPEED);
                this.damage = GameConfig.HAZARDS.RAIL.DAMAGE;
                this.color = '#95a5a6';
                this.rotation = Utils.randomRange(-0.3, 0.3);
                break;
            case 'seat':
                this.width = GameConfig.HAZARDS.SEAT.WIDTH;
                this.height = GameConfig.HAZARDS.SEAT.HEIGHT;
                this.speed = GameConfig.HAZARDS.SEAT.FALL_SPEED;
                this.damage = GameConfig.HAZARDS.SEAT.DAMAGE;
                this.color = '#c0392b';
                this.fallRotation = 0;
                this.targetRotation = Utils.randomRange(-Math.PI / 4, Math.PI / 4);
                break;
            case 'wall':
                this.width = Utils.randomInt(GameConfig.HAZARDS.WALL.MIN_WIDTH, GameConfig.HAZARDS.WALL.MAX_WIDTH);
                this.height = GameConfig.HAZARDS.WALL.HEIGHT;
                this.speed = GameConfig.HAZARDS.WALL.FALL_SPEED;
                this.damage = GameConfig.HAZARDS.WALL.DAMAGE;
                this.color = '#34495e';
                break;
        }
        
        this.warningRadius = this.width * 1.5;
        this.warningTime = 500;
        this.warningTimer = 0;
        this.showWarning = true;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        if (this.showWarning) {
            this.warningTimer += deltaTime;
            if (this.warningTimer >= this.warningTime) {
                this.showWarning = false;
            }
            return;
        }
        
        this.y += this.speed;
        
        if (this.type === 'rock') {
            this.rotation += this.rotationSpeed;
        }
        
        if (this.type === 'seat') {
            this.fallRotation = Utils.lerp(this.fallRotation, this.targetRotation, 0.05);
        }
        
        if (this.y > GameConfig.CANVAS_HEIGHT) {
            this.landed = true;
            this.landTimer += deltaTime;
            if (this.landTimer > 500) {
                this.active = false;
            }
        }
    }
    
    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }
    
    canDamage() {
        return !this.showWarning && this.active;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        if (this.showWarning) {
            const alpha = 0.3 + Math.sin(this.warningTimer / 50) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.warningRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.warningRadius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            ctx.translate(centerX, centerY);
            
            switch (this.type) {
                case 'rock':
                    ctx.rotate(this.rotation);
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const radius = this.size / 2 * (0.8 + Math.sin(i * 1.5) * 0.2);
                        const px = Math.cos(angle) * radius;
                        const py = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.beginPath();
                    ctx.arc(-this.size / 6, -this.size / 6, this.size / 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'rail':
                    ctx.rotate(this.rotation);
                    ctx.fillStyle = this.color;
                    Utils.drawRoundedRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 3);
                    ctx.fill();
                    
                    ctx.fillStyle = '#7f8c8d';
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(-this.width / 2 + 5 + i * 12, -this.height / 2, 8, this.height);
                    }
                    break;
                    
                case 'seat':
                    ctx.rotate(this.fallRotation);
                    ctx.fillStyle = '#34495e';
                    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height / 3);
                    
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-this.width / 2, -this.height / 2 + this.height / 3, this.width, this.height * 2 / 3);
                    
                    ctx.fillStyle = '#922b21';
                    ctx.fillRect(-this.width / 2 + 3, -this.height / 2 + this.height / 3 + 3, this.width - 6, 5);
                    break;
                    
                case 'wall':
                    ctx.fillStyle = this.color;
                    Utils.drawRoundedRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 4);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#2c3e50';
                    ctx.lineWidth = 1;
                    const brickWidth = 25;
                    const brickHeight = 10;
                    for (let row = 0; row < 2; row++) {
                        for (let col = 0; col < Math.floor(this.width / brickWidth); col++) {
                            const offset = row % 2 === 0 ? 0 : brickWidth / 2;
                            ctx.strokeRect(
                                -this.width / 2 + col * brickWidth + offset,
                                -this.height / 2 + row * brickHeight,
                                brickWidth,
                                brickHeight
                            );
                        }
                    }
                    break;
            }
        }
        
        ctx.restore();
    }
}

class HazardManager {
    constructor() {
        this.hazards = [];
        this.spawnTimers = {
            rock: 0,
            rail: 0,
            seat: 0,
            wall: 0
        };
        this.phaseMultiplier = 1;
        this.dodgedCount = 0;
    }
    
    reset() {
        this.hazards = [];
        this.spawnTimers = { rock: 0, rail: 0, seat: 0, wall: 0 };
        this.phaseMultiplier = 1;
        this.dodgedCount = 0;
    }
    
    setPhaseMultiplier(multiplier) {
        this.phaseMultiplier = multiplier;
    }
    
    update(deltaTime, scene) {
        this.hazards = this.hazards.filter(h => h.active);
        
        this.hazards.forEach(h => h.update(deltaTime));
        
        this.spawnTimers.rock += deltaTime;
        this.spawnTimers.rail += deltaTime;
        this.spawnTimers.seat += deltaTime;
        this.spawnTimers.wall += deltaTime;
        
        const rockInterval = GameConfig.HAZARDS.ROCK.SPAWN_INTERVAL / this.phaseMultiplier;
        const railInterval = GameConfig.HAZARDS.RAIL.SPAWN_INTERVAL / this.phaseMultiplier;
        const seatInterval = GameConfig.HAZARDS.SEAT.SPAWN_INTERVAL / this.phaseMultiplier;
        const wallInterval = GameConfig.HAZARDS.WALL.SPAWN_INTERVAL / this.phaseMultiplier;
        
        if (this.spawnTimers.rock >= rockInterval) {
            this.spawnHazard('rock', scene);
            this.spawnTimers.rock = 0;
        }
        
        if (this.spawnTimers.rail >= railInterval) {
            this.spawnHazard('rail', scene);
            this.spawnTimers.rail = 0;
        }
        
        if (this.spawnTimers.seat >= seatInterval) {
            this.spawnHazard('seat', scene);
            this.spawnTimers.seat = 0;
        }
        
        if (this.spawnTimers.wall >= wallInterval) {
            this.spawnHazard('wall', scene);
            this.spawnTimers.wall = 0;
        }
    }
    
    spawnHazard(type, scene) {
        let x, y;
        
        switch (type) {
            case 'rock':
                x = Utils.randomRange(50, GameConfig.CANVAS_WIDTH - 80);
                y = -50;
                break;
            case 'rail':
                x = Utils.randomRange(0, GameConfig.CANVAS_WIDTH - GameConfig.HAZARDS.RAIL.WIDTH);
                y = -30;
                break;
            case 'seat':
                x = Utils.randomRange(50, GameConfig.CANVAS_WIDTH - 85);
                y = -60;
                break;
            case 'wall':
                x = Utils.randomRange(0, GameConfig.CANVAS_WIDTH - GameConfig.HAZARDS.WALL.MAX_WIDTH);
                y = -40;
                break;
        }
        
        if (scene) {
            const spawnRect = { x, y: 0, w: 60, h: 60 };
            if (scene.isInCollapseZone(spawnRect)) {
                const sideZoneWidth = scene.collapseZones[0]?.w || 0;
                if (x < sideZoneWidth) {
                    x = sideZoneWidth + 20;
                } else if (x > GameConfig.CANVAS_WIDTH - sideZoneWidth - 60) {
                    x = GameConfig.CANVAS_WIDTH - sideZoneWidth - 80;
                }
                x = Utils.clamp(x, 50, GameConfig.CANVAS_WIDTH - 80);
            }
        }
        
        const hazard = new Hazard(type, x, y);
        this.hazards.push(hazard);
    }
    
    checkPlayerCollision(player) {
        let totalDamage = 0;
        
        this.hazards.forEach(hazard => {
            if (hazard.canDamage() && Utils.rectCollision(hazard.getRect(), player.getRect())) {
                totalDamage += hazard.damage;
                hazard.active = false;
                player.dodgedCount++;
            }
        });
        
        return totalDamage;
    }
    
    render(ctx) {
        this.hazards.forEach(h => h.render(ctx));
    }
    
    getState() {
        return {
            hazards: this.hazards.map(h => ({
                type: h.type,
                x: h.x,
                y: h.y,
                size: h.size,
                width: h.width,
                height: h.height,
                speed: h.speed,
                rotation: h.rotation,
                fallRotation: h.fallRotation,
                targetRotation: h.targetRotation,
                showWarning: h.showWarning,
                warningTimer: h.warningTimer,
                active: h.active
            })),
            spawnTimers: { ...this.spawnTimers },
            phaseMultiplier: this.phaseMultiplier,
            dodgedCount: this.dodgedCount
        };
    }
    
    loadState(state) {
        if (!state) return;
        
        this.hazards = state.hazards.map(h => {
            const hazard = new Hazard(h.type, h.x, h.y);
            hazard.size = h.size;
            hazard.width = h.width;
            hazard.height = h.height;
            hazard.speed = h.speed;
            hazard.rotation = h.rotation;
            hazard.fallRotation = h.fallRotation;
            hazard.targetRotation = h.targetRotation;
            hazard.showWarning = h.showWarning;
            hazard.warningTimer = h.warningTimer;
            hazard.active = h.active;
            return hazard;
        });
        this.spawnTimers = { ...state.spawnTimers };
        this.phaseMultiplier = state.phaseMultiplier;
        this.dodgedCount = state.dodgedCount;
    }
}
