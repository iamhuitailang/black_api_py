const Config = (function() {
    const CANVAS_WIDTH = 480;
    const CANVAS_HEIGHT = 800;
    
    const SPEED_LEVELS = [
        { minDistance: 0, maxDistance: 500, speed: 5, density: 0.015 },
        { minDistance: 500, maxDistance: 1500, speed: 8, density: 0.025 },
        { minDistance: 1500, maxDistance: 3000, speed: 12, density: 0.035 },
        { minDistance: 3000, maxDistance: Infinity, speed: 16, density: 0.045 }
    ];
    
    const PLAYER = {
        width: 40,
        height: 60,
        startX: CANVAS_WIDTH / 2,
        startY: CANVAS_HEIGHT - 150,
        moveSpeed: 8,
        jumpPower: 18,
        gravity: 0.8,
        maxHealth: 3,
        invincibleTime: 1500
    };
    
    const OBSTACLE_TYPES = {
        TREE: {
            id: 'tree',
            emoji: '🌲',
            scoreEffect: -5,
            collisionEffect: 'fall',
            speedReduction: 0.5,
            width: 50,
            height: 60,
            canJump: false
        },
        ROCK: {
            id: 'rock',
            emoji: '🪨',
            scoreEffect: -10,
            collisionEffect: 'fall',
            speedReduction: 0.6,
            width: 50,
            height: 40,
            canJump: true
        },
        PIT: {
            id: 'pit',
            emoji: '🕳️',
            scoreEffect: -15,
            collisionEffect: 'pit',
            speedReduction: 0,
            width: 80,
            height: 30,
            canJump: true,
            mustJump: true
        },
        PENGUIN: {
            id: 'penguin',
            emoji: '🐧',
            scoreEffect: 20,
            collisionEffect: 'collect',
            speedReduction: 0,
            width: 40,
            height: 40,
            canJump: false,
            isCollectible: true
        },
        STAR: {
            id: 'star',
            emoji: '⭐',
            scoreEffect: 50,
            collisionEffect: 'collect',
            speedReduction: 0,
            width: 35,
            height: 35,
            canJump: false,
            isCollectible: true
        }
    };
    
    const ITEM_TYPES = {
        SPEED_BOOST: {
            id: 'speed_boost',
            emoji: '🚀',
            name: '加速鞋',
            effect: 'speed_multiplier',
            value: 1.5,
            duration: 5000,
            probability: 0.05,
            width: 40,
            height: 40
        },
        SHIELD: {
            id: 'shield',
            emoji: '🛡️',
            name: '护盾',
            effect: 'shield',
            value: 1,
            duration: -1,
            probability: 0.03,
            width: 40,
            height: 40
        },
        HEALTH: {
            id: 'health',
            emoji: '💊',
            name: '药包',
            effect: 'heal',
            value: 1,
            duration: 0,
            probability: 0.02,
            width: 40,
            height: 40
        },
        SCORE_BOOST: {
            id: 'score_boost',
            emoji: '⭐',
            name: '星星',
            effect: 'score',
            value: 500,
            duration: 0,
            probability: 0.10,
            width: 40,
            height: 40
        },
        MYSTERY: {
            id: 'mystery',
            emoji: '🎲',
            name: '随机箱',
            effect: 'random',
            value: 0,
            duration: 0,
            probability: 0.02,
            width: 40,
            height: 40
        }
    };
    
    const COLORS = {
        sky: ['#87CEEB', '#E0F4FF'],
        snow: ['#FFFFFF', '#F0F8FF', '#E6F3FF'],
        mountain: ['#B0C4DE', '#778899'],
        tree: ['#228B22', '#006400'],
        rock: ['#696969', '#4A4A4A'],
        player: ['#FF6B6B', '#EE5A5A'],
        ui: {
            primary: '#e74c3c',
            secondary: '#2a5298',
            success: '#27ae60',
            warning: '#f39c12'
        }
    };
    
    function getSpeedByDistance(distance) {
        for (const level of SPEED_LEVELS) {
            if (distance >= level.minDistance && distance < level.maxDistance) {
                return level.speed;
            }
        }
        return SPEED_LEVELS[SPEED_LEVELS.length - 1].speed;
    }
    
    function getDensityByDistance(distance) {
        for (const level of SPEED_LEVELS) {
            if (distance >= level.minDistance && distance < level.maxDistance) {
                return level.density;
            }
        }
        return SPEED_LEVELS[SPEED_LEVELS.length - 1].density;
    }
    
    return {
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        SPEED_LEVELS,
        PLAYER,
        OBSTACLE_TYPES,
        ITEM_TYPES,
        COLORS,
        getSpeedByDistance,
        getDensityByDistance
    };
})();
