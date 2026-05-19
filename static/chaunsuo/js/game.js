const Game = (function() {
    let canvas, ctx;
    let gameState = 'menu';
    let score = 0;
    let distance = 0;
    let speed = 5;
    let animationId = null;
    let lastTime = 0;
    let saveTimer = 0;

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        
        Tunnel.init(canvas);
        Player.init(canvas);
        Obstacles.init(canvas);
        Particles.init(canvas);
        UI.init();
        
        bindUIEvents();
        
        const savedState = Storage.loadGameState();
        if (savedState && savedState.gameState === 'playing') {
            loadState(savedState);
            gameState = 'paused';
            UI.hideAllScreens();
            UI.showPauseScreen();
        } else {
            UI.showStartScreen();
        }
        
        render();
    }

    function bindUIEvents() {
        UI.on('start', startGame);
        UI.on('pause', pauseGame);
        UI.on('resume', resumeGame);
        UI.on('restart', restartGame);
        UI.on('quit', quitToMenu);
        UI.on('menu', quitToMenu);
        UI.on('togglePause', togglePause);
    }

    function startGame() {
        resetGame();
        gameState = 'playing';
        UI.hideAllScreens();
        lastTime = performance.now();
        gameLoop();
    }

    function resetGame() {
        score = 0;
        distance = 0;
        speed = 5;
        saveTimer = 0;
        
        Player.reset();
        Obstacles.reset();
        Particles.reset();
        
        updateUI();
    }

    function pauseGame() {
        if (gameState === 'playing') {
            gameState = 'paused';
            cancelAnimationFrame(animationId);
            UI.showPauseScreen();
            saveGameState();
        }
    }

    function resumeGame() {
        if (gameState === 'paused') {
            gameState = 'playing';
            UI.hidePauseScreen();
            lastTime = performance.now();
            gameLoop();
        }
    }

    function togglePause() {
        if (gameState === 'playing') {
            pauseGame();
        } else if (gameState === 'paused') {
            resumeGame();
        }
    }

    function restartGame() {
        UI.hideAllScreens();
        startGame();
    }

    function quitToMenu() {
        gameState = 'menu';
        cancelAnimationFrame(animationId);
        Storage.clearGameState();
        UI.showStartScreen();
        render();
    }

    function gameLoop(currentTime = 0) {
        if (gameState !== 'playing') return;
        
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        update(deltaTime);
        render();
        
        saveTimer++;
        if (saveTimer >= 60) {
            saveGameState();
            saveTimer = 0;
        }
        
        animationId = requestAnimationFrame(gameLoop);
    }

    function update(deltaTime) {
        distance += speed * 0.1;
        speed = 5 + Math.floor(distance / 500) * 0.5;
        if (speed > 25) speed = 25;
        
        score += Math.floor(speed * 0.1);
        
        Tunnel.setSpeed(speed);
        Obstacles.setSpeed(speed);
        Particles.setSpeed(speed);
        
        Tunnel.update();
        Player.update();
        Obstacles.update();
        Particles.update();
        
        checkCollisions();
        updateUI();
    }

    function checkCollisions() {
        const playerBounds = Player.getBounds();
        const collision = Obstacles.checkCollision(playerBounds);
        
        if (collision) {
            const types = Obstacles.getTypes();
            
            if (collision.type === types.ORB) {
                score += collision.scoreBonus;
                Player.collectOrb();
                Particles.createCollectEffect(collision.x, collision.y);
            } else {
                score = Math.max(0, score - collision.scorePenalty);
                const isDead = Player.takeDamage(collision.damage);
                Particles.createExplosion(collision.x, collision.y, collision.color, 25);
                
                if (isDead) {
                    gameOver();
                }
            }
        }
    }

    function gameOver() {
        gameState = 'gameover';
        cancelAnimationFrame(animationId);
        
        const playerX = Player.getX() + Player.getWidth() / 2;
        const playerY = Player.getY() + Player.getHeight() / 2;
        
        Particles.createExplosion(playerX, playerY, '#ff3366', 40);
        Particles.createExplosion(playerX - 15, playerY - 10, '#ff6600', 20);
        Particles.createExplosion(playerX + 15, playerY + 10, '#ffff00', 20);
        
        for (let i = 0; i < 10; i++) {
            Particles.update();
        }
        
        render();
        
        const isNewScoreRecord = Storage.setHighScore(score);
        const isNewDistanceRecord = Storage.setHighDistance(Math.floor(distance));
        const isNewRecord = isNewScoreRecord || isNewDistanceRecord;
        
        Storage.clearGameState();
        UI.updateMenuRecords();
        UI.showGameOverScreen(score, distance, isNewRecord);
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        Tunnel.draw();
        Obstacles.draw();
        Particles.draw();
        
        if (gameState !== 'gameover') {
            Player.draw();
        }
    }

    function updateUI() {
        UI.updateScore(score);
        UI.updateDistance(distance);
        UI.updateHealth(Player.getHealth(), Player.getMaxHealth());
        UI.updateHighScore(Storage.getHighScore());
    }

    function saveGameState() {
        const state = {
            gameState,
            score,
            distance,
            speed,
            player: Player.getState(),
            obstacles: Obstacles.getState(),
            timestamp: Date.now()
        };
        Storage.saveGameState(state);
    }

    function loadState(state) {
        if (!state) return;
        
        score = state.score || 0;
        distance = state.distance || 0;
        speed = state.speed || 5;
        
        if (state.player) {
            Player.setState(state.player);
        }
        if (state.obstacles) {
            Obstacles.setState(state.obstacles);
        }
        
        updateUI();
    }

    window.addEventListener('resize', () => {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            Player.updateBounds();
            render();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (gameState === 'playing') {
            saveGameState();
        }
    });

    return {
        init
    };
})();

window.addEventListener('load', () => {
    Game.init();
});
