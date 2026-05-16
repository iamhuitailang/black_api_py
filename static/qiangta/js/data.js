const GameData = {
    STORAGE_KEY: 'qiangta_game_state',

    UNIT_TYPES: {
        soldier: {
            name: '小兵',
            icon: '👶',
            cost: 10,
            hp: 50,
            damage: 8,
            attackSpeed: 2,
            moveSpeed: 1,
            range: 30,
            isFlying: false,
            armor: 0
        },
        shield: {
            name: '盾牌兵',
            icon: '🛡️',
            cost: 30,
            hp: 120,
            damage: 5,
            attackSpeed: 1,
            moveSpeed: 0.6,
            range: 30,
            isFlying: false,
            armor: 5,
            blocksRanged: true
        },
        archer: {
            name: '弓箭手',
            icon: '🏹',
            cost: 20,
            hp: 40,
            damage: 10,
            attackSpeed: 1,
            moveSpeed: 0.8,
            range: 150,
            isFlying: false,
            armor: 0,
            isRanged: true
        },
        mage: {
            name: '法师',
            icon: '🚀',
            cost: 35,
            hp: 35,
            damage: 18,
            attackSpeed: 1,
            moveSpeed: 0.7,
            range: 130,
            isFlying: false,
            armor: 0,
            isRanged: true,
            aoeDamage: true
        },
        flying: {
            name: '飞行兵',
            icon: '🦅',
            cost: 25,
            hp: 45,
            damage: 12,
            attackSpeed: 1,
            moveSpeed: 1.5,
            range: 35,
            isFlying: true,
            armor: 0
        }
    },

    COUNTER_SYSTEM: {
        shield: ['archer', 'mage'],
        archer: ['flying'],
        mage: ['soldier'],
        flying: ['archer', 'mage'],
        soldier: ['archer', 'mage']
    },

    COUNTER_DAMAGE_MULTIPLIER: 1.5,

    BASE: {
        MAX_HP: 1000,
        WIDTH: 80,
        HEIGHT: 120
    },

    TOWER: {
        MAX_HP: 500,
        WIDTH: 60,
        HEIGHT: 100,
        GOLD_PER_SECOND: 5,
        ATTACK_BONUS: 0.2,
        DEFENSE_BONUS: 0.2
    },

    GAME: {
        INITIAL_GOLD: 100,
        GOLD_PER_SECOND: 3,
        MAX_GAME_TIME: 240,
        SPAWN_Y_OFFSET: 30
    },

    COLORS: {
        player: {
            primary: '#3498db',
            secondary: '#2980b9',
            dark: '#1a5276'
        },
        enemy: {
            primary: '#e74c3c',
            secondary: '#c0392b',
            dark: '#922b21'
        },
        neutral: {
            primary: '#f39c12',
            secondary: '#e67e22',
            dark: '#d35400'
        },
        ground: '#2d3436',
        groundLight: '#636e72',
        path: '#4a4a4a'
    }
};