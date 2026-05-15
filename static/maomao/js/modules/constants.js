export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 620;
export const GROUND_Y = 520;
export const GRAVITY = 0.8;
export const JUMP_FORCE = -18;

export const GAME_STATES = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character_select',
    PLAYING: 'playing',
    PAUSED: 'paused',
    RESULT: 'result'
};

export const ATTACK_TYPES = {
    LIGHT_PAW: 'light_paw',
    HEAVY_PAW: 'heavy_paw',
    LIGHT_TAIL: 'light_tail',
    HEAVY_TAIL: 'heavy_tail',
    SPECIAL: 'special'
};

export const CHARACTERS = {
    ragdoll: {
        id: 'ragdoll',
        name: '布偶猫',
        emoji: '🐱',
        type: '均衡型',
        maxHealth: 1000,
        speed: 5,
        attackPower: 1,
        skills: ['棉花糖扑击', '爱心光波'],
        colors: {
            body: '#f5f5f5',
            ear: '#e8d5d5',
            eye: '#4169e1',
            nose: '#ffb6c1',
            tail: '#f5f5f5'
        }
    },
    orange: {
        id: 'orange',
        name: '橘猫',
        emoji: '😺',
        type: '攻击型',
        maxHealth: 900,
        speed: 4.5,
        attackPower: 1.3,
        skills: ['干饭猛扑', '火焰尾击'],
        colors: {
            body: '#ffa500',
            ear: '#ff8c00',
            eye: '#228b22',
            nose: '#ff6347',
            tail: '#ffa500'
        }
    },
    british: {
        id: 'british',
        name: '英短猫',
        emoji: '🐈',
        type: '速度型',
        maxHealth: 850,
        speed: 6.5,
        attackPower: 0.9,
        skills: ['闪电爪击', '毛球弹幕'],
        colors: {
            body: '#696969',
            ear: '#505050',
            eye: '#ffd700',
            nose: '#808080',
            tail: '#696969'
        }
    }
};

export const ATTACK_DAMAGE = {
    light_paw: 25,
    heavy_paw: 50,
    light_tail: 30,
    heavy_tail: 60,
    special: 100
};

export const ATTACK_DURATION = {
    light_paw: 15,
    heavy_paw: 25,
    light_tail: 18,
    heavy_tail: 30,
    special: 45
};

export const ATTACK_COOLDOWN = {
    light_paw: 20,
    heavy_paw: 40,
    light_tail: 25,
    heavy_tail: 50,
    special: 120
};
