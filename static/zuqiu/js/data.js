const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 500,
    GAME_DURATION: 90,
    PLAYER_SIZE: 30,
    BALL_SIZE: 15,
    GOAL_WIDTH: 100,
    GOAL_HEIGHT: 60,
    PLAYER_SPEED_BASE: 5,
    PLAYER_SPEED_MAX: 8,
    PLAYER_SPEED_LEVEL_UP: 0.5,
    SHOT_ACCURACY_BASE: 60,
    SHOT_ACCURACY_MAX: 85,
    SHOT_ACCURACY_LEVEL_UP: 5,
    STAMINA_MAX: 100,
    STAMINA_SPRINT_DRAIN: 0.5,
    STAMINA_REGEN: 0.2,
    FIRE_SHOT_BONUS: 30,
    FIRE_SHOT_STAMINA_COST: 50,
    POWER_MAX: 100,
    POWER_INC_RATE: 2,
    WEATHER_SUNNY: 'sunny',
    WEATHER_RAINY: 'rainy',
    RAIN_CONTROL_PENALTY: 0.7,
    AI_TYPE_DEFENSIVE: 'defensive',
    AI_TYPE_OFFENSIVE: 'offensive',
    ITEM_SPEED_BOOTS: 'speed_boots',
    ITEM_GOLDEN_BALL: 'golden_ball',
    ITEM_DROP_CHANCE: 0.02,
    COINS_PER_GOAL: 10,
    COINS_PER_WIN: 50,
};

const DEFAULT_PLAYER = {
    x: 200,
    y: 250,
    vx: 0,
    vy: 0,
    speed: GAME_CONFIG.PLAYER_SPEED_BASE,
    speedLevel: 1,
    shotAccuracy: GAME_CONFIG.SHOT_ACCURACY_BASE,
    accuracyLevel: 1,
    stamina: GAME_CONFIG.STAMINA_MAX,
    maxStamina: GAME_CONFIG.STAMINA_MAX,
    hasBall: false,
    direction: 1,
    isSprinting: false,
    isCharging: false,
    chargePower: 0,
    fireShotReady: false,
};

const DEFAULT_ENEMY = {
    x: 600,
    y: 250,
    vx: 0,
    vy: 0,
    speed: 4,
    stamina: GAME_CONFIG.STAMINA_MAX,
    maxStamina: GAME_CONFIG.STAMINA_MAX,
    hasBall: false,
    direction: -1,
    aiType: GAME_CONFIG.AI_TYPE_DEFENSIVE,
    aiState: 'idle',
    aiTarget: null,
    aiCooldown: 0,
};

const DEFAULT_BALL = {
    x: 400,
    y: 250,
    vx: 0,
    vy: 0,
    owner: null,
    isMoving: false,
    speed: 0,
    expression: '😊',
};

const DEFAULT_ITEMS = {
    speedBoots: 0,
    goldenBall: 0,
    coins: 0,
};

const DROPPED_ITEMS = [];

const GAME_STATE = {
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    currentTime: GAME_CONFIG.GAME_DURATION,
    playerScore: 0,
    enemyScore: 0,
    weather: GAME_CONFIG.WEATHER_SUNNY,
    goalScored: false,
    celebrationTime: 0,
    fireShotActive: false,
    fireShotParticles: [],
};

const KEYS = {
    w: false,
    a: false,
    s: false,
    d: false,
    j: false,
    k: false,
    shift: false,
};

const FIELD = {
    left: 50,
    right: 750,
    top: 50,
    bottom: 450,
    centerX: 400,
    centerY: 250,
};

const GOALS = {
    left: {
        x: 50,
        y: 220,
        width: 10,
        height: 60,
    },
    right: {
        x: 740,
        y: 220,
        width: 10,
        height: 60,
    },
};

let player = { ...DEFAULT_PLAYER };
let enemy = { ...DEFAULT_ENEMY };
let ball = { ...DEFAULT_BALL };
let items = { ...DEFAULT_ITEMS };
let particles = [];
let rainDrops = [];

const STORAGE_KEY = 'mengxing_football_save';
