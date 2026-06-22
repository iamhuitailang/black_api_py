const LevelConfig = {
    totalLength: 250,
    enemyWaveInterval: 15,
    enemiesPerWave: { min: 3, max: 5 },
    sniperPositions: [50, 100, 150, 200, 250],
    damage: {
        ambushStanding: 25,
        ambushCrouching: 12.5,
    },
    reloadTime: 3000,
    playerSpeed: 0.15,
    aimZoom: 2.5,
    bulletSpeed: 1.5,
    enemyShootRange: 20,
    ambushTriggerRange: 8,
    enemyHealth: 30,
    enemyPatrolRange: 5,
    enemyPatrolSpeed: 0.05,
    tilesPerScreen: 50,
    cellWidth: 24,
    cellHeight: 60
};

const EnemyType = {
    PATROL: 'patrol',
    AMBUSH: 'ambush'
};

const SAVE_KEY = 'shooter_game_save_v1';
const SAVE_INTERVAL = 500;
let lastSaveTime = 0;

const GameState = {
    playerPosition: 0,
    health: 100,
    maxHealth: 100,
    isCrouching: false,
    isAiming: false,
    ammoInClip: 12,
    maxAmmoClip: 12,
    isReloading: false,
    reloadStartTime: 0,
    reloadProgress: 0,
    gameTime: 0,
    startTime: 0,
    isGameOver: false,
    isWin: false,
    availableSnipers: [true, true, true, true, true],
    sniperUsed: [],
    enemies: [],
    bullets: [],
    enemyBullets: [],
    kills: 0,
    score: 0,
    playerName: '',
    lastDamageTime: 0,
    cameraOffset: 0
};

const keys = {
    left: false,
    right: false,
    down: false,
    space: false
};

let canvas, ctx;
let animationId;
let lastTime = 0;

const elements = {};

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    elements.startScreen = document.getElementById('startScreen');
    elements.gameWrapper = document.getElementById('gameWrapper');
    elements.gameOverScreen = document.getElementById('gameOverScreen');
    elements.startBtn = document.getElementById('startBtn');
    elements.restartBtn = document.getElementById('restartBtn');
    elements.menuBtn = document.getElementById('menuBtn');
    elements.playerNameInput = document.getElementById('playerName');
    elements.inputError = document.getElementById('inputError');
    elements.resumeSection = document.getElementById('resumeSection');
    elements.resumeBtn = document.getElementById('resumeBtn');
    elements.newgameBtn = document.getElementById('newgameBtn');
    
    elements.healthFill = document.getElementById('healthFill');
    elements.healthValue = document.getElementById('healthValue');
    elements.posValue = document.getElementById('posValue');
    elements.timerValue = document.getElementById('timerValue');
    elements.ammoCurrent = document.getElementById('ammoCurrent');
    elements.crouchIndicator = document.getElementById('crouchIndicator');
    elements.reloadBar = document.getElementById('reloadBar');
    elements.reloadFill = document.getElementById('reloadFill');
    elements.killValue = document.getElementById('killValue');
    elements.scopeOverlay = document.getElementById('scopeOverlay');
    elements.damageFlash = document.getElementById('damageFlash');
    elements.muzzleFlash = document.getElementById('muzzleFlash');
    
    elements.resultTitle = document.getElementById('resultTitle');
    elements.finalHealth = document.getElementById('finalHealth');
    elements.finalTime = document.getElementById('finalTime');
    elements.finalKills = document.getElementById('finalKills');
    elements.finalScore = document.getElementById('finalScore');
    elements.finalRank = document.getElementById('finalRank');
    elements.leaderboardList = document.getElementById('leaderboardList');
    
    bindEvents();
    
    if (!tryAutoResumeGame()) {
        checkSavedGame();
    }
}

