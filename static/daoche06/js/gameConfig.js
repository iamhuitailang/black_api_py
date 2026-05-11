const GAME_CONFIG = {
    storageKey: 'daoche06_game_save',
    
    canvas: {
        width: 800,
        height: 500
    },
    
    car: {
        width: 60,
        height: 30,
        maxSpeed: 3,
        reverseSpeed: 2,
        turnSpeed: 0.04,
        color: '#ff6b6b',
        bodyColor: '#2d3436',
        windowColor: '#74b9ff',
        wheelColor: '#636e72'
    },
    
    garage: {
        width: 80,
        height: 130,
        borderWidth: 3,
        margin: 5
    },
    
    obstacle: {
        defaultWidth: 30,
        defaultHeight: 30
    },
    
    levels: [
        {
            id: 1,
            name: '新手起步',
            description: '简单的倒车入库场景',
            car: {
                x: 150,
                y: 100,
                angle: 0
            },
            garage: {
                x: 650,
                y: 400,
                angle: -Math.PI / 2
            },
            obstacles: [
                { x: 400, y: 50, width: 30, height: 120, type: 'wall' },
                { x: 400, y: 300, width: 30, height: 180, type: 'wall' }
            ],
            channel: {
                x: 50,
                y: 50,
                width: 700,
                height: 400
            }
        },
        {
            id: 2,
            name: 'S弯挑战',
            description: '需要绕过障碍物',
            car: {
                x: 100,
                y: 400,
                angle: 0
            },
            garage: {
                x: 700,
                y: 80,
                angle: -Math.PI / 2
            },
            obstacles: [
                { x: 280, y: 180, width: 30, height: 120, type: 'wall' },
                { x: 450, y: 50, width: 30, height: 150, type: 'wall' },
                { x: 450, y: 300, width: 30, height: 150, type: 'wall' }
            ],
            channel: {
                x: 50,
                y: 50,
                width: 700,
                height: 400
            }
        },
        {
            id: 3,
            name: '狭窄通道',
            description: '更窄的空间，更精准的操控',
            car: {
                x: 100,
                y: 250,
                angle: 0
            },
            garage: {
                x: 700,
                y: 250,
                angle: Math.PI
            },
            obstacles: [
                { x: 250, y: 80, width: 25, height: 100, type: 'wall' },
                { x: 250, y: 320, width: 25, height: 100, type: 'wall' },
                { x: 420, y: 150, width: 25, height: 80, type: 'wall' },
                { x: 420, y: 270, width: 25, height: 80, type: 'wall' },
                { x: 580, y: 80, width: 25, height: 100, type: 'wall' },
                { x: 580, y: 320, width: 25, height: 100, type: 'wall' }
            ],
            channel: {
                x: 50,
                y: 100,
                width: 700,
                height: 300
            }
        },
        {
            id: 4,
            name: 'L型入库',
            description: '经典L型倒车入库',
            car: {
                x: 100,
                y: 100,
                angle: 0
            },
            garage: {
                x: 700,
                y: 400,
                angle: -Math.PI / 2
            },
            obstacles: [
                { x: 300, y: 180, width: 30, height: 100, type: 'wall' },
                { x: 300, y: 350, width: 200, height: 30, type: 'wall' },
                { x: 500, y: 100, width: 30, height: 150, type: 'wall' }
            ],
            channel: {
                x: 50,
                y: 50,
                width: 700,
                height: 400
            }
        },
        {
            id: 5,
            name: '极限挑战',
            description: '多障碍物复杂场景',
            car: {
                x: 80,
                y: 420,
                angle: 0
            },
            garage: {
                x: 700,
                y: 80,
                angle: -Math.PI / 2
            },
            obstacles: [
                { x: 180, y: 200, width: 25, height: 100, type: 'wall' },
                { x: 180, y: 350, width: 25, height: 100, type: 'wall' },
                { x: 330, y: 50, width: 25, height: 120, type: 'wall' },
                { x: 330, y: 280, width: 25, height: 120, type: 'wall' },
                { x: 480, y: 150, width: 25, height: 100, type: 'wall' },
                { x: 480, y: 350, width: 25, height: 100, type: 'wall' },
                { x: 620, y: 200, width: 25, height: 120, type: 'wall' }
            ],
            channel: {
                x: 50,
                y: 50,
                width: 700,
                height: 400
            }
        }
    ]
};

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    SUCCESS: 'success',
    FAILED: 'failed'
};

const DEFAULT_SAVE_DATA = {
    currentLevel: 1,
    unlockedLevels: 1,
    totalSuccess: 0,
    totalFailed: 0,
    bestTimes: {},
    playTime: 0,
    gameState: GAME_STATE.MENU,
    car: null,
    lastSaveTime: Date.now()
};
