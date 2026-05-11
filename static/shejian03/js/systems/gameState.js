const GameStateManager = (function() {
    let currentMode = null;
    let currentDifficulty = null;
    let score = 0;
    let highScore = 0;
    let totalHits = 0;
    let perfectHits = 0;
    let arrowsRemaining = Infinity;
    let currentArrowType = 'wood';
    let currentRound = 1;
    let totalRounds = 1;
    let savedTimeRemaining = null;
    let gameOver = false;
    
    let _isDrawing = false;
    let drawAngle = -Math.PI / 2;
    let drawPower = 0;
    
    let onGameOver = null;
    
    function init(mode, difficulty, callback) {
        currentMode = mode;
        currentDifficulty = difficulty;
        onGameOver = callback;
        
        const modeConfig = Constants.GAME_MODES[mode.toUpperCase()];
        const difficultyConfig = Constants.DIFFICULTIES[difficulty.toUpperCase()];
        
        score = 0;
        totalHits = 0;
        perfectHits = 0;
        gameOver = false;
        currentRound = 1;
        totalRounds = modeConfig.rounds || 1;
        currentArrowType = 'wood';
        
        if (modeConfig.infiniteArrows) {
            arrowsRemaining = Infinity;
        } else {
            arrowsRemaining = modeConfig.arrowCount || 10;
        }
        
        const savedState = Storage.load();
        highScore = savedState.highScore || 0;
        
        Physics.setGravity(difficultyConfig.gravity);
        Physics.setEnabled(true);
        
        if (modeConfig.windEnabled) {
            WindSystem.start(
                difficultyConfig.wind,
                difficultyConfig.variableWind || modeConfig.variableWind
            );
        } else {
            WindSystem.stop();
        }
        
        const timeLimit = difficultyConfig.timeLimit || modeConfig.timeLimit;
        if (timeLimit) {
            TimerSystem.start(timeLimit, handleTimeUp);
        } else {
            TimerSystem.stop();
        }
        
        updateUI();
    }
    
    function reset() {
        score = 0;
        totalHits = 0;
        perfectHits = 0;
        gameOver = false;
        currentRound = 1;
        
        const modeConfig = currentMode ? Constants.GAME_MODES[currentMode.toUpperCase()] : null;
        if (modeConfig) {
            if (modeConfig.infiniteArrows) {
                arrowsRemaining = Infinity;
            } else {
                arrowsRemaining = modeConfig.arrowCount || 10;
            }
            
            const timeLimit = modeConfig.timeLimit;
            if (timeLimit) {
                TimerSystem.start(timeLimit, handleTimeUp);
            }
        }
        
        updateUI();
    }
    
    function handleTimeUp() {
        endGame();
    }
    
    function addScore(points) {
        score += points;
        if (score > highScore) {
            highScore = score;
            Storage.updateHighScore(score);
        }
        updateUI();
        saveProgress();
    }
    
    function addHit() {
        totalHits++;
        saveProgress();
    }
    
    function addPerfectHit() {
        perfectHits++;
        saveProgress();
    }
    
    function useArrow() {
        if (arrowsRemaining !== Infinity) {
            arrowsRemaining--;
            updateUI();
            saveProgress();
        }
    }
    
    function setArrowType(type) {
        currentArrowType = type;
    }
    
    function getCurrentArrowType() {
        return currentArrowType;
    }
    
    function getScore() {
        return score;
    }
    
    function getHighScore() {
        return highScore;
    }
    
    function getTotalHits() {
        return totalHits;
    }
    
    function getPerfectHits() {
        return perfectHits;
    }
    
    function getArrowsRemaining() {
        return arrowsRemaining;
    }
    
    function getCurrentMode() {
        return currentMode;
    }
    
    function getCurrentDifficulty() {
        return currentDifficulty;
    }
    
    function getCurrentRound() {
        return currentRound;
    }
    
    function getTotalRounds() {
        return totalRounds;
    }
    
    function nextRound() {
        currentRound++;
        if (currentRound > totalRounds) {
            endGame();
        }
    }
    
    function isGameOver() {
        return gameOver;
    }
    
    function endGame() {
        if (gameOver) return;
        
        gameOver = true;
        TimerSystem.stop();
        WindSystem.stop();
        Storage.updateHighScore(score);
        Storage.clearSavedGame();
        
        if (onGameOver) {
            onGameOver();
        }
    }
    
    function hasInfiniteArrows() {
        return arrowsRemaining === Infinity;
    }
    
    function hasTimeLimit() {
        return TimerSystem.hasTimeLimit();
    }
    
    function getTimeRemaining() {
        return TimerSystem.getTimeRemaining();
    }
    
    function setDrawing(drawing) {
        _isDrawing = drawing;
    }
    
    function isDrawing() {
        return _isDrawing;
    }
    
    function setDrawAngle(angle) {
        drawAngle = angle;
    }
    
    function getDrawAngle() {
        return drawAngle;
    }
    
    function setDrawPower(power) {
        drawPower = Helpers.clamp(power, Constants.BOW.MIN_POWER, Constants.BOW.MAX_POWER);
    }
    
    function getDrawPower() {
        return drawPower;
    }
    
    function updateUI() {
        const currentScoreEl = document.getElementById('current-score');
        const highScoreEl = document.getElementById('high-score');
        const arrowsEl = document.getElementById('arrows-left');
        
        if (currentScoreEl) currentScoreEl.textContent = score;
        if (highScoreEl) highScoreEl.textContent = highScore;
        if (arrowsEl) {
            arrowsEl.textContent = arrowsRemaining === Infinity ? '∞' : arrowsRemaining;
        }
    }
    
    function saveProgress() {
        if (!currentMode || !currentDifficulty) return;
        
        const gameData = {
            mode: currentMode,
            difficulty: currentDifficulty,
            score: score,
            highScore: highScore,
            totalHits: totalHits,
            perfectHits: perfectHits,
            arrowsRemaining: arrowsRemaining === Infinity ? -1 : arrowsRemaining,
            currentArrowType: currentArrowType,
            currentRound: currentRound,
            totalRounds: totalRounds,
            timeRemaining: TimerSystem.getTimeRemaining()
        };
        Storage.saveGameSession(gameData);
    }
    
    function loadProgress() {
        const savedState = Storage.load();
        if (savedState.lastGame) {
            const gameData = savedState.lastGame;
            currentMode = gameData.mode;
            currentDifficulty = gameData.difficulty;
            score = gameData.score;
            highScore = gameData.highScore || savedState.highScore;
            totalHits = gameData.totalHits;
            perfectHits = gameData.perfectHits;
            arrowsRemaining = gameData.arrowsRemaining === -1 ? Infinity : gameData.arrowsRemaining;
            currentArrowType = gameData.currentArrowType;
            currentRound = gameData.currentRound;
            totalRounds = gameData.totalRounds;
            savedTimeRemaining = gameData.timeRemaining;
            
            return true;
        }
        return false;
    }
    
    function resume(callback) {
        if (!currentMode || !currentDifficulty) {
            return false;
        }
        
        onGameOver = callback;
        gameOver = false;
        
        const modeConfig = Constants.GAME_MODES[currentMode.toUpperCase()];
        const difficultyConfig = Constants.DIFFICULTIES[currentDifficulty.toUpperCase()];
        
        if (!modeConfig || !difficultyConfig) {
            return false;
        }
        
        Physics.setGravity(difficultyConfig.gravity);
        Physics.setEnabled(true);
        
        if (modeConfig.windEnabled) {
            WindSystem.start(
                difficultyConfig.wind,
                difficultyConfig.variableWind || modeConfig.variableWind
            );
        } else {
            WindSystem.stop();
        }
        
        const timeLimit = difficultyConfig.timeLimit || modeConfig.timeLimit;
        if (timeLimit) {
            const timeToUse = (savedTimeRemaining && savedTimeRemaining > 0) 
                ? savedTimeRemaining 
                : timeLimit;
            TimerSystem.start(timeToUse, handleTimeUp);
            savedTimeRemaining = null;
        } else {
            TimerSystem.stop();
        }
        
        updateUI();
        return true;
    }
    
    function spawnTargets(gameObjects, gameState) {
        if (!gameState) return;
        
        const mode = gameState.getCurrentMode();
        const difficulty = gameState.getCurrentDifficulty();
        
        const modeConfig = Constants.GAME_MODES[mode.toUpperCase()];
        const difficultyConfig = Constants.DIFFICULTIES[difficulty.toUpperCase()];
        
        if (!modeConfig) return;
        
        const sizeMultiplier = difficultyConfig.targetSizeMultiplier || 1.0;
        const targets = [];
        
        const targetTypes = modeConfig.targetTypes || ['static'];
        const targetCount = Math.min(targetTypes.length + 1, 4);
        
        const canvasWidth = Constants.CANVAS.WIDTH;
        const canvasHeight = Constants.CANVAS.HEIGHT;
        
        for (let i = 0; i < targetCount; i++) {
            const type = targetTypes[i % targetTypes.length];
            const targetType = Constants.TARGET_TYPES[type.toUpperCase()];
            
            if (!targetType) continue;
            
            let x, y;
            let attempts = 0;
            const maxAttempts = 100;
            let validPosition = false;
            
            while (!validPosition && attempts < maxAttempts) {
                attempts++;
                
                const startX = canvasWidth * 0.55;
                const endX = canvasWidth - 120;
                const xRange = endX - startX;
                x = startX + (i / (targetCount + 1)) * xRange + (Math.random() - 0.5) * 50;
                
                if (targetType.flying) {
                    y = canvasHeight * 0.25 + Math.random() * (canvasHeight * 0.15);
                } else if (targetType.animal) {
                    y = canvasHeight * 0.52 + Math.random() * (canvasHeight * 0.1);
                } else {
                    y = canvasHeight * 0.3 + Math.random() * (canvasHeight * 0.3);
                }
                
                x = Helpers.clamp(x, canvasWidth * 0.5, canvasWidth - 100);
                y = Helpers.clamp(y, 100, canvasHeight * 0.7);
                
                validPosition = true;
                const targetRadius = targetType.radius * sizeMultiplier;
                
                for (let j = 0; j < targets.length; j++) {
                    const existingTarget = targets[j];
                    const minDistance = targetRadius + existingTarget.radius + 50;
                    const distance = Helpers.distance(x, y, existingTarget.x, existingTarget.y);
                    
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                const target = Target.create(type, x, y, sizeMultiplier);
                if (target) {
                    target.moveRange = 60 + Math.random() * 40;
                    targets.push(target);
                }
            }
        }
        
        if (targets.length === 0) {
            const type = targetTypes[0];
            const targetType = Constants.TARGET_TYPES[type.toUpperCase()];
            if (targetType) {
                const x = canvasWidth * 0.7;
                const y = canvasHeight * 0.4;
                const target = Target.create(type, x, y, sizeMultiplier);
                if (target) {
                    target.moveRange = 60;
                    targets.push(target);
                }
            }
        }
        
        gameObjects.targets = targets;
        for (let i = 0; i < targets.length; i++) {
            targets[i].originalX = targets[i].x;
            targets[i].originalY = targets[i].y;
        }
    }
    
    return {
        init,
        reset,
        addScore,
        addHit,
        addPerfectHit,
        useArrow,
        setArrowType,
        getCurrentArrowType,
        getScore,
        getHighScore,
        getTotalHits,
        getPerfectHits,
        getArrowsRemaining,
        getCurrentMode,
        getCurrentDifficulty,
        getCurrentRound,
        getTotalRounds,
        nextRound,
        isGameOver,
        endGame,
        hasInfiniteArrows,
        hasTimeLimit,
        getTimeRemaining,
        setDrawing,
        isDrawing,
        setDrawAngle,
        getDrawAngle,
        setDrawPower,
        getDrawPower,
        updateUI,
        saveProgress,
        loadProgress,
        resume,
        spawnTargets
    };
})();

window.GameStateManager = GameStateManager;