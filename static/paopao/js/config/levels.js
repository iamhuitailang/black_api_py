const LEVELS = [
    {
        level: 1,
        name: '初入云端',
        targetScore: 1000,
        rows: 5,
        colors: 4,
        specialBubbleChance: 0.05,
        rowsToAdd: 0,
        addRowEvery: 0
    },
    {
        level: 2,
        name: '彩虹泡泡',
        targetScore: 2000,
        rows: 6,
        colors: 5,
        specialBubbleChance: 0.08,
        rowsToAdd: 1,
        addRowEvery: 8
    },
    {
        level: 3,
        name: '星光闪耀',
        targetScore: 3500,
        rows: 7,
        colors: 5,
        specialBubbleChance: 0.1,
        rowsToAdd: 1,
        addRowEvery: 7
    },
    {
        level: 4,
        name: '梦幻天空',
        targetScore: 5000,
        rows: 8,
        colors: 6,
        specialBubbleChance: 0.12,
        rowsToAdd: 2,
        addRowEvery: 6
    },
    {
        level: 5,
        name: '云端漫步',
        targetScore: 7000,
        rows: 9,
        colors: 6,
        specialBubbleChance: 0.15,
        rowsToAdd: 2,
        addRowEvery: 5
    },
    {
        level: 6,
        name: '彩虹桥',
        targetScore: 9500,
        rows: 10,
        colors: 6,
        specialBubbleChance: 0.18,
        rowsToAdd: 2,
        addRowEvery: 5
    },
    {
        level: 7,
        name: '星空泡泡',
        targetScore: 12500,
        rows: 11,
        colors: 6,
        specialBubbleChance: 0.2,
        rowsToAdd: 3,
        addRowEvery: 4
    },
    {
        level: 8,
        name: '梦幻城堡',
        targetScore: 16000,
        rows: 12,
        colors: 6,
        specialBubbleChance: 0.22,
        rowsToAdd: 3,
        addRowEvery: 4
    },
    {
        level: 9,
        name: '云端之巅',
        targetScore: 20000,
        rows: 13,
        colors: 6,
        specialBubbleChance: 0.25,
        rowsToAdd: 3,
        addRowEvery: 3
    },
    {
        level: 10,
        name: '终极挑战',
        targetScore: 25000,
        rows: 14,
        colors: 6,
        specialBubbleChance: 0.3,
        rowsToAdd: 4,
        addRowEvery: 3
    }
];

function getLevelConfig(levelNumber) {
    const index = Math.min(levelNumber - 1, LEVELS.length - 1);
    return LEVELS[index];
}

function generateLevelBubbles(levelConfig) {
    const bubbles = [];
    const colors = BUBBLE_COLORS.slice(0, levelConfig.colors);
    
    for (let row = 0; row < levelConfig.rows; row++) {
        const cols = row % 2 === 0 ? CONSTANTS.GRID_COLS : CONSTANTS.GRID_COLS - 1;
        for (let col = 0; col < cols; col++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            let type = 'normal';
            
            if (Math.random() < levelConfig.specialBubbleChance) {
                type = ['bomb', 'chain', 'fire', 'explosion', 'pierce', 'rapid'][Math.floor(Math.random() * 6)];
            }
            
            bubbles.push({
                row,
                col,
                color,
                type
            });
        }
    }
    
    return bubbles;
}

function getMaxLevel() {
    return LEVELS.length;
}