function bindEvents() {
    elements.startBtn.addEventListener('click', handleStartClick);
    elements.restartBtn.addEventListener('click', () => {
        if (GameState.playerName) {
            startGame(GameState.playerName);
        } else {
            showMenu();
        }
    });
    elements.menuBtn.addEventListener('click', showMenu);
    elements.resumeBtn.addEventListener('click', resumeGame);
    elements.newgameBtn.addEventListener('click', () => {
        clearGameSave();
        elements.resumeSection.style.display = 'none';
        elements.startBtn.style.display = 'inline-block';
        elements.playerNameInput.value = '';
        elements.playerNameInput.focus();
    });
    
    elements.playerNameInput.addEventListener('input', () => {
        elements.playerNameInput.classList.remove('error');
        elements.inputError.style.display = 'none';
    });
    
    elements.playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleStartClick();
        }
    });
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    canvas.addEventListener('click', handleCanvasClick);
    
    window.addEventListener('beforeunload', saveGameState);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) saveGameState();
    });
}

function tryAutoResumeGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return false;
    
    try {
        const data = JSON.parse(saved);
        if (!data || !data.playerName || data.isGameOver) {
            clearGameSave();
            return false;
        }
        resumeGame();
        return true;
    } catch (e) {
        clearGameSave();
        return false;
    }
}

function handleStartClick() {
    const playerName = elements.playerNameInput.value.trim();
    if (!playerName) {
        elements.playerNameInput.classList.add('error');
        elements.inputError.style.display = 'block';
        elements.playerNameInput.focus();
        return;
    }
    startGame();
}

function checkSavedGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data && data.playerName && !data.isGameOver) {
                elements.playerNameInput.value = data.playerName;
                elements.resumeSection.style.display = 'block';
                elements.startBtn.style.display = 'none';
                return;
            }
        } catch (e) {
            clearGameSave();
        }
    }
    elements.resumeSection.style.display = 'none';
    elements.startBtn.style.display = 'inline-block';
}

