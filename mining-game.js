// ==================== 游戏常量配置 ====================
const BLOCK_SIZE = 40;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const COLS = Math.floor(CANVAS_WIDTH / BLOCK_SIZE);
const VISIBLE_ROWS = Math.floor(CANVAS_HEIGHT / BLOCK_SIZE);

const BLOCK_TYPES = {
    EMPTY: { id: 0, name: '空', hp: 0, color: null, sellValue: 0 },
    AIR: { id: 0, name: '空气', hp: 0, color: '#87CEEB', sellValue: 0 },
    DIRT: { id: 1, name: '泥土', hp: 1, color: '#8B4513', sellValue: 1 },
    STONE: { id: 2, name: '石头', hp: 3, color: '#696969', sellValue: 5 },
    GOLD: { id: 3, name: '金矿', hp: 4, color: '#FFD700', sellValue: 50 },
    DIAMOND: { id: 4, name: '钻石', hp: 5, color: '#00CED1', sellValue: 200 },
    LAVA: { id: 5, name: '岩浆', hp: 999, color: '#FF4500', sellValue: 0 },
    CHEST: { id: 6, name: '宝箱', hp: 2, color: '#8B4513', sellValue: 0 },
    BEDROCK: { id: 7, name: '基岩', hp: 99999, color: '#1a1a1a', sellValue: 0 }
};

const PICKAXE_TYPES = {
    WOOD: { name: '木镐', damage: 1, cost: 0 },
    IRON: { name: '铁镐', damage: 2, cost: 200 },
    STEEL: { name: '钢镐', damage: 3, cost: 800 },
    DIAMOND: { name: '钻石镐', damage: 5, cost: 3000 }
};

const SAVE_KEY = 'mining_game_save_v1';

// ==================== 游戏状态 ====================
let gameState = null;

let animationState = {
    miningDirection: null,
    miningStartTime: 0,
    miningDuration: 250,
    particles: [],
    lastMoveTime: 0,
    moveDirection: null,
    shakeTime: 0
};

function createInitialState() {
    return {
        gold: 0,
        pickaxe: 'WOOD',
        fuel: 100,
        maxFuel: 100,
        tankUpgrades: 0,
        inventory: {
            dirt: 0,
            stone: 0,
            goldOre: 0,
            diamond: 0
        },
        items: {
            shield: 0,
            bomb: 0,
            teleport: 0
        },
        maxDepth: 0,
        player: {
            col: Math.floor(COLS / 2),
            row: 0
        },
        blocks: {},
        openedChests: {},
        isDead: false
    };
}

// ==================== 音效系统 (Web Audio API) ====================
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    initAudio();
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    switch (type) {
        case 'dig': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
            break;
        }
        case 'metal': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        }
        case 'lava': {
            const bufferSize = ctx.sampleRate * 0.3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.01) * 0.3;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start(now);
            break;
        }
        case 'coin': {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, now);
            osc2.frequency.setValueAtTime(1318.51, now + 0.05);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.12);
            osc2.start(now + 0.05);
            osc2.stop(now + 0.25);
            break;
        }
        case 'upgrade': {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.08);
                gain.gain.setValueAtTime(0.1, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.15);
            });
            break;
        }
        case 'death': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.8);
            break;
        }
        case 'chest': {
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.06);
                gain.gain.setValueAtTime(0.12, now + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 0.2);
            });
            break;
        }
        case 'bomb': {
            const bufferSize = ctx.sampleRate * 0.4;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const t = i / bufferSize;
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * 0.5;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start(now);
            break;
        }
        case 'teleport': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
            break;
        }
        case 'denied': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.setValueAtTime(150, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        }
    }
}

// ==================== 存档系统 ====================
function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.error('存档失败:', e);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            gameState = JSON.parse(saved);
            return true;
        }
    } catch (e) {
        console.error('读档失败:', e);
    }
    return false;
}

function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

// ==================== 地图生成 ====================
function getBlockKey(col, row) {
    return `${col},${row}`;
}

function getBlock(col, row) {
    const key = getBlockKey(col, row);
    if (gameState.blocks[key] !== undefined) {
        return gameState.blocks[key];
    }
    const block = generateBlock(col, row);
    gameState.blocks[key] = block;
    return block;
}

function setBlock(col, row, blockId) {
    const key = getBlockKey(col, row);
    gameState.blocks[key] = { type: blockId, hp: getBlockMaxHp(blockId, row) };
}

