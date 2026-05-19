export const ORE_TYPES = {
    STONE: {
        id: 'stone',
        name: '石头',
        color: '#8b8b8b',
        borderColor: '#666666',
        price: 1,
        rarity: 0
    },
    IRON: {
        id: 'iron',
        name: '铁矿',
        color: '#a0a0a0',
        borderColor: '#707070',
        price: 5,
        rarity: 1
    },
    COPPER: {
        id: 'copper',
        name: '铜矿',
        color: '#cd7f32',
        borderColor: '#8b5a2b',
        price: 12,
        rarity: 2
    },
    SILVER: {
        id: 'silver',
        name: '银矿',
        color: '#c0c0c0',
        borderColor: '#909090',
        price: 30,
        rarity: 3
    },
    GOLD: {
        id: 'gold',
        name: '金矿',
        color: '#ffd700',
        borderColor: '#daa520',
        price: 80,
        rarity: 4
    },
    DIAMOND: {
        id: 'diamond',
        name: '钻石',
        color: '#b9f2ff',
        borderColor: '#87ceeb',
        price: 200,
        rarity: 5
    },
    RUBY: {
        id: 'ruby',
        name: '红宝石',
        color: '#e0115f',
        borderColor: '#9b0b3f',
        price: 300,
        rarity: 6
    }
};

export const MINE_LAYERS = [
    {
        id: 0,
        name: '浅层矿洞',
        unlockCost: { type: 'none', amount: 0 },
        ores: [
            { type: 'stone', chance: 0.95 },
            { type: 'iron', chance: 0.05 }
        ],
        rareBonus: 0.05,
        bgColor: '#4a3728',
        rockColor: '#5c4033'
    },
    {
        id: 1,
        name: '中层矿道',
        unlockCost: { type: 'gold', amount: 5000 },
        ores: [
            { type: 'iron', chance: 0.88 },
            { type: 'copper', chance: 0.12 }
        ],
        rareBonus: 0.12,
        bgColor: '#3d2b1f',
        rockColor: '#4a3525'
    },
    {
        id: 2,
        name: '深层地底',
        unlockCost: { type: 'copper', amount: 1000 },
        ores: [
            { type: 'copper', chance: 0.80 },
            { type: 'silver', chance: 0.15 },
            { type: 'gold', chance: 0.05 }
        ],
        rareBonus: 0.20,
        bgColor: '#2d1f14',
        rockColor: '#3a2818'
    },
    {
        id: 3,
        name: '熔岩矿脉',
        unlockCost: { type: 'gold', amount: 500 },
        ores: [
            { type: 'gold', chance: 0.65 },
            { type: 'diamond', chance: 0.22 },
            { type: 'ruby', chance: 0.13 }
        ],
        rareBonus: 0.35,
        bgColor: '#4a1c1c',
        rockColor: '#5c2323'
    }
];

export const CHARACTERS = [
    {
        id: 0,
        name: '新手矿工',
        icon: '👷',
        type: 'balanced',
        description: '均衡基础型',
        buff: {
            miningSpeed: 0.10
        },
        buffDesc: '基础挖矿速度+10%'
    },
    {
        id: 1,
        name: '老矿工长',
        icon: '👴',
        type: 'lucky',
        description: '资源收益型',
        buff: {
            rareChance: 0.15
        },
        buffDesc: '矿石掉落概率+15%'
    },
    {
        id: 2,
        name: '机械矿工',
        icon: '🤖',
        type: 'auto',
        description: '极速挂机型',
        buff: {
            autoEfficiency: 0.25
        },
        buffDesc: '自动挖矿效率+25%'
    }
];

export const UPGRADES = {
    pickaxe: {
        id: 'pickaxe',
        name: '镐子等级',
        description: '提升挖矿伤害',
        baseCost: 10,
        costMultiplier: 1.5,
        maxLevel: 100,
        effect: (level) => 1 + level * 0.2,
        icon: '⛏️'
    },
    backpack: {
        id: 'backpack',
        name: '背包容量',
        description: '增加背包容量',
        baseCost: 50,
        costMultiplier: 1.8,
        maxLevel: 50,
        effect: (level) => 20 + level * 15,
        icon: '🎒'
    },
    efficiency: {
        id: 'efficiency',
        name: '挖矿效率',
        description: '提升挖矿速度',
        baseCost: 100,
        costMultiplier: 2.0,
        maxLevel: 30,
        effect: (level) => 1 + level * 0.15,
        icon: '⚡'
    },
    sellLevel: {
        id: 'sellLevel',
        name: '售卖等级',
        description: '提升矿石售价',
        baseCost: 200,
        costMultiplier: 2.2,
        maxLevel: 25,
        effect: (level) => 1 + level * 0.1,
        icon: '💰'
    },
    autoMiner: {
        id: 'autoMiner',
        name: '自动矿工',
        description: '招募自动矿工',
        baseCost: 1000,
        costMultiplier: 3.0,
        maxLevel: 10,
        effect: (level) => level,
        icon: '👷‍♂️'
    }
};

export const AUTO_MINER_STATUS = {
    IDLE: 'idle',
    MINING: 'mining',
    FULL: 'full',
    SELLING: 'selling'
};

export const GAME_STATUS = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused'
};

export const CANVAS_CONFIG = {
    width: 900,
    height: 600,
    mineArea: { x: 200, y: 50, width: 500, height: 400 },
    uiPanelWidth: 200
};

export const STORAGE_KEY = 'kuanggong_save_v1';
