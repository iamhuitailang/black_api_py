const Particles = (function() {
    let canvas, ctx;
    let particles = [];
    let speedLines = [];
    let speed = 5;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
    }

    function reset() {
        particles = [];
        speedLines = [];
    }

    function setSpeed(newSpeed) {
        speed = newSpeed;
    }

    function createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const velocity = 2 + Math.random() * 4;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 3 + Math.random() * 4,
                color,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }

    function createCollectEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 1 + Math.random() * 3;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 2 + Math.random() * 3,
                color: '#00ffee',
                life: 1,
                decay: 0.03
            });
        }
    }

    function update() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            p.size *= 0.98;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        
        updateSpeedLines();
    }

    function updateSpeedLines() {
        if (speed > 15) {
            if (Math.random() < 0.3) {
                const side = Math.random() < 0.5 ? 'left' : 'right';
                speedLines.push({
                    x: side === 'left' ? 0 : canvas.width,
                    y: Math.random() * canvas.height,
                    length: 50 + Math.random() * 100,
                    speed: speed * 0.5,
                    life: 1,
                    side
                });
            }
        }
        
        for (let i = speedLines.length - 1; i >= 0; i--) {
            const line = speedLines[i];
            if (line.side === 'left') {
                line.x += line.speed;
            } else {
                line.x -= line.speed;
            }
            line.life -= 0.05;
            
            if (line.life <= 0 || line.x < -line.length || line.x > canvas.width + line.length) {
                speedLines.splice(i, 1);
            }
        }
    }

    function draw() {
        drawSpeedLines();
        drawParticles();
    }

    function drawSpeedLines() {
        speedLines.forEach(line => {
            const gradient = ctx.createLinearGradient(
                line.side === 'left' ? line.x : line.x + line.length,
                line.y,
                line.side === 'left' ? line.x + line.length : line.x,
                line.y
            );
            gradient.addColorStop(0, `rgba(0, 200, 255, ${line.life * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
            
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            if (line.side === 'left') {
                ctx.lineTo(line.x + line.length, line.y);
            } else {
                ctx.lineTo(line.x - line.length, line.y);
            }
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = p.color + '40';
            ctx.fill();
            
            ctx.restore();
        });
    }

    return {
        init,
        reset,
        update,
        draw,
        setSpeed,
        createExplosion,
        createCollectEffect
    };
})();
