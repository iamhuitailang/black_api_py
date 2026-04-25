let canvas, ctx;
let gameLoop;
let lastTime = 0;
let autoSaveTimer = 0;

const UI_ELEMENTS = {
    playerScore: null,
    enemyScore: null,
    timeDisplay: null,
    weatherIcon: null,
    playerStamina: null,
    enemyStamina: null,
    powerBar: null,
    powerBarContainer: null,
    startBtn: null,
    pauseBtn: null,
    restartBtn: null,
    skillStatus: null,
    speedBootsCount: null,
    goldenBallCount: null,
    coinsCount: null,
    gameOverlay: null,
    overlayTitle: null,
    overlayMessage: null,
    overlayButtons: null,
    overlayBtn1: null,
    overlayBtn2: null,
};

function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    initUIElements();
    initEventListeners();
    
    if (loadGameState()) {
        updateUI();
        if (GAME_STATE.isPlaying && !GAME_STATE.isGameOver) {
            startGameLoop();
            updateButtonStates();
            
            if (GAME_STATE.isPaused) {
                showOverlay(
                    '游戏暂停', 
                    '游戏已暂停，点击下方按钮继续',
                    '继续游戏',
                    'resume',
                    '重新开始',
                    'restart'
                );
                UI_ELEMENTS.pauseBtn.textContent = '继续';
            }
        }
        
        if (GAME_STATE.isGameOver) {
            let title, message;
            if (GAME_STATE.playerScore > GAME_STATE.enemyScore) {
                title = '🎉 胜利！';
                message = `恭喜获胜！`;
            } else if (GAME_STATE.playerScore < GAME_STATE.enemyScore) {
                title = '😢 失败';
                message = '再接再厉！';
            } else {
                title = '🤝 平局';
                message = '势均力敌！';
            }
            showOverlay(
                title, 
                message,
                '再来一局',
                'restart',
                null,
                null
            );
        }
    }
    
    if (GAME_STATE.weather === GAME_CONFIG.WEATHER_RAINY) {
        initRainDrops();
    }
    
    drawInitialScreen();
}

function initUIElements() {
    UI_ELEMENTS.playerScore = document.getElementById('player-score');
    UI_ELEMENTS.enemyScore = document.getElementById('enemy-score');
    UI_ELEMENTS.timeDisplay = document.getElementById('time-display');
    UI_ELEMENTS.weatherIcon = document.getElementById('weather-icon');
    UI_ELEMENTS.playerStamina = document.getElementById('player-stamina');
    UI_ELEMENTS.enemyStamina = document.getElementById('enemy-stamina');
    UI_ELEMENTS.powerBar = document.getElementById('power-bar');
    UI_ELEMENTS.powerBarContainer = document.getElementById('power-bar-container');
    UI_ELEMENTS.startBtn = document.getElementById('start-btn');
    UI_ELEMENTS.pauseBtn = document.getElementById('pause-btn');
    UI_ELEMENTS.restartBtn = document.getElementById('restart-btn');
    UI_ELEMENTS.skillStatus = document.getElementById('skill-status');
    UI_ELEMENTS.speedBootsCount = document.getElementById('speed-boots-count');
    UI_ELEMENTS.goldenBallCount = document.getElementById('golden-ball-count');
    UI_ELEMENTS.coinsCount = document.getElementById('coins-count');
    UI_ELEMENTS.gameOverlay = document.getElementById('game-overlay');
    UI_ELEMENTS.overlayTitle = document.getElementById('overlay-title');
    UI_ELEMENTS.overlayMessage = document.getElementById('overlay-message');
    UI_ELEMENTS.overlayButtons = document.getElementById('overlay-buttons');
    UI_ELEMENTS.overlayBtn1 = document.getElementById('overlay-btn-1');
    UI_ELEMENTS.overlayBtn2 = document.getElementById('overlay-btn-2');
}

function initEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    UI_ELEMENTS.startBtn.addEventListener('click', startGame);
    UI_ELEMENTS.pauseBtn.addEventListener('click', togglePause);
    UI_ELEMENTS.restartBtn.addEventListener('click', restartGame);
    
    UI_ELEMENTS.overlayBtn1.addEventListener('click', handleOverlayBtn1);
    UI_ELEMENTS.overlayBtn2.addEventListener('click', handleOverlayBtn2);
}

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'w') KEYS.w = true;
    if (key === 'a') KEYS.a = true;
    if (key === 's') KEYS.s = true;
    if (key === 'd') KEYS.d = true;
    if (key === 'j') {
        if (!KEYS.j) {
            KEYS.j = true;
            if (GAME_STATE.isPlaying && !GAME_STATE.isPaused) {
                startCharging();
            }
        }
    }
    if (key === 'k') {
        if (GAME_STATE.isPlaying && !GAME_STATE.isPaused) {
            activateFireShot();
        }
    }
    if (e.shiftKey) KEYS.shift = true;
    
    e.preventDefault();
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'w') KEYS.w = false;
    if (key === 'a') KEYS.a = false;
    if (key === 's') KEYS.s = false;
    if (key === 'd') KEYS.d = false;
    if (key === 'j') {
        if (KEYS.j) {
            KEYS.j = false;
            if (GAME_STATE.isPlaying && !GAME_STATE.isPaused) {
                releaseShot();
            }
        }
    }
    if (!e.shiftKey) KEYS.shift = false;
}

function startCharging() {
    if (player.hasBall && !player.isCharging) {
        player.isCharging = true;
        player.chargePower = 0;
        UI_ELEMENTS.powerBarContainer.classList.add('active');
    } else if (!player.hasBall) {
        tryStealBall();
    }
}

function releaseShot() {
    if (player.isCharging && player.hasBall) {
        shootBall();
    }
    player.isCharging = false;
    player.chargePower = 0;
    UI_ELEMENTS.powerBarContainer.classList.remove('active');
}

function startGame() {
    resetGameState();
    
    GAME_STATE.weather = Math.random() > 0.5 ? 
        GAME_CONFIG.WEATHER_SUNNY : GAME_CONFIG.WEATHER_RAINY;
    
    if (GAME_STATE.weather === GAME_CONFIG.WEATHER_RAINY) {
        initRainDrops();
    }
    
    enemy.aiType = Math.random() > 0.5 ? 
        GAME_CONFIG.AI_TYPE_OFFENSIVE : GAME_CONFIG.AI_TYPE_DEFENSIVE;
    
    GAME_STATE.isPlaying = true;
    GAME_STATE.isPaused = false;
    GAME_STATE.isGameOver = false;
    
    hideOverlay();
    updateButtonStates();
    startGameLoop();
    saveGameState();
}

function resetGameState() {
    player = { ...DEFAULT_PLAYER };
    player.speedLevel = player.speedLevel;
    player.accuracyLevel = player.accuracyLevel;
    player.speed = calculatePlayerSpeed(player.speedLevel);
    player.shotAccuracy = calculateShotAccuracy(player.accuracyLevel);
    
    enemy = { ...DEFAULT_ENEMY };
    ball = { ...DEFAULT_BALL };
    particles = [];
    DROPPED_ITEMS.length = 0;
    
    GAME_STATE.currentTime = GAME_CONFIG.GAME_DURATION;
    GAME_STATE.playerScore = 0;
    GAME_STATE.enemyScore = 0;
    GAME_STATE.goalScored = false;
    GAME_STATE.celebrationTime = 0;
    GAME_STATE.fireShotActive = false;
    
    updateUI();
}

