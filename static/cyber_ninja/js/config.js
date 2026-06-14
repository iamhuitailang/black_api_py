const GameConfig = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 520,
    GRAVITY: 0.8,
    TILE_SIZE: 40,

    PLAYER: {
        WIDTH: 40,
        HEIGHT: 60,
        MAX_HEALTH: 100,
        MOVE_SPEED: 5,
        JUMP_FORCE: -15,
        MAX_JUMPS: 2,
        ATTACK_DAMAGE: 20,
        ATTACK_RANGE: 60,
        ATTACK_COOLDOWN: 300,
        SHURIKEN_DAMAGE: 20,
        SHURIKEN_SPEED: 12,
        SHURIKEN_COOLDOWN: 1000,
        INVINCIBLE_TIME: 1000
    },

    ENEMIES: {
        DRONE: {
            WIDTH: 50,
            HEIGHT: 30,
            HEALTH: 30,
            SPEED: 2,
            DAMAGE: 8,
            SHOOT_COOLDOWN: 2000,
            BULLET_SPEED: 6,
            PATROL_HEIGHT: 150
        },
        MECH: {
            WIDTH: 50,
            HEIGHT: 70,
            HEALTH: 50,
            SPEED: 2.5,
            DAMAGE: 15,
            ATTACK_RANGE: 50,
            ATTACK_COOLDOWN: 1500
        },
        SPIDER: {
            WIDTH: 40,
            HEIGHT: 30,
            HEALTH: 20,
            SPEED: 4,
            DAMAGE: 30,
            EXPLODE_RANGE: 80,
            EXPLODE_WARNING_TIME: 500
        }
    },

    BOSS: {
        WIDTH: 120,
        HEIGHT: 140,
        HEALTH: 200,
        PUNCH_RANGE: 80,
        PUNCH_DAMAGE: 15,
        HEAVY_PUNCH_RANGE: 60,
        HEAVY_PUNCH_DAMAGE: 30,
        LASER_DAMAGE: 10,
        LASER_WARNING_TIME: 1500,
        LASER_DURATION: 3000,
        ATTACK_COOLDOWN: 2000
    },

    ITEMS: {
        DROP_CHANCE: 0.2,
        DATA_SHARD_SCORE: 10,
        ENERGY_CORE_HEAL: 20,
        BUFF_DURATION: 10000,
        INVINCIBLE_BUFF_DURATION: 3000
    },

    AREAS: [
        {
            name: '霓虹街道',
            levels: 3,
            bgColor: '#0a0a2a',
            neonColors: ['#00ffff', '#ff00ff', '#ffff00'],
            hasSteam: false,
            hasLasers: false
        },
        {
            name: '工厂车间',
            levels: 3,
            bgColor: '#1a1510',
            neonColors: ['#ff8800', '#88ff00', '#00ff88'],
            hasSteam: true,
            hasLasers: false
        },
        {
            name: '核心机房',
            levels: 3,
            bgColor: '#1a0a0a',
            neonColors: ['#ff0000', '#ff4400', '#ff8800'],
            hasSteam: false,
            hasLasers: true
        }
    ],

    COLORS: {
        CYAN: '#00ffff',
        MAGENTA: '#ff00ff',
        YELLOW: '#ffff00',
        RED: '#ff4444',
        BLUE: '#4444ff',
        GOLD: '#ffd700',
        DARK_BG: '#0a0a1a',
        GROUND: '#1a1a2e'
    }
};
