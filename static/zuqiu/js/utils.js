function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function checkCollision(obj1, obj2, radius1, radius2) {
    const distance = calculateDistance(obj1.x, obj1.y, obj2.x, obj2.y);
    return distance < radius1 + radius2;
}

function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}

function normalize(vx, vy) {
    const length = Math.sqrt(vx * vx + vy * vy);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vx / length, y: vy / length };
}

function saveGameState() {
    const saveData = {
        player: {
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            speedLevel: player.speedLevel,
            accuracyLevel: player.accuracyLevel,
            stamina: player.stamina,
            hasBall: player.hasBall,
            direction: player.direction,
        },
        items: { ...items },
        gameState: {
            currentTime: GAME_STATE.currentTime,
            playerScore: GAME_STATE.playerScore,
            enemyScore: GAME_STATE.enemyScore,
            weather: GAME_STATE.weather,
            isPlaying: GAME_STATE.isPlaying,
            isPaused: GAME_STATE.isPaused,
            isGameOver: GAME_STATE.isGameOver,
        },
        ball: {
            x: ball.x,
            y: ball.y,
            vx: ball.vx,
            vy: ball.vy,
            owner: ball.owner,
        },
        enemy: {
            x: enemy.x,
            y: enemy.y,
            vx: enemy.vx,
            vy: enemy.vy,
            hasBall: enemy.hasBall,
            aiType: enemy.aiType,
            stamina: enemy.stamina,
            direction: enemy.direction,
        },
    };
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error('保存游戏状态失败:', e);
    }
}

function loadGameState() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return false;
        
        const data = JSON.parse(savedData);
        
        const hasValidGameState = data.gameState && data.gameState.isPlaying;
        
        if (data.player) {
            player.speedLevel = data.player.speedLevel || 1;
            player.accuracyLevel = data.player.accuracyLevel || 1;
            player.speed = calculatePlayerSpeed(player.speedLevel);
            player.shotAccuracy = calculateShotAccuracy(player.accuracyLevel);
            player.stamina = data.player.stamina !== undefined ? data.player.stamina : GAME_CONFIG.STAMINA_MAX;
            player.maxStamina = GAME_CONFIG.STAMINA_MAX;
            
            player.x = data.player.x !== undefined ? data.player.x : 200;
            player.y = data.player.y !== undefined ? data.player.y : 250;
            player.vx = data.player.vx !== undefined ? data.player.vx : 0;
            player.vy = data.player.vy !== undefined ? data.player.vy : 0;
            player.hasBall = data.player.hasBall || false;
            player.direction = data.player.direction !== undefined ? data.player.direction : 1;
        }
        
        if (data.items) {
            items = { ...data.items };
        }
        
        if (data.gameState) {
            GAME_STATE.currentTime = data.gameState.currentTime !== undefined ? data.gameState.currentTime : GAME_CONFIG.GAME_DURATION;
            GAME_STATE.playerScore = data.gameState.playerScore !== undefined ? data.gameState.playerScore : 0;
            GAME_STATE.enemyScore = data.gameState.enemyScore !== undefined ? data.gameState.enemyScore : 0;
            GAME_STATE.weather = data.gameState.weather || GAME_CONFIG.WEATHER_SUNNY;
            GAME_STATE.isPlaying = data.gameState.isPlaying || false;
            GAME_STATE.isPaused = data.gameState.isPaused || false;
            GAME_STATE.isGameOver = data.gameState.isGameOver || false;
        }
        
        if (data.ball) {
            ball.x = data.ball.x !== undefined ? data.ball.x : FIELD.centerX;
            ball.y = data.ball.y !== undefined ? data.ball.y : FIELD.centerY;
            ball.vx = data.ball.vx !== undefined ? data.ball.vx : 0;
            ball.vy = data.ball.vy !== undefined ? data.ball.vy : 0;
            ball.owner = data.ball.owner !== undefined ? data.ball.owner : null;
            ball.isMoving = false;
            ball.expression = getBallExpression(ball.owner);
        }
        
        if (data.enemy) {
            enemy.x = data.enemy.x !== undefined ? data.enemy.x : 600;
            enemy.y = data.enemy.y !== undefined ? data.enemy.y : 250;
            enemy.vx = data.enemy.vx !== undefined ? data.enemy.vx : 0;
            enemy.vy = data.enemy.vy !== undefined ? data.enemy.vy : 0;
            enemy.hasBall = data.enemy.hasBall || false;
            enemy.aiType = data.enemy.aiType || GAME_CONFIG.AI_TYPE_DEFENSIVE;
            enemy.stamina = data.enemy.stamina !== undefined ? data.enemy.stamina : GAME_CONFIG.STAMINA_MAX;
            enemy.maxStamina = GAME_CONFIG.STAMINA_MAX;
            enemy.direction = data.enemy.direction !== undefined ? data.enemy.direction : -1;
            enemy.aiCooldown = 0;
        }
        
        if (ball.owner === 'player') {
            player.hasBall = true;
            enemy.hasBall = false;
        } else if (ball.owner === 'enemy') {
            enemy.hasBall = true;
            player.hasBall = false;
        } else {
            player.hasBall = false;
            enemy.hasBall = false;
        }
        
        if (player.hasBall) {
            ball.x = player.x + player.direction * 20;
            ball.y = player.y;
        } else if (enemy.hasBall) {
            ball.x = enemy.x + enemy.direction * (-20);
            ball.y = enemy.y;
        }
        
        return true;
    } catch (e) {
        console.error('加载游戏状态失败:', e);
        return false;
    }
}

