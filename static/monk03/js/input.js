class InputManager {
    constructor() {
        this.keys = {};
        this.touchStartY = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleKeyDown(e) {
        if (gameState.isPlaying && !gameState.isPaused) {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState.mode === CONSTANTS.GAME_MODES.SINGLE) {
                    this.climb();
                } else if (gameState.mode === CONSTANTS.GAME_MODES.CHARGE) {
                    if (!gameState.isCharging) {
                        this.startCharge();
                    }
                } else if (gameState.mode === CONSTANTS.GAME_MODES.RHYTHM) {
                    this.rhythmClimb();
                }
            }
            
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                gameState.monkeyTargetSide = -1;
            }
            
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                gameState.monkeyTargetSide = 1;
            }
        }
        
        if (e.code === 'Escape' && gameState.isPlaying) {
            uiManager.togglePause();
        }
        
        this.keys[e.code] = true;
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
        
        if ((e.code === 'Space' || e.code === 'ArrowUp') && gameState.mode === CONSTANTS.GAME_MODES.CHARGE && gameState.isCharging) {
            this.endCharge();
        }
    }

    handleMouseDown(e) {
        if (gameState.isPlaying && !gameState.isPaused) {
            const canvas = document.getElementById('game-canvas');
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const centerX = rect.width / 2;
            
            gameState.monkeyTargetSide = x < centerX ? -1 : 1;
            
            if (gameState.mode === CONSTANTS.GAME_MODES.SINGLE) {
                this.climb();
            } else if (gameState.mode === CONSTANTS.GAME_MODES.CHARGE) {
                if (!gameState.isCharging) {
                    this.startCharge();
                }
            } else if (gameState.mode === CONSTANTS.GAME_MODES.RHYTHM) {
                this.rhythmClimb();
            }
        }
    }

    handleMouseUp(e) {
        if (gameState.mode === CONSTANTS.GAME_MODES.CHARGE && gameState.isCharging) {
            this.endCharge();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.touchStartY = e.touches[0].clientY;
        
        if (gameState.isPlaying && !gameState.isPaused) {
            const canvas = document.getElementById('game-canvas');
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const centerX = rect.width / 2;
            
            gameState.monkeyTargetSide = x < centerX ? -1 : 1;
            
            if (gameState.mode === CONSTANTS.GAME_MODES.SINGLE) {
                this.climb();
            } else if (gameState.mode === CONSTANTS.GAME_MODES.CHARGE) {
                if (!gameState.isCharging) {
                    this.startCharge();
                }
            } else if (gameState.mode === CONSTANTS.GAME_MODES.RHYTHM) {
                this.rhythmClimb();
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (gameState.mode === CONSTANTS.GAME_MODES.CHARGE && gameState.isCharging) {
            this.endCharge();
        }
    }

    climb(distance = null) {
        if (gameState.monkeyIsClimbing || !gameState.isPlaying) return;
        
        let climbDistance = distance || CONSTANTS.CLIMB_DISTANCE;
        
        if (gameState.useSpringShoes()) {
            climbDistance *= 3;
        }
        
        if (gameState.powerups.speed) {
            climbDistance *= 1.5;
        }
        
        if (gameState.slowMotion) {
            climbDistance *= 0.5;
        }
        
        gameState.monkeyIsClimbing = true;
        gameState.monkeyClimbProgress = 0;
        gameState.height += climbDistance;
        
        gameState.addScore(Math.floor(climbDistance / 10));
        audioManager.playClimb();
        
        obstacleGenerator.generate();
        itemGenerator.generate();
        
        storageManager.saveGame(gameState);
    }

    startCharge() {
        if (gameState.monkeyIsClimbing) return;
        gameState.isCharging = true;
        gameState.chargeStartTime = Date.now();
        uiManager.showChargeBar();
    }

    endCharge() {
        if (!gameState.isCharging) return;
        
        const chargeTime = Math.min(Date.now() - gameState.chargeStartTime, CONSTANTS.CHARGE_MAX_TIME);
        const chargeRatio = chargeTime / CONSTANTS.CHARGE_MAX_TIME;
        const climbDistance = CONSTANTS.CLIMB_DISTANCE + chargeRatio * (CONSTANTS.CHARGE_MAX_DISTANCE - CONSTANTS.CLIMB_DISTANCE);
        
        gameState.isCharging = false;
        uiManager.hideChargeBar();
        this.climb(climbDistance);
    }

    rhythmClimb() {
        if (gameState.monkeyIsClimbing) return;
        
        const now = Date.now();
        const timeSinceBeat = now - gameState.rhythmBeatTime;
        const beatWindow = gameState.rhythmInterval * 0.3;
        
        if (timeSinceBeat < beatWindow || (gameState.rhythmInterval - timeSinceBeat) < beatWindow) {
            gameState.addScore(CONSTANTS.SCORES.RHYTHM_PERFECT);
            uiManager.showFloatingText('PERFECT! +50', gameState.height, 0);
            this.climb(CONSTANTS.CLIMB_DISTANCE * 1.5);
        } else if (timeSinceBeat < beatWindow * 2 || (gameState.rhythmInterval - timeSinceBeat) < beatWindow * 2) {
            gameState.addScore(CONSTANTS.SCORES.RHYTHM_GOOD);
            uiManager.showFloatingText('GOOD! +25', gameState.height, 0);
            this.climb(CONSTANTS.CLIMB_DISTANCE * 1.2);
        } else {
            this.climb(CONSTANTS.CLIMB_DISTANCE);
        }
        
        audioManager.playRhythmBeat();
    }
}

const inputManager = new InputManager();
