const GameConfig = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,

    WIRE_LENGTH: 1000,
    WIRE_Y: 0.55,

    PHYSICS: {
        GRAVITY: 0.3,
        SWING_SPEED: 0.02,
        MAX_SWING_ANGLE: 45,
        FALL_THRESHOLD: 60,
        RECOVERY_RATE: 0.1
    },

    CHARACTERS: [
        {
            id: 'walker',
            name: '普通行者',
            desc: '平衡均衡，上手简单',
            passive: '小幅失衡自动回正',
            color: '#4ade80',
            stats: {
                balanceMax: 85,
                windResist: 0.5,
                moveSpeed: 1.0,
                recoverySpeed: 1.0,
                fallDistance: 1.0
            }
        },
        {
            id: 'acrobat',
            name: '杂技艺人',
            desc: '身姿灵活，抗风性强',
            passive: '短暂减缓摇晃幅度',
            color: '#f472b6',
            stats: {
                balanceMax: 90,
                windResist: 0.7,
                moveSpeed: 1.2,
                recoverySpeed: 1.3,
                fallDistance: 1.2
            }
        },
        {
            id: 'master',
            name: '高空大师',
            desc: '行走极稳，容错率高',
            passive: '临危不慌',
            color: '#fbbf24',
            stats: {
                balanceMax: 98,
                windResist: 0.9,
                moveSpeed: 0.9,
                recoverySpeed: 1.5,
                fallDistance: 1.5
            }
        }
    ],

    SCENES: [
        {
            id: 'mountain',
            name: '山间云海',
            desc: '云雾多、风力柔和，新手友好',
            difficulty: 1,
            wireHeight: 0.55,
            colors: {
                skyTop: '#87ceeb',
                skyBottom: '#e0f7fa',
                wire: '#5d4037',
                cloud: 'rgba(255, 255, 255, 0.9)'
            },
            obstacleRate: 0.3,
            windStrength: 0.3,
            birdRate: 0.2,
            rockRate: 0.1
        },
        {
            id: 'city',
            name: '城市高空',
            desc: '楼宇风大、飞鸟密集，难度中等',
            difficulty: 2,
            wireHeight: 0.6,
            colors: {
                skyTop: '#ff9a9e',
                skyBottom: '#fecfef',
                wire: '#455a64',
                cloud: 'rgba(255, 255, 255, 0.7)'
            },
            obstacleRate: 0.5,
            windStrength: 0.5,
            birdRate: 0.4,
            rockRate: 0.15
        },
        {
            id: 'canyon',
            name: '峡谷深渊',
            desc: '狂风频发、落石多，极限高难度',
            difficulty: 3,
            wireHeight: 0.5,
            colors: {
                skyTop: '#667eea',
                skyBottom: '#764ba2',
                wire: '#37474f',
                cloud: 'rgba(200, 200, 255, 0.6)'
            },
            obstacleRate: 0.7,
            windStrength: 0.8,
            birdRate: 0.2,
            rockRate: 0.5
        }
    ],

    ITEMS: [
        {
            id: 'balance_beam',
            name: '平衡木',
            emoji: '🪵',
            desc: '小幅提升平衡上限',
            effect: 'balanceBoost',
            duration: 10000
        },
        {
            id: 'wind_cloak',
            name: '防风斗篷',
            emoji: '🧥',
            desc: '免疫狂风干扰',
            effect: 'windImmune',
            duration: 8000
        },
        {
            id: 'calm_pill',
            name: '定心丸',
            emoji: '💊',
            desc: '瞬间清空所有失衡',
            effect: 'instantCalm',
            duration: 0
        },
        {
            id: 'safety_rope',
            name: '安全绳索',
            emoji: '🪢',
            desc: '接近掉落时自动拉住',
            effect: 'safetySave',
            duration: 0
        }
    ],

    OBSTACLE_TYPES: {
        BIRD: 'bird',
        ROCK: 'rock',
        WIND: 'wind'
    },

    INPUT: {
        TILT_SMALL: 0.15,
        TILT_BIG: 0.4,
        TILT_SMALL_DURATION: 100,
        TILT_BIG_DURATION: 300,
        CALM_DURATION: 200
    }
};
