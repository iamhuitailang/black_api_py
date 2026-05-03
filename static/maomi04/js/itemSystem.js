/**
 * 道具系统模块
 * 负责管理道具的购买、放置、回收等功能
 */

const ItemSystem = {
    /**
     * 初始化道具系统
     * @param {Object} gameState - 游戏状态
     */
    init(gameState) {
        console.log('道具系统初始化...');
        
        // 确保游戏状态中的道具相关字段存在
        if (!gameState.ownedItems) {
            gameState.ownedItems = ['food_bowl', 'yarn_ball'];
        }
        
        if (!gameState.placedItems) {
            gameState.placedItems = [];
        }

        console.log(`拥有道具: ${gameState.ownedItems.length} 个`);
        console.log(`已放置道具: ${gameState.placedItems.length} 个`);
    },

    /**
     * 购买道具
     * @param {Object} gameState - 游戏状态
     * @param {string} itemId - 道具ID
     * @returns {Object} 购买结果 {success: boolean, message: string}
     */
    purchaseItem(gameState, itemId) {
        const item = GameData.getItemById(itemId);
        
        if (!item) {
            return { success: false, message: '道具不存在' };
        }

        // 检查是否已拥有
        if (gameState.ownedItems.includes(itemId)) {
            return { success: false, message: '你已经拥有这个道具了' };
        }

        // 检查是否已解锁
        const collectedCount = gameState.collectedCats ? gameState.collectedCats.length : 0;
        if (!GameData.isItemUnlocked(item, collectedCount)) {
            const req = item.unlockRequirement;
            return { 
                success: false, 
                message: `需要收集 ${req.count} 种猫咪才能解锁此道具` 
            };
        }

        // 检查鱼干是否足够
        if (gameState.fishCount < item.price) {
            return { 
                success: false, 
                message: `鱼干不足，需要 ${item.price} 鱼干` 
            };
        }

        // 执行购买
        gameState.fishCount -= item.price;
        gameState.ownedItems.push(itemId);

        console.log(`购买道具成功: ${item.name}，花费 ${item.price} 鱼干`);
        
        return { 
            success: true, 
            message: `成功购买 ${item.name}！` 
        };
    },

    /**
     * 放置道具
     * @param {Object} gameState - 游戏状态
     * @param {string} itemId - 道具ID
     * @returns {Object} 放置结果 {success: boolean, message: string}
     */
    placeItem(gameState, itemId) {
        const item = GameData.getItemById(itemId);
        
        if (!item) {
            return { success: false, message: '道具不存在' };
        }

        // 检查是否拥有
        if (!gameState.ownedItems.includes(itemId)) {
            return { success: false, message: '你还没有这个道具' };
        }

        // 检查是否已放置
        if (gameState.placedItems.includes(itemId)) {
            return { success: false, message: '这个道具已经放在庭院中了' };
        }

        // 执行放置
        gameState.placedItems.push(itemId);

        console.log(`放置道具成功: ${item.name}`);
        
        return { 
            success: true, 
            message: `已将 ${item.name} 放入庭院` 
        };
    },

    /**
     * 收回道具
     * @param {Object} gameState - 游戏状态
     * @param {string} itemId - 道具ID
     * @returns {Object} 收回结果 {success: boolean, message: string}
     */
    retrieveItem(gameState, itemId) {
        const item = GameData.getItemById(itemId);
        
        if (!item) {
            return { success: false, message: '道具不存在' };
        }

        // 检查是否已放置
        const index = gameState.placedItems.indexOf(itemId);
        if (index === -1) {
            return { success: false, message: '这个道具不在庭院中' };
        }

        // 执行收回
        gameState.placedItems.splice(index, 1);

        console.log(`收回道具成功: ${item.name}`);
        
        return { 
            success: true, 
            message: `已将 ${item.name} 收回` 
        };
    },

    /**
     * 获取拥有的道具列表（含完整数据）
     * @param {Object} gameState - 游戏状态
     * @returns {Array} 道具数据数组
     */
    getOwnedItems(gameState) {
        if (!gameState.ownedItems) {
            return [];
        }
        
        return gameState.ownedItems
            .map(id => GameData.getItemById(id))
            .filter(item => item !== null);
    },

    /**
     * 获取已放置的道具列表（含完整数据）
     * @param {Object} gameState - 游戏状态
     * @returns {Array} 道具数据数组
     */
    getPlacedItems(gameState) {
        if (!gameState.placedItems) {
            return [];
        }
        
        return gameState.placedItems
            .map(id => GameData.getItemById(id))
            .filter(item => item !== null);
    },

    /**
     * 获取可放置的道具（拥有但未放置的）
     * @param {Object} gameState - 游戏状态
     * @returns {Array} 道具数据数组
     */
    getPlaceableItems(gameState) {
        if (!gameState.ownedItems || !gameState.placedItems) {
            return [];
        }
        
        const placeableIds = gameState.ownedItems.filter(
            id => !gameState.placedItems.includes(id)
        );
        
        return placeableIds
            .map(id => GameData.getItemById(id))
            .filter(item => item !== null);
    },

    /**
     * 获取商店商品列表
     * @param {Object} gameState - 游戏状态
     * @returns {Array} 商店商品数组
     */
    getShopItems(gameState) {
        const collectedCount = gameState.collectedCats ? gameState.collectedCats.length : 0;
        
        return GameData.ITEMS.map(item => {
            const isOwned = gameState.ownedItems.includes(item.id);
            const isUnlocked = GameData.isItemUnlocked(item, collectedCount);
            const canAfford = gameState.fishCount >= item.price;
            
            return {
                ...item,
                isOwned: isOwned,
                isUnlocked: isUnlocked,
                canAfford: canAfford,
                canBuy: !isOwned && isUnlocked && canAfford,
                unlockInfo: this.getUnlockInfo(item, collectedCount)
            };
        });
    },

    /**
     * 获取道具解锁信息
     * @param {Object} item - 道具对象
     * @param {number} collectedCount - 已收集猫咪数量
     * @returns {Object} 解锁信息
     */
    getUnlockInfo(item, collectedCount) {
        if (!item.unlockRequirement) {
            return { isUnlocked: true, text: '已解锁' };
        }
        
        const req = item.unlockRequirement;
        
        switch (req.type) {
            case 'none':
                return { isUnlocked: true, text: '已解锁' };
            case 'cats_collected':
                const isUnlocked = collectedCount >= req.count;
                return {
                    isUnlocked: isUnlocked,
                    text: isUnlocked 
                        ? '已解锁' 
                        : `需要收集 ${req.count} 种猫咪 (${collectedCount}/${req.count})`
                };
            default:
                return { isUnlocked: true, text: '已解锁' };
        }
    },

    /**
     * 检查道具是否可以被购买
     * @param {Object} gameState - 游戏状态
     * @param {string} itemId - 道具ID
     * @returns {Object} 结果 {canBuy: boolean, reason: string}
     */
    canPurchaseItem(gameState, itemId) {
        const item = GameData.getItemById(itemId);
        
        if (!item) {
            return { canBuy: false, reason: '道具不存在' };
        }

        if (gameState.ownedItems.includes(itemId)) {
            return { canBuy: false, reason: '已拥有' };
        }

        const collectedCount = gameState.collectedCats ? gameState.collectedCats.length : 0;
        if (!GameData.isItemUnlocked(item, collectedCount)) {
            return { canBuy: false, reason: '未解锁' };
        }

        if (gameState.fishCount < item.price) {
            return { canBuy: false, reason: '鱼干不足' };
        }

        return { canBuy: true, reason: '' };
    },

    /**
     * 计算已放置道具提供的效果加成
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 效果加成对象
     */
    calculateItemEffects(gameState) {
        const effects = {
            attractionBoost: 1.0,
            stayBonus: 0,
            rewardBonus: 0,
            rareChanceBoost: 1.0,
            sleepBonus: 0
        };

        gameState.placedItems.forEach(itemId => {
            const item = GameData.getItemById(itemId);
            if (item && item.effects) {
                const eff = item.effects;
                
                if (eff.attractionBoost) {
                    effects.attractionBoost *= eff.attractionBoost;
                }
                if (eff.stayBonus) {
                    effects.stayBonus += eff.stayBonus;
                }
                if (eff.rewardBonus) {
                    effects.rewardBonus += eff.rewardBonus;
                }
                if (eff.rareChanceBoost) {
                    effects.rareChanceBoost *= eff.rareChanceBoost;
                }
                if (eff.sleepBonus) {
                    effects.sleepBonus += eff.sleepBonus;
                }
            }
        });

        return effects;
    },

    /**
     * 获取已放置道具的类型统计
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 类型统计
     */
    getPlacedItemTypes(gameState) {
        const types = {
            food: 0,
            toy: 0,
            furniture: 0,
            special: 0
        };

        gameState.placedItems.forEach(itemId => {
            const item = GameData.getItemById(itemId);
            if (item && types.hasOwnProperty(item.category)) {
                types[item.category]++;
            }
        });

        return types;
    },

    /**
     * 检查是否有食物类道具
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否有食物
     */
    hasFoodItem(gameState) {
        return gameState.placedItems.some(itemId => {
            const item = GameData.getItemById(itemId);
            return item && item.category === 'food';
        });
    },

    /**
     * 检查是否有玩具类道具
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否有玩具
     */
    hasToyItem(gameState) {
        return gameState.placedItems.some(itemId => {
            const item = GameData.getItemById(itemId);
            return item && (item.category === 'toy' || item.category === 'special');
        });
    },

    /**
     * 检查是否有家具类道具
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否有家具
     */
    hasFurnitureItem(gameState) {
        return gameState.placedItems.some(itemId => {
            const item = GameData.getItemById(itemId);
            return item && item.category === 'furniture';
        });
    },

    /**
     * 重置道具系统
     * @param {Object} gameState - 游戏状态
     */
    reset(gameState) {
        gameState.ownedItems = ['food_bowl', 'yarn_ball'];
        gameState.placedItems = [];
    },

    /**
     * 保存状态到游戏数据
     * @param {Object} gameState - 游戏状态
     * @param {Object} data - 要保存的数据
     */
    saveToGameState(gameState, data) {
        if (data.ownedItems) {
            gameState.ownedItems = [...data.ownedItems];
        }
        if (data.placedItems) {
            gameState.placedItems = [...data.placedItems];
        }
    }
};

// 导出到全局
window.ItemSystem = ItemSystem;
