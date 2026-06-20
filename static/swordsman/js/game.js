const API_BASE = '/api';

const AREAS = [
    { name: '竹林', enemyType: 'ninja', bg: 'bamboo', bossName: '竹林隐者' },
    { name: '石桥', enemyType: 'stone', bg: 'bridge', bossName: '石桥守卫' },
    { name: '矿坑', enemyType: 'bug', bg: 'mine', bossName: '矿坑母虫' },
    { name: '沼泽', enemyType: 'frog', bg: 'swamp', bossName: '沼泽毒王' },
    { name: '魔殿', enemyType: 'shadow', bg: 'temple', bossName: '魔殿之主' }
];

const EQUIPMENT_DATA = [
    { id: 'bamboo_boots', name: '疾风靴', stat: 'agility', value: 5, desc: '敏捷+5' },
    { id: 'stone_armor', name: '磐石甲', stat: 'will', value: 8, desc: '意志+8' },
    { id: 'mine_sword', name: '矿锋剑', stat: 'strength', value: 10, desc: '力量+10' },
    { id: 'antidote_herb', name: '解毒草', stat: 'poison_immune', value: 1, desc: '免疫毒' },
    { id: 'shadow_cloak', name: '暗影斗篷', stat: 'dodge_bonus', value: 10, desc: '闪避+10%' }
];

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const game = {
    state: 'menu',
    playerName: '',
    currentArea: 0,
    currentWave: 0,
    waveKillsNeeded: 0,
    waveKills: 0,
    totalKills: 0,
    areasCleared: 0,
    bossActive: false,
    paused: false,
    entities: [],
    effects: [],
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    lastTime: 0,
    pendingSoulStones: 0,
    poisoned: false,
    poisonTimer: 0,
    poisonDmgTimer: 0
};

const player = {
    x: W / 2,
    y: H / 2,
    r: 18,
    baseStrength: 10,
    baseAgility: 10,
    baseWill: 10,
    soulStones: 0,
    equipment: [],
    hp: 100,
    maxHp: 100,
    speed: 6,
    attack: 20,
    dodge: 0.2,
    dodgeBonus: 0,
    poisonImmune: false,
    attackCd: 0,
    skillCd: { q: 0, e: 0, r: 0 },
    skillBaseCd: { q: 8, e: 5, r: 12 },
    charging: false,
    chargeTimer: 0,
    chargeTime: 1.5,
    facing: 1,
    animFrame: 0,
    attackAnim: 0,
    hitFlash: 0,
    invuln: 0
};

function calcPlayerStats() {
    let s = player.baseStrength;
    let a = player.baseAgility;
    let w = player.baseWill;
    let dBonus = 0;
    let pImmune = false;

    player.equipment.forEach(eqId => {
        const eq = EQUIPMENT_DATA.find(e => e.id === eqId);
        if (eq) {
            if (eq.stat === 'strength') s += eq.value;
            else if (eq.stat === 'agility') a += eq.value;
            else if (eq.stat === 'will') w += eq.value;
            else if (eq.stat === 'dodge_bonus') dBonus += eq.value;
            else if (eq.stat === 'poison_immune') pImmune = true;
        }
    });

    player.attack = s * 2;
    player.speed = 3 + a * 0.3;
    player.dodge = Math.min(0.4, a * 0.02);
    player.dodgeBonus = dBonus;
    player.maxHp = 50 + w * 5;
    player.poisonImmune = pImmune;

    const cdMult = Math.max(0.4, 1 - w * 0.02);
    player.skillCdMult = cdMult;

    if (player.hp > player.maxHp) player.hp = player.maxHp;
}

function updateUI() {
    calcPlayerStats();
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('hp-text').textContent = Math.max(0, Math.floor(player.hp)) + '/' + player.maxHp;
    document.getElementById('soul-count').textContent = player.soulStones;
    document.getElementById('stat-strength').textContent = player.baseStrength;
    document.getElementById('stat-agility').textContent = player.baseAgility;
    document.getElementById('stat-will').textContent = player.baseWill;
    document.getElementById('stat-attack').textContent = player.attack;
    document.getElementById('stat-dodge').textContent = Math.floor((player.dodge + player.dodgeBonus / 100) * 100) + '%';
    document.getElementById('stat-speed').textContent = player.speed.toFixed(1);
    document.getElementById('kills-count').textContent = game.totalKills;

    const area = AREAS[game.currentArea];
    document.getElementById('area-name').textContent = area.name;
    if (game.bossActive) {
        document.getElementById('wave-info').textContent = '区域Boss: ' + area.bossName;
    } else {
        document.getElementById('wave-info').textContent = '第 ' + (game.currentWave + 1) + ' / 3 波';
    }

    ['q', 'e', 'r'].forEach(k => {
        const cdEl = document.getElementById('cd-' + k);
        const slotEl = document.getElementById('skill-' + k);
        if (player.skillCd[k] > 0) {
            cdEl.classList.add('active');
            cdEl.textContent = Math.ceil(player.skillCd[k]);
            slotEl.classList.remove('ready');
        } else {
            cdEl.classList.remove('active');
            slotEl.classList.add('ready');
        }
    });

    const eqList = document.getElementById('equipment-list');
    if (player.equipment.length === 0) {
        eqList.innerHTML = '<div style="color:#999">无</div>';
    } else {
        eqList.innerHTML = player.equipment.map(eqId => {
            const eq = EQUIPMENT_DATA.find(e => e.id === eqId);
            return eq ? `<div class="eq-item">${eq.name}</div>` : '';
        }).join('');
    }
}

