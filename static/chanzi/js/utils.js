const Utils = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    circleCollision(circle1, circle2) {
        const dist = this.distance(circle1.x, circle1.y, circle2.x, circle2.y);
        return dist < circle1.radius + circle2.radius;
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInQuad(t) {
        return t * t;
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
};

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || Utils.randomRange(-3, 3);
        this.vy = options.vy || Utils.randomRange(-5, -1);
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.size = options.size || Utils.randomRange(2, 6);
        this.color = options.color || '#ffffff';
        this.gravity = options.gravity || 0.15;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= 0.02;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, options));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

class Camera {
    constructor(width, height, levelWidth, levelHeight) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;
        this.target = null;
        this.smoothing = 0.1;
    }

    follow(target) {
        this.target = target;
    }

    update() {
        if (this.target) {
            const targetX = this.target.x + this.target.width / 2 - this.width / 2;
            const targetY = this.target.y + this.target.height / 2 - this.height / 2;
            
            this.x = Utils.lerp(this.x, targetX, this.smoothing);
            this.y = Utils.lerp(this.y, targetY, this.smoothing);
            
            this.x = Utils.clamp(this.x, 0, this.levelWidth - this.width);
            this.y = Utils.clamp(this.y, 0, this.levelHeight - this.height);
        }
    }

    apply(ctx) {
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }
}