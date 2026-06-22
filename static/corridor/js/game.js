const CFG = {
    W: 960, H: 540,
    CELL: 60, SEG_LEN: 50, SEGS: 5,
    CORR_TOP: 70, CORR_BOT: 430, CORR_H: 360,
    PLAYER_SPD: 180,
    PLAYER_W: 24, PLAYER_H: 36,
    ENEMY_W: 24, ENEMY_H: 32,
    BOSS_W: 44, BOSS_H: 56,
    DOOR_UNLOCK: 3,
    CRATE_INTERVAL: 8,
};

const WEAPONS = {
    smg:     { id:'smg',     name:'冲锋枪', mag:30, dmg:6,  rate:3,   spd:600,  sz:3,  clr:'#ffdd00', reload:1.5, icon:'🔫' },
    sniper:  { id:'sniper',  name:'狙击枪', mag:5,  dmg:35, rate:1,   spd:1200, sz:5,  clr:'#00eeff', reload:2.5, icon:'🎯' },
    grenade: { id:'grenade', name:'榴弹枪', mag:3,  dmg:60, rate:0.5, spd:350,  sz:8,  clr:'#ff8800', reload:3,   icon:'💥', aoe:180 },
    pistol:  { id:'pistol',  name:'手枪',   mag:12, dmg:10, rate:2,   spd:800,  sz:4,  clr:'#ffffff', reload:1.2, icon:'🔫' },
};
const WEAPON_KEYS = Object.keys(WEAPONS);

const SAVE_KEY = 'corridor_assault_save';
let saveTimer = 0;
const SAVE_INTERVAL = 2;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CFG.W;
canvas.height = CFG.H;

window.addEventListener('error', (e) => {
    const errMsg = e.error && e.error.stack 
        ? (e.error.message + '\n' + e.error.stack)
        : (e.message || String(e.error));
    console.error('Game Error:', errMsg);
    console.error('At:', e.filename, 'line', e.lineno);
    if (gameState === 'paused' || gameState === 'playing') {
        alert('游戏发生错误！\n\n错误信息：' + errMsg + '\n\n请按F12查看控制台详情，或刷新页面重试。');
    }
});

let gameState = 'menu';
let player, cam, enemies, projectiles, crates, doors, particles, bossProjectiles;
let segmentTimes, segStartTime, gameStartTime;
let curSeg, enemySpawned, bossSpawned, totalEnemiesKilled;
let weaponUseCount;
let unlockProgress, unlocking, nearDoor, nearCrate;
let ePressed = false;
let keys = {};
let mouse = { x: 0, y: 0, down: false };
let lastTime = 0;
let shakeAmount = 0;

function makeWeaponInstance(weapId) {
    const def = WEAPONS[weapId];
    return { ...def, ammo: def.mag, reloading: false, reloadTimer: 0, fireTimer: 0 };
}

function initGame() {
    player = {
        x: CFG.CELL * 2,
        y: (CFG.CORR_TOP + CFG.CORR_BOT) / 2,
        w: CFG.PLAYER_W, h: CFG.PLAYER_H,
        hp: 100, maxHp: 100,
        weapons: [makeWeaponInstance('pistol'), null],
        activeSlot: 0,
        maxReached: CFG.CELL * 2,
        facingRight: true,
        invuln: 0,
        vx: 0, vy: 0,
    };
    cam = { x: 0 };
    enemies = [];
    projectiles = [];
    bossProjectiles = [];
    particles = [];
    curSeg = 0;
    enemySpawned = {};
    bossSpawned = {};
    totalEnemiesKilled = 0;
    weaponUseCount = {};
    WEAPON_KEYS.forEach(k => weaponUseCount[k] = 0);
    segmentTimes = [0, 0, 0, 0, 0];
    segStartTime = 0;
    gameStartTime = 0;
    unlockProgress = 0;
    unlocking = false;
    nearDoor = null;
    nearCrate = null;
    shakeAmount = 0;
    ePressed = false;

    crates = [];
    doors = [];
    for (let s = 0; s < CFG.SEGS; s++) {
        const base = s * CFG.SEG_LEN;
        for (let i = CFG.CRATE_INTERVAL; i < CFG.SEG_LEN; i += CFG.CRATE_INTERVAL) {
            const cellX = base + i;
            const randWeap = WEAPON_KEYS[Math.floor(Math.random() * WEAPON_KEYS.length)];
            crates.push({
                x: cellX * CFG.CELL + CFG.CELL / 2,
                y: CFG.CORR_TOP + 60 + Math.random() * (CFG.CORR_H - 120),
                weapon: randWeap,
                collected: false,
                bobPhase: Math.random() * Math.PI * 2,
            });
        }
        doors.push({
            segIndex: s,
            x: (base + CFG.SEG_LEN - 1) * CFG.CELL + CFG.CELL / 2,
            unlocked: false,
            bossDead: false,
        });
    }
    enemies = [];
    spawnSegmentEnemies(0);
    segStartTime = performance.now();
    gameStartTime = performance.now();
}

function getSegment(px) {
    const cell = Math.floor(px / CFG.CELL);
    return Math.min(Math.floor(cell / CFG.SEG_LEN), CFG.SEGS - 1);
}

function segBaseX(seg) {
    return seg * CFG.SEG_LEN * CFG.CELL;
}

function segEndX(seg) {
    return (seg * CFG.SEG_LEN + CFG.SEG_LEN - 1) * CFG.CELL + CFG.CELL / 2;
}

function spawnSegmentEnemies(seg) {
    if (enemySpawned[seg]) return;
    enemySpawned[seg] = true;
    const base = segBaseX(seg);
    const count = 8 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        let ex, ey;
        ey = CFG.CORR_TOP + 40 + Math.random() * (CFG.CORR_H - 80);
        if (i < count / 2) {
            ex = base + (5 + Math.floor(Math.random() * 40)) * CFG.CELL + Math.random() * 30;
        } else {
            ex = player.x + CFG.W * 0.5 + Math.random() * CFG.W * 0.5;
            const segEnd = base + CFG.SEG_LEN * CFG.CELL;
            if (ex > segEnd - CFG.CELL * 2) ex = segEnd - CFG.CELL * 2;
        }
        enemies.push(makeEnemy(ex, ey, false));
    }
}

