const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    },
    
    formatTime(seconds) {
        return Math.ceil(seconds) + 's';
    }
};
