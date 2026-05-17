class Grid {
    constructor() {
        this.bubbles = new Map();
        this.rows = CONSTANTS.GRID_ROWS;
        this.cols = CONSTANTS.GRID_COLS;
    }
    
    getKey(row, col) {
        return `${row},${col}`;
    }
    
    addBubble(bubble) {
        const key = this.getKey(bubble.row, bubble.col);
        this.bubbles.set(key, bubble);
        return bubble;
    }
    
    removeBubble(bubble) {
        const key = this.getKey(bubble.row, bubble.col);
        this.bubbles.delete(key);
        return bubble;
    }
    
    getBubble(row, col) {
        const key = this.getKey(row, col);
        return this.bubbles.get(key) || null;
    }
    
    hasBubble(row, col) {
        return this.bubbles.has(this.getKey(row, col));
    }
    
    getAllBubbles() {
        return Array.from(this.bubbles.values());
    }
    
    getBubbleCount() {
        return this.bubbles.size;
    }
    
    getNeighbors(bubble) {
        const neighbors = [];
        const neighborPositions = Helpers.getNeighbors(bubble.row, bubble.col);
        
        for (const pos of neighborPositions) {
            const neighbor = this.getBubble(pos.row, pos.col);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }
    
    findConnectedBubbles(startBubble, matchColor = true) {
        const visited = new Set();
        const connected = [];
        const queue = [startBubble];
        const targetColor = startBubble.color;
        
        while (queue.length > 0) {
            const bubble = queue.shift();
            const key = this.getKey(bubble.row, bubble.col);
            
            if (visited.has(key)) continue;
            visited.add(key);
            connected.push(bubble);
            
            const neighbors = this.getNeighbors(bubble);
            for (const neighbor of neighbors) {
                const neighborKey = this.getKey(neighbor.row, neighbor.col);
                if (!visited.has(neighborKey)) {
                    if (!matchColor || neighbor.color === targetColor) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        
        return connected;
    }
    
    findMatches(bubble, threshold = CONSTANTS.MATCH_THRESHOLD) {
        const connected = this.findConnectedBubbles(bubble, true);
        return connected.length >= threshold ? connected : [];
    }
    
    findFloatingBubbles() {
        const visited = new Set();
        const floating = [];
        
        for (let col = 0; col < this.cols; col++) {
            const bubble = this.getBubble(0, col);
            if (bubble) {
                const connected = this.findConnectedBubbles(bubble, false);
                for (const b of connected) {
                    visited.add(this.getKey(b.row, b.col));
                }
            }
        }
        
        for (const bubble of this.getAllBubbles()) {
            const key = this.getKey(bubble.row, bubble.col);
            if (!visited.has(key)) {
                floating.push(bubble);
            }
        }
        
        return floating;
    }
    
    findEmptyPosition(x, y) {
        const gridPos = Helpers.pixelToGrid(x, y);
        let bestRow = gridPos.row;
        let bestCol = gridPos.col;
        let bestDist = Infinity;
        
        const isOddRow = gridPos.row % 2 === 1;
        
        const checkPositions = [
            { row: gridPos.row, col: gridPos.col },
            { row: gridPos.row, col: gridPos.col - 1 },
            { row: gridPos.row, col: gridPos.col + 1 },
            { row: gridPos.row - 1, col: isOddRow ? gridPos.col : gridPos.col - 1 },
            { row: gridPos.row - 1, col: isOddRow ? gridPos.col + 1 : gridPos.col },
            { row: gridPos.row + 1, col: isOddRow ? gridPos.col : gridPos.col - 1 },
            { row: gridPos.row + 1, col: isOddRow ? gridPos.col + 1 : gridPos.col }
        ];
        
        for (const pos of checkPositions) {
            if (pos.row >= 0 && pos.col >= 0 && pos.col < this.cols) {
                if (!this.hasBubble(pos.row, pos.col)) {
                    const posPixel = Helpers.gridToPixel(pos.row, pos.col);
                    const dist = Helpers.distance(x, y, posPixel.x, posPixel.y);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestRow = pos.row;
                        bestCol = pos.col;
                    }
                }
            }
        }
        
        return { row: bestRow, col: bestCol, distance: bestDist };
    }
    
    findNearestBubble(x, y, maxDistance = CONSTANTS.BUBBLE_DIAMETER * 1.5) {
        let nearest = null;
        let nearestDist = maxDistance;
        
        for (const bubble of this.getAllBubbles()) {
            const dist = Helpers.distance(x, y, bubble.x, bubble.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = bubble;
            }
        }
        
        return nearest;
    }
    
    getTopRow() {
        let topRow = this.rows;
        for (const bubble of this.getAllBubbles()) {
            if (bubble.row < topRow) {
                topRow = bubble.row;
            }
        }
        return topRow;
    }
    
    getBottomRow() {
        let bottomRow = -1;
        for (const bubble of this.getAllBubbles()) {
            if (bubble.row > bottomRow) {
                bottomRow = bubble.row;
            }
        }
        return bottomRow;
    }
    
    addRow(fromTop = false) {
        const direction = fromTop ? 1 : -1;
        const newBubbles = new Map();
        
        for (const bubble of this.getAllBubbles()) {
            const newRow = bubble.row + 1;
            if (newRow < this.rows) {
                bubble.row = newRow;
                bubble.setPositionFromGrid();
                newBubbles.set(this.getKey(bubble.row, bubble.col), bubble);
            }
        }
        
        this.bubbles = newBubbles;
    }
    
    getBubblesInRadius(centerBubble, radius) {
        const bubbles = [];
        const centerPos = Helpers.gridToPixel(centerBubble.row, centerBubble.col);
        
        for (const bubble of this.getAllBubbles()) {
            const dist = Helpers.distance(centerPos.x, centerPos.y, bubble.x, bubble.y);
            if (dist <= radius * CONSTANTS.BUBBLE_DIAMETER) {
                bubbles.push(bubble);
            }
        }
        
        return bubbles;
    }
    
    clear() {
        this.bubbles.clear();
    }
    
    isEmpty() {
        return this.bubbles.size === 0;
    }
    
    update(deltaTime) {
        const toRemove = [];
        
        for (const bubble of this.getAllBubbles()) {
            const shouldRemove = bubble.update(deltaTime);
            if (shouldRemove) {
                toRemove.push(bubble);
            }
        }
        
        for (const bubble of toRemove) {
            this.removeBubble(bubble);
        }
        
        return toRemove.length > 0;
    }
    
    serialize() {
        return {
            bubbles: this.getAllBubbles().map(b => b.serialize())
        };
    }
    
    static deserialize(data) {
        const grid = new Grid();
        for (const bubbleData of data.bubbles) {
            const bubble = Bubble.deserialize(bubbleData);
            grid.addBubble(bubble);
        }
        return grid;
    }
}
