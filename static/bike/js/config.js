export const CONFIG = {
    GAME: {
        TARGET_FPS: 60,
        TIME_LIMIT: 120,
        TARGET_SCORE: 5000,
        TRACK_LENGTH: 3000,
        AUTO_SAVE_INTERVAL: 500
    },

    PHYSICS: {
        GRAVITY: 0.4,
        MAX_SPEED: 12,
        MIN_SPEED: 0,
        ACCELERATION: 0.2,
        BRAKE: 0.2,
        FRICTION: 0.015,
        MAX_ANGLE: 45,
        BALANCE_RECOVERY: 0.05,
        FALL_ANGLE: 40,
        FALL_RECOVERY_TIME: 1500
    },

    TERRAIN: {
        TILE_WIDTH: 100,
        TILE_HEIGHT: 50,
        SEGMENTS: {
            FLAT: { speedMult: 1.0, balanceMult: 1.0, trickMult: 1.0 },
            UPHILL: { speedMult: 0.7, balanceMult: 1.3, trickMult: 1.2 },
            DOWNHILL: { speedMult: 1.3, balanceMult: 1.3, trickMult: 1.3 },
            SAND: { speedMult: 0.5, balanceMult: 1.8, trickMult: 0.8 },
            MUD: { speedMult: 0.7, balanceMult: 2.0, trickMult: 0.9 },
            STONE: { speedMult: 1.1, balanceMult: 0.9, trickMult: 1.1 },
            SNOW: { speedMult: 0.6, balanceMult: 1.5, trickMult: 1.0 },
            JUMP: { speedMult: 1.0, balanceMult: 1.0, trickMult: 1.5 }
        }
    },

    TRICKS: {
        TABLETOP: { name: '抓把', score: 500, difficulty: 1.0, minAirTime: 300 },
        SUPERMAN: { name: '超人', score: 1000, difficulty: 1.5, minAirTime: 500 },
        BARSPIN: { name: '转把', score: 1200, difficulty: 1.8, minAirTime: 600 },
        BACKFLIP: { name: '后空翻', score: 2000, difficulty: 2.5, minAirTime: 800 },
        FRONTFLIP: { name: '前空翻', score: 2200, difficulty: 2.8, minAirTime: 900 },
        SPIN360: { name: '360转体', score: 1800, difficulty: 2.2, minAirTime: 700 },
        NO_HAND: { name: '无手骑行', scorePerSec: 100, difficulty: 1.0 }
    },

    BIKES: {
        MOUNTAIN: { name: '山地车', speed: 2, control: 3, balance: 3, trick: 2, unlocked: true },
        DIRT: { name: '土坡车', speed: 3, control: 2, balance: 2, trick: 4, unlockScore: 5000 },
        DOWNHILL: { name: '速降车', speed: 4, control: 2, balance: 2, trick: 1, unlockLevel: 5 },
        TRICK: { name: '特技车', speed: 2, control: 4, balance: 3, trick: 4, unlockTricks: 10 },
        ELECTRIC: { name: '电助力车', speed: 4, control: 3, balance: 3, trick: 2, unlocked: false }
    },

    COLORS: {
        sky: '#87CEEB',
        ground: '#4a7c59',
        road: '#555555',
        bike: '#333333',
        rider: '#ff6b6b',
        building: '#6b7280',
        buildingWindow: '#fbbf24',
        tree: '#228B22',
        obstacle: '#8B4513'
    },

    STORAGE_KEY: 'bike_game_save'
};
