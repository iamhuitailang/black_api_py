/**
 * 游戏状态管理模块
 * 负责管理所有游戏核心数据和状态
 */

const GameState = {
    // 游戏核心数据
    gold: 0,
    reputation: 0,
    satisfaction: 0.7,
    restaurantLevel: 1,
    
    // 游戏状态
    gameStatus: CONFIG.GAME_STATUS.PLAYING,
    lastUpdateTime: 0,
    
    // 客人相关
    customers: [],
    nextCustomerId: 1,
    
    // 订单相关
    orders: [],
    nextOrderId: 1,
    
    // 员工相关
    employees: [],
    nextEmployeeId: 1,
    
    // 菜谱相关
    recipes: [],
    
    // 厨具相关
    kitchenwares: [],
    
    // 桌子相关
    tables: [],
    
    // 灶台相关
    stoves: [],
    
    // 统计数据
    stats: {
        totalCustomersServed: 0,
        totalGoldEarned: 0,
        totalRecipesCooked: 0,
        playTime: 0
    },

    /**
     * 初始化游戏状态
     * 如果有存档则加载，否则创建新游戏
     */
    init() {
        const savedData = Storage.load();
        
        if (savedData) {
            this.loadFromSave(savedData);
        } else {
            this.createNewGame();
        }
        
        this.lastUpdateTime = Date.now();
    },

    /**
     * 创建新游戏
     */
    createNewGame() {
        console.log('创建新游戏...');
        
        // 初始化核心数据
        this.gold = 500; // 初始金币
        this.reputation = 0;
        this.satisfaction = 0.7;
        this.restaurantLevel = 1;
        this.gameStatus = CONFIG.GAME_STATUS.PLAYING;
        
        // 初始化客人和订单
        this.customers = [];
        this.nextCustomerId = 1;
        this.orders = [];
        this.nextOrderId = 1;
        
        // 初始化员工
        this.employees = [];
        this.nextEmployeeId = 1;
        
        // 初始化菜谱（深拷贝配置）
        this.recipes = CONFIG.RECIPES.map(recipe => ({
            ...recipe,
            owned: recipe.id === '蛋炒饭' // 初始只有蛋炒饭
        }));
        
        // 初始化厨具
        this.kitchenwares = CONFIG.KITCHENWARES.map(kw => ({
            ...kw,
            owned: kw.id === '普通灶台'
        }));
        
        // 初始化桌子
        this.initTables();
        
        // 初始化灶台
        this.initStoves();
        
        // 初始化统计
        this.stats = {
            totalCustomersServed: 0,
            totalGoldEarned: 0,
            totalRecipesCooked: 0,
            playTime: 0
        };
        
        console.log('新游戏创建完成');
    },

    /**
     * 从存档加载游戏
     * @param {Object} savedData - 存档数据
     */
    loadFromSave(savedData) {
        console.log('从存档加载游戏...');
        
        // 加载核心数据
        this.gold = savedData.gold || 0;
        this.reputation = savedData.reputation || 0;
        this.satisfaction = savedData.satisfaction || 0.7;
        this.restaurantLevel = savedData.restaurantLevel || 1;
        this.gameStatus = savedData.gameStatus || CONFIG.GAME_STATUS.PLAYING;
        
        // 加载客人和订单
        this.customers = savedData.customers || [];
        this.nextCustomerId = savedData.nextCustomerId || 1;
        this.orders = savedData.orders || [];
        this.nextOrderId = savedData.nextOrderId || 1;
        
        // 加载员工
        this.employees = savedData.employees || [];
        this.nextEmployeeId = savedData.nextEmployeeId || 1;
        
        // 加载菜谱（如果存档没有，使用默认配置）
        if (savedData.recipes && savedData.recipes.length > 0) {
            this.recipes = savedData.recipes;
        } else {
            this.recipes = CONFIG.RECIPES.map(recipe => ({
                ...recipe,
                owned: recipe.id === '蛋炒饭'
            }));
        }
        
        // 加载厨具
        if (savedData.kitchenwares && savedData.kitchenwares.length > 0) {
            this.kitchenwares = savedData.kitchenwares;
        } else {
            this.kitchenwares = CONFIG.KITCHENWARES.map(kw => ({
                ...kw,
                owned: kw.id === '普通灶台'
            }));
        }
        
        // 加载桌子
        if (savedData.tables && savedData.tables.length > 0) {
            this.tables = savedData.tables;
        } else {
            this.initTables();
        }
        
        // 加载灶台
        if (savedData.stoves && savedData.stoves.length > 0) {
            this.stoves = savedData.stoves;
        } else {
            this.initStoves();
        }
        
        // 加载统计
        this.stats = savedData.stats || {
            totalCustomersServed: 0,
            totalGoldEarned: 0,
            totalRecipesCooked: 0,
            playTime: 0
        };
        
        console.log('游戏加载完成');
    },

    /**
     * 初始化桌子
     */
    initTables() {
        const levelConfig = CONFIG.RESTAURANT_LEVELS[this.restaurantLevel - 1];
        const seatCount = levelConfig.seats;
        
        this.tables = [];
        for (let i = 0; i < seatCount; i++) {
            this.tables.push({
                id: i + 1,
                occupied: false,
                customerId: null,
                x: 0,
                y: 0
            });
        }
    },

    /**
     * 初始化灶台
     */
    initStoves() {
        // 初始有2个灶台，每级餐厅增加1个
        const stoveCount = 2 + this.restaurantLevel - 1;
        
        this.stoves = [];
        for (let i = 0; i < stoveCount; i++) {
            this.stoves.push({
                id: i + 1,
                inUse: false,
                orderId: null,
                cookStartTime: null,
                x: 0,
                y: 0
            });
        }
    },

    /**
     * 获取当前餐厅配置
     * @returns {Object} 餐厅配置
     */
    getRestaurantConfig() {
        return CONFIG.RESTAURANT_LEVELS[this.restaurantLevel - 1];
    },

    /**
     * 获取当前最好的厨具
     * @returns {Object} 厨具对象
     */
    getBestKitchenware() {
        const owned = this.kitchenwares.filter(kw => kw.owned);
        if (owned.length === 0) {
            return CONFIG.KITCHENWARES[0];
        }
        // 按解锁等级排序，返回最高级的
        return owned.sort((a, b) => b.unlockLevel - a.unlockLevel)[0];
    },

    /**
     * 获取所有拥有的菜谱
     * @returns {Array} 菜谱列表
     */
    getOwnedRecipes() {
        return this.recipes.filter(recipe => recipe.owned);
    },

    /**
     * 计算员工加成
     * @returns {Object} 各种加成
     */
    getEmployeeBonuses() {
        let cookSpeedBonus = 0;
        let satisfactionBonus = 0;
        let serveSpeedBonus = 0;
        
        this.employees.forEach(emp => {
            const empType = CONFIG.EMPLOYEE_TYPES.find(t => t.id === emp.type);
            if (empType) {
                const levelBonus = CONFIG.EMPLOYEE_LEVELS[emp.level - 1].effectBonus;
                cookSpeedBonus += empType.cookSpeedBonus + levelBonus * (empType.cookSpeedBonus > 0 ? 1 : 0);
                satisfactionBonus += empType.satisfactionBonus + levelBonus * (empType.satisfactionBonus > 0 ? 1 : 0);
                serveSpeedBonus += empType.serveSpeedBonus + levelBonus * (empType.serveSpeedBonus > 0 ? 1 : 0);
            }
        });
        
        return {
            cookSpeedBonus: Math.min(cookSpeedBonus, 0.9), // 最多减少90%时间
            satisfactionBonus: Math.min(satisfactionBonus, 0.3), // 最多增加30%满意度
            serveSpeedBonus: Math.min(serveSpeedBonus, 0.9)
        };
    },

    /**
     * 保存当前状态
     */
    save() {
        Storage.save(this);
    },

    /**
     * 更新游戏时间
     * @param {number} currentTime - 当前时间戳
     */
    updateTime(currentTime) {
        const deltaTime = currentTime - this.lastUpdateTime;
        if (deltaTime > 0) {
            this.stats.playTime += deltaTime;
        }
        this.lastUpdateTime = currentTime;
    }
};

// 导出 GameState 对象
window.GameState = GameState;