function makeEnemy(x, y, isBoss) {
    if (isBoss) {
        return {
            x, y, w: CFG.BOSS_W, h: CFG.BOSS_H,
            hp: 200, maxHp: 200,
            speed: 100,
            dmg: 25,
            isBoss: true,
            attackCD: 0,
            dashCD: 2 + Math.random(),
            dashing: false,
            dashTimer: 0,
            dashVx: 0, dashVy: 0,
            shootCD: 1.5 + Math.random(),
            moveTimer: 0,
            targetX: x,
            targetY: y,
            hit: 0,
        };
    }
    return {
        x, y, w: CFG.ENEMY_W, h: CFG.ENEMY_H,
        hp: 30 + Math.floor(Math.random() * 10),
        maxHp: 30 + Math.floor(Math.random() * 10),
        speed: 50 + Math.random() * 40,
        dmg: 10,
        isBoss: false,
        attackCD: 0,
        hit: 0,
        side: Math.random() < 0.5 ? -1 : 1,
    };
}

function spawnBoss(seg) {
    const bx = segEndX(seg) - CFG.CELL * 3;
    const by = (CFG.CORR_TOP + CFG.CORR_BOT) / 2;
    enemies.push(makeEnemy(bx, by, true));
}

function getActiveWeapon() {
    return player.weapons[player.activeSlot];
}

function shoot() {
    const weap = getActiveWeapon();
    if (!weap || weap.reloading || weap.ammo <= 0 || weap.fireTimer > 0) return;

    const dx = mouse.x - (player.x - cam.x);
    const dy = mouse.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    projectiles.push({
        x: player.x,
        y: player.y,
        vx: nx * weap.spd,
        vy: ny * weap.spd,
        dmg: weap.dmg,
        sz: weap.sz,
        clr: weap.clr,
        isGrenade: weap.id === 'grenade',
        aoe: weap.aoe || 0,
        weaponId: weap.id,
        life: 3,
    });

    weap.ammo--;
    weap.fireTimer = 1 / weap.rate;
    weaponUseCount[weap.id] = (weaponUseCount[weap.id] || 0) + 1;

    if (weap.ammo <= 0) {
        startReload();
    }
}

function startReload() {
    const weap = getActiveWeapon();
    if (!weap || weap.reloading || weap.ammo >= weap.mag) return;
    weap.reloading = true;
    weap.reloadTimer = weap.reload;
}

function switchWeapon(slot) {
    if (slot === player.activeSlot) return;
    if (player.weapons[slot]) {
        player.activeSlot = slot;
    }
}

function tryPickupCrate() {
    if (!nearCrate || nearCrate.collected) return;
    const crate = nearCrate;
    nearCrate = null;

    const newWeap = makeWeaponInstance(crate.weapon);

    if (!player.weapons[0]) {
        player.weapons[0] = newWeap;
        crate.collected = true;
        spawnParticles(crate.x, crate.y, WEAPONS[crate.weapon].clr, 8, 100);
    } else if (!player.weapons[1]) {
        player.weapons[1] = newWeap;
        crate.collected = true;
        spawnParticles(crate.x, crate.y, WEAPONS[crate.weapon].clr, 8, 100);
    } else {
        showReplaceModal(newWeap, crate);
    }
}

function replaceWeapon(slotIndex, newWeap, crate) {
    player.weapons[slotIndex] = newWeap;
    crate.collected = true;
    nearCrate = null;
    spawnParticles(crate.x, crate.y, WEAPONS[crate.weapon].clr, 12, 120);
}

function tryUnlockDoor() {
    if (!nearDoor || nearDoor.unlocked) return;
    unlocking = true;
}

function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function rectOverlap(a, b) {
    return a.x - a.w / 2 < b.x + b.w / 2 &&
           a.x + a.w / 2 > b.x - b.w / 2 &&
           a.y - a.h / 2 < b.y + b.h / 2 &&
           a.y + a.h / 2 > b.y - b.h / 2;
}

function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.3 + Math.random() * 0.7);
        particles.push({
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0.3 + Math.random() * 0.5,
            maxLife: 0.3 + Math.random() * 0.5,
            color,
            sz: 2 + Math.random() * 3,
        });
    }
}

