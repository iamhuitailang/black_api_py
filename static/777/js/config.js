/**
 * 幸运777老虎机游戏 - 配置模块
 * 负责存储游戏的所有配置数据，包括图案、概率、奖励规则等
 */

const GameConfig = (function() {
    'use strict';

    /**
     * 老虎机图案配置
     * 每个图案包含：
     * - emoji: 显示的emoji符号
     * - name: 图案名称
     * - multiplier: 基础倍数（三个相同时的奖励倍数）
     * - probability: 出现概率（百分比）
     */
    const SYMBOLS = [
        {
            id: 'cherry',
            emoji: '🍒',
            name: '樱桃',
            multiplier: 5,
            probability: 28
        },
        {
            id: 'orange',
            emoji: '🍊',
            name: '橙子',
            multiplier: 10,
            probability: 24
        },
        {
            id: 'lemon',
            emoji: '🍋',
            name: '柠檬',
            multiplier: 15,
            probability: 16
        },
        {
            id: 'apple',
            emoji: '🍎',
            name: '苹果',
            multiplier: 20,
            probability: 12
        },
        {
            id: 'star',
            emoji: '⭐',
            name: '星星',
            multiplier: 50,
            probability: 8
        },
        {
            id: 'bell',
            emoji: '🔔',
            name: '铃铛',
            multiplier: 80,
            probability: 6
        },
        {
            id: 'diamond',
            emoji: '💎',
            name: '钻石',
            multiplier: 100,
            probability: 4
        },
        {
            id: 'seven',
            emoji: '💰',
            name: '7',
            multiplier: 200,
            probability: 2
        }
    ];

    /**
     * 特殊组合配置
     * 定义除了三个相同图案之外的特殊中奖组合
     * 每个组合包含：
     * - name: 组合名称
     * - pattern: 组合模式（使用图案id数组，'*'表示任意）
     * - multiplier: 奖励倍数
     * - description: 描述
     */
    const SPECIAL_COMBINATIONS = [
        {
            name: '大奖777',
            pattern: ['seven', 'seven', 'seven'],
            multiplier: 200,
            description: '7-7-7 超级大奖',
            priority: 10
        },
        {
            name: '钻石三连',
            pattern: ['diamond', 'diamond', 'diamond'],
            multiplier: 100,
            description: '钻石三连',
            priority: 9
        },
        {
            name: '铃铛三连',
            pattern: ['bell', 'bell', 'bell'],
            multiplier: 80,
            description: '铃铛三连',
            priority: 8
        },
        {
            name: '星星三连',
            pattern: ['star', 'star', 'star'],
            multiplier: 50,
            description: '星星三连',
            priority: 7
        },
        {
            name: '苹果三连',
            pattern: ['apple', 'apple', 'apple'],
            multiplier: 20,
            description: '苹果三连',
            priority: 6
        },
        {
            name: '柠檬三连',
            pattern: ['lemon', 'lemon', 'lemon'],
            multiplier: 15,
            description: '柠檬三连',
            priority: 5
        },
        {
            name: '橙子三连',
            pattern: ['orange', 'orange', 'orange'],
            multiplier: 10,
            description: '橙子三连',
            priority: 4
        },
        {
            name: '三樱桃',
            pattern: ['cherry', 'cherry', 'cherry'],
            multiplier: 5,
            description: '樱桃三连',
            priority: 3
        },
        {
            name: '两樱桃',
            pattern: ['cherry', 'cherry', '*'],
            multiplier: 2,
            description: '两个樱桃',
            priority: 2
        },
        {
            name: '两樱桃（顺序2）',
            pattern: ['cherry', '*', 'cherry'],
            multiplier: 2,
            description: '两个樱桃',
            priority: 2
        },
        {
            name: '两樱桃（顺序3）',
            pattern: ['*', 'cherry', 'cherry'],
            multiplier: 2,
            description: '两个樱桃',
            priority: 2
        },
        {
            name: '一个樱桃',
            pattern: ['cherry', '*', '*'],
            multiplier: 1,
            description: '一个樱桃（保本）',
            priority: 1
        },
        {
            name: '一个樱桃（顺序2）',
            pattern: ['*', 'cherry', '*'],
            multiplier: 1,
            description: '一个樱桃（保本）',
            priority: 1
        },
        {
            name: '一个樱桃（顺序3）',
            pattern: ['*', '*', 'cherry'],
            multiplier: 1,
            description: '一个樱桃（保本）',
            priority: 1
        }
    ];

    /**
     * 下注选项配置
     */
    const BET_OPTIONS = [10, 50, 100];

    /**
     * 游戏默认状态配置
     */
    const DEFAULT_STATE = {
        coins: 1000,
        currentBet: 10,
        maxWin: 0,
        winCount: 0,
        totalSpins: 0,
        isPlaying: false,
        isPaused: false,
        currentReels: [0, 0, 0]
    };

    /**
     * 动画时间配置（毫秒）
     */
    const ANIMATION_TIMING = {
        FAST_SPIN_DURATION: 500,
        REEL1_STOP_DELAY: 500,
        REEL2_STOP_DELAY: 800,
        REEL3_STOP_DELAY: 1100,
        SLOW_SPIN_DURATION: 300,
        WIN_ANIMATION_DURATION: 2000
    };

    /**
     * localStorage 存储键名
     */
    const STORAGE_KEYS = {
        GAME_STATE: 'lucky777_game_state',
        SETTINGS: 'lucky777_settings'
    };

    /**
     * 根据概率随机选择一个图案
     * @returns {Object} 选中的图案对象
     */
    function getRandomSymbol() {
        const totalProbability = SYMBOLS.reduce((sum, symbol) => sum + symbol.probability, 0);
        let random = Math.random() * totalProbability;

        for (const symbol of SYMBOLS) {
            random -= symbol.probability;
            if (random <= 0) {
                return symbol;
            }
        }

        return SYMBOLS[0];
    }

    /**
     * 根据图案id获取图案对象
     * @param {string} id - 图案id
     * @returns {Object|null} 图案对象或null
     */
    function getSymbolById(id) {
        return SYMBOLS.find(symbol => symbol.id === id) || null;
    }

    /**
     * 根据图案索引获取图案对象
     * @param {number} index - 图案索引
     * @returns {Object|null} 图案对象或null
     */
    function getSymbolByIndex(index) {
        return SYMBOLS[index] || null;
    }

    /**
     * 检查三个图案是否匹配某个特殊组合
     * @param {Array} symbolIds - 三个图案的id数组
     * @returns {Object|null} 匹配的特殊组合（优先级最高的）或null
     */
    function checkSpecialCombination(symbolIds) {
        const matchedCombos = [];

        for (const combo of SPECIAL_COMBINATIONS) {
            let match = true;
            for (let i = 0; i < 3; i++) {
                if (combo.pattern[i] !== '*' && combo.pattern[i] !== symbolIds[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                matchedCombos.push(combo);
            }
        }

        if (matchedCombos.length === 0) {
            return null;
        }

        matchedCombos.sort((a, b) => b.priority - a.priority);

        return matchedCombos[0];
    }

    /**
     * 检查是否有任意两个相同的图案
     * @param {Array} symbolIds - 三个图案的id数组
     * @returns {Object|null} 匹配信息或null
     */
    function checkTwoOfAKind(symbolIds) {
        const counts = {};
        for (const id of symbolIds) {
            counts[id] = (counts[id] || 0) + 1;
        }

        for (const [id, count] of Object.entries(counts)) {
            if (count >= 2) {
                const symbol = getSymbolById(id);
                return {
                    name: '两相同',
                    symbol: symbol,
                    multiplier: 1,
                    description: `两个${symbol?.name || id}（保本）`
                };
            }
        }

        return null;
    }

    /**
     * 检查三个图案是否全部相同
     * @param {Array} symbolIds - 三个图案的id数组
     * @returns {boolean} 是否全部相同
     */
    function isThreeOfAKind(symbolIds) {
        return symbolIds[0] === symbolIds[1] && symbolIds[1] === symbolIds[2];
    }

    /**
     * 计算奖励
     * @param {Array} symbolIds - 三个图案的id数组
     * @param {number} bet - 下注金额
     * @returns {Object} 奖励信息 { winAmount, multiplier, isWin, description }
     */
    function calculateWin(symbolIds, bet) {
        const specialCombo = checkSpecialCombination(symbolIds);

        if (specialCombo) {
            return {
                winAmount: bet * specialCombo.multiplier,
                multiplier: specialCombo.multiplier,
                isWin: true,
                description: specialCombo.description,
                isJackpot: specialCombo.name === '大奖777',
                isSmallWin: specialCombo.priority <= 2
            };
        }

        if (isThreeOfAKind(symbolIds)) {
            const symbol = getSymbolById(symbolIds[0]);
            if (symbol) {
                return {
                    winAmount: bet * symbol.multiplier,
                    multiplier: symbol.multiplier,
                    isWin: true,
                    description: `${symbol.name}三连`,
                    isJackpot: symbol.id === 'seven',
                    isSmallWin: false
                };
            }
        }

        const twoOfAKind = checkTwoOfAKind(symbolIds);
        if (twoOfAKind) {
            return {
                winAmount: bet * twoOfAKind.multiplier,
                multiplier: twoOfAKind.multiplier,
                isWin: true,
                description: twoOfAKind.description,
                isJackpot: false,
                isSmallWin: true
            };
        }

        return {
            winAmount: 0,
            multiplier: 0,
            isWin: false,
            description: '未中奖',
            isJackpot: false,
            isSmallWin: false
        };
    }

    /**
     * 生成三个随机图案的索引
     * @returns {Array} 三个图案的索引数组
     */
    function generateRandomReels() {
        const reels = [];
        for (let i = 0; i < 3; i++) {
            const symbol = getRandomSymbol();
            reels.push(SYMBOLS.indexOf(symbol));
        }
        return reels;
    }

    return {
        SYMBOLS,
        SPECIAL_COMBINATIONS,
        BET_OPTIONS,
        DEFAULT_STATE,
        ANIMATION_TIMING,
        STORAGE_KEYS,
        getRandomSymbol,
        getSymbolById,
        getSymbolByIndex,
        checkSpecialCombination,
        checkTwoOfAKind,
        isThreeOfAKind,
        calculateWin,
        generateRandomReels
    };
})();

window.GameConfig = GameConfig;
