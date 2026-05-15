const Game = (() => {
    let currentLevel = 1;
    let score = 0;
    let isPaused = false;
    let isRunning = false;
    let gameTime = 0;
    let lastTime = 0;

    let feather = null;
    let wind = null;
    let obstacles = [];
    let powerups = [];
    let levelConfig = null;

    let playerInput = 0;
    let keys = {};
    let touchStartX = 0;

    const init = () => {
        Renderer.init('gameCanvas');
        setupEventListeners();
        Menu.showStartScreen();
        
        const state = Storage.getState();
        if (state.gameInProgress && state.savedGameState) {
            restoreGameState(state.savedGameState);
        }
    };

    const setupEventListeners = () => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        document.getElementById('startBtn').addEventListener('click', () => {
            Audio.playClick();
            startLevel(Storage.getState().currentLevel || 1);
        });

        document.getElementById('selectLevelBtn').addEventListener('click', () => {
            Audio.playClick();
            Menu.showLevelSelect();
        });

        document.getElementById('selectFeatherBtn').addEventListener('click', () => {
            Audio.playClick();
            Menu.showFeatherSelect();
        });

        document.getElementById('backToStartBtn').addEventListener('click', () => {
            Audio.playClick();
            Menu.showStartScreen();
        });

        document.getElementById('backToStartBtn2').addEventListener('click', () => {
            Audio.playClick();
            Menu.showStartScreen();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            Audio.playClick();
            pauseGame();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            Audio.playClick();
            resumeGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            Audio.playClick();
            restartLevel();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            Audio.playClick();
            quitToMenu();
        });

        document.getElementById('retryBtn').addEventListener('click', () => {
            Audio.playClick();
            restartLevel();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            Audio.playClick();
            quitToMenu();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            Audio.playClick();
            nextLevel();
        });

        document.getElementById('replayBtn').addEventListener('click', () => {
            Audio.playClick();
            restartLevel();
        });

        document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    const handleKeyDown = (e) => {
        keys[e.key] = true;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            playerInput = -1;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            playerInput = 1;
        }
        if (e.key === 'Escape' && isRunning) {
            pauseGame();
        }
    };

    const handleKeyUp = (e) => {
        keys[e.key] = false;
        if (!keys['ArrowLeft'] && !keys['a'] && !keys['A'] && !keys['ArrowRight'] && !keys['d'] && !keys['D']) {
            playerInput = 0;
        }
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        
        if (Math.abs(diff) > 10) {
            playerInput = diff > 0 ? 1 : -1;
        }
    };

    const handleTouchEnd = () => {
        playerInput = 0;
    };

    const handleVisibilityChange = () => {
        if (document.hidden && isRunning && !isPaused) {
            saveGameState();
        }
    };

    const startLevel = (levelId) => {
        currentLevel = levelId;
        levelConfig = Levels.getLevel(levelId);
        score = 0;
        gameTime = 0;
        isPaused = false;
        isRunning = true;

        const featherConfig = Feathers.getFeather(Storage.getState().selectedFeather);
        feather = Feather.create({ ...featherConfig, x: 275, y: 50 });

        wind = Wind.create(levelConfig);
        obstacles = Obstacles.create(levelConfig.obstacles);
        powerups = Powerups.create(levelConfig.powerups);

        Storage.setCurrentLevel(levelId);
        Menu.hideAllScreens();
        Menu.showHUD();
        Menu.updateHUD(currentLevel, score);

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    };

    const gameLoop = (currentTime) => {
        if (!isRunning) return;
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        if (!isPaused) {
            update(deltaTime);
            render();
        }

        requestAnimationFrame(gameLoop);
    };

    const update = (deltaTime) => {
        gameTime += deltaTime;

        wind.update(deltaTime);
        feather.update(wind.getForce(), playerInput, deltaTime);
        Obstacles.updateAll(obstacles, deltaTime);
        Powerups.updateAll(powerups, deltaTime);

        const powerupScore = Powerups.checkCollisions(powerups, feather);
        if (powerupScore > 0) {
            Audio.playCollectPowerup();
            score += powerupScore;
            Menu.updateHUD(currentLevel, score);
        }

        const collision = Obstacles.checkCollisions(obstacles, feather);
        if (collision && !feather.hasShield) {
            if (collision.type === 'vortex') {
                gameOver('被乱流卷走了！');
            } else {
                gameOver('撞到障碍物了！');
            }
            return;
        }

        if (feather.y >= 550) {
            const safeZone = levelConfig.safeZone;
            if (feather.x >= safeZone.x && feather.x <= safeZone.x + safeZone.width) {
                levelComplete();
            } else {
                gameOver('没有落到安全区域！');
            }
        }

        if (Math.floor(gameTime / 5000) !== Math.floor((gameTime - deltaTime) / 5000)) {
            saveGameState();
        }
    };

    const render = () => {
        Renderer.clear();
        Renderer.drawBackground(levelConfig.theme);
        Renderer.drawSafeZone(levelConfig.safeZone, gameTime);
        Renderer.drawWindParticles(wind.getParticles());
        Renderer.drawObstacles(obstacles, gameTime);
        Renderer.drawPowerups(powerups, gameTime);
        Renderer.drawFeather(feather);
    };

    const pauseGame = () => {
        isPaused = true;
        saveGameState();
        Menu.showPauseMenu();
    };

    const resumeGame = () => {
        isPaused = false;
        Menu.hideAllScreens();
        Menu.showHUD();
    };

    const restartLevel = () => {
        isRunning = false;
        startLevel(currentLevel);
    };

    const quitToMenu = () => {
        isRunning = false;
        Storage.clearGameProgress();
        Menu.hideHUD();
        Menu.showStartScreen();
    };

    const gameOver = (message) => {
        isRunning = false;
        Audio.playGameOver();
        Storage.clearGameProgress();
        Menu.hideHUD();
        Menu.showGameOver(message);
    };

    const levelComplete = () => {
        isRunning = false;
        Audio.playLevelComplete();

        const timeBonus = Math.max(0, 1000 - Math.floor(gameTime / 100) * 10);
        score += timeBonus;

        let stars = 1;
        if (score >= 300) stars = 3;
        else if (score >= 150) stars = 2;

        Storage.saveLevelScore(currentLevel, score, stars);

        const nextLevelId = currentLevel + 1;
        if (nextLevelId <= Levels.getAllLevels().length) {
            Storage.unlockLevel(nextLevelId);
        }

        checkUnlocks();

        Storage.clearGameProgress();
        Menu.hideHUD();
        Menu.showLevelComplete(score, stars);
    };

    const checkUnlocks = () => {
        const state = Storage.getState();
        const feathers = Feathers.getAllFeathers();

        feathers.forEach(feather => {
            if (!state.unlockedFeathers.includes(feather.id) && feather.unlockLevel <= state.maxUnlockedLevel) {
                Storage.unlockFeather(feather.id);
                setTimeout(() => {
                    Menu.showUnlockNotification(`解锁新羽毛：${feather.name}！`);
                }, 500);
            }
        });
    };

    const nextLevel = () => {
        const next = currentLevel + 1;
        if (next <= Levels.getAllLevels().length) {
            startLevel(next);
        } else {
            Menu.showStartScreen();
            setTimeout(() => {
                Menu.showUnlockNotification('恭喜通关所有关卡！');
            }, 500);
        }
    };

    const saveGameState = () => {
        if (!isRunning || !feather || !wind) return;
        
        const gameState = {
            level: currentLevel,
            score: score,
            gameTime: gameTime,
            feather: {
                x: feather.x,
                y: feather.y,
                vx: feather.vx,
                vy: feather.vy,
                rotation: feather.rotation,
                swingAngle: feather.swingAngle,
                hasShield: feather.hasShield,
                shieldTime: feather.shieldTime,
                isSlow: feather.isSlow,
                slowTime: feather.slowTime
            },
            wind: {
                currentForce: wind.currentForce,
                targetForce: wind.targetForce,
                holdTime: wind.holdTime,
                changeTimer: wind.changeTimer
            },
            obstacles: obstacles.map(o => ({
                type: o.type,
                x: o.x,
                y: o.y,
                originalX: o.originalX,
                movePhase: o.movePhase
            })),
            powerups: powerups.map(p => ({
                type: p.type,
                x: p.x,
                y: p.y,
                collected: p.collected,
                floatPhase: p.floatPhase
            }))
        };
        Storage.saveGameProgress(gameState);
    };

    const restoreGameState = (savedState) => {
        try {
            currentLevel = savedState.level;
            levelConfig = Levels.getLevel(currentLevel);
            score = savedState.score;
            gameTime = savedState.gameTime;
            isPaused = true;
            isRunning = true;

            const featherConfig = Feathers.getFeather(Storage.getState().selectedFeather);
            feather = Feather.create({
                ...featherConfig,
                x: savedState.feather.x,
                y: savedState.feather.y
            });
            feather.vx = savedState.feather.vx;
            feather.vy = savedState.feather.vy;
            feather.rotation = savedState.feather.rotation;
            feather.swingAngle = savedState.feather.swingAngle || 0;
            feather.hasShield = savedState.feather.hasShield;
            feather.shieldTime = savedState.feather.shieldTime;
            feather.isSlow = savedState.feather.isSlow;
            feather.slowTime = savedState.feather.slowTime;

            wind = Wind.create(levelConfig);
            if (savedState.wind) {
                wind.currentForce = savedState.wind.currentForce || 0;
                wind.targetForce = savedState.wind.targetForce || 0;
                wind.holdTime = savedState.wind.holdTime || 0;
                wind.changeTimer = savedState.wind.changeTimer || 0;
            }

            obstacles = Obstacles.create(levelConfig.obstacles);
            obstacles.forEach((o, i) => {
                if (savedState.obstacles && savedState.obstacles[i]) {
                    o.x = savedState.obstacles[i].x;
                    o.y = savedState.obstacles[i].y;
                    o.originalX = savedState.obstacles[i].originalX || o.originalX;
                    o.movePhase = savedState.obstacles[i].movePhase || 0;
                }
            });

            powerups = Powerups.create(levelConfig.powerups);
            powerups.forEach((p, i) => {
                if (savedState.powerups && savedState.powerups[i]) {
                    p.collected = savedState.powerups[i].collected;
                    p.floatPhase = savedState.powerups[i].floatPhase || 0;
                }
            });

            Menu.showPauseMenu();
            Menu.showHUD();
            Menu.updateHUD(currentLevel, score);

            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        } catch (e) {
            console.error('Failed to restore game state:', e);
            Storage.clearGameProgress();
            Menu.showStartScreen();
        }
    };

    return {
        init,
        startLevel
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});