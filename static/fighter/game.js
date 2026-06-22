const API_BASE = '/api';
const PLAYER_MAX_HP = 100;
const PLAYER_MAX_ENERGY = 100;
const BATTLE_TIMEOUT = 60;

const ACTIONS_INFO = {
    light_attack: {
        name: '轻攻',
        description: '快速攻击，伤害较低，恢复5点能量',
        energyCost: -5,
        damage: 8,
        cooldown: 400,
        animationClass: 'attacking'
    },
    heavy_attack: {
        name: '重攻',
        description: '强力攻击，高伤害，消耗15点能量',
        energyCost: 15,
        damage: 20,
        cooldown: 800,
        animationClass: 'heavy-attacking'
    },
    defend: {
        name: '防御',
        description: '进入防御姿态，受到伤害减半',
        energyCost: 0,
        damage: 0,
        cooldown: 600,
        animationClass: 'defending',
        duration: 1000
    },
    dodge: {
        name: '闪避',
        description: '快速闪避，有几率完全躲避攻击',
        energyCost: 10,
        damage: 0,
        cooldown: 700,
        animationClass: 'dodging',
        duration: 500,
        dodgeChance: 0.8
    },
    special_attack: {
        name: '特殊技',
        description: '强力特殊攻击，消耗50点能量',
        energyCost: 50,
        damage: 35,
        cooldown: 1200,
        animationClass: 'heavy-attacking'
    },
    combo: {
        name: '连招',
        description: '轻攻→重攻→特殊技三连击，消耗60点能量',
        energyCost: 60,
        damage: 45,
        cooldown: 1800,
        animationClass: 'heavy-attacking',
        hits: 3
    },
    super_armor: {
        name: '霸体技',
        description: '3秒内不受打断但伤害减半，消耗30点能量',
        energyCost: 30,
        damage: 0,
        cooldown: 1500,
        animationClass: 'super-armor',
        duration: 3000
    }
};

const UNLOCK_SEQUENCE = ['heavy_attack', 'dodge', 'special_attack', 'combo', 'super_armor'];

const FLOOR_CONFIG = {
    1: { name: '初阶武者', actions: ['light_attack', 'defend'], speedMultiplier: 1.0 },
    2: { name: '熟练武者', actions: ['light_attack', 'defend'], speedMultiplier: 1.0 },
    3: { name: '刚猛武者', actions: ['light_attack', 'defend', 'heavy_attack'], speedMultiplier: 1.0 },
    4: { name: '铁壁武者', actions: ['light_attack', 'defend', 'heavy_attack'], speedMultiplier: 1.05 },
    5: { name: '灵巧武者', actions: ['light_attack', 'defend', 'heavy_attack', 'dodge'], speedMultiplier: 1.05 },
    6: { name: '敏捷武者', actions: ['light_attack', 'defend', 'heavy_attack', 'dodge'], speedMultiplier: 1.1 },
    7: { name: '连招武者', actions: ['light_attack', 'defend', 'heavy_attack', 'dodge', 'combo'], speedMultiplier: 1.1 },
    8: { name: '霸体武者', actions: ['light_attack', 'defend', 'heavy_attack', 'dodge', 'combo', 'super_armor'], speedMultiplier: 1.15 },
    9: { name: '坚韧武者', actions: ['light_attack', 'defend', 'heavy_attack', 'dodge', 'combo', 'super_armor'], speedMultiplier: 1.15 },
    10: { name: '至尊武者', actions: ['light_attack', 'defend', 'heavy_attack', 'dodge', 'special_attack', 'combo', 'super_armor'], speedMultiplier: 1.2 }
};

const GameState = {
    playerName: 'player',
    currentFloor: 1,
    maxFloor: 1,
    unlockedActions: ['light_attack', 'defend'],
    totalBattles: 0,
    totalWins: 0,
    playerHP: PLAYER_MAX_HP,
    playerEnergy: 0,
    playerDefending: false,
    playerDodging: false,
    playerSuperArmor: false,
    playerSuperArmorEnd: 0,
    playerActionCooldowns: {},
    enemyHP: 65,
    enemyMaxHP: 65,
    enemyActions: ['light_attack', 'defend'],
    enemySpeedMultiplier: 1.0,
    enemyDefending: false,
    enemyDodging: false,
    enemySuperArmor: false,
    enemySuperArmorEnd: 0,
    enemyActionCooldowns: {},
    battleActive: false,
    battleTimer: BATTLE_TIMEOUT,
    battleInterval: null,
    enemyAIInterval: null,
    battleStartTime: 0,
    actionsUsed: []
};

