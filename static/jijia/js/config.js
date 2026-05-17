const CONFIG = {
    GAME_DURATION: 120,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    MECHAS: {
        thunder: {
            name: '雷霆机甲',
            icon: '⚡',
            health: 120,
            damage: 15,
            defense: 30,
            ammo: 5,
            color: '#00ffff',
            ultimateDamage: 25,
            ultimateBalls: 2,
            ultimateEffect: 'paralyze',
            ultimateDuration: 2
        },
        flame: {
            name: '烈焰机甲',
            icon: '🔥',
            health: 100,
            damage: 18,
            defense: 25,
            ammo: 4,
            color: '#ff6600',
            ultimateDamage: 30,
            ultimateBalls: 2,
            ultimateEffect: 'burn',
            ultimateDuration: 5
        },
        shield: {
            name: '壁垒机甲',
            icon: '🛡️',
            health: 150,
            damage: 12,
            defense: 40,
            ammo: 6,
            color: '#00aaff',
            ultimateDamage: 15,
            ultimateBalls: 2,
            ultimateEffect: 'shield',
            shieldDuration: 7
        }
    },
    
    BALL_TYPES: {
        normal: {
            damage: 10,
            count: 3,
            size: 'small',
            effect: null,
            color: '#4488ff',
            radius: 8
        },
        pierce: {
            damage: 12,
            count: 2,
            size: 'medium',
            effect: 'pierce',
            pierceCount: 1,
            color: '#aa44ff',
            radius: 10
        },
        explosive: {
            damage: 20,
            count: 1,
            size: 'large',
            effect: 'explosive',
            explosionRadius: 50,
            color: '#ff4444',
            radius: 12
        },
        ultimate: {
            damage: 0,
            count: 2,
            size: 'large',
            effect: 'ultimate',
            color: '#ffaa00',
            radius: 14
        }
    },
    
    ENEMY: {
        health: 200,
        damage: 20,
        speed: 1.5,
        attackInterval: 3000,
        color: '#ff4466'
    },
    
    PHYSICS: {
        gravity: 0.15,
        friction: 0.995,
        bounce: 0.85,
        maxSpeed: 15
    },
    
    STORAGE_KEY: 'jijia_game_state'
};