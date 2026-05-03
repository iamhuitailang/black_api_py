class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cardWidth = 80;
        this.cardHeight = 100;
        this.cardSpacing = 15;
        this.padding = 30;
        this.animationFrame = null;
    }
    
    resize(gridSize) {
        const totalCards = gridSize;
        const totalWidth = totalCards * this.cardWidth + (totalCards - 1) * this.cardSpacing + this.padding * 2;
        const totalHeight = totalCards * this.cardHeight + (totalCards - 1) * this.cardSpacing + this.padding * 2;
        
        const maxWidth = Math.min(window.innerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 300, 600);
        
        const scale = Math.min(maxWidth / totalWidth, maxHeight / totalHeight, 1);
        
        this.canvas.width = totalWidth * scale;
        this.canvas.height = totalHeight * scale;
        
        this.scale = scale;
        this.scaledCardWidth = this.cardWidth * scale;
        this.scaledCardHeight = this.cardHeight * scale;
        this.scaledCardSpacing = this.cardSpacing * scale;
        this.scaledPadding = this.padding * scale;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawCard(card, game) {
        const x = this.scaledPadding + card.col * (this.scaledCardWidth + this.scaledCardSpacing);
        const y = this.scaledPadding + card.row * (this.scaledCardHeight + this.scaledCardSpacing);
        
        this.ctx.save();
        
        if (card.isFaceUp() || card.isMatched()) {
            this.drawCardFront(x, y, card, game);
        } else {
            this.drawCardBack(x, y, card);
        }
        
        if (game.peekMode && game.peekCardId === card.id) {
            this.drawCardFront(x, y, card, game, true);
        }
        
        this.ctx.restore();
    }
    
    drawCardBack(x, y, card) {
        this.ctx.fillStyle = '#2C3E50';
        this.roundRect(x, y, this.scaledCardWidth, this.scaledCardHeight, 10 * this.scale);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#3498DB';
        this.ctx.lineWidth = 3 * this.scale;
        this.roundRect(x, y, this.scaledCardWidth, this.scaledCardHeight, 10 * this.scale);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#3498DB';
        this.ctx.font = `${24 * this.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('?', x + this.scaledCardWidth / 2, y + this.scaledCardHeight / 2);
    }
    
    drawCardFront(x, y, card, game, isPeek = false) {
        let fillColor = '#FFFFFF';
        if (card.isMatched() && card.owner !== null) {
            fillColor = card.owner === 0 ? '#E8F5E9' : '#E3F2FD';
        }
        
        this.ctx.fillStyle = fillColor;
        this.roundRect(x, y, this.scaledCardWidth, this.scaledCardHeight, 10 * this.scale);
        this.ctx.fill();
        
        if (card.isMatched()) {
            const borderColor = card.owner === 0 ? '#4CAF50' : '#2196F3';
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 4 * this.scale;
            this.roundRect(x, y, this.scaledCardWidth, this.scaledCardHeight, 10 * this.scale);
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = card.color;
            this.ctx.lineWidth = 3 * this.scale;
            this.roundRect(x, y, this.scaledCardWidth, this.scaledCardHeight, 10 * this.scale);
            this.ctx.stroke();
        }
        
        const shapeX = x + this.scaledCardWidth / 2;
        const shapeY = y + this.scaledCardHeight / 2 - 5 * this.scale;
        const shapeSize = 25 * this.scale;
        
        this.ctx.fillStyle = card.color;
        this.drawShape(shapeX, shapeY, shapeSize, card.shape);
        
        if (card.hasSpecialEffect()) {
            this.ctx.font = `${16 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                card.getSpecialEmoji(),
                x + this.scaledCardWidth / 2,
                y + this.scaledCardHeight - 15 * this.scale
            );
        }
        
        if (isPeek) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.roundRect(x, y, this.scaledCardWidth, this.scaledCardHeight, 10 * this.scale);
            this.ctx.fill();
        }
    }
    
    drawShape(x, y, size, shape) {
        this.ctx.beginPath();
        
        switch (shape) {
            case 'circle':
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                break;
                
            case 'square':
                this.ctx.rect(x - size, y - size, size * 2, size * 2);
                break;
                
            case 'triangle':
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y + size * 0.8);
                this.ctx.lineTo(x - size, y + size * 0.8);
                this.ctx.closePath();
                break;
                
            case 'diamond':
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size * 0.7, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size * 0.7, y);
                this.ctx.closePath();
                break;
                
            case 'star':
                this.drawStar(x, y, 5, size, size * 0.5);
                break;
                
            case 'heart':
                this.drawHeart(x, y, size);
                break;
                
            case 'hexagon':
                this.drawPolygon(x, y, size, 6);
                break;
                
            case 'pentagon':
                this.drawPolygon(x, y, size, 5);
                break;
                
            case 'octagon':
                this.drawPolygon(x, y, size, 8);
                break;
                
            case 'cross':
                this.ctx.rect(x - size * 0.3, y - size, size * 0.6, size * 2);
                this.ctx.rect(x - size, y - size * 0.3, size * 2, size * 0.6);
                break;
                
            case 'moon':
                this.ctx.arc(x, y, size, 0.5, Math.PI * 2 - 0.5);
                this.ctx.arc(x + size * 0.3, y, size * 0.7, Math.PI * 1.8, Math.PI * 0.2, true);
                break;
                
            case 'sun':
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.ctx.moveTo(
                        x + Math.cos(angle) * size * 0.5,
                        y + Math.sin(angle) * size * 0.5
                    );
                    this.ctx.lineTo(
                        x + Math.cos(angle) * size,
                        y + Math.sin(angle) * size
                    );
                }
                this.ctx.moveTo(x + size * 0.5, y);
                this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                break;
                
            default:
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            this.ctx.lineTo(
                cx + Math.cos(rot) * outerRadius,
                cy + Math.sin(rot) * outerRadius
            );
            rot += step;
            
            this.ctx.lineTo(
                cx + Math.cos(rot) * innerRadius,
                cy + Math.sin(rot) * innerRadius
            );
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
    }
    
    drawHeart(cx, cy, size) {
        const hsize = size * 0.7;
        this.ctx.moveTo(cx, cy + size * 0.5);
        this.ctx.bezierCurveTo(
            cx - hsize, cy - hsize * 0.5,
            cx - hsize, cy - size,
            cx, cy - size * 0.3
        );
        this.ctx.bezierCurveTo(
            cx + hsize, cy - size,
            cx + hsize, cy - hsize * 0.5,
            cx, cy + size * 0.5
        );
    }
    
    drawPolygon(cx, cy, radius, sides) {
        const angle = Math.PI * 2 / sides;
        const startAngle = -Math.PI / 2;
        
        this.ctx.moveTo(
            cx + Math.cos(startAngle) * radius,
            cy + Math.sin(startAngle) * radius
        );
        
        for (let i = 1; i < sides; i++) {
            this.ctx.lineTo(
                cx + Math.cos(startAngle + angle * i) * radius,
                cy + Math.sin(startAngle + angle * i) * radius
            );
        }
        
        this.ctx.closePath();
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    render(game) {
        this.clear();
        
        game.cards.forEach(card => {
            this.drawCard(card, game);
        });
        
        if (game.state === CONSTANTS.GAME_STATE.PREVIEW) {
            this.drawPreviewOverlay(game);
        }
    }
    
    drawPreviewOverlay(game) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
        this.ctx.shadowBlur = 30 * this.scale;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 60 * this.scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#3498DB';
        this.ctx.lineWidth = 4 * this.scale;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 60 * this.scale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${48 * this.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(game.previewCountdown, centerX, centerY);
        
        this.ctx.fillStyle = '#3498DB';
        this.ctx.font = `${16 * this.scale}px Arial`;
        this.ctx.fillText('记忆卡牌位置', centerX, centerY + 80 * this.scale);
        
        this.ctx.restore();
    }
    
    getCardAtPosition(mouseX, mouseY, gridSize) {
        const col = Math.floor((mouseX - this.scaledPadding) / (this.scaledCardWidth + this.scaledCardSpacing));
        const row = Math.floor((mouseY - this.scaledPadding) / (this.scaledCardHeight + this.scaledCardSpacing));
        
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            return null;
        }
        
        const x = this.scaledPadding + col * (this.scaledCardWidth + this.scaledCardSpacing);
        const y = this.scaledPadding + row * (this.scaledCardHeight + this.scaledCardSpacing);
        
        if (mouseX < x || mouseX > x + this.scaledCardWidth ||
            mouseY < y || mouseY > y + this.scaledCardHeight) {
            return null;
        }
        
        return { row, col };
    }
}