function getBlockMaxHp(blockId, row) {
    switch (blockId) {
        case BLOCK_TYPES.DIRT.id: return BLOCK_TYPES.DIRT.hp;
        case BLOCK_TYPES.STONE.id: return BLOCK_TYPES.STONE.hp;
        case BLOCK_TYPES.GOLD.id: return BLOCK_TYPES.GOLD.hp;
        case BLOCK_TYPES.DIAMOND.id: return BLOCK_TYPES.DIAMOND.hp;
        case BLOCK_TYPES.LAVA.id: return BLOCK_TYPES.LAVA.hp;
        case BLOCK_TYPES.CHEST.id: return BLOCK_TYPES.CHEST.hp;
        case BLOCK_TYPES.BEDROCK.id: return BLOCK_TYPES.BEDROCK.hp;
        default: return 0;
    }
}

function getBlockTypeById(id) {
    for (const key in BLOCK_TYPES) {
        if (BLOCK_TYPES[key].id === id && key !== 'EMPTY') {
            return BLOCK_TYPES[key];
        }
    }
    return BLOCK_TYPES.AIR;
}

function generateBlock(col, row) {
    if (row < 0) return { type: BLOCK_TYPES.AIR.id, hp: 0 };
    
    if (row === 0) {
        return { type: BLOCK_TYPES.DIRT.id, hp: BLOCK_TYPES.DIRT.hp };
    }
    
    if (row >= 1 && row <= 4) {
        return { type: BLOCK_TYPES.DIRT.id, hp: BLOCK_TYPES.DIRT.hp };
    }
    
    if (col < 0 || col >= COLS) {
        return { type: BLOCK_TYPES.BEDROCK.id, hp: BLOCK_TYPES.BEDROCK.hp };
    }
    
    if (row % 50 === 0 && row > 0) {
        if (col === Math.floor(COLS / 2)) {
            return { type: BLOCK_TYPES.CHEST.id, hp: BLOCK_TYPES.CHEST.hp };
        }
        if (col >= Math.floor(COLS / 2) - 2 && col <= Math.floor(COLS / 2) + 2) {
            return { type: BLOCK_TYPES.AIR.id, hp: 0 };
        }
    }
    
    const rand = Math.random();
    const depthFactor = Math.min(row / 500, 1);
    
    const lavaChance = row < 30 ? 0 : 0.02 + depthFactor * 0.08;
    const diamondChance = row < 50 ? 0 : 0.01 + depthFactor * 0.04;
    const goldChance = row < 20 ? 0 : 0.03 + depthFactor * 0.05;
    const stoneChance = 0.45 + depthFactor * 0.2;
    
    if (rand < lavaChance) {
        return { type: BLOCK_TYPES.LAVA.id, hp: BLOCK_TYPES.LAVA.hp };
    }
    if (rand < lavaChance + diamondChance) {
        return { type: BLOCK_TYPES.DIAMOND.id, hp: BLOCK_TYPES.DIAMOND.hp };
    }
    if (rand < lavaChance + diamondChance + goldChance) {
        return { type: BLOCK_TYPES.GOLD.id, hp: BLOCK_TYPES.GOLD.hp };
    }
    if (rand < lavaChance + diamondChance + goldChance + stoneChance) {
        return { type: BLOCK_TYPES.STONE.id, hp: BLOCK_TYPES.STONE.hp };
    }
    return { type: BLOCK_TYPES.DIRT.id, hp: BLOCK_TYPES.DIRT.hp };
}

// ==================== 游戏逻辑 ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function updateUI() {
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('pickaxe').textContent = PICKAXE_TYPES[gameState.pickaxe].name;
    document.getElementById('fuel').textContent = Math.floor(gameState.fuel);
    document.getElementById('maxFuel').textContent = gameState.maxFuel;
    document.getElementById('depth').textContent = gameState.player.row;
    document.getElementById('dirtCount').textContent = gameState.inventory.dirt;
    document.getElementById('stoneCount').textContent = gameState.inventory.stone;
    document.getElementById('goldOreCount').textContent = gameState.inventory.goldOre;
    document.getElementById('diamondCount').textContent = gameState.inventory.diamond;
    document.getElementById('shieldCount').textContent = gameState.items.shield;
    document.getElementById('bombCount').textContent = gameState.items.bomb;
    document.getElementById('teleportCount').textContent = gameState.items.teleport;
    document.getElementById('tankUpgrades').textContent = 5 - gameState.tankUpgrades;
    
    document.getElementById('useBombBtn').disabled = gameState.items.bomb <= 0;
    document.getElementById('useTeleportBtn').disabled = gameState.items.teleport <= 0 || gameState.player.row <= 0;
}

function showMessage(msg) {
    const box = document.getElementById('messageBox');
    box.textContent = msg;
    box.style.animation = 'none';
    setTimeout(() => {
        box.style.animation = 'modalIn 0.3s';
    }, 10);
}

function calculateFuelCost() {
    const depth = gameState.player.row;
    const extraCost = Math.floor(depth / 10) * 0.1;
    return 1 + extraCost;
}

