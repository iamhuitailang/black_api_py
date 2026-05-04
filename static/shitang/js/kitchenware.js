/**
 * 厨具系统模块
 * 负责厨具的购买和管理
 */

const KitchenwareSystem = {
    /**
     * 购买厨具
     * @param {string} kitchenwareId - 厨具ID
     * @returns {boolean} 是否购买成功
     */
    buyKitchenware(kitchenwareId) {
        const kitchenware = GameState.kitchenwares.find(kw => kw.id === kitchenwareId);
        
        if (!kitchenware) {
            console.error(`找不到厨具: ${kitchenwareId}`);
            return false;
        }
        
        if (kitchenware.owned) {
            console.log(`厨具 ${kitchenwareId} 已经拥有`);
            return false;
        }
        
        // 检查解锁等级
        if (kitchenware.unlockLevel > GameState.restaurantLevel) {
            console.log(`需要餐厅等级 ${kitchenware.unlockLevel} 才能解锁此厨具`);
            return false;
        }
        
        // 检查金币
        if (GameState.gold < kitchenware.price) {
            console.log(`金币不足，需要 ${kitchenware.price} 金币`);
            return false;
        }
        
        // 扣除金币
        GameState.gold -= kitchenware.price;
        kitchenware.owned = true;
        
        console.log(`购买厨具 ${kitchenware.name} 成功，花费 ${kitchenware.price} 金币`);
        return true;
    },

    /**
     * 获取当前最好的厨具
     * @returns {Object} 厨具对象
     */
    getBestKitchenware() {
        return GameState.getBestKitchenware();
    },

    /**
     * 计算实际做菜时间
     * @param {number} baseCookTime - 基础做菜时间
     * @returns {number} 实际做菜时间
     */
    calculateCookTime(baseCookTime) {
        const bestKitchenware = this.getBestKitchenware();
        const cookTimeReduction = bestKitchenware.cookTimeReduction;
        
        // 员工加成
        const employeeBonuses = GameState.getEmployeeBonuses();
        const totalReduction = Math.min(
            cookTimeReduction + employeeBonuses.cookSpeedBonus,
            0.9 // 最多减少90%时间
        );
        
        return Math.floor(baseCookTime * (1 - totalReduction));
    }
};

// 导出 KitchenwareSystem 对象
window.KitchenwareSystem = KitchenwareSystem;