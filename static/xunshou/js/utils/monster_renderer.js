const MonsterRenderer = {
    drawMonster(monster, x, y, size = 120) {
        const ctx = CanvasUtils.ctx;
        const typeColor = MonsterData.typeColors[monster.type];
        const lightColor = CanvasUtils.lightenColor(typeColor, 35);
        const darkColor = CanvasUtils.darkenColor(typeColor, 20);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 12;
        ctx.restore();

        this.drawShadow(x, y, size);
        this.drawBody(monster, x, y, size, typeColor, lightColor, darkColor);
        this.drawLimbs(monster, x, y, size, typeColor, darkColor);
        this.drawFace(monster, x, y, size);
        this.drawAccessories(monster, x, y, size, typeColor);

        if (monster.statusEffects && monster.statusEffects.length > 0) {
            CanvasUtils.drawStatusIcons(x - 45, y - size/2 - 35, monster.statusEffects, 22);
        }
    },

    drawShadow(x, y, size) {
        const ctx = CanvasUtils.ctx;
        const shadowY = y + size/2 + 5;
        
        ctx.save();
        const shadowGradient = ctx.createRadialGradient(x, shadowY, 0, x, shadowY, size/2 + 10);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(x, shadowY, size/2 + 5, size/6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawBody(monster, x, y, size, typeColor, lightColor, darkColor) {
        const ctx = CanvasUtils.ctx;

        ctx.save();
        const bodyGradient = ctx.createRadialGradient(
            x - size/5, y - size/5, size/8,
            x, y + size/10, size/2 + 15
        );
        bodyGradient.addColorStop(0, CanvasUtils.lightenColor(typeColor, 45));
        bodyGradient.addColorStop(0.4, lightColor);
        bodyGradient.addColorStop(0.7, typeColor);
        bodyGradient.addColorStop(1, darkColor);
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + size/10, size/2 + 8, size/2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        const bellyGradient = ctx.createRadialGradient(
            x - size/8, y + size/5, 0,
            x, y + size/4, size/3
        );
        bellyGradient.addColorStop(0, CanvasUtils.lightenColor(typeColor, 55));
        bellyGradient.addColorStop(1, CanvasUtils.lightenColor(typeColor, 40));
        ctx.fillStyle = bellyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + size/4, size/3 + 5, size/4 + 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x - size/4, y - size/6, size/6, size/8, Math.PI * 0.7, Math.PI * 1.3);
        ctx.stroke();
        ctx.restore();

        const rarity = monster.rarity;
        if (rarity === 'epic' || rarity === 'legendary') {
            this.drawRarityEffects(x, y + size/10, size, rarity);
        }
    },

    drawLimbs(monster, x, y, size, typeColor, darkColor) {
        const ctx = CanvasUtils.ctx;
        const lightTypeColor = CanvasUtils.lightenColor(typeColor, 25);

        ctx.save();
        ctx.fillStyle = darkColor;
        
        ctx.beginPath();
        ctx.ellipse(x - size/4, y + size/2 + 5, size/10, size/8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size/4, y + size/2 + 5, size/10, size/8, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = lightTypeColor;
        ctx.beginPath();
        ctx.ellipse(x - size/3, y - size/4, size/10, size/8, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size/3, y - size/4, size/10, size/8, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const type = monster.type;
        if (type === 'grass') {
            this.drawLeafEars(x, y, size, typeColor);
        } else if (type === 'fire') {
            this.drawFireEars(x, y, size, typeColor);
        } else if (type === 'water') {
            this.drawWaterEars(x, y, size, typeColor);
        } else if (type === 'thunder') {
            this.drawThunderEars(x, y, size, typeColor);
        } else {
            this.drawDefaultEars(x, y, size, typeColor);
        }

        this.drawTail(x, y, size, typeColor, darkColor);
    },

    drawDefaultEars(x, y, size, typeColor) {
        const ctx = CanvasUtils.ctx;
        const earSize = size / 3;
        
        ctx.save();
        ctx.fillStyle = typeColor;
        
        ctx.beginPath();
        ctx.moveTo(x - size/3, y - size/3);
        ctx.quadraticCurveTo(x - size/2 - 5, y - size/2 - earSize, x - size/4, y - size/2);
        ctx.quadraticCurveTo(x - size/4, y - size/3, x - size/4, y - size/4);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + size/3, y - size/3);
        ctx.quadraticCurveTo(x + size/2 + 5, y - size/2 - earSize, x + size/4, y - size/2);
        ctx.quadraticCurveTo(x + size/4, y - size/3, x + size/4, y - size/4);
        ctx.fill();

        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath();
        ctx.moveTo(x - size/3 + 8, y - size/3 + 8);
        ctx.quadraticCurveTo(x - size/3, y - size/2 - earSize/2, x - size/4, y - size/2 + 8);
        ctx.quadraticCurveTo(x - size/4, y - size/3, x - size/4, y - size/4);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + size/3 - 8, y - size/3 + 8);
        ctx.quadraticCurveTo(x + size/3, y - size/2 - earSize/2, x + size/4, y - size/2 + 8);
        ctx.quadraticCurveTo(x + size/4, y - size/3, x + size/4, y - size/4);
        ctx.fill();
        ctx.restore();
    },

    drawLeafEars(x, y, size, typeColor) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.fillStyle = '#66BB6A';
        
        for (let i = 0; i < 2; i++) {
            const earX = x - size/3 + i * size/1.5;
            const earY = y - size/3;
            
            ctx.beginPath();
            ctx.moveTo(earX, earY);
            ctx.quadraticCurveTo(earX - 15, earY - size/4, earX, earY - size/3);
            ctx.quadraticCurveTo(earX + 8, earY - size/4, earX, earY);
            ctx.fill();
        }

        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) {
            const earX = x - size/3 + i * size/1.5;
            const earY = y - size/3;
            
            ctx.beginPath();
            ctx.moveTo(earX, earY - 5);
            ctx.lineTo(earX, earY - size/4);
            ctx.stroke();
        }
        ctx.restore();
    },

    drawFireEars(x, y, size, typeColor) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        for (let i = 0; i < 2; i++) {
            const earX = x - size/4 + i * size/2;
            const earY = y - size/2;
            
            const gradient = ctx.createLinearGradient(earX, earY + 15, earX, earY - 20);
            gradient.addColorStop(0, '#FF6B35');
            gradient.addColorStop(0.5, '#FFD93D');
            gradient.addColorStop(1, '#FFFFFF');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(earX - 10, earY + 15);
            ctx.quadraticCurveTo(earX - 15, earY, earX - 5, earY - 10);
            ctx.quadraticCurveTo(earX, earY - 30, earX + 5, earY - 10);
            ctx.quadraticCurveTo(earX + 15, earY, earX + 10, earY + 15);
            ctx.fill();
        }
        ctx.restore();
    },

    drawWaterEars(x, y, size, typeColor) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.fillStyle = '#4FC3F7';
        
        for (let i = 0; i < 2; i++) {
            const earX = x - size/3 + i * size/1.5;
            const earY = y - size/3;
            
            ctx.beginPath();
            ctx.moveTo(earX, earY);
            ctx.quadraticCurveTo(earX - 12, earY - size/5, earX - 5, earY - size/3);
            ctx.quadraticCurveTo(earX, earY - size/3.5, earX + 5, earY - size/3);
            ctx.quadraticCurveTo(earX + 12, earY - size/5, earX, earY);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 2; i++) {
            const earX = x - size/3 + i * size/1.5;
            const earY = y - size/3;
            ctx.beginPath();
            ctx.ellipse(earX - 3, earY - 8, 2, 4, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    drawThunderEars(x, y, size, typeColor) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.fillStyle = '#FFD54F';
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < 2; i++) {
            const earX = x - size/3 + i * size/1.5;
            const earY = y - size/3;
            
            ctx.beginPath();
            ctx.moveTo(earX - 5, earY + 5);
            ctx.lineTo(earX + 8, earY - 15);
            ctx.lineTo(earX, earY - 5);
            ctx.lineTo(earX + 5, earY - 25);
            ctx.lineTo(earX - 8, earY);
            ctx.lineTo(earX, earY - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    },

    drawTail(x, y, size, typeColor, darkColor) {
        const ctx = CanvasUtils.ctx;
        const tailX = x + size/2 + 5;
        const tailY = y + size/4;

        ctx.save();
        const gradient = ctx.createLinearGradient(tailX, tailY, tailX + 35, tailY + 10);
        gradient.addColorStop(0, typeColor);
        gradient.addColorStop(1, CanvasUtils.lightenColor(typeColor, 20));
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = size/10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX - 5, tailY);
        ctx.quadraticCurveTo(tailX + 25, tailY - 15, tailX + 35, tailY + 15);
        ctx.stroke();

        ctx.fillStyle = CanvasUtils.lightenColor(typeColor, 30);
        ctx.beginPath();
        ctx.arc(tailX + 35, tailY + 15, size/12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawFace(monster, x, y, size) {
        const ctx = CanvasUtils.ctx;
        const eyeY = y - size/12;
        const eyeOffset = size/5;
        const eyeWidth = size/12;
        const eyeHeight = size/9;

        ctx.save();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x - eyeOffset, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + eyeOffset, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        const time = Date.now() / 1000;
        const blinkPhase = Math.sin(time * 2) > 0.95;
        
        if (blinkPhase) {
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - eyeOffset - eyeWidth/2, eyeY);
            ctx.lineTo(x - eyeOffset + eyeWidth/2, eyeY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + eyeOffset - eyeWidth/2, eyeY);
            ctx.lineTo(x + eyeOffset + eyeWidth/2, eyeY);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#2C1810';
            ctx.beginPath();
            ctx.ellipse(x - eyeOffset + 1, eyeY + 2, eyeWidth * 0.55, eyeHeight * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + eyeOffset + 1, eyeY + 2, eyeWidth * 0.55, eyeHeight * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - eyeOffset - 2, eyeY - 3, eyeWidth * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + eyeOffset - 2, eyeY - 3, eyeWidth * 0.25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x - eyeOffset + 2, eyeY + 4, eyeWidth * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + eyeOffset + 2, eyeY + 4, eyeWidth * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x, eyeY + eyeHeight + 5, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const mouthY = y + size/6;
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 10, mouthY);
        ctx.quadraticCurveTo(x - 5, mouthY + 8, x, mouthY + 5);
        ctx.quadraticCurveTo(x + 5, mouthY + 8, x + 10, mouthY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 150, 150, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x - size/3, eyeY + 8, size/14, size/20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size/3, eyeY + 8, size/14, size/20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    drawAccessories(monster, x, y, size, typeColor) {
        const type = monster.type;

        if (type === 'fire') {
            this.drawFireAccessories(x, y, size);
        } else if (type === 'water') {
            this.drawWaterAccessories(x, y, size);
        } else if (type === 'grass') {
            this.drawGrassAccessories(x, y, size);
        } else if (type === 'thunder') {
            this.drawThunderAccessories(x, y, size);
        }
    },

    drawFireAccessories(x, y, size) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        for (let i = 0; i < 2; i++) {
            const flameX = x - size/4 + i * size/2;
            const flameY = y - size/2 - 5;
            
            const gradient = ctx.createLinearGradient(flameX, flameY + 15, flameX, flameY - 25);
            gradient.addColorStop(0, '#FF6B35');
            gradient.addColorStop(0.3, '#FF9800');
            gradient.addColorStop(0.6, '#FFD93D');
            gradient.addColorStop(1, '#FFF9C4');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(flameX - 8, flameY + 15);
            ctx.quadraticCurveTo(flameX - 12, flameY, flameX - 5, flameY - 12);
            ctx.quadraticCurveTo(flameX, flameY - 28, flameX + 5, flameY - 12);
            ctx.quadraticCurveTo(flameX + 12, flameY, flameX + 8, flameY + 15);
            ctx.fill();
        }

        const time = Date.now() / 200;
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 3; i++) {
            const emberX = x - size/3 + ((time + i * 50) % (size * 0.7));
            const emberY = y - size/2 - 20 - Math.sin((time + i * 30) / 20) * 10;
            ctx.fillStyle = ['#FF6B35', '#FFD93D', '#FF9800'][i];
            ctx.beginPath();
            ctx.arc(emberX, emberY, 2 + Math.sin(time / 10 + i) * 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    },

    drawWaterAccessories(x, y, size) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(x, y - size/2 - 8, 15, Math.PI, 0);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 5; i++) {
            const dropX = x - size/4 + (i * size / 10);
            const dropY = y - size/2 - 25 - (i % 3) * 8;
            ctx.beginPath();
            ctx.ellipse(dropX, dropY, 2.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#B3E5FC';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x - size/5 + i * size/5, y - size/2 - 12, 4 + i, Math.PI * 0.9, Math.PI * 0.1);
            ctx.stroke();
        }
        ctx.restore();
    },

    drawGrassAccessories(x, y, size) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        for (let i = 0; i < 5; i++) {
            const leafX = x - size/3 + i * (size * 0.17);
            const leafY = y - size/2 - 5;
            
            ctx.beginPath();
            ctx.moveTo(leafX, leafY + 12);
            ctx.quadraticCurveTo(leafX - 8, leafY - 5, leafX, leafY - 22);
            ctx.quadraticCurveTo(leafX + 8, leafY - 5, leafX, leafY + 12);
            ctx.stroke();
        }

        for (let i = 0; i < 2; i++) {
            const flowerX = x - size/5 + i * size/2.5;
            const flowerY = y - size/2 - 28;
            
            ctx.fillStyle = i === 0 ? '#FFB6C1' : '#FFD93D';
            for (let j = 0; j < 5; j++) {
                const angle = (j * Math.PI * 2) / 5;
                ctx.beginPath();
                ctx.ellipse(
                    flowerX + Math.cos(angle) * 5,
                    flowerY + Math.sin(angle) * 5,
                    3, 5, angle, 0, Math.PI * 2
                );
                ctx.fill();
            }
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(flowerX, flowerY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    drawThunderAccessories(x, y, size) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.strokeStyle = '#FFE66D';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < 2; i++) {
            const boltX = x - size/5 + i * size/2.5;
            const boltY = y - size/2 - 20;
            
            ctx.beginPath();
            ctx.moveTo(boltX - 6, boltY);
            ctx.lineTo(boltX + 4, boltY + 10);
            ctx.lineTo(boltX - 2, boltY + 15);
            ctx.lineTo(boltX + 8, boltY + 30);
            ctx.stroke();
        }

        const time = Date.now() / 100;
        ctx.fillStyle = 'rgba(255, 230, 109, 0.7)';
        for (let i = 0; i < 6; i++) {
            const sparkX = x - size/3 + ((time * 2 + i * 40) % (size * 0.7));
            const sparkY = y - size/2 - 30 - (i % 4) * 10;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2 + Math.sin(time / 5 + i) * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    drawRarityEffects(x, y, size, rarity) {
        const ctx = CanvasUtils.ctx;
        const time = Date.now() / 1000;

        ctx.save();
        if (rarity === 'epic') {
            ctx.strokeStyle = `rgba(156, 39, 176, ${0.4 + Math.sin(time * 2) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, size/2 + 20, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 4; i++) {
                const angle = time * 1.5 + (i * Math.PI * 2) / 4;
                const sparkleX = x + Math.cos(angle) * (size/2 + 25);
                const sparkleY = y + Math.sin(angle) * (size/2 + 25);
                this.drawSparkle(sparkleX, sparkleY, 5);
            }
        }

        if (rarity === 'legendary') {
            const gradient = ctx.createLinearGradient(x - size/2 - 30, y, x + size/2 + 30, y);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 + Math.sin(time * 3) * 0.3})`);
            gradient.addColorStop(0.33, `rgba(255, 107, 107, ${0.6 + Math.sin(time * 3 + 1) * 0.3})`);
            gradient.addColorStop(0.66, `rgba(78, 205, 196, ${0.6 + Math.sin(time * 3 + 2) * 0.3})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, ${0.6 + Math.sin(time * 3 + 3) * 0.3})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, size/2 + 25, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 6; i++) {
                const angle = time + (i * Math.PI * 2) / 6;
                const sparkleX = x + Math.cos(angle) * (size/2 + 30);
                const sparkleY = y + Math.sin(angle) * (size/2 + 30);
                this.drawSparkle(sparkleX, sparkleY, 8);
            }
        }
        ctx.restore();
    },

    drawSparkle(x, y, size) {
        const ctx = CanvasUtils.ctx;
        
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const outerX = x + Math.cos(angle) * size;
            const outerY = y + Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 5;
            const innerX = x + Math.cos(innerAngle) * size * 0.4;
            const innerY = y + Math.sin(innerAngle) * size * 0.4;
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
};
