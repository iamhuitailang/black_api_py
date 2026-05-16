class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
    }

    clear() {
        this.ctx.fillStyle = CONFIG.COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        this.ctx.fillStyle = CONFIG.COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawChatBubbles();
        
        this.ctx.fillStyle = CONFIG.COLORS.ground;
        this.ctx.fillRect(0, CONFIG.GROUND_Y, this.canvas.width, this.canvas.height - CONFIG.GROUND_Y);
        
        this.ctx.strokeStyle = CONFIG.COLORS.groundLine;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.GROUND_Y);
        this.ctx.lineTo(this.canvas.width, CONFIG.GROUND_Y);
        this.ctx.stroke();
    }

    drawChatBubbles() {
        const bubbles = [
            { x: 50, y: 80, text: '哈哈，来啊！', right: false },
            { x: 800, y: 120, text: '谁怕谁！', right: true },
            { x: 100, y: 200, text: '😂😂😂', right: false },
            { x: 900, y: 250, text: '🤡🤡🤡', right: true },
            { x: 150, y: 350, text: '加油！', right: false },
            { x: 850, y: 400, text: '你输定了！', right: true }
        ];

        bubbles.forEach(bubble => {
            this.drawChatBubble(bubble.x, bubble.y, bubble.text, bubble.right);
        });
    }

    drawChatBubble(x, y, text, isRight) {
        const padding = 12;
        const fontSize = 14;
        
        this.ctx.font = `${fontSize}px Arial`;
        const textWidth = this.ctx.measureText(text).width;
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = fontSize + padding * 2;
        
        const radius = 10;
        
        this.ctx.fillStyle = isRight ? CONFIG.COLORS.chatBubbleRight : CONFIG.COLORS.chatBubble;
        this.ctx.beginPath();
        
        const startX = isRight ? x - bubbleWidth : x;
        
        this.ctx.moveTo(startX + radius, y);
        this.ctx.lineTo(startX + bubbleWidth - radius, y);
        this.ctx.quadraticCurveTo(startX + bubbleWidth, y, startX + bubbleWidth, y + radius);
        this.ctx.lineTo(startX + bubbleWidth, y + bubbleHeight - radius);
        this.ctx.quadraticCurveTo(startX + bubbleWidth, y + bubbleHeight, startX + bubbleWidth - radius, y + bubbleHeight);
        this.ctx.lineTo(startX + radius, y + bubbleHeight);
        this.ctx.quadraticCurveTo(startX, y + bubbleHeight, startX, y + bubbleHeight - radius);
        this.ctx.lineTo(startX, y + radius);
        this.ctx.quadraticCurveTo(startX, y, startX + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(text, startX + padding, y + padding + fontSize - 2);
        
        this.ctx.fillStyle = isRight ? CONFIG.COLORS.chatBubbleRight : CONFIG.COLORS.chatBubble;
        this.ctx.beginPath();
        if (isRight) {
            this.ctx.moveTo(x, y + 15);
            this.ctx.lineTo(x + 15, y + 10);
            this.ctx.lineTo(x, y + 25);
        } else {
            this.ctx.moveTo(x + bubbleWidth, y + 15);
            this.ctx.lineTo(x + bubbleWidth - 15, y + 10);
            this.ctx.lineTo(x + bubbleWidth, y + 25);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCharacter(character) {
        const ctx = this.ctx;
        const { x, y, width, height, emoji, isHit, isAttacking, isCrouching, facing, isInvincible, animationFrame } = character;
        
        ctx.save();
        
        if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (isHit) {
            ctx.filter = 'brightness(2)';
        }
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        let scaleX = facing;
        let scaleY = 1;
        let offsetY = 0;
        
        if (isCrouching) {
            scaleY = 0.7;
            offsetY = height * 0.3;
        }
        
        if (isAttacking) {
            scaleX = facing * 1.1;
        }
        
        ctx.translate(centerX, centerY + offsetY);
        ctx.scale(scaleX, scaleY);
        
        ctx.font = `${height * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const wobble = Math.sin(animationFrame * Math.PI / 2) * 3;
        ctx.fillText(emoji, wobble, 0);
        
        if (isAttacking) {
            ctx.font = '30px Arial';
            const attackEmoji = character.currentAttack.includes('Kick') ? '👟' : '✋';
            ctx.fillText(attackEmoji, facing * (width / 2 + 20), 0);
        }
        
        ctx.restore();
        
        character.projectiles.forEach(proj => {
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(proj.emoji, proj.x, proj.y);
        });
    }

    drawHitEffects(effects) {
        const ctx = this.ctx;
        
        effects.forEach(effect => {
            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.scale(effect.scale, effect.scale);
            
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const alpha = effect.timer / 500;
            ctx.globalAlpha = alpha;
            
            ctx.fillStyle = '#ff4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText(`-${effect.damage}`, 0, 0);
            ctx.fillText(`-${effect.damage}`, 0, 0);
            
            ctx.restore();
        });
    }

    render(player, enemy, effects) {
        this.clear();
        this.drawBackground();
        this.drawCharacter(player);
        this.drawCharacter(enemy);
        this.drawHitEffects(effects);
    }
}