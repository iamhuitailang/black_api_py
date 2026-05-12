class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;

        switch (this.type) {
            case 'ground':
                const gradient = ctx.createLinearGradient(drawX, this.y, drawX, this.y + this.height);
                gradient.addColorStop(0, '#228B22');
                gradient.addColorStop(0.3, '#32CD32');
                gradient.addColorStop(1, '#8B4513');
                ctx.fillStyle = gradient;
                ctx.fillRect(drawX, this.y, this.width, this.height);
                
                ctx.fillStyle = '#90EE90';
                for (let i = 0; i < this.width; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + i, this.y);
                    ctx.lineTo(drawX + i + 5, this.y - 8);
                    ctx.lineTo(drawX + i + 10, this.y);
                    ctx.fill();
                }
                break;

            case 'metal':
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(drawX, this.y, this.width, this.height);
                
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(drawX + 5, this.y + 5, this.width - 10, 3);
                ctx.fillRect(drawX + 5, this.y + this.height - 8, this.width - 10, 3);
                
                ctx.strokeStyle = '#3a3a3a';
                ctx.lineWidth = 1;
                for (let i = 20; i < this.width; i += 30) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + i, this.y);
                    ctx.lineTo(drawX + i, this.y + this.height);
                    ctx.stroke();
                }
                break;

            case 'speed':
                ctx.fillStyle = '#00BFFF';
                ctx.fillRect(drawX, this.y, this.width, this.height);
                
                ctx.fillStyle = '#FFD700';
                for (let i = 10; i < this.width - 10; i += 30) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + i, this.y + this.height / 2 - 5);
                    ctx.lineTo(drawX + i + 15, this.y + this.height / 2);
                    ctx.lineTo(drawX + i, this.y + this.height / 2 + 5);
                    ctx.fill();
                }
                break;

            case 'cloud':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.ellipse(drawX + this.width / 2, this.y + this.height / 2, 
                           this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(drawX + this.width * 0.2, this.y + this.height * 0.4, 15, 0, Math.PI * 2);
                ctx.arc(drawX + this.width * 0.8, this.y + this.height * 0.4, 15, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                ctx.fillStyle = CONFIG.COLORS.platform;
                ctx.fillRect(drawX, this.y, this.width, this.height);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(drawX, this.y, this.width, this.height);
        }
    }
}

class Level {
    constructor(levelData) {
        this.id = levelData.id;
        this.name = levelData.name;
        this.type = levelData.type;
        this.length = levelData.length;
        this.hasBoss = levelData.boss;
        
        this.platforms = [];
        this.rings = [];
        this.enemies = [];
        this.powerUps = [];
        this.springs = [];
        this.goal = null;
        
        this.cameraX = 0;
        this.time = 0;
        this.collectedRings = 0;
        this.defeatedEnemies = 0;
        
        this.randomSeed = this.id * 12345;
        
        this.generate();
    }

