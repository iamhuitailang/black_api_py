const GameConfig = {
    STORAGE_KEY: 'zashua_game_state',
    
    CHARACTER_TYPES: {
        CLOWN: 'clown',
        STREET: 'street',
        STRONG: 'strong',
        GIRL: 'girl'
    },
    
    CHARACTERS: {
        clown: {
            name: '俏皮小丑',
            type: 'clown',
            emoji: '🤡',
            maxHp: 100,
            throwSpeed: 1.0,
            catchTolerance: 1.0,
            skillCooldown: 15000,
            errorResistance: 1.0,
            description: '均衡全能型',
            skillName: '平稳抛接',
            skillDesc: '小幅降低道具速度'
        },
        street: {
            name: '街头艺人',
            type: 'street',
            emoji: '🎭',
            maxHp: 90,
            throwSpeed: 1.5,
            catchTolerance: 0.7,
            skillCooldown: 12000,
            errorResistance: 0.7,
            description: '速度敏捷型',
            skillName: '超快传递',
            skillDesc: '短距离瞬发传递'
        },
        strong: {
            name: '大力壮汉',
            type: 'strong',
            emoji: '💪',
            maxHp: 120,
            throwSpeed: 0.7,
            catchTolerance: 1.5,
            skillCooldown: 18000,
            errorResistance: 1.5,
            description: '力量稳重型',
            skillName: '重型承接',
            skillDesc: '可承接重型危险道具，不易脱手'
        },
        girl: {
            name: '灵动少女',
            type: 'girl',
            emoji: '✨',
            maxHp: 85,
            throwSpeed: 1.2,
            catchTolerance: 1.3,
            skillCooldown: 10000,
            errorResistance: 1.2,
            description: '预判技巧型',
            skillName: '轨迹预判',
            skillDesc: '提前预判道具轨迹，自动微调落点'
        }
    },
    
    ITEM_TYPES: {
        NORMAL: 'normal',
        DANGER: 'danger',
        BUFF: 'buff'
    },
    
    DANGER_LEVELS: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        FATAL: 'fatal'
    },
    
    NORMAL_ITEMS: [
        {
            id: 'ball',
            name: '彩球',
            emoji: '🔴',
            type: 'normal',
            score: 5,
            missDamage: 0,
            speed: 0.7,
            color: '#ff4444'
        },
        {
            id: 'ring',
            name: '圆环',
            emoji: '⭕',
            type: 'normal',
            score: 8,
            missDamage: 0,
            speed: 1.0,
            color: '#ffaa00'
        },
        {
            id: 'flower',
            name: '鲜花',
            emoji: '🌸',
            type: 'normal',
            score: 10,
            missDamage: 0,
            speed: 1.0,
            color: '#ff88cc'
        }
    ],
    
    DANGER_ITEMS: [
        {
            id: 'fireball',
            name: '燃烧火球',
            emoji: '🔥',
            type: 'danger',
            dangerLevel: 'high',
            score: 15,
            missDamage: 25,
            speed: 1.0,
            color: '#ff6600'
        },
        {
            id: 'spike',
            name: '尖刺铁球',
            emoji: '💀',
            type: 'danger',
            dangerLevel: 'fatal',
            score: 20,
            missDamage: 35,
            speed: 1.0,
            color: '#888888'
        },
        {
            id: 'chaos',
            name: '混乱皮球',
            emoji: '🎃',
            type: 'danger',
            dangerLevel: 'medium',
            score: 12,
            missDamage: 20,
            speed: 1.2,
            color: '#aa44ff'
        },
        {
            id: 'bomb',
            name: '爆破礼盒',
            emoji: '💣',
            type: 'danger',
            dangerLevel: 'high',
            score: 18,
            missDamage: 30,
            speed: 0.9,
            color: '#444444'
        }
    ],
    
    BUFF_ITEMS: [
        {
            id: 'star',
            name: '金色星星',
            emoji: '⭐',
            type: 'buff',
            buffType: 'invincible',
            duration: 3000,
            speed: 0.8,
            color: '#ffdd00'
        },
        {
            id: 'feather',
            name: '轻盈羽毛',
            emoji: '🪶',
            type: 'buff',
            buffType: 'slow',
            duration: 4000,
            speed: 0.8,
            color: '#88ccff'
        },
        {
            id: 'shield',
            name: '守护护盾',
            emoji: '🛡️',
            type: 'buff',
            buffType: 'shield',
            duration: 0,
            speed: 0.8,
            color: '#44aaff'
        }
    ],
    
    THEMES: {
        hell: {
            name: '炼狱',
            bgGradient: ['#1a0000', '#2d0000', '#1a0000'],
            groundColor: '#3d1a00',
            accentColor: '#ff4444',
            particleColors: ['#ff4400', '#ff6600', '#ffaa00'],
            hasFire: true
        },
        circus: {
            name: '马戏团',
            bgGradient: ['#1a1a00', '#2d2d00', '#1a1a00'],
            groundColor: '#4a2c0a',
            accentColor: '#ffcc00',
            particleColors: ['#ffcc00', '#ff6600', '#ff0066'],
            hasFire: false
        },
        street: {
            name: '街头',
            bgGradient: ['#001a1a', '#002d2d', '#001a1a'],
            groundColor: '#1a2d2d',
            accentColor: '#00ffff',
            particleColors: ['#00ffff', '#00aaff', '#0066ff'],
            hasFire: false
        }
    },
    
    GAME: {
        maxPlayers: 4,
        stunDuration: 1500,
        itemSpawnInterval: 2000,
        roundDuration: 60000,
        catchRadius: 60,
        playerSpeed: 5,
        gravity: 0.5,
        baseThrowForce: 12
    },
    
    AI: {
        reactionTime: 300,
        accuracy: 0.85,
        moveSpeed: 0.8
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}