const GRID_WIDTH = 15;
const GRID_HEIGHT = 13;
const CELL_SIZE = 40;

const TILE = {
    EMPTY: 0,
    HARD_WALL: 1,
    SOFT_WALL: 2,
    DOOR: 3
};

const ENEMY_TYPE = {
    BAT: { hp: 1, speed: 2, color: '#FFD700', tracking: false, passSoft: false, name: '蝙蝠' },
    DEVIL: { hp: 2, speed: 1.5, color: '#FF4444', tracking: true, passSoft: false, name: '红魔鬼' },
    GHOST: { hp: 1, speed: 1.8, color: '#9944FF', tracking: false, passSoft: true, name: '幽灵' }
};

const POWERUP_TYPE = {
    FIRE: { emoji: '🔥', color: '#FF6600' },
    BOMB: { emoji: '💣', color: '#333333' },
    SPEED: { emoji: '👟', color: '#00AA00' },
    LIFE: { emoji: '❤️', color: '#FF0000' },
    WALL_PASS: { emoji: '⭐', color: '#FFD700' }
};

const STORAGE_KEY = 'bomberman_game';

let canvas, ctx;
let gameState = {
    status: 'menu',
    level: 1,
    score: 0,
    map: [],
    player: null,
    enemies: [],
    bombs: [],
    explosions: [],
    powerups: [],
    keys: {}
};

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = GRID_WIDTH * CELL_SIZE;
    canvas.height = GRID_HEIGHT * CELL_SIZE;
    
    setupEventListeners();
    checkSavedGame();
    gameLoop();
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;
        if (e.key === 'p' || e.key === 'P') {
            if (gameState.status === 'playing') pauseGame();
            else if (gameState.status === 'paused') resumeGame();
        }
        if (e.key === ' ') e.preventDefault();
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });
    
    document.getElementById('startBtn').addEventListener('click', startNewGame);
    document.getElementById('loadBtn').addEventListener('click', loadGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('restartBtn').addEventListener('click', startNewGame);
    document.getElementById('quitBtn').addEventListener('click', quitToMenu);
    document.getElementById('retryBtn').addEventListener('click', startNewGame);
    document.getElementById('homeBtn').addEventListener('click', quitToMenu);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
}

function checkSavedGame() {
    const saved = localStorage.getItem(STORAGE_KEY);
    document.getElementById('loadBtn').style.display = saved ? 'block' : 'none';
}

function generateMap(level) {
    const map = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
                map[y][x] = TILE.HARD_WALL;
            } else if (x % 2 === 0 && y % 2 === 0) {
                map[y][x] = TILE.HARD_WALL;
            } else {
                map[y][x] = TILE.EMPTY;
            }
        }
    }
    
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
            if (map[y][x] === TILE.EMPTY) {
                if (x <= 3 && y <= 3) continue;
                if (Math.random() < 0.6 + level * 0.02) {
                    map[y][x] = TILE.SOFT_WALL;
                }
            }
        }
    }
    
    let doorPlaced = false;
    let attempts = 0;
    while (!doorPlaced && attempts < 1000) {
        const dx = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
        const dy = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
        if (map[dy][dx] === TILE.SOFT_WALL || map[dy][dx] === TILE.EMPTY) {
            map[dy][dx] = TILE.DOOR;
            doorPlaced = true;
        }
        attempts++;
    }
    
    if (!doorPlaced) {
        map[GRID_HEIGHT - 2][GRID_WIDTH - 2] = TILE.DOOR;
    }
    
    return map;
}

function createPlayer() {
    return {
        x: CELL_SIZE + CELL_SIZE / 2,
        y: CELL_SIZE + CELL_SIZE / 2,
        speed: 3,
        lives: 3,
        maxBombs: 1,
        currentBombs: 0,
        fireRange: 1,
        wallPass: false,
        wallPassTimer: 0,
        invincible: false,
        invincibleTimer: 0
    };
}

