class GameRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.ants = new Map();
        this.antRenderList = [];
        this.cells = [];
        this.cellMap = {};
        this.season = 'spring';
        this.animationFrame = 0;
        this.lastTime = 0;
        this.isRunning = false;
        this.smoothingFactor = 0.1;
        
        this.cellColors = {
            dirt: { fill: '#5d4e37', border: '#4a3f2c' },
            tunnel: { fill: '#2d2d2d', border: '#222' },
            chamber: { fill: '#3d3d3d', border: '#333' },
            farm: { fill: '#3d5c3d', border: '#2d4a2d' },
            storage: { fill: '#5c4a3d', border: '#4a3a2d' },
            queen_chamber: { fill: '#5c3d5c', border: '#4a2d4a' },
            surface: { fill: '#6b8e23', border: '#556b2f' },
        };

        this.antColors = {
            queen: '#9c27b0',
            worker: '#8b4513',
            soldier: '#c62828',
            scout: '#1565c0',
        };
    }

    setGameData(gameData) {
        if (!gameData) return;
        
        this.gridWidth = gameData.grid_width || 20;
        this.gridHeight = gameData.grid_height || 15;
        this.cellSize = gameData.cell_size || 40;
        this.cells = gameData.cells || [];
        
        if (gameData.save) {
            this.season = gameData.save.season || 'spring';
        }
        
        this.cellMap = {};
        for (const cell of this.cells) {
            this.cellMap[`${cell.grid_x},${cell.grid_y}`] = cell;
        }
        
        this._updateAnts(gameData.ants || []);
        
        this.resize();
    }

    _updateAnts(serverAnts) {
        const seenIds = new Set();
        
        for (const serverAnt of serverAnts) {
            seenIds.add(serverAnt.id);
            
            if (this.ants.has(serverAnt.id)) {
                const localAnt = this.ants.get(serverAnt.id);
                localAnt.targetX = serverAnt.x;
                localAnt.targetY = serverAnt.y;
                localAnt.targetTargetX = serverAnt.target_x;
                localAnt.targetTargetY = serverAnt.target_y;
                localAnt.ant_type = serverAnt.ant_type;
                localAnt.state = serverAnt.state;
                localAnt.health = serverAnt.health;
                localAnt.energy = serverAnt.energy;
                localAnt.carrying = serverAnt.carrying;
                localAnt.carrying_amount = serverAnt.carrying_amount;
                localAnt.speed = serverAnt.speed;
            } else {
                this.ants.set(serverAnt.id, {
                    id: serverAnt.id,
                    x: serverAnt.x,
                    y: serverAnt.y,
                    targetX: serverAnt.x,
                    targetY: serverAnt.y,
                    targetTargetX: serverAnt.target_x,
                    targetTargetY: serverAnt.target_y,
                    ant_type: serverAnt.ant_type,
                    state: serverAnt.state,
                    health: serverAnt.health,
                    energy: serverAnt.energy,
                    carrying: serverAnt.carrying,
                    carrying_amount: serverAnt.carrying_amount,
                    speed: serverAnt.speed,
                    legPhase: Math.random() * 10,
                });
            }
        }
        
        for (const [id, ant] of this.ants) {
            if (!seenIds.has(id)) {
                this.ants.delete(id);
            }
        }
        
        this.antRenderList = Array.from(this.ants.values());
    }

    resize() {
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.animationFrame += deltaTime * 60;
        
        this.updateAnts(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }

    updateAnts(deltaTime) {
        const lerpFactor = Math.min(1, deltaTime * 8);
        
        for (const ant of this.antRenderList) {
            const dx = ant.targetX - ant.x;
            const dy = ant.targetY - ant.y;
            
            ant.x += dx * lerpFactor;
            ant.y += dy * lerpFactor;
            
            const speed = ant.speed || 1;
            const isMoving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
            
            if (isMoving) {
                ant.legPhase += deltaTime * 10 * speed;
            } else {
                ant.legPhase += deltaTime * 2;
            }
        }
    }

    render() {
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawCells();
        this.drawGrid();
        this.drawAnts();
        this.drawSeasonEffect();
    }

    drawBackground() {
        const ctx = this.ctx;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        switch (this.season) {
            case 'spring':
                gradient.addColorStop(0, '#87ceeb');
                gradient.addColorStop(0.1, '#98d98e');
                gradient.addColorStop(1, '#3d2817');
                break;
            case 'summer':
                gradient.addColorStop(0, '#4a90a4');
                gradient.addColorStop(0.1, '#6b8e23');
                gradient.addColorStop(1, '#2d1810');
                break;
            case 'autumn':
                gradient.addColorStop(0, '#c9a26a');
                gradient.addColorStop(0.1, '#8b6914');
                gradient.addColorStop(1, '#3d2817');
                break;
            case 'winter':
                gradient.addColorStop(0, '#b0c4de');
                gradient.addColorStop(0.1, '#e8e8e8');
                gradient.addColorStop(1, '#2a2a3a');
                break;
            default:
                gradient.addColorStop(0, '#87ceeb');
                gradient.addColorStop(0.1, '#98d98e');
                gradient.addColorStop(1, '#3d2817');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCells() {
        const ctx = this.ctx;
        
        for (const cell of this.cells) {
            const x = cell.grid_x * this.cellSize;
            const y = cell.grid_y * this.cellSize;
            const colors = this.cellColors[cell.cell_type] || this.cellColors.dirt;
            
            ctx.fillStyle = colors.fill;
            ctx.fillRect(x, y, this.cellSize, this.cellSize);
            
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, this.cellSize - 1, this.cellSize - 1);
            
            if (cell.cell_type === 'surface') {
                this.drawGrass(x, y);
            } else if (cell.cell_type === 'farm') {
                this.drawFungus(x, y);
            } else if (cell.cell_type === 'storage') {
                this.drawStorage(x, y);
            } else if (cell.cell_type === 'queen_chamber') {
                this.drawQueenMark(x, y);
            }
            
            if (cell.cell_type === 'dirt') {
                this.drawDirtTexture(x, y, cell);
            }
        }
    }

    drawGrass(x, y) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#4a7c23';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
            const gx = x + 5 + i * 8;
            const gy = y + this.cellSize;
            
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.quadraticCurveTo(gx + 2, gy - 8, gx, gy - 12);
            ctx.stroke();
        }
    }

    drawFungus(x, y) {
        const ctx = this.ctx;
        const cx = x + this.cellSize / 2;
        const cy = y + this.cellSize / 2;
        
        ctx.fillStyle = '#8fbc8f';
        ctx.beginPath();
        ctx.arc(cx - 8, cy + 5, 6, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy + 3, 5, 0, Math.PI * 2);
        ctx.arc(cx, cy - 5, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2e8b57';
        ctx.beginPath();
        ctx.arc(cx - 8, cy + 5, 3, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy + 3, 2.5, 0, Math.PI * 2);
        ctx.arc(cx, cy - 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStorage(x, y) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x + 8, y + 10, this.cellSize - 16, this.cellSize - 15);
        
        ctx.fillStyle = '#6b5344';
        ctx.fillRect(x + 8, y + 10, this.cellSize - 16, 4);
        
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2 + 3, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawQueenMark(x, y) {
        const ctx = this.ctx;
        const cx = x + this.cellSize / 2;
        const cy = y + this.cellSize / 2;
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.5 + Math.sin(this.animationFrame * 0.1) * 0.2;
        ctx.fillText('👑', cx, cy);
        ctx.globalAlpha = 1;
    }

    drawDirtTexture(x, y, cell) {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        
        const seed = cell.grid_x * 100 + cell.grid_y;
        for (let i = 0; i < 3; i++) {
            const dotX = x + ((seed * (i + 1) * 7) % (this.cellSize - 10)) + 5;
            const dotY = y + ((seed * (i + 1) * 13) % (this.cellSize - 10)) + 5;
            const dotSize = 2 + (seed % 3);
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize, 0);
            ctx.lineTo(x * this.cellSize, this.canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize);
            ctx.lineTo(this.canvas.width, y * this.cellSize);
            ctx.stroke();
        }
    }

    drawAnts() {
        const ctx = this.ctx;
        
        const sortedAnts = [...this.antRenderList].sort((a, b) => {
            if (a.ant_type === 'queen') return 1;
            if (b.ant_type === 'queen') return -1;
            return a.y - b.y;
        });
        
        for (const ant of sortedAnts) {
            this.drawAnt(ant);
        }
    }

    drawAnt(ant) {
        const ctx = this.ctx;
        const x = ant.x;
        const y = ant.y;
        
        const color = this.antColors[ant.ant_type] || '#8b4513';
        const scale = ant.ant_type === 'queen' ? 1.8 : (ant.ant_type === 'soldier' ? 1.3 : 1);
        
        let angle = 0;
        if (ant.targetTargetX !== null && ant.targetTargetY !== null) {
            const dx = ant.targetTargetX - ant.x;
            const dy = ant.targetTargetY - ant.y;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                angle = Math.atan2(dy, dx);
            }
        } else {
            const dx = ant.targetX - ant.x;
            const dy = ant.targetY - ant.y;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                angle = Math.atan2(dy, dx);
            }
        }
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        
        const legPhase = ant.legPhase || 0;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        const legPositions = [-4, 0, 4];
        for (let i = 0; i < 3; i++) {
            const lx = legPositions[i];
            const legSwing = Math.sin(legPhase + i * 2.1) * 2.5;
            
            ctx.beginPath();
            ctx.moveTo(lx, -2);
            ctx.lineTo(lx - 3, -5 - Math.abs(legSwing));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(lx, 2);
            ctx.lineTo(lx - 3, 5 + Math.abs(legSwing));
            ctx.stroke();
        }
        
        ctx.fillStyle = color;
        
        ctx.beginPath();
        ctx.ellipse(-5, 0, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(5, 0, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(6, -1);
        ctx.quadraticCurveTo(9, -3, 10, -2);
        ctx.moveTo(6, 1);
        ctx.quadraticCurveTo(9, 3, 10, 2);
        ctx.stroke();
        
        if (ant.ant_type === 'soldier') {
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(7, -1.5);
            ctx.lineTo(10, -3);
            ctx.lineTo(9, -1);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(7, 1.5);
            ctx.lineTo(10, 3);
            ctx.lineTo(9, 1);
            ctx.closePath();
            ctx.fill();
        }
        
        if (ant.carrying) {
            ctx.fillStyle = ant.carrying === 'food' ? '#daa520' : '#8b7355';
            ctx.beginPath();
            ctx.arc(0, -5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawSeasonEffect() {
        const ctx = this.ctx;
        
        if (this.season === 'winter') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            for (let i = 0; i < 20; i++) {
                const sx = ((this.animationFrame * 0.5 + i * 37) % this.canvas.width);
                const sy = ((this.animationFrame * 0.3 + i * 53) % (this.canvas.height * 0.3));
                const size = 1 + (i % 3) * 0.5;
                
                ctx.beginPath();
                ctx.arc(sx, sy, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        if (this.season === 'summer') {
            ctx.fillStyle = 'rgba(255, 200, 100, 0.1)';
            ctx.fillRect(0, 0, this.canvas.width, this.cellSize * 2);
        }
    }

    getGridPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            return { gridX, gridY };
        }
        return null;
    }

    getCellAt(gridX, gridY) {
        return this.cellMap[`${gridX},${gridY}`] || null;
    }
}
