const Animation = {
    animations: [],
    particles: [],
    isRunning: false,
    animationFrameId: null,
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    },

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    },

    update() {
        const now = Date.now();
        
        this.animations = this.animations.filter(anim => {
            if (now >= anim.endTime) {
                if (anim.onComplete) {
                    anim.onComplete();
                }
                return false;
            }
            return true;
        });
        
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.opacity -= 0.01;
            return p.opacity > 0;
        });
    },

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    },

    easeInQuart(t) {
        return t * t * t * t;
    },

    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    },

    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },

    createShakeAnimation(duration = 1500) {
        return {
            type: 'shake',
            startTime: Date.now(),
            endTime: Date.now() + duration,
            duration: duration,
            onComplete: null
        };
    },

    createStickFlyAnimation(startX, startY, endX, endY, duration = 800) {
        return {
            type: 'stickFly',
            startX,
            startY,
            endX,
            endY,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            duration: duration,
            onComplete: null
        };
    },

    createPaperUnfoldAnimation(duration = 1200) {
        return {
            type: 'paperUnfold',
            startTime: Date.now(),
            endTime: Date.now() + duration,
            duration: duration,
            onComplete: null
        };
    },

    getShakeState(anim) {
        const now = Date.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        
        const intensity = this.easeOutQuart(1 - progress);
        const maxRotation = 0.3 * intensity;
        const maxOffset = 15 * intensity;
        
        const rotation = (Math.random() - 0.5) * maxRotation * 2;
        const offsetX = (Math.random() - 0.5) * maxOffset * 2;
        const offsetY = (Math.random() - 0.5) * maxOffset * 2;
        
        return {
            rotation: rotation,
            offset: { x: offsetX, y: offsetY },
            progress: progress,
            intensity: intensity
        };
    },

    getStickFlyState(anim) {
        const now = Date.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        
        const easeProgress = this.easeOutElastic(progress);
        
        const x = anim.startX + (anim.endX - anim.startX) * easeProgress;
        const y = anim.startY + (anim.endY - anim.startY) * easeProgress;
        
        const rotation = Math.sin(progress * Math.PI * 4) * 0.5;
        
        const scale = 0.5 + easeProgress * 0.8;
        
        const opacity = progress < 0.1 ? progress * 10 : 1;
        
        return {
            x: x,
            y: y,
            rotation: rotation,
            scale: scale,
            opacity: opacity,
            progress: progress
        };
    },

    getPaperUnfoldState(anim) {
        const now = Date.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        
        const easeProgress = this.easeOutQuart(progress);
        
        const scale = 0.3 + easeProgress * 0.7;
        
        const unfoldProgress = this.easeInOutQuart(progress);
        
        return {
            scale: scale,
            unfoldProgress: unfoldProgress,
            opacity: progress < 0.3 ? progress / 0.3 : 1,
            progress: progress
        };
    },

    createParticles(x, y, count = 30, colors = ['#FFD700', '#DC143C', '#FFA500']) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: 2 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 0.8 + Math.random() * 0.2
            });
        }
    },

    createSparkleEffect(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 1 + Math.random() * 3,
                color: '#FFFFFF',
                opacity: 0.9
            });
        }
    },

    addAnimation(anim) {
        this.animations.push(anim);
    },

    clearAnimations() {
        this.animations = [];
    },

    getActiveAnimations() {
        return this.animations;
    },

    getParticles() {
        return this.particles;
    },

    isAnimating() {
        return this.animations.length > 0;
    },

    getAnimationByType(type) {
        return this.animations.find(anim => anim.type === type);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Animation;
}
