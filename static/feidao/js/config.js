const GameConfig = {
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 600,
    GRAVITY: 0.25,
    KNIFE_TYPES: {
        NORMAL: {
            id: 'normal',
            name: '普通飞刀',
            speedMultiplier: 1,
            gravityMultiplier: 1,
            damage: 1,
            color: '#8B4513',
            bladeColor: '#C0C0C0'
        },
        SWIFT: {
            id: 'swift',
            name: '疾风飞刀',
            speedMultiplier: 1.4,
            gravityMultiplier: 0.8,
            damage: 1,
            color: '#4169E1',
            bladeColor: '#87CEEB'
        },
        HEAVY: {
            id: 'heavy',
            name: '重刃飞刀',
            speedMultiplier: 0.7,
            gravityMultiplier: 1.6,
            damage: 1.5,
            color: '#2F4F4F',
            bladeColor: '#708090'
        },
        TRICK: {
            id: 'trick',
            name: '花式回旋刀',
            speedMultiplier: 0.9,
            gravityMultiplier: 0.9,
            damage: 1,
            color: '#8B008B',
            bladeColor: '#DDA0DD',
            boomerang: true
        }
    },
    THROW_STRENGTH: {
        LIGHT: { id: 'light', name: '轻投', baseScore: 5, speed: 14, gravityFactor: 0.6 },
        MEDIUM: { id: 'medium', name: '中投', baseScore: 10, speed: 11, gravityFactor: 1 },
        HEAVY: { id: 'heavy', name: '重投', baseScore: 18, speed: 8, gravityFactor: 1.5 }
    },
    SCENES: {
        STREET: {
            id: 'street',
            name: '街头小擂台',
            baseScore: 10,
            targetSpeed: 0.5,
            obstacles: 2,
            backgroundColor: '#8B7355',
            groundColor: '#6B4423'
        },
        MARKET: {
            id: 'market',
            name: '夜市杂耍场',
            baseScore: 12,
            targetSpeed: 1,
            obstacles: 4,
            backgroundColor: '#4A3728',
            groundColor: '#3D2914'
        },
        HIGH: {
            id: 'high',
            name: '高空惊险台',
            baseScore: 15,
            targetSpeed: 1.8,
            obstacles: 6,
            backgroundColor: '#1E3A5F',
            groundColor: '#0D1B2A'
        },
        NIGHT: {
            id: 'night',
            name: '暗夜极限场',
            baseScore: 18,
            targetSpeed: 2.5,
            obstacles: 8,
            backgroundColor: '#0D0D1A',
            groundColor: '#050510'
        }
    },
    TARGET_STATES: {
        STATIC: 'static',
        MOVING: 'moving',
        ROTATING: 'rotating',
        SHAKING: 'shaking',
        FLASHING: 'flashing'
    },
    INITIAL_KNIVES: 10,
    POINTS_PER_LEVEL: 100
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
