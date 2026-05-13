const Level = (() => {
    let currentLevel = 0;
    let currentWave = 0;
    let lastWaveTime = 0;
    let isBossWave = false;
    let score = 0;
    
    const init = () => {
        currentLevel = 0;
        currentWave = 0;
        lastWaveTime = 0;
        isBossWave = false;
        score = 0;
    };
    
    const getCurrentLevelConfig = () => {
        return Config.LEVELS[currentLevel];
    };
    
    const spawnWave = (currentTime) => {
        const levelConfig = getCurrentLevelConfig();
        if (!levelConfig) return;
        
        if (isBossWave) return;
        
        if (currentWave >= levelConfig.waves) {
            if (!Enemy.getBoss() && Enemy.getEnemies().length === 0) {
                Enemy.createBoss(levelConfig);
                isBossWave = true;
            }
            return;
        }
        
        if (currentTime - lastWaveTime < Config.GAME.WAVE_INTERVAL && 
            Enemy.getEnemies().length > 0) {
            return;
        }
        
        lastWaveTime = currentTime;
        currentWave++;
        
        const enemyCount = Math.min(
            Config.GAME.ENEMIES_PER_WAVE_START + Math.floor(currentWave / 2),
            Config.GAME.ENEMIES_PER_WAVE_MAX
        );
        
        const enemyTypes = levelConfig.enemyTypes;
        
        for (let i = 0; i < enemyCount; i++) {
            const typeKey = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const enemy = Enemy.create(typeKey);
            enemy.x = (Config.CANVAS_WIDTH / (enemyCount + 1)) * (i + 1) - enemy.width / 2;
            enemy.y = -enemy.height - i * 30;
            Enemy.add(enemy);
            
            if (enemy.hasEscort) {
                const leftEscort = Enemy.create('SCOUT', enemy.x - 40, enemy.y);
                const rightEscort = Enemy.create('SCOUT', enemy.x + enemy.width + 10, enemy.y);
                Enemy.add(leftEscort);
                Enemy.add(rightEscort);
            }
        }
    };
    
    const checkLevelComplete = () => {
        if (isBossWave && !Enemy.getBoss() && Enemy.getEnemies().length === 0) {
            currentLevel++;
            currentWave = 0;
            isBossWave = false;
            
            if (currentLevel >= Config.LEVELS.length) {
                return 'victory';
            }
            return 'nextLevel';
        }
        return null;
    };
    
    const addScore = (points) => {
        score += points;
    };
    
    const getScore = () => score;
    const getCurrentLevel = () => currentLevel;
    const getCurrentWave = () => currentWave;
    
    const getState = () => ({
        currentLevel,
        currentWave,
        lastWaveTime,
        isBossWave,
        score
    });
    
    const restoreState = (state) => {
        currentLevel = state.currentLevel;
        currentWave = state.currentWave;
        lastWaveTime = state.lastWaveTime;
        isBossWave = state.isBossWave;
        score = state.score;
    };
    
    return {
        init,
        getCurrentLevelConfig,
        spawnWave,
        checkLevelComplete,
        addScore,
        getScore,
        getCurrentLevel,
        getCurrentWave,
        getState,
        restoreState
    };
})();
