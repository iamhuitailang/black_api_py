/**
 * 咯咯农场 - 存储管理模块
 * 负责游戏数据的持久化存储和离线时间计算
 */

const StorageManager = (function() {
    function createInitialGameState() {
        return {
            version: 1,
            gold: 50,
            eggs: 0,
            
            chickens: [],
            
            currentCoopId: 'small',
            
            timeSystem: {
                elapsedTime: 0
            },
            
            hasDog: false,
            
            stats: {
                totalGoldEarned: 0,
                totalEggsLaid: 0,
                totalEggsSold: 0,
                totalPlayTimeMs: 0,
                sessionStartTime: Date.now()
            },
            
            unlocked: {
                chickenTypes: ['normal'],
                coopTypes: ['small'],
                items: []
            },
            
            activeEffects: [],
            
            autoCollectEnabled: false,
            
            lastSaveTime: Date.now()
        };
    }
    
    function saveGame(gameState) {
        try {
            gameState.lastSaveTime = Date.now();
            const jsonString = JSON.stringify(gameState);
            localStorage.setItem(CONFIG.STORAGE_KEY, jsonString);
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }
    
    function loadGame() {
        try {
            const jsonString = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!jsonString) {
                return null;
            }
            const gameState = JSON.parse(jsonString);
            return gameState;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    }
    
    function hasSaveGame() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    }
    
    function clearSave() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
    
    function calculateOfflineProgress(gameState) {
        const now = Date.now();
        const lastSaveTime = gameState.lastSaveTime || now;
        const offlineDurationMs = now - lastSaveTime;
        
        if (offlineDurationMs <= 0) {
            return {
                eggsLaid: 0,
                goldEarned: 0,
                chickensUpdated: []
            };
        }
        
        const maxOfflineDuration = hoursToMs(24);
        const effectiveDurationMs = Math.min(offlineDurationMs, maxOfflineDuration);
        
        let eggsLaid = 0;
        const updatedChickens = [];
        
        for (const chicken of gameState.chickens) {
            const result = simulateChickenOffline(chicken, effectiveDurationMs, gameState);
            if (result.eggsLaid > 0) {
                eggsLaid += result.eggsLaid;
                updatedChickens.push(result.chicken);
            } else {
                updatedChickens.push(result.chicken);
            }
        }
        
        const coop = getCoopTypeById(gameState.currentCoopId);
        let goldEarned = 0;
        
        if (gameState.autoCollectEnabled && coop.hasAutoCollect) {
            goldEarned = eggsLaid * CONFIG.EGG_PRICE;
            gameState.gold += goldEarned;
            gameState.stats.totalGoldEarned += goldEarned;
            gameState.stats.totalEggsSold += eggsLaid;
        } else {
            gameState.eggs += eggsLaid;
        }
        
        gameState.stats.totalEggsLaid += eggsLaid;
        gameState.stats.totalPlayTimeMs += effectiveDurationMs;
        gameState.stats.sessionStartTime = now;
        
        gameState.activeEffects = gameState.activeEffects.filter(effect => {
            return effect.endTime > now;
        });
        
        return {
            eggsLaid,
            goldEarned,
            chickensUpdated: updatedChickens.length,
            offlineDuration: effectiveDurationMs
        };
    }
    
    function simulateChickenOffline(chicken, durationMs, gameState) {
        const chickenType = getChickenTypeById(chicken.type);
        let eggsLaid = 0;
        
        let updatedChicken = { ...chicken };
        updatedChicken.ageMs += durationMs;
        
        const status = getChickenStatus(updatedChicken);
        updatedChicken.status = status;
        
        if (status === CHICKEN_STATUS.ADULT || status === CHICKEN_STATUS.SENIOR) {
            let layIntervalMs = secondsToMs(chickenType.layIntervalSeconds);
            
            if (status === CHICKEN_STATUS.SENIOR) {
                layIntervalMs = layIntervalMs / CONFIG.SENIOR_PRODUCTION_RATE;
            }
            
            const productionReduction = getActiveEffectMultiplier(gameState, 'reduce_production');
            if (productionReduction > 0) {
                layIntervalMs = layIntervalMs / (1 - productionReduction);
            }
            
            const cycles = Math.floor(durationMs / layIntervalMs);
            
            for (let i = 0; i < cycles; i++) {
                const doubleYolkChance = Math.random();
                let eggCount = 1;
                
                if (doubleYolkChance < RANDOM_EVENTS.find(e => e.id === 'double_yolk').probability) {
                    eggCount = 2;
                }
                
                eggsLaid += eggCount;
            }
            
            updatedChicken.lastLayTime = Date.now();
        }
        
        return {
            chicken: updatedChicken,
            eggsLaid
        };
    }
    
    function getChickenStatus(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        const growthTimeMs = minutesToMs(chickenType.growthTimeMinutes);
        const seniorAgeMs = hoursToMs(CONFIG.SENIOR_AGE_HOURS);
        
        if (chicken.ageMs < growthTimeMs) {
            return CHICKEN_STATUS.CHICK;
        } else if (chicken.ageMs >= seniorAgeMs) {
            return CHICKEN_STATUS.SENIOR;
        } else {
            return CHICKEN_STATUS.ADULT;
        }
    }
    
    function getActiveEffectMultiplier(gameState, effectType) {
        const now = Date.now();
        for (const effect of gameState.activeEffects) {
            if (effect.type === effectType && effect.endTime > now) {
                return effect.value || 0;
            }
        }
        return 0;
    }
    
    return {
        createInitialGameState,
        saveGame,
        loadGame,
        hasSaveGame,
        clearSave,
        calculateOfflineProgress,
        getChickenStatus
    };
})();
