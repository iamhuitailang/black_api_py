/**
 * 咯咯农场 - 配置模块
 * 包含所有游戏常量和数据模型定义
 */

const CONFIG = {
    STORAGE_KEY: 'gagafarm_save',
    
    GAME_TICK: 1000,
    
    TIME_SCALE: 1,
    
    EGG_PRICE: 1,
    
    CHICKEN_LIFETIME_HOURS: 168,
    
    SENIOR_AGE_HOURS: 120,
    
    SENIOR_PRODUCTION_RATE: 0.5,
    
    SLAUGHTER_VALUE_RATE: 0.1,
    
    DAY_DURATION_SECONDS: 300,
    
    NIGHT_START_PERCENT: 0.8,
    
    DAY_START_PERCENT: 0.15,
};

const TIME_PERIOD = {
    DAY: 'day',
    NIGHT: 'night',
    DAWN: 'dawn',
    DUSK: 'dusk'
};

const DOG_CONFIG = {
    id: 'guard_dog',
    name: '看门狗',
    icon: '🐕',
    price: 1000,
    description: '晚上看家护院，减少黄鼠狼袭击的概率',
    weaselReductionRate: 0.7,
    unlockCondition: {
        type: 'gold',
        value: 500
    }
};

const CHICKEN_TYPES = [
    {
        id: 'normal',
        name: '普通鸡',
        icon: '🐤',
        price: 20,
        growthTimeMinutes: 10,
        layIntervalSeconds: 30,
        eggValue: 2,
        unlockCondition: {
            type: 'initial',
            value: 0
        },
        description: '入门级小鸡，便宜但效率一般'
    },
    {
        id: 'luhua',
        name: '芦花鸡',
        icon: '🐔',
        price: 50,
        growthTimeMinutes: 15,
        layIntervalSeconds: 25,
        eggValue: 3,
        unlockCondition: {
            type: 'sold_eggs',
            value: 100
        },
        description: '产蛋效率提升，需要卖100个鸡蛋解锁'
    },
    {
        id: 'wugu',
        name: '乌骨鸡',
        icon: '🐓',
        price: 120,
        growthTimeMinutes: 20,
        layIntervalSeconds: 20,
        eggValue: 4,
        unlockCondition: {
            type: 'sold_eggs',
            value: 300
        },
        description: '珍贵品种，产蛋价值高，需要卖300个鸡蛋解锁'
    },
    {
        id: 'guifei',
        name: '贵妃鸡',
        icon: '🦃',
        price: 300,
        growthTimeMinutes: 25,
        layIntervalSeconds: 15,
        eggValue: 6,
        unlockCondition: {
            type: 'sold_eggs',
            value: 800
        },
        description: '贵族品种，高效产蛋，需要卖800个鸡蛋解锁'
    },
    {
        id: 'qicai',
        name: '七彩山鸡',
        icon: '🦚',
        price: 800,
        growthTimeMinutes: 30,
        layIntervalSeconds: 10,
        eggValue: 10,
        unlockCondition: {
            type: 'sold_eggs',
            value: 2000
        },
        description: '稀有品种，产蛋速度快，需要卖2000个鸡蛋解锁'
    },
    {
        id: 'golden',
        name: '黄金鸡',
        icon: '⭐',
        price: 2000,
        growthTimeMinutes: 40,
        layIntervalSeconds: 8,
        eggValue: 20,
        unlockCondition: {
            type: 'sold_eggs',
            value: 5000
        },
        description: '传说品种，价值最高，需要卖5000个鸡蛋解锁'
    }
];

