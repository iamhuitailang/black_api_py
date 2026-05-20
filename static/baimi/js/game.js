const Game = (() => {
    let state = {
        gamePhase: 'idle',
        mode: 'solo',
        weather: null,
        player: null,
        opponents: [],
        runners: [],
        raceTime: 0,
        startTime: 0,
        gunTime: 0,
        gunFlashIntensity: 0,
        time: 0,
        lastFrameTime: 0,
        animationId: null,
        isPaused: false,
        tournamentRound: 0,
        readyTimeout: null,
        setTimout: null,
        lastSaveTime: 0
    };

    let onStateChange = null;
    let onRaceComplete = null;

    const GAME_PHASES = {
        IDLE: 'idle',
        READY: 'ready',
        SET: 'set',
        GO: 'go',
        RACING: 'racing',
        FINISHED: 'finished',
        FALSE_START: 'false_start'
    };

    const init = (modeId) => {
        state.mode = modeId || Storage.getCurrentMode() || 'solo';
        state.weather = Weather.getRandomWeather();
        state.gamePhase = GAME_PHASES.IDLE;
        state.raceTime = 0;
        state.gunFlashIntensity = 0;
        state.time = 0;
        state.tournamentRound = 0;
        
        setupRunners();
        
        saveFullState();
        
        return state;
    };

    const setupRunners = () => {
        const mode = Mode.getModeById(state.mode);
        const opponentCount = mode.opponents;
        
        state.player = Runner.createPlayer(0);
        state.opponents = Runner.createRandomOpponents(opponentCount, state.mode);
        
        state.runners = [state.player, ...state.opponents];
        
        state.runners.forEach((runner, index) => {
            runner.lane = index;
        });
    };

    const startRace = () => {
        if (state.gamePhase !== GAME_PHASES.IDLE && state.gamePhase !== GAME_PHASES.FINISHED && state.gamePhase !== GAME_PHASES.FALSE_START) {
            return;
        }
        
        clearAllTimeouts();
        
        state.raceTime = 0;
        state.gunFlashIntensity = 0;
        state.time = 0;
        
        state.runners.forEach(runner => {
            runner.position = 0;
            runner.speed = 0;
            runner.stamina = 100;
            runner.isFinished = false;
            runner.finishTime = null;
            runner.reactionTime = null;
            runner.hasStarted = false;
            runner.clickTimes = [];
            runner.isFalseStart = false;
        });
        
        state.gamePhase = GAME_PHASES.READY;
        saveFullState();
        notifyStateChange();
        
        state.readyTimeout = setTimeout(() => {
            if (state.gamePhase === GAME_PHASES.READY) {
                state.gamePhase = GAME_PHASES.SET;
                saveFullState();
                notifyStateChange();
                
                const randomDelay = 1000 + Math.random() * 2000;
                state.setTimeout = setTimeout(() => {
                    if (state.gamePhase === GAME_PHASES.SET) {
                        fireGun();
                    }
                }, randomDelay);
            }
        }, 1500);
    };

    const clearAllTimeouts = () => {
        if (state.readyTimeout) {
            clearTimeout(state.readyTimeout);
            state.readyTimeout = null;
        }
        if (state.setTimeout) {
            clearTimeout(state.setTimeout);
            state.setTimeout = null;
        }
    };

    const fireGun = () => {
        state.gamePhase = GAME_PHASES.GO;
        state.gunTime = Date.now();
        state.gunFlashIntensity = 1;
        saveFullState();
        notifyStateChange();
        
        setTimeout(() => {
            if (state.gamePhase === GAME_PHASES.GO) {
                state.gamePhase = GAME_PHASES.RACING;
                state.startTime = Date.now();
                saveFullState();
                startGameLoop();
            }
        }, 200);
    };

    const handleInput = () => {
        if (state.gamePhase === GAME_PHASES.READY || state.gamePhase === GAME_PHASES.SET) {
            handleFalseStart();
            return;
        }
        
        if (state.gamePhase === GAME_PHASES.GO || state.gamePhase === GAME_PHASES.RACING) {
            if (!state.player.hasStarted && !state.player.isFalseStart) {
                const reactionTime = (Date.now() - state.gunTime) / 1000;
                const adjustedReaction = reactionTime - state.weather.effects.reactionPenalty;
                
                if (adjustedReaction < 0.1) {
                    handleFalseStart();
                    return;
                }
                
                state.player.reactionTime = adjustedReaction;
                state.player.hasStarted = true;
                saveFullState();
            }
            
            if (state.player.hasStarted && !state.player.isFinished) {
                state.player.clickTimes.push(Date.now());
                if (state.player.clickTimes.length > 20) {
                    state.player.clickTimes = state.player.clickTimes.slice(-20);
                }
            }
        }
    };

    const handleFalseStart = () => {
        clearAllTimeouts();
        state.player.isFalseStart = true;
        state.gamePhase = GAME_PHASES.FALSE_START;
        stopGameLoop();
        saveFullState();
        notifyStateChange();
        
        if (onRaceComplete) {
            onRaceComplete({
                isFalseStart: true,
                player: state.player,
                runners: state.runners
            });
        }
    };

    const startGameLoop = () => {
        state.lastFrameTime = performance.now();
        gameLoop();
    };

    const stopGameLoop = () => {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    };

    const gameLoop = () => {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - state.lastFrameTime) / 1000, 0.1);
        state.lastFrameTime = currentTime;
        
        if (!state.isPaused) {
            update(deltaTime);
            state.time += deltaTime * 1000;
        }
        
        if (state.gamePhase === GAME_PHASES.RACING) {
            if (currentTime - state.lastSaveTime > 500) {
                saveFullState();
                state.lastSaveTime = currentTime;
            }
        }
        
        notifyStateChange();
        
        if (state.gamePhase === GAME_PHASES.RACING || state.gamePhase === GAME_PHASES.GO) {
            state.animationId = requestAnimationFrame(gameLoop);
        }
    };

    const update = (deltaTime) => {
        if (state.gamePhase === GAME_PHASES.RACING) {
            state.raceTime += deltaTime;
        }
        
        state.gunFlashIntensity = Math.max(0, state.gunFlashIntensity - deltaTime * 3);
        
        const weatherMultiplier = state.weather.effects.speedMultiplier;
        
        Runner.updatePlayer(state.player, deltaTime, state.raceTime, weatherMultiplier);
        
        state.opponents.forEach(opponent => {
            Runner.updateOpponent(opponent, deltaTime, state.raceTime, weatherMultiplier);
        });
        
        checkRaceComplete();
    };

    const checkRaceComplete = () => {
        const allFinished = state.runners.every(r => r.isFinished || r.isFalseStart);
        
        if (allFinished || (state.player.isFinished && state.raceTime > 15)) {
            state.gamePhase = GAME_PHASES.FINISHED;
            stopGameLoop();
            
            const results = calculateResults();
            
            if (state.mode === 'tournament' && results.rank <= 4 && state.tournamentRound < 2) {
                advanceTournamentRound(results);
            } else {
                Storage.updateBestRecord(results.playerTime);
                Storage.addRaceResult(results);
                Storage.clearGameState();
                
                if (onRaceComplete) {
                    onRaceComplete(results);
                }
            }
        }
    };

    const calculateResults = () => {
        const sortedRunners = [...state.runners]
            .filter(r => !r.isFalseStart)
            .sort((a, b) => {
                if (a.isFinished && b.isFinished) {
                    return a.finishTime - b.finishTime;
                }
                if (a.isFinished) return -1;
                if (b.isFinished) return 1;
                return b.position - a.position;
            });
        
        const playerIndex = sortedRunners.findIndex(r => r.id === 'player');
        const player = state.player;
        
        return {
            rank: player.isFalseStart ? 'DQ' : playerIndex + 1,
            playerTime: player.isFinished ? player.finishTime : null,
            reactionTime: player.reactionTime,
            isFalseStart: player.isFalseStart,
            weather: state.weather,
            mode: state.mode,
            runners: sortedRunners.map((r, index) => ({
                rank: index + 1,
                name: r.name,
                time: r.finishTime,
                reactionTime: r.reactionTime,
                isPlayer: r.id === 'player',
                isFalseStart: r.isFalseStart
            }))
        };
    };

    const advanceTournamentRound = (results) => {
        state.tournamentRound++;
        const qualifiedRunners = results.runners.slice(0, 4);
        
        state.opponents = qualifiedRunners
            .filter(r => !r.isPlayer)
            .map((r, i) => {
                const opponent = Runner.createOpponent('professional', i + 1, 'tournament');
                opponent.name = r.name;
                return opponent;
            });
        
        state.player = Runner.createPlayer(0);
        state.runners = [state.player, ...state.opponents];
        
        state.runners.forEach((runner, index) => {
            runner.lane = index;
        });
        
        saveFullState();
        notifyStateChange();
    };

    const saveFullState = () => {
        Storage.saveGameState({
            gamePhase: state.gamePhase,
            mode: state.mode,
            weather: state.weather,
            player: state.player,
            opponents: state.opponents,
            runners: state.runners,
            raceTime: state.raceTime,
            gunTime: state.gunTime,
            time: state.time,
            tournamentRound: state.tournamentRound
        });
    };

    const notifyStateChange = () => {
        if (onStateChange) {
            onStateChange(getState());
        }
    };

    const getState = () => {
        return {
            ...state,
            player: state.player,
            runners: state.runners,
            weather: state.weather
        };
    };

    const getCurrentRank = () => {
        const sorted = [...state.runners]
            .filter(r => !r.isFalseStart)
            .sort((a, b) => b.position - a.position);
        return sorted.findIndex(r => r.id === 'player') + 1;
    };

    const setOnStateChange = (callback) => {
        onStateChange = callback;
    };

    const setOnRaceComplete = (callback) => {
        onRaceComplete = callback;
    };

    const reset = () => {
        clearAllTimeouts();
        stopGameLoop();
        state.gamePhase = GAME_PHASES.IDLE;
        state.raceTime = 0;
        state.gunFlashIntensity = 0;
        state.tournamentRound = 0;
        setupRunners();
        Storage.clearGameState();
        notifyStateChange();
    };

    const resumeFromSavedState = () => {
        const saved = Storage.loadGameState();
        if (saved && saved.gamePhase) {
            clearAllTimeouts();
            stopGameLoop();
            
            state.gamePhase = saved.gamePhase;
            state.mode = saved.mode || 'solo';
            state.weather = saved.weather || Weather.getRandomWeather();
            state.runners = saved.runners || [];
            state.opponents = saved.opponents || [];
            
            if (state.runners.length > 0) {
                state.player = state.runners[0];
            } else {
                state.player = saved.player;
            }
            
            state.raceTime = saved.raceTime || 0;
            state.gunTime = saved.gunTime || 0;
            state.time = saved.time || 0;
            state.tournamentRound = saved.tournamentRound || 0;
            state.gunFlashIntensity = 0;
            state.lastFrameTime = performance.now();
            state.lastSaveTime = 0;
            
            const allFinished = state.runners.length > 0 && state.runners.every(r => r.isFinished);
            
            if (allFinished || state.gamePhase === GAME_PHASES.FINISHED || state.gamePhase === GAME_PHASES.FALSE_START) {
                state.gamePhase = GAME_PHASES.IDLE;
                Storage.clearGameState();
            } else if (state.gamePhase === GAME_PHASES.RACING || state.gamePhase === GAME_PHASES.GO) {
                startGameLoop();
            } else if (state.gamePhase === GAME_PHASES.READY || state.gamePhase === GAME_PHASES.SET) {
                state.gamePhase = GAME_PHASES.IDLE;
                Storage.clearGameState();
            }
            
            notifyStateChange();
            return true;
        }
        return false;
    };

    return {
        init,
        startRace,
        handleInput,
        getState,
        getCurrentRank,
        setOnStateChange,
        setOnRaceComplete,
        reset,
        resumeFromSavedState,
        GAME_PHASES
    };
})();
