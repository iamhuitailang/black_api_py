export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

export const BOX_TYPES = {
    WOOD: {
        id: 'wood',
        name: '标准木箱',
        color: '#8B4513',
        borderColor: '#5D3A1A',
        baseScore: 100,
        weight: 1,
        width: 100,
        height: 50,
        friction: 0.8,
        stability: 1
    },
    IRON: {
        id: 'iron',
        name: '铁箱',
        color: '#C0C0C0',
        borderColor: '#808080',
        baseScore: 150,
        weight: 2,
        width: 100,
        height: 50,
        friction: 0.9,
        stability: 1.5,
        offsetPenalty: 1.2
    },
    GOLD: {
        id: 'gold',
        name: '金箱',
        color: '#FFD700',
        borderColor: '#B8860B',
        baseScore: 200,
        weight: 1.5,
        width: 80,
        height: 40,
        friction: 0.85,
        stability: 1,
        scoreMultiplier: 2
    },
    EXPLOSIVE: {
        id: 'explosive',
        name: '炸药箱',
        color: '#FF4444',
        borderColor: '#CC0000',
        baseScore: 300,
        weight: 0.8,
        width: 90,
        height: 45,
        friction: 0.6,
        stability: 0.5,
        vibrationEffect: true
    },
    ICE: {
        id: 'ice',
        name: '冰箱',
        color: '#87CEEB',
        borderColor: '#4682B4',
        baseScore: 120,
        weight: 0.9,
        width: 100,
        height: 50,
        friction: 0.3,
        stability: 0.8
    },
    BALLOON: {
        id: 'balloon',
        name: '气球箱',
        color: '#FF69B4',
        borderColor: '#FF1493',
        baseScore: 80,
        weight: 0.3,
        width: 90,
        height: 55,
        friction: 0.7,
        stability: 0.6,
        fallSpeed: 0.6
    }
};

export const ALIGNMENT_THRESHOLDS = {
    PERFECT: { min: 100, multiplier: 2.0, flash: 'perfect' },
    PRECISE: { min: 80, multiplier: 1.5, flash: 'precise' },
    NORMAL: { min: 60, multiplier: 1.0, flash: 'normal' },
    WEAK: { min: 40, multiplier: 0.5, flash: 'warning' },
    DANGER: { min: 20, multiplier: 0.2, flash: 'danger' },
    DROP: { min: 0, multiplier: 0, flash: null }
};

export const MOVE_MODES = {
    HORIZONTAL: 'horizontal',
    BIDIRECTIONAL: 'bidirectional',
    CIRCULAR: 'circular',
    VARIABLE: 'variable'
};

export const LEVEL_CONFIG = [
    { level: 1, minBoxes: 0, speed: 3, boxTypes: ['WOOD'], moveMode: MOVE_MODES.HORIZONTAL, wind: false },
    { level: 2, minBoxes: 2, speed: 4, boxTypes: ['WOOD', 'IRON'], moveMode: MOVE_MODES.BIDIRECTIONAL, wind: false },
    { level: 3, minBoxes: 4, speed: 5, boxTypes: ['WOOD', 'IRON', 'GOLD'], moveMode: MOVE_MODES.BIDIRECTIONAL, wind: true },
    { level: 4, minBoxes: 6, speed: 6, boxTypes: ['WOOD', 'IRON', 'GOLD', 'ICE'], moveMode: MOVE_MODES.CIRCULAR, wind: true },
    { level: 5, minBoxes: 8, speed: 7, boxTypes: ['WOOD', 'IRON', 'GOLD', 'ICE', 'BALLOON'], moveMode: MOVE_MODES.VARIABLE, wind: true },
    { level: 6, minBoxes: 10, speed: 8, boxTypes: ['WOOD', 'IRON', 'GOLD', 'EXPLOSIVE', 'ICE', 'BALLOON'], moveMode: MOVE_MODES.VARIABLE, wind: true }
];

export const GRAVITY = 0.5;
export const MAX_FALL_SPEED = 15;
export const BASE_PLATFORM_Y = CANVAS_HEIGHT - 100;
export const CENTER_X = CANVAS_WIDTH / 2;

export const STORAGE_KEY = 'stack_box_game_state';

export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

export const getLevelConfig = (stackHeight) => {
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
        if (stackHeight >= LEVEL_CONFIG[i].minBoxes) {
            return LEVEL_CONFIG[i];
        }
    }
    return LEVEL_CONFIG[0];
};

export const getAlignmentGrade = (percentage) => {
    if (percentage >= 100) return ALIGNMENT_THRESHOLDS.PERFECT;
    if (percentage >= 80) return ALIGNMENT_THRESHOLDS.PRECISE;
    if (percentage >= 60) return ALIGNMENT_THRESHOLDS.NORMAL;
    if (percentage >= 40) return ALIGNMENT_THRESHOLDS.WEAK;
    if (percentage >= 20) return ALIGNMENT_THRESHOLDS.DANGER;
    return ALIGNMENT_THRESHOLDS.DROP;
};