const GameConfig = {
    canvasWidth: 800,
    canvasHeight: 533,
    
    gravity: 0.6,
    maxFallSpeed: 15,
    
    player: {
        width: 36,
        height: 48,
        moveSpeed: 5,
        jumpForce: 14,
        chargeJumpForce: 22,
        maxChargeTime: 1500,
        maxHealth: 3,
        invincibleTime: 1500
    },
    
    platformTypes: {
        wood: {
            name: '普通木秋千',
            durability: 2,
            swingAmplitude: 0.15,
            swingSpeed: 0.02,
            color: '#8B4513',
            ropeColor: '#A0522D',
            width: 100,
            height: 16,
            damageOnNormal: 1,
            damageOnCharge: 2
        },
        fragile: {
            name: '易碎藤编秋千',
            durability: 1,
            swingAmplitude: 0.25,
            swingSpeed: 0.03,
            color: '#DAA520',
            ropeColor: '#F4A460',
            width: 90,
            height: 14,
            damageOnNormal: 1,
            damageOnCharge: 2
        },
        iron: {
            name: '加固铁架秋千',
            durability: 4,
            swingAmplitude: 0.08,
            swingSpeed: 0.015,
            color: '#708090',
            ropeColor: '#4682B4',
            width: 120,
            height: 18,
            damageOnNormal: 1,
            damageOnCharge: 2
        },
        floating: {
            name: '移动悬浮秋千',
            durability: 3,
            swingAmplitude: 0.12,
            swingSpeed: 0.025,
            color: '#9370DB',
            ropeColor: '#BA55D3',
            width: 95,
            height: 15,
            damageOnNormal: 1,
            damageOnCharge: 2,
            moveSpeed: 1.5,
            moveRange: 150
        }
    },
    
    difficultyLevels: {
        easy: {
            name: '简单',
            surviveTime: 30,
            platformCount: 6,
            spawnInterval: 8000,
            types: ['wood', 'fragile']
        },
        normal: {
            name: '普通',
            surviveTime: 45,
            platformCount: 7,
            spawnInterval: 6000,
            types: ['wood', 'fragile', 'iron']
        },
        hard: {
            name: '困难',
            surviveTime: 60,
            platformCount: 8,
            spawnInterval: 4000,
            types: ['wood', 'fragile', 'iron', 'floating']
        }
    },
    
    sceneThemes: {
        sunny: {
            name: '晴空万里',
            skyTop: '#87CEEB',
            skyBottom: '#E0F7FA',
            cloudColor: '#FFFFFF',
            sunColor: '#FFD700'
        },
        sunset: {
            name: '夕阳余晖',
            skyTop: '#FF7F50',
            skyBottom: '#FFE4B5',
            cloudColor: '#FFF8DC',
            sunColor: '#FF4500'
        },
        dusk: {
            name: '暮色降临',
            skyTop: '#483D8B',
            skyBottom: '#9370DB',
            cloudColor: '#E6E6FA',
            sunColor: '#FF6347'
        }
    },
    
    gameStates: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAMEOVER: 'gameover',
        VICTORY: 'victory'
    },
    
    storageKeys: {
        BEST_RECORD: 'qiuqian_best_record',
        GAME_STATE: 'qiuqian_game_state'
    }
};

window.GameConfig = GameConfig;
