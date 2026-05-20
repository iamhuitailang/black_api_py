const GameState = {
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    speedMultiplier: 1,

    resources: {
        food: 0,
        stone: 0,
        honey: 0
    },

    colony: null,
    units: [],
    enemies: [],
    resourcePoints: [],

    currentWave: 0,
    waveInProgress: false,
    waveTimer: 0,
    enemySpawnQueue: [],
    enemySpawnTimer: 0,

    hatchQueue: [],
    currentHatchTime: 0,
    totalHatchTime: 0,

    upgrades: {
        hp: 0,
        unitLimit: 0,
        defense: 0,
        hatchSpeed: 0,
        gatherEfficiency: 0
    },

    projectiles: [],
    effects: [],

    init() {
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.speedMultiplier = 1;

        this.resources = {
            food: CONFIG.RESOURCES.INITIAL_FOOD,
            stone: CONFIG.RESOURCES.INITIAL_STONE,
            honey: CONFIG.RESOURCES.INITIAL_HONEY
        };

        this.units = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.resourcePoints = [];

        this.currentWave = 0;
        this.waveInProgress = false;
        this.waveTimer = 0;
        this.enemySpawnQueue = [];
        this.enemySpawnTimer = 0;

        this.hatchQueue = [];
        this.currentHatchTime = 0;
        this.totalHatchTime = 0;

        this.upgrades = {
            hp: 0,
            unitLimit: 0,
            defense: 0,
            hatchSpeed: 0,
            gatherEfficiency: 0
        };
    },

    addFood(amount) {
        this.resources.food = Math.min(
            this.resources.food + amount,
            CONFIG.RESOURCES.FOOD_MAX
        );
    },

    addStone(amount) {
        this.resources.stone = Math.min(
            this.resources.stone + amount,
            CONFIG.RESOURCES.STONE_MAX
        );
    },

    addHoney(amount) {
        this.resources.honey = Math.min(
            this.resources.honey + amount,
            CONFIG.RESOURCES.HONEY_MAX
        );
    },

    canAfford(cost, type) {
        if (type === 'food') return this.resources.food >= cost;
        if (type === 'stone') return this.resources.stone >= cost;
        if (type === 'honey') return this.resources.honey >= cost;
        return false;
    },

    spendResources(cost, type) {
        if (type === 'food') this.resources.food -= cost;
        if (type === 'stone') this.resources.stone -= cost;
        if (type === 'honey') this.resources.honey -= cost;
    },

    getUnitLimit() {
        return CONFIG.COLONY.INITIAL_UNIT_LIMIT + 
               this.upgrades.unitLimit * CONFIG.UPGRADES.unitLimit.effect;
    },

    getMaxHp() {
        return CONFIG.COLONY.MAX_HP + 
               this.upgrades.hp * CONFIG.UPGRADES.hp.effect;
    },

    getDefense() {
        return this.upgrades.defense * CONFIG.UPGRADES.defense.effect;
    },

    getHatchTimeMultiplier() {
        return 1 - this.upgrades.hatchSpeed * CONFIG.UPGRADES.hatchSpeed.effect;
    },

    getGatherBonus() {
        return this.upgrades.gatherEfficiency * CONFIG.UPGRADES.gatherEfficiency.effect;
    },

    getTotalUnits() {
        return this.units.length + this.hatchQueue.length;
    },

    canHatchUnit(unitType) {
        const typeConfig = CONFIG.UNIT_TYPES[unitType];
        if (!typeConfig) return false;
        if (this.currentWave < typeConfig.unlockWave) return false;
        if (this.getTotalUnits() >= this.getUnitLimit()) return false;
        return this.canAfford(typeConfig.cost, typeConfig.costType);
    },

    addToHatchQueue(unitType) {
        if (!this.canHatchUnit(unitType)) return false;
        
        const typeConfig = CONFIG.UNIT_TYPES[unitType];
        this.spendResources(typeConfig.cost, typeConfig.costType);
        this.hatchQueue.push(unitType);
        return true;
    },

    canUpgrade(upgradeKey) {
        const upgrade = CONFIG.UPGRADES[upgradeKey];
        if (!upgrade) return false;
        if (this.upgrades[upgradeKey] >= upgrade.maxLevel) return false;
        const cost = upgrade.cost * (this.upgrades[upgradeKey] + 1);
        return this.canAfford(cost, upgrade.costType);
    },

    doUpgrade(upgradeKey) {
        if (!this.canUpgrade(upgradeKey)) return false;
        
        const upgrade = CONFIG.UPGRADES[upgradeKey];
        const cost = upgrade.cost * (this.upgrades[upgradeKey] + 1);
        this.spendResources(cost, upgrade.costType);
        this.upgrades[upgradeKey]++;
        
        if (upgradeKey === 'hp' && this.colony) {
            this.colony.hp = Math.min(this.colony.hp + upgrade.effect, this.getMaxHp());
            this.colony.maxHp = this.getMaxHp();
        }
        
        return true;
    },

    serialize() {
        return {
            isRunning: this.isRunning,
            isGameOver: this.isGameOver,
            speedMultiplier: this.speedMultiplier,
            resources: { ...this.resources },
            colony: this.colony ? this.colony.serialize() : null,
            units: this.units.map(u => u.serialize()),
            enemies: this.enemies.map(e => e.serialize()),
            resourcePoints: this.resourcePoints.map(r => r.serialize()),
            currentWave: this.currentWave,
            waveInProgress: this.waveInProgress,
            waveTimer: this.waveTimer,
            enemySpawnQueue: [...this.enemySpawnQueue],
            enemySpawnTimer: this.enemySpawnTimer,
            hatchQueue: [...this.hatchQueue],
            currentHatchTime: this.currentHatchTime,
            totalHatchTime: this.totalHatchTime,
            upgrades: { ...this.upgrades }
        };
    },

    deserialize(data) {
        if (!data) return false;
        
        this.isRunning = data.isRunning;
        this.isGameOver = data.isGameOver;
        this.speedMultiplier = data.speedMultiplier;
        this.resources = { ...data.resources };
        this.currentWave = data.currentWave;
        this.waveInProgress = data.waveInProgress;
        this.waveTimer = data.waveTimer;
        this.enemySpawnQueue = [...data.enemySpawnQueue];
        this.enemySpawnTimer = data.enemySpawnTimer;
        this.hatchQueue = [...data.hatchQueue];
        this.currentHatchTime = data.currentHatchTime;
        this.totalHatchTime = data.totalHatchTime;
        this.upgrades = { ...data.upgrades };
        
        if (data.colony) {
            this.colony = Colony.deserialize(data.colony);
        }
        
        this.units = data.units.map(u => Unit.deserialize(u));
        this.enemies = data.enemies.map(e => Enemy.deserialize(e));
        this.resourcePoints = data.resourcePoints.map(r => ResourcePoint.deserialize(r));
        
        return true;
    }
};
