import { OBSTACLE_TYPES, OBSTACLE_CONFIG, TRACK_LENGTH, TRACK_WIDTH } from './config.js';

export class Track {
    constructor() {
        this.length = TRACK_LENGTH;
        this.width = TRACK_WIDTH;
        this.obstacles = [];
        this.curves = [];
        this.decorations = [];
        this.generateTrack();
    }

    generateTrack() {
        this.generateObstacles();
        this.generateCurves();
        this.generateDecorations();
    }

    generateObstacles() {
        this.obstacles = [];
        const obstacleTypes = Object.values(OBSTACLE_TYPES);
        const numObstacles = Math.floor(TRACK_LENGTH / 800);
        
        let lastPosition = 500;
        for (let i = 0; i < numObstacles; i++) {
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            const config = OBSTACLE_CONFIG[type];
            const position = lastPosition + 300 + Math.random() * 500;
            
            if (position > TRACK_LENGTH - 500) break;
            
            this.obstacles.push({
                type,
                position,
                width: config.width,
                ...config
            });
            
            lastPosition = position + config.width;
        }
    }

    generateCurves() {
        this.curves = [];
        let currentCurve = 0;
        const segmentLength = 500;
        
        for (let pos = 0; pos < TRACK_LENGTH; pos += segmentLength) {
            const curveAmount = (Math.random() - 0.5) * 60;
            currentCurve += curveAmount;
            currentCurve = Math.max(-80, Math.min(80, currentCurve));
            
            this.curves.push({
                start: pos,
                end: pos + segmentLength,
                curve: currentCurve
            });
        }
    }

    generateDecorations() {
        this.decorations = [];
        
        for (let pos = 0; pos < TRACK_LENGTH; pos += 50 + Math.random() * 100) {
            const side = Math.random() > 0.5 ? 'left' : 'right';
            const distanceFromTrack = 50 + Math.random() * 100;
            const type = Math.random();
            
            this.decorations.push({
                position: pos,
                side,
                distanceFromTrack,
                type: type < 0.3 ? 'tree' : type < 0.6 ? 'flower' : type < 0.8 ? 'wheat' : 'rock'
            });
        }
    }

    getObstacleAt(distance) {
        for (const obstacle of this.obstacles) {
            if (distance >= obstacle.position && distance <= obstacle.position + obstacle.width) {
                return obstacle;
            }
        }
        return null;
    }

    getCurveAt(distance) {
        for (const curve of this.curves) {
            if (distance >= curve.start && distance < curve.end) {
                const t = (distance - curve.start) / (curve.end - curve.start);
                const nextCurve = this.curves[this.curves.indexOf(curve) + 1];
                const nextCurveValue = nextCurve ? nextCurve.curve : curve.curve;
                return curve.curve + (nextCurveValue - curve.curve) * t;
            }
        }
        return 0;
    }

    getCenterOffset(distance) {
        return this.getCurveAt(distance);
    }

    checkCollision(rider) {
        const obstacle = this.getObstacleAt(rider.distance);
        if (!obstacle) return null;
        
        if (obstacle.type === OBSTACLE_TYPES.BLOCK) {
            if (Math.abs(rider.lateralPosition) < 50) {
                return obstacle;
            }
        }
        
        return obstacle;
    }

    getObstaclesInRange(startDistance, endDistance) {
        return this.obstacles.filter(obs => 
            obs.position + obs.width >= startDistance && obs.position <= endDistance
        );
    }

    getDecorationsInRange(startDistance, endDistance) {
        return this.decorations.filter(dec => 
            dec.position >= startDistance - 100 && dec.position <= endDistance + 100
        );
    }

    serialize() {
        return {
            obstacles: this.obstacles,
            curves: this.curves,
            decorations: this.decorations
        };
    }

    static deserialize(data) {
        const track = new Track();
        track.obstacles = data.obstacles || [];
        track.curves = data.curves || [];
        track.decorations = data.decorations || [];
        return track;
    }
}
