const GameData = {
    elements: {
        FIRE: 'fire',
        WATER: 'water',
        THUNDER: 'thunder',
        EARTH: 'earth'
    },

    elementIcons: {
        fire: '🔥',
        water: '💧',
        thunder: '⚡',
        earth: '🪨'
    },

    elementNames: {
        fire: '火',
        water: '水',
        thunder: '雷',
        earth: '土'
    },

    elementAdvantage: {
        fire: { fire: 1.0, water: 0.5, thunder: 1.0, earth: 1.5 },
        water: { fire: 1.5, water: 1.0, thunder: 1.0, earth: 0.5 },
        thunder: { fire: 1.0, water: 1.5, thunder: 1.0, earth: 1.0 },
        earth: { fire: 0.5, water: 1.0, thunder: 1.5, earth: 1.0 }
    },

    mages: [
        {
            id: 'fire_mage',
            name: '炎术士',
            element: 'fire',
            maxHealth: 80,
            maxMana: 100,
            spells: ['fireball', 'flame_storm'],
            unlocked: true,
            cost: 0,
            description: '精通火焰法术的法师，擅长造成高额伤害'
        },
        {
            id: 'water_mage',
            name: '水灵使',
            element: 'water',
            maxHealth: 90,
            maxMana: 110,
            spells: ['water_arrow', 'healing_rain'],
            unlocked: true,
            cost: 0,
            description: '掌控水元素的法师，具备治疗能力'
        },
        {
            id: 'thunder_mage',
            name: '雷法师',
            element: 'thunder',
            maxHealth: 70,
            maxMana: 120,
            spells: ['lightning_chain', 'thunder_storm'],
            unlocked: false,
            cost: 100,
            description: '驾驭雷电的法师，拥有强大的攻击能力'
        },
        {
            id: 'earth_mage',
            name: '地卜师',
            element: 'earth',
            maxHealth: 100,
            maxMana: 90,
            spells: ['rock_throw', 'earth_shield'],
            unlocked: false,
            cost: 100,
            description: '操控大地的法师，防御能力出众'
        }
    ],

    spells: {
        fireball: {
            id: 'fireball',
            name: '火球术',
            element: 'fire',
            cost: 20,
            type: 'single',
            minDamage: 30,
            maxDamage: 50,
            unlockLevel: 1,
            description: '单体 30-50 伤害'
        },
        flame_storm: {
            id: 'flame_storm',
            name: '烈焰风暴',
            element: 'fire',
            cost: 40,
            type: 'aoe',
            minDamage: 25,
            maxDamage: 40,
            unlockLevel: 3,
            description: '全体 25-40 伤害'
        },
        water_arrow: {
            id: 'water_arrow',
            name: '水箭',
            element: 'water',
            cost: 20,
            type: 'single',
            minDamage: 25,
            maxDamage: 45,
            unlockLevel: 1,
            description: '单体 25-45 伤害'
        },
        healing_rain: {
            id: 'healing_rain',
            name: '治疗之雨',
            element: 'water',
            cost: 35,
            type: 'heal',
            minHeal: 30,
            maxHeal: 50,
            unlockLevel: 2,
            description: '回复 30-50 生命'
        },
        lightning_chain: {
            id: 'lightning_chain',
            name: '闪电链',
            element: 'thunder',
            cost: 25,
            type: 'chain',
            bounces: 3,
            minDamage: 20,
            maxDamage: 35,
            unlockLevel: 1,
            description: '弹射 3 次，每次 20-35'
        },
        thunder_storm: {
            id: 'thunder_storm',
            name: '雷暴',
            element: 'thunder',
            cost: 45,
            type: 'aoe',
            minDamage: 35,
            maxDamage: 55,
            unlockLevel: 3,
            description: '全体 35-55 伤害'
        },
        rock_throw: {
            id: 'rock_throw',
            name: '岩石投掷',
            element: 'earth',
            cost: 20,
            type: 'single',
            minDamage: 30,
            maxDamage: 45,
            unlockLevel: 1,
            description: '单体 30-45 伤害'
        },
        earth_shield: {
            id: 'earth_shield',
            name: '大地护盾',
            element: 'earth',
            cost: 30,
            type: 'shield',
            armor: 15,
            duration: 3,
            unlockLevel: 2,
            description: '增加护甲 15，持续 3 回合'
        }
    },

    enemies: {
        normal: [
            {
                id: 'fire_spirit',
                name: '火精灵',
                element: 'fire',
                maxHealth: 60,
                attack: 15,
                spells: ['fireball'],
                goldReward: 50,
                expReward: 30
            },
            {
                id: 'water_elemental',
                name: '水元素',
                element: 'water',
                maxHealth: 70,
                attack: 12,
                spells: ['water_arrow'],
                goldReward: 50,
                expReward: 30
            },
            {
                id: 'thunder_beast',
                name: '雷兽',
                element: 'thunder',
                maxHealth: 50,
                attack: 18,
                spells: ['lightning_chain'],
                goldReward: 50,
                expReward: 30
            },
            {
                id: 'rock_golem',
                name: '巨岩怪',
                element: 'earth',
                maxHealth: 80,
                attack: 10,
                spells: ['rock_throw'],
                goldReward: 50,
                expReward: 30
            }
        ],
        boss: [
            {
                id: 'fire_dragon',
                name: '炎龙',
                element: 'fire',
                maxHealth: 200,
                attack: 25,
                spells: ['fireball', 'flame_storm'],
                goldReward: 500,
                expReward: 200,
                isBoss: true
            },
            {
                id: 'sea_emperor',
                name: '海皇',
                element: 'water',
                maxHealth: 250,
                attack: 20,
                spells: ['water_arrow', 'healing_rain'],
                goldReward: 500,
                expReward: 200,
                isBoss: true
            }
        ]
    },

    spellUpgradeLevels: [
        { level: 1, cost: 0, multiplier: 1.0 },
        { level: 2, cost: 100, multiplier: 1.2 },
        { level: 3, cost: 250, multiplier: 1.4 },
        { level: 4, cost: 500, multiplier: 1.6 }
    ],

    levelExpRequirements: [
        0,
        100,
        250,
        500,
        1000,
        2000
    ],

    getSpellDamage: function(spellId, spellLevel, attackerElement, defenderElement) {
        const spell = this.spells[spellId];
        if (!spell) return 0;

        const upgrade = this.spellUpgradeLevels[spellLevel - 1] || this.spellUpgradeLevels[0];
        const baseDamage = Math.floor(Math.random() * (spell.maxDamage - spell.minDamage + 1)) + spell.minDamage;
        const elementMultiplier = this.elementAdvantage[attackerElement][defenderElement];
        
        return Math.floor(baseDamage * upgrade.multiplier * elementMultiplier);
    },

    getSpellHeal: function(spellId, spellLevel) {
        const spell = this.spells[spellId];
        if (!spell || spell.type !== 'heal') return 0;

        const upgrade = this.spellUpgradeLevels[spellLevel - 1] || this.spellUpgradeLevels[0];
        const baseHeal = Math.floor(Math.random() * (spell.maxHeal - spell.minHeal + 1)) + spell.minHeal;
        
        return Math.floor(baseHeal * upgrade.multiplier);
    },

    getExpForLevel: function(level) {
        if (level >= this.levelExpRequirements.length) {
            return this.levelExpRequirements[this.levelExpRequirements.length - 1] * 2;
        }
        return this.levelExpRequirements[level];
    },

    getRandomEnemy: function(bossChance = 0.1) {
        if (Math.random() < bossChance) {
            const bossIndex = Math.floor(Math.random() * this.enemies.boss.length);
            return { ...this.enemies.boss[bossIndex] };
        }
        const normalIndex = Math.floor(Math.random() * this.enemies.normal.length);
        return { ...this.enemies.normal[normalIndex] };
    }
};