const GameConfig = {
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 720,

    PLAYER: {
        WIDTH: 60,
        HEIGHT: 80,
        SPEED: 450,
        INITIAL_HP: 5,
        INVINCIBLE_DURATION: 1500
    },

    GAME: {
        INITIAL_DROP_SPEED: 200,
        MAX_COMBO: 99,
        BASE_SPAWN_INTERVAL: 1200,
        MIN_SPAWN_INTERVAL: 350,
        DIFFICULTY_INCREASE_INTERVAL: 5000,
        SPEED_INCREASE_PER_STAGE: 50,
        SPAWN_DECREASE_PER_STAGE: 150
    },

    ITEM_TYPES: {
        APPLE: {
            name: '苹果',
            score: 10,
            color: '#FF6B6B',
            type: 'benefit',
            size: 36
        },
        KNIFE: {
            name: '水果刀',
            score: 15,
            color: '#4ECDC4',
            type: 'benefit',
            size: 38
        },
        LONG_KNIFE: {
            name: '削皮长刀',
            score: 25,
            color: '#45B7D1',
            type: 'benefit',
            size: 44
        },
        GIFT: {
            name: '保鲜礼盒',
            score: 30,
            color: '#FFD93D',
            type: 'buff',
            size: 42,
            invincible: true
        },
        ROTTEN: {
            name: '烂果子',
            score: -20,
            color: '#8B4513',
            type: 'danger',
            size: 36
        },
        ROCK: {
            name: '石块',
            score: -15,
            color: '#7F8C8D',
            type: 'danger',
            size: 40
        },
        BOTTLE: {
            name: '玻璃瓶',
            score: -25,
            color: '#95A5A6',
            type: 'danger',
            size: 40
        }
    },

    DIFFICULTY_STAGES: [
        { stage: 0, benefitChance: 0.75, buffChance: 0.05, dropSpeed: 200 },
        { stage: 1, benefitChance: 0.65, buffChance: 0.05, dropSpeed: 280 },
        { stage: 2, benefitChance: 0.50, buffChance: 0.04, dropSpeed: 360 },
        { stage: 3, benefitChance: 0.40, buffChance: 0.03, dropSpeed: 450 },
        { stage: 4, benefitChance: 0.30, buffChance: 0.02, dropSpeed: 550 }
    ],

    STORAGE_KEYS: {
        HIGH_SCORE: 'daoju_high_score',
        HIGH_COMBO: 'daoju_high_combo',
        THEME: 'daoju_theme',
        GAME_STATE: 'daoju_game_state'
    },

    THEMES: {
        sunny: {
            name: '晴天草地',
            skyTop: '#87CEEB',
            skyBottom: '#E0F6FF',
            ground: '#90EE90',
            groundDark: '#6B8E23',
            cloud: '#FFFFFF',
            sun: '#FFD700',
            grass: '#228B22'
        },
        sunset: {
            name: '日落黄昏',
            skyTop: '#FF6B6B',
            skyBottom: '#FFE66D',
            ground: '#D4A574',
            groundDark: '#A0522D',
            cloud: '#FFF5E6',
            sun: '#FF4500',
            grass: '#8B7355'
        },
        night: {
            name: '星空夜晚',
            skyTop: '#1A1A2E',
            skyBottom: '#16213E',
            ground: '#2D5A27',
            groundDark: '#1E3A1F',
            cloud: '#4A5568',
            sun: '#F5F5DC',
            grass: '#1E3A1F'
        }
    },

    COLORS: {
        textPrimary: '#333333',
        textSecondary: '#666666',
        white: '#FFFFFF',
        hpBar: '#FF4757',
        hpBarBg: '#2C3E50',
        comboText: '#FF6B6B',
        scoreText: '#2ECC71'
    }
};
