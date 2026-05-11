const Game = (function() {
    let state = null;
    let playerData = null;
    let difficulty = null;
    let callbacks = {
        onScoreChange: null,
        onWoodChange: null,
        onGameOver: null,
        onSave: null
    };
    let autoCutTimer = null;
    let saveTimer = null;
    let lastCutTime = 0;
    
    function init(playerDataState) {
        playerData = playerDataState;
        state = Storage.getDefaultGameState();
    }
    
    function getState() {
        return state;
    }
    
    function setCallback(type, callback) {
        callbacks[type] = callback;
    }
    
    function loadSavedGame(savedState, playerDataState) {
        playerData = playerDataState;
        state = savedState;
        difficulty = getDifficultyConfig(state.difficulty);
        return true;
    }
    
    function getDifficultyConfig(difficultyId) {
        const diffMap = {
            'beginner': CONSTANTS.DIFFICULTY.BEGINNER,
            'skilled': CONSTANTS.DIFFICULTY.SKILLED,
            'expert': CONSTANTS.DIFFICULTY.EXPERT,
            'crazy': CONSTANTS.DIFFICULTY.CRAZY
        };
        return diffMap[difficultyId] || CONSTANTS.DIFFICULTY.BEGINNER;
    }
    
    function startGame(difficultyId) {
        difficulty = getDifficultyConfig(difficultyId);
        
        state = {
            state: GAME_STATE.PLAYING,
            score: 0,
            woodGained: 0,
            difficulty: difficultyId,
            segments: generateInitialSegments(),
            cutCount: 0,
            currentSpeed: getBaseSpeed(),
            activePowerups: {},
            shieldUsed: false,
            lastCutSide: SIDE.LEFT,
            cutting: null,
            squirrels: [],
            bees: [],
            fakeAction: null,
            treeHeight: CONSTANTS.GAME.INITIAL_TREE_SEGMENTS
        };
        
        if (playerData.powerups.shield > 0) {
            state.activePowerups.shield = true;
            playerData.powerups.shield--;
        }
        
        if (callbacks.onSave) callbacks.onSave();
        
        return state;
    }
    
    function generateInitialSegments() {
        const segments = [];
        const branchEvery = difficulty.branchEvery;
        
        for (let i = 0; i < CONSTANTS.GAME.INITIAL_TREE_SEGMENTS; i++) {
            segments.push(createSegment(segments, i, branchEvery));
        }
        
        return segments;
    }
    
    function createSegment(existingSegments, index, branchEvery) {
        const segment = {
            leftBranch: false,
            rightBranch: false,
            isBeehiveLeft: false,
            isBeehiveRight: false,
            hasSquirrel: false
        };
        
        if (branchEvery > 0 && index >= 2 && (index + 1) % branchEvery === 0) {
            const side = Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT;
            if (side === SIDE.LEFT) {
                segment.leftBranch = true;
            } else {
                segment.rightBranch = true;
            }
        } else if (branchEvery === 0) {
            if (difficulty.doubleBranch && Math.random() < 0.3) {
                segment.leftBranch = true;
                segment.rightBranch = true;
            } else {
                const side = Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT;
                if (side === SIDE.LEFT) {
                    segment.leftBranch = true;
                } else {
                    segment.rightBranch = true;
                }
            }
        }
        
        if (difficulty.obstacles) {
            const obstacleChance = difficulty.obstacles === 'always' ? 0.25 :
                                   difficulty.obstacles === 'often' ? 0.15 : 0.05;
            
            if (Math.random() < obstacleChance) {
                if (segment.leftBranch) {
                    segment.isBeehiveLeft = Math.random() < 0.5;
                } else if (segment.rightBranch) {
                    segment.isBeehiveRight = Math.random() < 0.5;
                }
            }
        }
        
        if (existingSegments.length >= 2) {
            const prevSegment = existingSegments[existingSegments.length - 2];
            if (segment.leftBranch && prevSegment.leftBranch) {
                segment.leftBranch = false;
                segment.rightBranch = true;
            } else if (segment.rightBranch && prevSegment.rightBranch) {
                segment.rightBranch = false;
                segment.leftBranch = true;
            }
        }
        
        return segment;
    }
    
    function getBaseSpeed() {
        const axe = Object.values(CONSTANTS.AXES).find(a => a.id === playerData.equippedAxe);
        const speedMultiplier = axe ? axe.speedMultiplier : 1.0;
        return CONSTANTS.GAME.BASE_SPEED / (difficulty.speed * speedMultiplier);
    }
    
    function cut(side) {
        if (state.state !== GAME_STATE.PLAYING) return false;
        if (state.cutting) return false;
        
        const now = Date.now();
        if (now - lastCutTime < 50) return false;
        lastCutTime = now;
        
        if (difficulty.fakeAction && Math.random() < CONSTANTS.GAME.FAKE_ACTION_CHANCE) {
            state.fakeAction = { side: side, startTime: now };
            setTimeout(() => {
                if (state.fakeAction) {
                    state.fakeAction = null;
                }
            }, 300);
            return true;
        }
        
        const firstSegment = state.segments[0];
        const hasBranchOnSide = side === SIDE.LEFT ? firstSegment.leftBranch : firstSegment.rightBranch;
        
        if (hasBranchOnSide) {
            if (state.activePowerups.shield && !state.shieldUsed) {
                state.shieldUsed = true;
                state.activePowerups.shield = false;
                state.lastCutSide = side;
                
                if (callbacks.onSave) callbacks.onSave();
                return true;
            } else {
                gameOver();
                return false;
            }
        }
        
        state.cutting = {
            side: side,
            progress: 0,
            axe: playerData.equippedAxe
        };
        state.lastCutSide = side;
        
        setTimeout(() => {
            if (state.cutting) {
                completeCut(side, firstSegment);
            }
        }, 100);
        
        return true;
    }
    
    function completeCut(side, firstSegment) {
        state.cutting = null;
        state.segments.shift();
        state.cutCount++;
        
        const scoreMultiplier = state.activePowerups.double ? 2 : 1;
        const woodMultiplier = state.activePowerups.double ? 2 : 1;
        
        state.score += scoreMultiplier;
        state.woodGained += woodMultiplier;
        
        if (callbacks.onScoreChange) callbacks.onScoreChange(state.score);
        if (callbacks.onWoodChange) callbacks.onWoodChange(state.woodGained);
        
        const newSegment = createSegment(state.segments, state.segments.length, difficulty.branchEvery);
        state.segments.push(newSegment);
        
        if (difficulty.obstacles) {
            const squirrelChance = difficulty.obstacles === 'always' ? 0.1 : 0.03;
            if (Math.random() < squirrelChance) {
                addSquirrel();
            }
        }
        
        if (firstSegment.isBeehiveLeft || firstSegment.isBeehiveRight) {
            addBees();
        }
        
        updateSpeed();
        
        if (callbacks.onSave) callbacks.onSave();
    }
    
    function addSquirrel() {
        const fromLeft = Math.random() < 0.5;
        state.squirrels.push({
            fromLeft: fromLeft,
            progress: 0,
            startTime: Date.now()
        });
    }
    
    function addBees() {
        for (let i = 0; i < 8; i++) {
            state.bees.push({
                x: Math.random() * Renderer.getWidth(),
                y: Math.random() * Renderer.getHeight() * 0.6,
                startTime: Date.now()
            });
        }
        
        setTimeout(() => {
            state.bees = [];
        }, 5000);
    }
    
    function updateSpeed() {
        const speedDecrease = state.cutCount * CONSTANTS.GAME.SPEED_DECREASE_RATE;
        const minSpeed = CONSTANTS.GAME.MIN_SPEED / difficulty.maxSpeed;
        state.currentSpeed = Math.max(minSpeed, getBaseSpeed() - speedDecrease);
    }
    
    function gameOver() {
        state.state = GAME_STATE.GAME_OVER;
        
        playerData.wood += state.woodGained;
        playerData.gold += Math.floor(state.woodGained * 2);
        
        if (state.score > playerData.highScore) {
            playerData.highScore = state.score;
            playerData.streak++;
        } else {
            playerData.streak = 0;
        }
        
        Storage.savePlayerData(playerData);
        Storage.clearGameState();
        
        if (callbacks.onGameOver) {
            callbacks.onGameOver(state, playerData);
        }
    }
    
    function pause() {
        if (state.state === GAME_STATE.PLAYING) {
            state.state = GAME_STATE.PAUSED;
            if (autoCutTimer) {
                clearInterval(autoCutTimer);
                autoCutTimer = null;
            }
            if (callbacks.onSave) callbacks.onSave();
        }
    }
    
    function resume() {
        if (state.state === GAME_STATE.PAUSED) {
            state.state = GAME_STATE.PLAYING;
            if (state.activePowerups.auto) {
                startAutoCut();
            }
        }
    }
    
    function quitToMenu() {
        Storage.clearGameState();
        state = Storage.getDefaultGameState();
        if (autoCutTimer) {
            clearInterval(autoCutTimer);
            autoCutTimer = null;
        }
    }
    
    function activatePowerup(powerupId) {
        if (state.state !== GAME_STATE.PLAYING) return false;
        if (playerData.powerups[powerupId] <= 0) return false;
        
        playerData.powerups[powerupId]--;
        Storage.savePlayerData(playerData);
        
        const powerup = Object.values(CONSTANTS.POWERUPS).find(p => p.id === powerupId);
        if (!powerup) return false;
        
        if (powerup.id === 'shield') {
            state.activePowerups.shield = true;
            state.shieldUsed = false;
        } else {
            state.activePowerups[powerupId] = {
                startTime: Date.now(),
                endTime: Date.now() + powerup.duration
            };
            
            if (powerup.id === 'auto') {
                startAutoCut();
            }
        }
        
        if (callbacks.onSave) callbacks.onSave();
        return true;
    }
    
    function startAutoCut() {
        if (autoCutTimer) {
            clearInterval(autoCutTimer);
        }
        
        autoCutTimer = setInterval(() => {
            if (state.state === GAME_STATE.PLAYING && state.activePowerups.auto) {
                const side = state.lastCutSide === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
                cut(side);
            }
        }, 300);
    }
    
    function update() {
        if (state.state !== GAME_STATE.PLAYING) return;
        
        const now = Date.now();
        
        if (state.cutting) {
            state.cutting.progress = Math.min(1, (now - lastCutTime) / 100);
        }
        
        Object.keys(state.activePowerups).forEach(key => {
            const powerup = state.activePowerups[key];
            if (powerup && powerup.endTime && now > powerup.endTime) {
                delete state.activePowerups[key];
                if (key === 'auto' && autoCutTimer) {
                    clearInterval(autoCutTimer);
                    autoCutTimer = null;
                }
            }
        });
        
        state.squirrels = state.squirrels.filter(squirrel => {
            squirrel.progress = (now - squirrel.startTime) / 3000;
            return squirrel.progress < 1;
        });
    }
    
    function isVibrating() {
        const axe = Object.values(CONSTANTS.AXES).find(a => a.id === playerData.equippedAxe);
        return axe && axe.vibration && state.cutting;
    }
    
    return {
        init,
        getState,
        setCallback,
        loadSavedGame,
        startGame,
        cut,
        pause,
        resume,
        quitToMenu,
        activatePowerup,
        update,
        isVibrating
    };
})();