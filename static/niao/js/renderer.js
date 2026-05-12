class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CONFIG.CANVAS_WIDTH;
        this.height = CONFIG.CANVAS_HEIGHT;
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(0.7, '#8B4513');
        gradient.addColorStop(1, '#654321');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(100, 630, 60, 0, Math.PI * 2);
        this.ctx.arc(250, 640, 50, 0, Math.PI * 2);
        this.ctx.arc(400, 635, 55, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSlingshot(slingshot) {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(slingshot.x, slingshot.y + 80);
        this.ctx.lineTo(slingshot.x, slingshot.y - 20);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(slingshot.x - 40, slingshot.y + 60);
        this.ctx.lineTo(slingshot.x, slingshot.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(slingshot.x + 40, slingshot.y + 60);
        this.ctx.lineTo(slingshot.x, slingshot.y);
        this.ctx.stroke();

        if (slingshot.isPulling) {
            this.ctx.strokeStyle = '#4A4A4A';
            this.ctx.lineWidth = 4;
            
            this.ctx.beginPath();
            this.ctx.moveTo(slingshot.x - 20, slingshot.y - 10);
            this.ctx.lineTo(slingshot.pullX, slingshot.pullY);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(slingshot.x + 20, slingshot.y - 10);
            this.ctx.lineTo(slingshot.pullX, slingshot.pullY);
            this.ctx.stroke();
        }
    }

    drawBird(bird) {
        if (!bird.isAlive) return;

        this.ctx.save();
        this.ctx.translate(bird.position.x, bird.position.y);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = bird.color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(-bird.radius * 0.3, -bird.radius * 0.2, bird.radius * 0.25, 0, Math.PI * 2);
        this.ctx.arc(bird.radius * 0.3, -bird.radius * 0.2, bird.radius * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(-bird.radius * 0.3, -bird.radius * 0.2, bird.radius * 0.12, 0, Math.PI * 2);
        this.ctx.arc(bird.radius * 0.3, -bird.radius * 0.2, bird.radius * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -bird.radius * 0.1);
        this.ctx.lineTo(bird.radius * 0.4, 0);
        this.ctx.lineTo(0, bird.radius * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPig(pig) {
        if (!pig.isAlive) return;

        this.ctx.save();
        this.ctx.translate(pig.position.x, pig.position.y);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, pig.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = pig.color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#2E8B57';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.ellipse(-pig.radius * 0.7, pig.radius * 0.1, pig.radius * 0.2, pig.radius * 0.15, 0, 0, Math.PI * 2);
        this.ctx.ellipse(pig.radius * 0.7, pig.radius * 0.1, pig.radius * 0.2, pig.radius * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.ellipse(0, pig.radius * 0.3, pig.radius * 0.2, pig.radius * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-pig.radius * 0.06, pig.radius * 0.3, pig.radius * 0.05, 0, Math.PI * 2);
        this.ctx.arc(pig.radius * 0.06, pig.radius * 0.3, pig.radius * 0.05, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(-pig.radius * 0.25, -pig.radius * 0.2, pig.radius * 0.18, 0, Math.PI * 2);
        this.ctx.arc(pig.radius * 0.25, -pig.radius * 0.2, pig.radius * 0.18, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(-pig.radius * 0.25, -pig.radius * 0.2, pig.radius * 0.08, 0, Math.PI * 2);
        this.ctx.arc(pig.radius * 0.25, -pig.radius * 0.2, pig.radius * 0.08, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#2E8B57';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, pig.radius * 0.5, pig.radius * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();

        if (pig.type === 'HELMET') {
            this.ctx.fillStyle = '#696969';
            this.ctx.beginPath();
            this.ctx.arc(0, -pig.radius * 0.3, pig.radius * 0.6, Math.PI, 0);
            this.ctx.fill();
        }

        if (pig.type === 'KING') {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.moveTo(-pig.radius * 0.6, -pig.radius * 0.5);
            this.ctx.lineTo(-pig.radius * 0.4, -pig.radius * 0.9);
            this.ctx.lineTo(-pig.radius * 0.2, -pig.radius * 0.6);
            this.ctx.lineTo(0, -pig.radius * 1);
            this.ctx.lineTo(pig.radius * 0.2, -pig.radius * 0.6);
            this.ctx.lineTo(pig.radius * 0.4, -pig.radius * 0.9);
            this.ctx.lineTo(pig.radius * 0.6, -pig.radius * 0.5);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawBlock(block) {
        if (!block.isAlive) return;

        this.ctx.save();
        this.ctx.translate(block.position.x, block.position.y);

        this.ctx.fillStyle = block.color;
        this.ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height);

        if (block.health < block.maxHealth) {
            const healthPercent = block.health / block.maxHealth;
            this.ctx.strokeStyle = '#8B0000';
            this.ctx.lineWidth = 1;

            if (healthPercent < 0.66) {
                this.ctx.beginPath();
                this.ctx.moveTo(-block.width / 4, -block.height / 2);
                this.ctx.lineTo(0, block.height / 4);
                this.ctx.stroke();
            }
            if (healthPercent < 0.33) {
                this.ctx.beginPath();
                this.ctx.moveTo(block.width / 4, -block.height / 2);
                this.ctx.lineTo(0, block.height / 3);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawTrajectory(points) {
        if (!points || points.length < 2) return;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawParticle(particle) {
        if (!particle.isAlive()) return;

        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawExplosion(x, y, radius, progress = 1) {
        this.ctx.save();
        
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * progress);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * progress, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawBirdQueue(birds, startX, startY) {
        const spacing = 50;
        birds.forEach((birdType, index) => {
            const config = CONFIG.BIRD_TYPES[birdType];
            const x = startX + index * spacing;
            const y = startY;

            this.ctx.save();
            this.ctx.translate(x, y);

            this.ctx.beginPath();
            this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            this.ctx.fillStyle = config.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawScore(score, x, y) {
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`分数: ${score}`, x, y);
        this.ctx.fillText(`分数: ${score}`, x, y);
    }

    drawEgg(egg) {
        if (!egg.isAlive) return;

        this.ctx.save();
        this.ctx.translate(egg.position.x, egg.position.y);

        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, egg.radius, egg.radius * 1.3, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = egg.color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#DDD';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }
}
