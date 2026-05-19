const Player = (function() {
    let canvas, ctx;
    let x, y;
    let width = 50;
    let height = 40;
    let speed = 8;
    let maxHealth = 100;
    let health = 100;
    let glowIntensity = 0;
    let trail = [];
    let maxTrailLength = 10;
    let invincible = false;
    let invincibleTimer = 0;
    let leftPressed = false;
    let rightPressed = false;
    let bounds = { minX: 0, maxX: 0 };

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        reset();
        setupControls();
    }

    function reset() {
        x = canvas.width / 2 - width / 2;
        y = canvas.height * 0.75;
        health = maxHealth;
        glowIntensity = 0;
        trail = [];
        invincible = false;
        invincibleTimer = 0;
        updateBounds();
    }

    function updateBounds() {
        const margin = 50;
        bounds.minX = margin;
        bounds.maxX = canvas.width - width - margin;
    }

    function setupControls() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        let touchStartX = 0;
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            if (diff > 20) {
                leftPressed = false;
                rightPressed = true;
            } else if (diff < -20) {
                leftPressed = true;
                rightPressed = false;
            }
            touchStartX = touchX;
        });
        
        canvas.addEventListener('touchend', () => {
            leftPressed = false;
            rightPressed = false;
        });
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = true;
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = false;
        }
    }

    function update() {
        if (leftPressed) {
            x -= speed;
        }
        if (rightPressed) {
            x += speed;
        }
        
        x = Math.max(bounds.minX, Math.min(bounds.maxX, x));
        
        trail.unshift({ x: x + width / 2, y: y + height / 2 });
        if (trail.length > maxTrailLength) {
            trail.pop();
        }
        
        if (glowIntensity > 0) {
            glowIntensity -= 0.02;
        }
        
        if (invincible) {
            invincibleTimer--;
            if (invincibleTimer <= 0) {
                invincible = false;
            }
        }
    }

    function draw() {
        drawTrail();
        drawShip();
    }

    function drawTrail() {
        for (let i = 0; i < trail.length; i++) {
            const t = trail[i];
            const alpha = (1 - i / trail.length) * 0.5;
            const size = width * (1 - i / trail.length) * 0.5;
            
            ctx.beginPath();
            ctx.arc(t.x, t.y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
            ctx.fill();
        }
    }

    function drawShip() {
        const cx = x + width / 2;
        const cy = y + height / 2;
        
        if (invincible && Math.floor(invincibleTimer / 5) % 2 === 0) {
            return;
        }
        
        ctx.save();
        ctx.translate(cx, cy);
        
        const glowRadius = 30 + glowIntensity * 20;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, `rgba(0, 255, 200, ${0.5 + glowIntensity * 0.5})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 255, ${0.3 + glowIntensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        
        ctx.beginPath();
        ctx.moveTo(0, -height / 2);
        ctx.lineTo(-width / 2, height / 2);
        ctx.lineTo(-width / 4, height / 3);
        ctx.lineTo(0, height / 2.5);
        ctx.lineTo(width / 4, height / 3);
        ctx.lineTo(width / 2, height / 2);
        ctx.closePath();
        
        const shipGradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
        shipGradient.addColorStop(0, '#00ffcc');
        shipGradient.addColorStop(0.5, '#00c8ff');
        shipGradient.addColorStop(1, '#0066ff');
        ctx.fillStyle = shipGradient;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -height / 4);
        ctx.lineTo(-width / 6, height / 4);
        ctx.lineTo(0, height / 6);
        ctx.lineTo(width / 6, height / 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-width / 8, height / 3);
        ctx.lineTo(0, height / 2 + 10 + Math.random() * 5);
        ctx.lineTo(width / 8, height / 3);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        
        ctx.restore();
    }

    function takeDamage(amount) {
        if (invincible) return false;
        
        health -= amount;
        if (health < 0) health = 0;
        
        invincible = true;
        invincibleTimer = 60;
        
        return health <= 0;
    }

    function collectOrb() {
        glowIntensity = 1;
    }

    function getBounds() {
        return {
            x: x + 5,
            y: y + 5,
            width: width - 10,
            height: height - 10
        };
    }

    function getX() { return x; }
    function getY() { return y; }
    function getWidth() { return width; }
    function getHeight() { return height; }
    function getHealth() { return health; }
    function getMaxHealth() { return maxHealth; }
    function setHealth(h) { health = h; }
    function setX(newX) { x = newX; }
    function setY(newY) { y = newY; }

    function getState() {
        return {
            x, y, health, glowIntensity, invincible, invincibleTimer
        };
    }

    function setState(state) {
        x = state.x;
        y = state.y;
        health = state.health;
        glowIntensity = state.glowIntensity;
        invincible = state.invincible;
        invincibleTimer = state.invincibleTimer;
        trail = [];
    }

    return {
        init,
        reset,
        update,
        draw,
        takeDamage,
        collectOrb,
        getBounds,
        getX,
        getY,
        getWidth,
        getHeight,
        getHealth,
        getMaxHealth,
        setHealth,
        setX,
        setY,
        getState,
        setState,
        updateBounds
    };
})();
