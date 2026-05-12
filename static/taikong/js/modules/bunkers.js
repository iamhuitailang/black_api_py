class BunkerManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.bunkers = [];
        this.init();
    }

    init() {
        const { COUNT, WIDTH, HEIGHT, Y_OFFSET } = CONFIG.BUNKERS;
        const spacing = (this.canvas.width - COUNT * WIDTH) / (COUNT + 1);

        for (let i = 0; i < COUNT; i++) {
            this.bunkers.push({
                x: spacing + i * (WIDTH + spacing),
                y: this.canvas.height - Y_OFFSET,
                width: WIDTH,
                height: HEIGHT,
                damage: 0,
                sections: this.createSections(WIDTH, HEIGHT)
            });
        }
    }

    createSections(width, height) {
        const sections = [];
        const cols = 4;
        const rows = 3;
        const sectionWidth = width / cols;
        const sectionHeight = height / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                sections.push({
                    x: col * sectionWidth,
                    y: row * sectionHeight,
                    width: sectionWidth,
                    height: sectionHeight,
                    damaged: false,
                    health: 3
                });
            }
        }
        return sections;
    }

    update() {
    }

    draw(ctx) {
        this.bunkers.forEach(bunker => {
            bunker.sections.forEach(section => {
                if (section.health <= 0) return;

                const healthPercent = section.health / 3;
                const damageLevel = 3 - section.health;

                const x = bunker.x + section.x;
                const y = bunker.y + section.y;
                const w = section.width;
                const h = section.height;

                ctx.globalAlpha = healthPercent;

                if (damageLevel === 0) {
                    ctx.fillStyle = '#4a7c59';
                } else if (damageLevel === 1) {
                    ctx.fillStyle = '#8b7355';
                } else {
                    ctx.fillStyle = '#cd853f';
                }

                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 2);
                ctx.fill();

                ctx.fillStyle = damageLevel === 0 ? '#6b9c79' : '#dda0dd';
                ctx.beginPath();
                ctx.roundRect(x + 3, y + 2, w - 8, 3, 1);
                ctx.fill();

                ctx.fillStyle = damageLevel === 0 ? '#3a5c49' : '#8b4513';
                ctx.beginPath();
                ctx.roundRect(x + 3, y + h - 5, w - 8, 3, 1);
                ctx.fill();

                if (damageLevel > 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    for (let i = 0; i < damageLevel * 2; i++) {
                        const cx = x + Math.random() * (w - 6) + 3;
                        const cy = y + Math.random() * (h - 6) + 3;
                        ctx.beginPath();
                        ctx.arc(cx, cy, 1 + Math.random(), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.globalAlpha = 1;
            });
        });
    }

    checkCollision(bullet) {
        for (let i = this.bunkers.length - 1; i >= 0; i--) {
            const bunker = this.bunkers[i];
            
            for (let j = bunker.sections.length - 1; j >= 0; j--) {
                const section = bunker.sections[j];
                if (section.health <= 0) continue;

                const sectionRect = {
                    x: bunker.x + section.x,
                    y: bunker.y + section.y,
                    width: section.width,
                    height: section.height
                };

                if (Utils.checkCollision(bullet, sectionRect)) {
                    section.health--;
                    bunker.damage++;
                    return true;
                }
            }
        }
        return false;
    }

    checkCollisionWithBullets(bulletManager) {
        let hit = false;
        for (let i = bulletManager.bullets.length - 1; i >= 0; i--) {
            const bullet = bulletManager.bullets[i];
            if (this.checkCollision(bullet)) {
                bulletManager.removeBullet(i);
                hit = true;
            }
        }
        return hit;
    }

    reset() {
        this.bunkers = [];
        this.init();
    }
}