export const CONFIG = {
    GAME: {
        TARGET_FPS: 60,
        SUMMIT_ALTITUDE: 8848,
        STORAGE_KEY: 'pandeng_game_state',
        BEST_SCORE_KEY: 'pandeng_best_score'
    },
    
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 60,
        MAX_STAMINA: 100,
        STAMINA_REGEN_RATE: 15,
        JUMP_STAMINA_COST: 20,
        FALL_STAMINA_COST: 30,
        JUMP_DURATION: 400,
        FALL_SPEED: 300,
        SLIDE_SPEED: 200,
        MAX_JUMP_DISTANCE: 350,
        MIN_JUMP_DISTANCE: 30
    },

    HOLD: {
        WIDTH: 60,
        HEIGHT: 25,
        MIN_GAP_Y: 80,
        MAX_GAP_Y: 150,
        MIN_GAP_X: 30,
        REST_STAMINA_BONUS: 30,
        TYPES: {
            NORMAL: 'normal',
            REST: 'rest',
            ICE: 'ice',
            CRACK: 'crack'
        }
    },

    OBSTACLE: {
        ROCK: {
            WIDTH: 40,
            HEIGHT: 40,
            SPEED: 250,
            SPAWN_INTERVAL: 3000,
            DAMAGE: 25
        },
        BIRD: {
            WIDTH: 50,
            HEIGHT: 30,
            SPEED: 300,
            SPAWN_INTERVAL: 5000
        },
        WIND: {
            STRENGTH: 80,
            DURATION: 2000,
            INTERVAL: 8000
        }
    },

    CAMERA: {
        FOLLOW_SPEED: 0.08,
        PLAYER_OFFSET_Y: 0.65,
        ZOOM_NORMAL: 1,
        ZOOM_FALLING: 0.7,
        ZOOM_SUMMIT: 1.2
    },

    PARTICLES: {
        SNOW_COUNT: 100,
        SNOW_SPEED_MIN: 30,
        SNOW_SPEED_MAX: 80,
        SNOW_SIZE_MIN: 2,
        SNOW_SIZE_MAX: 6
    },

    COLORS: {
        SKY_TOP: '#f0f8ff',
        SKY_MID: '#d0e8ff',
        SKY_BOTTOM: '#a8c8f0',
        WALL: '#e8f0f8',
        WALL_SHADOW: '#b8c8d8',
        WALL_EDGE: '#98a8b8',
        HOLD_NORMAL: '#8b7355',
        HOLD_NORMAL_LIGHT: '#a08060',
        HOLD_REST: '#4ade80',
        HOLD_REST_LIGHT: '#86efac',
        HOLD_ICE: 'rgba(135, 206, 250, 0.7)',
        HOLD_ICE_LIGHT: 'rgba(173, 216, 230, 0.9)',
        HOLD_CRACK: '#4a4a4a',
        PLAYER_BODY: '#ef4444',
        PLAYER_HEAD: '#fcd34d',
        PLAYER_OUTLINE: '#991b1b',
        ROCK: '#6b7280',
        ROCK_LIGHT: '#9ca3af',
        BIRD: '#1f2937',
        BIRD_WING: '#374151'
    }
};

export const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};
