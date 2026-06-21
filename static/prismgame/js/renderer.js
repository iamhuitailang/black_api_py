class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.width = this.width;
        this.trailCanvas.height = this.height;
        this.trailCtx = this.trailCanvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.trailCtx.fillStyle = 'rgba(10, 10, 26, 0.05)';
        this.trailCtx.fillRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width * 0.7
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0a0a1a');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this._drawGrid();
    }

    _drawGrid() {
        this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawLightSource(x, y, angle) {
        const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 40);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        glowGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(x - 40, y - 40, 80, 80);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle * Math.PI / 180);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 20;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -5);
        this.ctx.lineTo(20, 0);
        this.ctx.lineTo(0, 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawTarget(x, y, radius, isHit = false) {
        this.ctx.save();

        const pulseRadius = radius + Math.sin(Date.now() / 500) * 5;

        const outerGlow = this.ctx.createRadialGradient(x, y, 0, x, y, pulseRadius * 2);
        if (isHit) {
            outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            outerGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
            outerGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        } else {
            outerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
            outerGlow.addColorStop(0.5, 'rgba(0, 255, 255, 0.1)');
            outerGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
        }

        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = outerGlow;
        this.ctx.fillRect(x - pulseRadius * 2, y - pulseRadius * 2, pulseRadius * 4, pulseRadius * 4);

        this.ctx.globalCompositeOperation = 'source-over';

        this.ctx.strokeStyle = isHit ? '#ffd700' : '#00ffff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = isHit ? '#ffd700' : '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, pulseRadius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = isHit ? '#ffd700' : '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPrism(prism) {
        const vertices = prism.getVertices();

        this.ctx.save();

        if (prism.melted) {
            this.ctx.globalAlpha = 0.3;
        }

        if (prism.selected) {
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.shadowBlur = 25;
        } else if (prism.hovered) {
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 15;
        }

        if (prism.isRotatable && !prism.melted) {
            this.ctx.strokeStyle = prism.selected ? '#ff00ff' : '#00ffff';
        } else {
            this.ctx.strokeStyle = '#666';
        }

        this.ctx.lineWidth = 2;

        const gradient = this.ctx.createLinearGradient(
            prism.x - prism.size, prism.y - prism.size,
            prism.x + prism.size, prism.y + prism.size
        );

        if (prism.melted) {
            gradient.addColorStop(0, 'rgba(100, 50, 50, 0.3)');
            gradient.addColorStop(1, 'rgba(50, 30, 30, 0.3)');
        } else if (prism.colorFilter === 'red') {
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0.1)');
        } else if (prism.colorFilter === 'green') {
            gradient.addColorStop(0, 'rgba(100, 255, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(50, 255, 50, 0.1)');
        } else if (prism.colorFilter === 'blue') {
            gradient.addColorStop(0, 'rgba(100, 100, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(50, 50, 255, 0.1)');
        } else {
            gradient.addColorStop(0, 'rgba(200, 200, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(150, 150, 200, 0.05)');
        }

        this.ctx.fillStyle = gradient;

        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        if (prism.frozen) {
            this.ctx.strokeStyle = '#3366ff';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#3366ff';
            this.ctx.shadowBlur = 10;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(prism.x, prism.y, prism.size + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        if (prism.hitCount > 0 && !prism.melted) {
            const ratio = prism.hitCount / 5;
            this.ctx.fillStyle = `rgba(255, ${Math.floor(100 * (1 - ratio))}, 0, ${0.5 + ratio * 0.5})`;
            this.ctx.shadowColor = '#ff6600';
            this.ctx.shadowBlur = 10 * ratio;
            this.ctx.beginPath();
            this.ctx.arc(prism.x, prism.y - prism.size - 10, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawLightBeam(beamResult) {
        if (!beamResult || !beamResult.path || beamResult.path.length < 2) return;

        const path = beamResult.path;

        this.trailCtx.save();
        this.trailCtx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const colors = p2.colors || p1.colors || { red: 1, green: 1, blue: 1 };
            const intensity = p2.intensity !== undefined ? p2.intensity : p1.intensity;

            const r = Math.floor(colors.red * 255);
            const g = Math.floor(colors.green * 255);
            const b = Math.floor(colors.blue * 255);

            this.trailCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`;
            this.trailCtx.lineWidth = 8;
            this.trailCtx.lineCap = 'round';
            this.trailCtx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            this.trailCtx.shadowBlur = 15;

            this.trailCtx.beginPath();
            this.trailCtx.moveTo(p1.x, p1.y);
            this.trailCtx.lineTo(p2.x, p2.y);
            this.trailCtx.stroke();
        }

        this.trailCtx.restore();

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.drawImage(this.trailCanvas, 0, 0);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';

        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const colors = p2.colors || p1.colors || { red: 1, green: 1, blue: 1 };
            const intensity = p2.intensity !== undefined ? p2.intensity : p1.intensity;

            const r = Math.floor(colors.red * 255);
            const g = Math.floor(colors.green * 255);
            const b = Math.floor(colors.blue * 255);

            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${intensity * 0.9})`;
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            this.ctx.shadowBlur = 8;

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawSplitBeams(splitBeams) {
        if (!splitBeams || splitBeams.length === 0) return;

        for (const split of splitBeams) {
            if (split.result && split.result.path) {
                this.drawLightBeam(split.result);
            }
        }
    }

    drawParticles(particles) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        particles.draw(this.ctx);
        this.ctx.restore();
    }

    drawSpectrumBar(x, y, width, height, colors) {
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, `rgba(${colors.red * 255}, 0, 0, 0.8)`);
        gradient.addColorStop(0.5, `rgba(0, ${colors.green * 255}, 0, 0.8)`);
        gradient.addColorStop(1, `rgba(0, 0, ${colors.blue * 255}, 0.8)`);

        this.ctx.save();
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.restore();
    }

    drawUI(currentLevel, rotationCount, parRotations, intensity) {
        this.ctx.save();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 60);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 200, 60);

        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '14px Arial';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 5;

        this.ctx.fillText(`关卡: ${currentLevel}`, 20, 35);
        this.ctx.fillText(`旋转: ${rotationCount} / ${parRotations}`, 20, 55);

        const intensityBarWidth = 80;
        const intensityBarHeight = 8;
        const intensityBarX = 110;
        const intensityBarY = 45;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(intensityBarX, intensityBarY, intensityBarWidth, intensityBarHeight);

        const intensityColor = intensity > 0.6 ? '#33ff66' : intensity > 0.3 ? '#ffff00' : '#ff3366';
        this.ctx.fillStyle = intensityColor;
        this.ctx.shadowColor = intensityColor;
        this.ctx.fillRect(intensityBarX, intensityBarY, intensityBarWidth * intensity, intensityBarHeight);

        this.ctx.restore();
    }

    drawWinEffect(x, y) {
        const time = Date.now() / 1000;
        const particles = 30;

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < particles; i++) {
            const angle = (i / particles) * Math.PI * 2 + time;
            const radius = 30 + Math.sin(time * 2 + i) * 10;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, 8);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(px - 8, py - 8, 16, 16);
        }

        this.ctx.restore();
    }
}
