const Config = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    MAP_WIDTH: 2560,
    MAP_HEIGHT: 1440,

    GAME_DURATION: 300,
    TOTAL_WAVES: 5,
    WAVE_BREAK_TIME: 8,

    CHARACTER_CLASSES: {
        assault: {
            name: '突击兵',
            maxHealth: 100,
            moveSpeed: 200,
            damageMultiplier: 1.0,
            critChance: 0.1,
            reloadSpeedMultiplier: 1.3,
            damageReduction: 0,
            reloadDamageReduction: 0.3,
            color: '#4488ff',
            icon: '🔫'
        },
        heavy: {
            name: '重装兵',
            maxHealth: 130,
            moveSpeed: 150,
            damageMultiplier: 0.9,
            critChance: 0.05,
            reloadSpeedMultiplier: 0.8,
            damageReduction: 0.15,
            reloadDamageReduction: 0,
            color: '#44aa44',
            icon: '🛡️'
        },
        scout: {
            name: '侦察兵',
            maxHealth: 80,
            moveSpeed: 260,
            damageMultiplier: 1.2,
            critChance: 0.2,
            reloadSpeedMultiplier: 1.0,
            damageReduction: 0,
            reloadDamageReduction: 0,
            longRangeBonus: 0.25,
            color: '#ffaa00',
            icon: '🎯'
        }
    },

    WEAPONS: {
        pistol: {
            name: '手枪',
            icon: '🔫',
            damage: 12,
            fireRate: 250,
            magazineSize: 12,
            reloadTime: 1200,
            bulletSpeed: 700,
            bulletSpread: 0.03,
            range: 600,
            bulletsPerShot: 1,
            color: '#ffcc00'
        },
        rifle: {
            name: '突击步枪',
            icon: '🔫',
            damage: 18,
            fireRate: 100,
            magazineSize: 30,
            reloadTime: 2000,
            bulletSpeed: 800,
            bulletSpread: 0.05,
            range: 500,
            bulletsPerShot: 1,
            color: '#ff8800'
        },
        shotgun: {
            name: '霰弹枪',
            icon: '🔫',
            damage: 10,
            fireRate: 700,
            magazineSize: 8,
            reloadTime: 2500,
            bulletSpeed: 600,
            bulletSpread: 0.15,
            range: 250,
            bulletsPerShot: 7,
            color: '#ff4400'
        }
    },

    ENEMY_TYPES: {
        zombie: {
            name: '丧尸',
            maxHealth: 40,
            moveSpeed: 100,
            damage: 15,
            attackRange: 35,
            attackCooldown: 1000,
            aggroRange: 400,
            color: '#66aa44',
            radius: 16,
            score: 10
        },
        shooter: {
            name: '射手小怪',
            maxHealth: 30,
            moveSpeed: 60,
            damage: 12,
            attackRange: 500,
            attackCooldown: 2000,
            aggroRange: 600,
            bulletSpeed: 400,
            color: '#aa6644',
            radius: 14,
            score: 20
        },
        elite: {
            name: '精英巨兽',
            maxHealth: 200,
            moveSpeed: 130,
            damage: 30,
            attackRange: 50,
            attackCooldown: 1500,
            aggroRange: 2000,
            color: '#aa2222',
            radius: 28,
            score: 100,
            chargeSpeed: 350,
            chargeCooldown: 5000
        }
    },

    WAVE_CONFIG: [
        { zombies: 6, shooters: 0, elites: 0 },
        { zombies: 8, shooters: 2, elites: 0 },
        { zombies: 10, shooters: 3, elites: 1 },
        { zombies: 12, shooters: 4, elites: 1 },
        { zombies: 15, shooters: 5, elites: 2 }
    ]
};
