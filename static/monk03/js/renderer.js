class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.scale = Math.min(
            this.canvas.width / CONSTANTS.CANVAS_WIDTH,
            this.canvas.height / CONSTANTS.CANVAS_HEIGHT
        );
        this.offsetX = (this.canvas.width - CONSTANTS.CANVAS_WIDTH * this.scale) / 2;
        this.offsetY = (this.canvas.height - CONSTANTS.CANVAS_HEIGHT * this.scale) / 2;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, CONSTANTS.COLORS.SKY_TOP);
        gradient.addColorStop(1, CONSTANTS.COLORS.SKY_BOTTOM);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawClouds();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const clouds = [
            { x: 50, y: 100, size: 40 },
            { x: 350, y: 150, size: 50 },
            { x: 150, y: 250, size: 35 },
            { x: 400, y: 350, size: 45 }
        ];

        clouds.forEach(cloud => {
            const x = this.offsetX + cloud.x * this.scale;
            const y = this.offsetY + cloud.y * this.scale;
            const size = cloud.size * this.scale;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
            this.ctx.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawTrunk() {
        const trunkX = this.offsetX + (CONSTANTS.CANVAS_WIDTH - CONSTANTS.TRUNK_WIDTH) / 2 * this.scale;
        const trunkWidth = CONSTANTS.TRUNK_WIDTH * this.scale;

        const gradient = this.ctx.createLinearGradient(trunkX, 0, trunkX + trunkWidth, 0);
        gradient.addColorStop(0, CONSTANTS.COLORS.TRUNK_DARK);
        gradient.addColorStop(0.3, CONSTANTS.COLORS.TRUNK_LIGHT);
        gradient.addColorStop(0.7, CONSTANTS.COLORS.TRUNK_LIGHT);
        gradient.addColorStop(1, CONSTANTS.COLORS.TRUNK_DARK);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(trunkX, 0, trunkWidth, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            const y = (i * 80 + gameState.cameraOffset % 80) * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(trunkX + trunkWidth * 0.1, y);
            this.ctx.quadraticCurveTo(trunkX + trunkWidth * 0.5, y + 20 * this.scale, trunkX + trunkWidth * 0.9, y);
            this.ctx.stroke();
        }
    }

    drawMonkey() {
        const trunkCenterX = CONSTANTS.CANVAS_WIDTH / 2;
        const currentSide = gameState.monkeySide + (gameState.monkeyTargetSide - gameState.monkeySide) * gameState.monkeySideTransition;
        const x = this.offsetX + (trunkCenterX + currentSide * 40) * this.scale;
        
        let baseY = CONSTANTS.CANVAS_HEIGHT * 0.7;
        if (gameState.monkeyIsClimbing) {
            const bounceProgress = gameState.monkeyClimbProgress;
            baseY -= Math.sin(bounceProgress * Math.PI) * 30;
        }
        
        const y = this.offsetY + baseY * this.scale;
        const width = CONSTANTS.MONKEY_WIDTH * this.scale;
        const height = CONSTANTS.MONKEY_HEIGHT * this.scale;

        this.ctx.save();
        
        if (gameState.monkeyIsClimbing) {
            const bounce = Math.sin(gameState.monkeyClimbProgress * Math.PI) * 5;
            this.ctx.translate(0, -bounce * this.scale);
        }

        if (gameState.powerups.shield) {
            this.ctx.beginPath();
            this.ctx.arc(x, y + height / 2, width * 0.8, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + height * 0.4, width * 0.35, height * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + height * 0.45, width * 0.2, height * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.arc(x, y + height * 0.1, width * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + height * 0.12, width * 0.2, height * 0.12, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.arc(x - width * 0.3, y + height * 0.05, width * 0.1, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.3, y + height * 0.05, width * 0.1, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.arc(x - width * 0.3, y + height * 0.05, width * 0.06, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.3, y + height * 0.05, width * 0.06, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x - width * 0.08, y + height * 0.08, width * 0.06, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.08, y + height * 0.08, width * 0.06, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x - width * 0.08, y + height * 0.08, width * 0.03, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.08, y + height * 0.08, width * 0.03, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + height * 0.15, width * 0.04, height * 0.02, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y + height * 0.18, width * 0.08, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#A0522D';
        this.ctx.lineWidth = width * 0.08;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x - width * 0.2, y + height * 0.5);
        this.ctx.quadraticCurveTo(x - width * 0.5, y + height * 0.3, x - width * 0.4, y + height * 0.1);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.2, y + height * 0.5);
        this.ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.3, x + width * 0.4, y + height * 0.1);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x - width * 0.15, y + height * 0.7);
        this.ctx.lineTo(x - width * 0.2, y + height * 0.9);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.15, y + height * 0.7);
        this.ctx.lineTo(x + width * 0.2, y + height * 0.9);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawObstacles() {
        gameState.obstacles.forEach(obstacle => {
            const screenY = this.heightToScreenY(obstacle.height);
            if (screenY < -100 * this.scale || screenY > this.canvas.height + 100 * this.scale) return;

            const trunkCenterX = CONSTANTS.CANVAS_WIDTH / 2;
            const x = this.offsetX + (trunkCenterX + obstacle.side * 50) * this.scale;
            const y = this.offsetY + screenY;

            switch (obstacle.type) {
                case CONSTANTS.OBSTACLE_TYPES.BRANCH:
                    this.drawBranch(x, y, obstacle.side);
                    break;
                case CONSTANTS.OBSTACLE_TYPES.BUG:
                    this.drawBug(x, y, obstacle.offset || 0);
                    break;
                case CONSTANTS.OBSTACLE_TYPES.MUSHROOM:
                    this.drawMushroom(x, y, obstacle.growth || 1);
                    break;
                case CONSTANTS.OBSTACLE_TYPES.WEB:
                    this.drawWeb(x, y);
                    break;
                case CONSTANTS.OBSTACLE_TYPES.WOODPECKER:
                    this.drawWoodpecker(x, y, obstacle.offset || 0);
                    break;
                case CONSTANTS.OBSTACLE_TYPES.NEST:
                    this.drawNest(x, y, obstacle.side);
                    break;
            }
        });
    }

    drawBranch(x, y, side) {
        const width = 80 * this.scale;
        const height = 15 * this.scale;
        
        this.ctx.fillStyle = '#654321';
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.ctx.beginPath();
        if (side < 0) {
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-width, -height);
            this.ctx.lineTo(-width, height);
        } else {
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(width, -height);
            this.ctx.lineTo(width, height);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawBug(x, y, offset) {
        const size = 25 * this.scale;
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.ellipse(x + offset * this.scale, y, size, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + offset * this.scale + (i - 1.5) * size * 0.5, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + offset * this.scale - size * 0.5, y);
        this.ctx.lineTo(x + offset * this.scale - size * 0.8, y - size * 0.5);
        this.ctx.moveTo(x + offset * this.scale - size * 0.3, y);
        this.ctx.lineTo(x + offset * this.scale - size * 0.6, y - size * 0.5);
        this.ctx.stroke();
    }

    drawMushroom(x, y, growth) {
        const size = 30 * this.scale * Math.min(growth, 1);
        
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillRect(x - size * 0.3, y, size * 0.6, size * 0.5);

        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.6, Math.PI, 0);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.15, y - size * 0.3, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        if (growth < 1) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawWeb(x, y) {
        const size = 50 * this.scale;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
            this.ctx.stroke();
        }

        for (let r = size * 0.3; r <= size; r += size * 0.3) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawWoodpecker(x, y, offset) {
        const size = 30 * this.scale;
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.ellipse(x + offset * this.scale, y, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(x + offset * this.scale, y - size * 0.5, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + offset * this.scale, y - size * 0.45, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(x + offset * this.scale + size * 0.3, y - size * 0.5);
        this.ctx.lineTo(x + offset * this.scale + size * 0.8, y - size * 0.45);
        this.ctx.lineTo(x + offset * this.scale + size * 0.3, y - size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawNest(x, y, side) {
        const size = 40 * this.scale;
        
        this.ctx.fillStyle = '#8B7355';
        this.ctx.beginPath();
        this.ctx.ellipse(x + side * 20 * this.scale, y, size, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(x + side * 20 * this.scale, y, size * 0.7, size * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.ellipse(x + side * 20 * this.scale - size * 0.3, y - size * 0.1, size * 0.15, size * 0.2, 0.3, 0, Math.PI * 2);
        this.ctx.ellipse(x + side * 20 * this.scale + size * 0.2, y - size * 0.15, size * 0.15, size * 0.2, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawItems() {
        gameState.items.forEach(item => {
            const screenY = this.heightToScreenY(item.height);
            if (screenY < -100 * this.scale || screenY > this.canvas.height + 100 * this.scale) return;

            const trunkCenterX = CONSTANTS.CANVAS_WIDTH / 2;
            const x = this.offsetX + (trunkCenterX + item.side * 80) * this.scale;
            const y = this.offsetY + screenY;

            switch (item.type) {
                case CONSTANTS.ITEM_TYPES.BANANA:
                    this.drawBanana(x, y);
                    break;
                case CONSTANTS.ITEM_TYPES.SPEED_BANANA:
                    this.drawSpeedBanana(x, y);
                    break;
                case CONSTANTS.ITEM_TYPES.SHIELD_LEAF:
                    this.drawShieldLeaf(x, y);
                    break;
                case CONSTANTS.ITEM_TYPES.MAGNET:
                    this.drawMagnet(x, y);
                    break;
                case CONSTANTS.ITEM_TYPES.SPRING_SHOES:
                    this.drawSpringShoes(x, y);
                    break;
            }
        });
    }

    drawBanana(x, y) {
        const size = 25 * this.scale;
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.quadraticCurveTo(x - size * 0.5, y - size * 1.2, x, y - size * 0.5);
        this.ctx.quadraticCurveTo(x + size * 0.5, y - size * 1.2, x + size, y);
        this.ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.3, x, y + size * 0.2);
        this.ctx.quadraticCurveTo(x - size * 0.5, y + size * 0.3, x - size, y);
        this.ctx.fill();

        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawSpeedBanana(x, y) {
        this.drawBanana(x, y);
        
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - 30 * this.scale + i * 10 * this.scale, y + 20 * this.scale);
            this.ctx.lineTo(x - 20 * this.scale + i * 10 * this.scale, y + 35 * this.scale);
            this.ctx.stroke();
        }
    }

    drawShieldLeaf(x, y) {
        const size = 30 * this.scale;
        const time = Date.now() / 500;
        const floatY = Math.sin(time) * 5 * this.scale;
        
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + floatY, size * 0.4, size * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + floatY - size * 0.7);
        this.ctx.lineTo(x, y + floatY + size * 0.7);
        this.ctx.stroke();
    }

    drawMagnet(x, y) {
        const size = 25 * this.scale;
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x - size, y - size * 0.3, size * 0.4, size * 1.2);
        
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(x + size * 0.6, y - size * 0.3, size * 0.4, size * 1.2);
        
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(x - size, y - size * 0.5, size * 2, size * 0.4);

        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawSpringShoes(x, y) {
        const size = 20 * this.scale;
        
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fillRect(x - size * 0.8, y, size * 0.6, size * 0.5);
        this.ctx.fillRect(x + size * 0.2, y, size * 0.6, size * 0.5);

        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            this.ctx.moveTo(x - size * 0.5, y + size * 0.3 + i * size * 0.2);
            this.ctx.lineTo(x + size * 0.5, y + size * 0.3 + i * size * 0.2);
        }
        this.ctx.stroke();
    }

    heightToScreenY(height) {
        const relativeHeight = height - gameState.height;
        const screenY = CONSTANTS.CANVAS_HEIGHT * 0.7 + relativeHeight;
        return screenY;
    }
    
    drawSideIndicators() {
        const trunkCenterX = CONSTANTS.CANVAS_WIDTH / 2;
        const leftX = this.offsetX + (trunkCenterX - 40) * this.scale;
        const rightX = this.offsetX + (trunkCenterX + 40) * this.scale;
        const y = this.offsetY + CONSTANTS.CANVAS_HEIGHT * 0.85 * this.scale;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = `${20 * this.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('← 左 | 右 →', this.offsetX + CONSTANTS.CANVAS_WIDTH / 2 * this.scale, y);
    }

    render() {
        this.clear();
        this.drawBackground();
        this.drawTrunk();
        this.drawItems();
        this.drawObstacles();
        this.drawMonkey();
        this.drawSideIndicators();
    }
}