function showDamageText(x, y, dmg, type = '') {
    const el = document.createElement('div');
    el.className = 'dmg-text ' + type;
    el.textContent = dmg;
    const rect = canvas.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    el.style.left = (x * scaleX) + 'px';
    el.style.top = (y * scaleY - 20) + 'px';
    document.getElementById('damage-texts').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function spawnEnemy(type, x, y, isBoss = false) {
    const area = AREAS[game.currentArea];
    const base = {
        ninja: { hp: 30, speed: 2.5, dmg: 8, r: 14, color: '#2a2a2a', atkRange: 60, atkCd: 1.2, name: '忍者' },
        stone: { hp: 60, speed: 1.2, dmg: 15, r: 20, color: '#888', atkRange: 50, atkCd: 1.8, name: '石像兵' },
        bug: { hp: 25, speed: 3, dmg: 6, r: 12, color: '#8b4513', atkRange: 45, atkCd: 0.9, name: '矿虫' },
        frog: { hp: 40, speed: 1.8, dmg: 10, r: 16, color: '#2e5d2e', atkRange: 55, atkCd: 1.3, name: '毒蛙' },
        shadow: { hp: 50, speed: 2.8, dmg: 12, r: 15, color: '#1a0a2a', atkRange: 55, atkCd: 1.1, name: '暗灵' }
    }[type];

    const mult = isBoss ? 6 : (1 + game.currentArea * 0.25);
    const enemy = {
        type, isBoss,
        name: isBoss ? area.bossName : base.name,
        x, y,
        r: base.r * (isBoss ? 2.2 : 1),
        hp: base.hp * mult,
        maxHp: base.hp * mult,
        speed: base.speed * (isBoss ? 0.7 : 1),
        dmg: base.dmg * mult,
        color: base.color,
        atkRange: base.atkRange,
        atkCd: base.atkCd,
        atkTimer: 0,
        hitFlash: 0,
        bossAttackCount: 0,
        bossDodgeNext: false,
        bossSpawnCd: 5,
        poisoned: false,
        poisonTimer: 0,
        animFrame: 0
    };
    game.entities.push(enemy);
    return enemy;
}

function startWave() {
    game.entities = [];
    game.effects = [];
    game.bossActive = false;
    game.waveKills = 0;

    if (game.currentWave >= 3) {
        game.bossActive = true;
        const type = AREAS[game.currentArea].enemyType;
        spawnEnemy(type, W / 2, 80, true);
        game.waveKillsNeeded = 1;
    } else {
        const type = AREAS[game.currentArea].enemyType;
        const count = 3 + game.currentArea + game.currentWave;
        game.waveKillsNeeded = count;
        for (let i = 0; i < count; i++) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            if (side === 0) { x = rand(50, W - 50); y = 30; }
            else if (side === 1) { x = rand(50, W - 50); y = H - 30; }
            else if (side === 2) { x = 30; y = rand(100, H - 50); }
            else { x = W - 30; y = rand(100, H - 50); }
            spawnEnemy(type, x, y, false);
        }
    }
    updateUI();
}

function startArea(areaIdx) {
    game.currentArea = areaIdx;
    game.currentWave = 0;
    player.x = W / 2;
    player.y = H / 2;
    game.poisoned = false;
    game.poisonTimer = 0;
    player.hp = player.maxHp;
    startWave();
}

function damagePlayer(dmg, ignoreDodge = false) {
    if (player.invuln > 0) return;
    const totalDodge = player.dodge + player.dodgeBonus / 100;
    if (!ignoreDodge && Math.random() < totalDodge) {
        showDamageText(player.x, player.y, '闪避', 'heal');
        return;
    }
    player.hp -= dmg;
    player.hitFlash = 0.3;
    player.invuln = 0.3;
    showDamageText(player.x, player.y, Math.floor(dmg), 'player');
    if (player.hp <= 0) {
        player.hp = 0;
        handleDeath();
    }
    updateUI();
    saveGameState();
}

function damageEnemy(enemy, dmg) {
    if (enemy.isBoss && AREAS[game.currentArea].bg === 'bamboo' && enemy.bossDodgeNext) {
        enemy.bossDodgeNext = false;
        showDamageText(enemy.x, enemy.y, '闪避', 'heal');
        return;
    }

    enemy.hp -= dmg;
    enemy.hitFlash = 0.2;
    showDamageText(enemy.x, enemy.y, Math.floor(dmg), 'crit');

    if (enemy.isBoss && AREAS[game.currentArea].bg === 'temple') {
        if (Math.random() < 0.5) {
            const reflect = dmg * 0.25;
            setTimeout(() => {
                damagePlayer(reflect, true);
                showDamageText(player.x, player.y, Math.floor(reflect) + '反', 'player');
            }, 100);
        }
    }

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    const idx = game.entities.indexOf(enemy);
    if (idx >= 0) game.entities.splice(idx, 1);
    game.totalKills++;
    game.waveKills++;

    if (game.waveKills >= game.waveKillsNeeded) {
        if (game.bossActive) {
            onBossDefeated();
        } else {
            onWaveClear();
        }
    } else {
        saveGameState();
    }
    updateUI();
}

function onWaveClear() {
    game.pendingSoulStones++;
    player.soulStones++;
    showSoulStoneModal();
}

function onBossDefeated() {
    game.areasCleared++;
    const eq = EQUIPMENT_DATA[game.currentArea];
    if (!player.equipment.includes(eq.id)) {
        player.equipment.push(eq.id);
    }
    showEquipmentModal(eq);
}

function showSoulStoneModal() {
    game.paused = true;
    document.getElementById('soul-stone-modal').classList.add('active');
    saveGameState();
    saveProgress();
}

