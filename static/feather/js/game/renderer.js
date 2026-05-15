const Renderer = (() => {
    let canvas, ctx;
    let width, height;

    const init = (canvasId) => {
        canvas = document.getElementById(canvasId);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    };

    const resize = () => {
        const container = canvas.parentElement;
        const aspectRatio = 550 / 600;
        let newWidth = Math.min(container.clientWidth, 550);
        let newHeight = newWidth / aspectRatio;

        if (newHeight > container.clientHeight) {
            newHeight = container.clientHeight;
            newWidth = newHeight * aspectRatio;
        }

        canvas.width = 550;
        canvas.height = 600;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        width = 550;
        height = 600;
    };

    const clear = () => {
        ctx.clearRect(0, 0, width, height);
    };

    const drawBackground = (theme) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, theme.skyTop);
        gradient.addColorStop(1, theme.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        switch (theme.type) {
            case 'cloud':
                drawCloudDecorations();
                break;
            case 'forest':
                drawForestDecorations();
                break;
            case 'sunset':
                drawSunsetDecorations();
                break;
            case 'starry':
                drawStarryDecorations();
                break;
            case 'storm':
                drawStormDecorations();
                break;
        }

        drawGround(theme);
    };

    const drawCloudDecorations = () => {
        const time = Date.now() * 0.0005;
        drawCloud(50 + Math.sin(time) * 5, 80, 60);
        drawCloud(200 + Math.sin(time + 1) * 8, 50, 50);
        drawCloud(400 + Math.sin(time + 2) * 6, 100, 55);
        drawCloud(300 + Math.sin(time + 0.5) * 4, 130, 45);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(480, 60, 40, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawCloud = (x, y, size) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawForestDecorations = () => {
        const time = Date.now() * 0.001;
        
        drawTree(30, 150, 0.7);
        drawTree(480, 120, 0.8);
        drawTree(100, 180, 0.5);
        
        for (let i = 0; i < 8; i++) {
            const leafX = 50 + i * 60 + Math.sin(time + i) * 10;
            const leafY = 200 + (i % 3) * 80 + Math.cos(time + i * 0.7) * 5;
            drawLeaf(leafX, leafY, time + i);
        }
    };

    const drawTree = (x, y, scale) => {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x + 15 * scale, y, 20 * scale, 80 * scale);
        
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x + 25 * scale, y - 40 * scale);
        ctx.lineTo(x - 10 * scale, y + 30 * scale);
        ctx.lineTo(x + 60 * scale, y + 30 * scale);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#388E3C';
        ctx.beginPath();
        ctx.moveTo(x + 25 * scale, y - 60 * scale);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 50 * scale, y);
        ctx.closePath();
        ctx.fill();
    };

    const drawLeaf = (x, y, rotation) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const drawSunsetDecorations = () => {
        const time = Date.now() * 0.0003;
        
        const sunGradient = ctx.createRadialGradient(450, 80, 0, 450, 80, 80);
        sunGradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
        sunGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.5)');
        sunGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(450, 80, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(100, 50, 80, 0.3)';
        for (let i = 0; i < 5; i++) {
            const hillY = 250 + i * 30;
            ctx.beginPath();
            ctx.moveTo(0, hillY + 50);
            ctx.quadraticCurveTo(100 + i * 20, hillY - 20, 275, hillY);
            ctx.quadraticCurveTo(400 - i * 15, hillY + 10, 550, hillY + 40);
            ctx.lineTo(550, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();
        }
        
        for (let i = 0; i < 5; i++) {
            const birdX = 100 + i * 80 + Math.sin(time + i) * 20;
            const birdY = 100 + (i % 2) * 30 + Math.cos(time + i) * 10;
            drawBird(birdX, birdY, time * 2 + i);
        }
    };

    const drawBird = (x, y, time) => {
        ctx.strokeStyle = 'rgba(50, 30, 40, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.quadraticCurveTo(x - 4, y - 5 + Math.sin(time) * 3, x, y);
        ctx.quadraticCurveTo(x + 4, y - 5 + Math.sin(time) * 3, x + 8, y);
        ctx.stroke();
    };

    const drawStarryDecorations = () => {
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 60; i++) {
            const x = (i * 41) % width;
            const y = (i * 29) % (height * 0.6);
            const size = 1 + (i % 4) * 0.5;
            const twinkle = 0.4 + Math.sin(time * 2 + i) * 0.4;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(255, 250, 230, 0.9)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 250, 230, 0.5)';
        ctx.beginPath();
        ctx.arc(80, 70, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1A1A4E';
        ctx.beginPath();
        ctx.arc(90, 65, 25, 0, Math.PI * 2);
        ctx.fill();
        
        if (Math.sin(time * 0.5) > 0.8) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(300, 50);
            ctx.lineTo(280 + Math.sin(time * 5) * 20, 80);
            ctx.stroke();
        }
    };

    const drawStormDecorations = () => {
        const time = Date.now() * 0.001;
        
        ctx.fillStyle = 'rgba(60, 60, 80, 0.4)';
        drawStormCloud(100 + Math.sin(time) * 10, 50, 80);
        drawStormCloud(300 + Math.sin(time + 1) * 8, 30, 100);
        drawStormCloud(450 + Math.sin(time + 2) * 6, 70, 70);
        
        ctx.strokeStyle = 'rgba(255, 255, 150, 0.6)';
        ctx.lineWidth = 3;
        if (Math.sin(time * 3) > 0.95) {
            ctx.beginPath();
            ctx.moveTo(200, 20);
            ctx.lineTo(190, 60);
            ctx.lineTo(210, 70);
            ctx.lineTo(185, 120);
            ctx.stroke();
        }
        if (Math.sin(time * 2.5 + 1) > 0.96) {
            ctx.beginPath();
            ctx.moveTo(400, 10);
            ctx.lineTo(410, 50);
            ctx.lineTo(390, 65);
            ctx.lineTo(420, 100);
            ctx.stroke();
        }
    };

    const drawStormCloud = (x, y, size) => {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y - size * 0.15, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawGround = (theme) => {
        const gradient = ctx.createLinearGradient(0, height - 30, 0, height);
        gradient.addColorStop(0, theme.ground);
        gradient.addColorStop(1, shadeColor(theme.ground, -20));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - 30, width, 30);
        
        ctx.strokeStyle = shadeColor(theme.ground, -10);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 30);
        ctx.lineTo(width, height - 30);
        ctx.stroke();
    };

    const shadeColor = (color, percent) => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const drawSafeZone = (safeZone, time) => {
        const x = safeZone.x;
        const w = safeZone.width;
        const glow = 0.4 + Math.sin(time * 0.003) * 0.2;
        
        ctx.shadowBlur = 30;
        ctx.shadowColor = `rgba(0, 255, 128, ${glow})`;
        
        const gradient = ctx.createLinearGradient(x, height - 30, x, height);
        gradient.addColorStop(0, `rgba(0, 255, 128, ${glow})`);
        gradient.addColorStop(1, `rgba(0, 200, 100, ${glow * 0.8})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - 30, w, 30);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#00FF80';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, height - 30, w, 30);
        
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            const arrowX = x + w / 4 + i * w / 4;
            const bounce = Math.sin(time * 0.005 + i) * 3;
            ctx.beginPath();
            ctx.moveTo(arrowX, height - 22 + bounce);
            ctx.lineTo(arrowX - 4, height - 15 + bounce);
            ctx.lineTo(arrowX + 4, height - 15 + bounce);
            ctx.closePath();
            ctx.fill();
        }
    };

    const drawWindParticles = (particles) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        particles.forEach(particle => {
            ctx.globalAlpha = particle.opacity;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x + particle.length, particle.y);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    };

    const drawFeather = (feather) => {
        ctx.save();
        ctx.translate(feather.x, feather.y);
        ctx.rotate(feather.rotation);
        
        if (feather.hasShield) {
            const time = Date.now() * 0.003;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, 35 + i * 5 + Math.sin(time + i) * 2, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 - i * 0.1})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
            ctx.fill();
        }
        
        const gradient = ctx.createLinearGradient(-15, 0, 15, 0);
        gradient.addColorStop(0, feather.secondaryColor);
        gradient.addColorStop(0.5, feather.color);
        gradient.addColorStop(1, feather.secondaryColor);
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.quadraticCurveTo(15, -10, 12, 5);
        ctx.quadraticCurveTo(5, 20, 0, 25);
        ctx.quadraticCurveTo(-5, 20, -12, 5);
        ctx.quadraticCurveTo(-15, -10, 0, -20);
        ctx.fill();
        
        ctx.strokeStyle = feather.secondaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 20);
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
            const yPos = -10 + i * 6;
            const spread = 8 + Math.abs(i) * 1.5;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(spread, yPos - 2);
            ctx.moveTo(0, yPos);
            ctx.lineTo(-spread, yPos - 2);
            ctx.stroke();
        }
        
        if (feather.isSlow) {
            const time = Date.now() * 0.005;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, 25 + i * 8 + Math.sin(time + i) * 3, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 - i * 0.1})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        ctx.restore();
    };

    const drawObstacles = (obstacles, time) => {
        obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'spike':
                    drawSpike(obstacle);
                    break;
                case 'rock':
                    drawRock(obstacle);
                    break;
                case 'moving':
                    drawMovingObstacle(obstacle);
                    break;
                case 'vortex':
                    drawVortex(obstacle, time);
                    break;
            }
        });
    };

    const drawSpike = (obstacle) => {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FF6666';
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y + 5);
        ctx.lineTo(obstacle.x + 5, obstacle.y + obstacle.height - 5);
        ctx.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height - 5);
        ctx.closePath();
        ctx.fill();
    };

    const drawRock = (obstacle) => {
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 10);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 15, 8);
        ctx.fill();
    };

    const drawMovingObstacle = (obstacle) => {
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 8);
        ctx.fill();
        
        ctx.fillStyle = '#FFAA44';
        ctx.beginPath();
        ctx.roundRect(obstacle.x + 3, obstacle.y + 3, obstacle.width - 6, obstacle.height - 6, 6);
        ctx.fill();
    };

    const drawVortex = (obstacle, time) => {
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        
        for (let i = 3; i >= 0; i--) {
            const radius = obstacle.radius * (0.3 + i * 0.2);
            const alpha = 0.3 - i * 0.05;
            ctx.strokeStyle = `rgba(150, 100, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, time * 0.002 + i, time * 0.002 + i + Math.PI * 1.5);
            ctx.stroke();
        }
    };

    const drawPowerups = (powerups, time) => {
        powerups.forEach(powerup => {
            if (powerup.collected) return;
            const y = powerup.y + Math.sin(time * 0.003 + powerup.x) * 5;
            
            switch (powerup.type) {
                case 'star':
                    drawStarPowerup(powerup.x, y, time);
                    break;
                case 'slow':
                    drawSlowPowerup(powerup.x, y);
                    break;
                case 'shield':
                    drawShieldPowerup(powerup.x, y);
                    break;
            }
        });
    };

    const drawStarPowerup = (x, y, time) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.002);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = '#FFD700';
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * 12;
            const py = Math.sin(angle) * 12;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    };

    const drawSlowPowerup = (x, y) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00BFFF';
        ctx.fillStyle = '#00BFFF';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↓', x, y);
    };

    const drawShieldPowerup = (x, y) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00FF7F';
        ctx.fillStyle = '#00FF7F';
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x + 12, y - 5);
        ctx.lineTo(x + 12, y + 5);
        ctx.lineTo(x, y + 15);
        ctx.lineTo(x - 12, y + 5);
        ctx.lineTo(x - 12, y - 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    return {
        init,
        clear,
        drawBackground,
        drawSafeZone,
        drawWindParticles,
        drawFeather,
        drawObstacles,
        drawPowerups
    };
})();
