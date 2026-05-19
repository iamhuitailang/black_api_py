const Game = (function() {
    let canvas, ctx;
    let gameState = 'menu';
    let score = 0;
    let distance = 0;
    let baseSpeed = 5;
    let currentSpeed = 5;
    let lastTime = 0;
    let saveTimer = 0;
    let backgroundOffset = 0;
    let snowParticles = [];
    
    const keys = {
        left: false,
        right: false,
        up: false,
        space: false
    };
    
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        UI.init();
        Player.init();
        Obstacle.init();
        Item.init();
        
        setupEventListeners();
        initSnowParticles();
        
        UI.showStartScreen();
        requestAnimationFrame(gameLoop);
    }
    
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = Config.CANVAS_WIDTH * dpr;
        canvas.height = Config.CANVAS_HEIGHT * dpr;
        
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    
    function setupEventListeners() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        UI.getElement('startBtn').addEventListener('click', startGame);
        UI.getElement('restartBtn').addEventListener('click', startGame);
        UI.getElement('resumeBtn').addEventListener('click', resumeGame);
        UI.getElement('quitBtn').addEventListener('click', quitToMenu);
        UI.getElement('pauseBtn').addEventListener('click', togglePause);
        
        let touchStartX = 0;
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            if (gameState === 'playing') {
                Player.jump();
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            keys.left = diff < -30;
            keys.right = diff > 30;
        });
        
        canvas.addEventListener('touchend', () => {
            keys.left = false;
            keys.right = false;
        });
    }
    
    function handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                e.preventDefault();
                if (gameState === 'playing') {
                    Player.jump();
                }
                break;
            case 'Escape':
            case 'p':
            case 'P':
                if (gameState === 'playing' || gameState === 'paused') {
                    togglePause();
                }
                break;
        }
    }
    
    function handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = false;
                break;
        }
    }
    
    function initSnowParticles() {
        snowParticles = [];
        for (let i = 0; i < 100; i++) {
            snowParticles.push({
                x: Math.random() * Config.CANVAS_WIDTH,
                y: Math.random() * Config.CANVAS_HEIGHT,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }
    
    function startGame() {
        Player.init();
        Obstacle.init();
        Item.init();
        score = 0;
        distance = 0;
        baseSpeed = Config.SPEED_LEVELS[0].speed;
        currentSpeed = baseSpeed;
        saveTimer = 0;
        gameState = 'playing';
        Storage.incrementTotalGames();
        UI.hideAllScreens();
        UI.updateHealth(Player.getHealth(), Player.getMaxHealth());
        UI.updateBuffs();
    }
    
    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            UI.showPauseScreen();
        } else if (gameState === 'paused') {
            resumeGame();
        }
    }
    
    function resumeGame() {
        gameState = 'playing';
        UI.hidePauseScreen();
    }
    
    function quitToMenu() {
        gameState = 'menu';
        Storage.clearGameState();
        UI.hideAllScreens();
        UI.showStartScreen();
    }
    
    function gameOver() {
        gameState = 'gameover';
        Storage.updateHighScore(score, distance);
        Storage.clearGameState();
        UI.showGameOverScreen(distance, score);
    }
    
    function saveGameState() {
        const state = {
            score,
            distance,
            baseSpeed,
            currentSpeed,
            player: Player.getState(),
            obstacles: Obstacle.getState(),
            items: Item.getState(),
            gameState
        };
        Storage.saveGameState(state);
    }
    
    function loadSavedGame() {
        const saved = Storage.loadGameState();
        if (saved && saved.gameState === 'playing') {
            score = saved.score;
            distance = saved.distance;
            baseSpeed = saved.baseSpeed;
            currentSpeed = saved.currentSpeed;
            Player.loadState(saved.player);
            Obstacle.loadState(saved.obstacles);
            Item.loadState(saved.items);
            gameState = 'playing';
            UI.hideAllScreens();
            UI.updateHealth(Player.getHealth(), Player.getMaxHealth());
            UI.updateBuffs();
            return true;
        }
        return false;
    }
    
    function update(deltaTime) {
        if (gameState !== 'playing') return;
        
        baseSpeed = Config.getSpeedByDistance(distance);
        currentSpeed = baseSpeed * Player.getSpeedMultiplier();
        
        distance += currentSpeed * 0.1;
        score += currentSpeed * 0.05;
        
        Player.update(keys, deltaTime);
        Obstacle.update(currentSpeed, deltaTime, distance);
        Item.update(currentSpeed, deltaTime);
        
        const playerBounds = Player.getBounds();
        const isJumping = Player.isJumping();
        
        const obstacleHit = Obstacle.checkCollision(playerBounds, isJumping);
        if (obstacleHit.hit) {
            handleObstacleCollision(obstacleHit);
        }
        
        const itemHit = Item.checkCollision(playerBounds);
        if (itemHit.hit) {
            handleItemCollision(itemHit);
        }
        
        UI.updateHUD(distance, score);
        UI.updateHealth(Player.getHealth(), Player.getMaxHealth());
        UI.updateBuffs();
        UI.updateFloatingTexts(deltaTime);
        
        updateSnowParticles();
        backgroundOffset = (backgroundOffset + currentSpeed * 0.5) % 100;
        
        saveTimer += deltaTime;
        if (saveTimer >= 1000) {
            saveGameState();
            saveTimer = 0;
        }
        
        if (Player.getHealth() <= 0) {
            gameOver();
        }
    }
    
    function handleObstacleCollision(hit) {
        const type = hit.type;
        
        if (hit.isCollect) {
            score += type.scoreEffect;
            UI.addFloatingText(hit.obstacle.x, hit.obstacle.y, `+${type.scoreEffect}`, '#27ae60');
            Obstacle.remove(hit.obstacle);
        } else {
            if (type.collisionEffect === 'pit') {
                const damage = Player.takeDamage(1);
                if (damage) {
                    score += type.scoreEffect;
                    UI.addFloatingText(Player.getX(), Player.getY(), `${type.scoreEffect}`, '#e74c3c');
                    Player.setInvincible(1000);
                }
            } else {
                const damage = Player.takeDamage(1);
                if (damage) {
                    score += type.scoreEffect;
                    currentSpeed *= (1 - type.speedReduction);
                    UI.addFloatingText(Player.getX(), Player.getY(), `${type.scoreEffect}`, '#e74c3c');
                }
            }
        }
    }
    
    function handleItemCollision(hit) {
        const type = hit.type;
        const result = Item.applyEffect(type);
        
        let message = '';
        if (result.score) {
            score += result.score;
            message = `+${result.score}`;
        } else {
            message = type.name;
        }
        
        UI.addFloatingText(hit.item.x, hit.item.y, message, '#f39c12');
    }
    
    function updateSnowParticles() {
        snowParticles.forEach(p => {
            p.y += p.speed + currentSpeed * 0.3;
            if (p.y > Config.CANVAS_HEIGHT) {
                p.y = -10;
                p.x = Math.random() * Config.CANVAS_WIDTH;
            }
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);
        
        drawBackground();
        drawSnowParticles();
        
        if (gameState === 'playing' || gameState === 'paused') {
            Obstacle.draw(ctx);
            Item.draw(ctx);
            Player.draw(ctx);
            UI.drawFloatingTexts(ctx);
        }
    }
    
    function drawBackground() {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, Config.CANVAS_HEIGHT * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F4FF');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT * 0.6);
        
        const snowGradient = ctx.createLinearGradient(0, Config.CANVAS_HEIGHT * 0.4, 0, Config.CANVAS_HEIGHT);
        snowGradient.addColorStop(0, '#E0F4FF');
        snowGradient.addColorStop(0.5, '#FFFFFF');
        snowGradient.addColorStop(1, '#F0F8FF');
        ctx.fillStyle = snowGradient;
        ctx.fillRect(0, Config.CANVAS_HEIGHT * 0.4, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT * 0.6);
        
        ctx.fillStyle = 'rgba(176, 196, 222, 0.3)';
        drawMountain(0, Config.CANVAS_HEIGHT * 0.3, 200, 150);
        drawMountain(280, Config.CANVAS_HEIGHT * 0.35, 250, 120);
        
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const y = Config.CANVAS_HEIGHT * 0.5 + (i * 100 + backgroundOffset) % (Config.CANVAS_HEIGHT * 0.5);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(
                Config.CANVAS_WIDTH * 0.25, y - 10,
                Config.CANVAS_WIDTH * 0.75, y + 10,
                Config.CANVAS_WIDTH, y
            );
            ctx.stroke();
        }
    }
    
    function drawMountain(x, y, width, height) {
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width * 0.5, y);
        ctx.lineTo(x + width, y + height);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + height * 0.4);
        ctx.lineTo(x + width * 0.5, y);
        ctx.lineTo(x + width * 0.7, y + height * 0.4);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawSnowParticles() {
        snowParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        });
    }
    
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update(Math.min(deltaTime, 50));
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    window.addEventListener('load', () => {
        init();
        
        const savedGame = Storage.loadGameState();
        if (savedGame && savedGame.savedAt && Date.now() - savedGame.savedAt < 3600000) {
            if (confirm('发现未完成的游戏，是否继续？')) {
                loadSavedGame();
            } else {
                Storage.clearGameState();
            }
        }
    });
    
    window.addEventListener('beforeunload', () => {
        if (gameState === 'playing') {
            saveGameState();
        }
    });
    
    return {
        init,
        startGame,
        togglePause,
        resumeGame,
        quitToMenu
    };
})();