document.querySelectorAll('.soul-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const stat = btn.dataset.stat;
        if (stat === 'strength') {
            player.baseStrength += 3;
            player.baseAgility = Math.max(1, player.baseAgility - 1);
            player.baseWill = Math.max(1, player.baseWill - 1);
        } else if (stat === 'agility') {
            player.baseAgility += 3;
            player.baseStrength = Math.max(1, player.baseStrength - 1);
            player.baseWill = Math.max(1, player.baseWill - 1);
        } else if (stat === 'will') {
            player.baseWill += 3;
            player.baseStrength = Math.max(1, player.baseStrength - 1);
            player.baseAgility = Math.max(1, player.baseAgility - 1);
        }
        calcPlayerStats();
        updateUI();
        document.getElementById('soul-stone-modal').classList.remove('active');
        game.pendingSoulStones--;
        if (game.pendingSoulStones > 0) {
            setTimeout(showSoulStoneModal, 200);
        } else {
            game.paused = false;
            game.currentWave++;
            startWave();
        }
        saveGameState();
        saveProgress();
    });
});

function showEquipmentModal(eq) {
    game.paused = true;
    const rewardEl = document.getElementById('equipment-reward');
    rewardEl.innerHTML = `
        <div class="eq-reward-name">${eq.name}</div>
        <div class="eq-reward-desc">${eq.desc}</div>
    `;
    document.getElementById('equipment-modal').classList.add('active');
    calcPlayerStats();
    updateUI();
    saveGameState();
    saveProgress();
}

document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('equipment-modal').classList.remove('active');
    game.paused = false;
    if (game.currentArea >= AREAS.length - 1) {
        onVictory();
    } else {
        game.currentArea++;
        startArea(game.currentArea);
        saveGameState();
        saveProgress();
    }
});

function handleDeath() {
    game.paused = true;
    const desc = document.getElementById('death-desc');
    const reviveBtn = document.getElementById('revive-btn');
    if (player.soulStones > 0) {
        desc.textContent = '是否消耗1魂石复活（回复30HP）？';
        reviveBtn.disabled = false;
        reviveBtn.style.opacity = '1';
    } else {
        desc.textContent = '魂石不足，无法复活。从本区域重新开始。';
        reviveBtn.disabled = true;
        reviveBtn.style.opacity = '0.5';
    }
    document.getElementById('death-modal').classList.add('active');
    saveGameState();
    saveProgress();
}

document.getElementById('revive-btn').addEventListener('click', () => {
    if (player.soulStones <= 0) return;
    player.soulStones--;
    player.hp = Math.min(player.maxHp, 30);
    player.invuln = 2;
    document.getElementById('death-modal').classList.remove('active');
    game.paused = false;
    saveGameState();
    saveProgress();
    updateUI();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('death-modal').classList.remove('active');
    game.paused = false;
    startArea(game.currentArea);
    saveGameState();
    saveProgress();
});

function onVictory() {
    game.state = 'victory';
    game.paused = true;
    const kills = game.totalKills;
    const areas = game.areasCleared;
    const hp = Math.max(0, Math.floor(player.hp));
    const score = kills * 10 + areas * 50 + hp * 2;

    document.getElementById('victory-stats').innerHTML = `
        <div class="v-row"><span>击杀数:</span><span>${kills} × 10</span></div>
        <div class="v-row"><span>通关区域:</span><span>${areas} × 50</span></div>
        <div class="v-row"><span>剩余HP:</span><span>${hp} × 2</span></div>
        <div class="v-row total"><span>总得分:</span><span>${score}</span></div>
    `;
    document.getElementById('victory-modal').classList.add('active');
    submitScore(kills, areas, hp);
    saveProgress();
    saveGameState();
}

document.getElementById('victory-ok').addEventListener('click', () => {
    document.getElementById('victory-modal').classList.remove('active');
    showScreen('start-screen');
    game.state = 'menu';
    game.paused = false;
    clearGameState();
    document.getElementById('continue-btn_main').style.display = 'none';
});

function playerAttack() {
    if (player.attackCd > 0 || player.charging) return;
    player.attackCd = 0.4;
    player.attackAnim = 0.2;
    const range = 55;
    const angle = Math.atan2(game.mouse.y - player.y, game.mouse.x - player.x);
    game.entities.forEach(e => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d < range + e.r) {
            const ea = Math.atan2(dy, dx);
            let da = Math.abs(ea - angle);
            if (da > Math.PI) da = 2 * Math.PI - da;
            if (da < Math.PI / 2.5) {
                damageEnemy(e, player.attack);
            }
        }
    });
}

function skillWhirlwind() {
    if (player.skillCd.q > 0 || player.charging) return;
    player.skillCd.q = player.skillBaseCd.q * player.skillCdMult;
    const range = 80;
    const dmg = player.attack * 1.5 / 2;
    game.effects.push({ type: 'whirlwind', x: player.x, y: player.y, timer: 0.5, maxTimer: 0.5 });
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            game.entities.forEach(e => {
                if (dist(player, e) < range + e.r) {
                    damageEnemy(e, dmg);
                }
            });
        }, i * 100);
    }
    updateUI();
}

function skillShadowStep() {
    if (player.skillCd.e > 0 || player.charging) return;
    player.skillCd.e = player.skillBaseCd.e * player.skillCdMult;
    game.effects.push({ type: 'shadowStep', x: player.x, y: player.y, timer: 0.3, maxTimer: 0.3, toX: game.mouse.x, toY: game.mouse.y });
    player.x = clamp(game.mouse.x, player.r, W - player.r);
    player.y = clamp(game.mouse.y, player.r, H - player.r);
    player.invuln = 0.5;
    game.effects.push({ type: 'shadowStep', x: player.x, y: player.y, timer: 0.3, maxTimer: 0.3, appearing: true });
    updateUI();
}

