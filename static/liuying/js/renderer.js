const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let particles = [];
    let bubbles = [];
    let currentTheme = 'laundry';

    function init() {
        canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    function resizeCanvas() {
        if (!canvas) return;
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    function setTheme(theme) {
        currentTheme = theme;
        particles = [];
        bubbles = [];
        
        if (theme === 'laundry') {
            createBubbles();
        } else if (theme === 'sakura') {
            createPetals();
        } else if (theme === 'industrial') {
            createGears();
        } else if (theme === 'christmas') {
            createSnowflakes();
        }
    }

    function createBubbles() {
        for (let i = 0; i < 20; i++) {
            bubbles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 200,
                radius: Math.random() * 20 + 5,
                speed: Math.random() * 2 + 1,
                wobble: Math.random() * 2,
                wobbleSpeed: Math.random() * 0.05 + 0.02
            });
        }
    }

    function createPetals() {
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height,
                size: Math.random() * 15 + 8,
                speedY: Math.random() * 2 + 1,
                speedX: Math.random() * 1 - 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: Math.random() * 0.05 - 0.025
            });
        }
    }

    function createGears() {
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 40 + 20,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                teeth: Math.floor(Math.random() * 4) + 6
            });
        }
    }

    function createSnowflakes() {
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height,
                size: Math.random() * 8 + 3,
                speedY: Math.random() * 1.5 + 0.5,
                speedX: Math.random() * 0.5 - 0.25,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }

    function start() {
        if (animationId) cancelAnimationFrame(animationId);
        animate();
    }

    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function animate() {
        if (!ctx || !canvas) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        
        if (currentTheme === 'laundry') {
            drawBubbles();
        } else if (currentTheme === 'sakura') {
            drawPetals();
        } else if (currentTheme === 'industrial') {
            drawGears();
        } else if (currentTheme === 'christmas') {
            drawSnowflakes();
        }
        
        animationId = requestAnimationFrame(animate);
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        if (currentTheme === 'laundry') {
            gradient.addColorStop(0, 'rgba(179, 229, 252, 0.3)');
            gradient.addColorStop(1, 'rgba(225, 245, 254, 0.1)');
        } else if (currentTheme === 'sakura') {
            gradient.addColorStop(0, 'rgba(252, 228, 236, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 248, 250, 0.1)');
        } else if (currentTheme === 'industrial') {
            gradient.addColorStop(0, 'rgba(55, 71, 79, 0.3)');
            gradient.addColorStop(1, 'rgba(69, 90, 100, 0.1)');
        } else if (currentTheme === 'christmas') {
            gradient.addColorStop(0, 'rgba(255, 205, 210, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 235, 238, 0.1)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawBubbles() {
        bubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            
            const gradient = ctx.createRadialGradient(
                bubble.x - bubble.radius * 0.3,
                bubble.y - bubble.radius * 0.3,
                0,
                bubble.x,
                bubble.y,
                bubble.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(179, 229, 252, 0.4)');
            gradient.addColorStop(1, 'rgba(79, 195, 247, 0.2)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            bubble.y -= bubble.speed;
            bubble.x += Math.sin(bubble.wobble) * 0.5;
            bubble.wobble += bubble.wobbleSpeed;
            
            if (bubble.y < -bubble.radius) {
                bubble.y = canvas.height + bubble.radius;
                bubble.x = Math.random() * canvas.width;
            }
        });
    }

    function drawPetals() {
        particles.forEach(petal => {
            ctx.save();
            ctx.translate(petal.x, petal.y);
            ctx.rotate(petal.rotation);
            
            ctx.beginPath();
            ctx.moveTo(0, -petal.size / 2);
            ctx.bezierCurveTo(
                petal.size / 2, -petal.size / 2,
                petal.size / 2, petal.size / 2,
                0, petal.size / 2
            );
            ctx.bezierCurveTo(
                -petal.size / 2, petal.size / 2,
                -petal.size / 2, -petal.size / 2,
                0, -petal.size / 2
            );
            
            ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
            ctx.fill();
            
            ctx.restore();
            
            petal.y += petal.speedY;
            petal.x += petal.speedX;
            petal.rotation += petal.rotationSpeed;
            
            if (petal.y > canvas.height + petal.size) {
                petal.y = -petal.size;
                petal.x = Math.random() * canvas.width;
            }
        });
    }

    function drawGears() {
        particles.forEach(gear => {
            ctx.save();
            ctx.translate(gear.x, gear.y);
            ctx.rotate(gear.rotation);
            
            const innerRadius = gear.size * 0.6;
            const outerRadius = gear.size;
            const toothDepth = gear.size * 0.2;
            
            ctx.beginPath();
            
            for (let i = 0; i < gear.teeth; i++) {
                const angle = (i / gear.teeth) * Math.PI * 2;
                const nextAngle = ((i + 0.5) / gear.teeth) * Math.PI * 2;
                
                const x1 = Math.cos(angle) * innerRadius;
                const y1 = Math.sin(angle) * innerRadius;
                
                const x2 = Math.cos(angle + 0.05) * outerRadius;
                const y2 = Math.sin(angle + 0.05) * outerRadius;
                
                const x3 = Math.cos(nextAngle - 0.05) * outerRadius;
                const y3 = Math.sin(nextAngle - 0.05) * outerRadius;
                
                const x4 = Math.cos(nextAngle) * innerRadius;
                const y4 = Math.sin(nextAngle) * innerRadius;
                
                if (i === 0) {
                    ctx.moveTo(x1, y1);
                }
                
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineTo(x4, y4);
            }
            
            ctx.closePath();
            
            ctx.fillStyle = 'rgba(144, 164, 174, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 152, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, 0, gear.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
            ctx.fill();
            
            ctx.restore();
            
            gear.rotation += gear.rotationSpeed;
        });
    }

    function drawSnowflakes() {
        particles.forEach(snowflake => {
            ctx.beginPath();
            ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
            ctx.fill();
            
            snowflake.y += snowflake.speedY;
            snowflake.x += snowflake.speedX;
            
            if (snowflake.y > canvas.height + snowflake.size) {
                snowflake.y = -snowflake.size;
                snowflake.x = Math.random() * canvas.width;
            }
        });
    }

    function drawCorrectEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                life: 1,
                decay: 0.02,
                color: 'rgba(102, 187, 106, '
            });
        }
    }

    function drawWrongEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                life: 1,
                decay: 0.02,
                color: 'rgba(239, 83, 80, '
            });
        }
    }

    return {
        init,
        start,
        stop,
        setTheme,
        drawCorrectEffect,
        drawWrongEffect
    };
})();
