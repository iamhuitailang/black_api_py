const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRAVITY: 0.35,
    
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 50,
        SPEED: 4,
        JUMP_FORCE: -12,
        SHOOT_COOLDOWN: 300,
        SPEED_BOOST: 1.3,
        INVINCIBLE_DURATION: 5000,
        ACCELERATION: 0.6,
        DECELERATION: 0.88,
        MAX_SPEED: 4
    },
    
    PROJECTILE: {
        WIDTH: 16,
        HEIGHT: 16,
        SPEED: 8,
        BIG_WIDTH: 32,
        BIG_HEIGHT: 32,
        BIG_DURATION: 10000
    },
    
    ENEMY: {
        GREEN_MONSTER: {
            name: '绿毛怪',
            hp: 1,
            width: 36,
            height: 36,
            speed: 1,
            score: 100,
            color: '#32CD32'
        },
        RED_BAT: {
            name: '红蝙蝠',
            hp: 1,
            width: 32,
            height: 32,
            speed: 1.5,
            score: 150,
            color: '#FF4500',
            canPassSnowball: true,
            flying: true
        },
        ICE_OCTOPUS: {
            name: '冰章鱼',
            hp: 3,
            width: 44,
            height: 44,
            speed: 0.8,
            score: 300,
            color: '#00CED1',
            jumpy: true
        },
        BOSS: {
            name: '大雪怪',
            hp: 20,
            width: 80,
            height: 80,
            speed: 1,
            score: 2000,
            color: '#8B4513'
        }
    },
    
    SNOWBALL: {
        WIDTH: 40,
        HEIGHT: 40,
        ROLL_SPEED: 6,
        RESTORE_TIME: 6000,
        DESTROY_SCORE: 50
    },
    
    POWERUP: {
        WIDTH: 28,
        HEIGHT: 28,
        DROP_CHANCE: 0.3,
        RED_POTION: {
            name: '红药水',
            type: 'health',
            color: '#FF6B6B',
            effect: '+1生命'
        },
        BLUE_POTION: {
            name: '蓝药水',
            type: 'bigShot',
            color: '#4ECDC4',
            effect: '子弹变大'
        },
        YELLOW_POTION: {
            name: '黄药水',
            type: 'speed',
            color: '#FFE66D',
            effect: '速度提升'
        },
        STAR: {
            name: '无敌星',
            type: 'invincible',
            color: '#FFD700',
            effect: '5秒无敌'
        }
    },
    
    LEVEL: {
        TOTAL_LEVELS: 5,
        ROOMS_PER_LEVEL: 3,
        BOSS_EVERY: 3
    },
    
    COLORS: {
        ICE_BLUE: '#87CEEB',
        DEEP_BLUE: '#4169E1',
        LIGHT_BLUE: '#B0E0E6',
        WHITE: '#FFFFFF',
        LIGHT_PINK: '#FFB6C1',
        DARK_BLUE: '#191970',
        SNOW: '#F0F8FF'
    }
};
