export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 700;
export const GROUND_Y = 550;
export const GRAVITY = 0.8;

export const CHARACTERS = {
    yellow: {
        name: '小黄鸡',
        type: '均衡型',
        emoji: '🐥',
        maxHealth: 110,
        attack: 10,
        defense: 6,
        speed: 5,
        jumpForce: 15,
        ultimateDamage: 20,
        color: '#FFD700',
        bodyColor: '#FFE135',
        wingColor: '#FFA500'
    },
    black: {
        name: '小黑鸡',
        type: '攻击型',
        emoji: '🐓',
        maxHealth: 100,
        attack: 13,
        defense: 4,
        speed: 6,
        jumpForce: 16,
        ultimateDamage: 24,
        color: '#2F2F2F',
        bodyColor: '#3D3D3D',
        wingColor: '#1A1A1A'
    },
    duck: {
        name: '小鸭鸭',
        type: '速度型',
        emoji: '🦆',
        maxHealth: 95,
        attack: 8,
        defense: 7,
        speed: 8,
        jumpForce: 14,
        ultimateDamage: 18,
        color: '#FFD700',
        bodyColor: '#F5DEB3',
        wingColor: '#DAA520'
    }
};

export const ATTACKS = {
    lightPeck: { damage: 6, startup: 50, recovery: 100, range: 60, name: '轻啄' },
    heavyPeck: { damage: 10, startup: 100, recovery: 200, range: 90, name: '重啄' },
    lightWing: { damage: 5, startup: 30, recovery: 100, range: 80, name: '轻拍' },
    heavyWing: { damage: 11, startup: 120, recovery: 220, range: 120, name: '重拍' }
};

export const ULTIMATES = {
    flyingPeck: { damage: 16, name: '飞啄冲击', speed: 12 },
    wingSpin: { damage: 18, name: '翅膀旋风', duration: 500 },
    slidePeck: { damage: 14, name: '滑铲啄击', speed: 10 }
};

export const GAME_STATES = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character_select',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

export const STORAGE_KEY = 'caiji_game_save';