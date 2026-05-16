const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    groundY: 0,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.groundY = this.height * 0.75;
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#f5f0e6');
        gradient.addColorStop(0.5, '#e8e0d0');
        gradient.addColorStop(1, '#d4c8b0');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'rgba(180, 160, 140, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.quadraticCurveTo(this.width * 0.25, this.groundY - 50, this.width * 0.5, this.groundY - 20);
        this.ctx.quadraticCurveTo(this.width * 0.75, this.groundY - 60, this.width, this.groundY - 10);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.width, this.groundY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.drawInkSplashes();
    },
    
    drawInkSplashes() {
        const splashes = [
            { x: this.width * 0.1, y: this.height * 0.2, size: 30 },
            { x: this.width * 0.9, y: this.height * 0.3, size: 25 },
            { x: this.width * 0.15, y: this.height * 0.85, size: 20 },
            { x: this.width * 0.85, y: this.height * 0.9, size: 22 }
        ];
        
        splashes.forEach(splash => {
            this.ctx.fillStyle = 'rgba(50, 40, 30, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    },
    
    drawCharacter(character) {
        const x = character.x;
        const y = this.groundY - 50;
        character.y = y;
        
        this.ctx.save();
        
        if (character.isHit) {
            const shake = Math.sin(character.hitFrame * 0.5) * 5;
            this.ctx.translate(shake, 0);
            if (character.hitFrame > 30) {
                character.isHit = false;
            }
        }
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 70, 40, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (character.isAttacking) {
            const attackProgress = character.attackFrame / AttackTypes[character.attackType].frameCount;
            const scale = 1 + Math.sin(attackProgress * Math.PI) * 0.3;
            this.ctx.translate(x, y);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-x, -y);
        }
        
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 35, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#2c1810';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 40px "STKaiti", "KaiTi", serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(character.char, x, y);
        
        this.ctx.fillStyle = character.color;
        this.ctx.font = '14px "STKaiti", "KaiTi", serif';
        this.ctx.fillText(character.name, x, y + 55);
        
        this.ctx.restore();
    },
    
    drawAttackEffect(effect) {
        const currentX = effect.x + (effect.targetX - effect.x) * effect.progress;
        const alpha = 1 - effect.progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.ctx.fillStyle = effect.color;
        this.ctx.font = 'bold 36px "STKaiti", "KaiTi", serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 20;
            this.ctx.globalAlpha = alpha * (0.3 + i * 0.2);
            this.ctx.fillText(effect.text, currentX + offset, effect.y - offset);
        }
        
        this.ctx.globalAlpha = alpha * 0.5;
        this.ctx.beginPath();
        this.ctx.arc(currentX, effect.y, 30 + effect.progress * 30, 0, Math.PI * 2);
        this.ctx.fillStyle = effect.color;
        this.ctx.fill();
        
        this.ctx.restore();
    },
    
    drawDamageNumber(dmg) {
        this.ctx.save();
        this.ctx.globalAlpha = dmg.life / 60;
        this.ctx.fillStyle = dmg.isHeal ? '#4caf50' : '#c41e3a';
        this.ctx.font = 'bold 28px "STKaiti", "KaiTi", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((dmg.isHeal ? '+' : '-') + dmg.damage, dmg.x, dmg.y);
        this.ctx.restore();
    },
    
    drawUltimateEffect(character, skillName) {
        const x = character.x;
        const y = character.y;
        
        this.ctx.save();
        
        this.ctx.strokeStyle = character.color;
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = character.color;
        this.ctx.shadowBlur = 20;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.002;
            const radius = 60 + Math.sin(Date.now() * 0.01) * 10;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, angle, angle + 0.3);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px "STKaiti", "KaiTi", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(skillName, x, y - 70);
        
        this.ctx.restore();
    },
    
    render(game) {
        this.clear();
        this.drawBackground();
        
        if (game.player) {
            this.drawCharacter(game.player);
        }
        if (game.enemy) {
            this.drawCharacter(game.enemy);
        }
        
        game.attackEffects.forEach(effect => {
            this.drawAttackEffect(effect);
        });
        
        game.damageNumbers.forEach(dmg => {
            this.drawDamageNumber(dmg);
        });
        
        if (game.ultimateActive && game.ultimateCharacter) {
            this.drawUltimateEffect(game.ultimateCharacter, game.ultimateSkillName);
        }
    }
};