function saveGameState() {
    if (GameState.isGameOver) {
        clearGameSave();
        return;
    }
    
    try {
        const saveData = {
            playerPosition: GameState.playerPosition,
            health: GameState.health,
            isCrouching: GameState.isCrouching,
            isAiming: GameState.isAiming,
            ammoInClip: GameState.ammoInClip,
            isReloading: GameState.isReloading,
            reloadStartTime: GameState.reloadStartTime,
            gameTime: GameState.gameTime,
            startTime: GameState.startTime,
            isGameOver: GameState.isGameOver,
            availableSnipers: GameState.availableSnipers,
            sniperUsed: GameState.sniperUsed,
            enemies: GameState.enemies,
            bullets: GameState.bullets,
            enemyBullets: GameState.enemyBullets,
            kills: GameState.kills,
            playerName: GameState.playerName,
            lastDamageTime: GameState.lastDamageTime,
            cameraOffset: GameState.cameraOffset,
            savedAt: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

function clearGameSave() {
    localStorage.removeItem(SAVE_KEY);
    elements.resumeSection.style.display = 'none';
    elements.startBtn.style.display = 'inline-block';
}

function loadGameState() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return false;
    
    try {
        const data = JSON.parse(saved);
        if (!data || !data.playerName) return false;
        
        GameState.playerPosition = data.playerPosition || 0;
        GameState.health = data.health || 100;
        GameState.isCrouching = data.isCrouching || false;
        GameState.isAiming = data.isAiming || false;
        GameState.ammoInClip = data.ammoInClip ?? 12;
        GameState.isReloading = data.isReloading || false;
        GameState.reloadStartTime = data.reloadStartTime || 0;
        GameState.gameTime = data.gameTime || 0;
        GameState.startTime = Date.now() - (data.gameTime || 0) * 1000;
        GameState.isGameOver = false;
        GameState.availableSnipers = data.availableSnipers || [true, true, true, true, true];
        GameState.sniperUsed = data.sniperUsed || [];
        GameState.enemies = data.enemies || [];
        GameState.bullets = data.bullets || [];
        GameState.enemyBullets = data.enemyBullets || [];
        GameState.kills = data.kills || 0;
        GameState.playerName = data.playerName || '';
        GameState.lastDamageTime = data.lastDamageTime || 0;
        GameState.cameraOffset = data.cameraOffset || 0;
        
        return true;
    } catch (e) {
        console.error('Failed to load game state:', e);
        clearGameSave();
        return false;
    }
}

function resumeGame() {
    if (!loadGameState()) {
        startGame();
        return;
    }
    
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    elements.gameWrapper.style.display = 'block';
    
    elements.scopeOverlay.style.display = GameState.isAiming ? 'block' : 'none';
    elements.crouchIndicator.classList.toggle('active', GameState.isCrouching);
    if (GameState.isReloading) {
        elements.reloadBar.classList.add('active');
    }
    
    updateHUD();
    
    lastTime = performance.now();
    gameLoop(lastTime);
}

function handleKeyDown(e) {
    if (GameState.isGameOver) return;
    
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            keys.left = true;
            break;
        case 'd':
        case 'arrowright':
            keys.right = true;
            break;
        case 's':
        case 'arrowdown':
            if (!keys.down) {
                toggleCrouch();
            }
            keys.down = true;
            break;
        case ' ':
            e.preventDefault();
            if (!keys.space) {
                shoot();
            }
            keys.space = true;
            break;
        case 'r':
            reload();
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            keys.left = false;
            break;
        case 'd':
        case 'arrowright':
            keys.right = false;
            break;
        case 's':
        case 'arrowdown':
            keys.down = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
}

function handleCanvasClick(e) {
    if (GameState.isGameOver) return;
    if (!GameState.isAiming) return;
    shoot();
}

function startGame(playerName) {
    if (!playerName) {
        playerName = elements.playerNameInput.value.trim();
        if (!playerName) {
            elements.playerNameInput.classList.add('error');
            elements.inputError.style.display = 'block';
            elements.playerNameInput.focus();
            return;
        }
    }
    
    clearGameSave();
    
    GameState.playerPosition = 0;
    GameState.health = 100;
    GameState.isCrouching = false;
    GameState.isAiming = false;
    GameState.ammoInClip = 12;
    GameState.isReloading = false;
    GameState.reloadProgress = 0;
    GameState.gameTime = 0;
    GameState.startTime = Date.now();
    GameState.isGameOver = false;
    GameState.isWin = false;
    GameState.availableSnipers = [true, true, true, true, true];
    GameState.sniperUsed = [];
    GameState.enemies = [];
    GameState.bullets = [];
    GameState.enemyBullets = [];
    GameState.kills = 0;
    GameState.score = 0;
    GameState.playerName = playerName;
    GameState.cameraOffset = 0;
    
    keys.left = false;
    keys.right = false;
    keys.down = false;
    keys.space = false;
    
    generateEnemies();
    
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    elements.gameWrapper.style.display = 'block';
    
    updateHUD();
    
    lastTime = performance.now();
    lastSaveTime = 0;
    gameLoop(lastTime);
}

function showMenu() {
    elements.startScreen.style.display = 'block';
    elements.gameOverScreen.style.display = 'none';
    elements.gameWrapper.style.display = 'none';
    cancelAnimationFrame(animationId);
    
    if (!GameState.isGameOver) {
        saveGameState();
    }
    checkSavedGame();
}

function generateEnemies() {
    GameState.enemies = [];
    
    for (let pos = LevelConfig.enemyWaveInterval; pos < LevelConfig.totalLength; pos += LevelConfig.enemyWaveInterval) {
        const enemyCount = Math.floor(Math.random() * (LevelConfig.enemiesPerWave.max - LevelConfig.enemiesPerWave.min + 1)) + LevelConfig.enemiesPerWave.min;
        
        for (let i = 0; i < enemyCount; i++) {
            const offset = (Math.random() - 0.5) * 10;
            const type = Math.random() > 0.5 ? EnemyType.PATROL : EnemyType.AMBUSH;
            
            const enemy = {
                id: Date.now() + Math.random(),
                position: pos + offset,
                type: type,
                health: LevelConfig.enemyHealth,
                maxHealth: LevelConfig.enemyHealth,
                direction: Math.random() > 0.5 ? 1 : -1,
                basePosition: pos + offset,
                isHidden: type === EnemyType.AMBUSH,
                lastShootTime: 0,
                shootCooldown: 2000 + Math.random() * 1000
            };
            
            GameState.enemies.push(enemy);
        }
    }
}

function toggleCrouch() {
    const atSniperPosition = LevelConfig.sniperPositions.some(pos => 
        Math.abs(GameState.playerPosition - pos) < 2
    );
    
    if (atSniperPosition || GameState.isCrouching) {
        GameState.isCrouching = !GameState.isCrouching;
        GameState.isAiming = GameState.isCrouching;
        
        if (GameState.isCrouching) {
            const sniperIndex = LevelConfig.sniperPositions.findIndex(pos => 
                Math.abs(GameState.playerPosition - pos) < 2
            );
            if (sniperIndex >= 0 && !GameState.sniperUsed.includes(sniperIndex)) {
                GameState.sniperUsed.push(sniperIndex);
            }
        }
        
        elements.scopeOverlay.style.display = GameState.isAiming ? 'block' : 'none';
        elements.crouchIndicator.classList.toggle('active', GameState.isCrouching);
    }
}

function shoot() {
    if (GameState.isReloading) return;
    if (GameState.ammoInClip <= 0) {
        reload();
        return;
    }
    
    GameState.ammoInClip--;
    
    const bullet = {
        id: Date.now() + Math.random(),
        position: GameState.playerPosition + 1,
        speed: LevelConfig.bulletSpeed,
        direction: 1
    };
    GameState.bullets.push(bullet);
    
    elements.muzzleFlash.classList.add('active');
    setTimeout(() => elements.muzzleFlash.classList.remove('active'), 100);
    
    updateHUD();
}

function reload() {
    if (GameState.isReloading) return;
    if (GameState.ammoInClip === GameState.maxAmmoClip) return;
    
    GameState.isReloading = true;
    GameState.reloadStartTime = Date.now();
    GameState.isCrouching = false;
    GameState.isAiming = false;
    elements.scopeOverlay.style.display = 'none';
    elements.crouchIndicator.classList.remove('active');
    elements.reloadBar.classList.add('active');
}

function calculateScore() {
    const timeFactor = Math.max(0.5, 1.0 - Math.max(0, (GameState.gameTime - 300)) / 100);
    return Math.round(GameState.health * timeFactor * 100) / 100;
}

function respawn() {
    let respawnPos = 0;
    let usedSniperIndex = -1;
    
    for (let i = LevelConfig.sniperPositions.length - 1; i >= 0; i--) {
        if (GameState.availableSnipers[i] && LevelConfig.sniperPositions[i] < GameState.playerPosition) {
            respawnPos = LevelConfig.sniperPositions[i];
            usedSniperIndex = i;
            break;
        }
    }
    
    if (usedSniperIndex >= 0) {
        GameState.availableSnipers[usedSniperIndex] = false;
    }
    
    GameState.playerPosition = respawnPos;
    GameState.health = GameState.maxHealth;
    GameState.isCrouching = false;
    GameState.isAiming = false;
    GameState.ammoInClip = GameState.maxAmmoClip;
    GameState.isReloading = false;
    
    elements.scopeOverlay.style.display = 'none';
    elements.crouchIndicator.classList.remove('active');
    elements.reloadBar.classList.remove('active');
    
    if (respawnPos === 0 && !GameState.availableSnipers.some(s => s)) {
        endGame(false);
    }
}

function endGame(won) {
    GameState.isGameOver = true;
    GameState.isWin = won;
    GameState.score = calculateScore();
    
    cancelAnimationFrame(animationId);
    clearGameSave();
    
    submitScore();
}

async function submitScore() {
    try {
        const response = await fetch('/api/shooter/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: GameState.playerName,
                final_health: GameState.isWin ? Math.floor(GameState.health) : 0,
                time_used: GameState.gameTime,
                score: GameState.score,
                cleared: GameState.isWin,
                sniper_used: GameState.sniperUsed,
                enemies_killed: GameState.kills
            })
        });
        
        const result = await response.json();
        showGameOverScreen(result.data?.rank || '-');
    } catch (e) {
        console.error('Failed to submit score:', e);
        showGameOverScreen('-');
    }
}

