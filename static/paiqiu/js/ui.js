const UI = {
    elements: {},
    selectedOpponent: 'college',
    currentMode: null,
    lastScoreboardState: {
        playerScore: -1,
        enemyScore: -1,
        playerSets: -1,
        enemySets: -1,
        combo: -1,
        spikes: -1,
        blocks: -1,
        aces: -1,
        envType: null,
        comboText: ''
    },

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateStatsPreview();
        this.lastScoreboardState = {};
    },

    cacheElements() {
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            modeSelect: document.getElementById('mode-select'),
            gameHud: document.getElementById('game-hud'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            controlsHint: document.getElementById('controls-hint'),
            touchControls: document.getElementById('touch-controls'),
            
            playerScore: document.getElementById('player-score'),
            enemyScore: document.getElementById('enemy-score'),
            playerSets: document.getElementById('player-sets'),
            enemySets: document.getElementById('enemy-sets'),
            combo: document.getElementById('combo'),
            spikeCount: document.getElementById('spike-count'),
            blockCount: document.getElementById('block-count'),
            serveCount: document.getElementById('serve-count'),
            envIcon: document.getElementById('env-icon'),
            envText: document.getElementById('env-text'),
            
            totalScore: document.getElementById('total-score'),
            totalWins: document.getElementById('total-wins'),
            
            resultTitle: document.getElementById('result-title'),
            finalPlayerScore: document.getElementById('final-player-score'),
            finalEnemyScore: document.getElementById('final-enemy-score'),
            finalSets: document.getElementById('final-sets'),
            finalSpikes: document.getElementById('final-spikes'),
            finalBlocks: document.getElementById('final-blocks'),
            finalServes: document.getElementById('final-serves'),
            pointsEarned: document.getElementById('points-earned'),
            
            opponentButtons: document.querySelectorAll('.opponent-btn')
        };
    },

    bindEvents() {
        document.getElementById('btn-training').addEventListener('click', () => this.startMode('training'));
        document.getElementById('btn-friendly').addEventListener('click', () => this.startMode('friendly'));
        document.getElementById('btn-tournament').addEventListener('click', () => this.startMode('tournament'));
        document.getElementById('btn-olympic').addEventListener('click', () => this.startMode('olympic'));
        
        document.getElementById('btn-start-match').addEventListener('click', () => this.startMatch());
        document.getElementById('btn-back-menu').addEventListener('click', () => this.showMainMenu());
        
        document.getElementById('btn-pause').addEventListener('click', () => this.pauseGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitGame());
        
        document.getElementById('btn-rematch').addEventListener('click', () => this.rematch());
        document.getElementById('btn-back-to-menu').addEventListener('click', () => this.showMainMenu());
        
        this.elements.opponentButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.opponentButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedOpponent = btn.dataset.opponent;
            });
        });
    },

    on(event, callback) {
        if (!this.callbacks) this.callbacks = {};
        this.callbacks[event] = callback;
    },

    trigger(event, data) {
        if (this.callbacks && this.callbacks[event]) {
            this.callbacks[event](data);
        }
    },

    startMode(mode) {
        this.currentMode = mode;
        
        if (mode === 'training') {
            this.trigger('startGame', { mode, opponent: null });
        } else {
            this.showModeSelect();
        }
    },

    showMainMenu() {
        this.hideAllMenus();
        this.elements.mainMenu.classList.remove('hidden');
        this.updateStatsPreview();
        this.trigger('backToMenu');
    },

    showModeSelect() {
        this.hideAllMenus();
        this.elements.modeSelect.classList.remove('hidden');
    },

    startMatch() {
        this.trigger('startGame', { 
            mode: this.currentMode, 
            opponent: this.selectedOpponent 
        });
    },

    showGameHud() {
        this.hideAllMenus();
        this.elements.gameHud.classList.remove('hidden');
        this.elements.controlsHint.classList.remove('hidden');
        
        if ('ontouchstart' in window) {
            this.elements.touchControls.classList.remove('hidden');
        }
    },

    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
    },

    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    },

    showGameOver(result) {
        this.hideAllMenus();
        this.elements.gameOver.classList.remove('hidden');
        
        const isWin = result.playerSets > result.enemySets;
        this.elements.resultTitle.textContent = isWin ? '🎉 胜利！' : '😔 失败';
        this.elements.resultTitle.style.color = isWin ? '#4CAF50' : '#f44336';
        
        this.elements.finalPlayerScore.textContent = result.playerScore;
        this.elements.finalEnemyScore.textContent = result.enemyScore;
        this.elements.finalSets.textContent = `${result.playerSets}:${result.enemySets}`;
        this.elements.finalSpikes.textContent = result.spikes;
        this.elements.finalBlocks.textContent = result.blocks;
        this.elements.finalServes.textContent = result.aces;
        this.elements.pointsEarned.textContent = `+${result.points}`;
        
        this.updateStatsPreview();
    },

    hideAllMenus() {
        this.elements.mainMenu.classList.add('hidden');
        this.elements.modeSelect.classList.add('hidden');
        this.elements.gameHud.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');
        this.elements.controlsHint.classList.add('hidden');
        this.elements.touchControls.classList.add('hidden');
    },

    pauseGame() {
        this.showPauseMenu();
        this.trigger('pause');
    },

    resumeGame() {
        this.hidePauseMenu();
        this.trigger('resume');
    },

    restartGame() {
        this.hidePauseMenu();
        this.trigger('restart');
    },

    quitGame() {
        this.hidePauseMenu();
        this.showMainMenu();
        this.trigger('quit');
    },

    rematch() {
        this.trigger('rematch');
    },

    updateScoreboard(gameState) {
        const comboText = `${gameState.combo}连击`;
        const spikeText = `扣球: ${gameState.stats.spikes}`;
        const blockText = `拦网: ${gameState.stats.blocks}`;
        const serveText = `发球: ${gameState.stats.aces}`;
        
        const currentState = {
            playerScore: gameState.playerScore,
            enemyScore: gameState.enemyScore,
            playerSets: gameState.playerSets,
            enemySets: gameState.enemySets,
            combo: gameState.combo,
            spikes: gameState.stats.spikes,
            blocks: gameState.stats.blocks,
            aces: gameState.stats.aces,
            envType: gameState.environment?.type,
            comboText: comboText,
            spikeText: spikeText,
            blockText: blockText,
            serveText: serveText
        };
        
        const last = this.lastScoreboardState || {};
        
        if (last.playerScore !== currentState.playerScore) {
            this.elements.playerScore.textContent = gameState.playerScore;
        }
        if (last.enemyScore !== currentState.enemyScore) {
            this.elements.enemyScore.textContent = gameState.enemyScore;
        }
        if (last.playerSets !== currentState.playerSets) {
            this.elements.playerSets.textContent = gameState.playerSets;
        }
        if (last.enemySets !== currentState.enemySets) {
            this.elements.enemySets.textContent = gameState.enemySets;
        }
        if (last.comboText !== currentState.comboText) {
            this.elements.combo.textContent = comboText;
        }
        if (last.spikeText !== currentState.spikeText) {
            this.elements.spikeCount.textContent = spikeText;
        }
        if (last.blockText !== currentState.blockText) {
            this.elements.blockCount.textContent = blockText;
        }
        if (last.serveText !== currentState.serveText) {
            this.elements.serveCount.textContent = serveText;
        }
        if (last.envType !== currentState.envType && gameState.environment) {
            this.elements.envIcon.textContent = gameState.environment.icon;
            this.elements.envText.textContent = gameState.environment.name;
        }
        
        this.lastScoreboardState = currentState;
    },

    updateStatsPreview() {
        this.elements.totalScore.textContent = Storage.getTotalScore();
        this.elements.totalWins.textContent = Storage.getTotalWins();
    },

    serialize() {
        return {
            selectedOpponent: this.selectedOpponent,
            currentMode: this.currentMode
        };
    },

    deserialize(data) {
        if (data) {
            this.selectedOpponent = data.selectedOpponent || 'college';
            this.currentMode = data.currentMode;
        }
    }
};
