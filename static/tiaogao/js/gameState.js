class GameState {
    constructor() {
        this.currentScreen = 'main-menu';
        this.isPaused = false;
        this.isGameOver = false;
        this.score = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.selectedCharacterId = Storage.getSelectedCharacter();
        this.selectedSceneId = Storage.getSelectedScene();
        this.character = null;
        this.scene = null;
        this.balanceSystem = null;
        this.obstacleSystem = null;
        this.itemSystem = null;
        this.isVictory = false;
        this._gameOverTimeout = null;
    }

    initGame() {
        const characterConfig = GameConfig.CHARACTERS.find(c => c.id === this.selectedCharacterId);
        const sceneConfig = GameConfig.SCENES.find(s => s.id === this.selectedSceneId);

        this.character = new Character(this.selectedCharacterId);
        this.scene = sceneConfig;
        this.balanceSystem = new BalanceSystem(this.character);
        this.obstacleSystem = new ObstacleSystem(this.scene);
        this.itemSystem = new ItemSystem();

        this.character.x = 100;
        this.score = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isVictory = false;

        const savedState = Storage.loadGameState();
        if (savedState && savedState.characterId === this.selectedCharacterId && savedState.sceneId === this.selectedSceneId) {
            this.deserialize(savedState);
        }
    }

    update(dt) {
        if (this.isPaused || this.isGameOver) return;

        this.gameTime += dt;
        this.distance = Math.max(0, this.character.x - 100) / 10;
        this.score = Math.floor(this.distance * 10);

        const moveSpeed = 0.05 * this.character.stats.moveSpeed;
        if (this.balanceSystem.isCritical()) {
            this.character.x += moveSpeed * 0.3 * dt;
        } else {
            this.character.x += moveSpeed * dt;
        }

        this.balanceSystem.update(dt);
        this.obstacleSystem.update(dt, this.character.x, this.getWireY(), this.balanceSystem, this.character);
        this.itemSystem.update();
        this.character.updatePhysics(this.balanceSystem.balance, dt, this.scene);

        if (this.itemSystem.checkSafetyRope(this.character, this.balanceSystem)) {
        }

        if (this.balanceSystem.isFalling()) {
            this.gameOver(false);
        }

        if (this.character.x >= GameConfig.WIRE_LENGTH) {
            this.gameOver(true);
        }

        if (this.gameTime % 3000 < 20) {
            this.saveProgress();
        }
    }

    getWireY() {
        return this.scene ? window.innerHeight * this.scene.wireHeight : 0;
    }

    gameOver(victory) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isVictory = victory;
        
        if (!victory && this.character) {
            this.character.startFall();
        }

        Storage.clearGameState();
        const isNewRecord = Storage.setHighScore(this.score);
        
        this._gameOverTimeout = setTimeout(() => {
            this.showGameOverScreen(isNewRecord);
        }, victory ? 500 : 1500);
    }

    showGameOverScreen(isNewRecord) {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-distance').textContent = Math.floor(this.distance);
        document.getElementById('new-record').classList.toggle('hidden', !isNewRecord);
        document.getElementById('result-title').textContent = this.isVictory ? '🎉 挑战成功！' : '😢 挑战失败';
        this.showScreen('game-over');
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;
    }

    togglePause() {
        if (this.isGameOver || !this.character) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showScreen('pause-screen');
            this.saveProgress();
        } else {
            this.showScreen('game-hud');
        }
    }

    saveProgress() {
        if (this.isGameOver) return;
        const state = this.serialize();
        Storage.saveGameState(state);
    }

    reset() {
        Storage.clearGameState();
        if (this._gameOverTimeout) {
            clearTimeout(this._gameOverTimeout);
            this._gameOverTimeout = null;
        }
        this.character = null;
        this.scene = null;
        this.balanceSystem = null;
        this.obstacleSystem = null;
        this.itemSystem = null;
        this.score = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isVictory = false;
    }

    serialize() {
        return {
            characterId: this.selectedCharacterId,
            sceneId: this.selectedSceneId,
            character: {
                x: this.character.x,
                y: this.character.y,
                angle: this.character.angle,
                balanceBoost: this.character.balanceBoost,
                windImmune: this.character.windImmune,
                safetyRope: this.character.safetyRope
            },
            balance: this.balanceSystem.serialize(),
            obstacles: this.obstacleSystem.serialize(),
            items: this.itemSystem.serialize(),
            score: this.score,
            distance: this.distance,
            gameTime: this.gameTime
        };
    }

    deserialize(data) {
        if (!data) return;

        this.character.x = data.character.x || 100;
        this.character.y = data.character.y || 0;
        this.character.angle = data.character.angle || 0;
        this.character.balanceBoost = data.character.balanceBoost || 0;
        this.character.windImmune = data.character.windImmune || false;
        this.character.safetyRope = data.character.safetyRope || false;

        this.balanceSystem.deserialize(data.balance);
        this.obstacleSystem.deserialize(data.obstacles);
        this.itemSystem.deserialize(data.items, this.character);

        this.score = data.score || 0;
        this.distance = data.distance || 0;
        this.gameTime = data.gameTime || 0;
    }
}