function togglePause() {
    if (!GAME_STATE.isPlaying || GAME_STATE.isGameOver) return;
    
    GAME_STATE.isPaused = !GAME_STATE.isPaused;
    
    if (GAME_STATE.isPaused) {
        showOverlay(
            '游戏暂停', 
            '游戏已暂停，点击下方按钮继续',
            '继续游戏',
            'resume',
            '重新开始',
            'restart'
        );
        UI_ELEMENTS.pauseBtn.textContent = '继续';
    } else {
        hideOverlay();
        UI_ELEMENTS.pauseBtn.textContent = '暂停';
    }
    
    saveGameState();
}

function restartGame() {
    stopGameLoop();
    clearGameState();
    items = { ...DEFAULT_ITEMS };
    startGame();
}

function updateButtonStates() {
    if (GAME_STATE.isPlaying && !GAME_STATE.isGameOver) {
        UI_ELEMENTS.startBtn.disabled = true;
        UI_ELEMENTS.pauseBtn.disabled = false;
    } else {
        UI_ELEMENTS.startBtn.disabled = false;
        UI_ELEMENTS.pauseBtn.disabled = true;
    }
}

function showOverlay(title, message, btn1Text, btn1Action, btn2Text, btn2Action) {
    UI_ELEMENTS.overlayTitle.textContent = title;
    UI_ELEMENTS.overlayMessage.textContent = message;
    
    if (btn1Text) {
        UI_ELEMENTS.overlayBtn1.textContent = btn1Text;
        UI_ELEMENTS.overlayBtn1.dataset.action = btn1Action || '';
        UI_ELEMENTS.overlayBtn1.classList.remove('hidden');
        
        if (btn2Text) {
            UI_ELEMENTS.overlayBtn2.textContent = btn2Text;
            UI_ELEMENTS.overlayBtn2.dataset.action = btn2Action || '';
            UI_ELEMENTS.overlayBtn2.classList.remove('hidden');
        } else {
            UI_ELEMENTS.overlayBtn2.classList.add('hidden');
        }
        
        UI_ELEMENTS.overlayButtons.classList.remove('hidden');
    } else {
        UI_ELEMENTS.overlayButtons.classList.add('hidden');
    }
    
    UI_ELEMENTS.gameOverlay.classList.remove('hidden');
}

function hideOverlay() {
    UI_ELEMENTS.gameOverlay.classList.add('hidden');
    UI_ELEMENTS.overlayButtons.classList.add('hidden');
}

function handleOverlayBtn1() {
    const action = UI_ELEMENTS.overlayBtn1.dataset.action;
    if (action === 'resume') {
        togglePause();
    } else if (action === 'restart') {
        restartGame();
    }
}

function handleOverlayBtn2() {
    const action = UI_ELEMENTS.overlayBtn2.dataset.action;
    if (action === 'restart' || action === 'newGame') {
        restartGame();
    }
}

function startGameLoop() {
    lastTime = performance.now();
    autoSaveTimer = 0;
    gameLoop = requestAnimationFrame(update);
}

function stopGameLoop() {
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
    }
}

function update(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (GAME_STATE.isPlaying && !GAME_STATE.isPaused && !GAME_STATE.isGameOver) {
        updateGame(deltaTime);
        
        autoSaveTimer += deltaTime;
        if (autoSaveTimer >= 5) {
            saveGameState();
            autoSaveTimer = 0;
        }
    }
    
    render();
    gameLoop = requestAnimationFrame(update);
}

function updateGame(deltaTime) {
    if (GAME_STATE.goalScored) {
        GAME_STATE.celebrationTime -= deltaTime;
        if (GAME_STATE.celebrationTime <= 0) {
            GAME_STATE.goalScored = false;
            resetPositions();
        }
        updateParticles();
        return;
    }
    
    GAME_STATE.currentTime -= deltaTime;
    if (GAME_STATE.currentTime <= 0) {
        GAME_STATE.currentTime = 0;
        endGame();
        return;
    }
    
    updatePlayer(deltaTime);
    updateEnemy(deltaTime);
    updateBall(deltaTime);
    updateParticles();
    
    if (GAME_STATE.weather === GAME_CONFIG.WEATHER_RAINY) {
        updateRainDrops();
    }
    
    checkItemSpawn();
    checkItemPickups();
    checkGoals();
    updateUI();
}

function updatePlayer(deltaTime) {
    let moveX = 0;
    let moveY = 0;
    
    if (KEYS.w) moveY = -1;
    if (KEYS.s) moveY = 1;
    if (KEYS.a) moveX = -1;
    if (KEYS.d) moveX = 1;
    
    player.isSprinting = KEYS.shift && (moveX !== 0 || moveY !== 0);
    
    let currentSpeed = player.speed;
    
    if (player.isSprinting && player.stamina > 0) {
        currentSpeed *= 1.5;
        player.stamina -= GAME_CONFIG.STAMINA_SPRINT_DRAIN;
        if (player.stamina < 0) player.stamina = 0;
    } else if (!player.isSprinting && player.stamina < player.maxStamina) {
        player.stamina += GAME_CONFIG.STAMINA_REGEN;
        if (player.stamina > player.maxStamina) player.stamina = player.maxStamina;
    }
    
    if (player.stamina <= 0) {
        currentSpeed *= 0.5;
    }
    
    if (GAME_STATE.weather === GAME_CONFIG.WEATHER_RAINY && player.hasBall) {
        currentSpeed *= GAME_CONFIG.RAIN_CONTROL_PENALTY;
    }
    
    if (moveX !== 0 || moveY !== 0) {
        const normalized = normalize(moveX, moveY);
        player.vx = normalized.x * currentSpeed;
        player.vy = normalized.y * currentSpeed;
        player.direction = moveX !== 0 ? (moveX > 0 ? 1 : -1) : player.direction;
    } else {
        player.vx *= 0.8;
        player.vy *= 0.8;
    }
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.x = clamp(player.x, FIELD.left + GAME_CONFIG.PLAYER_SIZE / 2, 
                     FIELD.right - GAME_CONFIG.PLAYER_SIZE / 2);
    player.y = clamp(player.y, FIELD.top + GAME_CONFIG.PLAYER_SIZE / 2, 
                     FIELD.bottom - GAME_CONFIG.PLAYER_SIZE / 2);
    
    if (player.hasBall) {
        ball.x = player.x + player.direction * 20;
        ball.y = player.y;
        ball.owner = 'player';
        ball.expression = getBallExpression('player');
    }
    
    if (player.isCharging) {
        player.chargePower += GAME_CONFIG.POWER_INC_RATE;
        if (player.chargePower > GAME_CONFIG.POWER_MAX) {
            player.chargePower = GAME_CONFIG.POWER_MAX;
        }
        UI_ELEMENTS.powerBar.style.width = `${player.chargePower}%`;
    }
    
    player.fireShotReady = player.stamina >= GAME_CONFIG.FIRE_SHOT_STAMINA_COST;
}

