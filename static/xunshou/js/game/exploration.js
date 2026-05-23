const ExplorationSystem = {
    onEncounter: null,
    explorationData: null,

    init() {
        this.explorationData = {
            steps: 0,
            encounters: 0,
            itemsFound: 0,
            currentArea: null,
            isExploring: false
        };
    },

    startExploration(areaId) {
        const area = LevelData.getAreaById(areaId);
        const progressArea = GameState.state.progress.areas[areaId];
        
        if (!progressArea.unlocked) {
            GameState.showNotification('该区域尚未解锁!');
            return false;
        }

        this.explorationData = {
            steps: 0,
            encounters: 0,
            itemsFound: 0,
            currentArea: areaId,
            isExploring: true
        };

        return true;
    },

    takeStep() {
        if (!this.explorationData.isExploring) return null;

        this.explorationData.steps++;
        
        const roll = Math.random();
        
        if (roll < 0.4) {
            return this.encounterMonster();
        } else if (roll < 0.55) {
            return this.findItem();
        } else if (roll < 0.6) {
            return this.findCoins();
        }
        
        return { type: 'nothing', message: '四周一片寂静...' };
    },

    encounterMonster() {
        const area = LevelData.getAreaById(this.explorationData.currentArea);
        const monster = MonsterData.getRandomWildMonster(area.level);
        
        this.explorationData.encounters++;
        
        return {
            type: 'encounter',
            monster: monster,
            message: `野生的 ${monster.name} 出现了!`
        };
    },

    findItem() {
        const items = ['poke_ball', 'potion', 'super_potion'];
        const itemId = items[Math.floor(Math.random() * items.length)];
        const count = Math.floor(Math.random() * 2) + 1;
        
        GameState.addItem(itemId, count);
        this.explorationData.itemsFound++;
        
        const item = LevelData.getItemById(itemId);
        return {
            type: 'item',
            item: item,
            count: count,
            message: `发现了 ${count} 个 ${item.name}!`
        };
    },

    findCoins() {
        const amount = Math.floor(Math.random() * 30) + 10;
        GameState.addCoins(amount);
        
        return {
            type: 'coins',
            amount: amount,
            message: `发现了 ${amount} 金币!`
        };
    },

    selectArea(areaId) {
        const area = LevelData.getAreaById(areaId);
        const progressArea = GameState.state.progress.areas[areaId];
        
        if (!progressArea.unlocked) {
            return { success: false, message: '该区域尚未解锁!' };
        }
        
        GameState.state.progress.currentArea = areaId;
        GameState.save();
        
        return { success: true, area: area };
    },

    getAvailableAreas() {
        return LevelData.areas.map(area => ({
            ...area,
            unlocked: GameState.state.progress.areas[area.id].unlocked,
            completed: GameState.state.progress.areas[area.id].completed,
            currentStage: GameState.state.progress.areas[area.id].currentStage
        }));
    },

    getAreaStages(areaId) {
        const area = LevelData.getAreaById(areaId);
        const progressArea = GameState.state.progress.areas[areaId];
        
        const stages = [];
        for (let i = 0; i < area.stages; i++) {
            stages.push({
                index: i,
                unlocked: i <= progressArea.currentStage,
                completed: i < progressArea.currentStage,
                isBoss: i === area.stages - 1
            });
        }
        
        return stages;
    },

    startStageBattle(areaId, stageIndex) {
        const area = LevelData.getAreaById(areaId);
        
        if (stageIndex >= area.stages - 1) {
            BattleSystem.initBossBattle(areaId);
        } else {
            BattleSystem.initStageBattle(areaId, stageIndex);
        }
        
        GameState.setCurrentScreen('battle');
    }
};
