const CONFIG = {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    JUMP_HOLD_BOOST: -0.3,
    MAX_JUMP_HOLD: 15,
    BASE_SPEED: 5,
    SPEED_INCREMENT: 0.001,
    MAX_SPEED: 12,
    GROUND_Y: 320,
    PLAYER_WIDTH: 32,
    PLAYER_HEIGHT: 32,
    TERRAIN_SWITCH_DISTANCE: 2000,
    INVINCIBLE_DURATION: 180,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    INITIAL_LIVES: 3,
    RING_SCORE: 100,
    DISTANCE_SCORE_MULTIPLIER: 1
};

const TERRAIN_TYPES = {
    GRASS: {
        name: '草地',
        groundColor: '#228B22',
        groundDark: '#1a6b1a',
        skyColor: '#87CEEB',
        skyColor2: '#98D8E8',
        obstacleRate: 0.02,
        pitRate: 0.01,
        ringRate: 0.04,
        springRate: 0.005,
        starRate: 0.003
    },
    FACTORY: {
        name: '工厂',
        groundColor: '#4a4a4a',
        groundDark: '#333333',
        skyColor: '#607D8B',
        skyColor2: '#455A64',
        obstacleRate: 0.035,
        pitRate: 0.02,
        ringRate: 0.05,
        springRate: 0.008,
        starRate: 0.004
    },
    VOLCANO: {
        name: '火山',
        groundColor: '#8B0000',
        groundDark: '#5c0000',
        skyColor: '#FF5722',
        skyColor2: '#BF360C',
        obstacleRate: 0.05,
        pitRate: 0.03,
        ringRate: 0.06,
        springRate: 0.01,
        starRate: 0.005,
        hasLava: true
    }
};

const TERRAIN_ORDER = ['GRASS', 'FACTORY', 'VOLCANO'];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.life = 30;
        this.maxLife = 30;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life--;
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
        ctx.restore();
    }
}

class Player {
    constructor() {
        this.x = 100;
        this.y = CONFIG.GROUND_Y - CONFIG.PLAYER_HEIGHT;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.vy = 0;
        this.isJumping = false;
        this.isOnGround = true;
        this.jumpHoldTime = 0;
        this.isJumpHeld = false;
        this.runFrame = 0;
        this.rotation = 0;
        this.isBall = false;
        this.lives = CONFIG.INITIAL_LIVES;
        this.invincibleTimer = 0;
        this.flashTimer = 0;
    }

    jump() {
        if (this.isOnGround) {
            this.vy = CONFIG.JUMP_FORCE;
            this.isJumping = true;
            this.isOnGround = false;
            this.jumpHoldTime = 0;
            this.isJumpHeld = true;
            this.isBall = true;
        }
    }

    jumpBoost() {
        if (this.isJumping && this.jumpHoldTime < CONFIG.MAX_JUMP_HOLD && this.isJumpHeld) {
            this.vy += CONFIG.JUMP_HOLD_BOOST;
            this.jumpHoldTime++;
        }
    }

    releaseJump() {
        this.isJumpHeld = false;
    }

    springJump() {
        this.vy = CONFIG.JUMP_FORCE * 1.8;
        this.isJumping = true;
        this.isOnGround = false;
        this.isBall = true;
    }

    hit() {
        if (this.invincibleTimer > 0) return false;
        
        this.lives--;
        this.invincibleTimer = 120;
        this.flashTimer = 0;
        return true;
    }

    makeInvincible() {
        this.invincibleTimer = CONFIG.INVINCIBLE_DURATION;
    }

    update(speed, groundY) {
        this.vy += CONFIG.GRAVITY;
        this.y += this.vy;

        if (this.y >= groundY - this.height) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.isJumping = false;
            this.isOnGround = true;
            this.isBall = false;
            this.jumpHoldTime = 0;
        }

