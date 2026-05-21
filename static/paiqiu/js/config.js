const CONFIG = {
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 600,
    
    COURT: {
        WIDTH: 800,
        HEIGHT: 450,
        X: 50,
        Y: 80,
        FLOOR_COLOR: '#4CAF50',
        LINE_COLOR: '#FFFFFF'
    },
    
    NET: {
        X: 450,
        HEIGHT: 120,
        TOP: 200,
        WIDTH: 10,
        COLOR: '#333333'
    },
    
    BALL: {
        RADIUS: 12,
        COLOR: '#FFEB3B',
        GRAVITY: 0.4,
        BOUNCE: 0.7,
        MAX_SPEED: 15
    },
    
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 70,
        SPEED: 5,
        JUMP_FORCE: 12,
        COLOR: '#2196F3',
        ENEMY_COLOR: '#f44336'
    },
    
    GAME_MODES: {
        training: {
            name: '训练模式',
            maxSets: Infinity,
            pointsToWin: 10,
            winByTwo: false,
            hasWall: true
        },
        friendly: {
            name: '友谊赛',
            maxSets: 3,
            pointsToWin: 25,
            winByTwo: true,
            hasWall: false
        },
        tournament: {
            name: '锦标赛',
            maxSets: 3,
            pointsToWin: 25,
            winByTwo: true,
            hasWall: false
        },
        olympic: {
            name: '奥运决赛',
            maxSets: 5,
            pointsToWin: 25,
            winByTwo: true,
            hasWall: false
        }
    },
    
    OPPONENTS: {
        junior: {
            name: '初中队',
            difficulty: 0.7,
            spikePower: 0.7,
            reactionTime: 800,
            moveSpeed: 0.7
        },
        high: {
            name: '高中队',
            difficulty: 0.85,
            spikePower: 0.85,
            reactionTime: 600,
            moveSpeed: 0.85
        },
        college: {
            name: '大学队',
            difficulty: 1.0,
            spikePower: 1.0,
            reactionTime: 400,
            moveSpeed: 1.0
        },
        national: {
            name: '国家队',
            difficulty: 1.3,
            spikePower: 1.3,
            reactionTime: 250,
            moveSpeed: 1.2
        }
    },
    
    ENVIRONMENTS: [
        { type: 'indoor', name: '室内', icon: '🏟️', probability: 0.8, effect: null },
        { type: 'windy', name: '室外有风', icon: '💨', probability: 0.15, effect: 'wind' },
        { type: 'sunny', name: '强光', icon: '☀️', probability: 0.05, effect: 'sun' }
    ],
    
    POINTS: {
        win_3_0: 500,
        win_3_1: 450,
        win_3_2: 400,
        ace: 10,
        block: 10
    },
    
    KEYS: {
        UP: ['w', 'W', 'ArrowUp'],
        DOWN: ['s', 'S', 'ArrowDown'],
        LEFT: ['a', 'A', 'ArrowLeft'],
        RIGHT: ['d', 'D', 'ArrowRight'],
        RECEIVE: ['j', 'J'],
        SPIKE: ['k', 'K'],
        BLOCK: ['l', 'L'],
        PAUSE: ['Escape', 'p', 'P']
    },
    
    STORAGE_KEY: 'volleyball_game_data',
    
    COLORS: {
        SKY: '#87CEEB',
        GRASS: '#98D8C8',
        COURT: '#4CAF50',
        NET: '#333333',
        BALL: '#FFEB3B',
        PLAYER: '#2196F3',
        ENEMY: '#f44336'
    }
};
