const LevelManager = {
    platforms: [],
    enemies: [],
    projectiles: [],
    
    generateLevel(levelIndex) {
        this.platforms = [];
        this.enemies = [];
        this.projectiles = [];
        
        const canvas = Game.canvas;
        const levelConfig = CONFIG.LEVELS[levelIndex];
        
        this.platforms.push({
            x: 0,
            y: canvas.height - 40,
            width: canvas.width,
            height: 40,
            isGround: true
        });
        
        const buildingCount = 5 + levelIndex * 2;
        const buildingWidths = [120, 150, 180, 200];
        const buildingHeights = [150, 200, 250, 300, 350];
        
        for (let i = 0; i < buildingCount; i++) {
            const width = buildingWidths[Math.floor(Math.random() * buildingWidths.length)];
            const height = buildingHeights[Math.floor(Math.random() * buildingHeights.length)];
            const x = (canvas.width / buildingCount) * i + Math.random() * 30;
            const y = canvas.height - 40 - height;
            
            this.platforms.push({
                x: x,
                y: y,
                width: width,
                height: height,
                isBuilding: true,
                windows: this.generateWindows(width, height)
            });
        }
        
        for (let i = 0; i < 4 + levelIndex; i++) {
            const x = 100 + Math.random() * (canvas.width - 200);
            const y = 150 + Math.random() * (canvas.height - 350);
            const width = 80 + Math.random() * 60;
            
            this.platforms.push({
                x: x,
                y: y,
                width: width,
                height: 20,
                isRooftop: true
            });
        }
        
        const enemyTypes = ['THUG', 'THUG', 'GUNNER', 'ELITE'];
        for (let i = 0; i < levelConfig.enemies; i++) {
            const type = enemyTypes[Math.min(i, enemyTypes.length - 1)];
            const platform = this.platforms[1 + Math.floor(Math.random() * (this.platforms.length - 1))];
            const enemyX = platform.x + Math.random() * (platform.width - 50) + 25;
            const enemyY = platform.y - 30;
            
            this.enemies.push(new Enemy(enemyX, enemyY, type));
        }
    },
    
    generateWindows(buildingWidth, buildingHeight) {
        const windows = [];
        const cols = Math.floor(buildingWidth / 35);
        const rows = Math.floor(buildingHeight / 50);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.3) {
                    windows.push({
                        x: 15 + col * 35,
                        y: 20 + row * 50,
                        width: 20,
                        height: 30,
                        lit: Math.random() > 0.4
                    });
                }
            }
        }
        return windows;
    },
    
    update() {
        this.projectiles = this.projectiles.filter(proj => {
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            const dist = Math.sqrt(Math.pow(proj.x - Game.player.x, 2) + Math.pow(proj.y - Game.player.y, 2));
            if (dist < 30) {
                Game.player.takeDamage(proj.damage);
                return false;
            }
            
            return proj.x > 0 && proj.x < Game.canvas.width && proj.y > 0 && proj.y < Game.canvas.height;
        });
    },
    
    draw(ctx) {
        this.drawBackground(ctx);
        
        for (const platform of this.platforms) {
            if (platform.isBuilding) {
                this.drawBuilding(ctx, platform);
            } else if (platform.isRooftop) {
                ctx.fillStyle = CONFIG.COLORS.BUILDING;
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(platform.x - 5, platform.y, platform.width + 10, 5);
            } else if (platform.isGround) {
                ctx.fillStyle = '#0a0a15';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                ctx.strokeStyle = '#1a1a2e';
                ctx.lineWidth = 2;
                for (let i = 0; i < platform.width; i += 50) {
                    ctx.beginPath();
                    ctx.moveTo(platform.x + i, platform.y);
                    ctx.lineTo(platform.x + i, platform.y + platform.height);
                    ctx.stroke();
                }
            }
        }
        
        for (const proj of this.projectiles) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(proj.x - proj.vx * 3, proj.y - proj.vy * 3);
            ctx.stroke();
        }
    },
    
    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#0a0a1e');
        gradient.addColorStop(0.3, '#1a1a3e');
        gradient.addColorStop(0.7, '#2d1b4e');
        gradient.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 3;
        for (let i = 0; i < 80; i++) {
            const x = (i * 137) % ctx.canvas.width;
            const y = (i * 89) % (ctx.canvas.height * 0.6);
            ctx.beginPath();
            ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#0d0d1a';
        for (let i = 0; i < 10; i++) {
            const x = i * 140 - 20;
            const height = 80 + (i * 41) % 180;
            ctx.fillRect(x, ctx.canvas.height - 40 - height, 90, height);
            
            ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
            ctx.fillRect(x, ctx.canvas.height - 40 - height, 90, 2);
            ctx.fillRect(x, ctx.canvas.height - 40 - height + 15, 90, 1);
            ctx.fillStyle = '#0d0d1a';
        }
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const x = i * 80;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 200, ctx.canvas.height);
            ctx.stroke();
        }
    },
    
    drawBuilding(ctx, building) {
        const buildingGradient = ctx.createLinearGradient(building.x, building.y, building.x + building.width, building.y + building.height);
        buildingGradient.addColorStop(0, '#1a1a3e');
        buildingGradient.addColorStop(0.5, '#0d0d20');
        buildingGradient.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = buildingGradient;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(building.x, building.y, building.width, building.height);
        
        ctx.fillStyle = '#2a2a5e';
        ctx.fillRect(building.x - 5, building.y, building.width + 10, 8);
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(building.x - 5, building.y + 8);
        ctx.lineTo(building.x, building.y);
        ctx.lineTo(building.x + building.width, building.y);
        ctx.lineTo(building.x + building.width + 5, building.y + 8);
        ctx.stroke();
        
        for (const window of building.windows) {
            if (window.lit) {
                const windowGlow = ctx.createRadialGradient(
                    building.x + window.x + window.width / 2,
                    building.y + window.y + window.height / 2,
                    0,
                    building.x + window.x + window.width / 2,
                    building.y + window.y + window.height / 2,
                    15
                );
                windowGlow.addColorStop(0, 'rgba(240, 230, 140, 0.4)');
                windowGlow.addColorStop(1, 'rgba(240, 230, 140, 0)');
                ctx.fillStyle = windowGlow;
                ctx.fillRect(building.x + window.x - 5, building.y + window.y - 5, window.width + 10, window.height + 10);
                
                ctx.fillStyle = '#f0e68c';
                ctx.shadowColor = '#f0e68c';
                ctx.shadowBlur = 8;
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.shadowBlur = 0;
            }
            ctx.fillRect(building.x + window.x, building.y + window.y, window.width, window.height);
            ctx.shadowBlur = 0;
        }
    }
};