const GameConfig = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 500,
    GRAVITY: 0.8,
    FRICTION: 0.85,
    
    GAME_STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        ROUND_TRANSITION: 'round_transition',
        GAME_OVER: 'game_over',
        VICTORY: 'victory'
    },
    
    CHARACTER_STATES: {
        IDLE: 'idle',
        WALKING: 'walking',
        JUMPING: 'jumping',
        PUNCHING: 'punching',
        KICKING: 'kicking',
        SPECIAL: 'special',
        BLOCKING: 'blocking',
        HURT: 'hurt',
        GRABBING: 'grabbing',
        DEAD: 'dead'
    },
    
    ATTACK_TYPES: {
        LIGHT_PUNCH: {
            name: 'light_punch',
            damage: 5,
            hitstun: 200,
            energyGain: 5,
            duration: 200,
            range: 60,
            knockback: 5,
            canBlock: true
        },
        HEAVY_PUNCH: {
            name: 'heavy_punch',
            damage: 12,
            hitstun: 400,
            energyGain: 10,
            duration: 400,
            range: 70,
            knockback: 15,
            canBlock: true
        },
        LIGHT_KICK: {
            name: 'light_kick',
            damage: 6,
            hitstun: 200,
            energyGain: 5,
            duration: 250,
            range: 80,
            knockback: 8,
            canBlock: true
        },
        HEAVY_KICK: {
            name: 'heavy_kick',
            damage: 14,
            hitstun: 500,
            energyGain: 12,
            duration: 500,
            range: 90,
            knockback: 20,
            canBlock: false
        },
        JUMP_ATTACK: {
            name: 'jump_attack',
            damage: 10,
            hitstun: 300,
            energyGain: 8,
            duration: 300,
            range: 70,
            knockback: 10,
            canBlock: true
        },
        GRAB: {
            name: 'grab',
            damage: 15,
            hitstun: 600,
            energyGain: 15,
            duration: 600,
            range: 40,
            knockback: 25,
            canBlock: false
        },
        SPECIAL: {
            name: 'special',
            damage: 30,
            hitstun: 800,
            energyGain: 0,
            energyCost: 100,
            duration: 800,
            range: 120,
            knockback: 40,
            canBlock: false,
            invincible: true
        }
    },
    
    COMBO_SEQUENCES: {
        'light_punch,light_punch,light_punch': {
            name: '三连击',
            damageMultiplier: 1.5,
            bonusDamage: 5
        },
        'light_punch,light_punch,heavy_punch': {
            name: '重击终结',
            damageMultiplier: 1.8,
            bonusDamage: 8
        },
        'light_kick,light_kick,heavy_kick': {
            name: '飞踢连击',
            damageMultiplier: 1.6,
            bonusDamage: 10
        }
    },
    
    COMBO_TIMEOUT: 600,
    
    PLAYER_CONFIG: {
        name: '比利',
        maxHealth: 100,
        maxEnergy: 100,
        moveSpeed: 5,
        jumpForce: 15,
        width: 50,
        height: 100,
        color: '#4488ff',
        secondaryColor: '#2266dd'
    },
    
    OPPONENTS: [
        {
            id: 'thug',
            name: '街头混混',
            maxHealth: 80,
            maxEnergy: 100,
            attackPower: 8,
            moveSpeed: 4,
            jumpForce: 12,
            width: 50,
            height: 95,
            color: '#88ff44',
            secondaryColor: '#44aa22',
            aiStyle: 'basic',
            aggression: 0.6,
            defenseChance: 0.2,
            comboChance: 0.3
        },
        {
            id: 'kungfu',
            name: '功夫高手',
            maxHealth: 90,
            maxEnergy: 100,
            attackPower: 10,
            moveSpeed: 5,
            jumpForce: 14,
            width: 48,
            height: 98,
            color: '#ff8844',
            secondaryColor: '#dd6622',
            aiStyle: 'combo',
            aggression: 0.7,
            defenseChance: 0.3,
            comboChance: 0.6
        },
        {
            id: 'brute',
            name: '壮汉',
            maxHealth: 120,
            maxEnergy: 100,
            attackPower: 15,
            moveSpeed: 3,
            jumpForce: 10,
            width: 65,
            height: 110,
            color: '#ff4488',
            secondaryColor: '#cc2266',
            aiStyle: 'heavy',
            aggression: 0.5,
            defenseChance: 0.15,
            comboChance: 0.2
        },
        {
            id: 'ninja',
            name: '女忍者',
            maxHealth: 85,
            maxEnergy: 100,
            attackPower: 11,
            moveSpeed: 6,
            jumpForce: 16,
            width: 45,
            height: 92,
            color: '#aa44ff',
            secondaryColor: '#7722cc',
            aiStyle: 'fast',
            aggression: 0.8,
            defenseChance: 0.4,
            comboChance: 0.5,
            dodgeChance: 0.3
        },
        {
            id: 'boss',
            name: '阿波波',
            maxHealth: 150,
            maxEnergy: 100,
            attackPower: 18,
            moveSpeed: 4,
            jumpForce: 12,
            width: 70,
            height: 120,
            color: '#ff2222',
            secondaryColor: '#cc0000',
            aiStyle: 'boss',
            aggression: 0.85,
            defenseChance: 0.35,
            comboChance: 0.5,
            specialChance: 0.4
        }
    ],
    
    AI_BEHAVIORS: {
        ATTACK_RANGE: 100,
        RETREAT_DISTANCE: 150,
        REACTION_TIME: 300,
        ATTACK_COOLDOWN: 800
    },
    
    COLORS: {
        BACKGROUND: '#1a0000',
        GROUND: '#3d2817',
        GROUND_LINE: '#5c3a21',
        HEALTH_BAR_BG: '#330000',
        HEALTH_BAR_FILL: '#ff2222',
        HEALTH_BAR_DELAY: '#ffaa00',
        ENERGY_BAR_BG: '#001133',
        ENERGY_BAR_FILL: '#4488ff',
        ENERGY_BAR_FULL: '#00ffff',
        TEXT: '#ffffff',
        TEXT_SHADOW: '#000000'
    },
    
    STORAGE_KEYS: {
        HIGH_SCORE: 'leitai02_high_score',
        SAVE_STATE: 'leitai02_save_state'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
