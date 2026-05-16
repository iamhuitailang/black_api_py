class SkillSystem {
    constructor() {
        this.keySequence = [];
        this.lastKeyTime = 0;
        this.sequenceTimeout = 800;
        this.effects = [];
    }
    
    handleKey(key, player) {
        const now = Date.now();
        
        if (now - this.lastKeyTime > this.sequenceTimeout) {
            this.keySequence = [];
        }
        
        this.keySequence.push(key);
        this.lastKeyTime = now;
        
        if (this.keySequence.length > 5) {
            this.keySequence.shift();
        }
        
        return this.checkCombo(player);
    }
    
    checkCombo(player) {
        const seq = this.keySequence;
        const len = seq.length;
        
        if (len >= 2) {
            const lastTwo = seq.slice(-2).join(',');
            if ((lastTwo === 'ArrowLeft,ArrowLeft' || lastTwo === 'KeyA,KeyA') ||
                (lastTwo === 'ArrowRight,ArrowRight' || lastTwo === 'KeyD,KeyD')) {
                if (player.dash()) {
                    this.keySequence = [];
                    this.addEffect(player.x + player.width / 2, player.y + player.height / 2, 'dash');
                    return { skill: 'dash', message: '⚡ 冲刺！' };
                }
            }
        }
        
        if (len >= 4) {
            const lastFour = seq.slice(-4);
            const cartPattern1 = ['ArrowDown', 'ArrowRight', 'ArrowDown', ' '];
            const cartPattern2 = ['KeyS', 'KeyD', 'KeyS', ' '];
            
            if (this.matchPattern(lastFour, cartPattern1) || this.matchPattern(lastFour, cartPattern2)) {
                if (player.activateCart()) {
                    this.keySequence = [];
                    this.addEffect(player.x + player.width / 2, player.y + player.height / 2, 'cart');
                    return { skill: 'cart', message: '🛒 购物车模式！大范围拾取' };
                }
            }
        }
        
        if (len >= 4) {
            const lastFour = seq.slice(-4);
            const shieldPattern1 = ['ArrowUp', 'ArrowDown', 'ArrowUp', ' '];
            const shieldPattern2 = ['KeyW', 'KeyS', 'KeyW', ' '];
            
            if (this.matchPattern(lastFour, shieldPattern1) || this.matchPattern(lastFour, shieldPattern2)) {
                if (player.activateShield()) {
                    this.keySequence = [];
                    this.addEffect(player.x + player.width / 2, player.y + player.height / 2, 'shield');
                    return { skill: 'shield', message: '🛡️ 护盾激活！免疫抓捕' };
                }
            }
        }
        
        return null;
    }
    
    matchPattern(sequence, pattern) {
        if (sequence.length !== pattern.length) return false;
        for (let i = 0; i < sequence.length; i++) {
            if (sequence[i] !== pattern[i]) return false;
        }
        return true;
    }
    
    addEffect(x, y, type) {
        this.effects.push({
            x, y, type,
            startTime: Date.now(),
            duration: 500,
            radius: 0
        });
    }
    
    update(deltaTime) {
        const now = Date.now();
        this.effects = this.effects.filter(effect => {
            const elapsed = now - effect.startTime;
            effect.radius = (elapsed / effect.duration) * 100;
            return elapsed < effect.duration;
        });
    }
    
    reset() {
        this.keySequence = [];
        this.effects = [];
    }
}