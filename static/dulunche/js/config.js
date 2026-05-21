const CONFIG = {
    GAME: {
        TRACK_LENGTH: 10000,
        LANES: 3,
        LANE_WIDTH: 100,
        AI_COUNT: 3,
        FPS: 60
    },

    SPEED: {
        SLOW: 3,
        NORMAL: 6,
        FAST: 10,
        BOOST_MULTIPLIER: 1.8
    },

    TILT: {
        SLOW: 0.1,
        NORMAL: 0.25,
        FAST: 0.45,
        MAX_BALANCE: 1,
        BALANCE_RECOVERY: 0.02,
        TILT_SPEED: 0.03
    },

    ITEMS: {
        BOOST_DURATION: 3000,
        SHIELD_DURATION: 5000,
        SPAWN_INTERVAL: 2000,
        MAX_ON_TRACK: 5
    },

    OBSTACLES: {
        GRAVEL_SPEED_PENALTY: 0.5,
        SLOPE_BALANCE_PENALTY: 0.01,
        WIND_FORCE: 2,
        SPAWN_INTERVAL: 1500,
        MAX_ON_TRACK: 8
    },

    AI: {
        BEHAVIOR: {
            IDLE: 0.02,
            CRUISE: 0.35,
            OVERTAKE: 0.30,
            EVADE: 0.08,
            ITEM: 0.15,
            SPRINT: 0.25
        },
        REACTION_TIME: 200,
        SKILL_VARIANCE: 0.2,
        BASE_SPEED_BOOST: 1.0
    },

    THEMES: {
        countryside: {
            name: '乡间小路',
            sky: ['#87CEEB', '#B0E0E6'],
            grass: ['#98FB98', '#90EE90', '#7CFC00'],
            road: ['#D2B48C', '#C4A77D'],
            roadEdge: '#8B7355',
            leafColor: '#90EE90'
        },
        forest: {
            name: '森林小径',
            sky: ['#5F9EA0', '#4682B4'],
            grass: ['#228B22', '#2E8B57', '#3CB371'],
            road: ['#6B4423', '#5D4037'],
            roadEdge: '#3E2723',
            leafColor: '#32CD32'
        },
        sunset: {
            name: '日落大道',
            sky: ['#FF7F50', '#FF6347'],
            grass: ['#DAA520', '#B8860B', '#CD853F'],
            road: ['#8B4513', '#A0522D'],
            roadEdge: '#5D3A1A',
            leafColor: '#FFD700'
        }
    },

    COLORS: {
        SKY: '#87CEEB',
        GRASS: '#90EE90',
        ROAD: '#D2B48C',
        ROAD_EDGE: '#8B7355',
        WHEAT: '#F5DEB3',
        WHEAT_DARK: '#DEB887',
        PLAYER: '#FF6B6B',
        PLAYER_DARK: '#EE5A5A'
    },

    STORAGE_KEY: 'dulunche_game_state'
};
