const Levels = (() => {
    const levels = [
        {
            id: 1,
            name: '晴空云端',
            theme: {
                skyTop: '#87CEEB',
                skyBottom: '#E6F3FF',
                ground: '#98FB98',
                type: 'cloud'
            },
            windStrength: 0.1,
            windVariability: 0.05,
            obstacles: [
                { type: 'spike', x: 100, y: 420 }
            ],
            powerups: [
                { type: 'star', x: 275, y: 150 },
                { type: 'star', x: 180, y: 250 },
                { type: 'slow', x: 350, y: 200 },
                { type: 'shield', x: 220, y: 350 }
            ],
            safeZone: { x: 180, width: 190 }
        },
        {
            id: 2,
            name: '森林落叶',
            theme: {
                skyTop: '#5D8AA8',
                skyBottom: '#98D8AA',
                ground: '#6B4423',
                type: 'forest'
            },
            windStrength: 0.12,
            windVariability: 0.08,
            obstacles: [
                { type: 'spike', x: 80, y: 400 },
                { type: 'spike', x: 450, y: 380 }
            ],
            powerups: [
                { type: 'star', x: 280, y: 150 },
                { type: 'star', x: 150, y: 220 },
                { type: 'slow', x: 380, y: 280 },
                { type: 'shield', x: 250, y: 380 }
            ],
            safeZone: { x: 190, width: 170 }
        },
        {
            id: 3,
            name: '暮色晚风',
            theme: {
                skyTop: '#FF6B6B',
                skyBottom: '#FFE66D',
                ground: '#4ECDC4',
                type: 'sunset'
            },
            windStrength: 0.15,
            windVariability: 0.1,
            obstacles: [
                { type: 'spike', x: 70, y: 380 },
                { type: 'spike', x: 470, y: 400 },
                { type: 'rock', x: 270, y: 510, width: 50, height: 30 }
            ],
            powerups: [
                { type: 'star', x: 150, y: 150 },
                { type: 'star', x: 400, y: 180 },
                { type: 'star', x: 275, y: 250 },
                { type: 'slow', x: 200, y: 320 },
                { type: 'shield', x: 350, y: 350 }
            ],
            safeZone: { x: 200, width: 150 }
        },
        {
            id: 4,
            name: '星空高空',
            theme: {
                skyTop: '#0F0F2E',
                skyBottom: '#1A1A4E',
                ground: '#2D2D6D',
                type: 'starry'
            },
            windStrength: 0.18,
            windVariability: 0.12,
            obstacles: [
                { type: 'spike', x: 60, y: 360 },
                { type: 'spike', x: 480, y: 390 },
                { type: 'rock', x: 260, y: 500, width: 55, height: 35 },
                { type: 'moving', x: 180, y: 280, moveX: 80, speed: 0.01 }
            ],
            powerups: [
                { type: 'star', x: 130, y: 140 },
                { type: 'star', x: 420, y: 160 },
                { type: 'star', x: 280, y: 220 },
                { type: 'slow', x: 180, y: 300 },
                { type: 'shield', x: 380, y: 320 }
            ],
            safeZone: { x: 210, width: 130 }
        },
        {
            id: 5,
            name: '极限乱流',
            theme: {
                skyTop: '#1A1A2E',
                skyBottom: '#2E2E4E',
                ground: '#3E3E5E',
                type: 'storm'
            },
            windStrength: 0.22,
            windVariability: 0.15,
            obstacles: [
                { type: 'spike', x: 50, y: 350 },
                { type: 'spike', x: 490, y: 370 },
                { type: 'rock', x: 280, y: 510, width: 60, height: 35 },
                { type: 'moving', x: 150, y: 260, moveX: 70, speed: 0.012 },
                { type: 'vortex', x: 400, y: 320, radius: 35 }
            ],
            powerups: [
                { type: 'star', x: 120, y: 130 },
                { type: 'star', x: 430, y: 150 },
                { type: 'star', x: 275, y: 200 },
                { type: 'slow', x: 170, y: 280 },
                { type: 'shield', x: 330, y: 350 },
                { type: 'shield', x: 200, y: 400 }
            ],
            safeZone: { x: 220, width: 110 }
        }
    ];

    const getLevel = (id) => {
        return levels.find(l => l.id === id);
    };

    const getAllLevels = () => {
        return levels;
    };

    const getTotalLevels = () => {
        return levels.length;
    };

    return {
        getLevel,
        getAllLevels,
        getTotalLevels
    };
})();