        if (this.isJumping) {
            this.rotation += speed * 0.15;
            this.isBall = true;
        } else {
            this.rotation = 0;
            this.runFrame = (this.runFrame + speed * 0.15) % 4;
        }

        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            this.flashTimer++;
        }
    }

    render(ctx) {
        if (this.invincibleTimer > 0 && this.flashTimer % 6 < 3) {
            ctx.save();
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.isBall) {
            ctx.rotate(this.rotation);
            this.drawBall(ctx);
        } else {
            this.drawRunning(ctx);
        }

        ctx.restore();

        if (this.invincibleTimer > 0) {
            ctx.restore();
        }
    }

    drawBall(ctx) {
        const size = this.width;
        const half = size / 2;
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? half : half * 0.7;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000033';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.arc(half * 0.3, 0, half * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000033';
        ctx.fillRect(half * 0.3 - 2, -4, 4, 4);
    }

    drawRunning(ctx) {
        const w = this.width;
        const h = this.height;
        const frame = Math.floor(this.runFrame);

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(-w/2 + 4, -h/2);
        ctx.lineTo(-w/2 + 8, -h/2 + 4);
        ctx.lineTo(-w/2 + 14, -h/2);
        ctx.lineTo(-w/2 + 20, -h/2 + 4);
        ctx.lineTo(-w/2 + 26, -h/2);
        ctx.lineTo(w/2 - 4, -h/2 + 8);
        ctx.lineTo(w/2 - 2, 0);
        ctx.lineTo(w/2 - 4, h/2 - 8);
        ctx.lineTo(0, h/2);
        ctx.lineTo(-w/2 + 4, h/2 - 8);
        ctx.lineTo(-w/2 + 2, 0);
        ctx.lineTo(-w/2 + 4, -h/2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000033';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(w/2 - 10, 2, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000033';
        ctx.fillRect(w/2 - 14, -4, 4, 4);

        const legOffset = [0, 3, 0, -3][frame];
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-w/2 + 6, h/2 - 8, 6, 8 + legOffset);
        ctx.fillRect(w/2 - 14, h/2 - 8, 6, 8 - legOffset);
    }
}

class Obstacle {
    constructor(type, x, groundY) {
        this.type = type;
        this.x = x;
        this.groundY = groundY;
        
        if (type === 'spike') {
            this.width = 24;
            this.height = 24;
            this.y = groundY - this.height;
        } else if (type === 'pit') {
            this.width = 60 + Math.random() * 40;
            this.height = 100;
            this.y = groundY;
        }
    }

    update(speed) {
        this.x -= speed;
    }

    render(ctx, terrain) {
        if (this.type === 'spike') {
            this.drawSpike(ctx);
        } else if (this.type === 'pit') {
            this.drawPit(ctx, terrain);
        }
    }

    drawSpike(ctx) {
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#000033';
        ctx.lineWidth = 2;

        for (let i = 0; i < 3; i++) {
            const sx = this.x + i * 8;
            ctx.beginPath();
            ctx.moveTo(sx, this.y + this.height);
            ctx.lineTo(sx + 4, this.y);
            ctx.lineTo(sx + 8, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = '#AAA';
        for (let i = 0; i < 3; i++) {
            const sx = this.x + i * 8;
            ctx.fillRect(sx + 2, this.y + 4, 2, 8);
        }
    }

    drawPit(ctx, terrain) {
        ctx.fillStyle = '#111';
        ctx.fillRect(this.x, this.y, this.width, CONFIG.CANVAS_HEIGHT - this.y);

        if (terrain && terrain.hasLava) {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(this.x, this.y + 20, this.width, 10);
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < this.width; i += 10) {
                ctx.fillRect(this.x + i + Math.random() * 5, this.y + 15, 3, 8);
            }
        }
    }

    getHitbox() {
        if (this.type === 'spike') {
            return {
                x: this.x + 4,
                y: this.y + 4,
                width: this.width - 8,
                height: this.height - 4
            };
        } else if (this.type === 'pit') {
            return {
                x: this.x + 5,
                y: this.y - 30,
                width: this.width - 10,
                height: 40
            };
        }
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

class Ring {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.frame = 0;
    }

    update(speed) {
        this.x -= speed;
        this.frame += 0.2;
    }

    render(ctx) {
        if (this.collected) return;

        const bobY = Math.sin(this.frame + this.bobOffset) * 3;
        const drawY = this.y + bobY;

        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, drawY + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, drawY + this.height/2, this.width/3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + this.width/2 - 2, drawY + 4, 2, 4);

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Spring {
    constructor(x, groundY) {
        this.x = x;
        this.y = groundY - 20;
        this.width = 32;
        this.height = 20;
        this.compressed = false;
        this.compressTimer = 0;
    }

    update(speed) {
        this.x -= speed;
        if (this.compressed) {
            this.compressTimer--;
            if (this.compressTimer <= 0) {
                this.compressed = false;
            }
        }
    }

    bounce() {
        this.compressed = true;
        this.compressTimer = 10;
    }

    render(ctx) {
        const compressAmount = this.compressed ? 8 : 0;

        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(this.x, this.y + compressAmount, this.width, 4);

        ctx.fillStyle = '#999';
        for (let i = 0; i < 3; i++) {
            const y = this.y + 6 + compressAmount + i * 4;
            ctx.fillRect(this.x + 4, y, this.width - 8, 2);
        }

        ctx.fillStyle = '#666';
        ctx.fillRect(this.x, this.y + this.height - 4, this.width, 4);

        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(this.x + 2, this.y + compressAmount - 2, this.width - 4, 4);
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y - 5,
            width: this.width,
            height: 10
        };
    }
}

class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.collected = false;
        this.rotation = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update(speed) {
        this.x -= speed;
        this.rotation += 0.1;
    }

    render(ctx) {
        if (this.collected) return;

        const bobY = Math.sin(Date.now() * 0.005 + this.bobOffset) * 4;

        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2 + bobY);
        ctx.rotate(this.rotation);

        ctx.shadowColor = '#FFF';
        ctx.shadowBlur = 15;

        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-2, -4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Background {
    constructor() {
        this.clouds = [];
        this.mountains = [];
        this.trees = [];
        this.factoryElements = [];
        this.volcanoElements = [];
        this.initElements();
    }

    initElements() {
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * 800,
                y: 30 + Math.random() * 80,
                size: 30 + Math.random() * 40,
                speed: 0.3
            });
        }