function isAdjacentToPlayer(col, row) {
    const pc = gameState.player.col;
    const pr = gameState.player.row;
    const dc = Math.abs(col - pc);
    const dr = Math.abs(row - pr);
    return (dc + dr === 1);
}

function isPlayerOnSurface() {
    return gameState.player.row <= 0;
}

function movePlayer(col, row) {
    if (col < 0 || col >= COLS) return false;
    
    const targetBlock = getBlock(col, row);
    if (targetBlock.type !== BLOCK_TYPES.AIR.id) {
        return false;
    }
    
    const pc = gameState.player.col;
    const pr = gameState.player.row;
    if (col < pc) animationState.moveDirection = 'left';
    else if (col > pc) animationState.moveDirection = 'right';
    else if (row < pr) animationState.moveDirection = 'up';
    else animationState.moveDirection = 'down';
    animationState.lastMoveTime = Date.now();
    
    gameState.player.col = col;
    gameState.player.row = row;
    
    if (row > gameState.maxDepth) {
        gameState.maxDepth = row;
    }
    
    if (row <= 0) {
        gameState.player.row = 0;
        showMessage('🏠 已到达地表！可以打开商店出售矿物和补给。');
    }
    
    checkLavaAroundPlayer();
    
    return true;
}

function checkLavaAroundPlayer() {
    const pc = gameState.player.col;
    const pr = gameState.player.row;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [dc, dr] of directions) {
        const block = getBlock(pc + dc, pr + dr);
        if (block.type === BLOCK_TYPES.LAVA.id) {
            handleLavaContact();
            return;
        }
    }
}

function handleLavaContact() {
    if (gameState.items.shield > 0) {
        gameState.items.shield--;
        playSound('metal');
        showMessage('🛡️ 护盾抵挡了岩浆伤害！');
        return;
    }
    
    playSound('lava');
    playSound('death');
    gameState.isDead = true;
    saveGame();
    
    document.getElementById('deathMessage').textContent = 
        `你被岩浆吞噬了！\n最终深度: ${gameState.maxDepth}层\n获得金币: ${gameState.gold}`;
    document.getElementById('deathModal').classList.remove('hidden');
}

function mineBlock(col, row) {
    if (gameState.isDead) return;
    
    if (!isAdjacentToPlayer(col, row)) {
        showMessage('⚠️ 只能挖掘相邻的方块！');
        playSound('denied');
        return;
    }
    
    const block = getBlock(col, row);
    
    if (block.type === BLOCK_TYPES.AIR.id || block.type === BLOCK_TYPES.EMPTY.id) {
        showMessage('这里是空的！');
        return;
    }
    
    if (block.type === BLOCK_TYPES.BEDROCK.id) {
        showMessage('⚠️ 基岩无法被挖掘！');
        playSound('denied');
        return;
    }
    
    const fuelCost = calculateFuelCost();
    if (gameState.fuel < fuelCost) {
        showMessage('⛽ 燃油不足！请返回地表补给。');
        playSound('denied');
        return;
    }
    
    const pc = gameState.player.col;
    const pr = gameState.player.row;
    let dir = 'right';
    if (col > pc) dir = 'right';
    else if (col < pc) dir = 'left';
    else if (row > pr) dir = 'down';
    else if (row < pr) dir = 'up';
    
    triggerMiningAnimation(dir);
    spawnParticles(col, row, getBlockTypeById(block.type).color);
    animationState.shakeTime = Date.now();
    
    const damage = PICKAXE_TYPES[gameState.pickaxe].damage;
    block.hp -= damage;
    
    const blockType = getBlockTypeById(block.type);
    
    if (blockType.id === BLOCK_TYPES.STONE.id || 
        blockType.id === BLOCK_TYPES.GOLD.id || 
        blockType.id === BLOCK_TYPES.DIAMOND.id) {
        playSound('metal');
    } else {
        playSound('dig');
    }
    
    if (block.hp <= 0) {
        collectBlock(col, row, blockType);
        setBlock(col, row, BLOCK_TYPES.AIR.id);
    }
    
    gameState.fuel -= fuelCost;
    if (gameState.fuel < 0) gameState.fuel = 0;
    
    if (row > gameState.maxDepth) {
        gameState.maxDepth = row;
    }
    
    updateUI();
    saveGame();
}

function triggerMiningAnimation(direction) {
    animationState.miningDirection = direction;
    animationState.miningStartTime = Date.now();
}

function spawnParticles(col, row, color) {
    const count = 6 + Math.floor(Math.random() * 4);
    const playerRow = gameState.player.row;
    const startRow = playerRow - Math.floor(VISIBLE_ROWS / 2);
    const centerX = col * BLOCK_SIZE + BLOCK_SIZE / 2;
    const centerY = (row - startRow) * BLOCK_SIZE + BLOCK_SIZE / 2;
    
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        animationState.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 3 + Math.random() * 4,
            color: color || '#8B4513',
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02
        });
    }
}

