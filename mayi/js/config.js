const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    
    COLONY: {
        X: 600,
        Y: 600,
        WIDTH: 120,
        HEIGHT: 80,
        MAX_HP: 200,
        INITIAL_UNIT_LIMIT: 20,
        DEFENSE: 0,
        HATCH_TIME: 3000
    },

    RESOURCES: {
        FOOD_MAX: 999,
        STONE_MAX: 999,
        HONEY_MAX: 99,
        INITIAL_FOOD: 50,
        INITIAL_STONE: 20,
        INITIAL_HONEY: 0
    },

    UNIT_TYPES: {
        worker: {
            name: '工蚁',
            icon: '🐜',
            color: '#8B4513',
            hp: 20,
            attack: 5,
            speed: 2.5,
            cost: 10,
            costType: 'food',
            unlockWave: 0,
            canGather: true,
            canAttack: false,
            gatherAmount: 5,
            size: 12
        },
        soldier: {
            name: '兵蚁',
            icon: '🐜',
            color: '#CD5C5C',
            hp: 40,
            attack: 12,
            speed: 1.8,
            cost: 30,
            costType: 'food',
            unlockWave: 0,
            canGather: false,
            canAttack: true,
            attackRange: 40,
            attackCooldown: 800,
            size: 14
        },
        fire: {
            name: '火蚁',
            icon: '🐜',
            color: '#FF6347',
            hp: 60,
            attack: 18,
            speed: 1.8,
            cost: 60,
            costType: 'food',
            unlockWave: 5,
            canGather: false,
            canAttack: true,
            attackRange: 45,
            attackCooldown: 700,
            size: 16
        },
        flying: {
            name: '飞蚁',
            icon: '🦋',
            color: '#9370DB',
            hp: 30,
            attack: 10,
            speed: 3.5,
            cost: 50,
            costType: 'food',
            unlockWave: 8,
            canGather: false,
            canAttack: true,
            isFlying: true,
            attackRange: 50,
            attackCooldown: 600,
            size: 14
        },
        giant: {
            name: '巨型蚁',
            icon: '🐜',
            color: '#2F4F4F',
            hp: 150,
            attack: 35,
            speed: 1,
            cost: 150,
            costType: 'food',
            unlockWave: 12,
            canGather: false,
            canAttack: true,
            attackRange: 50,
            attackCooldown: 1200,
            size: 22
        }
    },

    ENEMY_TYPES: {
        traitor_worker: {
            name: '叛变工蚁',
            color: '#556B2F',
            hp: 20,
            attack: 5,
            speed: 1.5,
            reward: 3,
            size: 12
        },
        enemy_soldier: {
            name: '红兵蚁',
            color: '#8B0000',
            hp: 40,
            attack: 10,
            speed: 1.2,
            reward: 5,
            size: 14
        },
        fire_ant: {
            name: '火蚁',
            color: '#FF4500',
            hp: 60,
            attack: 15,
            speed: 1.3,
            reward: 8,
            size: 15
        },
        spider: {
            name: '蜘蛛',
            color: '#1a1a1a',
            hp: 150,
            attack: 35,
            speed: 1.0,
            reward: 30,
            isBoss: true,
            size: 28,
            attackRange: 50,
            attackCooldown: 600
        },
        fly_enemy: {
            name: '飞虫',
            color: '#4B0082',
            hp: 30,
            attack: 8,
            speed: 2.5,
            reward: 6,
            isFlying: true,
            size: 12
        },
        beetle: {
            name: '甲虫',
            color: '#2F4F4F',
            hp: 300,
            attack: 45,
            speed: 0.8,
            reward: 50,
            isBoss: true,
            armor: 0.4,
            size: 32,
            attackRange: 45,
            attackCooldown: 700
        },
        elite: {
            name: '精英兵蚁',
            color: '#800080',
            hp: 60,
            attack: 18,
            speed: 1.4,
            reward: 10,
            size: 16
        },
        royal_guard: {
            name: '蚁后护卫',
            color: '#B8860B',
            hp: 60,
            attack: 22,
            speed: 1.5,
            reward: 12,
            size: 18
        }
    },

    WAVES: [
        {
            wave: 1,
            enemies: [
                { type: 'traitor_worker', count: 3 }
            ],
            totalHp: 60,
            reward: 10,
            description: '教学波'
        },
        {
            wave: 2,
            enemies: [
                { type: 'enemy_soldier', count: 3 }
            ],
            totalHp: 120,
            reward: 15,
            description: ''
        },
        {
            wave: 3,
            enemies: [
                { type: 'enemy_soldier', count: 3 },
                { type: 'traitor_worker', count: 2 }
            ],
            totalHp: 200,
            reward: 20,
            description: ''
        },
        {
            wave: 4,
            enemies: [
                { type: 'spider', count: 1 }
            ],
            totalHp: 100,
            reward: 30,
            description: 'Boss 单位'
        },
        {
            wave: 5,
            enemies: [
                { type: 'fire_ant', count: 4 }
            ],
            totalHp: 240,
            reward: 25,
            description: '高攻击'
        },
        {
            wave: 6,
            enemies: [
                { type: 'fly_enemy', count: 5 }
            ],
            totalHp: 150,
            reward: 30,
            description: '空中单位'
        },
        {
            wave: 7,
            enemies: [
                { type: 'enemy_soldier', count: 4 },
                { type: 'fire_ant', count: 2 },
                { type: 'traitor_worker', count: 2 }
            ],
            totalHp: 400,
            reward: 40,
            description: '混合部队'
        },
        {
            wave: 8,
            enemies: [
                { type: 'beetle', count: 1 }
            ],
            totalHp: 200,
            reward: 50,
            description: '高防御'
        },
        {
            wave: 9,
            enemies: [
                { type: 'elite', count: 6 }
            ],
            totalHp: 360,
            reward: 45,
            description: '高生命'
        },
        {
            wave: 10,
            enemies: [
                { type: 'royal_guard', count: 10 }
            ],
            totalHp: 600,
            reward: 100,
            description: '最终波'
        }
    ],

    UPGRADES: {
        hp: {
            name: '生命强化',
            description: '+50 最大生命',
            icon: '❤️',
            cost: 50,
            costType: 'stone',
            maxLevel: 5,
            effect: 50
        },
        unitLimit: {
            name: '单位上限',
            description: '+5 单位槽位',
            icon: '👥',
            cost: 30,
            costType: 'stone',
            maxLevel: 5,
            effect: 5
        },
        defense: {
            name: '防御强化',
            description: '+5% 减伤',
            icon: '🛡️',
            cost: 40,
            costType: 'stone',
            maxLevel: 5,
            effect: 0.05
        },
        hatchSpeed: {
            name: '孵化加速',
            description: '-20% 孵化时间',
            icon: '⏱️',
            cost: 60,
            costType: 'stone',
            maxLevel: 3,
            effect: 0.2
        },
        gatherEfficiency: {
            name: '采集效率',
            description: '工蚁 +5 采集量',
            icon: '🍃',
            cost: 40,
            costType: 'stone',
            maxLevel: 3,
            effect: 5
        }
    },

    RESOURCE_POINTS: {
        COUNT: 8,
        MIN_DISTANCE_FROM_COLONY: 150,
        FOOD_AMOUNT: 50,
        REGEN_TIME: 15000
    },

    WAVE_DELAY: 5000,
    ENEMY_SPAWN_INTERVAL: 800,

    STORAGE_KEY: 'mayi_colony_defense_save',
    HIGHEST_WAVE_KEY: 'mayi_colony_defense_highest'
};
