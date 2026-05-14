export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 675;
export const GROUND_Y = 550;
export const GRAVITY = 0.8;
export const MAX_HEALTH = 100;
export const MAX_ENERGY = 100;
export const ENERGY_COST_BLOCK = 5;
export const PLAYER_START_X = 300;
export const ENEMY_START_X = 900;

export const CHARACTER_TYPES = {
    NORMAL: {
        id: 'normal',
        name: '普通火柴人',
        icon: '🔥',
        desc: '攻守均衡,速度中等',
        unlockLevel: 1,
        speed: 5,
        jumpPower: 15,
        damageMultiplier: 1,
        defenseMultiplier: 1
    },
    KUNGFU: {
        id: 'kungfu',
        name: '功夫火柴人',
        icon: '🥋',
        desc: '轻攻击速度快,连击高',
        unlockLevel: 3,
        speed: 6,
        jumpPower: 16,
        damageMultiplier: 0.9,
        defenseMultiplier: 1,
        attackSpeedBonus: 1.2
    },
    STRONG: {
        id: 'strong',
        name: '壮汉火柴人',
        icon: '💪',
        desc: '重攻击伤害高,速度慢',
        unlockLevel: 5,
        speed: 4,
        jumpPower: 13,
        damageMultiplier: 1.3,
        defenseMultiplier: 1.2
    },
    NINJA: {
        id: 'ninja',
        name: '忍者火柴人',
        icon: '🥷',
        desc: '速度快,闪避率高',
        unlockLevel: 8,
        speed: 7,
        jumpPower: 17,
        damageMultiplier: 0.85,
        defenseMultiplier: 0.9,
        dodgeChance: 0.2
    },
    BOSS: {
        id: 'boss',
        name: '老拳师',
        icon: '👴',
        desc: '所有属性高',
        unlockLevel: 99,
        speed: 5,
        jumpPower: 15,
        damageMultiplier: 1.5,
        defenseMultiplier: 1.5
    }
};

export const ENEMY_TYPES = {
    NORMAL: {
        id: 'NORMAL',
        name: '普通敌人',
        aiType: 'normal',
        healthMultiplier: 1,
        damageMultiplier: 1,
        characterType: 'NORMAL'
    },
    AGGRESSIVE: {
        id: 'AGGRESSIVE',
        name: '攻击型',
        aiType: 'aggressive',
        healthMultiplier: 0.9,
        damageMultiplier: 1.2,
        characterType: 'NORMAL'
    },
    DEFENSIVE: {
        id: 'DEFENSIVE',
        name: '防御型',
        aiType: 'defensive',
        healthMultiplier: 1.3,
        damageMultiplier: 0.9,
        characterType: 'NORMAL'
    },
    EVASIVE: {
        id: 'EVASIVE',
        name: '躲避型',
        aiType: 'evasive',
        healthMultiplier: 0.8,
        damageMultiplier: 1.1,
        characterType: 'NORMAL'
    },
    BOSS: {
        id: 'BOSS',
        name: 'BOSS',
        aiType: 'boss',
        healthMultiplier: 2,
        damageMultiplier: 1.5,
        characterType: 'NORMAL'
    }
};

export const LEVELS = [
    { level: 1, scene: 'dojo', enemies: [{ type: 'NORMAL', count: 1 }] },
    { level: 2, scene: 'dojo', enemies: [{ type: 'NORMAL', count: 2 }] },
    { level: 3, scene: 'street', enemies: [{ type: 'AGGRESSIVE', count: 1 }] },
    { level: 4, scene: 'street', enemies: [{ type: 'AGGRESSIVE', count: 2 }] },
    { level: 5, scene: 'ring', enemies: [{ type: 'DEFENSIVE', count: 1 }] },
    { level: 6, scene: 'ring', enemies: [{ type: 'DEFENSIVE', count: 2 }] },
    { level: 7, scene: 'bamboo', enemies: [{ type: 'EVASIVE', count: 1 }] },
    { level: 8, scene: 'bamboo', enemies: [{ type: 'EVASIVE', count: 2 }] },
    { level: 9, scene: 'volcano', enemies: [{ type: 'BOSS', count: 1 }] }
];

export const ATTACK_TYPES = {
    LIGHT_PUNCH: {
        id: 'light_punch',
        name: '轻拳',
        damage: 5,
        stunTime: 300,
        energyGain: 2,
        duration: 200,
        range: 80,
        knockback: 5
    },
    LIGHT_KICK: {
        id: 'light_kick',
        name: '轻腿',
        damage: 6,
        stunTime: 300,
        energyGain: 3,
        duration: 250,
        range: 90,
        knockback: 8
    },
    HEAVY_PUNCH: {
        id: 'heavy_punch',
        name: '重拳',
        damage: 12,
        stunTime: 600,
        energyGain: 5,
        duration: 400,
        range: 85,
        knockback: 20
    },
    HEAVY_KICK: {
        id: 'heavy_kick',
        name: '重腿',
        damage: 15,
        stunTime: 800,
        energyGain: 6,
        duration: 500,
        range: 100,
        knockback: 30,
        breakBlock: true
    },
    JUMP_LIGHT: {
        id: 'jump_light',
        name: '跳跃轻击',
        damage: 8,
        stunTime: 400,
        energyGain: 4,
        duration: 300,
        range: 75,
        knockback: 12
    },
    JUMP_HEAVY: {
        id: 'jump_heavy',
        name: '跳跃重击',
        damage: 14,
        stunTime: 700,
        energyGain: 6,
        duration: 450,
        range: 90,
        knockback: 25
    },
    ULTIMATE: {
        id: 'ultimate',
        name: '必杀技',
        damage: 30,
        stunTime: 1000,
        energyCost: 100,
        duration: 800,
        range: 150,
        knockback: 40,
        unblockable: true
    }
};

export const SCENES = {
    dojo: {
        name: '道场',
        bgColor: '#8B4513',
        groundColor: '#654321'
    },
    street: {
        name: '街头',
        bgColor: '#2F4F4F',
        groundColor: '#333'
    },
    ring: {
        name: '擂台',
        bgColor: '#1a1a2e',
        groundColor: '#4a4a6a'
    },
    bamboo: {
        name: '竹林',
        bgColor: '#1a3a1a',
        groundColor: '#2a4a2a'
    },
    volcano: {
        name: '火山口',
        bgColor: '#3a1a0a',
        groundColor: '#2a0a00'
    }
};

export const STORAGE_KEY = 'stickman_fight_save';