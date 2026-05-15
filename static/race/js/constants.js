const GAME_CONSTANTS = {
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 800,
    
    TRACK_WIDTH: 360,
    TRACK_LEFT: 60,
    TRACK_RIGHT: 420,
    
    BOAT_WIDTH: 50,
    BOAT_HEIGHT: 80,
    
    BASE_SPEED: 5,
    MAX_SPEED: 15,
    MIN_SPEED: 2,
    
    TRACK_LENGTH: 5000,
    
    OBSTACLE_TYPES: {
        NORMAL: 'normal',
        SPEED_UP: 'speedUp',
        SLOW_DOWN: 'slowDown',
        BUOY: 'buoy',
        ROCK: 'rock'
    },
    
    POWERUP_TYPES: {
        NITRO: 'nitro',
        SHIELD: 'shield',
        MAGNET: 'magnet',
        SLOW_OTHER: 'slowOther'
    },
    
    POWERUP_EFFECTS: {
        nitro: { multiplier: 1.5, duration: 3000, icon: '💨', score: 50 },
        shield: { duration: 5000, icon: '🛡️' },
        magnet: { duration: 5000, icon: '🧲' },
        slowOther: { duration: 3000, icon: '🐢' }
    },
    
    DIFFICULTY: {
        easy: { speedMultiplier: 0.7, mistakeRate: 0.3, name: '简单' },
        medium: { speedMultiplier: 0.9, mistakeRate: 0.15, name: '中等' },
        hard: { speedMultiplier: 1.1, mistakeRate: 0.05, name: '困难' }
    },
    
    COLORS: {
        water: ['#0066aa', '#0077bb', '#0088cc'],
        waterDark: '#005588',
        trackBorder: '#ffffff',
        speedUp: '#ffd700',
        slowDown: '#ff4444',
        buoy: '#ffffff',
        rock: '#666666',
        boatBody: '#ff4444',
        boatAccent: '#ffffff',
        audience: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181']
    }
};