// ====== 游戏核心引擎 ======
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const GRAVITY = 0.55;
const MOVE_SPEED = 4.2;
const JUMP_POWER = 11.5;
const WALL_JUMP_X = 7;
const WALL_JUMP_Y = 10;
const CLIMB_SPEED = 2.5;
const STAMINA_MAX = 100;
const JUMP_COST = 8;
const CLIMB_COST_PER_SEC = 5;
const REST_RECOVER = 20;
const ROCK_DAMAGE = 30;
const MAX_FALLS = 3;
const TOTAL_FLOORS = 12;
const BASE_ATTACK = 15;
const SHARD_ATTACK = 30;

const GameState = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover', VICTORY: 'victory' };

let gameState = GameState.MENU;
let keys = {};
let player = null;
let currentFloor = 1;
let fallCount = 0;
let stamina = STAMINA_MAX;
let attackPower = BASE_ATTACK;
let shardActive = false;
let shardTimer = 0;
let floorPlatforms = [];
let restPoints = [];
let movingPlatforms = [];
let fallingRocks = [];
let rockSpawners = [];
let windZones = [];
let windDirection = 0;
let windTimer = 0;
let powerShards = [];
let exitPortal = null;
let particles = [];
let boss = null;
let bossProjectiles = [];
let bossShockwaves = [];
let cameraX = 0;
let cameraY = 0;
let gameTime = 0;
let floorStartTime = 0;
let floorTimes = {};
let lastTimestamp = 0;
let animationFrame = 0;
let isClimbing = false;
let touchingWallLeft = false;
let touchingWallRight = false;
let onGround = false;
let attackCooldown = 0;
let showDamageText = [];
let screenShake = 0;
let submitted = false;

