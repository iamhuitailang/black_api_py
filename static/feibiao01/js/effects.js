const EffectsManager = {
    createShake(state, intensity, duration) {
        state.effects.shake = {
            intensity: intensity,
            startTime: Date.now(),
            duration: duration
        };
    },
    
    getShakeOffset(state) {
        const shake = state.effects.shake;
        const elapsed = Date.now() - shake.startTime;
        
        if (elapsed >= shake.duration) {
            return { x: 0, y: 0 };
        }
        
        const progress = 1 - (elapsed / shake.duration);
        const currentIntensity = shake.intensity * progress;
        
        return {
            x: (Math.random() - 0.5) * currentIntensity * 2,
            y: (Math.random() - 0.5) * currentIntensity * 2
        };
    },
    
    createFloatingText(state, x, y, text, color, duration = 1500) {
        state.effects.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            startTime: Date.now(),
            duration: duration,
            opacity: 1
        });
    },
    
    createGlowEffect(state, x, y, color, radius = 50, duration = 800) {
        state.effects.glowEffects.push({
            x: x,
            y: y,
            color: color,
            radius: radius,
            startTime: Date.now(),
            duration: duration,
            opacity: 1
        });
    },
    
    createFireworks(state, count = 50) {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        for (let i = 0; i < count; i++) {
            state.effects.fireworks.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.5,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 10 - 5,
                color: this.getRandomColor(),
                life: 1,
                decay: 0.01 + Math.random() * 0.02
            });
        }
    },
    
    createConfetti(state, count = 100) {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        for (let i = 0; i < count; i++) {
            state.effects.confetti.push({
                x: Math.random() * canvas.width,
                y: -20,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * 5 + 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                color: this.getRandomColor(),
                size: Math.random() * 10 + 5,
                life: 1
            });
        }
    },
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#a8e6cf', '#ff8b94', '#ffaaa5', '#ffd3b6', '#667eea', '#764ba2'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    updateEffects(state) {
        const now = Date.now();
        
        state.effects.floatingTexts = state.effects.floatingTexts.filter(text => {
            const elapsed = now - text.startTime;
            if (elapsed < text.duration) {
                text.y -= 0.5;
                text.opacity = 1 - (elapsed / text.duration);
                return true;
            }
            return false;
        });
        
        state.effects.glowEffects = state.effects.glowEffects.filter(glow => {
            const elapsed = now - glow.startTime;
            if (elapsed < glow.duration) {
                glow.opacity = 1 - (elapsed / glow.duration);
                glow.radius += 0.5;
                return true;
            }
            return false;
        });
        
        state.effects.fireworks = state.effects.fireworks.filter(firework => {
            firework.x += firework.vx;
            firework.y += firework.vy;
            firework.vy += 0.1;
            firework.life -= firework.decay;
            return firework.life > 0;
        });
        
        state.effects.confetti = state.effects.confetti.filter(confetti => {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) return false;
            
            confetti.x += confetti.vx;
            confetti.y += confetti.vy;
            confetti.vy += 0.05;
            confetti.rotation += confetti.rotationSpeed;
            
            return confetti.y < canvas.height + 50;
        });
    },
    
    createHitEffect(state, hitResult, x, y) {
        const effect = Physics.getHitEffect(hitResult.score, hitResult.ring?.isBullseye);
        
        if (effect.shakeIntensity > 0) {
            this.createShake(state, effect.shakeIntensity, effect.shakeDuration);
        }
        
        if (effect.text) {
            this.createFloatingText(state, x, y, effect.text, effect.color);
        }
        
        this.createGlowEffect(state, x, y, effect.glowColor);
        
        if (hitResult.score > 0) {
            this.createFloatingText(state, x, y + 30, `+${hitResult.score}`, effect.color);
        }
    },
    
    createNewRecordEffect(state) {
        this.createFireworks(state, GameConfig.Effects.NEW_RECORD.fireworkCount);
        this.createConfetti(state, GameConfig.Effects.NEW_RECORD.confettiCount);
        
        setTimeout(() => {
            this.createFireworks(state, 30);
            this.createConfetti(state, 50);
        }, 500);
        
        setTimeout(() => {
            this.createFireworks(state, 40);
            this.createConfetti(state, 70);
        }, 1000);
    }
};

if (typeof window !== 'undefined') {
    window.EffectsManager = EffectsManager;
}
