class Track {
    constructor() {
        this.length = GAME_CONSTANTS.TRACK_LENGTH;
        this.playerProgress = 0;
        this.obstacles = [];
        this.powerups = [];
        this.audience = [];
        this.wavePattern = [];
        
        this.generateObstacles();
        this.generatePowerups();
        this.generateAudience();
        this.generateWavePattern();
    }

    generateObstacles() {
        this.obstacles = [];
        // 远处 = 大的 y 值，近处 = 小的 y 值
        // screenY = obstacle.y - playerProgress
        // playerProgress增加，screenY减小，障碍物向上移动
        // 障碍物从屏幕上方（远处y大）向下（近处y小）移动，迎面而来
        let y = this.length - 200;
        
        while (y > 100) {
            const type = this.getRandomObstacleType();
            const x = Utils.random(GAME_CONSTANTS.TRACK_LEFT + 30, GAME_CONSTANTS.TRACK_RIGHT - 60);
            
            this.obstacles.push({
                type: type,
                x: x,
                y: y,
                width: type === 'speedUp' || type === 'slowDown' ? 80 : 40,
                height: type === 'speedUp' || type === 'slowDown' ? 30 : 40
            });
            
            y -= Utils.random(150, 300);
        }
    }

    getRandomObstacleType() {
        const rand = Math.random();
        if (rand < 0.25) return GAME_CONSTANTS.OBSTACLE_TYPES.SPEED_UP;
        if (rand < 0.45) return GAME_CONSTANTS.OBSTACLE_TYPES.SLOW_DOWN;
        if (rand < 0.7) return GAME_CONSTANTS.OBSTACLE_TYPES.BUOY;
        return GAME_CONSTANTS.OBSTACLE_TYPES.ROCK;
    }

    generatePowerups() {
        this.powerups = [];
        let y = this.length - 500;
        
        while (y > 300) {
            const types = Object.values(GAME_CONSTANTS.POWERUP_TYPES);
            const type = types[Utils.randomInt(0, types.length - 1)];
            const x = Utils.random(GAME_CONSTANTS.TRACK_LEFT + 40, GAME_CONSTANTS.TRACK_RIGHT - 80);
            
            this.powerups.push({
                type: type,
                x: x,
                y: y,
                width: 50,
                height: 50,
                collected: false
            });
            
            y -= Utils.random(400, 700);
        }
    }

    generateAudience() {
        this.audience = [];
        for (let y = -500; y < this.length + 500; y += 100) {
            const leftCount = Utils.randomInt(2, 5);
            const rightCount = Utils.randomInt(2, 5);
            
            for (let i = 0; i < leftCount; i++) {
                this.audience.push({
                    x: Utils.random(10, GAME_CONSTANTS.TRACK_LEFT - 20),
                    y: y + Utils.random(-40, 40),
                    color: GAME_CONSTANTS.COLORS.audience[Utils.randomInt(0, 4)],
                    size: Utils.random(8, 15)
                });
            }
            
            for (let i = 0; i < rightCount; i++) {
                this.audience.push({
                    x: Utils.random(GAME_CONSTANTS.TRACK_RIGHT + 10, GAME_CONSTANTS.CANVAS_WIDTH - 15),
                    y: y + Utils.random(-40, 40),
                    color: GAME_CONSTANTS.COLORS.audience[Utils.randomInt(0, 4)],
                    size: Utils.random(8, 15)
                });
            }
        }
    }

    generateWavePattern() {
        this.wavePattern = [];
        for (let i = 0; i < 20; i++) {
            this.wavePattern.push({
                offset: Utils.random(0, GAME_CONSTANTS.TRACK_WIDTH),
                speed: Utils.random(0.5, 1.5),
                amplitude: Utils.random(5, 15)
            });
        }
    }

    update(playerProgress) {
        this.playerProgress = playerProgress;
        
        this.wavePattern.forEach(wave => {
            wave.offset += wave.speed;
            if (wave.offset > GAME_CONSTANTS.TRACK_WIDTH) {
                wave.offset = 0;
            }
        });
    }

    render(ctx) {
        this.renderWater(ctx);
        this.renderTrackBorders(ctx);
        this.renderWaves(ctx);
        this.renderAudience(ctx);
        this.renderObstacles(ctx);
        this.renderPowerups(ctx);
        this.renderFinishLine(ctx);
    }