function generateEnemies(level) {
    const enemies = [];
    const enemyCount = Math.min(3 + level, 10);
    const types = ['BAT', 'DEVIL', 'GHOST'];
    
    for (let i = 0; i < enemyCount; i++) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 200) {
            const ex = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
            const ey = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
            const tile = gameState.map[ey][ex];
            
            if (ex <= 4 && ey <= 4) {
                attempts++;
                continue;
            }
            
            if (tile === TILE.EMPTY) {
                const typeIndex = Math.min(Math.floor(Math.random() * (1 + level / 3)), 2);
                const type = types[typeIndex];
                const enemyType = ENEMY_TYPE[type];
                
                enemies.push({
                    x: ex * CELL_SIZE + CELL_SIZE / 2,
                    y: ey * CELL_SIZE + CELL_SIZE / 2,
                    type: type,
                    hp: enemyType.hp,
                    maxHp: enemyType.hp,
                    speed: enemyType.speed,
                    dx: (Math.random() - 0.5) * 2,
                    dy: (Math.random() - 0.5) * 2,
                    moveTimer: 0
                });
                placed = true;
            }
            attempts++;
        }
    }
    
    return enemies;
}

function startNewGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.map = generateMap(1);
    gameState.player = createPlayer();
    gameState.enemies = generateEnemies(1);
    gameState.bombs = [];
    gameState.explosions = [];
    gameState.powerups = [];
    gameState.status = 'playing';
    
    hideAllOverlays();
    updateUI();
    saveGame();
}

function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.level = data.level || 1;
            gameState.score = data.score || 0;
            gameState.map = data.map || [];
            gameState.player = data.player || null;
            gameState.enemies = data.enemies || [];
            gameState.bombs = data.bombs || [];
            gameState.explosions = data.explosions || [];
            gameState.powerups = data.powerups || [];
            gameState.status = 'playing';
            hideAllOverlays();
            updateUI();
        } catch (e) {
            console.error('加载存档失败:', e);
            startNewGame();
        }
    }
}

