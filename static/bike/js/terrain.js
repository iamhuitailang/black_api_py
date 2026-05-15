import { CONFIG } from './config.js';

export class TerrainManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.segments = [];
        this.obstacles = [];
        this.buildings = [];
        this.generateTrack();
    }

    generateTrack() {
        this.segments = [];
        this.obstacles = [];
        this.buildings = [];

        let currentX = 0;
        let currentY = this.height * 0.65;
        
        var trackPattern = [
            { type: 'FLAT', length: 300 },
            { type: 'FLAT', length: 250 },
            { type: 'UPHILL', length: 200 },
            { type: 'FLAT', length: 300 },
            { type: 'DOWNHILL', length: 200 },
            { type: 'JUMP', length: 150 },
            { type: 'FLAT', length: 350 },
            { type: 'STONE', length: 200 },
            { type: 'FLAT', length: 300 },
            { type: 'UPHILL', length: 180 },
            { type: 'FLAT', length: 250 },
            { type: 'DOWNHILL', length: 180 },
            { type: 'JUMP', length: 150 },
            { type: 'FLAT', length: 400 },
            { type: 'FLAT', length: 300 },
            { type: 'STONE', length: 200 },
            { type: 'FLAT', length: 350 },
            { type: 'FLAT', length: 300 }
        ];
        
        for (var i = 0; i < trackPattern.length; i++) {
            var seg = trackPattern[i];
            var segment = this.createSegment(seg.type, currentX, currentY, seg.length);
            this.segments.push(segment);
            
            if (i % 4 === 2 && seg.type !== 'JUMP') {
                this.addObstacle(currentX + seg.length / 2, currentY, seg.type);
            }
            
            if (i % 3 === 1) {
                this.addBuilding(currentX);
            }
            
            currentX += seg.length;
            currentY = segment.points[segment.points.length - 1].y;
        }

        this.addFinishLine(currentX);
    }

    createSegment(type, startX, startY, length) {
        const points = [];
        const steps = Math.ceil(length / 20);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startX + t * length;
            let y = startY;
            
            switch (type) {
                case 'UPHILL':
                    y = startY - t * length * 0.3;
                    break;
                case 'DOWNHILL':
                    y = startY + t * length * 0.3;
                    break;
                case 'JUMP': {
                    const jumpT = Math.sin(t * Math.PI);
                    y = startY - jumpT * 100;
                    break;
                }
                case 'STONE':
                    y = startY + Math.sin(t * Math.PI * 4) * 10;
                    break;
                default:
                    y = startY + Math.sin(t * Math.PI * 2) * 5;
            }
            
            points.push({ x, y });
        }
        
        return {
            type,
            points,
            config: CONFIG.TERRAIN.SEGMENTS[type]
        };
    }

    addObstacle(x, y, type) {
        const obstacleTypes = ['rock', 'log', 'ramp'];
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        this.obstacles.push({
            x,
            y,
            type: obstacleType,
            width: 40 + Math.random() * 30,
            height: 20 + Math.random() * 20
        });
    }

    addBuilding(x) {
        const height = 100 + Math.random() * 200;
        const width = 60 + Math.random() * 80;
        
        this.buildings.push({
            x,
            y: this.height * 0.65 - height,
            width,
            height,
            windows: Math.floor(Math.random() * 5) + 3
        });
    }

    addFinishLine(x) {
        this.finishLine = {
            x,
            width: 20,
            height: 150
        };
    }

    getGroundHeight(x) {
        for (const segment of this.segments) {
            const points = segment.points;
            for (let i = 0; i < points.length - 1; i++) {
                if (x >= points[i].x && x <= points[i + 1].x) {
                    const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
                    return points[i].y + t * (points[i + 1].y - points[i].y);
                }
            }
        }
        return this.height * 0.65;
    }

    getSegmentConfig(x) {
        for (const segment of this.segments) {
            const points = segment.points;
            if (x >= points[0].x && x <= points[points.length - 1].x) {
                return segment.config;
            }
        }
        return CONFIG.TERRAIN.SEGMENTS.FLAT;
    }

    getGroundAngle(x) {
        for (const segment of this.segments) {
            const points = segment.points;
            for (let i = 0; i < points.length - 1; i++) {
                if (x >= points[i].x && x <= points[i + 1].x) {
                    const dx = points[i + 1].x - points[i].x;
                    const dy = points[i + 1].y - points[i].y;
                    return Math.atan2(dy, dx);
                }
            }
        }
        return 0;
    }

    checkObstacleCollision(x, y, width, height) {
        for (const obstacle of this.obstacles) {
            const hitboxScale = 0.5;
            const scaledWidth = obstacle.width * hitboxScale;
            const scaledHeight = obstacle.height * hitboxScale;
            
            if (x + width / 3 > obstacle.x - scaledWidth / 2 &&
                x - width / 3 < obstacle.x + scaledWidth / 2 &&
                y + height > obstacle.y - scaledHeight &&
                y < obstacle.y) {
                return obstacle;
            }
        }
        return null;
    }

    checkFinish(x) {
        return this.finishLine && x >= this.finishLine.x;
    }

    render(ctx, cameraX) {
        this.renderSky(ctx);
        this.renderBackground(ctx, cameraX);
        this.renderBuildings(ctx, cameraX);
        this.renderTerrain(ctx, cameraX);
        this.renderObstacles(ctx, cameraX);
        this.renderFinishLine(ctx, cameraX);
    }

    renderSky(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#E0F6FF');
        gradient.addColorStop(1, '#98D8AA');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 200) % this.width;
            const y = 50 + i * 30;
            this.drawCloud(ctx, x, y, 30 + i * 10);
        }
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    renderBackground(ctx, cameraX) {
        ctx.fillStyle = '#6B8E6B';
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.6);
        for (let x = 0; x <= this.width; x += 50) {
            const worldX = x + cameraX * 0.3;
            const y = this.height * 0.5 + Math.sin(worldX * 0.002) * 30 + Math.sin(worldX * 0.005) * 20;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();
    }

    renderBuildings(ctx, cameraX) {
        for (const building of this.buildings) {
            const screenX = building.x - cameraX * 0.5;
            if (screenX > -building.width && screenX < this.width + building.width) {
                ctx.fillStyle = '#6b7280';
                ctx.fillRect(screenX, building.y, building.width, building.height);
                
                ctx.fillStyle = '#fbbf24';
                const windowSize = 10;
                const windowGap = 15;
                for (let row = 0; row < building.windows; row++) {
                    for (let col = 0; col < 3; col++) {
                        if (Math.random() > 0.3) {
                            ctx.fillRect(
                                screenX + 10 + col * windowGap,
                                building.y + 15 + row * windowGap,
                                windowSize,
                                windowSize
                            );
                        }
                    }
                }
            }
        }
    }

    renderTerrain(ctx, cameraX) {
        for (const segment of this.segments) {
            const points = segment.points;
            const startScreenX = points[0].x - cameraX;
            const endScreenX = points[points.length - 1].x - cameraX;
            
            if (endScreenX < -100 || startScreenX > this.width + 100) continue;

            ctx.beginPath();
            ctx.moveTo(points[0].x - cameraX, this.height);
            
            for (let i = 0; i < points.length; i++) {
                ctx.lineTo(points[i].x - cameraX, points[i].y);
            }
            
            ctx.lineTo(points[points.length - 1].x - cameraX, this.height);
            ctx.closePath();
            
            let groundColor;
            switch (segment.type) {
                case 'UPHILL':
                case 'DOWNHILL':
                    groundColor = '#5D8A5D';
                    break;
                case 'JUMP':
                    groundColor = '#8B7355';
                    break;
                case 'STONE':
                    groundColor = '#808080';
                    break;
                default:
                    groundColor = '#4a7c59';
            }
            ctx.fillStyle = groundColor;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(points[0].x - cameraX, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x - cameraX, points[i].y);
            }
            ctx.strokeStyle = '#3d5a45';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    renderObstacles(ctx, cameraX) {
        for (const obstacle of this.obstacles) {
            const screenX = obstacle.x - cameraX;
            if (screenX < -100 || screenX > this.width + 100) continue;

            ctx.fillStyle = '#8B4513';
            
            if (obstacle.type === 'rock') {
                ctx.beginPath();
                ctx.ellipse(screenX, obstacle.y - obstacle.height / 2, 
                    obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (obstacle.type === 'log') {
                ctx.fillRect(screenX - obstacle.width / 2, obstacle.y - obstacle.height,
                    obstacle.width, obstacle.height);
            } else if (obstacle.type === 'ramp') {
                ctx.beginPath();
                ctx.moveTo(screenX - obstacle.width / 2, obstacle.y);
                ctx.lineTo(screenX + obstacle.width / 2, obstacle.y - obstacle.height);
                ctx.lineTo(screenX + obstacle.width / 2, obstacle.y);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    renderFinishLine(ctx, cameraX) {
        if (!this.finishLine) return;
        
        const screenX = this.finishLine.x - cameraX;
        if (screenX < -100 || screenX > this.width + 100) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX, this.height * 0.65 - 150, 20, 150);
        
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 150; i += 20) {
            ctx.fillRect(screenX, this.height * 0.65 - 150 + i, 10, 10);
            ctx.fillRect(screenX + 10, this.height * 0.65 - 140 + i, 10, 10);
        }

        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('终点', screenX + 10, this.height * 0.65 - 160);
    }
}
