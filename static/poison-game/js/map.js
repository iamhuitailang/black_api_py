class GameMap {
    constructor(levelConfig) {
        this.width = CONFIG.MAP_WIDTH;
        this.height = CONFIG.MAP_HEIGHT;
        this.tiles = [];
        this.walls = [];
        this.purificationStations = [];
        this.poisonPools = [];
        this.explored = [];
        this.entry = { x: 1, y: Math.floor(this.height / 2) };
        this.exit = { x: this.width - 2, y: Math.floor(this.height / 2) };
        this.levelConfig = levelConfig;

        this.init();
    }

    init() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.explored[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 0;
                this.explored[y][x] = false;
            }
        }

        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = 1;
            this.tiles[this.height - 1][x] = 1;
        }
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = 1;
            this.tiles[y][this.width - 1] = 1;
        }

        this.generateWalls();
        this.generatePurificationStations();
        this.ensurePath();
        this.exploreArea(this.entry.x, this.entry.y, CONFIG.VISION_RADIUS);
    }

    generateWalls() {
        const wallCount = this.levelConfig.walls;
        let placed = 0;
        let attempts = 0;

        while (placed < wallCount && attempts < wallCount * 10) {
            attempts++;
            const x = Math.floor(Math.random() * (this.width - 4)) + 2;
            const y = Math.floor(Math.random() * (this.height - 4)) + 2;

            if (this.isNearEntryOrExit(x, y, 3)) continue;
            if (this.tiles[y][x] === 1) continue;

            const wallLength = Math.floor(Math.random() * 3) + 1;
            const horizontal = Math.random() > 0.5;
            let canPlace = true;

            for (let i = 0; i < wallLength; i++) {
                const wx = horizontal ? x + i : x;
                const wy = horizontal ? y : y + i;
                if (wx >= this.width - 1 || wy >= this.height - 1 ||
                    this.tiles[wy][wx] === 1 ||
                    this.isNearEntryOrExit(wx, wy, 2)) {
                    canPlace = false;
                    break;
                }
            }

            if (canPlace) {
                for (let i = 0; i < wallLength; i++) {
                    const wx = horizontal ? x + i : x;
                    const wy = horizontal ? y : y + i;
                    this.tiles[wy][wx] = 1;
                    this.walls.push({ x: wx, y: wy });
                }
                placed += wallLength;
            }
        }
    }

    generatePurificationStations() {
        const count = this.levelConfig.purificationStations;
        const zones = ['entry', 'middle', 'middle', 'exit'];

        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;
            const zone = zones[i % zones.length];

            while (!placed && attempts < 100) {
                attempts++;
                let x, y;

                if (zone === 'entry') {
                    x = Math.floor(Math.random() * 4) + 2;
                } else if (zone === 'exit') {
                    x = Math.floor(Math.random() * 4) + this.width - 6;
                } else {
                    x = Math.floor(Math.random() * (this.width - 10)) + 5;
                }
                y = Math.floor(Math.random() * (this.height - 4)) + 2;

                if (this.tiles[y][x] === 1) continue;
                if (this.isNearEntryOrExit(x, y, 2)) continue;
                if (this.purificationStations.some(p =>
                    Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3)) continue;

                this.purificationStations.push({
                    x: x,
                    y: y,
                    discovered: false,
                    used: false,
                    glows: 0
                });
                placed = true;
            }
        }
    }

    isNearEntryOrExit(x, y, distance) {
        const distToEntry = Math.abs(x - this.entry.x) + Math.abs(y - this.entry.y);
        const distToExit = Math.abs(x - this.exit.x) + Math.abs(y - this.exit.y);
        return distToEntry < distance || distToExit < distance;
    }

    ensurePath() {
        this.tiles[this.entry.y][this.entry.x] = 0;
        this.tiles[this.exit.y][this.exit.x] = 0;

        const midY = Math.floor(this.height / 2);
        for (let x = 1; x < this.width - 1; x++) {
            if (Math.random() > 0.1) {
                this.tiles[midY][x] = 0;
                this.tiles[midY - 1][x] = 0;
                this.tiles[midY + 1][x] = 0;
            }
        }
    }

    isWall(x, y) {
        const gx = Math.floor(x);
        const gy = Math.floor(y);
        if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return true;
        return this.tiles[gy][gx] === 1;
    }

    canMove(x, y) {
        if (this.isWall(x, y)) return false;
        if (x < 0.5 || x > this.width - 1.5 || y < 0.5 || y > this.height - 1.5) return false;
        return true;
    }

    getZone(x) {
        const gx = Math.floor(x);
        if (gx < CONFIG.ZONES.ENTRY.cols) return 'entry';
        if (gx < CONFIG.ZONES.ENTRY.cols + CONFIG.ZONES.MIDDLE.cols) return 'middle';
        return 'exit';
    }

    getZoneDamage(x) {
        const zone = this.getZone(x);
        if (zone === 'entry') return CONFIG.ZONES.ENTRY.damage;
        if (zone === 'middle') return CONFIG.ZONES.MIDDLE.damage;
        return CONFIG.ZONES.EXIT.damage;
    }

    exploreArea(centerX, centerY, radius) {
        const cx = Math.floor(centerX);
        const cy = Math.floor(centerY);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= radius) {
                        this.explored[y][x] = true;
                    }
                }
            }
        }

        this.purificationStations.forEach(station => {
            if (!station.discovered) {
                const dist = Math.sqrt(
                    Math.pow(station.x - centerX, 2) +
                    Math.pow(station.y - centerY, 2)
                );
                if (dist <= radius) {
                    station.discovered = true;
                }
            }
        });
    }

    isInVision(x, y, playerX, playerY) {
        const dist = Math.sqrt(
            Math.pow(x - playerX, 2) +
            Math.pow(y - playerY, 2)
        );
        return dist <= CONFIG.VISION_RADIUS;
    }

    isExplored(x, y) {
        const gx = Math.floor(x);
        const gy = Math.floor(y);
        if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
        return this.explored[gy][gx];
    }

    checkPurificationCollision(x, y) {
        for (const station of this.purificationStations) {
            if (station.used) continue;
            const dist = Math.sqrt(
                Math.pow(station.x + 0.5 - x, 2) +
                Math.pow(station.y + 0.5 - y, 2)
            );
            if (dist < 0.8) {
                return station;
            }
        }
        return null;
    }

    checkExitCollision(x, y) {
        const dist = Math.sqrt(
            Math.pow(this.exit.x + 0.5 - x, 2) +
            Math.pow(this.exit.y + 0.5 - y, 2)
        );
        return dist < 0.8;
    }

    addPoisonPool(x, y, duration) {
        this.poisonPools.push({
            x: Math.floor(x),
            y: Math.floor(y),
            remainingTime: duration
        });
    }

    checkPoisonPool(x, y) {
        const gx = Math.floor(x);
        const gy = Math.floor(y);
        return this.poisonPools.some(pool => pool.x === gx && pool.y === gy);
    }

    update(deltaTime) {
        this.poisonPools = this.poisonPools.filter(pool => {
            pool.remainingTime -= deltaTime;
            return pool.remainingTime > 0;
        });

        this.purificationStations.forEach(station => {
            if (station.glows > 0) {
                station.glows -= deltaTime;
            }
        });
    }

    render(ctx, playerX, playerY) {
        const tileSize = CONFIG.TILE_SIZE;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const px = x * tileSize;
                const py = y * tileSize;

                const inVision = this.isInVision(x + 0.5, y + 0.5, playerX, playerY);
                const explored = this.explored[y][x];

                if (!explored && !inVision) {
                    ctx.fillStyle = CONFIG.COLORS.FOG_HEAVY;
                    ctx.fillRect(px, py, tileSize, tileSize);
                    continue;
                }

                const zone = this.getZone(x);
                if (zone === 'entry') {
                    ctx.fillStyle = CONFIG.COLORS.ZONE_ENTRY;
                } else if (zone === 'middle') {
                    ctx.fillStyle = CONFIG.COLORS.ZONE_MIDDLE;
                } else {
                    ctx.fillStyle = CONFIG.COLORS.ZONE_EXIT;
                }
                ctx.fillRect(px, py, tileSize, tileSize);

                ctx.fillStyle = CONFIG.COLORS.FLOOR;
                ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

                if (this.tiles[y][x] === 1) {
                    ctx.fillStyle = CONFIG.COLORS.WALL;
                    ctx.fillRect(px, py, tileSize, tileSize);
                    ctx.fillStyle = '#5a5a7a';
                    ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 8);
                }

                if (!inVision && explored) {
                    ctx.fillStyle = CONFIG.COLORS.EXPLORED;
                    ctx.fillRect(px, py, tileSize, tileSize);
                }
            }
        }

        this.poisonPools.forEach(pool => {
            const px = pool.x * tileSize;
            const py = pool.y * tileSize;
            const inVision = this.isInVision(pool.x + 0.5, pool.y + 0.5, playerX, playerY);
            if (inVision) {
                ctx.fillStyle = CONFIG.COLORS.POISON_POOL;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.4, 0, Math.PI * 2);
                ctx.fill();

                const alpha = Math.min(1, pool.remainingTime / 2);
                ctx.strokeStyle = `rgba(148, 0, 211, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        this.purificationStations.forEach(station => {
            const px = station.x * tileSize;
            const py = station.y * tileSize;
            const inVision = this.isInVision(station.x + 0.5, station.y + 0.5, playerX, playerY);

            if ((inVision || this.explored[station.y][station.x]) && !station.used) {
                const glowSize = station.glows > 0 ? tileSize * 0.8 : tileSize * 0.5;
                const gradient = ctx.createRadialGradient(
                    px + tileSize / 2, py + tileSize / 2, 0,
                    px + tileSize / 2, py + tileSize / 2, glowSize
                );
                gradient.addColorStop(0, 'rgba(57, 255, 20, 0.6)');
                gradient.addColorStop(1, 'rgba(57, 255, 20, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(px - tileSize / 2, py - tileSize / 2, tileSize * 2, tileSize * 2);

                ctx.fillStyle = CONFIG.COLORS.PURIFICATION;
                ctx.beginPath();
                ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = `${tileSize * 0.4}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+', px + tileSize / 2, py + tileSize / 2);
            }
        });

        const exitPx = this.exit.x * tileSize;
        const exitPy = this.exit.y * tileSize;
        const exitInVision = this.isInVision(this.exit.x + 0.5, this.exit.y + 0.5, playerX, playerY);

        if (exitInVision || this.explored[this.exit.y][this.exit.x]) {
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            const gradient = ctx.createRadialGradient(
                exitPx + tileSize / 2, exitPy + tileSize / 2, 0,
                exitPx + tileSize / 2, exitPy + tileSize / 2, tileSize * (0.8 + pulse * 0.3)
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(exitPx - tileSize / 2, exitPy - tileSize / 2, tileSize * 2, tileSize * 2);

            ctx.fillStyle = CONFIG.COLORS.EXIT;
            ctx.fillRect(exitPx + 2, exitPy + 2, tileSize - 4, tileSize - 4);

            ctx.fillStyle = '#000';
            ctx.font = `${tileSize * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⬆', exitPx + tileSize / 2, exitPy + tileSize / 2);
        }

        const entryPx = this.entry.x * tileSize;
        const entryPy = this.entry.y * tileSize;
        if (this.isInVision(this.entry.x + 0.5, this.entry.y + 0.5, playerX, playerY)) {
            ctx.fillStyle = 'rgba(57, 255, 20, 0.3)';
            ctx.fillRect(entryPx + 2, entryPy + 2, tileSize - 4, tileSize - 4);
        }
    }

    serialize() {
        return {
            width: this.width,
            height: this.height,
            tiles: this.tiles,
            walls: this.walls,
            purificationStations: this.purificationStations,
            poisonPools: this.poisonPools,
            explored: this.explored,
            entry: this.entry,
            exit: this.exit,
            levelConfig: this.levelConfig
        };
    }

    static deserialize(data) {
        const map = Object.create(GameMap.prototype);
        map.width = data.width;
        map.height = data.height;
        map.tiles = data.tiles;
        map.walls = data.walls;
        map.purificationStations = data.purificationStations;
        map.poisonPools = data.poisonPools || [];
        map.explored = data.explored;
        map.entry = data.entry;
        map.exit = data.exit;
        map.levelConfig = data.levelConfig;
        return map;
    }
}
