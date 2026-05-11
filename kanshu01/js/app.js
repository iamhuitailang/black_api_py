const App = (function() {
    let playerData = null;
    let canvas = null;
    let isInitialized = false;
    
    function init() {
        if (isInitialized) return;
        isInitialized = true;
        
        canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        playerData = Storage.loadPlayerData();
        
        Renderer.init(canvas);
        Game.init(playerData);
        Shop.init(playerData);
        
        const savedState = Storage.loadGameState();
        if (savedState && 
            (savedState.state === GAME_STATE.PLAYING || savedState.state === GAME_STATE.PAUSED)) {
            Game.loadSavedGame(savedState, playerData);
            showResumeScreen();
        } else {
            showStartScreen();
        }
        
        bindUIEvents();
        
        startGameLoop();
    }
    
    function bindUIEvents() {
        const startBtn = document.getElementById('start-btn');
        const shopBtn = document.getElementById('shop-btn');
        const backBtn = document.getElementById('back-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const restartBtn = document.getElementById('restart-btn');
        const quitBtn = document.getElementById('quit-btn');
        const retryBtn = document.getElementById('retry-btn');
        const homeBtn = document.getElementById('home-btn');
        
        if (startBtn) startBtn.addEventListener('click', handleStartGame);
        if (shopBtn) shopBtn.addEventListener('click', showShopScreen);
        if (backBtn) backBtn.addEventListener('click', showStartScreen);
        if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
        if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
        if (restartBtn) restartBtn.addEventListener('click', restartGame);
        if (quitBtn) quitBtn.addEventListener('click', quitToMenu);
        if (retryBtn) retryBtn.addEventListener('click', handleStartGame);
        if (homeBtn) homeBtn.addEventListener('click', showStartScreen);
    }
    
    function showStartScreen() {
        hideAllScreens();
        updateStartScreenStats();
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    function showResumeScreen() {
        const gameState = Game.getState();
        
        initPowerupBar();
        
        const hasChainsaw = playerData.equippedAxe === 'chainsaw';
        Input.init(canvas, hasChainsaw);
        
        Input.setCallback('cutLeft', () => Game.cut(SIDE.LEFT));
        Input.setCallback('cutRight', () => Game.cut(SIDE.RIGHT));
        Input.setCallback('chainsawStart', () => {
            if (navigator.vibrate) navigator.vibrate(50);
        });
        Input.setCallback('chainsawEnd', () => {
            if (navigator.vibrate) navigator.vibrate(0);
        });
        
        Game.setCallback('onScoreChange', updateGameUI);
        Game.setCallback('onWoodChange', updateGameUI);
        Game.setCallback('onGameOver', showGameOverScreen);
        Game.setCallback('onSave', () => {
            Storage.saveGameState(Game.getState());
        });
        
        hideAllScreens();
        showPauseMenu();
    }
    
    function showShopScreen() {
        hideAllScreens();
        Shop.renderShop();
        document.getElementById('shop-screen').classList.remove('hidden');
    }
    
    function showPauseMenu() {
        hideAllScreens();
        document.getElementById('pause-menu').classList.remove('hidden');
    }
    
    function showGameOverScreen(gameState, playerDataState) {
        hideAllScreens();
        document.getElementById('final-score').textContent = gameState.score;
        document.getElementById('final-wood').textContent = gameState.woodGained;
        document.getElementById('game-over-high-score').textContent = playerDataState.highScore;
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    function showGameScreen() {
        hideAllScreens();
        updateGameUI();
    }
    
    function hideAllScreens() {
        const screens = ['start-screen', 'shop-screen', 'pause-menu', 'game-over-screen'];
        screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) screen.classList.add('hidden');
        });
    }
    
    function updateStartScreenStats() {
        const highScoreEl = document.getElementById('high-score');
        const streakEl = document.getElementById('streak');
        if (highScoreEl) highScoreEl.textContent = playerData.highScore;
        if (streakEl) streakEl.textContent = playerData.streak;
    }
    
    function updateGameUI() {
        const gameState = Game.getState();
        const currentScoreEl = document.getElementById('current-score');
        const woodCountEl = document.getElementById('wood-count');
        
        if (currentScoreEl) currentScoreEl.textContent = gameState.score;
        if (woodCountEl) woodCountEl.textContent = gameState.woodGained;
        
        updatePowerupBar();
    }
    
    function initPowerupBar() {
        const powerupSlots = document.getElementById('powerup-slots');
        if (!powerupSlots) return;
        
        powerupSlots.innerHTML = '';
        
        Object.values(CONSTANTS.POWERUPS).forEach(powerup => {
            const slot = document.createElement('div');
            slot.className = 'powerup-slot';
            slot.dataset.powerup = powerup.id;
            slot.style.display = 'none';
            
            slot.innerHTML = `
                <span class="icon">${powerup.icon}</span>
                <span class="timer"></span>
            `;
            
            slot.addEventListener('click', (e) => {
                const powerupId = e.currentTarget.dataset.powerup;
                handlePowerupUse(powerupId);
            });
            
            powerupSlots.appendChild(slot);
        });
    }
    
    function updatePowerupBar() {
        const gameState = Game.getState();
        const powerupBar = document.getElementById('powerup-bar');
        const powerupSlots = document.getElementById('powerup-slots');
        
        if (!powerupBar || !powerupSlots) return;
        
        const slots = powerupSlots.querySelectorAll('.powerup-slot');
        let hasVisibleSlots = false;
        
        Object.values(CONSTANTS.POWERUPS).forEach((powerup, index) => {
            const slot = slots[index];
            if (!slot) return;
            
            const isActive = gameState.activePowerups && gameState.activePowerups[powerup.id];
            const count = playerData.powerups[powerup.id] || 0;
            
            const shouldShow = count > 0 || isActive;
            
            if (shouldShow) {
                hasVisibleSlots = true;
                slot.style.display = 'flex';
                
                if (isActive) {
                    slot.classList.add('active');
                    const timerEl = slot.querySelector('.timer');
                    if (timerEl && isActive.endTime) {
                        const remaining = Math.ceil((isActive.endTime - Date.now()) / 1000);
                        timerEl.textContent = `${remaining}s`;
                    }
                } else {
                    slot.classList.remove('active');
                    const timerEl = slot.querySelector('.timer');
                    if (timerEl) {
                        timerEl.textContent = `x${count}`;
                    }
                }
                
                if (count > 0 && !isActive && gameState.state === GAME_STATE.PLAYING) {
                    slot.style.cursor = 'pointer';
                } else {
                    slot.style.cursor = 'default';
                }
            } else {
                slot.style.display = 'none';
                slot.classList.remove('active');
                slot.style.cursor = 'default';
            }
        });
        
        if (hasVisibleSlots) {
            powerupBar.classList.remove('hidden');
        } else {
            powerupBar.classList.add('hidden');
        }
    }
    
    function handlePowerupUse(powerupId) {
        Game.activatePowerup(powerupId);
        updatePowerupBar();
    }
    
    function handleStartGame() {
        const difficultySelect = document.getElementById('difficulty');
        const difficulty = difficultySelect ? difficultySelect.value : 'beginner';
        
        const gameState = Game.startGame(difficulty);
        
        initPowerupBar();
        
        const hasChainsaw = playerData.equippedAxe === 'chainsaw';
        Input.init(canvas, hasChainsaw);
        
        Input.setCallback('cutLeft', () => Game.cut(SIDE.LEFT));
        Input.setCallback('cutRight', () => Game.cut(SIDE.RIGHT));
        Input.setCallback('chainsawStart', () => {
            if (navigator.vibrate) navigator.vibrate(50);
        });
        Input.setCallback('chainsawEnd', () => {
            if (navigator.vibrate) navigator.vibrate(0);
        });
        
        Game.setCallback('onScoreChange', updateGameUI);
        Game.setCallback('onWoodChange', updateGameUI);
        Game.setCallback('onGameOver', showGameOverScreen);
        Game.setCallback('onSave', () => {
            Storage.saveGameState(Game.getState());
        });
        
        showGameScreen();
    }
    
    function togglePause() {
        const gameState = Game.getState();
        if (gameState.state === GAME_STATE.PLAYING) {
            Game.pause();
            showPauseMenu();
        }
    }
    
    function resumeGame() {
        Game.resume();
        showGameScreen();
    }
    
    function restartGame() {
        handleStartGame();
    }
    
    function quitToMenu() {
        Game.quitToMenu();
        showStartScreen();
    }
    
    function startGameLoop() {
        Renderer.startLoop(() => {
            Game.update();
            
            const gameState = Game.getState();
            Renderer.render(gameState, playerData);
            
            if (gameState.state === GAME_STATE.PLAYING || gameState.state === GAME_STATE.PAUSED) {
                updateGameUI();
            }
            
            if (Game.isVibrating() && navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    }
    
    window.addEventListener('DOMContentLoaded', init);
    
    window.addEventListener('unload', () => {
        const gameState = Game.getState();
        if (gameState.state === GAME_STATE.PLAYING) {
            Storage.saveGameState(gameState);
        }
        Storage.savePlayerData(playerData);
    });
    
    document.addEventListener('visibilitychange', () => {
        const gameState = Game.getState();
        if (document.hidden && gameState.state === GAME_STATE.PLAYING) {
            Game.pause();
            showPauseMenu();
            Storage.saveGameState(gameState);
        }
    });
    
    return {
        init,
        getPlayerData: () => playerData
    };
})();