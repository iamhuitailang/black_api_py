const UI = (() => {
    let mainMenu, pauseMenu, gameOverMenu, gameHUD;
    let healthFill, healthText, skillFill, timerEl, floorDisplay;
    let startBtn, resumeBtn, continueBtn, restartBtn, quitBtn, retryBtn, backMenuBtn;
    let pauseBtn;
    let gameResult, gameStats;
    
    const init = () => {
        mainMenu = document.getElementById('main-menu');
        pauseMenu = document.getElementById('pause-menu');
        gameOverMenu = document.getElementById('game-over-menu');
        gameHUD = document.getElementById('game-hud');
        
        healthFill = document.getElementById('health-fill');
        healthText = document.getElementById('health-text');
        skillFill = document.getElementById('skill-fill');
        timerEl = document.getElementById('timer');
        floorDisplay = document.getElementById('floor-display');
        
        startBtn = document.getElementById('start-btn');
        resumeBtn = document.getElementById('resume-btn');
        continueBtn = document.getElementById('continue-btn');
        restartBtn = document.getElementById('restart-btn');
        quitBtn = document.getElementById('quit-btn');
        retryBtn = document.getElementById('retry-btn');
        backMenuBtn = document.getElementById('back-menu-btn');
        pauseBtn = document.getElementById('pause-btn');
        
        gameResult = document.getElementById('game-result');
        gameStats = document.getElementById('game-stats');
        
        setupCharacterSelect();
    };
    
    const setupCharacterSelect = () => {
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
    };
    
    const getSelectedCharacter = () => {
        const selected = document.querySelector('.character-card.selected');
        return selected ? selected.dataset.character : 'agent';
    };
    
    const showMainMenu = (hasSavedGame = false) => {
        mainMenu.classList.remove('hidden');
        pauseMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        gameHUD.classList.add('hidden');
        
        if (hasSavedGame) {
            resumeBtn.classList.remove('hidden');
        } else {
            resumeBtn.classList.add('hidden');
        }
    };
    
    const showPauseMenu = () => {
        pauseMenu.classList.remove('hidden');
    };
    
    const hidePauseMenu = () => {
        pauseMenu.classList.add('hidden');
    };
    
    const showGameOver = (won, stats) => {
        gameHUD.classList.add('hidden');
        gameOverMenu.classList.remove('hidden');
        
        gameResult.textContent = won ? '🎉 生存成功！' : '💀 生存失败！';
        gameResult.style.color = won ? '#22c55e' : '#ef4444';
        
        gameStats.innerHTML = `
            存活时间: ${stats.survivalTime}秒<br>
            到达楼层: ${stats.floor}F<br>
            击败敌人: ${stats.enemiesKilled}
        `;
    };
    
    const showGameHUD = () => {
        mainMenu.classList.add('hidden');
        pauseMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        gameHUD.classList.remove('hidden');
    };
    
    const updateHealth = (current, max) => {
        const percent = (current / max) * 100;
        healthFill.style.width = `${percent}%`;
        healthText.textContent = `${Math.ceil(current)}/${max}`;
        
        if (percent < 25) {
            healthFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        } else if (percent < 50) {
            healthFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
        }
    };
    
    const updateSkill = (current, max) => {
        const percent = (current / max) * 100;
        skillFill.style.width = `${percent}%`;
    };
    
    const updateTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (seconds <= 30) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
    };
    
    const updateFloor = (floor) => {
        floorDisplay.textContent = `${Math.floor(floor)}F`;
    };
    
    const onStartClick = (callback) => {
        startBtn.addEventListener('click', callback);
    };
    
    const onResumeClick = (callback) => {
        resumeBtn.addEventListener('click', callback);
    };
    
    const onPauseClick = (callback) => {
        pauseBtn.addEventListener('click', callback);
    };
    
    const onContinueClick = (callback) => {
        continueBtn.addEventListener('click', callback);
    };
    
    const onRestartClick = (callback) => {
        restartBtn.addEventListener('click', callback);
    };
    
    const onQuitClick = (callback) => {
        quitBtn.addEventListener('click', callback);
    };
    
    const onRetryClick = (callback) => {
        retryBtn.addEventListener('click', callback);
    };
    
    const onBackMenuClick = (callback) => {
        backMenuBtn.addEventListener('click', callback);
    };
    
    return {
        init,
        getSelectedCharacter,
        showMainMenu,
        showPauseMenu,
        hidePauseMenu,
        showGameOver,
        showGameHUD,
        updateHealth,
        updateSkill,
        updateTimer,
        updateFloor,
        onStartClick,
        onResumeClick,
        onPauseClick,
        onContinueClick,
        onRestartClick,
        onQuitClick,
        onRetryClick,
        onBackMenuClick
    };
})();