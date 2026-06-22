'use strict';

const CONFIG = {
    CANVAS_WIDTH: 0,
    CANVAS_HEIGHT: 0,
    PLAYER: {
        SIZE: 20,
        SPEED: 4,
        MAX_HP: 100,
        DAMAGE: 5,
        COLOR: '#48dbfb',
        START_X: 0.5,
        START_Y: 0.85
    },
    GUN: {
        MAG_SIZE: 6,
        RELOAD_TIME: 4000,
        BULLET_SPEED: 15,
        BULLET_SIZE: 5,
        SHOOT_COOLDOWN: 150
    },
    TOWER: {
        HITS_TO_DESTROY: 3,
        DISABLE_TIME: 8000,
        RADIUS: 28,
        SCORE_PER_HIT: 50,
        SCORE_PER_DESTROY: 500
    },
    BULLET: {
        SIZE: 8,
        COLORS: {
            linear: '#ff6b6b',
            fan: '#feca57',
            spiral: '#48dbfb',
            tracking: '#ff9ff3',
            bounce: '#1dd1a1'
        }
    },
    STAGES: 3,
    SAFE_ZONE_HEAL: 30
};

const TOWER_TYPES = {
    LINEAR: 'linear',
    FAN: 'fan',
    SPIRAL: 'spiral',
    TRACKING: 'tracking',
    BOUNCE: 'bounce'
};

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    SAFE_ZONE: 'safe_zone',
    GAME_OVER: 'game_over'
};