function updateParticles() {
    for (let i = animationState.particles.length - 1; i >= 0; i--) {
        const p = animationState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= p.decay;
        if (p.life <= 0) {
            animationState.particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    updateParticles();
    animationState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

function collectBlock(col, row, blockType) {
    switch (blockType.id) {
        case BLOCK_TYPES.DIRT.id:
            gameState.inventory.dirt++;
            break;
        case BLOCK_TYPES.STONE.id:
            gameState.inventory.stone++;
            break;
        case BLOCK_TYPES.GOLD.id:
            gameState.inventory.goldOre++;
            break;
        case BLOCK_TYPES.DIAMOND.id:
            gameState.inventory.diamond++;
            break;
        case BLOCK_TYPES.LAVA.id:
            handleLavaContact();
            break;
        case BLOCK_TYPES.CHEST.id:
            openChest(col, row);
            break;
    }
}

function openChest(col, row) {
    const chestKey = getBlockKey(col, row);
    if (gameState.openedChests[chestKey]) return;
    gameState.openedChests[chestKey] = true;
    
    playSound('chest');
    
    const rewards = [];
    
    const r1 = Math.random();
    if (r1 < 0.35) {
        gameState.items.shield++;
        rewards.push('🛡️ 护盾 x1');
    } else if (r1 < 0.7) {
        gameState.items.bomb++;
        rewards.push('💣 炸药 x1');
    } else {
        gameState.items.teleport++;
        rewards.push('💎 传送石 x1');
    }
    
    const extraGold = Math.floor(Math.random() * 100) + 50;
    gameState.gold += extraGold;
    rewards.push(`💰 金币 +${extraGold}`);
    
    if (Math.random() < 0.3) {
        const bonus = Math.random();
        if (bonus < 0.5) {
            gameState.items.shield++;
            rewards.push('🛡️ 额外护盾 x1');
        } else if (bonus < 0.8) {
            gameState.items.bomb++;
            rewards.push('💣 额外炸药 x1');
        } else {
            gameState.items.teleport++;
            rewards.push('💎 额外传送石 x1');
        }
    }
    
    document.getElementById('chestReward').textContent = rewards.join('\n');
    document.getElementById('chestModal').classList.remove('hidden');
}

function useBomb() {
    if (gameState.items.bomb <= 0) {
        showMessage('⚠️ 没有炸药！');
        playSound('denied');
        return;
    }
    
    gameState.items.bomb--;
    playSound('bomb');
    
    const pc = gameState.player.col;
    const pr = gameState.player.row;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dc === 0 && dr === 0) continue;
            const col = pc + dc;
            const row = pr + dr;
            if (col < 0 || col >= COLS || row < 0) continue;
            
            const block = getBlock(col, row);
            if (block.type !== BLOCK_TYPES.AIR.id && 
                block.type !== BLOCK_TYPES.BEDROCK.id &&
                block.type !== BLOCK_TYPES.LAVA.id) {
                const blockType = getBlockTypeById(block.type);
                collectBlock(col, row, blockType);
                setBlock(col, row, BLOCK_TYPES.AIR.id);
            }
        }
    }
    
    showMessage('💥 炸药爆炸！周围方块已清除');
    updateUI();
    saveGame();
}

function useTeleport() {
    if (gameState.items.teleport <= 0) {
        showMessage('⚠️ 没有传送石！');
        playSound('denied');
        return;
    }
    
    if (isPlayerOnSurface()) {
        showMessage('⚠️ 你已经在地表了！');
        playSound('denied');
        return;
    }
    
    gameState.items.teleport--;
    playSound('teleport');
    gameState.player.row = 0;
    
    while (getBlock(gameState.player.col, 0).type !== BLOCK_TYPES.AIR.id) {
        setBlock(gameState.player.col, 0, BLOCK_TYPES.AIR.id);
    }
    
    showMessage('✨ 传送成功！已返回地表');
    updateUI();
    saveGame();
}

// ==================== 商店系统 ====================
function openShop() {
    if (!isPlayerOnSurface()) {
        showMessage('⚠️ 必须返回地表才能使用商店！');
        playSound('denied');
        return;
    }
    
    updateShopButtons();
    document.getElementById('shopModal').classList.remove('hidden');
}

