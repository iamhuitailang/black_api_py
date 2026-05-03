const CONSTANTS = {
    STORAGE_KEY: 'memory_game_save',
    
    DIFFICULTY: {
        EASY: 4,
        HARD: 6
    },
    
    GAME_MODE: {
        SINGLE: 'single',
        DOUBLE: 'double'
    },
    
    CARD_TYPE: {
        NORMAL: 'normal',
        SHUFFLE: 'shuffle',
        PEEK: 'peek',
        FREEZE: 'freeze',
        TRAP: 'trap'
    },
    
    CARD_STATE: {
        FACE_DOWN: 'face_down',
        FACE_UP: 'face_up',
        MATCHED: 'matched',
        PEEKING: 'peeking'
    },
    
    GAME_STATE: {
        MENU: 'menu',
        PREVIEW: 'preview',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over',
        PEEKING: 'peeking'
    },
    
    PREVIEW: {
        DURATION: 3000,
        COUNTDOWN_INTERVAL: 1000
    },
    
    COLORS: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8B739', '#52B788',
        '#FF8A5B', '#EA4335', '#4285F4', '#34A853',
        '#FBBC04', '#9C27B0', '#00BCD4', '#8BC34A',
        '#FF5722', '#E91E63', '#673AB7', '#009688',
        '#FFC107', '#2196F3', '#F44336', '#CDDC39',
        '#FF9800', '#9E9E9E', '#607D8B', '#03A9F4'
    ],
    
    SHAPES: [
        'circle', 'square', 'triangle', 'diamond',
        'star', 'heart', 'hexagon', 'pentagon',
        'octagon', 'cross', 'moon', 'sun'
    ],
    
    SPECIAL_CARD_EMOJIS: {
        shuffle: '🔄',
        peek: '👁️',
        freeze: '⏳',
        trap: '❌'
    },
    
    SPECIAL_CARD_NAMES: {
        shuffle: '洗牌',
        peek: '窥视',
        freeze: '时间冻结',
        trap: '陷阱'
    },
    
    ANIMATION: {
        FLIP_DURATION: 300,
        MATCH_DELAY: 500,
        NO_MATCH_DELAY: 1000
    },
    
    DEFAULT_CONFIG: {
        gridSize: 4,
        gameMode: 'single',
        timeLimit: 30,
        enableSpecialCards: true
    }
};
