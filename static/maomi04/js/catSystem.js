/**
 * 猫咪系统模块
 * 负责管理猫咪的来访、行为、离开等逻辑
 */

const CatSystem = {
    /**
     * 当前在场的猫咪实例
     * 每个实例包含: catId, instanceId, startTime, stayDuration, behavior, position, animationState
     */
    currentCats: [],

    /**
     * 初始化猫咪系统
     * @param {Object} gameState - 游戏状态
     */
    init(gameState) {
        console.log('猫咪系统初始化...');
        
        // 从游戏状态恢复当前猫咪
        if (gameState.currentCats && gameState.currentCats.length > 0) {
            this.currentCats = gameState.currentCats;
            console.log(`恢复了 ${this.currentCats.length} 只在场猫咪`);
        }
        
        // 处理离线时间，检查是否有猫咪应该离开
        this.processOfflineCats(gameState);
    },

    /**
     * 处理离线期间的猫咪状态
     * @param {Object} gameState - 游戏状态
     */
    processOfflineCats(gameState) {
        const offlineSeconds = Storage.getOfflineTime();
        
        if (offlineSeconds <= 0) {
            return;
        }

        console.log(`检测到离线时间: ${Utils.formatTime(offlineSeconds)}`);

        const now = Utils.nowSeconds();
        const catsToRemove = [];
        let totalReward = 0;

        // 检查哪些猫咪应该已经离开
        this.currentCats.forEach((catInstance, index) => {
            const endTime = catInstance.startTime + catInstance.stayDuration;
            const remainingTime = endTime - now;

            if (remainingTime <= 0) {
                // 猫咪应该已经离开
                const cat = GameData.getCatById(catInstance.catId);
                if (cat) {
                    const reward = GameData.calculateActualReward(
                        cat,
                        gameState.placedItems,
                        catInstance.behavior
                    );
                    totalReward += reward;
                    
                    // 更新猫咪访问次数
                    this.updateCatVisitCount(gameState, catInstance.catId);
                    
                    // 收集猫咪（如果是第一次）
                    this.collectCat(gameState, catInstance.catId);
                }
                
                catsToRemove.push(index);
                console.log(`离线期间猫咪 ${catInstance.catId} 已离开`);
            } else {
                // 猫咪还在，更新剩余时间
                catInstance.remainingTime = remainingTime;
            }
        });

        // 移除已离开的猫咪
        for (let i = catsToRemove.length - 1; i >= 0; i--) {
            this.currentCats.splice(catsToRemove[i], 1);
        }

        // 发放离线期间的鱼干奖励
        if (totalReward > 0) {
            gameState.fishCount += totalReward;
            console.log(`离线期间获得 ${totalReward} 小鱼干`);
            UI.showNotification(`离线期间获得 ${totalReward} 小鱼干！`, 'success');
        }

        // 尝试在离线期间生成新猫咪
        this.tryGenerateOfflineCats(gameState, offlineSeconds);
    },

    /**
     * 尝试在离线期间生成新猫咪
     * @param {Object} gameState - 游戏状态
     * @param {number} offlineSeconds - 离线秒数
     */
    tryGenerateOfflineCats(gameState, offlineSeconds) {
        // 简单估算离线期间可能来访的猫咪数量
        const visitTime = GameData.calculateNextVisitTime(gameState.placedItems);
        const potentialVisits = Math.floor(offlineSeconds / visitTime);
        
        if (potentialVisits <= 0) {
            return;
        }

        // 实际生成数量随机，最多2只
        const actualVisits = Math.min(potentialVisits, Utils.randomInt(0, 2));
        
        for (let i = 0; i < actualVisits; i++) {
            if (this.currentCats.length >= GameData.GAME_CONFIG.MAX_CATS_ON_YARD) {
                break;
            }

            const catInstance = this.generateRandomCat(gameState.placedItems);
            if (catInstance) {
                // 计算这个猫咪在离线期间的停留时间
                const cat = GameData.getCatById(catInstance.catId);
                const stayDuration = GameData.calculateActualStayTime(cat, gameState.placedItems);
                
                // 假设猫咪在离线期间已经来了又走了
                if (offlineSeconds > stayDuration) {
                    // 猫咪已经离开，给奖励
                    const reward = GameData.calculateActualReward(cat, gameState.placedItems, 'idle');
                    gameState.fishCount += reward;
                    this.updateCatVisitCount(gameState, catInstance.catId);
                    this.collectCat(gameState, catInstance.catId);
                    console.log(`离线期间猫咪 ${cat.name} 来访并离开，获得 ${reward} 小鱼干`);
                } else {
                    // 猫咪还在场
                    catInstance.startTime = Utils.nowSeconds() - offlineSeconds;
                    catInstance.stayDuration = stayDuration;
                    this.currentCats.push(catInstance);
                    console.log(`离线期间猫咪 ${cat.name} 来访，现在还在场`);
                }
            }
        }
    },

    /**
     * 生成随机猫咪
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {Object|null} 猫咪实例或null
     */
    generateRandomCat(placedItemIds) {
        // 获取可吸引的猫咪列表
        const attractableCats = GameData.getAttractableCats(placedItemIds);
        
        if (attractableCats.length === 0) {
            return null;
        }

        // 计算权重进行随机选择
        const weightedCats = [];
        attractableCats.forEach(cat => {
            const weight = GameData.getCatSpawnWeight(cat, placedItemIds);
            for (let i = 0; i < weight; i++) {
                weightedCats.push(cat);
            }
        });

        if (weightedCats.length === 0) {
            return Utils.randomChoice(attractableCats);
        }

        const selectedCat = Utils.randomChoice(weightedCats);
        
        // 创建猫咪实例
        return this.createCatInstance(selectedCat, placedItemIds);
    },

    /**
     * 创建猫咪实例
     * @param {Object} cat - 猫咪数据
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {Object} 猫咪实例
     */
    createCatInstance(cat, placedItemIds) {
        const stayDuration = GameData.calculateActualStayTime(cat, placedItemIds);
        
        // 确定初始行为
        const behavior = this.determineBehavior(cat, placedItemIds);
        
        // 确定初始位置（基于偏好道具或随机）
        const position = this.determinePosition(cat, placedItemIds, behavior);
        
        return {
            catId: cat.id,
            instanceId: Utils.generateId(),
            startTime: Utils.nowSeconds(),
            stayDuration: stayDuration,
            remainingTime: stayDuration,
            behavior: behavior,
            position: position,
            animationState: {
                frame: 0,
                direction: 1,
                speed: 0.5
            }
        };
    },

    /**
     * 确定猫咪的初始行为
     * @param {Object} cat - 猫咪数据
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {string} 行为类型
     */
    determineBehavior(cat, placedItemIds) {
        // 如果有偏好道具，优先选择对应的行为
        if (cat.preferredItem && placedItemIds.includes(cat.preferredItem)) {
            return cat.preferredBehavior || 'idle';
        }

        // 根据已放置的道具类型随机选择行为
        const hasFood = placedItemIds.some(id => {
            const item = GameData.getItemById(id);
            return item && item.category === 'food';
        });

        const hasToy = placedItemIds.some(id => {
            const item = GameData.getItemById(id);
            return item && (item.category === 'toy' || item.category === 'special');
        });

        const hasFurniture = placedItemIds.some(id => {
            const item = GameData.getItemById(id);
            return item && item.category === 'furniture';
        });

        const possibleBehaviors = ['idle'];
        if (hasFood) possibleBehaviors.push('eating');
        if (hasToy) possibleBehaviors.push('playing');
        if (hasFurniture) possibleBehaviors.push('sleeping');

        return Utils.randomChoice(possibleBehaviors);
    },

    /**
     * 确定猫咪的初始位置
     * @param {Object} cat - 猫咪数据
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @param {string} behavior - 行为类型
     * @returns {Object} 位置对象 {x, y}
     */
    determinePosition(cat, placedItemIds, behavior) {
        // 默认画布尺寸
        const canvasWidth = 800;
        const canvasHeight = 500;

        // 根据行为和偏好道具确定位置
        if (cat.preferredItem && placedItemIds.includes(cat.preferredItem)) {
            const item = GameData.getItemById(cat.preferredItem);
            if (item && item.canvasPosition) {
                return {
                    x: item.canvasPosition.x + Utils.random(-20, 20),
                    y: item.canvasPosition.y + Utils.random(-10, 10)
                };
            }
        }

        // 根据行为找对应类型的道具
        let targetCategory = null;
        switch (behavior) {
            case 'eating':
                targetCategory = 'food';
                break;
            case 'playing':
                targetCategory = 'toy';
                break;
            case 'sleeping':
                targetCategory = 'furniture';
                break;
        }

        if (targetCategory) {
            const matchingItems = placedItemIds
                .map(id => GameData.getItemById(id))
                .filter(item => item && item.category === targetCategory);
            
            if (matchingItems.length > 0) {
                const targetItem = Utils.randomChoice(matchingItems);
                if (targetItem.canvasPosition) {
                    return {
                        x: targetItem.canvasPosition.x + Utils.random(-20, 20),
                        y: targetItem.canvasPosition.y + Utils.random(-10, 10)
                    };
                }
            }
        }

        // 默认随机位置
        return {
            x: Utils.random(100, canvasWidth - 100),
            y: Utils.random(150, canvasHeight - 80)
        };
    },

    /**
     * 尝试生成新猫咪
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否成功生成
     */
    trySpawnCat(gameState) {
        // 检查是否达到最大猫咪数量
        if (this.currentCats.length >= GameData.GAME_CONFIG.MAX_CATS_ON_YARD) {
            return false;
        }

        // 检查是否有放置道具
        if (gameState.placedItems.length === 0) {
            return false;
        }

        const catInstance = this.generateRandomCat(gameState.placedItems);
        if (!catInstance) {
            return false;
        }

        this.currentCats.push(catInstance);
        
        const cat = GameData.getCatById(catInstance.catId);
        console.log(`新猫咪来访: ${cat.name}`);
        UI.showNotification(`${cat.name} 来到了后院！`, 'info');

        return true;
    },

    /**
     * 更新猫咪状态
     * @param {Object} gameState - 游戏状态
     * @param {number} deltaTime - 过去的时间（秒）
     */
    update(gameState, deltaTime = 1) {
        const now = Utils.nowSeconds();
        const catsToRemove = [];

        this.currentCats.forEach((catInstance, index) => {
            // 更新剩余时间
            const elapsed = now - catInstance.startTime;
            catInstance.remainingTime = Math.max(0, catInstance.stayDuration - elapsed);

            // 更新动画状态
            this.updateCatAnimation(catInstance, deltaTime);

            // 随机改变行为
            if (Utils.chance(0.01)) { // 每秒1%的概率
                catInstance.behavior = this.determineBehavior(
                    GameData.getCatById(catInstance.catId),
                    gameState.placedItems
                );
            }

            // 检查是否应该离开
            if (catInstance.remainingTime <= 0) {
                // 标记为离开状态（给一些动画时间）
                if (catInstance.behavior !== 'leaving') {
                    catInstance.behavior = 'leaving';
                    catInstance.leavingStartTime = now;
                }

                // 离开动画持续3秒后真正移除
                if (now - (catInstance.leavingStartTime || 0) > 3) {
                    const cat = GameData.getCatById(catInstance.catId);
                    if (cat) {
                        const reward = GameData.calculateActualReward(
                            cat,
                            gameState.placedItems,
                            catInstance.behavior
                        );
                        
                        // 发放奖励
                        gameState.fishCount += reward;
                        
                        // 更新访问次数
                        this.updateCatVisitCount(gameState, catInstance.catId);
                        
                        // 收集猫咪
                        const isNew = this.collectCat(gameState, catInstance.catId);
                        
                        if (isNew) {
                            UI.showNotification(`首次收集 ${cat.name}！获得 ${reward} 小鱼干`, 'success');
                        } else {
                            UI.showNotification(`${cat.name} 离开了，留下了 ${reward} 小鱼干`, 'info');
                        }
                        
                        console.log(`猫咪 ${cat.name} 离开，获得 ${reward} 小鱼干`);
                    }
                    
                    catsToRemove.push(index);
                }
            }
        });

        // 移除已离开的猫咪
        for (let i = catsToRemove.length - 1; i >= 0; i--) {
            this.currentCats.splice(catsToRemove[i], 1);
        }
    },

    /**
     * 更新猫咪动画状态
     * @param {Object} catInstance - 猫咪实例
     * @param {number} deltaTime - 时间增量
     */
    updateCatAnimation(catInstance, deltaTime) {
        if (!catInstance.animationState) {
            catInstance.animationState = {
                frame: 0,
                direction: 1,
                speed: 0.5
            };
        }

        const state = catInstance.animationState;
        
        // 根据行为调整动画速度
        switch (catInstance.behavior) {
            case 'eating':
                state.speed = 0.8;
                break;
            case 'playing':
                state.speed = 1.2;
                break;
            case 'sleeping':
                state.speed = 0.2;
                break;
            case 'leaving':
                state.speed = 1.5;
                break;
            default:
                state.speed = 0.5;
        }

        // 更新帧
        state.frame += state.speed * deltaTime;
        
        // 循环帧
        if (state.frame >= 10) {
            state.frame = 0;
        }
    },

    /**
     * 更新猫咪访问次数
     * @param {Object} gameState - 游戏状态
     * @param {string} catId - 猫咪ID
     */
    updateCatVisitCount(gameState, catId) {
        if (!gameState.catVisitCounts) {
            gameState.catVisitCounts = {};
        }
        
        if (!gameState.catVisitCounts[catId]) {
            gameState.catVisitCounts[catId] = 0;
        }
        
        gameState.catVisitCounts[catId]++;
    },

    /**
     * 收集猫咪
     * @param {Object} gameState - 游戏状态
     * @param {string} catId - 猫咪ID
     * @returns {boolean} 是否是首次收集
     */
    collectCat(gameState, catId) {
        if (!gameState.collectedCats) {
            gameState.collectedCats = [];
        }
        
        if (!gameState.collectedCats.includes(catId)) {
            gameState.collectedCats.push(catId);
            return true; // 首次收集
        }
        
        return false;
    },

    /**
     * 获取当前在场的猫咪
     * @returns {Array} 猫咪实例数组
     */
    getCurrentCats() {
        return this.currentCats;
    },

    /**
     * 获取猫咪实例详情（含完整数据）
     * @param {Object} catInstance - 猫咪实例
     * @returns {Object} 包含完整数据的对象
     */
    getCatInstanceData(catInstance) {
        const cat = GameData.getCatById(catInstance.catId);
        return {
            ...catInstance,
            cat: cat,
            formattedRemainingTime: Utils.formatTime(catInstance.remainingTime)
        };
    },

    /**
     * 获取所有在场猫咪的完整数据
     * @returns {Array} 猫咪数据数组
     */
    getCurrentCatsWithData() {
        return this.currentCats.map(instance => this.getCatInstanceData(instance));
    },

    /**
     * 重置猫咪系统
     */
    reset() {
        this.currentCats = [];
    },

    /**
     * 保存状态到游戏数据
     * @param {Object} gameState - 游戏状态
     */
    saveToGameState(gameState) {
        gameState.currentCats = Utils.deepClone(this.currentCats);
    }
};

// 导出到全局
window.CatSystem = CatSystem;