function updateShopButtons() {
    const btns = document.querySelectorAll('.shop-btn');
    btns.forEach(btn => {
        const action = btn.dataset.action;
        switch (action) {
            case 'sellAll':
                btn.disabled = !hasMinerals();
                break;
            case 'refuel':
                btn.disabled = gameState.fuel >= gameState.maxFuel || gameState.gold < 50;
                break;
            case 'upgradeIron':
                btn.disabled = gameState.pickaxe !== 'WOOD' || gameState.gold < 200;
                break;
            case 'upgradeSteel':
                btn.disabled = gameState.pickaxe !== 'IRON' || gameState.gold < 800;
                break;
            case 'upgradeDiamond':
                btn.disabled = gameState.pickaxe !== 'STEEL' || gameState.gold < 3000;
                break;
            case 'upgradeTank':
                btn.disabled = gameState.tankUpgrades >= 5 || gameState.gold < 150;
                break;
        }
    });
}

function hasMinerals() {
    return gameState.inventory.dirt > 0 ||
           gameState.inventory.stone > 0 ||
           gameState.inventory.goldOre > 0 ||
           gameState.inventory.diamond > 0;
}

function sellAll() {
    let totalGold = 0;
    totalGold += gameState.inventory.dirt * BLOCK_TYPES.DIRT.sellValue;
    totalGold += gameState.inventory.stone * BLOCK_TYPES.STONE.sellValue;
    totalGold += gameState.inventory.goldOre * BLOCK_TYPES.GOLD.sellValue;
    totalGold += gameState.inventory.diamond * BLOCK_TYPES.DIAMOND.sellValue;
    
    if (totalGold === 0) {
        showMessage('⚠️ 没有矿物可以出售！');
        playSound('denied');
        return;
    }
    
    gameState.gold += totalGold;
    gameState.inventory = { dirt: 0, stone: 0, goldOre: 0, diamond: 0 };
    
    playSound('coin');
    showMessage(`💰 出售成功！获得 ${totalGold} 金币`);
    updateUI();
    updateShopButtons();
    saveGame();
}

function refuel() {
    if (gameState.gold < 50) {
        showMessage('⚠️ 金币不足！');
        playSound('denied');
        return;
    }
    if (gameState.fuel >= gameState.maxFuel) {
        showMessage('⛽ 油箱已满！');
        playSound('denied');
        return;
    }
    
    gameState.gold -= 50;
    gameState.fuel = gameState.maxFuel;
    playSound('coin');
    showMessage('⛽ 油箱已加满！');
    updateUI();
    updateShopButtons();
    saveGame();
}

function upgradePickaxe(target) {
    const pickaxe = PICKAXE_TYPES[target];
    if (gameState.gold < pickaxe.cost) {
        showMessage('⚠️ 金币不足！');
        playSound('denied');
        return;
    }
    
    gameState.gold -= pickaxe.cost;
    gameState.pickaxe = target;
    playSound('upgrade');
    showMessage(`⛏️ 升级成功！当前镐子：${pickaxe.name}`);
    updateUI();
    updateShopButtons();
    saveGame();
}

function upgradeTank() {
    if (gameState.tankUpgrades >= 5) {
        showMessage('⚠️ 油箱已达最大容量！');
        playSound('denied');
        return;
    }
    if (gameState.gold < 150) {
        showMessage('⚠️ 金币不足！');
        playSound('denied');
        return;
    }
    
    gameState.gold -= 150;
    gameState.maxFuel += 50;
    gameState.fuel += 50;
    gameState.tankUpgrades++;
    playSound('upgrade');
    showMessage(`🛢️ 油箱扩容成功！容量：${gameState.maxFuel}`);
    updateUI();
    updateShopButtons();
    saveGame();
}

// ==================== 渲染系统 ====================
function render() {
    const now = Date.now();
    
    ctx.save();
    if (animationState.shakeTime && now - animationState.shakeTime < 150) {
        const elapsed = now - animationState.shakeTime;
        const intensity = (1 - elapsed / 150) * 3;
        const shakeX = (Math.random() - 0.5) * intensity;
        const shakeY = (Math.random() - 0.5) * intensity;
        ctx.translate(shakeX, shakeY);
    }
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const playerRow = gameState.player.row;
    const startRow = playerRow - Math.floor(VISIBLE_ROWS / 2);
    const endRow = startRow + VISIBLE_ROWS;
    
    for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < COLS; col++) {
            const screenY = (row - startRow) * BLOCK_SIZE;
            const screenX = col * BLOCK_SIZE;
            
            if (row < 0) {
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
                continue;
            }
            
            const block = getBlock(col, row);
            const blockType = getBlockTypeById(block.type);
            
            if (block.type === BLOCK_TYPES.AIR.id) {
                const bgColor = row < 0 ? '#87CEEB' : getUndergroundColor(row);
                ctx.fillStyle = bgColor;
                ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
                continue;
            }
            
            drawBlock(screenX, screenY, block, blockType, row);
        }
    }
    
    const playerScreenY = (playerRow - startRow) * BLOCK_SIZE;
    const playerScreenX = gameState.player.col * BLOCK_SIZE;
    drawPlayer(playerScreenX, playerScreenY);
    
    drawGridOverlay();
    drawParticles();
    
    ctx.restore();
}

