const GameData = {
    characters: {
        ryu: {
            name: '隆',
            type: '均衡型',
            maxHealth: 100,
            attack: 12,
            defense: 5,
            speed: 5,
            specialDamage: 25,
            color: '#3498db',
            secondaryColor: '#FFD700',
            moves: ['hadouken', 'shoryuken', 'tatsumaki']
        },
        ken: {
            name: '肯',
            type: '攻击型',
            maxHealth: 95,
            attack: 15,
            defense: 4,
            speed: 5,
            specialDamage: 30,
            color: '#e74c3c',
            secondaryColor: '#FFD700',
            moves: ['hadouken', 'shoryuken', 'tatsumaki']
        },
        chunli: {
            name: '春丽',
            type: '速度型',
            maxHealth: 90,
            attack: 11,
            defense: 6,
            speed: 8,
            specialDamage: 24,
            color: '#2ecc71',
            secondaryColor: '#FFD700',
            moves: ['hyakuretsukyaku', 'kikouken', 'tatsumaki']
        }
    },

    attacks: {
        lightPunch: {
            name: '轻拳',
            damage: 8,
            startup: 50,
            recovery: 150,
            range: 60,
            type: 'punch'
        },
        heavyPunch: {
            name: '重拳',
            damage: 14,
            startup: 120,
            recovery: 250,
            range: 80,
            type: 'punch'
        },
        lightKick: {
            name: '轻脚',
            damage: 7,
            startup: 70,
            recovery: 180,
            range: 80,
            type: 'kick'
        },
        heavyKick: {
            name: '重脚',
            damage: 15,
            startup: 150,
            recovery: 280,
            range: 100,
            type: 'kick'
        },
        hadouken: {
            name: '波动拳',
            damage: 16,
            startup: 150,
            recovery: 250,
            range: 500,
            type: 'projectile',
            speed: 9
        },
        shoryuken: {
            name: '升龙拳',
            damage: 28,
            startup: 80,
            recovery: 450,
            range: 110,
            type: 'special',
            invincible: true
        },
        tatsumaki: {
            name: '旋风腿',
            damage: 22,
            startup: 100,
            recovery: 380,
            range: 90,
            type: 'special',
            hits: 3
        },
        hyakuretsukyaku: {
            name: '百裂脚',
            damage: 24,
            startup: 60,
            recovery: 320,
            range: 75,
            type: 'special',
            hits: 5
        },
        kikouken: {
            name: '气功掌',
            damage: 20,
            startup: 160,
            recovery: 260,
            range: 450,
            type: 'projectile',
            speed: 8
        }
    },

    states: {
        IDLE: 'idle',
        WALK_FORWARD: 'walk_forward',
        WALK_BACKWARD: 'walk_backward',
        CROUCH: 'crouch',
        JUMP: 'jump',
        ATTACK: 'attack',
        HIT: 'hit',
        BLOCK: 'block',
        SPECIAL: 'special',
        KNOCKDOWN: 'knockdown'
    },

    gameStates: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    },

    aiStates: {
        IDLE: 'idle',
        APPROACH: 'approach',
        ATTACK: 'attack',
        DEFEND: 'defend',
        RETREAT: 'retreat'
    }
};