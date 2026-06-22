const CONFIG = {
    MAP_WIDTH: 30,
    MAP_HEIGHT: 20,
    TILE_SIZE: 26.67,
    VISION_RADIUS: 5,
    PLAYER_MAX_HP: 120,
    PLAYER_SPEED: 4,
    POISON_DAMAGE_BASE: 3,
    PURIFICATION_HEAL: 40,
    PURIFICATION_IMMUNE_TIME: 10,
    ANTIDOTE_COUNT: 2,
    ANTIDOTE_IMMUNE_TIME: 5,
    TOTAL_LEVELS: 12,

    ZONES: {
        ENTRY: { name: '入口区', cols: 6, damage: 1 },
        MIDDLE: { name: '中段', cols: 18, damage: 5 },
        EXIT: { name: '出口区', cols: 6, damage: 8 }
    },

    ENEMY_TYPES: {
        BUG: {
            name: '毒虫',
            color: '#8b4513',
            damage: 15,
            speed: 1.5,
            poisonBoostTime: 3,
            attackRange: 1.2,
            attackCooldown: 1.5
        },
        FROG: {
            name: '毒蛙',
            color: '#228b22',
            damage: 20,
            speed: 1,
            poisonPoolTime: 5,
            attackRange: 4,
            attackCooldown: 2
        },
        BEE: {
            name: '毒蜂',
            color: '#ffd700',
            damage: 5,
            speed: 3,
            attackRange: 1,
            attackCooldown: 0.8
        }
    },

    LEVELS: [
        {
            level: 1,
            enemies: { BUG: 2, FROG: 0, BEE: 0 },
            purificationStations: 2,
            walls: 8
        },
        {
            level: 2,
            enemies: { BUG: 2, FROG: 1, BEE: 0 },
            purificationStations: 2,
            walls: 10
        },
        {
            level: 3,
            enemies: { BUG: 3, FROG: 1, BEE: 0 },
            purificationStations: 3,
            walls: 12
        },
        {
            level: 4,
            enemies: { BUG: 2, FROG: 1, BEE: 3 },
            purificationStations: 3,
            walls: 14
        },
        {
            level: 5,
            enemies: { BUG: 3, FROG: 2, BEE: 3 },
            purificationStations: 3,
            walls: 16
        },
        {
            level: 6,
            enemies: { BUG: 3, FROG: 2, BEE: 4 },
            purificationStations: 4,
            walls: 18
        },
        {
            level: 7,
            enemies: { BUG: 4, FROG: 2, BEE: 4 },
            purificationStations: 4,
            walls: 20
        },
        {
            level: 8,
            enemies: { BUG: 3, FROG: 3, BEE: 5 },
            purificationStations: 4,
            walls: 22
        },
        {
            level: 9,
            enemies: { BUG: 4, FROG: 3, BEE: 5 },
            purificationStations: 5,
            walls: 24
        },
        {
            level: 10,
            enemies: { BUG: 5, FROG: 3, BEE: 5 },
            purificationStations: 5,
            walls: 26
        },
        {
            level: 11,
            enemies: { BUG: 4, FROG: 4, BEE: 6 },
            purificationStations: 5,
            walls: 28
        },
        {
            level: 12,
            enemies: { BUG: 5, FROG: 4, BEE: 6 },
            purificationStations: 6,
            walls: 30
        }
    ],

    COLORS: {
        FLOOR: '#1a1a2e',
        WALL: '#4a4a6a',
        PLAYER: '#00ffff',
        PURIFICATION: '#39ff14',
        PURIFICATION_GLOW: 'rgba(57, 255, 20, 0.5)',
        EXIT: '#ffd700',
        ENEMY_BUG: '#8b4513',
        ENEMY_FROG: '#228b22',
        ENEMY_BEE: '#ffd700',
        POISON_POOL: 'rgba(148, 0, 211, 0.6)',
        FOG_LIGHT: 'rgba(157, 78, 221, 0.4)',
        FOG_MEDIUM: 'rgba(74, 28, 107, 0.7)',
        FOG_HEAVY: 'rgba(26, 10, 46, 0.95)',
        EXPLORED: 'rgba(26, 10, 46, 0.7)',
        ZONE_ENTRY: 'rgba(57, 255, 20, 0.1)',
        ZONE_MIDDLE: 'rgba(255, 165, 0, 0.1)',
        ZONE_EXIT: 'rgba(220, 20, 60, 0.1)'
    }
};