    renderWater(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#004477');
        gradient.addColorStop(0.5, '#0066aa');
        gradient.addColorStop(1, '#0088cc');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT);
    }

    renderTrackBorders(ctx) {
        ctx.strokeStyle = GAME_CONSTANTS.COLORS.trackBorder;
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 10]);
        
        const dashOffset = -this.playerProgress % 30;
        
        ctx.lineDashOffset = dashOffset;
        ctx.beginPath();
        ctx.moveTo(GAME_CONSTANTS.TRACK_LEFT, 0);
        ctx.lineTo(GAME_CONSTANTS.TRACK_LEFT, GAME_CONSTANTS.CANVAS_HEIGHT);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(GAME_CONSTANTS.TRACK_RIGHT, 0);
        ctx.lineTo(GAME_CONSTANTS.TRACK_RIGHT, GAME_CONSTANTS.CANVAS_HEIGHT);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }

    renderWaves(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        this.wavePattern.forEach((wave, index) => {
            const y = (index * 50 - this.playerProgress * 0.5 + GAME_CONSTANTS.CANVAS_HEIGHT) % GAME_CONSTANTS.CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(GAME_CONSTANTS.TRACK_LEFT, y);
            ctx.quadraticCurveTo(
                GAME_CONSTANTS.TRACK_LEFT + GAME_CONSTANTS.TRACK_WIDTH / 2,
                y + wave.amplitude * Math.sin(wave.offset * 0.1),
                GAME_CONSTANTS.TRACK_RIGHT,
                y
            );
            ctx.stroke();
        });
    }

    renderAudience(ctx) {
        this.audience.forEach(person => {
            const screenY = person.y - this.playerProgress;
            if (screenY > -30 && screenY < GAME_CONSTANTS.CANVAS_HEIGHT + 30) {
                ctx.fillStyle = person.color;
                ctx.beginPath();
                ctx.arc(person.x, screenY, person.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffe0bd';
                ctx.beginPath();
                ctx.arc(person.x, screenY - person.size * 0.8, person.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderObstacles(ctx) {
        this.obstacles.forEach(obstacle => {
            const screenY = obstacle.y - this.playerProgress;
            if (screenY > -100 && screenY < GAME_CONSTANTS.CANVAS_HEIGHT + 100) {
                this.renderObstacle(ctx, obstacle, screenY);
            }
        });
    }

    renderObstacle(ctx, obstacle, y) {
        const x = obstacle.x;
        
        switch (obstacle.type) {
            case GAME_CONSTANTS.OBSTACLE_TYPES.SPEED_UP:
                ctx.fillStyle = GAME_CONSTANTS.COLORS.speedUp;
                ctx.fillRect(x, y, obstacle.width, obstacle.height);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('+3', x + obstacle.width / 2, y + 22);
                break;
                
            case GAME_CONSTANTS.OBSTACLE_TYPES.SLOW_DOWN:
                ctx.fillStyle = GAME_CONSTANTS.COLORS.slowDown;
                ctx.fillRect(x, y, obstacle.width, obstacle.height);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('-2', x + obstacle.width / 2, y + 22);
                break;
                
            case GAME_CONSTANTS.OBSTACLE_TYPES.BUOY:
                ctx.fillStyle = GAME_CONSTANTS.COLORS.buoy;
                ctx.beginPath();
                ctx.ellipse(x + 20, y + 20, 18, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(x + 17, y - 5, 6, 25);
                break;
                
            case GAME_CONSTANTS.OBSTACLE_TYPES.ROCK:
                ctx.fillStyle = GAME_CONSTANTS.COLORS.rock;
                ctx.beginPath();
                ctx.moveTo(x + 20, y);
                ctx.lineTo(x + 40, y + 25);
                ctx.lineTo(x + 35, y + 40);
                ctx.lineTo(x + 5, y + 40);
                ctx.lineTo(x, y + 25);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#888888';
                ctx.beginPath();
                ctx.moveTo(x + 20, y + 5);
                ctx.lineTo(x + 30, y + 20);
                ctx.lineTo(x + 15, y + 25);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }

    renderPowerups(ctx) {
        this.powerups.forEach(powerup => {
            if (powerup.collected) return;
            
            const screenY = powerup.y - this.playerProgress;
            if (screenY > -60 && screenY < GAME_CONSTANTS.CANVAS_HEIGHT + 60) {
                const effect = GAME_CONSTANTS.POWERUP_EFFECTS[powerup.type];
                
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffd700';
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(powerup.x + 25, screenY + 25, 28, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(powerup.x + 25, screenY + 25, 25, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(effect.icon, powerup.x + 25, screenY + 25);
            }
        });
    }

    renderFinishLine(ctx) {
        const screenY = this.length - this.playerProgress;
        if (screenY > -100 && screenY < GAME_CONSTANTS.CANVAS_HEIGHT + 100) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(GAME_CONSTANTS.TRACK_LEFT, screenY, GAME_CONSTANTS.TRACK_WIDTH, 50);
            
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 9; i++) {
                const x = GAME_CONSTANTS.TRACK_LEFT + i * 40 + 20;
                ctx.beginPath();
                ctx.moveTo(x, screenY);
                ctx.lineTo(x + 20, screenY + 25);
                ctx.lineTo(x, screenY + 50);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('FINISH', GAME_CONSTANTS.CANVAS_WIDTH / 2, screenY + 32);
        }
    }

    getObstaclesInRange(y, range) {
        return this.obstacles.filter(obs => 
            Math.abs(obs.y - y) < range
        );
    }

    getPowerupsInRange(y, range) {
        return this.powerups.filter(p => 
            !p.collected && Math.abs(p.y - y) < range
        );
    }

    getFinishY() {
        return this.length;
    }

    reset() {
        this.playerProgress = 0;
        this.generateObstacles();
        this.generatePowerups();
    }
}