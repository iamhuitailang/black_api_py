class ObstacleGenerator {
    constructor() {
        this.lastGenerateHeight = 0;
    }

    generate() {
        const difficulty = gameState.getDifficulty();
        const heightDiff = gameState.height - this.lastGenerateHeight;
        
        if (heightDiff >= 80) {
            const obstacleTypes = this.getAvailableObstacleTypes();
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            const obstacle = {
                type: type,
                height: gameState.height + 400 + Math.random() * 200,
                side: Math.random() > 0.5 ? 1 : -1,
                offset: 0,
                growth: type === CONSTANTS.OBSTACLE_TYPES.MUSHROOM ? 0.3 : 1
            };
            
            gameState.obstacles.push(obstacle);
            this.lastGenerateHeight = gameState.height;
        }
    }

    getAvailableObstacleTypes() {
        const height = gameState.height;
        const types = [CONSTANTS.OBSTACLE_TYPES.BRANCH];
        
        if (height >= 50) {
            types.push(CONSTANTS.OBSTACLE_TYPES.BUG);
            types.push(CONSTANTS.OBSTACLE_TYPES.WEB);
        }
        if (height >= 150) {
            types.push(CONSTANTS.OBSTACLE_TYPES.MUSHROOM);
        }
        if (height >= 300) {
            types.push(CONSTANTS.OBSTACLE_TYPES.WOODPECKER);
            types.push(CONSTANTS.OBSTACLE_TYPES.NEST);
        }
        
        return types;
    }

    reset() {
        this.lastGenerateHeight = 0;
    }
}

const obstacleGenerator = new ObstacleGenerator();