let $ = (id) => document.getElementById(id);

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(screenId).classList.add('active');
}

async function apiGet(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;
    const res = await fetch(url);
    return await res.json();
}

async function apiPost(path, body = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return await res.json();
}

function savePlayerName(name) {
    try {
        localStorage.setItem('fighter_player_name', name);
    } catch (e) {}
}

function loadSavedPlayerName() {
    try {
        return localStorage.getItem('fighter_player_name') || '';
    } catch (e) {
        return '';
    }
}

function getEnemyMaxHP(floor) {
    return 50 + floor * 15;
}

function loadPlayerProgress() {
    return apiGet('/game/progress/get', { player_name: GameState.playerName });
}

function updateFloorDisplay() {
    $('player-name-display').textContent = GameState.playerName;
    $('max-floor-display').textContent = GameState.maxFloor;
    $('win-count-display').textContent = GameState.totalWins;
    renderFloorStairs();
    renderUnlockedActions();
}

function renderFloorStairs() {
    const container = $('floor-stairs');
    container.innerHTML = '';
    
    for (let i = 10; i >= 1; i--) {
        const config = FLOOR_CONFIG[i];
        const step = document.createElement('div');
        step.className = 'floor-step';
        
        const canPlay = i <= GameState.maxFloor;
        const isCurrent = i === GameState.currentFloor;
        
        if (!canPlay) step.classList.add('locked');
        if (isCurrent) step.classList.add('current');
        else if (canPlay) step.classList.add('available');
        
        const hp = getEnemyMaxHP(i);
        const actionNames = config.actions.map(a => ACTIONS_INFO[a]?.name || a).join('、');
        
        step.innerHTML = `
            <span class="step-num">${i}</span>
            <div class="step-info">
                <div class="step-title">${config.name}</div>
                <div class="step-desc">技能: ${actionNames}</div>
            </div>
            <span class="step-hp">HP: ${hp}</span>
        `;
        
        if (canPlay) {
            step.addEventListener('click', () => startBattle(i));
        }
        
        container.appendChild(step);
    }
}

function renderUnlockedActions() {
    const container = $('unlocked-actions');
    container.innerHTML = '';
    
    const allActions = ['light_attack', 'defend', 'heavy_attack', 'dodge', 'special_attack', 'combo', 'super_armor'];
    
    allActions.forEach(action => {
        const info = ACTIONS_INFO[action];
        const item = document.createElement('div');
        item.className = 'action-item';
        if (!GameState.unlockedActions.includes(action)) {
            item.classList.add('locked');
        }
        item.innerHTML = `${info.name}`;
        container.appendChild(item);
    });
}

function updateActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        const action = btn.dataset.action;
        const unlocked = GameState.unlockedActions.includes(action);
        const cooldownEnd = GameState.playerActionCooldowns[action] || 0;
        const onCooldown = Date.now() < cooldownEnd;
        const info = ACTIONS_INFO[action];
        const hasEnergy = info.energyCost <= 0 || GameState.playerEnergy >= info.energyCost;
        
        if (!unlocked) {
            btn.classList.add('locked');
            btn.disabled = true;
        } else {
            btn.classList.remove('locked');
            btn.disabled = onCooldown || !hasEnergy || !GameState.battleActive;
        }
    });
}

function updateHPDisplay() {
    const playerPct = (GameState.playerHP / PLAYER_MAX_HP) * 100;
    const enemyPct = (GameState.enemyHP / GameState.enemyMaxHP) * 100;
    
    $('player-hp-fill').style.width = `${Math.max(0, playerPct)}%`;
    $('player-hp-text').textContent = `${Math.max(0, GameState.playerHP)}/${PLAYER_MAX_HP}`;
    
    $('enemy-hp-fill').style.width = `${Math.max(0, enemyPct)}%`;
    $('enemy-hp-text').textContent = `${Math.max(0, GameState.enemyHP)}/${GameState.enemyMaxHP}`;
}

