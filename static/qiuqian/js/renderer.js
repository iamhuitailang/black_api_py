const Renderer = {
    ctx: null,
    canvas: null,
    width: 0,
    height: 0,
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },
    
    render(game) {
        this.clear();
        
        const cameraX = this.calculateCameraX(game);
        
        Effects.drawBackground(this.ctx, cameraX, this.width, this.height);
        
        this.drawLevel(game.level, cameraX);
        this.drawSwings(game.level.swings, cameraX, game.player.onSwing);
        this.drawObstacles(game.level.obstacles, cameraX);
        this.drawPlayer(game.player, cameraX);
        Effects.drawParticles(this.ctx, cameraX);
        
        if (game.player.state === PLAYER_STATE.AIRBORNE) {
            this.drawTrajectoryPrediction(game.player, cameraX);
        }
        
        this.drawEndPoint(game.level, cameraX);
    },
    
    calculateCameraX(game) {
        const targetX = game.player.x - this.width * 0.3;
        const minX = 0;
        const maxX = Math.max(0, game.level.width - this.width);
        return Math.max(minX, Math.min(maxX, targetX));
    },
    
    drawLevel(level, cameraX) {
        level.islands.forEach(island => {
            this.drawIsland(island, cameraX);
        });
    },
    
    drawIsland(island, cameraX) {
        const x = island.x - cameraX;
        const y = island.y;
        
        this.ctx.fillStyle = CONFIG.COLORS.ISLAND_TOP;
        this.ctx.beginPath();
        this.ctx.ellipse(x + island.width / 2, y, island.width / 2, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = CONFIG.COLORS.ISLAND_SIDE;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.quadraticCurveTo(x + island.width / 2, y + island.height, x + island.width, y);
        this.ctx.lineTo(x, y);
        this.ctx.fill();
    },
    
    drawSwings(swings, cameraX, currentSwingId) {
        swings.forEach(swing => {
            const pos = Physics.calculateSwingPosition(swing);
            const screenX = swing.pivotX - cameraX;
            const playerScreenX = pos.x - cameraX;
            
            if (swing.id !== currentSwingId) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.15;
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.arc(playerScreenX, pos.y, CONFIG.COLLISION.SWING_CATCH_RADIUS, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.globalAlpha = 0.25;
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.restore();
            }
            
            this.ctx.strokeStyle = CONFIG.COLORS.SWING_ROPE;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, swing.pivotY);
            this.ctx.lineTo(playerScreenX, pos.y);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(screenX, swing.pivotY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = CONFIG.COLORS.SWING_SEAT;
            this.ctx.fillRect(playerScreenX - 20, pos.y - 5, 40, 10);
            
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(playerScreenX - 22, pos.y - 7, 4, 14);
            this.ctx.fillRect(playerScreenX + 18, pos.y - 7, 4, 14);
            
            if (swing.isEnd) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🏁', screenX, swing.pivotY - 30);
            }
        });
    },
    
    drawObstacles(obstacles, cameraX) {
        obstacles.forEach(obs => {
            switch (obs.type) {
                case OBSTACLE_TYPE.CLOUD:
                    this.drawCloudObstacle(obs, cameraX);
                    break;
                case OBSTACLE_TYPE.ROPE:
                    this.drawRopeObstacle(obs, cameraX);
                    break;
                case OBSTACLE_TYPE.WIND:
                    this.drawWindZone(obs, cameraX);
                    break;
            }
        });
    },
    
    drawCloudObstacle(cloud, cameraX) {
        const x = cloud.x - cameraX;
        Effects.drawCloud(this.ctx, x, cloud.y, cloud.radius * 2, 0.7);
    },
    
    drawRopeObstacle(rope, cameraX) {
        this.ctx.strokeStyle = CONFIG.COLORS.ROPE_OBSTACLE;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(rope.x1 - cameraX, rope.y1);
        this.ctx.lineTo(rope.x2 - cameraX, rope.y2);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(rope.x1 - cameraX, rope.y1);
        this.ctx.lineTo(rope.x2 - cameraX, rope.y2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    },
    
    drawWindZone(wind, cameraX) {
        const x = wind.x - cameraX;
        const pulse = Math.sin(wind.phase) * 0.2 + 0.8;
        
        this.ctx.fillStyle = `rgba(135, 206, 235, ${0.2 * pulse})`;
        this.ctx.fillRect(x, wind.y, wind.width, wind.height);
        
        this.ctx.strokeStyle = `rgba(100, 149, 237, ${0.5 * pulse})`;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lineY = wind.y + (i + 0.5) * (wind.height / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(x, lineY);
            const endX = x + wind.width * (0.5 + Math.sin(wind.phase + i) * 0.3);
            this.ctx.quadraticCurveTo(x + wind.width * 0.5, lineY + 10, endX, lineY);
            this.ctx.stroke();
        }
    },
    
    drawPlayer(player, cameraX) {
        const x = player.x - cameraX;
        const y = player.y;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        if (player.state === PLAYER_STATE.AIRBORNE) {
            const angle = Math.atan2(player.vy, player.vx);
            this.ctx.rotate(angle + Math.PI / 2);
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        const skin = {
            highlight: '#FAE8DC',
            light: '#F5D5C0',
            base: '#E8B89D',
            shadow: '#D4A58A',
            dark: '#C4957A',
            deep: '#A67B5B'
        };
        const jacket = {
            highlight: '#85C1E9',
            light: '#5DADE2',
            base: '#3498DB',
            shadow: '#2980B9',
            dark: '#1F618D'
        };
        const pants = {
            base: '#2C3E50',
            shadow: '#1A252F',
            highlight: '#34495E'
        };
        const boots = {
            base: '#5D4E37',
            shadow: '#3E3226',
            light: '#6B5B45'
        };
        const hair = {
            base: '#4A3728',
            shadow: '#2D1F17',
            highlight: '#6B4F3D',
            strand: '#5D4533'
        };
        
        this.ctx.strokeStyle = pants.base;
        this.ctx.lineWidth = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(-7, 12);
        this.ctx.quadraticCurveTo(-9, 24, -12, 34);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(7, 12);
        this.ctx.quadraticCurveTo(9, 24, 12, 34);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = pants.highlight;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 14);
        this.ctx.quadraticCurveTo(-7, 22, -10, 32);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = pants.shadow;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-9, 14);
        this.ctx.quadraticCurveTo(-11, 24, -14, 34);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(9, 14);
        this.ctx.quadraticCurveTo(11, 24, 14, 34);
        this.ctx.stroke();
        
        this.ctx.fillStyle = boots.base;
        this.ctx.beginPath();
        this.ctx.ellipse(-12, 37, 9, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(12, 37, 9, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = boots.shadow;
        this.ctx.beginPath();
        this.ctx.ellipse(-12, 37, 9, 6, 0, 0.4 * Math.PI, 1.6 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(12, 37, 9, 6, 0, 0.4 * Math.PI, 1.6 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = boots.light;
        this.ctx.beginPath();
        this.ctx.ellipse(-10, 35, 3, 2, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(14, 35, 3, 2, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        const bodyGrad = this.ctx.createLinearGradient(-18, -10, 18, 20);
        bodyGrad.addColorStop(0, jacket.highlight);
        bodyGrad.addColorStop(0.2, jacket.light);
        bodyGrad.addColorStop(0.5, jacket.base);
        bodyGrad.addColorStop(0.8, jacket.shadow);
        bodyGrad.addColorStop(1, jacket.dark);
        this.ctx.fillStyle = bodyGrad;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-16, -6);
        this.ctx.lineTo(-18, 18);
        this.ctx.quadraticCurveTo(0, 24, 18, 18);
        this.ctx.lineTo(16, -6);
        this.ctx.quadraticCurveTo(0, -10, -16, -6);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(-8, 0, 5, 10, -0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.beginPath();
        this.ctx.ellipse(6, 4, 4, 8, 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -4);
        this.ctx.lineTo(-7, 18);
        this.ctx.lineTo(7, 18);
        this.ctx.lineTo(5, -4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#C0392B';
        this.ctx.fillRect(-3, -2, 6, 16);
        
        this.ctx.fillStyle = '#F1C40F';
        this.ctx.beginPath();
        this.ctx.arc(0, 8, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#F39C12';
        this.ctx.beginPath();
        this.ctx.arc(0, 8, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (player.state === PLAYER_STATE.SWINGING || player.state === PLAYER_STATE.CHARGING) {
            this.ctx.strokeStyle = skin.base;
            this.ctx.lineWidth = 9;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-16, -2);
            this.ctx.quadraticCurveTo(-20, -14, -18, -30);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(16, -2);
            this.ctx.quadraticCurveTo(20, -14, 18, -30);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = skin.highlight;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-14, 0);
            this.ctx.quadraticCurveTo(-18, -12, -16, -28);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(14, 0);
            this.ctx.quadraticCurveTo(18, -12, 16, -28);
            this.ctx.stroke();
            
            this.ctx.fillStyle = skin.base;
            this.ctx.beginPath();
            this.ctx.ellipse(-18, -32, 6, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(18, -32, 6, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(-24, -36, 12, 10);
            this.ctx.fillRect(12, -36, 12, 10);
            this.ctx.fillStyle = '#6B3410';
            this.ctx.fillRect(-24, -36, 12, 3);
            this.ctx.fillRect(12, -36, 12, 3);
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(-22, -33, 8, 2);
            this.ctx.fillRect(14, -33, 8, 2);
        } else {
            const armSwing = Math.sin(Date.now() / 80) * 16;
            
            this.ctx.strokeStyle = skin.base;
            this.ctx.lineWidth = 9;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-16, -2);
            this.ctx.quadraticCurveTo(-26 + armSwing * 0.4, 6, -28 + armSwing, 14);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(16, -2);
            this.ctx.quadraticCurveTo(26 - armSwing * 0.4, 6, 28 - armSwing, 14);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = skin.highlight;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-14, 0);
            this.ctx.quadraticCurveTo(-24 + armSwing * 0.4, 8, -26 + armSwing, 16);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(14, 0);
            this.ctx.quadraticCurveTo(24 - armSwing * 0.4, 8, 26 - armSwing, 16);
            this.ctx.stroke();
            
            this.ctx.fillStyle = skin.base;
            this.ctx.beginPath();
            this.ctx.ellipse(-28 + armSwing, 18, 6, 5, armSwing * 0.015, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(28 - armSwing, 18, 6, 5, -armSwing * 0.015, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = skin.highlight;
            this.ctx.beginPath();
            this.ctx.ellipse(-27 + armSwing, 16, 2, 1.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(29 - armSwing, 16, 2, 1.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        const neckGrad = this.ctx.createLinearGradient(-8, -14, 8, -4);
        neckGrad.addColorStop(0, skin.base);
        neckGrad.addColorStop(0.5, skin.shadow);
        neckGrad.addColorStop(1, skin.dark);
        this.ctx.fillStyle = neckGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -12, 8, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = skin.highlight;
        this.ctx.beginPath();
        this.ctx.ellipse(-3, -13, 3, 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const headGrad = this.ctx.createRadialGradient(-5, -30, 3, 1, -28, 18);
        headGrad.addColorStop(0, skin.highlight);
        headGrad.addColorStop(0.3, skin.light);
        headGrad.addColorStop(0.6, skin.base);
        headGrad.addColorStop(0.85, skin.shadow);
        headGrad.addColorStop(1, skin.dark);
        this.ctx.fillStyle = headGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -30, 15, 17, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = skin.shadow;
        this.ctx.beginPath();
        this.ctx.ellipse(7, -25, 5, 4, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = skin.highlight;
        this.ctx.beginPath();
        this.ctx.ellipse(-6, -32, 4, 3, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = hair.base;
        this.ctx.beginPath();
        this.ctx.moveTo(-14, -26);
        this.ctx.quadraticCurveTo(-16, -44, 0, -46);
        this.ctx.quadraticCurveTo(16, -44, 14, -26);
        this.ctx.quadraticCurveTo(10, -32, 0, -30);
        this.ctx.quadraticCurveTo(-10, -32, -14, -26);
        this.ctx.fill();
        
        this.ctx.fillStyle = hair.highlight;
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -41, 5, 3.5, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(-2, -37, 3, 2, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = hair.shadow;
        this.ctx.beginPath();
        this.ctx.ellipse(6, -36, 6, 4.5, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = hair.strand;
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-8 + i * 4, -42);
            this.ctx.quadraticCurveTo(-7 + i * 4, -38, -6 + i * 4, -34);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.ellipse(-6, -28, 3.5, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(6, -28, 3.5, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#1A252F';
        this.ctx.beginPath();
        this.ctx.ellipse(-6, -28, 2, 2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(6, -28, 2, 2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-4.5, -29.5, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(7.5, -29.5, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(-5.5, -28.5, 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(6.5, -28.5, 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fillRect(-9, -33, 6, 1);
        this.ctx.fillRect(3, -33, 6, 1);
        
        this.ctx.fillStyle = skin.deep;
        this.ctx.beginPath();
        this.ctx.ellipse(-6, -28, 2, 1, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(6, -28, 2, 1, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = skin.dark;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -23, 2.5, 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = skin.shadow;
        this.ctx.beginPath();
        this.ctx.ellipse(-1, -23.5, 1, 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#922B21';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -19);
        this.ctx.quadraticCurveTo(-2, -16, 0, -17);
        this.ctx.quadraticCurveTo(2, -16, 5, -19);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#B03A2E';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -18, 2, 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(-11, -22, 5, 3.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(11, -22, 5, 3.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    },
    
    drawTrajectoryPrediction(player, cameraX) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#FFD700';
        
        let px = player.x;
        let py = player.y;
        let pvx = player.vx;
        let pvy = player.vy;
        
        for (let i = 0; i < 30; i++) {
            pvy += CONFIG.GRAVITY * 0.5;
            pvx *= CONFIG.AIR_RESISTANCE;
            pvy *= CONFIG.AIR_RESISTANCE;
            px += pvx;
            py += pvy;
            
            this.ctx.beginPath();
            this.ctx.arc(px - cameraX, py, 3 - i * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    },
    
    drawEndPoint(level, cameraX) {
        const x = level.endX - cameraX;
        const y = level.endY;
        
        this.ctx.save();
        
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 80);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 80, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏁', x, y);
        
        this.ctx.restore();
    }
};
