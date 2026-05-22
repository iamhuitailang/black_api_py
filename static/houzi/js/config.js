const GameConfig = {
    CANVAS: {
        WIDTH: 900,
        HEIGHT: 600,
        GROUND_Y: 520
    },

    PHYSICS: {
        GRAVITY: 0.6,
        JUMP_FORCE: -14,
        DOUBLE_JUMP_FORCE: -12,
        MOVE_SPEED: 5,
        MAX_FALL_SPEED: 12,
        GLIDE_FALL_SPEED: 2,
        FRICTION: 0.85
    },

    PLAYER: {
        WIDTH: 50,
        HEIGHT: 60,
        MAX_HP: 100,
        INVINCIBLE_TIME: 2000,
        PICKUP_RANGE: 40
    },

    AI: {
        WIDTH: 50,
        HEIGHT: 60,
        MAX_HP: 100,
        MOVE_SPEED: 4,
        JUMP_FORCE: -13,
        REACTION_TIME: 200,
        AGGRESSIVENESS: 0.7
    },

    BANANA: {
        WIDTH: 30,
        HEIGHT: 30,
        MAX_ON_SCREEN: 15,
        SPAWN_INTERVAL: 1500,
        FLOAT_SPEED: 1,
        FLOAT_AMPLITUDE: 10,
        SCORE_VALUE: 1
    },

    OBSTACLE: {
        ROCK: {
            WIDTH: 40,
            HEIGHT: 35,
            DAMAGE: 15,
            SPEED: 3
        },
        BIRD: {
            WIDTH: 45,
            HEIGHT: 30,
            DAMAGE: 20,
            SPEED: 4,
            FLY_HEIGHT_MIN: 100,
            FLY_HEIGHT_MAX: 300
        },
        THORN: {
            WIDTH: 35,
            HEIGHT: 40,
            DAMAGE: 10
        },
        SPAWN_INTERVAL: 4000,
        MAX_ON_SCREEN: 3
    },

    SKILL: {
        QUICK_GRAB: {
            COOLDOWN: 8000,
            NAME: '极速抓取',
            KEY: ' ',
            DESCRIPTION: '抓取屏幕所有香蕉'
        },
        GLIDE: {
            NAME: '高空滑翔',
            KEY: '↑',
            DESCRIPTION: '长按上键缓慢下落'
        },
        SHIELD: {
            COOLDOWN: 12000,
            NAME: '护盾格挡',
            KEY: 'Shift',
            DESCRIPTION: '抵挡一次障碍物伤害',
            DURATION: 3000
        }
    },

    GAME: {
        TARGET_BANANAS: 50,
        GAME_DURATION: 180000,
        STATE: {
            START: 'start',
            CHARACTER_SELECT: 'character_select',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'game_over'
        }
    },

    CHARACTERS: [
        {
            id: 'xiaoxing',
            name: '小猩',
            emoji: '🐵',
            color: '#8B4513',
            skill: 'grab',
            description: '速度型选手，跳跃力强',
            stats: { speed: 1.2, jump: 1.15, hp: 1 }
        },
        {
            id: 'jinjin',
            name: '金金',
            emoji: '🙈',
            color: '#DAA520',
            skill: 'glide',
            description: '滑翔高手，空中灵活',
            stats: { speed: 1, jump: 1.25, hp: 0.9 }
        },
        {
            id: 'baibai',
            name: '白白',
            emoji: '🐒',
            color: '#F5DEB3',
            skill: 'shield',
            description: '防御型选手，体力充沛',
            stats: { speed: 0.9, jump: 1, hp: 1.3 }
        }
    ],

    COLORS: {
        SKY: ['#87CEEB', '#B0E0E6'],
        GROUND: ['#228B22', '#32CD32'],
        LEAF: ['#90EE90', '#98FB98', '#32CD32'],
        SUNLIGHT: 'rgba(255, 255, 200, 0.3)',
        BANANA: '#FFD700',
        ROCK: '#808080',
        BIRD: '#4169E1',
        THORN: '#2F4F4F'
    },

    STORAGE_KEY: 'houzi_game_data'
};
