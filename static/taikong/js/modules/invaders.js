class InvaderManager {
    constructor(canvas, level = 1) {
        this.canvas = canvas;
        this.level = level;
        this.invaders = [];
        this.direction = 1;
        this.speed = CONFIG.INVADERS.BASE_SPEED;
        this.moveTimer = 0;
        this.lastShot = Date.now();
        this.shootInterval = CONFIG.INVADERS.SHOOT_INTERVAL;
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        this.init();
    }

    init() {
        const { ROWS, COLS, WIDTH, HEIGHT, PADDING, START_X, START_Y, TYPES } = CONFIG.INVADERS;
        
        this.invaders = [];
        
        for (let row = 0; row < ROWS; row++) {
            this.invaders[row] = [];
            const typeIndex = Math.min(row, TYPES.length - 1);
            const type = TYPES[typeIndex];
            
            for (let col = 0; col < COLS; col++) {
                this.invaders[row][col] = {
                    x: START_X + col * (WIDTH + PADDING),
                    y: START_Y + row * (HEIGHT + PADDING),
                    width: WIDTH,
                    height: HEIGHT,
                    type: type.name,
                    points: type.points,
                    color: type.color,
                    alive: true
                };
            }
        }

        const levelMultiplier = Math.pow(CONFIG.GAME.LEVEL_SPEED_MULTIPLIER, this.level - 1);
        this.speed = CONFIG.INVADERS.BASE_SPEED * levelMultiplier;
        this.shootInterval = Math.max(
            CONFIG.INVADERS.MIN_SHOOT_INTERVAL,
            CONFIG.INVADERS.SHOOT_INTERVAL * Math.pow(CONFIG.GAME.SHOOT_INTERVAL_DECREASE, this.level - 1)
        );
    }

    update() {
        this.animationTimer++;
        if (this.animationTimer > 30) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTimer = 0;
        }

        this.moveTimer++;
        const aliveCount = this.getAliveCount();
        const totalCount = CONFIG.INVADERS.ROWS * CONFIG.INVADERS.COLS;
        const killPercent = (totalCount - aliveCount) / totalCount;
        
        const baseThreshold = 35;
        const moveThreshold = Math.max(8, baseThreshold - killPercent * baseThreshold * 0.7);
        
        if (this.moveTimer >= moveThreshold) {
            this.move();
            this.moveTimer = 0;
        }

        const shootChance = 0.015 + killPercent * 0.025;
        if (Math.random() < shootChance && Date.now() - this.lastShot > this.shootInterval * 0.5) {
            const bullet = this.shoot();
            if (bullet) {
                this.lastShot = Date.now();
                return bullet;
            }
        }
        return null;
    }

    move() {
        let shouldMoveDown = false;
        const aliveCount = this.getAliveCount();
        const totalCount = CONFIG.INVADERS.ROWS * CONFIG.INVADERS.COLS;
        const killPercent = (totalCount - aliveCount) / totalCount;
        
        const currentSpeed = this.speed + killPercent * 3;

        for (let row = 0; row < this.invaders.length; row++) {
            for (let col = 0; col < this.invaders[row].length; col++) {
                const invader = this.invaders[row][col];
                if (!invader || !invader.alive) continue;

                invader.x += currentSpeed * this.direction;

                if (invader.x <= 5 || invader.x + invader.width >= this.canvas.width - 5) {
                    shouldMoveDown = true;
                }
            }
        }

        if (shouldMoveDown) {
            this.direction *= -1;
            for (let row = 0; row < this.invaders.length; row++) {
                for (let col = 0; col < this.invaders[row].length; col++) {
                    const invader = this.invaders[row][col];
                    if (!invader || !invader.alive) continue;
                    invader.x += currentSpeed * this.direction;
                    invader.y += CONFIG.INVADERS.DOWN_STEP;
                }
            }
        }
    }

    shoot() {
        const shooters = [];
        const totalCount = CONFIG.INVADERS.ROWS * CONFIG.INVADERS.COLS;
        const aliveCount = this.getAliveCount();
        const killPercent = (totalCount - aliveCount) / totalCount;
        
        for (let col = 0; col < this.invaders[0].length; col++) {
            for (let row = this.invaders.length - 1; row >= 0; row--) {
                const invader = this.invaders[row][col];
                if (invader && invader.alive) {
                    const rowBonus = row * 0.15;
                    shooters.push({ invader, priority: 1 + rowBonus + killPercent });
                    break;
                }
            }
        }

        if (shooters.length > 0) {
            let totalPriority = shooters.reduce((sum, s) => sum + s.priority, 0);
            let random = Math.random() * totalPriority;
            let selectedShooter = shooters[0].invader;
            
            for (const shooter of shooters) {
                random -= shooter.priority;
                if (random <= 0) {
                    selectedShooter = shooter.invader;
                    break;
                }
            }

            const bulletSpeed = CONFIG.INVADERS.BULLET_SPEED * (1 + killPercent * 0.5) * 
                              Math.pow(CONFIG.GAME.BULLET_SPEED_INCREASE, this.level - 1);
            
            let bulletColor;
            if (selectedShooter.type === 'small') {
                bulletColor = '#88ffff';
            } else if (selectedShooter.type === 'medium') {
                bulletColor = '#ffff66';
            } else {
                bulletColor = '#ff6644';
            }

            return {
                x: selectedShooter.x + selectedShooter.width / 2 - 2,
                y: selectedShooter.y + selectedShooter.height,
                speed: bulletSpeed,
                color: bulletColor
            };
        }
        return null;
    }

    draw(ctx) {
        for (let row = 0; row < this.invaders.length; row++) {
            for (let col = 0; col < this.invaders[row].length; col++) {
                const invader = this.invaders[row][col];
                if (!invader || !invader.alive) continue;

                this.drawInvader(ctx, invader);
            }
        }
    }

    drawInvader(ctx, invader) {
        ctx.fillStyle = invader.color;
        const wobble = this.animationFrame === 0 ? 0 : 2;
        const cx = invader.x + invader.width / 2;
        const cy = invader.y + invader.height / 2;

        if (invader.type === 'small') {
            ctx.beginPath();
            ctx.moveTo(cx, invader.y + 5);
            ctx.bezierCurveTo(cx - 18, invader.y + 10, cx - 20, invader.y + 25, cx - 15, invader.y + 30);
            ctx.bezierCurveTo(cx - 5, invader.y + 35, cx + 5, invader.y + 35, cx + 15, invader.y + 30);
            ctx.bezierCurveTo(cx + 20, invader.y + 25, cx + 18, invader.y + 10, cx, invader.y + 5);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 7, cy, 4, 0, Math.PI * 2);
            ctx.arc(cx + 7, cy, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(cx - 7, cy, 2, 0, Math.PI * 2);
            ctx.arc(cx + 7, cy, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = invader.color;
            ctx.beginPath();
            ctx.ellipse(cx - 18 + wobble, invader.y + 28, 4, 6, -0.3, 0, Math.PI * 2);
            ctx.ellipse(cx + 18 - wobble, invader.y + 28, 4, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (invader.type === 'medium') {
            ctx.beginPath();
            ctx.ellipse(cx, cy + 2, invader.width / 2, invader.height / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(cx - 18, invader.y + invader.height - 8 + wobble, 5, 8, -0.4, 0, Math.PI * 2);
            ctx.ellipse(cx + 18, invader.y + invader.height - 8 - wobble, 5, 8, 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(cx - 8, cy - 2, 5, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 8, cy - 2, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(cx - 8, cy - 1, 2, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 1, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx, invader.y);
            ctx.lineTo(invader.x + 5, invader.y + 12);
            ctx.lineTo(invader.x, invader.y + 20);
            ctx.lineTo(invader.x + 8, invader.y + 28);
            ctx.lineTo(invader.x + 15, invader.y + 25);
            ctx.lineTo(cx, invader.y + 32);
            ctx.lineTo(invader.x + invader.width - 15, invader.y + 25);
            ctx.lineTo(invader.x + invader.width - 8, invader.y + 28);
            ctx.lineTo(invader.x + invader.width, invader.y + 20);
            ctx.lineTo(invader.x + invader.width - 5, invader.y + 12);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#aaffaa';
            ctx.beginPath();
            ctx.arc(cx - 8, invader.y + 15, 4, 0, Math.PI * 2);
            ctx.arc(cx + 8, invader.y + 15, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(cx - 8, invader.y + 15, 2, 0, Math.PI * 2);
            ctx.arc(cx + 8, invader.y + 15, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = invader.color;
            ctx.beginPath();
            ctx.moveTo(cx - 20, invader.y + 18);
            ctx.lineTo(cx - 25 + wobble, invader.y + 25);
            ctx.lineTo(cx - 15, invader.y + 22);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(cx + 20, invader.y + 18);
            ctx.lineTo(cx + 25 - wobble, invader.y + 25);
            ctx.lineTo(cx + 15, invader.y + 22);
            ctx.fill();
        }
    }

    checkCollision(bullet) {
        for (let row = 0; row < this.invaders.length; row++) {
            for (let col = 0; col < this.invaders[row].length; col++) {
                const invader = this.invaders[row][col];
                if (!invader || !invader.alive) continue;

                if (Utils.checkCollision(bullet, invader)) {
                    invader.alive = false;
                    return invader;
                }
            }
        }
        return null;
    }

    checkPlayerCollision(playerRect) {
        for (let row = 0; row < this.invaders.length; row++) {
            for (let col = 0; col < this.invaders[row].length; col++) {
                const invader = this.invaders[row][col];
                if (!invader || !invader.alive) continue;

                if (Utils.checkCollision(invader, playerRect)) {
                    return true;
                }
            }
        }
        return false;
    }

    hasReachedBottom() {
        for (let row = 0; row < this.invaders.length; row++) {
            for (let col = 0; col < this.invaders[row].length; col++) {
                const invader = this.invaders[row][col];
                if (!invader || !invader.alive) continue;

                if (invader.y + invader.height >= this.canvas.height - 50) {
                    return true;
                }
            }
        }
        return false;
    }

    getAliveCount() {
        let count = 0;
        for (let row = 0; row < this.invaders.length; row++) {
            for (let col = 0; col < this.invaders[row].length; col++) {
                if (this.invaders[row][col] && this.invaders[row][col].alive) {
                    count++;
                }
            }
        }
        return count;
    }

    allDead() {
        return this.getAliveCount() === 0;
    }
}