function saveGame() {
    const saveData = {
        level: gameState.level,
        score: gameState.score,
        map: gameState.map,
        player: gameState.player,
        enemies: gameState.enemies,
        bombs: gameState.bombs,
        explosions: gameState.explosions,
        powerups: gameState.powerups
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

function pauseGame() {
    if (gameState.status === 'playing') {
        gameState.status = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        saveGame();
    }
}

function resumeGame() {
    if (gameState.status === 'paused') {
        gameState.status = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }
}

function quitToMenu() {
    gameState.status = 'menu';
    hideAllOverlays();
    document.getElementById('startScreen').classList.remove('hidden');
    checkSavedGame();
}

function nextLevel() {
    gameState.level++;
    gameState.map = generateMap(gameState.level);
    gameState.player.x = CELL_SIZE + CELL_SIZE / 2;
    gameState.player.y = CELL_SIZE + CELL_SIZE / 2;
    gameState.player.currentBombs = 0;
    gameState.enemies = generateEnemies(gameState.level);
    gameState.bombs = [];
    gameState.explosions = [];
    gameState.powerups = [];
    gameState.status = 'playing';
    
    hideAllOverlays();
    updateUI();
    saveGame();
}

function gameOver() {
    gameState.status = 'gameover';
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    localStorage.removeItem(STORAGE_KEY);
}

function levelComplete() {
    gameState.status = 'levelcomplete';
    gameState.score += 1000 * gameState.level;
    document.getElementById('levelScore').textContent = gameState.score;
    document.getElementById('levelCompleteScreen').classList.remove('hidden');
    saveGame();
}

function hideAllOverlays() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelCompleteScreen').classList.add('hidden');
}

function updateUI() {
    if (gameState.player) {
        document.getElementById('lives').textContent = gameState.player.lives;
        document.getElementById('bombs').textContent = gameState.player.maxBombs - gameState.player.currentBombs;
        document.getElementById('fire').textContent = gameState.player.fireRange;
    }
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('score').textContent = gameState.score;
}

function getGridX(pixelX) {
    return Math.floor(pixelX / CELL_SIZE);
}

function getGridY(pixelY) {
    return Math.floor(pixelY / CELL_SIZE);
}

function canMoveToGrid(gx, gy, passSoft = false) {
    if (!gameState.map || gameState.map.length === 0) return false;
    
    if (gx < 1 || gx >= GRID_WIDTH - 1 || gy < 1 || gy >= GRID_HEIGHT - 1) return false;
    
    const tile = gameState.map[gy][gx];
    if (tile === TILE.HARD_WALL) return false;
    if (tile === TILE.SOFT_WALL && !passSoft) return false;
    if (tile === TILE.DOOR && gameState.enemies && gameState.enemies.length > 0) return false;
    
    return true;
}

function canMoveTo(x, y, passSoft = false) {
    const collisionRadius = CELL_SIZE * 0.35;
    
    const checkPoints = [
        { x: x - collisionRadius, y: y - collisionRadius },
        { x: x + collisionRadius, y: y - collisionRadius },
        { x: x - collisionRadius, y: y + collisionRadius },
        { x: x + collisionRadius, y: y + collisionRadius },
        { x: x, y: y - collisionRadius },
        { x: x, y: y + collisionRadius },
        { x: x - collisionRadius, y: y },
        { x: x + collisionRadius, y: y }
    ];
    
    for (const point of checkPoints) {
        const gx = getGridX(point.x);
        const gy = getGridY(point.y);
        
        if (gx < 1 || gx >= GRID_WIDTH - 1 || gy < 1 || gy >= GRID_HEIGHT - 1) {
            return false;
        }
        
        if (!canMoveToGrid(gx, gy, passSoft)) {
            return false;
        }
    }
    
    if (gameState.bombs && gameState.player) {
        const playerGx = getGridX(gameState.player.x);
        const playerGy = getGridY(gameState.player.y);
        const targetGx = getGridX(x);
        const targetGy = getGridY(y);
        
        for (const bomb of gameState.bombs) {
            const bgx = getGridX(bomb.x);
            const bgy = getGridY(bomb.y);
            if (bgx === targetGx && bgy === targetGy) {
                if (bgx !== playerGx || bgy !== playerGy) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

function updatePlayer(deltaTime) {
    if (!gameState.player) return;
    const player = gameState.player;
    let dx = 0, dy = 0;
    
    if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['W']) dy = -1;
    if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['S']) dy = 1;
    if (gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) dx = -1;
    if (gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) dx = 1;
    
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    const moveSpeed = player.speed * deltaTime * 60;
    
    const newX = player.x + dx * moveSpeed;
    const newY = player.y + dy * moveSpeed;
    
    if (canMoveTo(newX, player.y, player.wallPass)) {
        player.x = newX;
    }
    if (canMoveTo(player.x, newY, player.wallPass)) {
        player.y = newY;
    }
    
    if (gameState.keys[' '] && !gameState.bombJustPlaced) {
        placeBomb();
        gameState.bombJustPlaced = true;
    }
    if (!gameState.keys[' ']) {
        gameState.bombJustPlaced = false;
    }
    
    if (player.wallPass) {
        player.wallPassTimer -= deltaTime;
        if (player.wallPassTimer <= 0) {
            player.wallPass = false;
        }
    }
    
    if (player.invincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
    
    checkPowerupPickup();
}

function placeBomb() {
    if (!gameState.player) return;
    const player = gameState.player;
    if (player.currentBombs >= player.maxBombs) return;
    
    const gx = getGridX(player.x);
    const gy = getGridY(player.y);
    
    if (gameState.bombs) {
        for (const bomb of gameState.bombs) {
            if (getGridX(bomb.x) === gx && getGridY(bomb.y) === gy) {
                return;
            }
        }
    }
    
    gameState.bombs.push({
        x: gx * CELL_SIZE + CELL_SIZE / 2,
        y: gy * CELL_SIZE + CELL_SIZE / 2,
        timer: 3,
        range: player.fireRange
    });
    
    player.currentBombs++;
}

function updateBombs(deltaTime) {
    if (!gameState.bombs || gameState.bombs.length === 0) return;
    
    for (let i = gameState.bombs.length - 1; i >= 0; i--) {
        const bomb = gameState.bombs[i];
        bomb.timer -= deltaTime;
        
        if (bomb.timer <= 0) {
            createExplosion(bomb);
            gameState.bombs.splice(i, 1);
            if (gameState.player) {
                gameState.player.currentBombs--;
            }
        }
    }
}

function createExplosion(bomb) {
    if (!gameState.map || gameState.map.length === 0) return;
    
    const gx = getGridX(bomb.x);
    const gy = getGridY(bomb.y);
    const range = bomb.range;
    
    addExplosionTile(gx, gy);
    
    const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
    ];
    
    for (const dir of directions) {
        for (let r = 1; r <= range; r++) {
            const nx = gx + dir.dx * r;
            const ny = gy + dir.dy * r;
            
            if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_HEIGHT) break;
            
            const tile = gameState.map[ny][nx];
            if (tile === TILE.HARD_WALL) break;
            
            addExplosionTile(nx, ny);
            
            if (tile === TILE.SOFT_WALL) {
                gameState.map[ny][nx] = TILE.EMPTY;
                gameState.score += 10;
                
                if (Math.random() < 0.3) {
                    spawnPowerup(nx, ny);
                }
                break;
            }
            
            if (tile === TILE.DOOR) {
                break;
            }
        }
    }
}

function addExplosionTile(gx, gy) {
    if (!gameState.explosions) gameState.explosions = [];
    gameState.explosions.push({
        x: gx * CELL_SIZE + CELL_SIZE / 2,
        y: gy * CELL_SIZE + CELL_SIZE / 2,
        timer: 0.5
    });
}

function updateExplosions(deltaTime) {
    if (!gameState.explosions || gameState.explosions.length === 0) return;
    
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        gameState.explosions[i].timer -= deltaTime;
        if (gameState.explosions[i].timer <= 0) {
            gameState.explosions.splice(i, 1);
        }
    }
    
    checkExplosionDamage();
}

function checkExplosionDamage() {
    if (!gameState.player) return;
    const player = gameState.player;
    
    if (!player.invincible) {
        for (const exp of gameState.explosions) {
            const dist = Math.hypot(player.x - exp.x, player.y - exp.y);
            if (dist < CELL_SIZE * 0.7) {
                playerHit();
                break;
            }
        }
    }
    
    if (gameState.enemies) {
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            for (const exp of gameState.explosions) {
                const dist = Math.hypot(enemy.x - exp.x, enemy.y - exp.y);
                if (dist < CELL_SIZE * 0.7) {
                    enemy.hp--;
                    if (enemy.hp <= 0) {
                        gameState.enemies.splice(i, 1);
                        gameState.score += 100;
                        break;
                    }
                }
            }
        }
    }
}

