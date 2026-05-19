const CONFIG = {
    canvas: {
        width: 1200,
        height: 700
    },
    gravity: 0.6,
    player: {
        width: 40,
        height: 50,
        speed: 5,
        jumpForce: -14,
        maxJumps: 2,
        invincibleTime: 1500,
        initialLives: 3
    },
    platform: {
        types: {
            solid: {
                color: 'rgba(100, 200, 255, 0.8)',
                borderColor: '#74b9ff'
            },
            moving: {
                color: 'rgba(255, 180, 100, 0.8)',
                borderColor: '#fdcb6e'
            },
            fragile: {
                color: 'rgba(255, 100, 100, 0.8)',
                borderColor: '#ff7675',
                breakTime: 1000
            },
            invisible: {
                color: 'rgba(200, 150, 255, 0.8)',
                borderColor: '#a29bfe',
                triggerDistance: 150
            }
        }
    },
    enemy: {
        speed: 2,
        patrolDistance: 200
    },
    storageKey: 'daishu_game_save',
    colors: {
        background: ['#0a0a1a', '#1a1a3a', '#2a1a4a'],
        star: ['#ffffff', '#ffeaa7', '#a29bfe', '#74b9ff'],
        flag: '#fdcb6e'
    }
};
