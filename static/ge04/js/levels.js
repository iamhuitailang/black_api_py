const LEVELS = {
    1: {
        name: "初识糖果",
        candy: { x: 240, y: 100 },
        monster: { x: 240, y: 500 },
        anchors: [{ x: 240, y: 50 }],
        ropes: [
            { start: 0, end: { x: 240, y: 100 } }
        ],
        stars: [
            { x: 240, y: 200 },
            { x: 180, y: 300 },
            { x: 300, y: 300 }
        ],
        bubbles: [],
        magnets: [],
        spiderwebs: [],
        balloons: []
    },
    2: {
        name: "气泡助力",
        candy: { x: 150, y: 100 },
        monster: { x: 350, y: 500 },
        anchors: [{ x: 150, y: 50 }],
        ropes: [
            { start: 0, end: { x: 150, y: 100 } }
        ],
        stars: [
            { x: 200, y: 250 },
            { x: 300, y: 350 },
            { x: 350, y: 450 }
        ],
        bubbles: [
            { x: 200, y: 300 }
        ],
        magnets: [],
        spiderwebs: [],
        balloons: []
    },
    3: {
        name: "磁铁吸引",
        candy: { x: 120, y: 150 },
        monster: { x: 380, y: 500 },
        anchors: [{ x: 120, y: 80 }, { x: 240, y: 80 }],
        ropes: [
            { start: 0, end: { x: 120, y: 150 } },
            { start: 1, end: { x: 120, y: 150 } }
        ],
        stars: [
            { x: 200, y: 250 },
            { x: 300, y: 300 },
            { x: 350, y: 400 }
        ],
        bubbles: [],
        magnets: [
            { x: 300, y: 250 }
        ],
        spiderwebs: [],
        balloons: []
    },
    4: {
        name: "蜘蛛网减速",
        candy: { x: 240, y: 80 },
        monster: { x: 240, y: 550 },
        anchors: [{ x: 240, y: 30 }],
        ropes: [
            { start: 0, end: { x: 240, y: 80 } }
        ],
        stars: [
            { x: 180, y: 200 },
            { x: 240, y: 350 },
            { x: 300, y: 450 }
        ],
        bubbles: [],
        magnets: [],
        spiderwebs: [
            { x: 240, y: 300 }
        ],
        balloons: []
    },
    5: {
        name: "气球上升",
        candy: { x: 240, y: 450 },
        monster: { x: 240, y: 100 },
        anchors: [{ x: 240, y: 500 }],
        ropes: [
            { start: 0, end: { x: 240, y: 450 } }
        ],
        stars: [
            { x: 180, y: 350 },
            { x: 240, y: 250 },
            { x: 300, y: 150 }
        ],
        bubbles: [],
        magnets: [],
        spiderwebs: [],
        balloons: [
            { x: 240, y: 400 }
        ]
    },
    6: {
        name: "综合挑战",
        candy: { x: 100, y: 150 },
        monster: { x: 380, y: 480 },
        anchors: [{ x: 100, y: 80 }, { x: 200, y: 80 }],
        ropes: [
            { start: 0, end: { x: 100, y: 150 } },
            { start: 1, end: { x: 100, y: 150 } }
        ],
        stars: [
            { x: 150, y: 280 },
            { x: 280, y: 350 },
            { x: 350, y: 420 }
        ],
        bubbles: [
            { x: 180, y: 320 }
        ],
        magnets: [
            { x: 320, y: 300 }
        ],
        spiderwebs: [
            { x: 250, y: 400 }
        ],
        balloons: []
    }
};

class LevelManager {
    static getLevel(levelNumber) {
        return LEVELS[levelNumber] || LEVELS[1];
    }

    static getTotalLevels() {
        return Object.keys(LEVELS).length;
    }

    static createLevelObjects(levelData) {
        const objects = {
            anchors: levelData.anchors.map(a => new AnchorPoint(a.x, a.y)),
            ropes: [],
            stars: levelData.stars.map(s => new Star(s.x, s.y)),
            bubbles: levelData.bubbles.map(b => new Bubble(b.x, b.y)),
            magnets: levelData.magnets.map(m => new Magnet(m.x, m.y)),
            spiderwebs: levelData.spiderwebs.map(s => new Spiderweb(s.x, s.y)),
            balloons: levelData.balloons.map(b => new Balloon(b.x, b.y))
        };

        levelData.ropes.forEach((ropeData, index) => {
            const startAnchor = objects.anchors[ropeData.start];
            objects.ropes.push(new Rope(
                startAnchor.position.x,
                startAnchor.position.y,
                ropeData.end.x,
                ropeData.end.y
            ));
        });

        return objects;
    }

    static serializeGameState(game) {
        return {
            level: game.currentLevel,
            candy: game.candy.serialize(),
            monster: game.monster.serialize(),
            stars: game.stars.map(s => s.serialize()),
            bubbles: game.bubbles.map(b => b.serialize()),
            magnets: game.magnets.map(m => m.serialize()),
            spiderwebs: game.spiderwebs.map(s => s.serialize()),
            balloons: game.balloons.map(b => b.serialize()),
            ropes: game.ropes.map(r => ({
                cut: r.cut,
                cutIndex: r.cutIndex,
                wasCut: r.wasCut,
                segments: r.segments.map(s => ({
                    angle: s.angle,
                    angularVelocity: s.angularVelocity,
                    anchorX: s.anchor.x,
                    anchorY: s.anchor.y
                }))
            })),
            isPaused: game.isPaused,
            isGameOver: game.isGameOver,
            isWin: game.isWin
        };
    }

    static deserializeGameState(data, canvasWidth, canvasHeight) {
        const levelData = LevelManager.getLevel(data.level);
        const objects = LevelManager.createLevelObjects(levelData);

        if (data.ropes) {
            data.ropes.forEach((ropeData, index) => {
                if (objects.ropes[index]) {
                    objects.ropes[index].cut = ropeData.cut;
                    objects.ropes[index].cutIndex = ropeData.cutIndex;
                    objects.ropes[index].wasCut = ropeData.wasCut || ropeData.cut;
                    ropeData.segments.forEach((segData, segIndex) => {
                        if (objects.ropes[index].segments[segIndex]) {
                            objects.ropes[index].segments[segIndex].angle = segData.angle;
                            objects.ropes[index].segments[segIndex].angularVelocity = segData.angularVelocity;
                            if (segData.anchorX !== undefined) {
                                objects.ropes[index].segments[segIndex].anchor.x = segData.anchorX;
                                objects.ropes[index].segments[segIndex].anchor.y = segData.anchorY;
                            }
                        }
                    });
                    if (objects.ropes[index].cut && !objects.ropes[index].wasCut) {
                        objects.ropes[index].wasCut = true;
                    }
                }
            });
        }

        return {
            candy: Candy.deserialize(data.candy),
            monster: Monster.deserialize(data.monster),
            stars: data.stars.map(s => Star.deserialize(s)),
            bubbles: data.bubbles.map(b => Bubble.deserialize(b)),
            magnets: data.magnets.map(m => Magnet.deserialize(m)),
            spiderwebs: data.spiderwebs.map(s => Spiderweb.deserialize(s)),
            balloons: data.balloons.map(b => Balloon.deserialize(b)),
            ropes: objects.ropes,
            anchors: objects.anchors
        };
    }
}