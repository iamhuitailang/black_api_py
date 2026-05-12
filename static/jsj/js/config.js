const CONFIG = {
    PLAYER: {
        MAX_HEALTH: 100,
        SPEED: 4,
        SIZE: 30,
        COLOR: '#1a1a1a'
    },

    ZOMBIES: {
        NORMAL: {
            name: '普通僵尸',
            emoji: '🧟',
            speed: 1.2,
            health: 1,
            score: 10,
            size: 25,
            color: '#4a5d23',
            spawnChance: 0.5
        },
        FAST: {
            name: '迅捷僵尸',
            emoji: '🧟',
            speed: 2.5,
            health: 1,
            score: 15,
            size: 22,
            color: '#8b7355',
            spawnChance: 0.2
        },
        STRONG: {
            name: '强壮僵尸',
            emoji: '💪',
            speed: 1.0,
            health: 3,
            score: 30,
            size: 35,
            color: '#5d3a1a',
            spawnChance: 0.15
        },
        FIRE: {
            name: '火焰僵尸',
            emoji: '🔥',
            speed: 1.5,
            health: 2,
            score: 25,
            size: 28,
            color: '#8b2500',
            spawnChance: 0.1
        },
        BOSS: {
            name: '尸王',
            emoji: '👑',
            speed: 0.8,
            health: 10,
            score: 100,
            size: 50,
            color: '#4a0000',
            spawnChance: 0.05
        }
    },

    WEAPONS: {
        PISTOL: {
            name: '手枪',
            damage: 1,
            fireRate: 400,
            magazineSize: 12,
            reloadTime: 1500,
            bulletSpeed: 12,
            spread: 0,
            bulletsPerShot: 1,
            unlockScore: 0
        },
        SHOTGUN: {
            name: '霰弹枪',
            damage: 1,
            fireRate: 800,
            magazineSize: 6,
            reloadTime: 2000,
            bulletSpeed: 10,
            spread: 0.3,
            bulletsPerShot: 3,
            unlockScore: 500
        },
        SMG: {
            name: '冲锋枪',
            damage: 1,
            fireRate: 100,
            magazineSize: 30,
            reloadTime: 2000,
            bulletSpeed: 14,
            spread: 0.1,
            bulletsPerShot: 1,
            unlockScore: 1000
        },
        SNIPER: {
            name: '狙击枪',
            damage: 3,
            fireRate: 1200,
            magazineSize: 5,
            reloadTime: 2500,
            bulletSpeed: 20,
            spread: 0,
            bulletsPerShot: 1,
            unlockScore: 2000
        }
    },

    ITEMS: {
        HEALTH: {
            name: '医疗包',
            emoji: '❤️',
            effect: 'health',
            value: 30,
            color: '#ff4444',
            spawnChance: 0.05
        },
        BOMB: {
            name: '炸弹',
            emoji: '💣',
            effect: 'bomb',
            value: 0,
            color: '#333',
            spawnChance: 0.03
        },
        SPEED: {
            name: '加速',
            emoji: '⚡',
            effect: 'speed',
            value: 5000,
            color: '#ffdd00',
            spawnChance: 0.04
        },
        SHIELD: {
            name: '护盾',
            emoji: '🛡️',
            effect: 'shield',
            value: 3000,
            color: '#4488ff',
            spawnChance: 0.03
        },
        COIN: {
            name: '金币',
            emoji: '💰',
            effect: 'coin',
            value: 100,
            color: '#ffd700',
            spawnChance: 0.05
        }
    },

    DIFFICULTY: [
        { wave: 1, spawnInterval: 1500, maxZombies: 10, bossChance: 0.05 },
        { wave: 6, spawnInterval: 1200, maxZombies: 15, bossChance: 0.1 },
        { wave: 11, spawnInterval: 1000, maxZombies: 20, bossChance: 0.15 },
        { wave: 16, spawnInterval: 800, maxZombies: 30, bossChance: 0.2 }
    ],

    COMBO: {
        KILL_COUNT: 5,
        BONUS_SCORE: 50,
        TIME_WINDOW: 3000
    },

    PARTICLES: {
        MAX_COUNT: 200,
        COLORS: ['#1a1a1a', '#2a2a2a', '#3a3a3a', '#4a4a4a', '#8b0000', '#ff4444']
    },

    STORAGE_KEY: 'zombie_survivor_save'
};