function updatePlayer(dt) {
    let dx = 0, dy = 0;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
    }

    let newX = player.x + dx * CFG.PLAYER_SPD * dt;

    for (const door of doors) {
        if (!door.unlocked && player.x <= door.x && newX > door.x) {
            newX = door.x;
            break;
        }
    }

    if (newX > player.maxReached) {
        player.x = newX;
        player.maxReached = newX;
    }

    player.y += dy * CFG.PLAYER_SPD * dt;
    player.y = Math.max(CFG.CORR_TOP + player.h / 2 + 4, Math.min(CFG.CORR_BOT - player.h / 2 - 4, player.y));

    if (dx !== 0) player.facingRight = dx > 0;

    if (player.invuln > 0) player.invuln -= dt;

    const weap = getActiveWeapon();
    if (weap) {
        if (weap.fireTimer > 0) weap.fireTimer -= dt;
        if (weap.reloading) {
            weap.reloadTimer -= dt;
            if (weap.reloadTimer <= 0) {
                weap.ammo = weap.mag;
                weap.reloading = false;
            }
        }
        if (mouse.down && !weap.reloading && gameState === 'playing') {
            shoot();
        }
    }

    const segNow = getSegment(player.x);
    if (segNow > curSeg) {
        segmentTimes[curSeg] = (performance.now() - segStartTime) / 1000;
        curSeg = segNow;
        segStartTime = performance.now();
        spawnSegmentEnemies(curSeg);
    }

    for (let s = 0; s <= curSeg; s++) {
        if (bossSpawned[s]) continue;
        const doorForSeg = doors.find(d => d.segIndex === s);
        if (doorForSeg && player.x > doorForSeg.x - CFG.CELL * 8) {
            bossSpawned[s] = true;
            spawnBoss(s);
        }
    }

    for (const door of doors) {
        if (!door.bossDead) {
            const seg = door.segIndex;
            const hasBoss = enemies.some(e => e.isBoss && getSegment(e.x) === seg && e.hp > 0);
            if (!hasBoss && bossSpawned[seg]) {
                door.bossDead = true;
                spawnParticles(door.x, (CFG.CORR_TOP + CFG.CORR_BOT) / 2, '#ffaa00', 15, 100);
            }
        }
    }

    cam.x = player.x - CFG.W * 0.3;
    if (cam.x < 0) cam.x = 0;

    nearDoor = null;
    nearCrate = null;

    for (const door of doors) {
        if (!door.unlocked && Math.abs(player.x - door.x) < CFG.CELL && door.bossDead) {
            nearDoor = door;
            break;
        }
    }

    for (const door of doors) {
        if (!door.unlocked && !door.bossDead && Math.abs(player.x - door.x) < CFG.CELL * 2) {
            nearDoor = door;
            break;
        }
    }

    for (const crate of crates) {
        if (!crate.collected && dist(player, crate) < 50) {
            nearCrate = crate;
            break;
        }
    }

    if (unlocking && nearDoor && nearDoor.bossDead) {
        if (Math.abs(player.x - nearDoor.x) < CFG.CELL) {
            unlockProgress += dt;
            if (unlockProgress >= CFG.DOOR_UNLOCK) {
                nearDoor.unlocked = true;
                unlocking = false;
                unlockProgress = 0;
                spawnParticles(nearDoor.x, (CFG.CORR_TOP + CFG.CORR_BOT) / 2, '#00ff88', 20, 150);
            }
        } else {
            unlocking = false;
            unlockProgress = 0;
        }
    } else {
        unlocking = false;
        unlockProgress = 0;
    }

    if (ePressed) {
        ePressed = false;
        if (nearCrate) {
            tryPickupCrate();
        } else if (nearDoor && !nearDoor.unlocked && nearDoor.bossDead && !unlocking) {
            tryUnlockDoor();
        }
    }
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.hp <= 0) continue;

        if (e.hit > 0) e.hit -= dt;

        if (e.isBoss) {
            updateBoss(e, dt);
        } else {
            updateNormalEnemy(e, dt);
        }

        if (e.attackCD > 0) e.attackCD -= dt;

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (!e.isBoss && d < 35 && e.attackCD <= 0) {
            if (player.invuln <= 0) {
                player.hp -= e.dmg;
                player.invuln = 0.3;
                shakeAmount = 4;
                spawnParticles(player.x, player.y, '#ff4444', 5, 80);
            }
            e.attackCD = 1.5;
        }

        if (e.isBoss && e.dashing && rectOverlap(
            { x: player.x, y: player.y, w: player.w + 10, h: player.h + 10 },
            { x: e.x, y: e.y, w: e.w, h: e.h }
        )) {
            if (player.invuln <= 0) {
                player.hp -= e.dmg;
                player.invuln = 0.5;
                shakeAmount = 8;
                spawnParticles(player.x, player.y, '#ff4444', 8, 100);
            }
            e.dashing = false;
        }

        if (e.hp <= 0) {
            spawnParticles(e.x, e.y, e.isBoss ? '#ff8800' : '#ff3333', e.isBoss ? 25 : 10, 120);
            totalEnemiesKilled++;
            if (e.isBoss) {
                shakeAmount = 12;
            }
            enemies.splice(i, 1);
        }
    }
}

function updateNormalEnemy(e, dt) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    if (d > 40) {
        e.x += (dx / d) * e.speed * dt;
        e.y += (dy / d) * e.speed * dt;
    }

    e.y = Math.max(CFG.CORR_TOP + e.h / 2 + 4, Math.min(CFG.CORR_BOT - e.h / 2 - 4, e.y));
}