async function loadLeaderboard(currentPlayerId = null) {
    try {
        const response = await fetch('/api/shooter/leaderboard/get?limit=10');
        const result = await response.json();
        
        if (result.code === 0 && result.data.entries) {
            renderLeaderboard(result.data.entries, currentPlayerId);
        }
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
        elements.leaderboardList.innerHTML = '<div class="loading">加载失败</div>';
    }
}

function renderLeaderboard(entries, currentPlayerId) {
    let html = `
        <div class="leaderboard-row header">
            <span>排名</span>
            <span>玩家</span>
            <span>得分</span>
            <span>用时</span>
        </div>
    `;
    
    entries.forEach((entry, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const isCurrent = entry.id === currentPlayerId;
        
        html += `
            <div class="leaderboard-row ${isCurrent ? 'current-player' : ''}">
                <span class="rank-num ${rankClass}">${entry.rank}</span>
                <span class="player-name">${entry.player_name}</span>
                <span class="player-score">${entry.score}</span>
                <span class="player-time">${formatTime(entry.time_used)}</span>
            </div>
        `;
    });
    
    if (entries.length === 0) {
        html = '<div class="loading">暂无记录</div>';
    }
    
    elements.leaderboardList.innerHTML = html;
}

function showGameOverScreen(rank) {
    elements.gameWrapper.style.display = 'none';
    elements.gameOverScreen.style.display = 'block';
    
    elements.resultTitle.textContent = GameState.isWin ? '任务完成' : '任务失败';
    elements.resultTitle.className = `result-title ${GameState.isWin ? 'victory' : 'defeat'}`;
    
    elements.finalHealth.textContent = Math.floor(GameState.health);
    elements.finalTime.textContent = formatTime(GameState.gameTime);
    elements.finalKills.textContent = GameState.kills;
    elements.finalScore.textContent = GameState.score.toFixed(2);
    elements.finalRank.textContent = rank;
    
    loadLeaderboard();
}

