/**
 * 游戏常量和配置模块
 * 包含所有游戏的基础配置数据
 */

const CONFIG = {
    // 游戏版本
    VERSION: '1.0.0',
    
    // localStorage 存储键名
    STORAGE_KEY: 'shitang_game_save',
    
    // 游戏循环帧率
    FPS: 60,
    
    // 客人进店间隔（毫秒）
    CUSTOMER_SPAWN_INTERVAL: 5000,
    
    // 默认等待时间（毫秒）
    DEFAULT_WAIT_TIME: 60000,
    
    // 游戏状态
    GAME_STATUS: {
        PLAYING: 'playing',
        PAUSED: 'paused',
        CLOSED: 'closed'
    },
    
    // 客人状态
    CUSTOMER_STATUS: {
        WAITING: 'waiting',
        ORDERING: 'ordering',
        EATING: 'eating',
        PAYING: 'paying',
        LEAVING: 'leaving',
        ANGRY: 'angry'
    },
    
    // 订单状态
    ORDER_STATUS: {
        PENDING: 'pending',
        COOKING: 'cooking',
        READY: 'ready',
        SERVED: 'served',
        COMPLETED: 'completed'
    },
    
    // 餐厅等级配置
    RESTAURANT_LEVELS: [
        {
            level: 1,
            name: '🍜 路边摊',
            upgradePrice: 0,
            seats: 2,
            maxEmployees: 1,
            unlockedRecipes: ['蛋炒饭'],
            customerFlowBonus: 0,
            patienceBonus: 0,
            satisfactionBonus: 0
        },
        {
            level: 2,
            name: '🏠 小饭馆',
            upgradePrice: 1000,
            seats: 4,
            maxEmployees: 2,
            unlockedRecipes: ['牛肉面', '饺子'],
            customerFlowBonus: 0.1,
            patienceBonus: 5000,
            satisfactionBonus: 0.02
        },
        {
            level: 3,
            name: '🍽️ 餐厅',
            upgradePrice: 5000,
            seats: 6,
            maxEmployees: 3,
            unlockedRecipes: ['麻婆豆腐', '红烧肉'],
            customerFlowBonus: 0.2,
            patienceBonus: 10000,
            satisfactionBonus: 0.04
        },
        {
            level: 4,
            name: '🏛️ 酒楼',
            upgradePrice: 20000,
            seats: 10,
            maxEmployees: 5,
            unlockedRecipes: ['油焖大虾', '清蒸鲈鱼'],
            customerFlowBonus: 0.3,
            patienceBonus: 15000,
            satisfactionBonus: 0.06
        },
        {
            level: 5,
            name: '⭐ 米其林',
            upgradePrice: 50000,
            seats: 15,
            maxEmployees: 8,
            unlockedRecipes: ['帝王蟹'],
            customerFlowBonus: 0.4,
            patienceBonus: 20000,
            satisfactionBonus: 0.08
        }
    ],
    
    // 菜谱配置
    RECIPES: [
        {
            id: '蛋炒饭',
            name: '🍚 蛋炒饭',
            basePrice: 15,
            cookTime: 10000,
            unlockLevel: 1,
            stars: 1,
            owned: true,
            upgradePrices: [0, 150, 300, 600, 1200]
        },
        {
            id: '牛肉面',
            name: '🍜 牛肉面',
            basePrice: 25,
            cookTime: 12000,
            unlockLevel: 2,
            stars: 1,
            owned: false,
            upgradePrices: [0, 250, 500, 1000, 2000]
        },
        {
            id: '饺子',
            name: '🥟 饺子',
            basePrice: 20,
            cookTime: 8000,
            unlockLevel: 2,
            stars: 1,
            owned: false,
            upgradePrices: [0, 200, 400, 800, 1600]
        },
        {
            id: '麻婆豆腐',
            name: '🍲 麻婆豆腐',
            basePrice: 30,
            cookTime: 10000,
            unlockLevel: 3,
            stars: 1,
            owned: false,
            upgradePrices: [0, 350, 700, 1400, 2800]
        },
        {
            id: '红烧肉',
            name: '🍖 红烧肉',
            basePrice: 45,
            cookTime: 15000,
            unlockLevel: 3,
            stars: 1,
            owned: false,
            upgradePrices: [0, 500, 1000, 2000, 4000]
        },
        {
            id: '油焖大虾',
            name: '🦐 油焖大虾',
            basePrice: 60,
            cookTime: 18000,
            unlockLevel: 4,
            stars: 1,
            owned: false,
            upgradePrices: [0, 800, 1600, 3200, 6400]
        },
        {
            id: '清蒸鲈鱼',
            name: '🐟 清蒸鲈鱼',
            basePrice: 80,
            cookTime: 20000,
            unlockLevel: 4,
            stars: 1,
            owned: false,
            upgradePrices: [0, 1200, 2400, 4800, 9600]
        },
        {
            id: '帝王蟹',
            name: '🦀 帝王蟹',
            basePrice: 150,
            cookTime: 25000,
            unlockLevel: 5,
            stars: 1,
            owned: false,
            upgradePrices: [0, 2000, 4000, 8000, 16000]
        }
    ],
    
    // 菜谱星级售价系数
    RECIPE_STAR_MULTIPLIERS: [1.0, 1.2, 1.5, 2.0, 3.0],
    
    // 员工配置
    EMPLOYEE_TYPES: [
        {
            id: '学徒厨师',
            name: '👩‍🍳 学徒厨师',
            type: 'chef',
            basePrice: 200,
            dailyWage: 50,
            cookSpeedBonus: 0,
            satisfactionBonus: 0,
            serveSpeedBonus: 0,
            maxLevel: 3
        },
        {
            id: '厨师',
            name: '👨‍🍳 厨师',
            type: 'chef',
            basePrice: 800,
            dailyWage: 120,
            cookSpeedBonus: 0.2,
            satisfactionBonus: 0,
            serveSpeedBonus: 0,
            maxLevel: 3
        },
        {
            id: '大厨',
            name: '👩‍🍳 大厨',
            type: 'chef',
            basePrice: 3000,
            dailyWage: 250,
            cookSpeedBonus: 0.4,
            satisfactionBonus: 0,
            serveSpeedBonus: 0,
            maxLevel: 3
        },
        {
            id: '服务员',
            name: '🧑‍💼 服务员',
            type: 'waiter',
            basePrice: 500,
            dailyWage: 80,
            cookSpeedBonus: 0,
            satisfactionBonus: 0,
            serveSpeedBonus: 0.5,
            maxLevel: 3
        },
        {
            id: '清洁工',
            name: '🧹 清洁工',
            type: 'cleaner',
            basePrice: 300,
            dailyWage: 60,
            cookSpeedBonus: 0,
            satisfactionBonus: 0.05,
            serveSpeedBonus: 0,
            maxLevel: 3
        }
    ],
    
    // 员工升级配置
    EMPLOYEE_LEVELS: [
        { level: 1, priceMultiplier: 1, effectBonus: 0 },
        { level: 2, priceMultiplier: 1.5, effectBonus: 0.1 },
        { level: 3, priceMultiplier: 2, effectBonus: 0.2 }
    ],
    
    // 厨具配置
    KITCHENWARES: [
        {
            id: '普通灶台',
            name: '🍳 普通灶台',
            price: 0,
            cookTimeReduction: 0,
            unlockLevel: 1,
            owned: true
        },
        {
            id: '燃气灶',
            name: '🔥 燃气灶',
            price: 800,
            cookTimeReduction: 0.2,
            unlockLevel: 2,
            owned: false
        },
        {
            id: '电磁炉',
            name: '⚡ 电磁炉',
            price: 2500,
            cookTimeReduction: 0.4,
            unlockLevel: 3,
            owned: false
        },
        {
            id: '工业烤箱',
            name: '🍕 工业烤箱',
            price: 6000,
            cookTimeReduction: 0.6,
            unlockLevel: 4,
            owned: false
        },
        {
            id: '自动炒菜机',
            name: '🤖 自动炒菜机',
            price: 15000,
            cookTimeReduction: 0.8,
            unlockLevel: 5,
            owned: false
        }
    ],
    
    // 客人类型配置
    CUSTOMER_TYPES: [
        {
            id: '普通客人',
            name: '👤 普通客人',
            spawnChance: 0.5,
            spendingMultiplier: 1.0,
            basePatience: 60000,
            tipBonus: 0,
            reputationBonus: 1,
            popularityBonus: 0
        },
        {
            id: '白领',
            name: '👨‍💼 白领',
            spawnChance: 0.2,
            spendingMultiplier: 1.5,
            basePatience: 45000,
            tipBonus: 0.2,
            reputationBonus: 1,
            popularityBonus: 0
        },
        {
            id: '老人',
            name: '👵 老人',
            spawnChance: 0.15,
            spendingMultiplier: 0.8,
            basePatience: 90000,
            tipBonus: 0,
            reputationBonus: 1,
            popularityBonus: 0
        },
        {
            id: '美食家',
            name: '⭐ 美食家',
            spawnChance: 0.1,
            spendingMultiplier: 2.0,
            basePatience: 40000,
            tipBonus: 0,
            reputationBonus: 2,
            popularityBonus: 0
        },
        {
            id: '网红',
            name: '📸 网红',
            spawnChance: 0.05,
            spendingMultiplier: 1.2,
            basePatience: 30000,
            tipBonus: 0,
            reputationBonus: 1,
            popularityBonus: 10
        }
    ],
    
    // Canvas 尺寸配置
    CANVAS: {
        width: 800,
        height: 500
    },
    
    // 颜色配置
    COLORS: {
        background: '#FFF8E7',
        floor: '#F5DEB3',
        wall: '#DEB887',
        table: '#8B4513',
        tableOccupied: '#CD853F',
        chair: '#A0522D',
        kitchen: '#FFE4C4',
        stove: '#808080',
        stoveActive: '#FF6347',
        customer: {
            normal: '#4A90D9',
            waiting: '#FFD700',
            angry: '#FF4500',
            eating: '#32CD32'
        }
    }
};

// 导出配置对象
window.CONFIG = CONFIG;