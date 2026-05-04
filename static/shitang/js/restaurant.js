/**
 * 餐厅管理模块
 * 负责餐厅升级、订单处理和游戏核心逻辑
 */

const RestaurantSystem = {
    // 上次生成客人的时间
    lastCustomerSpawnTime: 0,

    /**
     * 初始化餐厅系统
     */
    init() {
        this.lastCustomerSpawnTime = Date.now();
    },

    /**
     * 更新餐厅状态
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 生成客人
        this.spawnCustomers(currentTime);
        
        // 更新订单状态
        this.updateOrders(currentTime);
        
        // 更新客人状态
        CustomerSystem.update(deltaTime);
        
        // 更新游戏时间
        GameState.updateTime(currentTime);
    },

    /**
     * 生成客人
     * @param {number} currentTime - 当前时间
     */
    spawnCustomers(currentTime) {
        // 计算生成间隔（根据餐厅等级调整）
        const restaurantConfig = GameState.getRestaurantConfig();
        const baseInterval = CONFIG.CUSTOMER_SPAWN_INTERVAL;
        const flowBonus = restaurantConfig.customerFlowBonus;
        const spawnInterval = Math.floor(baseInterval * (1 - flowBonus));
        
        // 检查是否到了生成时间
        if (currentTime - this.lastCustomerSpawnTime >= spawnInterval) {
            // 尝试生成客人
            const customer = CustomerSystem.spawnCustomer();
            if (customer) {
                this.lastCustomerSpawnTime = currentTime;
            }
        }
    },

    /**
     * 更新订单状态
     * @param {number} currentTime - 当前时间
     */
    updateOrders(currentTime) {
        // 处理待处理的订单
        const pendingOrders = GameState.orders.filter(o => o.status === CONFIG.ORDER_STATUS.PENDING);
        
        for (const order of pendingOrders) {
            // 查找空闲的灶台
            const freeStove = GameState.stoves.find(s => !s.inUse);
            if (freeStove) {
                this.startCooking(order, freeStove, currentTime);
            }
        }
        
        // 处理正在烹饪的订单
        const cookingOrders = GameState.orders.filter(o => o.status === CONFIG.ORDER_STATUS.COOKING);
        
        for (const order of cookingOrders) {
            this.checkCookingComplete(order, currentTime);
        }
        
        // 处理已完成的订单（自动上菜）
        const readyOrders = GameState.orders.filter(o => o.status === CONFIG.ORDER_STATUS.READY);
        
        for (const order of readyOrders) {
            // 自动上菜
            CustomerSystem.serveOrder(order.id);
        }
    },

    /**
     * 开始烹饪
     * @param {Object} order - 订单对象
     * @param {Object} stove - 灶台对象
     * @param {number} currentTime - 当前时间
     */
    startCooking(order, stove, currentTime) {
        // 获取菜谱
        const recipe = CONFIG.RECIPES.find(r => r.id === order.recipeId);
        if (!recipe) {
            console.error(`找不到菜谱: ${order.recipeId}`);
            return;
        }
        
        // 计算实际烹饪时间
        const actualCookTime = KitchenwareSystem.calculateCookTime(recipe.cookTime);
        
        // 更新订单状态
        order.status = CONFIG.ORDER_STATUS.COOKING;
        order.cookStartTime = currentTime;
        order.cookEndTime = currentTime + actualCookTime;
        
        // 占用灶台
        stove.inUse = true;
        stove.orderId = order.id;
        stove.cookStartTime = currentTime;
        
        console.log(`开始烹饪订单 ${order.id}: ${order.recipeName}, 预计 ${actualCookTime/1000} 秒`);
    },

    /**
     * 检查烹饪是否完成
     * @param {Object} order - 订单对象
     * @param {number} currentTime - 当前时间
     */
    checkCookingComplete(order, currentTime) {
        if (currentTime >= order.cookEndTime) {
            // 烹饪完成
            order.status = CONFIG.ORDER_STATUS.READY;
            
            // 释放灶台
            const stove = GameState.stoves.find(s => s.orderId === order.id);
            if (stove) {
                stove.inUse = false;
                stove.orderId = null;
                stove.cookStartTime = null;
            }
            
            // 更新统计
            GameState.stats.totalRecipesCooked++;
            
            console.log(`订单 ${order.id} 烹饪完成: ${order.recipeName}`);
        }
    },

    /**
     * 升级餐厅
     * @returns {boolean} 是否升级成功
     */
    upgradeRestaurant() {
        if (GameState.restaurantLevel >= CONFIG.RESTAURANT_LEVELS.length) {
            console.log('餐厅已达最高等级');
            return false;
        }
        
        const nextLevelConfig = CONFIG.RESTAURANT_LEVELS[GameState.restaurantLevel];
        const upgradePrice = nextLevelConfig.upgradePrice;
        
        if (GameState.gold < upgradePrice) {
            console.log(`金币不足，需要 ${upgradePrice} 金币`);
            return false;
        }
        
        // 扣除金币
        GameState.gold -= upgradePrice;
        
        // 提升等级
        GameState.restaurantLevel++;
        
        // 重新初始化桌子和灶台
        GameState.initTables();
        GameState.initStoves();
        
        // 解锁新菜谱
        const newLevelConfig = GameState.getRestaurantConfig();
        for (const recipeId of newLevelConfig.unlockedRecipes) {
            const recipe = GameState.recipes.find(r => r.id === recipeId);
            if (recipe && !recipe.owned) {
                // 标记为可购买（需要用户主动购买）
                console.log(`新菜谱解锁: ${recipeId}`);
            }
        }
        
        console.log(`餐厅升级到 ${GameState.restaurantLevel} 级: ${newLevelConfig.name}`);
        return true;
    },

    /**
     * 获取下一级升级价格
     * @returns {number|null} 升级价格，如果已是最高级则返回 null
     */
    getNextUpgradePrice() {
        if (GameState.restaurantLevel >= CONFIG.RESTAURANT_LEVELS.length) {
            return null;
        }
        return CONFIG.RESTAURANT_LEVELS[GameState.restaurantLevel].upgradePrice;
    },

    /**
     * 获取当前餐厅信息
     * @returns {Object} 餐厅信息
     */
    getRestaurantInfo() {
        const config = GameState.getRestaurantConfig();
        return {
            level: GameState.restaurantLevel,
            name: config.name,
            seats: config.seats,
            maxEmployees: config.maxEmployees,
            currentEmployees: GameState.employees.length,
            nextUpgradePrice: this.getNextUpgradePrice()
        };
    }
};

// 导出 RestaurantSystem 对象
window.RestaurantSystem = RestaurantSystem;