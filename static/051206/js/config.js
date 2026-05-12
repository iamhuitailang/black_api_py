export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 480;
export const TILE_SIZE = 32;
export const GRAVITY = 0.5;
export const FRICTION = 0.8;
export const GAME_TIME = 300;

export const COLORS = {
    sky: '#5c94fc',
    ground: '#c84c0c',
    groundTop: '#e09050',
    brick: '#c84c0c',
    question: '#fc9838',
    questionUsed: '#804000',
    pipe: '#00a800',
    pipeDark: '#008000',
    mario: '#e52521',
    marioSkin: '#ffa07a',
    goomba: '#8b4513',
    koopa: '#228b22',
    koopaShell: '#00ff00',
    piranha: '#ff0000',
    mushroom: '#ff0000',
    flower: '#ff69b4',
    star: '#ffff00',
    coin: '#ffd700',
    flag: '#00ff00',
    flagPole: '#c0c0c0'
};

export const MARIO_STATES = {
    SMALL: 'small',
    BIG: 'big',
    FIRE: 'fire'
};

export const ENEMY_TYPES = {
    GOOMBA: 'goomba',
    KOOPA_GREEN: 'koopa_green',
    KOOPA_RED: 'koopa_red',
    PIRANHA: 'piranha'
};

export const ITEM_TYPES = {
    MUSHROOM: 'mushroom',
    FLOWER: 'flower',
    STAR: 'star',
    COIN: 'coin',
    ONEUP: 'oneup'
};

export const BLOCK_TYPES = {
    GROUND: 'ground',
    BRICK: 'brick',
    QUESTION: 'question',
    PIPE: 'pipe',
    FLAG: 'flag'
};

export const KEYS = {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    UP: ['ArrowUp', 'KeyW', 'Space'],
    DOWN: ['ArrowDown', 'KeyS'],
    FIRE: ['KeyX', 'KeyZ']
};

export const SCORES = {
    COIN: 100,
    GOOMBA: 100,
    KOOPA: 200,
    PIRANHA: 200,
    MUSHROOM: 1000,
    FLOWER: 1000,
    STAR: 1000,
    ONEUP: 0,
    FLAG_BASE: 1000
};

export const ANIMATION_FRAMES = {
    WALK: 2,
    JUMP: 1,
    IDLE: 1,
    COIN: 4,
    STAR: 4,
    PIRANHA: 2
};

export const STORAGE_KEY = 'super_mario_save';

export const DEFAULT_GAME_STATE = {
    score: 0,
    coins: 0,
    lives: 3,
    time: GAME_TIME,
    level: '1-1',
    marioState: MARIO_STATES.SMALL,
    isInvincible: false,
    invincibleTime: 0,
    isStarPower: false,
    starPowerTime: 0,
    cameraX: 0,
    marioX: 50,
    marioY: 300,
    marioVX: 0,
    marioVY: 0,
    facingRight: true,
    isDead: false,
    levelComplete: false,
    blocks: [],
    enemies: [],
    items: [],
    particles: [],
    collectedCoins: [],
    usedBlocks: [],
    defeatedEnemies: []
};