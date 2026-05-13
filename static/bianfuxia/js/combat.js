const CombatManager = {
    combo: 0,
    comboTimer: null,
    hitEffects: [],
    
    hitEnemy(enemy, damage, player) {
        enemy.takeDamage(damage);
        this.addCombo();
        
        this.hitEffects.push({
            x: enemy.x,
            y: enemy.y - 20,
            text: 'HIT!',
            life: 30,
            color: '#f0e68c'
        });
        
        const levelConfig = CONFIG.LEVELS[Game.currentLevel];
        if (levelConfig && levelConfig.hasFinisher && this.combo >= 5 && enemy.health > 0) {
            enemy.health = 0;
            Game.onEnemyDefeated(enemy);
            this.hitEffects.push({
                x: enemy.x,
                y: enemy.y - 40,
                text: 'FINISHER!',
                life: 60,
                color: '#ff4444'
            });
        }
    },
    
    addCombo() {
        this.combo++;
        UI.updateCombo(this.combo);
        
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        
        this.comboTimer = setTimeout(() => {
            this.resetCombo();
        }, CONFIG.COMBO_TIMEOUT);
    },
    
    resetCombo() {
        this.combo = 0;
        UI.updateCombo(0);
    },
    
    getComboScore() {
        return this.combo * 10;
    },
    
    update() {
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.life--;
            effect.y -= 1;
            return effect.life > 0;
        });
    },
    
    draw(ctx) {
        for (const effect of this.hitEffects) {
            ctx.save();
            ctx.globalAlpha = effect.life / 60;
            ctx.fillStyle = effect.color;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(effect.text, effect.x, effect.y);
            ctx.restore();
        }
    }
};