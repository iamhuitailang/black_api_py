const GAME_CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 520,
    GRAVITY: 0.5,
    MAX_FALL_SPEED: 15
};

const CHARACTER_TYPES = {
    BALANCED: {
        id: 'balanced',
        name: '平衡弓箭手',
        icon: '🧍',
        maxHealth: 100,
        attack: 12,
        dodge: 5,
        moveSpeed: 5,
        specialDamage: 25,
        specialName: '穿透箭',
        specialCooldown: 5000,
        color: '#44aaff'
    },
    POWER: {
        id: 'power',
        name: '强攻弓箭手',
        icon: '🔥',
        maxHealth: 95,
        attack: 14,
        dodge: 4,
        moveSpeed: 5,
        specialDamage: 28,
        specialName: '爆裂箭',
        specialCooldown: 6000,
        color: '#ff4444'
    },
    SPEED: {
        id: 'speed',
        name: '疾风弓箭手',
        icon: '💨',
        maxHealth: 90,
        attack: 10,
        dodge: 6,
        moveSpeed: 7,
        specialDamage: 22,
        specialName: '追踪箭',
        specialCooldown: 4000,
        color: '#44ff44'
    }
};

const ARROW_TYPES = {
    NORMAL: {
        id: 'normal',
        name: '普通木箭',
        damage: 8,
        speed: 12,
        chargeTime: 10,
        cooldown: 30,
        range: 400,
        color: '#8B4513',
        trailColor: 'rgba(139, 69, 19, 0.6)'
    },
    CHARGED: {
        id: 'charged',
        name: '蓄力重箭',
        damage: 14,
        speed: 15,
        chargeTime: 60,
        cooldown: 120,
        range: 500,
        color: '#ff6600',
        trailColor: 'rgba(255, 102, 0, 0.7)'
    },
    FAST: {
        id: 'fast',
        name: '快速短箭',
        damage: 7,
        speed: 18,
        chargeTime: 70,
        cooldown: 180,
        range: 450,
        color: '#00ff88',
        trailColor: 'rgba(0, 255, 136, 0.6)'
    },
    EXPLOSIVE: {
        id: 'explosive',
        name: '爆破箭矢',
        damage: 15,
        speed: 10,
        chargeTime: 150,
        cooldown: 280,
        range: 600,
        color: '#ff0000',
        trailColor: 'rgba(255, 0, 0, 0.7)',
        explosive: true,
        explosionRadius: 60
    },
    SPECIAL: {
        id: 'special',
        name: '特技箭矢',
        damage: 25,
        speed: 14,
        chargeTime: 200,
        cooldown: 5000,
        range: 700,
        color: '#ffff00',
        trailColor: 'rgba(255, 255, 0, 0.8)'
    }
};

const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    RESULT: 'result'
};

const STORAGE_KEY = 'huojianren_archer_game_save';