function gameLoop(currentTime) {
    if (GameState.isGameOver) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (currentTime - lastSaveTime >= SAVE_INTERVAL) {
        saveGameState();
        lastSaveTime = currentTime;
    }
    
    update(deltaTime);
    render();
    updateHUD();
    
    animationId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    GameState.gameTime = (Date.now() - GameState.startTime) / 1000;
    
    if (GameState.isReloading) {
        const elapsed = Date.now() - GameState.reloadStartTime;
        GameState.reloadProgress = Math.min(1, elapsed / LevelConfig.reloadTime);
        elements.reloadFill.style.width = (GameState.reloadProgress * 100) + '%';
        
        if (GameState.reloadProgress >= 1) {
            GameState.isReloading = false;
            GameState.ammoInClip = GameState.maxAmmoClip;
            GameState.reloadProgress = 0;
            elements.reloadBar.classList.remove('active');
        }
    }
    
    if (!GameState.isCrouching && !GameState.isReloading) {
        let speed = LevelConfig.playerSpeed * (deltaTime / 16.67);
        
        if (keys.right) {
            GameState.playerPosition = Math.min(LevelConfig.totalLength, GameState.playerPosition + speed);
        }
        if (keys.left) {
            GameState.playerPosition = Math.max(0, GameState.playerPosition - speed);
        }
    }
    
    if (GameState.playerPosition >= LevelConfig.totalLength) {
        endGame(true);
        return;
    }
    
    updateBullets(deltaTime);
    updateEnemyBullets(deltaTime);
    updateEnemies(deltaTime);
    checkCollisions();
    updateCamera();
}

function updateCamera() {
    const targetOffset = GameState.playerPosition - LevelConfig.tilesPerScreen / 2;
    GameState.cameraOffset += (targetOffset - GameState.cameraOffset) * 0.1;
    GameState.cameraOffset = Math.max(0, Math.min(LevelConfig.totalLength - LevelConfig.tilesPerScreen, GameState.cameraOffset));
}

function updateBullets(deltaTime) {
    const speed = LevelConfig.bulletSpeed * (deltaTime / 16.67);
    
    for (let i = GameState.bullets.length - 1; i >= 0; i--) {
        const bullet = GameState.bullets[i];
        bullet.position += speed * bullet.direction;
        
        if (bullet.position < 0 || bullet.position > LevelConfig.totalLength) {
            GameState.bullets.splice(i, 1);
        }
    }
}

function updateEnemyBullets(deltaTime) {
    const speed = LevelConfig.bulletSpeed * 0.8 * (deltaTime / 16.67);
    
    for (let i = GameState.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = GameState.enemyBullets[i];
        bullet.position += speed * bullet.direction;
        
        if (bullet.position < 0 || bullet.position > LevelConfig.totalLength) {
            GameState.enemyBullets.splice(i, 1);
        }
    }
}

