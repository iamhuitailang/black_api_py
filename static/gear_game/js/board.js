class Board {
    constructor(rows = 8, cols = 8, level = 1) {
        this.rows = rows;
        this.cols = cols;
        this.level = level;
        this.grid = [];
        this.selectedGear = null;
        this.isAnimating = false;
        this.onScoreCallback = null;
        this.onComboCallback = null;
        this.onShakeCallback = null;
        this.onParticlesCallback = null;
        this.onMoveCallback = null;
        this.container = null;
        this.cellSize = 60;
        this.gap = 5;
        this.padding = 15;
        this.init();
    }

    init() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = null;
            }
        }
    }

    fillBoard() {
        this.init();
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.createGearAtAvoidingMatches(row, col);
            }
        }
    }

    createGearAt(row, col) {
        const color = Gear.getRandomColor();
        const type = Gear.getRandomType(this.level);
        const gear = new Gear(row, col, color, type);
        this.grid[row][col] = gear;
        return gear;
    }

    createGearAtAvoidingMatches(row, col) {
        let gear;
        let attempts = 0;
        do {
            gear = this.createGearAt(row, col);
            attempts++;
        } while (this.hasMatchAt(row, col) && attempts < 50);

        if (attempts >= 50) {
            const colors = Object.values(GearColor);
            for (const color of colors) {
                gear = new Gear(row, col, color, GearType.NORMAL);
                this.grid[row][col] = gear;
                if (!this.hasMatchAt(row, col)) break;
            }
        }
        return gear;
    }

    hasMatchAt(row, col) {
        const gear = this.grid[row][col];
        if (!gear) return false;

        let hCount = 1;
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row][c] && gear.matches(this.grid[row][c])) hCount++; else break;
        }
        for (let c = col + 1; c < this.cols; c++) {
            if (this.grid[row][c] && gear.matches(this.grid[row][c])) hCount++; else break;
        }
        if (hCount >= 3) return true;

        let vCount = 1;
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r][col] && gear.matches(this.grid[r][col])) vCount++; else break;
        }
        for (let r = row + 1; r < this.rows; r++) {
            if (this.grid[r][col] && gear.matches(this.grid[r][col])) vCount++; else break;
        }
        return vCount >= 3;
    }

    getTranslate(row, col) {
        return {
            x: col * (this.cellSize + this.gap),
            y: row * (this.cellSize + this.gap)
        };
    }

    render(container) {
        if (!this.container) this.container = container;
        container.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gear = this.grid[row][col];
                if (gear) this.attachGearElement(gear);
            }
        }
        this.refreshVisualSelection();
    }

    attachGearElement(gear) {
        if (!this.container) return;
        if (gear.element && gear.element.parentNode) gear.element.remove();

        const element = gear.createElement();
        const t = this.getTranslate(gear.row, gear.col);
        element.style.transform = `translate(${t.x}px, ${t.y}px)`;
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleGearClick(gear.row, gear.col);
        });
        this.container.appendChild(element);
    }

    updateGearPosition(gear, animate = true) {
        if (!gear.element) return;
        const t = this.getTranslate(gear.row, gear.col);
        if (!animate) {
            gear.element.classList.add('no-transition');
            void gear.element.offsetWidth;
        }
        gear.element.style.transform = `translate(${t.x}px, ${t.y}px)`;
        if (!animate) {
            void gear.element.offsetWidth;
            gear.element.classList.remove('no-transition');
        }
    }

    refreshVisualSelection() {
        if (!this.container) return;
        const cells = this.container.querySelectorAll('.gear-cell');
        cells.forEach(cell => cell.classList.remove('selected'));
        if (this.selectedGear && this.selectedGear.element) {
            this.selectedGear.element.classList.add('selected');
        }
    }

    handleGearClick(row, col) {
        if (this.isAnimating) return;
        const clickedGear = this.grid[row][col];
        if (!clickedGear) return;

        if (!this.selectedGear) {
            this.selectGear(row, col);
        } else if (this.selectedGear.row === row && this.selectedGear.col === col) {
            this.deselectGear();
        } else if (this.areAdjacent(this.selectedGear, clickedGear)) {
            this.trySwap(this.selectedGear, clickedGear);
        } else {
            this.deselectGear();
            this.selectGear(row, col);
        }
    }

    selectGear(row, col) {
        this.selectedGear = this.grid[row][col];
        this.refreshVisualSelection();
    }

    deselectGear() {
        this.selectedGear = null;
        this.refreshVisualSelection();
    }

    areAdjacent(g1, g2) {
        if (!g1 || !g2) return false;
        return (Math.abs(g1.row - g2.row) + Math.abs(g1.col - g2.col)) === 1;
    }

    async trySwap(gear1, gear2) {
        this.isAnimating = true;

        this.swapGearsData(gear1, gear2);
        this.updateGearPosition(gear1, true);
        this.updateGearPosition(gear2, true);
        await this.delay(240);

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.selectedGear = null;
            this.refreshVisualSelection();
            await this.processMatches();
            if (this.onMoveCallback) this.onMoveCallback();
        } else {
            this.swapGearsData(gear1, gear2);
            this.updateGearPosition(gear1, true);
            this.updateGearPosition(gear2, true);
            await this.delay(240);
            this.selectedGear = null;
            this.refreshVisualSelection();
            this.isAnimating = false;
            return false;
        }

        this.isAnimating = false;
        return true;
    }

    swapGearsData(g1, g2) {
        const r1 = g1.row, c1 = g1.col, r2 = g2.row, c2 = g2.col;
        this.grid[r1][c1] = g2;
        this.grid[r2][c2] = g1;
        g1.row = r2; g1.col = c2;
        g2.row = r1; g2.col = c1;
    }

    findMatches() {
        const matches = [];
        const matched = new Set();

        for (let row = 0; row < this.rows; row++) {
            let col = 0;
            while (col < this.cols - 2) {
                const m = this.findHorizontalMatch(row, col);
                if (m.length >= 3) {
                    const k = m.map(g => `${g.row}-${g.col}`).join('|');
                    if (!matched.has(k)) {
                        m.forEach(g => matched.add(`${g.row}-${g.col}`));
                        matches.push(m);
                    }
                    col += m.length;
                } else col++;
            }
        }

        for (let col = 0; col < this.cols; col++) {
            let row = 0;
            while (row < this.rows - 2) {
                const m = this.findVerticalMatch(row, col);
                if (m.length >= 3) {
                    const k = m.map(g => `${g.row}-${g.col}`).join('|');
                    if (!matched.has(k)) {
                        m.forEach(g => matched.add(`${g.row}-${g.col}`));
                        matches.push(m);
                    }
                    row += m.length;
                } else row++;
            }
        }
        return matches;
    }

    findHorizontalMatch(row, col) {
        const m = [];
        const s = this.grid[row][col];
        if (!s) return m;
        m.push(s);
        for (let c = col + 1; c < this.cols; c++) {
            const g = this.grid[row][c];
            if (g && s.matches(g)) m.push(g); else break;
        }
        return m;
    }

    findVerticalMatch(row, col) {
        const m = [];
        const s = this.grid[row][col];
        if (!s) return m;
        m.push(s);
        for (let r = row + 1; r < this.rows; r++) {
            const g = this.grid[r][col];
            if (g && s.matches(g)) m.push(g); else break;
        }
        return m;
    }

    async processMatches() {
        let combo = 0;
        let totalScore = 0;

        while (true) {
            const matches = this.findMatches();
            if (matches.length === 0) break;
            combo++;

            if (this.onComboCallback) this.onComboCallback(combo);

            const toRemove = new Set();
            const specialEffects = [];

            for (const match of matches) {
                for (const gear of match) {
                    const key = `${gear.row}-${gear.col}`;
                    if (!toRemove.has(key)) {
                        toRemove.add(key);
                        if (gear.type === GearType.COPPER) {
                            specialEffects.push({ type: 'explode', gear });
                        }
                    }
                }
            }

            let scoreGained = 0;
            for (const match of matches) {
                for (const gear of match) {
                    if (gear.type === GearType.RUST) {
                        const remaining = gear.hitRust();
                        if (remaining > 0) {
                            toRemove.delete(`${gear.row}-${gear.col}`);
                        } else {
                            scoreGained += gear.getScoreValue();
                        }
                    } else {
                        scoreGained += gear.getScoreValue();
                    }
                }
            }

            const comboMultiplier = 1 + (combo - 1) * 0.5;
            scoreGained = Math.floor(scoreGained * comboMultiplier);
            totalScore += scoreGained;

            if (this.onScoreCallback) this.onScoreCallback(scoreGained);
            if (this.onShakeCallback) this.onShakeCallback(combo);

            for (const key of toRemove) {
                const [row, col] = key.split('-').map(Number);
                const gear = this.grid[row][col];
                if (gear) this.spawnParticles(gear, combo);
            }

            this.animateRemoval(toRemove);
            await this.delay(200);

            for (const key of toRemove) {
                const [row, col] = key.split('-').map(Number);
                const gear = this.grid[row][col];
                if (gear && gear.element) {
                    gear.element.remove();
                    gear.element = null;
                }
                this.grid[row][col] = null;
            }

            for (const effect of specialEffects) {
                if (effect.type === 'explode') this.explodeAround(effect.gear, combo);
            }

            this.applyGravitySync();
            this.syncAllPositions(true);
            await this.delay(180);

            this.fillEmptySpacesSync();
            this.syncAllPositions(true);
            await this.delay(150);
        }

        return { score: totalScore, combo };
    }

    animateRemoval(toRemove) {
        for (const key of toRemove) {
            const [row, col] = key.split('-').map(Number);
            const gear = this.grid[row][col];
            if (gear && gear.element) {
                const gearEl = gear.element.querySelector('.gear');
                if (gearEl) {
                    gearEl.style.transition = 'transform 0.18s ease-in, opacity 0.18s ease-in';
                    gearEl.style.transform = 'scale(1.2)';
                    gearEl.style.opacity = '0';
                }
            }
        }
    }

    applyGravitySync() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.grid[row][col]) {
                    for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                        if (this.grid[aboveRow][col]) {
                            const gear = this.grid[aboveRow][col];
                            this.grid[row][col] = gear;
                            this.grid[aboveRow][col] = null;
                            gear.row = row;
                            break;
                        }
                    }
                }
            }
        }
    }

    fillEmptySpacesSync() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (!this.grid[row][col]) {
                    const newGear = this.createGearAtAvoidingMatches(row, col);
                    if (this.container) this.attachGearElement(newGear);
                }
            }
        }
    }

    syncAllPositions(animate = false) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gear = this.grid[row][col];
                if (gear && gear.element) this.updateGearPosition(gear, animate);
            }
        }
    }

    explodeAround(gear, combo) {
        const row = gear.row;
        const col = gear.col;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    const g = this.grid[nr][nc];
                    if (g) {
                        this.spawnParticles(g, combo + 1);
                        if (g.type === GearType.RUST) {
                            const remaining = g.hitRust();
                            if (remaining > 0) continue;
                        }
                        if (this.onScoreCallback) this.onScoreCallback(g.getScoreValue());
                        if (g.element) {
                            const gearEl = g.element.querySelector('.gear');
                            if (gearEl) {
                                gearEl.style.transition = 'transform 0.15s, opacity 0.15s';
                                gearEl.style.transform = 'scale(1.3)';
                                gearEl.style.opacity = '0';
                            }
                            setTimeout(() => {
                                if (g.element && g.element.parentNode) g.element.remove();
                                g.element = null;
                            }, 160);
                        }
                        this.grid[g.row][g.col] = null;
                    }
                }
            }
        }
    }

    spawnParticles(gear, combo) {
        if (!this.onParticlesCallback) return;
        const pos = this.getTranslate(gear.row, gear.col);
        const cx = pos.x + this.padding + this.cellSize / 2;
        const cy = pos.y + this.padding + this.cellSize / 2;
        const color = gear.getColor();
        const count = Math.min(6 + combo * 2, 20);

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 4 + combo;
            this.onParticlesCallback({ x: cx, y: cy, color, angle, speed, size: 3 + Math.random() * 5, combo });
        }
    }

    findPossibleMoves() {
        const moves = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (col < this.cols - 1 && this.wouldMatch(row, col, row, col + 1)) {
                    moves.push([[row, col], [row, col + 1]]);
                }
                if (row < this.rows - 1 && this.wouldMatch(row, col, row + 1, col)) {
                    moves.push([[row, col], [row + 1, col]]);
                }
            }
        }
        return moves;
    }

    wouldMatch(r1, c1, r2, c2) {
        const g1 = this.grid[r1][c1], g2 = this.grid[r2][c2];
        if (!g1 || !g2) return false;

        this.grid[r1][c1] = g2; this.grid[r2][c2] = g1;
        g1.row = r2; g1.col = c2; g2.row = r1; g2.col = c1;
        const has = this.findMatches().length > 0;
        this.grid[r1][c1] = g1; this.grid[r2][c2] = g2;
        g1.row = r1; g1.col = c1; g2.row = r2; g2.col = c2;
        return has;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getGearAt(row, col) { return this.grid[row]?.[col]; }
    setLevel(level) { this.level = level; }

    serialize() {
        const d = [];
        for (let row = 0; row < this.rows; row++) {
            d[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const g = this.grid[row][col];
                d[row][col] = g ? { color: g.color, type: g.type, rustLayers: g.rustLayers } : null;
            }
        }
        return d;
    }

    deserialize(gridData) {
        this.init();
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const data = gridData[row]?.[col];
                if (data) {
                    const gear = new Gear(row, col, data.color, data.type);
                    if (data.rustLayers !== undefined) gear.rustLayers = data.rustLayers;
                    this.grid[row][col] = gear;
                }
            }
        }
    }

    async processInitialMatches() {
        let loopCount = 0;
        while (this.findMatches().length > 0 && loopCount < 50) {
            const matches = this.findMatches();
            if (matches.length === 0) break;

            const toRemove = new Set();
            for (const match of matches) {
                for (const gear of match) toRemove.add(`${gear.row}-${gear.col}`);
            }

            for (const key of toRemove) {
                const [row, col] = key.split('-').map(Number);
                const gear = this.grid[row][col];
                if (gear && gear.element) { gear.element.remove(); gear.element = null; }
                this.grid[row][col] = null;
            }

            this.applyGravitySync();
            this.fillEmptySpacesSync();
            this.syncAllPositions(false);
            loopCount++;
        }
    }
}
