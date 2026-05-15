class Terrain {
    constructor(width, height, type = 'easy') {
        this.width = width;
        this.height = height;
        this.type = type;
        this.segments = [];
        this.decorations = [];
        this.generate();
    }

    generate() {
        this.segments = [];
        this.decorations = [];
        
        const config = this.getTerrainConfig();
        let x = 0;
        let y = this.height * 0.7;
        
        this.addFlatSegment(x, y, 600);
        x += 600;
        
        while (x < this.width + 3000) {
            const segmentType = this.getRandomSegmentType(config);
            const length = this.randomRange(config.segmentLength[0], config.segmentLength[1]);
            
            switch (segmentType) {
                case 'flat':
                    this.addFlatSegment(x, y, length);
                    x += length;
                    y = y + (Math.random() - 0.5) * 10;
                    break;
                    
                case 'up':
                    const upHeight = length * config.steepness * (0.3 + Math.random() * 0.4);
                    this.addSlopeSegment(x, y, length, -upHeight);
                    x += length;
                    y -= upHeight;
                    break;
                    
                case 'down':
                    const downHeight = length * config.steepness * (0.3 + Math.random() * 0.4);
                    this.addSlopeSegment(x, y, length, downHeight);
                    x += length;
                    y += downHeight;
                    break;
                    
                case 'ramp':
                    const jumpHeight = this.randomRange(config.jumpHeight[0], config.jumpHeight[1]);
                    this.addRampSegment(x, y, length * 0.5, jumpHeight);
                    x += length * 0.5;
                    y -= jumpHeight;
                    this.addFlatSegment(x, y, length * 0.3);
                    x += length * 0.3;
                    this.addSlopeSegment(x, y, length * 0.2, jumpHeight * 0.7);
                    x += length * 0.2;
                    y += jumpHeight * 0.7;
                    break;
            }
            
            y = Math.max(100, Math.min(this.height - 50, y));
        }
        
        this.generateDecorations();
    }

    addFlatSegment(startX, startY, length) {
        const randTerrain = Math.random();
        let friction = CONFIG.TERRAIN_TYPES.ground.friction;
        let color = CONFIG.TERRAIN_TYPES.ground.color;
        
        if (randTerrain < 0.2) {
            color = CONFIG.TERRAIN_TYPES.grass.color;
            friction = CONFIG.TERRAIN_TYPES.grass.friction;
        } else if (randTerrain < 0.3) {
            color = CONFIG.TERRAIN_TYPES.asphalt.color;
            friction = CONFIG.TERRAIN_TYPES.asphalt.friction;
        }
        
        this.segments.push({
            start: new Vector2(startX, startY),
            end: new Vector2(startX + length, startY),
            type: 'flat',
            friction: friction,
            color: color
        });
    }

    addSlopeSegment(startX, startY, length, heightChange) {
        this.segments.push({
            start: new Vector2(startX, startY),
            end: new Vector2(startX + length, startY + heightChange),
            type: 'slope',
            friction: CONFIG.TERRAIN_TYPES.ground.friction,
            color: CONFIG.TERRAIN_TYPES.ground.color
        });
    }

    addRampSegment(startX, startY, length, height) {
        this.segments.push({
            start: new Vector2(startX, startY),
            end: new Vector2(startX + length, startY - height),
            type: 'ramp',
            friction: CONFIG.TERRAIN_TYPES.ramp.friction,
            color: CONFIG.TERRAIN_TYPES.ramp.color
        });
    }

    getTerrainConfig() {
        const configs = {
            easy: {
                rampChance: 0.05,
                steepness: 0.15,
                segmentLength: [150, 300],
                jumpHeight: [40, 80]
            },
            medium: {
                rampChance: 0.1,
                steepness: 0.2,
                segmentLength: [120, 250],
                jumpHeight: [50, 100]
            },
            hard: {
                rampChance: 0.15,
                steepness: 0.25,
                segmentLength: [100, 200],
                jumpHeight: [60, 120]
            }
        };
        return configs[this.type] || configs.easy;
    }

    getRandomSegmentType(config) {
        const rand = Math.random();
        if (rand < config.rampChance) return 'ramp';
        if (rand < config.rampChance + 0.15) return 'up';
        if (rand < config.rampChance + 0.3) return 'down';
        return 'flat';
    }

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    getHeightAt(x) {
        for (const segment of this.segments) {
            if (x >= segment.start.x && x <= segment.end.x) {
                const t = (x - segment.start.x) / (segment.end.x - segment.start.x);
                return segment.start.y + t * (segment.end.y - segment.start.y);
            }
        }
        return this.height * 0.7;
    }

    extendIfNeeded(cameraX) {
        const lastSegment = this.segments[this.segments.length - 1];
        if (lastSegment && lastSegment.end.x < cameraX + this.width + 1000) {
            const config = this.getTerrainConfig();
            let x = lastSegment.end.x;
            let y = lastSegment.end.y;
            
            while (x < cameraX + this.width + 2000) {
                const segmentType = this.getRandomSegmentType(config);
                const length = this.randomRange(config.segmentLength[0], config.segmentLength[1]);
                
                if (segmentType === 'flat') {
                    this.addFlatSegment(x, y, length);
                    x += length;
                } else if (segmentType === 'up' || segmentType === 'down') {
                    const heightChange = length * config.steepness * (0.3 + Math.random() * 0.4);
                    this.addSlopeSegment(x, y, length, segmentType === 'up' ? -heightChange : heightChange);
                    x += length;
                    y += segmentType === 'up' ? -heightChange : heightChange;
                }
                
                y = Math.max(100, Math.min(this.height - 50, y));
            }
        }
    }

    generateDecorations() {
        for (let i = 0; i < 20; i++) {
            const segment = this.segments[Math.floor(Math.random() * this.segments.length)];
            const t = Math.random();
            const x = segment.start.x + t * (segment.end.x - segment.start.x);
            const y = segment.start.y + t * (segment.end.y - segment.start.y);
            
            if (Math.random() < 0.5) {
                this.decorations.push({
                    type: 'tree',
                    x: x,
                    y: y,
                    size: 20 + Math.random() * 20
                });
            } else {
                this.decorations.push({
                    type: 'rock',
                    x: x,
                    y: y,
                    size: 10 + Math.random() * 15
                });
            }
        }
    }

    getState() {
        return {
            type: this.type,
            width: this.width,
            height: this.height,
            segments: this.segments.map(s => ({
                start: { x: s.start.x, y: s.start.y },
                end: { x: s.end.x, y: s.end.y },
                type: s.type,
                friction: s.friction,
                color: s.color
            })),
            decorations: this.decorations
        };
    }

    restoreState(state) {
        this.type = state.type;
        this.width = state.width;
        this.height = state.height;
        this.segments = state.segments.map(s => ({
            start: new Vector2(s.start.x, s.start.y),
            end: new Vector2(s.end.x, s.end.y),
            type: s.type,
            friction: s.friction,
            color: s.color
        }));
        this.decorations = state.decorations;
    }
}