function updateEnergyDisplay() {
    const pct = (GameState.playerEnergy / PLAYER_MAX_ENERGY) * 100;
    $('player-energy-fill').style.width = `${Math.max(0, pct)}%`;
    $('player-energy-text').textContent = `${Math.max(0, Math.min(PLAYER_MAX_ENERGY, GameState.playerEnergy))}/${PLAYER_MAX_ENERGY}`;
}

function updateStatusDisplay() {
    const playerStatus = [];
    const enemyStatus = [];
    
    if (GameState.playerDefending) playerStatus.push('🛡️ 防御中');
    if (GameState.playerDodging) playerStatus.push('💨 闪避中');
    if (GameState.playerSuperArmor) playerStatus.push('⚡ 霸体');
    
    if (GameState.enemyDefending) enemyStatus.push('🛡️ 防御中');
    if (GameState.enemyDodging) enemyStatus.push('💨 闪避中');
    if (GameState.enemySuperArmor) enemyStatus.push('⚡ 霸体');
    
    $('player-status').textContent = playerStatus.join(' ');
    $('enemy-status').textContent = enemyStatus.join(' ');
    
    const playerChar = $('player-character');
    const enemyChar = $('enemy-character');
    
    playerChar.classList.toggle('super-armor', GameState.playerSuperArmor);
    enemyChar.classList.toggle('super-armor', GameState.enemySuperArmor);
}

function showDamageNumber(target, damage, type = 'normal') {
    const container = $('damage-numbers');
    const charEl = target === 'player' ? $('player-character') : $('enemy-character');
    const rect = charEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const num = document.createElement('div');
    num.className = 'damage-number';
    
    if (type === 'miss') {
        num.classList.add('miss');
        num.textContent = '闪避!';
    } else if (type === 'blocked') {
        num.classList.add('blocked');
        num.textContent = `-${damage} (防御)`;
    } else {
        num.classList.add(target === 'player' ? 'player-damage' : 'enemy-damage');
        num.textContent = `-${damage}`;
    }
    
    num.style.left = `${rect.left - containerRect.left + rect.width / 2 + (Math.random() - 0.5) * 50}px`;
    num.style.top = `${rect.top - containerRect.top + 30}px`;
    
    container.appendChild(num);
    setTimeout(() => num.remove(), 1000);
}

