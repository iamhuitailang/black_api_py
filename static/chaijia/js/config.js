const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GAME_DURATION: 120,
    WIN_SCORE: 200,
    
    CAT: {
        INITIAL_LIVES: 3,
        ATTACK_POWER: 12,
        HIDE_SUCCESS_RATE: 5,
        MOVE_SPEED: 5,
        JUMP_FORCE: -15,
        GRAVITY: 0.8,
        ULTIMATE_SCORE: 30,
        WIDTH: 80,
        HEIGHT: 60
    },
    
    FURNITURE_TYPES: [
        { name: '沙发', hp: 60, score: 25, width: 200, height: 100, color: '#d4a574' },
        { name: '茶几', hp: 40, score: 20, width: 120, height: 60, color: '#8B4513' },
        { name: '纸箱', hp: 25, score: 15, width: 70, height: 70, color: '#DEB887' },
        { name: '杯子', hp: 15, score: 10, width: 35, height: 45, color: '#87CEEB' },
        { name: '花瓶', hp: 30, score: 18, width: 45, height: 65, color: '#FFB6C1' },
        { name: '台灯', hp: 35, score: 22, width: 50, height: 70, color: '#FFD700' }
    ],
    
    OWNER: {
        APPEAR_INTERVAL: 8000,
        STAY_DURATION: 5000,
        MOVE_SPEED: 3,
        CATCH_DISTANCE: 100
    },
    
    COLORS: {
        WALL: '#FFF8DC',
        FLOOR: '#DEB887',
        CARPET: '#CD853F',
        CAT_BODY: '#F5DEB3',
        CAT_EYES: '#4169E1',
        OWNER_HAIR: '#8B4513',
        OWNER_SKIN: '#FFDAB9'
    }
};