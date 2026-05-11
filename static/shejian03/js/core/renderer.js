const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let width = 0;
    let height = 0;
    
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        width = canvas.width;
        height = canvas.height;
    }
    
    function clear() {
        ctx.clearRect(0, 0, width, height);
    }
    
    function drawBackground() {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
        skyGradient.addColorStop(0, Constants.COLORS.SKY_TOP);
        skyGradient.addColorStop(1, Constants.COLORS.SKY_BOTTOM);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.7);
        
        ctx.beginPath();
        ctx.arc(width * 0.85, height * 0.15, 40, 0, Math.PI * 2);
        ctx.fillStyle = Constants.COLORS.SUN;
        ctx.fill();
        
        const groundGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
        groundGradient.addColorStop(0, '#a0826d');
        groundGradient.addColorStop(1, Constants.COLORS.GROUND);
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
        
        ctx.fillStyle = '#6b8e23';
        for (let i = 0; i < width; i += 20) {
            const grassHeight = Math.random() * 8 + 4;
            ctx.fillRect(i, height * 0.7 - grassHeight, 2, grassHeight);
        }
    }
    
    function drawTarget(target) {
        const targetType = Constants.TARGET_TYPES[target.type.toUpperCase()];
        if (!targetType) return;
        
        if (targetType.id === 'static' || targetType.id === 'moving') {
            drawCircularTarget(target);
        } else if (targetType.id === 'apple') {
            drawApple(target);
        } else if (targetType.animal) {
            drawAnimal(target);
        } else if (targetType.enemy) {
            drawEnemy(target);
        }
    }
    
    function drawCircularTarget(target) {
        const x = target.x;
        const y = target.y;
        const r = target.radius;
        
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.fillStyle = '#8b4513';
        ctx.fill();
        
        const rings = [
            { color: Constants.COLORS.TARGET_WHITE, radius: r },
            { color: Constants.COLORS.TARGET_BLACK, radius: r * 0.9 },
            { color: Constants.COLORS.TARGET_BLUE, radius: r * 0.7 },
            { color: Constants.COLORS.TARGET_RED, radius: r * 0.5 },
            { color: Constants.COLORS.TARGET_YELLOW, radius: r * 0.3 },
            { color: Constants.COLORS.TARGET_RED, radius: r * 0.1 }
        ];
        
        for (let i = 0; i < rings.length; i++) {
            ctx.beginPath();
            ctx.arc(x, y, rings[i].radius, 0, Math.PI * 2);
            ctx.fillStyle = rings[i].color;
            ctx.fill();
        }
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('10', x, y + 4);
    }
    
    function drawApple(target) {
        const x = target.x;
        const y = target.y;
        const r = target.radius;
        
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#dc143c';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x + 5, y - r - 10, x + 10, y - r - 5);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(x + 5, y - r - 5, 8, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#228b22';
        ctx.fill();
    }
    
    function drawAnimal(target) {
        const targetType = Constants.TARGET_TYPES[target.type.toUpperCase()];
        
        if (targetType.id === 'deer') {
            drawDeer(target);
        } else if (targetType.id === 'bird') {
            drawBird(target);
        } else if (targetType.id === 'boar') {
            drawBoar(target);
        }
    }
    
    function drawDeer(target) {
        const x = target.x;
        const y = target.y;
        const size = target.radius;
        
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.2, size * 0.8, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y - size * 0.2, size * 0.35, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.6, y - size * 0.4);
        ctx.lineTo(x + size * 0.8, y - size * 0.8);
        ctx.moveTo(x + size * 0.75, y - size * 0.6);
        ctx.lineTo(x + size * 0.95, y - size * 0.7);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + size * 0.6, y - size * 0.25, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + size * 0.6, y - size * 0.25, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawBird(target) {
        const x = target.x;
        const y = target.y;
        const size = target.radius;
        const time = Date.now() / 200;
        const wingOffset = Math.sin(time) * 10;
        
        ctx.fillStyle = '#4169e1';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.8, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.6, y - size * 0.3, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#6495ed';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.3, y - wingOffset * 0.3, size * 0.6, size * 0.2, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(x + size, y - size * 0.2);
        ctx.lineTo(x + size * 1.3, y - size * 0.1);
        ctx.lineTo(x + size, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + size * 0.7, y - size * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawBoar(target) {
        const x = target.x;
        const y = target.y;
        const size = target.radius;
        
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.9, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.6, y - size * 0.1, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f5f5dc';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.85, y - size * 0.05);
        ctx.lineTo(x + size * 1.1, y - size * 0.15);
        ctx.lineTo(x + size * 0.95, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + size * 0.7, y - size * 0.15, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawEnemy(target) {
        const x = target.x;
        const y = target.y;
        const size = target.radius;
        
        ctx.fillStyle = '#696969';
        ctx.fillRect(x - size * 0.5, y - size * 0.2, size, size * 0.8);
        
        ctx.beginPath();
        ctx.arc(x, y - size * 0.4, size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#808080';
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x - size * 0.2, y - size * 0.45, size * 0.4, size * 0.1);
        
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4, y - size * 0.7);
        ctx.lineTo(x - size * 0.2, y - size * 0.9);
        ctx.lineTo(x, y - size * 0.7);
        ctx.lineTo(x + size * 0.2, y - size * 0.9);
        ctx.lineTo(x + size * 0.4, y - size * 0.7);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawBow(bow, isDrawing, drawAngle, drawPower) {
        const x = bow.x;
        const y = bow.y;
        const bowLength = 60;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(drawAngle);
        
        ctx.beginPath();
        ctx.arc(0, 0, bowLength, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3);
        ctx.strokeStyle = Constants.COLORS.BOW;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        const stringPull = isDrawing ? drawPower * 2 : 0;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(-Math.PI / 2 - 0.3) * bowLength,
            Math.sin(-Math.PI / 2 - 0.3) * bowLength
        );
        ctx.quadraticCurveTo(
            0,
            20 + stringPull,
            Math.cos(-Math.PI / 2 + 0.3) * bowLength,
            Math.sin(-Math.PI / 2 + 0.3) * bowLength
        );
        ctx.strokeStyle = Constants.COLORS.BOW_STRING;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (isDrawing) {
            const arrowType = Constants.ARROW_TYPES[bow.currentArrowType.toUpperCase()];
            if (arrowType) {
                ctx.fillStyle = arrowType.color;
                ctx.fillRect(-3, -bowLength + stringPull * 0.5, 6, bowLength * 0.8);
                
                ctx.beginPath();
                ctx.moveTo(0, -bowLength + stringPull * 0.5 - 10);
                ctx.lineTo(-6, -bowLength + stringPull * 0.5);
                ctx.lineTo(6, -bowLength + stringPull * 0.5);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    function drawArrow(arrow) {
        const arrowType = Constants.ARROW_TYPES[arrow.type.toUpperCase()];
        if (!arrowType) return;
        
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(arrow.angle);
        
        const length = 40;
        const width = 4;
        
        ctx.fillStyle = arrowType.color;
        ctx.fillRect(-length / 2, -width / 2, length, width);
        
        ctx.beginPath();
        ctx.moveTo(length / 2, 0);
        ctx.lineTo(length / 2 + 10, -5);
        ctx.lineTo(length / 2 + 10, 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = arrowType.id === 'feather' ? '#4682b4' : '#d4a574';
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(-length / 2 - 8, -8);
        ctx.lineTo(-length / 2 - 3, 0);
        ctx.lineTo(-length / 2 - 8, 8);
        ctx.closePath();
        ctx.fill();
        
        if (arrowType.explosive) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(length / 2 + 5, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (arrowType.hook) {
            ctx.strokeStyle = '#daa520';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(length / 2 + 8, 0, 6, 0, Math.PI * 1.5);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    function drawTrajectory(points) {
        if (points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    function drawExplosion(x, y, radius, progress) {
        const alpha = 1 - progress;
        const currentRadius = radius * progress;
        
        ctx.beginPath();
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.8})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }
    
    function drawScorePopup(x, y, score, isCritical, isHeadshot) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        let text = `+${score}`;
        let color = '#ffd700';
        
        if (isHeadshot) {
            text = `爆头! +${score}`;
            color = '#ff0000';
        } else if (isCritical) {
            text = `要害! +${score}`;
            color = '#ff4500';
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(text, x + 2, y + 2);
        
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }
    
    function drawPowerBar(x, y, width, height, power, maxPower) {
        const percentage = power / maxPower;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        let color = '#00ff00';
        if (percentage > 0.7) color = '#ff0000';
        else if (percentage > 0.4) color = '#ffff00';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * percentage, height);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    function resize(newWidth, newHeight) {
        width = newWidth;
        height = newHeight;
        canvas.width = newWidth;
        canvas.height = newHeight;
    }
    
    function getContext() {
        return ctx;
    }
    
    return {
        init,
        clear,
        drawBackground,
        drawTarget,
        drawBow,
        drawArrow,
        drawTrajectory,
        drawExplosion,
        drawScorePopup,
        drawPowerBar,
        resize,
        getContext
    };
})();

window.Renderer = Renderer;