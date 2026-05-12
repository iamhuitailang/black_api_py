const LEVELS = [
    {
        id: 1,
        name: '初识草地',
        birds: ['RED', 'RED', 'RED'],
        pigs: [
            { x: 800, y: 600, type: 'BASIC' },
            { x: 900, y: 600, type: 'BASIC' }
        ],
        blocks: [
            { x: 770, y: 560, width: 100, height: 40, type: 'WOOD' }
        ]
    },
    {
        id: 2,
        name: '木塔挑战',
        birds: ['RED', 'RED', 'YELLOW'],
        pigs: [
            { x: 850, y: 600, type: 'BASIC' },
            { x: 850, y: 520, type: 'BASIC' }
        ],
        blocks: [
            { x: 800, y: 560, width: 100, height: 40, type: 'WOOD' },
            { x: 815, y: 520, width: 70, height: 40, type: 'WOOD' },
            { x: 815, y: 480, width: 70, height: 40, type: 'WOOD' }
        ]
    },
    {
        id: 3,
        name: '双塔奇兵',
        birds: ['RED', 'YELLOW', 'YELLOW'],
        pigs: [
            { x: 700, y: 600, type: 'BASIC' },
            { x: 950, y: 600, type: 'BASIC' },
            { x: 700, y: 520, type: 'HELMET' }
        ],
        blocks: [
            { x: 660, y: 560, width: 80, height: 40, type: 'WOOD' },
            { x: 670, y: 520, width: 60, height: 40, type: 'WOOD' },
            { x: 910, y: 560, width: 80, height: 40, type: 'WOOD' }
        ]
    },
    {
        id: 4,
        name: '冰雪初现',
        birds: ['BLUE', 'BLUE', 'RED'],
        pigs: [
            { x: 800, y: 600, type: 'BASIC' },
            { x: 900, y: 600, type: 'BASIC' },
            { x: 850, y: 520, type: 'BASIC' }
        ],
        blocks: [
            { x: 760, y: 560, width: 80, height: 40, type: 'ICE' },
            { x: 860, y: 560, width: 80, height: 40, type: 'ICE' },
            { x: 810, y: 480, width: 80, height: 40, type: 'ICE' }
        ]
    },
    {
        id: 5,
        name: '坚固堡垒',
        birds: ['RED', 'YELLOW', 'BLACK'],
        pigs: [
            { x: 850, y: 600, type: 'BASIC' },
            { x: 850, y: 480, type: 'HELMET' }
        ],
        blocks: [
            { x: 800, y: 560, width: 100, height: 40, type: 'STONE' },
            { x: 810, y: 520, width: 80, height: 40, type: 'WOOD' },
            { x: 810, y: 440, width: 80, height: 40, type: 'STONE' }
        ]
    },
    {
        id: 6,
        name: '国王降临',
        birds: ['RED', 'YELLOW', 'BLACK', 'BLACK'],
        pigs: [
            { x: 850, y: 600, type: 'BASIC' },
            { x: 750, y: 600, type: 'BASIC' },
            { x: 800, y: 450, type: 'KING' }
        ],
        blocks: [
            { x: 720, y: 560, width: 60, height: 40, type: 'STONE' },
            { x: 820, y: 560, width: 60, height: 40, type: 'STONE' },
            { x: 750, y: 520, width: 100, height: 40, type: 'WOOD' },
            { x: 760, y: 410, width: 80, height: 40, type: 'STONE' }
        ]
    },
    {
        id: 7,
        name: '分裂风暴',
        birds: ['BLUE', 'BLUE', 'BLUE', 'RED'],
        pigs: [
            { x: 700, y: 600, type: 'BASIC' },
            { x: 800, y: 600, type: 'BASIC' },
            { x: 900, y: 600, type: 'BASIC' },
            { x: 800, y: 500, type: 'HELMET' }
        ],
        blocks: [
            { x: 670, y: 560, width: 60, height: 40, type: 'ICE' },
            { x: 770, y: 560, width: 60, height: 40, type: 'ICE' },
            { x: 870, y: 560, width: 60, height: 40, type: 'ICE' },
            { x: 760, y: 460, width: 80, height: 40, type: 'WOOD' }
        ]
    },
    {
        id: 8,
        name: '混合攻势',
        birds: ['RED', 'YELLOW', 'BLUE', 'BLACK'],
        pigs: [
            { x: 700, y: 600, type: 'BASIC' },
            { x: 850, y: 600, type: 'HELMET' },
            { x: 950, y: 550, type: 'BASIC' }
        ],
        blocks: [
            { x: 660, y: 560, width: 80, height: 40, type: 'WOOD' },
            { x: 810, y: 560, width: 80, height: 40, type: 'STONE' },
            { x: 910, y: 510, width: 80, height: 40, type: 'ICE' }
        ]
    },
    {
        id: 9,
        name: '蛋从天降',
        birds: ['WHITE', 'WHITE', 'RED', 'YELLOW'],
        pigs: [
            { x: 800, y: 600, type: 'BASIC' },
            { x: 900, y: 600, type: 'BASIC' },
            { x: 850, y: 400, type: 'KING' }
        ],
        blocks: [
            { x: 760, y: 560, width: 80, height: 40, type: 'WOOD' },
            { x: 860, y: 560, width: 80, height: 40, type: 'WOOD' },
            { x: 780, y: 520, width: 40, height: 80, type: 'STONE' },
            { x: 880, y: 520, width: 40, height: 80, type: 'STONE' },
            { x: 800, y: 440, width: 100, height: 40, type: 'STONE' }
        ]
    },
    {
        id: 10,
        name: '终极挑战',
        birds: ['RED', 'YELLOW', 'BLUE', 'BLACK', 'WHITE'],
        pigs: [
            { x: 700, y: 600, type: 'BASIC' },
            { x: 800, y: 600, type: 'HELMET' },
            { x: 900, y: 600, type: 'BASIC' },
            { x: 800, y: 450, type: 'KING' },
            { x: 1000, y: 550, type: 'HELMET' }
        ],
        blocks: [
            { x: 660, y: 560, width: 80, height: 40, type: 'WOOD' },
            { x: 760, y: 560, width: 80, height: 40, type: 'STONE' },
            { x: 860, y: 560, width: 80, height: 40, type: 'ICE' },
            { x: 960, y: 510, width: 80, height: 40, type: 'STONE' },
            { x: 750, y: 480, width: 100, height: 40, type: 'WOOD' },
            { x: 760, y: 400, width: 80, height: 40, type: 'STONE' }
        ]
    }
];

class LevelManager {
    constructor() {
        this.levels = LEVELS;
        this.currentLevel = 1;
    }

    getLevel(id) {
        return this.levels.find(l => l.id === id);
    }

    getTotalLevels() {
        return this.levels.length;
    }

    getCurrentLevelData() {
        return this.getLevel(this.currentLevel);
    }

    nextLevel() {
        if (this.currentLevel < this.getTotalLevels()) {
            this.currentLevel++;
            return true;
        }
        return false;
    }

    setLevel(id) {
        if (id >= 1 && id <= this.getTotalLevels()) {
            this.currentLevel = id;
            return true;
        }
        return false;
    }
}

const levelManager = new LevelManager();