function updateEnemies(deltaTime) {
    const now = Date.now();
    const speed = LevelConfig.enemyPatrolSpeed * (deltaTime / 16.67);
    
    for (const enemy of GameState.enemies) {
        if (enemy.health <= 0) continue;
        
        const distanceToPlayer = enemy.position - GameState.playerPosition;
        const absDistance = Math.abs(distanceToPlayer);
        
        if (enemy.type === EnemyType.PATROL) {
            enemy.position += enemy.direction * speed;
            
            if (Math.abs(enemy.position - enemy.basePosition) > LevelConfig.enemyPatrolRange) {
                enemy.direction *= -1;
            }
            
            if (absDistance < LevelConfig.enemyShootRange && distanceToPlayer > 0) {
                if (now - enemy.lastShootTime > enemy.shootCooldown) {
                    enemyShoot(enemy);
                    enemy.lastShootTime = now;
                }
            }
        } else if (enemy.type === EnemyType.AMBUSH) {
            if (enemy.isHidden) {
                if (absDistance < LevelConfig.ambushTriggerRange && distanceToPlayer > 0) {
                    enemy.isHidden = false;
                }
            } else {
                if (absDistance < LevelConfig.enemyShootRange && distanceToPlayer > 0) {
                    if (now - enemy.lastShootTime > enemy.shootCooldown) {
                        enemyShoot(enemy);
                        enemy.lastShootTime = now;
                    }
                }
            }
        }
    }
}

function enemyShoot(enemy) {
    const bullet = {
        id: Date.now() + Math.random(),
        position: enemy.position - 0.5,
        direction: -1,
        damage: GameState.isCrouching ? LevelConfig.damage.ambushCrouching : LevelConfig.damage.ambushStanding
    };
    GameState.enemyBullets.push(bullet);
}

function checkCollisions() {
    for (let i = GameState.bullets.length - 1; i >= 0; i--) {
        const bullet = GameState.bullets[i];
        
        for (const enemy of GameState.enemies) {
            if (enemy.health <= 0) continue;
            if (enemy.type === EnemyType.AMBUSH && enemy.isHidden) continue;
            
            if (Math.abs(bullet.position - enemy.position) < 1) {
                enemy.health -= 15;
                GameState.bullets.splice(i, 1);
                
                if (enemy.health <= 0) {
                    GameState.kills++;
                }
                break;
            }
        }
    }
    
    for (let i = GameState.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = GameState.enemyBullets[i];
        
        if (Math.abs(bullet.position - GameState.playerPosition) < 1) {
            takeDamage(bullet.damage);
            GameState.enemyBullets.splice(i, 1);
        }
    }
}

function takeDamage(damage) {
    const now = Date.now();
    if (now - GameState.lastDamageTime < 500) return;
    
    GameState.lastDamageTime = now;
    GameState.health -= damage;
    
    elements.damageFlash.classList.add('active');
    setTimeout(() => elements.damageFlash.classList.remove('active'), 200);
    
    if (GameState.health <= 0) {
        GameState.health = 0;
        respawn();
    }
    
    updateHUD();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    renderCorridor();
    renderCover();
    renderSniperPositions();
    renderEnemies();
    renderPlayer();
    renderBullets();
    renderEnemyBullets();
    renderMinimap();
}

function worldToScreenX(worldPos) {
    const zoom = GameState.isAiming ? LevelConfig.aimZoom : 1;
    const adjustedOffset = GameState.isAiming 
        ? GameState.playerPosition - (LevelConfig.tilesPerScreen / zoom) / 2
        : GameState.cameraOffset;
    
    return (worldPos - adjustedOffset) * LevelConfig.cellWidth * zoom;
}

