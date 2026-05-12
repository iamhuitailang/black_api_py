class Utils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static drawStars(ctx, canvas, stars) {
        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    static generateStars(canvas, count = 150) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                color: Math.random() > 0.85 ? 
                    ['#ffcccc', '#ccccff', '#ffffcc', '#ccffcc'][Math.floor(Math.random() * 4)] : 
                    '#ffffff'
            });
        }
        return stars;
    }

    static updateStars(stars) {
        stars.forEach(star => {
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1 || star.brightness < 0.2) {
                star.twinkleSpeed *= -1;
            }
        });
    }

    static drawStars(ctx, canvas, stars) {
        stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    static drawGlow(ctx, x, y, radius, color) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    static showScorePopup(points, x, y, canvas) {
        const popup = document.getElementById('scorePopup');
        const rect = canvas.getBoundingClientRect();
        popup.textContent = `+${points}`;
        popup.style.left = `${rect.left + x}px`;
        popup.style.top = `${rect.top + y}px`;
        popup.style.animation = 'none';
        popup.offsetHeight;
        popup.style.animation = 'popupScore 1s ease-out forwards';
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

class InputManager {
    constructor() {
        this.keys = {};
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (CONFIG.KEYS.SHOOT.includes(e.code) || 
                CONFIG.KEYS.PAUSE.includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isLeft() {
        return CONFIG.KEYS.LEFT.some(key => this.keys[key]);
    }

    isRight() {
        return CONFIG.KEYS.RIGHT.some(key => this.keys[key]);
    }

    isShoot() {
        return CONFIG.KEYS.SHOOT.some(key => this.keys[key]);
    }

    isPause() {
        return CONFIG.KEYS.PAUSE.some(key => this.keys[key]);
    }

    isRestart() {
        return CONFIG.KEYS.RESTART.some(key => this.keys[key]);
    }
}

const inputManager = new InputManager();