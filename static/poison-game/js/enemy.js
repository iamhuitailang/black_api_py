class Enemy {
    constructor(type, x, y, gameMap) {
        this.type = type;
        this.config = CONFIG.ENEMY_TYPES[type];
        this.x = x + 0.5;
        this.y = y + 0.5;
        this.gameMap = gameMap;

        this.patrolPoints = this.generatePatrolPoints();
        this.currentPatrolIndex = 0;
        this.attackCooldown = 0;
        this.state = 'patrol';
        this.attackTarget = null;

        this.direction = { x: 1, y: 0 };
    }

    generatePatrolPoints() {
        const points = [];
        const range = 3;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        for (let i = 0; i < 4; i++) {
            let attempts = 0;
            while (attempts < 20) {
                attempts++;
                const px = baseX + Math.floor(Math.random() * range * 2) - range;
                const py = baseY + Math.floor(Math.random() * range * 2) - range;
                if (this.gameMap.canMove(px + 0.5, py + 0.5)) {
                    points.push({ x: px + 0.5, y: py + 0.5 });
                    break;
                }
            }
        }

        if (points.length === 0) {
            points.push({ x: this.x, y: this.y });
        }

        return points;
    }

    update(deltaTime, player, gameMap) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        const distToPlayer = Math.sqrt(
            Math.pow(player.x - this.x, 2) +
            Math.pow(player.y - this.y, 2)
        );

        const playerInVision = gameMap.isInVision(this.x, this.y, player.x, player.y);

        if (distToPlayer < this.config.attackRange && playerInVision) {
            this.state = 'attack';
            this.attackTarget = player;
        } else if (distToPlayer < 6 && playerInVision) {
            this.state = 'chase';
            this.attackTarget = player;
        } else {
            this.state = 'patrol';
            this.attackTarget = null;
        }

        switch (this.state) {
            case 'patrol':
                this.patrol(deltaTime, gameMap);
                break;
            case 'chase':
                this.chase(deltaTime, player, gameMap);
                break;
            case 'attack':
                this.attack(deltaTime, player, gameMap);
                break;
        }
    }

    patrol(deltaTime, gameMap) {
        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.3) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            return;
        }

        this.moveToward(dx / dist, dy / dist, deltaTime, gameMap);
    }

    chase(deltaTime, player, gameMap) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
            this.moveToward(dx / dist, dy / dist, deltaTime * 1.2, gameMap);
        }
    }

    attack(deltaTime, player, gameMap) {
        if (this.attackCooldown <= 0) {
            this.performAttack(player, gameMap);
            this.attackCooldown = this.config.attackCooldown;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.config.attackRange * 0.8 && dist > 0.1) {
            this.moveToward(dx / dist, dy / dist, deltaTime * 0.5, gameMap);
        }
    }

    performAttack(player, gameMap) {
        switch (this.type) {
            case 'BUG':
                player.takeDamage(this.config.damage);
                player.applyPoisonBoost(this.config.poisonBoostTime);
                break;
            case 'FROG':
                player.takeDamage(this.config.damage);
                gameMap.addPoisonPool(player.x, player.y, this.config.poisonPoolTime);
                break;
            case 'BEE':
                player.takeDamage(this.config.damage);
                break;
        }
    }

    moveToward(dx, dy, deltaTime, gameMap) {
        this.direction = { x: dx, y: dy };
        const moveDistance = this.config.speed * deltaTime;
        const newX = this.x + dx * moveDistance;
        const newY = this.y + dy * moveDistance;

        if (gameMap.canMove(newX, this.y)) {
            this.x = newX;
        }
        if (gameMap.canMove(this.x, newY)) {
            this.y = newY;
        }
    }

    render(ctx, playerX, playerY, gameMap) {
        const tileSize = CONFIG.TILE_SIZE;
        const px = this.x * tileSize;
        const py = this.y * tileSize;

        const inVision = gameMap.isInVision(this.x, this.y, playerX, playerY);
        if (!inVision) return;

        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, tileSize * 0.6);
        gradient.addColorStop(0, this.config.color + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(px - tileSize / 2, py - tileSize / 2, tileSize * 2, tileSize * 2);

        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(px, py, tileSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ff0000';
        const eyeSize = tileSize * 0.08;
        const eyeOffset = tileSize * 0.1;
        ctx.beginPath();
        ctx.arc(px - eyeOffset, py - eyeOffset * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.arc(px + eyeOffset, py - eyeOffset * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        if (this.state === 'attack' || this.state === 'chase') {
            ctx.strokeStyle = `rgba(220, 20, 60, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(px, py, tileSize * (0.4 + pulse * 0.1), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    generateEnemies(levelConfig, gameMap) {
        this.enemies = [];

        for (const [type, count] of Object.entries(levelConfig.enemies)) {
            for (let i = 0; i < count; i++) {
                let placed = false;
                let attempts = 0;

                while (!placed && attempts < 100) {
                    attempts++;
                    let x, y;

                    if (type === 'BEE') {
                        x = Math.floor(Math.random() * (CONFIG.MAP_WIDTH - 8)) + 4;
                        y = Math.floor(Math.random() * (CONFIG.MAP_HEIGHT - 4)) + 2;
                    } else {
                        x = Math.floor(Math.random() * (CONFIG.MAP_WIDTH - 4)) + 2;
                        y = Math.floor(Math.random() * (CONFIG.MAP_HEIGHT - 4)) + 2;
                    }

                    if (x < CONFIG.ZONES.ENTRY.cols) continue;
                    if (!gameMap.canMove(x + 0.5, y + 0.5)) continue;

                    const distToEntry = Math.abs(x - gameMap.entry.x) + Math.abs(y - gameMap.entry.y);
                    if (distToEntry < 4) continue;

                    const tooClose = this.enemies.some(e =>
                        Math.abs(e.x - x - 0.5) < 2 && Math.abs(e.y - y - 0.5) < 2
                    );
                    if (tooClose) continue;

                    this.enemies.push(new Enemy(type, x, y, gameMap));
                    placed = true;
                }
            }
        }

        return this.enemies;
    }

    update(deltaTime, player, gameMap) {
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, player, gameMap);
        });
    }

    render(ctx, playerX, playerY, gameMap) {
        this.enemies.forEach(enemy => {
            enemy.render(ctx, playerX, playerY, gameMap);
        });
    }

    reset() {
        this.enemies = [];
    }
}
