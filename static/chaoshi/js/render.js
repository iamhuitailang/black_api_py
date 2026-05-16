class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONSTANTS.CANVAS_WIDTH;
        this.canvas.height = CONSTANTS.CANVAS_HEIGHT;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawBackground() {
        const ctx = this.ctx;
        
        const wallGradient = ctx.createLinearGradient(0, 0, 0, CONSTANTS.GROUND_Y);
        wallGradient.addColorStop(0, '#FFF5E6');
        wallGradient.addColorStop(0.5, '#FFE8CC');
        wallGradient.addColorStop(1, '#FFDAB3');
        ctx.fillStyle = wallGradient;
        ctx.fillRect(0, 0, this.canvas.width, CONSTANTS.GROUND_Y);
        
        ctx.strokeStyle = 'rgba(210, 180, 140, 0.3)';
        ctx.lineWidth = 1;
        for (let y = 40; y < CONSTANTS.GROUND_Y; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        
        const floorGradient = ctx.createLinearGradient(0, CONSTANTS.GROUND_Y, 0, this.canvas.height);
        floorGradient.addColorStop(0, '#D4A574');
        floorGradient.addColorStop(1, '#C4956A');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, CONSTANTS.GROUND_Y, this.canvas.width, this.canvas.height - CONSTANTS.GROUND_Y);
        
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        for (let x = 0; x < this.canvas.width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, CONSTANTS.GROUND_Y);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        const shelves = [
            { x: 200, y: CONSTANTS.GROUND_Y - 120, width: 150 },
            { x: 450, y: CONSTANTS.GROUND_Y - 120, width: 150 },
            { x: 700, y: CONSTANTS.GROUND_Y - 120, width: 150 },
            { x: 950, y: CONSTANTS.GROUND_Y - 120, width: 150 }
        ];
        
        shelves.forEach(shelf => {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(shelf.x, shelf.y + 20, 8, 100);
            ctx.fillRect(shelf.x + shelf.width - 8, shelf.y + 20, 8, 100);
            
            const shelfGradient = ctx.createLinearGradient(shelf.x, shelf.y, shelf.x, shelf.y + 20);
            shelfGradient.addColorStop(0, '#DEB887');
            shelfGradient.addColorStop(0.5, '#D2B48C');
            shelfGradient.addColorStop(1, '#C4A76C');
            ctx.fillStyle = shelfGradient;
            ctx.fillRect(shelf.x - 5, shelf.y, shelf.width + 10, 20);
            
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(shelf.x - 5, shelf.y + 15, shelf.width + 10, 5);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.moveTo(shelf.x - 5, shelf.y + 20);
            ctx.lineTo(shelf.x - 5, shelf.y + 35);
            ctx.lineTo(shelf.x + shelf.width + 5, shelf.y + 35);
            ctx.lineTo(shelf.x + shelf.width + 5, shelf.y + 20);
            ctx.fill();
        });
        
        const lightPositions = [275, 525, 775, 1025];
        lightPositions.forEach(x => {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(x, 10, 30, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const lightGradient = ctx.createRadialGradient(x, 30, 0, x, 30, 180);
            lightGradient.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
            lightGradient.addColorStop(0.5, 'rgba(255, 220, 130, 0.2)');
            lightGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = lightGradient;
            ctx.fillRect(x - 200, 0, 400, CONSTANTS.GROUND_Y + 50);
        });
        
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, 100, CONSTANTS.GROUND_Y - 100);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 0, 100, CONSTANTS.GROUND_Y - 100);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 100, CONSTANTS.GROUND_Y - 100);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FF6B35';
        ctx.fillText('🏪 社区超市', this.canvas.width / 2 - 70, 45);
    }
    
    drawPlayer(player) {
        const ctx = this.ctx;
        const x = player.x;
        const y = player.y;
        
        ctx.save();
        
        if (player.hasShield) {
            ctx.beginPath();
            ctx.arc(x + player.width / 2, y + player.height / 2, 45, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
            ctx.fill();
        }
        
        if (player.hasCart) {
            ctx.beginPath();
            ctx.arc(x + player.width / 2, y + player.height / 2, player.getPickupRange(), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        if (player.isDashing) {
            ctx.globalAlpha = 0.5;
            for (let i = 1; i <= 3; i++) {
                const offsetX = player.facingRight ? -i * 15 : i * 15;
                ctx.font = `${30 - i * 5}px Arial`;
                ctx.fillText(player.icon, x + offsetX + 5, y + 40);
            }
            ctx.globalAlpha = 1;
        }
        
        if (!player.facingRight) {
            ctx.translate(x + player.width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }
        
        const bodyColor = player.type === 'speed' ? '#FF6B6B' : 
                         player.type === 'pickup' ? '#4ECDC4' : '#FFB6C1';
        
        const bodyY = player.isCrouching ? y + player.height - 22 : y + player.height - 25;
        const bodyHeight = player.isCrouching ? 12 : 18;
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(x + player.width / 2, bodyY, 18, bodyHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y + 18, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(x + player.width / 2 - 6, y + 15, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + player.width / 2 + 6, y + 15, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x + player.width / 2 - 5, y + 16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + player.width / 2 + 7, y + 16, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + player.width / 2 - 4, y + 15, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + player.width / 2 + 8, y + 15, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + player.width / 2 - 12, y + 22, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + player.width / 2 + 12, y + 22, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y + 26, 4, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        const hairColor = player.type === 'speed' ? '#4A90D9' : 
                         player.type === 'pickup' ? '#2ECC71' : '#9B59B6';
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y + 8, 12, Math.PI, 0);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + player.width / 2 - 10, y + 10);
        ctx.quadraticCurveTo(x + player.width / 2 - 8, y + 2, x + player.width / 2, y + 4);
        ctx.quadraticCurveTo(x + player.width / 2 + 8, y + 2, x + player.width / 2 + 10, y + 10);
        ctx.fill();
        
        if (player.type === 'speed') {
            ctx.fillStyle = '#3498DB';
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 12);
            ctx.quadraticCurveTo(x + 25, y - 5, x + 40, y + 12);
            ctx.lineTo(x + 38, y + 8);
            ctx.quadraticCurveTo(x + 25, y - 2, x + 12, y + 8);
            ctx.fill();
        } else if (player.type === 'pickup') {
            ctx.fillStyle = '#E67E22';
            ctx.beginPath();
            ctx.ellipse(x + player.width / 2, y + 6, 14, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#D35400';
            ctx.fillRect(x + 18, y - 2, 14, 8);
        } else {
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.arc(x + 15, y + 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 35, y + 5, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawClerk(clerk) {
        const ctx = this.ctx;
        const x = clerk.x;
        const y = clerk.y;
        
        ctx.save();
        
        if (clerk.isStunned) {
            ctx.globalAlpha = 0.6;
        }
        
        if (!clerk.facingRight) {
            ctx.translate(x + clerk.width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }
        
        ctx.fillStyle = '#5DADE2';
        ctx.beginPath();
        ctx.ellipse(x + clerk.width / 2, y + clerk.height - 20, 16, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#2980B9';
        ctx.fillRect(x + 10, y + 20, 25, 20);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 10, y + 20, 25, 20);
        
        ctx.fillStyle = '#FAD7A0';
        ctx.beginPath();
        ctx.arc(x + clerk.width / 2, y + 16, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#784212';
        ctx.beginPath();
        ctx.arc(x + clerk.width / 2, y + 6, 14, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(x + clerk.width / 2 - 5, y + 14, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + clerk.width / 2 + 5, y + 14, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (clerk.state === 'chase') {
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.arc(x + clerk.width / 2 - 5, y + 15, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + clerk.width / 2 + 5, y + 15, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + clerk.width / 2 - 8, y + 10);
            ctx.lineTo(x + clerk.width / 2 - 3, y + 12);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + clerk.width / 2 + 8, y + 10);
            ctx.lineTo(x + clerk.width / 2 + 3, y + 12);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x + clerk.width / 2 - 5, y + 15, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + clerk.width / 2 + 5, y + 15, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 16);
        ctx.quadraticCurveTo(x + clerk.width / 2, y + 10, x + 37, y + 16);
        ctx.stroke();
        
        if (clerk.state === 'chase') {
            ctx.fillStyle = '#E74C3C';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('❗', x + clerk.width / 2 - 8, y - 2);
        }
        
        if (clerk.isStunned) {
            ctx.font = '18px Arial';
            ctx.fillText('💫', x + clerk.width / 2 - 12, y - 5);
        }
        
        ctx.restore();
    }
    
    drawProduct(product) {
        const ctx = this.ctx;
        const bobY = product.getBobY();
        const px = product.x;
        const py = product.y + bobY;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(px - 2 + r, py + 2);
        ctx.lineTo(px - 2 + 38 - r, py + 2);
        ctx.quadraticCurveTo(px - 2 + 38, py + 2, px - 2 + 38, py + 2 + r);
        ctx.lineTo(px - 2 + 38, py + 2 + 32 - r);
        ctx.quadraticCurveTo(px - 2 + 38, py + 2 + 32, px - 2 + 38 - r, py + 2 + 32);
        ctx.lineTo(px - 2 + r, py + 2 + 32);
        ctx.quadraticCurveTo(px - 2, py + 2 + 32, px - 2, py + 2 + 32 - r);
        ctx.lineTo(px - 2, py + 2 + r);
        ctx.quadraticCurveTo(px - 2, py + 2, px - 2 + r, py + 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = '26px Arial';
        ctx.fillText(product.emoji, px + 4, py + 28);
        
        if (product.price >= 50) {
            const gradient = ctx.createRadialGradient(px + 17, py + 17, 0, px + 17, py + 17, 22);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px + 17, py + 17, 22, 0, Math.PI * 2);
            ctx.fill();
            
            if (product.price >= 100) {
                ctx.font = 'bold 10px Arial';
                ctx.fillStyle = '#E74C3C';
                ctx.fillText('★', px + 28, py + 5);
            }
        }
    }
    
    drawEffects(effects) {
        const ctx = this.ctx;
        
        effects.forEach(effect => {
            const alpha = 1 - (effect.radius / 100);
            
            if (effect.type === 'dash') {
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (effect.type === 'shield') {
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
                ctx.fill();
            } else if (effect.type === 'cart') {
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        });
    }
    
    drawPickupEffect(x, y, amount) {
        const ctx = this.ctx;
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#228B22';
        ctx.fillText(`+¥${amount}`, x, y);
    }
    
    render(game) {
        this.clear();
        this.drawBackground();
        
        game.productManager.products.forEach(product => {
            if (!product.collected) {
                this.drawProduct(product);
            }
        });
        
        game.clerks.forEach(clerk => {
            this.drawClerk(clerk);
        });
        
        this.drawPlayer(game.player);
        
        this.drawEffects(game.skillSystem.effects);
    }
}