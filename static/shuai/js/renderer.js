const Renderer = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width || 1200;
        this.canvas.height = rect.height || 800;
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    drawRing() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(0, 0, w, h);
        
        const ringX = w * 0.08;
        const ringY = h * 0.25;
        const ringW = w * 0.84;
        const ringH = h * 0.6;
        
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(ringX - 20, ringY + ringH, ringW + 40, h * 0.12);
        
        ctx.fillStyle = '#4a6fa5';
        ctx.fillRect(ringX, ringY, ringW, ringH);
        
        ctx.strokeStyle = '#5b8db8';
        ctx.lineWidth = 1;
        for (let i = 0; i < ringW; i += 60) {
            ctx.beginPath();
            ctx.moveTo(ringX + i, ringY);
            ctx.lineTo(ringX + i, ringY + ringH);
            ctx.stroke();
        }
        for (let i = 0; i < ringH; i += 60) {
            ctx.beginPath();
            ctx.moveTo(ringX, ringY + i);
            ctx.lineTo(ringX + ringW, ringY + i);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(ringX + 20, ringY + 30);
        ctx.lineTo(ringX + ringW - 20, ringY + 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(ringX + 20, ringY + ringH / 3 + 20);
        ctx.lineTo(ringX + ringW - 20, ringY + ringH / 3 + 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(ringX + 20, ringY + ringH * 2 / 3 + 10);
        ctx.lineTo(ringX + ringW - 20, ringY + ringH * 2 / 3 + 10);
        ctx.stroke();
        
        ctx.lineWidth = 4;
        ctx.strokeRect(ringX, ringY, ringW, ringH);
        
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        const cornerSize = 18;
        ctx.fillRect(ringX - 8, ringY - 8, cornerSize, cornerSize);
        ctx.fillRect(ringX + ringW - cornerSize + 8, ringY - 8, cornerSize, cornerSize);
        ctx.fillRect(ringX - 8, ringY + ringH - cornerSize + 8, cornerSize, cornerSize);
        ctx.fillRect(ringX + ringW - cornerSize + 8, ringY + ringH - cornerSize + 8, cornerSize, cornerSize);
        ctx.shadowBlur = 0;
    },
    
    drawCharacter(character, isPlayer) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const scale = h / 800;
        const x = (w * 0.08) + (character.x / 1200) * (w * 0.84);
        const y = h * 0.75;
        const facing = character.facing;
        const color = character.color;
        const isAttacking = character.state === PLAYER_STATE.ATTACKING;
        const isCrouching = character.state === PLAYER_STATE.CROUCHING;
        
        ctx.save();
        
        if (facing === -1) {
            ctx.translate(x + 70 * scale, 0);
            ctx.scale(-1, 1);
            ctx.translate(-x, 0);
        }
        
        const baseY = isCrouching ? y - 60 * scale : y;
        const s = scale * (isCrouching ? 0.75 : 1);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4 * s;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const legAnim = character.state === PLAYER_STATE.WALKING ? Math.sin(character.animationFrame * 2) * 10 * s : 0;
        
        ctx.fillStyle = this.darkenColor(color, 35);
        ctx.beginPath();
        ctx.moveTo(x + 25 * s, y - 15 * s);
        ctx.lineTo(x + 15 * s + legAnim, y + 15 * s);
        ctx.lineTo(x + 35 * s + legAnim, y + 15 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.darkenColor(color, 35);
        ctx.beginPath();
        ctx.moveTo(x + 55 * s, y - 15 * s);
        ctx.lineTo(x + 45 * s - legAnim, y + 15 * s);
        ctx.lineTo(x + 65 * s - legAnim, y + 15 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        const bodyGradient = ctx.createLinearGradient(x + 10 * s, baseY - 90 * s, x + 70 * s, baseY + 10 * s);
        bodyGradient.addColorStop(0, this.lightenColor(color, 30));
        bodyGradient.addColorStop(0.5, color);
        bodyGradient.addColorStop(1, this.darkenColor(color, 30));
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(x + 15 * s, y - 20 * s);
        ctx.quadraticCurveTo(x + 5 * s, baseY - 50 * s, x + 20 * s, baseY - 80 * s);
        ctx.lineTo(x + 60 * s, baseY - 80 * s);
        ctx.quadraticCurveTo(x + 75 * s, baseY - 50 * s, x + 65 * s, y - 20 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.lightenColor(color, 50);
        ctx.beginPath();
        ctx.ellipse(x + 40 * s, baseY - 55 * s, 8 * s, 15 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const armX = isAttacking ? 35 * s : 0;
        const armAngle = isAttacking ? 0.3 : 0;
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x - 5 * s - armX * 0.6, baseY - 55 * s, 15 * s, 10 * s, -0.3 - armAngle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#f5d0c5';
        ctx.beginPath();
        ctx.arc(x - 18 * s - armX, baseY - 52 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x + 85 * s + armX, baseY - 60 * s + armX * 0.3, 15 * s, 10 * s, 0.3 + armAngle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#f5d0c5';
        ctx.beginPath();
        ctx.arc(x + 100 * s + armX, baseY - 58 * s + armX * 0.3, 10 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        if (isAttacking) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 5 * s;
            ctx.globalAlpha = 0.8;
            
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(x + 115 * s + i * 18 * s, baseY - 58 * s, (20 - i * 4) * s, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(x + 130 * s, baseY - 58 * s, 25 * s, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
        }
        
        ctx.fillStyle = '#f5d0c5';
        ctx.beginPath();
        ctx.arc(x + 40 * s, baseY - 105 * s, 24 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x + 40 * s, baseY - 120 * s, 22 * s, 9 * s, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(x + 20 * s, baseY - 128 * s, 40 * s, 8 * s);
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x + 32 * s, baseY - 107 * s, 7 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 50 * s, baseY - 107 * s, 7 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x + 34 * s, baseY - 107 * s, 3 * s, 0, Math.PI * 2);
        ctx.arc(x + 52 * s, baseY - 107 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        if (isAttacking) {
            ctx.moveTo(x + 30 * s, baseY - 92 * s);
            ctx.lineTo(x + 50 * s, baseY - 92 * s);
        } else {
            ctx.arc(x + 40 * s, baseY - 90 * s, 8 * s, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(x + 24 * s, baseY - 118 * s);
        ctx.lineTo(x + 34 * s, baseY - 115 * s);
        ctx.moveTo(x + 46 * s, baseY - 115 * s);
        ctx.lineTo(x + 56 * s, baseY - 118 * s);
        ctx.stroke();
        
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3 * s;
        ctx.font = `bold ${18 * s}px Arial Black, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const nameText = character.name.toUpperCase();
        ctx.strokeText(nameText, x + 40 * s, baseY - 135 * s);
        ctx.fillText(nameText, x + 40 * s, baseY - 135 * s);
        
        ctx.restore();
    },
    
    drawDownCharacter(character, isPlayer) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const scale = h / 800;
        const x = (w * 0.08) + (character.x / 1200) * (w * 0.84);
        const y = h * 0.78;
        const color = character.color;
        
        ctx.save();
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4 * scale;
        
        ctx.beginPath();
        ctx.ellipse(x + 40 * scale, y, 50 * scale, 20 * scale, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.lightenColor(color, 25);
        ctx.beginPath();
        ctx.ellipse(x + 35 * scale, y - 3 * scale, 18 * scale, 10 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f5d0c5';
        ctx.beginPath();
        ctx.arc(x + 85 * scale, y - 12 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(x + 85 * scale, y - 24 * scale, 18 * scale, 8 * scale, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('×', x + 78 * scale, y - 14 * scale);
        ctx.fillText('×', x + 92 * scale, y - 14 * scale);
        
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 * scale;
        ctx.font = `bold ${16 * scale}px Arial Black`;
        ctx.textAlign = 'center';
        ctx.fillText(character.name, x + 40 * scale, y - 35 * scale);
        ctx.strokeText(character.name, x + 40 * scale, y - 35 * scale);
        
        if (character.state === PLAYER_STATE.PINNED) {
            ctx.fillStyle = 'rgba(255, 50, 50, 0.5)';
            ctx.beginPath();
            ctx.ellipse(x + 40 * scale, y, 60 * scale, 28 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3 * scale;
            ctx.font = `bold ${22 * scale}px Arial Black`;
            ctx.fillText('被压制!', x + 40 * scale, y - 55 * scale);
            ctx.strokeText('被压制!', x + 40 * scale, y - 55 * scale);
            
            for (let i = 0; i < 4; i++) {
                const starX = x + 10 * scale + i * 20 * scale;
                const starY = y - 48 * scale - Math.sin(Date.now() / 150 + i * 2) * 8 * scale;
                
                ctx.fillStyle = 'rgba(255, 215, 0, ' + (0.5 + Math.sin(Date.now() / 100 + i) * 0.3) + ')';
                this.drawStar(starX, starY, 5, 7 * scale, 3 * scale);
            }
        }
        
        ctx.restore();
    },
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        const ctx = this.ctx;
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
    
    drawPinning(pinning, pinned, isPlayer) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const scale = h / 800;
        
        const pinX = (w * 0.08) + (pinning.x / 1200) * (w * 0.84);
        const pinY = h * 0.7;
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            pinX - 10 * scale,
            pinY - 50 * scale,
            100 * scale,
            70 * scale
        );
        ctx.setLineDash([]);
    },
    
    drawUI(game) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const scale = h / 800;
        
        this.drawHealthBar(game.player, 50 * scale, 80 * scale, true, scale);
        this.drawHealthBar(game.enemy, w - 250 * scale, 80 * scale, false, scale);
    },
    
    drawHealthBar(character, x, y, isLeft, scale) {
        const ctx = this.ctx;
        const width = 200 * scale;
        const height = 30 * scale;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4 * scale;
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        
        const healthPercent = Math.max(0, character.health / character.maxHealth);
        const healthWidth = width * healthPercent;
        
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#2ecc71');
            gradient.addColorStop(1, '#27ae60');
        } else if (healthPercent > 0.3) {
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
        }
        
        if (isLeft) {
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, healthWidth, height);
        } else {
            ctx.fillStyle = gradient;
            ctx.fillRect(x + width - healthWidth, y, healthWidth, height);
        }
        
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 * scale;
        ctx.font = `bold ${16 * scale}px Arial Black`;
        ctx.textAlign = isLeft ? 'left' : 'right';
        
        const healthText = Math.ceil(character.health) + '/' + character.maxHealth;
        ctx.strokeText(healthText, isLeft ? x + 5 * scale : x + width - 5 * scale, y - 8 * scale);
        ctx.fillText(healthText, isLeft ? x + 5 * scale : x + width - 5 * scale, y - 8 * scale);
    },
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },
    
    render(game) {
        this.clear();
        this.drawRing();
        
        if (game.player.state === PLAYER_STATE.DOWN || game.player.state === PLAYER_STATE.PINNED) {
            this.drawDownCharacter(game.player, true);
        } else {
            this.drawCharacter(game.player, true);
        }
        
        if (game.enemy.state === PLAYER_STATE.DOWN || game.enemy.state === PLAYER_STATE.PINNED) {
            this.drawDownCharacter(game.enemy, false);
        } else {
            this.drawCharacter(game.enemy, false);
        }
        
        if (game.player.state === PLAYER_STATE.PINNING) {
            this.drawPinning(game.player, game.enemy, true);
        } else if (game.enemy.state === PLAYER_STATE.PINNING) {
            this.drawPinning(game.enemy, game.player, false);
        }
        
        this.drawUI(game);
    }
};
