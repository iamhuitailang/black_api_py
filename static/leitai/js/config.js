const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    TABLE: {
        TOP: 100,
        BOTTOM: 500,
        LEFT: 100,
        RIGHT: 700,
        NET_Y: 300,
        COLOR: '#1e5a32',
        BORDER_COLOR: '#ffffff',
        NET_COLOR: 'rgba(255, 255, 255, 0.9)',
        LINE_COLOR: '#ffffff'
    },

    PADDLE: {
        WIDTH: 100,
        HEIGHT: 14,
        SPEED: 9,
        COLOR: '#00ffff',
        AI_COLOR: '#ff6b6b',
        GLOW_INTENSITY: 15
    },

    BALL: {
        RADIUS: 9,
        BASE_SPEED: 7,
        MAX_SPEED: 16,
        COLOR: '#ffffff',
        TRAIL_LENGTH: 6,
        GLOW_INTENSITY: 18
    },

    SPIN: {
        NONE: 0,
        TOPSPIN: 1,
        BACKSPIN: 2,
        SIDESPIN_LEFT: 3,
        SIDESPIN_RIGHT: 4,
        EFFECT: 0.2
    },

    SHOT: {
        NORMAL: 'normal',
        SMASH: 'smash',
        CHOP: 'chop',
        FLICK: 'flick',
        TOPSPIN_LOOP: 'topspin_loop'
    },

    GAME: {
        WIN_SCORE: 11,
        SERVE_INTERVAL: 1200,
        MAX_RALLY: 50
    },

    COLORS: {
        GOLD: '#ffd700',
        CYAN: '#00ffff',
        RED: '#ff6b6b',
        DARK_BG: '#1a1a3e',
        LIGHT_BG: '#2d2d5a'
    },

    PARTICLES: {
        MAX_COUNT: 60,
        HIT_EFFECT_COUNT: 10,
        TRAIL_COUNT: 2
    },

    STORAGE_KEY: 'pingpong_leitai_save'
};
