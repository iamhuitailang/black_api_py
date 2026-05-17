class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.time = 0;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#E0F7FF');
        gradient.addColorStop(0.7, '#FFE4E1');
        gradient.addColorStop(1, '#FFDAB9');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawClouds();
        this.drawStars();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        const cloudPositions = [
            { x: 100 + Math.sin(this.time * 0.001) * 20, y: 80, scale: 1 },
            { x: 500 + Math.cos(this.time * 0.0015) * 30, y: 150, scale: 0.8 },
            { x: 300 + Math.sin(this.time * 0.002) * 25, y: 250, scale: 1.2 }
        ];
        
        for (const cloud of cloudPositions) {
            this.drawCloud(cloud.x, cloud.y, cloud.scale);
        }
    }
    
    drawCloud(x, y, scale) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 30 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 60 * scale, y, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 30 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawStars() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 137.5) % this.width;
            const y = 50 + (i * 73.7) % 300;
            const size = 1 + Math.sin(this.time * 0.003 + i) * 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBubble(bubble) {
        const pos = bubble.getDisplayPosition();
        const x = pos.x;
        const y = pos.y;
        const radius = CONSTANTS.BUBBLE_RADIUS * bubble.scale;
        
        this.ctx.save();
        this.ctx.globalAlpha = bubble.opacity;
        this.ctx.translate(x, y);
        this.ctx.rotate(bubble.rotation);
        
        const gradient = this.ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
        const color = bubble.displayColor;
        
        gradient.addColorStop(0, Helpers.lightenColor(color, 30));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, Helpers.darkenColor(color, 20));
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(radius * 0.2, radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fill();
        
        if (bubble.type !== 'normal') {
            this.ctx.font = `${radius * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(bubble.config.icon, 0, 0);
        }
        
        this.ctx.restore();
    }
    
    drawGrid(grid) {
        for (const bubble of grid.getAllBubbles()) {
            this.drawBubble(bubble);
        }
    }
    
    drawLauncher(launcher) {
        const x = launcher.x;
        const y = launcher.y + launcher.recoilOffset;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        const baseGradient = this.ctx.createLinearGradient(-40, 0, 40, 0);
        baseGradient.addColorStop(0, '#4A5568');
        baseGradient.addColorStop(0.5, '#718096');
        baseGradient.addColorStop(1, '#4A5568');
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, 20, 50, 20, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = baseGradient;
        this.ctx.fill();
        
        this.ctx.rotate((launcher.angle - 90) * Math.PI / 180);
        
        const barrelGradient = this.ctx.createLinearGradient(0, -15, 0, 15);
        barrelGradient.addColorStop(0, launcher.config.color);
        barrelGradient.addColorStop(0.5, Helpers.lightenColor(launcher.config.color, 20));
        barrelGradient.addColorStop(1, launcher.config.color);
        
        this.ctx.fillStyle = barrelGradient;
        this.ctx.fillRect(0, -12, 80, 24);
        
        this.ctx.beginPath();
        this.ctx.arc(80, 0, 18, 0, Math.PI * 2);
        this.ctx.fillStyle = launcher.config.color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        if (launcher.flashEffect > 0) {
            this.ctx.beginPath();
            this.ctx.arc(80, 0, 25 + launcher.flashEffect * 20, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${launcher.flashEffect * 0.5})`;
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        if (launcher.currentBubble && !launcher.isFiring) {
            const bubble = launcher.currentBubble;
            bubble.x = x;
            bubble.y = y - 30;
            this.drawBubble(bubble);
        }
        
        this.drawAimLine(launcher);
    }
    
    drawAimLine(launcher) {
        const trajectory = Physics.predictTrajectory(
            launcher.angle,
            launcher.x,
            launcher.y - 30,
            launcher.gameState ? launcher.gameState.grid : new Grid(),
            150
        );
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(trajectory[0].x, trajectory[0].y);
        
        for (let i = 1; i < trajectory.length; i++) {
            this.ctx.lineTo(trajectory[i].x, trajectory[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
        
        if (trajectory.length > 1) {
            const end = trajectory[trajectory.length - 1];
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    drawParticles(particles) {
        for (const p of particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawScorePopups(popups) {
        for (const popup of popups) {
            const alpha = popup.life / popup.maxLife;
            const scale = 0.5 + (1 - alpha) * 0.5;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(popup.x, popup.y);
            this.ctx.scale(scale, scale);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(`+${popup.value}`, 0, 0);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`+${popup.value}`, 0, 0);
            
            this.ctx.restore();
        }
    }
    
    drawCombo(combo) {
        if (combo > 1) {
            this.ctx.save();
            this.ctx.translate(this.width / 2, this.height / 2);
            
            const scale = 1 + Math.sin(this.time * 0.01) * 0.1;
            this.ctx.scale(scale, scale);
            
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 6;
            this.ctx.strokeText(`${combo}x COMBO!`, 0, 0);
            
            const gradient = this.ctx.createLinearGradient(-100, 0, 100, 0);
            gradient.addColorStop(0, '#FF6B6B');
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(1, '#FF6B6B');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillText(`${combo}x COMBO!`, 0, 0);
            
            this.ctx.restore();
        }
    }
    
    render(gameState) {
        this.time += 16;
        
        this.ctx.save();
        
        if (gameState.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * gameState.screenShake;
            const shakeY = (Math.random() - 0.5) * gameState.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        this.clear();
        this.drawBackground();
        this.drawGrid(gameState.grid);
        
        if (gameState.activeBubble) {
            this.drawBubble(gameState.activeBubble);
        }
        
        if (gameState.launcher) {
            gameState.launcher.gameState = gameState;
            this.drawLauncher(gameState.launcher);
        }
        
        this.drawParticles(gameState.particles);
        this.drawScorePopups(gameState.scorePopups);
        this.drawCombo(gameState.combo);
        
        this.ctx.restore();
    }
}
