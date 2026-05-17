import { CONFIG } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setCamera(x, y, zoom = 1) {
        this.cameraX = this.canvas.width / 2;
        this.cameraY = y;
        this.targetZoom = zoom;
        this.zoom += (this.targetZoom - this.zoom) * 0.05;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.cameraX) * this.zoom + this.canvas.width / 2,
            y: (worldY - this.cameraY) * this.zoom + this.canvas.height / 2
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvas.width / 2) / this.zoom + this.cameraX,
            y: (screenY - this.canvas.height / 2) / this.zoom + this.cameraY
        };
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, CONFIG.COLORS.SKY_TOP);
        gradient.addColorStop(0.5, CONFIG.COLORS.SKY_MID);
        gradient.addColorStop(1, CONFIG.COLORS.SKY_BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWall(wallWidth, minY, maxY) {
        const topLeft = this.worldToScreen(0, minY);
        const bottomRight = this.worldToScreen(wallWidth, maxY);

        const wallX = Math.max(0, topLeft.x);
        const wallY = Math.max(0, topLeft.y);
        const wallW = Math.min(this.canvas.width, bottomRight.x) - wallX;
        const wallH = Math.min(this.canvas.height, bottomRight.y) - wallY;

        this.ctx.fillStyle = CONFIG.COLORS.WALL;
        this.ctx.fillRect(wallX, wallY, wallW, wallH);

        const edgeGradient = this.ctx.createLinearGradient(wallX, 0, wallX + 30, 0);
        edgeGradient.addColorStop(0, CONFIG.COLORS.WALL_EDGE);
        edgeGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = edgeGradient;
        this.ctx.fillRect(wallX, wallY, 30, wallH);

        const rightEdgeGradient = this.ctx.createLinearGradient(wallX + wallW - 30, 0, wallX + wallW, 0);
        rightEdgeGradient.addColorStop(0, 'transparent');
        rightEdgeGradient.addColorStop(1, CONFIG.COLORS.WALL_EDGE);
        this.ctx.fillStyle = rightEdgeGradient;
        this.ctx.fillRect(wallX + wallW - 30, wallY, 30, wallH);

        this.ctx.strokeStyle = 'rgba(150, 170, 190, 0.3)';
        this.ctx.lineWidth = 1;
        for (let y = Math.floor(minY / 100) * 100; y < maxY; y += 100) {
            const screenY = this.worldToScreen(0, y).y;
            this.ctx.beginPath();
            this.ctx.moveTo(wallX, screenY);
            this.ctx.lineTo(wallX + wallW, screenY);
            this.ctx.stroke();
        }
    }

    drawHold(hold) {
        const pos = this.worldToScreen(hold.x, hold.y);
        const width = hold.width * this.zoom;
        const height = hold.height * this.zoom;

        if (hold.isReachable && hold.canGrab()) {
            const glowSize = 15 + Math.sin(hold.glowIntensity) * 5;
            this.ctx.shadowColor = hold.isRestPoint() ? '#4ade80' : 
                                   hold.isIce() ? '#87ceeb' : '#fbbf24';
            this.ctx.shadowBlur = glowSize;
        }

        switch (hold.type) {
            case CONFIG.HOLD.TYPES.NORMAL:
                this.drawNormalHold(pos.x, pos.y, width, height);
                break;
            case CONFIG.HOLD.TYPES.REST:
                this.drawRestHold(pos.x, pos.y, width, height);
                break;
            case CONFIG.HOLD.TYPES.ICE:
                this.drawIceHold(pos.x, pos.y, width, height);
                break;
            case CONFIG.HOLD.TYPES.CRACK:
                this.drawCrackHold(pos.x, pos.y, width, height);
                break;
        }

        this.ctx.shadowBlur = 0;
    }

    drawNormalHold(x, y, w, h) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, CONFIG.COLORS.HOLD_NORMAL_LIGHT);
        gradient.addColorStop(1, CONFIG.COLORS.HOLD_NORMAL);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, 5);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(x + 5, y + 3, w - 10, h / 2 - 3, 3);
        this.ctx.fill();
    }

    drawRestHold(x, y, w, h) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, CONFIG.COLORS.HOLD_REST_LIGHT);
        gradient.addColorStop(1, CONFIG.COLORS.HOLD_REST);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, 5);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${14 * this.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💚', x + w / 2, y + h / 2);
    }

    drawIceHold(x, y, w, h) {
        this.ctx.fillStyle = CONFIG.COLORS.HOLD_ICE;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, 5);
        this.ctx.fill();
        
        this.ctx.fillStyle = CONFIG.COLORS.HOLD_ICE_LIGHT;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 3, y + 3, w / 3, h / 2, 3);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${12 * this.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('❄️', x + w / 2, y + h / 2);
    }

    drawCrackHold(x, y, w, h) {
        this.ctx.fillStyle = CONFIG.COLORS.HOLD_CRACK;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, 5);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + w * 0.3, y);
        this.ctx.lineTo(x + w * 0.5, y + h * 0.5);
        this.ctx.lineTo(x + w * 0.7, y + h);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + w * 0.6, y);
        this.ctx.lineTo(x + w * 0.4, y + h * 0.6);
        this.ctx.lineTo(x + w * 0.5, y + h);
        this.ctx.stroke();
    }

    drawPlayer(player) {
        const pos = player.getJumpPosition();
        const screenPos = this.worldToScreen(pos.x, pos.y);
        const w = player.width * this.zoom;
        const h = player.height * this.zoom;

        this.ctx.save();
        
        if (player.side === 'right') {
            this.ctx.translate(screenPos.x + w, screenPos.y);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-screenPos.x, -screenPos.y);
        }

        const bodyGradient = this.ctx.createLinearGradient(screenPos.x, screenPos.y, screenPos.x, screenPos.y + h);
        bodyGradient.addColorStop(0, CONFIG.COLORS.PLAYER_BODY);
        bodyGradient.addColorStop(1, CONFIG.COLORS.PLAYER_OUTLINE);
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(screenPos.x + 5, screenPos.y + 20, w - 10, h - 25, 8);
        this.ctx.fill();
        
        this.ctx.fillStyle = CONFIG.COLORS.PLAYER_HEAD;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x + w / 2, screenPos.y + 15, 12 * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = CONFIG.COLORS.PLAYER_OUTLINE;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x + w / 2, screenPos.y + 15, 12 * this.zoom, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x + w / 2 - 4, screenPos.y + 13, 2, 0, Math.PI * 2);
        this.ctx.arc(screenPos.x + w / 2 + 4, screenPos.y + 13, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        const armSwing = player.isJumping ? Math.sin(player.jumpProgress * Math.PI) * 15 : 0;
        
        this.ctx.strokeStyle = CONFIG.COLORS.PLAYER_OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x + 8, screenPos.y + 30);
        this.ctx.lineTo(screenPos.x - 5 - armSwing, screenPos.y + 45);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x + w - 8, screenPos.y + 30);
        this.ctx.lineTo(screenPos.x + w + 5 + armSwing, screenPos.y + 45);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x + 12, screenPos.y + h - 10);
        this.ctx.lineTo(screenPos.x + 8, screenPos.y + h + 5);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x + w - 12, screenPos.y + h - 10);
        this.ctx.lineTo(screenPos.x + w - 8, screenPos.y + h + 5);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawRock(rock) {
        const pos = this.worldToScreen(rock.x, rock.y);
        const w = rock.width * this.zoom;
        const h = rock.height * this.zoom;
        
        this.ctx.save();
        this.ctx.translate(pos.x + w / 2, pos.y + h / 2);
        this.ctx.rotate(rock.rotation);
        
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
        gradient.addColorStop(0, CONFIG.COLORS.ROCK_LIGHT);
        gradient.addColorStop(1, CONFIG.COLORS.ROCK);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = (w / 2) * (0.8 + Math.sin(i * 1.5) * 0.2);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawBird(bird) {
        const pos = this.worldToScreen(bird.x, bird.y);
        const w = bird.width * this.zoom;
        const h = bird.height * this.zoom;
        
        this.ctx.save();
        if (bird.direction < 0) {
            this.ctx.translate(pos.x + w, pos.y);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-pos.x, -pos.y);
        }
        
        this.ctx.fillStyle = CONFIG.COLORS.BIRD;
        this.ctx.beginPath();
        this.ctx.ellipse(pos.x + w / 2, pos.y + h / 2, w / 2 - 5, h / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const wingY = Math.sin(bird.wingPhase) * 10 * this.zoom;
        this.ctx.fillStyle = CONFIG.COLORS.BIRD_WING;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x + w / 2 - 5, pos.y + h / 2);
        this.ctx.quadraticCurveTo(pos.x + w / 2, pos.y + wingY, pos.x + w / 2 + 20, pos.y + h / 2 - 5);
        this.ctx.quadraticCurveTo(pos.x + w / 2, pos.y + h / 2 + 5, pos.x + w / 2 - 5, pos.y + h / 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = CONFIG.COLORS.BIRD;
        this.ctx.beginPath();
        this.ctx.arc(pos.x + w - 8, pos.y + h / 2 - 3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x + w - 2, pos.y + h / 2 - 3);
        this.ctx.lineTo(pos.x + w + 8, pos.y + h / 2 - 1);
        this.ctx.lineTo(pos.x + w - 2, pos.y + h / 2 + 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawSnowParticle(particle) {
        const pos = this.worldToScreen(particle.x, particle.y);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, particle.size * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSummit(summitY, wallWidth) {
        const pos = this.worldToScreen(0, summitY);
        
        const gradient = this.ctx.createLinearGradient(0, pos.y - 100, 0, pos.y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, pos.y - 100, this.canvas.width, 100);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, pos.y - 60);
        this.ctx.lineTo(0, pos.y + 20);
        this.ctx.lineTo(this.canvas.width, pos.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏆', this.canvas.width / 2, pos.y - 70);
    }

    drawJumpLine(player, targetHold) {
        if (!player || !targetHold) return;
        
        const playerPos = player.getJumpPosition();
        const startScreen = this.worldToScreen(
            playerPos.x + player.width / 2,
            playerPos.y + player.height / 2
        );
        const endScreen = this.worldToScreen(
            targetHold.x + targetHold.width / 2,
            targetHold.y + targetHold.height / 2
        );
        
        this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(startScreen.x, startScreen.y);
        
        const midX = (startScreen.x + endScreen.x) / 2;
        const midY = Math.min(startScreen.y, endScreen.y) - 50;
        this.ctx.quadraticCurveTo(midX, midY, endScreen.x, endScreen.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawAltitudeMarkers(currentAltitude, bestAltitude) {
        const wallWidth = this.canvas.width;
        const markerY = 100;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(wallWidth - 150, markerY, 130, 4);
        
        this.ctx.fillStyle = '#fbbf24';
        const bestX = wallWidth - 150 + (bestAltitude / CONFIG.GAME.SUMMIT_ALTITUDE) * 130;
        this.ctx.beginPath();
        this.ctx.arc(bestX, markerY + 2, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ef4444';
        const currentX = wallWidth - 150 + (currentAltitude / CONFIG.GAME.SUMMIT_ALTITUDE) * 130;
        this.ctx.beginPath();
        this.ctx.arc(currentX, markerY + 2, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