function playerHit() {
    if (!gameState.player) return;
    
    gameState.player.lives--;
    gameState.player.invincible = true;
    gameState.player.invincibleTimer = 2;
    
    if (gameState.player.lives <= 0) {
        gameOver();
    }
    
    updateUI();
}

function updateEnemies(deltaTime) {
    if (!gameState.enemies || gameState.enemies.length === 0 || !gameState.player) return;
    
    const player = gameState.player;
    
    for (const enemy of gameState.enemies) {
        const enemyType = ENEMY_TYPE[enemy.type];
        
        enemy.moveTimer += deltaTime;
        
        if (enemyType.tracking) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                enemy.dx = dx / dist;
                enemy.dy = dy / dist;
            }
        } else if (enemy.moveTimer > 1) {
            enemy.dx = (Math.random() - 0.5) * 2;
            enemy.dy = (Math.random() - 0.5) * 2;
            enemy.moveTimer = 0;
        }
        
        const moveSpeed = enemy.speed * deltaTime * 60;
        const newX = enemy.x + enemy.dx * moveSpeed;
        const newY = enemy.y + enemy.dy * moveSpeed;
        
        if (canMoveTo(newX, enemy.y, enemyType.passSoft)) {
            enemy.x = newX;
        } else {
            enemy.dx = -enemy.dx;
        }
        if (canMoveTo(enemy.x, newY, enemyType.passSoft)) {
            enemy.y = newY;
        } else {
            enemy.dy = -enemy.dy;
        }
        
        if (!player.invincible) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < CELL_SIZE * 0.7) {
                playerHit();
            }
        }
    }
}

