const CONFIG = {
    GRAVITY: 9.8,
    FREE_FALL_ACCELERATION: 9.8,
    TERMINAL_VELOCITY_FREE_FALL: 55,
    TERMINAL_VELOCITY_PARACHUTE: 8,
    PARACHUTE_DRAG: 0.85,
    PARACHUTE_OPEN_ALTITUDE: 2500,
    MIN_PARACHUTE_OPEN_ALTITUDE: 50,
    
    PLAYER: {
        MOVE_SPEED: 3,
        FAST_DESCEND_MULTIPLIER: 1.5,
        SLOW_DESCEND_MULTIPLIER: 0.6,
        STAMINA_MAX: 100,
        STAMINA_REGEN: 5,
        STAMINA_COST_MOVE: 0.3,
        STAMINA_COST_SLOW: 0.5
    },
    
    WIND: {
        BASE_CHANGE_INTERVAL: 3000,
        TYPES: {
            CALM: { name: '无风', minSpeed: 0, maxSpeed: 0, duration: Infinity },
            BREEZE: { name: '微风', minSpeed: 1, maxSpeed: 2, duration: Infinity },
            STRONG: { name: '强风', minSpeed: 3, maxSpeed: 5, duration: [5000, 10000], minAlt: 1500, maxAlt: 3000 },
            GUST: { name: '阵风', minSpeed: 2, maxSpeed: 4, duration: [2000, 3000], minAlt: 500, maxAlt: 2000, fluctuating: true },
            TURBULENCE: { name: '乱流', minSpeed: 1, maxSpeed: 3, duration: [1500, 2000], minAlt: 1000, maxAlt: 2500, random: true }
        }
    },
    
    OBSTACLES: {
        SPAWN_INTERVAL: 800,
        MAX_ACTIVE: 15,
        TYPES: {
            CLOUD: { 
                name: '云层', 
                emoji: '☁️', 
                minAlt: 500, 
                maxAlt: 1500, 
                effect: 'vision',
                radius: 80,
                speed: 0.5
            },
            BIRD: { 
                name: '鸟群', 
                emoji: '🦅', 
                minAlt: 800, 
                maxAlt: 2000, 
                effect: 'knockback',
                radius: 30,
                speed: 2
            },
            TURBULENCE: { 
                name: '乱流', 
                emoji: '🌪️', 
                minAlt: 1000, 
                maxAlt: 2500, 
                effect: 'turbulence',
                radius: 50,
                speed: 1
            },
            BALLOON: { 
                name: '热气球', 
                emoji: '🎈', 
                minAlt: 300, 
                maxAlt: 800, 
                effect: 'death',
                radius: 40,
                speed: 0.3
            }
        }
    },
    
    REWARDS: {
        SPAWN_INTERVAL: 3000,
        TYPES: {
            SPEED_RING: { 
                name: '加速环', 
                emoji: '⭐', 
                minAlt: 1000, 
                maxAlt: 2000, 
                effect: 'speedBoost',
                radius: 25,
                duration: 3000
            },
            TAILWIND: { 
                name: '顺风区', 
                emoji: '💨', 
                minAlt: 500, 
                maxAlt: 1500, 
                effect: 'tailwind',
                radius: 60,
                duration: 5000
            },
            MAGNET_TARGET: { 
                name: '磁力靶', 
                emoji: '🎯', 
                minAlt: 0, 
                maxAlt: 300, 
                effect: 'magnet',
                radius: 30,
                duration: 10000
            }
        }
    },
    
    TERRAIN: {
        TYPES: {
            grass: { 
                name: '草地', 
                color: '#7CB342', 
                scoreMultiplier: 1.0, 
                targetRadius: 80,
                unlockLevel: 1
            },
            sand: { 
                name: '沙滩', 
                color: '#FDD835', 
                scoreMultiplier: 1.2, 
                targetRadius: 70,
                unlockLevel: 3
            },
            snow: { 
                name: '雪地', 
                color: '#ECEFF1', 
                scoreMultiplier: 0.8, 
                targetRadius: 90,
                unlockLevel: 5
            },
            carrier: { 
                name: '航母甲板', 
                color: '#607D8B', 
                scoreMultiplier: 1.5, 
                targetRadius: 40,
                unlockLevel: 8
            },
            roof: { 
                name: '屋顶', 
                color: '#D32F2F', 
                scoreMultiplier: 1.3, 
                targetRadius: 50,
                unlockLevel: 10
            }
        }
    },
    
    SCORING: {
        PERFECT_DISTANCE: 1,
        PERFECT_SCORE: 100,
        MAX_SCORE_DISTANCE: 100,
        DISTANCE_MULTIPLIER: 1
    },
    
    GAME: {
        START_ALTITUDE: 4000,
        WORLD_WIDTH: 2000,
        LOW_ALTITUDE_WARNING: 500,
        SAVE_INTERVAL: 1000,
        MAX_LANDING_SPEED: 12,
        DEATH_ALTITUDE: 20
    },
    
    LEVELS: {
        1: { name: '新手训练', windStrength: 0.5, obstacleDensity: 0.3, targetRadius: 100, requiredScore: 30 },
        2: { name: '初级跳伞', windStrength: 0.7, obstacleDensity: 0.5, targetRadius: 90, requiredScore: 40 },
        3: { name: '中级挑战', windStrength: 0.9, obstacleDensity: 0.7, targetRadius: 80, requiredScore: 50 },
        4: { name: '高级跳伞', windStrength: 1.0, obstacleDensity: 0.8, targetRadius: 70, requiredScore: 60 },
        5: { name: '专业级别', windStrength: 1.1, obstacleDensity: 0.9, targetRadius: 60, requiredScore: 70 },
        6: { name: '极限挑战', windStrength: 1.2, obstacleDensity: 1.0, targetRadius: 50, requiredScore: 75 },
        7: { name: '风暴跳伞', windStrength: 1.4, obstacleDensity: 1.1, targetRadius: 45, requiredScore: 80 },
        8: { name: '暗夜行动', windStrength: 1.3, obstacleDensity: 1.2, targetRadius: 40, requiredScore: 85 },
        9: { name: '巅峰对决', windStrength: 1.5, obstacleDensity: 1.3, targetRadius: 35, requiredScore: 90 },
        10: { name: '传奇大师', windStrength: 1.6, obstacleDensity: 1.5, targetRadius: 30, requiredScore: 95 }
    },
    
    CAMERA: {
        MODES: {
            FOLLOW: 'follow',
            FIXED: 'fixed',
            FIRST_PERSON: 'firstPerson'
        }
    },
    
    STORAGE_KEYS: {
        HIGH_SCORE: 'skydive_high_score',
        GAME_STATE: 'skydive_game_state',
        UNLOCKED_TERRAINS: 'skydive_unlocked_terrains',
        CURRENT_LEVEL: 'skydive_current_level'
    }
};
