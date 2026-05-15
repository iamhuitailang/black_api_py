import { CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, BASE_PLATFORM_Y } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.cameraOffsetY = 0;
        this.targetCameraOffsetY = 0;
    }

    render(game) {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.drawBackground();
        
        this.updateCamera(game);
        
        this.ctx.save();
        this.ctx.translate(0, this.cameraOffsetY);
        
        if (game.currentBox) {
            const halfWidth = game.currentBox.width / 2;
            const minX = halfWidth + 50;
            const maxX = CANVAS_WIDTH - halfWidth - 50;
            
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(minX, 50);
            this.ctx.lineTo(minX, 200);
            this.ctx.moveTo(maxX, 50);
            this.ctx.lineTo(maxX, 200);
            this.ctx.stroke();
        }
        
        if (game.boxes.length > 1) {
            const towerCenter = CENTER_X + game.totalOffset;
            
            this.ctx.save();
            this.ctx.translate(towerCenter, BASE_PLATFORM_Y);
            this.ctx.rotate(game.towerAngle);
            this.ctx.translate(-towerCenter, -BASE_PLATFORM_Y);
        }
        
        for (const box of game.boxes) {
            this.drawBox(box);
        }
        
        if (game.boxes.length > 1) {
            this.ctx.restore();
        }
        
        if (game.currentBox) {
            this.drawBox(game.currentBox);
        }
        
        for (const box of game.fallingBoxes) {
            this.drawBox(box);
        }
        
        this.ctx.restore();
        
        this.drawGround();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#B0E0E6');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.drawClouds();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        const clouds = [
            { x: 100, y: 80, scale: 1 },
            { x: 400, y: 120, scale: 0.8 },
            { x: 500, y: 60, scale: 0.6 },
            { x: 50, y: 200, scale: 0.7 }
        ];
        
        for (const cloud of clouds) {
            this.drawCloud(cloud.x, cloud.y, cloud.scale);
        }
    }

    drawCloud(x, y, scale) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 30 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 60 * scale, y, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 30 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGround() {
        const groundY = BASE_PLATFORM_Y + 25;
        const gradient = this.ctx.createLinearGradient(0, groundY, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.3, '#654321');
        gradient.addColorStop(1, '#3D2914');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, groundY, CANVAS_WIDTH, CANVAS_HEIGHT - groundY);
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, groundY, CANVAS_WIDTH, 10);
    }

    drawBox(box) {
        this.ctx.save();
        
        if (box.rotation !== 0) {
            this.ctx.translate(box.x, box.y);
            this.ctx.rotate(box.rotation);
            this.ctx.translate(-box.x, -box.y);
        }
        
        this.ctx.fillStyle = box.color;
        this.ctx.fillRect(
            box.x - box.width / 2,
            box.y - box.height / 2,
            box.width,
            box.height
        );
        
        this.ctx.strokeStyle = box.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            box.x - box.width / 2,
            box.y - box.height / 2,
            box.width,
            box.height
        );
        
        this.drawBoxTexture(box);
        
        this.ctx.restore();
    }

    drawBoxTexture(box) {
        this.ctx.strokeStyle = box.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        const left = box.x - box.width / 2;
        const right = box.x + box.width / 2;
        const top = box.y - box.height / 2;
        const bottom = box.y + box.height / 2;
        
        const linesX = Math.floor(box.width / 25);
        for (let i = 1; i < linesX; i++) {
            const x = left + (box.width / linesX) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, top);
            this.ctx.lineTo(x, bottom);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(left + 3, top + 3, box.width - 6, 3);
        
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(left + 3, bottom - 6, box.width - 6, 3);
        
        this.ctx.globalAlpha = 1;
    }

    updateCamera(game) {
        if (game.boxes.length > 5) {
            const topBox = game.boxes[game.boxes.length - 1];
            const targetY = -topBox.y + CANVAS_HEIGHT / 2;
            this.targetCameraOffsetY = Math.min(0, targetY + 100);
        } else {
            this.targetCameraOffsetY = 0;
        }
        
        this.cameraOffsetY += (this.targetCameraOffsetY - this.cameraOffsetY) * 0.1;
    }

    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scale = Math.min(
            containerWidth / CANVAS_WIDTH,
            containerHeight / CANVAS_HEIGHT
        ) * 0.95;
        
        this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
        this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    }
}