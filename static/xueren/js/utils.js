const Utils = {
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt: function(min, max) {
        return Math.floor(this.random(min, max + 1));
    },
    
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    rectCollision: function(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },
    
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    drawRoundRect: function(ctx, x, y, width, height, radius, fill = true, stroke = false) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    },
    
    drawSnowman: function(ctx, x, y, width, height, facingRight = true, isInvincible = false, isDead = false, walkFrame = 0, isJumping = false) {
        const centerX = x + width / 2;
        const bottomY = y + height;
        
        const bodyRadius = width * 0.42;
        const headRadius = bodyRadius * 0.78;
        
        let bodyOffsetY = 0;
        let headOffsetY = 0;
        let bodySquash = 1;
        let bodyStretch = 1;
        
        if (!isJumping && walkFrame > 0) {
            const bounce = Math.sin(walkFrame * Math.PI / 2) * 2.5;
            bodyOffsetY = -bounce;
            headOffsetY = -bounce * 0.55;
            bodySquash = 1 - bounce * 0.018;
            bodyStretch = 1 + bounce * 0.012;
        }
        
        if (isJumping) {
            headOffsetY = -5;
            bodySquash = 0.93;
            bodyStretch = 1.07;
        }
        
        const bodyY = bottomY - bodyRadius - 2 + bodyOffsetY;
        const headY = bodyY - bodyRadius * 0.5 - headRadius * 0.55 + headOffsetY;
        
        ctx.save();
        
        if (isInvincible) {
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 80) * 0.4;
            
            const glowRadius = width * 0.55 + Math.sin(Date.now() / 150) * 5;
            const glowGradient = ctx.createRadialGradient(
                centerX, bodyY - bodyRadius * 0.3,
                glowRadius * 0.5,
                centerX, bodyY - bodyRadius * 0.3,
                glowRadius
            );
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(centerX, bodyY - bodyRadius * 0.3, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (isDead) {
            ctx.globalAlpha = 0.3;
        }
        
        ctx.fillStyle = CONFIG.COLORS.WHITE;
        ctx.shadowColor = CONFIG.COLORS.LIGHT_BLUE;
        ctx.shadowBlur = 12;
        
        ctx.save();
        ctx.translate(centerX, bodyY);
        ctx.scale(bodyStretch, bodySquash);
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(135, 206, 235, 0.25)';
        ctx.beginPath();
        ctx.arc(centerX - bodyRadius * 0.3, bodyY + bodyRadius * 0.15, bodyRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeOffsetX = facingRight ? 1.5 : -1.5;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - headRadius * 0.28 + eyeOffsetX, headY - headRadius * 0.06, 5.5, 0, Math.PI * 2);
        ctx.arc(centerX + headRadius * 0.28 + eyeOffsetX, headY - headRadius * 0.06, 5.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2a2a2a';
        const pupilOffset = facingRight ? 1.5 : -1.5;
        ctx.beginPath();
        ctx.arc(centerX - headRadius * 0.27 + eyeOffsetX + pupilOffset, headY - headRadius * 0.05, 2.8, 0, Math.PI * 2);
        ctx.arc(centerX + headRadius * 0.29 + eyeOffsetX + pupilOffset, headY - headRadius * 0.05, 2.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - headRadius * 0.28 + eyeOffsetX, headY - headRadius * 0.1, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + headRadius * 0.28 + eyeOffsetX, headY - headRadius * 0.1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF7B7B';
        ctx.beginPath();
        ctx.arc(centerX, headY + headRadius * 0.13, 3.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFB0B0';
        ctx.beginPath();
        ctx.arc(centerX - 0.8, headY + headRadius * 0.11, 1.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = CONFIG.COLORS.LIGHT_PINK;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(centerX - headRadius * 0.5, headY + headRadius * 0.22, 6, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + headRadius * 0.5, headY + headRadius * 0.22, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, headY + headRadius * 0.28, 5, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#FF9999';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(centerX, headY + headRadius * 0.33, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(centerX, bodyY - bodyRadius * 0.18, 2.2, 0, Math.PI * 2);
        ctx.arc(centerX, bodyY + bodyRadius * 0.12, 2.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.ellipse(centerX, headY - headRadius * 0.72, headRadius * 0.6, headRadius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#B22222';
        ctx.beginPath();
        ctx.rect(centerX - headRadius * 0.18, headY - headRadius * 0.72 - headRadius * 0.7, headRadius * 0.36, headRadius * 0.7);
        ctx.fill();
        
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.arc(centerX, headY - headRadius * 0.72 - headRadius * 0.7, headRadius * 0.24, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4E1';
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.ellipse(centerX - headRadius * 0.22, headY - headRadius * 0.78, headRadius * 0.17, headRadius * 0.09, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        if (isDead) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2.5;
            
            const eyeX1 = centerX - headRadius * 0.28 + eyeOffsetX;
            const eyeX2 = centerX + headRadius * 0.28 + eyeOffsetX;
            const eyeY = headY - headRadius * 0.05;
            
            ctx.beginPath();
            ctx.moveTo(eyeX1 - 4, eyeY - 4);
            ctx.lineTo(eyeX1 + 4, eyeY + 4);
            ctx.moveTo(eyeX1 + 4, eyeY - 4);
            ctx.lineTo(eyeX1 - 4, eyeY + 4);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(eyeX2 - 4, eyeY - 4);
            ctx.lineTo(eyeX2 + 4, eyeY + 4);
            ctx.moveTo(eyeX2 + 4, eyeY - 4);
            ctx.lineTo(eyeX2 - 4, eyeY + 4);
            ctx.stroke();
        }
        
        ctx.restore();
    },
    
    drawSnowflake: function(ctx, x, y, size, rotation = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = CONFIG.COLORS.WHITE;
        ctx.strokeStyle = CONFIG.COLORS.LIGHT_BLUE;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -size);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.5);
            ctx.lineTo(-size * 0.3, -size * 0.7);
            ctx.moveTo(0, -size * 0.5);
            ctx.lineTo(size * 0.3, -size * 0.7);
            ctx.stroke();
            
            ctx.restore();
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawPlatform: function(ctx, x, y, width, height, isIce = false) {
        ctx.save();
        
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (isIce) {
            gradient.addColorStop(0, CONFIG.COLORS.LIGHT_BLUE);
            gradient.addColorStop(0.5, CONFIG.COLORS.ICE_BLUE);
            gradient.addColorStop(1, CONFIG.COLORS.DEEP_BLUE);
        } else {
            gradient.addColorStop(0, '#999');
            gradient.addColorStop(0.5, '#666');
            gradient.addColorStop(1, '#444');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        if (isIce) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(x, y, width, 3);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < width; i += 20) {
                ctx.fillRect(x + i, y + 5, 10, 2);
            }
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        ctx.restore();
    }
};
