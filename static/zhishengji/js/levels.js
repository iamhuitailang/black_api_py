const LEVELS = {
    1: {
        name: '山峰救援',
        description: '救援悬崖上的登山客',
        timeLimit: 120,
        background: 'mountain',
        helicopter: {
            x: 100,
            y: 200
        },
        safeZone: {
            x: 100,
            y: 500
        },
        targets: [
            { type: 'climber', x: 400, y: 150 },
            { type: 'climber', x: 600, y: 200 },
            { type: 'pet', x: 750, y: 450 }
        ],
        obstacles: [
            { type: 'mountain', x: 300, y: 400, width: 200, height: 300 },
            { type: 'mountain', x: 550, y: 420, width: 150, height: 280 },
            { type: 'mountain', x: 750, y: 380, width: 180, height: 320 }
        ],
        ground: 550
    },
    2: {
        name: '洪水救援',
        description: '救援洪水中的被困者',
        timeLimit: 150,
        background: 'flood',
        helicopter: {
            x: 100,
            y: 200
        },
        safeZone: {
            x: 850,
            y: 400
        },
        targets: [
            { type: 'flood', x: 300, y: 480 },
            { type: 'flood', x: 500, y: 500 },
            { type: 'flood', x: 650, y: 470 },
            { type: 'pet', x: 400, y: 450 }
        ],
        obstacles: [
            { type: 'powerline', x: 200, y: 300, width: 300, height: 10 },
            { type: 'building', x: 450, y: 380, width: 80, height: 170 },
            { type: 'building', x: 600, y: 400, width: 60, height: 150 },
            { type: 'turbulence', x: 350, y: 200, width: 150, height: 150 }
        ],
        ground: 520
    },
    3: {
        name: '火灾救援',
        description: '快速救援火灾中的幸存者',
        timeLimit: 180,
        background: 'fire',
        helicopter: {
            x: 100,
            y: 200
        },
        safeZone: {
            x: 100,
            y: 500
        },
        targets: [
            { type: 'fire', x: 350, y: 200 },
            { type: 'fire', x: 550, y: 180 },
            { type: 'injured', x: 700, y: 250 },
            { type: 'climber', x: 850, y: 300 }
        ],
        obstacles: [
            { type: 'building', x: 300, y: 280, width: 100, height: 300 },
            { type: 'building', x: 500, y: 260, width: 120, height: 320 },
            { type: 'building', x: 650, y: 330, width: 90, height: 250 },
            { type: 'building', x: 800, y: 380, width: 110, height: 200 },
            { type: 'bird', x: 400, y: 100, width: 50, height: 50, moving: true }
        ],
        ground: 550
    },
    4: {
        name: '复杂地形',
        description: '多种地形的综合救援',
        timeLimit: 200,
        background: 'complex',
        helicopter: {
            x: 100,
            y: 200
        },
        safeZone: {
            x: 500,
            y: 500
        },
        targets: [
            { type: 'climber', x: 200, y: 100 },
            { type: 'flood', x: 350, y: 480 },
            { type: 'fire', x: 650, y: 200 },
            { type: 'injured', x: 800, y: 350 },
            { type: 'pet', x: 450, y: 420 }
        ],
        obstacles: [
            { type: 'mountain', x: 150, y: 200, width: 120, height: 400 },
            { type: 'building', x: 600, y: 280, width: 100, height: 300 },
            { type: 'building', x: 750, y: 400, width: 80, height: 180 },
            { type: 'powerline', x: 300, y: 350, width: 250, height: 10 },
            { type: 'turbulence', x: 500, y: 150, width: 100, height: 100 },
            { type: 'bird', x: 700, y: 150, width: 50, height: 50, moving: true }
        ],
        ground: 550
    },
    5: {
        name: '战区救援',
        description: '危险区域的紧急救援',
        timeLimit: 240,
        background: 'war',
        helicopter: {
            x: 100,
            y: 300
        },
        safeZone: {
            x: 900,
            y: 500
        },
        targets: [
            { type: 'injured', x: 250, y: 400 },
            { type: 'injured', x: 450, y: 350 },
            { type: 'fire', x: 600, y: 250 },
            { type: 'climber', x: 750, y: 150 },
            { type: 'pet', x: 350, y: 480 },
            { type: 'flood', x: 550, y: 500 }
        ],
        obstacles: [
            { type: 'building', x: 200, y: 350, width: 80, height: 250 },
            { type: 'building', x: 400, y: 300, width: 100, height: 300 },
            { type: 'building', x: 550, y: 330, width: 90, height: 270 },
            { type: 'building', x: 700, y: 230, width: 110, height: 370 },
            { type: 'enemyFire', x: 300, y: 200, width: 80, height: 80 },
            { type: 'enemyFire', x: 500, y: 150, width: 80, height: 80 },
            { type: 'powerline', x: 150, y: 280, width: 200, height: 10 },
            { type: 'turbulence', x: 650, y: 100, width: 120, height: 120 },
            { type: 'bird', x: 400, y: 120, width: 50, height: 50, moving: true },
            { type: 'bird', x: 600, y: 80, width: 50, height: 50, moving: true }
        ],
        ground: 550
    }
};

class LevelManager {
    static getLevel(levelNum) {
        return LEVELS[levelNum] || LEVELS[1];
    }

    static getTotalLevels() {
        return Object.keys(LEVELS).length;
    }

    static createTargets(levelNum) {
        const level = this.getLevel(levelNum);
        return level.targets.map((target, index) => new RescueTarget({
            ...target,
            id: index,
            levelGround: level.ground
        }));
    }

    static createObstacles(levelNum) {
        const level = this.getLevel(levelNum);
        return level.obstacles.map((obstacle, index) => new Obstacle({
            ...obstacle,
            id: index
        }));
    }
}