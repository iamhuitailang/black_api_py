const GameConfig = {
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 540,
    GROUND_Y: 440,
    GRAVITY: 0.8,
    MAX_ROUNDS: 3,
    ROUND_TIME: 99,
    
    CHARACTER_TYPES: {
        WUSHENG: 'wusheng',
        HUALIAN: 'hualian',
        DANJIAO: 'danjiao'
    },
    
    CHARACTERS: {
        wusheng: {
            name: '武生',
            maxHealth: 100,
            attack: 11,
            defense: 5,
            speed: 5,
            jumpForce: 14,
            faceColors: ['#ff4444', '#ff6b6b', '#cc0000'],
            ultimateDamage: 24,
            bodyColor: '#c0392b',
            costumeColor: '#e74c3c'
        },
        hualian: {
            name: '花脸',
            maxHealth: 98,
            attack: 15,
            defense: 6,
            speed: 3.5,
            jumpForce: 12,
            faceColors: ['#3498db', '#2980b9', '#1a5276'],
            ultimateDamage: 30,
            bodyColor: '#2980b9',
            costumeColor: '#3498db'
        },
        danjiao: {
            name: '旦角',
            maxHealth: 88,
            attack: 9,
            defense: 4,
            speed: 7,
            jumpForce: 16,
            faceColors: ['#e91e63', '#c2185b', '#880e4f'],
            ultimateDamage: 21,
            bodyColor: '#c2185b',
            costumeColor: '#e91e63'
        }
    },
    
    ATTACKS: {
        LIGHT_PALM: {
            name: '轻掌',
            damage: 7,
            startup: 50,
            recovery: 150,
            range: 60,
            energyGain: 8,
            type: 'palm'
        },
        HEAVY_PALM: {
            name: '重掌',
            damage: 13,
            startup: 120,
            recovery: 250,
            range: 90,
            energyGain: 15,
            type: 'palm'
        },
        LIGHT_KICK: {
            name: '轻踢',
            damage: 6,
            startup: 70,
            recovery: 180,
            range: 80,
            energyGain: 7,
            type: 'kick'
        },
        HEAVY_KICK: {
            name: '重踢',
            damage: 14,
            startup: 150,
            recovery: 280,
            range: 110,
            energyGain: 18,
            type: 'kick'
        }
    },
    
    ULTIMATES: {
        RED_FACE_ROAR: {
            name: '红脸怒啸',
            damage: 17,
            type: 'projectile',
            invincible: false
        },
        CHAIN_PALM: {
            name: '连环掌势',
            damage: 19,
            type: 'melee_multi',
            invincible: false
        },
        BLACK_FACE_SHOCK: {
            name: '黑脸镇场',
            damage: 24,
            type: 'counter',
            invincible: true
        },
        HEAVY_SHOCK: {
            name: '重势震击',
            damage: 28,
            type: 'counter',
            invincible: true
        },
        PINK_FACE_STRIKE: {
            name: '粉脸柔袭',
            damage: 32,
            type: 'counter',
            invincible: true
        }
    },
    
    FACES: {
        RED: { name: '红脸', color: '#ff4444' },
        BLACK: { name: '黑脸', color: '#333333' },
        PINK: { name: '粉脸', color: '#ff69b4' },
        BLUE: { name: '蓝脸', color: '#4488ff' }
    },
    
    KEYS: {
        LEFT: 'ArrowLeft',
        RIGHT: 'ArrowRight',
        UP: 'ArrowUp',
        DOWN: 'ArrowDown',
        LIGHT_PALM: 'KeyJ',
        HEAVY_PALM: 'KeyK',
        LIGHT_KICK: 'KeyU',
        HEAVY_KICK: 'KeyI',
        SWITCH_FACE: 'KeyL',
        SPECIAL: 'KeyO',
        PAUSE: 'Escape'
    }
};
