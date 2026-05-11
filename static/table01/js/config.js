var Config = (function() {
    'use strict';

    var DIFFICULTY_CONFIG = {
        easy: {
            name: '简单',
            icon: '🟢',
            ballCount: 6,
            pocketRadius: 32,
            friction: 0.995,
            minForce: 2,
            maxForce: 22
        },
        medium: {
            name: '中等',
            icon: '🟡',
            ballCount: 10,
            pocketRadius: 26,
            friction: 0.99,
            minForce: 2,
            maxForce: 22
        },
        hard: {
            name: '困难',
            icon: '🔴',
            ballCount: 15,
            pocketRadius: 22,
            friction: 0.985,
            minForce: 2,
            maxForce: 22
        }
    };

    var GAME_CONFIG = {
        canvasWidth: 800,
        canvasHeight: 500,
        tableBorder: 40,
        pocketRadius: 26,
        ballRadius: 15,
        friction: 0.99,
        restitution: 0.95,
        minSpeed: 0.1,
        maxForce: 22,
        forceScale: 0.15,
        cueLength: 180,
        cueWidth: 8,
        scorePerBall: 10,
        cueBallPenalty: 5,
        clearBonus: 50,
        comboBonus: 5,
        storageKey: 'table01_game_save'
    };

    var COLORS = {
        table: '#1a6b3d',
        tableBorder: '#8B4513',
        tableBorderInner: '#654321',
        feltPattern: 'rgba(0, 100, 50, 0.1)',
        pocket: '#1a1a1a',
        cueBall: '#ffffff',
        cueBallShadow: 'rgba(0, 0, 0, 0.3)',
        ballColors: [
            '#e74c3c',
            '#f1c40f',
            '#3498db',
            '#9b59b6',
            '#e67e22',
            '#1abc9c',
            '#e91e63',
            '#00bcd4',
            '#ff5722',
            '#673ab7',
            '#ff9800',
            '#8bc34a',
            '#f44336',
            '#2196f3',
            '#9c27b0'
        ],
        cue: '#8B4513',
        cueTip: '#f5f5dc',
        aimLine: 'rgba(255, 255, 255, 0.5)',
        aimLineForce: 'rgba(255, 100, 100, 0.8)',
        powerBar: '#55efc4',
        powerBarBg: 'rgba(255, 255, 255, 0.2)'
    };

    var BALL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

    function getDifficultyConfig(difficulty) {
        return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
    }

    function getDifficultyList() {
        return Object.keys(DIFFICULTY_CONFIG).map(function(key) {
            return {
                key: key,
                config: DIFFICULTY_CONFIG[key]
            };
        });
    }

    return {
        GAME_CONFIG: GAME_CONFIG,
        DIFFICULTY_CONFIG: DIFFICULTY_CONFIG,
        COLORS: COLORS,
        BALL_LABELS: BALL_LABELS,
        getDifficultyConfig: getDifficultyConfig,
        getDifficultyList: getDifficultyList
    };
})();