function randRange(min, max) { return Math.random() * (max - min) + min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ====== 玩家类 ======
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 28; this.h = 40;
        this.vx = 0; this.vy = 0;
        this.facing = 1;
        this.animFrame = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.invulnTimer = 0;
    }
    update(dt) {
        if (this.invulnTimer > 0) this.invulnTimer -= dt;
        if (this.attackTimer > 0) { this.attackTimer -= dt; if (this.attackTimer <= 0) this.isAttacking = false; }
        let moveDir = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) moveDir = -1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) moveDir = 1;
        isClimbing = false;
        if ((touchingWallLeft || touchingWallRight) && (keys['ArrowUp'] || keys['w'] || keys['W']) && !onGround) {
            if (stamina > 0) {
                isClimbing = true;
                this.vy = -CLIMB_SPEED;
                this.vx = 0;
                stamina -= CLIMB_COST_PER_SEC * dt;
                if (stamina < 0) stamina = 0;
                const dustX = touchingWallLeft ? this.x + 2 : this.x + this.w - 2;
                const dustY = this.y + 18 + Math.random() * 10;
                addParticle(dustX, dustY, '#8b7355', 2);
            }
        }
        if (!isClimbing) {
            if (moveDir !== 0) { this.vx = moveDir * MOVE_SPEED; this.facing = moveDir; }
            else { this.vx *= 0.75; if (Math.abs(this.vx) < 0.1) this.vx = 0; }
            this.vy += GRAVITY;
            if (this.vy > 15) this.vy = 15;
        }
        if (currentFloor >= 9 && windDirection !== 0) this.vx += windDirection * 0.15;
        this.x += this.vx;
        this.handleCollisionX();
        this.y += this.vy;
        this.handleCollisionY();
        if (this.x < 20) { this.x = 20; this.vx = 0; }
        if (this.x + this.w > W - 20) { this.x = W - 20 - this.w; this.vx = 0; }
        if (this.y > H + 100) triggerFall();
        if (Math.abs(this.vx) > 0.5 && onGround) this.animFrame += dt * 10;
    }
    handleCollisionX() {
        touchingWallLeft = false; touchingWallRight = false;
        for (const p of [...floorPlatforms, ...movingPlatforms]) {
            if (rectsOverlap(this, p)) {
                if (this.vx > 0) { this.x = p.x - this.w; touchingWallRight = true; }
                else if (this.vx < 0) { this.x = p.x + p.w; touchingWallLeft = true; }
                this.vx = 0;
            }
        }
        if (this.x <= 22) touchingWallLeft = true;
        if (this.x + this.w >= W - 22) touchingWallRight = true;
    }
    handleCollisionY() {
        onGround = false;
        for (const p of [...floorPlatforms, ...movingPlatforms]) {
            if (rectsOverlap(this, p)) {
                if (this.vy > 0) { this.y = p.y - this.h; this.vy = 0; onGround = true; }
                else if (this.vy < 0) { this.y = p.y + p.h; this.vy = 0; }
            }
        }
    }
    jump() {
        if (stamina < JUMP_COST) return false;
        if (onGround) { this.vy = -JUMP_POWER; stamina -= JUMP_COST; addParticle(this.x + this.w / 2, this.y + this.h, '#fff', 5); return true; }
        else if (touchingWallLeft) { this.vy = -WALL_JUMP_Y; this.vx = WALL_JUMP_X; this.facing = 1; stamina -= JUMP_COST; addParticle(this.x, this.y + this.h / 2, '#fff', 5); return true; }
        else if (touchingWallRight) { this.vy = -WALL_JUMP_Y; this.vx = -WALL_JUMP_X; this.facing = -1; stamina -= JUMP_COST; addParticle(this.x + this.w, this.y + this.h / 2, '#fff', 5); return true; }
        return false;
    }
    attack() {
        if (attackCooldown > 0 || !boss) return;
        this.isAttacking = true; this.attackTimer = 0.25; attackCooldown = 0.35;
        const atkBox = { x: this.facing === 1 ? this.x + this.w : this.x - 50, y: this.y, w: 50, h: this.h };
        if (boss && rectsOverlap(atkBox, boss)) {
            boss.takeDamage(attackPower);
            addParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff4444', 10);
            showDamageText.push({ x: boss.x + boss.w / 2, y: boss.y, text: `-${attackPower}`, color: '#ff6666', timer: 1 });
            screenShake = Math.max(screenShake, 5);
        }
    }
    takeDamage(amount) {
        if (this.invulnTimer > 0) return;
        stamina -= amount; this.invulnTimer = 1.2; screenShake = Math.max(screenShake, 8);
        showDamageText.push({ x: this.x + this.w / 2, y: this.y, text: `-${amount}⚡`, color: '#ff4444', timer: 1 });
        if (stamina <= 0) { stamina = 0; triggerFall(); }
    }
    draw() {
        ctx.save();
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) ctx.globalAlpha = 0.4;
        const px = Math.round(this.x - cameraX), py = Math.round(this.y - cameraY);
        if (this.facing === -1) { ctx.translate(px + this.w, py); ctx.scale(-1, 1); } else ctx.translate(px, py);
        const grad = ctx.createLinearGradient(0, 0, 0, this.h);
        grad.addColorStop(0, '#5ba8ff'); grad.addColorStop(1, '#2d6ab5');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(2, 10, this.w - 4, this.h - 10, 6); ctx.fill();
        ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(this.w / 2, 10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(this.w / 2 + 2, 8, 2.5, 3); ctx.fillRect(this.w / 2 - 4.5, 8, 2.5, 3);
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(this.w / 2, 7, 10, Math.PI, 0); ctx.fill();
        const legOffset = Math.sin(this.animFrame) * 4;
        ctx.fillStyle = '#1a3d6b';
        if (onGround && Math.abs(this.vx) > 0.5) {
            ctx.fillRect(5, this.h - 10, 7, 10 + legOffset);
            ctx.fillRect(this.w - 12, this.h - 10, 7, 10 - legOffset);
        } else {
            ctx.fillRect(5, this.h - 10, 7, 10);
            ctx.fillRect(this.w - 12, this.h - 10, 7, 10);
        }
        if (this.isAttacking) {
            ctx.strokeStyle = '#ffff66'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(this.w + 10, this.h / 2, 25, -Math.PI / 3, Math.PI / 3); ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        }
        if (shardActive) {
            ctx.strokeStyle = `rgba(255,0,255,${0.3 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.w / 2, this.h / 2, 30, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }
}

// ====== Boss类 ======
class Boss {
    constructor() {
        this.w = 160; this.h = 140;
        this.x = W / 2 - this.w / 2; this.y = 80;
        this.phase = 1;
        this.hp = [200, 300, 400]; this.maxHp = [200, 300, 400];
        this.currentHp = this.hp[0];
        this.attackTimer = 2;
        this.moveTimer = 0; this.moveDir = 1; this.vx = 0;
        this.animTimer = 0; this.isHurt = false; this.hurtTimer = 0;
        this.state = 'idle'; this.stateTimer = 0;
    }
    takeDamage(amount) {
        this.currentHp -= amount; this.isHurt = true; this.hurtTimer = 0.15;
        if (this.currentHp <= 0) {
            if (this.phase < 3) {
                this.phase++; this.currentHp = this.hp[this.phase - 1]; screenShake = 15;
                for (let i = 0; i < 30; i++) addParticle(this.x + this.w / 2, this.y + this.h / 2, ['#ff4444', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)], 8);
            } else triggerVictory();
        }
    }
    update(dt) {
        this.animTimer += dt;
        if (this.hurtTimer > 0) { this.hurtTimer -= dt; if (this.hurtTimer <= 0) this.isHurt = false; }
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.chooseAttack();
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) { this.moveDir *= -1; this.moveTimer = randRange(2, 4); }
        this.vx = this.moveDir * (this.phase === 1 ? 0.8 : this.phase === 2 ? 1.2 : 1.6);
        this.x += this.vx; this.x = clamp(this.x, 60, W - this.w - 60);
        this.executeAttack(dt);
        for (let i = bossProjectiles.length - 1; i >= 0; i--) {
            const p = bossProjectiles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= dt;
            if (p.life <= 0 || p.y > H || p.x < -50 || p.x > W + 50) { bossProjectiles.splice(i, 1); continue; }
            if (player && rectsOverlap({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, player)) { player.takeDamage(15); bossProjectiles.splice(i, 1); }
        }
        for (let i = bossShockwaves.length - 1; i >= 0; i--) {
            const s = bossShockwaves[i]; s.r += s.speed * dt; s.life -= dt;
            if (s.life <= 0) { bossShockwaves.splice(i, 1); continue; }
            if (player) {
                const dx = (player.x + player.w / 2) - s.x, dy = (player.y + player.h) - s.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(dist - s.r) < 20 && onGround) { player.takeDamage(20); player.vy = -6; bossShockwaves.splice(i, 1); }
            }
        }
    }
    chooseAttack() {
        const atks = this.phase === 1 ? ['smash', 'shoot'] : this.phase === 2 ? ['smash', 'sweep', 'shoot'] : ['smash', 'sweep', 'shoot', 'shoot'];
        this.state = atks[Math.floor(Math.random() * atks.length)];
        this.stateTimer = this.phase === 1 ? 2.2 : this.phase === 2 ? 1.8 : 1.4;
    }
    executeAttack(dt) {
        const baseTimer = this.phase === 1 ? 2.2 : this.phase === 2 ? 1.8 : 1.4;
        const progress = 1 - (this.stateTimer / baseTimer);
        if (this.state === 'smash' && progress > 0.6 && progress < 0.65) {
            bossShockwaves.push({ x: this.x + this.w / 2, y: this.y + this.h, r: 30, speed: 280, life: 2 });
            screenShake = 10;
        }
        if (this.state === 'shoot' && progress > 0.3) {
            const count = this.phase === 1 ? 3 : this.phase === 2 ? 5 : 8;
            if (Math.random() < 0.08) {
                for (let i = 0; i < count; i++) {
                    const angle = -Math.PI / 2 + (i - (count - 1) / 2) * 0.3;
                    bossProjectiles.push({ x: this.x + this.w / 2, y: this.y + this.h - 20, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5 - 2, r: 8 + Math.random() * 4, life: 5 });
                }
            }
        }
        if (this.state === 'sweep' && progress > 0.4 && progress < 0.5) {
            for (let i = 0; i < 12; i++) bossProjectiles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2 + i * 8 - 40, vx: this.moveDir * (6 + Math.random() * 2), vy: (Math.random() - 0.5) * 2, r: 6, life: 4 });
        }
    }
    draw() {
        const px = Math.round(this.x - cameraX), py = Math.round(this.y - cameraY);
        ctx.save();
        if (this.isHurt) ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(px + this.w / 2, py + this.h + 5, this.w / 2.2, 12, 0, 0, Math.PI * 2); ctx.fill();
        const phaseColors = [['#8b6f47', '#6b4f2e'], ['#7a5a3a', '#5a3a20'], ['#5a3525', '#3a1a10']];
        const [c1, c2] = phaseColors[this.phase - 1];
        const bodyGrad = ctx.createLinearGradient(0, py, 0, py + this.h);
        bodyGrad.addColorStop(0, c1); bodyGrad.addColorStop(1, c2);
        ctx.fillStyle = bodyGrad;
        const bob = Math.sin(this.animTimer * 2) * 3;
        ctx.beginPath(); ctx.roundRect(px, py + 20 + bob, this.w, this.h - 20, 16); ctx.fill();
        ctx.beginPath(); ctx.roundRect(px + 20, py + bob, this.w - 40, 50, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px + 30, py + 40 + bob); ctx.lineTo(px + 50, py + 80 + bob); ctx.lineTo(px + 35, py + 110 + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px + this.w - 30, py + 50 + bob); ctx.lineTo(px + this.w - 55, py + 95 + bob); ctx.stroke();
        const eyeGlow = 0.5 + Math.sin(this.animTimer * 4) * 0.3;
        ctx.fillStyle = `rgba(255, ${this.phase === 3 ? 50 : 100}, 50, ${eyeGlow})`;
        ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(px + this.w / 2 - 25, py + 25 + bob, 8, 0, Math.PI * 2); ctx.arc(px + this.w / 2 + 25, py + 25 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(px + this.w / 2 - 25, py + 25 + bob, 3, 0, Math.PI * 2); ctx.arc(px + this.w / 2 + 25, py + 25 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#200'; ctx.beginPath();
        if (this.state === 'smash' || this.state === 'shoot') {
            ctx.roundRect(px + this.w / 2 - 30, py + 45 + bob, 60, 18, 6); ctx.fill();
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 6; i++) ctx.fillRect(px + this.w / 2 - 25 + i * 10, py + 45 + bob, 6, 8);
        } else ctx.roundRect(px + this.w / 2 - 20, py + 48 + bob, 40, 8, 4);
        ctx.fillStyle = bodyGrad;
        const armSwing = this.state === 'smash' ? Math.sin((1 - this.stateTimer / 2.2) * Math.PI) * -50 : 0;
        ctx.beginPath(); ctx.roundRect(px - 15, py + 50 + bob + armSwing, 25, 60, 8); ctx.fill();
        ctx.beginPath(); ctx.roundRect(px + this.w - 10, py + 50 + bob + armSwing, 25, 60, 8); ctx.fill();
        ctx.restore();
        this.drawHealthBar();
    }
    drawHealthBar() {
        const barW = W - 120, barH = 22, bx = 60, by = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(bx - 4, by - 4, barW + 8, barH + 8, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(`👹 巨型岩怪 - 阶段 ${this.phase}/3`, bx, by - 10);
        ctx.fillStyle = '#333'; ctx.fillRect(bx, by, barW, barH);
        const hpPct = this.currentHp / this.maxHp[this.phase - 1];
        const hpGrad = ctx.createLinearGradient(bx, 0, bx + barW, 0);
        hpGrad.addColorStop(0, '#ff2200'); hpGrad.addColorStop(0.5, '#ff6600'); hpGrad.addColorStop(1, '#ffcc00');
        ctx.fillStyle = hpGrad; ctx.fillRect(bx, by, barW * hpPct, barH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.currentHp)} / ${this.maxHp[this.phase - 1]}`, bx + barW / 2, by + barH / 2 + 5);
        ctx.textAlign = 'left';
    }
}

function addParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) particles.push({ x, y, vx: randRange(-3, 3), vy: randRange(-5, -1), life: randRange(0.3, 0.8), maxLife: 0.8, color, size: randRange(2, 5) });
}
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x - cameraX, p.y - cameraY, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ====== 关卡生成 ======
function generateFloor(floor) {
    floorPlatforms = []; restPoints = []; movingPlatforms = [];
    fallingRocks = []; rockSpawners = []; windZones = [];
    powerShards = []; exitPortal = null; boss = null;
    floorPlatforms.push({ x: 0, y: H - 40, w: W, h: 40, type: 'ground' });
    floorPlatforms.push({ x: 0, y: 0, w: 20, h: H, type: 'wall' });
    floorPlatforms.push({ x: W - 20, y: 0, w: 20, h: H, type: 'wall' });

    restPoints.push({ x: 80, y: H - 76, w: 56, h: 36, used: false });

    if (floor === 12) {
        floorPlatforms.push({ x: 100, y: H - 160, w: 180, h: 20, type: 'normal' });
        floorPlatforms.push({ x: W - 280, y: H - 160, w: 180, h: 20, type: 'normal' });
        floorPlatforms.push({ x: W / 2 - 80, y: H - 280, w: 160, h: 20, type: 'normal' });
        restPoints.push({ x: W / 2 - 28, y: H - 316, w: 56, h: 36, used: false });
        powerShards.push({ x: 180, y: H - 200, w: 20, h: 20, collected: false });
        powerShards.push({ x: W - 200, y: H - 200, w: 20, h: 20, collected: false });
        boss = new Boss(); return;
    }
    let gapMin, gapMax, platMin, platMax, restCount, platCount;
    if (floor <= 4) { gapMin = 70; gapMax = 110; platMin = 120; platMax = 200; restCount = 2; platCount = 6 + floor; }
    else if (floor <= 8) { gapMin = 100; gapMax = 160; platMin = 80; platMax = 160; restCount = Math.random() < 0.5 ? 2 : 1; platCount = 7 + floor; }
    else { gapMin = 130; gapMax = 190; platMin = 60; platMax = 120; restCount = 1; platCount = 9 + floor; }
    let currentY = H - 120, lastX = 40; const usedPositions = [];
    for (let i = 0; i < platCount; i++) {
        const pw = randRange(platMin, platMax); let px; let attempts = 0;
        do { px = randRange(40, W - pw - 40); attempts++; } while (attempts < 10 && Math.abs(px - lastX) < 40);
        lastX = px;
        floorPlatforms.push({ x: px, y: currentY, w: pw, h: 18, type: 'normal' });
        usedPositions.push({ x: px, y: currentY, w: pw });
        currentY -= randRange(gapMin, gapMax); if (currentY < 80) break;
    }
    for (let i = 0; i < restCount; i++) {
        if (usedPositions.length > 2) {
            const idx = Math.floor(usedPositions.length * (0.2 + i * 0.35));
            if (idx < usedPositions.length) {
                const pos = usedPositions[Math.min(idx, usedPositions.length - 1)];
                restPoints.push({ x: pos.x + pos.w / 2 - 28, y: pos.y - 36, w: 56, h: 36, used: false });
            }
        }
    }
    if (floor >= 5) {
        const mpCount = floor <= 8 ? (Math.random() < 0.5 ? 1 : 2) : (Math.random() < 0.5 ? 2 : 3);
        for (let i = 0; i < mpCount; i++) {
            if (usedPositions.length > 3) {
                const idx = Math.floor(usedPositions.length * (0.3 + i * 0.2));
                if (idx < usedPositions.length) {
                    const pos = usedPositions[idx];
                    movingPlatforms.push({ x: pos.x, y: pos.y, w: pos.w, h: 16, type: 'moving', startX: pos.x, range: 80 + Math.random() * 60, speed: 1 + Math.random() * 0.8, t: Math.random() * Math.PI * 2, vx: 0 });
                }
            }
        }
    }
    if (floor >= 5) {
        const spawnCount = floor <= 8 ? 2 : 3;
        for (let i = 0; i < spawnCount; i++) rockSpawners.push({ x: 100 + (W - 200) * (i / spawnCount) + randRange(-40, 40), interval: floor <= 8 ? randRange(2.5, 4) : randRange(1.8, 3), timer: randRange(0, 2) });
    }
    if (floor >= 9) { windZones.push({ active: true }); windDirection = 0; windTimer = randRange(1.5, 3); }
    if (floor === 4 || floor === 8 || floor === 10) {
        if (usedPositions.length > 4) {
            const pos = usedPositions[Math.floor(usedPositions.length * 0.6)];
            powerShards.push({ x: pos.x + pos.w / 2 - 10, y: pos.y - 28, w: 20, h: 20, collected: false });
        }
    }
    const exitY = 40; const exitSide = Math.random() < 0.5 ? 'left' : 'right';
    exitPortal = { x: exitSide === 'left' ? 30 : W - 90, y: exitY, w: 60, h: 50 };
    floorPlatforms.push({ x: exitPortal.x - 10, y: exitPortal.y + exitPortal.h + 10, w: exitPortal.w + 20, h: 18, type: 'exit_platform' });
}

