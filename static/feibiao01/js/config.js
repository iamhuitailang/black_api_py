const GameConfig = {
    STORAGE_KEY: 'feibiao_game_state',
    HIGH_SCORE_KEY: 'feibiao_high_score',
    
    GameMode: {
        STANDARD: 'standard',
        TIMED: 'timed'
    },
    
    GameState: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over',
        DART_READY: 'dart_ready',
        DART_POWERING: 'dart_powering',
        DART_FLYING: 'dart_flying',
        DART_LANDED: 'dart_landed'
    },
    
    GameRules: {
        STANDARD_ROUNDS: 3,
        TIMED_DURATION: 30
    },
    
    TargetRings: [
        { score: 50, name: 'bullseye', color: '#ff3333', radius: 0.05, isBullseye: true },
        { score: 10, name: 'ring10', color: '#ffd700', radius: 0.10 },
        { score: 9, name: 'ring9', color: '#3399ff', radius: 0.20 },
        { score: 8, name: 'ring8', color: '#1a1a1a', radius: 0.30 },
        { score: 7, name: 'ring7', color: '#ffffff', radius: 0.40 },
        { score: 6, name: 'ring6', color: '#87ceeb', radius: 0.50 }
    ],
    
    Miss: {
        score: 0,
        name: 'miss',
        color: '#666666'
    },
    
    Dart: {
        width: 30,
        height: 50,
        tipColor: '#c0c0c0',
        shaftColor: '#333333',
        flightColor: '#ff6b6b',
        maxPullDistance: 200,
        baseSpeed: 15,
        maxSpeedMultiplier: 2.5,
        gravity: 0.15,
        rotationSpeed: 0.2
    },
    
    Effects: {
        PERFECT: {
            text: 'PERFECT!',
            color: '#ffd700',
            glowColor: 'rgba(255, 215, 0, 0.8)',
            shakeIntensity: 10,
            shakeDuration: 500
        },
        GREAT: {
            text: 'GREAT!',
            color: '#ffff00',
            glowColor: 'rgba(255, 255, 0, 0.6)',
            shakeIntensity: 5,
            shakeDuration: 300
        },
        GOOD: {
            text: '',
            color: '#ffffff',
            glowColor: 'rgba(255, 255, 255, 0.4)',
            shakeIntensity: 0,
            shakeDuration: 0
        },
        MISS: {
            text: 'MISS...',
            color: '#666666',
            glowColor: 'rgba(102, 102, 102, 0.3)',
            shakeIntensity: 0,
            shakeDuration: 0
        },
        NEW_RECORD: {
            fireworkCount: 50,
            confettiCount: 100,
            duration: 3000
        }
    },
    
    Canvas: {
        backgroundColor: '#1a1a2e',
        targetBackgroundColor: '#f5f5f5',
        targetBorderColor: '#333333',
        targetBorderWidth: 5
    }
};

if (typeof window !== 'undefined') {
    window.GameConfig = GameConfig;
}
