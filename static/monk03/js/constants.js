const CONSTANTS = {
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 800,

    TRUNK_WIDTH: 120,
    CLIMB_DISTANCE: 40,
    CLIMB_DURATION: 150,

    MONKEY_WIDTH: 60,
    MONKEY_HEIGHT: 70,

    OBSTACLE_TYPES: {
        BRANCH: 'branch',
        BUG: 'bug',
        MUSHROOM: 'mushroom',
        WEB: 'web',
        WOODPECKER: 'woodpecker',
        NEST: 'nest'
    },

    ITEM_TYPES: {
        BANANA: 'banana',
        SPEED_BANANA: 'speed_banana',
        SHIELD_LEAF: 'shield_leaf',
        MAGNET: 'magnet',
        SPRING_SHOES: 'spring_shoes'
    },

    GAME_MODES: {
        SINGLE: 'single',
        CHARGE: 'charge',
        RHYTHM: 'rhythm'
    },

    DIFFICULTY: [
        { minHeight: 0, maxHeight: 50, obstacleInterval: 10, speedMultiplier: 1.0 },
        { minHeight: 50, maxHeight: 150, obstacleInterval: 7, speedMultiplier: 1.3 },
        { minHeight: 150, maxHeight: 300, obstacleInterval: 5, speedMultiplier: 1.6 },
        { minHeight: 300, maxHeight: 500, obstacleInterval: 3, speedMultiplier: 2.0 },
        { minHeight: 500, maxHeight: Infinity, obstacleInterval: 2, speedMultiplier: 2.5 }
    ],

    CHARGE_MAX_TIME: 1000,
    CHARGE_MAX_DISTANCE: 200,

    SCORES: {
        BANANA: 10,
        RHYTHM_PERFECT: 50,
        RHYTHM_GOOD: 25,
        HEIGHT: 1
    },

    POWERUP_DURATION: {
        SPEED: 5000,
        MAGNET: 5000
    },

    COLORS: {
        TRUNK_LIGHT: '#8B4513',
        TRUNK_DARK: '#654321',
        SKY_TOP: '#87CEEB',
        SKY_BOTTOM: '#98D8AA'
    },

    STORAGE_KEY: 'monkey_climb_save'
};