        for (let i = 0; i < 5; i++) {
            this.mountains.push({
                x: i * 200,
                y: 180,
                width: 200,
                height: 100 + Math.random() * 40
            });
        }

        for (let i = 0; i < 10; i++) {
            this.trees.push({
                x: i * 100 + Math.random() * 50,
                y: CONFIG.GROUND_Y - 60,
                type: Math.floor(Math.random() * 3)
            });
        }

        for (let i = 0; i < 6; i++) {
            this.factoryElements.push({
                x: i * 150,
                y: CONFIG.GROUND_Y - 80 - Math.random() * 40,
                width: 60 + Math.random() * 40,
                height: 60 + Math.random() * 50
            });
        }

        for (let i = 0; i < 4; i++) {
            this.volcanoElements.push({
                x: i * 250,
                y: CONFIG.GROUND_Y - 100,
                width: 180,
                height: 100 + Math.random() * 60
            });
        }
    }

    update(speed, terrainType) {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = CONFIG.CANVAS_WIDTH + Math.random() * 100;
                cloud.y = 30 + Math.random() * 80;
            }
        });

        const mountainSpeed = speed * 0.2;
        this.mountains.forEach(m => {
            m.x -= mountainSpeed;
            if (m.x + m.width < 0) {
                m.x = CONFIG.CANVAS_WIDTH;
            }
        });

        const treeSpeed = speed * 0.5;
        this.trees.forEach(t => {
            t.x -= treeSpeed;
            if (t.x + 40 < 0) {
                t.x = CONFIG.CANVAS_WIDTH + Math.random() * 100;
            }
        });

        this.factoryElements.forEach(f => {
            f.x -= speed * 0.3;
            if (f.x + f.width < 0) {
                f.x = CONFIG.CANVAS_WIDTH + Math.random() * 100;
            }
        });

        this.volcanoElements.forEach(v => {
            v.x -= speed * 0.4;
            if (v.x + v.width < 0) {
                v.x = CONFIG.CANVAS_WIDTH + Math.random() * 150;
            }
        });
    }

    render(ctx, terrain) {
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, terrain.skyColor);
        gradient.addColorStop(1, terrain.skyColor2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.clouds.forEach(cloud => {
            this.drawCloud(ctx, cloud.x, cloud.y, cloud.size);
        });

        if (terrain === TERRAIN_TYPES.GRASS) {
            this.renderGrassBackground(ctx);
        } else if (terrain === TERRAIN_TYPES.FACTORY) {
            this.renderFactoryBackground(ctx);
        } else if (terrain === TERRAIN_TYPES.VOLCANO) {
            this.renderVolcanoBackground(ctx);
        }
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.15, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderGrassBackground(ctx) {
        ctx.fillStyle = '#4CAF50';
        this.mountains.forEach(m => {
            ctx.beginPath();
            ctx.moveTo(m.x, CONFIG.GROUND_Y);
            ctx.lineTo(m.x + m.width / 2, m.y);
            ctx.lineTo(m.x + m.width, CONFIG.GROUND_Y);
            ctx.closePath();
            ctx.fill();
        });

        ctx.fillStyle = '#388E3C';
        this.mountains.forEach((m, i) => {
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(m.x + 20, CONFIG.GROUND_Y);
                ctx.lineTo(m.x + m.width / 2, m.y + 20);
                ctx.lineTo(m.x + m.width - 20, CONFIG.GROUND_Y);
                ctx.closePath();
                ctx.fill();
            }
        });

        this.trees.forEach(t => {
            this.drawTree(ctx, t.x, t.y, t.type);
        });
    }

    drawTree(ctx, x, y, type) {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x + 12, y + 30, 8, 30);

        ctx.fillStyle = '#2E7D32';
        if (type === 0) {
            ctx.beginPath();
            ctx.moveTo(x + 16, y);
            ctx.lineTo(x, y + 35);
            ctx.lineTo(x + 32, y + 35);
            ctx.closePath();
            ctx.fill();
        } else if (type === 1) {
            ctx.beginPath();
            ctx.arc(x + 16, y + 20, 18, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(x + 4, y + 10, 24, 28);
        }
    }

    renderFactoryBackground(ctx) {
        ctx.fillStyle = '#37474F';
        this.factoryElements.forEach(f => {
            ctx.fillRect(f.x, f.y, f.width, f.height);

            ctx.fillStyle = '#455A64';
            ctx.fillRect(f.x + 10, f.y - 30, 15, 30);
            ctx.fillRect(f.x + f.width - 25, f.y - 40, 15, 40);

            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.beginPath();
            ctx.arc(f.x + 17, f.y - 35, 10, 0, Math.PI * 2);
            ctx.arc(f.x + f.width - 17, f.y - 45, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#263238';
            for (let wy = f.y + 10; wy < f.y + f.height - 10; wy += 15) {
                for (let wx = f.x + 10; wx < f.x + f.width - 10; wx += 15) {
                    ctx.fillRect(wx, wy, 8, 8);
                }
            }

            ctx.fillStyle = '#37474F';
        });
    }

    renderVolcanoBackground(ctx) {
        ctx.fillStyle = '#4E342E';
        this.volcanoElements.forEach(v => {
            ctx.beginPath();
            ctx.moveTo(v.x, CONFIG.GROUND_Y);
            ctx.lineTo(v.x + v.width / 2, v.y - v.height * 0.3);
            ctx.lineTo(v.x + v.width, CONFIG.GROUND_Y);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.moveTo(v.x + v.width * 0.3, v.y - v.height * 0.2);
            ctx.lineTo(v.x + v.width / 2, v.y - v.height * 0.4);
            ctx.lineTo(v.x + v.width * 0.7, v.y - v.height * 0.2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(v.x + v.width / 2, v.y - v.height * 0.35, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4E342E';
        });

        ctx.fillStyle = 'rgba(255, 87, 34, 0.3)';
        for (let i = 0; i < 10; i++) {
            const ex = 100 + i * 70 + Math.sin(Date.now() * 0.001 + i) * 20;
            const ey = 200 + Math.sin(Date.now() * 0.002 + i * 2) * 30;
            ctx.beginPath();
            ctx.arc(ex, ey, 15 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class TerrainManager {
    constructor() {
        this.currentTerrainIndex = 0;
        this.currentTerrain = TERRAIN_TYPES[TERRAIN_ORDER[0]];
        this.nextSwitchDistance = CONFIG.TERRAIN_SWITCH_DISTANCE;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.pendingTerrain = null;
    }

    update(distance) {
        if (!this.isTransitioning && distance >= this.nextSwitchDistance) {
            this.startTransition();
        }

        if (this.isTransitioning) {
            this.transitionProgress += 0.02;
            if (this.transitionProgress >= 1) {
                this.completeTransition();
            }
        }
    }

    startTransition() {
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.currentTerrainIndex = (this.currentTerrainIndex + 1) % TERRAIN_ORDER.length;
        this.pendingTerrain = TERRAIN_TYPES[TERRAIN_ORDER[this.currentTerrainIndex]];
        
        const overlay = document.getElementById('transitionOverlay');
        const text = document.getElementById('transitionText');
        text.textContent = `进入 ${this.pendingTerrain.name}`;
        overlay.classList.add('active');

        setTimeout(() => {
            overlay.classList.remove('active');
        }, 1500);
    }

    completeTransition() {
        this.currentTerrain = this.pendingTerrain;
        this.pendingTerrain = null;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.nextSwitchDistance += CONFIG.TERRAIN_SWITCH_DISTANCE;

        document.getElementById('terrainIndicator').querySelector('.terrain-name').textContent = this.currentTerrain.name;
    }

    getTerrain() {
        return this.currentTerrain;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        this.player = null;
        this.obstacles = [];
        this.rings = [];
        this.springs = [];
        this.stars = [];
        this.particles = [];
        this.background = null;
        this.terrainManager = null;

        this.speed = CONFIG.BASE_SPEED;
        this.distance = 0;
        this.score = 0;
        this.ringsCollected = 0;
        this.isRunning = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.lastSpawnScreenX = CONFIG.CANVAS_WIDTH + 100;

        this.keys = {
            space: false
        };

        this.playerName = localStorage.getItem('runner_player_name') || '玩家';
        this.scoreSubmitted = false;
        this.saveTimer = 0;

        this.init();
        this.bindEvents();
        this.checkSavedState();
        this.gameLoop();
    }

    checkSavedState() {
        if (this.hasSavedState()) {
            document.getElementById('continuePrompt').classList.remove('hidden');
            document.getElementById('startPrompt').classList.add('hidden');
        }
    }

    continueGame() {
        if (this.loadState()) {
            document.getElementById('continuePrompt').classList.add('hidden');
            document.getElementById('startPrompt').classList.add('hidden');
            this.isRunning = true;
            this.player.isOnGround = this.player.y >= CONFIG.GROUND_Y - CONFIG.PLAYER_HEIGHT - 2;
            if (this.player.isOnGround) {
                this.player.isJumping = false;
                this.player.isBall = false;
                this.player.vy = 0;
            }
            this.render();
        }
    }

    init() {
        this.player = new Player();
        this.background = new Background();
        this.terrainManager = new TerrainManager();
        this.obstacles = [];
        this.rings = [];
        this.springs = [];
        this.stars = [];
        this.particles = [];
        this.speed = CONFIG.BASE_SPEED;
        this.distance = 0;
        this.score = 0;
        this.ringsCollected = 0;
        this.lastSpawnScreenX = CONFIG.CANVAS_WIDTH + 100;
        this.isGameOver = false;
        this.isRunning = false;
        this.scoreSubmitted = false;
        this.updateHUD();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.isRunning && !this.isGameOver) {
                    if (this.hasSavedState()) {
                        this.restart();
                    } else {
                        this.startGame();
                    }
                } else if (this.isRunning && !this.isGameOver) {
                    if (!this.keys.space) {
                        this.player.jump();
                    }
                    this.keys.space = true;
                } else if (this.isGameOver) {
                    this.restart();
                }
            }
            if (e.code === 'KeyC' && !this.isRunning && !this.isGameOver) {
                e.preventDefault();
                if (this.hasSavedState()) {
                    this.continueGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.keys.space = false;
                this.player.releaseJump();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isRunning && !this.isGameOver) {
                if (this.hasSavedState()) {
                    this.continueGame();
                } else {
                    this.startGame();
                }
            } else if (this.isRunning && !this.isGameOver) {
                this.player.jump();
                this.keys.space = true;
            } else if (this.isGameOver) {
                this.restart();
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.space = false;
            this.player.releaseJump();
        });

        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('backMenuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('submitScoreBtn').addEventListener('click', () => this.submitScore());
    }

    startGame() {
        this.isRunning = true;
        document.getElementById('startPrompt').classList.add('hidden');
    }

    restart() {
        this.clearSavedState();
        this.init();
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('startPrompt').classList.remove('hidden');
        document.getElementById('submitMessage').textContent = '';
        document.getElementById('continuePrompt').classList.add('hidden');
    }

    backToMenu() {
        window.location.href = '/';
    }

    saveState() {
        if (!this.isRunning || this.isGameOver) return;
        
        const state = {
            distance: this.distance,
            score: this.score,
            ringsCollected: this.ringsCollected,
            speed: this.speed,
            lastSpawnScreenX: this.lastSpawnScreenX,
            terrainIndex: this.terrainManager.currentTerrainIndex,
            nextSwitchDistance: this.terrainManager.nextSwitchDistance,
            isTransitioning: this.terrainManager.isTransitioning,
            transitionProgress: this.terrainManager.transitionProgress,
            player: {
                y: this.player.y,
                vy: this.player.vy,
                isJumping: this.player.isJumping,
                isOnGround: this.player.isOnGround,
                isBall: this.player.isBall,
                lives: this.player.lives,
                invincibleTimer: this.player.invincibleTimer,
                flashTimer: this.player.flashTimer,
                runFrame: this.player.runFrame,
                rotation: this.player.rotation,
                jumpHoldTime: this.player.jumpHoldTime
            },
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('runner_game_state', JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save game state:', e);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('runner_game_state');
            if (!saved) return false;
            
            const state = JSON.parse(saved);
            if (!state || !state.distance) return false;
            
            if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
                this.clearSavedState();
                return false;
            }
            
            this.distance = state.distance;
            this.score = state.score;
            this.ringsCollected = state.ringsCollected;
            this.speed = state.speed;
            this.lastSpawnScreenX = state.lastSpawnScreenX || CONFIG.CANVAS_WIDTH + 100;
            
            this.terrainManager.currentTerrainIndex = state.terrainIndex || 0;
            this.terrainManager.currentTerrain = TERRAIN_TYPES[TERRAIN_ORDER[this.terrainManager.currentTerrainIndex]];
            this.terrainManager.nextSwitchDistance = state.nextSwitchDistance || CONFIG.TERRAIN_SWITCH_DISTANCE;
            this.terrainManager.isTransitioning = state.isTransitioning || false;
            this.terrainManager.transitionProgress = state.transitionProgress || 0;
            document.getElementById('terrainIndicator').querySelector('.terrain-name').textContent = this.terrainManager.currentTerrain.name;
            
            if (state.player) {
                this.player.y = state.player.y;
                this.player.vy = state.player.vy;
                this.player.isJumping = state.player.isJumping;
                this.player.isOnGround = state.player.isOnGround;
                this.player.isBall = state.player.isBall;
                this.player.lives = state.player.lives;
                this.player.invincibleTimer = state.player.invincibleTimer;
                this.player.flashTimer = state.player.flashTimer || 0;
                this.player.runFrame = state.player.runFrame || 0;
                this.player.rotation = state.player.rotation || 0;
                this.player.jumpHoldTime = state.player.jumpHoldTime || 0;
            }
            
            this.obstacles = [];
            this.rings = [];
            this.springs = [];
            this.stars = [];
            this.particles = [];
            
            this.spawnEntities();
            
            this.updateHUD();
            this.updateHearts();
            this.updatePowerupDisplay();
            
            return true;
        } catch (e) {
            console.warn('Failed to load game state:', e);
            return false;
        }
    }

    clearSavedState() {
        try {
            localStorage.removeItem('runner_game_state');
        } catch (e) {
            console.warn('Failed to clear saved state:', e);
        }
    }

    hasSavedState() {
        try {
            const saved = localStorage.getItem('runner_game_state');
            if (!saved) return false;
            const state = JSON.parse(saved);
            return state && state.distance && state.distance > 0 && Date.now() - state.timestamp < 24 * 60 * 60 * 1000;
        } catch (e) {
            return false;
        }
    }

    async submitScore() {
        if (this.scoreSubmitted) return;

        const submitBtn = document.getElementById('submitScoreBtn');
        const messageEl = document.getElementById('submitMessage');
        
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        messageEl.textContent = '提交中...';
        messageEl.className = 'submit-message';

        try {
            const response = await fetch('/api/runner/scores/set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_name: this.playerName,
                    distance: Math.floor(this.distance),
                    rings: this.ringsCollected
                })
            });

            const result = await response.json();

            if (result.code === 0) {
                this.scoreSubmitted = true;
                messageEl.textContent = '✓ 成绩提交成功！';
                messageEl.className = 'submit-message success';
            } else {
                messageEl.textContent = `✗ ${result.message}`;
                messageEl.className = 'submit-message error';
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        } catch (error) {
            messageEl.textContent = '✗ 提交失败，请重试';
            messageEl.className = 'submit-message error';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    }

    spawnEntities() {
        const terrain = this.terrainManager.getTerrain();
        const spawnTargetX = CONFIG.CANVAS_WIDTH + 100;

        while (this.lastSpawnScreenX < spawnTargetX) {
            const rand = Math.random();

            if (rand < terrain.obstacleRate) {
                this.obstacles.push(new Obstacle('spike', this.lastSpawnScreenX, CONFIG.GROUND_Y));
                this.lastSpawnScreenX += 40 + Math.random() * 60;
            } else if (rand < terrain.obstacleRate + terrain.pitRate) {
                this.obstacles.push(new Obstacle('pit', this.lastSpawnScreenX, CONFIG.GROUND_Y));
                this.lastSpawnScreenX += 80 + Math.random() * 60;
            } else if (rand < terrain.obstacleRate + terrain.pitRate + terrain.ringRate) {
                const ringY = CONFIG.GROUND_Y - 50 - Math.random() * 100;
                const ringCount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < ringCount; i++) {
                    this.rings.push(new Ring(this.lastSpawnScreenX + i * 25, ringY));
                }
                this.lastSpawnScreenX += 30 + ringCount * 25;
            } else if (rand < terrain.obstacleRate + terrain.pitRate + terrain.ringRate + terrain.springRate) {
                this.springs.push(new Spring(this.lastSpawnScreenX, CONFIG.GROUND_Y));
                this.lastSpawnScreenX += 50;
            } else if (rand < terrain.obstacleRate + terrain.pitRate + terrain.ringRate + terrain.springRate + terrain.starRate) {
                const starY = CONFIG.GROUND_Y - 80 - Math.random() * 120;
                this.stars.push(new Star(this.lastSpawnScreenX, starY));
                this.lastSpawnScreenX += 40;
            } else {
                this.lastSpawnScreenX += 20 + Math.random() * 30;
            }
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    getPlayerHitbox() {
        if (this.player.isBall) {
            return {
                x: this.player.x + 4,
                y: this.player.y + 4,
                width: this.player.width - 8,
                height: this.player.height - 8
            };
        }
        return {
            x: this.player.x + 6,
            y: this.player.y + 4,
            width: this.player.width - 12,
            height: this.player.height - 4
        };
    }

    update() {
        if (!this.isRunning || this.isGameOver || this.isPaused) return;

        const terrain = this.terrainManager.getTerrain();

        this.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.BASE_SPEED + this.distance * CONFIG.SPEED_INCREMENT);
        this.distance += this.speed * 0.1;
        this.score = Math.floor(this.distance * CONFIG.DISTANCE_SCORE_MULTIPLIER + this.ringsCollected * CONFIG.RING_SCORE);

        this.terrainManager.update(this.distance);

        if (this.keys.space) {
            this.player.jumpBoost();
        }

        this.player.update(this.speed, CONFIG.GROUND_Y);
        this.background.update(this.speed, terrain);

        this.lastSpawnScreenX -= this.speed;

        this.spawnEntities();

        this.obstacles.forEach(obs => obs.update(this.speed));
        this.obstacles = this.obstacles.filter(obs => obs.x + obs.width > -50);

        this.rings.forEach(ring => ring.update(this.speed));
        this.rings = this.rings.filter(ring => ring.x + ring.width > -50 && !ring.collected);

        this.springs.forEach(spring => spring.update(this.speed));
        this.springs = this.springs.filter(spring => spring.x + spring.width > -50);

        this.stars.forEach(star => star.update(this.speed));
        this.stars = this.stars.filter(star => star.x + star.width > -50 && !star.collected);

        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        this.checkCollisions();

        if (this.player.y > CONFIG.CANVAS_HEIGHT) {
            this.gameOver();
        }

        this.saveTimer++;
        if (this.saveTimer >= 30) {
            this.saveState();
            this.saveTimer = 0;
        }

        this.updateHUD();
    }

    checkCollisions() {
        const playerHitbox = this.getPlayerHitbox();

        for (const obs of this.obstacles) {
            const obsHitbox = obs.getHitbox();
            if (this.checkCollision(playerHitbox, obsHitbox)) {
                if (obs.type === 'pit') {
                    if (this.player.hit()) {
                        this.spawnHitParticles();
                        this.updateHearts();
                        if (this.player.lives <= 0) {
                            this.gameOver();
                        }
                    }
                } else if (obs.type === 'spike') {
                    if (this.player.hit()) {
                        this.spawnHitParticles();
                        this.updateHearts();
                        if (this.player.lives <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
        }

        for (const ring of this.rings) {
            if (!ring.collected && this.checkCollision(playerHitbox, ring.getHitbox())) {
                ring.collected = true;
                this.ringsCollected++;
                this.spawnRingParticles(ring.x + ring.width/2, ring.y + ring.height/2);
            }
        }

        for (const spring of this.springs) {
            if (this.player.vy > 0 && this.checkCollision(playerHitbox, spring.getHitbox())) {
                spring.bounce();
                this.player.springJump();
                this.spawnSpringParticles(spring.x + spring.width/2, spring.y);
            }
        }

        for (const star of this.stars) {
            if (!star.collected && this.checkCollision(playerHitbox, star.getHitbox())) {
                star.collected = true;
                this.player.makeInvincible();
                this.spawnStarParticles(star.x + star.width/2, star.y + star.height/2);
                this.updatePowerupDisplay();
            }
        }
    }

    spawnRingParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, '#FFD700'));
        }
    }

    spawnHitParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height/2,
                '#FF4444'
            ));
        }
    }

    spawnSpringParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(x, y, '#4ECDC4'));
        }
    }

    spawnStarParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, ['#FFD700', '#FFF', '#FFA500'][Math.floor(Math.random() * 3)]));
        }
    }

    render() {
        const terrain = this.terrainManager.getTerrain();

        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.background.render(this.ctx, terrain);

        this.renderGround(terrain);

        this.springs.forEach(s => s.render(this.ctx));
        this.obstacles.forEach(o => o.render(this.ctx, terrain));
        this.rings.forEach(r => r.render(this.ctx));
        this.stars.forEach(s => s.render(this.ctx));
        this.particles.forEach(p => p.render(this.ctx));
        this.player.render(this.ctx);

        if (this.terrainManager.isTransitioning) {
            this.renderTransition();
        }
    }

    renderGround(terrain) {
        this.ctx.fillStyle = terrain.groundColor;
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);

        this.ctx.fillStyle = terrain.groundDark;
        for (let i = 0; i < CONFIG.CANVAS_WIDTH; i += 20) {
            const offset = (this.distance * this.speed * 0.5 + i) % 40;
            this.ctx.fillRect(i - offset, CONFIG.GROUND_Y, 10, 4);
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, 4);

        if (terrain === TERRAIN_TYPES.GRASS) {
            this.ctx.fillStyle = '#4CAF50';
            for (let i = 0; i < CONFIG.CANVAS_WIDTH; i += 15) {
                const offset = (this.distance * this.speed + i) % 30;
                this.ctx.fillRect(i - offset, CONFIG.GROUND_Y - 6, 3, 6);
            }
        }
    }

    renderTransition() {
        const alpha = this.terrainManager.transitionProgress < 0.5 
            ? this.terrainManager.transitionProgress * 2 
            : (1 - this.terrainManager.transitionProgress) * 2;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha * 0.5;
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.ctx.restore();
    }

    updateHUD() {
        document.getElementById('distance').textContent = Math.floor(this.distance);
        document.getElementById('score').textContent = this.score;
        document.getElementById('rings').textContent = this.ringsCollected;
    }

    updateHearts() {
        const hearts = document.querySelectorAll('#hearts .heart');
        hearts.forEach((heart, index) => {
            if (index >= this.player.lives) {
                heart.classList.add('lost');
            } else {
                heart.classList.remove('lost');
            }
        });
    }

    updatePowerupDisplay() {
        const display = document.getElementById('powerupDisplay');
        if (this.player.invincibleTimer > 0) {
            display.innerHTML = '<div class="powerup-item">⭐ 无敌</div>';
        } else {
            display.innerHTML = '';
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        this.clearSavedState();

        document.getElementById('finalPlayer').textContent = this.playerName;
        document.getElementById('finalDistance').textContent = Math.floor(this.distance) + ' m';
        document.getElementById('finalRings').textContent = this.ringsCollected;
        document.getElementById('finalScore').textContent = this.score;

        document.getElementById('gameOverModal').style.display = 'flex';
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