function renderCorridor() {
    const ceilingGradient = ctx.createLinearGradient(0, 0, 0, 150);
    ceilingGradient.addColorStop(0, '#0D0D0D');
    ceilingGradient.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = ceilingGradient;
    ctx.fillRect(0, 0, canvas.width, 150);
    
    const floorGradient = ctx.createLinearGradient(0, 450, 0, 600);
    floorGradient.addColorStop(0, '#2A2A2A');
    floorGradient.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, 450, canvas.width, 150);
    
    const wallGradient = ctx.createLinearGradient(0, 150, 0, 450);
    wallGradient.addColorStop(0, '#1F291F');
    wallGradient.addColorStop(0.5, '#2D3D2D');
    wallGradient.addColorStop(1, '#1F291F');
    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 150, canvas.width, 300);
    
    ctx.strokeStyle = '#3D4A3E';
    ctx.lineWidth = 1;
    
    const zoom = GameState.isAiming ? LevelConfig.aimZoom : 1;
    const startTile = Math.floor(GameState.cameraOffset);
    const endTile = startTile + LevelConfig.tilesPerScreen + 2;
    
    for (let i = startTile; i <= endTile; i++) {
        const x = worldToScreenX(i);
        
        if (x > -50 && x < canvas.width + 50) {
            ctx.beginPath();
            ctx.moveTo(x, 150);
            ctx.lineTo(x, 450);
            ctx.stroke();
            
            if (i % 10 === 0 && i >= 0 && i <= LevelConfig.totalLength) {
                ctx.fillStyle = '#00FF41';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(i.toString(), x, 140);
            }
        }
    }
    
    ctx.fillStyle = '#3D4A3E';
    for (let y = 150; y <= 450; y += 50) {
        ctx.fillRect(0, y, canvas.width, 1);
    }
    
    const fogGradient = ctx.createRadialGradient(
        canvas.width / 2, 300, 100,
        canvas.width / 2, 300, canvas.width / 2
    );
    fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fogGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, canvas.width, 600);
}

function renderCover() {
    for (let i = 20; i < LevelConfig.totalLength; i += 30) {
        const x = worldToScreenX(i);
        
        if (x > -50 && x < canvas.width + 50) {
            const gradient = ctx.createLinearGradient(x - 20, 250, x + 20, 250);
            gradient.addColorStop(0, '#4A3728');
            gradient.addColorStop(0.5, '#6B4423');
            gradient.addColorStop(1, '#4A3728');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 20, 250, 40, 200);
            
            ctx.strokeStyle = '#3D2817';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 20, 250, 40, 200);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x + 15, 260, 8, 180);
        }
    }
}

function renderSniperPositions() {
    LevelConfig.sniperPositions.forEach((pos, index) => {
        const x = worldToScreenX(pos);
        
        if (x > -50 && x < canvas.width + 50) {
            const isAvailable = GameState.availableSnipers[index];
            const color = isAvailable ? '#00FF41' : '#8B0000';
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x - 25, 100, 50, 400);
            ctx.setLineDash([]);
            
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`狙击位 ${index + 1}`, x, 90);
            
            if (!isAvailable) {
                ctx.fillStyle = 'rgba(139, 0, 0, 0.2)';
                ctx.fillRect(x - 25, 100, 50, 400);
            }
        }
    });
}

