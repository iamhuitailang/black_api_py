class GameState {
    constructor() {
        this.currentState = CONSTANTS.GAME_STATES.MENU;
        this.level = 1;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.bubblesPopped = 0;
        this.shotsFired = 0;
        this.accuracy = 0;
        this.grid = new Grid();
        this.launcher = null;
        this.activeBubble = null;
        this.particles = [];
        this.levelConfig = null;
        this.levelColors = [];
        this.shotsSinceLastRow = 0;
        this.isProcessing = false;
        this.pendingActions = [];
        this.screenShake = 0;
        this.scorePopups = [];
    }
    
    init(launcherId = 'balance') {
        this.launcher = new Launcher(launcherId);
        this.loadLevel(this.level);
    }
    
    loadLevel(levelNumber) {
        this.level = levelNumber;
        this.levelConfig = getLevelConfig(levelNumber);
        this.levelColors = BUBBLE_COLORS.slice(0, this.levelConfig.colors);
        
        this.grid.clear();
        this.particles = [];
        this.scorePopups = [];
        this.activeBubble = null;
        this.combo = 0;
        this.shotsSinceLastRow = 0;
        this.isProcessing = false;
        this.pendingActions = [];
        this.screenShake = 0;
        
        const bubblesData = generateLevelBubbles(this.levelConfig);
        for (const data of bubblesData) {
            const bubble = new Bubble({
                row: data.row,
                col: data.col,
                color: data.color,
                type: data.type
            });
            bubble.setPositionFromGrid();
            this.grid.addBubble(bubble);
        }
        
        this.launcher.init(this.levelColors);
        
        Storage.setCurrentLevel(levelNumber);
        this.save();
    }
    
    resetLevel() {
        this.loadLevel(this.level);
    }
    
    nextLevel() {
        const nextLevel = Math.min(this.level + 1, getMaxLevel());
        Storage.unlockLevel(nextLevel);
        this.loadLevel(nextLevel);
    }
    
    addScore(points, x, y) {
        const comboMultiplier = 1 + this.combo * 0.5;
        const launcherMultiplier = this.launcher.scoreMultiplier / 10;
        const finalPoints = Math.floor(points * comboMultiplier * launcherMultiplier);
        
        this.score += finalPoints;
        this.bubblesPopped++;
        
        if (x !== undefined && y !== undefined) {
            this.scorePopups.push({
                x,
                y,
                value: finalPoints,
                life: 1000,
                maxLife: 1000
            });
        }
        
        return finalPoints;
    }
    
    addCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }
    
    resetCombo() {
        this.combo = 0;
    }
    
    addShotsFired() {
        this.shotsFired++;
    }
    
    addScreenShake(amount) {
        this.screenShake = Math.min(this.screenShake + amount, 20);
    }
    
    checkLevelComplete() {
        return this.grid.isEmpty() || this.score >= this.levelConfig.targetScore;
    }
    
    checkGameOver() {
        const bottomRow = this.grid.getBottomRow();
        return bottomRow >= CONSTANTS.GRID_ROWS - 2;
    }
    
    addRowOfBubbles() {
        this.grid.addRow(true);
        
        const newRow = 0;
        const cols = CONSTANTS.GRID_COLS;
        
        for (let col = 0; col < cols; col++) {
            if (!this.grid.hasBubble(newRow, col)) {
                const color = this.levelColors[Math.floor(Math.random() * this.levelColors.length)];
                let type = 'normal';
                
                if (Math.random() < this.levelConfig.specialBubbleChance) {
                    type = this.launcher.specialBubbleTypes[
                        Math.floor(Math.random() * this.launcher.specialBubbleTypes.length)
                    ];
                }
                
                const bubble = new Bubble({
                    row: newRow,
                    col,
                    color,
                    type
                });
                bubble.setPositionFromGrid();
                this.grid.addBubble(bubble);
            }
        }
        
        this.shotsSinceLastRow = 0;
        this.addScreenShake(10);
    }
    
    update(deltaTime) {
        if (this.activeBubble) {
            this.activeBubble.update(deltaTime);
        }
        
        this.grid.update(deltaTime);
        
        this.launcher.update(deltaTime, this.levelColors);
        
        this.particles = this.particles.filter(p => {
            p.life -= deltaTime;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });
        
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.life -= deltaTime;
            popup.y -= 0.5;
            return popup.life > 0;
        });
        
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }
        
        return this.checkLevelComplete() || this.checkGameOver();
    }
    
    save() {
        const saveData = {
            level: this.level,
            score: this.score,
            maxCombo: this.maxCombo,
            bubblesPopped: this.bubblesPopped,
            shotsFired: this.shotsFired,
            launcher: this.launcher.serialize(),
            grid: this.grid.serialize(),
            savedAt: Date.now()
        };
        Storage.saveGameState(saveData);
    }
    
    static load() {
        const savedData = Storage.loadGameState();
        if (!savedData) return null;
        
        const gameState = new GameState();
        gameState.level = savedData.level;
        gameState.score = savedData.score;
        gameState.maxCombo = savedData.maxCombo;
        gameState.bubblesPopped = savedData.bubblesPopped;
        gameState.shotsFired = savedData.shotsFired;
        gameState.launcher = Launcher.deserialize(savedData.launcher);
        gameState.grid = Grid.deserialize(savedData.grid);
        gameState.levelConfig = getLevelConfig(savedData.level);
        gameState.levelColors = BUBBLE_COLORS.slice(0, gameState.levelConfig.colors);
        
        return gameState;
    }
}
