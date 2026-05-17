const GameData = {
    characters: {
        forest: {
            id: 'forest',
            name: '林间学徒',
            icon: '🧝',
            description: '均衡型 · 稳定成功率',
            talent: '天赋：普通药水小幅暴击加成',
            stats: {
                successRate: 100,
                heatTolerance: 5,
                materialLossRate: 12,
                expBonus: 1.0,
                critChance: 0.25
            }
        },
        flame: {
            id: 'flame',
            name: '烈焰学徒',
            icon: '🧙',
            description: '技巧型 · 擅长火候把控',
            talent: '天赋：火候失误容错率提升',
            stats: {
                successRate: 95,
                heatTolerance: 8,
                materialLossRate: 14,
                expBonus: 1.0,
                critChance: 0.22
            }
        },
        star: {
            id: 'star',
            name: '星光学徒',
            icon: '🧚',
            description: '幸运型 · 稀有产出更高',
            talent: '天赋：高阶配方保底触发',
            stats: {
                successRate: 90,
                heatTolerance: 4,
                materialLossRate: 10,
                expBonus: 1.2,
                critChance: 0.28
            }
        }
    },

    materials: {
        herb: {
            id: 'herb',
            name: '草药花瓣',
            icon: '🌸',
            baseScore: 8,
            dropTime: 0.05,
            weight: 'basic',
            color: '#f472b6',
            startCount: 50
        },
        crystal: {
            id: 'crystal',
            name: '魔晶粉末',
            icon: '💎',
            baseScore: 14,
            dropTime: 0.12,
            weight: 'advanced',
            color: '#818cf8',
            startCount: 30
        },
        moondew: {
            id: 'moondew',
            name: '月光露水',
            icon: '💧',
            baseScore: 7,
            dropTime: 0.07,
            weight: 'support',
            color: '#67e8f9',
            startCount: 40
        },
        dragonscale: {
            id: 'dragonscale',
            name: '龙之鳞片',
            icon: '🐉',
            baseScore: 15,
            dropTime: 0.15,
            weight: 'rare',
            color: '#f97316',
            startCount: 15
        },
        starflower: {
            id: 'starflower',
            name: '星辰花',
            icon: '✨',
            baseScore: 12,
            dropTime: 0.10,
            weight: 'advanced',
            color: '#fbbf24',
            startCount: 20
        },
        shadowdust: {
            id: 'shadowdust',
            name: '暗影尘埃',
            icon: '🌑',
            baseScore: 13,
            dropTime: 0.11,
            weight: 'advanced',
            color: '#6b7280',
            startCount: 18
        },
        fireessence: {
            id: 'fireessence',
            name: '火焰精华',
            icon: '🔥',
            baseScore: 16,
            dropTime: 0.14,
            weight: 'rare',
            color: '#ef4444',
            startCount: 12
        },
        icecrystal: {
            id: 'icecrystal',
            name: '冰晶碎片',
            icon: '❄️',
            baseScore: 11,
            dropTime: 0.09,
            weight: 'support',
            color: '#a5f3fc',
            startCount: 25
        }
    },

    recipes: [
        {
            id: 'health_potion',
            name: '生命药水',
            icon: '❤️',
            description: '恢复生命力的基础药水',
            ingredients: ['herb', 'herb', 'moondew'],
            idealHeat: 40,
            idealStirs: 3,
            requiredLevel: 1,
            value: 50,
            exp: 30,
            tier: 1
        },
        {
            id: 'mana_potion',
            name: '魔力药水',
            icon: '💙',
            description: '恢复魔力的基础药水',
            ingredients: ['crystal', 'moondew', 'herb'],
            idealHeat: 50,
            idealStirs: 4,
            requiredLevel: 1,
            value: 60,
            exp: 35,
            tier: 1
        },
        {
            id: 'strength_potion',
            name: '力量药水',
            icon: '💪',
            description: '暂时提升力量的药水',
            ingredients: ['dragonscale', 'fireessence', 'herb'],
            idealHeat: 70,
            idealStirs: 5,
            requiredLevel: 3,
            value: 120,
            exp: 80,
            tier: 2
        },
        {
            id: 'speed_potion',
            name: '迅捷药水',
            icon: '⚡',
            description: '提升移动速度的药水',
            ingredients: ['starflower', 'icecrystal', 'moondew'],
            idealHeat: 35,
            idealStirs: 6,
            requiredLevel: 3,
            value: 110,
            exp: 75,
            tier: 2
        },
        {
            id: 'invisibility_potion',
            name: '隐身药水',
            icon: '👻',
            description: '短时间内隐形的神奇药水',
            ingredients: ['shadowdust', 'moondew', 'crystal', 'icecrystal'],
            idealHeat: 45,
            idealStirs: 7,
            requiredLevel: 5,
            value: 200,
            exp: 150,
            tier: 3
        },
        {
            id: 'phoenix_tear',
            name: '凤凰之泪',
            icon: '🔥',
            description: '传说中的复活药水',
            ingredients: ['fireessence', 'dragonscale', 'starflower', 'crystal'],
            idealHeat: 80,
            idealStirs: 8,
            requiredLevel: 7,
            value: 500,
            exp: 400,
            tier: 4
        },
        {
            id: 'elixir_of_life',
            name: '生命精华',
            icon: '🌟',
            description: '蕴含无尽生命力的终极药剂',
            ingredients: ['herb', 'moondew', 'starflower', 'crystal', 'dragonscale'],
            idealHeat: 60,
            idealStirs: 10,
            requiredLevel: 10,
            value: 1000,
            exp: 800,
            tier: 5
        }
    ],

    failureTypes: {
        wrong_materials: {
            name: '材料错配',
            delay: 0.2,
            materialLoss: 10
        },
        heat_control: {
            name: '火候失控',
            delay: 0.35,
            materialLoss: 20
        },
        high_tier_failure: {
            name: '高阶炼制失败',
            delay: 0.5,
            materialLoss: 30
        }
    },

    npcTips: [
        '选择合适的材料组合是成功的第一步哦~',
        '火候控制很重要，要根据配方调整哦！',
        '搅拌次数也会影响炼制结果呢！',
        '材料越多不一定越好，精准的配方才是关键~',
        '升级后会解锁更多高级配方哦！',
        '不同的学徒有不同的天赋，选择适合你的吧~',
        '稀有材料虽然难获得，但能炼出更好的药水！',
        '炼制失败不要灰心，多尝试几次就会成功的~',
        '火候太高会烧焦材料，太低则无法激发魔力~',
        '合理利用暴击产出，可以获得更多药水哦！'
    ],

    levelExp: [
        0,
        100,
        250,
        450,
        700,
        1000,
        1400,
        1900,
        2500,
        3200,
        4000
    ],

    getLevelExp: function(level) {
        if (level >= this.levelExp.length) {
            return this.levelExp[this.levelExp.length - 1] + (level - this.levelExp.length + 1) * 1000;
        }
        return this.levelExp[level];
    },

    getMaterialById: function(id) {
        return this.materials[id];
    },

    getCharacterById: function(id) {
        return this.characters[id];
    },

    getRecipeById: function(id) {
        return this.recipes.find(r => r.id === id);
    }
};
