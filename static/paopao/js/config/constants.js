const CONSTANTS = {
    CANVAS_WIDTH: 720,
    CANVAS_HEIGHT: 960,
    
    BUBBLE_RADIUS: 28,
    BUBBLE_DIAMETER: 56,
    
    GRID_COLS: 12,
    GRID_ROWS: 15,
    
    SHOOTER_Y: 900,
    SHOOTER_X: 360,
    
    MIN_ANGLE: 10,
    MAX_ANGLE: 170,
    DEFAULT_ANGLE: 90,
    
    BUBBLE_SPEED: 12,
    MAX_CHARGE_TIME: 1500,
    
    MATCH_THRESHOLD: 3,
    
    COLORS: {
        RED: '#FF6B6B',
        BLUE: '#4ECDC4',
        YELLOW: '#FFE66D',
        GREEN: '#96CEB4',
        PURPLE: '#DDA0DD',
        ORANGE: '#FFA07A',
        PINK: '#FFB6C1',
        CYAN: '#87CEEB'
    },
    
    BUBBLE_TYPES: {
        NORMAL: 'normal',
        BOMB: 'bomb',
        CHAIN: 'chain',
        FIRE: 'fire',
        EXPLOSION: 'explosion',
        PIERCE: 'pierce',
        RAPID: 'rapid'
    },
    
    GAME_STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        LEVEL_COMPLETE: 'level_complete',
        GAME_OVER: 'game_over'
    },
    
    ANIMATION: {
        POP_DURATION: 300,
        DROP_DURATION: 400,
        SHAKE_AMPLITUDE: 5
    }
};