function getUndergroundColor(row) {
    const depthFactor = Math.min(row / 200, 1);
    const r = Math.floor(30 + depthFactor * 20);
    const g = Math.floor(30 - depthFactor * 15);
    const b = Math.floor(40 - depthFactor * 20);
    return `rgb(${Math.max(r, 10)}, ${Math.max(g, 10)}, ${Math.max(b, 10)})`;
}

function drawBlock(x, y, block, blockType, row) {
    ctx.fillStyle = blockType.color;
    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
    
    switch (blockType.id) {
        case BLOCK_TYPES.DIRT.id:
            ctx.fillStyle = '#6B3410';
            for (let i = 0; i < 5; i++) {
                const px = x + (Math.sin(i * 17 + row) * 0.5 + 0.5) * (BLOCK_SIZE - 6) + 3;
                const py = y + (Math.cos(i * 23 + row) * 0.5 + 0.5) * (BLOCK_SIZE - 6) + 3;
                ctx.fillRect(px, py, 4, 4);
            }
            if (row <= 0) {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(x, y, BLOCK_SIZE, 6);
                ctx.fillStyle = '#32CD32';
                for (let i = 0; i < BLOCK_SIZE; i += 4) {
                    ctx.fillRect(x + i, y - 2, 2, 4);
                }
            }
            break;
            
        case BLOCK_TYPES.STONE.id:
            ctx.fillStyle = '#4a4a4a';
            for (let i = 0; i < 4; i++) {
                const px = x + (i * 13 % (BLOCK_SIZE - 8)) + 2;
                const py = y + (i * 17 % (BLOCK_SIZE - 8)) + 2;
                ctx.fillRect(px, py, 6, 4);
            }
            ctx.fillStyle = '#808080';
            ctx.fillRect(x + 2, y + 2, 4, 2);
            break;
            
        case BLOCK_TYPES.GOLD.id:
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(x + 4, y + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(x + 8, y + 8, 8, 6);
            ctx.fillRect(x + 20, y + 14, 10, 8);
            ctx.fillRect(x + 10, y + 22, 12, 6);
            ctx.fillStyle = '#FFFACD';
            ctx.fillRect(x + 10, y + 10, 4, 2);
            break;
            
        case BLOCK_TYPES.DIAMOND.id:
            ctx.fillStyle = '#006666';
            ctx.fillRect(x + 4, y + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.moveTo(x + BLOCK_SIZE / 2, y + 6);
            ctx.lineTo(x + BLOCK_SIZE - 8, y + BLOCK_SIZE / 2);
            ctx.lineTo(x + BLOCK_SIZE / 2, y + BLOCK_SIZE - 6);
            ctx.lineTo(x + 8, y + BLOCK_SIZE / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#E0FFFF';
            ctx.fillRect(x + BLOCK_SIZE / 2 - 2, y + 10, 4, 8);
            break;
            
        case BLOCK_TYPES.LAVA.id:
            const time = Date.now() / 500;
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = '#FF4500';
            for (let i = 0; i < 6; i++) {
                const offsetX = Math.sin(time + i * 1.5) * 4;
                const offsetY = Math.cos(time + i * 2) * 3;
                const px = x + 5 + i * 5 + offsetX;
                const py = y + 5 + (i % 3) * 10 + offsetY;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 3; i++) {
                const px = x + 10 + i * 12;
                const py = y + 10 + Math.sin(time * 2 + i) * 6;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
            
        case BLOCK_TYPES.CHEST.id:
            ctx.fillStyle = '#654321';
            ctx.fillRect(x + 4, y + 8, BLOCK_SIZE - 8, BLOCK_SIZE - 12);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 4, y + 8, BLOCK_SIZE - 8, 8);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + BLOCK_SIZE / 2 - 4, y + 14, 8, 8);
            ctx.fillRect(x + 6, y + 18, BLOCK_SIZE - 12, 2);
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(x + BLOCK_SIZE / 2 - 2, y + 18, 4, 4);
            break;
            
        case BLOCK_TYPES.BEDROCK.id:
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = '#2a2a2a';
            for (let i = 0; i < 6; i++) {
                const px = x + (i * 7 % (BLOCK_SIZE - 4));
                const py = y + (i * 11 % (BLOCK_SIZE - 4));
                ctx.fillRect(px, py, 4, 4);
            }
            break;
    }
    
    if (block.hp > 0 && block.hp < getBlockMaxHp(blockType.id, row) && blockType.id !== BLOCK_TYPES.LAVA.id) {
        const maxHp = getBlockMaxHp(blockType.id, row);
        const damageRatio = 1 - (block.hp / maxHp);
        ctx.fillStyle = `rgba(0, 0, 0, ${damageRatio * 0.5})`;
        ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = `rgba(255, 255, 255, ${damageRatio * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (damageRatio > 0.3) {
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + BLOCK_SIZE - 10, y + BLOCK_SIZE - 8);
        }
        if (damageRatio > 0.6) {
            ctx.moveTo(x + BLOCK_SIZE - 5, y + 8);
            ctx.lineTo(x + 8, y + BLOCK_SIZE - 5);
        }
        ctx.stroke();
    }
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

function drawPlayer(x, y) {
    const now = Date.now();
    const timeSinceMove = now - animationState.lastMoveTime;
    const walkBob = timeSinceMove < 200 ? Math.sin((timeSinceMove / 200) * Math.PI) * 2 : 0;
    const footOffset = timeSinceMove < 200 ? Math.sin((timeSinceMove / 200) * Math.PI * 2) * 2 : 0;
    
    const bodyY = y + walkBob;
    
    let swingAngle = 0;
    let swingProgress = 0;
    if (animationState.miningDirection) {
        const elapsed = now - animationState.miningStartTime;
        if (elapsed < animationState.miningDuration) {
            swingProgress = elapsed / animationState.miningDuration;
            swingAngle = Math.sin(swingProgress * Math.PI) * 1.2;
        } else {
            animationState.miningDirection = null;
        }
    }
    
    const eyeBlink = Math.sin(now / 3000) > 0.95 ? 0 : 1;
    
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x + 10, bodyY + 16, 20, 18);
    
    ctx.fillStyle = '#FFDAB9';
    ctx.fillRect(x + 12, bodyY + 6, 16, 12);
    
    ctx.fillStyle = '#000';
    if (eyeBlink) {
        ctx.fillRect(x + 15, bodyY + 10, 3, 3);
        ctx.fillRect(x + 22, bodyY + 10, 3, 3);
    } else {
        ctx.fillRect(x + 15, bodyY + 11, 3, 1);
        ctx.fillRect(x + 22, bodyY + 11, 3, 1);
    }
    
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(x + 11, bodyY + 2, 18, 6);
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x + 9, bodyY + 6, 22, 2);
    
    ctx.fillStyle = '#2F4F8F';
    ctx.fillRect(x + 12, y + 34 + (footOffset > 0 ? -footOffset : 0), 6, 6 + (footOffset > 0 ? footOffset : 0));
    ctx.fillRect(x + 22, y + 34 + (footOffset < 0 ? footOffset : 0), 6, 6 + (footOffset < 0 ? -footOffset : 0));
    
    const pickaxe = gameState.pickaxe;
    let handleColor = '#8B4513';
    let headColor = '#A0522D';
    if (pickaxe === 'IRON') headColor = '#C0C0C0';
    else if (pickaxe === 'STEEL') headColor = '#708090';
    else if (pickaxe === 'DIAMOND') headColor = '#00CED1';
    
    ctx.save();
    let pivotX = x + 24;
    let pivotY = bodyY + 22;
    let dirX = 1, dirY = 0;
    
    if (animationState.miningDirection === 'up') {
        pivotX = x + 20;
        pivotY = bodyY + 14;
        dirX = 0; dirY = -1;
    } else if (animationState.miningDirection === 'down') {
        pivotX = x + 20;
        pivotY = bodyY + 30;
        dirX = 0; dirY = 1;
    } else if (animationState.miningDirection === 'left') {
        pivotX = x + 12;
        pivotY = bodyY + 22;
        dirX = -1; dirY = 0;
    } else {
        pivotX = x + 28;
        pivotY = bodyY + 22;
        dirX = 1; dirY = 0;
    }
    
    ctx.translate(pivotX, pivotY);
    const baseAngle = Math.atan2(dirY, dirX);
    ctx.rotate(baseAngle + swingAngle * (animationState.miningDirection === 'left' ? -1 : 1));
    
    const handleLen = 16;
    ctx.fillStyle = handleColor;
    ctx.fillRect(-2, -2, handleLen, 4);
    
    ctx.fillStyle = headColor;
    ctx.fillRect(handleLen - 2, -8, 10, 6);
    ctx.fillRect(handleLen - 2, 2, 10, 6);
    ctx.fillRect(handleLen + 2, -10, 4, 20);
    
    if (swingProgress > 0.3 && swingProgress < 0.7) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.5 - Math.abs(swingProgress - 0.5)) * 1.5})`;
        ctx.fillRect(handleLen + 2, -10, 4, 20);
    }
    
    ctx.restore();
}

function drawGridOverlay() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
}

// ==================== 输入处理 ====================
canvas.addEventListener('click', (e) => {
    if (gameState.isDead) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    const playerRow = gameState.player.row;
    const startRow = playerRow - Math.floor(VISIBLE_ROWS / 2);
    
    const col = Math.floor(clickX / BLOCK_SIZE);
    const row = startRow + Math.floor(clickY / BLOCK_SIZE);
    
    if (col < 0 || col >= COLS || row < 0) return;
    
    if (col === gameState.player.col && row === gameState.player.row) {
        return;
    }
    
    if (isAdjacentToPlayer(col, row)) {
        const block = getBlock(col, row);
        if (block.type === BLOCK_TYPES.AIR.id) {
            movePlayer(col, row);
            updateUI();
            saveGame();
        } else {
            mineBlock(col, row);
        }
    } else {
        showMessage('⚠️ 太远了！只能操作相邻方块');
        playSound('denied');
    }
});

// ==================== 按钮事件 ====================
document.getElementById('shopBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    openShop();
});
document.getElementById('useBombBtn').addEventListener('click', useBomb);
document.getElementById('useTeleportBtn').addEventListener('click', useTeleport);
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('确定要重新开始吗？所有进度将丢失！')) {
        deleteSave();
        resetGame();
    }
});