// ====== 绘制 ======
function drawBackground() {
    const fp = (currentFloor - 1) / (TOTAL_FLOORS - 1);
    const r = Math.floor(10 + fp * 15), g = Math.floor(5 + fp * 20), b = Math.floor(20 + fp * 40);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgb(${r + 5},${g + 5},${b + 10})`);
    grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
    grad.addColorStop(1, `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.8)})`);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 30; i++) {
        const x = (i * 73) % W, y = (i * 97) % H;
        ctx.beginPath(); ctx.arc(x, y, 30 + (i % 3) * 15, 0, Math.PI * 2); ctx.fill();
    }
    const wg1 = ctx.createLinearGradient(0, 0, 40, 0);
    wg1.addColorStop(0, '#2a1a0a'); wg1.addColorStop(1, 'rgba(60,40,20,0.3)');
    ctx.fillStyle = wg1; ctx.fillRect(0, 0, 40, H);
    const wg2 = ctx.createLinearGradient(W - 40, 0, W, 0);
    wg2.addColorStop(0, 'rgba(60,40,20,0.3)'); wg2.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = wg2; ctx.fillRect(W - 40, 0, 40, H);
    if (currentFloor >= 9) {
        const fogAlpha = (currentFloor - 8) / 4 * 0.25;
        ctx.fillStyle = `rgba(200,220,255,${fogAlpha})`; ctx.fillRect(0, 0, W, H);
    }
}
function drawPlatform(p) {
    const x = p.x - cameraX, y = p.y - cameraY;
    if (p.type === 'ground') {
        const g = ctx.createLinearGradient(0, y, 0, y + p.h);
        g.addColorStop(0, '#4a3828'); g.addColorStop(1, '#2a1a0a');
        ctx.fillStyle = g; ctx.fillRect(x, y, p.w, p.h);
        if (currentFloor <= 4) { ctx.fillStyle = '#4a8a3a'; ctx.fillRect(x, y, p.w, 4); }
    } else if (p.type === 'wall') return;
    else if (p.type === 'moving') {
        const g = ctx.createLinearGradient(0, y, 0, y + p.h);
        g.addColorStop(0, '#8b6b4a'); g.addColorStop(1, '#5a4030');
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, p.w, p.h, 4); ctx.fill();
        ctx.strokeStyle = '#aa8866'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,100,0.7)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⇆', x + p.w / 2, y + 12); ctx.textAlign = 'left';
    } else {
        const g = ctx.createLinearGradient(0, y, 0, y + p.h);
        const topC = currentFloor <= 4 ? '#6a5a3a' : currentFloor <= 8 ? '#5a4a3a' : '#4a3a2a';
        const botC = currentFloor <= 4 ? '#4a3a2a' : currentFloor <= 8 ? '#3a2a1a' : '#2a1a0a';
        g.addColorStop(0, topC); g.addColorStop(1, botC);
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, p.w, p.h, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 2, y + 1, p.w - 4, 2);
        if (p.type === 'exit_platform') {
            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
            ctx.beginPath(); ctx.roundRect(x, y, p.w, p.h, 4); ctx.stroke(); ctx.setLineDash([]);
        }
    }
}
function drawRestPoint(r) {
    if (r.used) return;
    const x = r.x - cameraX, y = r.y - cameraY, t = Date.now() / 400, pulse = 1 + Math.sin(t) * 0.15;
    const glow = ctx.createRadialGradient(x + r.w / 2, y + r.h / 2, 2, x + r.w / 2, y + r.h / 2, 35 * pulse);
    glow.addColorStop(0, 'rgba(0,255,136,0.5)'); glow.addColorStop(1, 'rgba(0,255,136,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - 20, y - 20, r.w + 40, r.h + 40);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 5, y + r.h - 8, r.w - 10, 8);
    const flameH = 12 + Math.sin(t * 2) * 3;
    const fg = ctx.createLinearGradient(0, y + r.h - 8 - flameH, 0, y + r.h - 8);
    fg.addColorStop(0, '#ffff00'); fg.addColorStop(0.5, '#ff8800'); fg.addColorStop(1, '#ff2200');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(x + r.w / 2, y + r.h - 12, 8, flameH, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,255,136,0.9)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+20⚡', x + r.w / 2, y - 4); ctx.textAlign = 'left';
}
function drawPowerShard(s) {
    if (s.collected) return;
    const x = s.x - cameraX, y = s.y - cameraY, t = Date.now() / 300, bob = Math.sin(t) * 4, rot = t * 0.5;
    ctx.save(); ctx.translate(x + s.w / 2, y + s.h / 2 + bob); ctx.rotate(rot);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
    glow.addColorStop(0, 'rgba(255,0,255,0.6)'); glow.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(-25, -25, 50, 50);
    ctx.fillStyle = '#ff44ff'; ctx.strokeStyle = '#ffaaff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(0, -10); ctx.lineTo(3, -6); ctx.closePath(); ctx.fill();
    ctx.restore();
}
function drawExitPortal() {
    if (!exitPortal) return;
    const x = exitPortal.x - cameraX, y = exitPortal.y - cameraY, t = Date.now() / 200;
    for (let i = 3; i >= 0; i--) {
        const r = 30 + i * 8 + Math.sin(t + i) * 5, alpha = 0.15 - i * 0.03;
        const g = ctx.createRadialGradient(x + exitPortal.w / 2, y + exitPortal.h / 2, 5, x + exitPortal.w / 2, y + exitPortal.h / 2, r);
        g.addColorStop(0, `rgba(100,200,255,${alpha})`); g.addColorStop(1, 'rgba(100,200,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 30, y - 30, exitPortal.w + 60, exitPortal.h + 60);
    }
    ctx.fillStyle = '#1a3a5a'; ctx.beginPath(); ctx.roundRect(x, y, exitPortal.w, exitPortal.h, [12, 12, 0, 0]); ctx.fill();
    const ig = ctx.createLinearGradient(0, y, 0, y + exitPortal.h);
    ig.addColorStop(0, `hsl(${(t * 30) % 360}, 80%, 70%)`); ig.addColorStop(1, `hsl(${(t * 30 + 60) % 360}, 80%, 50%)`);
    ctx.fillStyle = ig; ctx.beginPath(); ctx.roundRect(x + 6, y + 6, exitPortal.w - 12, exitPortal.h - 12, [8, 8, 0, 0]); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('↑', x + exitPortal.w / 2, y + exitPortal.h / 2 + 6); ctx.textAlign = 'left';
    if (currentFloor < TOTAL_FLOORS - 1) {
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`第${currentFloor + 1}层`, x + exitPortal.w / 2, y - 4); ctx.textAlign = 'left';
    }
}
function drawFallingRocks() {
    for (const r of fallingRocks) {
        const x = r.x - cameraX, y = r.y - cameraY;
        ctx.save(); ctx.translate(x + r.size / 2, y + r.size / 2); ctx.rotate(r.rot);
        ctx.fillStyle = '#5a4030'; ctx.strokeStyle = '#7a6040'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -r.size / 2); ctx.lineTo(r.size / 2, -r.size / 6); ctx.lineTo(r.size / 2.5, r.size / 2); ctx.lineTo(-r.size / 3, r.size / 2.5); ctx.lineTo(-r.size / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
}
function drawWindIndicator() {
    if (currentFloor < 9 || windDirection === 0) return;
    const t = Date.now() / 150;
    const arrow = windDirection > 0 ? '→' : '←';
    for (let i = 0; i < 6; i++) {
        const y = 100 + i * 80 + Math.sin(t + i) * 10;
        const x = windDirection > 0 ? 50 + ((t * 50 + i * 100) % (W - 100)) : W - 50 - ((t * 50 + i * 100) % (W - 100));
        ctx.font = '24px sans-serif'; ctx.fillStyle = `rgba(180,220,255,${0.3 + Math.sin(t + i) * 0.2})`; ctx.textAlign = 'center';
        ctx.fillText(arrow, x, y); ctx.textAlign = 'left';
    }
}
function drawBossProjectiles() {
    for (const p of bossProjectiles) {
        const x = p.x - cameraX, y = p.y - cameraY;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r);
        g.addColorStop(0, '#ffaa44'); g.addColorStop(0.6, '#cc4400'); g.addColorStop(1, 'rgba(100,20,0,0.5)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    }
}
function drawBossShockwaves() {
    for (const s of bossShockwaves) {
        const alpha = clamp(s.life / 2, 0, 1);
        ctx.strokeStyle = `rgba(255,150,50,${alpha * 0.8})`; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(s.x - cameraX, s.y - cameraY, s.r, 0, Math.PI, true); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,200,${alpha})`; ctx.lineWidth = 3; ctx.stroke();
    }
}
function drawDamageTexts(dt) {
    for (let i = showDamageText.length - 1; i >= 0; i--) {
        const d = showDamageText[i]; d.timer -= dt; d.y -= 30 * dt;
        if (d.timer <= 0) { showDamageText.splice(i, 1); continue; }
        ctx.globalAlpha = clamp(d.timer, 0, 1); ctx.fillStyle = d.color;
        ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(d.text, d.x - cameraX, d.y - cameraY); ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
}

// ====== 更新 ======
function updateMovingPlatforms(dt) {
    for (const mp of movingPlatforms) {
        const prevX = mp.x; mp.t += mp.speed * dt;
        mp.x = mp.startX + Math.sin(mp.t) * mp.range; mp.vx = mp.x - prevX;
    }
}
function updateFallingRocks(dt) {
    for (const rs of rockSpawners) {
        rs.timer -= dt;
        if (rs.timer <= 0) {
            rs.timer = rs.interval;
            fallingRocks.push({ x: rs.x + randRange(-30, 30), y: -30, vy: randRange(4, 7), size: randRange(18, 30), rot: 0, rotSpeed: randRange(-3, 3) });
        }
    }
    for (let i = fallingRocks.length - 1; i >= 0; i--) {
        const r = fallingRocks[i]; r.y += r.vy; r.rot += r.rotSpeed * dt;
        if (r.y > H + 50) { fallingRocks.splice(i, 1); continue; }
        if (player) {
            const rb = { x: r.x, y: r.y, w: r.size, h: r.size };
            if (rectsOverlap(rb, player)) {
                player.takeDamage(ROCK_DAMAGE); fallingRocks.splice(i, 1);
                for (let j = 0; j < 12; j++) addParticle(r.x + r.size / 2, r.y + r.size / 2, '#8b6b4a', 1);
            }
        }
    }
}
function updateWind(dt) {
    if (currentFloor < 9) return;
    windTimer -= dt;
    if (windTimer <= 0) {
        windTimer = randRange(1.5, 3.5);
        const rand = Math.random();
        windDirection = rand < 0.33 ? -1 : rand < 0.66 ? 1 : 0;
    }
}
function updatePowerShards(dt) {
    if (shardActive) {
        shardTimer -= dt;
        if (shardTimer <= 0) { shardActive = false; attackPower = BASE_ATTACK; updateHUD(); }
    }
    for (const s of powerShards) {
        if (s.collected) continue;
        if (player && rectsOverlap(s, player)) {
            s.collected = true; shardActive = true; shardTimer = 10; attackPower = SHARD_ATTACK;
            for (let i = 0; i < 20; i++) addParticle(s.x + s.w / 2, s.y + s.h / 2, '#ff00ff', 2);
            updateHUD();
        }
    }
}
function checkRestPoints() {
    for (const r of restPoints) {
        if (r.used) continue;
        if (player && rectsOverlap(r, player)) {
            r.used = true; stamina = Math.min(STAMINA_MAX, stamina + REST_RECOVER);
            for (let i = 0; i < 20; i++) addParticle(r.x + r.w / 2, r.y + r.h / 2, '#00ff88', 2);
            updateHUD();
        }
    }
}
function checkExitPortal() {
    if (!exitPortal || currentFloor === 12) return;
    if (player && rectsOverlap(exitPortal, player)) goToNextFloor();
}
function goToNextFloor() {
    floorTimes[currentFloor] = (Date.now() - floorStartTime) / 1000;
    currentFloor++; stamina = Math.min(STAMINA_MAX, stamina + 10);
    bossProjectiles = []; bossShockwaves = [];
    generateFloor(currentFloor);
    player.x = 40; player.y = H - 100; player.vx = 0; player.vy = 0;
    floorStartTime = Date.now(); updateHUD(); screenShake = 12;
    for (let i = 0; i < 30; i++) addParticle(W / 2, H / 2, '#ffff88', 3);
    saveGame();
}
function triggerFall() {
    fallCount++; updateHUD();
    if (fallCount >= MAX_FALLS) { triggerGameOver(); return; }
    if (currentFloor > 1) currentFloor--;
    stamina = STAMINA_MAX * 0.6;
    bossProjectiles = []; bossShockwaves = [];
    generateFloor(currentFloor);
    player.x = W / 2; player.y = H - 100; player.vx = 0; player.vy = 0; player.invulnTimer = 1.5;
    floorStartTime = Date.now(); updateHUD(); screenShake = 15;
    saveGame();
}
function triggerGameOver() {
    gameState = GameState.GAMEOVER;
    clearSave();
    const totalTime = (Date.now() - gameTime) / 1000;
    document.getElementById('gameover-title').textContent = '💀 坠入深渊 💀';
    document.getElementById('gameover-stats').innerHTML = `
        <div><span class="stat-label">最高到达</span><span class="stat-value">第 ${currentFloor} 层</span></div>
        <div><span class="stat-label">总用时</span><span class="stat-value">${formatTime(totalTime)}</span></div>
        <div><span class="stat-label">滑落次数</span><span class="stat-value">${fallCount} 次</span></div>`;
    document.getElementById('gameover-screen').classList.remove('hidden');
}
function triggerVictory() {
    gameState = GameState.VICTORY; submitted = false;
    clearSave();
    floorTimes[currentFloor] = (Date.now() - floorStartTime) / 1000;
    const totalTime = (Date.now() - gameTime) / 1000;
    let html = `<div><span class="stat-label">总用时</span><span class="stat-value" style="font-size:22px">${formatTime(totalTime)}</span></div>
        <div><span class="stat-label">滑落次数</span><span class="stat-value">${fallCount} 次</span></div>
        <hr style="border-color:rgba(255,255,255,0.1);margin:8px 0">`;
    for (let i = 1; i <= TOTAL_FLOORS; i++) html += `<div><span class="stat-label">第${i}层用时</span><span class="stat-value">${formatTime(floorTimes[i] || 0)}</span></div>`;
    document.getElementById('victory-stats').innerHTML = html;
    document.getElementById('victory-screen').classList.remove('hidden');
}

function updateHUD() {
    const pct = (stamina / STAMINA_MAX) * 100;
    const fill = document.getElementById('stamina-fill');
    fill.style.width = `${pct}%`;
    fill.className = 'stamina-fill' + (pct < 25 ? ' low' : pct < 50 ? ' mid' : '');
    document.getElementById('stamina-text').textContent = `${Math.ceil(stamina)} / ${STAMINA_MAX}`;
    document.getElementById('floor-info').textContent = `🏔 第 ${currentFloor} / ${TOTAL_FLOORS} 层`;
    document.getElementById('fall-info').textContent = `💔 滑落: ${fallCount} / ${MAX_FALLS}`;
    document.getElementById('attack-info').textContent = shardActive ? `⚔ ${attackPower} 💎${shardTimer.toFixed(1)}s` : `⚔ ${attackPower}`;
}
function updateTimers() {
    document.getElementById('timer-info').textContent = `⏱ ${formatTime((Date.now() - gameTime) / 1000)}`;
    document.getElementById('floor-timer-info').textContent = `本层: ${formatTime((Date.now() - floorStartTime) / 1000)}`;
}

// ====== 主循环 ======
function gameLoop(timestamp) {
    const dt = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
    lastTimestamp = timestamp; animationFrame++;
    if (gameState === GameState.PLAYING) update(dt);
    render(dt);
    requestAnimationFrame(gameLoop);
}
function update(dt) {
    if (attackCooldown > 0) attackCooldown -= dt;
    if (screenShake > 0) { screenShake -= dt * 30; if (screenShake < 0) screenShake = 0; }
    updateMovingPlatforms(dt); updateFallingRocks(dt); updateWind(dt);
    updateParticles(dt); updatePowerShards(dt);
    if (player) player.update(dt);
    if (boss && currentFloor === 12) boss.update(dt);
    checkRestPoints(); checkExitPortal();
    updateHUD();
    if (animationFrame % 6 === 0) updateTimers();
    if (animationFrame % 180 === 0) saveGame();
}
function render(dt) {
    ctx.save();
    if (screenShake > 0) ctx.translate(randRange(-screenShake, screenShake), randRange(-screenShake, screenShake));
    drawBackground(); drawWindIndicator();
    for (const p of floorPlatforms) drawPlatform(p);
    for (const mp of movingPlatforms) drawPlatform(mp);
    for (const r of restPoints) drawRestPoint(r);
    for (const s of powerShards) drawPowerShard(s);
    drawExitPortal(); drawFallingRocks();
    if (boss && currentFloor === 12) { drawBossShockwaves(); boss.draw(); drawBossProjectiles(); }
    if (player) player.draw();
    drawParticles(); drawDamageTexts(dt || 0.016);
    ctx.restore();
    if (currentFloor === 12 && gameState === GameState.PLAYING && boss && boss.phase >= 1) {
        ctx.fillStyle = `rgba(255,80,80,${0.7 + Math.sin(Date.now() / 200) * 0.3})`;
        ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        const label = boss.phase === 1 ? '⚠ BOSS战 - 第一阶段 ⚠' : boss.phase === 2 ? '⚠ BOSS战 - 第二阶段 ⚠' : '⚠ BOSS战 - 最终阶段！ ⚠';
        ctx.fillText(label, W / 2, 30); ctx.textAlign = 'left';
    }
    if (gameState === GameState.MENU) {
        // 菜单动画
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 137 + Date.now() / 30) % W;
            const y = (i * 193 + Date.now() / 50) % H;
            ctx.beginPath(); ctx.arc(x, y, 3 + (i % 4) * 2, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// ====== 存档系统 ======
const SAVE_KEY = 'climber_game_save';

function saveGame() {
    if (gameState !== GameState.PLAYING) return;
    const saveData = {
        currentFloor: currentFloor,
        fallCount: fallCount,
        stamina: stamina,
        shardActive: shardActive,
        shardTimer: shardTimer,
        attackPower: attackPower,
        floorTimes: floorTimes,
        gameStartTime: gameTime,
        floorStartTime: floorStartTime,
        savedAt: Date.now()
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.warn('存档失败:', e);
    }
}

function loadGame() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) return null;
        const saveData = JSON.parse(data);
        if (!saveData || !saveData.currentFloor) return null;
        return saveData;
    } catch (e) {
        return null;
    }
}