function startChargeSlash() {
    if (player.skillCd.r > 0 || player.charging) return;
    player.charging = true;
    player.chargeTimer = 0;
}

function releaseChargeSlash() {
    if (!player.charging) return;
    const full = player.chargeTimer >= player.chargeTime;
    player.charging = false;
    if (full) {
        player.skillCd.r = player.skillBaseCd.r * player.skillCdMult;
        const dmg = player.attack * 4;
        const range = 100;
        const angle = Math.atan2(game.mouse.y - player.y, game.mouse.x - player.x);
        game.effects.push({ type: 'chargeSlash', x: player.x, y: player.y, angle, timer: 0.4, maxTimer: 0.4 });
        game.entities.forEach(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const d = Math.hypot(dx, dy);
            if (d < range + e.r) {
                const ea = Math.atan2(dy, dx);
                let da = Math.abs(ea - angle);
                if (da > Math.PI) da = 2 * Math.PI - da;
                if (da < Math.PI / 2) {
                    damageEnemy(e, dmg);
                }
            }
        });
    }
    updateUI();
}

function updateEnemies(dt) {
    game.entities.forEach(e => {
        e.animFrame += dt;
        if (e.hitFlash > 0) e.hitFlash -= dt;
        e.atkTimer -= dt;

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const d = Math.hypot(dx, dy);

        if (d > e.atkRange) {
            const spd = e.speed;
            e.x += (dx / d) * spd;
            e.y += (dy / d) * spd;
        } else if (e.atkTimer <= 0) {
            e.atkTimer = e.atkCd;
            if (e.isBoss && AREAS[game.currentArea].bg === 'bamboo') {
                e.bossAttackCount++;
                if (e.bossAttackCount >= 3) {
                    e.bossAttackCount = 0;
                    e.bossDodgeNext = true;
                }
            }
            damagePlayer(e.dmg);

            if (e.type === 'frog' || (e.isBoss && AREAS[game.currentArea].bg === 'swamp')) {
                if (!player.poisonImmune && Math.random() < (e.isBoss ? 1 : 0.4)) {
                    game.poisoned = true;
                    game.poisonTimer = 5;
                    game.poisonDmgTimer = 0;
                }
            }
        }

        if (e.isBoss && AREAS[game.currentArea].bg === 'bridge') {
            if (e.hp < e.maxHp * 0.5 && !e._summoned) {
                e._summoned = true;
                spawnEnemy('stone', e.x - 50, e.y, false);
                spawnEnemy('stone', e.x + 50, e.y, false);
            }
        }

        if (e.isBoss && AREAS[game.currentArea].bg === 'mine') {
            e.bossSpawnCd -= dt;
            if (e.bossSpawnCd <= 0) {
                e.bossSpawnCd = 5;
                const a = Math.random() * Math.PI * 2;
                spawnEnemy('bug', e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60, false);
            }
        }

        e.x = clamp(e.x, e.r, W - e.r);
        e.y = clamp(e.y, e.r, H - e.r);
    });
}

