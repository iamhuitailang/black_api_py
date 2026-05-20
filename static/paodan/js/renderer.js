const Renderer = {
    ctx: null,
    canvas: null,
    clouds: [],
    particles: [],
    time: 0,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.initClouds();
    },

    initClouds() {
        this.clouds = GameConfig.CLOUDS.map(cloud => ({ ...cloud }));
    },

    update(deltaTime) {
        this.time += deltaTime;

        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > GameConfig.CANVAS_WIDTH + cloud.size * 2) {
                cloud.x = -cloud.size * 2;
            }
        });

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.alpha -= p.decay;

            if (p.type === 'bubble') {
                p.wobble += p.wobbleSpeed;
                p.x += Math.sin(p.wobble) * 0.5;
            }
        });

        this.particles = this.particles.filter(p => p.alpha > 0);
    },

    render(gameState) {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

        this.drawBackground();
        this.drawClouds();
        this.drawGround();
        this.drawObstacles();

        if (gameState.playerCannon && gameState.playerCannon.isCharging) {
            this.drawTrajectoryPreview(gameState.playerCannon);
        }

        this.drawCannon(gameState.playerCannon, true);
        this.drawCannon(gameState.enemyCannon, false);

        this.drawProjectiles();
        this.drawExplosions();
        this.drawParticles();
    },

    drawBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, GameConfig.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B3E5FC');
        gradient.addColorStop(1, '#81D4FA');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

        this.drawRainbow();
    },

    drawRainbow() {
        const ctx = this.ctx;
        const colors = ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'];
        const centerX = GameConfig.CANVAS_WIDTH / 2;
        const centerY = GameConfig.GROUND_Y + 200;

        colors.forEach((color, i) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 15;
            ctx.globalAlpha = 0.3;
            ctx.arc(centerX, centerY, 400 + i * 18, Math.PI, 0);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    },

    drawClouds() {
        const ctx = this.ctx;
        this.clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.size);
        });
    },

    drawCloud(x, y, size) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.2, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    },

    drawGround() {
        const ctx = this.ctx;

        ctx.fillStyle = GameConfig.COLORS.ground;
        ctx.fillRect(0, GameConfig.GROUND_Y, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_Y);

        ctx.fillStyle = GameConfig.COLORS.groundDark;
        for (let i = 0; i < GameConfig.CANVAS_WIDTH; i += 60) {
            ctx.beginPath();
            ctx.moveTo(i, GameConfig.GROUND_Y);
            ctx.quadraticCurveTo(i + 30, GameConfig.GROUND_Y - 8, i + 60, GameConfig.GROUND_Y);
            ctx.lineTo(i + 60, GameConfig.GROUND_Y + 15);
            ctx.lineTo(i, GameConfig.GROUND_Y + 15);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = '#AED581';
        for (let i = 0; i < GameConfig.CANVAS_WIDTH; i += 25) {
            const grassHeight = Utils.randomRange(5, 12);
            ctx.beginPath();
            ctx.moveTo(i, GameConfig.GROUND_Y);
            ctx.quadraticCurveTo(i + 3, GameConfig.GROUND_Y - grassHeight, i + 6, GameConfig.GROUND_Y);
            ctx.fill();
        }
    },

    drawObstacles() {
        const ctx = this.ctx;

        GameConfig.OBSTACLES.forEach(obstacle => {
            if (obstacle.type === 'wall') {
                this.drawWall(obstacle);
            } else if (obstacle.type === 'bump') {
                this.drawBump(obstacle);
            }
        });
    },

    drawWall(obstacle) {
        const ctx = this.ctx;

        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let y = obstacle.y + 20; y < obstacle.y + obstacle.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(obstacle.x, y);
            ctx.lineTo(obstacle.x + obstacle.width, y);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(obstacle.x + 2, obstacle.y + 2, 5, obstacle.height - 4);
    },

    drawBump(obstacle) {
        const ctx = this.ctx;

        ctx.fillStyle = obstacle.color;
        ctx.beginPath();
        ctx.ellipse(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height,
            obstacle.width / 2,
            obstacle.height,
            0, Math.PI, 0
        );
        ctx.fill();

        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.ellipse(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height - 3,
            obstacle.width / 2 - 5,
            obstacle.height - 5,
            0, Math.PI, 0
        );
        ctx.fill();
    },

    drawCannon(cannon, isPlayer) {
        if (!cannon) return;

        const ctx = this.ctx;
        const x = cannon.x;
        const y = cannon.y;

        ctx.save();
        ctx.translate(x, y);

        if (cannon.hitFlash > 0) {
            ctx.globalAlpha = 0.5 + cannon.hitFlash * 0.5;
        }

        this.drawCannonBase(cannon, isPlayer);
        this.drawCannonBarrel(cannon, isPlayer);
        this.drawCannonCharacter(cannon, isPlayer);

        ctx.restore();
        ctx.globalAlpha = 1;
    },

    drawCannonBase(cannon, isPlayer) {
        const ctx = this.ctx;

        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.ellipse(0, 25, 45, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6D4C41';
        ctx.beginPath();
        ctx.ellipse(0, 30, 50, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cannon.config.color;
        ctx.beginPath();
        ctx.roundRect(-30, -15, 60, 45, 10);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.roundRect(-25, -12, 15, 20, 5);
        ctx.fill();
    },

    drawCannonBarrel(cannon, isPlayer) {
        const ctx = this.ctx;
        const angle = isPlayer ? -Utils.toRadians(cannon.angle) : Utils.toRadians(cannon.angle);
        const recoil = cannon.recoilOffset;

        ctx.save();
        ctx.rotate(angle);

        ctx.fillStyle = cannon.config.barrelColor;
        ctx.beginPath();
        ctx.roundRect(-recoil, -12, 55, 24, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(-recoil + 45, -14, 12, 28, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(-recoil + 5, -8, 40, 6, 3);
        ctx.fill();

        if (cannon.isCharging) {
            const powerRatio = cannon.power / GameConfig.MAX_POWER;
            ctx.strokeStyle = `rgba(255, ${Math.floor(200 - powerRatio * 200)}, 0, 0.8)`;
            ctx.lineWidth = 3 + powerRatio * 3;
            ctx.beginPath();
            ctx.arc(55 - recoil, 0, 8 + powerRatio * 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    },

    drawCannonCharacter(cannon, isPlayer) {
        const ctx = this.ctx;

        ctx.fillStyle = isPlayer ? '#FFCCBC' : '#FFAB91';
        ctx.beginPath();
        ctx.arc(0, -35, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        const eyeOffset = isPlayer ? 5 : -5;
        ctx.beginPath();
        ctx.arc(-6, -37, 3, 0, Math.PI * 2);
        ctx.arc(6, -37, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-5 + eyeOffset * 0.2, -38, 1.5, 0, Math.PI * 2);
        ctx.arc(7 + eyeOffset * 0.2, -38, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#E57373';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -30, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.fillStyle = isPlayer ? '#42A5F5' : '#EF5350';
        ctx.beginPath();
        ctx.arc(0, -52, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-12, -52, 24, 5);

        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(0, -58, 4, 0, Math.PI * 2);
        ctx.fill();
    },

    drawTrajectoryPreview(cannon) {
        const ctx = this.ctx;
        const muzzle = cannon.getMuzzlePosition();
        const trajectory = Physics.calculateTrajectory(
            muzzle.x, muzzle.y,
            cannon.angle,
            cannon.power,
            cannon.config.projectiles.normal.speed,
            50
        );

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        trajectory.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);

        trajectory.forEach((point, i) => {
            if (i % 5 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    },

    drawProjectiles() {
        const ctx = this.ctx;
        const projectiles = ProjectileManager.getActiveProjectiles();

        projectiles.forEach(projectile => {
            this.drawProjectileTrail(projectile);
            this.drawProjectile(projectile);
        });
    },

    drawProjectileTrail(projectile) {
        const ctx = this.ctx;

        projectile.trail.forEach((point, i) => {
            ctx.fillStyle = projectile.color;
            ctx.globalAlpha = point.alpha * 0.5;
            ctx.beginPath();
            ctx.arc(point.x, point.y, projectile.radius * (0.3 + point.alpha * 0.4), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    },

    drawProjectile(projectile) {
        const ctx = this.ctx;
        const x = projectile.x;
        const y = projectile.y;
        const r = projectile.radius;

        ctx.save();
        ctx.translate(x, y);

        const angle = Math.atan2(projectile.vy, projectile.vx);
        ctx.rotate(angle);

        ctx.fillStyle = 'rgba(255, 150, 100, 0.4)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-r - i * 8, 0, r * (0.6 - i * 0.15), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(0, -r * 0.8, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-r * 0.2, -r * 0.85, r * 0.12, 0, Math.PI * 2);
        ctx.arc(r * 0.2, -r * 0.85, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-r * 0.15, -r * 0.9, r * 0.05, 0, Math.PI * 2);
        ctx.arc(r * 0.25, -r * 0.9, r * 0.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#E57373';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -r * 0.7, r * 0.25, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.4, -r * 0.65, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(r * 0.4, -r * 0.65, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.3);
        ctx.quadraticCurveTo(0, -r * 1.5, r * 0.5, -r * 0.3);
        ctx.quadraticCurveTo(0, -r * 0.1, -r * 0.5, -r * 0.3);
        ctx.fill();

        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(0, -r * 0.8, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    drawExplosions() {
        const ctx = this.ctx;
        const explosions = ProjectileManager.getExplosions();

        explosions.forEach(projectile => {
            const data = projectile.blastData;
            if (!data) return;

            const bubbleColors = ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#FFDAB9', '#F0E68C'];
            const bubbleCount = 12;
            
            for (let i = 0; i < bubbleCount; i++) {
                const angle = (i / bubbleCount) * Math.PI * 2 + data.radius * 0.01;
                const dist = data.radius * (0.3 + (i % 3) * 0.25);
                const bx = data.x + Math.cos(angle) * dist;
                const by = data.y + Math.sin(angle) * dist;
                const br = data.maxRadius * 0.15 * data.alpha;

                const gradient = ctx.createRadialGradient(
                    bx - br * 0.3, by - br * 0.3, 0,
                    bx, by, br
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${data.alpha * 0.8})`);
                gradient.addColorStop(0.5, `${bubbleColors[i % bubbleColors.length]}${Math.floor(data.alpha * 200).toString(16).padStart(2, '0')}`);
                gradient.addColorStop(1, `${bubbleColors[(i + 2) % bubbleColors.length]}${Math.floor(data.alpha * 100).toString(16).padStart(2, '0')}`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(255, 255, 255, ${data.alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.25, 0, Math.PI * 2);
                ctx.fill();
            }

            const gradient = ctx.createRadialGradient(
                data.x, data.y, 0,
                data.x, data.y, data.radius * 0.5
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${data.alpha * 0.9})`);
            gradient.addColorStop(0.3, `rgba(255, 200, 150, ${data.alpha * 0.6})`);
            gradient.addColorStop(1, `rgba(255, 150, 100, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(data.x, data.y, data.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 255, 255, ${data.alpha * 0.8})`;
            ctx.font = `bold ${Math.floor(data.radius * 0.3)}px Comic Sans MS`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const emojis = ['✨', '🎈', '💫', '⭐', '🎉'];
            ctx.fillText(emojis[Math.floor(data.radius / 10) % emojis.length], data.x, data.y - data.radius * 0.6);
        });
    },

    drawParticles() {
        const ctx = this.ctx;

        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;

            if (p.type === 'bubble') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.25, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'explosion') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;
    },

    addBubbleParticles(x, y, count, color) {
        const particles = Utils.createBubbleParticles(x, y, count, color);
        this.particles.push(...particles);
    },

    addExplosionParticles(x, y, count, colors) {
        const particles = Utils.createExplosionParticles(x, y, count, colors);
        this.particles.push(...particles);
    },

    clearParticles() {
        this.particles = [];
    }
};
