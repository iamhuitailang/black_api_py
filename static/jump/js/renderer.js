class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraMode = CONFIG.CAMERA.MODES.FOLLOW;
        this.currentLevel = 1;
        this.particles = [];
        this.cloudParticles = [];
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    drawBackground(altitude) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        const skyProgress = Utils.map(altitude, 0, CONFIG.GAME.START_ALTITUDE, 0, 1);
        const level = this.currentLevel || 1;
        
        let baseTopColor = { r: 135, g: 206, b: 235 };
        let baseBottomColor = { r: 152, g: 216, b: 200 };
        
        if (level >= 8) {
            baseTopColor = { r: 20, g: 20, b: 40 };
            baseBottomColor = { r: 40, g: 40, b: 60 };
        } else if (level >= 6) {
            baseTopColor = { r: 100, g: 100, b: 150 };
            baseBottomColor = { r: 120, g: 120, b: 180 };
        } else if (level >= 4) {
            baseTopColor = { r: 200, g: 150, b: 100 };
            baseBottomColor = { r: 220, g: 180, b: 140 };
        }
        
        const highAltColor = { r: 25, g: 25, b: 112 };
        
        const topColor = this.interpolateColor(baseTopColor, highAltColor, skyProgress);
        const bottomColor = this.interpolateColor(baseBottomColor, baseTopColor, skyProgress);
        
        gradient.addColorStop(0, `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`);
        gradient.addColorStop(1, `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (level >= 8) {
            this.drawStars();
        }
        
        this.drawClouds(altitude);
    }
    
    drawStars() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5) % this.width;
            const y = (i * 73.3) % (this.height * 0.6);
            const size = 0.5 + Math.sin(time * 2 + i) * 0.5;
            const alpha = 0.3 + Math.sin(time + i * 0.5) * 0.3;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawClouds(altitude) {
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 5; i++) {
            const cloudY = (i * 200 + time * 10) % (this.height + 200) - 100;
            const cloudX = (i * 300 + Math.sin(time + i) * 50) % (this.width + 200) - 100;
            const alpha = Utils.map(altitude, 0, 2000, 0.3, 0.8);
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.drawCloud(cloudX, cloudY, 60 + i * 20);
            this.ctx.restore();
        }
    }
    
    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGround(terrainSystem, player) {
        const groundY = this.height - 150;
        const terrainType = terrainSystem.currentTerrain;
        const terrainConfig = terrainSystem.getTerrainConfig();
        
        this.ctx.fillStyle = terrainConfig.color;
        this.ctx.fillRect(0, groundY, this.width, 150);
        
        this.drawTerrainDetails(terrainType, groundY);
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.width, groundY);
        this.ctx.stroke();
        
        this.drawTarget(terrainSystem, groundY);
    }
    
    drawTerrainDetails(terrainType, groundY) {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        
        switch (terrainType) {
            case 'grass':
                ctx.fillStyle = 'rgba(46, 125, 50, 0.3)';
                for (let i = 0; i < 50; i++) {
                    const x = (i * 40 + time * 5) % (this.width + 40) - 20;
                    ctx.fillRect(x, groundY + 10, 2, 15);
                }
                break;
                
            case 'sand':
                ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
                for (let i = 0; i < 30; i++) {
                    const x = (i * 60 + Math.sin(time + i) * 10) % this.width;
                    ctx.beginPath();
                    ctx.ellipse(x, groundY + 30, 20, 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'snow':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                for (let i = 0; i < 20; i++) {
                    const x = (i * 80 + time * 20) % (this.width + 40) - 20;
                    const y = groundY + 20 + Math.sin(time * 2 + i) * 5;
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'carrier':
                ctx.fillStyle = 'rgba(33, 33, 33, 0.5)';
                for (let i = 0; i < 10; i++) {
                    ctx.fillRect(i * 120 + 10, groundY + 20, 100, 3);
                }
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🎖️ 航母甲板', this.width / 2, groundY + 60);
                break;
                
            case 'roof':
                ctx.fillStyle = 'rgba(183, 28, 28, 0.3)';
                for (let i = 0; i < 15; i++) {
                    const x = i * 100;
                    ctx.beginPath();
                    ctx.moveTo(x, groundY);
                    ctx.lineTo(x + 50, groundY - 30);
                    ctx.lineTo(x + 100, groundY);
                    ctx.fill();
                }
                break;
        }
    }
    
    drawTarget(terrainSystem, groundY) {
        const targetX = this.worldToScreenX(terrainSystem.targetX);
        const targetRadius = terrainSystem.getTargetRadius();
        
        const rings = [
            { color: '#f44336', radius: targetRadius },
            { color: '#ffffff', radius: targetRadius * 0.8 },
            { color: '#f44336', radius: targetRadius * 0.6 },
            { color: '#ffffff', radius: targetRadius * 0.4 },
            { color: '#f44336', radius: targetRadius * 0.2 }
        ];
        
        for (const ring of rings) {
            this.ctx.fillStyle = ring.color;
            this.ctx.beginPath();
            this.ctx.ellipse(targetX, groundY, ring.radius, ring.radius * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎯', targetX, groundY - 5);
    }
    
    drawPlayer(player) {
        const screenX = this.worldToScreenX(player.x);
        const screenY = this.height - 150 - player.altitude * 0.5;
        
        if (screenY < -50 || screenY > this.height + 50) return;
        
        this.ctx.save();
        this.ctx.translate(screenX, screenY);
        this.ctx.rotate(player.rotation * Math.PI / 180);
        
        if (player.parachuteOpened) {
            this.drawParachute(player);
        }
        
        this.drawSkydiver(player);
        
        this.ctx.restore();
        
        this.drawTrail(player, screenX, screenY);
    }
    
    drawSkydiver(player) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(0, -20, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -22, 8, Math.PI, Math.PI * 2);
        ctx.fill();
        
        const armSwing = Math.sin(player.animationFrame * 5) * 0.3;
        ctx.fillStyle = '#2196F3';
        
        ctx.save();
        ctx.rotate(-0.5 + armSwing);
        ctx.fillRect(-18, -5, 8, 16);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(0.5 - armSwing);
        ctx.fillRect(10, -5, 8, 16);
        ctx.restore();
        
        const legSwing = Math.sin(player.animationFrame * 5 + Math.PI) * 0.2;
        ctx.fillStyle = '#1565C0';
        
        ctx.save();
        ctx.rotate(legSwing);
        ctx.fillRect(-8, 15, 6, 20);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(-legSwing);
        ctx.fillRect(2, 15, 6, 20);
        ctx.restore();
    }
    
    drawParachute(player) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 8, -30);
            ctx.lineTo(i * 2, -5);
            ctx.stroke();
        }
        
        const gradient = ctx.createRadialGradient(0, -50, 0, 0, -50, 50);
        gradient.addColorStop(0, '#f44336');
        gradient.addColorStop(0.5, '#ff9800');
        gradient.addColorStop(1, '#f44336');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-50, -30);
        ctx.quadraticCurveTo(0, -80, 50, -30);
        ctx.quadraticCurveTo(0, -20, -50, -30);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-40, -35);
        ctx.quadraticCurveTo(0, -65, 40, -35);
        ctx.stroke();
    }
    
    drawTrail(player, x, y) {
        if (!player.parachuteOpened && player.velocityY > 10) {
            const ctx = this.ctx;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - player.velocityX * 2, y - 30);
            ctx.stroke();
        }
    }
    
    drawObstacles(obstacles, player) {
        for (const obs of obstacles) {
            const screenX = this.worldToScreenX(obs.x);
            const screenY = this.height - 150 - obs.worldY * 0.5;
            
            if (screenY < -100 || screenY > this.height + 100) continue;
            
            this.ctx.save();
            this.ctx.font = `${obs.radius * 1.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (obs.type === 'CLOUD') {
                this.ctx.globalAlpha = 0.7;
                this.drawCloud(screenX, screenY, obs.radius);
            } else {
                obs.rotation += 0.02;
                this.ctx.translate(screenX, screenY);
                this.ctx.rotate(obs.rotation);
                this.ctx.fillText(obs.emoji, 0, 0);
            }
            
            this.ctx.restore();
        }
    }
    
    drawRewards(rewards, player) {
        const time = Date.now() / 1000;
        
        for (const reward of rewards) {
            const screenX = this.worldToScreenX(reward.x);
            const screenY = this.height - 150 - reward.worldY * 0.5;
            
            if (screenY < -100 || screenY > this.height + 100) continue;
            
            this.ctx.save();
            
            const pulse = Math.sin(time * 3 + reward.id) * 0.2 + 1;
            const glowSize = reward.radius * 2 * pulse;
            
            const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.font = `${reward.radius * 1.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(reward.emoji, screenX, screenY);
            
            this.ctx.restore();
        }
    }
    
    drawAltitudeMarkers(altitude) {
        const markers = [4000, 3000, 2500, 2000, 1500, 1000, 500, 0];
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        
        for (const marker of markers) {
            const screenY = this.height - 150 - marker * 0.5;
            if (screenY > 0 && screenY < this.height) {
                this.ctx.fillText(`${marker}m`, this.width - 10, screenY);
                
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(0, screenY);
                this.ctx.lineTo(this.width - 20, screenY);
                this.ctx.stroke();
            }
        }
    }
    
    drawMinimap(player, terrainSystem) {
        const mapWidth = 120;
        const mapHeight = 80;
        const mapX = this.width - mapWidth - 20;
        const mapY = this.height - mapHeight - 20;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
        
        const targetMapX = mapX + (terrainSystem.targetX / CONFIG.GAME.WORLD_WIDTH) * mapWidth;
        this.ctx.fillStyle = '#f44336';
        this.ctx.beginPath();
        this.ctx.arc(targetMapX, mapY + mapHeight - 10, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        const playerMapX = mapX + (player.x / CONFIG.GAME.WORLD_WIDTH) * mapWidth;
        const playerMapY = mapY + mapHeight - (player.altitude / CONFIG.GAME.START_ALTITUDE) * mapHeight;
        
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(playerMapX, playerMapY, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    worldToScreenX(worldX) {
        const centerOffset = worldX - CONFIG.GAME.WORLD_WIDTH / 2;
        return this.width / 2 + centerOffset * 0.5;
    }
    
    interpolateColor(color1, color2, t) {
        return {
            r: Math.round(Utils.lerp(color1.r, color2.r, t)),
            g: Math.round(Utils.lerp(color1.g, color2.g, t)),
            b: Math.round(Utils.lerp(color1.b, color2.b, t))
        };
    }
    
    drawFirstPersonView(player) {
        const ctx = this.ctx;
        
        ctx.save();
        
        const tiltX = player.velocityX * 0.5;
        const tiltY = player.velocityY * 0.3;
        
        ctx.translate(this.width / 2 + tiltX, this.height / 2 + tiltY);
        
        const fov = 90;
        const focalLength = this.height / 2 / Math.tan(fov / 2 * Math.PI / 180);
        
        ctx.restore();
    }
    
    drawFirstPersonOverlay(player) {
        const ctx = this.ctx;
        
        ctx.save();
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width * 0.15, this.height * 0.1);
        ctx.moveTo(this.width, 0);
        ctx.lineTo(this.width * 0.85, this.height * 0.1);
        ctx.moveTo(0, this.height);
        ctx.lineTo(this.width * 0.15, this.height * 0.9);
        ctx.moveTo(this.width, this.height);
        ctx.lineTo(this.width * 0.85, this.height * 0.9);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', this.width / 2, this.height / 2);
        
        const speed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`速度: ${speed.toFixed(1)} m/s`, this.width / 2, this.height * 0.75);
        
        if (player.parachuteOpened) {
            ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
            ctx.fillText('🪂 降落伞已打开', this.width / 2, this.height * 0.25);
        } else if (player.canOpenParachute) {
            ctx.fillStyle = 'rgba(255, 193, 7, 0.9)';
            ctx.fillText('按空格开伞!', this.width / 2, this.height * 0.25);
        }
        
        ctx.restore();
    }
}
