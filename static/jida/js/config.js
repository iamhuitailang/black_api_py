const GameConfig = {
    // 游戏模式配置
    MODES: {
        KEYS_4: 4,
        KEYS_6: 6
    },
    
    // 按键映射
    KEY_MAPS: {
        4: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
        6: ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL']
    },
    
    // 轨道颜色
    LANE_COLORS: {
        4: [
            'rgba(255, 0, 128, 0.6)',
            'rgba(0, 255, 255, 0.6)',
            'rgba(255, 255, 0, 0.6)',
            'rgba(128, 0, 255, 0.6)'
        ],
        6: [
            'rgba(255, 0, 0, 0.6)',
            'rgba(255, 128, 0, 0.6)',
            'rgba(255, 255, 0, 0.6)',
            'rgba(0, 255, 128, 0.6)',
            'rgba(0, 128, 255, 0.6)',
            'rgba(128, 0, 255, 0.6)'
        ]
    },
    
    // 音符颜色
    NOTE_COLORS: {
        NORMAL: '#00ffff',
        HOLD: '#ff00ff',
        SLIDE: '#ffff00',
        RAPID: '#ff4444'
    },
    
    // 判定配置 (时间单位: 秒)
    JUDGMENT: {
        PERFECT: { range: 0.05, score: 100, name: 'Perfect', color: '#ff00ff' },
        GREAT: { range: 0.1, score: 70, name: 'Great', color: '#00ffff' },
        GOOD: { range: 0.15, score: 30, name: 'Good', color: '#ffff00' },
        MISS: { range: 0.2, score: 0, name: 'Miss', color: '#ff4444' }
    },
    
    // 血条配置
    HEALTH: {
        MAX: 100,
        START: 100,
        GAIN_HIT: 2,
        LOSE_MISS: 10
    },
    
    // 连击倍率
    COMBO_MULTIPLIER: {
        10: 1.1,
        30: 1.2,
        50: 1.3,
        100: 1.5,
        200: 2.0
    },
    
    // 音符速度 (像素/秒)
    NOTE_SPEED: 500,
    
    // 生成间隔 (时间单位: 秒)
    SPAWN_INTERVAL: {
        MIN: 0.4,
        MAX: 1.0
    },
    
    // 无尽模式时间 (秒)
    ENDLESS_TIME: 60,
    
    // 粒子配置
    PARTICLES: {
        COUNT: 20,
        SPEED_MIN: 100,
        SPEED_MAX: 300,
        LIFE: 1.0
    },
    
    // 判定线位置比例 (从底部算起)
    JUDGMENT_LINE_Y: 0.85,
    
    // 轨道宽度比例
    LANE_WIDTH: 0.12,
    
    // 音符半径
    NOTE_RADIUS: 25,
    
    // 长按音符高度比例
    HOLD_HEIGHT: 0.5,
    
    // 滑动音符目标偏移
    SLIDE_OFFSET: 1,
    
    // 连打音符点击次数
    RAPID_COUNT: 3,
    RAPID_TIME: 1000
};

// 游戏状态枚举
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

// 音符类型枚举
const NoteType = {
    NORMAL: 'normal',
    HOLD: 'hold',
    SLIDE: 'slide',
    RAPID: 'rapid'
};
