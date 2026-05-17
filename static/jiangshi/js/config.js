const CONFIG = {
    CANVAS: {
        WIDTH: 900,
        HEIGHT: 500,
        GRID_COLS: 9,
        GRID_ROWS: 5,
        CELL_WIDTH: 80,
        CELL_HEIGHT: 80,
        GRID_OFFSET_X: 100,
        GRID_OFFSET_Y: 50
    },

    DIFFICULTY: {
        easy: {
            zombieSpeedMultiplier: 0.6,
            zombieHealthMultiplier: 0.7,
            sunProductionMultiplier: 1.5,
            spawnIntervalMultiplier: 1.5
        },
        normal: {
            zombieSpeedMultiplier: 1.0,
            zombieHealthMultiplier: 1.0,
            sunProductionMultiplier: 1.0,
            spawnIntervalMultiplier: 1.0
        },
        hard: {
            zombieSpeedMultiplier: 1.3,
            zombieHealthMultiplier: 1.2,
            sunProductionMultiplier: 0.9,
            spawnIntervalMultiplier: 0.8
        }
    },

    PLANTS: {
        sunflower: {
            name: '向日葵',
            cost: 50,
            health: 100,
            sunProduction: 25,
            sunInterval: 15000,
            emoji: '🌻',
            color: '#FFD700'
        },
        peashooter: {
            name: '豌豆射手',
            cost: 100,
            health: 100,
            damage: 25,
            attackInterval: 1200,
            projectileSpeed: 6,
            emoji: '🌱',
            color: '#90EE90'
        },
        iceshooter: {
            name: '寒冰射手',
            cost: 150,
            health: 100,
            damage: 20,
            attackInterval: 1500,
            projectileSpeed: 6,
            slowEffect: 0.4,
            slowDuration: 4000,
            emoji: '❄️',
            color: '#87CEEB'
        },
        wallnut: {
            name: '坚果墙',
            cost: 50,
            health: 500,
            emoji: '🥜',
            color: '#DEB887'
        }
    },

    ZOMBIES: {
        normal: {
            name: '普通僵尸',
            health: 100,
            speed: 0.3,
            damage: 10,
            attackInterval: 1000,
            emoji: '🧟',
            color: '#8B4513'
        },
        cone: {
            name: '路障僵尸',
            health: 180,
            speed: 0.25,
            damage: 10,
            attackInterval: 1000,
            armor: 80,
            emoji: '🧟‍♂️',
            color: '#FF6347'
        },
        bucket: {
            name: '铁桶僵尸',
            health: 300,
            speed: 0.2,
            damage: 15,
            attackInterval: 1000,
            armor: 200,
            emoji: '🧟‍♀️',
            color: '#708090'
        }
    },

    WAVES: [
        { zombies: [{ type: 'normal', count: 2 }], delay: 4000 },
        { zombies: [{ type: 'normal', count: 3 }], delay: 3500 },
        { zombies: [{ type: 'normal', count: 4 }], delay: 3000 },
        { zombies: [{ type: 'normal', count: 5 }], delay: 3000 },
        { zombies: [{ type: 'normal', count: 4 }, { type: 'cone', count: 1 }], delay: 2800 },
        { zombies: [{ type: 'normal', count: 5 }, { type: 'cone', count: 2 }], delay: 2500 },
        { zombies: [{ type: 'normal', count: 5 }, { type: 'cone', count: 3 }], delay: 2200 },
        { zombies: [{ type: 'normal', count: 6 }, { type: 'cone', count: 3 }, { type: 'bucket', count: 1 }], delay: 2000 },
        { zombies: [{ type: 'normal', count: 7 }, { type: 'cone', count: 4 }, { type: 'bucket', count: 2 }], delay: 1800 },
        { zombies: [{ type: 'normal', count: 8 }, { type: 'cone', count: 5 }, { type: 'bucket', count: 3 }], delay: 1500 }
    ],

    GAME: {
        INITIAL_SUN: 100,
        SUN_DROP_INTERVAL: 8000,
        SUN_DROP_AMOUNT: 25,
        WAVE_PREP_TIME: 8000,
        SCORE_PER_KILL: 10,
        SCORE_PER_WAVE: 100,
        TOTAL_WAVES: 10
    },

    STORAGE_KEY: 'pvz_mini_game_save'
};