function addBattleLog(message, type = 'system') {
    const log = $('battle-log-content');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function playAnimation(target, animationClass, duration = 500) {
    const el = target === 'player' ? $('player-character') : $('enemy-character');
    el.classList.add(animationClass);
    setTimeout(() => el.classList.remove(animationClass), duration);
}

function playHurtAnimation(target) {
    playAnimation(target, 'hurt', 400);
}

function calculateDamage(baseDamage, target, isPlayer) {
    let damage = baseDamage;
    
    if (isPlayer) {
        if (GameState.enemyDodging) {
            return { damage: 0, dodged: true };
        }
        if (GameState.enemyDefending) {
            damage = Math.floor(damage * 0.5);
            return { damage, blocked: true };
        }
        if (GameState.enemySuperArmor) {
            damage = Math.floor(damage * 0.5);
            return { damage, superArmor: true };
        }
    } else {
        if (GameState.playerDodging) {
            return { damage: 0, dodged: true };
        }
        if (GameState.playerDefending) {
            damage = Math.floor(damage * 0.5);
            return { damage, blocked: true };
        }
        if (GameState.playerSuperArmor) {
            damage = Math.floor(damage * 0.5);
            return { damage, superArmor: true };
        }
    }
    
    return { damage };
}

function playerPerformAction(action) {
    if (!GameState.battleActive) return;
    
    const info = ACTIONS_INFO[action];
    if (!info) return;
    
    const now = Date.now();
    if (now < (GameState.playerActionCooldowns[action] || 0)) return;
    
    if (info.energyCost > 0 && GameState.playerEnergy < info.energyCost) return;
    
    GameState.playerActionCooldowns[action] = now + info.cooldown;
    
    if (info.energyCost > 0) {
        GameState.playerEnergy -= info.energyCost;
    } else if (info.energyCost < 0) {
        GameState.playerEnergy = Math.min(PLAYER_MAX_ENERGY, GameState.playerEnergy - info.energyCost);
    }
    
    GameState.actionsUsed.push(action);
    updateEnergyDisplay();
    updateActionButtons();
    
    if (action === 'light_attack' || action === 'heavy_attack' || action === 'special_attack') {
        const result = calculateDamage(info.damage, 'enemy', true);
        if (result.dodged) {
            showDamageNumber('enemy', 0, 'miss');
            addBattleLog(`你的${info.name}被敌人闪避了！`, 'player-action');
        } else {
            GameState.enemyHP -= result.damage;
            showDamageNumber('enemy', result.damage, result.blocked ? 'blocked' : 'normal');
            playAnimation('player', info.animationClass, action === 'heavy_attack' || action === 'special_attack' ? 500 : 300);
            if (!result.superArmor) {
                setTimeout(() => playHurtAnimation('enemy'), 150);
            }
            let logMsg = `你使用${info.name}对敌人造成 ${result.damage} 点伤害`;
            if (result.blocked) logMsg += ' (被防御减半)';
            if (result.superArmor) logMsg += ' (霸体减伤)';
            addBattleLog(logMsg, 'player-action');
        }
    } else if (action === 'combo') {
        const hits = info.hits;
        const damagePerHit = Math.floor(info.damage / hits);
        let totalDamage = 0;
        
        playAnimation('player', info.animationClass, 800);
        
        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                if (!GameState.battleActive) return;
                const result = calculateDamage(damagePerHit, 'enemy', true);
                if (result.dodged) {
                    showDamageNumber('enemy', 0, 'miss');
                    addBattleLog(`连招第${i + 1}击被闪避！`, 'player-action');
                } else {
                    GameState.enemyHP -= result.damage;
                    totalDamage += result.damage;
                    showDamageNumber('enemy', result.damage, result.blocked ? 'blocked' : 'normal');
                    if (!result.superArmor) {
                        playHurtAnimation('enemy');
                    }
                    let logMsg = `连招第${i + 1}击造成 ${result.damage} 点伤害`;
                    if (result.blocked) logMsg += ' (防御减半)';
                    if (result.superArmor) logMsg += ' (霸体减伤)';
                    addBattleLog(logMsg, 'player-action');
                }
                updateHPDisplay();
                checkBattleEnd();
            }, i * 200);
        }
    } else if (action === 'defend') {
        GameState.playerDefending = true;
        playAnimation('player', info.animationClass, info.duration);
        addBattleLog('你进入防御姿态！', 'player-action');
        setTimeout(() => {
            GameState.playerDefending = false;
            updateStatusDisplay();
        }, info.duration);
    } else if (action === 'dodge') {
        GameState.playerDodging = true;
        playAnimation('player', info.animationClass, info.duration);
        addBattleLog('你进行闪避！', 'player-action');
        setTimeout(() => {
            GameState.playerDodging = false;
            updateStatusDisplay();
        }, info.duration);
    } else if (action === 'super_armor') {
        GameState.playerSuperArmor = true;
        GameState.playerSuperArmorEnd = now + info.duration;
        addBattleLog('你发动霸体！3秒内不会被打断，但受到伤害减半', 'player-action');
    }
    
    updateHPDisplay();
    updateStatusDisplay();
    checkBattleEnd();
}