function spawnPowerup(gx, gy) {
    if (!gameState.powerups) gameState.powerups = [];
    
    const types = Object.keys(POWERUP_TYPE);
    const type = types[Math.floor(Math.random() * types.length)];
    
    gameState.powerups.push({
        x: gx * CELL_SIZE + CELL_SIZE / 2,
        y: gy * CELL_SIZE + CELL_SIZE / 2,
        type: type
    });
}

function checkPowerupPickup() {
    if (!gameState.player || !gameState.powerups || gameState.powerups.length === 0) return;
    
    const player = gameState.player;
    
    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
        const powerup = gameState.powerups[i];
        const dist = Math.hypot(player.x - powerup.x, player.y - powerup.y);
        
        if (dist < CELL_SIZE * 0.7) {
            applyPowerup(powerup.type);
            gameState.powerups.splice(i, 1);
            gameState.score += 50;
        }
    }
}

function applyPowerup(type) {
    if (!gameState.player) return;
    const player = gameState.player;
    
    switch (type) {
        case 'FIRE':
            player.fireRange++;
            break;
        case 'BOMB':
            player.maxBombs++;
            break;
        case 'SPEED':
            player.speed += 0.5;
            break;
        case 'LIFE':
            player.lives++;
            break;
        case 'WALL_PASS':
            player.wallPass = true;
            player.wallPassTimer = 10;
            break;
    }
    
    updateUI();
}

function checkDoor() {
    if (!gameState.player || !gameState.map || gameState.map.length === 0) return;
    
    const player = gameState.player;
    const gx = getGridX(player.x);
    const gy = getGridY(player.y);
    
    if (gx >= 0 && gx < GRID_WIDTH && gy >= 0 && gy < GRID_HEIGHT) {
        if (gameState.map[gy][gx] === TILE.DOOR) {
            if (gameState.enemies && gameState.enemies.length === 0) {
                levelComplete();
            }
        }
    }
}

function draw() {
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.status === 'menu') return;
    
    if (gameState.map && gameState.map.length > 0) {
        drawMap();
    }
    if (gameState.powerups && gameState.powerups.length > 0) {
        drawPowerups();
    }
    if (gameState.bombs && gameState.bombs.length > 0) {
        drawBombs();
    }
    if (gameState.explosions && gameState.explosions.length > 0) {
        drawExplosions();
    }
    if (gameState.enemies && gameState.enemies.length > 0) {
        drawEnemies();
    }
    if (gameState.player) {
        drawPlayer();
    }
}

function drawMap() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = gameState.map[y][x];
            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;
            
            ctx.fillStyle = '#3d3d5c';
            ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            
            ctx.strokeStyle = '#2a2a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            
            if (tile === TILE.HARD_WALL) {
                drawHardWall(px, py);
            } else if (tile === TILE.SOFT_WALL) {
                drawSoftWall(px, py);
            } else if (tile === TILE.DOOR) {
                drawDoor(px, py);
            }
        }
    }
}

function drawHardWall(px, py) {
    ctx.fillStyle = '#5a5a7a';
    ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    
    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    
    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 5, py + CELL_SIZE / 2);
    ctx.lineTo(px + CELL_SIZE - 5, py + CELL_SIZE / 2);
    ctx.moveTo(px + CELL_SIZE / 2, py + 5);
    ctx.lineTo(px + CELL_SIZE / 2, py + CELL_SIZE - 5);
    ctx.stroke();
}

function drawSoftWall(px, py) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(px + 5, py + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 8);
    ctx.lineTo(px + CELL_SIZE - 8, py + CELL_SIZE - 8);
    ctx.moveTo(px + CELL_SIZE - 8, py + 8);
    ctx.lineTo(px + 8, py + CELL_SIZE - 8);
    ctx.stroke();
}

