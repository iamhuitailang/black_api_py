const GameConfig = {
    businesses: [
        {
            id: 1,
            name: '柠檬水摊',
            emoji: '🍋',
            baseCost: 10,
            baseIncome: 1,
            cycleTime: 1000,
            unlockCondition: null,
            description: '初始业务，从一杯柠檬水开始'
        },
        {
            id: 2,
            name: '汉堡车',
            emoji: '🍔',
            baseCost: 100,
            baseIncome: 8,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 500 },
            description: '收入达到 500 解锁'
        },
        {
            id: 3,
            name: '披萨店',
            emoji: '🍕',
            baseCost: 1000,
            baseIncome: 47,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 5000 },
            description: '收入达到 5,000 解锁'
        },
        {
            id: 4,
            name: '咖啡厅',
            emoji: '☕',
            baseCost: 10000,
            baseIncome: 260,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 50000 },
            description: '收入达到 50,000 解锁'
        },
        {
            id: 5,
            name: '便利店',
            emoji: '🏪',
            baseCost: 100000,
            baseIncome: 1400,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 500000 },
            description: '收入达到 500,000 解锁'
        },
        {
            id: 6,
            name: '游戏厅',
            emoji: '🎮',
            baseCost: 1000000,
            baseIncome: 7800,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 5000000 },
            description: '收入达到 5,000,000 解锁'
        },
        {
            id: 7,
            name: '酒店',
            emoji: '🏨',
            baseCost: 10000000,
            baseIncome: 43000,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 50000000 },
            description: '收入达到 50,000,000 解锁'
        },
        {
            id: 8,
            name: '工厂',
            emoji: '🏭',
            baseCost: 100000000,
            baseIncome: 240000,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 500000000 },
            description: '收入达到 500,000,000 解锁'
        },
        {
            id: 9,
            name: '科技公司',
            emoji: '🚀',
            baseCost: 1000000000,
            baseIncome: 1300000,
            cycleTime: 1000,
            unlockCondition: { type: 'income', value: 5000000000 },
            description: '收入达到 5,000,000,000 解锁'
        }
    ],

    managers: [
        {
            id: 1,
            name: '实习生',
            emoji: '👨‍💼',
            cost: 100,
            effect: 'autoCollect',
            requirement: { businessLevel: 3 },
            description: '自动收钱，业务等级达到 3 级可雇佣'
        },
        {
            id: 2,
            name: '主管',
            emoji: '👩‍💼',
            cost: 10000,
            effect: 'autoUpgrade',
            requirement: { businessLevel: 10 },
            description: '自动升级，业务等级达到 10 级可雇佣'
        },
        {
            id: 3,
            name: '总监',
            emoji: '👨',
            cost: 100000,
            effect: 'doubleIncome',
            requirement: { businessLevel: 20 },
            description: '产出 ×2，业务等级达到 20 级可雇佣'
        }
    ],

    upgrades: [
        { level: 2, incomeMultiplier: 2, costMultiplier: 2 },
        { level: 3, incomeMultiplier: 2, costMultiplier: 4 },
        { level: 4, incomeMultiplier: 2, costMultiplier: 8 },
        { level: 5, incomeMultiplier: 2, costMultiplier: 16 },
        { level: 6, incomeMultiplier: 2, costMultiplier: 32 }
    ],

    prestige: {
        basePrestigePoints: 1,
        prestigeMultiplier: 1.5,
        incomeBonusPerPoint: 0.05,
        unlockCondition: { type: 'totalEarnings', value: 1000000 },
        description: '总收益达到 1,000,000 可转生'
    },

    click: {
        baseClickIncome: 1,
        clickMultiplier: 1
    },

    storage: {
        key: 'guaji_game_save',
        version: '1.0.0'
    },

    themes: {
        light: {
            background: '#F5F0E6',
            primary: '#8B7355',
            secondary: '#D4C4A8',
            accent: '#C4A35A',
            text: '#4A4A4A',
            highlight: '#E8DCC8'
        },
        dark: {
            background: '#2C2C2C',
            primary: '#5C5C5C',
            secondary: '#4A4A4A',
            accent: '#C4A35A',
            text: '#E8E8E8',
            highlight: '#3A3A3A'
        }
    },

    formatNumber(num) {
        if (num < 1000) return Math.floor(num).toString();
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const magnitude = Math.floor(Math.log10(num) / 3);
        const scaled = num / Math.pow(1000, magnitude);
        return scaled.toFixed(1).replace(/\.0$/, '') + suffixes[magnitude];
    },

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return seconds + 's';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm';
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h';
        const days = Math.floor(hours / 24);
        return days + 'd';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
