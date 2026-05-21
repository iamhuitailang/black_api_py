class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = 'countryside';
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }

    setTheme(theme) {
        this.theme = theme;
    }

    getThemeColors() {
        return CONFIG.THEMES[this.theme] || CONFIG.THEMES.countryside;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    clear() {
        this.ctx.fillStyle = CONFIG.COLORS.SKY;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawBackground(track, cameraDistance) {
        const colors = this.getThemeColors();
        
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.5);
        skyGradient.addColorStop(0, colors.sky[0]);
        skyGradient.addColorStop(1, colors.sky[1]);
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height * 0.5);

        const sunColor = this.theme === 'sunset' ? '#FF4500' : '#FFD700';
        this.ctx.fillStyle = sunColor;
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.8, this.height * 0.12, 40, 0, Math.PI * 2);
        this.ctx.fill();

        this.drawClouds(cameraDistance);

        const horizonY = this.height * 0.45;
        const grassGradient = this.ctx.createLinearGradient(0, horizonY, 0, this.height);
        grassGradient.addColorStop(0, colors.grass[0]);
        grassGradient.addColorStop(0.3, colors.grass[1]);
        grassGradient.addColorStop(1, colors.grass[2]);
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, horizonY, this.width, this.height - horizonY);
    }

    drawClouds(cameraDistance) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cloudOffset = (cameraDistance * 0.02) % 400;
        
        const clouds = [
            { x: 100 - cloudOffset, y: 50, size: 60 },
            { x: 400 - cloudOffset, y: 80, size: 50 },
            { x: 700 - cloudOffset, y: 40, size: 70 },
            { x: 1000 - cloudOffset, y: 70, size: 55 }
        ];

        for (const cloud of clouds) {
            if (cloud.x > -100 && cloud.x < this.width + 100) {
                this.drawCloud(cloud.x, cloud.y, cloud.size);
            }
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTrack(track, obstacles, cameraDistance) {
        const colors = this.getThemeColors();
        const roadTop = this.height * 0.45;
        const roadBottom = this.height;
        const roadLeft = this.width * 0.25;
        const roadRight = this.width * 0.75;
        const roadWidth = roadRight - roadLeft;
        
        const roadGradient = this.ctx.createLinearGradient(0, roadTop, 0, roadBottom);
        roadGradient.addColorStop(0, colors.road[0]);
        roadGradient.addColorStop(1, colors.road[1]);
        this.ctx.fillStyle = roadGradient;
        this.ctx.fillRect(roadLeft, roadTop, roadWidth, roadBottom - roadTop);

        this.ctx.strokeStyle = colors.roadEdge;
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(roadLeft, roadTop);
        this.ctx.lineTo(roadLeft, roadBottom);
        this.ctx.moveTo(roadRight, roadTop);
        this.ctx.lineTo(roadRight, roadBottom);
        this.ctx.stroke();

        const laneWidth = roadWidth / CONFIG.GAME.LANES;
        this.ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 15]);
        
        for (let i = 1; i < CONFIG.GAME.LANES; i++) {
            const x = roadLeft + laneWidth * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, roadTop);
            this.ctx.lineTo(x, roadBottom);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);

        this.drawFinishLine(track, cameraDistance, roadLeft, roadWidth, roadTop);
        this.drawObstacles(obstacles, cameraDistance, roadLeft, roadWidth, roadTop);
    }

    drawFinishLine(track, cameraDistance, roadLeft, roadWidth, roadTop) {
        const finishDistance = track.getFinishLinePosition();
        const distDiff = finishDistance - cameraDistance;
        
        if (distDiff > -200 && distDiff < 800) {
            const y = roadTop + distDiff * 1.5;
            if (y > roadTop && y < this.height) {
                const stripeWidth = 20;
                for (let i = 0; i < roadWidth; i += stripeWidth * 2) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(roadLeft + i, y, stripeWidth, 10);
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(roadLeft + i + stripeWidth, y, stripeWidth, 10);
                }
                
                this.ctx.fillStyle = '#FF4444';
                this.ctx.fillRect(roadLeft - 30, y - 80, 10, 100);
                this.ctx.fillRect(roadLeft + roadWidth + 20, y - 80, 10, 100);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(roadLeft - 20, y - 80, 40, 30);
                this.ctx.fillRect(roadLeft + roadWidth + 30, y - 80, 40, 30);
            }
        }
    }

    drawObstacles(obstacles, cameraDistance, roadLeft, roadWidth, roadTop) {
        const laneWidth = roadWidth / CONFIG.GAME.LANES;

        for (const obs of obstacles) {
            const distDiff = obs.distance - cameraDistance;
            if (distDiff < -100 || distDiff > 800) continue;

            const y = roadTop + distDiff * 1.5;
            const laneX = roadLeft + laneWidth * obs.lane + laneWidth / 2;

            if (y < roadTop || y > this.height) continue;

            this.ctx.save();
            this.ctx.translate(laneX, y);

            switch (obs.type) {
                case 'gravel':
                    this.ctx.fillStyle = 'rgba(160, 82, 45, 0.6)';
                    this.ctx.fillRect(-laneWidth / 2 + 5, -obs.length * 0.75, laneWidth - 10, obs.length * 1.5);
                    
                    this.ctx.fillStyle = '#8B4513';
                    for (let i = 0; i < 15; i++) {
                        const rx = Utils.random(-laneWidth / 2 + 15, laneWidth / 2 - 15);
                        const ry = Utils.random(-obs.length * 0.5, obs.length * 0.5);
                        this.ctx.beginPath();
                        this.ctx.arc(rx, ry, Utils.random(3, 8), 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    break;

                case 'slope':
                    this.ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
                    this.ctx.fillRect(-laneWidth / 2 + 5, -obs.length * 0.6, laneWidth - 10, obs.length * 1.2);
                    
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-laneWidth / 3, -obs.length * 0.4);
                    this.ctx.lineTo(laneWidth / 3, obs.length * 0.4);
                    this.ctx.stroke();
                    break;

                case 'barrier':
                    this.ctx.fillStyle = '#696969';
                    this.ctx.fillRect(-30, -25, 60, 50);
                    
                    this.ctx.fillStyle = '#FF6347';
                    this.ctx.fillRect(-25, -20, 20, 15);
                    this.ctx.fillRect(5, -20, 20, 15);
                    this.ctx.fillRect(-25, 5, 20, 15);
                    this.ctx.fillRect(5, 5, 20, 15);
                    break;

                case 'wind':
                    this.ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)';
                    this.ctx.lineWidth = 3;
                    for (let i = 0; i < 4; i++) {
                        this.ctx.beginPath();
                        const offset = (Date.now() * 0.01 + i * 20) % 60 - 30;
                        this.ctx.moveTo(-20 + offset, -30 + i * 20);
                        this.ctx.lineTo(20 + offset, -30 + i * 20);
                        this.ctx.lineTo(15 + offset, -25 + i * 20);
                        this.ctx.stroke();
                    }
                    break;
            }

            this.ctx.restore();
        }
    }

    drawPlayer(player, cameraDistance, isMainPlayer = false) {
        const roadTop = this.height * 0.45;
        const roadLeft = this.width * 0.25;
        const roadWidth = this.width * 0.5;
        const laneWidth = roadWidth / CONFIG.GAME.LANES;

        const distDiff = player.distance - cameraDistance;
        if (distDiff < -100 || distDiff > 600) return;

        const y = roadTop + distDiff * 1.5;
        const x = roadLeft + laneWidth * player.lane + laneWidth / 2;

        if (y < roadTop - 50 || y > this.height + 50) return;

        this.ctx.save();
        this.ctx.translate(x, y);

        if (player.isFallen) {
            this.ctx.rotate(Math.PI / 2 * (player.fallTimer > 1000 ? 1 - (player.fallTimer - 1000) / 500 : 1));
        } else {
            this.ctx.rotate(player.tilt * 0.5);
        }

        if (isMainPlayer && player.hasShield()) {
            this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.8)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 50, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'rgba(79, 195, 247, 0.2)';
            this.ctx.fill();
        }

        if (isMainPlayer && player.effects.boost > 0) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            for (let i = 0; i < 5; i++) {
                const px = Utils.random(-15, 15);
                const py = Utils.random(30, 60);
                this.ctx.beginPath();
                this.ctx.arc(px, py, Utils.random(3, 8), 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.drawUnicycle(player, isMainPlayer);

        this.ctx.restore();
    }

    drawUnicycle(player, isMainPlayer) {
        const color = isMainPlayer ? CONFIG.COLORS.PLAYER : player.color;
        const time = Date.now() * 0.01;

        this.ctx.strokeStyle = '#2F4F4F';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 20, 18, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(-15, 20);
        this.ctx.lineTo(15, 20);
        this.ctx.stroke();

        this.ctx.save();
        this.ctx.translate(0, 20);
        this.ctx.rotate(time * (player.speed / CONFIG.SPEED.NORMAL));
        this.ctx.strokeStyle = '#696969';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -15);
            this.ctx.stroke();
            this.ctx.rotate(Math.PI / 4);
        }
        this.ctx.restore();

        this.ctx.strokeStyle = '#4A4A4A';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 20);
        this.ctx.lineTo(0, -20);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -10);
        this.ctx.lineTo(25, -10);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -35, 15, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFE4C4';
        this.ctx.beginPath();
        this.ctx.arc(0, -55, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.beginPath();
        this.ctx.arc(0, -60, 10, Math.PI, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-4, -56, 2, 0, Math.PI * 2);
        this.ctx.arc(4, -56, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(0, -52, 4, 0.1, Math.PI - 0.1);
        this.ctx.stroke();

        if (!isMainPlayer) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name, 0, -85);
        }
    }

    drawItems(items, placedTraps, cameraDistance) {
        const roadTop = this.height * 0.45;
        const roadLeft = this.width * 0.25;
        const roadWidth = this.width * 0.5;
        const laneWidth = roadWidth / CONFIG.GAME.LANES;

        for (const item of items) {
            if (item.collected) continue;

            const distDiff = item.distance - cameraDistance;
            if (distDiff < -50 || distDiff > 600) continue;

            const y = roadTop + distDiff * 1.5;
            const x = roadLeft + laneWidth * item.lane + laneWidth / 2;

            if (y < roadTop || y > this.height) continue;

            this.ctx.save();
            this.ctx.translate(x, y);

            const floatOffset = Math.sin(Date.now() * 0.005 + item.distance) * 5;
            this.ctx.translate(0, floatOffset);

            this.ctx.fillStyle = item.getColor();
            this.ctx.shadowColor = item.getColor();
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.getIcon(), 0, 0);

            this.ctx.restore();
        }

        for (const trap of placedTraps) {
            const distDiff = trap.distance - cameraDistance;
            if (distDiff < -50 || distDiff > 600) continue;

            const y = roadTop + distDiff * 1.5;
            const x = roadLeft + laneWidth * trap.lane + laneWidth / 2;

            if (y < roadTop || y > this.height) continue;

            this.ctx.save();
            this.ctx.translate(x, y);

            this.ctx.fillStyle = 'rgba(102, 187, 106, 0.8)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#2E7D32';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    drawDecorations(track, cameraDistance) {
        const roadTop = this.height * 0.45;
        const roadLeft = this.width * 0.25;
        const roadRight = this.width * 0.75;

        const visibleDecos = [];
        for (const deco of track.decorations) {
            const distDiff = deco.distance - cameraDistance;
            if (distDiff < -50 || distDiff > 600) continue;

            const y = roadTop + distDiff * 1.3;
            
            const perspective = Utils.clamp(1 - distDiff / 800, 0.3, 1);
            const offsetScale = 0.9 + perspective * 0.5;
            
            const x = deco.side === 'left' 
                ? roadLeft - deco.offset * offsetScale 
                : roadRight + deco.offset * offsetScale;

            const minDistanceFromRoad = 60 * perspective;
            if (deco.side === 'left' && x > roadLeft - minDistanceFromRoad) continue;
            if (deco.side === 'right' && x < roadRight + minDistanceFromRoad) continue;

            if (y < roadTop - 30 || y > this.height + 30) continue;
            if (x < 80 || x > this.width - 80) continue;

            visibleDecos.push({ 
                ...deco, 
                x, 
                y, 
                distDiff, 
                perspective: perspective * deco.scale 
            });
        }

        visibleDecos.sort((a, b) => a.distDiff - b.distDiff);

        for (const deco of visibleDecos) {
            this.ctx.save();
            this.ctx.translate(deco.x, deco.y);
            this.ctx.scale(deco.perspective, deco.perspective);

            switch (deco.type) {
                case 'flower':
                    this.drawFlower(deco.color);
                    break;
                case 'tree':
                    this.drawTree();
                    break;
                case 'bush':
                    this.drawBush();
                    break;
                case 'rock':
                    this.drawRock();
                    break;
            }

            this.ctx.restore();
        }

        const colors = this.getThemeColors();
        for (const leaf of track.leaves) {
            const perspective = Utils.clamp(1 - leaf.y / 400, 0.4, 1);
            
            let leafX, leafY;
            if (leaf.side === 'left') {
                leafX = roadLeft - 120 - (200 - leaf.x) * perspective;
                leafY = roadTop + leaf.y;
            } else {
                leafX = roadRight + 120 + (leaf.x - 450) * perspective;
                leafY = roadTop + leaf.y;
            }
            
            if (leafX < 50 || leafX > this.width - 50) continue;
            if (leafY < roadTop - 30 || leafY > this.height + 30) continue;
            
            this.ctx.save();
            this.ctx.translate(leafX, leafY);
            this.ctx.rotate(leaf.rotation);
            this.ctx.scale(perspective, perspective);
            
            this.ctx.fillStyle = colors.leafColor;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }

    drawFlower(color) {
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -25);
        this.ctx.stroke();

        this.ctx.fillStyle = color || '#FF69B4';
        for (let i = 0; i < 5; i++) {
            this.ctx.save();
            this.ctx.translate(0, -25);
            this.ctx.rotate(i * Math.PI * 2 / 5);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -8, 6, 10, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, -25, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTree() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-8, -30, 16, 50);

        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -80);
        this.ctx.lineTo(-35, -30);
        this.ctx.lineTo(35, -30);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(0, -65);
        this.ctx.lineTo(-30, -20);
        this.ctx.lineTo(30, -20);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawBush() {
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath();
        this.ctx.arc(-15, -10, 20, 0, Math.PI * 2);
        this.ctx.arc(0, -20, 22, 0, Math.PI * 2);
        this.ctx.arc(15, -10, 18, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.arc(-8, -18, 4, 0, Math.PI * 2);
        this.ctx.arc(10, -15, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawRock() {
        this.ctx.fillStyle = '#808080';
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        this.ctx.lineTo(-25, -15);
        this.ctx.lineTo(-10, -25);
        this.ctx.lineTo(10, -20);
        this.ctx.lineTo(25, -10);
        this.ctx.lineTo(20, 0);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -12, 8, 5, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawUI(game) {
    }
}
