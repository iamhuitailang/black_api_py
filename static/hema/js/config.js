const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    
    HIPPO_TYPES: {
        normal: {
            name: '巨口河马',
            maxHealth: 120,
            attack: 15,
            defense: 3,
            moveSpeed: 5,
            biteSpeed: 1,
            ultimateDamage: 30,
            color: '#8B4513',
            ultimateName: '深渊吞噬'
        },
        fast: {
            name: '闪电河马',
            maxHealth: 100,
            attack: 10,
            defense: 2,
            moveSpeed: 8,
            biteSpeed: 1.5,
            ultimateDamage: 22,
            color: '#FFD700',
            ultimateName: '电光大嘴'
        },
        defense: {
            name: '铁甲河马',
            maxHealth: 150,
            attack: 20,
            defense: 8,
            moveSpeed: 3,
            biteSpeed: 0.7,
            ultimateDamage: 35,
            color: '#4A6B8A',
            ultimateName: '护盾大嘴'
        }
    },

    ENEMY_TYPES: {
        fish: {
            name: '小鲶鱼',
            health: 30,
            attack: 5,
            speed: 2,
            score: 50,
            color: '#6B8E23'
        },
        frog: {
            name: '毒青蛙',
            health: 50,
            attack: 10,
            speed: 3,
            score: 100,
            color: '#32CD32'
        },
        snake: {
            name: '水蛇',
            health: 80,
            attack: 15,
            speed: 4,
            score: 150,
            color: '#228B22'
        },
        crocodile: {
            name: '小鳄鱼',
            health: 120,
            attack: 25,
            speed: 2.5,
            score: 300,
            color: '#556B2F'
        }
    },

    WAVES: [
        { enemies: [{ type: 'fish', count: 5 }] },
        { enemies: [{ type: 'fish', count: 5 }, { type: 'frog', count: 3 }] },
        { enemies: [{ type: 'frog', count: 5 }, { type: 'snake', count: 2 }] },
        { enemies: [{ type: 'snake', count: 5 }, { type: 'fish', count: 5 }] },
        { enemies: [{ type: 'crocodile', count: 2 }, { type: 'frog', count: 5 }] },
        { enemies: [{ type: 'crocodile', count: 3 }, { type: 'snake', count: 4 }] },
        { enemies: [{ type: 'crocodile', count: 5 }, { type: 'snake', count: 5 }, { type: 'frog', count: 5 }] }
    ],

    BITE: {
        NORMAL: 'normal',
        CHARGED: 'charged',
        ULTIMATE: 'ultimate'
    },

    HEAD_ANGLE: {
        UP: -30,
        NEUTRAL: 0,
        DOWN: 30
    },

    ULTIMATE_COMBO: ['down', 'right', 'up'],
    ULTIMATE_COMBO_TIME: 1000,

    CHARGE_TIME: 1000,
    MAX_CHARGE_MULTIPLIER: 2.5,

    ULTIMATE_ENERGY_MAX: 100,
    ULTIMATE_ENERGY_PER_HIT: 10,

    SWAMP_Y: 500,
    HIPPO_Y: 450
};