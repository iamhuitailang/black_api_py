/**
 * 客人系统模块
 * 负责客人的生成、行为和状态管理
 */

const CustomerSystem = {
    /**
     * 生成新客人
     * @returns {Object|null} 新客人对象，如果没有空座位则返回 null
     */
    spawnCustomer() {
        // 检查是否有空座位
        const emptyTable = GameState.tables.find(t => !t.occupied);
        if (!emptyTable) {
            return null;
        }
        
        // 根据概率随机选择客人类型
        const customerType = this.selectCustomerType();
        if (!customerType) {
            return null;
        }
        
        // 创建客人对象
        const customer = {
            id: GameState.nextCustomerId++,
            type: customerType.id,
            typeName: customerType.name,
            status: CONFIG.CUSTOMER_STATUS.WAITING,
            tableId: emptyTable.id,
            orderId: null,
            patience: this.calculatePatience(customerType),
            maxPatience: this.calculatePatience(customerType),
            spawnTime: Date.now(),
            satisfaction: GameState.satisfaction,
            x: 0,
            y: 0
        };
        
        // 占用座位
        emptyTable.occupied = true;
        emptyTable.customerId = customer.id;
        
        // 添加到客人列表
        GameState.customers.push(customer);
        
        console.log(`新客人进店: ${customer.typeName}, 座位号: ${customer.tableId}`);
        return customer;
    },

    /**
     * 根据概率选择客人类型
     * @returns {Object} 客人类型配置
     */
    selectCustomerType() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const type of CONFIG.CUSTOMER_TYPES) {
            cumulative += type.spawnChance;
            if (random <= cumulative) {
                return type;
            }
        }
        
        // 默认返回普通客人
        return CONFIG.CUSTOMER_TYPES[0];
    },

    /**
     * 计算客人耐心时间
     * @param {Object} customerType - 客人类型配置
     * @returns {number} 耐心时间（毫秒）
     */
    calculatePatience(customerType) {
        const restaurantConfig = GameState.getRestaurantConfig();
        const basePatience = customerType.basePatience;
        const bonusPatience = restaurantConfig.patienceBonus;
        
        return basePatience + bonusPatience;
    },

    /**
     * 更新客人状态
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    update(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = GameState.customers.length - 1; i >= 0; i--) {
            const customer = GameState.customers[i];
            
            // 根据状态处理不同逻辑
            switch (customer.status) {
                case CONFIG.CUSTOMER_STATUS.WAITING:
                    this.handleWaiting(customer, deltaTime, currentTime);
                    break;
                case CONFIG.CUSTOMER_STATUS.ORDERING:
                    this.handleOrdering(customer, currentTime);
                    break;
                case CONFIG.CUSTOMER_STATUS.EATING:
                    this.handleEating(customer, deltaTime, currentTime);
                    break;
                case CONFIG.CUSTOMER_STATUS.PAYING:
                    this.handlePaying(customer, currentTime);
                    break;
                case CONFIG.CUSTOMER_STATUS.ANGRY:
                    this.handleAngry(customer, i);
                    break;
                case CONFIG.CUSTOMER_STATUS.LEAVING:
                    this.handleLeaving(customer, i);
                    break;
            }
        }
    },

    /**
     * 处理等待状态的客人
     * @param {Object} customer - 客人对象
     * @param {number} deltaTime - 时间增量
     * @param {number} currentTime - 当前时间
     */
    handleWaiting(customer, deltaTime, currentTime) {
        // 减少耐心
        customer.patience -= deltaTime;
        
        // 检查耐心是否耗尽
        if (customer.patience <= 0) {
            customer.status = CONFIG.CUSTOMER_STATUS.ANGRY;
            console.log(`客人 ${customer.id} 生气了！`);
            return;
        }
        
        // 检查是否可以开始点菜（等待一段时间后）
        const waitTime = currentTime - customer.spawnTime;
        if (waitTime > 2000) { // 等待2秒后开始点菜
            customer.status = CONFIG.CUSTOMER_STATUS.ORDERING;
        }
    },

    /**
     * 处理点菜状态的客人
     * @param {Object} customer - 客人对象
     * @param {number} currentTime - 当前时间
     */
    handleOrdering(customer, currentTime) {
        // 创建订单
        const ownedRecipes = GameState.getOwnedRecipes();
        if (ownedRecipes.length === 0) {
            console.error('没有可用的菜谱！');
            return;
        }
        
        // 随机选择一个菜谱
        const selectedRecipe = ownedRecipes[Math.floor(Math.random() * ownedRecipes.length)];
        
        // 计算订单价格
        const customerType = CONFIG.CUSTOMER_TYPES.find(t => t.id === customer.type);
        const spendingMultiplier = customerType ? customerType.spendingMultiplier : 1;
        const starMultiplier = CONFIG.RECIPE_STAR_MULTIPLIERS[selectedRecipe.stars - 1];
        const basePrice = selectedRecipe.basePrice;
        const finalPrice = Math.floor(basePrice * spendingMultiplier * starMultiplier);
        
        // 创建订单
        const order = {
            id: GameState.nextOrderId++,
            customerId: customer.id,
            recipeId: selectedRecipe.id,
            recipeName: selectedRecipe.name,
            basePrice: basePrice,
            finalPrice: finalPrice,
            status: CONFIG.ORDER_STATUS.PENDING,
            createTime: currentTime,
            cookStartTime: null,
            cookEndTime: null,
            serveTime: null,
            completeTime: null
        };
        
        GameState.orders.push(order);
        customer.orderId = order.id;
        
        // 客人状态变为等待上菜
        customer.status = CONFIG.CUSTOMER_STATUS.WAITING;
        // 重置一部分耐心
        customer.patience = Math.min(customer.patience + 30000, customer.maxPatience);
        
        console.log(`客人 ${customer.id} 点了 ${selectedRecipe.name}, 订单号: ${order.id}`);
    },

    /**
     * 处理用餐状态的客人
     * @param {Object} customer - 客人对象
     * @param {number} deltaTime - 时间增量
     * @param {number} currentTime - 当前时间
     */
    handleEating(customer, deltaTime, currentTime) {
        const order = GameState.orders.find(o => o.id === customer.orderId);
        if (!order) {
            customer.status = CONFIG.CUSTOMER_STATUS.LEAVING;
            return;
        }
        
        // 用餐需要一定时间
        const eatTime = 8000; // 8秒用餐时间
        if (order.serveTime && currentTime - order.serveTime > eatTime) {
            customer.status = CONFIG.CUSTOMER_STATUS.PAYING;
        }
    },

    /**
     * 处理付钱状态的客人
     * @param {Object} customer - 客人对象
     * @param {number} currentTime - 当前时间
     */
    handlePaying(customer, currentTime) {
        const order = GameState.orders.find(o => o.id === customer.orderId);
        if (!order) {
            customer.status = CONFIG.CUSTOMER_STATUS.LEAVING;
            return;
        }
        
        // 计算小费
        const customerType = CONFIG.CUSTOMER_TYPES.find(t => t.id === customer.type);
        let tip = 0;
        
        if (customerType) {
            // 满意度影响小费
            const satisfactionFactor = customer.satisfaction;
            const tipBonus = customerType.tipBonus;
            tip = Math.floor(order.finalPrice * satisfactionFactor * tipBonus);
        }
        
        // 收钱
        const totalIncome = order.finalPrice + tip;
        GameState.gold += totalIncome;
        
        // 更新统计
        GameState.stats.totalGoldEarned += totalIncome;
        GameState.stats.totalCustomersServed++;
        
        // 增加声望
        const reputationBonus = customerType ? customerType.reputationBonus : 1;
        GameState.reputation += reputationBonus;
        
        // 更新订单状态
        order.status = CONFIG.ORDER_STATUS.COMPLETED;
        order.completeTime = currentTime;
        
        console.log(`客人 ${customer.id} 付钱了: ${order.finalPrice} 金币, 小费: ${tip} 金币`);
        
        // 客人离开
        customer.status = CONFIG.CUSTOMER_STATUS.LEAVING;
    },

    /**
     * 处理生气的客人
     * @param {Object} customer - 客人对象
     * @param {number} index - 客人在列表中的索引
     */
    handleAngry(customer, index) {
        // 生气的客人会降低满意度
        GameState.satisfaction = Math.max(0.3, GameState.satisfaction - 0.05);
        
        // 释放桌子
        const table = GameState.tables.find(t => t.id === customer.tableId);
        if (table) {
            table.occupied = false;
            table.customerId = null;
        }
        
        // 取消订单（如果有的话）
        if (customer.orderId) {
            const orderIndex = GameState.orders.findIndex(o => o.id === customer.orderId);
            if (orderIndex !== -1) {
                GameState.orders.splice(orderIndex, 1);
            }
        }
        
        // 移除客人
        GameState.customers.splice(index, 1);
        
        console.log(`生气的客人 ${customer.id} 离开了，满意度下降`);
    },

    /**
     * 处理离开的客人
     * @param {Object} customer - 客人对象
     * @param {number} index - 客人在列表中的索引
     */
    handleLeaving(customer, index) {
        // 释放桌子
        const table = GameState.tables.find(t => t.id === customer.tableId);
        if (table) {
            table.occupied = false;
            table.customerId = null;
        }
        
        // 移除客人
        GameState.customers.splice(index, 1);
        
        console.log(`客人 ${customer.id} 离开了`);
    },

    /**
     * 上菜给客人
     * @param {number} orderId - 订单ID
     * @returns {boolean} 是否成功
     */
    serveOrder(orderId) {
        const order = GameState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error(`找不到订单: ${orderId}`);
            return false;
        }
        
        const customer = GameState.customers.find(c => c.id === order.customerId);
        if (!customer) {
            console.error(`找不到客人: ${order.customerId}`);
            return false;
        }
        
        // 更新订单状态
        order.status = CONFIG.ORDER_STATUS.SERVED;
        order.serveTime = Date.now();
        
        // 更新客人状态
        customer.status = CONFIG.CUSTOMER_STATUS.EATING;
        
        // 增加满意度（快速上菜）
        const waitTime = Date.now() - order.createTime;
        const baseCookTime = CONFIG.RECIPES.find(r => r.id === order.recipeId)?.cookTime || 10000;
        
        if (waitTime < baseCookTime * 1.5) {
            GameState.satisfaction = Math.min(1.0, GameState.satisfaction + 0.01);
        }
        
        console.log(`订单 ${orderId} 已上菜给客人 ${customer.id}`);
        return true;
    },

    /**
     * 获取客人的显示颜色
     * @param {Object} customer - 客人对象
     * @returns {string} 颜色值
     */
    getCustomerColor(customer) {
        switch (customer.status) {
            case CONFIG.CUSTOMER_STATUS.WAITING:
                // 根据耐心程度改变颜色
                const patienceRatio = customer.patience / customer.maxPatience;
                if (patienceRatio > 0.5) {
                    return CONFIG.COLORS.customer.waiting;
                } else if (patienceRatio > 0.2) {
                    return '#FFA500'; // 橙色
                } else {
                    return CONFIG.COLORS.customer.angry;
                }
            case CONFIG.CUSTOMER_STATUS.EATING:
                return CONFIG.COLORS.customer.eating;
            case CONFIG.CUSTOMER_STATUS.ANGRY:
                return CONFIG.COLORS.customer.angry;
            default:
                return CONFIG.COLORS.customer.normal;
        }
    }
};

// 导出 CustomerSystem 对象
window.CustomerSystem = CustomerSystem;