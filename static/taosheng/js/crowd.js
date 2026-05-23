class CrowdNPC {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GameConfig.CROWD.NPC_WIDTH;
        this.height = GameConfig.CROWD.NPC_HEIGHT;
        this.speed = GameConfig.CROWD.BASE_SPEED;
        
        this.state = 'panic';
        this.targetX = x;
        this.targetY = y;
        this.stateTimer = 0;
        
        this.color = this.getRandomColor();
        this.shirtColor = this.getRandomShirtColor();
        
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.stuckTimer = 0;
        this.groupId = Math.floor(Math.random() * 5);
    }
    
    getRandomColor() {
        const colors = ['#8b4513', '#654321', '#d2691e', '#a0522d', '#deb887'];
        return Utils.randomChoice(colors);
    }
    
    getRandomShirtColor() {
        const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
        return Utils.randomChoice(colors);
    }
    
    update(deltaTime, player, scene) {
        this.stateTimer += deltaTime;
        
        switch (this.state) {
            case 'panic':
                this.updatePanic(deltaTime);
                break;
            case 'flee':
                this.updateFlee(deltaTime, player);
                break;
            case 'stuck':
                this.updateStuck(deltaTime);
                break;
            case 'evacuate':
                this.updateEvacuate(deltaTime, scene);
                break;
            case 'crowd':
                this.updateCrowd(deltaTime, scene);
                break;
        }
        
        if (this.state !== 'stuck' && this.state !== 'crowd') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                const normalized = Utils.normalize(dx, dy);
                const newX = this.x + normalized.x * this.speed;
                const newY = this.y + normalized.y * this.speed;
                
                const rect = { x: newX, y: newY, w: this.width, h: this.height };
                if (!scene.checkObstacleCollision(rect)) {
                    this.x = newX;
                    this.y = newY;
                    this.animTimer += deltaTime;
                    if (this.animTimer > 150) {
                        this.animTimer = 0;
                        this.animFrame = (this.animFrame + 1) % 4;
                    }
                } else {
                    this.stuckTimer += deltaTime;
                    if (this.stuckTimer > 800) {
                        this.state = 'stuck';
                        this.stateTimer = 0;
                        this.stuckTimer = 0;
                    }
                }
            } else {
                this.setRandomTarget();
            }
        } else if (this.state === 'crowd') {
            this.animTimer += deltaTime;
            if (this.animTimer > 200) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }
        }
        
        this.x = Utils.clamp(this.x, 0, GameConfig.CANVAS_WIDTH - this.width);
        this.y = Utils.clamp(this.y, 0, GameConfig.CANVAS_HEIGHT - this.height);
    }
    
    updatePanic(deltaTime) {
        if (this.stateTimer > Utils.randomRange(800, 2000)) {
            const states = ['panic', 'flee', 'stuck', 'crowd'];
            this.state = Utils.randomChoice(states);
            this.stateTimer = 0;
            if (this.state === 'flee') {
                this.setRandomTarget();
            }
        }
        
        if (Math.random() < 0.03) {
            this.setRandomTarget();
        }
    }
    
    updateFlee(deltaTime, player) {
        if (this.stateTimer > Utils.randomRange(1500, 3000)) {
            this.state = Utils.randomChoice(['panic', 'flee', 'crowd']);
            this.stateTimer = 0;
        }
        
        if (player) {
            const dist = Utils.distance(this.x, this.y, player.x, player.y);
            if (dist < 120) {
                const awayX = this.x - (player.x - this.x);
                const awayY = this.y - (player.y - this.y);
                this.targetX = Utils.clamp(awayX, 50, GameConfig.CANVAS_WIDTH - 50);
                this.targetY = Utils.clamp(awayY, 50, GameConfig.CANVAS_HEIGHT - 50);
            }
        }
    }
    
    updateStuck(deltaTime) {
        if (this.stateTimer > Utils.randomRange(400, 1200)) {
            this.state = Utils.randomChoice(['panic', 'flee', 'crowd']);
            this.stateTimer = 0;
            if (this.state === 'flee') {
                this.setRandomTarget();
            }
        }
    }
    
    updateCrowd(deltaTime, scene) {
        if (this.stateTimer > Utils.randomRange(2000, 4000)) {
            this.state = Utils.randomChoice(['panic', 'flee']);
            this.stateTimer = 0;
            if (this.state === 'flee') {
                this.setRandomTarget();
            }
        }
        
        this.speed = GameConfig.CROWD.BASE_SPEED * 0.3;
    }
    
    updateEvacuate(deltaTime, scene) {
        this.targetX = GameConfig.EXIT.X;
        this.targetY = GameConfig.EXIT.Y + Utils.randomRange(-30, 30);
        
        if (Utils.distance(this.x, this.y, this.targetX, this.targetY) < 50) {
            this.x = -100;
            this.y = -100;
        }
    }
    
    setRandomTarget() {
        this.targetX = Utils.randomRange(50, GameConfig.CANVAS_WIDTH - 50);
        this.targetY = Utils.randomRange(50, GameConfig.CANVAS_HEIGHT - 50);
    }
    
    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }
    
    render(ctx) {
        if (this.x < -50 || this.y < -50) return;
        
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        if (this.state === 'crowd' || this.state === 'stuck') {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.width, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = this.shirtColor;
        Utils.drawRoundedRect(ctx, this.x + 4, this.y + 12, this.width - 8, this.height - 18, 4);
        ctx.fill();
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(centerX, this.y + 8, 7, 0, Math.PI * 2);
        ctx.fill();
        
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 6, this.y + this.height - 8, 5, 8 + legOffset);
        ctx.fillRect(this.x + this.width - 11, this.y + this.height - 8, 5, 8 - legOffset);
        
        if (this.state === 'panic') {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(centerX - 5, this.y + 5);
            ctx.lineTo(centerX, this.y - 5);
            ctx.lineTo(centerX + 5, this.y + 5);
            ctx.closePath();
            ctx.fill();
        } else if (this.state === 'stuck') {
            ctx.fillStyle = '#f39c12';
            ctx.font = '12px Arial';
            ctx.fillText('!', centerX - 2, this.y);
        } else if (this.state === 'crowd') {
            ctx.fillStyle = '#9b59b6';
            ctx.font = '10px Arial';
            ctx.fillText('挤', centerX - 6, this.y);
        }
        
        ctx.restore();
    }
}

