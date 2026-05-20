class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.cameraX = 0;
        this.time = 0;
        this.clouds = [];
        this.initClouds();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initClouds() {
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: Math.random() * 2000,
                y: Math.random() * 300 + 50,
                size: 60 + Math.random() * 80,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }

    render(scene, character, balanceSystem, obstacleSystem, gameState) {
        this.time += 16;
        const ctx = this.ctx;
        const wireY = this.height * scene.wireHeight;

        this.cameraX = character.x - this.width * 0.3;

        ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground(scene);
        this.drawClouds(scene);
        this.drawWire(wireY);
        this.drawDistantObjects(scene, wireY);
        
        obstacleSystem.obstacles.forEach(obs => {
            this.drawObstacle(obs, wireY);
        });

        this.drawCharacter(character, wireY);

        if (balanceSystem.isCritical()) {
            this.drawWarningEffect();
        }
    }

    drawBackground(scene) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, scene.colors.skyTop);
        gradient.addColorStop(1, scene.colors.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawClouds(scene) {
        const ctx = this.ctx;
        ctx.fillStyle = scene.colors.cloud;
        
        this.clouds.forEach(cloud => {
            const screenX = (cloud.x - this.cameraX * 0.3) % (this.width + 200) - 100;
            const screenY = cloud.y;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(screenX + cloud.size * 0.4, screenY - cloud.size * 0.1, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(screenX + cloud.size * 0.8, screenY, cloud.size * 0.45, 0, Math.PI * 2);
            ctx.arc(screenX + cloud.size * 0.4, screenY + cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawWire(wireY) {
        const ctx = this.ctx;
        const startX = -this.cameraX;
        const endX = startX + GameConfig.WIRE_LENGTH;

        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(Math.max(0, startX), wireY);
        
        const segments = 50;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const sag = Math.sin(t * Math.PI) * 20;
            ctx.lineTo(x, wireY + sag);
        }
        ctx.stroke();

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawDistantObjects(scene, wireY) {
        const ctx = this.ctx;
        
        if (scene.id === 'mountain') {
            ctx.fillStyle = 'rgba(100, 120, 140, 0.3)';
            for (let i = 0; i < 5; i++) {
                const x = (i * 400 - this.cameraX * 0.2) % (this.width + 800) - 200;
                ctx.beginPath();
                ctx.moveTo(x, wireY + 100);
                ctx.lineTo(x + 150, wireY - 100);
                ctx.lineTo(x + 300, wireY + 100);
                ctx.fill();
            }
        } else if (scene.id === 'city') {
            ctx.fillStyle = 'rgba(100, 100, 120, 0.4)';
            for (let i = 0; i < 8; i++) {
                const x = (i * 200 - this.cameraX * 0.2) % (this.width + 400) - 100;
                const h = 80 + Math.sin(i * 1.5) * 60;
                ctx.fillRect(x, wireY + 20 - h, 80, h + 100);
            }
        } else if (scene.id === 'canyon') {
            ctx.fillStyle = 'rgba(80, 60, 100, 0.5)';
            for (let i = 0; i < 6; i++) {
                const x = (i * 300 - this.cameraX * 0.2) % (this.width + 600) - 150;
                ctx.beginPath();
                ctx.moveTo(x, wireY + 50);
                ctx.lineTo(x + 100, wireY - 50);
                ctx.lineTo(x + 200, wireY + 30);
                ctx.lineTo(x + 300, wireY - 80);
                ctx.lineTo(x + 400, wireY + 50);
                ctx.lineTo(x + 400, this.height);
                ctx.lineTo(x, this.height);
                ctx.fill();
            }
        }
    }

    drawCharacter(character, wireY) {
        const ctx = this.ctx;
        const x = character.x - this.cameraX;
        const y = wireY + character.y;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(character.angle * Math.PI / 180);

        const color = character.color;
        const walkOffset = character.isWalking ? Math.sin(character.animFrame * 2) * 4 : 0;
        const bounce = character.isWalking ? Math.abs(Math.sin(character.animFrame * 2)) * 3 : 0;

        const bodyY = -35 - bounce;

        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-40, bodyY + 10);
        ctx.quadraticCurveTo(0, bodyY + 20, 40, bodyY + 10);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, bodyY + 5, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.lightenColor(color, 20);
        ctx.beginPath();
        ctx.ellipse(-5, bodyY, 6, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath();
        ctx.arc(0, bodyY - 22, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffcba4';
        ctx.beginPath();
        ctx.ellipse(-14, bodyY - 18, 5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(14, bodyY - 18, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-6, bodyY - 24, 6, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(6, bodyY - 24, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-5, bodyY - 23, 3, 0, Math.PI * 2);
        ctx.arc(7, bodyY - 23, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4, bodyY - 24, 1.5, 0, Math.PI * 2);
        ctx.arc(8, bodyY - 24, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e57373';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, bodyY - 15, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-12, bodyY - 15, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(12, bodyY - 15, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, bodyY - 38, 8, Math.PI, 2 * Math.PI);
        ctx.fill();
        ctx.fillRect(-15, bodyY - 38, 30, 5);

        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-14, bodyY);
        ctx.quadraticCurveTo(-28, bodyY + 5 + walkOffset, -30, bodyY + 15 + walkOffset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(14, bodyY);
        ctx.quadraticCurveTo(28, bodyY + 5 - walkOffset, 30, bodyY + 15 - walkOffset);
        ctx.stroke();

        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath();
        ctx.arc(-30, bodyY + 15 + walkOffset, 5, 0, Math.PI * 2);
        ctx.arc(30, bodyY + 15 - walkOffset, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#5a6c7d';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, bodyY + 20);
        ctx.lineTo(-10 - walkOffset, bodyY + 40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(6, bodyY + 20);
        ctx.lineTo(10 + walkOffset, bodyY + 40);
        ctx.stroke();

        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(-10 - walkOffset, bodyY + 44, 8, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(10 + walkOffset, bodyY + 44, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (character.windImmune) {
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.arc(0, bodyY, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();

        if (character.safetyRope) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(x, y - 50);
            ctx.lineTo(x, wireY - 100);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawObstacle(obstacle, wireY) {
        const ctx = this.ctx;
        const x = obstacle.x - this.cameraX;
        const y = obstacle.y;

        ctx.save();

        switch (obstacle.type) {
            case GameConfig.OBSTACLE_TYPES.BIRD:
                this.drawBird(ctx, x, y, obstacle.animFrame);
                break;
            case GameConfig.OBSTACLE_TYPES.ROCK:
                this.drawRock(ctx, x, y, obstacle.rotation);
                break;
            case GameConfig.OBSTACLE_TYPES.WIND:
                this.drawWind(ctx, x, y, obstacle);
                break;
        }

        ctx.restore();
    }

    drawBird(ctx, x, y, animFrame) {
        const wingFlap = Math.sin(animFrame * 0.5) * 15;
        
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.ellipse(x, y, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d3748';
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5);
        ctx.quadraticCurveTo(x - 25, y - 20 - wingFlap, x - 30, y);
        ctx.quadraticCurveTo(x - 20, y + 5, x - 5, y);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 5, y - 5);
        ctx.quadraticCurveTo(x + 25, y - 20 - wingFlap, x + 30, y);
        ctx.quadraticCurveTo(x + 20, y + 5, x + 5, y);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 22, y - 2);
        ctx.lineTo(x + 15, y + 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 5, y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 6, y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRock(ctx, x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, -8);
        ctx.lineTo(15, 5);
        ctx.lineTo(8, 12);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-15, -2);
        ctx.lineTo(-8, -12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.arc(-3, -3, 4, 0, Math.PI * 2);
        ctx.arc(5, 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawWind(ctx, x, y, obstacle) {
        const gradient = ctx.createLinearGradient(x - 40, y, x + 40, y);
        gradient.addColorStop(0, 'rgba(147, 197, 253, 0)');
        gradient.addColorStop(0.5, 'rgba(147, 197, 253, 0.4)');
        gradient.addColorStop(1, 'rgba(147, 197, 253, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x - 40, y - 50, 80, 100);

        ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
        ctx.lineWidth = 2;
        const direction = obstacle.direction;
        for (let i = 0; i < 5; i++) {
            const offsetY = -40 + i * 20;
            ctx.beginPath();
            ctx.moveTo(x - 30, y + offsetY);
            ctx.quadraticCurveTo(x, y + offsetY + direction * 10, x + 30, y + offsetY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + 30 * direction, y + offsetY);
            ctx.lineTo(x + 20 * direction, y + offsetY - 5 * direction);
            ctx.moveTo(x + 30 * direction, y + offsetY);
            ctx.lineTo(x + 20 * direction, y + offsetY + 5 * direction);
            ctx.stroke();
        }
    }

    drawWarningEffect() {
        const ctx = this.ctx;
        const alpha = 0.1 + Math.sin(this.time * 0.01) * 0.05;
        ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawEndPoint(x, wireY) {
        const ctx = this.ctx;
        const screenX = x - this.cameraX;
        
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(screenX - 5, wireY - 150, 10, 150);
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(screenX + 5, wireY - 150);
        ctx.lineTo(screenX + 60, wireY - 120);
        ctx.lineTo(screenX + 5, wireY - 90);
        ctx.fill();
    }
}
