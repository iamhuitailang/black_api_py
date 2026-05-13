export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;
export const TILE_SIZE = 50;

export const LEVELS = [
    {
        id: 1,
        name: "新手入门",
        startPos: { x: 75, y: 75 },
        endPos: { x: 525, y: 425 },
        walls: [
            { x: 0, y: 0, w: 600, h: 20 },
            { x: 0, y: 480, w: 600, h: 20 },
            { x: 0, y: 0, w: 20, h: 500 },
            { x: 580, y: 0, w: 20, h: 500 },
            { x: 150, y: 100, w: 20, h: 200 },
            { x: 300, y: 200, w: 20, h: 200 },
            { x: 400, y: 100, w: 20, h: 150 },
        ],
        stars: [
            { x: 250, y: 150 },
            { x: 450, y: 300 },
            { x: 150, y: 400 },
        ],
        traps: [
            { x: 350, y: 200, w: 40, h: 40 },
        ],
    },
    {
        id: 2,
        name: "曲折前进",
        startPos: { x: 75, y: 75 },
        endPos: { x: 525, y: 425 },
        walls: [
            { x: 0, y: 0, w: 600, h: 20 },
            { x: 0, y: 480, w: 600, h: 20 },
            { x: 0, y: 0, w: 20, h: 500 },
            { x: 580, y: 0, w: 20, h: 500 },
            { x: 100, y: 100, w: 200, h: 20 },
            { x: 300, y: 150, w: 20, h: 200 },
            { x: 200, y: 250, w: 200, h: 20 },
            { x: 100, y: 350, w: 200, h: 20 },
            { x: 450, y: 200, w: 20, h: 200 },
        ],
        stars: [
            { x: 150, y: 200 },
            { x: 350, y: 200 },
            { x: 250, y: 400 },
            { x: 500, y: 300 },
        ],
        traps: [
            { x: 200, y: 150, w: 40, h: 40 },
            { x: 400, y: 350, w: 40, h: 40 },
        ],
    },
    {
        id: 3,
        name: "迷宫挑战",
        startPos: { x: 75, y: 75 },
        endPos: { x: 525, y: 425 },
        walls: [
            { x: 0, y: 0, w: 600, h: 20 },
            { x: 0, y: 480, w: 600, h: 20 },
            { x: 0, y: 0, w: 20, h: 500 },
            { x: 580, y: 0, w: 20, h: 500 },
            { x: 100, y: 80, w: 20, h: 150 },
            { x: 100, y: 200, w: 150, h: 20 },
            { x: 200, y: 100, w: 20, h: 120 },
            { x: 250, y: 150, w: 150, h: 20 },
            { x: 350, y: 80, w: 20, h: 100 },
            { x: 300, y: 250, w: 20, h: 150 },
            { x: 150, y: 300, w: 150, h: 20 },
            { x: 100, y: 380, w: 200, h: 20 },
            { x: 400, y: 350, w: 20, h: 130 },
            { x: 450, y: 200, w: 20, h: 150 },
            { x: 450, y: 200, w: 100, h: 20 },
        ],
        stars: [
            { x: 180, y: 150 },
            { x: 300, y: 120 },
            { x: 480, y: 150 },
            { x: 250, y: 420 },
            { x: 520, y: 300 },
        ],
        traps: [
            { x: 150, y: 250, w: 40, h: 40 },
            { x: 350, y: 300, w: 40, h: 40 },
            { x: 500, y: 120, w: 40, h: 40 },
        ],
    },
];

export const getLevel = (levelId) => {
    return LEVELS.find(l => l.id === levelId);
};

export const getTotalLevels = () => {
    return LEVELS.length;
};
