const CONFIG = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    GRAVITY: 0.6,
    FRICTION: 0.9,
    MAX_SPEED: 12,
    ACCELERATION: 0.5,
    JUMP_FORCE: -14,
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 50,
    SPIN_DASH_CHARGE: 0.3,
    SPIN_DASH_MAX: 15,
    SUPER_SPEED_MULTIPLIER: 1.5,
    INVINCIBLE_TIME: 120,
    RING_LOSS_TIME: 60,

    LEVELS: [
        { id: 1, name: '绿野区', type: 'grass', difficulty: 1, length: 3000, boss: false },
        { id: 2, name: '化工区', type: 'chemical', difficulty: 2, length: 3500, boss: false },
        { id: 3, name: '沙漠区', type: 'desert', difficulty: 3, length: 4000, boss: false },
        { id: 4, name: '机械城', type: 'mechanical', difficulty: 4, length: 4500, boss: false },
        { id: 5, name: '水下区', type: 'underwater', difficulty: 5, length: 4000, boss: false },
        { id: 6, name: '天空区', type: 'sky', difficulty: 6, length: 5000, boss: true }
    ],

    HIDDEN_LEVEL: {
        id: 7,
        name: '翡翠神殿',
        type: 'special',
        difficulty: 7,
        length: 6000,
        boss: true,
        requiredEmeralds: 7
    },

    GRADES: {
        S: { time: 60, ringRate: 0.9 },
        A: { time: 90, ringRate: 0.7 },
        B: { time: 120, ringRate: 0.5 },
        C: { time: 180, ringRate: 0 }
    },

    SCORES: {
        RING: 10,
        ENEMY: 100,
        ELITE_ENEMY: 500,
        ALL_RINGS: 10000,
        NO_DAMAGE: 5000,
        TIME_BONUS_PER_SECOND: 100
    },

    COLORS: {
        sonic: '#0066cc',
        sonicSuper: '#ffd700',
        ring: '#ffd700',
        shield: '#00bfff',
        enemy: '#ff4444',
        ground: '#228B22',
        platform: '#8B4513',
        spring: '#ff6347',
        spike: '#333'
    }
};

const GAME_STATE = {
    TITLE: 'title',
    MODE_SELECT: 'modeSelect',
    LEVEL_SELECT: 'levelSelect',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    ENDING: 'ending'
};