function updateEnemy(deltaTime) {
    if (enemy.aiCooldown > 0) {
        enemy.aiCooldown -= deltaTime;
    }
    
    const playerGoalX = GOALS.left.x + GOALS.left.width / 2;
    const ownGoalX = GOALS.right.x - GOALS.right.width / 2;
    const goalCenterY = GOALS.left.y + GOALS.left.height / 2;
    
    const safeLeftBoundary = FIELD.left + GAME_CONFIG.PLAYER_SIZE / 2 + 60;
    const safeRightBoundary = FIELD.right - GAME_CONFIG.PLAYER_SIZE / 2 - 60;
    const safeTopBoundary = FIELD.top + GAME_CONFIG.PLAYER_SIZE / 2 + 30;
    const safeBottomBoundary = FIELD.bottom - GAME_CONFIG.PLAYER_SIZE / 2 - 30;
    
    const distToPlayerGoal = calculateDistance(enemy.x, enemy.y, playerGoalX, goalCenterY);
    const isAtLeftBoundary = enemy.x <= safeLeftBoundary + 8;
    const isAtRightBoundary = enemy.x >= safeRightBoundary - 8;
    
    const maxShootDistance = enemy.aiType === GAME_CONFIG.AI_TYPE_OFFENSIVE ? 260 : 200;
    const optimalShootDistance = enemy.aiType === GAME_CONFIG.AI_TYPE_OFFENSIVE ? 180 : 140;
    const minShootDistance = enemy.aiType === GAME_CONFIG.AI_TYPE_OFFENSIVE ? 70 : 60;
    
    if (enemy.hasBall) {
        if (enemy.aiCooldown <= 0) {
            let shouldShoot = false;
            
            if (distToPlayerGoal <= maxShootDistance && distToPlayerGoal >= minShootDistance) {
                shouldShoot = true;
            }
            
            if (distToPlayerGoal < minShootDistance) {
                shouldShoot = true;
            }
            
            if (isAtLeftBoundary && enemy.hasBall && enemy.aiCooldown <= 0) {
                shouldShoot = true;
            }
            
            if (GAME_STATE.goalScored) {
                shouldShoot = false;
            }
            
            if (shouldShoot) {
                enemyShoot();
                enemy.aiCooldown = 1.2;
            }
        }
    }
    
    let targetX, targetY;
    
    if (enemy.hasBall) {
        if (enemy.aiCooldown > 0) {
            targetX = enemy.x + (enemy.direction > 0 ? 20 : -20);
            targetY = enemy.y + random(-10, 10);
        } else if (distToPlayerGoal > maxShootDistance + 40) {
            targetX = playerGoalX + 120;
            targetY = goalCenterY;
        } else if (distToPlayerGoal > optimalShootDistance) {
            const moveDir = enemy.x < FIELD.centerX ? 1 : -1;
            const yOffset = Math.sin(Date.now() / 500) * 20;
            targetX = enemy.x + moveDir * 3;
            targetY = goalCenterY + yOffset;
        } else {
            const yOffset = Math.sin(Date.now() / 400) * 15;
            targetX = enemy.x;
            targetY = goalCenterY + yOffset;
        }
    } else if (player.hasBall) {
        const playerDistToOwnGoal = calculateDistance(player.x, player.y, ownGoalX, goalCenterY);
        
        if (playerDistToOwnGoal < 180) {
            targetX = player.x;
            targetY = player.y;
        } else {
            const ballDistToEnemy = calculateDistance(ball.x, ball.y, enemy.x, enemy.y);
            if (ballDistToEnemy < 120) {
                targetX = ball.x;
                targetY = ball.y;
            } else {
                targetX = ownGoalX - 100;
                targetY = goalCenterY;
            }
        }
    } else {
        targetX = ball.x;
        targetY = ball.y;
    }
    
    targetX = clamp(targetX, safeLeftBoundary, safeRightBoundary);
    targetY = clamp(targetY, safeTopBoundary, safeBottomBoundary);
    
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 3) {
        const normalized = normalize(dx, dy);
        let aiSpeed = enemy.speed;
        
        if (enemy.hasBall && GAME_STATE.weather === GAME_CONFIG.WEATHER_RAINY) {
            aiSpeed *= GAME_CONFIG.RAIN_CONTROL_PENALTY;
        }
        
        if (enemy.hasBall && distToPlayerGoal <= maxShootDistance) {
            aiSpeed *= 0.6;
        }
        
        enemy.vx = normalized.x * aiSpeed;
        enemy.vy = normalized.y * aiSpeed;
        
        if (Math.abs(dx) > 0.1) {
            enemy.direction = dx > 0 ? 1 : -1;
        }
    } else {
        enemy.vx *= 0.85;
        enemy.vy *= 0.85;
    }
    
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    
    enemy.x = clamp(enemy.x, safeLeftBoundary, safeRightBoundary);
    enemy.y = clamp(enemy.y, safeTopBoundary, safeBottomBoundary);
    
    if (enemy.hasBall) {
        ball.x = enemy.x + enemy.direction * (-20);
        ball.y = enemy.y;
        ball.owner = 'enemy';
        ball.expression = getBallExpression('enemy');
    }
    
    if (!enemy.hasBall && player.hasBall && enemy.aiCooldown <= 0) {
        const distToPlayer = calculateDistance(enemy.x, enemy.y, player.x, player.y);
        const stealChance = enemy.aiType === GAME_CONFIG.AI_TYPE_DEFENSIVE ? 0.08 : 0.05;
        if (distToPlayer < 55 && Math.random() < stealChance) {
            tryEnemySteal();
            enemy.aiCooldown = 1.0;
        }
    }
    
    if (enemy.stamina < enemy.maxStamina) {
        enemy.stamina += GAME_CONFIG.STAMINA_REGEN;
        if (enemy.stamina > enemy.maxStamina) enemy.stamina = enemy.maxStamina;
    }
}

function updateBall(deltaTime) {
    if (ball.owner) return;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    ball.vx *= 0.98;
    ball.vy *= 0.98;
    
    if (ball.x < FIELD.left + GAME_CONFIG.BALL_SIZE || 
        ball.x > FIELD.right - GAME_CONFIG.BALL_SIZE) {
        ball.vx *= -0.8;
        ball.x = clamp(ball.x, FIELD.left + GAME_CONFIG.BALL_SIZE, 
                       FIELD.right - GAME_CONFIG.BALL_SIZE);
    }
    
    if (ball.y < FIELD.top + GAME_CONFIG.BALL_SIZE || 
        ball.y > FIELD.bottom - GAME_CONFIG.BALL_SIZE) {
        ball.vy *= -0.8;
        ball.y = clamp(ball.y, FIELD.top + GAME_CONFIG.BALL_SIZE, 
                       FIELD.bottom - GAME_CONFIG.BALL_SIZE);
    }
    
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed < 0.1) {
        ball.vx = 0;
        ball.vy = 0;
        ball.isMoving = false;
    }
    
    if (!player.hasBall && !enemy.hasBall) {
        const distToPlayer = calculateDistance(ball.x, ball.y, player.x, player.y);
        const distToEnemy = calculateDistance(ball.x, ball.y, enemy.x, enemy.y);
        
        if (distToPlayer < 35 && speed < 5) {
            player.hasBall = true;
            ball.owner = 'player';
            ball.vx = 0;
            ball.vy = 0;
        } else if (distToEnemy < 35 && speed < 5) {
            enemy.hasBall = true;
            ball.owner = 'enemy';
            ball.vx = 0;
            ball.vy = 0;
        }
    }
    
    ball.expression = getBallExpression(ball.owner);
}