function clearGameState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('清除游戏状态失败:', e);
    }
}

function calculatePlayerSpeed(level) {
    const speed = GAME_CONFIG.PLAYER_SPEED_BASE + (level - 1) * GAME_CONFIG.PLAYER_SPEED_LEVEL_UP;
    return Math.min(speed, GAME_CONFIG.PLAYER_SPEED_MAX);
}

function calculateShotAccuracy(level) {
    const accuracy = GAME_CONFIG.SHOT_ACCURACY_BASE + (level - 1) * GAME_CONFIG.SHOT_ACCURACY_LEVEL_UP;
    return Math.min(accuracy, GAME_CONFIG.SHOT_ACCURACY_MAX);
}

function initRainDrops() {
    rainDrops = [];
    for (let i = 0; i < 100; i++) {
        rainDrops.push({
            x: random(0, GAME_CONFIG.CANVAS_WIDTH),
            y: random(0, GAME_CONFIG.CANVAS_HEIGHT),
            speed: random(8, 15),
            length: random(10, 20),
        });
    }
}

function updateRainDrops() {
    for (let drop of rainDrops) {
        drop.y += drop.speed;
        drop.x -= 2;
        
        if (drop.y > GAME_CONFIG.CANVAS_HEIGHT) {
            drop.y = -drop.length;
            drop.x = random(0, GAME_CONFIG.CANVAS_WIDTH);
        }
        
        if (drop.x < 0) {
            drop.x = GAME_CONFIG.CANVAS_WIDTH;
        }
    }
}

function createParticle(x, y, color, vx, vy, life) {
    particles.push({
        x, y, color, vx, vy, life, maxLife: life,
    });
}

function createFireParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(2, 6);
        const colors = ['#ff4500', '#ff6347', '#ffd700', '#ff8c00'];
        createParticle(
            x, y,
            colors[randomInt(0, 3)],
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            random(30, 60)
        );
    }
}

function createGoalParticles(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(3, 8);
        const colors = ['#ffd700', '#ffec8b', '#fff8dc', '#fffacd'];
        createParticle(
            x, y,
            colors[randomInt(0, 3)],
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            random(40, 80)
        );
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vy += 0.1;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function getBallExpression(owner) {
    if (owner === 'player') return '😄';
    if (owner === 'enemy') return '😠';
    return '😊';
}

function checkItemPickup(picker, item) {
    return checkCollision(
        picker, item,
        GAME_CONFIG.PLAYER_SIZE / 2,
        15
    );
}
