const UI = {
    hud: null,
    healthFill: null,
    manaFill: null,
    scoreDisplay: null,
    levelDisplay: null,
    startScreen: null,
    pauseScreen: null,
    gameOverScreen: null,
    victoryScreen: null,
    mobileControls: null,
    
    init() {
        this.hud = document.getElementById('hud');
        this.healthFill = document.getElementById('health-fill');
        this.manaFill = document.getElementById('mana-fill');
        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameOverScreen = document.getElementById('gameover-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        this.mobileControls = document.getElementById('mobile-controls');
        
        this.setupButtons();
    },
    
    setupButtons() {
        document.getElementById('start-btn').addEventListener('click', () => {
            Game.startGame();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            Game.resumeGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            Game.restartLevel();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            Game.quitToMenu();
        });
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            Game.restartLevel();
        });
        
        document.getElementById('quit-gameover-btn').addEventListener('click', () => {
            Game.quitToMenu();
        });
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            Game.nextLevel();
        });
        
        document.getElementById('quit-victory-btn').addEventListener('click', () => {
            Game.quitToMenu();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            Game.pauseGame();
        });
    },
    
    showHUD() {
        this.hud.classList.remove('hidden');
        if (window.innerWidth <= 768) {
            this.mobileControls.classList.remove('hidden');
        }
    },
    
    hideHUD() {
        this.hud.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
    },
    
    updateHealth(current, max) {
        const percentage = (current / max) * 100;
        this.healthFill.style.width = percentage + '%';
    },
    
    updateMana(current, max) {
        const percentage = (current / max) * 100;
        this.manaFill.style.width = percentage + '%';
    },
    
    updateScore(score) {
        this.scoreDisplay.textContent = '得分: ' + score;
    },
    
    updateLevel(levelNum, levelName) {
        this.levelDisplay.textContent = '关卡 ' + levelNum + ': ' + levelName;
    },
    
    showStartScreen() {
        this.hideAllScreens();
        this.startScreen.classList.add('active');
    },
    
    showPauseScreen() {
        this.pauseScreen.classList.add('active');
    },
    
    hidePauseScreen() {
        this.pauseScreen.classList.remove('active');
    },
    
    showGameOverScreen(finalScore) {
        this.hideAllScreens();
        document.getElementById('final-score').textContent = '得分: ' + finalScore;
        this.gameOverScreen.classList.add('active');
    },
    
    showVictoryScreen(score, bonus) {
        this.hideAllScreens();
        document.getElementById('victory-score').textContent = '得分: ' + score;
        document.getElementById('victory-bonus').textContent = '奖励: ' + bonus;
        this.victoryScreen.classList.add('active');
    },
    
    hideAllScreens() {
        this.startScreen.classList.remove('active');
        this.pauseScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.victoryScreen.classList.remove('active');
    },
    
    showLevelTransition(levelNum, callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        
        const title = document.createElement('h2');
        title.textContent = '关卡 ' + levelNum;
        title.style.cssText = `
            color: #00ffff;
            font-size: 48px;
            margin-bottom: 20px;
            text-shadow: 0 0 20px #00ffff;
        `;
        
        const subtitle = document.createElement('p');
        subtitle.textContent = LevelData[levelNum]?.name || '未知关卡';
        subtitle.style.cssText = `
            color: #ff00ff;
            font-size: 24px;
            text-shadow: 0 0 10px #ff00ff;
        `;
        
        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
                if (callback) callback();
            }, 500);
        }, 2000);
    }
};
