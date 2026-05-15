import { CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, BASE_PLATFORM_Y, MOVE_MODES, getLevelConfig, getAlignmentGrade, GAME_STATES, BOX_TYPES } from './config.js';
import { Box } from './box.js';
import { storageManager } from './storage.js';

export class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.stackHeight = 0;
        this.boxes = [];
        this.currentBox = null;
        this.nextBoxType = 'WOOD';
        this.gameState = GAME_STATES.MENU;
        this.fallingBoxes = [];
        this.falling = false;
        
        this.towerAngle = 0;
        this.towerSwayVelocity = 0;
        this.totalOffset = 0;
        
        this.moveDirection = 1;
        this.movePhase = 0;
        this.moveSpeed = 2;
        
        this.highScore = 0;
        this.maxHeight = 0;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.lastFlash = null;
        this.onFlash = null;
        this.onStateChange = null;
        
        this.boxes.push(Box.createBasePlatform());
    }

    init() {
        const savedState = storageManager.load();
        if (savedState && savedState.gameState === GAME_STATES.PLAYING) {
            this.loadState(savedState);
        } else {
            this.reset();
            this.gameState = GAME_STATES.MENU;
        }
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.stackHeight = 0;
        this.boxes = [Box.createBasePlatform()];
        this.currentBox = null;
        this.nextBoxType = 'WOOD';
        this.fallingBoxes = [];
        this.falling = false;
        this.towerAngle = 0;
        this.towerSwayVelocity = 0;
        this.totalOffset = 0;
        this.moveDirection = 1;
        this.movePhase = 0;
        
        this.spawnNewBox();
    }

    spawnNewBox() {
        const levelConfig = getLevelConfig(this.stackHeight);
        const availableTypes = levelConfig.boxTypes;
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        this.nextBoxType = randomType;
        
        const boxConfig = BOX_TYPES[randomType];
        const spawnY = 100;
        
        this.currentBox = new Box(randomType, CENTER_X, spawnY);
        this.falling = false;
        
        this.level = levelConfig.level;
        this.moveSpeed = levelConfig.speed;
    }

    update(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.gameState !== GAME_STATES.PLAYING) {
            return;
        }

        const levelConfig = getLevelConfig(this.stackHeight);
        if (this.level !== levelConfig.level) {
            this.level = levelConfig.level;
            this.moveSpeed = levelConfig.speed;
        }

        this.updateBoxMovement();
        this.updateFallingBoxes();
        this.updateTowerSway();
        this.checkGameOver();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        if (this.stackHeight > this.maxHeight) {
            this.maxHeight = this.stackHeight;
        }
    }

    updateBoxMovement() {
        if (!this.currentBox || this.falling) {
            return;
        }

        const levelConfig = getLevelConfig(this.stackHeight);
        const moveMode = levelConfig.moveMode;
        const halfWidth = this.currentBox.width / 2;
        const minX = halfWidth + 50;
        const maxX = CANVAS_WIDTH - halfWidth - 50;
        const centerX = (minX + maxX) / 2;
        const moveRange = maxX - minX;

        switch (moveMode) {
            case MOVE_MODES.HORIZONTAL:
                this.currentBox.x += this.moveSpeed * this.moveDirection;
                if (this.currentBox.x >= maxX) {
                    this.currentBox.x = maxX;
                    this.moveDirection = -1;
                } else if (this.currentBox.x <= minX) {
                    this.currentBox.x = minX;
                    this.moveDirection = 1;
                }
                break;

            case MOVE_MODES.BIDIRECTIONAL:
                this.movePhase += 0.02;
                const bidirectionalOffset = Math.sin(this.movePhase) * (moveRange / 2 - 20);
                this.currentBox.x = centerX + bidirectionalOffset;
                break;

            case MOVE_MODES.CIRCULAR:
                this.movePhase += 0.015;
                const circularOffset = Math.cos(this.movePhase) * (moveRange / 2 - 30);
                this.currentBox.x = centerX + circularOffset;
                this.currentBox.y = 100 + Math.sin(this.movePhase * 2) * 30;
                break;

            case MOVE_MODES.VARIABLE:
                this.movePhase += 0.02;
                const variableSpeed = this.moveSpeed * (0.5 + Math.sin(this.movePhase * 0.5) * 0.5);
                this.currentBox.x += variableSpeed * this.moveDirection;
                if (this.currentBox.x >= maxX) {
                    this.currentBox.x = maxX;
                    this.moveDirection = -1;
                } else if (this.currentBox.x <= minX) {
                    this.currentBox.x = minX;
                    this.moveDirection = 1;
                }
                break;
        }

        if (levelConfig.wind) {
            const windEffect = Math.sin(this.movePhase * 0.5) * 0.3;
            this.currentBox.x += windEffect;
        }

        this.currentBox.x = Math.max(minX, Math.min(maxX, this.currentBox.x));
    }

    updateFallingBoxes() {
        if (this.currentBox && this.falling) {
            this.currentBox.update(this.deltaTime);
            
            const topBox = this.boxes[this.boxes.length - 1];
            const collisionY = topBox.getTop();
            
            if (this.currentBox.getBottom() >= collisionY) {
                this.handleBoxLanding();
            }
        }

        for (let i = this.fallingBoxes.length - 1; i >= 0; i--) {
            const box = this.fallingBoxes[i];
            box.update(this.deltaTime);
            
            if (box.isOffScreen()) {
                this.fallingBoxes.splice(i, 1);
            }
        }
    }

    handleBoxLanding() {
        const topBox = this.boxes[this.boxes.length - 1];
        const alignmentPercentage = this.currentBox.calculateAlignmentPercentage(topBox);
        const grade = getAlignmentGrade(alignmentPercentage);

        if (alignmentPercentage < 20) {
            this.currentBox.velocityX = (this.currentBox.x - topBox.x) * 0.3;
            this.currentBox.angularVelocity = (Math.random() - 0.5) * 0.2;
            this.fallingBoxes.push(this.currentBox);
            this.triggerGameOver();
            return;
        }

        if (grade.flash && this.onFlash) {
            this.onFlash(grade.flash);
        }

        const hasOverlap = this.currentBox.trimToOverlap(topBox);
        if (!hasOverlap) {
            this.fallingBoxes.push(this.currentBox);
            this.triggerGameOver();
            return;
        }

        const topBoxCenter = topBox.x;
        const offset = this.currentBox.x - topBoxCenter;
        this.totalOffset += offset * this.currentBox.offsetPenalty;
        
        const normalizedOffset = Math.abs(offset) / (this.currentBox.width / 2);
        this.towerSwayVelocity += normalizedOffset * 0.02;
        
        if (this.currentBox.vibrationEffect) {
            this.towerSwayVelocity += 0.05;
        }

        const scoreGain = Math.floor(this.currentBox.baseScore * grade.multiplier * this.currentBox.scoreMultiplier);
        this.score += scoreGain;

        this.currentBox.place();
        this.currentBox.y = topBox.getTop() - this.currentBox.height / 2;
        this.boxes.push(this.currentBox);
        this.stackHeight++;

        const levelConfig = getLevelConfig(this.stackHeight);
        this.level = levelConfig.level;
        this.moveSpeed = levelConfig.speed;

        this.falling = false;
        this.spawnNewBox();
        this.saveState();
    }

    updateTowerSway() {
        const swayRestoringForce = -this.towerAngle * 0.005;
        const swayDamping = -this.towerSwayVelocity * 0.98;
        
        this.towerSwayVelocity += swayRestoringForce + swayDamping;
        this.towerAngle += this.towerSwayVelocity;
        
        const maxAngle = 0.1 + this.stackHeight * 0.002;
        this.towerAngle = Math.max(-maxAngle, Math.min(maxAngle, this.towerAngle));
    }

    checkGameOver() {
        const maxStableAngle = 0.15 + this.stackHeight * 0.003;
        if (Math.abs(this.towerAngle) > maxStableAngle) {
            this.collapseTower();
            this.triggerGameOver();
        }
    }

    collapseTower() {
        for (let i = 1; i < this.boxes.length; i++) {
            const box = this.boxes[i];
            box.isFalling = true;
            box.velocityX = (Math.random() - 0.5) * 10;
            box.angularVelocity = (Math.random() - 0.5) * 0.3;
            this.fallingBoxes.push(box);
        }
        this.boxes = [this.boxes[0]];
    }

    dropBox() {
        if (this.gameState !== GAME_STATES.PLAYING || this.falling || !this.currentBox) {
            return;
        }
        this.falling = true;
        this.currentBox.startFalling();
    }

    triggerGameOver() {
        this.gameState = GAME_STATES.GAMEOVER;
        storageManager.clear();
        if (this.onStateChange) {
            this.onStateChange(this.gameState);
        }
    }

    pause() {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.PAUSED;
            this.saveState();
            if (this.onStateChange) {
                this.onStateChange(this.gameState);
            }
        }
    }

    resume() {
        if (this.gameState === GAME_STATES.PAUSED) {
            this.gameState = GAME_STATES.PLAYING;
            this.lastTime = 0;
            if (this.onStateChange) {
                this.onStateChange(this.gameState);
            }
        }
    }

    start() {
        if (this.gameState === GAME_STATES.MENU || this.gameState === GAME_STATES.GAMEOVER) {
            this.reset();
            this.gameState = GAME_STATES.PLAYING;
            this.lastTime = 0;
            this.saveState();
            if (this.onStateChange) {
                this.onStateChange(this.gameState);
            }
        }
    }

    saveState() {
        storageManager.saveGame(this);
    }

    loadState(state) {
        this.score = state.score || 0;
        this.level = state.level || 1;
        this.stackHeight = state.stackHeight || 0;
        this.towerAngle = state.towerAngle || 0;
        this.towerSwayVelocity = state.towerSwayVelocity || 0;
        this.totalOffset = state.totalOffset || 0;
        this.moveDirection = state.moveDirection || 1;
        this.movePhase = state.movePhase || 0;
        this.falling = state.falling || false;
        this.highScore = state.highScore || 0;
        this.maxHeight = state.maxHeight || 0;
        this.nextBoxType = state.nextBoxType || 'WOOD';
        this.gameState = state.gameState || GAME_STATES.MENU;

        if (state.boxes && state.boxes.length > 0) {
            this.boxes = state.boxes.map(Box.deserialize);
        } else {
            this.boxes = [Box.createBasePlatform()];
        }

        if (state.currentBox) {
            this.currentBox = Box.deserialize(state.currentBox);
        } else if (this.gameState === GAME_STATES.PLAYING) {
            this.spawnNewBox();
        }

        if (state.fallingBoxes) {
            this.fallingBoxes = state.fallingBoxes.map(Box.deserialize);
        }
    }

    getState() {
        return {
            score: this.score,
            level: this.level,
            stackHeight: this.stackHeight,
            highScore: this.highScore,
            maxHeight: this.maxHeight
        };
    }
}