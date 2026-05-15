export const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GAME_DURATION: 90,
    GRAVITY: 0.8,
    ARENA: {
        x: 100,
        y: 450,
        width: 1000,
        height: 200
    }
};

export const CHARACTERS = {
    emperor: {
        name: '帝企鹅',
        maxHealth: 100,
        slideDamage: 12,
        defense: 6,
        friction: 0.92,
        speed: 6,
        jumpForce: -15,
        ultimateDamage: 24,
        color: '#2d3748',
        bellyColor: '#f7fafc',
        size: 70
    },
    little: {
        name: '小企鹅',
        maxHealth: 85,
        slideDamage: 9,
        defense: 4,
        friction: 0.88,
        speed: 9,
        jumpForce: -17,
        ultimateDamage: 20,
        color: '#4a5568',
        bellyColor: '#edf2f7',
        size: 55
    },
    fat: {
        name: '胖企鹅',
        maxHealth: 110,
        slideDamage: 15,
        defense: 8,
        friction: 0.96,
        speed: 4,
        jumpForce: -13,
        ultimateDamage: 28,
        color: '#1a202c',
        bellyColor: '#ffffff',
        size: 85
    }
};

export const ATTACKS = {
    lightSlide: {
        name: '轻滑铲',
        damage: 8,
        startup: 0.08,
        recovery: 0.15,
        range: 80,
        knockback: 8,
        cooldown: 300
    },
    heavySlide: {
        name: '重滑铲',
        damage: 14,
        startup: 0.15,
        recovery: 0.25,
        range: 120,
        knockback: 15,
        cooldown: 600
    },
    iceCone: {
        name: '冰锥',
        damage: 6,
        startup: 0.1,
        recovery: 0.2,
        range: 400,
        knockback: 5,
        cooldown: 500,
        speed: 12
    },
    jumpAttack: {
        name: '跳跃压顶',
        damage: 12,
        startup: 0.12,
        recovery: 0.2,
        range: 100,
        knockback: 12,
        cooldown: 800
    }
};

export const ULTIMATES = {
    polarWave: {
        name: '极地冰浪',
        damage: 18,
        energyCost: 50,
        range: 350,
        knockback: 20,
        slowEffect: 0.5,
        duration: 2000
    },
    whaleRush: {
        name: '巨鲸冲撞',
        damage: 25,
        energyCost: 60,
        range: 300,
        knockback: 30,
        speed: 15
    },
    iceStorm: {
        name: '冰锥风暴',
        damage: 20,
        energyCost: 55,
        range: 250,
        knockback: 5,
        stunDuration: 1500,
        coneCount: 5
    }
};

export const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LIGHT: 'KeyJ',
    HEAVY: 'KeyK',
    CONE: 'KeyL',
    ULTIMATE: 'KeyI'
};