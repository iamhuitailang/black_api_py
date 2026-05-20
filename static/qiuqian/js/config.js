const CONFIG = {
    STORAGE_KEY: 'qiuqian_game_save',
    
    GRAVITY: 0.25,
    AIR_RESISTANCE: 0.995,
    
    SWING: {
        MIN_ANGLE: -Math.PI / 2,
        MAX_ANGLE: Math.PI / 2,
        SWING_SPEED: 0.05,
        GRAVITY_EFFECT: 0.008,
        DAMPING: 0.9995
    },
    
    CHARGE: {
        MAX_CHARGE: 100,
        CHARGE_RATE: 1.0,
        MIN_RELEASE: 5,
        LEVELS: {
            LIGHT: { threshold: 33, power: 18, height: 0.8, name: '轻蓄力' },
            MEDIUM: { threshold: 66, power: 26, height: 1.3, name: '中蓄力' },
            FULL: { threshold: 100, power: 35, height: 2.0, name: '满蓄力' }
        }
    },
    
    AIR: {
        GLIDE_FALL_SPEED: 2,
        DIVE_SPEED: 8,
        HOVER_DURATION: 60,
        HOVER_FALL_SPEED: 0.5,
        CONTROL_SPEED: 0.3
    },
    
    COLLISION: {
        SWING_CATCH_RADIUS: 150,
        PERFECT_CATCH_RADIUS: 60
    },
    
    SCORE: {
        PERFECT_CATCH: 100,
        NORMAL_CATCH: 50,
        OBSTACLE_AVOID: 30,
        TIME_BONUS_PER_SECOND: 5,
        LEVEL_CLEAR: 500
    },
    
    FAIL: {
        MAX_MISSES: 3,
        TIME_LIMIT: 180
    },
    
    COLORS: {
        SKY_TOP: '#87CEEB',
        SKY_MID: '#E0F6FF',
        SKY_BOTTOM: '#FFF5E6',
        CLOUD: '#FFFFFF',
        ISLAND_TOP: '#90EE90',
        ISLAND_SIDE: '#8B7355',
        SWING_ROPE: '#8B4513',
        SWING_SEAT: '#DEB887',
        PLAYER_BODY: '#FF6B6B',
        PLAYER_HEAD: '#FFD93D',
        ROPE_OBSTACLE: '#333333',
        WIND_ZONE: 'rgba(135, 206, 235, 0.3)'
    }
};

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
    VICTORY: 'victory'
};

const PLAYER_STATE = {
    SWINGING: 'swinging',
    CHARGING: 'charging',
    AIRBORNE: 'airborne',
    CATCHING: 'catching'
};

const OBSTACLE_TYPE = {
    CLOUD: 'cloud',
    ROPE: 'rope',
    WIND: 'wind',
    GAP: 'gap'
};
