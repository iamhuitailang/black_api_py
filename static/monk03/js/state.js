class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.height = 0;
        this.score = 0;
        this.time = 0;
        this.monkeyY = CONSTANTS.CANVAS_HEIGHT - 150;
        this.monkeyVelocity = 0;
        this.monkeyIsClimbing = false;
        this.monkeyClimbProgress = 0;
        this.monkeySide = -1;
        this.monkeyTargetSide = -1;
        this.monkeySideTransition = 0;

        this.obstacles = [];
        this.items = [];
        this.powerups = {
            speed: false,
            speedEndTime: 0,
            shield: false,
            magnet: false,
            magnetEndTime: 0,
            springShoes: false
        };

        this.mode = CONSTANTS.GAME_MODES.SINGLE;
        this.highScore = storageManager.loadHighScore();
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;

        this.chargeStartTime = 0;
        this.isCharging = false;

        this.rhythmBeatTime = 0;
        this.rhythmInterval = 800;
        this.lastRhythmClick = 0;

        this.lastObstacleHeight = 0;
        this.cameraOffset = 0;
        this.targetCameraOffset = 0;

        this.slowMotion = false;
        this.slowMotionEndTime = 0;

        this.climbAnimationTime = 0;
        this.isClimbingAnimating = false;
    }

    loadFromSave(saveData) {
        this.height = saveData.height || 0;
        this.score = saveData.score || 0;
        this.time = saveData.time || 0;
        this.monkeyY = saveData.monkeyY || CONSTANTS.CANVAS_HEIGHT - 150;
        this.monkeySide = saveData.monkeySide !== undefined ? saveData.monkeySide : -1;
        this.monkeyTargetSide = saveData.monkeyTargetSide !== undefined ? saveData.monkeyTargetSide : -1;
        this.monkeySideTransition = 1;
        this.obstacles = saveData.obstacles || [];
        this.items = saveData.items || [];
        this.powerups = saveData.powerups || this.powerups;
        this.mode = saveData.mode || CONSTANTS.GAME_MODES.SINGLE;
        this.highScore = saveData.highScore || this.highScore;
        this.isPlaying = saveData.isPlaying || false;
        this.isPaused = saveData.isPaused || false;
        this.lastObstacleHeight = this.height;
        this.monkeyIsClimbing = false;
        this.monkeyClimbProgress = 0;
    }

    getDifficulty() {
        for (let i = CONSTANTS.DIFFICULTY.length - 1; i >= 0; i--) {
            if (this.height >= CONSTANTS.DIFFICULTY[i].minHeight) {
                return CONSTANTS.DIFFICULTY[i];
            }
        }
        return CONSTANTS.DIFFICULTY[0];
    }

    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            storageManager.saveHighScore(this.highScore);
            return true;
        }
        return false;
    }

    activatePowerup(type) {
        const now = Date.now();
        switch (type) {
            case CONSTANTS.ITEM_TYPES.SPEED_BANANA:
                this.powerups.speed = true;
                this.powerups.speedEndTime = now + CONSTANTS.POWERUP_DURATION.SPEED;
                break;
            case CONSTANTS.ITEM_TYPES.SHIELD_LEAF:
                this.powerups.shield = true;
                break;
            case CONSTANTS.ITEM_TYPES.MAGNET:
                this.powerups.magnet = true;
                this.powerups.magnetEndTime = now + CONSTANTS.POWERUP_DURATION.MAGNET;
                break;
            case CONSTANTS.ITEM_TYPES.SPRING_SHOES:
                this.powerups.springShoes = true;
                break;
        }
    }

    updatePowerups() {
        const now = Date.now();
        if (this.powerups.speed && now > this.powerups.speedEndTime) {
            this.powerups.speed = false;
        }
        if (this.powerups.magnet && now > this.powerups.magnetEndTime) {
            this.powerups.magnet = false;
        }
        if (this.slowMotion && now > this.slowMotionEndTime) {
            this.slowMotion = false;
        }
    }

    useShield() {
        if (this.powerups.shield) {
            this.powerups.shield = false;
            return true;
        }
        return false;
    }

    useSpringShoes() {
        if (this.powerups.springShoes) {
            this.powerups.springShoes = false;
            return true;
        }
        return false;
    }
}

const gameState = new GameState();
