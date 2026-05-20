const LevelSystem = {
    levels: [],
    
    init() {
        this.levels = this.generateLevels();
    },
    
    generateLevels() {
        return [
            {
                id: 1,
                name: '初入云端',
                width: 3000,
                height: 800,
                startX: 100,
                startY: 300,
                endX: 2800,
                endY: 400,
                swings: this.generateSwings(1),
                obstacles: this.generateObstacles(1),
                islands: this.generateIslands(1)
            },
            {
                id: 2,
                name: '云海穿梭',
                width: 4000,
                height: 900,
                startX: 100,
                startY: 350,
                endX: 3800,
                endY: 450,
                swings: this.generateSwings(2),
                obstacles: this.generateObstacles(2),
                islands: this.generateIslands(2)
            },
            {
                id: 3,
                name: '仙境之巅',
                width: 5000,
                height: 1000,
                startX: 100,
                startY: 400,
                endX: 4800,
                endY: 500,
                swings: this.generateSwings(3),
                obstacles: this.generateObstacles(3),
                islands: this.generateIslands(3)
            }
        ];
    },
    
    generateSwings(levelId) {
        const swings = [];
        const count = 5;
        const startX = 200;
        const spacing = 160;
        
        for (let i = 0; i < count; i++) {
            const x = startX + i * spacing;
            const y = 70;
            swings.push({
                id: i,
                pivotX: x,
                pivotY: y,
                ropeLength: 90,
                angle: 0.5,
                angularVelocity: 0.06,
                isStart: i === 0,
                isEnd: i === count - 1
            });
        }
        
        return swings;
    },
    
    generateObstacles(levelId) {
        const obstacles = [];
        const cloudCount = 3 + levelId * 2;
        const ropeCount = 1 + levelId;
        const windCount = 2 + levelId;
        
        for (let i = 0; i < cloudCount; i++) {
            obstacles.push({
                type: OBSTACLE_TYPE.CLOUD,
                x: 600 + i * 500 + Math.random() * 200,
                y: 200 + Math.random() * 300,
                radius: 50 + Math.random() * 30,
                vx: -0.3 - Math.random() * 0.3
            });
        }
        
        for (let i = 0; i < ropeCount; i++) {
            const x = 1000 + i * 800;
            obstacles.push({
                type: OBSTACLE_TYPE.ROPE,
                x1: x,
                y1: 100,
                x2: x + 50,
                y2: 500
            });
        }
        
        for (let i = 0; i < windCount; i++) {
            obstacles.push({
                type: OBSTACLE_TYPE.WIND,
                x: 800 + i * 700,
                y: 150 + Math.random() * 200,
                width: 200,
                height: 150,
                forceX: (Math.random() - 0.5) * 0.5,
                forceY: (Math.random() - 0.5) * 0.3,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        return obstacles;
    },
    
    generateIslands(levelId) {
        const islands = [];
        const count = 3 + levelId;
        
        for (let i = 0; i < count; i++) {
            islands.push({
                x: 200 + i * 600 + Math.random() * 200,
                y: 500 + Math.random() * 100,
                width: 150 + Math.random() * 100,
                height: 60 + Math.random() * 40
            });
        }
        
        return islands;
    },
    
    getLevel(levelId) {
        return this.levels.find(l => l.id === levelId) || this.levels[0];
    },
    
    getTotalLevels() {
        return this.levels.length;
    },
    
    updateObstacles(obstacles, dt) {
        obstacles.forEach(obs => {
            if (obs.type === OBSTACLE_TYPE.CLOUD) {
                obs.x += obs.vx;
                if (obs.x < -100) obs.x = 5000;
            }
            if (obs.type === OBSTACLE_TYPE.WIND) {
                obs.phase += 0.02;
            }
        });
    }
};
