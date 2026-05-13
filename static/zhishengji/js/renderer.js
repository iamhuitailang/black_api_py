class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground(level, time) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        switch (level.background) {
            case 'mountain':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.6, '#B0E0E6');
                gradient.addColorStop(1, '#90EE90');
                break;
            case 'flood':
                gradient.addColorStop(0, '#708090');
                gradient.addColorStop(0.5, '#B0C4DE');
                gradient.addColorStop(1, '#4682B4');
                break;
            case 'fire':
                gradient.addColorStop(0, '#8B0000');
                gradient.addColorStop(0.3, '#FF6347');
                gradient.addColorStop(0.6, '#FFD700');
                gradient.addColorStop(1, '#87CEEB');
                break;
            case 'complex':
                gradient.addColorStop(0, '#4A90A4');
                gradient.addColorStop(0.4, '#7CB9A8');
                gradient.addColorStop(0.7, '#B8D4B0');
                gradient.addColorStop(1, '#E8F5E9');
                break;
            case 'war':
                gradient.addColorStop(0, '#2C3E50');
                gradient.addColorStop(0.3, '#5D6D7E');
                gradient.addColorStop(0.6, '#85929E');
                gradient.addColorStop(1, '#AEB6BF');
                break;
            default:
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#E0F6FF');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawClouds(time);
    }

    drawClouds(time) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cloudPositions = [
            { x: (time * 0.01) % (this.canvas.width + 200) - 100, y: 50 },
            { x: (time * 0.005 + 300) % (this.canvas.width + 200) - 100, y: 100 },
            { x: (time * 0.008 + 600) % (this.canvas.width + 200) - 100, y: 80 }
        ];

        cloudPositions.forEach(pos => {
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
            this.ctx.arc(pos.x + 30, pos.y - 10, 35, 0, Math.PI * 2);
            this.ctx.arc(pos.x + 60, pos.y, 30, 0, Math.PI * 2);
            this.ctx.arc(pos.x + 30, pos.y + 10, 25, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawGround(groundY) {
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
        
        this.ctx.fillStyle = '#32CD32';
        for (let i = 0; i < this.canvas.width; i += 20) {
            this.ctx.fillRect(i, groundY, 10, 5);
        }
    }

    drawSafeZone(safeZone, radius) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.arc(safeZone.x, safeZone.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.fillStyle = '#006400';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏥 安全区', safeZone.x, safeZone.y + radius + 20);
    }

    drawHelicopter(helicopter) {
        const centerX = helicopter.x + helicopter.width / 2;
        const centerY = helicopter.y + helicopter.height / 2;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(helicopter.rotation);

        if (helicopter.fuelLeak && Math.random() > 0.5) {
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(0, helicopter.height / 2 + 10, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = helicopter.isCrashed ? '#8B0000' : '#4169E1';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, helicopter.width / 2, helicopter.height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#87CEEB';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -5, helicopter.width / 4, helicopter.height / 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.fillRect(-helicopter.width / 2 - 15, -5, 20, 10);

        this.ctx.save();
        this.ctx.rotate(helicopter.bladeAngle);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-helicopter.width / 2 - 5, -2, helicopter.width + 10, 4);
        this.ctx.fillRect(-2, -helicopter.width / 2 - 5, 4, helicopter.width + 10);
        this.ctx.restore();

        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, helicopter.height / 3);
        this.ctx.lineTo(0, helicopter.height / 3 + helicopter.ropeLength);
        this.ctx.stroke();

        if (helicopter.ropeLength > 0) {
            this.ctx.fillStyle = '#696969';
            this.ctx.beginPath();
            this.ctx.arc(0, helicopter.height / 3 + helicopter.ropeLength, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();

        if (helicopter.damageLevel > 0) {
            this.ctx.fillStyle = '#8B0000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('⚠️'.repeat(helicopter.damageLevel), helicopter.x, helicopter.y - 10);
        }
    }

    drawRescueTarget(target) {
        if (target.rescued || target.state === 'dead') return;

        const centerX = target.x + target.width / 2;
        const centerY = target.y + target.height / 2;

        if (target.state === 'waiting') {
            this.ctx.save();
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(target.emoji, centerX, centerY);

        if (target.hasTimer && target.state === 'waiting') {
            const progress = target.timer / target.initialTimer;
            this.ctx.fillStyle = progress > 0.3 ? '#00FF00' : '#FF0000';
            this.ctx.fillRect(target.x, target.y - 10, target.width * progress, 5);
        }

        if (target.state === 'climbing') {
            const progress = target.climbProgress / target.climbTime;
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(target.x, target.y - 10, target.width * progress, 5);
        }
    }

    drawObstacle(obstacle) {
        this.ctx.save();

        switch (obstacle.type) {
            case 'mountain':
                this.ctx.fillStyle = '#6B8E6B';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width / 3, obstacle.y + obstacle.height * 0.2);
                this.ctx.lineTo(obstacle.x + obstacle.width * 2 / 3, obstacle.y + obstacle.height * 0.2);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'building':
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                this.ctx.fillStyle = '#FFFF00';
                for (let row = 0; row < obstacle.height / 30; row++) {
                    for (let col = 0; col < obstacle.width / 25; col++) {
                        if (Math.random() > 0.3) {
                            this.ctx.fillRect(
                                obstacle.x + 5 + col * 25,
                                obstacle.y + 10 + row * 30,
                                15, 20
                            );
                        }
                    }
                }
                break;

            case 'powerline':
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height / 2);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
                this.ctx.stroke();
                break;

            case 'turbulence':
                this.ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2,
                    obstacle.width / 2,
                    0, Math.PI * 2
                );
                this.ctx.fill();

                this.ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)';
                this.ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(
                        obstacle.x + obstacle.width / 2,
                        obstacle.y + obstacle.height / 2,
                        obstacle.width / 4 + i * 10,
                        0, Math.PI * 2
                    );
                    this.ctx.stroke();
                }
                break;

            case 'bird':
                this.ctx.font = '40px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🦅', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                break;

            case 'enemyFire':
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2,
                    obstacle.width / 2,
                    0, Math.PI * 2
                );
                this.ctx.fill();

                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('💥', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                break;
        }

        this.ctx.restore();
    }

    drawGameOver(isVictory, score) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = isVictory ? '#00FF00' : '#FF0000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(isVictory ? '🏆 任务完成！' : '💥 任务失败', this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`最终得分: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.restore();
    }
}