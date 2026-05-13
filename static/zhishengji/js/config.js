const CONFIG = {
    STORAGE_KEY: 'helicopter_rescue_game',
    
    HELICOPTER_TYPES: {
        small: {
            name: '小型救援机',
            maxSpeed: 5,
            acceleration: 0.3,
            maxFuel: 60,
            ropeLength: 150,
            size: 40
        },
        medium: {
            name: '中型直升机',
            maxSpeed: 4,
            acceleration: 0.25,
            maxFuel: 90,
            ropeLength: 200,
            size: 50
        }
    },

    RESCUE_TYPES: {
        climber: {
            name: '登山客',
            emoji: '🧗',
            score: 100,
            needRope: true,
            climbTime: 2000,
            description: '悬停正上方放绳'
        },
        flood: {
            name: '洪灾被困者',
            emoji: '🏊',
            score: 150,
            needRope: true,
            climbTime: 3000,
            description: '放绳+等待爬升'
        },
        fire: {
            name: '火灾幸存者',
            emoji: '🔥',
            score: 200,
            needRope: true,
            climbTime: 1500,
            hasTimer: true,
            timer: 30000,
            description: '快速救援(倒计时)'
        },
        injured: {
            name: '伤者(担架)',
            emoji: '🚑',
            score: 250,
            needRope: true,
            climbTime: 4000,
            needSteady: true,
            description: '需平稳起降'
        },
        pet: {
            name: '宠物/动物',
            emoji: '🐕',
            score: 50,
            needRope: false,
            willApproach: true,
            description: '主动靠近直升机'
        }
    },

    OBSTACLE_TYPES: {
        mountain: {
            name: '山峰',
            lethal: true,
            color: '#6B8E6B'
        },
        building: {
            name: '建筑',
            lethal: true,
            color: '#808080'
        },
        powerline: {
            name: '高压线',
            lethal: false,
            effect: 'shortCircuit',
            color: '#333'
        },
        turbulence: {
            name: '乱气流',
            lethal: false,
            effect: 'turbulence',
            color: 'rgba(200, 200, 255, 0.3)'
        },
        bird: {
            name: '飞鸟',
            lethal: false,
            effect: 'damage',
            color: '#333'
        },
        enemyFire: {
            name: '敌方火力',
            lethal: false,
            effect: 'fuelLeak',
            color: '#FF4444'
        }
    },

    PHYSICS: {
        gravity: 0.15,
        friction: 0.98,
        airResistance: 0.99,
        maxVelocity: 10
    },

    GAME: {
        targetFPS: 60,
        ropeSpeed: 3,
        rescueDistance: 60,
        safeZoneRadius: 80
    }
};

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};