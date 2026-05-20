class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.elements = {
            angleSlider: document.getElementById('angleSlider'),
            angleValue: document.getElementById('angleValue'),
            powerSlider: document.getElementById('powerSlider'),
            powerValue: document.getElementById('powerValue'),
            throwBtn: document.getElementById('throwBtn'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            quitBtn: document.getElementById('quitBtn'),
            menuScreen: document.getElementById('menuScreen'),
            controlPanel: document.getElementById('controlPanel'),
            pauseScreen: document.getElementById('pauseScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            levelCompleteScreen: document.getElementById('levelCompleteScreen'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            totalScoreDisplay: document.getElementById('totalScoreDisplay'),
            highScoreDisplay: document.getElementById('highScoreDisplay'),
            menuHighScoreDisplay: document.getElementById('menuHighScoreDisplay'),
            menuLevelDisplay: document.getElementById('menuLevelDisplay'),
            knivesLeftDisplay: document.getElementById('knivesLeftDisplay'),
            levelDisplay: document.getElementById('levelDisplay2'),
            sceneSelect: document.getElementById('sceneSelect'),
            knifeSelect: document.getElementById('knifeSelect'),
            strengthSelect: document.getElementById('strengthSelect'),
            targetStateDisplay: document.getElementById('targetStateDisplay'),
            hitFeedback: document.getElementById('hitFeedback'),
            nextLevelBtn: document.getElementById('nextLevelBtn'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            pauseScore: document.getElementById('pauseScore'),
            pauseKnives: document.getElementById('pauseKnives'),
            finalScore: document.getElementById('finalScore'),
            finalHighScore: document.getElementById('finalHighScore'),
            levelScore: document.getElementById('levelScore'),
            levelHits: document.getElementById('levelHits')
        };
    }

    bindEvents() {
        this.elements.angleSlider.addEventListener('input', (e) => {
            this.game.state.angle = parseInt(e.target.value);
            this.elements.angleValue.textContent = e.target.value + '°';
        });

        this.elements.powerSlider.addEventListener('input', (e) => {
            this.game.state.power = parseInt(e.target.value);
            this.elements.powerValue.textContent = e.target.value + '%';
        });

        this.elements.throwBtn.addEventListener('click', () => {
            this.game.throwKnife();
        });

        this.elements.startBtn.addEventListener('click', () => {
            this.game.startGame();
        });

        this.elements.pauseBtn.addEventListener('click', () => {
            this.game.pauseGame();
        });

        this.elements.resumeBtn.addEventListener('click', () => {
            this.game.resumeGame();
        });

        this.elements.restartBtn.addEventListener('click', () => {
            this.game.restartGame();
        });

        this.elements.quitBtn.addEventListener('click', () => {
            this.game.quitToMenu();
        });

        this.elements.sceneSelect.addEventListener('change', (e) => {
            this.game.state.currentScene = e.target.value;
        });

        this.elements.knifeSelect.addEventListener('change', (e) => {
            this.game.state.currentKnifeType = e.target.value;
        });

        this.elements.strengthSelect.addEventListener('change', (e) => {
            this.game.state.throwStrength = e.target.value;
        });

        this.elements.nextLevelBtn.addEventListener('click', () => {
            this.game.nextLevel();
        });

        this.elements.playAgainBtn.addEventListener('click', () => {
            this.game.restartGame();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.game.state.gameStatus === 'playing') {
                    this.game.throwKnife();
                } else if (this.game.state.gameStatus === 'menu') {
                    this.game.startGame();
                }
            } else if (e.code === 'Escape') {
                if (this.game.state.gameStatus === 'playing') {
                    this.game.pauseGame();
                } else if (this.game.state.gameStatus === 'paused') {
                    this.game.resumeGame();
                }
            }
        });
    }

    updateUI() {
        const state = this.game.state;
        
        if (this.elements.scoreDisplay) this.elements.scoreDisplay.textContent = state.score;
        if (this.elements.totalScoreDisplay) this.elements.totalScoreDisplay.textContent = state.totalScore;
        if (this.elements.highScoreDisplay) this.elements.highScoreDisplay.textContent = state.highScore;
        if (this.elements.menuHighScoreDisplay) this.elements.menuHighScoreDisplay.textContent = state.highScore;
        if (this.elements.menuLevelDisplay) this.elements.menuLevelDisplay.textContent = state.currentLevel;
        if (this.elements.knivesLeftDisplay) this.elements.knivesLeftDisplay.textContent = state.knivesLeft;
        if (this.elements.levelDisplay) this.elements.levelDisplay.textContent = state.currentLevel;
        if (this.elements.pauseScore) this.elements.pauseScore.textContent = state.score;
        if (this.elements.pauseKnives) this.elements.pauseKnives.textContent = state.knivesLeft;
        if (this.elements.finalScore) this.elements.finalScore.textContent = state.score;
        if (this.elements.finalHighScore) this.elements.finalHighScore.textContent = state.highScore;
        if (this.elements.levelScore) this.elements.levelScore.textContent = state.score;
        if (this.elements.levelHits) this.elements.levelHits.textContent = state.targetHits;
        
        const stateNames = {
            'static': '静止固定',
            'moving': '左右平移',
            'rotating': '匀速旋转',
            'shaking': '极速晃动',
            'flashing': '随机闪现'
        };
        if (this.elements.targetStateDisplay) {
            this.elements.targetStateDisplay.textContent = stateNames[state.targetState] || state.targetState;
        }
    }

    showScreen(screenName) {
        const overlayScreens = ['menuScreen', 'pauseScreen', 'gameOverScreen', 'levelCompleteScreen'];
        
        overlayScreens.forEach(screen => {
            if (this.elements[screen]) {
                this.elements[screen].style.display = (screen === screenName) ? 'flex' : 'none';
            }
        });
        
        if (this.elements.controlPanel) {
            const isPlaying = (screenName === 'playing' || screenName === 'pauseScreen');
            this.elements.controlPanel.style.display = isPlaying ? 'block' : 'none';
        }
    }

    showHitFeedback(score, zoneName) {
        const feedback = this.elements.hitFeedback;
        feedback.textContent = `+${score} ${zoneName}!`;
        feedback.style.opacity = '1';
        feedback.style.transform = 'translate(-50%, -50%) scale(1.2)';
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 1000);
    }

    updateKnifeOptions(unlockedKnives) {
        const knives = Object.values(GameConfig.KNIFE_TYPES);
        this.elements.knifeSelect.innerHTML = '';
        knives.forEach(knife => {
            const option = document.createElement('option');
            option.value = knife.id;
            option.textContent = knife.name;
            option.disabled = !unlockedKnives.includes(knife.id);
            this.elements.knifeSelect.appendChild(option);
        });
    }

    updateSceneOptions(unlockedScenes) {
        const scenes = Object.values(GameConfig.SCENES);
        this.elements.sceneSelect.innerHTML = '';
        scenes.forEach(scene => {
            const option = document.createElement('option');
            option.value = scene.id;
            option.textContent = scene.name;
            option.disabled = !unlockedScenes.includes(scene.id);
            this.elements.sceneSelect.appendChild(option);
        });
    }

    disableControls(disabled) {
        this.elements.angleSlider.disabled = disabled;
        this.elements.powerSlider.disabled = disabled;
        this.elements.throwBtn.disabled = disabled;
        
        this.elements.angleSlider.style.pointerEvents = disabled ? 'none' : 'auto';
        this.elements.powerSlider.style.pointerEvents = disabled ? 'none' : 'auto';
        this.elements.angleSlider.style.opacity = disabled ? '0.5' : '1';
        this.elements.powerSlider.style.opacity = disabled ? '0.5' : '1';
        
        this.elements.angleSlider.style.cursor = disabled ? 'not-allowed' : 'pointer';
        this.elements.powerSlider.style.cursor = disabled ? 'not-allowed' : 'pointer';
        
        if (!disabled) {
            this.elements.angleSlider.removeAttribute('readonly');
            this.elements.powerSlider.removeAttribute('readonly');
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
