const CONSTANTS = {
    GAME: {
        STATES: {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAMEOVER: 'gameover'
        },
        MODES: {
            ENDLESS: 'endless',
            TIMED: 'timed',
            OBSTACLE: 'obstacle'
        },
        TIMED_DURATION: 60,
        TOWER_FALL_ANGLE: 45,
        MAX_STABLE_ANGLE: 30,
        SAVE_INTERVAL: 1000
    },

    BALLOON_TYPES: {
        NORMAL: {
            id: 'normal',
            name: '普通彩球',
            radius: 28,
            weight: 1,
            elasticity: 0.3,
            score: 10,
            color: '#FF6B6B',
            colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'],
            probability: 0.5
        },
        GIANT: {
            id: 'giant',
            name: '巨型气球',
            radius: 45,
            weight: 2,
            elasticity: 0,
            score: 15,
            color: '#9B59B6',
            colors: ['#9B59B6', '#3498DB', '#E74C3C'],
            probability: 0.15
        },
        MINI: {
            id: 'mini',
            name: '迷你气球',
            radius: 18,
            weight: 0.5,
            elasticity: 0.6,
            score: 8,
            color: '#2ECC71',
            colors: ['#2ECC71', '#F1C40F', '#1ABC9C', '#E91E63'],
            probability: 0.2
        },
        GOLDEN: {
            id: 'golden',
            name: '幸运金气球',
            radius: 28,
            weight: 0.7,
            elasticity: 0.4,
            score: 30,
            color: '#FFD700',
            colors: ['#FFD700', '#FFA500'],
            probability: 0.1,
            special: 'stabilize'
        },
        BOMB: {
            id: 'bomb',
            name: '炸弹气球',
            radius: 28,
            weight: 1.2,
            elasticity: 0.2,
            score: -20,
            color: '#2C3E50',
            colors: ['#2C3E50', '#34495E'],
            probability: 0.05,
            special: 'explode'
        }
    },

    LAUNCH: {
        TAP_POWER: 5,
        TAP_DURATION: 200,
        MAX_POWER: 22,
        CHARGE_DURATION: 1200,
        ANGLE_MIN: -60,
        ANGLE_MAX: 60,
        ANGLE_SPEED: 3
    },

    PHYSICS: {
        GRAVITY: 0.4,
        AIR_RESISTANCE: 0.995,
        FRICTION: 0.98,
        BOUNCE_DAMPING: 0.6,
        ANGULAR_DAMPING: 0.95,
        COLLISION_ITERATIONS: 5
    },

    CLOWN: {
        WIDTH: 80,
        HEIGHT: 100,
        MOVE_SPEED: 5
    },

    COLORS: {
        SKY_TOP: '#87CEEB',
        SKY_MIDDLE: '#E0F7FA',
        SKY_BOTTOM: '#FFF9C4',
        GROUND: '#90EE90'
    },

    STORAGE_KEY: 'xiaochou_balloon_game'
};