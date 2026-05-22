const Game = {
    isRunning: false,
    isPaused: false,
    animationId: null,
    lastTime: 0,
    
    currentActions: [],
    landingPressStart: 0,
    isLandingPressActive: false,
    landingPressDuration: 0,
    landingTimeout: null,
    lastSaveTime: 0,
    
    characterState: 'idle',
    
    onGameEnd: null,
    onActionComplete: null,

    init() {
        Renderer.init();
        Input.init();
        UI.init();
        GameState.init();
        
        UI.onStartGame = () => this.handleStartGame();
        UI.onContinueGame = () => this.handleContinueGame();
        UI.onResetSave = () => this.handleResetSave();
        UI.onModeSelect = (mode) => this.handleModeSelect(mode);
        UI.onEventSelect = (event) => this.handleEventSelect(event);
        UI.onOpponentSelect = (opponent) => this.handleOpponentSelect(opponent);
        UI.onPause = () => this.handlePause();
        UI.onResume = () => this.handleResume();
        UI.onRestart = () => this.handleRestart();
        UI.onQuit = () => this.handleQuit();
        UI.onNextEvent = () => this.handleNextEvent();
        UI.onResultBack = () => this.handleResultBack();
        
        QTE.onActionComplete = (results) => this.handleQTEActionComplete(results);
        QTE.onLandingStart = () => this.handleLandingStart();
        QTE.onComboUpdate = (count) => this.handleComboUpdate(count);
        QTE.onSequenceComplete = (results, landing) => this.handleSequenceComplete(results, landing);
        QTE.onActionStart = (index) => {
            this.characterState = 'performing';
            this.saveProgress();
        };
        
        this.setupInputHandlers();
        
        UI.showScreen('mainMenu');
        UI.updateContinueButton();
        
        this.render();
    },
    
    setupInputHandlers() {
        Input.setKeyHandler('keydown', (key) => {
            if (!this.isRunning || this.isPaused) return;
            
            const currentTime = performance.now();
            
            if (QTE.isActive) {
                const result = QTE.handleInput(key, currentTime);
                if (result) {
                    this.handleHitResult(result);
                }
            }
            
            if (key === ' ' && QTE.isWaitingForLanding) {
                this.isLandingPressActive = true;
                this.landingPressStart = performance.now();
                QTE.startLanding();
            }
        });
        
        Input.setKeyHandler('longpressstart', () => {
            if (!this.isRunning || this.isPaused) return;
            
            if (QTE.isWaitingForLanding || QTE.isLandingPhase) {
                this.isLandingPressActive = true;
                this.landingPressStart = performance.now();
                
                if (QTE.isWaitingForLanding) {
                    QTE.startLanding();
                }
            }
        });
        
        Input.setKeyHandler('longpressend', () => {
            if (!this.isRunning || this.isPaused) return;
            
            if (this.isLandingPressActive && QTE.isLandingPhase) {
                const duration = performance.now() - this.landingPressStart;
                this.isLandingPressActive = false;
                
                const landingQuality = Scoring.evaluateLanding(duration, true);
                this.handleLandingComplete(landingQuality);
            }
        });
        
        Input.setKeyHandler('keyup', (key) => {
            if (!this.isRunning || this.isPaused) return;
            
            if (key === ' ' && this.isLandingPressActive && QTE.isLandingPhase) {
                const duration = performance.now() - this.landingPressStart;
                this.isLandingPressActive = false;
                
                const landingQuality = Scoring.evaluateLanding(duration, true);
                this.handleLandingComplete(landingQuality);
            }
        });
        
        Input.setKeyHandler('touchtap', (x, y) => {
            if (!this.isRunning || this.isPaused) return;
            
            const currentTime = performance.now();
            
            if (QTE.isActive) {
                const keys = ['A', 'S', 'D', 'F', 'J', 'K', 'L'];
                const zoneWidth = Renderer.canvas.width / keys.length;
                const keyIndex = Math.floor(x / zoneWidth);
                const key = keys[Math.min(keyIndex, keys.length - 1)];
                
                const result = QTE.handleInput(key, currentTime);
                if (result) {
                    this.handleHitResult(result);
                }
            }
        });
        
        Input.setKeyHandler('swipe', (direction) => {
        });
    },
    
    handleStartGame() {
        UI.reset();
        GameState.reset();
        QTE.reset();
        Renderer.reset();
        Storage.clearSave();
        
        UI.showScreen('modeSelect');
    },
    
    handleContinueGame() {
        const saveData = Storage.loadGame();
        if (saveData && saveData.hasSavedProgress) {
            GameState.loadSaveData(saveData);
            
            if (saveData.environment) {
                Environment.currentEnvironment = saveData.environment;
            } else {
                Environment.init();
            }
            
            if (saveData.scores) {
                GameState.scores = saveData.scores;
            }
            
            this.isRunning = true;
            this.isPaused = false;
            
            for (const key in UI.screens) {
                if (key === 'comboDisplay' || key === 'scorePopup') continue;
                UI.screens[key].classList.add('hidden');
            }
            UI.showHUD();
            
            const eventType = GameState.getCurrentEvent();
            const eventName = GameState.getCurrentEventName();
            
            if (saveData.currentActions && saveData.currentActions.length > 0) {
                this.currentActions = saveData.currentActions;
            } else {
                const actionCount = GameState.isTraining ? 3 : 5;
                this.currentActions = GameData.getRandomActions(eventType, actionCount);
            }
            
            QTE.init(this.currentActions);
            QTE.currentActionIndex = saveData.currentActionIndex || 0;
            
            if (saveData.qteState) {
                QTE.comboCount = saveData.qteState.comboCount || 0;
                QTE.maxCombo = saveData.qteState.maxCombo || 0;
                QTE.hitResults = saveData.qteState.hitResults || [];
            }
            
            this.characterState = 'idle';
            Renderer.reset();
            
            UI.updateHUD(eventName, this.currentActions[QTE.currentActionIndex]?.name || '', GameState.scores);
            
            if (QTE.currentActionIndex < this.currentActions.length) {
                setTimeout(() => {
                    QTE.startAction(this.currentActions[QTE.currentActionIndex]);
                    this.characterState = 'performing';
                }, 500);
            }
            
            if (!this.animationId) {
                this.gameLoop();
            }
        }
    },
    
    handleResetSave() {
        if (confirm('确定要重置所有存档吗？')) {
            Storage.clearSave();
            UI.updateContinueButton();
            alert('存档已重置！');
        }
    },
    
    handleModeSelect(mode) {
        GameState.setMode(mode);
        
        if (GameState.isAllAround) {
            UI.showScreen('opponentSelect');
        } else {
            UI.showScreen('eventSelect');
        }
    },
    
    handleEventSelect(event) {
        GameState.setEvent(event);
        
        if (GameState.hasOpponent) {
            UI.showScreen('opponentSelect');
        } else {
            this.startGame();
        }
    },
    
    handleOpponentSelect(opponent) {
        GameState.setOpponent(opponent);
        this.startGame();
    },
    
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        
        Environment.init();
        
        if (GameState.isAllAround) {
            GameState.events = ['floor', 'vault', 'bars', 'horizontal'];
        }
        
        for (const key in UI.screens) {
            if (key === 'comboDisplay' || key === 'scorePopup') continue;
            UI.screens[key].classList.add('hidden');
        }
        UI.showHUD();
        UI.hidePauseMenu();
        
        this.startEvent();
        
        if (!this.animationId) {
            this.gameLoop();
        }
    },
    
    startEvent() {
        const eventType = GameState.getCurrentEvent();
        const eventName = GameState.getCurrentEventName();
        
        GameState.resetEventScore();
        
        const actionCount = GameState.isTraining ? 3 : 5;
        this.currentActions = GameData.getRandomActions(eventType, actionCount);
        
        QTE.init(this.currentActions);
        
        this.characterState = 'idle';
        Renderer.reset();
        this.lastSaveTime = performance.now();
        
        UI.updateHUD(eventName, this.currentActions[0]?.name || '', {
            difficulty: 0,
            execution: 0,
            landing: 0
        });
        
        this.saveProgress();
        
        setTimeout(() => {
            QTE.startAction(this.currentActions[0]);
            this.characterState = 'performing';
            this.saveProgress();
        }, 1000);
    },
    
    gameLoop() {
        const currentTime = performance.now();
        
        if (this.isRunning && !this.isPaused) {
            if (QTE.isActive) {
                QTE.update(currentTime);
            }
            
            if (currentTime - this.lastSaveTime > 5000) {
                this.saveProgress();
                this.lastSaveTime = currentTime;
            }
            
            if (QTE.isLandingPhase) {
                if (this.isLandingPressActive) {
                    const pressDuration = currentTime - this.landingPressStart;
                    if (pressDuration > 2000) {
                        this.isLandingPressActive = false;
                        const landingQuality = Scoring.evaluateLanding(pressDuration, true);
                        this.handleLandingComplete(landingQuality);
                    }
                } else {
                    if (!this.landingTimeout) {
                        this.landingTimeout = setTimeout(() => {
                            if (QTE.isLandingPhase && !this.isLandingPressActive) {
                                const landingQuality = Scoring.evaluateLanding(300, false);
                                this.handleLandingComplete(landingQuality);
                            }
                            this.landingTimeout = null;
                        }, 3000);
                    }
                }
            } else {
                if (this.landingTimeout) {
                    clearTimeout(this.landingTimeout);
                    this.landingTimeout = null;
                }
            }
            
            const progress = QTE.getProgress();
            UI.updateHUD(
                GameState.getCurrentEventName(),
                progress.action,
                {
                    difficulty: GameState.scores.difficulty,
                    execution: GameState.scores.execution,
                    landing: GameState.scores.landing
                }
            );
        }
        
        this.render(currentTime);
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },
    
    render(currentTime) {
        if (!currentTime) currentTime = performance.now();
        
        Renderer.clear();
        
        if (this.isRunning) {
            const eventType = GameState.getCurrentEvent();
            Renderer.drawBackground(eventType);
            
            Renderer.drawCharacter(this.characterState, currentTime);
            Renderer.drawRhythmBars(currentTime, QTE);
            Renderer.drawBeatIndicator(currentTime, QTE);
            
            const landingProgress = this.isLandingPressActive 
                ? Math.min((currentTime - this.landingPressStart) / 500, 1) 
                : 0;
            Renderer.drawLandingIndicator(QTE.isLandingPhase, landingProgress);
            
            Renderer.updateAndDrawParticles(currentTime);
            Renderer.updateAndDrawScorePopups(currentTime);
        } else {
            Renderer.drawBackground('floor');
        }
    },
    
    handleHitResult(result) {
        const color = Scoring.getQualityColor(result.quality);
        Renderer.addParticles(Renderer.character.x, Renderer.character.y - 50, color, 10);
        
        const qualityText = Scoring.getQualityText(result.quality);
        Renderer.addScorePopup(qualityText, Renderer.character.x, Renderer.character.y - 100, color);
        
        if (result.quality === 'perfect') {
            UI.showCombo(QTE.comboCount);
        }
    },
    
    handleQTEActionComplete(results) {
        this.characterState = 'landing';
    },
    
    handleLandingStart() {
        this.isLandingPressActive = false;
        this.landingPressStart = 0;
    },
    
    handleLandingComplete(landingQuality) {
        const color = Scoring.getQualityColor(landingQuality.quality);
        Renderer.addParticles(Renderer.character.x, Renderer.character.y, color, 20);
        Renderer.addScorePopup(
            Scoring.getQualityText(landingQuality.quality), 
            Renderer.character.x, 
            Renderer.character.y - 80, 
            color
        );
        
        QTE.completeLanding(landingQuality);
    },
    
    handleSequenceComplete(results, landingQuality) {
        const executionScore = Scoring.calculateExecutionScore(QTE.hitResults);
        const landingScore = landingQuality ? landingQuality.score : 0;
        const difficultyScore = Scoring.calculateDifficultyScore(
            this.currentActions,
            GameState.opponent ? GameData.opponents[GameState.opponent].difficultyMultiplier : 1.0
        );
        
        const comboBonus = Scoring.calculateComboBonus(QTE.maxCombo);
        const totalScore = Scoring.calculateTotalScore(difficultyScore + comboBonus, executionScore, landingScore);
        
        GameState.scores.difficulty = difficultyScore + comboBonus;
        GameState.scores.execution = executionScore;
        GameState.scores.landing = landingScore;
        GameState.scores.total = totalScore;
        
        GameState.addEventScore({
            difficulty: GameState.scores.difficulty,
            execution: GameState.scores.execution,
            landing: GameState.scores.landing,
            total: totalScore,
            maxCombo: QTE.maxCombo
        });
        
        let opponentScore = 0;
        let comparison = '';
        
        if (GameState.hasOpponent) {
            opponentScore = Opponent.generateOpponentScore(
                GameState.getCurrentEvent(),
                GameState.opponent ? GameData.opponents[GameState.opponent].difficultyMultiplier : 1.0
            );
            GameState.addOpponentScore(opponentScore);
            comparison = Opponent.getComparisonText(totalScore);
        }
        
        const hasNext = GameState.hasNextEvent();
        const isFinal = GameState.isLastEvent() && GameState.isAllAround;
        
        UI.showResult({
            difficulty: GameState.scores.difficulty,
            execution: GameState.scores.execution,
            landing: GameState.scores.landing,
            total: totalScore,
            rank: GameData.getRating(totalScore).rank,
            opponentScore: opponentScore,
            comparison: comparison,
            hasNext: hasNext,
            isFinalResult: isFinal
        });
        
        Storage.saveScore({
            mode: GameState.mode,
            event: GameState.getCurrentEvent(),
            totalScore: totalScore,
            rank: GameData.getRating(totalScore).rank,
            difficulty: GameState.scores.difficulty,
            execution: GameState.scores.execution,
            landing: GameState.scores.landing
        });
        
        if (hasNext) {
            this.saveProgress();
        } else {
            Storage.clearSave();
        }
        
        this.isRunning = false;
    },
    
    handleComboUpdate(count) {
        if (count >= 3) {
            UI.showCombo(count);
        } else {
            UI.hideCombo();
        }
    },
    
    handlePause() {
        if (!this.isRunning) return;
        
        this.isPaused = true;
        UI.showPauseMenu();
        
        this.saveProgress();
    },
    
    handleResume() {
        this.isPaused = false;
        UI.hidePauseMenu();
    },
    
    handleRestart() {
        UI.hidePauseMenu();
        this.isPaused = false;
        
        GameState.resetEventScore();
        this.startEvent();
    },
    
    handleQuit() {
        UI.hidePauseMenu();
        this.isRunning = false;
        this.isPaused = false;
        
        Storage.clearSave();
        UI.hideHUD();
        UI.hideCombo();
        
        GameState.reset();
        QTE.reset();
        Renderer.reset();
        
        UI.showScreen('mainMenu');
        UI.updateContinueButton();
    },
    
    handleNextEvent() {
        if (GameState.isLastEvent() && GameState.isAllAround) {
            this.showAllAroundResult();
            return;
        }
        
        if (GameState.nextEvent()) {
            for (const key in UI.screens) {
                if (key === 'comboDisplay' || key === 'scorePopup') continue;
                UI.screens[key].classList.add('hidden');
            }
            UI.showHUD();
            this.isRunning = true;
            this.startEvent();
        }
    },
    
    handleResultBack() {
        Storage.clearSave();
        UI.hideHUD();
        UI.hideCombo();
        
        GameState.reset();
        QTE.reset();
        Renderer.reset();
        
        UI.showScreen('mainMenu');
        UI.updateContinueButton();
    },
    
    showAllAroundResult() {
        const playerTotal = GameState.getTotalScore();
        const opponentTotal = GameState.getOpponentTotalScore();
        const comparison = playerTotal > opponentTotal 
            ? `恭喜获胜！领先 ${(playerTotal - opponentTotal).toFixed(1)} 分` 
            : playerTotal < opponentTotal 
                ? `惜败！落后 ${(opponentTotal - playerTotal).toFixed(1)} 分` 
                : '平局！';
        
        UI.showResult({
            difficulty: GameState.eventScores.reduce((sum, s) => sum + s.difficulty, 0),
            execution: GameState.eventScores.reduce((sum, s) => sum + s.execution, 0),
            landing: GameState.eventScores.reduce((sum, s) => sum + s.landing, 0),
            total: playerTotal,
            rank: GameData.getRating(playerTotal / GameState.eventScores.length).rank,
            opponentScore: opponentTotal,
            comparison: comparison,
            hasNext: false,
            isFinalResult: false
        });
        
        document.getElementById('result-title').textContent = '全能赛总成绩';
        document.getElementById('btn-next').style.display = 'none';
        
        Storage.saveScore({
            mode: 'allaround',
            event: 'all',
            totalScore: playerTotal,
            rank: GameData.getRating(playerTotal / 4).rank,
            scores: GameState.eventScores
        });
        
        Storage.clearSave();
    },
    
    saveProgress() {
        const saveData = {
            ...GameState.getSaveData(),
            environment: Environment.getEnvironment(),
            currentActionIndex: QTE.currentActionIndex,
            scores: GameState.scores,
            currentActions: this.currentActions,
            qteState: {
                currentActionIndex: QTE.currentActionIndex,
                currentBeat: QTE.currentBeat,
                isActive: QTE.isActive,
                isWaitingForLanding: QTE.isWaitingForLanding,
                isLandingPhase: QTE.isLandingPhase,
                hitResults: QTE.hitResults,
                comboCount: QTE.comboCount,
                maxCombo: QTE.maxCombo
            }
        };
        Storage.saveGame(saveData);
    },
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentActions = [];
        this.landingPressStart = 0;
        this.isLandingPressActive = false;
        this.landingPressDuration = 0;
        this.characterState = 'idle';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};
