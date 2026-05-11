(function() {
    let canvas = null;
    let selectedMode = null;
    let selectedDifficulty = null;
    
    function init() {
        canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        
        canvas.width = Constants.CANVAS.WIDTH;
        canvas.height = Constants.CANVAS.HEIGHT;
        
        setupUI();
        checkSavedGame();
        
        Engine.init(canvas, GameStateManager);
        InputSystem.init(canvas, GameStateManager, Engine);
    }
    
    function setupUI() {
        const startBtn = document.getElementById('start-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const backToStartBtn = document.getElementById('back-to-start-btn');
        const backToModeBtn = document.getElementById('back-to-mode-btn');
        
        const pauseBtn = document.getElementById('pause-btn');
        const resumeGameBtn = document.getElementById('resume-game-btn');
        const restartBtn = document.getElementById('restart-btn');
        const quitBtn = document.getElementById('quit-btn');
        
        const playAgainBtn = document.getElementById('play-again-btn');
        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        
        if (startBtn) startBtn.addEventListener('click', showModeScreen);
        if (resumeBtn) resumeBtn.addEventListener('click', resumeSavedGame);
        if (backToStartBtn) backToStartBtn.addEventListener('click', showStartScreen);
        if (backToModeBtn) backToModeBtn.addEventListener('click', showModeScreen);
        
        if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
        if (resumeGameBtn) resumeGameBtn.addEventListener('click', resumeGame);
        if (restartBtn) restartBtn.addEventListener('click', restartGame);
        if (quitBtn) quitBtn.addEventListener('click', quitGame);
        
        if (playAgainBtn) playAgainBtn.addEventListener('click', playAgain);
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', backToMenu);
        
        const weaponItems = document.querySelectorAll('.weapon-item');
        weaponItems.forEach(item => {
            item.addEventListener('click', () => {
                const weapon = item.dataset.weapon;
                selectWeapon(weapon, item);
            });
        });
        
        window.pauseGame = pauseGame;
        window.resumeGame = resumeGame;
    }
    
    function checkSavedGame() {
        const resumeBtn = document.getElementById('resume-btn');
        if (Storage.hasSavedGame()) {
            if (resumeBtn) resumeBtn.classList.remove('hidden');
        } else {
            if (resumeBtn) resumeBtn.classList.add('hidden');
        }
    }
    
    function showStartScreen() {
        hideAllOverlays();
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.remove('hidden');
        checkSavedGame();
    }
    
    function showModeScreen() {
        hideAllOverlays();
        const modeScreen = document.getElementById('mode-screen');
        if (modeScreen) modeScreen.classList.remove('hidden');
        
        populateModeList();
    }
    
    function showDifficultyScreen() {
        hideAllOverlays();
        const difficultyScreen = document.getElementById('difficulty-screen');
        if (difficultyScreen) difficultyScreen.classList.remove('hidden');
        
        populateDifficultyList();
    }
    
    function hideAllOverlays() {
        const overlays = document.querySelectorAll('.overlay');
        overlays.forEach(overlay => overlay.classList.add('hidden'));
    }
    
    function populateModeList() {
        const modeList = document.getElementById('mode-list');
        if (!modeList) return;
        
        modeList.innerHTML = '';
        
        const modes = Object.values(Constants.GAME_MODES);
        modes.forEach(mode => {
            const item = document.createElement('div');
            item.className = 'mode-item';
            item.dataset.mode = mode.id;
            item.innerHTML = `
                <h3>${mode.name}</h3>
                <p>${mode.description}</p>
            `;
            item.addEventListener('click', () => {
                selectedMode = mode.id;
                showDifficultyScreen();
            });
            modeList.appendChild(item);
        });
    }
    
    function populateDifficultyList() {
        const difficultyList = document.getElementById('difficulty-list');
        if (!difficultyList) return;
        
        difficultyList.innerHTML = '';
        
        const difficulties = Object.values(Constants.DIFFICULTIES);
        difficulties.forEach(diff => {
            const item = document.createElement('div');
            item.className = 'difficulty-item';
            item.dataset.difficulty = diff.id;
            item.innerHTML = `
                <h3>${diff.name}</h3>
                <p>${diff.description || getDifficultyDescription(diff)}</p>
            `;
            item.addEventListener('click', () => {
                selectedDifficulty = diff.id;
                startGame();
            });
            difficultyList.appendChild(item);
        });
    }
    
    function getDifficultyDescription(diff) {
        let desc = '';
        if (diff.gravity === 0) desc += '关闭重力，';
        else if (diff.gravity === 0.4) desc += '真实重力，';
        else desc += '开启重力，';
        
        if (diff.wind === 0) desc += '无风，';
        else if (diff.variableWind) desc += '变化风，';
        else desc += '微风，';
        
        if (diff.timeLimit) desc += `${diff.timeLimit}秒/关`;
        else desc += '无时间限制';
        
        return desc;
    }
    
    function selectWeapon(weapon, element) {
        const weaponItems = document.querySelectorAll('.weapon-item');
        weaponItems.forEach(item => item.classList.remove('active'));
        
        if (element) element.classList.add('active');
        
        GameStateManager.setArrowType(weapon);
        
        const gameObjects = Engine.getGameObjects();
        if (gameObjects.bow) {
            gameObjects.bow.setArrowType(weapon);
        }
    }
    
    function startGame() {
        if (!selectedMode || !selectedDifficulty) return;
        
        hideAllOverlays();
        showGameUI();
        
        GameStateManager.init(selectedMode, selectedDifficulty, handleGameOver);
        
        const bow = new Bow(
            Constants.CANVAS.WIDTH * 0.15,
            Constants.CANVAS.HEIGHT * 0.55
        );
        Engine.setBow(bow);
        
        const gameObjects = Engine.getGameObjects();
        GameStateManager.spawnTargets(gameObjects, GameStateManager);
        
        const defaultWeapon = document.querySelector('.weapon-item[data-weapon="wood"]');
        if (defaultWeapon) {
            selectWeapon('wood', defaultWeapon);
        }
        
        GameStateManager.saveProgress();
        if (window.startAutoSave) {
            window.startAutoSave();
        }
        
        Engine.start();
    }
    
    function resumeSavedGame() {
        if (!GameStateManager.loadProgress()) {
            showModeScreen();
            return;
        }
        
        selectedMode = GameStateManager.getCurrentMode();
        selectedDifficulty = GameStateManager.getCurrentDifficulty();
        
        if (!selectedMode || !selectedDifficulty) {
            showModeScreen();
            return;
        }
        
        hideAllOverlays();
        showGameUI();
        
        GameStateManager.resume(handleGameOver);
        
        const bow = new Bow(
            Constants.CANVAS.WIDTH * 0.15,
            Constants.CANVAS.HEIGHT * 0.55
        );
        Engine.setBow(bow);
        
        const gameObjects = Engine.getGameObjects();
        GameStateManager.spawnTargets(gameObjects, GameStateManager);
        
        const currentWeapon = GameStateManager.getCurrentArrowType();
        const weaponElement = document.querySelector(`.weapon-item[data-weapon="${currentWeapon}"]`);
        if (weaponElement) {
            selectWeapon(currentWeapon, weaponElement);
        }
        
        GameStateManager.updateUI();
        GameStateManager.saveProgress();
        if (window.startAutoSave) {
            window.startAutoSave();
        }
        
        Engine.start();
    }
    
    function showGameUI() {
        const scoreBoard = document.getElementById('score-board');
        const weaponSelector = document.getElementById('weapon-selector');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (scoreBoard) scoreBoard.classList.remove('hidden');
        if (weaponSelector) weaponSelector.classList.remove('hidden');
        if (pauseBtn) pauseBtn.classList.remove('hidden');
    }
    
    function hideGameUI() {
        const scoreBoard = document.getElementById('score-board');
        const weaponSelector = document.getElementById('weapon-selector');
        const pauseBtn = document.getElementById('pause-btn');
        const windIndicator = document.getElementById('wind-indicator');
        
        if (scoreBoard) scoreBoard.classList.add('hidden');
        if (weaponSelector) weaponSelector.classList.add('hidden');
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (windIndicator) windIndicator.classList.add('hidden');
    }
    
    function pauseGame() {
        if (!Engine.isRunning() || Engine.isPaused()) return;
        
        Engine.pause();
        TimerSystem.pause();
        
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) {
            const pauseScore = document.getElementById('pause-current-score');
            if (pauseScore) pauseScore.textContent = GameStateManager.getScore();
            pauseScreen.classList.remove('hidden');
        }
    }
    
    function resumeGame() {
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) pauseScreen.classList.add('hidden');
        
        Engine.resume();
        TimerSystem.resume();
    }
    
    function restartGame() {
        hideAllOverlays();
        
        Engine.clearAll();
        GameStateManager.reset();
        
        const bow = new Bow(
            Constants.CANVAS.WIDTH * 0.15,
            Constants.CANVAS.HEIGHT * 0.55
        );
        Engine.setBow(bow);
        
        const gameObjects = Engine.getGameObjects();
        GameStateManager.spawnTargets(gameObjects, GameStateManager);
        
        const defaultWeapon = document.querySelector('.weapon-item[data-weapon="wood"]');
        if (defaultWeapon) {
            selectWeapon('wood', defaultWeapon);
        }
        
        Engine.resume();
    }
    
    function quitGame() {
        Engine.stop();
        Engine.clearAll();
        TimerSystem.stop();
        WindSystem.stop();
        
        if (window.stopAutoSave) {
            window.stopAutoSave();
        }
        Storage.clearSavedGame();
        
        hideGameUI();
        showStartScreen();
    }
    
    function handleGameOver() {
        Engine.stop();
        
        if (window.stopAutoSave) {
            window.stopAutoSave();
        }
        Storage.clearSavedGame();
        
        hideGameUI();
        
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            const finalScore = document.getElementById('final-score');
            const finalHighScore = document.getElementById('final-high-score');
            const totalHits = document.getElementById('total-hits');
            const perfectHits = document.getElementById('perfect-hits');
            const gameOverTitle = document.getElementById('game-over-title');
            
            if (finalScore) finalScore.textContent = GameStateManager.getScore();
            if (finalHighScore) finalHighScore.textContent = GameStateManager.getHighScore();
            if (totalHits) totalHits.textContent = GameStateManager.getTotalHits();
            if (perfectHits) perfectHits.textContent = GameStateManager.getPerfectHits();
            
            if (GameStateManager.getScore() >= GameStateManager.getHighScore() && GameStateManager.getScore() > 0) {
                if (gameOverTitle) gameOverTitle.textContent = '新纪录!';
            } else {
                if (gameOverTitle) gameOverTitle.textContent = '游戏结束';
            }
            
            gameOverScreen.classList.remove('hidden');
        }
    }
    
    function playAgain() {
        hideAllOverlays();
        showGameUI();
        
        Engine.clearAll();
        GameStateManager.init(selectedMode, selectedDifficulty, handleGameOver);
        
        const bow = new Bow(
            Constants.CANVAS.WIDTH * 0.15,
            Constants.CANVAS.HEIGHT * 0.55
        );
        Engine.setBow(bow);
        
        const gameObjects = Engine.getGameObjects();
        GameStateManager.spawnTargets(gameObjects, GameStateManager);
        
        const defaultWeapon = document.querySelector('.weapon-item[data-weapon="wood"]');
        if (defaultWeapon) {
            selectWeapon('wood', defaultWeapon);
        }
        
        Engine.start();
    }
    
    function backToMenu() {
        Engine.clearAll();
        TimerSystem.stop();
        WindSystem.stop();
        
        if (window.stopAutoSave) {
            window.stopAutoSave();
        }
        Storage.clearSavedGame();
        
        hideGameUI();
        showStartScreen();
    }
    
    window.addEventListener('load', init);
    
    window.addEventListener('beforeunload', (e) => {
        if (Engine.isRunning() && !GameStateManager.isGameOver()) {
            GameStateManager.saveProgress();
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            if (Engine.isRunning() && !GameStateManager.isGameOver()) {
                GameStateManager.saveProgress();
            }
        }
    });
    
    let autoSaveInterval = null;
    
    window.startAutoSave = function() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        autoSaveInterval = setInterval(() => {
            if (Engine.isRunning() && !GameStateManager.isGameOver()) {
                GameStateManager.saveProgress();
            }
        }, 3000);
    };
    
    window.stopAutoSave = function() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
    };
})();