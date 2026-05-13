const UI = {
    elements: {},
    
    init() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            hud: document.getElementById('hud'),
            healthFill: document.getElementById('healthFill'),
            comboDisplay: document.getElementById('comboDisplay'),
            comboCount: document.getElementById('comboCount'),
            levelNum: document.getElementById('levelNum'),
            scoreNum: document.getElementById('scoreNum'),
            finalScore: document.getElementById('final-score'),
            victoryScore: document.getElementById('victory-score'),
            
            startBtn: document.getElementById('startBtn'),
            continueBtn: document.getElementById('continueBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            quitBtn: document.getElementById('quitBtn'),
            retryBtn: document.getElementById('retryBtn'),
            menuBtn: document.getElementById('menuBtn'),
            nextLevelBtn: document.getElementById('nextLevelBtn'),
            victoryMenuBtn: document.getElementById('victoryMenuBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            
            glideAbility: document.getElementById('glideAbility'),
            batarangAbility: document.getElementById('batarangAbility'),
            finisherAbility: document.getElementById('finisherAbility')
        };
        
        this.bindEvents();
        this.checkSavedGame();
    },
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => Game.startNewGame());
        this.elements.continueBtn.addEventListener('click', () => Game.continueGame());
        this.elements.resumeBtn.addEventListener('click', () => Game.togglePause());
        this.elements.restartBtn.addEventListener('click', () => {
            Game.togglePause();
            Game.startNewGame();
        });
        this.elements.quitBtn.addEventListener('click', () => {
            Game.togglePause();
            this.showScreen('start');
        });
        this.elements.retryBtn.addEventListener('click', () => Game.startNewGame());
        this.elements.menuBtn.addEventListener('click', () => this.showScreen('start'));
        this.elements.nextLevelBtn.addEventListener('click', () => Game.nextLevel());
        this.elements.victoryMenuBtn.addEventListener('click', () => this.showScreen('start'));
        this.elements.pauseBtn.addEventListener('click', () => Game.togglePause());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && Game.isPlaying) {
                Game.togglePause();
            }
        });
    },
    
    checkSavedGame() {
        if (StorageManager.hasSave()) {
            this.elements.continueBtn.style.display = 'block';
        }
    },
    
    showScreen(screenName) {
        ['start', 'pause', 'gameOver', 'victory'].forEach(name => {
            this.elements[name + 'Screen'].classList.remove('active');
        });
        
        if (screenName && screenName !== 'none') {
            this.elements[screenName + 'Screen'].classList.add('active');
            this.elements.hud.style.display = 'none';
        } else {
            this.elements.hud.style.display = 'flex';
        }
    },
    
    updateHealth(health, maxHealth) {
        const percent = (health / maxHealth) * 100;
        this.elements.healthFill.style.width = percent + '%';
    },
    
    updateCombo(count) {
        if (count > 0) {
            this.elements.comboDisplay.classList.add('active');
            this.elements.comboCount.textContent = count;
        } else {
            this.elements.comboDisplay.classList.remove('active');
        }
    },
    
    updateLevel(level) {
        this.elements.levelNum.textContent = level + 1;
    },
    
    updateScore(score) {
        this.elements.scoreNum.textContent = score;
    },
    
    updateAbilities(levelConfig) {
        this.elements.glideAbility.style.opacity = levelConfig.hasGlide ? '1' : '0.3';
        this.elements.batarangAbility.style.opacity = levelConfig.hasBatarang ? '1' : '0.3';
        this.elements.finisherAbility.style.opacity = levelConfig.hasFinisher ? '1' : '0.3';
    },
    
    showGameOver(score) {
        this.elements.finalScore.textContent = '最终分数: ' + score;
        this.showScreen('gameOver');
    },
    
    showVictory(score) {
        this.elements.victoryScore.textContent = '关卡分数: ' + score;
        this.showScreen('victory');
    }
};