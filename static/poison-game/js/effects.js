const Effects = {
    poisonParticles: [],
    damageOverlay: null,
    healOverlay: null,
    fogCanvas: null,
    fogCtx: null,
    fogCanvasWidth: 0,
    fogCanvasHeight: 0,

    init() {
        this.damageOverlay = document.getElementById('damage-overlay');
        this.healOverlay = document.getElementById('heal-overlay');
    },

    ensureFogCanvas(width, height) {
        if (!this.fogCanvas || this.fogCanvasWidth !== width || this.fogCanvasHeight !== height) {
            this.fogCanvas = document.createElement('canvas');
            this.fogCanvas.width = width;
            this.fogCanvas.height = height;
            this.fogCtx = this.fogCanvas.getContext('2d');
            this.fogCanvasWidth = width;
            this.fogCanvasHeight = height;
        }
    },

    showDamageOverlay() {
        if (this.damageOverlay) {
            this.damageOverlay.classList.remove('active');
            void this.damageOverlay.offsetWidth;
            this.damageOverlay.classList.add('active');
            setTimeout(() => {
                this.damageOverlay.classList.remove('active');
            }, 300);
        }
    },

    showHealOverlay() {
        if (this.healOverlay) {
            this.healOverlay.classList.remove('active');
            void this.healOverlay.offsetWidth;
            this.healOverlay.classList.add('active');
            setTimeout(() => {
                this.healOverlay.classList.remove('active');
            }, 500);
        }
    },

    update(deltaTime, gameMap) {
        if (gameMap) {
            const tileSize = CONFIG.TILE_SIZE;
            for (let i = 0; i < 3; i++) {
                const x = Math.floor(Math.random() * gameMap.width);
                const y = Math.floor(Math.random() * gameMap.height);
                if (gameMap.tiles[y] && gameMap.tiles[y][x] === 0) {
                    const zone = gameMap.getZone(x);
                    this.generatePoisonParticle(x, y, zone);
                }
            }
        }

        this.poisonParticles = this.poisonParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            p.alpha = (p.life / p.maxLife) * 0.4;
            return p.life > 0;
        });

        if (this.poisonParticles.length > 150) {
            this.poisonParticles = this.poisonParticles.slice(-150);
        }
    },

    generatePoisonParticle(x, y, zone) {
        const tileSize = CONFIG.TILE_SIZE;
        let color;
        if (zone === 'entry') {
            color = 'rgba(57, 255, 20, ';
        } else if (zone === 'middle') {
            color = 'rgba(255, 165, 0, ';
        } else {
            color = 'rgba(148, 0, 211, ';
        }

        this.poisonParticles.push({
            x: x * tileSize + Math.random() * tileSize,
            y: y * tileSize + Math.random() * tileSize,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 0.5 - 0.2,
            size: Math.random() * 4 + 2,
            alpha: Math.random() * 0.3 + 0.2,
            life: Math.random() * 2 + 1,
            maxLife: Math.random() * 2 + 1,
            color: color
        });
    },

    render(ctx, playerX, playerY, gameMap) {
        const tileSize = CONFIG.TILE_SIZE;

        this.poisonParticles.forEach(p => {
            const tileX = p.x / tileSize;
            const tileY = p.y / tileSize;
            const dist = Math.sqrt(
                Math.pow(tileX - playerX, 2) +
                Math.pow(tileY - playerY, 2)
            );
            if (dist <= CONFIG.VISION_RADIUS) {
                ctx.fillStyle = p.color + p.alpha + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        const gradient = ctx.createRadialGradient(
            playerX * tileSize,
            playerY * tileSize,
            tileSize * 2,
            playerX * tileSize,
            playerY * tileSize,
            tileSize * CONFIG.VISION_RADIUS
        );

        const zone = gameMap.getZone(playerX);
        let fogColor;
        if (zone === 'entry') {
            fogColor = 'rgba(57, 255, 20, 0.15)';
        } else if (zone === 'middle') {
            fogColor = 'rgba(157, 78, 221, 0.25)';
        } else {
            fogColor = 'rgba(148, 0, 211, 0.35)';
        }

        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'transparent');
        gradient.addColorStop(0.8, fogColor);
        gradient.addColorStop(1, 'rgba(26, 10, 46, 0.9)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gameMap.width * tileSize, gameMap.height * tileSize);
    },

    renderFog(ctx, playerX, playerY, gameMap) {
        const tileSize = CONFIG.TILE_SIZE;
        const canvasWidth = gameMap.width * tileSize;
        const canvasHeight = gameMap.height * tileSize;

        this.ensureFogCanvas(Math.ceil(canvasWidth), Math.ceil(canvasHeight));
        const fogCtx = this.fogCtx;

        fogCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        fogCtx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        fogCtx.fillRect(0, 0, canvasWidth, canvasHeight);

        fogCtx.globalCompositeOperation = 'destination-out';

        const gradient = fogCtx.createRadialGradient(
            playerX * tileSize,
            playerY * tileSize,
            tileSize * 0.5,
            playerX * tileSize,
            playerY * tileSize,
            tileSize * CONFIG.VISION_RADIUS
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        fogCtx.fillStyle = gradient;
        fogCtx.beginPath();
        fogCtx.arc(
            playerX * tileSize,
            playerY * tileSize,
            tileSize * CONFIG.VISION_RADIUS,
            0,
            Math.PI * 2
        );
        fogCtx.fill();

        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                if (gameMap.explored[y] && gameMap.explored[y][x]) {
                    const inVision = gameMap.isInVision(x + 0.5, y + 0.5, playerX, playerY);
                    if (!inVision) {
                        fogCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                        fogCtx.fillRect(
                            x * tileSize,
                            y * tileSize,
                            tileSize,
                            tileSize
                        );
                    }
                }
            }
        }

        fogCtx.globalCompositeOperation = 'source-over';

        ctx.drawImage(this.fogCanvas, 0, 0);
    },

    reset() {
        this.poisonParticles = [];
        this.fogCanvas = null;
        this.fogCtx = null;
    }
};
