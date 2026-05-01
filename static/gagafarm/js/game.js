/**
 * 咯咯农场 - 游戏核心模块
 * 整合所有子模块，管理游戏状态和主循环
 */

const Game = (function() {
    let gameState = null;
    let gameLoopInterval = null;
    let lastUpdateTime = Date.now();
    let gameListeners = [];
    
    const GAME_EVENTS = {
        STATE_CHANGED: 'state_changed',
        EGG_LAID: 'egg_laid',
        EGG_COLLECTED: 'egg_collected',
        EGG_SOLD: 'egg_sold',
        CHICKEN_BOUGHT: 'chicken_bought',
        COOP_UPGRADED: 'coop_upgraded',
        RANDOM_EVENT: 'random_event',
        CHICKEN_SLAUGHTERED: 'chicken_slaughtered',
        DOG_BOUGHT: 'dog_bought',
        TIME_PERIOD_CHANGED: 'time_period_changed'
    };
    
    let lastTimePeriod = null;
    
    function init() {
        if (StorageManager.hasSaveGame()) {
            gameState = StorageManager.loadGame();
            const offlineResult = StorageManager.calculateOfflineProgress(gameState);
            console.log('离线进度计算:', offlineResult);
        } else {
            gameState = StorageManager.createInitialGameState();
        }
        
        EventSystem.addEventListener(handleRandomEvent);
        
        return gameState;
    }
    
    function startGameLoop() {
        lastUpdateTime = Date.now();
        gameLoopInterval = setInterval(gameLoop, CONFIG.GAME_TICK);
    }
    
    function stopGameLoop() {
        if (gameLoopInterval) {
            clearInterval(gameLoopInterval);
            gameLoopInterval = null;
        }
    }
    
    function gameLoop() {
        const now = Date.now();
        const deltaTimeMs = now - lastUpdateTime;
        lastUpdateTime = now;
        
        update(deltaTimeMs);
        
        notifyListeners(GAME_EVENTS.STATE_CHANGED, gameState);
        
        if (Math.random() < 0.1) {
            StorageManager.saveGame(gameState);
        }
    }
    
    function update(deltaTimeMs) {
        gameState.stats.totalPlayTimeMs += deltaTimeMs;
        
        if (!gameState.timeSystem) {
            gameState.timeSystem = { elapsedTime: 0 };
        }
        gameState.timeSystem.elapsedTime += deltaTimeMs;
        
        const currentPeriod = EventSystem.getCurrentTimePeriod(gameState);
        if (lastTimePeriod !== null && lastTimePeriod !== currentPeriod) {
            notifyListeners(GAME_EVENTS.TIME_PERIOD_CHANGED, { 
                oldPeriod: lastTimePeriod, 
                newPeriod: currentPeriod 
            });
        }
        lastTimePeriod = currentPeriod;
        
        if (gameState.unlocked.items === undefined) {
            gameState.unlocked.items = [];
        }
        
        EventSystem.clearExpiredEvents(gameState);
        
        updateChickens(deltaTimeMs);
        
        checkUnlocks();
        
        const randomEvent = EventSystem.checkAndTriggerRandomEvent(gameState);
        if (randomEvent) {
            notifyListeners(GAME_EVENTS.RANDOM_EVENT, randomEvent);
        }
    }
    
    function updateChickens(deltaTimeMs) {
        const coop = getCoopTypeById(gameState.currentCoopId);
        let eggsToCollect = 0;
        let goldFromAutoCollect = 0;
        
        const updatedChickens = [];
        
        for (const chicken of gameState.chickens) {
            const result = ChickenManager.updateChicken(chicken, deltaTimeMs, gameState);
            
            if (result.laidEgg) {
                const chickenType = getChickenTypeById(chicken.type);
                const eggValue = chickenType.eggValue;
                
                gameState.stats.totalEggsLaid += result.eggCount;
                
                if (gameState.autoCollectEnabled && coop.hasAutoCollect) {
                    let actualValue = eggValue * CONFIG.EGG_PRICE * result.eggCount;
                    
                    const priceEffect = gameState.activeEffects.find(
                        e => e.type === 'increase_egg_price' && e.endTime > Date.now()
                    );
                    if (priceEffect) {
                        actualValue *= (priceEffect.value || 1.5);
                    }
                    
                    actualValue = Math.floor(actualValue);
                    goldFromAutoCollect += actualValue;
                    gameState.gold += actualValue;
                    gameState.stats.totalGoldEarned += actualValue;
                    gameState.stats.totalEggsSold += result.eggCount;
                    
                    notifyListeners(GAME_EVENTS.EGG_SOLD, { count: result.eggCount, gold: actualValue, auto: true });
                } else {
                    eggsToCollect += result.eggCount;
                    notifyListeners(GAME_EVENTS.EGG_LAID, { count: result.eggCount, chicken: chicken });
                }
            }
            
            updatedChickens.push(result.chicken);
        }
        
        gameState.chickens = updatedChickens;
        
        if (eggsToCollect > 0) {
            gameState.eggs += eggsToCollect;
        }
    }
    
    function collectEggs() {
        const collected = gameState.eggs;
        if (collected > 0) {
            notifyListeners(GAME_EVENTS.EGG_COLLECTED, { count: collected });
            return { success: true, count: collected };
        }
        return { success: false, count: 0 };
    }
    
    function sellEggs() {
        const eggsToSell = gameState.eggs;
        if (eggsToSell <= 0) {
            return { success: false, gold: 0, eggs: 0 };
        }
        
        let goldPerEgg = CONFIG.EGG_PRICE;
        
        const priceEffect = gameState.activeEffects.find(
            e => e.type === 'increase_egg_price' && e.endTime > Date.now()
        );
        if (priceEffect) {
            goldPerEgg *= (priceEffect.value || 1.5);
        }
        
        const totalGold = Math.floor(eggsToSell * goldPerEgg);
        
        gameState.eggs = 0;
        gameState.gold += totalGold;
        gameState.stats.totalEggsSold += eggsToSell;
        gameState.stats.totalGoldEarned += totalGold;
        
        notifyListeners(GAME_EVENTS.EGG_SOLD, { count: eggsToSell, gold: totalGold, auto: false });
        
        return { success: true, gold: totalGold, eggs: eggsToSell };
    }
    
    function buyChicken(chickenTypeId) {
        const chickenType = getChickenTypeById(chickenTypeId);
        const coop = getCoopTypeById(gameState.currentCoopId);
        
        if (!isChickenTypeUnlocked(chickenTypeId)) {
            return { success: false, reason: '该鸡种尚未解锁' };
        }
        
        if (gameState.chickens.length >= coop.capacity) {
            return { success: false, reason: '鸡舍已满，请先升级鸡舍' };
        }
        
        if (gameState.gold < chickenType.price) {
            return { success: false, reason: '金币不足' };
        }
        
        gameState.gold -= chickenType.price;
        const chicken = ChickenManager.createChicken(chickenTypeId);
        gameState.chickens.push(chicken);
        
        notifyListeners(GAME_EVENTS.CHICKEN_BOUGHT, { chicken: chicken, type: chickenType });
        
        return { success: true, chicken: chicken };
    }
    
    function upgradeCoop(coopTypeId) {
        const currentCoop = getCoopTypeById(gameState.currentCoopId);
        const targetCoop = COOP_TYPES.find(type => type.id === coopTypeId);
        
        if (!targetCoop) {
            return { success: false, reason: '无效的鸡舍类型' };
        }
        
        const currentIndex = COOP_TYPES.findIndex(type => type.id === gameState.currentCoopId);
        const targetIndex = COOP_TYPES.findIndex(type => type.id === coopTypeId);
        
        if (targetIndex <= currentIndex) {
            return { success: false, reason: '不能降级鸡舍' };
        }
        
        if (targetIndex !== currentIndex + 1) {
            return { success: false, reason: '请按顺序升级鸡舍' };
        }
        
        if (!isCoopTypeUnlocked(coopTypeId)) {
            return { success: false, reason: '该鸡舍尚未解锁' };
        }
        
        if (gameState.gold < targetCoop.price) {
            return { success: false, reason: '金币不足' };
        }
        
        gameState.gold -= targetCoop.price;
        gameState.currentCoopId = coopTypeId;
        
        if (targetCoop.hasAutoCollect) {
            gameState.autoCollectEnabled = true;
        }
        
        notifyListeners(GAME_EVENTS.COOP_UPGRADED, { oldCoop: currentCoop, newCoop: targetCoop });
        
        return { success: true, oldCoop: currentCoop, newCoop: targetCoop };
    }
    
    function slaughterSeniorChickens() {
        const seniorChickens = gameState.chickens.filter(c => c.status === CHICKEN_STATUS.SENIOR);
        
        if (seniorChickens.length === 0) {
            return { success: false, count: 0, gold: 0 };
        }
        
        let totalGold = 0;
        const slaughteredIds = [];
        
        for (const chicken of seniorChickens) {
            const result = ChickenManager.slaughterChicken(chicken);
            totalGold += result.goldValue;
            slaughteredIds.push(chicken.id);
        }
        
        gameState.gold += totalGold;
        gameState.stats.totalGoldEarned += totalGold;
        gameState.chickens = gameState.chickens.filter(c => !slaughteredIds.includes(c.id));
        
        notifyListeners(GAME_EVENTS.CHICKEN_SLAUGHTERED, { count: seniorChickens.length, gold: totalGold });
        
        return { success: true, count: seniorChickens.length, gold: totalGold };
    }
    
    function toggleAutoCollect() {
        const coop = getCoopTypeById(gameState.currentCoopId);
        
        if (!coop.hasAutoCollect) {
            return { success: false, reason: '当前鸡舍不支持自动收集' };
        }
        
        gameState.autoCollectEnabled = !gameState.autoCollectEnabled;
        return { success: true, enabled: gameState.autoCollectEnabled };
    }
    
    function buyDog() {
        if (gameState.hasDog) {
            return { success: false, reason: '你已经有一只看门狗了' };
        }
        
        if (!isDogUnlocked()) {
            return { success: false, reason: '看门狗尚未解锁' };
        }
        
        if (gameState.gold < DOG_CONFIG.price) {
            return { success: false, reason: '金币不足' };
        }
        
        gameState.gold -= DOG_CONFIG.price;
        gameState.hasDog = true;
        
        notifyListeners(GAME_EVENTS.DOG_BOUGHT, { dog: DOG_CONFIG });
        
        return { success: true, dog: DOG_CONFIG };
    }
    
    function isDogUnlocked() {
        if (gameState.hasDog) {
            return true;
        }
        
        const condition = DOG_CONFIG.unlockCondition;
        return checkUnlockCondition(condition, gameState);
    }
    
    function getCurrentTimePeriod() {
        return EventSystem.getCurrentTimePeriod(gameState);
    }
    
    function checkUnlocks() {
        for (const chickenType of CHICKEN_TYPES) {
            if (isChickenTypeUnlocked(chickenType.id)) {
                continue;
            }
            
            if (checkUnlockCondition(chickenType.unlockCondition, gameState)) {
                if (!gameState.unlocked.chickenTypes.includes(chickenType.id)) {
                    gameState.unlocked.chickenTypes.push(chickenType.id);
                }
            }
        }
        
        for (const coopType of COOP_TYPES) {
            if (isCoopTypeUnlocked(coopType.id)) {
                continue;
            }
            
            if (checkUnlockCondition(coopType.unlockCondition, gameState)) {
                if (!gameState.unlocked.coopTypes.includes(coopType.id)) {
                    gameState.unlocked.coopTypes.push(coopType.id);
                }
            }
        }
    }
    
    function checkUnlockCondition(condition, state) {
        switch (condition.type) {
            case 'initial':
                return true;
            case 'sold_eggs':
                return state.stats.totalEggsSold >= condition.value;
            case 'gold':
                return state.gold >= condition.value || state.stats.totalGoldEarned >= condition.value;
            default:
                return false;
        }
    }
    
    function isChickenTypeUnlocked(typeId) {
        return gameState.unlocked.chickenTypes.includes(typeId);
    }
    
    function isCoopTypeUnlocked(typeId) {
        return gameState.unlocked.coopTypes.includes(typeId);
    }
    
    function handleRandomEvent(eventResult) {
        notifyListeners(GAME_EVENTS.RANDOM_EVENT, eventResult);
    }
    
    function addGameListener(callback) {
        gameListeners.push(callback);
    }
    
    function removeGameListener(callback) {
        gameListeners = gameListeners.filter(listener => listener !== callback);
    }
    
    function notifyListeners(eventType, data) {
        for (const listener of gameListeners) {
            try {
                listener(eventType, data, gameState);
            } catch (e) {
                console.error('游戏监听器错误:', e);
            }
        }
    }
    
    function getGameState() {
        return gameState;
    }
    
    function saveGame() {
        return StorageManager.saveGame(gameState);
    }
    
    function resetGame() {
        stopGameLoop();
        StorageManager.clearSave();
        gameState = StorageManager.createInitialGameState();
        return gameState;
    }
    
    function getStats() {
        return {
            ...gameState.stats,
            eggsPerHour: ChickenManager.countEggsPerHour(gameState.chickens, gameState),
            goldPerHour: ChickenManager.countGoldPerHour(gameState.chickens, gameState),
            chickenCount: gameState.chickens.length,
            currentCoop: getCoopTypeById(gameState.currentCoopId)
        };
    }
    
    return {
        init,
        startGameLoop,
        stopGameLoop,
        getGameState,
        saveGame,
        resetGame,
        getStats,
        
        collectEggs,
        sellEggs,
        buyChicken,
        upgradeCoop,
        slaughterSeniorChickens,
        toggleAutoCollect,
        buyDog,
        isDogUnlocked,
        getCurrentTimePeriod,
        
        isChickenTypeUnlocked,
        isCoopTypeUnlocked,
        
        addGameListener,
        removeGameListener,
        
        GAME_EVENTS
    };
})();