const COOP_TYPES = [
    {
        id: 'small',
        name: '小鸡圈',
        price: 0,
        capacity: 10,
        hasAutoCollect: false,
        unlockCondition: {
            type: 'initial',
            value: 0
        },
        description: '初始鸡舍，最多容纳10只鸡'
    },
    {
        id: 'wood',
        name: '木鸡舍',
        price: 500,
        capacity: 30,
        hasAutoCollect: false,
        unlockCondition: {
            type: 'gold',
            value: 100
        },
        description: '木质鸡舍，最多容纳30只鸡，需要100金币解锁'
    },
    {
        id: 'brick',
        name: '砖鸡舍',
        price: 2000,
        capacity: 80,
        hasAutoCollect: false,
        unlockCondition: {
            type: 'gold',
            value: 1000
        },
        description: '砖石鸡舍，最多容纳80只鸡，需要1000金币解锁'
    },
    {
        id: 'large',
        name: '大型鸡舍',
        price: 8000,
        capacity: 200,
        hasAutoCollect: true,
        unlockCondition: {
            type: 'gold',
            value: 5000
        },
        description: '大型农场，最多容纳200只鸡，解锁自动收集功能'
    },
    {
        id: 'automated',
        name: '自动化农场',
        price: 30000,
        capacity: 500,
        hasAutoCollect: true,
        unlockCondition: {
            type: 'gold',
            value: 20000
        },
        description: '自动化农场，最多容纳500只鸡，智能管理'
    }
];

const RANDOM_EVENTS = [
    {
        id: 'double_yolk',
        name: '双黄蛋',
        icon: '🌟',
        probability: 0.05,
        effect: {
            type: 'multiply_lay',
            multiplier: 2,
            durationTicks: 1
        },
        message: '幸运！刚才的鸡产下了双黄蛋，鸡蛋数量翻倍！'
    },
    {
        id: 'weasel',
        name: '黄鼠狼来袭',
        icon: '🦊',
        probability: 0.01,
        timeCondition: TIME_PERIOD.NIGHT,
        effect: {
            type: 'lose_chickens',
            minCount: 1,
            maxCount: 3
        },
        message: '不好！有黄鼠狼闯入鸡舍，损失了{count}只鸡！'
    },
    {
        id: 'bird_flu',
        name: '禽流感',
        icon: '🌧️',
        probability: 0.02,
        timeCondition: null,
        effect: {
            type: 'reduce_production',
            rate: 0.5,
            durationMinutes: 120
        },
        message: '爆发了禽流感！产蛋速度减半，持续2小时。'
    },
    {
        id: 'vaccine_discount',
        name: '疫苗优惠',
        icon: '💊',
        probability: 0.03,
        effect: {
            type: 'reduce_cost',
            rate: 0.5,
            durationMinutes: 1440
        },
        message: '疫苗促销！饲料成本减半，持续1天。'
    },
    {
        id: 'egg_price_hike',
        name: '鸡蛋涨价',
        icon: '🎉',
        probability: 0.04,
        effect: {
            type: 'increase_egg_price',
            multiplier: 1.5,
            durationMinutes: 60
        },
        message: '市场鸡蛋价格上涨50%，持续1小时！'
    },
    {
        id: 'natural_hatch',
        name: '自然孵化',
        icon: '🐣',
        probability: 0.02,
        effect: {
            type: 'free_chicken',
            count: 1,
            chickenType: 'normal'
        },
        message: '惊喜！有一只小鸡自然孵化出来了！'
    }
];

const CHICKEN_STATUS = {
    CHICK: 'chick',
    ADULT: 'adult',
    SENIOR: 'senior'
};

function getChickenTypeById(id) {
    return CHICKEN_TYPES.find(type => type.id === id) || CHICKEN_TYPES[0];
}

function getCoopTypeById(id) {
    return COOP_TYPES.find(type => type.id === id) || COOP_TYPES[0];
}

function getNextCoopType(currentId) {
    const currentIndex = COOP_TYPES.findIndex(type => type.id === currentId);
    if (currentIndex === -1 || currentIndex >= COOP_TYPES.length - 1) {
        return null;
    }
    return COOP_TYPES[currentIndex + 1];
}

function minutesToMs(minutes) {
    return minutes * 60 * 1000;
}

function secondsToMs(seconds) {
    return seconds * 1000;
}

function hoursToMs(hours) {
    return hours * 60 * 60 * 1000;
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟`;
    } else {
        return `${seconds}秒`;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