function updateBoss(e, dt) {
    e.moveTimer -= dt;

    if (e.moveTimer <= 0) {
        const segX = segBaseX(getSegment(e.x));
        e.targetX = segX + CFG.CELL * 10 + Math.random() * (CFG.SEG_LEN - 20) * CFG.CELL;
        e.targetY = CFG.CORR_TOP + 50 + Math.random() * (CFG.CORR_H - 100);
        e.moveTimer = 1 + Math.random() * 1.5;
    }

    const dx = e.targetX - e.x;
    const dy = e.targetY - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    if (!e.dashing) {
        e.x += (dx / d) * e.speed * dt;
        e.y += (dy / d) * e.speed * dt;
    }

    e.y = Math.max(CFG.CORR_TOP + e.h / 2 + 4, Math.min(CFG.CORR_BOT - e.h / 2 - 4, e.y));

    e.dashCD -= dt;
    if (e.dashCD <= 0 && !e.dashing) {
        const pdx = player.x - e.x;
        const pdy = player.y - e.y;
        const pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        e.dashVx = (pdx / pd) * 400;
        e.dashVy = (pdy / pd) * 400;
        e.dashing = true;
        e.dashTimer = 0.4;
        e.dashCD = 3 + Math.random() * 2;
    }

    if (e.dashing) {
        e.x += e.dashVx * dt;
        e.y += e.dashVy * dt;
        e.y = Math.max(CFG.CORR_TOP + e.h / 2 + 4, Math.min(CFG.CORR_BOT - e.h / 2 - 4, e.y));
        e.dashTimer -= dt;
        if (e.dashTimer <= 0) e.dashing = false;
    }

    e.shootCD -= dt;
    if (e.shootCD <= 0) {
        const pdx = player.x - e.x;
        const pdy = player.y - e.y;
        const pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        bossProjectiles.push({
            x: e.x, y: e.y,
            vx: (pdx / pd) * 250,
            vy: (pdy / pd) * 250,
            dmg: 25,
            sz: 6,
            life: 4,
        });
        e.shootCD = 1.5 + Math.random() * 1;
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || p.y < CFG.CORR_TOP || p.y > CFG.CORR_BOT) {
            projectiles.splice(i, 1);
            continue;
        }

        let hitSomething = false;
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            if (Math.abs(p.x - e.x) < e.w / 2 + p.sz && Math.abs(p.y - e.y) < e.h / 2 + p.sz) {
                let dmg = p.dmg;
                if (e.isBoss && (p.weaponId === 'smg' || p.weaponId === 'pistol')) {
                    dmg = Math.floor(dmg * 0.5);
                }
                e.hp -= dmg;
                e.hit = 0.1;
                spawnParticles(p.x, p.y, p.clr, 4, 60);

                if (p.isGrenade && p.aoe > 0) {
                    spawnParticles(p.x, p.y, '#ff8800', 15, 150);
                    shakeAmount = 5;
                    for (const ae of enemies) {
                        if (ae.hp <= 0 || ae === e) continue;
                        if (dist(p, ae) < p.aoe) {
                            let aoeDmg = p.dmg;
                            if (ae.isBoss && (p.weaponId === 'smg' || p.weaponId === 'pistol')) {
                                aoeDmg = Math.floor(aoeDmg * 0.5);
                            }
                            ae.hp -= aoeDmg;
                            ae.hit = 0.1;
                        }
                    }
                }
                hitSomething = true;
                break;
            }
        }

        if (hitSomething) {
            projectiles.splice(i, 1);
        }
    }

    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
        const p = bossProjectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || p.y < CFG.CORR_TOP || p.y > CFG.CORR_BOT) {
            bossProjectiles.splice(i, 1);
            continue;
        }

        if (Math.abs(p.x - player.x) < player.w / 2 + p.sz && Math.abs(p.y - player.y) < player.h / 2 + p.sz) {
            if (player.invuln <= 0) {
                player.hp -= p.dmg;
                player.invuln = 0.5;
                shakeAmount = 6;
                spawnParticles(player.x, player.y, '#ff4444', 6, 80);
            }
            bossProjectiles.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function checkGameState() {
    if (player.hp <= 0) {
        gameState = 'gameover';
        if (curSeg < CFG.SEGS) {
            segmentTimes[curSeg] = (performance.now() - segStartTime) / 1000;
        }
        showGameover();
        return;
    }

    const allDoorsUnlocked = doors.every(d => d.unlocked);
    const lastDoor = doors[doors.length - 1];
    const noBossAlive = !enemies.some(e => e.isBoss && e.hp > 0);
    if (allDoorsUnlocked && lastDoor && player.x > lastDoor.x + CFG.CELL && noBossAlive) {
        gameState = 'victory';
        segmentTimes[curSeg] = (performance.now() - segStartTime) / 1000;
        showVictory();
    }
}

function update(dt) {
    if (gameState === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateParticles(dt);
        checkGameState();

        if (shakeAmount > 0) shakeAmount *= 0.9;
        if (shakeAmount < 0.1) shakeAmount = 0;
    }

    if (gameState === 'playing' || gameState === 'paused') {
        if (player) updateHUD();
    }
}

function render() {
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    if (!cam || !player) return;

    ctx.save();

    if (shakeAmount > 0) {
        ctx.translate(
            (Math.random() - 0.5) * shakeAmount * 2,
            (Math.random() - 0.5) * shakeAmount * 2
        );
    }

    drawCorridor();
    drawCrates();
    drawDoors();
    drawProjectiles_render();
    drawEnemies_render();
    drawPlayer_render();
    drawParticles_render();

    if (unlocking && nearDoor) {
        drawUnlockProgress();
    }

    ctx.restore();
}

function drawCorridor() {
    const scrollX = cam.x;
    const startCell = Math.floor(scrollX / CFG.CELL) - 1;
    const endCell = Math.ceil((scrollX + CFG.W) / CFG.CELL) + 1;

    ctx.fillStyle = '#0d1520';
    ctx.fillRect(0, CFG.CORR_TOP, CFG.W, CFG.CORR_H);

    for (let c = startCell; c <= endCell; c++) {
        const sx = c * CFG.CELL - scrollX;
        if (sx > CFG.W + CFG.CELL || sx < -CFG.CELL) continue;

        const seg = Math.floor(c / CFG.SEG_LEN);

        ctx.strokeStyle = 'rgba(30,50,80,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, CFG.CORR_TOP);
        ctx.lineTo(sx, CFG.CORR_BOT);
        ctx.stroke();

        if (c % 2 === 0) {
            ctx.fillStyle = 'rgba(15,25,40,0.4)';
            ctx.fillRect(sx, CFG.CORR_TOP, CFG.CELL, CFG.CORR_H);
        }

        for (let row = 0; row < 6; row++) {
            const fy = CFG.CORR_TOP + row * (CFG.CORR_H / 6);
            ctx.strokeStyle = 'rgba(25,40,65,0.15)';
            ctx.beginPath();
            ctx.moveTo(sx, fy);
            ctx.lineTo(sx + CFG.CELL, fy);
            ctx.stroke();
        }

        if (c % 4 === 0) {
            const cx = sx + CFG.CELL / 2;
            ctx.fillStyle = '#1a3050';
            ctx.fillRect(cx - 3, CFG.CORR_TOP - 2, 6, 4);
            ctx.fillStyle = `rgba(0,180,255,${0.1 + 0.05 * Math.sin(performance.now() / 800 + c)})`;
            ctx.fillRect(cx - 2, CFG.CORR_TOP - 1, 4, 2);
        }
    }

    ctx.fillStyle = '#162030';
    ctx.fillRect(0, 0, CFG.W, CFG.CORR_TOP);
    ctx.fillRect(0, CFG.CORR_BOT, CFG.W, CFG.H - CFG.CORR_BOT);

    ctx.fillStyle = '#1a2a40';
    ctx.fillRect(0, CFG.CORR_TOP - 4, CFG.W, 4);
    ctx.fillRect(0, CFG.CORR_BOT, CFG.W, 4);

    ctx.strokeStyle = '#0f4a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CFG.CORR_TOP);
    ctx.lineTo(CFG.W, CFG.CORR_TOP);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, CFG.CORR_BOT);
    ctx.lineTo(CFG.W, CFG.CORR_BOT);
    ctx.stroke();

    for (let seg = 0; seg < CFG.SEGS; seg++) {
        const sx = segBaseX(seg) - scrollX;
        const ex = (segBaseX(seg) + CFG.SEG_LEN * CFG.CELL) - scrollX;
        if (ex < 0 || sx > CFG.W) continue;

        const segClr = seg === curSeg ? 'rgba(0,200,255,0.06)' : 'rgba(20,30,50,0.03)';
        ctx.fillStyle = segClr;
        ctx.fillRect(Math.max(0, sx), CFG.CORR_TOP, Math.min(CFG.W, ex) - Math.max(0, sx), CFG.CORR_H);
    }
}

