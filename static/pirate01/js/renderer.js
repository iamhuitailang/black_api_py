const Renderer = (function() {
    let canvas, ctx;
    let animationId = null;
    let currentTheme = 'pirate';
    let particles = [];
    let width, height;

    const themeConfigs = {
        pirate: {
            bgColors: ['#1a0f0a', '#2d1810', '#3d1f12'],
            particleColors: ['#c9a86c', '#8b6914', '#e8d4a0', '#ffd700'],
            particleCount: 50,
            particleTypes: ['coin', 'skull', 'star']
        },
        deepsea: {
            bgColors: ['#0a1628', '#1a2a4a', '#0d1f3c'],
            particleColors: ['#4ecdc4', '#a8e6cf', '#88d8b0', '#7fdbda'],
            particleCount: 80,
            particleTypes: ['bubble', 'fish', 'star']
        },
        steampunk: {
            bgColors: ['#1c140d', '#2d2015', '#3a2918'],
            particleColors: ['#cd7f32', '#daa520', '#8b5a2b', '#b8860b'],
            particleCount: 40,
            particleTypes: ['gear', 'star', 'spark']
        }
    };

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        
        currentTheme = Storage.getTheme();
        initParticles();
        start();
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function setTheme(theme) {
        if (themeConfigs[theme]) {
            currentTheme = theme;
            initParticles();
            Storage.setTheme(theme);
        }
    }

    function getConfig() {
        return themeConfigs[currentTheme] || themeConfigs.pirate;
    }

    function initParticles() {
        const config = getConfig();
        particles = [];
        
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(createParticle());
        }
    }

    function createParticle() {
        const config = getConfig();
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            color: config.particleColors[Math.floor(Math.random() * config.particleColors.length)],
            type: config.particleTypes[Math.floor(Math.random() * config.particleTypes.length)],
            opacity: Math.random() * 0.5 + 0.3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };
    }

    function drawBackground() {
        const config = getConfig();
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 1.5
        );
        
        gradient.addColorStop(0, config.bgColors[0]);
        gradient.addColorStop(0.5, config.bgColors[1]);
        gradient.addColorStop(1, config.bgColors[2]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawParticle(particle) {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        switch (particle.type) {
            case 'coin':
                drawCoin(particle.size);
                break;
            case 'skull':
                drawSkull(particle.size);
                break;
            case 'star':
                drawStar(particle.size);
                break;
            case 'bubble':
                drawBubble(particle.size);
                break;
            case 'fish':
                drawFish(particle.size);
                break;
            case 'gear':
                drawGear(particle.size);
                break;
            case 'spark':
                drawSpark(particle.size);
                break;
            default:
                drawStar(particle.size);
        }

        ctx.restore();
    }

    function drawCoin(size) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawSkull(size) {
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.2, size * 0.2, 0, Math.PI * 2);
        ctx.arc(size * 0.3, -size * 0.2, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = getConfig().bgColors[0];
        ctx.fill();
    }

    function drawStar(size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawBubble(size) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.3, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    function drawFish(size) {
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.quadraticCurveTo(0, -size, -size * 0.5, 0);
        ctx.quadraticCurveTo(0, size, size, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, 0);
        ctx.lineTo(-size * 1.2, -size * 0.5);
        ctx.lineTo(-size * 1.2, size * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    function drawGear(size) {
        const teeth = 8;
        const innerRadius = size * 0.6;
        const outerRadius = size;
        
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const angle1 = (i * 2 * Math.PI) / teeth;
            const angle2 = angle1 + Math.PI / teeth;
            
            const x1 = Math.cos(angle1) * outerRadius;
            const y1 = Math.sin(angle1) * outerRadius;
            const x2 = Math.cos(angle2) * innerRadius;
            const y2 = Math.sin(angle2) * innerRadius;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = getConfig().bgColors[0];
        ctx.fill();
    }

    function drawSpark(size) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
    }

    function updateParticles() {
        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;

            if (particle.x < -50) particle.x = width + 50;
            if (particle.x > width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = height + 50;
            if (particle.y > height + 50) particle.y = -50;
        });
    }

    function drawDecorations() {
        if (currentTheme === 'pirate') {
            drawPirateDecorations();
        } else if (currentTheme === 'deepsea') {
            drawDeepSeaDecorations();
        } else if (currentTheme === 'steampunk') {
            drawSteampunkDecorations();
        }
    }

    function drawPirateDecorations() {
        const time = Date.now() / 1000;
        ctx.save();
        ctx.globalAlpha = 0.15;
        
        const flagX = 50 + Math.sin(time * 0.5) * 10;
        const flagY = 60;
        
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(flagX, flagY - 100);
        ctx.lineTo(flagX, flagY + 50);
        ctx.stroke();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(flagX, flagY - 100);
        const wave = Math.sin(time * 3) * 5;
        ctx.quadraticCurveTo(flagX + 40, flagY - 80 + wave, flagX + 80, flagY - 100);
        ctx.lineTo(flagX + 80, flagY - 60);
        ctx.quadraticCurveTo(flagX + 40, flagY - 40 + wave, flagX, flagY - 60);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function drawDeepSeaDecorations() {
        const time = Date.now() / 1000;
        ctx.save();
        ctx.globalAlpha = 0.1;
        
        for (let i = 0; i < 5; i++) {
            const x = (width / 5) * i + width / 10;
            const sway = Math.sin(time * 0.8 + i) * 20;
            
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, height);
            ctx.quadraticCurveTo(x + sway, height - 100, x + sway * 0.5, height - 200);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    function drawSteampunkDecorations() {
        const time = Date.now() / 1000;
        ctx.save();
        ctx.globalAlpha = 0.08;
        
        const gearSize = 80;
        const gearX = width - 100;
        const gearY = height - 100;
        
        ctx.translate(gearX, gearY);
        ctx.rotate(time * 0.5);
        
        const teeth = 12;
        const innerRadius = gearSize * 0.6;
        const outerRadius = gearSize;
        
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const angle1 = (i * 2 * Math.PI) / teeth;
            const angle2 = angle1 + Math.PI / teeth;
            
            const x1 = Math.cos(angle1) * outerRadius;
            const y1 = Math.sin(angle1) * outerRadius;
            const x2 = Math.cos(angle2) * innerRadius;
            const y2 = Math.sin(angle2) * innerRadius;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fillStyle = '#cd7f32';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, gearSize * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#1c140d';
        ctx.fill();
        
        ctx.restore();
    }

    function render() {
        drawBackground();
        drawDecorations();
        
        particles.forEach(drawParticle);
        updateParticles();
    }

    function start() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        function animate() {
            render();
            animationId = requestAnimationFrame(animate);
        }
        animate();
    }

    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function getTheme() {
        return currentTheme;
    }

    return {
        init,
        setTheme,
        getTheme,
        start,
        stop,
        resize
    };
})();
