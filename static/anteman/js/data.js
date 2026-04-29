// 奥特曼数据
const ULTRAMAN_DATA = {
    tiga: {
        name: '迪迦奥特曼',
        emoji: '🦸‍♂️',
        type: '均衡型',
        maxHp: 100,
        baseAtk: 15,
        baseDef: 5,
        maxEnergy: 100,
        specialSkill: {
            name: '复合光线',
            description: '伤害 + 回复10生命'
        },
        color: '#3b82f6'
    }
};

// 怪兽数据（按关卡）
const MONSTER_DATA = [
    {
        level: 1,
        name: '哥莫拉',
        emoji: '🦖',
        maxHp: 50,
        atk: 10,
        specialAbility: null,
        description: '无特殊能力',
        reward: {
            gold: 50,
            energy: 20
        },
        color: '#22c55e'
    },
    {
        level: 2,
        name: '雷德王',
        emoji: '🦇',
        maxHp: 70,
        atk: 15,
        specialAbility: {
            type: 'crit',
            chance: 0.2,
            multiplier: 2
        },
        description: '暴击率 20%',
        reward: {
            gold: 70,
            energy: 25
        },
        color: '#f97316'
    },
    {
        level: 3,
        name: '杰顿',
        emoji: '🦎',
        maxHp: 90,
        atk: 20,
        specialAbility: {
            type: 'block',
            chance: 0.3
        },
        description: '有概率格挡普通攻击',
        reward: {
            gold: 100,
            energy: 30
        },
        color: '#8b5cf6'
    },
    {
        level: 4,
        name: '加坦杰厄',
        emoji: '🐙',
        maxHp: 120,
        atk: 25,
        specialAbility: {
            type: 'regen',
            amount: 5
        },
        description: '每回合回复 5 生命',
        reward: {
            gold: 150,
            energy: 35
        },
        color: '#ec4899'
    },
    {
        level: 5,
        name: '黑暗扎基',
        emoji: '👾',
        maxHp: 150,
        atk: 30,
        specialAbility: {
            type: 'boss',
            critChance: 0.3,
            critMultiplier: 2
        },
        description: '免疫控制，双倍暴击',
        reward: {
            gold: 300,
            energy: 50
        },
        color: '#ef4444',
        isBoss: true
    }
];

// 技能数据
const SKILL_DATA = {
    punch: {
        name: '拳击',
        emoji: '🥊',
        damage: 15,
        energyCost: 0,
        energyGain: 5,
        description: '基础攻击',
        isBasic: true
    },
    kick: {
        name: '踢击',
        emoji: '🦶',
        damage: 20,
        energyCost: 0,
        energyGain: 5,
        description: '中伤害',
        isBasic: true
    },
    beam: {
        name: '光线技能',
        emoji: '✨',
        damage: 50,
        energyCost: 50,
        energyGain: 0,
        description: '高伤害，需能量 ≥ 50',
        isSpecial: true,
        healAmount: 10
    },
    defend: {
        name: '防御',
        emoji: '🛡️',
        damage: 0,
        energyCost: 0,
        energyGain: 10,
        description: '本回合受到的伤害减半',
        isDefend: true,
        damageReduction: 0.5
    }
};

// 游戏状态枚举
const GAME_STATE = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character_select',
    BATTLE: 'battle',
    VICTORY: 'victory',
    GAMEOVER: 'gameover',
    COMPLETE: 'complete'
};

// 回合状态
const TURN_STATE = {
    PLAYER: 'player',
    MONSTER: 'monster',
    ANIMATING: 'animating'
};

// localStorage 键名
const STORAGE_KEYS = {
    GAME_DATA: 'anteman_game_data',
    BATTLE_LOG: 'anteman_battle_log'
};
