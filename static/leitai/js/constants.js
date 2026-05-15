const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const GROUND_Y = 550;
const GRAVITY = 0.8;
const GAME_DURATION = 90;

const GAME_STATE = {
    MENU: 'menu',
    CHAR_SELECT: 'char_select',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

const CHARACTERS = [
    {
        name: '气鼓鼓',
        stompDamage: 100,
        defense: 11,
        speed: 9,
        ultimateDamage: 24,
        color: '#ff6b6b',
        emoji: '😤'
    },
    {
        name: '大脚怪',
        stompDamage: 110,
        defense: 15,
        speed: 5,
        ultimateDamage: 28,
        color: '#9b59b6',
        emoji: '🦶'
    },
    {
        name: '蹦蹦兔',
        stompDamage: 90,
        defense: 9,
        speed: 11,
        ultimateDamage: 20,
        color: '#f39c12',
        emoji: '🐰'
    }
];

const ATTACKS = {
    LIGHT_STOMP: {
        name: '轻踩',
        damage: 7,
        startup: 0.05,
        recovery: 0.12,
        range: 'close',
        key: 'a'
    },
    HEAVY_STOMP: {
        name: '重踩',
        damage: 12,
        startup: 0.12,
        recovery: 0.22,
        range: 'medium',
        key: 's'
    },
    BELLY_SLAP: {
        name: '拍肚皮',
        damage: 6,
        startup: 0.04,
        recovery: 0.10,
        range: '贴身',
        key: 'd'
    },
    ANGRY_ROAR: {
        name: '生气吼',
        damage: 9,
        startup: 0.08,
        recovery: 0.16,
        range: 'medium',
        key: 'f'
    },
    ULTIMATE_STOMP: {
        name: '必杀踩',
        damage: 0,
        startup: 0.2,
        recovery: 0.4,
        range: 'close',
        key: 'g',
        isUltimate: true
    }
};

const AI_STATE = {
    IDLE: 'idle',
    APPROACH: 'approach',
    ATTACK: 'attack',
    DODGE: 'dodge',
    RETREAT: 'retreat'
};

const STORAGE_KEY = 'leitai_game_state';