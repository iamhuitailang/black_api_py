const Tunnel = (function() {
    let canvas, ctx;
    let width, height;
    let tunnelLines = [];
    let particles = [];
    let scrollOffset = 0;
    let speed = 5;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        createTunnelLines();
        createParticles();
        window.addEventListener('resize', resize);
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        createTunnelLines();
        createParticles();
    }

    function createTunnelLines() {
        tunnelLines = [];
        const lineCount = 12;
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2;
            tunnelLines.push({
                angle: angle,
                distance: 0
            });
        }
    }

    function createParticles() {
        particles = [];
        const particleCount = 80;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    function setSpeed(newSpeed) {
        speed = newSpeed;
    }

    function update() {
        scrollOffset += speed;
        
        particles.forEach(p => {
            p.y += p.speed + speed * 0.3;
            if (p.y > height) {
                p.y = 0;
                p.x = Math.random() * width;
            }
        });
    }

    function draw() {
        drawBackground();
        drawParticles();
        drawTunnel();
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.5, '#05051a');
        gradient.addColorStop(1, '#0a0a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const gridSize = 40;
        ctx.strokeStyle = 'rgba(0, 100, 200, 0.1)';
        ctx.lineWidth = 1;
        
        const offsetY = scrollOffset % gridSize;
        for (let y = -gridSize + offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 200, 255, ${p.opacity})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 200, 255, ${p.opacity * 0.3})`;
            ctx.fill();
        });
    }

    function drawTunnel() {
        const centerX = width / 2;
        const centerY = height * 0.3;
        const maxRadius = Math.max(width, height) * 0.8;
        const ringCount = 15;
        
        for (let i = ringCount; i >= 0; i--) {
            const progress = i / ringCount;
            const offset = (scrollOffset * 0.02 + i * 0.1) % 1;
            const radius = maxRadius * offset * offset;
            const alpha = (1 - offset) * 0.8;
            
            if (radius < 10) continue;
            
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + radius * 0.5, radius, radius * 0.6, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 50, 200, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + radius * 0.5, radius, radius * 0.6, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        tunnelLines.forEach(line => {
            const x1 = centerX + Math.cos(line.angle) * 30;
            const y1 = centerY + Math.sin(line.angle) * 20;
            const x2 = centerX + Math.cos(line.angle) * maxRadius;
            const y2 = centerY + maxRadius * 0.6 + Math.sin(line.angle) * maxRadius * 0.5;
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, 'rgba(0, 200, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(100, 50, 200, 0)');
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    function getWidth() { return width; }
    function getHeight() { return height; }
    function getCenterX() { return width / 2; }
    function getCenterY() { return height / 2; }

    return {
        init,
        resize,
        update,
        draw,
        setSpeed,
        getWidth,
        getHeight,
        getCenterX,
        getCenterY
    };
})();
