// ============================================================
// 异星逃生 - 横版射击闯关游戏
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const GROUND_Y = CANVAS_HEIGHT - 60;
const GRAVITY = 0.6;

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
    VICTORY: 'victory',
    LEADERBOARD: 'leaderboard'
};

const AREAS = {
    FUNGUS: {
        id: 0,
        name: '菌类森林',
        bgColor1: '#1a0a2e',
        bgColor2: '#2d1b4e',
        groundColor: '#3d2857',
        accentColor: '#7fff7f'
    },
    LAVA: {
        id: 1,
        name: '熔岩地带',
        bgColor1: '#2a0a0a',
        bgColor2: '#4a1500',
        groundColor: '#5a2510',
        accentColor: '#ff6600'
    },
    NEST: {
        id: 2,
        name: '异形巢穴',
        bgColor1: '#1a1a1a',
        bgColor2: '#2a2a2a',
        groundColor: '#3a3a3a',
        accentColor: '#aa44ff'
    }
};

const WEAPONS = {
    pistol: {
        name: '手枪',
        damage: 10,
        fireRate: 300,
        bulletSpeed: 12,
        bulletCount: 1,
        spread: 0,
        bulletSize: 4,
        color: '#ffff00'
    },
    shotgun: {
        name: '散弹枪',
        damage: 8,
        fireRate: 600,
        bulletSpeed: 10,
        bulletCount: 5,
        spread: 0.3,
        bulletSize: 3,
        color: '#ff8800'
    },
    plasma: {
        name: '等离子枪',
        damage: 25,
        fireRate: 400,
        bulletSpeed: 16,
        bulletCount: 1,
        spread: 0,
        bulletSize: 6,
        color: '#00ffff'
    }
};

let gameState = GAME_STATE.MENU;
let currentArea = 0;
let gameTime = 0;
let lastTime = 0;
let specimenCount = 0;
let playerName = '宇航员';
let cameraX = 0;
let areaWidth = 3000;

const keys = {};
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;

let player = null;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let pickups = [];
let specimens = [];
let particles = [];
let platforms = [];
let hazards = [];
let boss = null;

// ============================================================
// 玩家类
// ============================================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpPower = -14;
        this.onGround = false;
        this.health = 100;
        this.maxHealth = 100;
        this.facingRight = true;
        this.weapon = 'pistol';
        this.lastShotTime = 0;
        this.invincible = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.onSlime = false;
    }

    update(dt) {
        let moveSpeed = this.speed;
        if (this.onSlime) moveSpeed *= 0.4;

        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.vx = -moveSpeed;
            this.facingRight = false;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            this.vx = moveSpeed;
            this.facingRight = true;
        } else {
            this.vx *= 0.8;
        }

        if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
        }

        this.vy += GRAVITY;
        if (this.vy > 15) this.vy = 15;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x > areaWidth - this.width) this.x = areaWidth - this.width;

        this.onGround = false;
        this.onSlime = false;

        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        for (let plat of platforms) {
            if (this.vy > 0 &&
                this.x + this.width > plat.x &&
                this.x < plat.x + plat.width &&
                this.y + this.height >= plat.y &&
                this.y + this.height <= plat.y + 20) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.onGround = true;
                if (plat.type === 'slime') {
                    this.onSlime = true;
                }
            }
        }

        if (this.invincible > 0) {
            this.invincible -= dt;
        }

        this.animTimer += dt;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    shoot() {
        const now = Date.now();
        const weapon = WEAPONS[this.weapon];
        if (now - this.lastShotTime < weapon.fireRate) return;
        this.lastShotTime = now;

        const worldMouseX = mouseX + cameraX;
        const worldMouseY = mouseY;
        const startX = this.x + this.width / 2;
        const startY = this.y + this.height / 2;

        const baseAngle = Math.atan2(worldMouseY - startY, worldMouseX - startX);

        for (let i = 0; i < weapon.bulletCount; i++) {
            let angle = baseAngle;
            if (weapon.bulletCount > 1) {
                angle += (i - (weapon.bulletCount - 1) / 2) * weapon.spread;
            }

            bullets.push(new Bullet(
                startX,
                startY,
                Math.cos(angle) * weapon.bulletSpeed,
                Math.sin(angle) * weapon.bulletSpeed,
                weapon.damage,
                weapon.bulletSize,
                weapon.color,
                true
            ));
        }

        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(
                startX + Math.cos(baseAngle) * 20,
                startY + Math.sin(baseAngle) * 20,
                Math.cos(baseAngle + (Math.random() - 0.5)) * 3,
                Math.sin(baseAngle + (Math.random() - 0.5)) * 3,
                weapon.color,
                200
            ));
        }
    }

    takeDamage(damage) {
        if (this.invincible > 0) return;
        this.health -= damage;
        this.invincible = 1000;

        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                '#ff4444',
                500
            ));
        }

        if (this.health <= 0) {
            this.health = 0;
            gameOver();
        }
        updateHUD();
    }

    pickupWeapon(weaponType) {
        this.weapon = weaponType;
        updateHUD();

        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                WEAPONS[weaponType].color,
                600
            ));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        if (this.invincible > 0 && Math.floor(this.invincible / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const x = this.x;
        const y = this.y;

        ctx.fillStyle = '#4a90d9';
        ctx.fillRect(x + 4, y + 10, 24, 30);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 16, y + 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.arc(x + 16, y + 10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(x + 6, y + 40, 8, 8);
        ctx.fillRect(x + 18, y + 40, 8, 8);

        const weaponColor = WEAPONS[this.weapon].color;
        ctx.fillStyle = weaponColor;
        const gunDir = this.facingRight ? 1 : -1;
        ctx.fillRect(x + 16 + gunDir * 8, y + 20, 16 * gunDir, 6);

        ctx.restore();
    }
}

// ============================================================
// 子弹类
// ============================================================
class Bullet {
    constructor(x, y, vx, vy, damage, size, color, isPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.size = size;
        this.color = color;
        this.isPlayer = isPlayer;
        this.alive = true;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < cameraX - 100 || this.x > cameraX + CANVAS_WIDTH + 100 ||
            this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
            this.alive = false;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.size * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// ============================================================
// 敌人类 - 基类
// ============================================================
class Enemy {
    constructor(x, y, health) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.health = health;
        this.maxHealth = health;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
        this.onGround = false;
        this.damage = 10;
        this.specimenDrop = 1;
        this.color = '#ff6600';
    }

    update() {
        this.vy += GRAVITY * 0.8;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }
    }

    takeDamage(damage) {
        this.health -= damage;

        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                '#ffaa00',
                300
            ));
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;

        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                this.color,
                800
            ));
        }

        if (Math.random() < 0.3) {
            const weaponTypes = ['shotgun', 'plasma'];
            if (Math.random() < 0.7) {
                pickups.push(new Pickup(
                    this.x + this.width / 2,
                    this.y,
                    'weapon',
                    weaponTypes[Math.floor(Math.random() * weaponTypes.length)]
                ));
            } else {
                pickups.push(new Pickup(
                    this.x + this.width / 2,
                    this.y,
                    'health'
                ));
            }
        }

        if (this.specimenDrop > 0 && Math.random() < 0.5) {
            specimens.push(new Specimen(
                this.x + this.width / 2,
                this.y
            ));
        }
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

