const Game = (function() {
    let gameState = {
        status: 'menu',
        mode: 1,
        player: null,
        opponents: [],
        raceTime: 0,
        raceDistance: 0,
        hurdlePositions: [],
        weather: null,
        hitHurdles: {},
        finalRank: 1
    };

    let lastTime = 0;
    let animationId = null;
    let saveInterval = null;

    function init() {
        gameState.raceDistance = GameData.getRaceDistance();
        gameState.hurdlePositions = GameData.getHurdlePositions();
    }

    function startGame(mode) {
        gameState.mode = mode;
        gameState.status = 'playing';
        gameState.raceTime = 0;
        gameState.hitHurdles = {};
        gameState.finalRank = 1;

        gameState.weather = GameData.getRandomWeather();
        gameState.player = Player.create(Math.floor(GameData.getModes()[mode].rivals / 2));

        gameState.opponents = [];
        const opponentTypes = GameData.getOpponentTypesForMode(mode);
        let laneIndex = 0;
        opponentTypes.forEach((type, index) => {
            if (laneIndex === gameState.player.lane) laneIndex++;
            gameState.opponents.push(Opponent.create(type, laneIndex, gameState.weather));
            laneIndex++;
        });

        gameState.player.currentHurdle = 0;
        gameState.opponents.forEach(o => o.currentHurdle = 0);

        lastTime = performance.now();
        gameLoop();
        startAutoSave();
    }

    function pauseGame() {
        if (gameState.status === 'playing') {
            gameState.status = 'paused';
            cancelAnimationFrame(animationId);
            saveGame();
        }
    }

    function resumeGame() {
        if (gameState.status === 'paused') {
            gameState.status = 'playing';
            lastTime = performance.now();
            gameLoop();
        }
    }

    function restartGame() {
        cancelAnimationFrame(animationId);
        stopAutoSave();
        startGame(gameState.mode);
    }

    function quitGame() {
        cancelAnimationFrame(animationId);
        stopAutoSave();
        Storage.clear();
        gameState.status = 'menu';
    }

    function gameLoop(currentTime = performance.now()) {
        if (gameState.status !== 'playing') return;

        const deltaTime = Math.min((currentTime - lastTime) / 16.67, 3);
        lastTime = currentTime;

        update(deltaTime);
        render();

        animationId = requestAnimationFrame(gameLoop);
    }

    function update(deltaTime) {
        gameState.raceTime += deltaTime / 60;

        const isAccelerating = Input.isPlayerAccelerating();
        Player.update(gameState.player, deltaTime, isAccelerating, gameState.weather.speedMod);

        checkPlayerHurdles();

        gameState.opponents.forEach(opponent => {
            Opponent.update(opponent, deltaTime, gameState.raceDistance);
            checkOpponentHurdles(opponent);
        });

        checkFinish();
        updateRank();
    }

    function checkPlayerHurdles() {
        const player = gameState.player;
        const nextHurdleIndex = player.currentHurdle;
        
        if (nextHurdleIndex >= gameState.hurdlePositions.length) return;
        
        const hurdlePos = gameState.hurdlePositions[nextHurdleIndex];
        const result = Player.checkHurdleInteraction(player, hurdlePos, gameState.weather.hitMod);
        
        if (result) {
            Player.handleHurdleResult(player, result);
            player.currentHurdle++;
            if (result === 'hit') {
                gameState.hitHurdles[`${player.lane}-${nextHurdleIndex}`] = true;
            }
        }
    }

    function checkOpponentHurdles(opponent) {
        const nextHurdleIndex = opponent.currentHurdle;
        
        if (nextHurdleIndex >= gameState.hurdlePositions.length) return;
        
        const hurdlePos = gameState.hurdlePositions[nextHurdleIndex];
        
        Opponent.tryJump(opponent, hurdlePos);
        
        const result = Opponent.checkHurdleInteraction(opponent, hurdlePos, gameState.weather.hitMod);
        
        if (result) {
            Opponent.handleHurdleResult(opponent, result);
            opponent.currentHurdle++;
            if (result === 'hit') {
                gameState.hitHurdles[`${opponent.lane}-${nextHurdleIndex}`] = true;
            }
        }
    }

    function checkFinish() {
        if (!gameState.player.hasFinished && gameState.player.x >= gameState.raceDistance) {
            gameState.player.hasFinished = true;
            gameState.player.finishTime = gameState.raceTime;
        }

        gameState.opponents.forEach(opponent => {
            if (!opponent.hasFinished && opponent.x >= gameState.raceDistance) {
                opponent.hasFinished = true;
                opponent.finishTime = gameState.raceTime;
            }
        });

        const allFinished = gameState.player.hasFinished && 
            gameState.opponents.every(o => o.hasFinished);

        if (allFinished) {
            endGame();
        }
    }

    function updateRank() {
        const allRunners = [gameState.player, ...gameState.opponents];
        allRunners.sort((a, b) => {
            if (a.hasFinished && b.hasFinished) {
                return a.finishTime - b.finishTime;
            }
            if (a.hasFinished) return -1;
            if (b.hasFinished) return 1;
            return b.x - a.x;
        });

        gameState.finalRank = allRunners.findIndex(r => r === gameState.player) + 1;
    }

    function endGame() {
        cancelAnimationFrame(animationId);
        stopAutoSave();
        gameState.status = 'finished';
        Storage.clear();
    }

    function render() {
        Renderer.render(gameState);
    }

    function handleJump() {
        if (gameState.status === 'playing') {
            Player.jump(gameState.player);
        }
    }

    function handleAccelerate() {
    }

    function getState() {
        return gameState;
    }

    function getResults() {
        const time = gameState.player.finishTime || gameState.raceTime;
        const perfect = gameState.player.perfectHurdles;
        const scores = GameData.getScore(time, perfect);
        
        return {
            time: time.toFixed(2),
            rank: gameState.finalRank,
            perfect: perfect,
            baseScore: scores.baseScore,
            bonusScore: scores.bonusScore,
            totalScore: scores.totalScore
        };
    }

    function saveGame() {
        const saveData = {
            ...gameState,
            savedAt: Date.now()
        };
        Storage.save(saveData);
    }

    function startAutoSave() {
        saveInterval = setInterval(() => {
            if (gameState.status === 'playing') {
                saveGame();
            }
        }, 5000);
    }

    function stopAutoSave() {
        if (saveInterval) {
            clearInterval(saveInterval);
            saveInterval = null;
        }
    }

    function loadGame() {
        const savedState = Storage.load();
        if (savedState && savedState.status === 'playing') {
            gameState = savedState;
            
            if (gameState.player) {
                const newPlayer = Player.create(gameState.player.lane);
                Object.assign(newPlayer, gameState.player);
                gameState.player = newPlayer;
            }
            if (gameState.opponents) {
                gameState.opponents = gameState.opponents.map(opp => {
                    const newOpp = Opponent.create(opp.type, opp.lane, gameState.weather);
                    Object.assign(newOpp, opp);
                    return newOpp;
                });
            }
            
            lastTime = performance.now();
            gameLoop();
            startAutoSave();
            return true;
        }
        return false;
    }

    function hasSavedGame() {
        return Storage.hasSavedGame();
    }

    return {
        init,
        startGame,
        pauseGame,
        resumeGame,
        restartGame,
        quitGame,
        handleJump,
        handleAccelerate,
        getState,
        getResults,
        saveGame,
        loadGame,
        hasSavedGame
    };
})();