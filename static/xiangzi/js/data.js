const CELL = {
    FLOOR: 0,
    WALL: 1,
    TARGET: 2,
    BOX: 3,
    PLAYER: 4,
    BOX_ON_TARGET: 5,
    PLAYER_ON_TARGET: 6
};

const LEVELS = [
    {
        id: 1,
        name: "入门教学",
        description: "学会推箱子的基本操作",
        timeLimit: 60,
        map: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 4, 0, 3, 0, 2, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],
        boxCount: 1,
        targetCount: 1
    },
    {
        id: 2,
        name: "双箱协作",
        description: "需要规划推动顺序",
        timeLimit: 50,
        map: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 4, 0, 0, 0, 3, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 2, 3, 0, 1, 0, 0, 2, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        boxCount: 2,
        targetCount: 2
    },
    {
        id: 3,
        name: "三方归位",
        description: "必须按顺序推，否则卡死",
        timeLimit: 40,
        map: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 4, 0, 1, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 2, 0, 3, 0, 1],
            [1, 0, 3, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 2, 3, 0, 2, 1],
            [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        boxCount: 3,
        targetCount: 3
    }
];

const GAME_CONFIG = {
    TILE_SIZE: 60,
    ANIMATION_DURATION: 150,
    STORAGE_KEY: 'push_box_game_data',
    DIRECTIONS: {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    }
};
