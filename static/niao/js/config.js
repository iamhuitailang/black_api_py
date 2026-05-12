const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    
    GRAVITY: 0.3,
    FRICTION: 0.995,
    BOUNCE: 0.7,
    
    SLINGSHOT_X: 200,
    SLINGSHOT_Y: 500,
    MAX_PULL_DISTANCE: 150,
    MAX_SPEED: 35,
    
    BIRD_TYPES: {
        RED: {
            name: '红鸟',
            color: '#FF6347',
            radius: 20,
            mass: 1,
            damage: 1,
            skill: null
        },
        YELLOW: {
            name: '黄鸟',
            color: '#FFD700',
            radius: 18,
            mass: 0.8,
            damage: 1.5,
            skill: 'speed'
        },
        BLUE: {
            name: '蓝鸟',
            color: '#4169E1',
            radius: 16,
            mass: 0.6,
            damage: 0.8,
            skill: 'split'
        },
        BLACK: {
            name: '黑鸟',
            color: '#2F2F2F',
            radius: 22,
            mass: 1.5,
            damage: 2,
            skill: 'explode'
        },
        WHITE: {
            name: '白鸟',
            color: '#F5F5F5',
            radius: 21,
            mass: 1.2,
            damage: 1.2,
            skill: 'egg'
        }
    },
    
    PIG_TYPES: {
        BASIC: {
            name: '小猪',
            color: '#90EE90',
            radius: 25,
            health: 1,
            score: 5000
        },
        HELMET: {
            name: '头盔猪',
            color: '#32CD32',
            radius: 28,
            health: 2,
            score: 10000
        },
        KING: {
            name: '国王猪',
            color: '#228B22',
            radius: 35,
            health: 4,
            score: 20000
        }
    },
    
    MATERIAL_TYPES: {
        WOOD: {
            name: '木头',
            color: '#8B4513',
            health: 2,
            damageMultiplier: 1
        },
        STONE: {
            name: '石头',
            color: '#808080',
            health: 5,
            damageMultiplier: 0.5
        },
        ICE: {
            name: '冰块',
            color: '#87CEEB',
            health: 1,
            damageMultiplier: 1.5
        }
    },
    
    SCORE: {
        REMAINING_BIRD: 10000,
        TNT: 2000,
        COMBO: 500
    },
    
    STORAGE_KEY: 'angry_birds_save'
};