// ============================================================
// 跳虫 - 菌类森林敌人
// ============================================================
class JumperBug extends Enemy {
    constructor(x, y) {
        super(x, y, 30);
        this.width = 36;
        this.height = 28;
        this.color = '#7fff7f';
        this.jumpTimer = Math.random() * 2000;
        this.jumpInterval = 1500 + Math.random() * 1000;
        this.damage = 15;
        this.speed = 2;
    }

    update(dt) {
        super.update();

        this.jumpTimer += dt || 16;

        if (this.onGround && this.jumpTimer >= this.jumpInterval) {
            this.jumpTimer = 0;
            this.jumpInterval = 1500 + Math.random() * 1000;

            if (player) {
                const dir = player.x < this.x ? -1 : 1;
                this.vx = dir * this.speed;
                this.vy = -12;
                this.onGround = false;
            }
        }

        if (this.onGround) {
            this.vx *= 0.9;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const x = this.x;
        const y = this.y;

        ctx.fillStyle = '#5fdf5f';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9fff9f';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 6, y + 8, 5, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 6, y + 8, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 6, y + 8, 2, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 6, y + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3fbf3f';
        ctx.fillRect(x + 4, y + this.height - 4, 6, 8);
        ctx.fillRect(x + this.width - 10, y + this.height - 4, 6, 8);

        const healthPct = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 10, this.width, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x, y - 10, this.width * healthPct, 4);

        ctx.restore();
    }
}

// ============================================================
// 孢子射手 - 菌类森林远程敌人
// ============================================================
class SporeShooter extends Enemy {
    constructor(x, y) {
        super(x, y, 50);
        this.width = 40;
        this.height = 50;
        this.color = '#bf7fff';
        this.shootTimer = Math.random() * 1500;
        this.shootInterval = 2000;
        this.damage = 10;
        this.specimenDrop = 2;
    }

    update(dt) {
        super.update();
        this.vx = 0;

        this.shootTimer += dt || 16;

        if (player && this.shootTimer >= this.shootInterval) {
            const dist = Math.abs(player.x - this.x);
            if (dist < 600) {
                this.shootTimer = 0;
                this.shoot();
            }
        }
    }

    shoot() {
        if (!player) return;

        const startX = this.x + this.width / 2;
        const startY = this.y + 15;
        const angle = Math.atan2(player.y + player.height / 2 - startY, player.x + player.width / 2 - startX);
        const speed = 6;

        enemyBullets.push(new Bullet(
            startX, startY,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            this.damage,
            8,
            '#bf7fff',
            false
        ));
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const x = this.x;
        const y = this.y;

        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + this.width / 2 - 4, y + 25, 8, this.height - 25);

        ctx.fillStyle = '#9f5fdf';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + 20, 22, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#bf7fff';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 8, y + 18, 4, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 8, y + 15, 3, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2, y + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 8, y + 22, 4, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 8, y + 22, 4, 0, Math.PI * 2);
        ctx.fill();

        const healthPct = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 10, this.width, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x, y - 10, this.width * healthPct, 4);

        ctx.restore();
    }
}

// ============================================================
// 岩浆蠕虫 - 熔岩地带敌人
// ============================================================
class LavaWorm extends Enemy {
    constructor(x) {
        super(x, GROUND_Y - 10, 60);
        this.width = 50;
        this.height = 80;
        this.color = '#ff4400';
        this.state = 'hidden';
        this.timer = Math.random() * 3000;
        this.emergeTime = 2000;
        this.hideTime = 2500;
        this.damage = 20;
        this.specimenDrop = 2;
        this.currentHeight = 0;
        this.targetHeight = 80;
    }

    update(dt) {
        this.timer += dt || 16;

        if (this.state === 'hidden') {
            if (this.timer >= this.hideTime) {
                if (player && Math.abs(player.x - this.x) < 400) {
                    this.state = 'emerging';
                    this.timer = 0;
                } else {
                    this.timer = 0;
                }
            }
        } else if (this.state === 'emerging') {
            this.currentHeight = (this.timer / 500) * this.targetHeight;
            if (this.currentHeight >= this.targetHeight) {
                this.currentHeight = this.targetHeight;
                this.state = 'active';
                this.timer = 0;
            }
        } else if (this.state === 'active') {
            if (this.timer >= this.emergeTime) {
                this.state = 'hiding';
                this.timer = 0;
            }
        } else if (this.state === 'hiding') {
            this.currentHeight = this.targetHeight - (this.timer / 500) * this.targetHeight;
            if (this.currentHeight <= 0) {
                this.currentHeight = 0;
                this.state = 'hidden';
                this.timer = 0;
            }
        }

        this.y = GROUND_Y - this.currentHeight;
        this.height = this.currentHeight;
    }