document.getElementById('closeShop').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('shopModal').classList.add('hidden');
});

document.getElementById('shopModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('shopModal')) {
        document.getElementById('shopModal').classList.add('hidden');
    }
});

document.getElementById('shopModal').querySelector('.modal-content').addEventListener('click', (e) => {
    e.stopPropagation();
});

document.getElementById('closeChest').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('chestModal').classList.add('hidden');
    updateUI();
    saveGame();
});

document.getElementById('chestModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('chestModal')) {
        document.getElementById('chestModal').classList.add('hidden');
        updateUI();
        saveGame();
    }
});

document.getElementById('respawnBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('deathModal').classList.add('hidden');
    deleteSave();
    resetGame();
});

document.querySelectorAll('.shop-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        switch (action) {
            case 'sellAll': sellAll(); break;
            case 'refuel': refuel(); break;
            case 'upgradeIron': upgradePickaxe('IRON'); break;
            case 'upgradeSteel': upgradePickaxe('STEEL'); break;
            case 'upgradeDiamond': upgradePickaxe('DIAMOND'); break;
            case 'upgradeTank': upgradeTank(); break;
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('shopModal').classList.add('hidden');
        document.getElementById('chestModal').classList.add('hidden');
        return;
    }
    
    if (gameState.isDead) return;
    
    const shopVisible = !document.getElementById('shopModal').classList.contains('hidden');
    const chestVisible = !document.getElementById('chestModal').classList.contains('hidden');
    if (shopVisible || chestVisible) return;
    
    const pc = gameState.player.col;
    const pr = gameState.player.row;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (movePlayer(pc, pr - 1)) {
                updateUI();
                saveGame();
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (movePlayer(pc, pr + 1)) {
                updateUI();
                saveGame();
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (movePlayer(pc - 1, pr)) {
                updateUI();
                saveGame();
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (movePlayer(pc + 1, pr)) {
                updateUI();
                saveGame();
            }
            break;
        case '1':
            mineBlock(pc, pr - 1);
            break;
        case '2':
            mineBlock(pc, pr + 1);
            break;
        case '3':
            mineBlock(pc - 1, pr);
            break;
        case '4':
            mineBlock(pc + 1, pr);
            break;
        case 'b':
        case 'B':
            useBomb();
            break;
        case 't':
        case 'T':
            useTeleport();
            break;
        case 'e':
        case 'E':
            openShop();
            break;
    }
});

// ==================== 游戏初始化 ====================
function resetGame() {
    gameState = createInitialState();
    
    for (let col = 0; col < COLS; col++) {
        if (col === Math.floor(COLS / 2)) {
            setBlock(col, 0, BLOCK_TYPES.AIR.id);
        } else {
            setBlock(col, 0, BLOCK_TYPES.DIRT.id);
        }
    }
    
    updateUI();
    saveGame();
}

function initGame() {
    if (!loadGame()) {
        resetGame();
    } else {
        if (!gameState.inventory) gameState.inventory = { dirt: 0, stone: 0, goldOre: 0, diamond: 0 };
        if (!gameState.items) gameState.items = { shield: 0, bomb: 0, teleport: 0 };
        if (!gameState.openedChests) gameState.openedChests = {};
        updateUI();
    }
    
    showMessage('🎮 点击相邻方块移动或挖掘 | WASD/方向键移动 | 1/2/3/4 挖掘上下左右');
}

function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

initGame();
gameLoop();
