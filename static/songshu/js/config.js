const CONFIG = {
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 540,
    TILE_SIZE: 40,
    GRAVITY: 0.6,
    FRICTION: 0.85,
    MAX_FALL_SPEED: 15,
    
    PLAYER: {
        WIDTH: 32,
        HEIGHT: 40,
        SPEED: 4,
        JUMP_FORCE: -13,
        MAX_HEALTH: 3,
        START_LIVES: 3,
        INVINCIBLE_TIME: 2000,
        THROW_POWER: 12,
        THROW_ANGLE: -0.3
    },

    DIFFICULTY: {
        easy: { enemySpeed: 0.8, enemyAttack: 0.8, bossHealth: 0.8 },
        normal: { enemySpeed: 1.0, enemyAttack: 1.0, bossHealth: 1.0 },
        hard: { enemySpeed: 1.3, enemyAttack: 1.3, bossHealth: 1.5 }
    },

    ITEMS: {
        wood_box: { damage: 1, speed: 1, defense: 1, color: '#8B4513' },
        iron_box: { damage: 2, speed: 0.7, defense: 2, color: '#708090' },
        apple: { damage: 1, speed: 1.5, defense: 0, color: '#FF6347' },
        bomb: { damage: 3, speed: 1, defense: 0, color: '#2F4F4F', explode: true },
        flower: { score: 10, health: 0, lifeUpAt: 50 },
        star: { score: 50, health: 0, lifeUpAt: 10 },
        pinecone: { score: 20, health: 1 }
    },

    ENEMIES: {
        rat: { health: 1, speed: 1.5, damage: 1, score: 100, width: 30, height: 25, color: '#808080' },
        dog: { health: 2, speed: 2.5, damage: 1, score: 200, width: 40, height: 30, color: '#A0522D' },
        bee: { health: 1, speed: 2, damage: 1, score: 150, width: 25, height: 20, color: '#FFD700', flying: true },
        eagle: { health: 2, speed: 3, damage: 2, score: 300, width: 45, height: 35, color: '#4682B4', flying: true },
        tank: { health: 4, speed: 1, damage: 2, score: 500, width: 50, height: 40, color: '#556B2F' },
        boss_cat: { health: 20, speed: 2, damage: 2, score: 5000, width: 80, height: 80, color: '#FF8C00' }
    },

    SCORE: {
        ENEMY_KILL: 100,
        ITEM_PICKUP: 10,
        LEVEL_COMPLETE: 1000,
        TIME_BONUS: 10
    },

    COLORS: {
        neonPink: '#ff00ff',
        neonBlue: '#00ffff',
        neonGreen: '#00ff00',
        neonYellow: '#ffff00',
        neonRed: '#ff0040',
        darkBg: '#0a0a1a',
        darkSurface: '#1a1a2e',
        ground: '#2a2a4e',
        platform: '#3a3a5e'
    },

    KEYS: {
        LEFT: ['ArrowLeft'],
        RIGHT: ['ArrowRight'],
        UP: ['ArrowUp'],
        DOWN: ['ArrowDown'],
        JUMP: ['Space', 'ArrowUp'],
        ACTION: ['KeyJ'],
        PAUSE: ['Escape', 'Enter'],
        RESTART: ['KeyR'],
        P2_LEFT: ['KeyA'],
        P2_RIGHT: ['KeyD'],
        P2_UP: ['KeyW'],
        P2_DOWN: ['KeyS'],
        P2_JUMP: ['Digit1'],
        P2_ACTION: ['Digit2']
    },

    STORAGE_KEY: 'songshu_game_save_v1',
    AUTOSAVE_INTERVAL: 5000
};
