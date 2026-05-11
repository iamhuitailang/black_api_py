const Constants = {
    CANVAS: {
        WIDTH: 1200,
        HEIGHT: 700
    },
    
    PHYSICS: {
        GRAVITY: 0.25,
        REAL_GRAVITY: 0.4,
        AIR_RESISTANCE: 0.001,
        MAX_VELOCITY: 30
    },
    
    WIND: {
        NO_WIND: 0,
        LIGHT_BREEZE: 0.5,
        MODERATE: 1.0,
        STRONG: 2.0,
        GALE: 3.0
    },
    
    ARROW_TYPES: {
        WOOD: {
            id: 'wood',
            name: '木箭',
            damage: 1,
            windResistance: 1.0,
            gravityMultiplier: 1.0,
            speedMultiplier: 1.0,
            color: '#8b4513',
            description: '标准箭，受风力影响一般'
        },
        IRON: {
            id: 'iron',
            name: '铁箭',
            damage: 2,
            windResistance: 0.5,
            gravityMultiplier: 1.5,
            speedMultiplier: 0.8,
            color: '#808080',
            description: '射程近，穿透力强'
        },
        FEATHER: {
            id: 'feather',
            name: '羽毛箭',
            damage: 1,
            windResistance: 0.3,
            gravityMultiplier: 0.8,
            speedMultiplier: 1.2,
            color: '#4682b4',
            description: '受风力影响小，精度高'
        },
        FIRE: {
            id: 'fire',
            name: '火箭',
            damage: 3,
            windResistance: 1.2,
            gravityMultiplier: 1.0,
            speedMultiplier: 1.0,
            color: '#ff4500',
            description: '命中后爆炸范围伤害',
            explosive: true,
            explosionRadius: 50
        },
        HOOK: {
            id: 'hook',
            name: '钩爪箭',
            damage: 1,
            windResistance: 1.0,
            gravityMultiplier: 1.0,
            speedMultiplier: 1.0,
            color: '#daa520',
            description: '可拉拽物体/攀爬',
            hook: true
        }
    },
    
    TARGET_TYPES: {
        STATIC: {
            id: 'static',
            name: '固定靶',
            moving: false,
            scoreMultiplier: 10,
            radius: 80
        },
        MOVING: {
            id: 'moving',
            name: '移动靶',
            moving: true,
            scoreMultiplier: 15,
            radius: 70,
            speed: 1
        },
        DEER: {
            id: 'deer',
            name: '鹿',
            animal: true,
            moving: true,
            scoreMultiplier: 1,
            criticalMultiplier: 2,
            radius: 50
        },
        BIRD: {
            id: 'bird',
            name: '鸟',
            animal: true,
            moving: true,
            flying: true,
            scoreMultiplier: 1,
            criticalMultiplier: 2,
            radius: 25
        },
        BOAR: {
            id: 'boar',
            name: '野猪',
            animal: true,
            moving: true,
            scoreMultiplier: 1,
            criticalMultiplier: 2,
            radius: 40
        },
        ENEMY: {
            id: 'enemy',
            name: '盔甲兵',
            enemy: true,
            moving: true,
            scoreMultiplier: 1,
            headshotMultiplier: 5,
            radius: 45
        },
        APPLE: {
            id: 'apple',
            name: '苹果',
            moving: false,
            scoreMultiplier: 50,
            radius: 20
        }
    },
    
    GAME_MODES: {
        TRAINING: {
            id: 'training',
            name: '训练场',
            description: '固定靶，无风，无限箭',
            infiniteArrows: true,
            windEnabled: false,
            gravityEnabled: false,
            timeLimit: null,
            targetTypes: ['static']
        },
        HUNTING: {
            id: 'hunting',
            name: '狩猎季',
            description: '移动动物目标，限时/限箭',
            infiniteArrows: false,
            arrowCount: 20,
            windEnabled: false,
            gravityEnabled: true,
            timeLimit: 120,
            targetTypes: ['deer', 'bird', 'boar']
        },
        WIND: {
            id: 'wind',
            name: '风之试炼',
            description: '风力多变，需要计算偏移',
            infiniteArrows: true,
            windEnabled: true,
            variableWind: true,
            gravityEnabled: true,
            timeLimit: null,
            targetTypes: ['static', 'moving']
        },
        SURVIVAL: {
            id: 'survival',
            name: '生存战',
            description: '敌人射箭反击，需躲避',
            infiniteArrows: true,
            windEnabled: false,
            gravityEnabled: true,
            timeLimit: 60,
            targetTypes: ['enemy'],
            enemiesAttack: true
        },
        TOURNAMENT: {
            id: 'tournament',
            name: '锦标赛',
            description: '多轮累计分数制',
            infiniteArrows: false,
            arrowCount: 10,
            windEnabled: true,
            gravityEnabled: true,
            rounds: 5,
            timeLimit: 30,
            targetTypes: ['static', 'moving', 'apple']
        }
    },
    
    DIFFICULTIES: {
        EASY: {
            id: 'easy',
            name: '简单',
            gravity: 0,
            wind: 0,
            timeLimit: null,
            targetSizeMultiplier: 1.5
        },
        NORMAL: {
            id: 'normal',
            name: '普通',
            gravity: 0.25,
            wind: 0.5,
            timeLimit: null,
            targetSizeMultiplier: 1.0
        },
        HARD: {
            id: 'hard',
            name: '困难',
            gravity: 0.25,
            wind: 1.0,
            variableWind: true,
            timeLimit: 60,
            targetSizeMultiplier: 0.8
        },
        MASTER: {
            id: 'master',
            name: '大师',
            gravity: 0.4,
            wind: 1.5,
            variableWind: true,
            timeLimit: 45,
            targetSizeMultiplier: 0.6
        }
    },
    
    BOW: {
        MAX_POWER: 25,
        MIN_POWER: 5,
        POWER_DECREASE_RATE: 0.5
    },
    
    COLORS: {
        GROUND: '#8b7355',
        SKY_TOP: '#87ceeb',
        SKY_BOTTOM: '#e0f6ff',
        SUN: '#ffd700',
        TARGET_RED: '#dc143c',
        TARGET_WHITE: '#ffffff',
        TARGET_YELLOW: '#ffd700',
        TARGET_BLUE: '#4169e1',
        TARGET_BLACK: '#000000',
        BOW: '#8b4513',
        BOW_STRING: '#d4a574'
    }
};

window.Constants = Constants;