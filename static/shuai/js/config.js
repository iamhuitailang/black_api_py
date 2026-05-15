const CONFIG = {
    GAME_DURATION: 180,
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    
    RING: {
        x: 100,
        y: 150,
        width: 1000,
        height: 400,
        ropeY: 130
    },

    GRAVITY: 0.8,
    GROUND_Y: 500,
    
    ATTACK_DISTANCE: 80,
    GRAPPLE_DISTANCE: 60,
    
    ATTACKS: {
        LIGHT: { damage: 0.5, cooldown: 500, name: '轻摔' },
        HEAVY: { damage: 1.2, cooldown: 1000, name: '重摔' },
        THROW: { damage: 1.5, cooldown: 1500, name: '投技' },
        ULTIMATE: { damage: 2.5, cooldown: 3000, name: '必杀技' }
    }
};

const CHARACTERS = {
    tiger: {
        name: '猛虎',
        icon: '🐯',
        color: '#ff6b6b',
        maxHealth: 110,
        attackDamage: 18,
        defense: 6,
        moveSpeed: 3,
        escapeSpeed: 1.5,
        pinTime: 3.0,
        ultimateName: '猛虎爆摔',
        type: '力量型'
    },
    leopard: {
        name: '猎豹',
        icon: '🐆',
        color: '#feca57',
        maxHealth: 95,
        attackDamage: 12,
        defense: 4,
        moveSpeed: 5,
        escapeSpeed: 3,
        pinTime: 3.5,
        ultimateName: '旋风投摔',
        type: '速度/挣脱型'
    },
    rock: {
        name: '巨岩',
        icon: '🪨',
        color: '#95a5a6',
        maxHealth: 120,
        attackDamage: 20,
        defense: 8,
        moveSpeed: 3.5,
        escapeSpeed: 2,
        pinTime: 2.5,
        ultimateName: '泰山压顶',
        type: '防御/压制型'
    }
};

const GAME_STATE = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character_select',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

const PLAYER_STATE = {
    IDLE: 'idle',
    WALKING: 'walking',
    JUMPING: 'jumping',
    CROUCHING: 'crouching',
    ATTACKING: 'attacking',
    GRAPPLING: 'grappling',
    PINNING: 'pinning',
    PINNED: 'pinned',
    DOWN: 'down',
    ESCAPING: 'escaping'
};