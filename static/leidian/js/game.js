const Game = (() => {
    let canvas, ctx;
    let isRunning = false;
    let isPaused = false;
    let lastTime = 0;
    let animationId = null;
    
    const init = () => {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        ctx = canvas.getContext('2d');
        canvas.width = Config.CANVAS_WIDTH;
        canvas.height = Config.CANVAS_HEIGHT;
        
        Input.init(canvas);
        UI.init();
        Effects.initStars();
        
        UI.bindEvents({
            onStart: start,
            onPause: pause,
            onResume: resume,
            onRestart: restart,
            onQuit: quit
        });
        
        const hasSavedState = loadState();
        if (hasSavedState && isRunning) {
            UI.showHUD();
            UI.updateHUD(
                Level.getScore(),
                Level.getCurrentLevel(),
                Level.getCurrentWave(),
                Player.getState().lives
            );
            render();
            lastTime = performance.now();
            if (isPaused) {
                UI.showPauseScreen();
            } else {
                gameLoop(lastTime);
            }
        } else {
            UI.showStartScreen();
        }
    };
    
    const start = () => {
        Player.init();
        Bullet.clear();
        Enemy.clear();
        PowerUp.clear();
        Effects.clear();
        Level.init();
        
        isRunning = true;
        isPaused = false;
        lastTime = performance.now();
        
        UI.showHUD();
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        gameLoop(lastTime);
        
        saveState();
    };
    
    const pause = () => {
        if (!isRunning || isPaused) return;
        isPaused = true;
        UI.showPauseScreen();
    };
    
    const resume = () => {
        if (!isRunning || !isPaused) return;
        isPaused = false;
        UI.showHUD();
        lastTime = performance.now();
    };
    
    const restart = () => {
        isRunning = false;
        isPaused = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        Storage.clear();
        start();
    };
    
    const quit = () => {
        isRunning = false;
        isPaused = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        Storage.clear();
        UI.showStartScreen();
    };
    
    const gameLoop = (currentTime) => {
        if (!isRunning) return;
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        if (!isPaused) {
            update(deltaTime, currentTime);
            render();
            saveState();
        }
        
        animationId = requestAnimationFrame(gameLoop);
    };
    
    const update = (deltaTime, currentTime) => {
        Player.update(deltaTime);
        
        const bullets = Player.shoot(currentTime);
        bullets.forEach(bullet => Bullet.addPlayerBullet(bullet));
        
        Bullet.update();
        
        const playerState = Player.getState();
        Enemy.update(
            playerState.x + playerState.width / 2,
            playerState.y + playerState.height / 2,
            currentTime
        );
        
        Level.spawnWave(currentTime);
        
        PowerUp.update();
        
        Effects.update();
        
        const bulletResult = Collision.checkPlayerBullets();
        Level.addScore(bulletResult.scoreGain);
        bulletResult.drops.forEach(drop => {
            const powerUp = PowerUp.create(drop.x, drop.y);
            PowerUp.add(powerUp);
        });
        
        const playerState2 = Player.getState();
        
        let hit = Collision.checkEnemyBullets(playerState2);
        hit = hit || Collision.checkEnemies(playerState2);
        
        if (hit) {
            const isDead = Player.takeDamage();
            if (isDead) {
                gameOver();
                return;
            }
        }
        
        const powerUpScore = Collision.checkPowerUps(playerState2);
        Level.addScore(powerUpScore);
        
        const levelResult = Level.checkLevelComplete();
        if (levelResult === 'victory') {
            victory();
            return;
        }
        
        UI.updateHUD(
            Level.getScore(),
            Level.getCurrentLevel(),
            Level.getCurrentWave(),
            Player.getState().lives
        );
    };
    
    const render = () => {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        Effects.draw(ctx);
        PowerUp.draw(ctx);
        Enemy.draw(ctx);
        Bullet.draw(ctx);
        Player.draw(ctx);
    };
    
    const gameOver = () => {
        isRunning = false;
        isPaused = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        Storage.clear();
        UI.showGameOverScreen(Level.getScore());
    };
    
    const victory = () => {
        isRunning = false;
        isPaused = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        Storage.clear();
        UI.showVictoryScreen(Level.getScore());
    };
    
    const saveState = () => {
        const state = {
            player: Player.getState(),
            bullet: Bullet.getState(),
            enemy: Enemy.getState(),
            powerUp: PowerUp.getState(),
            effects: Effects.getState(),
            level: Level.getState(),
            isRunning,
            isPaused
        };
        Storage.save(state);
    };
    
    const loadState = () => {
        const state = Storage.load();
        if (!state) return false;
        
        try {
            Player.restoreState(state.player);
            Bullet.restoreState(state.bullet);
            Enemy.restoreState(state.enemy);
            PowerUp.restoreState(state.powerUp);
            Effects.restoreState(state.effects);
            Level.restoreState(state.level);
            
            isRunning = state.isRunning;
            isPaused = state.isPaused;
            
            return true;
        } catch (e) {
            console.error('Failed to restore game state:', e);
            return false;
        }
    };
    
    return {
        init,
        start,
        pause,
        resume,
        restart,
        quit,
        loadState
    };
})();
