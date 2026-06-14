class Level {
    constructor(areaIndex, levelIndex) {
        this.areaIndex = areaIndex;
        this.levelIndex = levelIndex;
        this.areaConfig = GameConfig.AREAS[areaIndex];
        this.isBossLevel = levelIndex === 2;
        this.completed = false;
        this.enemiesSpawned = false;
        this.steamZones = [];
        this.laserTraps = [];
        this.neonSigns = [];
        this.waterPuddles = [];
        this.buildings = [];
        this.backgroundElements = [];
        this.setupLevel();
    }

    setupLevel() {
        this.neonSigns = this.generateNeonSigns();
        this.waterPuddles = this.generateWaterPuddles();
        this.buildings = this.generateBuildings();
        this.backgroundElements = this.generateBackgroundElements();
        
        if (this.areaConfig.hasSteam) {
            this.steamZones = this.generateSteamZones();
        }
        
        if (this.areaConfig.hasLasers) {
            this.laserTraps = this.generateLaserTraps();
        }
    }

    generateNeonSigns() {
        const signs = [];
        const signCount = 5 + Math.floor(Math.random() * 4);
        const texts = ['霓虹', '赛博', 'NEO', '2077', 'CYBER', '忍者', '未来', 'TECH'];
        const colors = this.areaConfig.neonColors;
        
        for (let i = 0; i < signCount; i++) {
            signs.push({
                x: 100 + Math.random() * (GameConfig.CANVAS_WIDTH - 200),
                y: 50 + Math.random() * 150,
                width: 60 + Math.random() * 80,
                height: 30 + Math.random() * 30,
                text: texts[Math.floor(Math.random() * texts.length)],
                color: colors[Math.floor(Math.random() * colors.length)],
                flickerTimer: Math.random() * 1000,
                flickerSpeed: 1000 + Math.random() * 2000,
                isFlickering: Math.random() > 0.5
            });
        }
        return signs;
    }

    generateWaterPuddles() {
        const puddles = [];
        const puddleCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < puddleCount; i++) {
            puddles.push({
                x: 50 + Math.random() * (GameConfig.CANVAS_WIDTH - 100),
                y: GameConfig.GROUND_Y - 5,
                width: 60 + Math.random() * 100,
                height: 8 + Math.random() * 6,
                rippleTimer: Math.random() * Math.PI * 2
            });
        }
        return puddles;
    }

    generateBuildings() {
        const buildings = [];
        let x = 0;
        
        while (x < GameConfig.CANVAS_WIDTH) {
            const width = 80 + Math.random() * 120;
            const height = 150 + Math.random() * 250;
            buildings.push({
                x: x,
                y: GameConfig.GROUND_Y - height,
                width: width,
                height: height,
                windows: this.generateWindows(width, height)
            });
            x += width + 10 + Math.random() * 30;
        }
        return buildings;
    }

    generateWindows(buildingWidth, buildingHeight) {
        const windows = [];
        const cols = Math.floor(buildingWidth / 25);
        const rows = Math.floor(buildingHeight / 35);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.3) {
                    windows.push({
                        x: 10 + c * 25,
                        y: 15 + r * 35,
                        width: 15,
                        height: 20,
                        lit: Math.random() > 0.2,
                        flickerTimer: Math.random() * 2000
                    });
                }
            }
        }
        return windows;
    }

    generateBackgroundElements() {
        const elements = [];
        
        elements.push({
            type: 'moon',
            x: GameConfig.CANVAS_WIDTH - 150,
            y: 80,
            radius: 40,
            color: this.areaIndex === 0 ? '#ff88ff' : this.areaIndex === 1 ? '#ffaa44' : '#ff4444'
        });
        
        for (let i = 0; i < 20; i++) {
            elements.push({
                type: 'star',
                x: Math.random() * GameConfig.CANVAS_WIDTH,
                y: Math.random() * 200,
                size: 1 + Math.random() * 2,
                twinkleTimer: Math.random() * Math.PI * 2
            });
        }
        
        return elements;
    }

    generateSteamZones() {
        const zones = [];
        const zoneCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < zoneCount; i++) {
            zones.push({
                x: 200 + Math.random() * (GameConfig.CANVAS_WIDTH - 400),
                width: 80 + Math.random() * 60,
                activeTimer: 0,
                cycleTime: 5000 + Math.random() * 3000,
                activeDuration: 2000,
                isActive: false,
                particles: []
            });
        }
        return zones;
    }

    generateLaserTraps() {
        const traps = [];
        const trapCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < trapCount; i++) {
            traps.push({
                y: 350 + Math.random() * 120,
                activeTimer: 0,
                cycleTime: 4000 + Math.random() * 2000,
                activeDuration: 1500,
                warningDuration: 1000,
                isActive: false,
                isWarning: false,
                height: 6
            });
        }
        return traps;
    }

    spawnEnemies() {
        if (this.enemiesSpawned) return [];
        this.enemiesSpawned = true;
        
        const enemies = [];
        
        if (this.isBossLevel) {
            return enemies;
        }
        
        const difficulty = this.areaIndex * 0.5 + this.levelIndex * 0.3;
        const baseEnemyCount = 3 + Math.floor(difficulty * 2);
        
        const availableTypes = this.getAvailableEnemyTypes();
        
        for (let i = 0; i < baseEnemyCount; i++) {
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const x = 200 + (i / baseEnemyCount) * (GameConfig.CANVAS_WIDTH - 300) + Math.random() * 100;
            let y = GameConfig.GROUND_Y;
            
            if (type === 'drone') {
                y = 100 + Math.random() * 200;
            }
            
            enemies.push(this.createEnemy(type, x, y));
        }
        
        return enemies;
    }

    getAvailableEnemyTypes() {
        const types = ['drone'];
        if (this.areaIndex >= 0) types.push('spider');
        if (this.areaIndex >= 1) types.push('mech');
        return types;
    }

    createEnemy(type, x, y) {
        switch (type) {
            case 'drone': return new Drone(x, y);
            case 'mech': return new Mech(x, y);
            case 'spider': return new Spider(x, y);
            default: return new Spider(x, y);
        }
    }

    spawnBoss() {
        const boss = new Boss(GameConfig.CANVAS_WIDTH - 150, GameConfig.GROUND_Y - GameConfig.BOSS.HEIGHT);
        return boss;
    }

    update(deltaTime, game) {
        this.neonSigns.forEach(sign => {
            sign.flickerTimer += deltaTime;
            if (sign.flickerTimer >= sign.flickerSpeed) {
                sign.flickerTimer = 0;
            }
        });
        
        this.waterPuddles.forEach(puddle => {
            puddle.rippleTimer += deltaTime / 500;
        });
        
        this.buildings.forEach(building => {
            building.windows.forEach(window => {
                window.flickerTimer -= deltaTime;
                if (window.flickerTimer <= 0) {
                    window.flickerTimer = 1000 + Math.random() * 3000;
                    window.lit = Math.random() > 0.2;
                }
            });
        });
        
        this.steamZones.forEach(zone => {
            zone.activeTimer += deltaTime;
            const cyclePos = zone.activeTimer % zone.cycleTime;
            zone.isActive = cyclePos < zone.activeDuration;
            
            if (zone.isActive) {
                if (Math.random() < 0.3) {
                    zone.particles.push({
                        x: zone.x + Math.random() * zone.width,
                        y: GameConfig.GROUND_Y,
                        vy: -1 - Math.random() * 2,
                        size: 10 + Math.random() * 15,
                        life: 1500,
                        maxLife: 1500
                    });
                }
                
                zone.particles = zone.particles.filter(p => {
                    p.y += p.vy;
                    p.vy *= 0.99;
                    p.life -= deltaTime;
                    return p.life > 0;
                });
                
                const playerBox = game.player.getBounds();
                const zoneBox = {
                    left: zone.x,
                    right: zone.x + zone.width,
                    top: GameConfig.GROUND_Y - 150,
                    bottom: GameConfig.GROUND_Y
                };
                
                if (this.boxIntersects(playerBox, zoneBox) && !game.player.isSlowed) {
                    game.player.applySlow(2000);
                }
            }
        });
        
        this.laserTraps.forEach(trap => {
            trap.activeTimer += deltaTime;
            const cyclePos = trap.activeTimer % trap.cycleTime;
            
            if (cyclePos < trap.warningDuration) {
                trap.isWarning = true;
                trap.isActive = false;
            } else if (cyclePos < trap.warningDuration + trap.activeDuration) {
                trap.isWarning = false;
                trap.isActive = true;
                
                if (Math.floor((cyclePos - trap.warningDuration) / 100) % 3 === 0) {
                    audioManager.playLaser();
                }
                
                const playerBox = game.player.getBounds();
                const laserBox = {
                    left: 0,
                    right: GameConfig.CANVAS_WIDTH,
                    top: trap.y,
                    bottom: trap.y + trap.height
                };
                
                if (this.boxIntersects(playerBox, laserBox) && !game.player.isDead) {
                    if (Math.floor(cyclePos / 300) % 2 === 0) {
                        game.player.takeDamage(10);
                    }
                }
            } else {
                trap.isWarning = false;
                trap.isActive = false;
            }
        });
    }

    boxIntersects(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    isComplete(game) {
        if (this.completed) return true;
        
        if (this.isBossLevel) {
            if (game.boss && game.boss.isDead && game.boss.deathTimer <= 0) {
                this.completed = true;
                return true;
            }
        } else {
            const allEnemiesDead = game.enemies.every(e => e.isDead && e.deathTimer <= 0);
            if (allEnemiesDead && game.enemies.length > 0) {
                this.completed = true;
                return true;
            }
        }
        
        return false;
    }

    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, GameConfig.CANVAS_HEIGHT);
        gradient.addColorStop(0, this.areaConfig.bgColor);
        gradient.addColorStop(0.7, this.areaConfig.bgColor);
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        
        this.backgroundElements.forEach(elem => {
            if (elem.type === 'moon') {
                ctx.save();
                ctx.fillStyle = elem.color;
                ctx.shadowColor = elem.color;
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(elem.x, elem.y, elem.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (elem.type === 'star') {
                elem.twinkleTimer += 0.05;
                const alpha = 0.5 + Math.sin(elem.twinkleTimer) * 0.5;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(elem.x, elem.y, elem.size, elem.size);
                ctx.restore();
            }
        });
        
        this.buildings.forEach(building => {
            ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(building.x, building.y, building.width, building.height);
            
            building.windows.forEach(window => {
                if (window.lit) {
                    const colors = this.areaConfig.neonColors;
                    ctx.fillStyle = colors[Math.floor(window.flickerTimer) % colors.length] || '#ffff88';
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 5;
                    ctx.fillRect(building.x + window.x, building.y + window.y, window.width, window.height);
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
                    ctx.fillRect(building.x + window.x, building.y + window.y, window.width, window.height);
                }
            });
        });
        
        this.neonSigns.forEach(sign => {
            const alpha = sign.isFlickering ? 
                (Math.floor(sign.flickerTimer / 100) % 2 === 0 ? 1 : 0.3) : 1;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            ctx.fillStyle = sign.color;
            ctx.shadowColor = sign.color;
            ctx.shadowBlur = 20;
            ctx.fillRect(sign.x, sign.y, sign.width, sign.height);
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sign.text, sign.x + sign.width / 2, sign.y + sign.height / 2);
            
            ctx.restore();
        });
    }

    drawForeground(ctx) {
        this.drawGround(ctx);
        
        this.waterPuddles.forEach(puddle => {
            ctx.save();
            ctx.globalAlpha = 0.6;
            
            const gradient = ctx.createRadialGradient(
                puddle.x + puddle.width / 2, puddle.y + puddle.height / 2, 0,
                puddle.x + puddle.width / 2, puddle.y + puddle.height / 2, puddle.width / 2
            );
            gradient.addColorStop(0, 'rgba(0, 100, 150, 0.8)');
            gradient.addColorStop(0.7, 'rgba(0, 50, 100, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 30, 60, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(puddle.x + puddle.width / 2, puddle.y + puddle.height / 2, 
                        puddle.width / 2, puddle.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const ripple = (puddle.rippleTimer + i * 2) % (Math.PI * 2);
                const rippleSize = (ripple / (Math.PI * 2)) * puddle.width / 2;
                ctx.globalAlpha = 0.5 * (1 - ripple / (Math.PI * 2));
                ctx.beginPath();
                ctx.ellipse(puddle.x + puddle.width / 2, puddle.y + puddle.height / 2,
                            rippleSize, rippleSize * 0.2, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        this.steamZones.forEach(zone => {
            if (zone.isActive) {
                zone.particles.forEach(p => {
                    const alpha = p.life / p.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (1 - alpha * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            } else {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                ctx.fillRect(zone.x, GameConfig.GROUND_Y - 10, zone.width, 10);
            }
        });
        
        this.laserTraps.forEach(trap => {
            if (trap.isWarning) {
                ctx.save();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                ctx.beginPath();
                ctx.moveTo(0, trap.y + trap.height / 2);
                ctx.lineTo(GameConfig.CANVAS_WIDTH, trap.y + trap.height / 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
                
                if (Math.floor(Date.now() / 200) % 2 === 0) {
                    audioManager.playWarning();
                }
            } else if (trap.isActive) {
                ctx.save();
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(0, trap.y - 5, GameConfig.CANVAS_WIDTH, trap.height + 10);
                
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.fillRect(0, trap.y, GameConfig.CANVAS_WIDTH, trap.height);
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, trap.y + trap.height / 2 - 2, GameConfig.CANVAS_WIDTH, 4);
                
                ctx.restore();
            }
        });
    }

    drawGround(ctx) {
        const groundGradient = ctx.createLinearGradient(0, GameConfig.GROUND_Y, 0, GameConfig.CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#1a1a2e');
        groundGradient.addColorStop(0.3, '#0f0f1a');
        groundGradient.addColorStop(1, '#050510');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, GameConfig.GROUND_Y, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_Y);
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GameConfig.GROUND_Y);
        ctx.lineTo(GameConfig.CANVAS_WIDTH, GameConfig.GROUND_Y);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < GameConfig.CANVAS_WIDTH; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, GameConfig.GROUND_Y);
            ctx.lineTo(x, GameConfig.GROUND_Y + 30);
            ctx.stroke();
        }
    }

    drawPlayerReflection(ctx, player) {
        const puddle = this.findPuddleUnderPlayer(player);
        if (!puddle) return;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        const reflectY = puddle.y + puddle.height - (player.y - GameConfig.GROUND_Y + player.height);
        const gradient = ctx.createLinearGradient(0, reflectY, 0, reflectY + player.height);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.3)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0)');
        
        ctx.fillStyle = gradient;
        
        if (!player.facingRight) {
            ctx.translate(player.x + player.width, 0);
            ctx.scale(-1, 1);
            ctx.translate(-player.x, 0);
        }
        
        ctx.fillRect(player.x + 10, reflectY + 20, player.width - 20, player.height - 25);
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fillRect(player.x + 15, reflectY + 25, 2, player.height - 35);
        ctx.fillRect(player.x + player.width - 17, reflectY + 25, 2, player.height - 35);
        
        ctx.restore();
    }

    findPuddleUnderPlayer(player) {
        const playerCenterX = player.x + player.width / 2;
        for (const puddle of this.waterPuddles) {
            if (playerCenterX > puddle.x && playerCenterX < puddle.x + puddle.width) {
                if (player.y + player.height >= GameConfig.GROUND_Y - 10) {
                    return puddle;
                }
            }
        }
        return null;
    }
}
