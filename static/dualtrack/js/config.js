export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 700;

export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FINISHED: 'finished'
};

export const RIDER_TYPES = {
    BOY: 'boy',
    GIRL: 'girl',
    UNCLE: 'uncle'
};

export const RIDER_CONFIG = {
    [RIDER_TYPES.BOY]: {
        name: '少年骑手',
        maxSpeed: 8,
        balance: 80,
        cornerDeceleration: 0.85,
        pickupRange: 40,
        recoverySpeed: 0.08,
        color: '#4A90D9',
        startBoost: 0
    },
    [RIDER_TYPES.GIRL]: {
        name: '疾风少女',
        maxSpeed: 10,
        balance: 65,
        cornerDeceleration: 0.75,
        pickupRange: 30,
        recoverySpeed: 0.04,
        color: '#E91E63',
        startBoost: 2
    },
    [RIDER_TYPES.UNCLE]: {
        name: '蛮力大叔',
        maxSpeed: 9,
        balance: 95,
        cornerDeceleration: 0.95,
        pickupRange: 50,
        recoverySpeed: 0.12,
        color: '#795548',
        startBoost: 0
    }
};

export const SPEED_STATES = {
    SLOW: { speed: 0.4, name: '慢速', balanceDrain: 0.01 },
    NORMAL: { speed: 0.7, name: '正常', balanceDrain: 0.03 },
    FAST: { speed: 1.2, name: '极速', balanceDrain: 0.08 }
};

export const OBSTACLE_TYPES = {
    GRAVEL: 'gravel',
    STEEP: 'steep',
    BLOCK: 'block',
    WINDS: 'winds'
};

export const OBSTACLE_CONFIG = {
    [OBSTACLE_TYPES.GRAVEL]: {
        name: '碎石路',
        speedReduction: 0.5,
        balanceDamage: 0.02,
        width: 150,
        color: '#8B7355'
    },
    [OBSTACLE_TYPES.STEEP]: {
        name: '陡坡弯道',
        balanceDamage: 0.15,
        width: 100,
        color: '#8B4513'
    },
    [OBSTACLE_TYPES.BLOCK]: {
        name: '横断路障',
        stopTime: 1000,
        width: 80,
        color: '#FF4444'
    },
    [OBSTACLE_TYPES.WINDS]: {
        name: '侧向气流',
        pushForce: 3,
        width: 120,
        color: '#87CEEB'
    }
};

export const ITEM_TYPES = {
    BOOST: 'boost',
    SHIELD: 'shield',
    BOMB: 'bomb',
    TRAP: 'trap'
};

export const ITEM_CONFIG = {
    [ITEM_TYPES.BOOST]: {
        name: '加速',
        icon: '⚡',
        duration: 3000,
        speedMultiplier: 1.8,
        color: '#FFD700'
    },
    [ITEM_TYPES.SHIELD]: {
        name: '护盾',
        icon: '🛡️',
        duration: 5000,
        color: '#2196F3'
    },
    [ITEM_TYPES.BOMB]: {
        name: '炸弹',
        icon: '💣',
        radius: 100,
        balanceDamage: 0.5,
        color: '#FF5722'
    },
    [ITEM_TYPES.TRAP]: {
        name: '陷阱',
        icon: '🕳️',
        slowDuration: 2000,
        speedReduction: 0.4,
        color: '#607D8B'
    }
};

export const TRACK_LENGTH = 10000;
export const TRACK_WIDTH = 200;
export const AI_COUNT = 3;

export const COLORS = {
    SKY: '#87CEEB',
    GRASS_LIGHT: '#90EE90',
    GRASS_DARK: '#228B22',
    ROAD: '#D2B48C',
    ROAD_EDGE: '#A0522D',
    WHEAT: '#F5DEB3',
    FLOWER: ['#FF69B4', '#FFD700', '#FF6347', '#DDA0DD', '#9370DB']
};
