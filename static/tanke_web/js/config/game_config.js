const GameConfig = {
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 640,

    PLAYER: {
        BASE_HP: 3,
        BASE_ATTACK: 1,
        BASE_FIRE_RATE: 1000,
        BASE_SPEED: 5,
        BASE_BULLET_COUNT: 1,
        WIDTH: 50,
        HEIGHT: 60,
        COLORS: {
            1: '#22c55e',
            2: '#3b82f6',
            3: '#ef4444',
            4: '#6b7280',
            5: '#a855f7'
        },
        SKIN_NAMES: {
            1: '侦察坦克',
            2: '中型坦克',
            3: '重型坦克',
            4: '虎式坦克',
            5: '未来坦克'
        }
    },

    ENEMIES: {
        light: {
            name: '轻型坦克',
            emoji: '🚗',
            hp: 1,
            maxHp: 1,
            speed: 3,
            attack: 1,
            score: 10,
            exp: 10,
            width: 40,
            height: 45,
            color: '#60a5fa',
            fireRate: 2000
        },
        medium: {
            name: '中型坦克',
            emoji: '🚎',
            hp: 2,
            maxHp: 2,
            speed: 2,
            attack: 1,
            score: 20,
            exp: 20,
            width: 48,
            height: 52,
            color: '#f59e0b',
            fireRate: 1800
        },
        heavy: {
            name: '重型坦克',
            emoji: '🚚',
            hp: 3,
            maxHp: 3,
            speed: 1.5,
            attack: 2,
            score: 30,
            exp: 30,
            width: 56,
            height: 60,
            color: '#ef4444',
            fireRate: 2500
        },
        helicopter: {
            name: '武装直升机',
            emoji: '🚁',
            hp: 2,
            maxHp: 2,
            speed: 4,
            attack: 1,
            score: 25,
            exp: 25,
            width: 44,
            height: 40,
            color: '#8b5cf6',
            fireRate: 1500,
            isAir: true,
            randomMove: true
        },
        suicide: {
            name: '自爆坦克',
            emoji: '💣',
            hp: 1,
            maxHp: 1,
            speed: 3.5,
            attack: 999,
            score: 15,
            exp: 15,
            width: 36,
            height: 40,
            color: '#f97316',
            fireRate: 0,
            isSuicide: true
        },
        boss: {
            name: 'BOSS坦克',
            emoji: '🎖️',
            hp: 20,
            maxHp: 20,
            speed: 1,
            attack: 3,
            score: 100,
            exp: 100,
            width: 80,
            height: 90,
            color: '#dc2626',
            fireRate: 1000,
            isBoss: true
        }
    },

    WAVES: [
        {
            wave: 1,
            enemies: [
                { type: 'light', count: 5 }
            ]
        },
        {
            wave: 2,
            enemies: [
                { type: 'light', count: 8 }
            ]
        },
        {
            wave: 3,
            enemies: [
                { type: 'light', count: 5 },
                { type: 'medium', count: 3 }
            ]
        },
        {
            wave: 4,
            enemies: [
                { type: 'medium', count: 4 },
                { type: 'helicopter', count: 2 }
            ]
        },
        {
            wave: 5,
            enemies: [
                { type: 'boss', count: 1 },
                { type: 'light', count: 4 }
            ]
        }
    ],

    getWaveConfig(wave) {
        const baseWaves = this.WAVES;
        if (wave <= baseWaves.length) {
            return { ...baseWaves[wave - 1] };
        }
        
        const extraWaves = wave - baseWaves.length;
        const lightCount = 5 + extraWaves * 2;
        const mediumCount = Math.floor(extraWaves / 2) + 1;
        const heavyCount = Math.floor(extraWaves / 3);
        
        const enemies = [];
        if (lightCount > 0) enemies.push({ type: 'light', count: lightCount });
        if (mediumCount > 0) enemies.push({ type: 'medium', count: mediumCount });
        if (heavyCount > 0) enemies.push({ type: 'heavy', count: heavyCount });
        
        if (extraWaves % 5 === 0) {
            enemies.push({ type: 'boss', count: 1 });
        }
        
        return { wave, enemies };
    },

    getTotalEnemiesForWave(wave) {
        const config = this.getWaveConfig(wave);
        let total = 0;
        config.enemies.forEach(e => total += e.count);
        return total;
    },

    calculateStatsByLevel(level) {
        return {
            hp: this.PLAYER.BASE_HP + (level - 1),
            attack: this.PLAYER.BASE_ATTACK,
            fireRate: Math.max(200, this.PLAYER.BASE_FIRE_RATE - (level - 1) * 200),
            speed: this.PLAYER.BASE_SPEED + (level - 1),
            bulletCount: Math.min(5, this.PLAYER.BASE_BULLET_COUNT + Math.floor((level - 1) / 5))
        };
    },

    getSkinIdByLevel(level) {
        if (level >= 20) return 5;
        if (level >= 15) return 4;
        if (level >= 10) return 3;
        if (level >= 5) return 2;
        return 1;
    },

    getSkinColor(skinId) {
        return this.PLAYER.COLORS[skinId] || this.PLAYER.COLORS[1];
    },

    calculateWaveBonus(wave) {
        return 50 * wave;
    },

    getEnemyScore(type) {
        return this.ENEMIES[type]?.score || 0;
    },

    getEnemyExp(type) {
        return this.ENEMIES[type]?.exp || 0;
    }
};

window.GameConfig = GameConfig;
