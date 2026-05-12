const CONFIG = {
    STORAGE_KEY: 'hollow_knight_abyss_save',
    
    PLAYER: {
        INITIAL_HEALTH: 5,
        MAX_HEALTH: 9,
        INITIAL_SOUL: 0,
        MAX_SOUL: 100,
        INITIAL_ATTACK: 10,
        MAX_ATTACK: 20,
        INITIAL_SPEED: 5,
        MAX_SPEED: 7,
        INITIAL_JUMP: 13.5,
        MAX_JUMP: 16,
        WIDTH: 30,
        HEIGHT: 50,
        GRAVITY: 0.45,
        ATTACK_RANGE: 60,
        ATTACK_COOLDOWN: 300,
        DASH_COOLDOWN: 400,
        DASH_DISTANCE: 180,
        DASH_DURATION: 180,
        SPELL_COST: 30,
        SPELL_DAMAGE: 25,
        SPELL_RANGE: 200,
        INVINCIBLE_DURATION: 1000
    },
    
    ABILITIES: {
        NAIL: { id: 'nail', name: '骨钉攻击', icon: '🗡️', unlocked: true },
        SPELL: { id: 'spell', name: '灵魂法术', icon: '🎯', unlocked: false },
        DASH: { id: 'dash', name: '冲刺', icon: '💨', unlocked: false },
        WALL_CLIMB: { id: 'wallClimb', name: '爬墙', icon: '🧗', unlocked: false },
        SHADOW_DASH: { id: 'shadowDash', name: '暗影冲刺', icon: '🪄', unlocked: false }
    },
    
    ENEMIES: {
        BEETLE: {
            id: 'beetle',
            name: '小甲虫',
            health: 10,
            damage: 5,
            speed: 2,
            width: 35,
            height: 25,
            essence: 5,
            behavior: 'patrol'
        },
        MOTH: {
            id: 'moth',
            name: '飞蛾',
            health: 8,
            damage: 6,
            speed: 1.5,
            width: 30,
            height: 30,
            essence: 5,
            behavior: 'float'
        },
        SHELL: {
            id: 'shell',
            name: '甲壳虫',
            health: 25,
            damage: 10,
            speed: 4,
            width: 45,
            height: 35,
            essence: 10,
            behavior: 'charge'
        },
        SPIDER: {
            id: 'spider',
            name: '蜘蛛',
            health: 15,
            damage: 8,
            speed: 3,
            width: 40,
            height: 30,
            essence: 8,
            behavior: 'wallJump'
        }
    },
    
    BOSSES: {
        BEE_QUEEN: {
            id: 'beeQueen',
            name: '蜂巢女王',
            phases: [
                { health: 80, attacks: ['summon', 'stab'] },
                { health: 60, attacks: ['charge', 'shockwave'] }
            ],
            damage: 15,
            width: 80,
            height: 80,
            essence: 100
        },
        SCORPION: {
            id: 'scorpion',
            name: '蝎尾巨兽',
            phases: [
                { health: 150, attacks: ['sting', 'venom'] }
            ],
            damage: 20,
            width: 100,
            height: 90,
            essence: 200
        }
    },
    
    COLORS: {
        BACKGROUND: '#0a0510',
        BACKGROUND_LIGHT: '#150a20',
        PLATFORM: '#2a153a',
        PLATFORM_LIGHT: '#3a2050',
        PLAYER: '#e0d0f0',
        PLAYER_SHADOW: '#100818',
        ENEMY: '#804060',
        ENEMY_LIGHT: '#a05080',
        PARTICLE: '#c080ff',
        PARTICLE_DARK: '#402060',
        ATTACK: '#ffffff',
        SPELL: '#40a0ff',
        DASH: '#8040c0',
        HEALTH: '#ff4060',
        SOUL: '#40a0ff',
        ESSENCE: '#ffe060',
        WALL: '#1a0d28'
    }
};