function hasSavedGame() {
    return loadGame() !== null;
}

function clearSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
}

function continueGame() {
    const saveData = loadGame();
    if (!saveData) {
        startGame();
        return;
    }

    currentFloor = saveData.currentFloor || 1;
    fallCount = saveData.fallCount || 0;
    stamina = saveData.stamina || STAMINA_MAX;
    shardActive = saveData.shardActive || false;
    shardTimer = saveData.shardTimer || 0;
    attackPower = saveData.attackPower || BASE_ATTACK;
    floorTimes = saveData.floorTimes || {};
    gameTime = saveData.gameStartTime || Date.now();
    floorStartTime = Date.now();

    particles = []; bossProjectiles = []; bossShockwaves = [];
    showDamageText = []; submitted = false;

    generateFloor(currentFloor);
    player = new Player(40, H - 100);
    gameState = GameState.PLAYING;
    updateHUD();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('records-screen').classList.add('hidden');
}

function updateContinueButton() {
    const btn = document.getElementById('continue-btn');
    if (btn) {
        if (hasSavedGame()) {
            btn.style.display = 'inline-block';
            const save = loadGame();
            if (save) {
                btn.textContent = `⏯ 继续游戏 (第${save.currentFloor}层)`;
            }
        } else {
            btn.style.display = 'none';
        }
    }
}