function drawCrates() {
    for (const crate of crates) {
        if (crate.collected) continue;
        const sx = crate.x - cam.x;
        if (sx < -30 || sx > CFG.W + 30) continue;

        const bob = Math.sin(performance.now() / 400 + crate.bobPhase) * 3;
        const sy = crate.y + bob;

        ctx.save();
        ctx.shadowColor = WEAPONS[crate.weapon].clr;
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(sx - 12, sy - 12, 24, 24);
        ctx.strokeStyle = WEAPONS[crate.weapon].clr;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 12, sy - 12, 24, 24);

        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = WEAPONS[crate.weapon].clr;
        ctx.fillText(WEAPONS[crate.weapon].icon, sx, sy);

        ctx.restore();
    }
}

function drawDoors() {
    for (const door of doors) {
        const sx = door.x - cam.x;
        if (sx < -40 || sx > CFG.W + 40) continue;

        if (door.unlocked) {
            ctx.fillStyle = 'rgba(0,255,136,0.1)';
            ctx.fillRect(sx - 4, CFG.CORR_TOP, 8, CFG.CORR_H);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sx, CFG.CORR_TOP);
            ctx.lineTo(sx, CFG.CORR_TOP + 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx, CFG.CORR_BOT - 40);
            ctx.lineTo(sx, CFG.CORR_BOT);
            ctx.stroke();
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🔓', sx, CFG.CORR_TOP + 20);
        } else if (door.bossDead) {
            ctx.fillStyle = 'rgba(255,200,0,0.1)';
            ctx.fillRect(sx - 4, CFG.CORR_TOP, 8, CFG.CORR_H);
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sx, CFG.CORR_TOP);
            ctx.lineTo(sx, CFG.CORR_TOP + 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx, CFG.CORR_BOT - 40);
            ctx.lineTo(sx, CFG.CORR_BOT);
            ctx.stroke();
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('�', sx, CFG.CORR_TOP + 20);
            const glowAlpha = 0.3 + 0.1 * Math.sin(performance.now() / 300);
            ctx.fillStyle = `rgba(255,200,0,${glowAlpha})`;
            ctx.fillRect(sx - 4, CFG.CORR_TOP, 8, CFG.CORR_H);
        } else {
            ctx.fillStyle = 'rgba(255,60,60,0.15)';
            ctx.fillRect(sx - 4, CFG.CORR_TOP, 8, CFG.CORR_H);
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sx, CFG.CORR_TOP);
            ctx.lineTo(sx, CFG.CORR_TOP + 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx, CFG.CORR_BOT - 40);
            ctx.lineTo(sx, CFG.CORR_BOT);
            ctx.stroke();
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('�', sx, CFG.CORR_TOP + 20);
            const glowAlpha = 0.3 + 0.1 * Math.sin(performance.now() / 300);
            ctx.fillStyle = `rgba(255,68,68,${glowAlpha})`;
            ctx.fillRect(sx - 4, CFG.CORR_TOP, 8, CFG.CORR_H);
        }
    }
}

function drawPlayer_render() {
    const sx = player.x - cam.x;
    const sy = player.y;

    if (player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 0) return;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = '#0088cc';
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);

    ctx.fillStyle = '#00bbee';
    ctx.fillRect(-player.w / 2 + 2, -player.h / 2 + 2, player.w - 4, 8);

    const eyeOff = player.facingRight ? 4 : -4;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(eyeOff - 2, -player.h / 2 + 6, 4, 4);

    const aimDx = mouse.x - sx;
    const aimDy = mouse.y - sy;
    const aimAngle = Math.atan2(aimDy, aimDx);
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(aimAngle) * 18, Math.sin(aimAngle) * 18);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0,200,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - player.w / 2 - 2, sy - player.h / 2 - 2, player.w + 4, player.h + 4);
    ctx.restore();
}

function drawEnemies_render() {
    for (const e of enemies) {
        if (e.hp <= 0) continue;
        const sx = e.x - cam.x;
        if (sx < -50 || sx > CFG.W + 50) continue;

        ctx.save();
        ctx.translate(sx, e.y);

        if (e.isBoss) {
            ctx.fillStyle = e.hit > 0 ? '#ffaa00' : '#cc3300';
            ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);

            ctx.fillStyle = '#ff5500';
            ctx.fillRect(-e.w / 2 + 4, -e.h / 2 + 4, e.w - 8, 10);

            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-6, -e.h / 2 + 8, 5, 5);
            ctx.fillRect(2, -e.h / 2 + 8, 5, 5);

            if (e.dashing) {
                ctx.strokeStyle = 'rgba(255,100,0,0.6)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(-e.w / 2 - 4, -e.h / 2 - 4, e.w + 8, e.h + 8);
                ctx.setLineDash([]);
            }

            const hpPct = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = '#333';
            ctx.fillRect(-e.w / 2, -e.h / 2 - 10, e.w, 4);
            ctx.fillStyle = hpPct > 0.3 ? '#ff6600' : '#ff0000';
            ctx.fillRect(-e.w / 2, -e.h / 2 - 10, e.w * hpPct, 4);

            ctx.fillStyle = '#ff4400';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', 0, -e.h / 2 - 14);
        } else {
            ctx.fillStyle = e.hit > 0 ? '#ff6666' : '#aa2222';
            ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);

            ctx.fillStyle = '#dd3333';
            ctx.fillRect(-e.w / 2 + 2, -e.h / 2 + 2, e.w - 4, 6);

            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-4, -e.h / 2 + 4, 3, 3);
            ctx.fillRect(2, -e.h / 2 + 4, 3, 3);

            const hpPct = Math.max(0, e.hp / e.maxHp);
            if (hpPct < 1) {
                ctx.fillStyle = '#333';
                ctx.fillRect(-e.w / 2, -e.h / 2 - 6, e.w, 3);
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-e.w / 2, -e.h / 2 - 6, e.w * hpPct, 3);
            }
        }

        ctx.restore();
    }
}