    takeDamage(damage) {
        if (this.state === 'hidden') return;
        super.takeDamage(damage);
    }

    die() {
        super.die();
        this.currentHeight = 0;
        this.y = GROUND_Y;
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        if (this.currentHeight <= 0) {
            ctx.restore();
            return;
        }

        const x = this.x;
        const y = this.y;
        const h = this.currentHeight;

        ctx.fillStyle = '#cc3300';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + h / 2, this.width / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2 - 8, y + h / 2 - 10, 6, h / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 12, y + 15, 6, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 12, y + 15, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 12, y + 15, 2, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 12, y + 15, 2, 0, Math.PI * 2);
        ctx.fill();

        if (this.state === 'active') {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(x + this.width / 2, y + 30, 8, 0, Math.PI);
            ctx.fill();
        }

        const healthPct = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 10, this.width, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x, y - 10, this.width * healthPct, 4);

        ctx.restore();
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

// ============================================================
// 异形小虫 - 巢穴小怪
// ============================================================
class AlienBug extends Enemy {
    constructor(x, y) {
        super(x, y, 20);
        this.width = 30;
        this.height = 25;
        this.color = '#aa44ff';
        this.speed = 3;
        this.damage = 8;
        this.specimenDrop = 1;
        this.animTimer = 0;
    }

    update() {
        super.update();

        if (player) {
            const dir = player.x < this.x ? -1 : 1;
            this.vx = dir * this.speed;

            if (this.onGround && Math.abs(player.y - this.y) > 50 && Math.random() < 0.02) {
                this.vy = -10;
            }
        }

        this.animTimer += 16;
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const x = this.x;
        const y = this.y;
        const wobble = Math.sin(this.animTimer / 100) * 2;

        ctx.fillStyle = '#8822dd';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2 + wobble, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#aa44ff';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + 6, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 4, y + 5, 3, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 4, y + 5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#6611aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + this.width / 2 - 5, y);
        ctx.lineTo(x + this.width / 2 - 8, y - 8);
        ctx.moveTo(x + this.width / 2 + 5, y);
        ctx.lineTo(x + this.width / 2 + 8, y - 8);
        ctx.stroke();

        const healthPct = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 10, this.width, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x, y - 10, this.width * healthPct, 4);

        ctx.restore();
    }
}

// ============================================================
// 母虫 Boss - 第三区域
// ============================================================
class BossQueen extends Enemy {
    constructor(x) {
        super(x, GROUND_Y - 150, 500);
        this.width = 120;
        this.height = 150;
        this.color = '#8800aa';
        this.phase = 1;
        this.attackTimer = 0;
        this.attackInterval = 2000;
        this.damage = 25;
        this.specimenDrop = 10;
        this.summonCount = 0;
        this.animTimer = 0;
        this.isBoss = true;
    }

    update(dt) {
        this.vx = 0;
        this.vy = 0;
        this.animTimer += dt || 16;
        this.attackTimer += dt || 16;

        const healthPct = this.health / this.maxHealth;
        if (healthPct < 0.3) this.phase = 3;
        else if (healthPct < 0.6) this.phase = 2;

        if (this.attackTimer >= this.attackInterval / this.phase) {
            this.attackTimer = 0;
            this.attack();
        }
    }

    attack() {
        if (!player) return;

        const attackType = Math.random();

        if (attackType < 0.5) {
            this.shootAcid();
        } else {
            this.summonBugs();
        }
    }

    shootAcid() {
        const startX = this.x + this.width / 2;
        const startY = this.y + 40;
        const count = 3 + this.phase;

        for (let i = 0; i < count; i++) {
            const angle = Math.atan2(player.y - startY, player.x - startX) + (i - count / 2) * 0.2;
            const speed = 7;

            enemyBullets.push(new Bullet(
                startX, startY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                15,
                10,
                '#00ff44',
                false
            ));
        }
    }

