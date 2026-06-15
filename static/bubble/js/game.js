// ============================================================
// 梦幻泡泡龙游戏 Bubble Shooter
// ============================================================

(function() {
    'use strict';

    // ============ 常量定义 ============
    const COLORS = {
        RED:    '#e74c3c',
        BLUE:   '#3498db',
        GREEN:  '#2ecc71',
        YELLOW: '#f1c40f',
        PURPLE: '#9b59b6',
        ORANGE: '#e67e22'
    };
    const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];

    const SPECIAL = {
        NORMAL: 'normal',
        RAINBOW: 'rainbow',
        BOMB: 'bomb',
        STONE: 'stone'
    };

    const STONE_COLOR = '#7f8c8d';

    const BUBBLE_RADIUS = 20;
    const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
    const ROW_HEIGHT = BUBBLE_DIAMETER * 0.87; // 六边形行高
    const CANVAS_WIDTH = 520;
    const CANVAS_HEIGHT = 680;
    const TOP_PADDING = 30;
    const LEFT_PADDING = (CANVAS_WIDTH - BUBBLE_DIAMETER * (CANVAS_WIDTH / BUBBLE_DIAMETER | 0)) / 2 + BUBBLE_RADIUS;

    const SHOOTER_Y = CANVAS_HEIGHT - 60;
    const SHOOTER_X = CANVAS_WIDTH / 2;
    const RED_LINE_Y = CANVAS_HEIGHT - CANVAS_HEIGHT / 5;
    const SHOOT_SPEED = 14;
    const ROTATE_SPEED = 0.06;
    const MIN_ANGLE = Math.PI * 0.1;
    const MAX_ANGLE = Math.PI * 0.9;

    const LEVELS = [
        { rows: 5,  colors: 4, stoneChance: 0.00, bombChance: 0.03 },
        { rows: 6,  colors: 4, stoneChance: 0.02, bombChance: 0.03 },
        { rows: 7,  colors: 5, stoneChance: 0.04, bombChance: 0.03 },
        { rows: 8,  colors: 5, stoneChance: 0.06, bombChance: 0.03 },
        { rows: 9,  colors: 6, stoneChance: 0.08, bombChance: 0.03 },
        { rows: 10, colors: 6, stoneChance: 0.10, bombChance: 0.03 },
        { rows: 11, colors: 6, stoneChance: 0.12, bombChance: 0.03 },
        { rows: 12, colors: 6, stoneChance: 0.15, bombChance: 0.03 }
    ];

    const DROP_SCORE = 50;
    const MATCH_SCORE_BASE = 100;

    // ============ 游戏状态 ============
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const GameState = {
        IDLE: 'idle',
        SHOOTING: 'shooting',
        ANIMATING: 'animating',
        GAMEOVER: 'gameover',
        LEVELCOMPLETE: 'levelcomplete'
    };

    let game = {
        level: 1,
        score: 0,
        totalScore: 0,
        shots: 0,
        shotsWithoutPop: 0,
        grid: [],
        cols: Math.floor(CANVAS_WIDTH / BUBBLE_DIAMETER),
        shooterAngle: Math.PI / 2,
        currentBubble: null,
        nextBubble: null,
        flyingBubble: null,
        poppingBubbles: [],
        fallingBubbles: [],
        state: GameState.IDLE,
        keys: {}
    };

    // ============ 气泡类 ============
    class Bubble {
        constructor(row, col, color, type = SPECIAL.NORMAL) {
            this.row = row;
            this.col = col;
            this.color = color;
            this.type = type;
            this.x = 0;
            this.y = 0;
            this.updatePosition();
            this.popProgress = 0;
            this.fallVelX = 0;
            this.fallVelY = 0;
            this.rotation = 0;
            this.rotationSpeed = 0;
            this.alpha = 1;
            this.scale = 1;
        }

        updatePosition() {
            this.x = LEFT_PADDING + this.col * BUBBLE_DIAMETER +
                     (this.row % 2 === 1 ? BUBBLE_RADIUS : 0);
            this.y = TOP_PADDING + this.row * ROW_HEIGHT + BUBBLE_RADIUS;
        }

        draw(ctx) {
            if (this.alpha <= 0) return;

            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.scale(this.scale, this.scale);

            const r = BUBBLE_RADIUS;

            if (this.type === SPECIAL.STONE) {
                drawStoneBubble(ctx, r);
            } else if (this.type === SPECIAL.BOMB) {
                drawBombBubble(ctx, r);
            } else if (this.type === SPECIAL.RAINBOW) {
                drawRainbowBubble(ctx, r);
            } else {
                drawNormalBubble(ctx, r, this.color);
            }

            ctx.restore();
        }
    }

    function drawNormalBubble(ctx, r, color) {
        const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        gradient.addColorStop(0, lightenColor(color, 60));
        gradient.addColorStop(0.3, lightenColor(color, 20));
        gradient.addColorStop(1, darkenColor(color, 25));

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(r * 0.25, r * 0.25, r * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = darkenColor(color, 40);
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    function drawRainbowBubble(ctx, r) {
        const hue = (Date.now() / 10) % 360;
        const colors = [
            `hsl(${hue}, 85%, 65%)`,
            `hsl(${(hue + 60) % 360}, 85%, 65%)`,
            `hsl(${(hue + 120) % 360}, 85%, 65%)`,
            `hsl(${(hue + 180) % 360}, 85%, 65%)`,
            `hsl(${(hue + 240) % 360}, 85%, 65%)`,
            `hsl(${(hue + 300) % 360}, 85%, 65%)`
        ];

        const gradient = ctx.createLinearGradient(-r, -r, r, r);
        colors.forEach((c, i) => gradient.addColorStop(i / (colors.length - 1), c));

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);
    }

    function drawBombBubble(ctx, r) {
        drawNormalBubble(ctx, r, '#1a1a2e');

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 1);
    }

    function drawStoneBubble(ctx, r) {
        const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        gradient.addColorStop(0, '#b2bec3');
        gradient.addColorStop(0.4, '#85929e');
        gradient.addColorStop(1, '#4a5568');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(-r * 0.2, -r * 0.1, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.25, r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.05, -r * 0.3, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ============ 颜色工具 ============
    function lightenColor(hex, amount) {
        return adjustColor(hex, amount);
    }

    function darkenColor(hex, amount) {
        return adjustColor(hex, -amount);
    }

    function adjustColor(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    // ============ 网格操作 ============
    function getBubble(row, col) {
        if (row < 0 || row >= game.grid.length) return null;
        if (!game.grid[row]) return null;
        return game.grid[row][col] || null;
    }

    function setBubble(row, col, bubble) {
        while (game.grid.length <= row) {
            game.grid.push([]);
        }
        game.grid[row][col] = bubble;
        if (bubble) {
            bubble.row = row;
            bubble.col = col;
            bubble.updatePosition();
        }
    }

    function getNeighbors(row, col) {
        const neighbors = [];
        const isOdd = row % 2 === 1;
        const offsets = isOdd
            ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
            : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

        for (const [dr, dc] of offsets) {
            const nr = row + dr;
            const nc = col + dc;
            const b = getBubble(nr, nc);
            if (b) {
                neighbors.push({ row: nr, col: nc, bubble: b });
            }
        }
        return neighbors;
    }

    // ============ 关卡初始化 ============
    function initLevel(levelNum) {
        const level = LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];
        const availableColors = COLOR_NAMES.slice(0, level.colors);

        game.level = levelNum;
        game.grid = [];
        game.shots = 0;
        game.shotsWithoutPop = 0;
        game.score = 0;
        game.poppingBubbles = [];
        game.fallingBubbles = [];
        game.state = GameState.IDLE;

        for (let row = 0; row < level.rows; row++) {
            game.grid[row] = [];
            const colsInRow = game.cols - (row % 2 === 1 ? 1 : 0);
            for (let col = 0; col < colsInRow; col++) {
                let type = SPECIAL.NORMAL;
                let color;

                const rand = Math.random();
                if (rand < level.stoneChance && row > 1) {
                    type = SPECIAL.STONE;
                    color = STONE_COLOR;
                } else if (rand < level.stoneChance + level.bombChance) {
                    type = SPECIAL.BOMB;
                    color = COLORS[availableColors[Math.floor(Math.random() * availableColors.length)]];
                } else {
                    color = COLORS[availableColors[Math.floor(Math.random() * availableColors.length)]];
                }

                setBubble(row, col, new Bubble(row, col, color, type));
            }
        }

        game.currentBubble = createRandomBubble(availableColors);
        game.nextBubble = createRandomBubble(availableColors);

        updateHUD();
    }

    function createRandomBubble(availableColors) {
        const bubble = new Bubble(-1, -1, '');
        const rand = Math.random();

        if (rand < 0.05) {
            bubble.type = SPECIAL.RAINBOW;
            bubble.color = '#ffffff';
        } else {
            const colors = availableColors || COLOR_NAMES.slice(0, LEVELS[Math.min(game.level - 1, LEVELS.length - 1)].colors);
            bubble.type = SPECIAL.NORMAL;
            bubble.color = COLORS[colors[Math.floor(Math.random() * colors.length)]];
        }

        return bubble;
    }

    function getAvailableColors() {
        const level = LEVELS[Math.min(game.level - 1, LEVELS.length - 1)];
        return COLOR_NAMES.slice(0, level.colors);
    }

    // ============ 发射气泡 ============
    function shootBubble() {
        if (game.state !== GameState.IDLE) return;
        if (!game.currentBubble) return;

        game.flyingBubble = {
            x: SHOOTER_X,
            y: SHOOTER_Y,
            vx: Math.cos(game.shooterAngle) * SHOOT_SPEED,
            vy: -Math.sin(game.shooterAngle) * SHOOT_SPEED,
            bubble: game.currentBubble,
            curveAmount: (Math.random() - 0.5) * 0.3,
            curvePhase: 0,
            frames: 0,
            maxFrames: 800
        };

        game.flyingBubble.bubble.x = game.flyingBubble.x;
        game.flyingBubble.bubble.y = game.flyingBubble.y;

        game.state = GameState.SHOOTING;
        game.shots++;
        game.shotsWithoutPop++;
        updateHUD();

        game.currentBubble = game.nextBubble;
        game.nextBubble = createRandomBubble(getAvailableColors());
    }

    // ============ 更新飞行气泡 ============
    function updateFlyingBubble() {
        if (!game.flyingBubble) return;

        const fb = game.flyingBubble;
        fb.frames++;
        fb.curvePhase += 0.1;

        if (fb.frames > fb.maxFrames) {
            snapToGrid(fb);
            return;
        }

        fb.x += fb.vx;
        fb.y += fb.vy;

        fb.vy += Math.sin(fb.curvePhase) * fb.curveAmount * 0.5;

        if (fb.x - BUBBLE_RADIUS <= 0) {
            fb.x = BUBBLE_RADIUS;
            fb.vx = Math.abs(fb.vx);
        } else if (fb.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
            fb.x = CANVAS_WIDTH - BUBBLE_RADIUS;
            fb.vx = -Math.abs(fb.vx);
        }

        if (fb.y - BUBBLE_RADIUS <= TOP_PADDING) {
            snapToGrid(fb);
            return;
        }

        const collision = checkBubbleCollision(fb);
        if (collision) {
            snapToGridAt(fb, collision.row, collision.col);
            return;
        }

        if (fb.y + BUBBLE_RADIUS >= RED_LINE_Y) {
            snapToGrid(fb);
            return;
        }

        fb.bubble.x = fb.x;
        fb.bubble.y = fb.y;
    }

    function checkBubbleCollision(fb) {
        const checkRows = Math.ceil(fb.y / ROW_HEIGHT) + 2;
        for (let row = 0; row < Math.min(checkRows, game.grid.length); row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                const b = game.grid[row][col];
                if (!b) continue;

                const dx = fb.x - b.x;
                const dy = fb.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < BUBBLE_DIAMETER - 2) {
                    return { row, col, bubble: b };
                }
            }
        }
        return null;
    }

    function snapToGrid(fb) {
        let bestRow = -1;
        let bestCol = -1;
        let bestDist = Infinity;

        const approxRow = Math.max(0, Math.floor((fb.y - TOP_PADDING - BUBBLE_RADIUS) / ROW_HEIGHT + 0.5));
        const searchRange = 3;
        const minRow = Math.max(0, approxRow - searchRange);
        const maxRow = Math.min(approxRow + searchRange, game.grid.length + 2);

        for (let row = minRow; row <= maxRow; row++) {
            const colsInRow = game.cols - (row % 2 === 1 ? 1 : 0);
            for (let col = 0; col < colsInRow; col++) {
                if (getBubble(row, col)) continue;

                const ex = LEFT_PADDING + col * BUBBLE_DIAMETER + (row % 2 === 1 ? BUBBLE_RADIUS : 0);
                const ey = TOP_PADDING + row * ROW_HEIGHT + BUBBLE_RADIUS;

                const dx = fb.x - ex;
                const dy = fb.y - ey;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const hasValidNeighbor = row === 0 || getNeighbors(row, col).length > 0;
                if (!hasValidNeighbor) continue;

                if (dist < bestDist) {
                    bestDist = dist;
                    bestRow = row;
                    bestCol = col;
                }
            }
        }

        if (bestRow >= 0 && bestCol >= 0) {
            snapToGridAt(fb, bestRow, bestCol);
            return;
        }

        for (let row = 0; row < game.grid.length + 3; row++) {
            const colsInRow = game.cols - (row % 2 === 1 ? 1 : 0);
            for (let col = 0; col < colsInRow; col++) {
                if (getBubble(row, col)) continue;
                const hasValidNeighbor = row === 0 || getNeighbors(row, col).length > 0;
                if (!hasValidNeighbor) continue;

                const ex = LEFT_PADDING + col * BUBBLE_DIAMETER + (row % 2 === 1 ? BUBBLE_RADIUS : 0);
                const ey = TOP_PADDING + row * ROW_HEIGHT + BUBBLE_RADIUS;
                const dx = fb.x - ex;
                const dy = fb.y - ey;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestRow = row;
                    bestCol = col;
                }
            }
        }

        if (bestRow >= 0 && bestCol >= 0) {
            snapToGridAt(fb, bestRow, bestCol);
            return;
        }

        for (let row = 0; row < game.grid.length + 5; row++) {
            const colsInRow = game.cols - (row % 2 === 1 ? 1 : 0);
            for (let col = 0; col < colsInRow; col++) {
                if (getBubble(row, col)) continue;
                snapToGridAt(fb, row, col);
                return;
            }
        }

        game.flyingBubble = null;
        game.state = GameState.IDLE;
    }

    function snapToGridAt(fb, row, col) {
        if (getBubble(row, col)) {
            findEmptySpotAndSnap(fb, row);
            return;
        }
        const bubble = fb.bubble;
        setBubble(row, col, bubble);
        game.flyingBubble = null;

        handlePlacement(row, col);
    }

    function findEmptySpotAndSnap(fb, startRow) {
        const maxRow = Math.max(startRow + 5, game.grid.length + 3);
        for (let row = 0; row < maxRow; row++) {
            const colsInRow = game.cols - (row % 2 === 1 ? 1 : 0);
            for (let col = 0; col < colsInRow; col++) {
                if (!getBubble(row, col)) {
                    const bubble = fb.bubble;
                    setBubble(row, col, bubble);
                    game.flyingBubble = null;
                    handlePlacement(row, col);
                    return;
                }
            }
        }
        game.flyingBubble = null;
        game.state = GameState.IDLE;
    }

    // ============ 放置后处理 ============
    function handlePlacement(row, col) {
        const placedBubble = getBubble(row, col);
        if (!placedBubble) return;

        let toPop = [];

        if (placedBubble.type === SPECIAL.BOMB) {
            toPop = [{ row, col, bubble: placedBubble }];
            const neighbors = getNeighbors(row, col);
            for (const n of neighbors) {
                toPop.push(n);
                const n2 = getNeighbors(n.row, n.col);
                for (const nn of n2) {
                    if (!toPop.find(t => t.row === nn.row && t.col === nn.col)) {
                        toPop.push(nn);
                    }
                }
            }
        } else {
            toPop = findMatchCluster(row, col);
        }

        if (toPop.length >= 3 || placedBubble.type === SPECIAL.BOMB) {
            const matchScore = toPop.length * (MATCH_SCORE_BASE / 3);
            game.score += Math.floor(matchScore * (toPop.length >= 5 ? 2 : 1));
            game.shotsWithoutPop = 0;

            for (const t of toPop) {
                const b = getBubble(t.row, t.col);
                if (b) {
                    b.popProgress = 0;
                    game.poppingBubbles.push(b);
                    setBubble(t.row, t.col, null);
                }
            }

            game.state = GameState.ANIMATING;
            const _animLevel = game.level;
            setTimeout(() => {
                if (game.state !== GameState.ANIMATING || game.level !== _animLevel) return;
                dropFloatingBubbles();
            }, 300);
        } else {
            checkPressureRow();
            afterPlacementCheck();
        }
    }

    function findMatchCluster(row, col) {
        const start = getBubble(row, col);
        if (!start) return [];

        const matchColor = start.type === SPECIAL.RAINBOW ? null : start.color;
        const isRainbow = start.type === SPECIAL.RAINBOW;

        const visited = new Set();
        const cluster = [];
        const queue = [{ row, col }];

        while (queue.length > 0) {
            const { row: r, col: c } = queue.shift();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const b = getBubble(r, c);
            if (!b) continue;

            let matches = false;
            if (b.type === SPECIAL.STONE) continue;

            if (r === row && c === col) {
                matches = true;
            } else if (b.type === SPECIAL.RAINBOW) {
                matches = true;
            } else if (isRainbow) {
                matches = true;
            } else {
                matches = b.color === matchColor;
            }

            if (!matches) continue;

            cluster.push({ row: r, col: c, bubble: b });

            const neighbors = getNeighbors(r, c);
            for (const n of neighbors) {
                if (!visited.has(`${n.row},${n.col}`)) {
                    queue.push({ row: n.row, col: n.col });
                }
            }
        }

        return cluster;
    }

    // ============ 漂浮气泡掉落 ============
    function dropFloatingBubbles() {
        const attached = new Set();
        const queue = [];

        if (game.grid[0]) {
            for (let col = 0; col < game.grid[0].length; col++) {
                if (getBubble(0, col)) {
                    queue.push({ row: 0, col });
                    attached.add(`0,${col}`);
                }
            }
        }

        while (queue.length > 0) {
            const { row, col } = queue.shift();
            const neighbors = getNeighbors(row, col);
            for (const n of neighbors) {
                const key = `${n.row},${n.col}`;
                if (!attached.has(key)) {
                    attached.add(key);
                    queue.push({ row: n.row, col: n.col });
                }
            }
        }

        let dropCount = 0;
        for (let row = 0; row < game.grid.length; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                const b = getBubble(row, col);
                if (!b) continue;
                const key = `${row},${col}`;
                if (!attached.has(key)) {
                    b.fallVelX = (Math.random() - 0.5) * 4;
                    b.fallVelY = Math.random() * 2;
                    b.rotationSpeed = (Math.random() - 0.5) * 0.3;
                    game.fallingBubbles.push(b);
                    setBubble(row, col, null);
                    dropCount++;
                }
            }
        }

        if (dropCount > 0) {
            game.score += dropCount * DROP_SCORE;
        }

        const _animLevel = game.level;
        const _animState = game.state;
        setTimeout(() => {
            if (game.state !== _animState || game.level !== _animLevel) return;
            checkPressureRow();
            afterPlacementCheck();
        }, 450);
    }

    // ============ 加压行检查 ============
    function checkPressureRow() {
        if (game.shotsWithoutPop >= 5) {
            game.shotsWithoutPop = 0;
            addPressureRow();
        }
    }

    function addPressureRow() {
        const level = LEVELS[Math.min(game.level - 1, LEVELS.length - 1)];
        const availableColors = COLOR_NAMES.slice(0, level.colors);

        const tempBubbles = [];
        for (let i = 0; i < game.grid.length; i++) {
            if (!game.grid[i]) continue;
            for (let j = 0; j < game.grid[i].length; j++) {
                const b = game.grid[i][j];
                if (b) {
                    tempBubbles.push({
                        bubble: b,
                        newRow: i + 1,
                        origX: b.x
                    });
                }
            }
        }

        const rowBuckets = {};
        for (const item of tempBubbles) {
            if (!rowBuckets[item.newRow]) rowBuckets[item.newRow] = [];
            rowBuckets[item.newRow].push(item);
        }

        const newGrid = [];
        for (const rowStr in rowBuckets) {
            const row = parseInt(rowStr);
            const colsInRow = game.cols - (row % 2 === 1 ? 1 : 0);
            const items = rowBuckets[row].sort((a, b) => a.origX - b.origX);
            if (!newGrid[row]) newGrid[row] = [];

            for (let i = 0; i < Math.min(items.length, colsInRow); i++) {
                const b = items[i].bubble;
                newGrid[row][i] = b;
                b.row = row;
                b.col = i;
            }
        }

        const firstRow = [];
        const colsInFirstRow = game.cols;
        for (let col = 0; col < colsInFirstRow; col++) {
            let type = SPECIAL.NORMAL;
            let color;

            const rand = Math.random();
            if (rand < level.stoneChance * 0.5) {
                type = SPECIAL.STONE;
                color = STONE_COLOR;
            } else if (rand < level.stoneChance * 0.5 + level.bombChance) {
                type = SPECIAL.BOMB;
                color = COLORS[availableColors[Math.floor(Math.random() * availableColors.length)]];
            } else {
                color = COLORS[availableColors[Math.floor(Math.random() * availableColors.length)]];
            }

            firstRow.push(new Bubble(0, col, color, type));
        }
        newGrid[0] = firstRow;

        let maxRow = 0;
        for (const r in newGrid) {
            maxRow = Math.max(maxRow, parseInt(r));
        }
        while (newGrid.length <= maxRow) {
            if (!newGrid[newGrid.length]) newGrid.push([]);
        }

        game.grid = newGrid;

        for (let row = 0; row < game.grid.length; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                const b = game.grid[row][col];
                if (b) {
                    b.row = row;
                    b.col = col;
                    b.updatePosition();
                }
            }
        }
    }

    // ============ 放置后检查 ============
    function afterPlacementCheck() {
        updateHUD();

        if (checkGameOver()) {
            game.state = GameState.GAMEOVER;
            showGameOver();
            return;
        }

        if (checkLevelComplete()) {
            game.state = GameState.LEVELCOMPLETE;
            game.totalScore += game.score;
            if (game.level >= LEVELS.length) {
                showGameComplete();
            } else {
                showLevelComplete();
            }
            return;
        }

        game.state = GameState.IDLE;
    }

    function checkGameOver() {
        for (let row = 0; row < game.grid.length; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                const b = getBubble(row, col);
                if (b) {
                    b.updatePosition();
                    if (b.y + BUBBLE_RADIUS >= RED_LINE_Y - 5) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function checkLevelComplete() {
        for (let row = 0; row < game.grid.length; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                if (getBubble(row, col)) return false;
            }
        }
        return true;
    }

    // ============ 动画更新 ============
    function updateAnimations() {
        game.poppingBubbles = game.poppingBubbles.filter(b => {
            b.popProgress += 1 / 18;
            b.alpha = 1 - b.popProgress;
            b.scale = 1 - b.popProgress * 0.5;
            if (b.popProgress >= 1) {
                return false;
            }
            return true;
        });

        game.fallingBubbles = game.fallingBubbles.filter(b => {
            b.fallVelY += 0.5;
            b.x += b.fallVelX;
            b.y += b.fallVelY;
            b.rotation += b.rotationSpeed;
            if (b.y > CANVAS_HEIGHT + 50) {
                return false;
            }
            return true;
        });
    }

    // ============ 绘制函数 ============
    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#0a0f2e');
        gradient.addColorStop(0.5, '#12184a');
        gradient.addColorStop(1, '#1a1a50');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 40; i++) {
            const x = (i * 137.5) % CANVAS_WIDTH;
            const y = (i * 89.3) % (CANVAS_HEIGHT * 0.7);
            const size = (i % 3 === 0) ? 1.5 : 1;
            const alpha = 0.3 + Math.sin(Date.now() / 1000 + i) * 0.2;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawRedLine() {
        ctx.save();
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, RED_LINE_Y);
        ctx.lineTo(CANVAS_WIDTH, RED_LINE_Y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('⚠ 警戒线', 8, RED_LINE_Y - 6);
    }

    function drawGridBubbles() {
        for (let row = 0; row < game.grid.length; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                const b = getBubble(row, col);
                if (b) b.draw(ctx);
            }
        }
    }

    function drawPoppingBubbles() {
        for (const b of game.poppingBubbles) {
            b.draw(ctx);
        }
    }

    function drawFallingBubbles() {
        for (const b of game.fallingBubbles) {
            b.draw(ctx);
        }
    }

    function drawShooter() {
        const angle = game.shooterAngle;

        drawAimLine();

        ctx.save();
        ctx.translate(SHOOTER_X, SHOOTER_Y);

        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();

        const baseGradient = ctx.createRadialGradient(0, 5, 5, 0, 0, 38);
        baseGradient.addColorStop(0, '#667eea');
        baseGradient.addColorStop(1, '#434a9e');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 36, Math.PI, 0, false);
        ctx.lineTo(36, 8);
        ctx.quadraticCurveTo(0, 18, -36, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.rotate(Math.PI / 2 - angle);
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.roundRect(-6, -48, 12, 38, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#a78bfa';
        ctx.beginPath();
        ctx.roundRect(-4, -46, 8, 8, 3);
        ctx.fill();

        ctx.restore();

        if (game.currentBubble && game.state !== GameState.SHOOTING) {
            const tempB = Object.create(Object.getPrototypeOf(game.currentBubble));
            Object.assign(tempB, game.currentBubble);
            tempB.x = SHOOTER_X;
            tempB.y = SHOOTER_Y - 4;
            tempB.alpha = 1;
            tempB.scale = 1;
            tempB.rotation = 0;
            tempB.draw(ctx);
        }

        if (game.nextBubble) {
            ctx.save();
            ctx.globalAlpha = 0.9;
            const previewX = SHOOTER_X + 65;
            const previewY = SHOOTER_Y - 10;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.arc(previewX, previewY, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('下一个', previewX, previewY - 30);

            const tempB = Object.create(Object.getPrototypeOf(game.nextBubble));
            Object.assign(tempB, game.nextBubble);
            tempB.x = previewX;
            tempB.y = previewY;
            tempB.alpha = 1;
            tempB.scale = 1;
            tempB.rotation = 0;
            tempB.draw(ctx);

            ctx.restore();
        }
    }

    function drawAimLine() {
        const angle = game.shooterAngle;
        const startX = SHOOTER_X;
        const startY = SHOOTER_Y - 30;

        let x = startX;
        let y = startY;
        let vx = Math.cos(angle) * 5;
        let vy = -Math.sin(angle) * 5;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -Date.now() / 50;

        ctx.beginPath();
        ctx.moveTo(x, y);

        let segments = 0;
        let bounces = 0;
        let hit = false;

        while (segments < 150 && !hit) {
            x += vx;
            y += vy;

            if (x - BUBBLE_RADIUS <= 0) {
                x = BUBBLE_RADIUS;
                vx = Math.abs(vx);
                bounces++;
            } else if (x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
                x = CANVAS_WIDTH - BUBBLE_RADIUS;
                vx = -Math.abs(vx);
                bounces++;
            }

            if (y - BUBBLE_RADIUS <= TOP_PADDING) {
                hit = true;
            }

            for (let row = 0; row < game.grid.length && !hit; row++) {
                if (!game.grid[row]) continue;
                for (let col = 0; col < game.grid[row].length && !hit; col++) {
                    const b = game.grid[row][col];
                    if (!b) continue;
                    const dx = x - b.x;
                    const dy = y - b.y;
                    if (dx * dx + dy * dy < (BUBBLE_DIAMETER - 2) * (BUBBLE_DIAMETER - 2)) {
                        hit = true;
                    }
                }
            }

            if (segments % 3 === 0) {
                ctx.lineTo(x, y);
            }
            segments++;
        }

        ctx.lineTo(x, y);
        ctx.stroke();

        if (hit) {
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawFlyingBubble() {
        if (game.flyingBubble && game.flyingBubble.bubble) {
            game.flyingBubble.bubble.draw(ctx);
        }
    }

    function drawNoPopCounter() {
        const remaining = 5 - game.shotsWithoutPop;
        if (remaining <= 2) {
            ctx.save();
            ctx.fillStyle = remaining === 0 ? '#e74c3c' : '#f39c12';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'right';
            const warningText = remaining === 0 ? '⚠ 即将压行！' : `${remaining}发后压行`;
            ctx.fillText(warningText, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 100);
            ctx.restore();
        }
    }

    // ============ 主循环 ============
    let _loopCount = 0;
    let _lastState = null;
    let _stateFrames = 0;

    function gameLoop() {
        _loopCount++;
        if (_lastState !== game.state) {
            _lastState = game.state;
            _stateFrames = 0;
        } else {
            _stateFrames++;
        }

        if (game.state === GameState.SHOOTING && _stateFrames > 900) {
            console.warn('Shooting state stuck, recovering...');
            game.flyingBubble = null;
            game.state = GameState.IDLE;
        }
        if (game.state === GameState.ANIMATING && _stateFrames > 300) {
            console.warn('Animating state stuck, recovering...');
            game.state = GameState.IDLE;
            afterPlacementCheck();
        }

        handleInput();

        if (game.state === GameState.SHOOTING) {
            updateFlyingBubble();
        }

        updateAnimations();

        drawBackground();
        drawRedLine();
        drawGridBubbles();
        drawPoppingBubbles();
        drawFallingBubbles();
        drawFlyingBubble();
        drawShooter();
        drawNoPopCounter();

        requestAnimationFrame(gameLoop);
    }

    // ============ 输入处理 ============
    function handleInput() {
        if (game.state !== GameState.IDLE) return;

        if (game.keys['ArrowLeft'] || game.keys['KeyA']) {
            game.shooterAngle += ROTATE_SPEED;
            if (game.shooterAngle > MAX_ANGLE) game.shooterAngle = MAX_ANGLE;
        }
        if (game.keys['ArrowRight'] || game.keys['KeyD']) {
            game.shooterAngle -= ROTATE_SPEED;
            if (game.shooterAngle < MIN_ANGLE) game.shooterAngle = MIN_ANGLE;
        }
    }

    document.addEventListener('keydown', (e) => {
        game.keys[e.code] = true;

        if (e.code === 'Space') {
            e.preventDefault();
            shootBubble();
        }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (game.state !== GameState.IDLE) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const dx = mx - SHOOTER_X;
        const dy = SHOOTER_Y - my;
        let angle = Math.atan2(dy, dx);
        if (angle < MIN_ANGLE) angle = MIN_ANGLE;
        if (angle > MAX_ANGLE) angle = MAX_ANGLE;
        game.shooterAngle = angle;
    });

    canvas.addEventListener('click', () => {
        shootBubble();
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mx = (e.touches[0].clientX - rect.left) * scaleX;
            const my = (e.touches[0].clientY - rect.top) * scaleY;

            const dx = mx - SHOOTER_X;
            const dy = SHOOTER_Y - my;
            let angle = Math.atan2(dy, dx);
            if (angle < MIN_ANGLE) angle = MIN_ANGLE;
            if (angle > MAX_ANGLE) angle = MAX_ANGLE;
            game.shooterAngle = angle;
            shootBubble();
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (game.state !== GameState.IDLE) return;
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mx = (e.touches[0].clientX - rect.left) * scaleX;
            const my = (e.touches[0].clientY - rect.top) * scaleY;

            const dx = mx - SHOOTER_X;
            const dy = SHOOTER_Y - my;
            let angle = Math.atan2(dy, dx);
            if (angle < MIN_ANGLE) angle = MIN_ANGLE;
            if (angle > MAX_ANGLE) angle = MAX_ANGLE;
            game.shooterAngle = angle;
        }
    }, { passive: false });

    // ============ HUD ============
    function updateHUD() {
        document.getElementById('levelDisplay').textContent = game.level;
        document.getElementById('scoreDisplay').textContent = (game.score + game.totalScore).toLocaleString();
        document.getElementById('shotsDisplay').textContent = game.shots;

        let remaining = 0;
        for (let row = 0; row < game.grid.length; row++) {
            if (!game.grid[row]) continue;
            for (let col = 0; col < game.grid[row].length; col++) {
                if (getBubble(row, col)) remaining++;
            }
        }
        document.getElementById('remainingDisplay').textContent = remaining;
    }

    // ============ Modal 控制 ============
    function showLevelComplete() {
        document.getElementById('completedLevel').textContent = game.level;
        document.getElementById('levelShots').textContent = game.shots;
        document.getElementById('levelScore').textContent = game.score.toLocaleString();
        document.getElementById('totalScoreModal').textContent = game.totalScore.toLocaleString();
        document.getElementById('levelCompleteModal').classList.add('active');
    }

    function showGameComplete() {
        document.getElementById('finalTotalScore').textContent = game.totalScore.toLocaleString();
        document.getElementById('gameCompleteModal').classList.add('active');
    }

    function showGameOver() {
        document.getElementById('gameOverLevel').textContent = game.level;
        document.getElementById('gameOverScore').textContent = (game.score + game.totalScore).toLocaleString();
        document.getElementById('gameOverModal').classList.add('active');
    }

    function hideAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    function showToast(message, type = '') {
        const toast = document.getElementById('submitToast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        setTimeout(() => {
            toast.className = 'toast';
        }, 2500);
    }

    // ============ API 调用 ============
    const API_BASE = '/api';

    async function submitScore(playerName, score, level) {
        try {
            const res = await fetch(`${API_BASE}/bubble/submit_score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_name: playerName, score, level })
            });
            return await res.json();
        } catch (e) {
            return { code: 1, message: '网络错误' };
        }
    }

    async function getLeaderboard() {
        try {
            const res = await fetch(`${API_BASE}/bubble/leaderboard?limit=50`);
            return await res.json();
        } catch (e) {
            return { code: 1, message: '网络错误' };
        }
    }

    async function loadLeaderboard() {
        const listEl = document.getElementById('leaderboardList');
        listEl.innerHTML = '<div class="loading">加载中...</div>';

        const data = await getLeaderboard();

        if (data.code !== 0) {
            listEl.innerHTML = '<div class="empty">加载失败，请稍后重试</div>';
            return;
        }

        const items = data.data.items;
        if (items.length === 0) {
            listEl.innerHTML = '<div class="empty">暂无记录，快来创造第一名吧！</div>';
            return;
        }

        listEl.innerHTML = items.map(item => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : '';
            const rankClass = `rank-${item.rank}`;
            return `
                <div class="leaderboard-item ${item.rank <= 3 ? rankClass : ''}">
                    <div class="rank">${item.rank}</div>
                    <div class="player-info">
                        <div class="player-name">${escapeHtml(item.player_name)}</div>
                        <div class="player-meta">第${item.level}关 · ${dateStr}</div>
                    </div>
                    <div class="score">${item.score.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============ 按钮事件 ============
    document.getElementById('restartBtn').addEventListener('click', () => {
        game.totalScore = 0;
        initLevel(1);
        hideAllModals();
    });

    document.getElementById('leaderboardBtn').addEventListener('click', () => {
        loadLeaderboard();
        document.getElementById('leaderboardModal').classList.add('active');
    });

    document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
        hideAllModals();
    });

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        hideAllModals();
        initLevel(game.level + 1);
    });

    document.getElementById('playAgainBtn').addEventListener('click', () => {
        hideAllModals();
        game.totalScore = 0;
        initLevel(1);
    });

    document.getElementById('restartGameBtn').addEventListener('click', () => {
        hideAllModals();
        game.totalScore = 0;
        initLevel(1);
    });

    document.getElementById('submitScoreBtn').addEventListener('click', async () => {
        const nameInput = document.getElementById('playerNameInput');
        const name = nameInput.value.trim();
        if (!name) {
            showToast('请输入名字', 'error');
            return;
        }
        const btn = document.getElementById('submitScoreBtn');
        btn.disabled = true;
        const res = await submitScore(name, game.totalScore, game.level);
        btn.disabled = false;

        if (res.code === 0) {
            showToast('成绩提交成功！', 'success');
            nameInput.value = '';
            hideAllModals();
            loadLeaderboard();
            document.getElementById('leaderboardModal').classList.add('active');
        } else {
            showToast(res.message || '提交失败', 'error');
        }
    });

    document.getElementById('submitGameOverScoreBtn').addEventListener('click', async () => {
        const nameInput = document.getElementById('gameOverNameInput');
        const name = nameInput.value.trim();
        if (!name) {
            showToast('请输入名字', 'error');
            return;
        }
        const btn = document.getElementById('submitGameOverScoreBtn');
        btn.disabled = true;
        const totalScore = game.score + game.totalScore;
        const res = await submitScore(name, totalScore, game.level);
        btn.disabled = false;

        if (res.code === 0) {
            showToast('成绩提交成功！', 'success');
            nameInput.value = '';
            hideAllModals();
            loadLeaderboard();
            document.getElementById('leaderboardModal').classList.add('active');
        } else {
            showToast(res.message || '提交失败', 'error');
        }
    });

    // ============ roundRect polyfill ============
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (typeof r === 'number') r = [r, r, r, r];
            this.beginPath();
            this.moveTo(x + r[0], y);
            this.lineTo(x + w - r[1], y);
            this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
            this.lineTo(x + w, y + h - r[2]);
            this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
            this.lineTo(x + r[3], y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
            this.lineTo(x, y + r[0]);
            this.quadraticCurveTo(x, y, x + r[0], y);
            this.closePath();
            return this;
        };
    }

    // ============ 启动游戏 ============
    initLevel(1);
    gameLoop();

})();