function enemyPerformAction(action) {
    if (!GameState.battleActive) return;
    
    const info = ACTIONS_INFO[action];
    if (!info) return;
    
    const now = Date.now();
    
    if (action === 'light_attack' || action === 'heavy_attack' || action === 'special_attack') {
        const result = calculateDamage(info.damage, 'player', false);
        if (result.dodged) {
            showDamageNumber('player', 0, 'miss');
            addBattleLog(`敌人的${info.name}被你闪避了！`, 'enemy-action');
        } else {
            GameState.playerHP -= result.damage;
            GameState.playerEnergy = Math.max(0, GameState.playerEnergy - 10);
            showDamageNumber('player', result.damage, result.blocked ? 'blocked' : 'normal');
            playAnimation('enemy', info.animationClass, action === 'heavy_attack' || action === 'special_attack' ? 500 : 300);
            if (!result.superArmor && !GameState.playerSuperArmor) {
                setTimeout(() => playHurtAnimation('player'), 150);
            }
            let logMsg = `敌人使用${info.name}对你造成 ${result.damage} 点伤害`;
            if (result.blocked) logMsg += ' (被防御减半)';
            if (result.superArmor) logMsg += ' (霸体减伤)';
            addBattleLog(logMsg, 'enemy-action');
        }
    } else if (action === 'combo') {
        const hits = info.hits;
        const damagePerHit = Math.floor(info.damage / hits);
        
        playAnimation('enemy', info.animationClass, 800);
        
        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                if (!GameState.battleActive) return;
                const result = calculateDamage(damagePerHit, 'player', false);
                if (result.dodged) {
                    showDamageNumber('player', 0, 'miss');
                    addBattleLog(`敌人连招第${i + 1}击被你闪避！`, 'enemy-action');
                } else {
                    GameState.playerHP -= result.damage;
                    GameState.playerEnergy = Math.max(0, GameState.playerEnergy - 10);
                    showDamageNumber('player', result.damage, result.blocked ? 'blocked' : 'normal');
                    if (!result.superArmor && !GameState.playerSuperArmor) {
                        playHurtAnimation('player');
                    }
                    let logMsg = `敌人连招第${i + 1}击造成 ${result.damage} 点伤害`;
                    if (result.blocked) logMsg += ' (防御减半)';
                    if (result.superArmor) logMsg += ' (霸体减伤)';
                    addBattleLog(logMsg, 'enemy-action');
                }
                updateHPDisplay();
                updateEnergyDisplay();
                checkBattleEnd();
            }, i * 200);
        }
    } else if (action === 'defend') {
        GameState.enemyDefending = true;
        playAnimation('enemy', info.animationClass, info.duration);
        addBattleLog('敌人进入防御姿态！', 'enemy-action');
        setTimeout(() => {
            GameState.enemyDefending = false;
            updateStatusDisplay();
        }, info.duration);
    } else if (action === 'dodge') {
        GameState.enemyDodging = true;
        playAnimation('enemy', info.animationClass, info.duration);
        addBattleLog('敌人进行闪避！', 'enemy-action');
        setTimeout(() => {
            GameState.enemyDodging = false;
            updateStatusDisplay();
        }, info.duration);
    } else if (action === 'super_armor') {
        GameState.enemySuperArmor = true;
        GameState.enemySuperArmorEnd = now + ACTIONS_INFO.super_armor.duration;
        addBattleLog('敌人发动霸体！3秒内不会被打断，但受到伤害减半', 'enemy-action');
    }
    
    updateHPDisplay();
    updateEnergyDisplay();
    updateStatusDisplay();
    checkBattleEnd();
}

function enemyAI() {
    if (!GameState.battleActive) return;
    
    const now = Date.now();
    const availableActions = GameState.enemyActions.filter(a => {
        const cooldownEnd = GameState.enemyActionCooldowns[a] || 0;
        return now >= cooldownEnd;
    });
    
    if (availableActions.length === 0) return;
    
    let chosenAction;
    const hpRatio = GameState.enemyHP / GameState.enemyMaxHP;
    const playerHP = GameState.playerHP;
    
    if (GameState.enemyActions.includes('super_armor') && hpRatio < 0.3 && !GameState.enemySuperArmor && Math.random() < 0.4) {
        chosenAction = 'super_armor';
    } else if (GameState.enemyActions.includes('dodge') && playerHP > 30 && Math.random() < 0.2) {
        chosenAction = 'dodge';
    } else if (hpRatio < 0.4 && GameState.enemyActions.includes('defend') && Math.random() < 0.35) {
        chosenAction = 'defend';
    } else if (GameState.enemyActions.includes('combo') && Math.random() < 0.2) {
        chosenAction = 'combo';
    } else if (GameState.enemyActions.includes('special_attack') && Math.random() < 0.15) {
        chosenAction = 'special_attack';
    } else if (GameState.enemyActions.includes('heavy_attack') && Math.random() < 0.3) {
        chosenAction = 'heavy_attack';
    } else {
        const attackActions = availableActions.filter(a => ['light_attack', 'heavy_attack'].includes(a));
        chosenAction = attackActions.length > 0 
            ? attackActions[Math.floor(Math.random() * attackActions.length)]
            : 'light_attack';
    }
    
    if (!availableActions.includes(chosenAction)) {
        chosenAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    }
    
    const info = ACTIONS_INFO[chosenAction];
    GameState.enemyActionCooldowns[chosenAction] = now + info.cooldown / GameState.enemySpeedMultiplier;
    
    enemyPerformAction(chosenAction);
}

