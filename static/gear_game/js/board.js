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
        do {
            this.init();
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    this.createGearAt(row, col);
                }
            }
        } while (this.findMatches().length > 0);
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
                if (!this.hasMatchAt(row, col)) {
                    this.grid[row][col] = gear;
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

    render(container) {
        container.innerHTML = '';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gear = this.grid[row][col];
                if (gear) {
                    const element = gear.createElement();
                    element.addEventListener('click', () => this.handleGearClick(row, col));
                    container.appendChild(element);
                }
            }
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
        if (this.selectedGear && this.selectedGear.element) {
            this.selectedGear.element.classList.add('selected');
        }
    }

    deselectGear() {
        if (this.selectedGear && this.selectedGear.element) {
            this.selectedGear.element.classList.remove('selected');
        }
        this.selectedGear = null;
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

        this.swapGears(gear1, gear2);

        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.deselectGear();
            await this.processMatches();
        } else {
            await this.swapGears(gear1, gear2);
            this.deselectGear();
            this.isAnimating = false;
            return false;
        }

        this.isAnimating = false;
        return true;
    }

    swapGears(gear1, gear2) {
        const row1 = gear1.row;
        const col1 = gear1.col;
        const row2 = gear2.row;
        const col2 = gear2.col;

        this.grid[row1][col1] = gear2;
        this.grid[row2][col2] = gear1;

        gear1.updatePosition(row2, col2);
        gear2.updatePosition(row1, col1);

        if (gear1.element && gear2.element) {
            const tempRow1 = gear1.element.style.gridRow;
            const tempCol1 = gear1.element.style.gridColumn;
            gear1.element.style.gridRow = gear2.element.style.gridRow;
            gear1.element.style.gridColumn = gear2.element.style.gridColumn;
            gear2.element.style.gridRow = tempRow1;
            gear2.element.style.gridColumn = tempCol1;

            const parent = gear1.element.parentNode;
            const nextSibling = gear1.element.nextSibling;
            
            gear2.element.remove();
            gear1.element.remove();
            
            if (nextSibling === gear2.element) {
                parent.insertBefore(gear1.element, gear2.element);
                parent.insertBefore(gear2.element, gear1.element.nextSibling);
            } else {
                parent.insertBefore(gear2.element, nextSibling);
                parent.insertBefore(gear1.element, gear2.element.nextSibling);
            }
        }
    }

    findMatches() {
        const matches = [];
        const matched = new Set();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - 2; col++) {
                const match = this.findHorizontalMatch(row, col);
                if (match.length >= 3) {
                    match.forEach(g => matched.add(`${g.row}-${g.col}`));
                    matches.push(match);
                    col += match.length - 1;
                }
            }
        }

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows - 2; row++) {
                const match = this.findVerticalMatch(row, col);
                if (match.length >= 3) {
                    match.forEach(g => matched.add(`${g.row}-${g.col}`));
                    matches.push(match);
                    row += match.length - 1;
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

            await this.removeGears(toRemove);

            for (const effect of specialEffects) {
                if (effect.type === 'explode') {
                    await this.explodeAround(effect.gear, combo);
                }
            }

            await this.applyGravity();

            await this.fillEmptySpaces();

            await this.delay(300);
        }

        return { score: totalScore, combo };
    }

    async removeGears(toRemove) {
        const promises = [];
        
        for (const key of toRemove) {
            const [row, col] = key.split('-').map(Number);
            const gear = this.grid[row][col];
            
            if (gear && gear.element) {
                gear.element.querySelector('.gear').classList.add('gear-matching');
                
                const promise = new Promise(resolve => {
                    setTimeout(() => {
                        if (gear.element && gear.element.parentNode) {
                            gear.element.remove();
                        }
                        this.grid[row][col] = null;
                        resolve();
                    }, 300);
                });
                promises.push(promise);
            } else {
                this.grid[row][col] = null;
            }
        }

        await Promise.all(promises);
    }

    async explodeAround(gear, combo) {
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

            if (g.element) {
                g.element.querySelector('.gear').classList.add('gear-matching');
            }

            if (this.onScoreCallback) {
                this.onScoreCallback(g.getScoreValue());
            }
        }

        await this.delay(300);

        for (const g of toExplode) {
            if (g.type !== GearType.RUST || g.rustLayers <= 0) {
                if (g.element && g.element.parentNode) {
                    g.element.remove();
                }
                this.grid[g.row][g.col] = null;
            }
        }
    }

    spawnParticles(gear, combo) {
        if (!this.onParticlesCallback) return;
        
        const particleCount = Math.min(10 + combo * 5, 50);
        const color = gear.getColor();
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 3 + Math.random() * 5 + combo * 2;
            const size = 4 + Math.random() * 8;
            
            this.onParticlesCallback({
                x: gear.col * 65 + 30,
                y: gear.row * 65 + 30,
                color,
                angle,
                speed,
                size,
                combo
            });
        }
    }

    async applyGravity() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.grid[row][col]) {
                    for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                        if (this.grid[aboveRow][col]) {
                            const gear = this.grid[aboveRow][col];
                            this.grid[row][col] = gear;
                            this.grid[aboveRow][col] = null;
                            gear.updatePosition(row, col);
                            
                            if (gear.element) {
                                gear.element.querySelector('.gear').classList.add('gear-falling');
                                setTimeout(() => {
                                    gear.element.querySelector('.gear').classList.remove('gear-falling');
                                }, 300);
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        await this.delay(200);
    }

    async fillEmptySpaces() {
        const container = document.getElementById('game-board');
        
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.grid[row][col]) {
                    const gear = this.createGearAtAvoidingMatches(row, col);
                    const element = gear.createElement();
                    element.addEventListener('click', () => this.handleGearClick(row, col));
                    element.querySelector('.gear').classList.add('gear-falling');
                    
                    container.appendChild(element);
                    
                    setTimeout(() => {
                        element.querySelector('.gear').classList.remove('gear-falling');
                    }, 300);
                }
            }
        }
        
        await this.delay(300);
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
        
        const matches = this.findMatches();
        
        this.grid[r1][c1] = gear1;
        this.grid[r2][c2] = gear2;
        
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
}
