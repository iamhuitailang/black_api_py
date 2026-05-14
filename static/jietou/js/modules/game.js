import { CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS, CHARACTER_TYPES, MAX_HEALTH, PLAYER_START_X, ENEMY_START_X } from './constants.js';
import { Character } from './character.js';
import { AIController } from './ai.js';
import { SceneRenderer } from './scene.js';
import { StorageManager } from './storage.js';

export class Game {
    constructor(canvas, input) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.storage = new StorageManager();

        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        this.currentLevel = 1;
        this.maxUnlockedLevel = this.storage.getMaxUnlockedLevel();
        this.selectedCharacter = this.storage.getSelectedCharacter();
        
        this.player = null;
        this.enemy = null;
        this.ai = null;
        this.scene = new SceneRenderer();

        this.enemyIndex = 0;
        this.enemiesInLevel = [];

        this.onVictory = null;
        this.onDefeat = null;
        this.onLevelComplete = null;
        this.onGameComplete = null;

        this.state = 'menu';
        this.autoSaveInterval = null;
    }

    init(continueGame = false) {
        if (continueGame && this.storage.hasSavedGame()) {
            const savedState = this.storage.getSavedGameState();
            this.currentLevel = savedState.currentLevel;
            this.maxUnlockedLevel = savedState.maxUnlockedLevel;
            this.selectedCharacter = savedState.selectedCharacter;
            this.createCharacters(savedState.playerState, savedState.enemyState);
        } else {
            this.createCharacters();
        }

        this.setupLevel();
        this.isRunning = true;
        this.state = 'playing';
        this.startAutoSave();
    }

    createCharacters(playerState = null, enemyState = null) {
        const charType = this.getCharacterTypeFromId(this.selectedCharacter);
        this.player = new Character(PLAYER_START_X, null, false, charType);
        
        if (playerState) {
            this.player.loadState(playerState);
        }

        const levelConfig = LEVELS[this.currentLevel - 1];
        this.enemiesInLevel = [];
        
        levelConfig.enemies.forEach(enemyGroup => {
            for (let i = 0; i < enemyGroup.count; i++) {
                this.enemiesInLevel.push(enemyGroup.type);
            }
        });
        
        this.enemyIndex = 0;
        
        this.spawnEnemy(enemyState);
    }

    getCharacterTypeFromId(id) {
        for (const [key, value] of Object.entries(CHARACTER_TYPES)) {
            if (value.id === id) {
                return key;
            }
        }
        return 'NORMAL';
    }

    spawnEnemy(savedState = null) {
        if (this.enemyIndex >= this.enemiesInLevel.length) {
            this.levelComplete();
            return;
        }

        const enemyType = this.enemiesInLevel[this.enemyIndex];
        this.enemy = new Character(ENEMY_START_X, null, true, enemyType);
        
        if (savedState) {
            this.enemy.loadState(savedState);
            this.enemy.x = ENEMY_START_X;
        }

        this.ai = new AIController(this.enemy, enemyType.toLowerCase());
        this.enemyIndex++;
    }

    setupLevel() {
        const levelConfig = LEVELS[this.currentLevel - 1];
        if (levelConfig) {
            this.scene.setScene(levelConfig.scene);
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.state === 'playing' && !this.isPaused) {
                this.saveGameState();
            }
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    saveGameState() {
        if (!this.player || !this.enemy) return;
        
        this.storage.saveGameState({
            currentLevel: this.currentLevel,
            maxUnlockedLevel: this.maxUnlockedLevel,
            selectedCharacter: this.selectedCharacter,
            playerState: this.player.getState(),
            enemyState: this.enemy.getState()
        });
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        this.input.update();
        this.player.update(deltaTime, this.input, this.enemy);
        this.ai.update(deltaTime, this.player);
        this.enemy.update(deltaTime, null, this.player);

        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.enemy.isDead) {
            if (this.enemyIndex < this.enemiesInLevel.length) {
                setTimeout(() => {
                    this.spawnEnemy();
                }, 1000);
            } else {
                this.levelComplete();
            }
        }

        if (this.player.isDead) {
            this.defeat();
        }
    }

    levelComplete() {
        this.state = 'victory';
        this.stopAutoSave();
        
        const newMax = this.storage.levelComplete(this.currentLevel);
        this.maxUnlockedLevel = newMax;

        if (this.currentLevel >= LEVELS.length) {
            if (this.onGameComplete) {
                this.onGameComplete();
            }
        } else {
            if (this.onLevelComplete) {
                this.onLevelComplete(this.currentLevel);
            }
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.state = 'playing';
        this.createCharacters();
        this.setupLevel();
        this.startAutoSave();
    }

    defeat() {
        this.state = 'defeat';
        this.stopAutoSave();
        if (this.onDefeat) {
            this.onDefeat();
        }
    }

    restart() {
        this.state = 'playing';
        this.createCharacters();
        this.setupLevel();
        this.startAutoSave();
    }

    pause() {
        this.isPaused = true;
        this.saveGameState();
    }

    resume() {
        this.isPaused = false;
    }

    quit() {
        this.isRunning = false;
        this.stopAutoSave();
        this.saveGameState();
        this.state = 'menu';
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.scene.draw(this.ctx);
        this.player.draw(this.ctx);
        this.enemy.draw(this.ctx);
        this.drawUI();
    }

    drawUI() {
    }

    getPlayerHealth() {
        return this.player ? (this.player.health / this.player.maxHealth) * 100 : 0;
    }

    getEnemyHealth() {
        return this.enemy ? (this.enemy.health / this.enemy.maxHealth) * 100 : 0;
    }

    getPlayerEnergy() {
        return this.player ? this.player.energy : 0;
    }

    getEnemyEnergy() {
        return this.enemy ? this.enemy.energy : 0;
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    getTotalLevels() {
        return LEVELS.length;
    }

    getCharacters() {
        return Object.values(CHARACTER_TYPES).filter(c => c.id !== 'boss');
    }

    selectCharacter(characterId) {
        this.selectedCharacter = characterId;
        this.storage.selectCharacter(characterId);
    }

    getSelectedCharacter() {
        return this.selectedCharacter;
    }

    getMaxUnlockedLevel() {
        return this.maxUnlockedLevel;
    }

    hasSavedGame() {
        return this.storage.hasSavedGame();
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        if (this.isRunning) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    start() {
        this.gameLoop(0);
    }
}