function drawBackground() {
    const area = AREAS[game.currentArea];
    ctx.save();

    if (area.bg === 'bamboo') {
        ctx.fillStyle = '#eef3ea';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(80,120,70,0.25)';
        ctx.lineWidth = 12;
        for (let i = 0; i < 15; i++) {
            const x = (i * 73 + 30) % W;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 8, H);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(80,120,70,0.15)';
        for (let i = 0; i < 40; i++) {
            const x = (i * 137) % W;
            const y = (i * 89) % H;
            ctx.beginPath();
            ctx.ellipse(x, y, 25, 8, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(60,60,60,0.08)';
        ctx.fillRect(0, H - 40, W, 40);
    } else if (area.bg === 'bridge') {
        ctx.fillStyle = '#e5e2dc';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#c8c4bc';
        for (let i = 0; i < 30; i++) {
            const x = (i * 97) % W;
            const y = 100 + ((i * 53) % (H - 150));
            ctx.fillRect(x, y, 30 + (i % 3) * 10, 20 + (i % 2) * 8);
        }
        ctx.strokeStyle = 'rgba(90,90,90,0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 35);
            ctx.lineTo(W, i * 35 + 10);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(200,200,200,0.6)';
        ctx.fillRect(0, 0, W, 30);
        ctx.fillRect(0, H - 30, W, 30);
    } else if (area.bg === 'mine') {
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#5a3d22';
        for (let i = 0; i < 25; i++) {
            const x = (i * 113) % W;
            const y = (i * 71) % H;
            ctx.beginPath();
            ctx.arc(x, y, 40 + (i % 4) * 15, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(200,160,80,0.35)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 149) % W;
            const y = (i * 97) % H;
            ctx.beginPath();
            ctx.arc(x, y, 6 + (i % 3) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,200,100,0.15)';
        for (let i = 0; i < 10; i++) {
            const x = (i * 181) % W;
            const y = (i * 127) % H;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (area.bg === 'swamp') {
        ctx.fillStyle = '#2a3d28';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(60,100,50,0.5)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 127) % W;
            const y = (i * 83) % H;
            ctx.beginPath();
            ctx.ellipse(x, y, 70, 35, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        const t = Date.now() / 3000;
        ctx.fillStyle = 'rgba(120,160,120,0.18)';
        for (let i = 0; i < 25; i++) {
            const x = ((i * 97) + t * 20) % W;
            const y = ((i * 67) + t * 15) % H;
            ctx.beginPath();
            ctx.arc(x, y, 20 + Math.sin(t + i) * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (area.bg === 'temple') {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(180,20,40,0.35)';
        ctx.lineWidth = 2;
        const t = Date.now() / 500;
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            const cx = W / 2 + Math.cos(i * 0.7 + t) * 200;
            const cy = H / 2 + Math.sin(i * 0.5 + t * 0.8) * 150;
            for (let j = 0; j < 6; j++) {
                const a = j * Math.PI / 3 + t * 0.3;
                const x = cx + Math.cos(a) * 40;
                const y = cy + Math.sin(a) * 40;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(120,10,30,0.1)';
        ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.hitFlash > 0 || player.invuln > 0) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
    }

    if (player.charging) {
        const p = Math.min(1, player.chargeTimer / player.chargeTime);
        ctx.fillStyle = `rgba(20,20,20,${0.3 + p * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, 0, 25 + p * 15, 0, Math.PI * 2);
        ctx.fill();
        if (p >= 1) {
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(0, -15, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 15);
    ctx.stroke();

    const bob = Math.sin(Date.now() / 200) * 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, 18 + bob);
    ctx.lineTo(0, 15);
    ctx.lineTo(10, 18 - bob);
    ctx.stroke();

    const atkAngle = Math.atan2(game.mouse.y - player.y, game.mouse.x - player.x);
    const swing = player.attackAnim > 0 ? Math.sin((1 - player.attackAnim / 0.2) * Math.PI) * 1.2 : 0;
    ctx.save();
    ctx.rotate(atkAngle + swing);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(30, -2);
    ctx.stroke();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(10, -1);
    ctx.lineTo(38, -3);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);

    if (e.hitFlash > 0) {
        ctx.globalAlpha = 0.6;
    }

    const bob = Math.sin(e.animFrame * 5 + e.x) * 2;

    if (e.isBoss) {
        ctx.fillStyle = e.color;
        ctx.globalAlpha = (e.hitFlash > 0 ? 0.6 : 0.3);
        ctx.beginPath();
        ctx.arc(0, bob, e.r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    if (e.type === 'ninja') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, bob - 8, e.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-e.r * 0.5, bob - 4, e.r, e.r * 1.1);
        ctx.fillStyle = '#c00';
        ctx.fillRect(-e.r * 0.4, bob - 6, e.r * 0.8, 2);
    } else if (e.type === 'stone') {
        ctx.fillStyle = e.color;
        ctx.fillRect(-e.r * 0.7, bob - e.r * 0.8, e.r * 1.4, e.r * 1.6);
        ctx.fillStyle = '#555';
        ctx.fillRect(-e.r * 0.4, bob - e.r * 0.5, 4, 4);
        ctx.fillRect(e.r * 0.2, bob - e.r * 0.5, 4, 4);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-e.r * 0.3, bob);
        ctx.lineTo(e.r * 0.3, bob + 2);
        ctx.stroke();
    } else if (e.type === 'bug') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.ellipse(0, bob, e.r, e.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5c2e0a';
        ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 5, bob - e.r * 0.3);
            ctx.lineTo(i * 5 - 4, bob - e.r);
            ctx.moveTo(i * 5, bob + e.r * 0.3);
            ctx.lineTo(i * 5 - 4, bob + e.r);
            ctx.stroke();
        }
    } else if (e.type === 'frog') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.ellipse(0, bob + 3, e.r, e.r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a8a4a';
        ctx.beginPath();
        ctx.arc(-e.r * 0.4, bob - e.r * 0.3, e.r * 0.3, 0, Math.PI * 2);
        ctx.arc(e.r * 0.4, bob - e.r * 0.3, e.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-e.r * 0.4, bob - e.r * 0.3, e.r * 0.12, 0, Math.PI * 2);
        ctx.arc(e.r * 0.4, bob - e.r * 0.3, e.r * 0.12, 0, Math.PI * 2);
        ctx.fill();
    } else if (e.type === 'shadow') {
        ctx.fillStyle = e.color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(0, bob, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#600030';
        ctx.beginPath();
        ctx.arc(-5, bob - 3, 3, 0, Math.PI * 2);
        ctx.arc(5, bob - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    if (e.isBoss) {
        const hpPct = e.hp / e.maxHp;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#333';
        ctx.fillRect(-e.r, -e.r - 15, e.r * 2, 6);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-e.r, -e.r - 15, e.r * 2 * hpPct, 6);
        ctx.fillStyle = '#f5f0e8';
        ctx.font = '12px KaiTi';
        ctx.textAlign = 'center';
        ctx.fillText(e.name, 0, -e.r - 20);
    }

    ctx.restore();
}

function drawEffects(dt) {
    for (let i = game.effects.length - 1; i >= 0; i--) {
        const ef = game.effects[i];
        ef.timer -= dt;
        if (ef.timer <= 0) {
            game.effects.splice(i, 1);
            continue;
        }
        const p = 1 - ef.timer / ef.maxTimer;

        if (ef.type === 'whirlwind') {
            ctx.save();
            ctx.translate(ef.x, ef.y);
            ctx.rotate(p * Math.PI * 4);
            ctx.strokeStyle = `rgba(20,20,20,${1 - p})`;
            ctx.lineWidth = 3;
            for (let j = 0; j < 6; j++) {
                const a = j * Math.PI / 3;
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.quadraticCurveTo(40, 30, 75, 5);
                ctx.stroke();
                ctx.rotate(Math.PI / 3);
            }
            ctx.restore();
        } else if (ef.type === 'shadowStep') {
            ctx.save();
            ctx.globalAlpha = 1 - p;
            ctx.fillStyle = ef.appearing ? '#1a1a1a' : '#1a1a1a';
            for (let j = 0; j < 8; j++) {
                const a = j * Math.PI / 4 + p * 4;
                const r = 5 + p * 25;
                ctx.beginPath();
                ctx.arc(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r, 4 * (1 - p), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (ef.type === 'chargeSlash') {
            ctx.save();
            ctx.translate(ef.x, ef.y);
            ctx.rotate(ef.angle);
            ctx.globalAlpha = 1 - p;
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 10 * (1 - p) + 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(10, -20);
            ctx.quadraticCurveTo(60, 0, 100, 0);
            ctx.quadraticCurveTo(60, 0, 10, 20);
            ctx.stroke();
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }
}

function update(dt) {
    if (game.paused || game.state !== 'playing') return;

    if (player.hitFlash > 0) player.hitFlash -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.attackCd > 0) player.attackCd -= dt;
    if (player.attackAnim > 0) player.attackAnim -= dt;
    ['q', 'e', 'r'].forEach(k => {
        if (player.skillCd[k] > 0) player.skillCd[k] -= dt;
    });

    if (player.charging) {
        player.chargeTimer = Math.min(player.chargeTime, player.chargeTimer + dt);
    }

    if (game.poisoned) {
        game.poisonTimer -= dt;
        game.poisonDmgTimer -= dt;
        if (game.poisonDmgTimer <= 0) {
            game.poisonDmgTimer = 1;
            damagePlayer(3, true);
        }
        if (game.poisonTimer <= 0) game.poisoned = false;
    }

    let mx = 0, my = 0;
    if (!player.charging) {
        if (game.keys['w'] || game.keys['arrowup']) my -= 1;
        if (game.keys['s'] || game.keys['arrowdown']) my += 1;
        if (game.keys['a'] || game.keys['arrowleft']) mx -= 1;
        if (game.keys['d'] || game.keys['arrowright']) mx += 1;
        const len = Math.hypot(mx, my);
        if (len > 0) {
            mx /= len; my /= len;
            player.x += mx * player.speed;
            player.y += my * player.speed;
        }
    }
    player.x = clamp(player.x, player.r, W - player.r);
    player.y = clamp(player.y, player.r, H - player.r);

    if (game.mouse.down && !player.charging) {
        playerAttack();
    }

    updateEnemies(dt);
    updateUI();
}

function render(dt) {
    drawBackground();
    drawEffects(dt);
    game.entities.forEach(drawEnemy);
    drawPlayer();

    if (game.poisoned) {
        ctx.fillStyle = 'rgba(107, 35, 142, 0.15)';
        ctx.fillRect(0, 0, W, H);
    }
}

function loop(t) {
    const dt = Math.min(0.05, (t - game.lastTime) / 1000 || 0);
    game.lastTime = t;
    update(dt);
    render(dt);
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    game.keys[k] = true;
    if (k === 'q') skillWhirlwind();
    if (k === 'e') skillShadowStep();
    if (k === 'r') startChargeSlash();
});
window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    game.keys[k] = false;
    if (k === 'r') releaseChargeSlash();
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = (e.clientX - rect.left) * (W / rect.width);
    game.mouse.y = (e.clientY - rect.top) * (H / rect.height);
});
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) game.mouse.down = true;
});
canvas.addEventListener('mouseup', e => {
    if (e.button === 0) game.mouse.down = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

async function apiCall(url, method = 'GET', body = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(API_BASE + url, opts);
        return await res.json();
    } catch (e) {
        return { code: -1, message: e.message, data: null };
    }
}

async function loadPlayer(name) {
    const res = await apiCall('/swordsman/player/get?player_name=' + encodeURIComponent(name));
    if (res.code === 0 && res.data) {
        const d = res.data;
        player.baseStrength = d.strength;
        player.baseAgility = d.agility;
        player.baseWill = d.will;
        player.soulStones = d.soul_stones;
        player.equipment = d.equipment || [];
        game.currentArea = d.current_area || 0;
        game.currentWave = d.current_wave || 0;
        game.totalKills = d.total_kills || 0;
        game.areasCleared = d.areas_cleared || 0;
        calcPlayerStats();
        if (d.hp && d.hp > 0) {
            player.hp = Math.min(d.hp, player.maxHp);
        } else {
            player.hp = player.maxHp;
        }
        return true;
    }
    return false;
}

async function saveProgress() {
    await apiCall('/swordsman/player/save', 'POST', {
        player_name: game.playerName,
        strength: player.baseStrength,
        agility: player.baseAgility,
        will: player.baseWill,
        soul_stones: player.soulStones,
        current_area: game.currentArea,
        current_wave: game.currentWave,
        hp: Math.max(0, Math.floor(player.hp)),
        areas_cleared: game.areasCleared,
        equipment: player.equipment,
        total_kills: game.totalKills
    });
}

async function submitScore(kills, areas, hp) {
    await apiCall('/swordsman/score/submit', 'POST', {
        player_name: game.playerName,
        kills, areas_cleared: areas, remaining_hp: hp
    });
}

async function loadLeaderboard() {
    const res = await apiCall('/swordsman/leaderboard/gettop?limit=20');
    const list = document.getElementById('leaderboard-list');
    if (res.code !== 0 || !res.data || res.data.length === 0) {
        list.innerHTML = '<div class="lb-item" style="justify-content:center;color:#999">暂无记录</div>';
        return;
    }
    list.innerHTML = res.data.map((item, idx) => `
        <div class="lb-item">
            <div class="lb-rank">${idx + 1}</div>
            <div class="lb-name">${item.player_name}</div>
            <div style="flex:1;text-align:center;font-size:14px;color:#666">
                击杀${item.kills} · 通关${item.areas_cleared}区
            </div>
            <div class="lb-score">${item.score}</div>
        </div>
    `).join('');
}

document.getElementById('start-btn').addEventListener('click', () => {
    const name = document.getElementById('player-name-input').value.trim();
    if (!name) {
        alert('请输入剑客名号');
        return;
    }
    game.playerName = name;
    game.state = 'playing';

    clearGameState();

    game.totalKills = 0;
    game.areasCleared = 0;
    game.currentArea = 0;
    game.currentWave = 0;
    game.bossActive = false;
    game.poisoned = false;
    game.poisonTimer = 0;
    game.waveKills = 0;
    game.waveKillsNeeded = 0;
    game.pendingSoulStones = 0;
    game.entities = [];
    game.effects = [];

    player.baseStrength = 10;
    player.baseAgility = 10;
    player.baseWill = 10;
    player.soulStones = 0;
    player.equipment = [];
    calcPlayerStats();
    player.hp = player.maxHp;
    player.x = W / 2;
    player.y = H / 2;
    player.skillCd = { q: 0, e: 0, r: 0 };
    player.charging = false;
    player.chargeTimer = 0;
    player.hitFlash = 0;
    player.invuln = 0;
    player.attackCd = 0;
    player.attackAnim = 0;

    loadPlayer(name).then(hasData => {
        if (hasData && (game.currentArea > 0 || game.currentWave > 0 || game.totalKills > 0)) {
            startWave();
        } else {
            startArea(0);
        }
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('continue-btn_main').style.display = 'none';
        updateUI();
        saveGameState();
    });
});

document.getElementById('leaderboard-btn').addEventListener('click', () => {
    loadLeaderboard();
    showScreen('leaderboard-screen');
});

document.getElementById('back-from-leaderboard').addEventListener('click', () => {
    showScreen('start-screen');
});

document.getElementById('continue-btn_main').addEventListener('click', () => {
    const state = loadGameState();
    if (state) {
        resumeGame(state);
    } else {
        alert('存档不存在或已过期');
        document.getElementById('continue-btn_main').style.display = 'none';
    }
});

function saveGameState() {
    let activeModal = null;
    const modals = ['soul-stone-modal', 'equipment-modal', 'death-modal', 'victory-modal'];
    for (const id of modals) {
        if (document.getElementById(id).classList.contains('active')) {
            activeModal = id;
            break;
        }
    }

    const state = {
        playerName: game.playerName,
        currentArea: game.currentArea,
        currentWave: game.currentWave,
        totalKills: game.totalKills,
        areasCleared: game.areasCleared,
        bossActive: game.bossActive,
        poisoned: game.poisoned,
        poisonTimer: game.poisonTimer,
        waveKills: game.waveKills,
        waveKillsNeeded: game.waveKillsNeeded,
        paused: game.paused,
        activeModal: activeModal,
        scoreSubmitted: game.state === 'victory',
        player: {
            x: player.x,
            y: player.y,
            hp: player.hp,
            baseStrength: player.baseStrength,
            baseAgility: player.baseAgility,
            baseWill: player.baseWill,
            soulStones: player.soulStones,
            equipment: [...player.equipment],
            charging: false,
            chargeTimer: 0
        },
        entities: game.entities.map(e => ({
            type: e.type,
            isBoss: e.isBoss,
            x: e.x,
            y: e.y,
            hp: e.hp,
            maxHp: e.maxHp,
            bossAttackCount: e.bossAttackCount || 0,
            bossDodgeNext: e.bossDodgeNext || false,
            bossSpawnCd: e.bossSpawnCd || 5,
            _summoned: e._summoned || false
        })),
        timestamp: Date.now()
    };
    try {
        localStorage.setItem('swordsman_save', JSON.stringify(state));
    } catch (e) {}
}

function loadGameState() {
    try {
        const raw = localStorage.getItem('swordsman_save');
        if (!raw) return null;
        const state = JSON.parse(raw);
        if (!state.playerName || state.currentArea === undefined) return null;
        if (Date.now() - state.timestamp > 86400000) return null;
        return state;
    } catch (e) {
        return null;
    }
}

function clearGameState() {
    try {
        localStorage.removeItem('swordsman_save');
    } catch (e) {}
}

function resumeGame(state) {
    game.playerName = state.playerName;
    game.currentArea = state.currentArea;
    game.currentWave = state.currentWave;
    game.totalKills = state.totalKills;
    game.areasCleared = state.areasCleared;
    game.bossActive = state.bossActive;
    game.poisoned = state.poisoned;
    game.poisonTimer = state.poisonTimer;
    game.waveKills = state.waveKills || 0;
    game.waveKillsNeeded = state.waveKillsNeeded;
    game.state = 'playing';
    game.paused = false;
    game.pendingSoulStones = 0;

    const p = state.player;
    player.x = p.x;
    player.y = p.y;
    player.hp = p.hp;
    player.baseStrength = p.baseStrength;
    player.baseAgility = p.baseAgility;
    player.baseWill = p.baseWill;
    player.soulStones = p.soulStones;
    player.equipment = p.equipment || [];
    player.charging = false;
    player.chargeTimer = 0;
    player.hitFlash = 0;
    player.invuln = 0;
    player.attackCd = 0;
    player.attackAnim = 0;
    player.skillCd = { q: 0, e: 0, r: 0 };

    calcPlayerStats();
    if (player.hp > player.maxHp) player.hp = player.maxHp;

    game.entities = [];
    game.effects = [];

    if (state.entities && state.entities.length > 0) {
        const area = AREAS[game.currentArea];
        state.entities.forEach(se => {
            const base = {
                ninja: { hp: 30, speed: 2.5, dmg: 8, r: 14, color: '#2a2a2a', atkRange: 60, atkCd: 1.2, name: '忍者' },
                stone: { hp: 60, speed: 1.2, dmg: 15, r: 20, color: '#888', atkRange: 50, atkCd: 1.8, name: '石像兵' },
                bug: { hp: 25, speed: 3, dmg: 6, r: 12, color: '#8b4513', atkRange: 45, atkCd: 0.9, name: '矿虫' },
                frog: { hp: 40, speed: 1.8, dmg: 10, r: 16, color: '#2e5d2e', atkRange: 55, atkCd: 1.3, name: '毒蛙' },
                shadow: { hp: 50, speed: 2.8, dmg: 12, r: 15, color: '#1a0a2a', atkRange: 55, atkCd: 1.1, name: '暗灵' }
            }[se.type];

            const mult = se.isBoss ? 6 : (1 + game.currentArea * 0.25);
            game.entities.push({
                type: se.type,
                isBoss: se.isBoss,
                name: se.isBoss ? area.bossName : base.name,
                x: se.x,
                y: se.y,
                r: base.r * (se.isBoss ? 2.2 : 1),
                hp: se.hp,
                maxHp: se.maxHp,
                speed: base.speed * (se.isBoss ? 0.7 : 1),
                dmg: base.dmg * mult,
                color: base.color,
                atkRange: base.atkRange,
                atkCd: base.atkCd,
                atkTimer: 0,
                hitFlash: 0,
                bossAttackCount: se.bossAttackCount || 0,
                bossDodgeNext: se.bossDodgeNext || false,
                bossSpawnCd: se.bossSpawnCd || 5,
                _summoned: se._summoned || false,
                poisoned: false,
                poisonTimer: 0,
                animFrame: 0
            });
        });
    } else {
        if (game.bossActive) {
            const type = AREAS[game.currentArea].enemyType;
            spawnEnemy(type, W / 2, 80, true);
            game.waveKillsNeeded = 1;
        } else {
            const type = AREAS[game.currentArea].enemyType;
            const count = 3 + game.currentArea + game.currentWave;
            game.waveKillsNeeded = count;
            for (let i = 0; i < count; i++) {
                const side = Math.floor(Math.random() * 4);
                let x, y;
                if (side === 0) { x = rand(50, W - 50); y = 30; }
                else if (side === 1) { x = rand(50, W - 50); y = H - 30; }
                else if (side === 2) { x = 30; y = rand(100, H - 50); }
                else { x = W - 30; y = rand(100, H - 50); }
                spawnEnemy(type, x, y, false);
            }
        }
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('player-name-input').value = game.playerName;
    updateUI();

    if (state.activeModal) {
        game.paused = true;
        document.getElementById(state.activeModal).classList.add('active');

        if (state.activeModal === 'death-modal') {
            const desc = document.getElementById('death-desc');
            const reviveBtn = document.getElementById('revive-btn');
            if (player.soulStones > 0) {
                desc.textContent = '是否消耗1魂石复活（回复30HP）？';
                reviveBtn.disabled = false;
                reviveBtn.style.opacity = '1';
            } else {
                desc.textContent = '魂石不足，无法复活。从本区域重新开始。';
                reviveBtn.disabled = true;
                reviveBtn.style.opacity = '0.5';
            }
        }

        if (state.activeModal === 'equipment-modal') {
            const eq = EQUIPMENT_DATA[game.currentArea];
            if (eq) {
                const rewardEl = document.getElementById('equipment-reward');
                rewardEl.innerHTML = `
                    <div class="eq-reward-name">${eq.name}</div>
                    <div class="eq-reward-desc">${eq.desc}</div>
                `;
            }
        }

        if (state.activeModal === 'victory-modal') {
            const kills = game.totalKills;
            const areas = game.areasCleared;
            const hp = Math.max(0, Math.floor(player.hp));
            const score = kills * 10 + areas * 50 + hp * 2;
            document.getElementById('victory-stats').innerHTML = `
                <div class="v-row"><span>击杀数:</span><span>${kills} × 10</span></div>
                <div class="v-row"><span>通关区域:</span><span>${areas} × 50</span></div>
                <div class="v-row"><span>剩余HP:</span><span>${hp} × 2</span></div>
                <div class="v-row total"><span>总得分:</span><span>${score}</span></div>
            `;
            game.state = 'victory';
        }
    }
}

let autoSaveTimer = 0;
const AUTO_SAVE_INTERVAL = 10;

const _origUpdate = update;
update = function(dt) {
    _origUpdate(dt);
    if (game.state === 'playing' && !game.paused) {
        autoSaveTimer += dt;
        if (autoSaveTimer >= AUTO_SAVE_INTERVAL) {
            autoSaveTimer = 0;
            saveGameState();
            saveProgress();
        }
    }
};

window.addEventListener('beforeunload', () => {
    if (game.state === 'playing') {
        saveGameState();
        saveProgress();
    }
});

const savedState = loadGameState();
if (savedState) {
    document.getElementById('continue-btn_main').style.display = 'inline-block';
    document.getElementById('player-name-input').value = savedState.playerName;
    resumeGame(savedState);
}

calcPlayerStats();
updateUI();
requestAnimationFrame(loop);