function shootBall() {
    if (!player.hasBall) return;
    
    const power = (player.chargePower / GAME_CONFIG.POWER_MAX) * 15 + 5;
    let accuracy = player.shotAccuracy;
    
    if (GAME_STATE.fireShotActive) {
        accuracy += GAME_CONFIG.FIRE_SHOT_BONUS;
        player.stamina -= GAME_CONFIG.FIRE_SHOT_STAMINA_COST;
        createFireParticles(ball.x, ball.y);
        GAME_STATE.fireShotActive = false;
    }
    
    if (items.goldenBall > 0) {
        accuracy += 20;
        items.goldenBall--;
    }
    
    const direction = player.direction;
    const targetY = GOALS.right.y + GOALS.right.height / 2;
    
    const accuracyFactor = accuracy / 100;
    const offsetRange = 40 * (1 - accuracyFactor);
    const yOffset = random(-offsetRange, offsetRange);
    const actualTargetY = targetY + yOffset;
    
    const dx = (GOALS.right.x - 10) - ball.x;
    const dy = actualTargetY - ball.y;
    const normalized = normalize(dx, dy);
    
    ball.vx = normalized.x * power;
    ball.vy = normalized.y * power;
    ball.owner = null;
    ball.isMoving = true;
    player.hasBall = false;
}

function enemyShoot() {
    if (!enemy.hasBall) return;
    
    const power = random(8, 14);
    let accuracy = enemy.aiType === GAME_CONFIG.AI_TYPE_OFFENSIVE ? 65 : 50;
    
    const targetY = GOALS.left.y + GOALS.left.height / 2;
    const accuracyFactor = accuracy / 100;
    const offsetRange = 50 * (1 - accuracyFactor);
    const yOffset = random(-offsetRange, offsetRange);
    const actualTargetY = targetY + yOffset;
    
    const dx = (GOALS.left.x + 10) - ball.x;
    const dy = actualTargetY - ball.y;
    const normalized = normalize(dx, dy);
    
    ball.vx = normalized.x * power;
    ball.vy = normalized.y * power;
    ball.owner = null;
    ball.isMoving = true;
    enemy.hasBall = false;
}

function tryStealBall() {
    if (!enemy.hasBall) return;
    
    const distance = calculateDistance(player.x, player.y, enemy.x, enemy.y);
    if (distance < 50) {
        const stealChance = 0.4;
        if (Math.random() < stealChance) {
            enemy.hasBall = false;
            ball.owner = null;
            ball.vx = (player.x - enemy.x) * 0.3;
            ball.vy = (player.y - enemy.y) * 0.3;
        }
    }
}

function tryEnemySteal() {
    if (!player.hasBall) return;
    
    const stealChance = enemy.aiType === GAME_CONFIG.AI_TYPE_DEFENSIVE ? 0.35 : 0.25;
    if (Math.random() < stealChance) {
        player.hasBall = false;
        ball.owner = null;
        ball.vx = (enemy.x - player.x) * 0.3;
        ball.vy = (enemy.y - player.y) * 0.3;
    }
}

function activateFireShot() {
    if (player.fireShotReady && player.hasBall && !GAME_STATE.fireShotActive) {
        GAME_STATE.fireShotActive = true;
        UI_ELEMENTS.skillStatus.textContent = '必杀技: 火焰射门已激活！按住J蓄力后释放';
        UI_ELEMENTS.skillStatus.style.color = '#ff4500';
        setTimeout(() => {
            UI_ELEMENTS.skillStatus.textContent = '必杀技: 按K键发动(需50%以上体力)';
            UI_ELEMENTS.skillStatus.style.color = '#ffc107';
        }, 2000);
    }
}

function checkGoals() {
    if (ball.owner) return;
    
    const ballInLeftGoal = pointInRect(ball.x, ball.y, GOALS.left);
    const ballInRightGoal = pointInRect(ball.x, ball.y, GOALS.right);
    
    if (ballInRightGoal) {
        GAME_STATE.playerScore++;
        items.coins += GAME_CONFIG.COINS_PER_GOAL;
        createGoalParticles(GOALS.right.x, GOALS.right.y + GOALS.right.height / 2);
        startCelebration('进球！', `玩家得分！获得 ${GAME_CONFIG.COINS_PER_GOAL} 金币`);
    } else if (ballInLeftGoal) {
        GAME_STATE.enemyScore++;
        createGoalParticles(GOALS.left.x + GOALS.left.width, GOALS.left.y + GOALS.left.height / 2);
        startCelebration('丢球！', '对手得分！');
    }
}

function startCelebration(title, message) {
    GAME_STATE.goalScored = true;
    GAME_STATE.celebrationTime = 2;
    showOverlay(title, message);
    saveGameState();
}

function resetPositions() {
    player.x = 200;
    player.y = 250;
    player.vx = 0;
    player.vy = 0;
    player.hasBall = false;
    
    enemy.x = 600;
    enemy.y = 250;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.hasBall = false;
    
    ball.x = FIELD.centerX;
    ball.y = FIELD.centerY;
    ball.vx = 0;
    ball.vy = 0;
    ball.owner = null;
    ball.isMoving = false;
    
    hideOverlay();
}

function checkItemSpawn() {
    if (Math.random() < GAME_CONFIG.ITEM_DROP_CHANCE) {
        const itemType = Math.random() > 0.5 ? 
            GAME_CONFIG.ITEM_SPEED_BOOTS : GAME_CONFIG.ITEM_GOLDEN_BALL;
        
        DROPPED_ITEMS.push({
            x: random(FIELD.left + 50, FIELD.right - 50),
            y: random(FIELD.top + 50, FIELD.bottom - 50),
            type: itemType,
            lifetime: 10,
        });
    }
    
    for (let i = DROPPED_ITEMS.length - 1; i >= 0; i--) {
        DROPPED_ITEMS[i].lifetime -= 0.016;
        if (DROPPED_ITEMS[i].lifetime <= 0) {
            DROPPED_ITEMS.splice(i, 1);
        }
    }
}

function checkItemPickups() {
    for (let i = DROPPED_ITEMS.length - 1; i >= 0; i--) {
        const item = DROPPED_ITEMS[i];
        
        if (checkItemPickup(player, item)) {
            if (item.type === GAME_CONFIG.ITEM_SPEED_BOOTS) {
                items.speedBoots++;
            } else if (item.type === GAME_CONFIG.ITEM_GOLDEN_BALL) {
                items.goldenBall++;
            }
            DROPPED_ITEMS.splice(i, 1);
            continue;
        }
        
        if (checkItemPickup(enemy, item)) {
            DROPPED_ITEMS.splice(i, 1);
        }
    }
}

function endGame() {
    GAME_STATE.isGameOver = true;
    GAME_STATE.isPlaying = false;
    stopGameLoop();
    
    let title, message;
    if (GAME_STATE.playerScore > GAME_STATE.enemyScore) {
        items.coins += GAME_CONFIG.COINS_PER_WIN;
        title = '🎉 胜利！';
        message = `恭喜获胜！获得 ${GAME_CONFIG.COINS_PER_WIN} 金币`;
    } else if (GAME_STATE.playerScore < GAME_STATE.enemyScore) {
        title = '😢 失败';
        message = '再接再厉！';
    } else {
        title = '🤝 平局';
        message = '势均力敌！';
    }
    
    showOverlay(
        title, 
        message,
        '再来一局',
        'restart',
        null,
        null
    );
    saveGameState();
    updateButtonStates();
}