function drawDoor(px, py) {
    ctx.fillStyle = '#654321';
    ctx.fillRect(px + 6, py + 4, CELL_SIZE - 12, CELL_SIZE - 8);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + 8, py + 6, CELL_SIZE - 16, CELL_SIZE - 12);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + CELL_SIZE - 14, py + CELL_SIZE / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    if (gameState.enemies && gameState.enemies.length === 0) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(px + 4, py + 2, CELL_SIZE - 8, CELL_SIZE - 4);
    }
}

function drawPlayer() {
    if (!gameState.player) return;
    const player = gameState.player;
    const size = CELL_SIZE * 0.85;
    const x = player.x;
    const y = player.y;
    
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(x - 7, y + 2, 14, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#1565C0';
    ctx.beginPath();
    ctx.roundRect(x - 6, y + 12, 5, 5, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 12, 5, 5, 1);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 8, y - 6, 16, 13);
    
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x - 8, y - 6, 16, 6);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 1, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 3, y - 1, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4, y - 2, 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(x - 5, y + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5, y + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y + 3, 3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 8, 3, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 7, 2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.quadraticCurveTo(x + 2, y - 16, x + 1, y - 18);
    ctx.stroke();
    
    ctx.fillStyle = '#FF6600';
    const flicker = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x + 1, y - 19, 2 + flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(x + 1, y - 19, 1 + flicker * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x - 10, y + 6, 3, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 6, 3, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#1976D2';
    ctx.beginPath();
    ctx.ellipse(x - 5, y + 15, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 15, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
    
    if (player.wallPass) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size / 2 + 7, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawBombs() {
    for (const bomb of gameState.bombs) {
        const size = CELL_SIZE * 0.6;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(bomb.x - 3, bomb.y - 3, size / 4, 0, Math.PI * 2);
        ctx.fill();
        
        const flicker = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        ctx.fillStyle = `rgb(${255}, ${Math.floor(100 + flicker * 100)}, 0)`;
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y - size / 2 - 5, 4 + flicker * 2, 0, Math.PI * 2);
        ctx.fill();
        
        const timeLeft = Math.ceil(bomb.timer);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeLeft.toString(), bomb.x, bomb.y + 5);
    }
}

function drawExplosions() {
    for (const exp of gameState.explosions) {
        const size = CELL_SIZE * 0.9;
        const progress = 1 - exp.timer / 0.5;
        
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, size / 2);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.3, '#FF8800');
        gradient.addColorStop(0.6, '#FF4400');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, size / 2 * (0.5 + progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawEnemies() {
    for (const enemy of gameState.enemies) {
        const enemyType = ENEMY_TYPE[enemy.type];
        const size = CELL_SIZE * 0.6;
        
        ctx.fillStyle = enemyType.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(enemy.x - 5, enemy.y - 3, 4, 0, Math.PI * 2);
        ctx.arc(enemy.x + 5, enemy.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(enemy.x - 5, enemy.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + 5, enemy.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 12, enemy.y - size / 2 - 8, 24, 4);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(enemy.x - 12, enemy.y - size / 2 - 8, 24 * (enemy.hp / enemy.maxHp), 4);
        }
    }
}

function drawPowerups() {
    for (const powerup of gameState.powerups) {
        const powerupType = POWERUP_TYPE[powerup.type];
        const bounce = Math.sin(Date.now() * 0.005) * 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y + bounce, CELL_SIZE * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerupType.emoji, powerup.x, powerup.y + bounce);
    }
}

let lastTime = 0;

function gameLoop(currentTime = 0) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (gameState.status === 'playing') {
        updatePlayer(deltaTime);
        updateBombs(deltaTime);
        updateExplosions(deltaTime);
        updateEnemies(deltaTime);
        checkDoor();
        updateUI();
        
        if (Math.floor(currentTime / 1000) !== Math.floor((currentTime - deltaTime * 1000) / 1000)) {
            saveGame();
        }
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

window.onload = init;