// ====== 初始化 / 输入 ======
function startGame() {
    clearSave();
    currentFloor = 1; fallCount = 0;
    stamina = STAMINA_MAX; attackPower = BASE_ATTACK;
    shardActive = false; shardTimer = 0;
    particles = []; bossProjectiles = []; bossShockwaves = [];
    floorTimes = {}; showDamageText = []; submitted = false;
    generateFloor(1);
    player = new Player(40, H - 100);
    gameTime = Date.now(); floorStartTime = Date.now();
    gameState = GameState.PLAYING; updateHUD();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('records-screen').classList.add('hidden');
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameState === GameState.PLAYING) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') { e.preventDefault(); player && player.jump(); }
        if (e.key === 'x' || e.key === 'X') { player && player.attack(); }
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
    }
});
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

function togglePause() {
    if (gameState === GameState.PLAYING) {
        gameState = GameState.PAUSED;
        document.getElementById('pause-screen').classList.remove('hidden');
    } else if (gameState === GameState.PAUSED) {
        gameState = GameState.PLAYING;
        document.getElementById('pause-screen').classList.add('hidden');
    }
}

// ====== API ======
const API_BASE = '/api/climber';
async function submitRecord(name) {
    if (submitted) return;
    const totalTime = (Date.now() - gameTime) / 1000;
    try {
        const res = await fetch(API_BASE + '/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: name,
                total_time: totalTime,
                fall_count: fallCount,
                floor_times: floorTimes
            })
        });
        submitted = true;
        return await res.json();
    } catch (e) { console.error(e); return null; }
}
async function fetchRecords() {
    try {
        const res = await fetch(API_BASE + '/records');
        return await res.json();
    } catch (e) { return { data: [] }; }
}

