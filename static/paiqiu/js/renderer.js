const Renderer = {
    canvas: null,
    ctx: null,
    scale: 1,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const container = document.getElementById('game-container');
        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 40;
        
        const scaleX = maxWidth / CONFIG.CANVAS_WIDTH;
        const scaleY = maxHeight / CONFIG.CANVAS_HEIGHT;
        this.scale = Math.min(scaleX, scaleY, 1);
        
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        this.canvas.style.width = `${CONFIG.CANVAS_WIDTH * this.scale}px`;
        this.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * this.scale}px`;
    },

    clear() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    },

    drawBackground(environment) {
        const ctx = this.ctx;
        
        let skyGradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        if (environment?.effect === 'sun') {
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(0.4, '#FFE066');
            skyGradient.addColorStop(1, '#FFF9C4');
        } else {
            skyGradient.addColorStop(0, '#64B5F6');
            skyGradient.addColorStop(0.5, '#90CAF9');
            skyGradient.addColorStop(1, '#E3F2FD');
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.drawCloud(150, 80, 40);
        this.drawCloud(600, 60, 35);
        this.drawCloud(750, 100, 30);

        if (environment?.effect === 'sun') {
            const sunGradient = ctx.createRadialGradient(720, 100, 0, 720, 100, 80);
            sunGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            sunGradient.addColorStop(0.3, 'rgba(255, 236, 179, 0.8)');
            sunGradient.addColorStop(1, 'rgba(255, 236, 179, 0)');
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(720, 100, 80, 0, Math.PI * 2);
            ctx.fill();
        }

        if (environment?.effect === 'wind') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const y = 120 + i * 60 + Math.sin(Date.now() / 800 + i * 0.8) * 15;
                ctx.beginPath();
                ctx.moveTo(30 + Math.sin(Date.now() / 1000 + i) * 20, y);
                ctx.quadraticCurveTo(150, y - 25, 280, y);
                ctx.quadraticCurveTo(400, y + 25, 520, y);
                ctx.stroke();
            }
        }
    },

    drawCloud(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    },

    drawCourt() {
        const ctx = this.ctx;
        const court = CONFIG.COURT;
        
        const courtGradient = ctx.createLinearGradient(court.X, court.Y, court.X, court.Y + court.HEIGHT);
        courtGradient.addColorStop(0, '#66BB6A');
        courtGradient.addColorStop(0.3, '#81C784');
        courtGradient.addColorStop(0.7, '#7CB342');
        courtGradient.addColorStop(1, '#689F38');
        ctx.fillStyle = courtGradient;
        ctx.fillRect(court.X, court.Y, court.WIDTH, court.HEIGHT);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.ellipse(
                court.X + 100 + i * 90,
                court.Y + court.HEIGHT * 0.3,
                25,
                15,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 15; i++) {
            const x = court.X + 30 + i * 52;
            ctx.beginPath();
            ctx.moveTo(x, court.Y + 15);
            ctx.bezierCurveTo(
                x + 10, court.Y + court.HEIGHT * 0.3,
                x - 10, court.Y + court.HEIGHT * 0.7,
                x + 5, court.Y + court.HEIGHT - 15
            );
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.strokeRect(court.X + 15, court.Y + 15, court.WIDTH - 30, court.HEIGHT - 30);
        
        ctx.lineWidth = 4;
        ctx.strokeRect(court.X + 80, court.Y + 15, court.WIDTH - 160, court.HEIGHT - 30);
        
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(court.X + court.WIDTH / 2, court.Y + 15);
        ctx.lineTo(court.X + court.WIDTH / 2, court.Y + court.HEIGHT - 15);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(court.X + 50, court.Y + court.HEIGHT * 0.65);
        ctx.lineTo(court.X + court.WIDTH - 50, court.Y + court.HEIGHT * 0.65);
        ctx.stroke();
    },

    drawNet(shakeOffset = 0) {
        const ctx = this.ctx;
        const net = CONFIG.NET;
        
        const poleGradient = ctx.createLinearGradient(net.X - 15, 0, net.X + 15, 0);
        poleGradient.addColorStop(0, '#8D6E63');
        poleGradient.addColorStop(0.3, '#6D4C41');
        poleGradient.addColorStop(0.5, '#5D4037');
        poleGradient.addColorStop(0.7, '#6D4C41');
        poleGradient.addColorStop(1, '#8D6E63');
        
        ctx.fillStyle = poleGradient;
        ctx.fillRect(net.X - 12, net.TOP - 20, 8, net.HEIGHT + 40);
        ctx.fillRect(net.X + 4, net.TOP - 20, 8, net.HEIGHT + 40);
        
        const capGradient = ctx.createLinearGradient(net.X - 20, 0, net.X + 20, 0);
        capGradient.addColorStop(0, '#ECEFF1');
        capGradient.addColorStop(0.5, '#CFD8DC');
        capGradient.addColorStop(1, '#B0BEC5');
        ctx.fillStyle = capGradient;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(net.X - 20, net.TOP - 28, 40, 12, 3);
        } else {
            ctx.rect(net.X - 20, net.TOP - 28, 40, 12);
        }
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 0.8;
        
        const netLeft = net.X - 4;
        const netRight = net.X + 4;
        
        for (let i = 0; i <= 20; i++) {
            const progress = i / 20;
            const x = netLeft + progress * 8;
            const waveOffset = shakeOffset ? Math.sin(shakeOffset + i * 0.5) * 3 : 0;
            ctx.beginPath();
            ctx.moveTo(x + waveOffset, net.TOP);
            ctx.lineTo(x + waveOffset, net.TOP + net.HEIGHT);
            ctx.stroke();
        }
        
        for (let i = 0; i <= 14; i++) {
            const y = net.TOP + (i / 14) * net.HEIGHT;
            ctx.beginPath();
            ctx.moveTo(netLeft, y);
            ctx.lineTo(netRight, y);
            ctx.stroke();
        }
    },

    drawPlayer(player) {
        const ctx = this.ctx;
        const isEnemy = player.isEnemy;
        const baseColor = isEnemy ? CONFIG.COLORS.ENEMY : CONFIG.COLORS.PLAYER;
        const lightColor = isEnemy ? '#FF8A80' : '#81D4FA';
        const darkColor = isEnemy ? '#B71C1C' : '#0D47A1';
        const skinColor = '#FFCC80';
        const skinLight = '#FFE0B2';
        const skinDark = '#FFB74D';
        
        const cx = player.x + player.width / 2;
        const playerBottom = player.y + player.height;
        
        ctx.save();
        ctx.translate(cx, playerBottom);
        
        const shadowY = player.groundY + player.height;
        const jumpHeight = player.groundY - player.y;
        const shadowScale = Math.max(0.3, 1 - jumpHeight / 150);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadowScale})`;
        ctx.beginPath();
        ctx.ellipse(0, shadowY - playerBottom, 16 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const legSwing = Math.sin(player.animFrame * 0.6) * (Math.abs(player.vx) > 0.5 ? 6 : 2);
        
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-6, -30);
        ctx.quadraticCurveTo(-10 + legSwing, -20, -8 + legSwing, -5);
        ctx.lineTo(-2 + legSwing, -5);
        ctx.quadraticCurveTo(0, -20, 0, -30);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(6, -30);
        ctx.quadraticCurveTo(10 - legSwing, -20, 8 - legSwing, -5);
        ctx.lineTo(2 - legSwing, -5);
        ctx.quadraticCurveTo(0, -20, 0, -30);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(-5 + legSwing, -1, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5 - legSwing, -1, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#424242';
        ctx.fillRect(-9 + legSwing, -3, 10, 2);
        ctx.fillRect(-1 - legSwing, -3, 10, 2);
        
        const bodyGradient = ctx.createLinearGradient(-18, -65, 18, -25);
        bodyGradient.addColorStop(0, lightColor);
        bodyGradient.addColorStop(0.4, baseColor);
        bodyGradient.addColorStop(1, darkColor);
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(-16, -58);
        ctx.quadraticCurveTo(-20, -62, -14, -64);
        ctx.lineTo(14, -64);
        ctx.quadraticCurveTo(20, -62, 16, -58);
        ctx.lineTo(14, -32);
        ctx.quadraticCurveTo(0, -28, -14, -32);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-5, -50, 4, 14, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -58);
        ctx.lineTo(0, -32);
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isEnemy ? '2' : '1', 0, -42);
        
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (player.isSpiking) {
            ctx.strokeStyle = skinColor;
            ctx.lineWidth = 7;
            
            ctx.beginPath();
            ctx.moveTo(14, -54);
            ctx.quadraticCurveTo(24, -68, 38, -82);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(40, -85, 7, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
            ctx.strokeStyle = skinColor;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(-14, -54);
            ctx.quadraticCurveTo(-20, -45, -26, -35);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(-28, -32, 6, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
        } else if (player.isBlocking) {
            ctx.strokeStyle = skinColor;
            ctx.lineWidth = 7;
            
            ctx.beginPath();
            ctx.moveTo(14, -56);
            ctx.lineTo(20, -88);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(22, -92, 7, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(-14, -56);
            ctx.lineTo(-20, -88);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(-22, -92, 7, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
            ctx.fillStyle = 'rgba(100, 181, 246, 0.3)';
            ctx.beginPath();
            ctx.moveTo(-28, -102);
            ctx.lineTo(-28, -75);
            ctx.quadraticCurveTo(0, -68, 28, -75);
            ctx.lineTo(28, -102);
            ctx.quadraticCurveTo(0, -95, -28, -102);
            ctx.closePath();
            ctx.fill();
            
        } else if (player.isReceiving) {
            ctx.strokeStyle = skinColor;
            ctx.lineWidth = 7;
            
            ctx.beginPath();
            ctx.moveTo(14, -52);
            ctx.quadraticCurveTo(22, -40, 30, -28);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(32, -26, 6, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(-14, -52);
            ctx.quadraticCurveTo(-22, -40, -30, -28);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(-32, -26, 6, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
            ctx.fillStyle = '#37474F';
            ctx.fillRect(24, -22, 16, 5);
            ctx.fillRect(-40, -22, 16, 5);
            
        } else {
            const swingX = Math.sin(player.animFrame * 0.8) * 4;
            
            ctx.strokeStyle = skinColor;
            ctx.lineWidth = 6;
            
            ctx.beginPath();
            ctx.moveTo(14, -54);
            ctx.quadraticCurveTo(18 + swingX, -45, 20 + swingX, -36);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(21 + swingX, -34, 5, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(-14, -54);
            ctx.quadraticCurveTo(-18 - swingX, -45, -20 - swingX, -36);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(-21 - swingX, -34, 5, 0, Math.PI * 2);
            ctx.fillStyle = skinColor;
            ctx.fill();
        }
        
        const skinGradient = ctx.createRadialGradient(-2, -72, 0, 0, -72, 14);
        skinGradient.addColorStop(0, skinLight);
        skinGradient.addColorStop(0.6, skinColor);
        skinGradient.addColorStop(1, skinDark);
        ctx.fillStyle = skinGradient;
        ctx.beginPath();
        ctx.arc(0, -72, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-5, -76, 4, 3.5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(-13, -74);
        ctx.quadraticCurveTo(-9, -80, 0, -82);
        ctx.quadraticCurveTo(11, -84, 13, -68);
        ctx.lineTo(13, -64);
        ctx.lineTo(-13, -64);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = darkColor;
        ctx.fillRect(-13, -66, 26, 3);
        
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(0, -64, 12, Math.PI * 0.1, Math.PI * 0.9, true);
        ctx.fill();
        
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.ellipse(-5, -73, 2.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, -73, 2.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-4, -74, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -74, 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -67, 3.5, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-5, -62, 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(5, -62, 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    },

    drawBall(ball) {
        const ctx = this.ctx;
        
        if (ball.trail.length > 0) {
            ball.trail.forEach((t, i) => {
                const alpha = t.alpha * (1 - i * 0.1);
                if (alpha <= 0) return;
                ctx.beginPath();
                ctx.arc(t.x, t.y, ball.radius * (1 - i * 0.12), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 235, 59, ${alpha * 0.6})`;
                ctx.fill();
            });
        }
        
        const ballGradient = ctx.createRadialGradient(
            ball.x - 5, ball.y - 5, 0,
            ball.x, ball.y, ball.radius
        );
        ballGradient.addColorStop(0, '#FFFDE7');
        ballGradient.addColorStop(0.25, CONFIG.COLORS.BALL);
        ballGradient.addColorStop(0.6, '#FFD600');
        ballGradient.addColorStop(1, '#FF8F00');
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ballGradient;
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(ball.x - 5, ball.y - 5, 4, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.lineWidth = 1.2;
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y, ball.radius * 0.95, ball.radius * 0.35, 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y, ball.radius * 0.35, ball.radius * 0.95, 0.5, 0, Math.PI * 2);
        ctx.stroke();
    },

    drawEffects(effects) {
        const ctx = this.ctx;
        
        effects.forEach(effect => {
            const progress = effect.frame / effect.maxFrames;
            
            switch (effect.type) {
                case 'scoreFlash':
                    ctx.fillStyle = `rgba(255, 215, 0, ${(1 - progress) * 0.25})`;
                    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                    break;
                    
                case 'spike':
                    ctx.strokeStyle = `rgba(255, 100, 100, ${(1 - progress) * 0.8})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, 25 + progress * 60, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.strokeStyle = `rgba(255, 200, 100, ${(1 - progress) * 0.6})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, 15 + progress * 40, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
            }
        });
    },

    getNetShakeOffset(effects) {
        const netShake = effects.find(e => e.type === 'netShake');
        if (netShake) {
            return Math.sin(netShake.frame * 0.8) * 4 * (1 - netShake.frame / netShake.maxFrames);
        }
        return 0;
    },

    render(gameState) {
        this.clear();
        this.drawBackground(gameState.environment);
        this.drawCourt();
        
        const netShake = this.getNetShakeOffset(gameState.effectsManager?.effects || []);
        this.drawNet(netShake);
        
        this.drawPlayer(gameState.player);
        if (!gameState.mode?.hasWall) {
            this.drawPlayer(gameState.enemy);
        }
        
        this.drawBall(gameState.ball);
        this.drawEffects(gameState.effectsManager?.effects || []);
    }
};
