const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

let gameState = GameState.MENU;
let score = 0;
let cameraX = 0;
let levelWidth = 3000;
let gameTime = 0;

const keys = {};
const touchControls = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false
};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === GameState.PLAYING) pauseGame();
        else if (gameState === GameState.PAUSED) resumeGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

function setupTouchControls() {
    const buttons = [
        { id: 'btnLeft', control: 'left' },
        { id: 'btnRight', control: 'right' },
        { id: 'btnUp', control: 'up' },
        { id: 'btnDown', control: 'down' },
        { id: 'btnJump', control: 'jump' },
        { id: 'btnShoot', control: 'shoot' }
    ];

    buttons.forEach(({ id, control }) => {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls[control] = true;
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls[control] = false;
        });
        btn.addEventListener('mousedown', () => touchControls[control] = true);
        btn.addEventListener('mouseup', () => touchControls[control] = false);
        btn.addEventListener('mouseleave', () => touchControls[control] = false);
    });
}
setupTouchControls();

const WeaponTypes = {
    RIFLE: { name: '步枪', damage: 1, fireRate: 200, bulletSpeed: 12, spread: 0, bulletsPerShot: 1, color: '#ffff00' },
    SHOTGUN: { name: '散弹枪', damage: 1, fireRate: 500, bulletSpeed: 10, spread: 0.3, bulletsPerShot: 3, color: '#ff8800' },
    MACHINEGUN: { name: '机枪', damage: 1, fireRate: 80, bulletSpeed: 14, spread: 0.05, bulletsPerShot: 1, color: '#00ffff' }
};

class Player {
    constructor(saveData = null) {
        this.width = 40;
        this.height = 60;
        this.crouchHeight = 40;
        this.x = saveData && saveData.x !== undefined ? saveData.x : 100;
        this.y = saveData && saveData.y !== undefined ? saveData.y : 400;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpForce = -14;
        this.gravity = 0.6;
        this.grounded = false;
        this.facingRight = saveData && saveData.facingRight !== undefined ? saveData.facingRight : true;
        this.crouching = false;
        this.health = saveData && saveData.health !== undefined ? saveData.health : 3;
        this.maxHealth = 3;
        this.invincible = false;
        this.invincibleTime = 0;
        this.currentWeapon = WeaponTypes[saveData && saveData.currentWeapon ? saveData.currentWeapon : 'RIFLE'];
        this.weaponTimer = saveData && saveData.weaponTimer !== undefined ? saveData.weaponTimer : 0;
        this.lastShot = 0;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(deltaTime) {
        const moveLeft = keys['a'] || keys['arrowleft'] || touchControls.left;
        const moveRight = keys['d'] || keys['arrowright'] || touchControls.right;
        const moveDown = keys['s'] || keys['arrowdown'] || touchControls.down;
        const jump = keys['w'] || keys['arrowup'] || keys[' '] || keys['Space'] || touchControls.jump;
        const shoot = keys['j'] || keys['k'] || keys['e'] || touchControls.shoot;
        const switchWeapon = keys['l'] || keys['q'];

        if (moveLeft) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (moveRight) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }

        this.crouching = moveDown && this.grounded;
        if (this.crouching) this.vx = 0;

        if (jump && this.grounded && !this.crouching) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }

        this.vy += this.gravity;
        if (this.vy > 15) this.vy = 15;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x > levelWidth - this.width) this.x = levelWidth - this.width;

        const currentHeight = this.crouching ? this.crouchHeight : this.height;
        const groundY = canvas.height - 80;
        
        if (this.y >= groundY - currentHeight) {
            this.y = groundY - currentHeight;
            this.vy = 0;
            this.grounded = true;
        }

        platforms.forEach(platform => {
            if (this.vy > 0 &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + currentHeight >= platform.y &&
                this.y + currentHeight <= platform.y + 20) {
                this.y = platform.y - currentHeight;
                this.vy = 0;
                this.grounded = true;
            }
        });

        if (this.y > canvas.height + 100) {
            this.takeDamage(3);
        }

        if (shoot) this.shoot();
        if (switchWeapon && !this.weaponSwitchCooldown) {
            this.switchWeapon();
            this.weaponSwitchCooldown = true;
            setTimeout(() => this.weaponSwitchCooldown = false, 300);
        }

        if (this.weaponTimer > 0) {
            this.weaponTimer -= deltaTime;
            if (this.weaponTimer <= 0) {
                this.currentWeapon = WeaponTypes.RIFLE;
                updateWeaponUI();
            }
        }

        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) this.invincible = false;
        }

        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.currentWeapon.fireRate) return;
        this.lastShot = now;

        const bulletY = this.crouching ? 
            this.y + this.height - 15 : 
            this.y + 20;

        for (let i = 0; i < this.currentWeapon.bulletsPerShot; i++) {
            const spreadAngle = (Math.random() - 0.5) * this.currentWeapon.spread * 2;
            const direction = this.facingRight ? 1 : -1;
            const angle = spreadAngle;
            
            bullets.push({
                x: this.x + (this.facingRight ? this.width : 0),
                y: bulletY,
                vx: Math.cos(angle) * this.currentWeapon.bulletSpeed * direction,
                vy: Math.sin(angle) * this.currentWeapon.bulletSpeed,
                damage: this.currentWeapon.damage,
                color: this.currentWeapon.color,
                fromPlayer: true,
                distance: 0
            });
        }
    }

    switchWeapon() {
        if (this.currentWeapon === WeaponTypes.RIFLE) {
            if (availableWeapons.has('shotgun')) {
                this.currentWeapon = WeaponTypes.SHOTGUN;
            } else if (availableWeapons.has('machinegun')) {
                this.currentWeapon = WeaponTypes.MACHINEGUN;
            }
        } else if (this.currentWeapon === WeaponTypes.SHOTGUN) {
            if (availableWeapons.has('machinegun')) {
                this.currentWeapon = WeaponTypes.MACHINEGUN;
            } else {
                this.currentWeapon = WeaponTypes.RIFLE;
            }
        } else {
            this.currentWeapon = WeaponTypes.RIFLE;
        }
        updateWeaponUI();
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTime = 1500;
        updateHealthUI();
        
        if (this.health <= 0) {
            gameOver();
        }
    }

    draw() {
        ctx.save();
        const drawX = this.x - cameraX;
        const currentHeight = this.crouching ? this.crouchHeight : this.height;

        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (!this.facingRight) {
            ctx.translate(drawX + this.width, 0);
            ctx.scale(-1, 1);
            ctx.translate(-drawX, 0);
        }

        const bodyColor = '#4a8a4a';
        const skinColor = '#ffd4b8';
        const outlineColor = '#2d5a2d';

        if (this.crouching) {
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(drawX + 20, this.y + 28, 16, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(drawX + 20, this.y + 14, 13, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(drawX + 24, this.y + 12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(drawX + 25, this.y + 11, 1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#5a3825';
            ctx.fillRect(drawX + 32, this.y + 22, 16, 5);
        } else {
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(drawX + 20, this.y + 38, 14, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(drawX + 13, this.y + 55, 5, 8, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(drawX + 27, this.y + 55, 5, 8, -0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(drawX + 20, this.y + 16, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(drawX + 20, this.y + 16, 15, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#5a3825';
            ctx.beginPath();
            ctx.ellipse(drawX + 20, this.y + 5, 12, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(drawX + 8, this.y + 2, 24, 5);
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(drawX + 24, this.y + 15, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(drawX + 25, this.y + 14, 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#cc8866';
            ctx.beginPath();
            ctx.arc(drawX + 14, this.y + 20, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(drawX + 28, this.y + 20, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#aa6644';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(drawX + 21, this.y + 22, 3, 0, Math.PI);
            ctx.stroke();
            
            ctx.fillStyle = '#6b4423';
            ctx.fillRect(drawX + 32, this.y + 30, 18, 6);
            ctx.fillStyle = '#5a3825';
            ctx.fillRect(drawX + 45, this.y + 28, 8, 10);
        }

        ctx.restore();
    }
}

const EnemyTypes = {
    INFANTRY: { name: '步兵', health: 1, speed: 1.5, score: 100, color: '#8b0000', width: 35, height: 50 },
    JUMPER: { name: '跳跳兵', health: 1, speed: 2, score: 150, color: '#9932cc', width: 35, height: 45 },
    MACHINEGUNNER: { name: '机枪兵', health: 2, speed: 1, score: 200, color: '#2f4f4f', width: 40, height: 55 },
    ROCKET: { name: '火箭兵', health: 2, speed: 0.8, score: 250, color: '#8b4513', width: 40, height: 55 },
    FLAME: { name: '火焰兵', health: 3, speed: 1.2, score: 300, color: '#ff4500', width: 42, height: 58 }
};

class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = type.width;
        this.height = type.height;
        this.health = type.health;
        this.maxHealth = type.health;
        this.vx = 0;
        this.vy = 0;
        this.facingRight = false;
        this.grounded = false;
        this.shootTimer = 0;
        this.jumpTimer = 0;
        this.aiTimer = 0;
        this.dead = false;
        this.animFrame = 0;
    }

    update(deltaTime) {
        if (this.dead) return;

        const distToPlayer = player.x - this.x;
        this.facingRight = distToPlayer > 0;

        switch (this.type) {
            case EnemyTypes.INFANTRY:
                this.aiInfantry(distToPlayer);
                break;
            case EnemyTypes.JUMPER:
                this.aiJumper(distToPlayer);
                break;
            case EnemyTypes.MACHINEGUNNER:
                this.aiMachineGunner(distToPlayer);
                break;
            case EnemyTypes.ROCKET:
                this.aiRocket(distToPlayer);
                break;
            case EnemyTypes.FLAME:
                this.aiFlame(distToPlayer);
                break;
        }

        this.vy += 0.5;
        if (this.vy > 12) this.vy = 12;

        this.x += this.vx;
        this.y += this.vy;

        const groundY = canvas.height - 80;
        if (this.y >= groundY - this.height) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        if (this.x < 0) this.x = 0;
        if (this.x > levelWidth - this.width) this.x = levelWidth - this.width;

        if (this.checkCollision(player) && !player.invincible) {
            player.takeDamage(1);
        }
    }

    aiInfantry(dist) {
        if (Math.abs(dist) < 400 && Math.abs(dist) > 100) {
            this.vx = this.facingRight ? this.type.speed : -this.type.speed;
        } else {
            this.vx = 0;
        }

        this.shootTimer += 16;
        if (this.shootTimer > 1500 && Math.abs(dist) < 500) {
            this.shootTimer = 0;
            this.shoot(8);
        }
    }

    aiJumper(dist) {
        if (Math.abs(dist) < 500) {
            this.vx = this.facingRight ? this.type.speed : -this.type.speed;
        } else {
            this.vx = 0;
        }

        this.jumpTimer += 16;
        if (this.jumpTimer > 800 && this.grounded) {
            this.jumpTimer = 0;
            this.vy = -12;
            this.grounded = false;
        }

        this.shootTimer += 16;
        if (this.shootTimer > 1200 && Math.abs(dist) < 400) {
            this.shootTimer = 0;
            this.shoot(7);
        }
    }

    aiMachineGunner(dist) {
        this.vx = 0;
        this.shootTimer += 16;
        if (this.shootTimer > 400 && Math.abs(dist) < 500) {
            this.shootTimer = 0;
            for (let i = 0; i < 3; i++) {
                setTimeout(() => this.shoot(9), i * 100);
            }
        }
    }

    aiRocket(dist) {
        this.vx = 0;
        this.shootTimer += 16;
        if (this.shootTimer > 2500 && Math.abs(dist) < 600) {
            this.shootTimer = 0;
            this.shootRocket();
        }
    }

    aiFlame(dist) {
        if (Math.abs(dist) < 250) {
            this.vx = 0;
            this.shootTimer += 16;
            if (this.shootTimer > 100) {
                this.shootTimer = 0;
                this.shootFlame();
            }
        } else if (Math.abs(dist) < 500) {
            this.vx = this.facingRight ? this.type.speed : -this.type.speed;
        } else {
            this.vx = 0;
        }
    }

    shoot(speed) {
        const direction = this.facingRight ? 1 : -1;
        enemyBullets.push({
            x: this.x + (this.facingRight ? this.width : 0),
            y: this.y + this.height / 2,
            vx: speed * direction,
            vy: 0,
            damage: 1,
            color: '#ff0000'
        });
    }

    shootRocket() {
        const direction = this.facingRight ? 1 : -1;
        rockets.push({
            x: this.x + (this.facingRight ? this.width : 0),
            y: this.y + this.height / 2,
            vx: 3 * direction,
            vy: 0,
            damage: 2,
            target: player,
            timer: 0
        });
    }

    shootFlame() {
        const direction = this.facingRight ? 1 : -1;
        for (let i = 0; i < 5; i++) {
            enemyBullets.push({
                x: this.x + (this.facingRight ? this.width : 0),
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 20,
                vx: (4 + Math.random() * 2) * direction,
                vy: (Math.random() - 0.5) * 2,
                damage: 1,
                color: '#ff6600',
                isFlame: true,
                life: 30
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.dead = true;
            score += this.type.score;
            updateScoreUI();
            createExplosion(this.x + this.width / 2, this.y + this.height / 2);
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    draw() {
        if (this.dead) return;
        ctx.save();
        const drawX = this.x - cameraX;

        if (!this.facingRight) {
            ctx.translate(drawX + this.width, 0);
            ctx.scale(-1, 1);
            ctx.translate(-drawX, 0);
        }

        const bodyColor = this.type.color;
        const skinColor = '#ffd4b8';
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(drawX + this.width / 2, this.y + 35, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, this.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, this.y + 15, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, this.y + 6, 10, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(drawX + this.width / 2 - 2, this.y + 4, 10, 6);
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2 + 3, this.y + 14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2 + 3.5, this.y + 14, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#555';
        ctx.fillRect(drawX + this.width - 8, this.y + 28, 15, 5);

        if (this.maxHealth > 1) {
            ctx.fillStyle = '#333';
            ctx.fillRect(drawX, this.y - 8, this.width, 5);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(drawX + 1, this.y - 7, (this.width - 2) * (this.health / this.maxHealth), 3);
        }

        ctx.restore();
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            color: ['#ff0000', '#ff6600', '#ffff00'][Math.floor(Math.random() * 3)],
            size: 5 + Math.random() * 5
        });
    }
}

const platforms = [];
const bullets = [];
const enemyBullets = [];
const rockets = [];
const particles = [];
const weaponPickups = [];
const hazards = [];
const enemies = [];
const availableWeapons = new Set();

let player;
let saveInterval;

function saveGameState() {
    if (gameState !== GameState.PLAYING) return;
    
    try {
        const weaponKey = Object.keys(WeaponTypes).find(key => WeaponTypes[key] === player.currentWeapon);
        const gameStateData = {
            player: {
                x: player.x,
                y: player.y,
                health: player.health,
                facingRight: player.facingRight,
                currentWeapon: weaponKey || 'RIFLE',
                weaponTimer: player.weaponTimer
            },
            score: score,
            cameraX: cameraX,
            enemies: enemies.map(e => {
                const typeKey = Object.keys(EnemyTypes).find(key => EnemyTypes[key] === e.type);
                return {
                    type: typeKey || 'INFANTRY',
                    x: e.x,
                    y: e.y,
                    health: e.health,
                    facingRight: e.facingRight,
                    dead: e.dead
                };
            }),
            weaponPickups: weaponPickups.map(p => ({
                x: p.x,
                y: p.y,
                type: p.type,
                collected: p.collected
            })),
            hazards: hazards.map(h => ({
                type: h.type,
                x: h.x,
                y: h.y,
                width: h.width,
                height: h.height,
                triggered: h.triggered || false,
                active: h.active !== undefined ? h.active : true,
                timer: h.timer || 0
            })),
            timestamp: Date.now()
        };
        
        localStorage.setItem('zhandou09_save', JSON.stringify(gameStateData));
        console.log('游戏已保存');
    } catch (e) {
        console.error('保存失败:', e);
    }
}

function loadGameState() {
    const saveData = localStorage.getItem('zhandou09_save');
    if (!saveData) return null;
    
    try {
        return JSON.parse(saveData);
    } catch (e) {
        return null;
    }
}

function hasValidSave() {
    const saveData = loadGameState();
    if (!saveData) {
        console.log('未找到存档');
        return false;
    }
    const now = Date.now();
    const isValid = now - saveData.timestamp < 3600000;
    console.log('存档检查:', isValid, '分数:', saveData.score);
    return isValid;
}

function initLevel(useSave = false) {
    const saveData = useSave ? loadGameState() : null;
    console.log('initLevel - useSave:', useSave, 'saveData:', saveData ? '存在' : '不存在');
    
    player = new Player(saveData ? saveData.player : null);
    bullets.length = 0;
    enemyBullets.length = 0;
    rockets.length = 0;
    particles.length = 0;
    weaponPickups.length = 0;
    hazards.length = 0;
    platforms.length = 0;
    enemies.length = 0;
    availableWeapons.clear();
    score = saveData ? saveData.score : 0;
    cameraX = saveData ? saveData.cameraX : 0;
    
    if (useSave && saveData) {
        console.log('已从存档恢复 - 分数:', score, '玩家X:', player.x, '生命值:', player.health);
    }

    platforms.push(
        { x: 300, y: 450, width: 150, height: 20 },
        { x: 550, y: 380, width: 120, height: 20 },
        { x: 800, y: 420, width: 180, height: 20 },
        { x: 1100, y: 350, width: 150, height: 20 },
        { x: 1400, y: 400, width: 200, height: 20 },
        { x: 1750, y: 380, width: 150, height: 20 },
        { x: 2050, y: 420, width: 180, height: 20 },
        { x: 2400, y: 350, width: 200, height: 20 }
    );

    if (saveData && saveData.enemies) {
        saveData.enemies.forEach(e => {
            const enemy = new Enemy(EnemyTypes[e.type], e.x, e.y);
            enemy.health = e.health;
            enemy.facingRight = e.facingRight;
            enemy.dead = e.dead;
            enemies.push(enemy);
        });
    } else {
        enemies.push(
            new Enemy(EnemyTypes.INFANTRY, 400, 400),
            new Enemy(EnemyTypes.INFANTRY, 700, 400),
            new Enemy(EnemyTypes.JUMPER, 900, 400),
            new Enemy(EnemyTypes.MACHINEGUNNER, 1200, 400),
            new Enemy(EnemyTypes.INFANTRY, 1500, 400),
            new Enemy(EnemyTypes.ROCKET, 1800, 400),
            new Enemy(EnemyTypes.JUMPER, 2000, 400),
            new Enemy(EnemyTypes.FLAME, 2200, 400),
            new Enemy(EnemyTypes.MACHINEGUNNER, 2500, 400),
            new Enemy(EnemyTypes.INFANTRY, 2700, 400)
        );
    }

    if (saveData && saveData.weaponPickups) {
        saveData.weaponPickups.forEach(p => {
            weaponPickups.push({ ...p });
        });
    } else {
        weaponPickups.push(
            { x: 600, y: 340, type: 'shotgun', collected: false },
            { x: 1500, y: 360, type: 'machinegun', collected: false },
            { x: 2200, y: 380, type: 'shotgun', collected: false }
        );
    }

    if (saveData && saveData.hazards) {
        saveData.hazards.forEach(h => {
            hazards.push({ ...h });
        });
    } else {
        const groundY = canvas.height - 80;
        hazards.push(
            { x: 200, y: groundY - 30, type: 'mine', width: 30, height: 30, triggered: false },
            { x: 500, y: groundY - 60, type: 'electric', width: 100, height: 60, active: true, timer: 0 },
            { x: 800, type: 'pit', width: 120, height: 200 },
            { x: 1100, y: groundY - 30, type: 'mine', width: 30, height: 30, triggered: false },
            { x: 1400, y: groundY - 60, type: 'electric', width: 100, height: 60, active: true, timer: 0 },
            { x: 1700, type: 'pit', width: 150, height: 200 }
        );
    }

    if (saveData && saveData.player && saveData.player.currentWeapon !== 'RIFLE') {
        availableWeapons.add(saveData.player.currentWeapon);
    }

    updateHealthUI();
    updateWeaponUI();
    updateScoreUI();
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.distance += Math.abs(b.vx);

        if (b.distance > canvas.width / 2 || 
            b.x < cameraX - 50 || b.x > cameraX + canvas.width + 50 ||
            b.y < -50 || b.y > canvas.height + 50) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (!enemy.dead &&
                b.x > enemy.x && b.x < enemy.x + enemy.width &&
                b.y > enemy.y && b.y < enemy.y + enemy.height) {
                enemy.takeDamage(b.damage);
                bullets.splice(i, 1);
                break;
            }
        }

        for (let j = rockets.length - 1; j >= 0; j--) {
            const r = rockets[j];
            if (b.x > r.x - 10 && b.x < r.x + 10 &&
                b.y > r.y - 10 && b.y < r.y + 10) {
                rockets.splice(j, 1);
                bullets.splice(i, 1);
                createExplosion(r.x, r.y);
                score += 50;
                updateScoreUI();
                break;
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        
        if (b.isFlame) {
            b.life--;
            if (b.life <= 0) {
                enemyBullets.splice(i, 1);
                continue;
            }
        }

        if (b.x < cameraX - 50 || b.x > cameraX + canvas.width + 50 ||
            b.y < -50 || b.y > canvas.height + 50) {
            enemyBullets.splice(i, 1);
            continue;
        }

        if (!player.invincible &&
            b.x > player.x && b.x < player.x + player.width &&
            b.y > player.y && b.y < player.y + player.height) {
            player.takeDamage(b.damage);
            enemyBullets.splice(i, 1);
        }
    }

    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.timer++;

        const dx = player.x + player.width / 2 - r.x;
        const dy = player.y + player.height / 2 - r.y;
        const angle = Math.atan2(dy, dx);
        r.vx += Math.cos(angle) * 0.1;
        r.vy += Math.sin(angle) * 0.1;
        
        const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
        if (speed > 4) {
            r.vx = (r.vx / speed) * 4;
            r.vy = (r.vy / speed) * 4;
        }

        r.x += r.vx;
        r.y += r.vy;

        if (r.timer > 300 ||
            r.x < cameraX - 100 || r.x > cameraX + canvas.width + 100) {
            rockets.splice(i, 1);
            continue;
        }

        if (!player.invincible &&
            r.x > player.x - 15 && r.x < player.x + player.width + 15 &&
            r.y > player.y - 15 && r.y < player.y + player.height + 15) {
            player.takeDamage(r.damage);
            createExplosion(r.x, r.y);
            rockets.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        p.size *= 0.95;
        
        if (p.life <= 0 || p.size < 1) {
            particles.splice(i, 1);
        }
    }
}

function updatePickups() {
    weaponPickups.forEach(pickup => {
        if (pickup.collected) return;
        
        if (player.x + player.width > pickup.x &&
            player.x < pickup.x + 30 &&
            player.y + player.height > pickup.y &&
            player.y < pickup.y + 30) {
            pickup.collected = true;
            
            if (pickup.type === 'shotgun') {
                player.currentWeapon = WeaponTypes.SHOTGUN;
                availableWeapons.add('shotgun');
            } else if (pickup.type === 'machinegun') {
                player.currentWeapon = WeaponTypes.MACHINEGUN;
                availableWeapons.add('machinegun');
            }
            
            player.weaponTimer = 30000;
            updateWeaponUI();
            
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: pickup.x + 15,
                    y: pickup.y + 15,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -Math.random() * 5,
                    life: 40,
                    color: '#00ffff',
                    size: 6
                });
            }
        }
    });
}

function updateHazards() {
    const currentHeight = player.crouching ? player.crouchHeight : player.height;
    const playerBottom = player.y + currentHeight;
    const playerTop = player.y;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const groundY = canvas.height - 80;

    for (let i = 0; i < hazards.length; i++) {
        const hazard = hazards[i];
        
        if (hazard.type === 'pit') {
            const pitLeft = hazard.x;
            const pitRight = hazard.x + hazard.width;
            
            if (playerRight > pitLeft + 20 &&
                playerLeft < pitRight - 20 &&
                playerBottom >= groundY - 10) {
                player.takeDamage(3);
            }
            continue;
        }

        if (hazard.type === 'mine' && !hazard.triggered) {
            if (playerRight > hazard.x + 5 &&
                playerLeft < hazard.x + hazard.width - 5 &&
                playerBottom > hazard.y + 5 &&
                playerTop < hazard.y + hazard.height - 5) {
                hazard.triggered = true;
                player.takeDamage(2);
                createExplosion(hazard.x + hazard.width / 2, hazard.y + hazard.height / 2);
            }
            continue;
        }

        if (hazard.type === 'electric') {
            hazard.timer++;
            if (hazard.timer > 75) {
                hazard.active = !hazard.active;
                hazard.timer = 0;
            }

            if (hazard.active && !player.invincible) {
                if (playerRight > hazard.x + 5 &&
                    playerLeft < hazard.x + hazard.width - 5 &&
                    playerBottom > hazard.y + 10 &&
                    playerTop < hazard.y + hazard.height - 5) {
                    
                    if (!player.crouching) {
                        player.takeDamage(1);
                        player.vx = player.x < hazard.x + hazard.width / 2 ? -8 : 8;
                        player.vy = -5;
                    }
                }
            }
            continue;
        }
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.5, '#2d1b4e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0d0d1a';
    for (let i = 0; i < 5; i++) {
        const x = (i * 400 - cameraX * 0.2) % (canvas.width + 400) - 200;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 150);
        ctx.lineTo(x + 200, canvas.height - 350);
        ctx.lineTo(x + 400, canvas.height - 150);
        ctx.fill();
    }

    ctx.fillStyle = '#151525';
    for (let i = 0; i < 8; i++) {
        const x = (i * 250 - cameraX * 0.4) % (canvas.width + 500) - 250;
        const h = 80 + Math.sin(i * 1.5) * 40;
        ctx.fillRect(x, canvas.height - 80 - h, 60, h);
        ctx.fillRect(x + 80, canvas.height - 80 - h + 20, 40, h - 20);
    }

    ctx.fillStyle = '#3d2817';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    ctx.fillStyle = '#2a1c10';
    for (let i = 0; i < canvas.width / 30 + 1; i++) {
        const x = (i * 30 - cameraX % 30);
        ctx.fillRect(x, canvas.height - 75, 25, 5);
        ctx.fillRect(x + 15, canvas.height - 60, 20, 5);
        ctx.fillRect(x + 5, canvas.height - 45, 25, 5);
    }

    hazards.forEach(hazard => {
        if (hazard.type === 'pit') {
            const drawX = hazard.x - cameraX;
            
            ctx.fillStyle = '#050510';
            ctx.fillRect(drawX, canvas.height - 80, hazard.width, 200);
            
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            for (let i = 0; i < hazard.width; i += 20) {
                ctx.fillRect(drawX + i, canvas.height - 80, 10, 5);
            }
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('⚠ 深坑 ⚠', drawX + hazard.width / 2 - 35, canvas.height - 50);
        }
    });
}

function drawPlatforms() {
    platforms.forEach(p => {
        const drawX = p.x - cameraX;
        ctx.fillStyle = '#5a3825';
        ctx.fillRect(drawX, p.y, p.width, p.height);
        ctx.fillStyle = '#7a4830';
        ctx.fillRect(drawX, p.y, p.width, 6);
        ctx.fillStyle = '#4a2815';
        ctx.fillRect(drawX, p.y + p.height - 4, p.width, 4);
    });
}

function drawHazards() {
    hazards.forEach(hazard => {
        const drawX = hazard.x - cameraX;

        if (hazard.type === 'mine' && !hazard.triggered) {
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(drawX - 2, hazard.y + 8, hazard.width + 4, 22);
            
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(drawX + 15, hazard.y + 15, 14, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(drawX + 15, hazard.y + 15, 10, 0, Math.PI * 2);
            ctx.fill();
            
            const blink = Math.sin(Date.now() * 0.01) > 0;
            ctx.fillStyle = blink ? '#ff0000' : '#aa0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = blink ? 15 : 5;
            ctx.beginPath();
            ctx.arc(drawX + 15, hazard.y + 15, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('⚠', drawX + 10, hazard.y - 5);
        }

        if (hazard.type === 'electric') {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(drawX - 5, canvas.height - 95, hazard.width + 10, 20);
            
            ctx.fillStyle = '#444';
            ctx.fillRect(drawX, hazard.y, hazard.width, hazard.height);
            
            ctx.fillStyle = '#666';
            ctx.fillRect(drawX + 10, hazard.y + 5, 4, hazard.height - 10);
            ctx.fillRect(drawX + hazard.width - 14, hazard.y + 5, 4, hazard.height - 10);
            
            if (hazard.active) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 5;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 30;
                
                for (let line = 0; line < 4; line++) {
                    ctx.beginPath();
                    for (let i = 0; i < hazard.width; i += 6) {
                        const yOffset = Math.sin(i * 0.7 + Date.now() * 0.015 + line * 0.8) * 15;
                        if (i === 0) {
                            ctx.moveTo(drawX + i, hazard.y + hazard.height / 2 + yOffset);
                        } else {
                            ctx.lineTo(drawX + i, hazard.y + hazard.height / 2 + yOffset);
                        }
                    }
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('⚡⚡⚡', drawX + hazard.width / 2 - 18, hazard.y - 5);
            } else {
                ctx.fillStyle = 'rgba(0, 100, 100, 0.3)';
                ctx.fillRect(drawX, hazard.y, hazard.width, hazard.height);
                ctx.fillStyle = '#666';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('安全', drawX + hazard.width / 2 - 10, hazard.y - 5);
            }
        }
    });
}

function drawPickups() {
    weaponPickups.forEach(pickup => {
        if (pickup.collected) return;
        
        const drawX = pickup.x - cameraX;
        const bobY = pickup.y + Math.sin(Date.now() * 0.005) * 5;
        
        ctx.fillStyle = pickup.type === 'shotgun' ? '#ff8800' : '#00ffff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        
        ctx.fillRect(drawX, bobY, 30, 20);
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX + 5, bobY + 5, 20, 10);
        
        ctx.shadowBlur = 0;
    });
}

function drawBullets() {
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    enemyBullets.forEach(b => {
        ctx.fillStyle = b.color;
        if (b.isFlame) {
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(b.x - cameraX, b.y, 6 + b.life / 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(b.x - cameraX, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    });

    rockets.forEach(r => {
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(r.x - cameraX, r.y, 12, 8, Math.atan2(r.vy, r.vx), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(r.x - cameraX - r.vx * 2, r.y - r.vy * 2, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 40;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function updateCamera() {
    const targetX = player.x - canvas.width / 3;
    cameraX += (targetX - cameraX) * 0.1;
    
    if (cameraX < 0) cameraX = 0;
    if (cameraX > levelWidth - canvas.width) cameraX = levelWidth - canvas.width;
}

function updateHealthUI() {
    const healthBar = document.getElementById('healthBar');
    healthBar.innerHTML = '';
    for (let i = 0; i < player.maxHealth; i++) {
        const heart = document.createElement('div');
        heart.className = 'health-heart' + (i >= player.health ? ' empty' : '');
        healthBar.appendChild(heart);
    }
}

function updateWeaponUI() {
    document.getElementById('weaponName').textContent = player.currentWeapon.name;
}

function updateScoreUI() {
    document.getElementById('scoreValue').textContent = score;
}

function startGame(useSave = false) {
    console.log('开始游戏，使用存档:', useSave);
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('mobileControls').classList.remove('hidden');
    initLevel(useSave);
    gameState = GameState.PLAYING;
    
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(saveGameState, 5000);
    
    setTimeout(() => {
        saveGameState();
        console.log('游戏开始后立即保存完成');
    }, 1000);
}

function pauseGame() {
    gameState = GameState.PAUSED;
    document.getElementById('pauseScreen').classList.remove('hidden');
}

function resumeGame() {
    gameState = GameState.PLAYING;
    document.getElementById('pauseScreen').classList.add('hidden');
}

function restartGame() {
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    localStorage.removeItem('zhandou09_save');
    initLevel(false);
    gameState = GameState.PLAYING;
}

function exitToMenu() {
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('mobileControls').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
    
    updateStartScreen();
    gameState = GameState.MENU;
}

function gameOver() {
    gameState = GameState.GAMEOVER;
    localStorage.removeItem('zhandou09_save');
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function updateStartScreen() {
    const hasSave = hasValidSave();
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        if (hasSave) {
            continueBtn.style.display = 'block';
            continueBtn.style.visibility = 'visible';
            continueBtn.style.opacity = '1';
            console.log('继续游戏按钮已显示');
        } else {
            continueBtn.style.display = 'none';
            console.log('继续游戏按钮已隐藏');
        }
    } else {
        console.error('未找到 continueBtn 元素');
    }
}

document.getElementById('startBtn').addEventListener('click', () => startGame(false));
document.getElementById('continueBtn').addEventListener('click', () => startGame(true));
document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('quitBtn').addEventListener('click', exitToMenu);
document.getElementById('retryBtn').addEventListener('click', restartGame);
document.getElementById('exitBtn').addEventListener('click', exitToMenu);

console.log('游戏脚本已加载，正在检查存档...');
window.addEventListener('load', () => {
    console.log('页面完全加载，更新开始界面...');
    updateStartScreen();
    
    const saveData = localStorage.getItem('zhandou09_save');
    if (saveData) {
        console.log('找到存档数据:', saveData.substring(0, 100) + '...');
        try {
            const parsed = JSON.parse(saveData);
            console.log('存档解析成功，分数:', parsed.score, '时间戳:', new Date(parsed.timestamp));
        } catch (e) {
            console.error('存档解析失败:', e);
        }
    } else {
        console.log('未找到任何存档数据');
    }
});

window.forceSave = function() {
    saveGameState();
    console.log('手动保存完成');
    alert('游戏已保存！现在刷新页面，应该会出现"继续游戏"按钮');
};

window.clearGameSave = function() {
    localStorage.removeItem('zhandou09_save');
    console.log('存档已清除');
    alert('存档已清除！');
};

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (gameState === GameState.PLAYING) {
        player.update(deltaTime);
        enemies.forEach(e => e.update(deltaTime));
        updateBullets();
        updateParticles();
        updatePickups();
        updateHazards();
        updateCamera();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState !== GameState.MENU) {
        drawBackground();
        drawPlatforms();
        drawHazards();
        drawPickups();
        drawBullets();
        enemies.forEach(e => e.draw());
        player.draw();
        drawParticles();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