function startBattle(floor) {
    const config = FLOOR_CONFIG[floor];
    GameState.currentFloor = floor;
    GameState.playerHP = PLAYER_MAX_HP;
    GameState.playerEnergy = 0;
    GameState.playerDefending = false;
    GameState.playerDodging = false;
    GameState.playerSuperArmor = false;
    GameState.playerSuperArmorEnd = 0;
    GameState.playerActionCooldowns = {};
    GameState.enemyHP = getEnemyMaxHP(floor);
    GameState.enemyMaxHP = getEnemyMaxHP(floor);
    GameState.enemyActions = [...config.actions];
    GameState.enemySpeedMultiplier = config.speedMultiplier;
    GameState.enemyDefending = false;
    GameState.enemyDodging = false;
    GameState.enemySuperArmor = false;
    GameState.enemySuperArmorEnd = 0;
    GameState.enemyActionCooldowns = {};
    GameState.battleActive = true;
    GameState.battleTimer = BATTLE_TIMEOUT;
    GameState.battleStartTime = Date.now();
    GameState.actionsUsed = [];
    
    $('current-floor-num').textContent = floor;
    $('enemy-name').textContent = config.name;
    $('battle-log-content').innerHTML = '';
    
    updateHPDisplay();
    updateEnergyDisplay();
    updateStatusDisplay();
    updateActionButtons();
    
    const timerEl = $('battle-timer');
    timerEl.classList.remove('warning');
    timerEl.textContent = BATTLE_TIMEOUT;
    
    addBattleLog(`第 ${floor} 层 - ${config.name} 战斗开始！`, 'system');
    addBattleLog(`敌人血量: ${GameState.enemyMaxHP}`, 'system');
    
    showScreen('battle-screen');
    
    if (GameState.battleInterval) clearInterval(GameState.battleInterval);
    if (GameState.enemyAIInterval) clearInterval(GameState.enemyAIInterval);
    
    GameState.battleInterval = setInterval(() => {
        if (!GameState.battleActive) return;
        
        GameState.battleTimer--;
        const timerEl = $('battle-timer');
        timerEl.textContent = GameState.battleTimer;
        
        if (GameState.battleTimer <= 10) {
            timerEl.classList.add('warning');
        }
        
        const now = Date.now();
        if (GameState.playerSuperArmor && now >= GameState.playerSuperArmorEnd) {
            GameState.playerSuperArmor = false;
            updateStatusDisplay();
        }
        if (GameState.enemySuperArmor && now >= GameState.enemySuperArmorEnd) {
            GameState.enemySuperArmor = false;
            updateStatusDisplay();
        }
        
        updateActionButtons();
        
        if (GameState.battleTimer <= 0) {
            endBattle('timeout');
        }
    }, 1000);
    
    const aiInterval = Math.max(800, 1500 / GameState.enemySpeedMultiplier);
    GameState.enemyAIInterval = setInterval(() => {
        enemyAI();
    }, aiInterval);
}

function checkBattleEnd() {
    if (!GameState.battleActive) return;
    
    if (GameState.enemyHP <= 0) {
        endBattle('win');
    } else if (GameState.playerHP <= 0) {
        endBattle('lose');
    }
}