function drawProjectiles_render() {
    for (const p of projectiles) {
        const sx = p.x - cam.x;
        if (sx < -20 || sx > CFG.W + 20) continue;

        ctx.save();
        ctx.shadowColor = p.clr;
        ctx.shadowBlur = p.isGrenade ? 12 : 6;
        ctx.fillStyle = p.clr;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.sz, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const p of bossProjectiles) {
        const sx = p.x - cam.x;
        if (sx < -20 || sx > CFG.W + 20) continue;

        ctx.save();
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(sx, p.y, p.sz, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawParticles_render() {
    for (const p of particles) {
        const sx = p.x - cam.x;
        if (sx < -20 || sx > CFG.W + 20) continue;
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
    }
    ctx.globalAlpha = 1;
}

function drawUnlockProgress() {
    const pct = unlockProgress / CFG.DOOR_UNLOCK;
    const bar = document.getElementById('door-unlock-progress');
    if (bar) {
        bar.style.width = (pct * 100) + '%';
    }
}

function updateHUD() {
    const hpBarInner = document.getElementById('hp-bar-inner');
    const hpText = document.getElementById('hp-text');
    if (hpBarInner && hpText) {
        const hpPct = Math.max(0, player.hp / player.maxHp);
        hpBarInner.style.width = (hpPct * 100) + '%';
        hpText.textContent = Math.max(0, player.hp) + '/' + player.maxHp;

        if (hpPct > 0.5) hpBarInner.style.background = 'linear-gradient(90deg, #22cc44, #44ee66)';
        else if (hpPct > 0.25) hpBarInner.style.background = 'linear-gradient(90deg, #ccaa22, #eedd44)';
        else hpBarInner.style.background = 'linear-gradient(90deg, #ff2222, #ff6644)';
    }

    const segText = document.getElementById('segment-text');
    if (segText) segText.textContent = `第 ${curSeg + 1} 段 / ${CFG.SEGS}`;

    const timerText = document.getElementById('timer-text');
    if (timerText) {
        const elapsed = (performance.now() - gameStartTime) / 1000;
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
    }

    const enemyText = document.getElementById('enemy-text');
    if (enemyText) {
        const alive = enemies.filter(e => e.hp > 0).length;
        enemyText.textContent = `敌人: ${alive}`;
    }

    for (let i = 0; i < 2; i++) {
        const slotEl = document.getElementById(`slot-${i}`);
        if (!slotEl) continue;
        const weap = player.weapons[i];
        const iconEl = document.getElementById(`weapon-icon-${i}`);
        const nameEl = document.getElementById(`weapon-name-${i}`);
        const ammoEl = document.getElementById(`weapon-ammo-${i}`);
        const reloadEl = document.getElementById(`reload-${i}`);
        const reloadBarEl = document.getElementById(`reload-bar-${i}`);

        if (weap) {
            slotEl.classList.remove('empty');
            slotEl.classList.toggle('active', i === player.activeSlot);
            if (iconEl) {
                iconEl.style.background = weap.clr + '33';
                iconEl.textContent = weap.icon;
            }
            if (nameEl) nameEl.textContent = weap.name;
            if (ammoEl) {
                ammoEl.textContent = weap.reloading
                    ? '换弹中...' : `${weap.ammo}/${weap.mag}`;
            }
            if (reloadEl) {
                if (weap.reloading) {
                    reloadEl.classList.remove('hidden');
                    if (reloadBarEl) {
                        const pct = 1 - (weap.reloadTimer / weap.reload);
                        reloadBarEl.style.width = (pct * 100) + '%';
                    }
                } else {
                    reloadEl.classList.add('hidden');
                }
            }
        } else {
            slotEl.classList.add('empty');
            slotEl.classList.remove('active');
            if (iconEl) {
                iconEl.style.background = '';
                iconEl.textContent = '';
            }
            if (nameEl) nameEl.textContent = '空';
            if (ammoEl) ammoEl.textContent = '-';
        }
    }

    const promptEl = document.getElementById('interact-prompt');
    const promptText = document.getElementById('interact-text');
    if (promptEl && promptText) {
        if (nearDoor && !nearDoor.bossDead) {
            promptEl.classList.remove('hidden');
            promptText.textContent = '段守未击败，无法解锁！';
        } else if (nearCrate && !nearCrate.collected) {
            promptEl.classList.remove('hidden');
            promptText.textContent = `按 E 拾取 ${WEAPONS[nearCrate.weapon].name}`;
        } else if (nearDoor && !nearDoor.unlocked) {
            promptEl.classList.remove('hidden');
            promptText.textContent = '按 E 解锁安全门';
        } else {
            promptEl.classList.add('hidden');
        }
    }

    const unlockBar = document.getElementById('door-unlock-bar');
    if (unlockBar) {
        if (unlocking && nearDoor) {
            unlockBar.classList.remove('hidden');
        } else {
            unlockBar.classList.add('hidden');
        }
    }
}

function showReplaceModal(newWeap, crate) {
    ePressed = false;
    mouse.down = false;
    gameState = 'paused';
    document.getElementById('replace-modal').classList.remove('hidden');
    document.getElementById('new-weapon-name').textContent = newWeap.name + ' ' + newWeap.icon;

    const cleanup = () => {
        for (let j = 0; j < 2; j++) {
            document.getElementById(`replace-slot-${j}`).onclick = null;
        }
        document.getElementById('cancel-replace-btn').onclick = null;
    };

    for (let i = 0; i < 2; i++) {
        const w = player.weapons[i];
        const el = document.getElementById(`replace-slot-${i}`);
        const iconEl = document.getElementById(`replace-icon-${i}`);
        const nameEl = document.getElementById(`replace-name-${i}`);
        const ammoEl = document.getElementById(`replace-ammo-${i}`);

        if (w) {
            iconEl.style.background = w.clr + '33';
            iconEl.textContent = w.icon;
            nameEl.textContent = `槽${i + 1}: ${w.name}`;
            ammoEl.textContent = `${w.ammo}/${w.mag}`;
        } else {
            iconEl.style.background = '';
            iconEl.textContent = '';
            nameEl.textContent = `槽${i + 1}: 空`;
            ammoEl.textContent = '-';
        }

        el.onclick = () => {
            replaceWeapon(i, newWeap, crate);
            document.getElementById('replace-modal').classList.add('hidden');
            cleanup();
            gameState = 'playing';
        };
    }

    const cancelBtn = document.getElementById('cancel-replace-btn');
    cancelBtn.onclick = () => {
        document.getElementById('replace-modal').classList.add('hidden');
        cleanup();
        nearCrate = crate;
        gameState = 'playing';
    };
}

function showGameover() {
    clearSavedGame();
    document.getElementById('gameover-screen').classList.remove('hidden');
    const totalTime = segmentTimes.reduce((a, b) => a + b, 0);
    document.getElementById('gameover-stats').innerHTML =
        `到达: 第${curSeg + 1}段 | 击杀: ${totalEnemiesKilled} | 用时: ${totalTime.toFixed(1)}s`;
}

function showVictory() {
    clearSavedGame();
    document.getElementById('victory-screen').classList.remove('hidden');
    const totalTime = segmentTimes.reduce((a, b) => a + b, 0);
    let statsHtml = `<p>总用时: ${totalTime.toFixed(1)}秒</p>`;
    statsHtml += `<p>剩余血量: ${player.hp}</p>`;
    for (let i = 0; i < CFG.SEGS; i++) {
        statsHtml += `<p>第${i + 1}段: ${segmentTimes[i].toFixed(1)}s</p>`;
    }
    const maxWeap = Object.entries(weaponUseCount).sort((a, b) => b[1] - a[1])[0];
    statsHtml += `<p>武器偏好: ${maxWeap ? WEAPONS[maxWeap[0]].name : '无'}</p>`;
    document.getElementById('victory-stats').innerHTML = statsHtml;
    document.getElementById('victory-form').classList.remove('hidden');
}

async function submitScore() {
    const name = document.getElementById('player-name').value.trim() || 'Player';
    const totalTime = segmentTimes.reduce((a, b) => a + b, 0);
    const maxWeap = Object.entries(weaponUseCount).sort((a, b) => b[1] - a[1])[0];
    const pref = maxWeap ? WEAPONS[maxWeap[0]].name : '无';

    try {
        const resp = await fetch('/api/corridor/score/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: name,
                total_time: totalTime,
                segment_times: segmentTimes,
                weapon_preference: pref,
                final_hp: player.hp,
            }),
        });
        const data = await resp.json();
        if (data.code === 0) {
            document.getElementById('victory-form').classList.add('hidden');
            alert('成绩提交成功！');
        }
    } catch (e) {
        console.error('Submit failed:', e);
    }
}