function updateUI() {
    UI_ELEMENTS.playerScore.textContent = GAME_STATE.playerScore;
    UI_ELEMENTS.enemyScore.textContent = GAME_STATE.enemyScore;
    UI_ELEMENTS.timeDisplay.textContent = formatTime(GAME_STATE.currentTime);
    UI_ELEMENTS.weatherIcon.textContent = GAME_STATE.weather === GAME_CONFIG.WEATHER_SUNNY ? '☀️' : '🌧️';
    UI_ELEMENTS.playerStamina.style.width = `${(player.stamina / player.maxStamina) * 100}%`;
    UI_ELEMENTS.enemyStamina.style.width = `${(enemy.stamina / enemy.maxStamina) * 100}%`;
    UI_ELEMENTS.speedBootsCount.textContent = items.speedBoots;
    UI_ELEMENTS.goldenBallCount.textContent = items.goldenBall;
    UI_ELEMENTS.coinsCount.textContent = items.coins;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawField();
    drawGoals();
    drawItems();
    
    if (ball.owner) {
        if (ball.owner === 'player') {
            if (player.y < enemy.y) {
                drawPlayer();
                drawBall();
                drawEnemy();
            } else {
                drawEnemy();
                drawPlayer();
                drawBall();
            }
        } else {
            if (enemy.y < player.y) {
                drawEnemy();
                drawBall();
                drawPlayer();
            } else {
                drawPlayer();
                drawEnemy();
                drawBall();
            }
        }
    } else {
        if (player.y < enemy.y) {
            drawPlayer();
            drawBall();
            drawEnemy();
        } else if (enemy.y < player.y) {
            drawEnemy();
            drawBall();
            drawPlayer();
        } else {
            const ballY = ball.y;
            if (ballY < player.y && ballY < enemy.y) {
                drawBall();
                drawPlayer();
                drawEnemy();
            } else if (player.y < ballY && player.y < enemy.y) {
                drawPlayer();
                if (ballY < enemy.y) {
                    drawBall();
                    drawEnemy();
                } else {
                    drawEnemy();
                    drawBall();
                }
            } else {
                drawEnemy();
                if (ballY < player.y) {
                    drawBall();
                    drawPlayer();
                } else {
                    drawPlayer();
                    drawBall();
                }
            }
        }
    }
    
    drawParticles();
    
    if (GAME_STATE.weather === GAME_CONFIG.WEATHER_RAINY) {
        drawRain();
    }
}

