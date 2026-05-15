const CONFIG = {
    GRAVITY: 500,
    FRICTION: 0.98,
    GROUND_FRICTION: 0.85,
    MAX_SPEED: 500,
    ACCELERATION: 300,
    BRAKE_POWER: 200,
    TILT_POWER: 0.02,
    AIR_TILT_POWER: 0.015,
    ROTATION_FRICTION: 0.95,
    WHEELBASE: 60,
    WHEEL_RADIUS: 15,
    MAX_ROTATION: Math.PI * 0.8,
    AIR_TIME_THRESHOLD: 0.3,
    COMBO_TIMEOUT: 2000,
    
    MOTORCYCLES: {
        offroad: {
            name: '越野摩托',
            speed: 1,
            acceleration: 1,
            handling: 1,
            stability: 1,
            trickBonus: 1,
            unlocked: true
        },
        stunt: {
            name: '特技摩托',
            speed: 0.8,
            acceleration: 1.2,
            handling: 1.3,
            stability: 0.8,
            trickBonus: 1.5,
            unlocked: false,
            unlockScore: 5000
        },
        street: {
            name: '街车',
            speed: 1.3,
            acceleration: 1,
            handling: 0.8,
            stability: 1.1,
            trickBonus: 1,
            unlocked: false,
            unlockLevel: 3
        },
        electric: {
            name: '电动摩托',
            speed: 1.1,
            acceleration: 1.4,
            handling: 1.1,
            stability: 1,
            trickBonus: 1.2,
            unlocked: false,
            unlockLevel: 5
        },
        retro: {
            name: '复古摩托',
            speed: 0.8,
            acceleration: 0.8,
            handling: 1.1,
            stability: 1.3,
            trickBonus: 1,
            unlocked: false,
            unlockAchievement: 'hidden'
        },
        monster: {
            name: '怪兽摩托',
            speed: 1.5,
            acceleration: 0.7,
            handling: 0.6,
            stability: 0.9,
            trickBonus: 0.8,
            unlocked: false,
            unlockComplete: true
        }
    },

    TRICKS: {
        grab: { name: '抓把', key: 'J', baseScore: 500, difficulty: 1.0, minAirTime: 0.3 },
        tailWhip: { name: '甩尾', key: 'K', baseScore: 600, difficulty: 1.2, minAirTime: 0.4 },
        oneHand: { name: '放单手', key: 'L', baseScore: 400, difficulty: 0.8, minAirTime: 0.3 },
        superman: { name: '超人', keys: ['J', 'K'], baseScore: 1000, difficulty: 1.8, minAirTime: 0.5 },
        dragonTail: { name: '神龙摆尾', keys: ['J', 'L'], baseScore: 1200, difficulty: 2.0, minAirTime: 0.6 },
        scissors: { name: '夺命剪刀', keys: ['K', 'L'], baseScore: 1500, difficulty: 2.2, minAirTime: 0.6 },
        deathKiss: { name: '死亡之吻', keys: ['J', 'K', 'L'], baseScore: 2000, difficulty: 2.8, minAirTime: 0.8 },
        backflip: { name: '后空翻', type: 'flip', rotations: 1, direction: -1, baseScore: 800, difficulty: 1.5 },
        frontflip: { name: '前空翻', type: 'flip', rotations: 1, direction: 1, baseScore: 800, difficulty: 1.5 },
        doubleBackflip: { name: '双倍后空翻', type: 'flip', rotations: 2, direction: -1, baseScore: 1600, difficulty: 2.5 }
    },

    LEVELS: [
        { id: 1, name: '新手山谷', targetScore: 2000, timeLimit: 60, terrainType: 'easy' },
        { id: 2, name: '沙漠峡谷', targetScore: 5000, timeLimit: 90, terrainType: 'medium' },
        { id: 3, name: '森林越野', targetScore: 8000, timeLimit: 120, terrainType: 'hard' },
        { id: 4, name: '工业废墟', targetScore: 12000, timeLimit: 150, terrainType: 'expert' },
        { id: 5, name: '雪山之巅', targetScore: 20000, timeLimit: 180, terrainType: 'extreme' },
        { id: 6, name: '火山竞技场', targetScore: 0, timeLimit: 0, terrainType: 'survival' }
    ],

    TERRAIN_TYPES: {
        ground: { friction: 0.95, color: '#8B7355' },
        sand: { friction: 0.85, color: '#F4D03F' },
        grass: { friction: 0.92, color: '#27AE60' },
        asphalt: { friction: 0.98, color: '#2C3E50' },
        ramp: { friction: 0.95, color: '#7F8C8D' },
        wood: { friction: 0.90, color: '#A0522D' }
    },

    COLORS: {
        sky: ['#87CEEB', '#E0F6FF'],
        ground: '#8B7355',
        motorcycle: '#E74C3C',
        motorcycleDark: '#C0392B',
        wheel: '#2C3E50',
        rim: '#BDC3C7',
        rider: '#3498DB',
        riderHelmet: '#F39C12',
        metal: '#95A5A6'
    }
};

const STORAGE_KEY = 'motorcycle_stunt_game';