import { CANVAS_WIDTH, CANVAS_HEIGHT, TRACK_WIDTH, TRACK_LENGTH, COLORS, SPEED_STATES } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;
        
        this.leaves = [];
        this.initLeaves();
    }

    initLeaves() {
        for (let i = 0; i < 20; i++) {
            this.leaves.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 5 + Math.random() * 10,
                speedX: 0.5 + Math.random() * 1,
                speedY: 0.3 + Math.random() * 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05
            });
        }
    }

    render(gameState) {
        const { track, player, aiRiders, itemManager, cameraY } = gameState;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground(cameraY);
        this.drawLeaves();
        
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height - 150);
        
        this.drawTrack(track, cameraY, player);
        this.drawDecorations(track, cameraY);
        this.drawObstacles(track, cameraY);
        this.drawItems(itemManager, cameraY, track);
        this.drawTraps(itemManager, cameraY, track);
        
        const allRiders = [player, ...aiRiders];
        allRiders.sort((a, b) => a.distance - b.distance);
        
        for (const rider of allRiders) {
            this.drawRider(rider, cameraY, track);
        }
        
        this.drawExplosions(itemManager, cameraY, track);
        this.drawFinishLine(cameraY, track);
        
        this.ctx.restore();
    }

    drawBackground(cameraY) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const cloudX = ((i * 300 + cameraY * 0.02) % (this.width + 200)) - 100;
            const cloudY = 50 + i * 40;
            this.drawCloud(cloudX, cloudY);
        }
    }

    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y - 10, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 60, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y + 5, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawLeaves() {
        for (const leaf of this.leaves) {
            leaf.x += leaf.speedX;
            leaf.y += leaf.speedY;
            leaf.rotation += leaf.rotationSpeed;
            
            if (leaf.x > this.width + 20) leaf.x = -20;
            if (leaf.y > this.height + 20) leaf.y = -20;
            
            this.ctx.save();
            this.ctx.translate(leaf.x, leaf.y);
            this.ctx.rotate(leaf.rotation);
            this.ctx.fillStyle = '#90EE90';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, leaf.size, leaf.size / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawTrack(track, cameraY, player) {
        const trackLength = TRACK_LENGTH;
        const viewDistance = 600;
        
        for (let z = viewDistance; z > 0; z -= 10) {
            const distance = cameraY - z;
            if (distance < 0) continue;
            
            const scale = 400 / (z + 200);
            const curveOffset = track.getCurveAt(distance) * scale;
            
            const trackWidth = TRACK_WIDTH * scale;
            const y = -z * scale;
            
            const progress = distance / trackLength;
            const roadColor = this.getRoadColor(progress);
            
            this.ctx.fillStyle = roadColor;
            this.ctx.fillRect(-trackWidth / 2 + curveOffset, y, trackWidth, 12 * scale);
            
            this.ctx.strokeStyle = COLORS.ROAD_EDGE;
            this.ctx.lineWidth = 3 * scale;
            this.ctx.beginPath();
            this.ctx.moveTo(-trackWidth / 2 + curveOffset, y);
            this.ctx.lineTo(-trackWidth / 2 + curveOffset, y + 12 * scale);
            this.ctx.moveTo(trackWidth / 2 + curveOffset, y);
            this.ctx.lineTo(trackWidth / 2 + curveOffset, y + 12 * scale);
            this.ctx.stroke();
            
            if (Math.floor(distance / 50) % 2 === 0) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(curveOffset - 2 * scale, y + 4 * scale, 4 * scale, 4 * scale);
            }
        }
    }

    getRoadColor(progress) {
        if (progress < 0.3) return '#D2B48C';
        if (progress < 0.6) return '#C4A484';
        return '#B8956E';
    }

    drawDecorations(track, cameraY) {
        const decorations = track.getDecorationsInRange(cameraY - 600, cameraY + 200);
        
        for (const dec of decorations) {
            const z = cameraY - dec.position;
            if (z < 0 || z > 600) continue;
            
            const scale = 400 / (z + 200);
            const curveOffset = track.getCurveAt(dec.position) * scale;
            const y = -z * scale;
            
            const side = dec.side === 'left' ? -1 : 1;
            const x = side * (TRACK_WIDTH / 2 + dec.distanceFromTrack) * scale + curveOffset;
            
            this.drawDecoration(x, y, scale, dec);
        }
    }

    drawDecoration(x, y, scale, dec) {
        switch (dec.type) {
            case 'tree':
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x - 3 * scale, y, 6 * scale, 30 * scale);
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(x, y - 10 * scale, 15 * scale, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'flower':
                const colors = COLORS.FLOWER;
                this.ctx.fillStyle = colors[Math.floor(dec.position) % colors.length];
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const px = x + Math.cos(angle) * 4 * scale;
                    const py = y + Math.sin(angle) * 4 * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 3 * scale, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'wheat':
                this.ctx.fillStyle = COLORS.WHEAT;
                for (let i = 0; i < 3; i++) {
                    const wx = x + (i - 1) * 5 * scale;
                    this.ctx.fillRect(wx - 1 * scale, y - 20 * scale, 2 * scale, 20 * scale);
                    this.ctx.beginPath();
                    this.ctx.ellipse(wx, y - 22 * scale, 4 * scale, 8 * scale, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
            case 'rock':
                this.ctx.fillStyle = '#808080';
                this.ctx.beginPath();
                this.ctx.ellipse(x, y - 5 * scale, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
    }

    drawObstacles(track, cameraY) {
        const obstacles = track.getObstaclesInRange(cameraY - 300, cameraY + 200);
        
        for (const obs of obstacles) {
            const z = cameraY - obs.position;
            if (z < 0 || z > 600) continue;
            
            const scale = 400 / (z + 200);
            const curveOffset = track.getCurveAt(obs.position) * scale;
            const y = -z * scale;
            const trackWidth = TRACK_WIDTH * scale;
            
            this.ctx.fillStyle = obs.color + '80';
            this.ctx.fillRect(-trackWidth / 2 + curveOffset, y - 5 * scale, trackWidth, 15 * scale);
            
            if (obs.type === 'block') {
                this.ctx.fillStyle = obs.color;
                this.ctx.fillRect(-30 * scale + curveOffset, y - 20 * scale, 60 * scale, 25 * scale);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2 * scale;
                for (let i = 0; i < 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(-25 * scale + curveOffset + i * 20 * scale, y - 15 * scale);
                    this.ctx.lineTo(-20 * scale + curveOffset + i * 20 * scale, y - 5 * scale);
                    this.ctx.stroke();
                }
            } else if (obs.type === 'steep') {
                this.ctx.fillStyle = obs.color;
                for (let i = 0; i < 5; i++) {
                    const wx = (-trackWidth / 2 + i * trackWidth / 4) * scale + curveOffset;
                    this.ctx.beginPath();
                    this.ctx.moveTo(wx, y);
                    this.ctx.lineTo(wx + 10 * scale, y - 15 * scale);
                    this.ctx.lineTo(wx + 20 * scale, y);
                    this.ctx.fill();
                }
            } else if (obs.type === 'gravel') {
                this.ctx.fillStyle = '#696969';
                for (let i = 0; i < 10; i++) {
                    const rx = (Math.random() - 0.5) * trackWidth + curveOffset;
                    const ry = y + Math.random() * 10 * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(rx, ry, 2 * scale, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (obs.type === 'winds') {
                this.ctx.strokeStyle = 'rgba(135, 206, 235, 0.6)';
                this.ctx.lineWidth = 2 * scale;
                for (let i = 0; i < 4; i++) {
                    const wy = y - 5 * scale + i * 5 * scale;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-trackWidth / 2 + curveOffset, wy);
                    this.ctx.quadraticCurveTo(curveOffset, wy - 5 * scale, trackWidth / 2 + curveOffset, wy);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawItems(itemManager, cameraY, track) {
        const items = itemManager.getItemsInRange(cameraY - 300, cameraY + 200);
        
        for (const item of items) {
            const z = cameraY - item.position;
            if (z < 0 || z > 600) continue;
            
            const scale = 400 / (z + 200);
            const curveOffset = track.getCurveAt(item.position) * scale;
            const x = item.lateralOffset * scale + curveOffset;
            const y = -z * scale;
            
            const floatOffset = Math.sin(Date.now() * 0.005 + item.position) * 3 * scale;
            
            this.ctx.fillStyle = item.color + '40';
            this.ctx.beginPath();
            this.ctx.arc(x, y + floatOffset, 15 * scale, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.font = `${20 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.icon, x, y + floatOffset);
        }
    }

    drawTraps(itemManager, cameraY, track) {
        const traps = itemManager.getTrapsInRange(cameraY - 300, cameraY + 200);
        
        for (const trap of traps) {
            const z = cameraY - trap.position;
            if (z < 0 || z > 600) continue;
            
            const scale = 400 / (z + 200);
            const curveOffset = track.getCurveAt(trap.position) * scale;
            const x = trap.lateralOffset * scale + curveOffset;
            const y = -z * scale;
            
            this.ctx.fillStyle = 'rgba(96, 125, 139, 0.7)';
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 20 * scale, 10 * scale, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawRider(rider, cameraY, track) {
        const z = cameraY - rider.distance;
        if (z < -50 || z > 600) return;
        
        const scale = 400 / (z + 200);
        const curveOffset = track.getCurveAt(rider.distance) * scale;
        const x = rider.lateralPosition * scale + curveOffset;
        const y = -z * scale + 20 * scale;
        
        if (rider.isCrashed) {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(Math.PI / 4);
            this.drawUnicycle(rider, 0, 0, scale, true);
            this.ctx.restore();
            return;
        }
        
        if (rider.hasShield()) {
            this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
            this.ctx.lineWidth = 3 * scale;
            this.ctx.beginPath();
            this.ctx.arc(x, y - 30 * scale, 35 * scale, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        const boostEffect = rider.activeEffects.find(e => e.type === 'boost');
        if (boostEffect) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.ellipse(x, y + 5 * scale + i * 6 * scale, 10 * scale - i * 2, 5 * scale, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.drawUnicycle(rider, x, y, scale, false);
    }

    drawUnicycle(rider, x, y, scale, crashed) {
        const wheelRadius = 15 * scale;
        const bodyHeight = 35 * scale;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        if (!crashed) {
            const lean = (rider.targetLateralPosition - rider.lateralPosition) * 0.01;
            this.ctx.rotate(lean * 0.3);
        }
        
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 3 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -wheelRadius);
        this.ctx.lineTo(0, -wheelRadius - bodyHeight);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2 * scale;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + rider.wheelRotation;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(
                Math.cos(angle) * wheelRadius * 0.8,
                Math.sin(angle) * wheelRadius * 0.8
            );
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = rider.config.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -wheelRadius - bodyHeight / 2, 12 * scale, 15 * scale, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFDAB9';
        this.ctx.beginPath();
        this.ctx.arc(0, -wheelRadius - bodyHeight - 5 * scale, 10 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-3 * scale, -wheelRadius - bodyHeight - 7 * scale, 1.5 * scale, 0, Math.PI * 2);
        this.ctx.arc(3 * scale, -wheelRadius - bodyHeight - 7 * scale, 1.5 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (rider.slowed) {
            this.ctx.strokeStyle = 'rgba(96, 125, 139, 0.6)';
            this.ctx.lineWidth = 2 * scale;
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.arc(0, -wheelRadius - bodyHeight / 2, 20 * scale + i * 5 * scale, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }

    drawExplosions(itemManager, cameraY, track) {
        for (const exp of itemManager.explosions) {
            const z = cameraY - exp.x;
            if (z < 0 || z > 600) continue;
            
            const scale = 400 / (z + 200);
            const curveOffset = track.getCurveAt(exp.x) * scale;
            const x = exp.y * scale + curveOffset;
            const y = -z * scale;
            
            const progress = (Date.now() - exp.startTime) / exp.duration;
            const radius = exp.radius * scale * (0.5 + progress * 0.5);
            const alpha = 1 - progress;
            
            this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawFinishLine(cameraY, track) {
        const z = cameraY - TRACK_LENGTH;
        if (z < 0 || z > 600) return;
        
        const scale = 400 / (z + 200);
        const curveOffset = track.getCurveAt(TRACK_LENGTH) * scale;
        const y = -z * scale;
        const trackWidth = TRACK_WIDTH * scale;
        
        for (let i = 0; i < 8; i++) {
            this.ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
            this.ctx.fillRect(
                -trackWidth / 2 + i * (trackWidth / 8) + curveOffset,
                y - 30 * scale,
                trackWidth / 8,
                40 * scale
            );
        }
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = `bold ${16 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FINISH', curveOffset, y - 40 * scale);
    }
}
