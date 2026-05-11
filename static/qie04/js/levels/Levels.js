export const Levels = {
    1: {
        name: '初次滑冰',
        holes: [
            { x: 400, y: 300, radius: 35 }
        ],
        spikes: [],
        speedBoosts: [],
        slowZones: [],
        portals: [],
        rotatingIces: [],
        checkpoints: [],
        items: [
            { x: 300, y: 200, type: 'claw', radius: 20 }
        ],
        start: { x: 200, y: 300 },
        goal: { x: 700, y: 300, radius: 40 },
        minPushes: 1,
        maxPushes: 2
    },
    2: {
        name: '冰洞迷宫',
        holes: [
            { x: 250, y: 250, radius: 30 },
            { x: 450, y: 350, radius: 35 }
        ],
        spikes: [],
        speedBoosts: [],
        slowZones: [],
        portals: [],
        rotatingIces: [],
        checkpoints: [
            { x: 400, y: 300 }
        ],
        items: [
            { x: 200, y: 150, type: 'shield', radius: 20 }
        ],
        start: { x: 100, y: 150 },
        goal: { x: 700, y: 450, radius: 40 },
        minPushes: 2,
        maxPushes: 3
    },
    3: {
        name: '加速冲刺',
        holes: [
            { x: 350, y: 150, radius: 30 },
            { x: 550, y: 400, radius: 35 }
        ],
        spikes: [],
        speedBoosts: [
            { x: 250, y: 280, width: 100, height: 40 }
        ],
        slowZones: [],
        portals: [],
        rotatingIces: [],
        checkpoints: [],
        items: [
            { x: 500, y: 200, type: 'rocket', radius: 20 }
        ],
        start: { x: 100, y: 300 },
        goal: { x: 700, y: 300, radius: 40 },
        minPushes: 2,
        maxPushes: 3
    },
    4: {
        name: '传送之旅',
        holes: [
            { x: 300, y: 150, radius: 30 },
            { x: 300, y: 450, radius: 30 },
            { x: 600, y: 300, radius: 35 }
        ],
        spikes: [],
        speedBoosts: [],
        slowZones: [],
        portals: [
            { x1: 200, y1: 300, x2: 500, y2: 300, radius: 30 }
        ],
        rotatingIces: [],
        checkpoints: [],
        items: [
            { x: 400, y: 200, type: 'magnet', radius: 20 }
        ],
        start: { x: 100, y: 300 },
        goal: { x: 700, y: 300, radius: 40 },
        minPushes: 3,
        maxPushes: 5
    },
    5: {
        name: '旋转世界',
        holes: [
            { x: 250, y: 200, radius: 30 },
            { x: 550, y: 400, radius: 35 },
            { x: 350, y: 350, radius: 28 }
        ],
        spikes: [],
        speedBoosts: [
            { x: 600, y: 150, width: 100, height: 40 }
        ],
        slowZones: [],
        portals: [],
        rotatingIces: [
            { x: 350, y: 150, width: 120, height: 120, speed: 1.5 }
        ],
        checkpoints: [
            { x: 450, y: 300 }
        ],
        items: [
            { x: 200, y: 400, type: 'claw', radius: 20 },
            { x: 600, y: 300, type: 'shield', radius: 20 }
        ],
        start: { x: 100, y: 300 },
        goal: { x: 700, y: 300, radius: 40 },
        minPushes: 3,
        maxPushes: 5
    },
    6: {
        name: '冰刺陷阱',
        holes: [
            { x: 300, y: 150, radius: 30 },
            { x: 500, y: 450, radius: 32 }
        ],
        spikes: [
            { x: 400, y: 300, radius: 25 },
            { x: 550, y: 200, radius: 25 }
        ],
        speedBoosts: [],
        slowZones: [
            { x: 250, y: 350, width: 100, height: 80 }
        ],
        portals: [],
        rotatingIces: [],
        checkpoints: [],
        items: [
            { x: 200, y: 250, type: 'shield', radius: 20 },
            { x: 600, y: 350, type: 'rocket', radius: 20 }
        ],
        start: { x: 100, y: 300 },
        goal: { x: 700, y: 300, radius: 40 },
        minPushes: 3,
        maxPushes: 5
    },
    7: {
        name: '终极挑战',
        holes: [
            { x: 200, y: 150, radius: 28 },
            { x: 400, y: 300, radius: 35 },
            { x: 600, y: 450, radius: 30 },
            { x: 350, y: 450, radius: 25 },
            { x: 550, y: 150, radius: 28 }
        ],
        spikes: [
            { x: 300, y: 350, radius: 22 },
            { x: 500, y: 250, radius: 22 }
        ],
        speedBoosts: [
            { x: 150, y: 380, width: 80, height: 40 },
            { x: 550, y: 320, width: 80, height: 40 }
        ],
        slowZones: [
            { x: 400, y: 100, width: 100, height: 60 }
        ],
        portals: [
            { x1: 250, y1: 250, x2: 650, y2: 200, radius: 28 }
        ],
        rotatingIces: [
            { x: 480, y: 380, width: 100, height: 100, speed: 2 }
        ],
        checkpoints: [
            { x: 400, y: 150 }
        ],
        items: [
            { x: 200, y: 450, type: 'magnet', radius: 20 },
            { x: 350, y: 200, type: 'claw', radius: 20 },
            { x: 600, y: 400, type: 'shield', radius: 20 },
            { x: 150, y: 200, type: 'rocket', radius: 20 }
        ],
        start: { x: 100, y: 300 },
        goal: { x: 700, y: 300, radius: 40 },
        minPushes: 5,
        maxPushes: 10
    }
};

