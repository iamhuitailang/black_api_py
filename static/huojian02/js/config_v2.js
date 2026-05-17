export const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 700,
    GRAVITY: 0.6,
    FRICTION: 0.85,
    MAX_FALL_SPEED: 15,
    TOTAL_FLOORS: 5,
    FRAGMENTS_PER_FLOOR: 3,
    INVINCIBLE_TIME: 1000,
    SHIELD_COOLDOWN: 5000,
};

export const CHARACTER_TYPES = {
    DREAMER: 'dreamer',
    RANGER: 'ranger',
    GUARDIAN: 'guardian',
};

export const CHARACTER_CONFIGS = {
    [CHARACTER_TYPES.DREAMER]: {
        name: '梦境行者',
        icon: '🌙',
        maxHealth: 100,
        speed: 12,
        jumpForce: 14,
        defense: 5,
        shieldDuration: 2500,
        canDoubleJump: false,
        color: '#80b0ff',
        glowColor: 'rgba(128, 176, 255, 0.6)',
    },
    [CHARACTER_TYPES.RANGER]: {
        name: '星光游侠',
        icon: '✨',
        maxHealth: 90,
        speed: 16,
        jumpForce: 15,
        defense: 3,
        shieldDuration: 2000,
        canDoubleJump: true,
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.6)',
    },
    [CHARACTER_TYPES.GUARDIAN]: {
        name: '守梦卫士',
        icon: '🛡️',
        maxHealth: 110,
        speed: 10,
        jumpForce: 13,
        defense: 8,
        shieldDuration: 3000,
        canDoubleJump: false,
        color: '#80ffc0',
        glowColor: 'rgba(128, 255, 192, 0.6)',
    },
};

export const MONSTER_TYPES = {
    PATROL: 'patrol',
    CHASER: 'chaser',
};

export const MONSTER_CONFIGS = {
    [MONSTER_TYPES.PATROL]: {
        name: '巡逻者',
        health: 30,
        speed: 2,
        damage: 15,
        patrolRange: 150,
        chaseRange: 100,
        color: '#604080',
        width: 40,
        height: 40,
    },
    [MONSTER_TYPES.CHASER]: {
        name: '追击者',
        health: 25,
        speed: 3.5,
        damage: 12,
        patrolRange: 200,
        chaseRange: 300,
        color: '#803050',
        width: 35,
        height: 35,
    },
};

export const FLOOR_THEMES = [
    { name: '梦境入口', bgGradient: ['#1a1a3a', '#0d0d20'], platformColor: '#4a5580' },
    { name: '迷雾回廊', bgGradient: ['#1e2040', '#10122a'], platformColor: '#5a6090' },
    { name: '星空阶梯', bgGradient: ['#252050', '#151035'], platformColor: '#6a5a95' },
    { name: '幻梦之境', bgGradient: ['#2a1a4a', '#180a30'], platformColor: '#7a6aa0' },
    { name: '失落塔顶', bgGradient: ['#302060', '#1a1040'], platformColor: '#8a7ab0' },
];

export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
    VICTORY: 'victory',
    TRANSITION: 'transition',
};

export const KEYS = {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    JUMP: ['ArrowUp', 'KeyW', 'Space'],
    ACTION: ['Space', 'KeyE'],
    PAUSE: ['Escape', 'KeyP'],
};