function drawField() {
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const stripeHeight = 25;
    for (let y = FIELD.top; y < FIELD.bottom; y += stripeHeight * 2) {
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(FIELD.left, y, FIELD.right - FIELD.left, stripeHeight);
    }
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    ctx.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);
    
    ctx.beginPath();
    ctx.moveTo(FIELD.centerX, FIELD.top);
    ctx.lineTo(FIELD.centerX, FIELD.bottom);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(FIELD.centerX, FIELD.centerY, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(FIELD.centerX, FIELD.centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    drawGoalArea(FIELD.left, true);
    drawGoalArea(FIELD.right, false);
}

function drawGoalArea(x, isLeft) {
    const centerY = FIELD.centerY;
    const direction = isLeft ? 1 : -1;
    const startX = isLeft ? x : x - 60;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(startX, centerY - 30);
    ctx.lineTo(startX + direction * 30, centerY - 30);
    ctx.lineTo(startX + direction * 30, centerY + 30);
    ctx.lineTo(startX, centerY + 30);
    ctx.stroke();
}

function drawGoals() {
    drawSingleGoal(GOALS.left.x, GOALS.left.y, GOALS.left.width, GOALS.left.height, true);
    drawSingleGoal(GOALS.right.x, GOALS.right.y, GOALS.right.width, GOALS.right.height, false);
}

function drawSingleGoal(x, y, width, height, isLeft) {
    const postWidth = 6;
    const time = Date.now();
    const pulse = Math.sin(time / 500) * 0.2 + 1;
    
    ctx.save();
    
    const glowGradient = ctx.createRadialGradient(
        x + width / 2, y + height / 2, 0,
        x + width / 2, y + height / 2, height * 0.8
    );
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.12 * pulse})`);
    glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.05 * pulse})`);
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(x - 30, y - 30, width + 60, height + 60);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(x + 2, y + 2, width - 2, height - 2);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    const netSpacing = 7;
    
    for (let ny = y + netSpacing; ny < y + height; ny += netSpacing) {
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(x, ny);
        ctx.lineTo(x + width, ny);
        ctx.stroke();
        
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(x, ny + netSpacing / 2);
        ctx.lineTo(x + width, ny + netSpacing / 2);
        ctx.stroke();
    }
    
    for (let nx = x; nx <= x + width; nx += netSpacing) {
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(nx, y);
        ctx.lineTo(nx, y + height);
        ctx.stroke();
        
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(nx + netSpacing / 2, y);
        ctx.lineTo(nx + netSpacing / 2, y + height);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    const postGlowColor = isLeft ? 'rgba(33, 150, 243, 0.3)' : 'rgba(244, 67, 54, 0.3)';
    const postMainColor = '#ffffff';
    const postBorderColor = isLeft ? '#1976d2' : '#d32f2f';
    
    ctx.shadowColor = postGlowColor;
    ctx.shadowBlur = 15 * pulse;
    
    const leftPostGradient = ctx.createLinearGradient(
        x - postWidth, 0, x, 0
    );
    leftPostGradient.addColorStop(0, '#e0e0e0');
    leftPostGradient.addColorStop(0.3, postMainColor);
    leftPostGradient.addColorStop(1, '#f5f5f5');
    
    ctx.fillStyle = leftPostGradient;
    ctx.beginPath();
    ctx.roundRect(x - postWidth, y - postWidth, postWidth, height + postWidth * 2, 2);
    ctx.fill();
    
    ctx.strokeStyle = postBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - postWidth, y - postWidth, postWidth, height + postWidth * 2, 2);
    ctx.stroke();
    
    const rightPostGradient = ctx.createLinearGradient(
        x + width, 0, x + width + postWidth, 0
    );
    rightPostGradient.addColorStop(0, '#f5f5f5');
    rightPostGradient.addColorStop(0.7, postMainColor);
    rightPostGradient.addColorStop(1, '#e0e0e0');
    
    ctx.fillStyle = rightPostGradient;
    ctx.beginPath();
    ctx.roundRect(x + width, y - postWidth, postWidth, height + postWidth * 2, 2);
    ctx.fill();
    
    ctx.strokeStyle = postBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + width, y - postWidth, postWidth, height + postWidth * 2, 2);
    ctx.stroke();
    
    const topPostGradient = ctx.createLinearGradient(
        0, y - postWidth, 0, y
    );
    topPostGradient.addColorStop(0, '#e0e0e0');
    topPostGradient.addColorStop(0.5, postMainColor);
    topPostGradient.addColorStop(1, '#f5f5f5');
    
    ctx.fillStyle = topPostGradient;
    ctx.beginPath();
    ctx.roundRect(x - postWidth * 0.5, y - postWidth, width + postWidth, postWidth, 2);
    ctx.fill();
    
    ctx.strokeStyle = postBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - postWidth * 0.5, y - postWidth, width + postWidth, postWidth, 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    const netHighlightGradient = ctx.createRadialGradient(
        x + width / 2, y + height / 3, 0,
        x + width / 2, y + height / 3, height / 2
    );
    netHighlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.08 * pulse})`);
    netHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = netHighlightGradient;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 3, width * 0.6, height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = postBorderColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = postBorderColor;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isLeft ? '⚽ 目标' : '防守 🛡️', x + width / 2, y - 15);
    
    ctx.restore();
}

function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const size = GAME_CONFIG.PLAYER_SIZE;
    const time = Date.now();
    
    ctx.save();
    ctx.translate(x, y);
    if (player.direction < 0) {
        ctx.scale(-1, 1);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 26, size / 1.8, size / 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const isMoving = Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3;
    const walkAnim = isMoving ? Math.sin(time / 80) * 4 : 0;
    const bounceAnim = isMoving ? Math.abs(Math.sin(time / 80)) * 2 : 0;
    
    ctx.save();
    ctx.translate(0, -bounceAnim);
    
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.ellipse(-8, 18 + walkAnim, 6, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 18 - walkAnim, 6, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1e88e5';
    ctx.beginPath();
    ctx.ellipse(-8, 12 + walkAnim, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 12 - walkAnim, 5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.ellipse(-8, 27 + walkAnim, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 27 - walkAnim, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.ellipse(-8, 26 + walkAnim, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 26 - walkAnim, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyGradient = ctx.createRadialGradient(0, 6, 0, 0, 6, size / 1.8);
    bodyGradient.addColorStop(0, '#64b5f6');
    bodyGradient.addColorStop(0.5, '#2196f3');
    bodyGradient.addColorStop(1, '#1565c0');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 5, size / 2.2, size / 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 5, size / 2.2, size / 2.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#bbdefb';
    ctx.beginPath();
    ctx.ellipse(0, 0, size / 3, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 2;
    ctx.strokeText('10', 0, 8);
    ctx.fillText('10', 0, 8);
    
    const armAnim = isMoving ? Math.sin(time / 100) * 3 : 0;
    ctx.fillStyle = '#42a5f5';
    
    ctx.save();
    ctx.translate(-12, 5);
    ctx.rotate(-0.6 + armAnim * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(12, 5);
    ctx.rotate(0.6 - armAnim * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.ellipse(-16, 8 + armAnim, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 8 - armAnim, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const headGradient = ctx.createRadialGradient(-3, -15, 0, 0, -12, size / 1.5);
    headGradient.addColorStop(0, '#ffe0b2');
    headGradient.addColorStop(0.6, '#ffcc80');
    headGradient.addColorStop(1, '#ffb74d');
    
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -12, size / 1.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -12, size / 1.8, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.ellipse(0, -24, size / 1.7, size / 4.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(-12, -22, 7, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -22, 7, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(-15, -26, -8, -28);
    ctx.quadraticCurveTo(0, -26, 0, -20);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.quadraticCurveTo(15, -26, 8, -28);
    ctx.quadraticCurveTo(0, -26, 0, -20);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#212121';
    const lookDir = ball.owner === 'enemy' ? Math.min(2, Math.max(-2, (ball.x - player.x) * 0.02)) : 0;
    ctx.beginPath();
    ctx.arc(-6 + lookDir, -13, 3, 0, Math.PI * 2);
    ctx.arc(8 + lookDir, -13, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7 + lookDir, -15, 1.2, 0, Math.PI * 2);
    ctx.arc(7 + lookDir, -15, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#795548';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -20);
    ctx.quadraticCurveTo(-7, -22, -1, -20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1, -20);
    ctx.quadraticCurveTo(7, -22, 13, -20);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 138, 128, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-13, -7, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 200, 200, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-13, -7, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -4, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(0, -3, 3, 0, Math.PI);
    ctx.fill();
    
    if (player.hasBall) {
        const glowPulse = Math.sin(time / 150) * 0.3 + 1;
        
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, (size + 20) * glowPulse);
        glowGradient.addColorStop(0, 'rgba(33, 150, 243, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.2)');
        glowGradient.addColorStop(1, 'rgba(33, 150, 243, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, (size + 20) * glowPulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -time / 50;
        ctx.beginPath();
        ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    if (GAME_STATE.fireShotActive && player.hasBall) {
        const firePulse = Math.sin(time / 60) * 0.4 + 1;
        
        const fireGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, (size + 30) * firePulse);
        fireGradient.addColorStop(0, 'rgba(255, 87, 34, 0.6)');
        fireGradient.addColorStop(0.5, 'rgba(255, 152, 0, 0.3)');
        fireGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
        
        ctx.fillStyle = fireGradient;
        ctx.beginPath();
        ctx.arc(0, 0, (size + 30) * firePulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size + 15, 0, Math.PI * 2);
        ctx.stroke();
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time / 200;
            const flameX = Math.cos(angle) * (size + 10);
            const flameY = Math.sin(angle) * (size + 10);
            
            ctx.fillStyle = `rgba(255, ${87 + Math.sin(time / 100 + i) * 50}, 0, 0.8)`;
            ctx.beginPath();
            ctx.arc(flameX, flameY, 4 + Math.sin(time / 80 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
    ctx.restore();
}

function drawEnemy() {
    const x = enemy.x;
    const y = enemy.y;
    const size = GAME_CONFIG.PLAYER_SIZE;
    const time = Date.now();
    
    ctx.save();
    ctx.translate(x, y);
    if (enemy.direction < 0) {
        ctx.scale(-1, 1);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 26, size / 1.8, size / 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const isMoving = Math.abs(enemy.vx) > 0.3 || Math.abs(enemy.vy) > 0.3;
    const walkAnim = isMoving ? Math.sin(time / 80 + Math.PI) * 4 : 0;
    const bounceAnim = isMoving ? Math.abs(Math.sin(time / 80 + Math.PI)) * 2 : 0;
    
    ctx.save();
    ctx.translate(0, -bounceAnim);
    
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.ellipse(-8, 18 + walkAnim, 6, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 18 - walkAnim, 6, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.ellipse(-8, 12 + walkAnim, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 12 - walkAnim, 5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.ellipse(-8, 27 + walkAnim, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 27 - walkAnim, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.ellipse(-8, 26 + walkAnim, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 26 - walkAnim, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyGradient = ctx.createRadialGradient(0, 6, 0, 0, 6, size / 1.8);
    bodyGradient.addColorStop(0, '#ef5350');
    bodyGradient.addColorStop(0.5, '#e53935');
    bodyGradient.addColorStop(1, '#b71c1c');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 5, size / 2.2, size / 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#7f0000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 5, size / 2.2, size / 2.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#ffcdd2';
    ctx.beginPath();
    ctx.ellipse(0, 0, size / 3, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;
    ctx.strokeText('9', 0, 8);
    ctx.fillText('9', 0, 8);
    
    const armAnim = isMoving ? Math.sin(time / 100 + Math.PI) * 3 : 0;
    ctx.fillStyle = '#f44336';
    
    ctx.save();
    ctx.translate(-12, 5);
    ctx.rotate(-0.6 + armAnim * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(12, 5);
    ctx.rotate(0.6 - armAnim * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.ellipse(-16, 8 + armAnim, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 8 - armAnim, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const headGradient = ctx.createRadialGradient(-3, -15, 0, 0, -12, size / 1.5);
    headGradient.addColorStop(0, '#ffe0b2');
    headGradient.addColorStop(0.6, '#ffcc80');
    headGradient.addColorStop(1, '#ffb74d');
    
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -12, size / 1.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -12, size / 1.8, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.ellipse(0, -24, size / 1.7, size / 4.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(-12, -22, 7, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -22, 7, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(-15, -26, -8, -28);
    ctx.quadraticCurveTo(0, -26, 0, -20);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.quadraticCurveTo(15, -26, 8, -28);
    ctx.quadraticCurveTo(0, -26, 0, -20);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -14, 6, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#b71c1c';
    const enemyLookDir = ball.owner === 'player' ? Math.min(2, Math.max(-2, (ball.x - enemy.x) * 0.02)) : 0;
    ctx.beginPath();
    ctx.arc(-6 + enemyLookDir, -13, 3, 0, Math.PI * 2);
    ctx.arc(8 + enemyLookDir, -13, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7 + enemyLookDir, -15, 1.2, 0, Math.PI * 2);
    ctx.arc(7 + enemyLookDir, -15, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-7, -21, -2, -17);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(12, -18);
    ctx.quadraticCurveTo(7, -21, 2, -17);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 138, 128, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-13, -7, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 200, 200, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-13, -7, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 6, Math.PI + 0.15, -0.15);
    ctx.stroke();
    
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.arc(0, -1, 3, 0, Math.PI);
    ctx.fill();
    
    if (enemy.hasBall) {
        const glowPulse = Math.sin(time / 150) * 0.3 + 1;
        
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, (size + 20) * glowPulse);
        glowGradient.addColorStop(0, 'rgba(244, 67, 54, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(244, 67, 54, 0.2)');
        glowGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, (size + 20) * glowPulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -time / 50;
        ctx.beginPath();
        ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
    ctx.restore();
}

function drawBall() {
    const x = ball.x;
    const y = ball.y;
    const size = GAME_CONFIG.BALL_SIZE;
    const time = Date.now();
    
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, size + 2, size * 0.95, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const ballGradient = ctx.createRadialGradient(-size * 0.35, -size * 0.35, 0, 0, 0, size);
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.3, '#fafafa');
    ballGradient.addColorStop(0.7, '#e0e0e0');
    ballGradient.addColorStop(1, '#bdbdbd');
    
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    const pentagonSize = size * 0.35;
    const pentColor = '#1a1a1a';
    
    ctx.fillStyle = pentColor;
    
    drawPentagon(ctx, 0, 0, pentagonSize);
    
    const angle = time / 1000;
    const offsetX = Math.cos(angle) * 0.1;
    const offsetY = Math.sin(angle) * 0.1;
    
    drawPentagon(ctx, -size * 0.65 + offsetX * size, -size * 0.25 + offsetY * size, pentagonSize * 0.7);
    drawPentagon(ctx, size * 0.65 + offsetX * size, -size * 0.25 + offsetY * size, pentagonSize * 0.7);
    drawPentagon(ctx, -size * 0.4 + offsetX * size, size * 0.55 + offsetY * size, pentagonSize * 0.7);
    drawPentagon(ctx, size * 0.4 + offsetX * size, size * 0.55 + offsetY * size, pentagonSize * 0.7);
    drawPentagon(ctx, 0, -size * 0.7 + offsetY * size, pentagonSize * 0.6);
    
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 2]);
    
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + angle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * size * 0.8, Math.sin(a) * size * 0.8);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.35, -size * 0.35, size * 0.3, size * 0.2, -0.6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.15, -size * 0.5, size * 0.15, size * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size - 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    const eyeSize = size * 0.25;
    const eyeY = -size * 0.1;
    const eyeSpacing = size * 0.35;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    let pupilOffsetX = 0;
    if (ball.owner) {
        const targetX = ball.owner === 'player' ? player.x : enemy.x;
        const targetY = ball.owner === 'player' ? player.y : enemy.y;
        const distX = targetX - x;
        const distY = targetY - y;
        const dist = Math.sqrt(distX * distX + distY * distY);
        if (dist > 0) {
            pupilOffsetX = (distX / dist) * eyeSize * 0.2;
        }
    }
    
    ctx.fillStyle = '#212121';
    const pupilSize = eyeSize * 0.5;
    ctx.beginPath();
    ctx.arc(-eyeSpacing + pupilOffsetX, eyeY, pupilSize, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + pupilOffsetX, eyeY, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + pupilOffsetX - eyeSize * 0.15, eyeY - eyeSize * 0.2, pupilSize * 0.35, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + pupilOffsetX - eyeSize * 0.15, eyeY - eyeSize * 0.2, pupilSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    if (ball.expression === '😃' || ball.expression === '😄') {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, size * 0.3, size * 0.35, 0.1, Math.PI - 0.1);
        ctx.stroke();
        
        ctx.fillStyle = '#ff8a80';
        ctx.beginPath();
        ctx.arc(0, size * 0.35, size * 0.2, 0, Math.PI);
        ctx.fill();
    } else if (ball.expression === '😠' || ball.expression === '😤') {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing - eyeSize, eyeY - eyeSize * 1.3);
        ctx.quadraticCurveTo(-eyeSpacing, eyeY - eyeSize * 0.9, -eyeSpacing + eyeSize, eyeY - eyeSize * 1.3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(eyeSpacing - eyeSize, eyeY - eyeSize * 1.3);
        ctx.quadraticCurveTo(eyeSpacing, eyeY - eyeSize * 0.9, eyeSpacing + eyeSize, eyeY - eyeSize * 1.3);
        ctx.stroke();
        
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, size * 0.5, size * 0.3, Math.PI + 0.15, -0.15);
        ctx.stroke();
    } else {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, size * 0.15, size * 0.25, 0.1, Math.PI - 0.1);
        ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(255, 138, 128, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing - eyeSize * 0.8, eyeY + eyeSize * 0.6, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeSpacing + eyeSize * 0.8, eyeY + eyeSize * 0.6, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (ball.isMoving) {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed > 5) {
            const trailCount = Math.min(5, Math.floor(speed / 2));
            
            for (let i = 1; i <= trailCount; i++) {
                const alpha = 0.4 - i * 0.07;
                const trailSize = size * (1 - i * 0.12);
                
                ctx.globalAlpha = alpha;
                
                const trailGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, trailSize);
                trailGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = trailGradient;
                ctx.beginPath();
                ctx.arc(-ball.vx * i * 0.3, -ball.vy * i * 0.3, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }
    
    if (GAME_STATE.fireShotActive && ball.owner === 'player') {
        const firePulse = Math.sin(time / 50) * 0.3 + 1;
        
        for (let i = 0; i < 8; i++) {
            const fireAngle = (i / 8) * Math.PI * 2 + time / 150;
            const fireDist = size * (1.2 + firePulse * 0.2);
            const fireX = Math.cos(fireAngle) * fireDist;
            const fireY = Math.sin(fireAngle) * fireDist;
            const fireSize = 3 + Math.sin(time / 80 + i) * 2;
            
            ctx.fillStyle = `rgba(255, ${87 + Math.sin(time / 100 + i) * 40}, 0, ${0.7 + Math.sin(time / 100 + i) * 0.2})`;
            ctx.beginPath();
            ctx.arc(fireX, fireY, fireSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.lineDashOffset = -time / 30;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

function drawPentagon(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function drawItems() {
    for (let item of DROPPED_ITEMS) {
        ctx.save();
        ctx.translate(item.x, item.y);
        
        const time = Date.now();
        const pulse = Math.sin(time / 180) * 0.25 + 1;
        const float = Math.sin(time / 300) * 4;
        
        ctx.translate(0, float);
        ctx.scale(pulse, pulse);
        
        if (item.type === GAME_CONFIG.ITEM_SPEED_BOOTS) {
            const glowSize = 22 + Math.sin(time / 80) * 4;
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            glowGradient.addColorStop(0, 'rgba(0, 188, 212, 0.7)');
            glowGradient.addColorStop(0.4, 'rgba(0, 188, 212, 0.3)');
            glowGradient.addColorStop(1, 'rgba(0, 188, 212, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            for (let i = 0; i < 6; i++) {
                const rayAngle = (i / 6) * Math.PI * 2 + time / 400;
                const rayDist = 15 + Math.sin(time / 100 + i) * 3;
                const rayX = Math.cos(rayAngle) * rayDist;
                const rayY = Math.sin(rayAngle) * rayDist;
                
                ctx.strokeStyle = `rgba(0, 188, 212, ${0.5 + Math.sin(time / 100 + i) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(rayX * 0.5, rayY * 0.5);
                ctx.lineTo(rayX, rayY);
                ctx.stroke();
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.ellipse(0, 20, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const soleGradient = ctx.createLinearGradient(-12, 8, -12, 12);
            soleGradient.addColorStop(0, '#006064');
            soleGradient.addColorStop(1, '#00838f');
            
            ctx.fillStyle = soleGradient;
            ctx.beginPath();
            ctx.moveTo(-14, 10);
            ctx.lineTo(14, 10);
            ctx.quadraticCurveTo(16, 2, 12, -3);
            ctx.lineTo(-12, -3);
            ctx.quadraticCurveTo(-16, 2, -14, 10);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#004d40';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            const upperGradient = ctx.createLinearGradient(0, -3, 0, 4);
            upperGradient.addColorStop(0, '#4dd0e1');
            upperGradient.addColorStop(0.5, '#26c6da');
            upperGradient.addColorStop(1, '#00bcd4');
            
            ctx.fillStyle = upperGradient;
            ctx.beginPath();
            ctx.moveTo(-12, -3);
            ctx.lineTo(-10, -15);
            ctx.quadraticCurveTo(0, -12, 10, -15);
            ctx.lineTo(12, -3);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#0097a7';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.strokeStyle = '#0097a7';
            ctx.lineWidth = 1.5;
            
            for (let i = 0; i < 3; i++) {
                const laceY = -6 + i * 4;
                ctx.beginPath();
                ctx.moveTo(-8, laceY);
                ctx.lineTo(8, laceY);
                ctx.stroke();
            }
            
            ctx.strokeStyle = '#0097a7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-11, -3);
            ctx.lineTo(-11, -10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(11, -3);
            ctx.lineTo(11, -10);
            ctx.stroke();
            
            const lightningPulse = Math.sin(time / 60) * 0.4 + 0.6;
            const lightningGlow = ctx.createRadialGradient(0, -2, 0, 0, -2, 15);
            lightningGlow.addColorStop(0, `rgba(255, 235, 59, ${lightningPulse * 0.8})`);
            lightningGlow.addColorStop(1, 'rgba(255, 235, 59, 0)');
            
            ctx.fillStyle = lightningGlow;
            ctx.beginPath();
            ctx.arc(0, -2, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `rgba(255, 235, 59, ${lightningPulse})`;
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowColor = '#ffeb3b';
            ctx.shadowBlur = 15;
            ctx.fillText('⚡', 0, -2);
            ctx.shadowBlur = 0;
            
        } else if (item.type === GAME_CONFIG.ITEM_GOLDEN_BALL) {
            const glowSize = 25 + Math.sin(time / 80) * 5;
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            glowGradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.5)');
            glowGradient.addColorStop(0.6, 'rgba(255, 152, 0, 0.2)');
            glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            for (let i = 0; i < 8; i++) {
                const rayAngle = (i / 8) * Math.PI * 2 + time / 300;
                const rayDist = 18 + Math.sin(time / 120 + i) * 4;
                const rayX = Math.cos(rayAngle) * rayDist;
                const rayY = Math.sin(rayAngle) * rayDist;
                
                ctx.strokeStyle = `rgba(255, 193, 7, ${0.6 + Math.sin(time / 120 + i) * 0.3})`;
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(rayX * 0.4, rayY * 0.4);
                ctx.lineTo(rayX, rayY);
                ctx.stroke();
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.ellipse(0, 18, 10, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const ballSize = 14;
            
            const ballGradient = ctx.createRadialGradient(-ballSize * 0.3, -ballSize * 0.3, 0, 0, 0, ballSize);
            ballGradient.addColorStop(0, '#fff9c4');
            ballGradient.addColorStop(0.2, '#ffeb3b');
            ballGradient.addColorStop(0.5, '#ffd700');
            ballGradient.addColorStop(0.8, '#ffc107');
            ballGradient.addColorStop(1, '#ff8f00');
            
            ctx.fillStyle = ballGradient;
            ctx.beginPath();
            ctx.arc(0, 0, ballSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ff6f00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, ballSize, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(-ballSize * 0.35, -ballSize * 0.35, ballSize * 0.35, ballSize * 0.2, -0.6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(-ballSize * 0.1, -ballSize * 0.55, ballSize * 0.2, ballSize * 0.12, -0.3, 0, Math.PI * 2);
            ctx.fill();
            
            const starPulse = Math.sin(time / 120) * 0.4 + 0.6;
            const starPositions = [
                { x: 0, y: -1, size: 8, angle: 0 },
                { x: -8, y: -5, size: 5, angle: Math.PI / 4 },
                { x: 8, y: -3, size: 4.5, angle: -Math.PI / 6 },
                { x: -4, y: 7, size: 4, angle: Math.PI / 3 },
                { x: 7, y: 5, size: 4.5, angle: -Math.PI / 4 },
                { x: 0, y: -9, size: 3.5, angle: 0 },
            ];
            
            for (let star of starPositions) {
                const starGlow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2);
                starGlow.addColorStop(0, `rgba(255, 255, 255, ${starPulse * 0.8})`);
                starGlow.addColorStop(0.5, `rgba(255, 235, 59, ${starPulse * 0.4})`);
                starGlow.addColorStop(1, 'rgba(255, 235, 59, 0)');
                
                ctx.fillStyle = starGlow;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            
            for (let star of starPositions) {
                ctx.save();
                ctx.translate(star.x, star.y);
                ctx.rotate(time / 500 + star.angle);
                ctx.font = `bold ${star.size * 1.2}px Arial`;
                ctx.fillText('★', 0, 0);
                ctx.restore();
            }
            
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = 'bold 8px Arial';
            ctx.fillText('✨', 0, -1);
        }
        
        ctx.restore();
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawRain() {
    ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
    ctx.lineWidth = 1.5;
    
    for (let drop of rainDrops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 5, drop.y + drop.length);
        ctx.stroke();
    }
}

function drawInitialScreen() {
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffc107';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ 萌星足球 ⚽', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('WASD - 移动 | Shift - 冲刺', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('J - 射门/抢断 | K - 必杀技', canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('点击"开始游戏"按钮开始比赛', canvas.width / 2, canvas.height / 2 + 100);
}

window.onload = initGame;
