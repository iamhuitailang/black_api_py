const GameConfig = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    
    PLAYER: {
        WIDTH: 30,
        HEIGHT: 45,
        CROUCH_HEIGHT: 25,
        BASE_SPEED: 4,
        CROUCH_SPEED: 2,
        MAX_HEALTH: 100,
        INVINCIBLE_TIME: 1000
    },
    
    TIME: {
        TOTAL: 180,
        WARNING_TIME: 45
    },
    
    HAZARDS: {
        ROCK: {
            DAMAGE: 8,
            MIN_SIZE: 15,
            MAX_SIZE: 30,
            MIN_SPEED: 3,
            MAX_SPEED: 6,
            SPAWN_INTERVAL: 500
        },
        RAIL: {
            DAMAGE: 15,
            WIDTH: 40,
            HEIGHT: 12,
            MIN_SPEED: 4,
            MAX_SPEED: 7,
            SPAWN_INTERVAL: 1000
        },
        SEAT: {
            DAMAGE: 12,
            WIDTH: 35,
            HEIGHT: 40,
            FALL_SPEED: 5,
            SPAWN_INTERVAL: 1300
        },
        WALL: {
            DAMAGE: 25,
            MIN_WIDTH: 80,
            MAX_WIDTH: 150,
            HEIGHT: 20,
            FALL_SPEED: 3,
            SPAWN_INTERVAL: 2500
        }
    },
    
    CROWD: {
        MAX_COUNT: 40,
        MIN_COUNT: 12,
        NPC_WIDTH: 25,
        NPC_HEIGHT: 35,
        BASE_SPEED: 1.5,
        DENSITY_SLOW_FACTOR: 0.3
    },
    
    ITEMS: {
        SPEED_BOOST: {
            DURATION: 8000,
            SPEED_MULTIPLIER: 1.5,
            COLOR: '#3498db',
            RADIUS: 15,
            SPAWN_CHANCE: 0.3
        },
        SHIELD: {
            DURATION: 10000,
            COLOR: '#9b59b6',
            RADIUS: 15,
            SPAWN_CHANCE: 0.25
        },
        HEAL: {
            AMOUNT: 30,
            COLOR: '#27ae60',
            RADIUS: 15,
            SPAWN_CHANCE: 0.3
        },
        CLEAR: {
            RADIUS: 100,
            COLOR: '#f39c12',
            ITEM_RADIUS: 15,
            SPAWN_CHANCE: 0.15
        },
        SPAWN_INTERVAL: 5000
    },
    
    COLLAPSE_PHASES: {
        PHASE_1: {
            DURATION: 60,
            HAZARD_MULTIPLIER: 1,
            CROWD_MULTIPLIER: 1,
            DESCRIPTION: '零星掉落'
        },
        PHASE_2: {
            DURATION: 60,
            HAZARD_MULTIPLIER: 1.5,
            CROWD_MULTIPLIER: 1.3,
            DESCRIPTION: '批量损毁'
        },
        PHASE_3: {
            DURATION: 60,
            HAZARD_MULTIPLIER: 2,
            CROWD_MULTIPLIER: 1.5,
            DESCRIPTION: '全域坍塌'
        }
    },
    
    SCENES: [
        {
            id: 0,
            name: '体育场',
            colors: {
                background: '#1a365d',
                floor: '#2d4a6f',
                wall: '#4a6b8a',
                accent: '#3498db',
                exit: '#27ae60'
            },
            obstacles: [
                { x: 100, y: 200, w: 80, h: 120 },
                { x: 300, y: 150, w: 60, h: 100 },
                { x: 500, y: 250, w: 100, h: 80 },
                { x: 700, y: 180, w: 70, h: 110 },
                { x: 900, y: 220, w: 90, h: 90 },
                { x: 200, y: 450, w: 70, h: 100 },
                { x: 450, y: 480, w: 110, h: 70 },
                { x: 650, y: 450, w: 80, h: 100 },
                { x: 850, y: 470, w: 60, h: 90 }
            ]
        },
        {
            id: 1,
            name: '音乐厅',
            colors: {
                background: '#4a1c1c',
                floor: '#5c2828',
                wall: '#7a3a3a',
                accent: '#e74c3c',
                exit: '#27ae60'
            },
            obstacles: [
                { x: 150, y: 180, w: 100, h: 100 },
                { x: 350, y: 220, w: 70, h: 120 },
                { x: 550, y: 160, w: 90, h: 90 },
                { x: 750, y: 200, w: 60, h: 100 },
                { x: 250, y: 460, w: 90, h: 80 },
                { x: 500, y: 440, w: 80, h: 110 },
                { x: 700, y: 470, w: 100, h: 70 }
            ]
        },
        {
            id: 2,
            name: '会议中心',
            colors: {
                background: '#1a4a2e',
                floor: '#2d5a3d',
                wall: '#3d6b4d',
                accent: '#27ae60',
                exit: '#e74c3c'
            },
            obstacles: [
                { x: 120, y: 200, w: 90, h: 110 },
                { x: 320, y: 160, w: 80, h: 100 },
                { x: 520, y: 230, w: 100, h: 80 },
                { x: 720, y: 190, w: 70, h: 100 },
                { x: 880, y: 240, w: 80, h: 90 },
                { x: 180, y: 450, w: 100, h: 80 },
                { x: 400, y: 470, w: 70, h: 100 },
                { x: 600, y: 440, w: 90, h: 90 },
                { x: 800, y: 460, w: 80, h: 80 }
            ]
        }
    ],
    
    EXIT: {
        WIDTH: 60,
        HEIGHT: 80,
        X: 1100,
        Y: 300
    },
    
    STORAGE_KEYS: {
        HIGH_SCORE: 'taosheng_high_score',
        RECORDS: 'taosheng_records',
        GAME_STATE: 'taosheng_game_state'
    },
    
    MAX_RECORDS: 10,
    
    SCORE: {
        BASE_VICTORY: 1000,
        TIME_BONUS: 10,
        HEALTH_BONUS: 5,
        DODGE_BONUS: 2
    }
};
