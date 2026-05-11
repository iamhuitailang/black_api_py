
window.EffectsManager = (function() {
    let canvas = null;
    let ctx = null;
    let sakuraPetals = [];
    let floatingTexts = [];
    let particles = [];
    let flyingItems = [];
    let animationId = null;
    let active = false;
    let plateCenter = null;
    let lastPlateUpdate = 0;

    const MAX_PETALS = 30;
    const MAX_PARTICLES = 80;
    const MAX_FLYING = 3;

    class SakuraPetal {
        constructor(canvasWidth, canvasHeight) {
            this.reset(canvasWidth, canvasHeight, true);
        }

        reset(canvasWidth, canvasHeight, randomY = false) {
            this.x = Math.random() * canvasWidth;
            this.y = randomY ? Math.random() * canvasHeight : -20;
            this.size = 10 + Math.random() * 8;
            this.speed = 0.6 + Math.random() * 0.8;
            this.swayOffset = Math.random() * 100;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = 0.005 + Math.random() * 0.01;
            this.opacity = 0.4 + Math.random() * 0.3;
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
        }

        update(time) {
            this.y += this.speed;
            this.x += Math.sin((time + this.swayOffset) * 0.002) * 0.5;
            this.rotation += this.rotationSpeed;

            if (this.y > this.canvasHeight + 20) {
                this.reset(this.canvasWidth, this.canvasHeight);
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.font = `${this.size}px serif`;
            ctx.fillText('🌸', -this.size/2, this.size/2);
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(text, x, y, color, size = 24) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.opacity = 1;
            this.fontSize = size;
            this.speed = 1.2;
            this.life = 0;
            this.maxLife = 60;
        }

        update() {
            this.y -= this.speed;
            this.life++;
            this.opacity = 1 - (this.life / this.maxLife);
            if (this.life < 10) {
                this.opacity *= this.life / 10;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.font = `bold ${this.fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.color;
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }

        isExpired() {
            return this.life >= this.maxLife;
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = 2 + Math.random() * 4;
            this.speedX = (Math.random() - 0.5) * 6;
            this.speedY = (Math.random() - 0.5) * 6 - 2;
            this.opacity = 1;
            this.gravity = 0.1;
            this.decay = 0.02;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedY += this.gravity;
            this.opacity -= this.decay;
        }

        draw(ctx) {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        isExpired() {
            return this.opacity <= 0;
        }
    }

    class FlyingItem {
        constructor(icon, startX, startY, endX, endY, callback) {
            this.icon = icon;
            this.startX = startX;
            this.startY = startY;
            this.endX = endX;
            this.endY = endY;
            this.callback = callback;
            this.progress = 0;
            this.duration = 25;
            this.size = 32;
            this.done = false;
        }

        easeOutQuad(t) {
            return t * (2 - t);
        }

        update() {
            this.progress++;
            const t = Math.min(1, this.progress / this.duration);
            const ease = this.easeOutQuad(t);
            
            this.x = this.startX + (this.endX - this.startX) * ease;
            this.y = this.startY + (this.endY - this.startY) * ease - 
                     Math.sin(t * Math.PI) * 50;

            if (t >= 1 && !this.done) {
                this.done = true;
                if (this.callback) {
                    this.callback();
                    this.callback = null;
                }
            }
        }

        draw(ctx) {
            if (this.done) return;
            ctx.globalAlpha = 0.9;
            ctx.font = `${this.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, this.x, this.y);
        }

        isExpired() {
            return this.done;
        }
    }

    function updatePlateCenter() {
        const now = Date.now();
        if (now - lastPlateUpdate < 500 && plateCenter) return plateCenter;
        
        lastPlateUpdate = now;
        const plate = document.querySelector('.plate');
        if (!plate) {
            plateCenter = { 
                x: canvas ? canvas.width / 2 : window.innerWidth / 2, 
                y: canvas ? canvas.height / 2 : window.innerHeight / 2 
            };
        } else {
            const rect = plate.getBoundingClientRect();
            plateCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }
        return plateCenter;
    }

    function addParticles(x, y, colors, count) {
        const toAdd = Math.min(count, MAX_PARTICLES - particles.length);
        for (let i = 0; i < toAdd; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(x, y, color));
        }
    }

    let startTime = performance.now();

    function animate() {
        if (!active) return;

        const time = performance.now() - startTime;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < sakuraPetals.length; i++) {
            sakuraPetals[i].update(time);
            sakuraPetals[i].draw(ctx);
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].isExpired()) {
                particles.splice(i, 1);
            } else {
                particles[i].draw(ctx);
            }
        }
        ctx.globalAlpha = 1;

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].update();
            if (floatingTexts[i].isExpired()) {
                floatingTexts.splice(i, 1);
            } else {
                floatingTexts[i].draw(ctx);
            }
        }

        for (let i = flyingItems.length - 1; i >= 0; i--) {
            flyingItems[i].update();
            if (flyingItems[i].isExpired()) {
                flyingItems.splice(i, 1);
            } else {
                flyingItems[i].draw(ctx);
            }
        }
        ctx.globalAlpha = 1;

        animationId = requestAnimationFrame(animate);
    }

    return {
        init: function(canvasElement) {
            canvas = canvasElement;
            ctx = canvas.getContext('2d');
            this.resize();
        },

        resize: function() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const petalCount = Math.min(MAX_PETALS, Math.floor((canvas.width * canvas.height) / 50000));
            while (sakuraPetals.length < petalCount) {
                sakuraPetals.push(new SakuraPetal(canvas.width, canvas.height));
            }
            while (sakuraPetals.length > petalCount) {
                sakuraPetals.pop();
            }
            plateCenter = null;
        },

        start: function() {
            if (active) return;
            active = true;
            this.resize();
            if (!animationId) {
                animate();
            }
        },

        stop: function() {
            active = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        },

        flyIngredient: function(ingredientElement, icon, callback) {
            if (flyingItems.length >= MAX_FLYING) {
                if (callback) callback();
                return;
            }

            const rect = ingredientElement.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            const end = updatePlateCenter();

            const flyingItem = new FlyingItem(icon, startX, startY, end.x, end.y, callback);
            flyingItems.push(flyingItem);
        },

        showScore: function(score, x, y) {
            const centerX = x || (canvas ? canvas.width / 2 : window.innerWidth / 2);
            const centerY = y || (canvas ? canvas.height / 2 - 50 : window.innerHeight / 2 - 50);
            floatingTexts.push(new FloatingText(`+${score}`, centerX, centerY, '#ffd700', 32));
            addParticles(centerX, centerY, ['#ffb7c5', '#ff69b4'], 8);
        },

        showCombo: function(combo, x, y) {
            const centerX = x || (canvas ? canvas.width / 2 : window.innerWidth / 2);
            const centerY = y || (canvas ? canvas.height / 3 : window.innerHeight / 3);
            
            floatingTexts.push(new FloatingText(`${combo}连击!`, centerX, centerY, '#ff4500', 40));
            addParticles(centerX, centerY, ['#ff4500', '#ffa500', '#ffd700'], 20);
        },

        showUnlock: function(text, x, y) {
            const centerX = x || (canvas ? canvas.width / 2 : window.innerWidth / 2);
            const centerY = y || (canvas ? canvas.height / 2 : window.innerHeight / 2);
            
            floatingTexts.push(new FloatingText(text, centerX, centerY, '#00ff88', 28));
            addParticles(centerX, centerY, ['#ffff00', '#fff', '#00ff88'], 15);
        },

        showError: function(x, y) {
            const centerX = x || (canvas ? canvas.width / 2 : window.innerWidth / 2);
            const centerY = y || (canvas ? canvas.height / 2 : window.innerHeight / 2);
            
            floatingTexts.push(new FloatingText('❌ 错误!', centerX, centerY, '#ff4757', 32));
            addParticles(centerX, centerY, ['#ff4757', '#ff6b7a'], 10);
        },

        shake: function() {
            const makingArea = document.getElementById('making-area');
            if (makingArea) {
                makingArea.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    makingArea.style.animation = '';
                }, 500);
            }
        },

        headShake: function() {
            const customerAvatar = document.querySelector('.customer-avatar');
            if (customerAvatar) {
                customerAvatar.style.animation = 'headShake 0.6s ease-in-out';
                setTimeout(() => {
                    customerAvatar.style.animation = 'bounce 2s ease-in-out infinite';
                }, 600);
            }
        },

        successBurst: function() {
            const center = updatePlateCenter();
            addParticles(center.x, center.y, ['#ff69b4', '#ff1493', '#ffd700', '#fff'], 25);
        }
    };
})();
