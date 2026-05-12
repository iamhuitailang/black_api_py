document.addEventListener('DOMContentLoaded', () => {
    console.log('游戏初始化开始...');
    const canvas = document.getElementById('game-canvas');
    console.log('Canvas元素:', canvas);
    const game = new Game(canvas);
    console.log('Game实例创建成功:', game);
    
    function setCanvasSize() {
        canvas.width = 480;
        canvas.height = 700;
        canvas.style.width = '480px';
        canvas.style.height = '700px';
        if (game && game.setCanvasSize) {
            game.setCanvasSize(480, 700);
        }
    }
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const startScreen = document.getElementById('start-screen');
    const levelsScreen = document.getElementById('levels-screen');
    const gameScreen = document.getElementById('game-screen');
    const pauseMenu = document.getElementById('pause-menu');
    const winMenu = document.getElementById('win-menu');
    const loseMenu = document.getElementById('lose-menu');

    const startBtn = document.getElementById('start-btn');
    const levelsBtn = document.getElementById('levels-btn');
    const backToStartBtn = document.getElementById('back-to-start');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const quitBtn = document.getElementById('quit-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const replayBtn = document.getElementById('replay-btn');
    const winQuitBtn = document.getElementById('win-quit-btn');
    const retryBtn = document.getElementById('retry-btn');
    const loseQuitBtn = document.getElementById('lose-quit-btn');

    const levelIndicator = document.getElementById('level-indicator');
    const starsCollectedSpan = document.getElementById('stars-collected');
    const starsTotalSpan = document.getElementById('stars-total');
    const winStarsDisplay = document.getElementById('win-stars-display');

    const levelsGrid = document.getElementById('levels-grid');

    function showScreen(screen) {
        [startScreen, levelsScreen, gameScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function showMenu(menu) {
        [pauseMenu, winMenu, loseMenu].forEach(m => {
            m.classList.add('hidden');
        });
        menu.classList.remove('hidden');
    }

    function hideAllMenus() {
        [pauseMenu, winMenu, loseMenu].forEach(m => {
            m.classList.add('hidden');
        });
    }

    function generateLevelButtons() {
        levelsGrid.innerHTML = '';
        const totalLevels = LevelManager.getTotalLevels();
        const maxUnlocked = storageManager.getMaxUnlockedLevel();

        for (let i = 1; i <= totalLevels; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;

            if (i > maxUnlocked) {
                btn.classList.add('locked');
            } else {
                const progress = storageManager.getLevelProgress(i);
                if (progress.completed) {
                    btn.classList.add('completed');
                }
                btn.addEventListener('click', () => startLevel(i));
            }

            levelsGrid.appendChild(btn);
        }
    }

    function startLevel(levelNumber) {
        console.log('开始加载关卡:', levelNumber);
        setCanvasSize();
        game.setCanvasSize(480, 700);
        game.loadLevel(levelNumber, true);
        console.log('关卡加载完成，糖果对象:', game.candy);
        console.log('绳索对象:', game.ropes);
        game.start();
        updateLevelUI();
        showScreen(gameScreen);
        hideAllMenus();
    }

    function updateLevelUI() {
        levelIndicator.textContent = `关卡 ${game.currentLevel}`;
        starsCollectedSpan.textContent = game.getStarsCollected();
        starsTotalSpan.textContent = game.getTotalStars();
    }

    function updateWinStars() {
        const stars = game.getStarsCollected();
        let starsText = '';
        for (let i = 0; i < stars; i++) {
            starsText += '⭐';
        }
        for (let i = stars; i < game.getTotalStars(); i++) {
            starsText += '☆';
        }
        winStarsDisplay.textContent = starsText;
    }

    startBtn.addEventListener('click', () => {
        startLevel(1);
    });

    levelsBtn.addEventListener('click', () => {
        generateLevelButtons();
        showScreen(levelsScreen);
    });

    backToStartBtn.addEventListener('click', () => {
        showScreen(startScreen);
    });

    pauseBtn.addEventListener('click', () => {
        game.pause();
        showMenu(pauseMenu);
    });

    resumeBtn.addEventListener('click', () => {
        game.resume();
        hideAllMenus();
    });

    restartBtn.addEventListener('click', () => {
        storageManager.clearGameState(game.currentLevel);
        game.restart();
        hideAllMenus();
    });

    quitBtn.addEventListener('click', () => {
        game.stop();
        hideAllMenus();
        showScreen(startScreen);
    });

    nextLevelBtn.addEventListener('click', () => {
        if (game.hasNextLevel()) {
            game.nextLevel();
            game.start();
            updateLevelUI();
            hideAllMenus();
        } else {
            hideAllMenus();
            showScreen(startScreen);
        }
    });

    replayBtn.addEventListener('click', () => {
        game.restart();
        game.start();
        hideAllMenus();
    });

    winQuitBtn.addEventListener('click', () => {
        game.stop();
        hideAllMenus();
        showScreen(startScreen);
    });

    retryBtn.addEventListener('click', () => {
        game.restart();
        game.start();
        hideAllMenus();
    });

    loseQuitBtn.addEventListener('click', () => {
        game.stop();
        hideAllMenus();
        showScreen(startScreen);
    });

    function checkGameState() {
        if (game.isWin && winMenu.classList.contains('hidden')) {
            updateWinStars();
            showMenu(winMenu);
            game.isWin = false;
        }
        if (game.isGameOver && loseMenu.classList.contains('hidden')) {
            showMenu(loseMenu);
            game.isGameOver = false;
        }
        updateLevelUI();
        requestAnimationFrame(checkGameState);
    }
    checkGameState();

    window.addEventListener('beforeunload', () => {
        if (!gameScreen.classList.contains('hidden') && !game.isWin && !game.isGameOver) {
            game.saveGameState();
        }
    });

    showScreen(startScreen);
});
