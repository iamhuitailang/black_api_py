const CONFIG = {
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        MIN_WIDTH: 400,
        MIN_HEIGHT: 500
    },

    PLAYER: {
        WIDTH: 50,
        HEIGHT: 30,
        SPEED: 8,
        INITIAL_LIVES: 3,
        MAX_LIVES: 5,
        INVINCIBLE_TIME: 2000,
        COLOR: '#00ffff',
        BULLET_COLOR: '#00ff88',
        BULLET_SPEED: 12,
        MAX_BULLETS: 4
    },

    INVADERS: {
        ROWS: 5,
        COLS: 10,
        WIDTH: 42,
        HEIGHT: 32,
        PADDING: 15,
        START_X: 60,
        START_Y: 80,
        BASE_SPEED: 0.8,
        SPEED_INCREMENT: 0.12,
        DOWN_STEP: 18,
        BULLET_COLOR: '#ff6644',
        BULLET_SPEED: 5,
        SHOOT_INTERVAL: 1800,
        MIN_SHOOT_INTERVAL: 600,
        TYPES: [
            { name: 'small', points: 10, color: '#88ffff', row: 0 },
            { name: 'medium', points: 20, color: '#ffff66', row: 1 },
            { name: 'large', points: 30, color: '#66ff66', row: 2 }
        ]
    },

    BUNKERS: {
        COUNT: 4,
        WIDTH: 50,
        HEIGHT: 35,
        COLOR: '#6688aa',
        DAMAGE_COLOR: '#ff8844',
        MAX_DAMAGE: 10,
        Y_OFFSET: 120
    },

    UFO: {
        WIDTH: 55,
        HEIGHT: 28,
        SPEED: 3.5,
        COLOR: '#ff88ff',
        MIN_POINTS: 100,
        MAX_POINTS: 300,
        SPAWN_INTERVAL: 12000,
        SPAWN_CHANCE: 0.5
    },

    GAME: {
        EXTRA_LIFE_SCORE: 1500,
        LEVEL_SPEED_MULTIPLIER: 1.15,
        SHOOT_INTERVAL_DECREASE: 0.85,
        BULLET_SPEED_INCREASE: 1.08
    },

    KEYS: {
        LEFT: ['ArrowLeft', 'KeyA'],
        RIGHT: ['ArrowRight', 'KeyD'],
        SHOOT: ['Space'],
        PAUSE: ['Escape'],
        RESTART: ['KeyR']
    },

    STORAGE: {
        KEY: 'space_invaders_save',
        HIGH_SCORE_KEY: 'space_invaders_high_score',
        AUTO_SAVE_INTERVAL: 5000
    }
};

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    LEVEL_UP: 'level_up'
};

const COLORS = {
    BACKGROUND: '#000011',
    STARS: ['#ffffff', '#ffffcc', '#ccccff'],
    PLAYER_GLOW: 'rgba(0, 255, 255, 0.5)',
    BULLET_GLOW: 'rgba(0, 255, 0, 0.5)',
    INVADER_GLOW: 'rgba(255, 0, 255, 0.3)'
};