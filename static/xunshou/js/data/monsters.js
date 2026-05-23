const MonsterData = {
    types: {
        FIRE: 'fire',
        WATER: 'water',
        GRASS: 'grass',
        THUNDER: 'thunder'
    },

    typeNames: {
        fire: '火系',
        water: '水系',
        grass: '草系',
        thunder: '雷系'
    },

    typeColors: {
        fire: '#FF6B6B',
        water: '#4ECDC4',
        grass: '#95E679',
        thunder: '#FFE66D'
    },

    typeAdvantage: {
        fire: 'grass',
        water: 'fire',
        grass: 'thunder',
        thunder: 'water'
    },

    rarities: {
        COMMON: {
            id: 'common',
            name: '普通',
            color: '#9E9E9E',
            multiplier: 1.0,
            catchRate: 0.6
        },
        RARE: {
            id: 'rare',
            name: '稀有',
            color: '#2196F3',
            multiplier: 1.3,
            catchRate: 0.35
        },
        EPIC: {
            id: 'epic',
            name: '史诗',
            color: '#9C27B0',
            multiplier: 1.6,
            catchRate: 0.15
        },
        LEGENDARY: {
            id: 'legendary',
            name: '传说',
            color: '#FF9800',
            multiplier: 2.0,
            catchRate: 0.05
        }
    },

    monsters: [
        {
            id: 'fire_fox',
            name: '火狐',
            type: 'fire',
            rarity: 'common',
            baseStats: { hp: 80, atk: 25, def: 15, spd: 20 },
            skills: ['tackle', 'fire_ball', 'defense'],
            ultimate: 'flame_burst',
            description: '机灵的小狐狸，尾巴上燃烧着温暖的火焰',
            evolution: { to: 'fire_fox_ii', level: 5 },
            emoji: '🦊'
        },
        {
            id: 'fire_fox_ii',
            name: '烈焰狐',
            type: 'fire',
            rarity: 'rare',
            baseStats: { hp: 120, atk: 40, def: 25, spd: 28 },
            skills: ['tackle', 'fire_ball', 'flame_wave', 'defense'],
            ultimate: 'inferno',
            description: '进化后的火狐，火焰更加炽烈',
            emoji: '🦊'
        },
        {
            id: 'water_turtle',
            name: '水龟',
            type: 'water',
            rarity: 'common',
            baseStats: { hp: 100, atk: 18, def: 25, spd: 10 },
            skills: ['tackle', 'water_gun', 'defense'],
            ultimate: 'aqua_shield',
            description: '背着龟壳的小水龟，防御坚固',
            evolution: { to: 'water_turtle_ii', level: 5 },
            emoji: '🐢'
        },
        {
            id: 'water_turtle_ii',
            name: '深海龟',
            type: 'water',
            rarity: 'rare',
            baseStats: { hp: 150, atk: 28, def: 40, spd: 15 },
            skills: ['tackle', 'water_gun', 'tsunami', 'defense'],
            ultimate: 'tidal_wave',
            description: '来自深海的神秘龟，水系能量强大',
            emoji: '🐢'
        },
        {
            id: 'grass_bunny',
            name: '草兔',
            type: 'grass',
            rarity: 'common',
            baseStats: { hp: 75, atk: 22, def: 18, spd: 25 },
            skills: ['tackle', 'leaf_blade', 'heal'],
            ultimate: 'nature_blessing',
            description: '跳跃于草丛间的小兔子，与自然和谐共处',
            evolution: { to: 'grass_bunny_ii', level: 5 },
            emoji: '🐰'
        },
        {
            id: 'grass_bunny_ii',
            name: '森灵兔',
            type: 'grass',
            rarity: 'rare',
            baseStats: { hp: 110, atk: 35, def: 30, spd: 32 },
            skills: ['tackle', 'leaf_blade', 'vine_whip', 'heal'],
            ultimate: 'forest_wrath',
            description: '森林的守护者，拥有治愈之力',
            emoji: '🐰'
        },
        {
            id: 'thunder_mouse',
            name: '雷鼠',
            type: 'thunder',
            rarity: 'common',
            baseStats: { hp: 70, atk: 28, def: 12, spd: 30 },
            skills: ['tackle', 'thunder_shock', 'defense'],
            ultimate: 'thunder_storm',
            description: '全身带电的小老鼠，速度极快',
            evolution: { to: 'thunder_mouse_ii', level: 5 },
            emoji: '🐭'
        },
        {
            id: 'thunder_mouse_ii',
            name: '雷霆鼠',
            type: 'thunder',
            rarity: 'rare',
            baseStats: { hp: 105, atk: 42, def: 20, spd: 38 },
            skills: ['tackle', 'thunder_shock', 'thunder_bolt', 'defense'],
            ultimate: 'lightning_strike',
            description: '雷电之力觉醒，速度更加惊人',
            emoji: '🐭'
        },
        {
            id: 'fire_dragon',
            name: '炎龙',
            type: 'fire',
            rarity: 'epic',
            baseStats: { hp: 180, atk: 55, def: 40, spd: 35 },
            skills: ['tackle', 'fire_ball', 'flame_wave', 'defense'],
            ultimate: 'dragon_breath',
            description: '传说中的炎龙，吐息可以熔化一切',
            emoji: '🐉'
        },
        {
            id: 'water_serpent',
            name: '海蛇',
            type: 'water',
            rarity: 'epic',
            baseStats: { hp: 200, atk: 45, def: 50, spd: 25 },
            skills: ['tackle', 'water_gun', 'tsunami', 'defense'],
            ultimate: 'sea_dragon_roar',
            description: '深海霸主，掌控潮汐之力',
            emoji: '🐍'
        },
        {
            id: 'grass_giant',
            name: '巨树精灵',
            type: 'grass',
            rarity: 'epic',
            baseStats: { hp: 220, atk: 40, def: 55, spd: 18 },
            skills: ['tackle', 'leaf_blade', 'vine_whip', 'heal'],
            ultimate: 'world_tree',
            description: '千年古树化身，生命力极其旺盛',
            emoji: '🌳'
        },
        {
            id: 'thunder_eagle',
            name: '雷鹰',
            type: 'thunder',
            rarity: 'epic',
            baseStats: { hp: 160, atk: 60, def: 35, spd: 45 },
            skills: ['tackle', 'thunder_shock', 'thunder_bolt', 'defense'],
            ultimate: 'sky_thunder',
            description: '翱翔天际的雷鹰，速度无人能及',
            emoji: '🦅'
        },
        {
            id: 'phoenix',
            name: '凤凰',
            type: 'fire',
            rarity: 'legendary',
            baseStats: { hp: 250, atk: 70, def: 50, spd: 40 },
            skills: ['tackle', 'fire_ball', 'flame_wave', 'heal'],
            ultimate: 'rebirth_flame',
            description: '不死鸟，浴火重生的传说之鸟',
            emoji: '🔥'
        },
        {
            id: 'sea_king',
            name: '海皇',
            type: 'water',
            rarity: 'legendary',
            baseStats: { hp: 280, atk: 60, def: 60, spd: 30 },
            skills: ['tackle', 'water_gun', 'tsunami', 'heal'],
            ultimate: 'ocean_domination',
            description: '海洋之主，掌控无尽水域',
            emoji: '🌊'
        },
        {
            id: 'world_tree_spirit',
            name: '世界树灵',
            type: 'grass',
            rarity: 'legendary',
            baseStats: { hp: 300, atk: 55, def: 65, spd: 25 },
            skills: ['tackle', 'leaf_blade', 'vine_whip', 'heal'],
            ultimate: 'nature_will',
            description: '世界树的意志，万物的守护者',
            emoji: '🌲'
        },
        {
            id: 'thunder_god',
            name: '雷神',
            type: 'thunder',
            rarity: 'legendary',
            baseStats: { hp: 240, atk: 80, def: 45, spd: 50 },
            skills: ['tackle', 'thunder_shock', 'thunder_bolt', 'defense'],
            ultimate: 'divine_thunder',
            description: '雷霆之神，掌控天罚',
            emoji: '⚡'
        }
    ],

    getMonsterById(id) {
        return this.monsters.find(m => m.id === id);
    },

    getMonstersByRarity(rarity) {
        return this.monsters.filter(m => m.rarity === rarity);
    },

    getMonstersByType(type) {
        return this.monsters.filter(m => m.type === type);
    },

    createMonsterInstance(id, level = 1) {
        const template = this.getMonsterById(id);
        if (!template) return null;

        const rarity = this.rarities[template.rarity.toUpperCase()];
        const multiplier = rarity.multiplier;

        return {
            instanceId: `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            monsterId: id,
            name: template.name,
            type: template.type,
            rarity: template.rarity,
            level: level,
            exp: 0,
            expToNextLevel: level * 100,
            maxHp: Math.floor(template.baseStats.hp * multiplier * (1 + (level - 1) * 0.1)),
            currentHp: Math.floor(template.baseStats.hp * multiplier * (1 + (level - 1) * 0.1)),
            atk: Math.floor(template.baseStats.atk * multiplier * (1 + (level - 1) * 0.08)),
            def: Math.floor(template.baseStats.def * multiplier * (1 + (level - 1) * 0.06)),
            spd: Math.floor(template.baseStats.spd * multiplier * (1 + (level - 1) * 0.05)),
            skills: [...template.skills],
            ultimate: template.ultimate,
            ultimateCharge: 0,
            ultimateMax: 100,
            statusEffects: [],
            isEvolution: template.evolution ? false : true,
            emoji: template.emoji
        };
    },

    getTypeAdvantage(attackType, defenseType) {
        if (this.typeAdvantage[attackType] === defenseType) {
            return 1.5;
        }
        if (this.typeAdvantage[defenseType] === attackType) {
            return 0.7;
        }
        return 1.0;
    },

    getRandomWildMonster(areaLevel = 1) {
        const rarityRoll = Math.random();
        let rarity;
        
        if (rarityRoll < 0.6) rarity = 'common';
        else if (rarityRoll < 0.85) rarity = 'rare';
        else if (rarityRoll < 0.97) rarity = 'epic';
        else rarity = 'legendary';

        const availableMonsters = this.getMonstersByRarity(rarity);
        const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
        const level = Math.max(1, Math.floor(areaLevel + Math.random() * 3 - 1));

        return this.createMonsterInstance(monster.id, level);
    }
};
