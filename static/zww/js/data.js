const GAME_CONFIG = {
    INITIAL_TIME: 60,
    TOTAL_DOLLS: 20,
    EMPTY_GRAB_PENALTY: 2,
    CLAW_SPEED_X: 3,
    CLAW_SPEED_Y: 4,
    CLAW_OPEN_ANGLE: 30,
    CLAW_CLOSE_ANGLE: 5,
    DOLL_FALL_SPEED: 3,
    DOLL_CATCH_PROBABILITY: 0.7,
    DOLL_DROP_PROBABILITY: 0.15
};

const DOLL_TYPES = {
    bear: {
        name: '小熊',
        emoji: '🐻',
        score: 10,
        timeBonus: 3,
        weight: 50,
        colors: {
            body: '#D2691E',
            bodyLight: '#DEB887',
            ear: '#8B4513',
            nose: '#654321',
            cheek: '#FFB6C1'
        }
    },
    rabbit: {
        name: '兔子',
        emoji: '🐰',
        score: 10,
        timeBonus: 3,
        weight: 50,
        colors: {
            body: '#FFE4E1',
            bodyLight: '#FFF5EE',
            earInner: '#FFB6C1',
            nose: '#FF69B4',
            cheek: '#FFB6C1'
        }
    },
    dino: {
        name: '恐龙',
        emoji: '🦖',
        score: 20,
        timeBonus: 4,
        weight: 30,
        colors: {
            body: '#90EE90',
            bodyLight: '#98FB98',
            back: '#32CD32',
            belly: '#F0FFF0',
            cheek: '#98FB98'
        }
    },
    octopus: {
        name: '章鱼',
        emoji: '🐙',
        score: 30,
        timeBonus: 5,
        weight: 20,
        colors: {
            body: '#FF69B4',
            bodyLight: '#FFB6C1',
            tentacle: '#FF1493',
            sucker: '#FFF0F5',
            cheek: '#FFB6C1'
        }
    },
    unicorn: {
        name: '独角兽',
        emoji: '🦄',
        score: 40,
        timeBonus: 8,
        weight: 10,
        colors: {
            body: '#E6E6FA',
            bodyLight: '#FFFFFF',
            horn: '#FFD700',
            mane: ['#FF69B4', '#87CEEB', '#98FB98', '#FFD700'],
            cheek: '#FFB6C1'
        }
    }
};

const LIGHT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ENDED: 'ended'
};

const STORAGE_KEY = 'zzl_game_state';

function getTotalWeight() {
    let total = 0;
    for (const config of Object.values(DOLL_TYPES)) {
        total += config.weight;
    }
    return total;
}

function generateRandomDollType() {
    const totalWeight = getTotalWeight();
    let rand = Math.random() * totalWeight;
    
    for (const [type, config] of Object.entries(DOLL_TYPES)) {
        rand -= config.weight;
        if (rand <= 0) {
            return type;
        }
    }
    return 'bear';
}

function generateDolls(count = 20) {
    const dolls = [];
    const rowHeight = 60;
    const colWidth = 50;
    const startX = 40;
    const startY = 200;
    const cols = 6;
    
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const type = generateRandomDollType();
        dolls.push({
            id: i,
            type: type,
            x: startX + col * colWidth + Math.random() * 10 - 5,
            y: startY + row * rowHeight + Math.random() * 10,
            width: 40,
            height: 40,
            caught: false,
            falling: false,
            velocityY: 0,
            rotation: Math.random() * 30 - 15,
            bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 1 + Math.random() * 0.5
        });
    }
    return dolls;
}
