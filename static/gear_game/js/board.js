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
                if (!this.hasMatchAt(row, col)) {
                    break;
                }
            }
        }
        return gear;
    }

    hasMatchAt(row, col) {
        const gear = this.grid[row][col];
        if (!gear) return false;

        let horizontalCount = 1;
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row][c] && gear.matches(this.grid[row][c])) {
                horizontalCount++;
            } else break;
        }
        for (let c = col + 1; c < this.cols; c++) {
            if (this.grid[row][c] && gear.matches(this.grid[row][c])) {
                horizontalCount++;
            } else break;
        }

        if (horizontalCount >= 3) return true;

        let verticalCount = 1;
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r][col] && gear.matches(this.grid[r][col])) {
                verticalCount++;
            } else break;
        }
        for (let r = row + 1; r < this.rows; r++) {
            if (this.grid[r][col] && gear.matches(this.grid[r][col])) {
                verticalCount++;
            } else break;
        }

        return verticalCount >= 3;
    }

    getCellPosition(row, col) {
        return {
            left: this.padding + col * (this.cellSize + this.gap),
            top: this.padding + row * (this.cellSize + this.gap)
        };
    }

    render(container) {
        if (!this.container) {
            this.container = container;
        }
        container.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gear = this.grid[row][col];
                if (gear) {
                    this.attachGearElement(gear);
                }
            }
        }

        this.refreshVisualSelection();
    }

    attachGearElement(gear) {
        if (!this.container) return;

        if (gear.element && gear.element.parentNode) {
            gear.element.remove();
        }

        const element = gear.createElement();
        const pos = this.getCellPosition(gear.row, gear.col);
        element.style.left = `${pos.left}px`;
        element.style.top = `${pos.top}px`;
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleGearClick(gear.row, gear.col);
        });

        this.container.appendChild(element);
    }

    updateGearPosition(gear, animate = true) {
        if (!gear.element) return;

        const pos = this.getCellPosition(gear.row, gear.col);
        if (!animate) {
            gear.element.style.transition = 'none';
        }
        gear.element.style.left = `${pos.left}px`;
        gear.element.style.top = `${pos.top}px`;

        if (!animate) {
            void gear.element.offsetWidth;
            gear.element.style.transition = '';
        }
    }

    refreshVisualSelection() {
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
        } else {
            if (this.selectedGear.row === row && this.selectedGear.col === col) {
                this.deselectGear();
            } else if (this.areAdjacent(this.selectedGear, clickedGear)) {
                this.trySwap(this.selectedGear, clickedGear);
            } else {
                this.deselectGear();
                this.selectGear(row, col);
            }
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

    areAdjacent(gear1, gear2) {
        if (!gear1 || !gear2) return false;
        const rowDiff = Math.abs(gear1.row - gear2.row);
        const colDiff = Math.abs(gear1.col - gear2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    async trySwap(gear1, gear2) {
        this.isAnimating = true;

        const row1 = gear1.row;
        const col1 = gear1.col;
        const row2 = gear2.row;
        const col2 = gear2.col;

        this.swapGearsData(gear1, gear2);
        this.updateGearPosition(gear1, true);
        this.updateGearPosition(gear2, true);

        await this.delay(260);

        const matches = this.findMatches();

        if (matches.length > 0) {
            this.selectedGear = null;
            this.refreshVisualSelection();
            await this.processMatches();
            if (this.onMoveCallback) {
                this.onMoveCallback();
            }
        } else {
            this.swapGearsData(gear1, gear2);
            this.updateGearPosition(gear1, true);
            this.updateGearPosition(gear2, true);
            await this.delay(260);

            this.selectedGear = null;
            this.refreshVisualSelection();
            this.isAnimating = false;
            return false;
        }

        this.isAnimating = false;
        return true;
    }

    swapGearsData(gear1, gear2) {
        const row1 = gear1.row;
        const col1 = gear1.col;
        const row2 = gear2.row;
        const col2 = gear2.col;

        this.grid[row1][col1] = gear2;
        this.grid[row2][col2] = gear1;

        gear1.row = row2;
        gear1.col = col2;
        gear2.row = row1;
        gear2.col = col1;
    }

    findMatches() {
        const matches = [];
        const matched = new Set();

        for (let row = 0; row < this.rows; row++) {
            let col = 0;
            while (col < this.cols - 2) {
                const match = this.findHorizontalMatch(row, col);
                if (match.length >= 3) {
                    const key = match.map(g => `${g.row}-${g.col}`).join('|');
                    if (!matched.has(key)) {
                        match.forEach(g => matched.add(`${g.row}-${g.col}`));
                        matches.push(match);
                    }
                    col += match.length;
                } else {
                    col++;
                }
            }
        }

        for (let col = 0; col < this.cols; col++) {
            let row = 0;
            while (row < this.rows - 2) {
                const match = this.findVerticalMatch(row, col);
                if (match.length >= 3) {
                    const key = match.map(g => `${g.row}-${g.col}`).join('|');
                    if (!matched.has(key)) {
                        match.forEach(g => matched.add(`${g.row}-${g.col}`));
                        matches.push(match);
                    }
                    row += match.length;
                } else {
                    row++;
                }
            }
        }

        return matches;
    }

    findHorizontalMatch(row, col) {
        const match = [];
        const startGear = this.grid[row][col];
        if (!startGear) return match;

        match.push(startGear);

        for (let c = col + 1; c < this.cols; c++) {
            const gear = this.grid[row][c];
            if (gear && startGear.matches(gear)) {
                match.push(gear);
            } else {
                break;
            }
        }

        return match;
    }

    findVerticalMatch(row, col) {
        const match = [];
        const startGear = this.grid[row][col];
        if (!startGear) return match;

        match.push(startGear);

        for (let r = row + 1; r < this.rows; r++) {
            const gear = this.grid[r][col];
            if (gear && startGear.matches(gear)) {
                match.push(gear);
            } else {
                break;
            }
        }

        return match;
    }

    async processMatches() {
        let combo = 0;
        let totalScore = 0;

        while (true) {
            const matches = this.findMatches();
            if (matches.length === 0) break;

            combo++;

            if (this.onComboCallback) {
                this.onComboCallback(combo);
            }

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

            if (this.onScoreCallback) {
                this.onScoreCallback(scoreGained);
            }

            if (this.onShakeCallback) {
                this.onShakeCallback(combo);
            }

            for (const key of toRemove) {
                const [row, col] = key.split('-').map(Number);
                const gear = this.grid[row][col];
                if (gear) {
                    this.spawnParticles(gear, combo);
                }
            }

            await this.animateRemoval(toRemove);

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
                if (effect.type === 'explode') {
                    this.explodeAround(effect.gear, combo);
                }
            }

            await this.delay(80);

            await this.animateGravity();
            await this.delay(100);

            this.fillEmptySpacesAndAnimate();
            await this.delay(200);
        }

        return { score: totalScore, combo };
    }

    async animateRemoval(toRemove) {
        for (const key of toRemove) {
            const [row, col] = key.split('-').map(Number);
            const gear = this.grid[row][col];
            if (gear && gear.element) {
                const gearEl = gear.element.querySelector('.gear');
                if (gearEl) {
                    gearEl.style.transition = 'transform 0.25s ease-in, opacity 0.25s ease-in';
                    gearEl.style.transform = 'scale(1.3)';
                    gearEl.style.opacity = '0';
                }
            }
        }
        await this.delay(270);
    }

    async animateGravity() {
        const moves = [];

        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.grid[row][col]) {
                    for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                        if (this.grid[aboveRow][col]) {
                            const gear = this.grid[aboveRow][col];
                            moves.push({ gear, fromRow: aboveRow, toRow: row, col });
                            this.grid[row][col] = gear;
                            this.grid[aboveRow][col] = null;
                            gear.row = row;
                            break;
                        }
                    }
                }
            }
        }

        let maxDistance = 0;
        for (const { gear, fromRow, toRow } of moves) {
            this.updateGearPosition(gear, true);
            maxDistance = Math.max(maxDistance, Math.abs(toRow - fromRow));
        }

        if (maxDistance > 0) {
            await this.delay(150 * maxDistance + 50);
        }
    }

    fillEmptySpacesAndAnimate() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (!this.grid[row][col]) {
                    const newGear = this.createGearAtAvoidingMatches(row, col);
                    const pos = this.getCellPosition(row, col);
                    const abovePos = this.getCellPosition(-1 - (this.rows - row), col);

                    this.attachGearElement(newGear);
                    newGear.element.style.transition = 'none';
                    newGear.element.style.left = `${pos.left}px`;
                    newGear.element.style.top = `${abovePos.top}px`;

                    void newGear.element.offsetWidth;

                    newGear.element.style.transition = 'top 0.25s ease-in, left 0.25s ease-in';
                    this.updateGearPosition(newGear, true);
                }
            }
        }
    }

    explodeAround(gear, combo) {
        const row = gear.row;
        const col = gear.col;
        const toExplode = [];

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    const g = this.grid[nr][nc];
                    if (g) {
                        toExplode.push(g);
                    }
                }
            }
        }

        for (const g of toExplode) {
            this.spawnParticles(g, combo + 1);

            if (g.type === GearType.RUST) {
                const remaining = g.hitRust();
                if (remaining > 0) {
                    continue;
                }
            }

            if (this.onScoreCallback) {
                this.onScoreCallback(g.getScoreValue());
            }

            if (g.element) {
                const gearEl = g.element.querySelector('.gear');
                if (gearEl) {
                    gearEl.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
                    gearEl.style.transform = 'scale(1.4)';
                    gearEl.style.opacity = '0';
                }
                setTimeout(() => {
                    if (g.element && g.element.parentNode) {
                        g.element.remove();
                    }
                    g.element = null;
                }, 220);
            }
            this.grid[g.row][g.col] = null;
        }
    }

    spawnParticles(gear, combo) {
        if (!this.onParticlesCallback) return;

        const particleCount = Math.min(10 + combo * 5, 50);
        const color = gear.getColor();
        const pos = this.getCellPosition(gear.row, gear.col);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 3 + Math.random() * 5 + combo * 2;
            const size = 4 + Math.random() * 8;

            this.onParticlesCallback({
                x: pos.left + this.cellSize / 2,
                y: pos.top + this.cellSize / 2,
                color,
                angle,
                speed,
                size,
                combo
            });
        }
    }

    findPossibleMoves() {
        const moves = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (col < this.cols - 1) {
                    if (this.wouldMatch(row, col, row, col + 1)) {
                        moves.push([[row, col], [row, col + 1]]);
                    }
                }
                if (row < this.rows - 1) {
                    if (this.wouldMatch(row, col, row + 1, col)) {
                        moves.push([[row, col], [row + 1, col]]);
                    }
                }
            }
        }

        return moves;
    }

    wouldMatch(r1, c1, r2, c2) {
        const gear1 = this.grid[r1][c1];
        const gear2 = this.grid[r2][c2];

        if (!gear1 || !gear2) return false;

        this.grid[r1][c1] = gear2;
        this.grid[r2][c2] = gear1;
        gear1.row = r2;
        gear1.col = c2;
        gear2.row = r1;
        gear2.col = c1;

        const matches = this.findMatches();

        this.grid[r1][c1] = gear1;
        this.grid[r2][c2] = gear2;
        gear1.row = r1;
        gear1.col = c1;
        gear2.row = r2;
        gear2.col = c2;

        return matches.length > 0;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getGearAt(row, col) {
        return this.grid[row]?.[col];
    }

    setLevel(level) {
        this.level = level;
    }

    serialize() {
        const gridData = [];
        for (let row = 0; row < this.rows; row++) {
            gridData[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const gear = this.grid[row][col];
                if (gear) {
                    gridData[row][col] = {
                        color: gear.color,
                        type: gear.type,
                        rustLayers: gear.rustLayers
                    };
                } else {
                    gridData[row][col] = null;
                }
            }
        }
        return gridData;
    }

    deserialize(gridData) {
        this.init();
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const data = gridData[row]?.[col];
                if (data) {
                    const gear = new Gear(row, col, data.color, data.type);
                    if (data.rustLayers !== undefined) {
                        gear.rustLayers = data.rustLayers;
                    }
                    this.grid[row][col] = gear;
                }
            }
        }
    }

    async processInitialMatches() {
        let hasMatches = this.findMatches().length > 0;
        let loopCount = 0;

        while (hasMatches && loopCount < 50) {
            const matches = this.findMatches();
            if (matches.length === 0) break;

            const toRemove = new Set();
            for (const match of matches) {
                for (const gear of match) {
                    const key = `${gear.row}-${gear.col}`;
                    toRemove.add(key);
                }
            }

            for (const key of toRemove) {
                const [row, col] = key.split('-').map(Number);
                const gear = this.grid[row][col];
                if (gear && gear.element) {
                    gear.element.remove();
                    gear.element = null;
                }
                this.grid[row][col] = null;
            }

            this.applyGravitySync();
            this.fillEmptySpacesSync();
            this.syncAllPositions(false);
            await this.delay(50);

            hasMatches = this.findMatches().length > 0;
            loopCount++;
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
                            gear.col = col;
                            break;
                        }
                    }
                }
            }
        }
    }

    fillEmptySpacesSync() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.grid[row][col]) {
                    const newGear = this.createGearAtAvoidingMatches(row, col);
                    if (this.container) {
                        this.attachGearElement(newGear);
                    }
                }
            }
        }
    }

    syncAllPositions(animate = false) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gear = this.grid[row][col];
                if (gear && gear.element) {
                    this.updateGearPosition(gear, animate);
                }
            }
        }
    }

    findCellByPosition(row, col) {
        if (!this.container) return null;
        return this.container.querySelector(
            `.gear-cell[data-row="${row}"][data-col="${col}"]`
        );
    }
}