function renderEnemies() {
    for (const enemy of GameState.enemies) {
        if (enemy.health <= 0) continue;
        if (enemy.type === EnemyType.AMBUSH && enemy.isHidden) continue;
        
        const x = worldToScreenX(enemy.position);
        
        if (x > -50 && x < canvas.width + 50) {
            const bodyGradient = ctx.createLinearGradient(x - 12, 280, x + 12, 380);
            
            if (enemy.type === EnemyType.PATROL) {
                bodyGradient.addColorStop(0, '#5C4033');
                bodyGradient.addColorStop(1, '#3D2817');
            } else {
                bodyGradient.addColorStop(0, '#4A4A4A');
                bodyGradient.addColorStop(1, '#2D2D2D');
            }
            
            ctx.fillStyle = bodyGradient;
            
            ctx.beginPath();
            ctx.ellipse(x, 300, 12, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillRect(x - 10, 310, 20, 50);
            
            ctx.fillStyle = enemy.type === EnemyType.PATROL ? '#8B4513' : '#5A5A5A';
            ctx.beginPath();
            ctx.arc(x, 280, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#C42021';
            ctx.fillRect(x + 8, 320, 20, 4);
            
            if (enemy.type === EnemyType.AMBUSH) {
                ctx.fillStyle = '#C42021';
                ctx.font = 'bold 12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('!', x, 260);
            }
            
            const healthPercent = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 15, 255, 30, 4);
            ctx.fillStyle = healthPercent > 0.5 ? '#00FF41' : healthPercent > 0.25 ? '#FFD700' : '#C42021';
            ctx.fillRect(x - 15, 255, 30 * healthPercent, 4);
        }
    }
}

function renderPlayer() {
    const x = worldToScreenX(GameState.playerPosition);
    const yOffset = GameState.isCrouching ? 30 : 0;
    
    const bodyGradient = ctx.createLinearGradient(x - 15, 290 + yOffset, x + 15, 390 + yOffset);
    bodyGradient.addColorStop(0, '#2E4A2E');
    bodyGradient.addColorStop(1, '#1A2E1A');
    
    ctx.fillStyle = bodyGradient;
    
    if (!GameState.isCrouching) {
        ctx.beginPath();
        ctx.ellipse(x, 300, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(x - 12, 315, 24, 55);
        
        ctx.fillStyle = '#3D5A3D';
        ctx.beginPath();
        ctx.arc(x, 278, 10, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.ellipse(x, 330, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(x - 18, 335, 36, 30);
        
        ctx.fillStyle = '#3D5A3D';
        ctx.beginPath();
        ctx.arc(x - 5, 320, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#1A1A1A';
    const gunY = GameState.isCrouching ? 330 : 320;
    ctx.fillRect(x + 12, gunY, 35, 5);
    
    if (!GameState.isAiming) {
        ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x + 47, gunY + 2);
        ctx.lineTo(x + 200, gunY - 10);
        ctx.lineTo(x + 200, gunY + 15);
        ctx.closePath();
        ctx.fill();
    }
}

function renderBullets() {
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    
    for (const bullet of GameState.bullets) {
        const x = worldToScreenX(bullet.position);
        const y = 320;
        
        ctx.fillRect(x, y, 8, 3);
    }
    
    ctx.shadowBlur = 0;
}

function renderEnemyBullets() {
    ctx.fillStyle = '#C42021';
    ctx.shadowColor = '#C42021';
    ctx.shadowBlur = 8;
    
    for (const bullet of GameState.enemyBullets) {
        const x = worldToScreenX(bullet.position);
        const y = 330;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
}

function renderMinimap() {
    const mapX = 10;
    const mapY = 10;
    const mapWidth = 250;
    const mapHeight = 30;
    
    ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    
    ctx.strokeStyle = '#3D4A3E';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
    
    LevelConfig.sniperPositions.forEach((pos, index) => {
        const x = mapX + (pos / LevelConfig.totalLength) * mapWidth;
        ctx.fillStyle = GameState.availableSnipers[index] ? '#00FF41' : '#8B0000';
        ctx.fillRect(x - 2, mapY + 5, 4, 20);
    });
    
    for (const enemy of GameState.enemies) {
        if (enemy.health <= 0) continue;
        if (enemy.type === EnemyType.AMBUSH && enemy.isHidden) continue;
        
        const x = mapX + (enemy.position / LevelConfig.totalLength) * mapWidth;
        ctx.fillStyle = enemy.type === EnemyType.PATROL ? '#8B4513' : '#C42021';
        ctx.fillRect(x - 1, mapY + 10, 2, 10);
    }
    
    const playerX = mapX + (GameState.playerPosition / LevelConfig.totalLength) * mapWidth;
    ctx.fillStyle = '#00FF41';
    ctx.fillRect(playerX - 2, mapY + 5, 4, 20);
    
    const viewStart = mapX + (GameState.cameraOffset / LevelConfig.totalLength) * mapWidth;
    const viewWidth = (LevelConfig.tilesPerScreen / LevelConfig.totalLength) * mapWidth;
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(viewStart, mapY, viewWidth, mapHeight);
    ctx.setLineDash([]);
}

function updateHUD() {
    const healthPercent = (GameState.health / GameState.maxHealth) * 100;
    elements.healthFill.style.width = healthPercent + '%';
    elements.healthValue.textContent = Math.floor(GameState.health);
    
    elements.posValue.textContent = Math.floor(GameState.playerPosition);
    elements.timerValue.textContent = formatTime(GameState.gameTime);
    elements.ammoCurrent.textContent = GameState.ammoInClip;
    elements.killValue.textContent = GameState.kills;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

window.addEventListener('load', init);