class CrowdManager {
    constructor() {
        this.npcs = [];
        this.phaseMultiplier = 1;
    }
    
    reset(scene) {
        this.npcs = [];
        this.phaseMultiplier = 1;
        this.spawnInitialCrowd(scene);
    }
    
    spawnInitialCrowd(scene) {
        const count = Utils.randomInt(GameConfig.CROWD.MIN_COUNT, GameConfig.CROWD.MAX_COUNT);
        for (let i = 0; i < count; i++) {
            this.spawnNPC(scene);
        }
    }
    
    spawnNPC(scene) {
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            x = Utils.randomRange(50, GameConfig.CANVAS_WIDTH - 80);
            y = Utils.randomRange(50, GameConfig.CANVAS_HEIGHT - 80);
            attempts++;
        } while (scene.checkObstacleCollision({ x, y, w: GameConfig.CROWD.NPC_WIDTH, h: GameConfig.CROWD.NPC_HEIGHT }) && attempts < maxAttempts);
        
        if (attempts < maxAttempts) {
            const npc = new CrowdNPC(x, y);
            this.npcs.push(npc);
        }
    }
    
    setPhaseMultiplier(multiplier) {
        this.phaseMultiplier = multiplier;
    }
    
    update(deltaTime, player, scene) {
        const targetCount = Math.floor(GameConfig.CROWD.MAX_COUNT * this.phaseMultiplier);
        if (this.npcs.length < targetCount && Math.random() < 0.05) {
            this.spawnNPC(scene);
        }
        
        this.npcs = this.npcs.filter(npc => npc.x > -50 && npc.y > -50);
        
        this.npcs.forEach(npc => {
            npc.speed = GameConfig.CROWD.BASE_SPEED * (0.6 + Math.random() * 0.3);
            
            if (scene.isInCollapseZone(npc.getRect())) {
                npc.state = 'evacuate';
            }
            
            npc.update(deltaTime, player, scene);
        });
        
        this.resolveNPCOverlaps();
    }
    
    resolveNPCOverlaps() {
        const pushDistance = 5;
        
        for (let i = 0; i < this.npcs.length; i++) {
            for (let j = i + 1; j < this.npcs.length; j++) {
                const npc1 = this.npcs[i];
                const npc2 = this.npcs[j];
                
                if (Utils.rectCollision(npc1.getRect(), npc2.getRect())) {
                    const dx = npc1.x - npc2.x;
                    const dy = npc1.y - npc2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        const pushX = (dx / dist) * pushDistance;
                        const pushY = (dy / dist) * pushDistance;
                        
                        npc1.x += pushX;
                        npc1.y += pushY;
                        npc2.x -= pushX;
                        npc2.y -= pushY;
                    }
                }
            }
        }
    }
    
    getCrowdSlowFactor(x, y) {
        let nearbyCount = 0;
        const slowRadius = 70;
        
        this.npcs.forEach(npc => {
            if (npc.state === 'evacuate') return;
            const dist = Utils.distance(x, y, npc.x + npc.width / 2, npc.y + npc.height / 2);
            if (dist < slowRadius) {
                nearbyCount++;
            }
        });
        
        if (nearbyCount === 0) return 1;
        if (nearbyCount <= 2) return 0.7;
        if (nearbyCount <= 4) return 0.5;
        if (nearbyCount <= 6) return 0.3;
        return 0.15;
    }
    
    clearArea(x, y, radius) {
        let clearedCount = 0;
        this.npcs.forEach(npc => {
            const dist = Utils.distance(x, y, npc.x + npc.width / 2, npc.y + npc.height / 2);
            if (dist < radius) {
                npc.state = 'evacuate';
                clearedCount++;
            }
        });
        return clearedCount;
    }
    
    checkPlayerCollision(playerRect) {
        for (const npc of this.npcs) {
            if (npc.state === 'evacuate') continue;
            if (Utils.rectCollision(playerRect, npc.getRect())) {
                return true;
            }
        }
        return false;
    }
    
    getDensityAtPoint(x, y) {
        let density = 0;
        const checkRadius = 80;
        
        this.npcs.forEach(npc => {
            if (npc.state === 'evacuate') return;
            const dist = Utils.distance(x, y, npc.x + npc.width / 2, npc.y + npc.height / 2);
            if (dist < checkRadius) {
                density += Math.max(0, 1 - dist / checkRadius);
            }
        });
        
        return density;
    }
    
    isHighDensityArea(x, y) {
        return this.getDensityAtPoint(x, y) > 3;
    }
    
    render(ctx) {
        this.npcs.forEach(npc => npc.render(ctx));
    }
    
    getState() {
        return {
            npcs: this.npcs.map(npc => ({
                x: npc.x,
                y: npc.y,
                state: npc.state,
                targetX: npc.targetX,
                targetY: npc.targetY,
                color: npc.color,
                shirtColor: npc.shirtColor
            })),
            phaseMultiplier: this.phaseMultiplier
        };
    }
    
    loadState(state, scene) {
        if (!state) return;
        
        this.npcs = state.npcs.map(data => {
            const npc = new CrowdNPC(data.x, data.y);
            npc.state = data.state;
            npc.targetX = data.targetX;
            npc.targetY = data.targetY;
            npc.color = data.color;
            npc.shirtColor = data.shirtColor;
            return npc;
        });
        this.phaseMultiplier = state.phaseMultiplier;
    }
}
