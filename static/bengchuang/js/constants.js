const GAME_WIDTH = 1000;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const GROUND_Y = 520;
const ARENA_LEFT = 100;
const ARENA_RIGHT = 900;

const CHARACTERS = {
    clown: {
        name: '滑稽小丑',
        emoji: '🤡',
        type: '均衡通用型',
        specialName: '回旋弹跳撞',
        jumpPower: 14,
        weight: 1,
        agility: 1,
        specialKnockback: 20,
        color: '#FF6B6B',
        secondaryColor: '#FFE66D'
    },
    bear: {
        name: '呆萌狗熊',
        emoji: '🐻',
        type: '力量重型',
        specialName: '重压坠击',
        jumpPower: 10,
        weight: 1.5,
        agility: 0.7,
        specialKnockback: 28,
        color: '#8B4513',
        secondaryColor: '#D2691E'
    },
    rabbit: {
        name: '灵巧白兔',
        emoji: '🐰',
        type: '敏捷轻盈型',
        specialName: '连环空踢',
        jumpPower: 18,
        weight: 0.6,
        agility: 1.5,
        specialKnockback: 18,
        color: '#FFB6C1',
        secondaryColor: '#FFFFFF'
    },
    lion: {
        name: '威风狮子',
        emoji: '🦁',
        type: '爆发突进型',
        specialName: '猛扑冲撞',
        jumpPower: 14,
        weight: 1.3,
        agility: 1,
        specialKnockback: 25,
        color: '#FFA500',
        secondaryColor: '#FFD700'
    }
};

const MOVES = {
    charge: {
        name: '平地冲撞',
        damage: 6,
        knockback: 10,
        cooldown: 400,
        staminaCost: 15,
        range: 70,
        heightMin: 0,
        heightMax: 100,
        color: '#FF4444'
    },
    kick: {
        name: '低空飞踢',
        damage: 9,
        knockback: 15,
        cooldown: 600,
        staminaCost: 25,
        range: 90,
        heightMin: 80,
        heightMax: 200,
        color: '#44FF44'
    },
    special: {
        name: '特技甩击',
        damage: 15,
        knockback: 25,
        cooldown: 1200,
        staminaCost: 40,
        range: 110,
        heightMin: 150,
        heightMax: 500,
        color: '#FF44FF'
    }
};

const TRAMPOLINES = [
    { x: 200, y: 450, width: 120, height: 20, bounceForce: 12, color: '#FF69B4', type: 'normal' },
    { x: 440, y: 400, width: 120, height: 20, bounceForce: 13, color: '#00CED1', type: 'strong' },
    { x: 680, y: 450, width: 120, height: 20, bounceForce: 12, color: '#FF69B4', type: 'normal' },
    { x: 320, y: 340, width: 100, height: 20, bounceForce: 12, color: '#9370DB', type: 'normal' },
    { x: 580, y: 340, width: 100, height: 20, bounceForce: 12, color: '#9370DB', type: 'normal' }
];

const SPRINGBOARDS = [
    { x: 140, y: 495, width: 50, height: 15, bounceForce: 15, color: '#FFD700', type: 'spring' },
    { x: 810, y: 495, width: 50, height: 15, bounceForce: 15, color: '#FFD700', type: 'spring' }
];

const EDGE_SLOPES = [
    { x: 80, y: 460, width: 30, height: 140, side: 'left' },
    { x: 890, y: 460, width: 30, height: 140, side: 'right' }
];

const STAMINA = {
    max: 100,
    regenRate: 0.5,
    jumpCost: 8,
    moveCost: 0.05
};

const GAME_STATES = {
    CHARACTER_SELECT: 'character_select',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

const ATTACK_STATES = {
    IDLE: 'idle',
    CHARGING: 'charging',
    ATTACKING: 'attacking',
    COOLDOWN: 'cooldown'
};