async function loadLeaderboard() {
    try {
        const resp = await fetch('/api/corridor/leaderboard/get?limit=20');
        const data = await resp.json();
        if (data.code === 0 && data.data) {
            const tbody = document.getElementById('lb-body');
            tbody.innerHTML = '';
            data.data.forEach((row, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td>${row.player_name}</td>
                    <td>${row.total_time.toFixed(1)}s</td>
                    <td>${row.final_hp}</td>
                    <td>${row.weapon_preference || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Load leaderboard failed:', e);
    }
    document.getElementById('leaderboard-panel').classList.remove('hidden');
}

function serializeWeapons(weapons) {
    return weapons.map(w => {
        if (!w) return null;
        return {
            id: w.id,
            ammo: w.ammo,
            reloading: w.reloading,
            reloadTimer: w.reloadTimer,
            fireTimer: w.fireTimer,
        };
    });
}

function deserializeWeapons(saved) {
    if (!saved) return [null, null];
    return saved.map(sw => {
        if (!sw) return null;
        const w = makeWeaponInstance(sw.id);
        w.ammo = sw.ammo;
        w.reloading = sw.reloading;
        w.reloadTimer = sw.reloadTimer;
        w.fireTimer = sw.fireTimer;
        return w;
    });
}

function serializeGameState() {
    if (!player || gameState !== 'playing') return null;
    try {
        const state = {
            version: 3,
            savedAt: Date.now(),
            player: {
                x: player.x,
                y: player.y,
                hp: player.hp,
                maxHp: player.maxHp,
                weapons: serializeWeapons(player.weapons),
                activeSlot: player.activeSlot,
                maxReached: player.maxReached,
                facingRight: player.facingRight,
            },
            cam: { x: cam.x },
            enemies: enemies.filter(e => e.hp > 0).map(e => ({
                x: e.x, y: e.y,
                hp: e.hp, maxHp: e.maxHp,
                isBoss: e.isBoss,
                speed: e.speed,
                dmg: e.dmg,
                side: e.side,
                attackCD: e.attackCD,
            })),
            crates: crates.map(c => ({
                x: c.x, y: c.y,
                weapon: c.weapon,
                collected: c.collected,
                bobPhase: c.bobPhase,
            })),
            doors: doors.map(d => ({
                segIndex: d.segIndex,
                x: d.x,
                unlocked: d.unlocked,
                bossDead: d.bossDead,
            })),
            curSeg: curSeg,
            enemySpawned: { ...enemySpawned },
            bossSpawned: { ...bossSpawned },
            totalEnemiesKilled: totalEnemiesKilled,
            weaponUseCount: { ...weaponUseCount },
            segmentTimes: [...segmentTimes],
            elapsed: (performance.now() - gameStartTime) / 1000,
            segElapsed: (performance.now() - segStartTime) / 1000,
        };
        return state;
    } catch (e) {
        console.error('Serialize error:', e);
        return null;
    }
}

function deserializeGameState(saved) {
    if (!saved || saved.version !== 3) {
        console.warn('Incompatible save version (expected 3, got', saved ? saved.version : 'null', '), clearing');
        return false;
    }
    try {
        console.log('Deserializing game state...');
        console.log('  Player position:', saved.player.x, saved.player.y);
        console.log('  Current segment:', saved.curSeg);
        console.log('  Enemies alive:', saved.enemies.length);
        console.log('  Crates total:', saved.crates.length);
        console.log('  Doors total:', saved.doors.length);

        initGame();

        player.x = saved.player.x;
        player.y = saved.player.y;
        player.hp = saved.player.hp;
        player.maxHp = saved.player.maxHp;
        player.weapons = deserializeWeapons(saved.player.weapons);
        player.activeSlot = saved.player.activeSlot;
        player.maxReached = saved.player.maxReached;
        player.facingRight = saved.player.facingRight;
        player.invuln = 0;

        cam.x = Math.max(0, saved.cam.x);

        curSeg = saved.curSeg;
        enemySpawned = { ...saved.enemySpawned };
        bossSpawned = { ...saved.bossSpawned };
        totalEnemiesKilled = saved.totalEnemiesKilled;
        weaponUseCount = { ...saved.weaponUseCount };
        segmentTimes = [...saved.segmentTimes];

        crates = saved.crates.map(c => ({
            x: c.x, y: c.y,
            weapon: c.weapon,
            collected: c.collected,
            bobPhase: c.bobPhase || Math.random() * Math.PI * 2,
        }));

        doors = saved.doors.map(d => ({
            segIndex: d.segIndex,
            x: d.x,
            unlocked: d.unlocked,
            bossDead: d.bossDead,
        }));

        enemies = saved.enemies.map((se, i) => {
            const e = makeEnemy(se.x, se.y, se.isBoss);
            e.hp = se.hp;
            e.maxHp = se.maxHp;
            if (se.speed !== undefined) e.speed = se.speed;
            if (se.dmg !== undefined) e.dmg = se.dmg;
            if (se.side !== undefined) e.side = se.side;
            if (se.attackCD !== undefined) e.attackCD = se.attackCD;
            return e;
        });

        projectiles = [];
        bossProjectiles = [];
        particles = [];
        unlockProgress = 0;
        unlocking = false;
        nearDoor = null;
        nearCrate = null;
        shakeAmount = 0;
        saveTimer = 0;
        ePressed = false;
        mouse.down = false;

        const now = performance.now();
        gameStartTime = now - saved.elapsed * 1000;
        segStartTime = now - saved.segElapsed * 1000;

        console.log('✓ Game state deserialized successfully');
        console.log('  Player HP:', player.hp, '/', player.maxHp);
        console.log('  Weapons:', player.weapons.filter(w => w).map(w => w.name).join(', '));
        console.log('  Current segment:', curSeg + 1);
        console.log('  Total kills:', totalEnemiesKilled);

        return true;
    } catch (err) {
        console.error('✗ Failed to deserialize game state:', err);
        console.error(err.stack);
        return false;
    }
}

function saveGame() {
    try {
        const state = serializeGameState();
        if (state) {
            const json = JSON.stringify(state);
            localStorage.setItem(SAVE_KEY, json);
            console.log(`💾 Game saved: ${(json.length / 1024).toFixed(1)} KB, enemies: ${state.enemies.length}`);
            refreshContinueBtn();
        }
    } catch (e) {
        console.warn('Failed to save game:', e);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.log('No saved game found');
            return false;
        }
        const saved = JSON.parse(raw);
        console.log('Loading saved game (version', saved.version, ')...');
        if (deserializeGameState(saved)) {
            console.log('✓ Game loaded successfully');
            return true;
        }
        console.warn('Failed to load game, clearing save');
        clearSavedGame();
        return false;
    } catch (e) {
        console.warn('Failed to load game:', e);
        clearSavedGame();
        return false;
    }
}

function hasSavedGame() {
    return !!localStorage.getItem(SAVE_KEY);
}

function clearSavedGame() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {
        console.warn('Failed to clear save:', e);
    }
}

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    if (gameState === 'playing') {
        saveTimer += dt;
        if (saveTimer >= SAVE_INTERVAL) {
            saveTimer = 0;
            saveGame();
        }
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') e.preventDefault();
    keys[e.code] = true;

    if (gameState === 'playing') {
        if (e.code === 'Digit1') switchWeapon(0);
        if (e.code === 'Digit2') switchWeapon(1);
        if (e.code === 'KeyR') startReload();
        if (e.code === 'KeyE' && !e.repeat) ePressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function refreshContinueBtn() {
    const btn = document.getElementById('continue-btn');
    if (btn) {
        if (hasSavedGame()) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    }
}

window.addEventListener('beforeunload', () => {
    if (gameState === 'playing') {
        saveGame();
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    clearSavedGame();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    initGame();
    gameState = 'playing';
    saveTimer = SAVE_INTERVAL - 0.5;
});

document.getElementById('continue-btn').addEventListener('click', () => {
    if (loadGame()) {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        gameState = 'playing';
        saveTimer = SAVE_INTERVAL - 0.5;
    } else {
        alert('存档损坏或不存在，请开始新游戏');
        refreshContinueBtn();
    }
});

document.getElementById('retry-btn').addEventListener('click', () => {
    clearSavedGame();
    document.getElementById('gameover-screen').classList.add('hidden');
    initGame();
    gameState = 'playing';
    saveTimer = SAVE_INTERVAL - 0.5;
});

document.getElementById('play-again-btn').addEventListener('click', () => {
    clearSavedGame();
    document.getElementById('victory-screen').classList.add('hidden');
    initGame();
    gameState = 'playing';
    saveTimer = SAVE_INTERVAL - 0.5;
});

document.getElementById('submit-score-btn').addEventListener('click', submitScore);

document.getElementById('leaderboard-btn').addEventListener('click', loadLeaderboard);
document.getElementById('gameover-lb-btn').addEventListener('click', loadLeaderboard);
document.getElementById('victory-lb-btn').addEventListener('click', loadLeaderboard);

document.getElementById('close-lb-btn').addEventListener('click', () => {
    document.getElementById('leaderboard-panel').classList.add('hidden');
});

lastTime = performance.now();
refreshContinueBtn();
requestAnimationFrame(gameLoop);
