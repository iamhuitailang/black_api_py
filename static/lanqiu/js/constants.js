const CONSTANTS = {
    GAME_STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAMEOVER: 'gameover'
    },

    PHYSICS: {
        GRAVITY: 0.35,
        FRICTION: 0.98,
        BOUNCE_COEFFICIENT: 0.65,
        MAX_POWER: 22,
        MIN_POWER: 6,
        POWER_SCALE: 0.1
    },

    ANGLE: {
        MIN: 35,
        MAX: 75,
        OPTIMAL_MIN: 45,
        OPTIMAL_MAX: 65
    },

    POWER: {
        GREEN_ZONE_MIN: 35,
        GREEN_ZONE_MAX: 65
    },

    SCORING: {
        FREE_THROW: 2,
        THREE_POINTER: 3,
        SWISH_BONUS: 10,
        COMBO_MIN_BONUS: 1,
        COMBO_MAX_BONUS: 10,
        SWISH_TIME_BONUS: 0.5
    },

    ENERGY: {
        MAX: 100,
        PER_SHOT: 15,
        PER_SWISH: 25,
        PER_COMBO: 5
    },

    TIME: {
        GAME_DURATION: 60,
        TICK_INTERVAL: 100
    },

    COLORS: {
        COURT_ORANGE: '#FF8C00',
        COURT_ORANGE_LIGHT: '#FFA500',
        COURT_ORANGE_DARK: '#E67E00',
        BACKBOARD_BROWN: '#5D3A1A',
        BACKBOARD_BROWN_LIGHT: '#7A4A2A',
        NET_WHITE: '#FFFFFF',
        NET_GRAY: '#E0E0E0',
        BALL_ORANGE: '#FF6B00',
        BALL_ORANGE_DARK: '#E65A00',
        GREEN_ZONE: '#4CAF50',
        RED_ZONE: '#F44336',
        YELLOW_ZONE: '#FFC107',
        SKY_BLUE: '#87CEEB',
        SKY_BLUE_DARK: '#4682B4',
        PLAYER_SKIN: '#FDBF6F',
        PLAYER_SHIRT: '#E74C3C',
        PLAYER_PANTS: '#2C3E50',
        DEFENDER_SHIRT: '#3498DB'
    },

    DIMENSIONS: {
        CANVAS_WIDTH: 1100,
        CANVAS_HEIGHT: 650,
        COURT_HEIGHT: 120,
        BACKBOARD_WIDTH: 80,
        BACKBOARD_HEIGHT: 60,
        HOOP_RADIUS: 18,
        HOOP_Y: 200,
        PLAYER_SCALE: 0.65,
        BALL_RADIUS: 13,
        NET_LENGTH: 40
    },

    POSITIONS: {
        GROUND_Y: 650 - 120,
        
        PLAYER_X: 200,
        PLAYER_FEET_Y: 650 - 120,
        
        HOOP_X: 820,
        HOOP_CENTER_Y: 200,
        
        BACKBOARD_X: 860,
        BACKBOARD_TOP_Y: 200 - 55,
        
        FREE_THROW_LINE: 450,
        THREE_POINT_LINE: 320
    },

    ANIMATION: {
        BALL_ROTATION_SPEED: 0.08,
        PLAYER_IDLE_SPEED: 0.015,
        DEFENDER_WAVE_SPEED: 0.04,
        EFFECT_DURATION: 1200,
        NET_SWING_SPEED: 0.025
    },

    STORAGE_KEYS: {
        GAME_STATE: 'streetBasketball_v2_gameState',
        SCORE: 'streetBasketball_v2_score',
        COMBO: 'streetBasketball_v2_combo',
        MAX_COMBO: 'streetBasketball_v2_maxCombo',
        TIME_LEFT: 'streetBasketball_v2_timeLeft',
        ENERGY: 'streetBasketball_v2_energy',
        BALL_X: 'streetBasketball_v2_ballX',
        BALL_Y: 'streetBasketball_v2_ballY',
        BALL_IS_FLYING: 'streetBasketball_v2_ballIsFlying',
        LAST_SAVE: 'streetBasketball_v2_lastSave'
    },

    DEFENDER: {
        INTERFERENCE_CHANCE: 0.35,
        INTERFERENCE_PENALTY: 0.2,
        YELL_CHANCE: 0.25,
        YELL_DURATION: 2000,
        YELL_PENALTY: 0.15,
        POSITION_X: 700,
        POSITION_Y: 650 - 120
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
