const GameConfig = {
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 600,
    
    GAME_LENGTH: 1000,
    
    LANES: 4,
    LANE_WIDTH: 120,
    LANE_START_X: 180,
    
    BASE_SPEED: 300,
    MAX_SPEED: 1200,
    SPEED_DECAY: 0.94,
    
    PADDLE_TYPES: {
        LIGHT: { boost: 100, name: '轻划', duration: 150 },
        MEDIUM: { boost: 220, name: '稳划', duration: 300 },
        HEAVY: { boost: 380, name: '重划', duration: 500 }
    },
    
    RHYTHM: {
        PERFECT_ZONE: [0.4, 0.6],
        GOOD_ZONE: [0.25, 0.75],
        SWING_SPEED: 0.025,
        PERFECT_MULTIPLIER: 2.0,
        GOOD_MULTIPLIER: 1.0,
        MISS_MULTIPLIER: -0.5
    },
    
    BOATS: {
        green: {
            name: '青龙舟',
            type: 'balanced',
            speedMultiplier: 1.0,
            acceleration: 1.0,
            obstacleResistance: 1.0,
            colors: {
                body: '#2d8a4e',
                bodyDark: '#1a5a32',
                accent: '#4CAF50',
                dragon: '#8BC34A'
            }
        },
        red: {
            name: '烈焰赤龙舟',
            type: 'speed',
            speedMultiplier: 1.15,
            acceleration: 1.3,
            obstacleResistance: 0.7,
            colors: {
                body: '#d32f2f',
                bodyDark: '#8b0000',
                accent: '#f44336',
                dragon: '#ff7043'
            }
        },
        black: {
            name: '玄墨黑龙舟',
            type: 'defense',
            speedMultiplier: 0.9,
            acceleration: 0.85,
            obstacleResistance: 1.5,
            colors: {
                body: '#424242',
                bodyDark: '#1a1a1a',
                accent: '#616161',
                dragon: '#9e9e9e'
            }
        }
    },
    
    OBSTACLES: {
        SPAWN_INTERVAL: 80,
        TYPES: {
            log: {
                name: '浮木',
                width: 60,
                height: 25,
                speedReduction: 0.4,
                damage: 1
            },
            wave: {
                name: '巨浪',
                width: 100,
                height: 40,
                speedReduction: 0.6,
                damage: 2
            },
            reef: {
                name: '暗礁',
                width: 50,
                height: 50,
                speedReduction: 0.5,
                damage: 3
            }
        }
    },
    
    SKILLS: {
        sprint: {
            name: '破浪冲刺',
            cooldown: 8000,
            duration: 3000,
            speedBoost: 2.0,
            key: 'Shift'
        },
        shield: {
            name: '水浪护盾',
            cooldown: 12000,
            duration: 4000,
            key: 'E'
        }
    },
    
    AI: {
        BASE_SKILL: 0.7,
        SKILL_VARIANCE: 0.2,
        REACTION_TIME: 30,
        OVERTAKE_CHANCE: 0.3
    },
    
    STORAGE_KEY: 'longzhou_game_save',
    
    COLORS: {
        water: '#4A90A4',
        waterDark: '#2E6B7A',
        waterLight: '#6BB3C4',
        lane: 'rgba(255, 255, 255, 0.1)',
        laneBorder: 'rgba(255, 255, 255, 0.3)',
        sky: '#87CEEB',
        mountain: '#2d5a3d',
        mountainDark: '#1a3a28',
        flag: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'],
        audience: '#8B4513'
    }
};

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};
