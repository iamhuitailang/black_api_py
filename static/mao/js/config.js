var GameConfig = (function() {
    'use strict';

    var CONFIG = {
        GAME: {
            CANVAS_WIDTH: 800,
            CANVAS_HEIGHT: 600,
            BACKGROUND_COLOR: '#2d5016',
            BORDER_COLOR: '#1a3009',
            BORDER_WIDTH: 10,
            FPS: 60
        },

        MOUSE: {
            SIZE: 30,
            SPEED: 5,
            COLOR: '#888888',
            EAR_COLOR: '#aaaaaa',
            TAIL_COLOR: '#666666',
            TAIL_LENGTH: 25,
            WHISKER_LENGTH: 12,
            TAIL_SWING_SPEED: 0.15,
            TAIL_SWING_AMPLITUDE: 15
        },

        CAT: {
            SIZE: 35,
            INITIAL_SPEED: 3,
            MAX_SPEED: 8,
            COLOR: '#e67e22',
            STRIPE_COLOR: '#d35400',
            EYE_COLOR: '#2ecc71',
            PUPIL_COLOR: '#27ae60',
            EAR_COLOR: '#f39c12'
        },

        CHEESE: {
            SIZE: 15,
            MIN_COUNT: 3,
            MAX_COUNT: 5,
            COLOR: '#f1c40f',
            HOLE_COLOR: '#e67e22',
            SCORE: 10
        },

        SPEED_CURVE: [
            { minSeconds: 0, maxSeconds: 10, speed: 3 },
            { minSeconds: 10, maxSeconds: 20, speed: 4 },
            { minSeconds: 20, maxSeconds: 30, speed: 5 },
            { minSeconds: 30, maxSeconds: 40, speed: 6 },
            { minSeconds: 40, maxSeconds: 50, speed: 7 },
            { minSeconds: 50, maxSeconds: 999999, speed: 8 }
        ],

        STORAGE: {
            KEY_PREFIX: 'mao_game_',
            GAME_STATE: 'game_state',
            STATS: 'game_stats'
        },

        STATS: {
            HIGH_SCORE: 'highScore',
            LONGEST_SURVIVAL: 'longestSurvival',
            TOTAL_CHEESES: 'totalCheeses',
            TOTAL_GAMES: 'totalGames'
        }
    };

    function getCatSpeed(elapsedSeconds) {
        for (var i = 0; i < CONFIG.SPEED_CURVE.length; i++) {
            var curve = CONFIG.SPEED_CURVE[i];
            if (elapsedSeconds >= curve.minSeconds && elapsedSeconds < curve.maxSeconds) {
                return curve.speed;
            }
        }
        return CONFIG.CAT.MAX_SPEED;
    }

    function get(key) {
        var keys = key.split('.');
        var value = CONFIG;
        for (var i = 0; i < keys.length; i++) {
            value = value[keys[i]];
            if (value === undefined) {
                return undefined;
            }
        }
        return value;
    }

    return {
        CONFIG: CONFIG,
        get: get,
        getCatSpeed: getCatSpeed
    };
})();