class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.size = CONFIG.PLAYER.SIZE;
        this.hp = CONFIG.PLAYER.MAX_HP;
        this.maxHp = CONFIG.PLAYER.MAX_HP;
        this.x = canvas.width * CONFIG.PLAYER.START_X;
        this.y = canvas.height * CONFIG.PLAYER.START_Y;
        this.speed = CONFIG.PLAYER.SPEED;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.invincibleUntil = 0;
    }

    update(keys, mouseX, mouseY) {
        this.vx = 0;
        this.vy = 0;
        if (keys['w'] || keys['arrowup']) this.vy = -1;
        if (keys['s'] || keys['arrowdown']) this.vy = 1;
        if (keys['a'] || keys['arrowleft']) this.vx = -1;
        if (keys['d'] || keys['arrowright']) this.vx = 1;

        if (this.vx !== 0 && this.vy !== 0) {
            const len = Math.sqrt(2);
            this.vx /= len;
            this.vy /= len;
        }

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        const r = this.size;
        this.x = Math.max(r, Math.min(this.canvas.width - r, this.x));
        this.y = Math.max(r, Math.min(this.canvas.height - r, this.y));

        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    }

    takeDamage(amount) {
        if (Date.now() < this.invincibleUntil) return false;
        this.hp -= amount;
        this.invincibleUntil = Date.now() + 600;
        return true;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    isDead() {
        return this.hp <= 0;
    }

    draw(ctx) {
        const isInvincible = Date.now() < this.invincibleUntil;
        
        if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = CONFIG.PLAYER.COLOR;
        ctx.shadowColor = CONFIG.PLAYER.COLOR;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0d1117';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.size * 0.3, -3, this.size * 1.2, 6);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

class Gun {
    constructor() {
        this.ammo = CONFIG.GUN.MAG_SIZE;
        this.maxAmmo = CONFIG.GUN.MAG_SIZE;
        this.isReloading = false;
        this.reloadStart = 0;
        this.lastShoot = 0;
        this.bullets = [];
    }

    startReload() {
        if (this.isReloading || this.ammo === this.maxAmmo) return;
        this.isReloading = true;
        this.reloadStart = Date.now();
    }

    update() {
        if (this.isReloading) {
            if (Date.now() - this.reloadStart >= CONFIG.GUN.RELOAD_TIME) {
                this.ammo = this.maxAmmo;
                this.isReloading = false;
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < -50 || b.x > b.canvasW + 50 || 
                b.y < -50 || b.y > b.canvasH + 50) {
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot(playerX, playerY, angle, canvasW, canvasH) {
        if (this.isReloading) return false;
        if (Date.now() - this.lastShoot < CONFIG.GUN.SHOOT_COOLDOWN) return false;
        if (this.ammo <= 0) {
            this.startReload();
            return false;
        }

        this.ammo--;
        this.lastShoot = Date.now();
        
        this.bullets.push({
            x: playerX + Math.cos(angle) * 30,
            y: playerY + Math.sin(angle) * 30,
            vx: Math.cos(angle) * CONFIG.GUN.BULLET_SPEED,
            vy: Math.sin(angle) * CONFIG.GUN.BULLET_SPEED,
            size: CONFIG.GUN.BULLET_SIZE,
            canvasW: canvasW,
            canvasH: canvasH
        });

        if (this.ammo === 0) {
            this.startReload();
        }
        return true;
    }

    getReloadProgress() {
        if (!this.isReloading) return 1;
        return Math.min(1, (Date.now() - this.reloadStart) / CONFIG.GUN.RELOAD_TIME);
    }

    draw(ctx) {
        for (const b of this.bullets) {
            ctx.fillStyle = '#feca57';
            ctx.shadowColor = '#feca57';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

class Tower {
    constructor(type, x, y, canvas) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.radius = CONFIG.TOWER.RADIUS;
        this.hits = 0;
        this.maxHits = CONFIG.TOWER.HITS_TO_DESTROY;
        this.isDestroyed = false;
        this.isDisabled = false;
        this.disabledUntil = 0;
        this.lastFire = 0;
        this.patternTime = 0;
        this.fireInterval = this._getFireInterval();
        this.color = CONFIG.BULLET.COLORS[type];
        this.hitFlash = 0;
    }

    _getFireInterval() {
        switch (this.type) {
            case TOWER_TYPES.LINEAR: return 700;
            case TOWER_TYPES.FAN: return 1100;
            case TOWER_TYPES.SPIRAL: return 80;
            case TOWER_TYPES.TRACKING: return 1500;
            case TOWER_TYPES.BOUNCE: return 1400;
            default: return 1000;
        }
    }

    hit() {
        if (this.isDestroyed) return false;
        this.hits++;
        this.hitFlash = Date.now();
        if (this.hits >= this.maxHits) {
            this.isDestroyed = true;
            return 'destroyed';
        } else {
            this.isDisabled = true;
            this.disabledUntil = Date.now() + CONFIG.TOWER.DISABLE_TIME;
            return 'disabled';
        }
    }

    update(player, bulletManager) {
        if (this.isDestroyed) return;

        if (this.isDisabled && Date.now() >= this.disabledUntil) {
            this.isDisabled = false;
        }

        if (this.isDisabled) return;

        const now = Date.now();
        this.patternTime += 16;

        if (now - this.lastFire >= this.fireInterval) {
            this._firePattern(player, bulletManager);
            this.lastFire = now;
        }
    }

    _firePattern(player, bulletManager) {
        const color = this.color;
        const speed = 3.5;

        switch (this.type) {
            case TOWER_TYPES.LINEAR:
                this._fireLinear(player, bulletManager, color, speed);
                break;
            case TOWER_TYPES.FAN:
                this._fireFan(player, bulletManager, color, speed);
                break;
            case TOWER_TYPES.SPIRAL:
                this._fireSpiral(bulletManager, color, speed * 0.9);
                break;
            case TOWER_TYPES.TRACKING:
                this._fireTracking(player, bulletManager, color, speed * 0.85);
                break;
            case TOWER_TYPES.BOUNCE:
                this._fireBounce(player, bulletManager, color, speed);
                break;
        }
    }

    _fireLinear(player, bulletManager, color, speed) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bulletManager.addBullet({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: CONFIG.BULLET.SIZE,
            color: color,
            type: 'linear'
        });
    }

    _fireFan(player, bulletManager, color, speed) {
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const spread = Math.PI / 5;
        const count = 7;
        for (let i = 0; i < count; i++) {
            const angle = baseAngle - spread + (spread * 2 / (count - 1)) * i;
            bulletManager.addBullet({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: CONFIG.BULLET.SIZE,
                color: color,
                type: 'fan'
            });
        }
    }

    _fireSpiral(bulletManager, color, speed) {
        const arms = 4;
        for (let a = 0; a < arms; a++) {
            const angle = (this.patternTime / 400) + (a * Math.PI * 2 / arms);
            bulletManager.addBullet({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: CONFIG.BULLET.SIZE - 1,
                color: color,
                type: 'spiral'
            });
        }
    }

    _fireTracking(player, bulletManager, color, speed) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bulletManager.addBullet({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: CONFIG.BULLET.SIZE + 2,
            color: color,
            type: 'tracking',
            trackSpeed: 0.04,
            trackTarget: player,
            maxSpeed: speed * 1.2
        });
    }

    _fireBounce(player, bulletManager, color, speed) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const offsets = [-0.3, 0, 0.3];
        for (const off of offsets) {
            const a = angle + off;
            bulletManager.addBullet({
                x: this.x, y: this.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: CONFIG.BULLET.SIZE,
                color: color,
                type: 'bounce',
                bounces: 3,
                canvasW: this.canvas.width,
                canvasH: this.canvas.height
            });
        }
    }

    draw(ctx) {
        if (this.isDestroyed) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#777';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.6, -this.radius * 0.6);
            ctx.lineTo(this.radius * 0.6, this.radius * 0.6);
            ctx.moveTo(this.radius * 0.6, -this.radius * 0.6);
            ctx.lineTo(-this.radius * 0.6, this.radius * 0.6);
            ctx.stroke();
            ctx.restore();
            return;
        }

        const isFlashing = Date.now() - this.hitFlash < 150;

        ctx.save();
        ctx.translate(this.x, this.y);

        const fillColor = isFlashing ? '#ffffff' : 
                         (this.isDisabled ? this.mixColor(this.color, '#333', 0.6) : this.color);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.isDisabled ? 5 : 20;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0d1117';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        const typeSymbol = this._getTypeSymbol();
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeSymbol, 0, 0);

        const hitSize = this.radius / this.maxHits;
        for (let i = 0; i < this.maxHits; i++) {
            ctx.fillStyle = i < this.hits ? '#1dd1a1' : 'rgba(255,255,255,0.2)';
            ctx.fillRect(-this.radius + i * hitSize * 2 + 2, this.radius + 6, 
                        hitSize * 2 - 4, 4);
        }

        if (this.isDisabled) {
            const remaining = (this.disabledUntil - Date.now()) / CONFIG.TOWER.DISABLE_TIME;
            ctx.strokeStyle = '#1dd1a1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, -Math.PI / 2, 
                   -Math.PI / 2 + (1 - remaining) * Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    _getTypeSymbol() {
        switch (this.type) {
            case TOWER_TYPES.LINEAR: return '→';
            case TOWER_TYPES.FAN: return '⋔';
            case TOWER_TYPES.SPIRAL: return '⟳';
            case TOWER_TYPES.TRACKING: return '◎';
            case TOWER_TYPES.BOUNCE: return '⇄';
            default: return '?';
        }
    }

    mixColor(c1, c2, ratio) {
        const hex = c => parseInt(c.slice(1), 16);
        const r1 = (hex(c1) >> 16) & 255, g1 = (hex(c1) >> 8) & 255, b1 = hex(c1) & 255;
        const r2 = (hex(c2) >> 16) & 255, g2 = (hex(c2) >> 8) & 255, b2 = hex(c2) & 255;
        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
        return `rgb(${r},${g},${b})`;
    }
}

class BulletManager {
    constructor(canvas) {
        this.bullets = [];
        this.canvas = canvas;
    }

    addBullet(b) {
        this.bullets.push(b);
    }

    update(player, onPlayerHit) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            if (b.type === 'tracking' && b.trackTarget) {
                const dx = b.trackTarget.x - b.x;
                const dy = b.trackTarget.y - b.y;
                const targetAngle = Math.atan2(dy, dx);
                const currentAngle = Math.atan2(b.vy, b.vx);
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const newAngle = currentAngle + angleDiff * b.trackSpeed;
                const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const spd = Math.min(currentSpeed * 1.005, b.maxSpeed || currentSpeed);
                b.vx = Math.cos(newAngle) * spd;
                b.vy = Math.sin(newAngle) * spd;
            }

            b.x += b.vx;
            b.y += b.vy;

            if (b.type === 'bounce') {
                let bounced = false;
                if (b.x <= b.size || b.x >= b.canvasW - b.size) {
                    b.vx *= -1;
                    b.x = Math.max(b.size, Math.min(b.canvasW - b.size, b.x));
                    bounced = true;
                }
                if (b.y <= b.size || b.y >= b.canvasH - b.size) {
                    b.vy *= -1;
                    b.y = Math.max(b.size, Math.min(b.canvasH - b.size, b.y));
                    bounced = true;
                }
                if (bounced) {
                    b.bounces--;
                    if (b.bounces <= 0) {
                        this.bullets.splice(i, 1);
                        continue;
                    }
                }
            }

            if (b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50) {
                if (b.type !== 'bounce') {
                    this.bullets.splice(i, 1);
                    continue;
                }
            }

            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.size + player.size - 2) {
                if (onPlayerHit()) {
                    this.bullets.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        for (const b of this.bullets) {
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = b.type === 'tracking' ? 18 : 10;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (b.type === 'tracking') {
                ctx.strokeStyle = b.color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size + 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }

    clear() {
        this.bullets = [];
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 10, speed = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.5 + Math.random() * 0.5);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 4,
                color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

class Game {
    static STORAGE_KEY = 'bullet_tower_hunter_save_v2';
    static STORAGE_BACKUP_KEY = 'bullet_tower_hunter_save_v2_bak';
    static STORAGE_VERSION = 2;
    static AUTO_SAVE_INTERVAL = 2000;

    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        this.currentStage = 0;
        this.score = 0;
        this.totalDestroyed = 0;
        this.stageDestroyed = [0, 0, 0];
        this.playerName = '猎人';
        this.stagesCleared = 0;
        this.storedHp = CONFIG.PLAYER.MAX_HP;
        this.lastSavedAt = 0;
        this._lastMoveSaveAt = 0;
        this._savedData = null;
        this._debugSaveCount = 0;

        this.mouseX = 0;
        this.mouseY = 0;
        this.keys = {};

        this.player = null;
        this.gun = null;
        this.towers = [];
        this.bulletManager = null;
        this.particles = new ParticleSystem();

        this._migrateOldSaves();
        this._init();
        this._setupEvents();
        this._setupSaveEvents();
        window.addEventListener('resize', () => {
            if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                this._resizeCanvas();
                try { this._saveState(false); } catch(_) {}
            }
        });
    }

    _migrateOldSaves() {
        try {
            const oldKeys = ['bullet_tower_hunter_save', 'bullet_tower_hunter_save_bak',
                             'bullet_tower_hunter_save_v1', 'bullet_tower_hunter_save_v1_bak'];
            oldKeys.forEach(k => localStorage.removeItem(k));
        } catch(e) {}
    }

    _init() {
        this.bulletManager = new BulletManager(this.canvas);
        this.gun = new Gun();
        this._savedData = null;
    }

    _setupSaveEvents() {
        window.addEventListener('beforeunload', () => this._saveState(true));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && (this.state === GameState.PLAYING || this.state === GameState.PAUSED)) {
                this._saveState(true);
            }
        });
        setInterval(() => {
            if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                this._saveState(false);
            }
        }, Game.AUTO_SAVE_INTERVAL);
    }

    _resizeCanvas() {
        const gameArea = document.getElementById('game-area');
        const w = gameArea.clientWidth || window.innerWidth;
        const h = gameArea.clientHeight || (window.innerHeight - 70);
        if (w > 0 && h > 0) {
            this.canvas.width = w;
            this.canvas.height = h;
            CONFIG.CANVAS_WIDTH = w;
            CONFIG.CANVAS_HEIGHT = h;
        }
    }

    _setupEvents() {
        const screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            safe: document.getElementById('safe-zone-screen'),
            over: document.getElementById('gameover-screen'),
            lb: document.getElementById('leaderboard-screen'),
            pause: document.getElementById('pause-screen')
        };

        const showScreen = (name) => {
            Object.values(screens).forEach(s => s.classList.remove('active'));
            screens[name].classList.add('active');
            if (name === 'game') {
                document.body.classList.add('game-active');
                document.getElementById('game-container').classList.add('game-active');
                this._resizeCanvas();
            } else {
                document.body.classList.remove('game-active');
                document.getElementById('game-container').classList.remove('game-active');
            }
        };

        const nameInput = document.getElementById('player-name');
        const nameError = document.getElementById('name-error');

        const validateName = () => {
            const name = nameInput.value.trim();
            if (!name) {
                nameInput.classList.add('error');
                nameError.classList.remove('hidden');
                setTimeout(() => nameInput.classList.remove('error'), 500);
                return false;
            }
            nameError.classList.add('hidden');
            return true;
        };

        nameInput.addEventListener('input', () => {
            if (nameInput.value.trim()) {
                nameError.classList.add('hidden');
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            if (!validateName()) return;
            this.playerName = nameInput.value.trim();
            this._startGame(false);
            showScreen('game');
            this._resizeCanvas();
            setTimeout(() => this._resizeCanvas(), 50);
        });

        if (this._hasSavedState()) {
            const contBtn = document.createElement('button');
            contBtn.id = 'continue-btn';
            contBtn.className = 'btn btn-secondary';
            contBtn.textContent = '继续上次进度';
            contBtn.style.cssText = 'background: linear-gradient(45deg, #1dd1a1, #10ac84); display: block; margin: 8px auto;';
            contBtn.addEventListener('click', () => {
                if (!validateName()) return;
                this.playerName = nameInput.value.trim();
                if (this._loadState(true)) {
                    if (this.state === GameState.SAFE_ZONE) {
                        this._updateSafeZoneUI();
                        showScreen('safe');
                    } else {
                        showScreen('game');
                        this._resizeCanvas();
                        setTimeout(() => {
                            this._resizeCanvas();
                            this._rebuildCurrentStage();
                        }, 50);
                    }
                }
            });
            const startBtn = document.getElementById('start-btn');
            startBtn.parentNode.insertBefore(contBtn, startBtn.nextSibling);
        }

        document.getElementById('show-leaderboard-btn').addEventListener('click', () => {
            this._loadLeaderboard();
            showScreen('lb');
        });

        document.getElementById('back-from-lb-btn').addEventListener('click', () => {
            showScreen('start');
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.state = GameState.PAUSED;
            screens.pause.classList.add('active');
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            screens.pause.classList.remove('active');
            this.state = GameState.PLAYING;
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            screens.pause.classList.remove('active');
            this._clearSavedState();
            this._gameOver(false);
        });

        document.getElementById('next-stage-btn').addEventListener('click', () => {
            this.currentStage++;
            if (this.currentStage >= CONFIG.STAGES) {
                this._gameOver(true);
            } else {
                this._startStage();
                showScreen('game');
                this._resizeCanvas();
                setTimeout(() => this._resizeCanvas(), 50);
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this._clearSavedState();
            this.playerName = (document.getElementById('player-name').value || '猎人').trim();
            this._startGame(false);
            showScreen('game');
            this._resizeCanvas();
            setTimeout(() => this._resizeCanvas(), 50);
        });

        document.getElementById('back-menu-btn').addEventListener('click', () => {
            this.state = GameState.MENU;
            showScreen('start');
        });

        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                this._shoot();
            }
            if (e.key.toLowerCase() === 'r') {
                this.gun.startReload();
            }
            if (e.key === 'Escape' && this.state === GameState.PLAYING) {
                this.state = GameState.PAUSED;
                screens.pause.classList.add('active');
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this._shoot();
        });
    }

    _shoot() {
        if (this.state !== GameState.PLAYING || !this.player) return;
        this.gun.shoot(
            this.player.x, this.player.y, this.player.angle,
            this.canvas.width, this.canvas.height
        );
    }

    _startGame(isRestore) {
        if (!isRestore) {
            this.currentStage = 0;
            this.score = 0;
            this.totalDestroyed = 0;
            this.stageDestroyed = [0, 0, 0];
            this.stagesCleared = 0;
            this.storedHp = CONFIG.PLAYER.MAX_HP;
        }
        this.gun = new Gun();
        this.bulletManager.clear();
        this._startStage();
        this.state = GameState.PLAYING;
    }

    _startStage() {
        this._resizeCanvas();
        this.player = new Player(this.canvas);
        this.player.hp = this.currentStage === 0 ? CONFIG.PLAYER.MAX_HP : (this.storedHp || CONFIG.PLAYER.MAX_HP);
        this.gun = new Gun();
        this.bulletManager.clear();
        this.towers = this._generateTowers();
        this.particles = new ParticleSystem();
        this.state = GameState.PLAYING;
        this._updateHUD();
        this._saveState();
    }

    _rebuildCurrentStage() {
        this._resizeCanvas();
        const saved = this._savedData;

        this.player = new Player(this.canvas);
        if (saved && saved.player) {
            this.player.hp = saved.player.hp;
            if (saved.player.x > 0 && saved.player.y > 0) {
                this.player.x = Math.min(Math.max(saved.player.x, 20), this.canvas.width - 20);
                this.player.y = Math.min(Math.max(saved.player.y, 20), this.canvas.height - 20);
            }
        } else {
            this.player.hp = this.storedHp || CONFIG.PLAYER.MAX_HP;
        }

        this.gun = new Gun();
        if (saved && saved.gun) {
            this.gun.ammo = saved.gun.ammo;
            this.gun.isReloading = saved.gun.isReloading;
        }

        this.bulletManager = new BulletManager(this.canvas);
        this.particles = new ParticleSystem();

        if (saved && saved.towers && saved.towers.length === 5) {
            const W = this.canvas.width;
            const H = this.canvas.height;
            const positions = this._getStagePositions(this.currentStage, W, H);
            this.towers = saved.towers.map((ts, i) => {
                const tower = new Tower(ts.type, positions[i].x, positions[i].y, this.canvas);
                tower.hits = ts.hits;
                tower.isDestroyed = ts.isDestroyed;
                tower.isDisabled = ts.isDisabled;
                tower.disabledUntil = ts.disabledUntil;
                return tower;
            });
        } else {
            this.towers = this._generateTowers();
        }

        this.state = GameState.PLAYING;
        this._updateHUD();
        this._savedData = null;
    }

    _hasSavedState() {
        try {
            const data = localStorage.getItem(Game.STORAGE_KEY);
            if (!data) {
                const bak = localStorage.getItem(Game.STORAGE_BACKUP_KEY);
                if (bak) {
                    localStorage.setItem(Game.STORAGE_KEY, bak);
                    return this._validateSaveData(JSON.parse(bak));
                }
                return false;
            }
            return this._validateSaveData(JSON.parse(data));
        } catch (e) {
            try {
                const bak = localStorage.getItem(Game.STORAGE_BACKUP_KEY);
                if (bak) {
                    localStorage.setItem(Game.STORAGE_KEY, bak);
                    return this._validateSaveData(JSON.parse(bak));
                }
            } catch (_) {}
            return false;
        }
    }

    _validateSaveData(data) {
        if (!data || !data.state) return false;
        if (data.version !== Game.STORAGE_VERSION) return false;
        if (data.state === GameState.GAME_OVER || data.state === GameState.MENU) return false;
        if (typeof data.currentStage !== 'number') return false;
        if (typeof data.score !== 'number') return false;
        if (!data.towers || !Array.isArray(data.towers) || data.towers.length !== 5) return false;
        if (!data.player || typeof data.player.hp !== 'number') return false;
        if (!data.gun || typeof data.gun.ammo !== 'number') return false;
        return true;
    }

    _saveState(forceBackup) {
        try {
            if (!this.towers || this.towers.length !== 5 || !this.player || !this.gun) return;
            if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) return;

            const now = Date.now();
            let W = this.canvas && this.canvas.width > 0 ? this.canvas.width : window.innerWidth;
            let H = this.canvas && this.canvas.height > 0 ? this.canvas.height : (window.innerHeight - 70);
            if (W <= 0) W = 1280;
            if (H <= 0) H = 720;

            const towerStates = this.towers.map(t => ({
                type: t.type,
                hits: t.hits || 0,
                isDestroyed: !!t.isDestroyed,
                isDisabled: !!t.isDisabled,
                disabledUntil: t.isDisabled ? (t.disabledUntil || 0) : 0,
                patternTime: t.patternTime || 0,
                lastFire: t.lastFire || 0
            }));

            const data = {
                version: Game.STORAGE_VERSION,
                state: this.state,
                currentStage: this.currentStage,
                score: this.score,
                totalDestroyed: this.totalDestroyed,
                stageDestroyed: this.stageDestroyed,
                stagesCleared: this.stagesCleared,
                storedHp: this.storedHp,
                playerName: this.playerName,
                player: {
                    xRatio: Math.max(0.01, Math.min(0.99, this.player.x / W)),
                    yRatio: Math.max(0.01, Math.min(0.99, this.player.y / H)),
                    hp: this.player.hp
                },
                gun: {
                    ammo: this.gun.ammo,
                    maxAmmo: this.gun.maxAmmo,
                    isReloading: !!this.gun.isReloading,
                    reloadStart: this.gun.reloadStart || 0
                },
                towers: towerStates,
                savedAt: now
            };

            const json = JSON.stringify(data);

            localStorage.setItem(Game.STORAGE_BACKUP_KEY, json);
            localStorage.setItem(Game.STORAGE_KEY, json);

            this.lastSavedAt = now;
            this._debugSaveCount++;
        } catch (e) {
            console.warn('保存游戏状态失败:', e);
        }
    }

    _loadState(applyToRuntime) {
        try {
            let raw = localStorage.getItem(Game.STORAGE_KEY);
            if (!raw) {
                raw = localStorage.getItem(Game.STORAGE_BACKUP_KEY);
                if (raw) {
                    localStorage.setItem(Game.STORAGE_KEY, raw);
                }
            }
            if (!raw) return false;

            const parsed = JSON.parse(raw);
            if (!this._validateSaveData(parsed)) {
                const bak = localStorage.getItem(Game.STORAGE_BACKUP_KEY);
                if (bak) {
                    const bakParsed = JSON.parse(bak);
                    if (this._validateSaveData(bakParsed)) {
                        localStorage.setItem(Game.STORAGE_KEY, bak);
                        return this._loadState(applyToRuntime);
                    }
                }
                return false;
            }

            this.state = parsed.state;
            this.currentStage = parsed.currentStage;
            this.score = parsed.score;
            this.totalDestroyed = parsed.totalDestroyed;
            this.stageDestroyed = parsed.stageDestroyed || [0, 0, 0];
            this.stagesCleared = parsed.stagesCleared || 0;
            this.storedHp = parsed.storedHp || CONFIG.PLAYER.MAX_HP;
            if (parsed.playerName) this.playerName = parsed.playerName;
            this._savedData = parsed;

            if (applyToRuntime) {
                const nameInput = document.getElementById('player-name');
                if (nameInput) nameInput.value = this.playerName;
            }
            return true;
        } catch (e) {
            console.warn('加载游戏状态失败:', e);
            try {
                const bak = localStorage.getItem(Game.STORAGE_BACKUP_KEY);
                if (bak) {
                    localStorage.setItem(Game.STORAGE_KEY, bak);
                    return this._loadState(applyToRuntime);
                }
            } catch (_) {}
            return false;
        }
    }

    _rebuildCurrentStage() {
        this._resizeCanvas();
        const saved = this._savedData;
        if (!saved) {
            this._startStage();
            return;
        }

        const W = this.canvas.width > 0 ? this.canvas.width : window.innerWidth;
        const H = this.canvas.height > 0 ? this.canvas.height : (window.innerHeight - 70);

        this.player = new Player(this.canvas);
        if (saved.player && typeof saved.player.hp === 'number') {
            this.player.hp = Math.max(0, Math.min(CONFIG.PLAYER.MAX_HP, saved.player.hp));
            this.storedHp = this.player.hp;
            const xr = typeof saved.player.xRatio === 'number' ? saved.player.xRatio : 0.5;
            const yr = typeof saved.player.yRatio === 'number' ? saved.player.yRatio : 0.5;
            this.player.x = Math.max(20, Math.min(W - 20, xr * W));
            this.player.y = Math.max(20, Math.min(H - 20, yr * H));
        } else {
            this.player.hp = this.storedHp || CONFIG.PLAYER.MAX_HP;
        }

        this.gun = new Gun();
        if (saved.gun && typeof saved.gun.ammo === 'number') {
            this.gun.ammo = Math.max(0, Math.min(this.gun.maxAmmo, saved.gun.ammo));
            this.gun.isReloading = !!saved.gun.isReloading;
            this.gun.reloadStart = saved.gun.reloadStart || 0;
            if (this.gun.isReloading && !this.gun.reloadStart) {
                this.gun.reloadStart = performance.now() - 2000;
            }
        }

        this.bulletManager = new BulletManager(this.canvas);
        this.particles = new ParticleSystem();

        const positions = this._getStagePositions(this.currentStage, W, H);
        if (saved.towers && saved.towers.length === 5) {
            this.towers = saved.towers.map((ts, i) => {
                const pos = positions[i] || { x: W * 0.5, y: H * 0.25 };
                const tower = new Tower(ts.type, pos.x, pos.y, this.canvas);
                tower.hits = Math.max(0, Math.min(CONFIG.TOWER.HITS_TO_DESTROY, ts.hits || 0));
                tower.isDestroyed = !!ts.isDestroyed;
                tower.isDisabled = !!ts.isDisabled;
                tower.disabledUntil = ts.disabledUntil || 0;
                tower.patternTime = ts.patternTime || 0;
                tower.lastFire = ts.lastFire || 0;
                return tower;
            });
        } else {
            this.towers = this._generateTowers();
        }

        this.state = GameState.PLAYING;
        this._updateHUD();

        const sumDestroyed = this.towers.filter(t => t.isDestroyed).length;
        console.log(`[存档恢复] 关卡=${this.currentStage+1} 血量=${this.player.hp} 弹药=${this.gun.ammo} 已摧毁=${sumDestroyed}/5 分数=${this.score}`);

        setTimeout(() => this._saveState(false), 150);

        this._savedData = null;
    }

    _clearSavedState() {
        try {
            localStorage.removeItem(Game.STORAGE_KEY);
            localStorage.removeItem(Game.STORAGE_BACKUP_KEY);
        } catch (e) {}
    }

    _generateTowers() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const positions = this._getStagePositions(this.currentStage, W, H);
        const types = [TOWER_TYPES.LINEAR, TOWER_TYPES.FAN, TOWER_TYPES.SPIRAL, 
                      TOWER_TYPES.TRACKING, TOWER_TYPES.BOUNCE];
        return types.map((type, i) => new Tower(type, positions[i].x, positions[i].y, this.canvas));
    }

    _getStagePositions(stage, W, H) {
        const marginY = H * 0.18;
        const marginX = W * 0.12;
        
        const layouts = [
            [
                { x: W * 0.2, y: marginY },
                { x: W * 0.5, y: marginY * 0.7 },
                { x: W * 0.8, y: marginY },
                { x: W * 0.3, y: H * 0.42 },
                { x: W * 0.7, y: H * 0.42 }
            ],
            [
                { x: marginX, y: H * 0.2 },
                { x: W - marginX, y: H * 0.2 },
                { x: W * 0.5, y: marginY * 0.8 },
                { x: W * 0.5, y: H * 0.35 },
                { x: W * 0.5, y: H * 0.55 }
            ],
            [
                { x: W * 0.15, y: H * 0.15 },
                { x: W * 0.85, y: H * 0.15 },
                { x: W * 0.5, y: H * 0.25 },
                { x: W * 0.15, y: H * 0.5 },
                { x: W * 0.85, y: H * 0.5 }
            ]
        ];

        return layouts[Math.min(stage, layouts.length - 1)];
    }

    _update() {
        if (this.state !== GameState.PLAYING) return;
        if (!this.player || !this.gun || !this.towers || !this.bulletManager) return;

        this.player.update(this.keys, this.mouseX, this.mouseY);
        this.gun.update();

        for (const tower of this.towers) {
            tower.update(this.player, this.bulletManager);
        }

        this.bulletManager.update(this.player, () => {
            const hit = this.player.takeDamage(CONFIG.PLAYER.DAMAGE);
            if (hit) {
                this.particles.emit(this.player.x, this.player.y, '#ff6b6b', 8, 4);
                this._saveState(false);
            }
            return hit;
        });

        this._checkGunTowerCollisions();
        this._checkStageComplete();
        this.particles.update();
        this._updateHUD();

        if (this.player.isDead()) {
            this._gameOver(false);
        }
    }

    _checkGunTowerCollisions() {
        if (!this.gun || !this.gun.bullets || !this.towers) return;
        for (let i = this.gun.bullets.length - 1; i >= 0; i--) {
            const gb = this.gun.bullets[i];
            for (const tower of this.towers) {
                if (tower.isDestroyed) continue;
                const dx = gb.x - tower.x;
                const dy = gb.y - tower.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < tower.radius + gb.size) {
                    this.gun.bullets.splice(i, 1);
                    const result = tower.hit();
                    this.particles.emit(gb.x, gb.y, tower.color, 12, 6);

                    if (result === 'destroyed') {
                        this.particles.emit(tower.x, tower.y, tower.color, 30, 10);
                        this.score += CONFIG.TOWER.SCORE_PER_DESTROY;
                        this.totalDestroyed++;
                        this.stageDestroyed[this.currentStage]++;
                    } else if (result === 'disabled') {
                        this.score += CONFIG.TOWER.SCORE_PER_HIT;
                    }
                    this._saveState();
                    break;
                }
            }
        }
    }

    _checkStageComplete() {
        if (!this.towers || !this.player) return;
        const allDestroyed = this.towers.every(t => t.isDestroyed);
        if (allDestroyed) {
            this.stagesCleared++;
            this.storedHp = this.player.hp;
            const prevHp = this.storedHp;
            this.player.heal(CONFIG.SAFE_ZONE_HEAL);
            this.storedHp = this.player.hp;

            setTimeout(() => {
                this._showSafeZone(this.currentStage, this.stageDestroyed[this.currentStage], prevHp);
            }, 800);

            this.state = GameState.SAFE_ZONE;
        }
    }

    _showSafeZone(stage, destroyed, prevHp) {
        this.state = GameState.SAFE_ZONE;
        this._saveState();
        document.getElementById('safe-desc').textContent = 
            stage < CONFIG.STAGES - 1 
                ? `你成功清理了第 ${stage + 1} 个弹幕场！`
                : '恭喜你清理了最后一个弹幕场！';
        document.getElementById('safe-hp').textContent = prevHp;
        document.getElementById('safe-destroyed').textContent = destroyed;
        document.getElementById('safe-score').textContent = this.score;
        document.getElementById('next-hint').textContent = 
            stage < CONFIG.STAGES - 1 
                ? '恢复30点血量，准备好迎接下一场挑战了吗？'
                : '你完成了所有关卡！查看最终成绩吧。';
        document.getElementById('next-stage-btn').textContent = 
            stage < CONFIG.STAGES - 1 ? '进入下一场' : '查看成绩';

        document.body.classList.remove('game-active');
        document.getElementById('game-container').classList.remove('game-active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('safe-zone-screen').classList.add('active');
    }

    _updateSafeZoneUI() {
        const stage = this.currentStage;
        const destroyed = this.stageDestroyed[stage] || 0;
        const hpBeforeHeal = Math.max(0, this.storedHp - CONFIG.SAFE_ZONE_HEAL);
        document.getElementById('safe-desc').textContent =
            stage < CONFIG.STAGES - 1
                ? `你成功清理了第 ${stage + 1} 个弹幕场！`
                : '恭喜你清理了最后一个弹幕场！';
        document.getElementById('safe-hp').textContent = hpBeforeHeal;
        document.getElementById('safe-destroyed').textContent = destroyed;
        document.getElementById('safe-score').textContent = this.score;
        document.getElementById('next-hint').textContent =
            stage < CONFIG.STAGES - 1
                ? '恢复30点血量，准备好迎接下一场挑战了吗？'
                : '你完成了所有关卡！查看最终成绩吧。';
        document.getElementById('next-stage-btn').textContent =
            stage < CONFIG.STAGES - 1 ? '进入下一场' : '查看成绩';
    }

    async _gameOver(victory) {
        this.state = GameState.GAME_OVER;
        this._clearSavedState();

        const finalHp = this.player ? this.player.hp : 0;
        const finalScore = this.score + Math.max(0, finalHp) * 10;

        let rank = '-';
        try {
            const response = await fetch('/api/game/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: this.playerName,
                    score: finalScore,
                    towers_destroyed: this.totalDestroyed,
                    stage1_destroyed: this.stageDestroyed[0] || 0,
                    stage2_destroyed: this.stageDestroyed[1] || 0,
                    stage3_destroyed: this.stageDestroyed[2] || 0,
                    remaining_hp: Math.max(0, finalHp),
                    stages_cleared: this.stagesCleared
                })
            });
            const data = await response.json();
            if (data.code === 0) {
                rank = data.data.rank;
            }
        } catch (e) {
            console.warn('提交成绩失败:', e);
        }

        document.getElementById('gameover-title').textContent = 
            victory ? '🏆 全部通关！' : '💀 狩猎失败';
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('final-s1').textContent = this.stageDestroyed[0] || 0;
        document.getElementById('final-s2').textContent = this.stageDestroyed[1] || 0;
        document.getElementById('final-s3').textContent = this.stageDestroyed[2] || 0;
        document.getElementById('final-total').textContent = this.totalDestroyed;
        document.getElementById('final-cleared').textContent = `${this.stagesCleared} / 3`;
        document.getElementById('final-hp').textContent = Math.max(0, finalHp);
        document.getElementById('rank-value').textContent = rank;

        document.body.classList.remove('game-active');
        document.getElementById('game-container').classList.remove('game-active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('safe-zone-screen').classList.remove('active');
        document.getElementById('gameover-screen').classList.add('active');

        this.score = finalScore;
    }

    async _loadLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">加载中...</td></tr>';

        try {
            const response = await fetch('/api/game/leaderboard/get?limit=50');
            const data = await response.json();
            if (data.code === 0 && data.data.items.length > 0) {
                tbody.innerHTML = data.data.items.map(item => `
                    <tr>
                        <td>${this._renderRank(item.rank)}</td>
                        <td>${this._escapeHtml(item.player_name)}</td>
                        <td><strong>${item.score}</strong></td>
                        <td>${item.towers_destroyed}</td>
                        <td>${item.stages_cleared}/3</td>
                        <td>${item.remaining_hp}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-message">暂无记录，成为第一个上榜的猎人吧！</td></tr>';
            }
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">加载失败，请稍后重试</td></tr>';
        }
    }

    _renderRank(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    }

    _escapeHtml(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    _updateHUD() {
        if (!this.player || !this.gun || !this.towers) return;
        const hpPct = Math.max(0, this.player.hp) / CONFIG.PLAYER.MAX_HP * 100;
        const hpBar = document.getElementById('hp-bar');
        hpBar.style.width = `${hpPct}%`;
        hpBar.style.backgroundPosition = `${100 - hpPct}% 0`;
        document.getElementById('hp-text').textContent = 
            `${Math.max(0, Math.ceil(this.player.hp))} / ${CONFIG.PLAYER.MAX_HP}`;

        document.getElementById('ammo-text').textContent = 
            `${this.gun.ammo} / ${this.gun.maxAmmo}`;
        document.getElementById('reload-text').classList.toggle('hidden', !this.gun.isReloading);

        document.getElementById('stage-text').textContent = 
            `第 ${this.currentStage + 1} 场 / 共 ${CONFIG.STAGES} 场`;
        document.getElementById('tower-count-text').textContent = 
            this.towers.filter(t => !t.isDestroyed).length;
        document.getElementById('score-text').textContent = this.score;
    }

    _draw() {
        if (!this.ctx || this.canvas.width <= 0 || this.canvas.height <= 0) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) return;
        if (!this.player || !this.gun || !this.towers || !this.bulletManager) return;

        this._drawGrid();

        this.bulletManager.draw(this.ctx);

        for (const tower of this.towers) {
            tower.draw(this.ctx);
        }

        this.gun.draw(this.ctx);

        this.player.draw(this.ctx);

        this._drawAimLine();

        this.particles.draw(this.ctx);
    }

    _drawGrid() {
        if (this.canvas.width <= 0 || this.canvas.height <= 0) return;
        this.ctx.strokeStyle = 'rgba(72, 219, 251, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.2)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(4, 4, this.canvas.width - 8, this.canvas.height - 8);
    }

    _drawAimLine() {
        if (!this.player) return;
        this.ctx.strokeStyle = 'rgba(254, 202, 87, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([6, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.mouseX, this.mouseY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.strokeStyle = 'rgba(254, 202, 87, 0.8)';
        this.ctx.lineWidth = 2;
        const cx = this.mouseX, cy = this.mouseY;
        const r = 10;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(cx - r - 6, cy); this.ctx.lineTo(cx - r + 3, cy);
        this.ctx.moveTo(cx + r - 3, cy); this.ctx.lineTo(cx + r + 6, cy);
        this.ctx.moveTo(cx, cy - r - 6); this.ctx.lineTo(cx, cy - r + 3);
        this.ctx.moveTo(cx, cy + r - 3); this.ctx.lineTo(cx, cy + r + 6);
        this.ctx.stroke();
    }

    loop() {
        this._update();
        this._draw();
        requestAnimationFrame(() => this.loop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.loop();

    if (game._hasSavedState() && game._loadState(true)) {
        if (game.state === GameState.SAFE_ZONE) {
            game._updateSafeZoneUI();
            document.getElementById('start-screen').classList.remove('active');
            document.getElementById('safe-zone-screen').classList.add('active');
        } else if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
            document.getElementById('start-screen').classList.remove('active');
            document.getElementById('game-screen').classList.add('active');
            document.body.classList.add('game-active');
            document.getElementById('game-container').classList.add('game-active');
            game._resizeCanvas();
            setTimeout(() => {
                game._resizeCanvas();
                const wasPaused = game.state === GameState.PAUSED;
                game._rebuildCurrentStage();
                if (wasPaused) {
                    game.state = GameState.PAUSED;
                    document.getElementById('pause-screen').classList.add('active');
                }
            }, 100);
        }
    }
});
