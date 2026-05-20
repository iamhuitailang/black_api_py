class TerrainSystem {
    constructor() {
        this.currentTerrain = 'grass';
        this.targetX = CONFIG.GAME.WORLD_WIDTH / 2;
        this.targetY = CONFIG.GAME.START_ALTITUDE;
        this.targetRadius = null;
    }
    
    init(terrainType = 'grass') {
        this.currentTerrain = terrainType;
        this.targetX = Utils.randomRange(300, CONFIG.GAME.WORLD_WIDTH - 300);
        this.targetY = CONFIG.GAME.START_ALTITUDE;
        this.targetRadius = null;
    }
    
    getTerrainConfig() {
        return CONFIG.TERRAIN.TYPES[this.currentTerrain];
    }
    
    getTargetPosition() {
        return {
            x: this.targetX,
            y: this.targetY
        };
    }
    
    getTargetRadius() {
        return this.targetRadius || this.getTerrainConfig().targetRadius;
    }
    
    getScoreMultiplier() {
        return this.getTerrainConfig().scoreMultiplier;
    }
    
    getDistanceToTarget(playerX) {
        return Math.abs(playerX - this.targetX);
    }
    
    serialize() {
        return {
            currentTerrain: this.currentTerrain,
            targetX: this.targetX,
            targetY: this.targetY
        };
    }
    
    deserialize(data) {
        if (!data) return;
        this.currentTerrain = data.currentTerrain || 'grass';
        this.targetX = data.targetX || CONFIG.GAME.WORLD_WIDTH / 2;
        this.targetY = data.targetY || CONFIG.GAME.START_ALTITUDE;
    }
}
