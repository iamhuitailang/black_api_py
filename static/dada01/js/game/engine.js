var GameEngine = (function() {
    var gameState = {
        state: GameConfig.GAME_STATE.MENU,
        score: 0,
        missed: 0,
        hit: 0,
        timeLeft: GameConfig.GAME_DURATION,
        highScore: 0,
        ducks: [],
        lastUpdateTime: 0,
        lastSpawnTime: 0,
        nextSpawnDelay: 0,
        gameStartTime: 0,
        pausedAt: 0,
        totalPausedTime: 0
    };
    
    var onStateChange = null;
    var onScoreChange = null;
    
    function init() {
        gameState.highScore = Storage.getHighScore();
        var savedGame = Storage.getCurrentGame();
        if (savedGame) {
            return true;
        }
        return false;
    }
    
    function startNewGame() {
        gameState.state = GameConfig.GAME_STATE.PLAYING;
        gameState.score = 0;
        gameState.missed = 0;
        gameState.hit = 0;
        gameState.timeLeft = GameConfig.GAME_DURATION;
        gameState.ducks = [];
        gameState.lastUpdateTime = Date.now();
        gameState.lastSpawnTime = Date.now();
        gameState.nextSpawnDelay = getRandomSpawnDelay();
        gameState.gameStartTime = Date.now();
        gameState.pausedAt = 0;
        gameState.totalPausedTime = 0;
        Effects.clear();
        saveGame();
        notifyStateChange();
    }
    
    function restoreSavedGame() {
        var savedGame = Storage.getCurrentGame();
        if (!savedGame) return false;
        
        gameState.state = savedGame.state;
        gameState.score = savedGame.score;
        gameState.missed = savedGame.missed;
        gameState.hit = savedGame.hit;
        gameState.timeLeft = savedGame.timeLeft;
        gameState.ducks = [];
        
        for (var i = 0; i < savedGame.ducks.length; i++) {
            gameState.ducks.push(Duck.createDuck(0, 0, savedGame.ducks[i]));
        }
        
        gameState.lastUpdateTime = Date.now();
        gameState.lastSpawnTime = Date.now();
        gameState.nextSpawnDelay = getRandomSpawnDelay();
        gameState.gameStartTime = savedGame.gameStartTime;
        gameState.pausedAt = 0;
        gameState.totalPausedTime = savedGame.totalPausedTime || 0;
        Effects.clear();
        
        notifyStateChange();
        return true;
    }
    
    function getRandomSpawnDelay() {
        return GameConfig.SPAWN_INTERVAL_MIN + 
               Math.random() * (GameConfig.SPAWN_INTERVAL_MAX - GameConfig.SPAWN_INTERVAL_MIN);
    }
    
    function update(deltaTime) {
        if (gameState.state !== GameConfig.GAME_STATE.PLAYING) return;
        
        var now = Date.now();
        var elapsed = (now - gameState.gameStartTime - gameState.totalPausedTime) / 1000;
        gameState.timeLeft = Math.max(0, GameConfig.GAME_DURATION - Math.floor(elapsed));
        
        if (gameState.timeLeft <= 0) {
            endGame();
            return;
        }
        
        var activeDucks = 0;
        for (var i = gameState.ducks.length - 1; i >= 0; i--) {
            var duck = gameState.ducks[i];
            Duck.updateDuck(duck, deltaTime, Renderer.getCanvasSize().width);
            
            if (duck.isMissed) {
                gameState.missed++;
                gameState.ducks.splice(i, 1);
                Audio.playMissedDuck();
                notifyScoreChange();
                saveGame();
                
                if (gameState.missed >= GameConfig.MAX_MISSED) {
                    endGame();
                    return;
                }
            } else if (!duck.isHit) {
                activeDucks++;
            }
        }
        
        if (activeDucks < GameConfig.MIN_DUCKS_THRESHOLD && 
            activeDucks < GameConfig.MAX_DUCKS &&
            now - gameState.lastSpawnTime > gameState.nextSpawnDelay) {
            var size = Renderer.getCanvasSize();
            gameState.ducks.push(Duck.createDuck(size.width, size.height));
            gameState.lastSpawnTime = now;
            gameState.nextSpawnDelay = getRandomSpawnDelay();
            saveGame();
        }
        
        Effects.update(deltaTime);
    }
    
    function handleClick(x, y) {
        if (gameState.state !== GameConfig.GAME_STATE.PLAYING) return false;
        
        var hitDuck = null;
        
        for (var i = gameState.ducks.length - 1; i >= 0; i--) {
            var duck = gameState.ducks[i];
            if (Duck.checkCollision(duck, x, y)) {
                hitDuck = duck;
                break;
            }
        }
        
        if (hitDuck) {
            hitDuck.isHit = true;
            gameState.hit++;
            var score = hitDuck.isGolden ? GameConfig.GOLDEN_DUCK_SCORE : GameConfig.NORMAL_DUCK_SCORE;
            gameState.score += score;
            
            Effects.createFeathers(
                hitDuck.x + hitDuck.width / 2,
                hitDuck.y + hitDuck.height / 2,
                hitDuck.isGolden
            );
            
            Audio.playHit();
            
            setTimeout(function() {
                var index = gameState.ducks.indexOf(hitDuck);
                if (index > -1) {
                    gameState.ducks.splice(index, 1);
                }
            }, 100);
            
            notifyScoreChange();
            saveGame();
            return true;
        } else {
            Effects.createSmoke(x, y);
            Effects.createCrosshairFlash(x, y);
            Audio.playMiss();
            return false;
        }
    }
    
    function pause() {
        if (gameState.state !== GameConfig.GAME_STATE.PLAYING) return;
        gameState.state = GameConfig.GAME_STATE.PAUSED;
        gameState.pausedAt = Date.now();
        saveGame();
        notifyStateChange();
    }
    
    function resume() {
        if (gameState.state !== GameConfig.GAME_STATE.PAUSED) return;
        
        var pausedDuration = Date.now() - gameState.pausedAt;
        gameState.totalPausedTime += pausedDuration;
        
        gameState.state = GameConfig.GAME_STATE.PLAYING;
        gameState.lastUpdateTime = Date.now();
        gameState.pausedAt = 0;
        saveGame();
        notifyStateChange();
    }
    
    function endGame() {
        gameState.state = GameConfig.GAME_STATE.GAME_OVER;
        
        var isNewRecord = Storage.updateHighScore(gameState.score);
        if (isNewRecord) {
            gameState.highScore = gameState.score;
        }
        
        Storage.updateStats({
            score: gameState.score,
            hit: gameState.hit,
            missed: gameState.missed
        });
        
        Storage.clearCurrentGame();
        Audio.playGameOver();
        notifyStateChange();
        
        return isNewRecord;
    }
    
    function saveGame() {
        if (gameState.state === GameConfig.GAME_STATE.GAME_OVER ||
            gameState.state === GameConfig.GAME_STATE.MENU) {
            return;
        }
        
        var savedDucks = [];
        for (var i = 0; i < gameState.ducks.length; i++) {
            if (!gameState.ducks[i].isHit) {
                savedDucks.push(Duck.getDuckState(gameState.ducks[i]));
            }
        }
        
        var gameData = {
            state: gameState.state,
            score: gameState.score,
            missed: gameState.missed,
            hit: gameState.hit,
            timeLeft: gameState.timeLeft,
            ducks: savedDucks,
            gameStartTime: gameState.gameStartTime,
            totalPausedTime: gameState.totalPausedTime,
            timestamp: Date.now()
        };
        
        Storage.saveCurrentGame(gameData);
    }
    
    function notifyStateChange() {
        if (onStateChange) {
            onStateChange(gameState);
        }
    }
    
    function notifyScoreChange() {
        if (onScoreChange) {
            onScoreChange(gameState);
        }
    }
    
    function getGameState() {
        return gameState;
    }
    
    function getDucks() {
        return gameState.ducks;
    }
    
    function setStateChangeCallback(callback) {
        onStateChange = callback;
    }
    
    function setScoreChangeCallback(callback) {
        onScoreChange = callback;
    }
    
    function resetGame() {
        gameState.state = GameConfig.GAME_STATE.MENU;
        gameState.score = 0;
        gameState.missed = 0;
        gameState.hit = 0;
        gameState.timeLeft = GameConfig.GAME_DURATION;
        gameState.ducks = [];
        gameState.highScore = Storage.getHighScore();
        Effects.clear();
        Storage.clearCurrentGame();
        notifyStateChange();
    }
    
    return {
        init: init,
        startNewGame: startNewGame,
        restoreSavedGame: restoreSavedGame,
        update: update,
        handleClick: handleClick,
        pause: pause,
        resume: resume,
        endGame: endGame,
        getGameState: getGameState,
        getDucks: getDucks,
        setStateChangeCallback: setStateChangeCallback,
        setScoreChangeCallback: setScoreChangeCallback,
        resetGame: resetGame,
        saveGame: saveGame
    };
})();
