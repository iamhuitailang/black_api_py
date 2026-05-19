class GameMap {
    constructor() {
        this.width = Config.MAP_WIDTH;
        this.height = Config.MAP_HEIGHT;
        this.obstacles = [];
        this.decorations = [];
        this.generateMap();
    }

    generateMap() {
        this.obstacles = [];
        this.decorations = [];

        this.obstacles.push({ x: 0, y: 0, width: this.width, height: 30 });
        this.obstacles.push({ x: 0, y: this.height - 30, width: this.width, height: 30 });
        this.obstacles.push({ x: 0, y: 0, width: 30, height: this.height });
        this.obstacles.push({ x: this.width - 30, y: 0, width: 30, height: this.height });

        const buildingConfigs = [
            { x: 200, y: 200, w: 150, h: 120 },
            { x: 500, y: 150, w: 120, h: 150 },
            { x: 800, y: 250, w: 180, h: 100 },
            { x: 1100, y: 180, w: 140, h: 160 },
            { x: 1500, y: 200, w: 160, h: 130 },
            { x: 1800, y: 300, w: 120, h: 120 },
            { x: 2100, y: 150, w: 150, h: 140 },
            { x: 300, y: 500, w: 130, h: 150 },
            { x: 600, y: 600, w: 160, h: 120 },
            { x: 900, y: 450, w: 140, h: 160 },
            { x: 1200, y: 550, w: 170, h: 130 },
            { x: 1500, y: 700, w: 150, h: 150 },
            { x: 1800, y: 600, w: 130, h: 140 },
            { x: 2100, y: 500, w: 160, h: 120 },
            { x: 400, y: 900, w: 120, h: 130 },
            { x: 700, y: 1000, w: 150, h: 110 },
            { x: 1000, y: 850, w: 140, h: 150 },
            { x: 1300, y: 950, w: 160, h: 130 },
            { x: 1600, y: 1100, w: 130, h: 140 },
            { x: 1900, y: 900, w: 170, h: 120 },
            { x: 2200, y: 1000, w: 140, h: 150 }
        ];

        for (const b of buildingConfigs) {
            this.addBuilding(b.x, b.y, b.w, b.h);
        }

        for (let i = 0; i < 80; i++) {
            const x = Utils.randomRange(50, this.width - 50);
            const y = Utils.randomRange(50, this.height - 50);
            const size = Utils.randomRange(15, 35);
            
            if (!this.isInBuilding(x, y, size)) {
                this.decorations.push({
                    type: 'rubble',
                    x: x,
                    y: y,
                    size: size,
                    rotation: Utils.randomRange(0, Math.PI * 2)
                });
            }
        }

        for (let i = 0; i < 40; i++) {
            const x = Utils.randomRange(50, this.width - 50);
            const y = Utils.randomRange(50, this.height - 50);
            
            if (!this.isInBuilding(x, y, 20)) {
                this.decorations.push({
                    type: 'crate',
                    x: x,
                    y: y,
                    size: 25
                });
            }
        }

        for (let i = 0; i < 60; i++) {
            const x = Utils.randomRange(50, this.width - 50);
            const y = Utils.randomRange(50, this.height - 50);
            
            if (!this.isInBuilding(x, y, 10)) {
                this.decorations.push({
                    type: 'decal',
                    x: x,
                    y: y,
                    size: Utils.randomRange(30, 60),
                    variant: Utils.randomInt(0, 2)
                });
            }
        }
    }

    addBuilding(x, y, width, height) {
        this.obstacles.push({
            x: x,
            y: y,
            width: width,
            height: height,
            type: 'building'
        });

        this.obstacles.push({
            x: x + width + 10,
            y: y + height - 30,
            width: 25,
            height: 25,
            type: 'rubble'
        });
        this.obstacles.push({
            x: x - 30,
            y: y + 10,
            width: 20,
            height: 20,
            type: 'rubble'
        });
    }

    isInBuilding(x, y, padding = 0) {
        for (const obs of this.obstacles) {
            if (obs.type === 'building') {
                if (x > obs.x - padding && x < obs.x + obs.width + padding &&
                    y > obs.y - padding && y < obs.y + obs.height + padding) {
                    return true;
                }
            }
        }
        return false;
    }

    checkCollision(x, y, radius) {
        for (const obs of this.obstacles) {
            if (Utils.circleRectCollision({ x, y, radius }, obs)) {
                return true;
            }
        }
        return false;
    }

    findSpawnPosition() {
        let attempts = 0;
        while (attempts < 100) {
            const x = Utils.randomRange(100, this.width - 100);
            const y = Utils.randomRange(100, this.height - 100);
            
            if (!this.checkCollision(x, y, 40) && !this.isInBuilding(x, y, 50)) {
                return { x, y };
            }
            attempts++;
        }
        return { x: this.width / 2, y: this.height / 2 };
    }

    render(ctx, camera) {
        const gradient = ctx.createLinearGradient(0, 0, 0, Config.MAP_HEIGHT);
        gradient.addColorStop(0, '#3a3a3a');
        gradient.addColorStop(0.5, '#323232');
        gradient.addColorStop(1, '#2a2a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        for (const decal of this.decorations) {
            if (decal.type === 'decal') {
                const screenX = decal.x - camera.x;
                const screenY = decal.y - camera.y;
                
                if (screenX < -100 || screenX > Config.CANVAS_WIDTH + 100 ||
                    screenY < -100 || screenY > Config.CANVAS_HEIGHT + 100) continue;

                ctx.save();
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = decal.variant === 0 ? '#1a1a1a' : '#222222';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY, decal.size, decal.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        for (const rubble of this.decorations.filter(d => d.type === 'rubble')) {
            const screenX = rubble.x - camera.x;
            const screenY = rubble.y - camera.y;
            
            if (screenX < -50 || screenX > Config.CANVAS_WIDTH + 50 ||
                screenY < -50 || screenY > Config.CANVAS_HEIGHT + 50) continue;

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(rubble.rotation);
            
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.moveTo(-rubble.size * 0.5, rubble.size * 0.3);
            ctx.lineTo(-rubble.size * 0.3, -rubble.size * 0.4);
            ctx.lineTo(rubble.size * 0.4, -rubble.size * 0.3);
            ctx.lineTo(rubble.size * 0.5, rubble.size * 0.4);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#3a3a3a';
            ctx.beginPath();
            ctx.moveTo(rubble.size * 0.4, -rubble.size * 0.3);
            ctx.lineTo(rubble.size * 0.5, rubble.size * 0.4);
            ctx.lineTo(rubble.size * 0.2, rubble.size * 0.5);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }

        for (const crate of this.decorations.filter(d => d.type === 'crate')) {
            const screenX = crate.x - camera.x;
            const screenY = crate.y - camera.y;
            
            if (screenX < -50 || screenX > Config.CANVAS_WIDTH + 50 ||
                screenY < -50 || screenY > Config.CANVAS_HEIGHT + 50) continue;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(screenX - crate.size / 2 + 3, screenY - crate.size / 2 + 5, crate.size, crate.size);
            
            ctx.fillStyle = '#5a4a3a';
            ctx.fillRect(screenX - crate.size / 2, screenY - crate.size / 2, crate.size, crate.size);
            
            ctx.strokeStyle = '#3a2a1a';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - crate.size / 2, screenY - crate.size / 2, crate.size, crate.size);
            
            ctx.beginPath();
            ctx.moveTo(screenX - crate.size / 2, screenY);
            ctx.lineTo(screenX + crate.size / 2, screenY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(screenX, screenY - crate.size / 2);
            ctx.lineTo(screenX, screenY + crate.size / 2);
            ctx.stroke();
        }

        for (const obs of this.obstacles) {
            const screenX = obs.x - camera.x;
            const screenY = obs.y - camera.y;
            
            if (screenX > Config.CANVAS_WIDTH + 50 || screenX + obs.width < -50 ||
                screenY > Config.CANVAS_HEIGHT + 50 || screenY + obs.height < -50) continue;

            if (obs.type === 'building') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(screenX + 8, screenY + 8, obs.width, obs.height);
                
                const buildingGradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + obs.height);
                buildingGradient.addColorStop(0, '#4a4a4a');
                buildingGradient.addColorStop(1, '#2a2a2a');
                ctx.fillStyle = buildingGradient;
                ctx.fillRect(screenX, screenY, obs.width, obs.height);
                
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 3;
                ctx.strokeRect(screenX, screenY, obs.width, obs.height);
                
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(screenX, screenY, obs.width, 15);
                
                ctx.fillStyle = '#222222';
                for (let wx = screenX + 15; wx < screenX + obs.width - 15; wx += 25) {
                    for (let wy = screenY + 25; wy < screenY + obs.height - 15; wy += 25) {
                        ctx.fillRect(wx, wy, 12, 15);
                    }
                }
                
                ctx.fillStyle = '#3a3a3a';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + 20, screenY - 20);
                ctx.lineTo(screenX + obs.width + 20, screenY - 20);
                ctx.lineTo(screenX + obs.width, screenY);
                ctx.closePath();
                ctx.fill();
                
            } else if (obs.type === 'rubble') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(screenX + 3, screenY + 3, obs.width, obs.height);
                
                ctx.fillStyle = '#4a4a4a';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY + obs.height);
                ctx.lineTo(screenX + obs.width * 0.2, screenY);
                ctx.lineTo(screenX + obs.width * 0.8, screenY + obs.height * 0.1);
                ctx.lineTo(screenX + obs.width, screenY + obs.height);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    serialize() {
        return {
            obstacles: this.obstacles,
            decorations: this.decorations
        };
    }

    static deserialize(data) {
        const map = new GameMap();
        map.obstacles = data.obstacles || [];
        map.decorations = data.decorations || [];
        return map;
    }
}