async function endBattle(result) {
    GameState.battleActive = false;
    
    if (GameState.battleInterval) {
        clearInterval(GameState.battleInterval);
        GameState.battleInterval = null;
    }
    if (GameState.enemyAIInterval) {
        clearInterval(GameState.enemyAIInterval);
        GameState.enemyAIInterval = null;
    }
    
    const duration = Math.floor((Date.now() - GameState.battleStartTime) / 1000);
    const actionsStr = GameState.actionsUsed.join(',');
    
    const res = await apiPost('/game/battle/record', {
        player_name: GameState.playerName,
        floor: GameState.currentFloor,
        result: result,
        player_hp_remaining: Math.max(0, GameState.playerHP),
        enemy_hp_remaining: Math.max(0, GameState.enemyHP),
        battle_duration: duration,
        actions_used: actionsStr
    });
    
    if (res.code === 0 && res.data) {
        GameState.maxFloor = res.data.progress.max_floor;
        GameState.totalBattles = res.data.progress.total_battles;
        GameState.totalWins = res.data.progress.total_wins;
        GameState.unlockedActions = res.data.progress.unlocked_actions;
    }
    
    const titleEl = $('result-title');
    const detailsEl = $('result-details');
    const unlockEl = $('unlock-notification');
    
    titleEl.className = 'result-title';
    unlockEl.innerHTML = '';
    
    if (result === 'win') {
        titleEl.textContent = '胜利!';
        titleEl.classList.add('win');
        detailsEl.innerHTML = `
            <p>恭喜击败第 ${GameState.currentFloor} 层守门武者！</p>
            <p>剩余血量: ${Math.max(0, GameState.playerHP)}/${PLAYER_MAX_HP}</p>
            <p>战斗用时: ${duration} 秒</p>
        `;
        
        if (res.data && res.data.new_unlock) {
            const actionInfo = ACTIONS_INFO[res.data.new_unlock];
            unlockEl.innerHTML = `
                <h3>🎉 新动作解锁!</h3>
                <p style="font-size: 24px; font-weight: bold; color: #ff6b6b; margin: 10px 0;">${actionInfo.name}</p>
                <p>${actionInfo.description}</p>
            `;
            showUnlockModal(res.data.new_unlock);
        }
    } else if (result === 'lose') {
        titleEl.textContent = '失败...';
        titleEl.classList.add('lose');
        detailsEl.innerHTML = `
            <p>你被第 ${GameState.currentFloor} 层守门武者击败了</p>
            <p>敌人剩余血量: ${Math.max(0, GameState.enemyHP)}/${GameState.enemyMaxHP}</p>
            <p>不要气馁，再试一次！</p>
        `;
    } else if (result === 'timeout') {
        titleEl.textContent = '超时!';
        titleEl.classList.add('timeout');
        detailsEl.innerHTML = `
            <p>战斗超时，守门武者回满血了</p>
            <p>需要在60秒内击败敌人</p>
            <p>你剩余血量: ${Math.max(0, GameState.playerHP)}/${PLAYER_MAX_HP}</p>
        `;
    }
    
    showScreen('battle-result-screen');
}

function showUnlockModal(actionKey) {
    const info = ACTIONS_INFO[actionKey];
    const modal = $('action-unlock-modal');
    const modalInfo = $('modal-action-info');
    
    modalInfo.innerHTML = `
        <div class="action-name">${info.name}</div>
        <div>${info.description}</div>
    `;
    
    modal.classList.add('active');
}

function showBattleRecords() {
    apiGet('/game/battle/records/get', { player_name: GameState.playerName, limit: 50 }).then(res => {
        const container = $('records-list');
        container.innerHTML = '';
        
        if (res.code !== 0 || !res.data.records.length) {
            container.innerHTML = '<p style="text-align: center; color: #adb5bd; padding: 40px;">暂无战斗记录</p>';
        } else {
            res.data.records.forEach(record => {
                const item = document.createElement('div');
                item.className = `record-item ${record.result}`;
                
                const resultText = {
                    win: '胜利',
                    lose: '失败',
                    timeout: '超时'
                }[record.result] || record.result;
                
                item.innerHTML = `
                    <div class="record-info">
                        <div class="record-floor">第 ${record.floor} 层</div>
                        <div class="record-result ${record.result}">${resultText}</div>
                        <div class="record-date">${record.created_at}</div>
                    </div>
                    <div class="record-stats">
                        <div>玩家HP: ${record.player_hp_remaining}</div>
                        <div>敌人HP: ${record.enemy_hp_remaining}</div>
                        <div>用时: ${record.battle_duration}s</div>
                    </div>
                `;
                container.appendChild(item);
            });
        }
        
        showScreen('records-screen');
    });
}