export const getLevel = (levelNum) => {
    const num = Math.min(levelNum, Object.keys(Levels).length);
    return JSON.parse(JSON.stringify(Levels[num]));
};

export const getMaxLevel = () => {
    return Object.keys(Levels).length;
};

export const generateProceduralLevel = (levelNum) => {
    const maxLevel = getMaxLevel();
    if (levelNum <= maxLevel) {
        return getLevel(levelNum);
    }
    
    const baseLevel = getLevel(maxLevel);
    const difficulty = (levelNum - maxLevel) * 0.5 + 1;
    
    const numHoles = Math.floor(5 + difficulty * 2);
    const numSpikes = Math.floor(2 + difficulty);
    
    const holes = [];
    for (let i = 0; i < numHoles; i++) {
        let x, y, valid;
        do {
            x = 150 + Math.random() * 500;
            y = 100 + Math.random() * 400;
            valid = true;
            for (const h of holes) {
                const dist = Math.sqrt((x - h.x) ** 2 + (y - h.y) ** 2);
                if (dist < 80) valid = false;
            }
            const startDist = Math.sqrt((x - baseLevel.start.x) ** 2 + (y - baseLevel.start.y) ** 2);
            const goalDist = Math.sqrt((x - baseLevel.goal.x) ** 2 + (y - baseLevel.goal.y) ** 2);
            if (startDist < 100 || goalDist < 100) valid = false;
        } while (!valid);
        holes.push({ x, y, radius: 25 + Math.random() * 15 });
    }
    
    const spikes = [];
    for (let i = 0; i < numSpikes; i++) {
        let x, y, valid;
        do {
            x = 150 + Math.random() * 500;
            y = 100 + Math.random() * 400;
            valid = true;
            for (const s of spikes) {
                const dist = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);
                if (dist < 80) valid = false;
            }
            for (const h of holes) {
                const dist = Math.sqrt((x - h.x) ** 2 + (y - h.y) ** 2);
                if (dist < 60) valid = false;
            }
            const startDist = Math.sqrt((x - baseLevel.start.x) ** 2 + (y - baseLevel.start.y) ** 2);
            const goalDist = Math.sqrt((x - baseLevel.goal.x) ** 2 + (y - baseLevel.goal.y) ** 2);
            if (startDist < 100 || goalDist < 100) valid = false;
        } while (!valid);
        spikes.push({ x, y, radius: 22 });
    }
    
    const items = [];
    const itemTypes = ['magnet', 'claw', 'shield', 'rocket'];
    for (let i = 0; i < 4; i++) {
        let x, y, valid;
        do {
            x = 150 + Math.random() * 500;
            y = 100 + Math.random() * 400;
            valid = true;
            for (const h of holes) {
                const dist = Math.sqrt((x - h.x) ** 2 + (y - h.y) ** 2);
                if (dist < 50) valid = false;
            }
        } while (!valid);
        items.push({ x, y, type: itemTypes[i], radius: 20 });
    }
    
    return {
        ...baseLevel,
        holes,
        spikes,
        items,
        checkpoints: [
            { x: 400, y: 300 }
        ],
        minPushes: 5,
        maxPushes: 10 + Math.floor(difficulty * 3)
    };
};
