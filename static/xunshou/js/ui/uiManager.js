const UIManager = {
    screens: {},
    currentScreen: null,
    selectedCharacter: 'lion',
    selectedLevel: 1,
    
    init() {
        this.screens = {
            menu: document.getElementById('main-menu'),
            hud: document.getElementById('game-hud'),
            pause: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            levelComplete: document.getElementById('level-complete')
        };
        
        this.selectedCharacter = Storage.getSelectedCharacter();
        this.selectedLevel = Storage.getSelectedLevel();
        
        this.updateHighScore();
        this.renderCharacterList();
        this.renderLevelList();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            if (this.onStartGame) {
                this.onStartGame(this.selectedCharacter, this.selectedLevel);
            }
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (this.onPause) {
                this.onPause();
            }
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            if (this.onResume) {
                this.onResume();
            }
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            if (this.onRestart) {
                this.onRestart();
            }
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            if (this.onQuit) {
                this.onQuit();
            }
        });
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            if (this.onRestart) {
                this.onRestart();
            }
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            if (this.onQuit) {
                this.onQuit();
            }
        });
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            if (this.onNextLevel) {
                this.onNextLevel();
            }
        });
        
        document.getElementById('back-menu-btn').addEventListener('click', () => {
            if (this.onQuit) {
                this.onQuit();
            }
        });
    },
    
    renderCharacterList() {
        const container = document.getElementById('character-list');
        container.innerHTML = '';
        
        CHARACTER_LIST.forEach(charId => {
            const char = CHARACTERS[charId];
            const card = document.createElement('div');
            card.className = 'character-card' + (charId === this.selectedCharacter ? ' selected' : '');
            card.innerHTML = `
                <div class="character-icon">${char.emoji}</div>
                <div class="character-name">${char.name}</div>
                <div class="character-desc">${char.desc}</div>
            `;
            
            card.addEventListener('click', () => {
                this.selectedCharacter = charId;
                Storage.setSelectedCharacter(charId);
                this.renderCharacterList();
            });
            
            container.appendChild(card);
        });
    },
    
    renderLevelList() {
        const container = document.getElementById('level-list');
        container.innerHTML = '';
        const unlocked = Storage.getUnlockedLevels();
        
        LEVEL_LIST.forEach(levelId => {
            const level = LEVELS[levelId];
            const isUnlocked = unlocked.includes(levelId);
            const card = document.createElement('div');
            card.className = 'level-card' + 
                (levelId === this.selectedLevel ? ' selected' : '') +
                (!isUnlocked ? ' locked' : '');
            card.innerHTML = `
                <div class="level-emoji">${isUnlocked ? level.emoji : '🔒'}</div>
                <div class="level-name">${level.name}</div>
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.selectedLevel = levelId;
                    Storage.setSelectedLevel(levelId);
                    this.renderLevelList();
                });
            }
            
            container.appendChild(card);
        });
    },
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    },
    
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.currentScreen = null;
    },
    
    updateScore(score) {
        document.getElementById('score-display').textContent = Helpers.formatNumber(score);
    },
    
    updateHealth(health, maxHealth) {
        const container = document.getElementById('health-display');
        let hearts = '';
        for (let i = 0; i < maxHealth; i++) {
            hearts += `<span class="heart ${i < health ? '' : 'empty'}">❤️</span>`;
        }
        container.innerHTML = hearts;
    },
    
    updateLevel(levelId) {
        document.getElementById('level-display').textContent = levelId;
    },
    
    updateProgress(current, total) {
        const progress = Math.min(100, (current / total) * 100);
        document.getElementById('progress-fill').style.width = progress + '%';
    },
    
    updateHighScore() {
        const highScore = Storage.getHighScore();
        document.getElementById('high-score-display').textContent = Helpers.formatNumber(highScore);
    },
    
    showGameOver(score, isNewRecord, message) {
        document.getElementById('game-over-title').textContent = '🎭 表演结束';
        document.getElementById('game-over-message').textContent = message || '下次继续努力！';
        document.getElementById('final-score').textContent = Helpers.formatNumber(score);
        
        const newRecordEl = document.getElementById('new-record');
        if (isNewRecord) {
            newRecordEl.classList.add('show');
        } else {
            newRecordEl.classList.remove('show');
        }
        
        this.updateHighScore();
        this.showScreen('gameOver');
    },
    
    showLevelComplete(levelId, score) {
        document.getElementById('level-complete-message').textContent = 
            `恭喜完成 ${LEVELS[levelId].name}！`;
        document.getElementById('level-score').textContent = Helpers.formatNumber(score);
        
        const nextBtn = document.getElementById('next-level-btn');
        if (levelId >= LEVEL_LIST.length) {
            nextBtn.textContent = '🎉 全部通关！';
            nextBtn.disabled = true;
        } else {
            nextBtn.textContent = '下一关';
            nextBtn.disabled = false;
        }
        
        this.updateHighScore();
        this.showScreen('levelComplete');
    },
    
    showPauseMenu() {
        this.showScreen('pause');
    },
    
    hidePauseMenu() {
        this.showScreen('hud');
    },
    
    showMenu() {
        this.renderCharacterList();
        this.renderLevelList();
        this.updateHighScore();
        this.showScreen('menu');
    },
    
    showHUD() {
        this.showScreen('hud');
    }
};
