const CONFIG = {
    GAME: {
        GRAVITY: 0.35,
        MAX_CHARGE_TIME: 2000,
        MIN_JUMP_POWER: 10,
        MAX_JUMP_POWER: 16,
        RUN_SPEED: 3,
        AIR_CONTROL: 0.15,
        MAX_POSTURE_CHANGE: 0.5,
        GROUND_Y: 0.82,
        BAR_X: 0.55,
        LANDING_PAD_X: 0.75,
        LANDING_PAD_WIDTH: 0.2,
        PERFECT_MARGIN: 0.05,
        RECORD_HEIGHT: 2.45
    },
    
    MODES: {
        training: { name: '训练模式', opponents: 0, heightStart: 1.70, heightStep: 0.05 },
        school: { name: '校际赛', opponents: 3, heightStart: 1.80, heightStep: 0.05 },
        national: { name: '全国赛', opponents: 6, heightStart: 1.90, heightStep: 0.05 },
        olympic: { name: '奥运决赛', opponents: 8, heightStart: 2.00, heightStep: 0.05 }
    },
    
    OPPONENT_TYPES: [
        { name: '校队选手', bestHeight: 2.05, difficulty: 0.7, color: '#4CAF50' },
        { name: '省级选手', bestHeight: 2.18, difficulty: 0.85, color: '#2196F3' },
        { name: '国家级选手', bestHeight: 2.30, difficulty: 1.0, color: '#FF9800' },
        { name: '奥运冠军', bestHeight: 2.45, difficulty: 1.3, color: '#F44336' }
    ],
    
    WEATHER_TYPES: [
        { name: '晴天', icon: '☀️', effect: 1.0, probability: 0.6, landingStrict: false },
        { name: '逆风', icon: '🌬️', effect: 0.97, probability: 0.2, landingStrict: false },
        { name: '顺风', icon: '💨', effect: 1.03, probability: 0.15, landingStrict: false },
        { name: '雨天', icon: '🌧️', effect: 1.0, probability: 0.05, landingStrict: true }
    ],
    
    SCORE_TABLE: [
        { height: 1.70, base: 150, perfect: 50 },
        { height: 1.80, base: 170, perfect: 50 },
        { height: 1.90, base: 190, perfect: 50 },
        { height: 2.00, base: 200, perfect: 50 },
        { height: 2.10, base: 210, perfect: 50 },
        { height: 2.20, base: 220, perfect: 50 },
        { height: 2.30, base: 230, perfect: 50 },
        { height: 2.40, base: 240, perfect: 50 },
        { height: 2.50, base: 250, perfect: 50 }
    ],
    
    RECORD_BONUS: 100,
    STORAGE_KEY: 'tiaogao_game_state_v2'
};
