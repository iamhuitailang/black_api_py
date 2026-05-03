/**
 * 游戏数据模块
 * 定义所有猫咪、道具、游戏配置等数据
 */

const GameData = {
    /**
     * 猫咪稀有度枚举
     */
    CAT_RARITY: {
        COMMON: 'common',
        RARE: 'rare',
        EPIC: 'epic',
        LEGENDARY: 'legendary'
    },

    /**
     * 稀有度配置
     */
    RARITY_CONFIG: {
        common: {
            name: '普通',
            color: '#9E9E9E',
            bgColor: '#E0E0E0'
        },
        rare: {
            name: '稀有',
            color: '#2196F3',
            bgColor: '#BBDEFB'
        },
        epic: {
            name: '史诗',
            color: '#9C27B0',
            bgColor: '#E1BEE7'
        },
        legendary: {
            name: '传说',
            color: '#FF9800',
            bgColor: '#FFECB3'
        }
    },

    /**
     * 猫咪行为枚举
     */
    CAT_BEHAVIOR: {
        EATING: 'eating',
        PLAYING: 'playing',
        SLEEPING: 'sleeping',
        LEAVING: 'leaving',
        IDLE: 'idle'
    },

    /**
     * 猫咪数据
     * 定义所有可收集的猫咪信息
     */
    CATS: [
        {
            id: 'orange_cat',
            name: '橘猫',
            emoji: '🐱',
            rarity: 'common',
            description: '最常见的可爱橘猫',
            reward: 5,
            stayDuration: 600,
            requirements: {
                items: ['food_bowl']
            },
            colors: {
                body: '#FFA500',
                accent: '#FF8C00',
                eyes: '#333333'
            },
            preferredBehavior: 'eating',
            preferredItem: 'food_bowl'
        },
        {
            id: 'cow_cat',
            name: '奶牛猫',
            emoji: '🐱',
            rarity: 'common',
            description: '黑白相间的可爱奶牛猫',
            reward: 5,
            stayDuration: 600,
            requirements: {
                items: ['food_bowl']
            },
            colors: {
                body: '#FFFFFF',
                accent: '#333333',
                eyes: '#333333'
            },
            preferredBehavior: 'eating',
            preferredItem: 'food_bowl'
        },
        {
            id: 'tabby_cat',
            name: '狸花猫',
            emoji: '🐱',
            rarity: 'common',
            description: '斑纹漂亮的狸花猫',
            reward: 6,
            stayDuration: 720,
            requirements: {
                items: ['food_bowl']
            },
            colors: {
                body: '#8B4513',
                accent: '#A0522D',
                eyes: '#333333'
            },
            preferredBehavior: 'eating',
            preferredItem: 'food_bowl'
        },
        {
            id: 'calico_cat',
            name: '三花猫',
            emoji: '🐱',
            rarity: 'rare',
            description: '三色花纹的稀有猫咪',
            reward: 15,
            stayDuration: 900,
            requirements: {
                items: ['premium_food']
            },
            colors: {
                body: '#FFFFFF',
                accent: '#FFA500',
                patch: '#333333',
                eyes: '#333333'
            },
            preferredBehavior: 'eating',
            preferredItem: 'premium_food'
        },
        {
            id: 'black_cat',
            name: '黑猫',
            emoji: '🐱',
            rarity: 'rare',
            description: '神秘的黑色猫咪',
            reward: 15,
            stayDuration: 900,
            requirements: {
                items: ['premium_food']
            },
            colors: {
                body: '#1a1a1a',
                accent: '#333333',
                eyes: '#FFD700'
            },
            preferredBehavior: 'playing',
            preferredItem: 'premium_food'
        },
        {
            id: 'white_cat',
            name: '白猫',
            emoji: '🐱',
            rarity: 'rare',
            description: '纯白的优雅猫咪',
            reward: 18,
            stayDuration: 900,
            requirements: {
                items: ['yarn_ball']
            },
            colors: {
                body: '#FFFFFF',
                accent: '#EEEEEE',
                eyes: '#00BFFF'
            },
            preferredBehavior: 'playing',
            preferredItem: 'yarn_ball'
        },
        {
            id: 'tiger_cat',
            name: '虎斑猫',
            emoji: '🐱',
            rarity: 'rare',
            description: '威风凛凛的虎斑纹猫咪',
            reward: 20,
            stayDuration: 1080,
            requirements: {
                items: ['cat_tree']
            },
            colors: {
                body: '#D2691E',
                accent: '#8B4513',
                eyes: '#4CAF50'
            },
            preferredBehavior: 'playing',
            preferredItem: 'cat_tree'
        },
        {
            id: 'ragdoll_cat',
            name: '布偶猫',
            emoji: '🐱',
            rarity: 'epic',
            description: '温顺美丽的布偶猫',
            reward: 40,
            stayDuration: 1200,
            requirements: {
                items: ['premium_food', 'cat_bed']
            },
            colors: {
                body: '#FFEFD5',
                accent: '#D2B48C',
                eyes: '#00BFFF'
            },
            preferredBehavior: 'sleeping',
            preferredItem: 'cat_bed'
        },
        {
            id: 'british_cat',
            name: '英短',
            emoji: '🐱',
            rarity: 'epic',
            description: '可爱的英国短毛猫',
            reward: 45,
            stayDuration: 1200,
            requirements: {
                items: ['cat_teaser', 'cat_bed']
            },
            colors: {
                body: '#708090',
                accent: '#4682B4',
                eyes: '#FFD700'
            },
            preferredBehavior: 'playing',
            preferredItem: 'cat_teaser'
        },
        {
            id: 'maine_coon_cat',
            name: '缅因猫',
            emoji: '🐱',
            rarity: 'legendary',
            description: '威武霸气的缅因猫',
            reward: 80,
            stayDuration: 1800,
            requirements: {
                items: ['premium_food', 'yarn_ball', 'cat_tree', 'cat_bed', 'cat_teaser']
            },
            colors: {
                body: '#8B4513',
                accent: '#A0522D',
                eyes: '#4CAF50'
            },
            preferredBehavior: 'playing',
            preferredItem: 'cat_tree'
        },
        {
            id: 'sphynx_cat',
            name: '无毛猫',
            emoji: '🐱',
            rarity: 'legendary',
            description: '独特的无毛猫咪',
            reward: 100,
            stayDuration: 1800,
            requirements: {
                items: ['fish_board', 'premium_food']
            },
            colors: {
                body: '#DEB887',
                accent: '#D2B48C',
                eyes: '#4CAF50'
            },
            preferredBehavior: 'sleeping',
            preferredItem: 'cat_bed'
        }
    ],

    /**
     * 道具数据
     * 定义所有可购买和使用的道具
     */
    ITEMS: [
        {
            id: 'food_bowl',
            name: '普通食盆',
            emoji: '🍚',
            description: '基础食盆，可吸引普通猫咪',
            price: 0,
            isOwned: true,
            category: 'food',
            effects: {
                attractCats: ['orange_cat', 'cow_cat', 'tabby_cat'],
                attractionBoost: 1.0
            },
            unlockRequirement: {
                type: 'none',
                count: 0
            },
            canvasPosition: {
                x: 150,
                y: 300
            },
            size: {
                width: 80,
                height: 40
            }
        },
        {
            id: 'yarn_ball',
            name: '毛线球',
            emoji: '🧶',
            description: '可爱的毛线球，吸引喜欢玩具的猫咪',
            price: 0,
            isOwned: true,
            category: 'toy',
            effects: {
                attractCats: ['white_cat'],
                attractionBoost: 1.2
            },
            unlockRequirement: {
                type: 'none',
                count: 0
            },
            canvasPosition: {
                x: 350,
                y: 250
            },
            size: {
                width: 50,
                height: 50
            }
        },
        {
            id: 'premium_food',
            name: '高级猫粮',
            emoji: '🐣',
            description: '美味的高级猫粮，吸引稀有猫咪',
            price: 500,
            isOwned: false,
            category: 'food',
            effects: {
                attractCats: ['calico_cat', 'black_cat', 'ragdoll_cat'],
                attractionBoost: 1.5
            },
            unlockRequirement: {
                type: 'cats_collected',
                count: 5
            },
            canvasPosition: {
                x: 500,
                y: 300
            },
            size: {
                width: 80,
                height: 40
            }
        },
        {
            id: 'cat_tree',
            name: '猫爬架',
            emoji: '🪵',
            description: '有趣的猫爬架，增加猫咪停留时间+20%',
            price: 800,
            isOwned: false,
            category: 'toy',
            effects: {
                attractCats: ['tiger_cat', 'maine_coon_cat'],
                attractionBoost: 1.3,
                stayBonus: 0.2
            },
            unlockRequirement: {
                type: 'cats_collected',
                count: 8
            },
            canvasPosition: {
                x: 600,
                y: 200
            },
            size: {
                width: 100,
                height: 150
            }
        },
        {
            id: 'cat_teaser',
            name: '逗猫棒',
            emoji: '🎓',
            description: '有趣的逗猫棒，提高稀有猫咪出现率',
            price: 1200,
            isOwned: false,
            category: 'toy',
            effects: {
                attractCats: ['british_cat'],
                rareChanceBoost: 1.5
            },
            unlockRequirement: {
                type: 'cats_collected',
                count: 10
            },
            canvasPosition: {
                x: 250,
                y: 320
            },
            size: {
                width: 60,
                height: 80
            }
        },
        {
            id: 'cat_bed',
            name: '猫窝',
            emoji: '🏠',
            description: '舒适的猫窝，猫咪睡觉时给额外小鱼干',
            price: 2000,
            isOwned: false,
            category: 'furniture',
            effects: {
                attractCats: ['ragdoll_cat', 'british_cat', 'sphynx_cat'],
                sleepBonus: 5,
                attractionBoost: 1.4
            },
            unlockRequirement: {
                type: 'cats_collected',
                count: 12
            },
            canvasPosition: {
                x: 450,
                y: 350
            },
            size: {
                width: 100,
                height: 80
            }
        },
        {
            id: 'fish_board',
            name: '鱼形板',
            emoji: '🎁',
            description: '神奇的鱼形板，所有猫咪收益+20%',
            price: 3000,
            isOwned: false,
            category: 'special',
            effects: {
                attractCats: ['sphynx_cat'],
                rewardBonus: 0.2
            },
            unlockRequirement: {
                type: 'cats_collected',
                count: 15
            },
            canvasPosition: {
                x: 300,
                y: 200
            },
            size: {
                width: 70,
                height: 40
            }
        },
        {
            id: 'catnip',
            name: '猫薄荷',
            emoji: '🌿',
            description: '神秘的猫薄荷，必定吸引1只猫咪',
            price: 5000,
            isOwned: false,
            category: 'special',
            effects: {
                guaranteeCat: true
            },
            unlockRequirement: {
                type: 'cats_collected',
                count: 18
            },
            canvasPosition: {
                x: 550,
                y: 200
            },
            size: {
                width: 50,
                height: 50
            }
        }
    ],

    /**
     * 游戏配置
     */
    GAME_CONFIG: {
        /**
         * 猫咪来访时间配置（秒）
         * 根据已放置道具数量决定
         */
        VISIT_TIME: {
            FOOD_ONLY: {
                min: 15,
                max: 30
            },
            FOOD_AND_TOY: {
                min: 10,
                max: 20
            },
            FULL_SET: {
                min: 5,
                max: 10
            }
        },

        /**
         * 最大同时在场猫咪数量
         */
        MAX_CATS_ON_YARD: 3,

        /**
         * 自动保存间隔（毫秒）
         */
        AUTO_SAVE_INTERVAL: 30000,

        /**
         * 游戏循环更新间隔（毫秒）
         */
        GAME_TICK_INTERVAL: 1000,

        /**
         * Canvas渲染帧率
         */
        CANVAS_FPS: 60,

        /**
         * 猫咪生成概率权重
         */
        CAT_SPAWN_WEIGHTS: {
            common: 60,
            rare: 25,
            epic: 12,
            legendary: 3
        }
    },

    /**
     * 根据ID获取猫咪
     * @param {string} id - 猫咪ID
     * @returns {Object|null} 猫咪对象
     */
    getCatById(id) {
        return this.CATS.find(cat => cat.id === id) || null;
    },

    /**
     * 根据ID获取道具
     * @param {string} id - 道具ID
     * @returns {Object|null} 道具对象
     */
    getItemById(id) {
        return this.ITEMS.find(item => item.id === id) || null;
    },

    /**
     * 根据稀有度获取猫咪列表
     * @param {string} rarity - 稀有度
     * @returns {Array} 猫咪数组
     */
    getCatsByRarity(rarity) {
        if (rarity === 'all') {
            return [...this.CATS];
        }
        return this.CATS.filter(cat => cat.rarity === rarity);
    },

    /**
     * 检查猫咪是否可以被吸引
     * @param {Object} cat - 猫咪对象
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {boolean} 是否可以吸引
     */
    canAttractCat(cat, placedItemIds) {
        if (!cat || !cat.requirements || !cat.requirements.items) {
            return false;
        }
        
        const requiredItems = cat.requirements.items;
        return requiredItems.every(itemId => placedItemIds.includes(itemId));
    },

    /**
     * 计算猫咪生成概率权重
     * @param {Object} cat - 猫咪对象
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {number} 权重值
     */
    getCatSpawnWeight(cat, placedItemIds) {
        const baseWeight = this.GAME_CONFIG.CAT_SPAWN_WEIGHTS[cat.rarity] || 10;
        
        // 检查是否有道具提升该猫咪的吸引率
        let boost = 1.0;
        placedItemIds.forEach(itemId => {
            const item = this.getItemById(itemId);
            if (item && item.effects && item.effects.attractionBoost) {
                if (item.effects.attractCats && item.effects.attractCats.includes(cat.id)) {
                    boost *= item.effects.attractionBoost;
                }
            }
            // 稀有猫咪概率提升
            if (item && item.effects && item.effects.rareChanceBoost) {
                if (cat.rarity !== 'common') {
                    boost *= item.effects.rareChanceBoost;
                }
            }
        });

        return Math.floor(baseWeight * boost);
    },

    /**
     * 获取可吸引的猫咪列表
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {Array} 可吸引的猫咪数组
     */
    getAttractableCats(placedItemIds) {
        return this.CATS.filter(cat => this.canAttractCat(cat, placedItemIds));
    },

    /**
     * 检查道具是否已解锁
     * @param {Object} item - 道具对象
     * @param {number} collectedCount - 已收集猫咪数量
     * @returns {boolean} 是否解锁
     */
    isItemUnlocked(item, collectedCount) {
        if (!item.unlockRequirement) {
            return true;
        }
        
        const req = item.unlockRequirement;
        
        switch (req.type) {
            case 'none':
                return true;
            case 'cats_collected':
                return collectedCount >= req.count;
            default:
                return true;
        }
    },

    /**
     * 计算猫咪实际停留时间
     * @param {Object} cat - 猫咪对象
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {number} 实际停留时间（秒）
     */
    calculateActualStayTime(cat, placedItemIds) {
        let stayTime = cat.stayDuration;
        
        // 检查是否有道具增加停留时间
        placedItemIds.forEach(itemId => {
            const item = this.getItemById(itemId);
            if (item && item.effects && item.effects.stayBonus) {
                stayTime *= (1 + item.effects.stayBonus);
            }
        });

        return Math.floor(stayTime);
    },

    /**
     * 计算猫咪实际奖励
     * @param {Object} cat - 猫咪对象
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @param {string} behavior - 行为类型
     * @returns {number} 实际奖励鱼干数
     */
    calculateActualReward(cat, placedItemIds, behavior) {
        let reward = cat.reward;
        
        // 检查是否有道具增加收益
        placedItemIds.forEach(itemId => {
            const item = this.getItemById(itemId);
            if (item && item.effects && item.effects.rewardBonus) {
                reward *= (1 + item.effects.rewardBonus);
            }
            // 猫窝睡眠额外奖励
            if (item && item.effects && item.effects.sleepBonus && behavior === 'sleeping') {
                reward += item.effects.sleepBonus;
            }
        });

        return Math.floor(reward);
    },

    /**
     * 计算下次猫咪来访时间
     * @param {Array} placedItemIds - 已放置的道具ID数组
     * @returns {number} 来访时间（秒）
     */
    calculateNextVisitTime(placedItemIds) {
        const hasFood = placedItemIds.some(id => {
            const item = this.getItemById(id);
            return item && item.category === 'food';
        });
        
        const hasToy = placedItemIds.some(id => {
            const item = this.getItemById(id);
            return item && (item.category === 'toy' || item.category === 'furniture');
        });
        
        const hasSpecial = placedItemIds.some(id => {
            const item = this.getItemById(id);
            return item && item.category === 'special';
        });

        let timeConfig;
        
        if (hasFood && hasToy && hasSpecial) {
            timeConfig = this.GAME_CONFIG.VISIT_TIME.FULL_SET;
        } else if (hasFood && hasToy) {
            timeConfig = this.GAME_CONFIG.VISIT_TIME.FOOD_AND_TOY;
        } else {
            timeConfig = this.GAME_CONFIG.VISIT_TIME.FOOD_ONLY;
        }

        const seconds = Utils.randomInt(timeConfig.min, timeConfig.max);
        return seconds;
    }
};

// 导出到全局
window.GameData = GameData;