function renderRecords(data) {
    const list = document.getElementById('records-list');
    if (!data || !data.data || data.data.length === 0) {
        list.innerHTML = '<div class="no-records">🎮 还没有通关记录，成为第一个吧！</div>';
        return;
    }
    let html = '';
    data.data.forEach((r, i) => {
        const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        const date = r.created_at ? r.created_at.substring(0, 10) : '';
        html += `<div class="record-item">
            <span class="record-rank ${rankCls}">${rankEmoji}</span>
            <span class="record-name">${r.player_name || '匿名勇士'}</span>
            <span class="record-time">${formatTime(r.total_time || 0)}</span>
            <span class="record-date">${date}</span>
        </div>`;
    });
    list.innerHTML = html;
}

// ====== UI按钮 ======
document.getElementById('start-btn').onclick = startGame;
document.getElementById('continue-btn').onclick = continueGame;
document.getElementById('pause-btn').onclick = togglePause;
document.getElementById('resume-btn').onclick = togglePause;
document.getElementById('restart-btn').onclick = () => { if (confirm('确定重新开始吗？当前进度将丢失。')) startGame(); };
document.getElementById('gameover-restart-btn').onclick = startGame;
document.getElementById('victory-restart-btn').onclick = startGame;
document.getElementById('save-record-btn').onclick = async () => {
    const name = document.getElementById('player-name').value.trim() || '匿名勇士';
    const btn = document.getElementById('save-record-btn');
    btn.disabled = true; btn.textContent = '保存中...';
    await submitRecord(name);
    btn.textContent = '✅ 已保存！';
};
document.getElementById('show-records-btn').onclick = async () => {
    const res = await fetchRecords();
    renderRecords(res);
    document.getElementById('records-screen').classList.remove('hidden');
};
document.getElementById('close-records-btn').onclick = () => {
    document.getElementById('records-screen').classList.add('hidden');
    updateContinueButton();
};

// 页面加载时检查存档
updateContinueButton();

// 启动主循环
requestAnimationFrame(gameLoop);
