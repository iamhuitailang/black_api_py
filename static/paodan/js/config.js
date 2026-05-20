const GameConfig = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GRAVITY: 0.4,
    GROUND_Y: 600,
    MAX_POWER: 100,
    POWER_INCREMENT: 1.5,
    MIN_ANGLE: 10,
    MAX_ANGLE: 85,
    ANGLE_STEP: 1,

    CANNONS: {
        basic: {
            name: '基础人间大炮',
            icon: '🎯',
            maxHealth: 100,
            basePower: 15,
            fireSpeed: 'medium',
            blastRadius: 'small',
            color: '#4CAF50',
            barrelColor: '#5D4037',
            projectiles: {
                normal: { name: '普通冲击弹', power: 15, speed: 1, radius: 12, color: '#2196F3' },
                charged: { name: '蓄力爆弹', power: 22, speed: 0.85, radius: 18, color: '#FF5722' }
            }
        },
        flame: {
            name: '烈焰巨炮',
            icon: '🔥',
            maxHealth: 85,
            basePower: 22,
            fireSpeed: 'slow',
            blastRadius: 'large',
            color: '#FF5722',
            barrelColor: '#BF360C',
            projectiles: {
                normal: { name: '烈焰飞弹', power: 20, speed: 0.9, radius: 14, color: '#FF6F00' },
                charged: { name: '范围轰炸弹', power: 30, speed: 0.75, radius: 22, color: '#D32F2F' }
            }
        },
        wind: {
            name: '疾风速射炮',
            icon: '💨',
            maxHealth: 90,
            basePower: 12,
            fireSpeed: 'fast',
            blastRadius: 'tiny',
            color: '#03A9F4',
            barrelColor: '#01579B',
            projectiles: {
                normal: { name: '疾速弹射', power: 12, speed: 1.3, radius: 10, color: '#00BCD4' },
                charged: { name: '低空突袭弹', power: 18, speed: 1.15, radius: 12, color: '#0097A7' }
            }
        }
    },

    SPECIAL_SKILLS: {
        highAngle: {
            name: '高空抛物弹',
            condition: { angle: 45, power: 90 },
            power: 26,
            effect: 'ignore_low_dodge',
            color: '#9C27B0'
        },
        lowAngle: {
            name: '贴地突袭弹',
            condition: { angle: 25, power: 40 },
            power: 17,
            effect: 'ground_skimming',
            color: '#795548'
        },
        rapidFire: {
            name: '连环飞人',
            condition: { rapidClicks: 3, timeWindow: 1500 },
            power: 10,
            count: 3,
            effect: 'rapid_fire',
            color: '#E91E63'
        }
    },

    ENEMY_AI: {
        reactionTime: { min: 800, max: 2000 },
        accuracy: {
            far: 0.6,
            medium: 0.75,
            close: 0.85
        },
        dodgeChance: {
            far: 0.1,
            medium: 0.25,
            close: 0.4
        }
    },

    DISTANCE_THRESHOLDS: {
        far: 700,
        medium: 400,
        close: 0
    },

    BLAST_RADIUS: {
        tiny: 30,
        small: 45,
        medium: 60,
        large: 80
    },

    OBSTACLES: [
        { x: 450, y: 550, width: 40, height: 50, type: 'wall', color: '#8D6E63' },
        { x: 750, y: 560, width: 35, height: 40, type: 'wall', color: '#A1887F' },
        { x: 600, y: 585, width: 60, height: 15, type: 'bump', color: '#689F38' }
    ],

    CLOUDS: [
        { x: 100, y: 80, size: 50, speed: 0.3 },
        { x: 350, y: 50, size: 70, speed: 0.25 },
        { x: 600, y: 100, size: 55, speed: 0.35 },
        { x: 850, y: 60, size: 65, speed: 0.28 },
        { x: 1050, y: 90, size: 45, speed: 0.32 }
    ],

    COLORS: {
        sky: ['#87CEEB', '#B3E5FC', '#81D4FA'],
        ground: '#8BC34A',
        groundDark: '#689F38',
        playerCannon: { x: 120, y: 550 },
        enemyCannon: { x: 1080, y: 550 }
    }
};