    summonBugs() {
        const count = 1 + Math.floor(this.phase / 2);
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const bug = new AlienBug(this.x + offsetX, this.y + this.height - 30);
            bug.vy = -5;
            enemies.push(bug);
        }
        this.summonCount += count;
    }

    die() {
        super.die();
        boss = null;

        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(
                this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                Math.random() < 0.5 ? '#aa44ff' : '#ff0066',
                1500
            ));
        }

        setTimeout(() => {
            if (gameState === GAME_STATE.PLAYING) {
                victory();
            }
        }, 2000);
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const x = this.x;
        const y = this.y;
        const pulse = Math.sin(this.animTimer / 300) * 3;

        ctx.fillStyle = '#660088';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height - 20, this.width / 2 + pulse, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8822aa';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2 - 10, this.height / 2 - 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#aa44cc';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + 40 + pulse / 2, 35, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        const eyeGlow = Math.sin(this.animTimer / 200) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 0, 100, ${eyeGlow})`;
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 12, y + 35, 8, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 12, y + 35, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 12, y + 35, 3, 0, Math.PI * 2);
        ctx.arc(x + this.width / 2 + 12, y + 35, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#550077';
        for (let i = 0; i < 4; i++) {
            const legX = x + 20 + i * 27;
            ctx.fillRect(legX, y + this.height - 20, 4, 25);
        }

        const healthPct = this.health / this.maxHealth;
        ctx.fillStyle = '#222';
        ctx.fillRect(x - 10, y - 25, this.width + 20, 12);
        ctx.fillStyle = '#ff0066';
        ctx.fillRect(x - 10, y - 25, (this.width + 20) * healthPct, 12);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 25, this.width + 20, 12);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('母虫 BOSS', x + this.width / 2, y - 30);

        ctx.restore();
    }
}

// ============================================================
// 拾取物类
// ============================================================
class Pickup {
    constructor(x, y, type, subType) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.subType = subType || null;
        this.vy = -3;
        this.alive = true;
        this.bobTimer = Math.random() * Math.PI * 2;
    }

    update() {
        this.vy += GRAVITY * 0.5;
        this.y += this.vy;

        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
        }

        this.bobTimer += 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const bob = Math.sin(this.bobTimer) * 3;
        const y = this.y + bob;

        if (this.type === 'weapon') {
            const color = WEAPONS[this.subType].color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, y + 5, this.width, this.height - 10);

            ctx.fillStyle = color;
            ctx.fillRect(this.x + 5, y + 10, this.width - 10, this.height - 20);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(WEAPONS[this.subType].name, this.x + this.width / 2, y - 5);
        } else if (this.type === 'health') {
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 15;

            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + 5, y + 10, this.width - 10, this.height - 20);
            ctx.fillRect(this.x + 10, y + 5, this.width - 20, this.height - 10);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+HP', this.x + this.width / 2, y - 5);
        }

        ctx.restore();
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

// ============================================================
// 标本类
// ============================================================
class Specimen {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.vy = -4;
        this.alive = true;
        this.bobTimer = Math.random() * Math.PI * 2;
    }

    update() {
        this.vy += GRAVITY * 0.4;
        this.y += this.vy;

        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
        }

        this.bobTimer += 0.08;
    }

    collect() {
        this.alive = false;
        specimenCount++;
        updateHUD();

        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                '#aa00ff',
                500
            ));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const bob = Math.sin(this.bobTimer) * 4;
        const y = this.y + bob;

        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#cc44ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, y);
        ctx.lineTo(this.x + this.width, y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, y + this.height);
        ctx.lineTo(this.x, y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 3, y + this.height / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.restore();
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

// ============================================================
// 粒子类
// ============================================================
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 4;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= dt || 16;
    }

    draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(-cameraX, 0);

        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// 危险物 - 岩浆喷发
// ============================================================
class LavaGeyser {
    constructor(x) {
        this.x = x;
        this.y = GROUND_Y;
        this.width = 60;
        this.height = 0;
        this.maxHeight = 200;
        this.state = 'idle';
        this.timer = Math.random() * 4000;
        this.idleTime = 3000 + Math.random() * 2000;
        this.warnTime = 1000;
        this.activeTime = 2000;
        this.damage = 30;
        this.alive = true;
    }

    update(dt) {
        this.timer += dt || 16;

        if (this.state === 'idle') {
            if (this.timer >= this.idleTime) {
                this.state = 'warning';
                this.timer = 0;
            }
        } else if (this.state === 'warning') {
            if (this.timer >= this.warnTime) {
                this.state = 'active';
                this.timer = 0;
            }
        } else if (this.state === 'active') {
            this.height = Math.min(this.maxHeight, this.height + 15);
            if (this.timer >= this.activeTime) {
                this.state = 'cooling';
                this.timer = 0;
            }
        } else if (this.state === 'cooling') {
            this.height = Math.max(0, this.height - 10);
            if (this.height <= 0) {
                this.state = 'idle';
                this.timer = 0;
                this.idleTime = 3000 + Math.random() * 2000;
            }
        }
    }

    getDamageBounds() {
        if (this.state !== 'active' && this.state !== 'cooling') return null;
        return {
            x: this.x,
            y: this.y - this.height,
            width: this.width,
            height: this.height
        };
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        if (this.state === 'warning') {
            const flash = Math.sin(this.timer / 50) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
                ctx.fillRect(this.x, GROUND_Y - 50, this.width, 50);
            }

            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, GROUND_Y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.height > 0) {
            const gradient = ctx.createLinearGradient(0, GROUND_Y - this.height, 0, GROUND_Y);
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.3, '#ff8800');
            gradient.addColorStop(1, '#ff2200');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(this.x, GROUND_Y);
            ctx.lineTo(this.x + 5, GROUND_Y - this.height * 0.9);
            ctx.lineTo(this.x + this.width / 2, GROUND_Y - this.height);
            ctx.lineTo(this.x + this.width - 5, GROUND_Y - this.height * 0.9);
            ctx.lineTo(this.x + this.width, GROUND_Y);
            ctx.closePath();
            ctx.fill();

            for (let i = 0; i < 5; i++) {
                const px = this.x + Math.random() * this.width;
                const py = GROUND_Y - this.height * 0.3 - Math.random() * this.height * 0.7;
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(px, py, 3 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 5, GROUND_Y - 5, this.width + 10, 10);

        ctx.restore();
    }
}

// ============================================================
// 平台类
// ============================================================
class Platform {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type || 'normal';
    }

    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);

        const area = Object.values(AREAS)[currentArea];

        if (this.type === 'slime') {
            ctx.fillStyle = '#7fff7f';
            ctx.shadowColor = '#7fff7f';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = area.groundColor;
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(this.x, this.y, this.width, 3);

        ctx.restore();
    }
}

// ============================================================
// 关卡生成
// ============================================================
function generateArea(areaIndex) {
    enemies = [];
    enemyBullets = [];
    pickups = [];
    specimens = [];
    platforms = [];
    hazards = [];
    particles = [];
    boss = null;
    cameraX = 0;
    areaWidth = 3000;

    if (areaIndex === 0) {
        generateFungusArea();
    } else if (areaIndex === 1) {
        generateLavaArea();
    } else if (areaIndex === 2) {
        generateNestArea();
    }
}

function generateFungusArea() {
    areaWidth = 3500;

    platforms.push(new Platform(300, 450, 150, 20, 'slime'));
    platforms.push(new Platform(600, 380, 120, 20));
    platforms.push(new Platform(900, 320, 150, 20, 'slime'));
    platforms.push(new Platform(1200, 400, 180, 20));
    platforms.push(new Platform(1500, 350, 140, 20, 'slime'));
    platforms.push(new Platform(1800, 280, 160, 20));
    platforms.push(new Platform(2100, 380, 150, 20, 'slime'));
    platforms.push(new Platform(2400, 320, 180, 20));
    platforms.push(new Platform(2800, 400, 150, 20, 'slime'));

    for (let i = 0; i < 12; i++) {
        const x = 400 + i * 250 + Math.random() * 100;
        enemies.push(new JumperBug(x, GROUND_Y - 28));
    }

    for (let i = 0; i < 8; i++) {
        const x = 600 + i * 350 + Math.random() * 100;
        enemies.push(new SporeShooter(x, GROUND_Y - 50));
    }

    pickups.push(new Pickup(800, GROUND_Y - 200, 'weapon', 'shotgun'));
    pickups.push(new Pickup(2000, GROUND_Y - 200, 'health'));

    for (let i = 0; i < 5; i++) {
        specimens.push(new Specimen(500 + i * 600, GROUND_Y - 30 - Math.random() * 100));
    }
}

function generateLavaArea() {
    areaWidth = 3500;

    platforms.push(new Platform(350, 450, 120, 20));
    platforms.push(new Platform(700, 380, 100, 20));
    platforms.push(new Platform(1000, 320, 130, 20));
    platforms.push(new Platform(1400, 400, 150, 20));
    platforms.push(new Platform(1800, 350, 110, 20));
    platforms.push(new Platform(2200, 280, 140, 20));
    platforms.push(new Platform(2600, 380, 130, 20));
    platforms.push(new Platform(2950, 320, 150, 20));

    for (let i = 0; i < 8; i++) {
        const x = 500 + i * 380;
        hazards.push(new LavaGeyser(x));
    }

    for (let i = 0; i < 10; i++) {
        const x = 400 + i * 300 + Math.random() * 80;
        enemies.push(new LavaWorm(x));
    }

    pickups.push(new Pickup(1200, GROUND_Y - 250, 'weapon', 'plasma'));
    pickups.push(new Pickup(2500, GROUND_Y - 200, 'health'));

    for (let i = 0; i < 6; i++) {
        specimens.push(new Specimen(600 + i * 500, GROUND_Y - 30 - Math.random() * 80));
    }
}

function generateNestArea() {
    areaWidth = 2500;

    platforms.push(new Platform(300, 450, 150, 20));
    platforms.push(new Platform(600, 380, 120, 20));
    platforms.push(new Platform(900, 320, 150, 20));
    platforms.push(new Platform(1200, 400, 180, 20));
    platforms.push(new Platform(1500, 350, 140, 20));
    platforms.push(new Platform(1800, 280, 160, 20));

    for (let i = 0; i < 15; i++) {
        const x = 400 + i * 120 + Math.random() * 50;
        const y = GROUND_Y - 25 - Math.random() * 100;
        enemies.push(new AlienBug(x, y));
    }

    pickups.push(new Pickup(500, GROUND_Y - 200, 'health'));
    pickups.push(new Pickup(1400, GROUND_Y - 200, 'health'));
    pickups.push(new Pickup(1000, GROUND_Y - 250, 'weapon', 'plasma'));

    boss = new BossQueen(2100);

    for (let i = 0; i < 4; i++) {
        specimens.push(new Specimen(700 + i * 400, GROUND_Y - 30 - Math.random() * 100));
    }
}

// ============================================================
// 碰撞检测
// ============================================================
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function checkPointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}

// ============================================================
// 游戏更新
// ============================================================
function update(dt) {
    if (gameState !== GAME_STATE.PLAYING) return;

    gameTime += dt;

    player.update(dt);

    if (mouseDown) {
        player.shoot();
    }

    const targetCameraX = player.x - CANVAS_WIDTH / 3;
    cameraX += (targetCameraX - cameraX) * 0.1;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > areaWidth - CANVAS_WIDTH) cameraX = areaWidth - CANVAS_WIDTH;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();

        if (!bullet.isPlayer) continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (!enemy.alive) continue;

            const bounds = enemy.getBounds();
            if (checkPointInRect(bullet.x, bullet.y, bounds)) {
                enemy.takeDamage(bullet.damage);
                bullet.alive = false;
                break;
            }
        }

        if (boss && boss.alive) {
            const bounds = boss.getBounds();
            if (checkPointInRect(bullet.x, bullet.y, bounds)) {
                boss.takeDamage(bullet.damage);
                bullet.alive = false;
            }
        }

        if (!bullet.alive) {
            bullets.splice(i, 1);
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.update();

        if (bullet.isPlayer) continue;

        const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
        if (checkPointInRect(bullet.x, bullet.y, playerBounds)) {
            player.takeDamage(bullet.damage);
            bullet.alive = false;
        }

        if (!bullet.alive) {
            enemyBullets.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.alive) {
            enemy.update(dt);

            const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
            const enemyBounds = enemy.getBounds();
            if (checkCollision(playerBounds, enemyBounds)) {
                player.takeDamage(enemy.damage);
            }
        }

        if (!enemy.alive) {
            enemies.splice(i, 1);
        }
    }

    if (boss && boss.alive) {
        boss.update(dt);

        const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
        const bossBounds = boss.getBounds();
        if (checkCollision(playerBounds, bossBounds)) {
            player.takeDamage(boss.damage);
        }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        pickup.update();

        const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
        const pickupBounds = pickup.getBounds();
        if (checkCollision(playerBounds, pickupBounds)) {
            if (pickup.type === 'weapon') {
                player.pickupWeapon(pickup.subType);
            } else if (pickup.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 30);
                updateHUD();

                for (let j = 0; j < 10; j++) {
                    particles.push(new Particle(
                        player.x + player.width / 2,
                        player.y + player.height / 2,
                        (Math.random() - 0.5) * 5,
                        (Math.random() - 0.5) * 5,
                        '#ff4444',
                        500
                    ));
                }
            }
            pickup.alive = false;
        }

        if (!pickup.alive) {
            pickups.splice(i, 1);
        }
    }

    for (let i = specimens.length - 1; i >= 0; i--) {
        const spec = specimens[i];
        spec.update();

        const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
        const specBounds = spec.getBounds();
        if (checkCollision(playerBounds, specBounds)) {
            spec.collect();
        }

        if (!spec.alive) {
            specimens.splice(i, 1);
        }
    }

    for (let hazard of hazards) {
        hazard.update(dt);
        const dmgBounds = hazard.getDamageBounds();
        if (dmgBounds) {
            const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
            if (checkCollision(playerBounds, dmgBounds)) {
                player.takeDamage(hazard.damage * 0.1);
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    if (currentArea < 2 && player.x >= areaWidth - 50) {
        nextArea();
    }

    if (gameState === GAME_STATE.PLAYING && (Date.now() - lastSaveTime > SAVE_INTERVAL)) {
        saveGameState();
        lastSaveTime = Date.now();
    }

    updateHUD();
}

// ============================================================
// 绘制背景
// ============================================================
function drawBackground() {
    const area = Object.values(AREAS)[currentArea];

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, area.bgColor1);
    gradient.addColorStop(1, area.bgColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-cameraX * 0.3, 0);

    if (currentArea === 0) {
        for (let i = 0; i < 20; i++) {
            const x = i * 200 + 50;
            const h = 100 + Math.sin(i) * 50;
            ctx.fillStyle = 'rgba(100, 50, 150, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y);
            ctx.lineTo(x + 20, GROUND_Y - h);
            ctx.lineTo(x + 40, GROUND_Y);
            ctx.fill();
        }
    } else if (currentArea === 1) {
        for (let i = 0; i < 15; i++) {
            const x = i * 250 + 30;
            ctx.fillStyle = 'rgba(80, 20, 10, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y);
            ctx.lineTo(x + 30, GROUND_Y - 80 - Math.sin(i) * 40);
            ctx.lineTo(x + 60, GROUND_Y);
            ctx.fill();
        }
    } else {
        for (let i = 0; i < 25; i++) {
            const x = i * 150 + 20;
            const y = 100 + Math.sin(i * 0.7) * 80;
            ctx.fillStyle = 'rgba(80, 30, 100, 0.2)';
            ctx.beginPath();
            ctx.arc(x, y, 20 + Math.sin(i) * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();

    ctx.save();
    ctx.translate(-cameraX * 0.6, 0);

    if (currentArea === 0) {
        for (let i = 0; i < 15; i++) {
            const x = i * 280 + 100;
            ctx.fillStyle = 'rgba(127, 255, 127, 0.2)';
            ctx.shadowColor = '#7fff7f';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(x, GROUND_Y - 30, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    ctx.restore();
}

function drawGround() {
    const area = Object.values(AREAS)[currentArea];

    ctx.save();
    ctx.translate(-cameraX, 0);

    ctx.fillStyle = area.groundColor;
    ctx.fillRect(0, GROUND_Y, areaWidth, CANVAS_HEIGHT - GROUND_Y);

    ctx.fillStyle = area.accentColor;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < areaWidth; i += 40) {
        ctx.fillRect(i, GROUND_Y, 20, 3);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, GROUND_Y, areaWidth, 5);

    ctx.restore();
}

// ============================================================
// 渲染
// ============================================================
function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawBackground();
    drawGround();

    for (let plat of platforms) {
        plat.draw();
    }

    for (let hazard of hazards) {
        hazard.draw();
    }

    for (let spec of specimens) {
        spec.draw();
    }

    for (let pickup of pickups) {
        pickup.draw();
    }

    for (let enemy of enemies) {
        if (enemy.alive) {
            enemy.draw();
        }
    }

    if (boss && boss.alive) {
        boss.draw();
    }

    if (player) {
        player.draw();
    }

    for (let bullet of bullets) {
        bullet.draw();
    }

    for (let bullet of enemyBullets) {
        bullet.draw();
    }

    for (let particle of particles) {
        particle.draw();
    }

    if (currentArea < 2) {
        ctx.save();
        ctx.translate(-cameraX, 0);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('→ 前进至下一区域', areaWidth - 100, GROUND_Y - 100);
        ctx.restore();
    }

    if (currentArea === 2 && boss && boss.alive) {
        ctx.save();
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        ctx.strokeRect(5, 5, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
        ctx.restore();
    }
}

// ============================================================
// 游戏循环
// ============================================================
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ============================================================
// HUD 更新
// ============================================================
function updateHUD() {
    if (!player) return;

    const healthPct = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPct + '%';

    document.getElementById('weaponName').textContent = WEAPONS[player.weapon].name;
    document.getElementById('areaName').textContent = Object.values(AREAS)[currentArea].name;
    document.getElementById('specimenCount').textContent = specimenCount;

    const seconds = Math.floor(gameTime / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('gameTime').textContent =
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// ============================================================
// 游戏状态控制
// ============================================================
const SAVE_KEY = 'alien_escape_save';
const SAVE_INTERVAL = 2000;
let lastSaveTime = 0;

function startGame(loadSave = false) {
    if (!loadSave) {
        const nameInput = document.getElementById('playerNameInput').value.trim();
        if (!nameInput) {
            alert('请输入昵称后再开始游戏！');
            document.getElementById('playerNameInput').focus();
            return;
        }
        playerName = nameInput;
    }

    if (!loadSave) {
        currentArea = 0;
        gameTime = 0;
        specimenCount = 0;
        bullets = [];
        enemyBullets = [];
        particles = [];

        player = new Player(50, GROUND_Y - 48);
        generateArea(0);
        showAreaTransition(1, '菌类森林');
    }

    gameState = GAME_STATE.PLAYING;

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');
    document.getElementById('leaderboardScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');

    updateHUD();
}

function nextArea() {
    currentArea++;
    generateArea(currentArea);

    player.x = 50;
    player.y = GROUND_Y - player.height;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;

    const areaNames = ['菌类森林', '熔岩地带', '异形巢穴'];
    showAreaTransition(currentArea + 1, areaNames[currentArea]);

    setTimeout(() => saveGameState(), 2500);
}

function showAreaTransition(areaNum, areaName) {
    const transition = document.getElementById('areaTransition');
    document.getElementById('transitionTitle').textContent = '区域 ' + areaNum;
    document.getElementById('transitionSubtitle').textContent = areaName;
    transition.classList.remove('hidden');

    setTimeout(() => {
        transition.classList.add('hidden');
    }, 2000);
}

function pauseGame() {
    if (gameState !== GAME_STATE.PLAYING) return;
    gameState = GAME_STATE.PAUSED;
    document.getElementById('pauseScreen').classList.remove('hidden');
}

function resumeGame() {
    if (gameState !== GAME_STATE.PAUSED) return;
    gameState = GAME_STATE.PLAYING;
    document.getElementById('pauseScreen').classList.add('hidden');
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    clearSave();

    document.getElementById('gameUI').classList.add('hidden');
    document.getElementById('finalSpecimens').textContent = specimenCount;

    const seconds = Math.floor(gameTime / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('finalTime').textContent =
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function victory() {
    gameState = GAME_STATE.VICTORY;
    clearSave();

    document.getElementById('gameUI').classList.add('hidden');
    document.getElementById('victorySpecimens').textContent = specimenCount;

    const seconds = Math.floor(gameTime / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('victoryTime').textContent =
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    document.getElementById('victoryScreen').classList.remove('hidden');
    document.getElementById('submitRecordBtn').style.display = 'inline-block';
    document.getElementById('rankText').textContent = '';
}

function backToMenu() {
    gameState = GAME_STATE.MENU;
    clearSave();
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.add('hidden');
    updateContinueButton();
}

// ============================================================
// 游戏存档系统
// ============================================================
function saveGameState() {
    if (gameState !== GAME_STATE.PLAYING) return;

    try {
        const saveData = {
            playerName: playerName,
            currentArea: currentArea,
            gameTime: gameTime,
            specimenCount: specimenCount,
            cameraX: cameraX,
            areaWidth: areaWidth,
            player: player ? {
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy,
                health: player.health,
                maxHealth: player.maxHealth,
                weapon: player.weapon,
                facingRight: player.facingRight,
                onGround: player.onGround,
                invincible: player.invincible
            } : null,
            bullets: bullets.map(b => ({
                x: b.x, y: b.y, vx: b.vx, vy: b.vy,
                damage: b.damage, size: b.size, color: b.color, isPlayer: b.isPlayer
            })),
            enemyBullets: enemyBullets.map(b => ({
                x: b.x, y: b.y, vx: b.vx, vy: b.vy,
                damage: b.damage, size: b.size, color: b.color, isPlayer: b.isPlayer
            })),
            enemies: enemies.filter(e => e.alive).map(e => serializeEnemy(e)),
            pickups: pickups.filter(p => p.alive).map(p => ({
                x: p.x, y: p.y, type: p.type, subType: p.subType
            })),
            specimens: specimens.filter(s => s.alive).map(s => ({
                x: s.x, y: s.y
            })),
            boss: boss && boss.alive ? {
                x: boss.x, y: boss.y, health: boss.health,
                maxHealth: boss.maxHealth, phase: boss.phase
            } : null,
            hazards: hazards.map(h => ({
                x: h.x, state: h.state, timer: h.timer,
                height: h.height, idleTime: h.idleTime
            }))
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.warn('保存游戏状态失败:', e);
    }
}

function serializeEnemy(e) {
    const base = {
        type: e.constructor.name,
        x: e.x, y: e.y, health: e.health,
        maxHealth: e.maxHealth, vx: e.vx, vy: e.vy
    };

    if (e instanceof JumperBug) {
        base.jumpTimer = e.jumpTimer;
        base.jumpInterval = e.jumpInterval;
    } else if (e instanceof SporeShooter) {
        base.shootTimer = e.shootTimer;
    } else if (e instanceof LavaWorm) {
        base.state = e.state;
        base.timer = e.timer;
        base.currentHeight = e.currentHeight;
    } else if (e instanceof AlienBug) {
        base.animTimer = e.animTimer;
    }

    return base;
}

function loadGameState() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return false;

        const data = JSON.parse(saved);

        playerName = data.playerName;
        currentArea = data.currentArea;
        gameTime = data.gameTime;
        specimenCount = data.specimenCount;
        cameraX = data.cameraX;
        areaWidth = data.areaWidth;

        generateArea(currentArea);

        if (data.player) {
            player = new Player(data.player.x, data.player.y);
            player.vx = data.player.vx;
            player.vy = data.player.vy;
            player.health = data.player.health;
            player.maxHealth = data.player.maxHealth;
            player.weapon = data.player.weapon;
            player.facingRight = data.player.facingRight;
            player.onGround = data.player.onGround;
            player.invincible = data.player.invincible;
        }

        bullets = data.bullets.map(b => {
            const nb = new Bullet(b.x, b.y, b.vx, b.vy, b.damage, b.size, b.color, b.isPlayer);
            return nb;
        });

        enemyBullets = data.enemyBullets.map(b => {
            const nb = new Bullet(b.x, b.y, b.vx, b.vy, b.damage, b.size, b.color, b.isPlayer);
            return nb;
        });

        enemies = data.enemies.map(ed => deserializeEnemy(ed)).filter(e => e);
        pickups = data.pickups.map(pd => new Pickup(pd.x, pd.y, pd.type, pd.subType));
        specimens = data.specimens.map(sd => new Specimen(sd.x, sd.y));

        if (data.boss) {
            boss = new BossQueen(data.boss.x);
            boss.health = data.boss.health;
            boss.maxHealth = data.boss.maxHealth;
            boss.phase = data.boss.phase;
        } else {
            boss = null;
        }

        if (data.hazards && data.hazards.length > 0) {
            for (let i = 0; i < Math.min(hazards.length, data.hazards.length); i++) {
                hazards[i].state = data.hazards[i].state;
                hazards[i].timer = data.hazards[i].timer;
                hazards[i].height = data.hazards[i].height;
                if (data.hazards[i].idleTime) hazards[i].idleTime = data.hazards[i].idleTime;
            }
        }

        return true;
    } catch (e) {
        console.warn('加载游戏状态失败:', e);
        return false;
    }
}

function deserializeEnemy(ed) {
    let enemy = null;
    try {
        switch (ed.type) {
            case 'JumperBug':
                enemy = new JumperBug(ed.x, ed.y);
                enemy.jumpTimer = ed.jumpTimer || 0;
                enemy.jumpInterval = ed.jumpInterval || 2000;
                break;
            case 'SporeShooter':
                enemy = new SporeShooter(ed.x, ed.y);
                enemy.shootTimer = ed.shootTimer || 0;
                break;
            case 'LavaWorm':
                enemy = new LavaWorm(ed.x);
                enemy.state = ed.state || 'hidden';
                enemy.timer = ed.timer || 0;
                enemy.currentHeight = ed.currentHeight || 0;
                enemy.y = GROUND_Y - enemy.currentHeight;
                enemy.height = enemy.currentHeight;
                break;
            case 'AlienBug':
                enemy = new AlienBug(ed.x, ed.y);
                enemy.animTimer = ed.animTimer || 0;
                break;
            default:
                return null;
        }

        if (enemy) {
            enemy.health = ed.health;
            enemy.maxHealth = ed.maxHealth;
            enemy.vx = ed.vx || 0;
            enemy.vy = ed.vy || 0;
        }
    } catch (e) {
        console.warn('反序列化敌人失败:', e);
    }
    return enemy;
}

function clearSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {
        console.warn('清除存档失败:', e);
    }
}

function hasSave() {
    try {
        return localStorage.getItem(SAVE_KEY) !== null;
    } catch (e) {
        return false;
    }
}

function continueGame() {
    if (loadGameState()) {
        startGame(true);
    } else {
        alert('未找到存档，无法继续游戏！');
        document.getElementById('continueBtn').style.display = 'none';
    }
}

function updateContinueButton() {
    const continueBtn = document.getElementById('continueBtn');
    const nameInput = document.getElementById('playerNameInput');
    if (hasSave()) {
        try {
            const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
            const areaNames = ['菌类森林', '熔岩地带', '异形巢穴'];
            const areaName = areaNames[saved.currentArea] || '未知区域';
            const timeSec = Math.floor(saved.gameTime / 1000);
            const mins = Math.floor(timeSec / 60);
            const secs = timeSec % 60;
            const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            continueBtn.style.display = 'inline-block';
            continueBtn.textContent = `继续游戏 (${saved.playerName} · ${areaName} · ${timeStr})`;
            nameInput.value = saved.playerName;
        } catch (e) {
            continueBtn.style.display = 'none';
        }
    } else {
        continueBtn.style.display = 'none';
    }
}

// ============================================================
// API 交互
// ============================================================
async function submitRecord() {
    const btn = document.getElementById('submitRecordBtn');
    btn.disabled = true;
    btn.textContent = '提交中...';

    try {
        const response = await fetch('/api/game/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_name: playerName,
                clear_time: gameTime / 1000,
                specimen_count: specimenCount,
                area_cleared: currentArea + 1
            })
        });

        const result = await response.json();

        if (result.code === 0) {
            btn.textContent = '已提交';
            document.getElementById('rankText').textContent = '记录已保存到排行榜！';
        } else {
            btn.textContent = '提交失败';
            document.getElementById('rankText').textContent = result.message || '提交失败';
        }
    } catch (e) {
        btn.textContent = '提交失败';
        document.getElementById('rankText').textContent = '网络错误，提交失败';
        console.error(e);
    }
}

async function loadLeaderboard(type) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p>加载中...</p>';

    try {
        const url = type === 'time'
            ? '/api/game/leaderboard/time?limit=20'
            : '/api/game/leaderboard/specimens?limit=20';

        const response = await fetch(url);
        const result = await response.json();

        if (result.code === 0 && result.data && result.data.length > 0) {
            let html = '';
            result.data.forEach((item, index) => {
                const timeStr = formatTime(item.clear_time);
                html += `
                    <div class="leaderboard-item">
                        <span class="rank">${index + 1}</span>
                        <span class="player">${escapeHtml(item.player_name)}</span>
                        <span class="stats">
                            ${type === 'time'
                                ? `<span class="time">${timeStr}</span>`
                                : `<span class="specimens">${item.specimen_count} 个</span>`
                            }
                        </span>
                    </div>
                `;
            });
            list.innerHTML = html;
        } else {
            list.innerHTML = '<p style="text-align:center;color:#888;">暂无记录</p>';
        }
    } catch (e) {
        list.innerHTML = '<p style="text-align:center;color:#888;">加载失败</p>';
        console.error(e);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// 事件监听
// ============================================================
function initEvents() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        if (e.code === 'Escape' || e.code === 'KeyP') {
            if (gameState === GAME_STATE.PLAYING) {
                pauseGame();
            } else if (gameState === GAME_STATE.PAUSED) {
                resumeGame();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            mouseDown = true;
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouseDown = false;
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('continueBtn').addEventListener('click', continueGame);
    document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
        gameState = GAME_STATE.LEADERBOARD;
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('leaderboardScreen').classList.remove('hidden');
        loadLeaderboard('time');
    });

    document.getElementById('backFromLeaderboardBtn').addEventListener('click', () => {
        gameState = GAME_STATE.MENU;
        document.getElementById('leaderboardScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        updateContinueButton();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLeaderboard(btn.dataset.tab);
        });
    });

    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    document.getElementById('retryBtn').addEventListener('click', startGame);
    document.getElementById('backToMenuBtn').addEventListener('click', backToMenu);
    document.getElementById('submitRecordBtn').addEventListener('click', submitRecord);
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
}

// ============================================================
// 初始化
// ============================================================
function init() {
    initEvents();
    updateContinueButton();
    requestAnimationFrame(gameLoop);
}

init();