function validatePlayerName() {
    const name = $('player-name-input').value.trim();
    const errorEl = $('name-error');
    const inputEl = $('player-name-input');
    
    if (!name) {
        errorEl.textContent = '请输入玩家名称！';
        inputEl.classList.add('input-error');
        inputEl.focus();
        setTimeout(() => {
            inputEl.classList.remove('input-error');
        }, 400);
        setTimeout(() => {
            errorEl.textContent = '';
        }, 2000);
        return null;
    }
    
    errorEl.textContent = '';
    inputEl.classList.remove('input-error');
    return name;
}

function setupEventListeners() {
    const savedName = loadSavedPlayerName();
    if (savedName) {
        $('player-name-input').value = savedName;
    }
    
    $('start-btn').addEventListener('click', async () => {
        const name = validatePlayerName();
        if (!name) return;
        
        GameState.playerName = name;
        savePlayerName(name);
        
        const res = await loadPlayerProgress();
        if (res.code === 0 && res.data) {
            GameState.currentFloor = res.data.current_floor;
            GameState.maxFloor = res.data.max_floor;
            GameState.unlockedActions = res.data.unlocked_actions;
            GameState.totalBattles = res.data.total_battles;
            GameState.totalWins = res.data.total_wins;
        }
        
        updateFloorDisplay();
        showScreen('floor-select-screen');
    });
    
    $('view-records-btn').addEventListener('click', () => {
        const name = validatePlayerName();
        if (!name) return;
        
        GameState.playerName = name;
        savePlayerName(name);
        showBattleRecords();
    });
    
    $('back-to-start-btn').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    $('continue-btn').addEventListener('click', () => {
        updateFloorDisplay();
        showScreen('floor-select-screen');
    });
    
    $('back-from-records-btn').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    $('reset-progress-btn').addEventListener('click', async () => {
        if (!confirm('确定要重置所有进度吗？此操作不可撤销！')) return;
        
        await apiPost('/game/progress/reset?player_name=' + encodeURIComponent(GameState.playerName));
        const res = await loadPlayerProgress();
        if (res.code === 0 && res.data) {
            GameState.currentFloor = res.data.current_floor;
            GameState.maxFloor = res.data.max_floor;
            GameState.unlockedActions = res.data.unlocked_actions;
            GameState.totalBattles = res.data.total_battles;
            GameState.totalWins = res.data.total_wins;
        }
        updateFloorDisplay();
    });
    
    $('modal-close-btn').addEventListener('click', () => {
        $('action-unlock-modal').classList.remove('active');
    });
    
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (GameState.unlockedActions.includes(action)) {
                playerPerformAction(action);
            }
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (!GameState.battleActive) return;
        
        const keyMap = {
            'j': 'light_attack',
            'J': 'light_attack',
            'k': 'heavy_attack',
            'K': 'heavy_attack',
            'l': 'defend',
            'L': 'defend',
            'u': 'dodge',
            'U': 'dodge',
            'i': 'special_attack',
            'I': 'special_attack',
            'o': 'combo',
            'O': 'combo',
            'p': 'super_armor',
            'P': 'super_armor'
        };
        
        const action = keyMap[e.key];
        if (action && GameState.unlockedActions.includes(action)) {
            e.preventDefault();
            playerPerformAction(action);
        }
    });
    
    setInterval(() => {
        if (GameState.battleActive) {
            updateActionButtons();
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    
    const savedName = loadSavedPlayerName();
    if (savedName) {
        $('player-name-input').value = savedName;
        GameState.playerName = savedName;
        
        try {
            const res = await loadPlayerProgress();
            if (res.code === 0 && res.data) {
                GameState.currentFloor = res.data.current_floor;
                GameState.maxFloor = res.data.max_floor;
                GameState.unlockedActions = res.data.unlocked_actions;
                GameState.totalBattles = res.data.total_battles;
                GameState.totalWins = res.data.total_wins;
                
                if (GameState.maxFloor > 1 || GameState.totalBattles > 0) {
                    updateFloorDisplay();
                    showScreen('floor-select-screen');
                }
            }
        } catch (e) {}
    }
});
