const Menu = (() => {
    const screens = {
        start: document.getElementById('startScreen'),
        levelSelect: document.getElementById('levelSelectScreen'),
        featherSelect: document.getElementById('featherSelectScreen'),
        pause: document.getElementById('pauseMenu'),
        gameOver: document.getElementById('gameOverScreen'),
        levelComplete: document.getElementById('levelCompleteScreen'),
        hud: document.getElementById('gameHUD')
    };

    const hideAllScreens = () => {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    };

    const showScreen = (screenName) => {
        hideAllScreens();
        if (screens[screenName]) {
            screens[screenName].classList.remove('hidden');
        }
    };

    const showStartScreen = () => {
        showScreen('start');
    };

    const showLevelSelect = () => {
        updateLevelGrid();
        showScreen('levelSelect');
    };

    const showFeatherSelect = () => {
        updateFeatherGrid();
        showScreen('featherSelect');
    };

    const showPauseMenu = () => {
        showScreen('pause');
    };

    const showGameOver = (message) => {
        document.getElementById('gameOverMessage').textContent = message;
        showScreen('gameOver');
    };

    const showLevelComplete = (score, stars) => {
        document.getElementById('levelScore').textContent = `得分: ${score}`;
        const starText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('levelStars').textContent = starText;
        showScreen('levelComplete');
    };

    const showHUD = () => {
        screens.hud.classList.remove('hidden');
    };

    const hideHUD = () => {
        screens.hud.classList.add('hidden');
    };

    const updateLevelGrid = () => {
        const grid = document.getElementById('levelGrid');
        const state = Storage.getState();
        const levels = Levels.getAllLevels();
        
        grid.innerHTML = '';
        
        levels.forEach(level => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            
            if (level.id <= state.maxUnlockedLevel) {
                btn.classList.add('unlocked');
                if (state.levelScores[level.id]) {
                    btn.classList.add('completed');
                }
                btn.textContent = level.id;
                btn.addEventListener('click', () => {
                    Audio.playClick();
                    Game.startLevel(level.id);
                });
            } else {
                btn.classList.add('locked');
                btn.textContent = '🔒';
            }
            
            grid.appendChild(btn);
        });
    };

    const updateFeatherGrid = () => {
        const grid = document.getElementById('featherGrid');
        const state = Storage.getState();
        const feathers = Feathers.getAllFeathers();
        
        grid.innerHTML = '';
        
        feathers.forEach(feather => {
            const card = document.createElement('div');
            card.className = 'feather-card';
            
            const isUnlocked = state.unlockedFeathers.includes(feather.id);
            const isSelected = state.selectedFeather === feather.id;
            
            if (isUnlocked) {
                if (isSelected) {
                    card.classList.add('selected');
                }
                card.addEventListener('click', () => {
                    Audio.playClick();
                    Storage.selectFeather(feather.id);
                    updateFeatherGrid();
                });
            } else {
                card.classList.add('locked');
            }
            
            card.innerHTML = `
                <div class="feather-icon">${feather.icon}</div>
                <div class="feather-name">${feather.name}</div>
                <div class="feather-desc">${isUnlocked ? feather.description : '通关第' + feather.unlockLevel + '关解锁'}</div>
            `;
            
            grid.appendChild(card);
        });
    };

    const updateHUD = (level, score) => {
        document.getElementById('levelDisplay').textContent = `关卡 ${level}`;
        document.getElementById('scoreDisplay').textContent = `得分: ${score}`;
    };

    const showUnlockNotification = (text) => {
        const notification = document.getElementById('unlockNotification');
        document.getElementById('unlockText').textContent = text;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    };

    return {
        showStartScreen,
        showLevelSelect,
        showFeatherSelect,
        showPauseMenu,
        showGameOver,
        showLevelComplete,
        showHUD,
        hideHUD,
        hideAllScreens,
        updateHUD,
        showUnlockNotification
    };
})();