    seededRandom() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
    }

    generate() {
        const groundY = 550;
        
        let currentX = 0;
        const segmentLength = 300;
        const totalSegments = Math.ceil(this.length / segmentLength);

        for (let i = 0; i < totalSegments; i++) {
            const segmentType = this.getSegmentType(i);
            
            switch (segmentType) {
                case 'flat':
                    this.addGroundSegment(currentX, groundY, segmentLength);
                    break;
                case 'hills':
                    this.addHillSegment(currentX, groundY, segmentLength);
                    break;
                case 'platforms':
                    this.addPlatformSegment(currentX, groundY, segmentLength);
                    break;
                case 'loop':
                    this.addLoopSegment(currentX, groundY);
                    break;
                case 'boss':
                    this.addBossArena(currentX, groundY);
                    break;
            }

            currentX += segmentLength;
        }

        this.goal = new Goal(this.length - 100, groundY - 150);
        this.generateRings();
        this.generateEnemies();
        this.generatePowerUps();
        this.generateSprings();
    }

    getSegmentType(index) {
        if (this.hasBoss && index === Math.floor(this.length / 300) - 1) {
            return 'boss';
        }
        
        const types = ['flat', 'flat', 'hills', 'platforms', 'platforms'];
        return types[index % types.length];
    }

    addGroundSegment(startX, groundY, length) {
        this.platforms.push(new Platform(startX, groundY, length, 50, 'ground'));
    }

    addHillSegment(startX, groundY, length) {
        this.platforms.push(new Platform(startX, groundY, length * 0.4, 50, 'ground'));
        
        const hillHeight = 80;
        this.platforms.push(new Platform(
            startX + length * 0.35, 
            groundY - hillHeight, 
            length * 0.3, 
            50 + hillHeight, 
            'ground'
        ));
        
        this.platforms.push(new Platform(startX + length * 0.6, groundY, length * 0.4, 50, 'ground'));
    }

    addPlatformSegment(startX, groundY, length) {
        this.platforms.push(new Platform(startX, groundY, length, 50, 'ground'));
        
        const platformY = groundY - 120;
        this.platforms.push(new Platform(startX + 80, platformY, 100, 20, 'normal'));
        this.platforms.push(new Platform(startX + 220, platformY - 50, 80, 20, 'normal'));
    }

    addLoopSegment(startX, groundY) {
        this.platforms.push(new Platform(startX, groundY, 150, 50, 'ground'));
        this.platforms.push(new Platform(startX + 250, groundY, 150, 50, 'ground'));
    }

    addBossArena(startX, groundY) {
        this.platforms.push(new Platform(startX, groundY, 500, 50, 'metal'));
        
        this.platforms.push(new Platform(startX + 50, groundY - 100, 100, 20, 'metal'));
        this.platforms.push(new Platform(startX + 350, groundY - 100, 100, 20, 'metal'));
        this.platforms.push(new Platform(startX + 200, groundY - 180, 100, 20, 'metal'));
    }

    generateRings() {
        const ringPositions = [];
        
        for (let x = 200; x < this.length - 200; x += 150) {
            const pattern = Math.floor(this.seededRandom() * 4);
            
            switch (pattern) {
                case 0:
                    for (let i = 0; i < 5; i++) {
                        ringPositions.push({ x: x + i * 40, y: 450 });
                    }
                    break;
                case 1:
                    for (let i = 0; i < 5; i++) {
                        ringPositions.push({ x: x + i * 30, y: 450 - i * 30 });
                    }
                    break;
                case 2:
                    ringPositions.push({ x: x, y: 400 });
                    ringPositions.push({ x: x + 60, y: 380 });
                    ringPositions.push({ x: x + 120, y: 400 });
                    break;
                case 3:
                    for (let i = 0; i < 3; i++) {
                        ringPositions.push({ x: x, y: 450 - i * 40 });
                    }
                    break;
            }
        }

        for (const pos of ringPositions) {
            this.rings.push(new Ring(pos.x, pos.y));
        }
    }

    generateEnemies() {
        const enemyTypes = ['crawler', 'flyer', 'turret', 'drill'];
        
        for (let x = 400; x < this.length - 400; x += 300 + this.seededRandom() * 200) {
            const type = enemyTypes[Math.floor(this.seededRandom() * enemyTypes.length)];
            let y = 510;
            
            if (type === 'flyer') {
                y = 400 + this.seededRandom() * 100;
            }
            
            this.enemies.push(new Enemy(x, y, type));
        }

        if (this.hasBoss) {
            this.enemies.push(new Enemy(this.length - 300, 450, 'boss'));
        }
    }

    generatePowerUps() {
        const powerUpTypes = ['shield', 'invincibility', 'speed', '1up'];
        
        for (let x = 600; x < this.length - 300; x += 500 + this.seededRandom() * 300) {
            const type = powerUpTypes[Math.floor(this.seededRandom() * powerUpTypes.length)];
            this.powerUps.push(new PowerUp(x, 400 + this.seededRandom() * 50, type));
        }
    }

    generateSprings() {
        for (let x = 300; x < this.length - 200; x += 250 + this.seededRandom() * 200) {
            this.springs.push(new Spring(x, 525));
        }
    }

    update(player, input) {
        this.time += 1 / 60;

        for (const spring of this.springs) {
            spring.update();
            
            if (Physics.checkCollision(player, spring) && player.vy > 0) {
                spring.activate(player);
            }
        }

        for (const ring of this.rings) {
            ring.update();
            
            if (!ring.collected && Physics.checkCollision(player, ring)) {
                ring.collected = true;
                player.collectRing();
                this.collectedRings++;
            }
        }

        for (const powerUp of this.powerUps) {
            powerUp.update();
            
            if (!powerUp.collected && Physics.checkCollision(player, powerUp)) {
                powerUp.collected = true;
                powerUp.applyEffect(player);
            }
        }

        for (const enemy of this.enemies) {
            enemy.update(player, this.platforms);
            
            if (!enemy.defeated && Physics.checkCollision(player, enemy)) {
                if ((player.vy > 0 || player.isRolling) && !player.invincible) {
                    if (enemy.takeDamage()) {
                        player.defeatEnemy();
                        player.vy = -10;
                        this.defeatedEnemies++;
                    }
                } else if (!player.invincible && !player.hurt) {
                    const died = player.takeDamage();
                    if (died) {
                        return 'death';
                    }
                }
            }
        }

        Physics.checkPlatformCollision(player, this.platforms);

        if (this.goal && Physics.checkGoalReached(player, this.goal)) {
            return 'complete';
        }

        if (player.y > 700) {
            const died = player.takeDamage();
            if (died) {
                return 'death';
            }
            player.x = Math.max(100, player.x - 200);
            player.y = 400;
            player.vx = 0;
            player.vy = 0;
        }

        this.updateCamera(player);

        return 'playing';
    }

    updateCamera(player) {
        const targetX = player.x - 400;
        this.cameraX += (targetX - this.cameraX) * 0.1;
        this.cameraX = Math.max(0, Math.min(this.cameraX, this.length - 1280));
    }

    drawBackground(ctx, cameraX) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, 720);
        
        switch (this.type) {
            case 'grass':
                skyGradient.addColorStop(0, '#87CEEB');
                skyGradient.addColorStop(1, '#E0F7FA');
                break;
            case 'chemical':
                skyGradient.addColorStop(0, '#2C3E50');
                skyGradient.addColorStop(1, '#4A0E4E');
                break;
            case 'desert':
                skyGradient.addColorStop(0, '#F39C12');
                skyGradient.addColorStop(1, '#D35400');
                break;
            case 'mechanical':
                skyGradient.addColorStop(0, '#1A1A2E');
                skyGradient.addColorStop(1, '#16213E');
                break;
            case 'underwater':
                skyGradient.addColorStop(0, '#006994');
                skyGradient.addColorStop(1, '#001a33');
                break;
            case 'sky':
                skyGradient.addColorStop(0, '#667eea');
                skyGradient.addColorStop(1, '#764ba2');
                break;
            default:
                skyGradient.addColorStop(0, '#87CEEB');
                skyGradient.addColorStop(1, '#E0F7FA');
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, 1280, 720);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 5; i++) {
            const cloudX = ((i * 400 - cameraX * 0.2) % 1600) - 100;
            const cloudY = 50 + i * 30;
            ctx.beginPath();
            ctx.ellipse(cloudX, cloudY, 80, 30, 0, 0, Math.PI * 2);
            ctx.arc(cloudX - 40, cloudY - 10, 30, 0, Math.PI * 2);
            ctx.arc(cloudX + 40, cloudY - 10, 35, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(100, 150, 100, 0.4)';
        for (let i = 0; i < 8; i++) {
            const hillX = ((i * 300 - cameraX * 0.3) % 2000) - 200;
            ctx.beginPath();
            ctx.moveTo(hillX, 600);
            ctx.quadraticCurveTo(hillX + 150, 450, hillX + 300, 600);
            ctx.fill();
        }
    }

    draw(ctx, player = null) {
        this.drawBackground(ctx, this.cameraX);

        for (const platform of this.platforms) {
            if (platform.x + platform.width > this.cameraX - 100 && 
                platform.x < this.cameraX + 1380) {
                platform.draw(ctx, this.cameraX);
            }
        }

        for (const spring of this.springs) {
            if (spring.x + spring.width > this.cameraX - 100 && 
                spring.x < this.cameraX + 1380) {
                spring.draw(ctx, this.cameraX);
            }
        }

        for (const ring of this.rings) {
            if (ring.x + ring.width > this.cameraX - 100 && 
                ring.x < this.cameraX + 1380) {
                ring.draw(ctx, this.cameraX);
            }
        }

        for (const powerUp of this.powerUps) {
            if (powerUp.x + powerUp.width > this.cameraX - 100 && 
                powerUp.x < this.cameraX + 1380) {
                powerUp.draw(ctx, this.cameraX);
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.x + enemy.width > this.cameraX - 100 && 
                enemy.x < this.cameraX + 1380) {
                enemy.draw(ctx, this.cameraX, player);
            }
        }

        if (this.goal) {
            this.goal.update();
            this.goal.draw(ctx, this.cameraX);
        }
    }

    getGrade() {
        const timeBonus = Math.max(0, 180 - this.time);
        const ringRatio = this.collectedRings / Math.max(1, this.rings.length);

        if (this.time < 60 && ringRatio > 0.9) return 'S';
        if (this.time < 90 && ringRatio > 0.7) return 'A';
        if (this.time < 120 && ringRatio > 0.5) return 'B';
        if (this.time < 180) return 'C';
        return 'D';
    }

    getScore() {
        let score = 0;
        score += this.collectedRings * CONFIG.SCORES.RING;
        score += this.defeatedEnemies * CONFIG.SCORES.ENEMY;
        score += Math.max(0, Math.floor(180 - this.time)) * CONFIG.SCORES.TIME_BONUS_PER_SECOND;
        
        if (this.collectedRings === this.rings.length) {
            score += CONFIG.SCORES.ALL_RINGS;
        }
        
        return score;
    }
}
