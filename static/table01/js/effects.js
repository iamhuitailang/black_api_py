var Effects = (function() {
    'use strict';

    var particles = [];
    var fireworks = [];
    var cues = [];

    function createSparkParticles(x, y, count, color) {
        count = count || 10;
        color = color || '#ffd700';

        for (var i = 0; i < count; i++) {
            var angle = (Math.PI * 2 * i) / count + Utils.randomFloat(-0.2, 0.2);
            var speed = Utils.randomFloat(2, 5);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Utils.randomFloat(0.02, 0.04),
                size: Utils.randomFloat(2, 4),
                color: color,
                type: 'spark'
            });
        }
    }

    function createPocketSplash(x, y) {
        var colors = ['#00b894', '#55efc4', '#00cec9', '#81ecec'];
        for (var i = 0; i < 20; i++) {
            var angle = Utils.randomFloat(0, Math.PI * 2);
            var speed = Utils.randomFloat(1, 4);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1,
                decay: Utils.randomFloat(0.02, 0.03),
                size: Utils.randomFloat(3, 6),
                color: Utils.randomChoice(colors),
                type: 'splash'
            });
        }
    }

    function createCueStreak(cueBallX, cueBallY, angle) {
        cues.push({
            x: cueBallX,
            y: cueBallY,
            angle: angle,
            life: 1,
            decay: 0.1,
            length: 100
        });
    }

    function createFirework(x, y) {
        var colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
        var color = Utils.randomChoice(colors);
        fireworks.push({
            x: x,
            y: y,
            particles: [],
            exploded: false,
            explodeTime: 30,
            timer: 0,
            color: color
        });
    }

    function createMultipleFireworks(count) {
        count = count || 5;
        for (var i = 0; i < count; i++) {
            setTimeout(function() {
                var x = Utils.randomFloat(100, 700);
                var y = Utils.randomFloat(100, 400);
                createFirework(x, y);
            }, i * 300);
        }
    }

    function update() {
        updateParticles();
        updateFireworks();
        updateCues();
    }

    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function updateFireworks() {
        for (var i = fireworks.length - 1; i >= 0; i--) {
            var fw = fireworks[i];

            if (!fw.exploded) {
                fw.timer++;
                if (fw.timer >= fw.explodeTime) {
                    explodeFirework(fw);
                    fw.exploded = true;
                }
            } else {
                for (var j = fw.particles.length - 1; j >= 0; j--) {
                    var p = fw.particles[j];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.02;
                    p.life -= p.decay;

                    if (p.life <= 0) {
                        fw.particles.splice(j, 1);
                    }
                }

                if (fw.particles.length === 0) {
                    fireworks.splice(i, 1);
                }
            }
        }
    }

    function explodeFirework(fw) {
        var particleCount = 40;
        for (var i = 0; i < particleCount; i++) {
            var angle = (Math.PI * 2 * i) / particleCount;
            var speed = Utils.randomFloat(2, 5);
            fw.particles.push({
                x: fw.x,
                y: fw.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Utils.randomFloat(0.01, 0.02),
                color: fw.color
            });
        }
    }

    function updateCues() {
        for (var i = cues.length - 1; i >= 0; i--) {
            var c = cues[i];
            c.life -= c.decay;

            if (c.life <= 0) {
                cues.splice(i, 1);
            }
        }
    }

    function render(ctx) {
        renderParticles(ctx);
        renderFireworks(ctx);
        renderCues(ctx);
    }

    function renderParticles(ctx) {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function renderFireworks(ctx) {
        for (var i = 0; i < fireworks.length; i++) {
            var fw = fireworks[i];

            if (!fw.exploded) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = fw.color;
                ctx.fill();
                ctx.restore();
            } else {
                for (var j = 0; j < fw.particles.length; j++) {
                    var p = fw.particles[j];
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }

    function renderCues(ctx) {
        for (var i = 0; i < cues.length; i++) {
            var c = cues[i];
            ctx.save();
            ctx.globalAlpha = c.life * 0.6;
            ctx.translate(c.x, c.y);
            ctx.rotate(c.angle);

            var gradient = ctx.createLinearGradient(-c.length, 0, 0, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, ' + c.life * 0.8 + ')');

            ctx.beginPath();
            ctx.moveTo(-c.length, 0);
            ctx.lineTo(0, 0);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.restore();
        }
    }

    function clear() {
        particles = [];
        fireworks = [];
        cues = [];
    }

    return {
        createSparkParticles: createSparkParticles,
        createPocketSplash: createPocketSplash,
        createCueStreak: createCueStreak,
        createFirework: createFirework,
        createMultipleFireworks: createMultipleFireworks,
        update: update,
        render: render,
        clear: clear
    };
})();
