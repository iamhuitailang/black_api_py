const WaveSystem = {
    update(deltaTime) {
        if (GameState.isGameOver) return;

        if (!GameState.waveInProgress && GameState.currentWave < CONFIG.WAVES.length) {
            GameState.waveTimer -= deltaTime;
            if (GameState.waveTimer <= 0) {
                this.startNextWave();
            }
        }

        if (GameState.enemySpawnQueue.length > 0) {
            GameState.enemySpawnTimer -= deltaTime;
            if (GameState.enemySpawnTimer <= 0) {
                this.spawnNextEnemy();
                GameState.enemySpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL;
            }
        }
    },

    startNextWave() {
        GameState.currentWave++;
        GameState.waveInProgress = true;

        const waveData = CONFIG.WAVES[GameState.currentWave - 1];
        if (!waveData) return;

        GameState.enemySpawnQueue = [];
        waveData.enemies.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                GameState.enemySpawnQueue.push(group.type);
            }
        });

        GameState.enemySpawnQueue.sort(() => Math.random() - 0.5);
        GameState.enemySpawnTimer = 0;

        UISystem.showWaveNotification(GameState.currentWave, waveData.description);
    },

    spawnNextEnemy() {
        if (GameState.enemySpawnQueue.length === 0) return;

        const enemyType = GameState.enemySpawnQueue.shift();
        const spawnPoint = this.getRandomSpawnPoint();
        const enemy = new Enemy(enemyType, spawnPoint.x, spawnPoint.y);
        GameState.enemies.push(enemy);
    },

    getRandomSpawnPoint() {
        const side = Math.floor(Math.random() * 3);
        let x, y;

        if (side === 0) {
            x = Math.random() * CONFIG.CANVAS_WIDTH;
            y = 50;
        } else if (side === 1) {
            x = 50;
            y = Math.random() * (CONFIG.CANVAS_HEIGHT / 2);
        } else {
            x = CONFIG.CANVAS_WIDTH - 50;
            y = Math.random() * (CONFIG.CANVAS_HEIGHT / 2);
        }

        return { x, y };
    },

    onWaveComplete() {
        if (!GameState.waveInProgress) return;

        GameState.waveInProgress = false;
        
        const waveData = CONFIG.WAVES[GameState.currentWave - 1];
        if (waveData) {
            GameState.addStone(waveData.reward);
            RenderSystem.addEffect('stone', CONFIG.COLONY.X, CONFIG.COLONY.Y - 80, waveData.reward);
        }

        Storage.saveHighestWave(GameState.currentWave);

        if (GameState.currentWave >= CONFIG.WAVES.length) {
            setTimeout(() => {
                GameState.isGameOver = true;
                UISystem.showGameOver(true);
            }, 2000);
        } else {
            GameState.waveTimer = CONFIG.WAVE_DELAY;
        }
    },

    getWaveCountdown() {
        if (GameState.waveInProgress) return 0;
        return Math.max(0, GameState.waveTimer);
    }
};
