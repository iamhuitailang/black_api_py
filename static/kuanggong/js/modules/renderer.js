import { ORE_TYPES, MINE_LAYERS, CHARACTERS, CANVAS_CONFIG, UPGRADES } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CANVAS_CONFIG.width;
        this.height = CANVAS_CONFIG.height;
        this.mineArea = CANVAS_CONFIG.mineArea;
        this.fireflies = [];
        this.initFireflies();
        this.animationFrame = 0;
    }
    
    initFireflies() {
        for (let i = 0; i < 15; i++) {
            this.fireflies.push({
                x: Math.random() * this.mineArea.width + this.mineArea.x,
                y: Math.random() * this.mineArea.height + this.mineArea.y,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                angle: Math.random() * Math.PI * 2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    updateFireflies() {
        this.fireflies.forEach(f => {
            f.x += Math.cos(f.angle) * f.speed;
            f.y += Math.sin(f.angle) * f.speed;
            f.pulse += 0.1;
            
            if (f.x < this.mineArea.x + 10) f.angle = Math.random() * Math.PI;
            if (f.x > this.mineArea.x + this.mineArea.width - 10) f.angle = Math.random() * Math.PI + Math.PI;
            if (f.y < this.mineArea.y + 10) f.angle = Math.random() * Math.PI + Math.PI / 2;
            if (f.y > this.mineArea.y + this.mineArea.height - 10) f.angle = Math.random() * Math.PI - Math.PI / 2;
            
            if (Math.random() < 0.01) {
                f.angle += (Math.random() - 0.5) * Math.PI / 2;
            }
        });
    }
    
    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    render(state) {
        this.animationFrame++;
        this.clear();
        this.updateFireflies();
        
        const layer = MINE_LAYERS[state.currentLayer];
        this.drawMineBackground(layer);
        this.drawMineArea(layer);
        this.drawFireflies();
        this.drawRock(state);
        this.drawParticles(state);
        this.drawFloatingTexts(state);
        this.drawMiner(state);
        this.drawAutoMiners(state);
        this.drawUI(state);
    }
    
    drawMineBackground(layer) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, layer.bgColor);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawMineArea(layer) {
        const { x, y, width, height } = this.mineArea;
        
        this.ctx.fillStyle = layer.bgColor;
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.strokeStyle = '#6a6a9a';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x, y, width, height);
        
        for (let i = 0; i < 30; i++) {
            const rx = x + (i * 53) % (width - 40) + 20;
            const ry = y + ((i * 37) % (height - 40)) + 20;
            const rw = 20 + (i % 3) * 10;
            const rh = 15 + (i % 4) * 8;
            
            this.ctx.fillStyle = layer.rockColor;
            this.ctx.fillRect(rx, ry, rw, rh);
            
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.fillRect(rx, ry + rh - 3, rw, 3);
        }
    }
    
    drawFireflies() {
        this.fireflies.forEach(f => {
            const alpha = 0.5 + Math.sin(f.pulse) * 0.3;
            const glow = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 4);
            glow.addColorStop(0, `rgba(255, 255, 150, ${alpha})`);
            glow.addColorStop(0.5, `rgba(255, 255, 100, ${alpha * 0.5})`);
            glow.addColorStop(1, 'rgba(255, 255, 50, 0)');
            
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawRock(state) {
        const { x, y, width, height } = this.mineArea;
        const rockX = x + width / 2;
        const rockY = y + height / 2 + 50;
        const rockSize = 80;
        
        if (!state.currentRock) {
            this.drawNewRock(state, rockX, rockY, rockSize);
            return;
        }
        
        const ore = ORE_TYPES[state.currentRock.type.toUpperCase()] || ORE_TYPES.STONE;
        const healthPercent = state.rockHealth / state.rockMaxHealth;
        
        this.ctx.fillStyle = ore.borderColor;
        this.ctx.beginPath();
        this.ctx.ellipse(rockX, rockY + 5, rockSize + 5, rockSize * 0.6 + 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = ore.color;
        this.ctx.beginPath();
        this.ctx.ellipse(rockX, rockY, rockSize, rockSize * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(rockX - 20, rockY - 15, 25, 15, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.drawCracks(rockX, rockY, rockSize, healthPercent);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(rockX - 50, rockY + 60, 100, 10);
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillRect(rockX - 50, rockY + 60, 100 * healthPercent, 10);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rockX - 50, rockY + 60, 100, 10);
        
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${ore.name} ${Math.ceil(state.rockHealth)}/${state.rockMaxHealth}`, rockX, rockY + 85);
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawNewRock(state, x, y, size) {
        const layer = MINE_LAYERS[state.currentLayer];
        const rand = Math.random();
        let cumulative = 0;
        let selectedOre = layer.ores[0];
        
        for (const ore of layer.ores) {
            cumulative += ore.chance;
            if (rand < cumulative) {
                selectedOre = ore;
                break;
            }
        }
        
        state.currentRock = { type: selectedOre.type };
        state.rockMaxHealth = 10 + state.currentLayer * 5;
        state.rockHealth = state.rockMaxHealth;
    }
    
    drawCracks(x, y, size, healthPercent) {
        if (healthPercent > 0.7) return;
        
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        this.ctx.lineWidth = 2;
        
        const crackCount = Math.floor((1 - healthPercent) * 5);
        
        for (let i = 0; i < crackCount; i++) {
            const angle = (i / crackCount) * Math.PI * 2 + this.animationFrame * 0.01;
            const startX = x + Math.cos(angle) * size * 0.3;
            const startY = y + Math.sin(angle) * size * 0.4;
            const endX = x + Math.cos(angle) * size * 0.7;
            const endY = y + Math.sin(angle) * size * 0.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
    
    drawParticles(state) {
        state.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawFloatingTexts(state) {
        state.floatingTexts.forEach(t => {
            const alpha = t.life / t.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillStyle = t.color;
            this.ctx.font = 'bold 16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(t.text, t.x, t.y);
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawMiner(state) {
        const { x, y, width } = this.mineArea;
        const minerX = x + width / 2 - 100;
        const minerY = y + 180;
        const character = CHARACTERS[state.selectedCharacter];
        
        this.ctx.font = '64px serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.icon, minerX, minerY);
        
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText(character.name, minerX, minerY + 30);
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawAutoMiners(state) {
        const { x, y, width } = this.mineArea;
        const count = state.getAutoMinerCount();
        
        for (let i = 0; i < count; i++) {
            const mx = x + width - 80 - (i % 2) * 60;
            const my = y + 100 + Math.floor(i / 2) * 80;
            const bounce = Math.sin(this.animationFrame * 0.1 + i) * 3;
            
            this.ctx.font = '48px serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👷‍♂️', mx, my + bounce);
            
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillStyle = '#4ade80';
            this.ctx.font = 'bold 10px monospace';
            this.ctx.fillText('工作中', mx, my + 35);
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            const pulseSize = 5 + Math.sin(this.animationFrame * 0.15 + i) * 2;
            this.ctx.fillStyle = '#4ade80';
            this.ctx.beginPath();
            this.ctx.arc(mx + 15, my - 20, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawUI(state) {
        this.drawTopBar(state);
        this.drawLeftPanel(state);
        this.drawRightPanel(state);
        this.drawBottomBar(state);
    }
    
    drawTopBar(state) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(0, 0, this.width, 45);
        
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`💰 ${Math.floor(state.gold).toLocaleString()}`, 20, 30);
        
        const layer = MINE_LAYERS[state.currentLayer];
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`⛰️ ${layer.name}`, this.width / 2, 30);
        
        const inv = state.getTotalInventory();
        const cap = state.getBackpackCapacity();
        this.ctx.fillStyle = inv >= cap ? '#f87171' : '#4ade80';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`🎒 ${inv}/${cap}`, this.width - 20, 30);
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawLeftPanel(state) {
        const panelX = 10;
        const panelY = 60;
        const panelW = 180;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(panelX, panelY, panelW, 350);
        this.ctx.strokeStyle = '#6a6a9a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelW, 350);
        
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📦 背包', panelX + panelW / 2, panelY + 25);
        
        let yOffset = panelY + 50;
        Object.values(ORE_TYPES).forEach((ore, index) => {
            const count = state.inventory[ore.id] || 0;
            if (count > 0) {
                this.ctx.fillStyle = ore.color;
                this.ctx.fillRect(panelX + 15, yOffset - 10, 16, 16);
                this.ctx.strokeStyle = ore.borderColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(panelX + 15, yOffset - 10, 16, 16);
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 12px monospace';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`${ore.name}: ${count}`, panelX + 40, yOffset + 2);
                
                const value = Math.floor(count * ore.price * state.getSellMultiplier());
                this.ctx.fillStyle = '#4ade80';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`💰${value}`, panelX + panelW - 10, yOffset + 2);
                
                yOffset += 25;
            }
        });
        
        if (yOffset === panelY + 50) {
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('背包空空如也', panelX + panelW / 2, yOffset + 20);
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawRightPanel(state) {
        const panelX = this.width - 190;
        const panelY = 60;
        const panelW = 180;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(panelX, panelY, panelW, 400);
        this.ctx.strokeStyle = '#6a6a9a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelW, 400);
        
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚙️ 升级', panelX + panelW / 2, panelY + 25);
        
        let yOffset = panelY + 50;
        Object.values(UPGRADES).forEach((upgrade, index) => {
            const level = state.upgrades[upgrade.id] || 0;
            const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
            const canAfford = state.gold >= cost && level < upgrade.maxLevel;
            const isMaxed = level >= upgrade.maxLevel;
            
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = canAfford ? 'rgba(74, 222, 128, 0.35)' : 'rgba(100, 100, 100, 0.35)';
            this.ctx.fillRect(panelX + 10, yOffset - 15, panelW - 20, 45);
            this.ctx.shadowBlur = 3;
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${upgrade.icon} ${upgrade.name} Lv.${level}`, panelX + 20, yOffset);
            
            if (isMaxed) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('已满级', panelX + 20, yOffset + 18);
            } else {
                this.ctx.fillStyle = canAfford ? '#4ade80' : '#f87171';
                this.ctx.fillText(`💰 ${cost}`, panelX + 20, yOffset + 18);
            }
            
            yOffset += 55;
        });
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawBottomBar(state) {
        const barY = this.height - 50;
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.ctx.fillRect(0, barY, this.width, 50);
        
        this.drawButton(20, barY + 10, 100, 30, '⛏️ 挖矿', '#22c55e');
        this.drawButton(130, barY + 10, 100, 30, '💰 售卖', '#f59e0b');
        this.drawButton(240, barY + 10, 100, 30, '⬆️ 矿层', '#3b82f6');
        this.drawButton(this.width - 120, barY + 10, 100, 30, '⏸️ 暂停', '#6b7280');
    }
    
    drawButton(x, y, w, h, text, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
        
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + w / 2, y + h / 2);
        this.ctx.textBaseline = 'alphabetic';
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    isPointInButton(px, py, bx, by, bw, bh) {
        return px >= bx && px <= bx + bw && py >= by && py <= by + bh;
    }
    
    getButtonAt(x, y) {
        const barY = this.height - 50;
        const buttons = [
            { id: 'mine', x: 20, y: barY + 10, w: 100, h: 30 },
            { id: 'sell', x: 130, y: barY + 10, w: 100, h: 30 },
            { id: 'layer', x: 240, y: barY + 10, w: 100, h: 30 },
            { id: 'pause', x: this.width - 120, y: barY + 10, w: 100, h: 30 }
        ];
        
        for (const btn of buttons) {
            if (this.isPointInButton(x, y, btn.x, btn.y, btn.w, btn.h)) {
                return btn.id;
            }
        }
        return null;
    }
    
    getUpgradeAt(x, y) {
        const panelX = this.width - 190;
        const panelY = 60;
        const panelW = 180;
        
        let yOffset = panelY + 50;
        for (const upgrade of Object.values(UPGRADES)) {
            if (x >= panelX + 10 && x <= panelX + panelW - 10 &&
                y >= yOffset - 15 && y <= yOffset + 30) {
                return upgrade.id;
            }
            yOffset += 55;
        }
        return null;
    }
}
