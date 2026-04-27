class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gridWidth = 30;
        this.gridHeight = 22;
        this.cellSize = 20;
        
        this.gameStatus = 'idle';
        this.score = 0;
        this.foodCount = 0;
        
        this.playerSnake = null;
        this.aiSnakes = [];
        this.food = null;
        
        this.lastTime = 0;
        this.moveTimer = 0;
        this.moveInterval = 0.12;
        this.saveTimer = 0;
        this.saveInterval = 1.0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadHighScore();
        this.tryLoadSavedGame();
        this.render();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        document.getElementById('overlay-start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('overlay-restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('overlay-resume-btn').addEventListener('click', () => this.togglePause());
    }
    
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        if (this.gameStatus === 'playing' && this.playerSnake && this.playerSnake.alive) {
            switch(key) {
                case 'arrowup':
                case 'w':
                    this.playerSnake.setDirection(Directions.UP);
                    e.preventDefault();
                    break;
                case 'arrowdown':
                case 's':
                    this.playerSnake.setDirection(Directions.DOWN);
                    e.preventDefault();
                    break;
                case 'arrowleft':
                case 'a':
                    this.playerSnake.setDirection(Directions.LEFT);
                    e.preventDefault();
                    break;
                case 'arrowright':
                case 'd':
                    this.playerSnake.setDirection(Directions.RIGHT);
                    e.preventDefault();
                    break;
            }
        }
        
        if (key === ' ' || key === 'r') {
            e.preventDefault();
            if (this.gameStatus === 'idle' || this.gameStatus === 'gameover') {
                this.startGame();
            } else if (this.gameStatus === 'playing' || this.gameStatus === 'paused') {
                this.togglePause();
            }
        }
    }
    
    startGame() {
        if (this.gameStatus !== 'playing') {
            this.initGame();
            this.gameStatus = 'playing';
            this.updateUI();
            this.hideAllOverlays();
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    initGame() {
        this.score = 0;
        this.foodCount = 0;
        this.moveTimer = 0;
        
        this.playerSnake = new Snake({
            isAI: false,
            body: [
                [5, 11],
                [4, 11],
                [3, 11]
            ],
            direction: Directions.RIGHT,
            name: 'Player'
        });
        
        this.aiSnakes = [];
        const aiStartPositions = [
            { pos: [25, 5], dir: Directions.LEFT },
            { pos: [25, 17], dir: Directions.LEFT },
            { pos: [15, 11], dir: Directions.DOWN }
        ];
        
        for (let i = 0; i < 3; i++) {
            const start = aiStartPositions[i];
            this.aiSnakes.push(new Snake({
                isAI: true,
                body: [
                    start.pos,
                    [start.pos[0] - start.dir[0], start.pos[1] - start.dir[1]],
                    [start.pos[0] - start.dir[0] * 2, start.pos[1] - start.dir[1] * 2]
                ],
                direction: start.dir,
                name: `AI ${i + 1}`
            }));
        }
        
        this.spawnFood();
        this.updateScoreDisplay();
    }
    
    spawnFood() {
        const occupied = this.getAllOccupiedPositions();
        const available = [];
        
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (!Utils.containsArray(occupied, [x, y])) {
                    available.push([x, y]);
                }
            }
        }
        
        if (available.length === 0) {
            return false;
        }
        
        this.food = Utils.randomChoice(available);
        return true;
    }
    
    getAllOccupiedPositions() {
        const positions = [];
        
        if (this.playerSnake && this.playerSnake.alive) {
            positions.push(...this.playerSnake.body);
        }
        
        for (const snake of this.aiSnakes) {
            if (snake.alive) {
                positions.push(...snake.body);
            }
        }
        
        return positions;
    }
    
    togglePause() {
        if (this.gameStatus === 'playing') {
            this.gameStatus = 'paused';
            this.showOverlay('pause-overlay');
        } else if (this.gameStatus === 'paused') {
            this.gameStatus = 'playing';
            this.hideAllOverlays();
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.gameLoop(time));
        }
        this.updateUI();
    }
    
    restartGame() {
        Storage.clearGameState();
        this.gameStatus = 'idle';
        this.startGame();
    }
    
    gameLoop(currentTime) {
        if (this.gameStatus !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.saveTimer += deltaTime;
        if (this.saveTimer >= this.saveInterval) {
            this.saveGameState();
            this.saveTimer = 0;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        this.moveTimer += deltaTime;
        
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.updateSnakes();
        }
        
        this.updateRespawnTimers(deltaTime);
        this.updateDeathEffects(deltaTime);
    }
    
    updateSnakes() {
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        
        for (const snake of this.aiSnakes) {
            if (snake.alive) {
                snake.makeAIDecision(this.gridWidth, this.gridHeight, allSnakes, this.food);
            }
        }
        
        if (this.playerSnake && this.playerSnake.alive) {
            this.playerSnake.move();
        }
        
        for (const snake of this.aiSnakes) {
            if (snake.alive) {
                snake.move();
            }
        }
        
        this.checkCollisions();
        this.checkFoodCollision();
    }
    
    checkCollisions() {
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        
        if (this.playerSnake && this.playerSnake.alive) {
            const head = this.playerSnake.getHead();
            
            if (head[0] < 0 || head[0] >= this.gridWidth || 
                head[1] < 0 || head[1] >= this.gridHeight) {
                this.playerSnake.die();
                this.gameOver();
                return;
            }
            
            for (const snake of allSnakes) {
                if (!snake.alive) continue;
                
                for (let i = 0; i < snake.body.length; i++) {
                    if (snake === this.playerSnake && i === 0) continue;
                    
                    if (Utils.arrayEquals(head, snake.body[i])) {
                        if (i === 0 && snake !== this.playerSnake) {
                            snake.die();
                            snake.startRespawn();
                        } else {
                            this.playerSnake.die();
                            this.gameOver();
                            return;
                        }
                    }
                }
            }
        }
        
        for (let i = 0; i < this.aiSnakes.length; i++) {
            const aiSnake = this.aiSnakes[i];
            if (!aiSnake.alive) continue;
            
            const head = aiSnake.getHead();
            let died = false;
            
            if (head[0] < 0 || head[0] >= this.gridWidth || 
                head[1] < 0 || head[1] >= this.gridHeight) {
                died = true;
            } else {
                for (const snake of allSnakes) {
                    if (!snake.alive) continue;
                    if (snake === aiSnake) continue;
                    
                    for (let j = 0; j < snake.body.length; j++) {
                        if (Utils.arrayEquals(head, snake.body[j])) {
                            if (j === 0 && this.playerSnake && snake === this.playerSnake) {
                                aiSnake.die();
                                aiSnake.startRespawn();
                                died = true;
                            } else {
                                aiSnake.die();
                                aiSnake.startRespawn();
                                died = true;
                            }
                            break;
                        }
                    }
                    if (died) break;
                }
                
                if (!died) {
                    for (let j = 1; j < aiSnake.body.length; j++) {
                        if (Utils.arrayEquals(head, aiSnake.body[j])) {
                            died = true;
                            break;
                        }
                    }
                }
            }
            
            if (died && aiSnake.alive) {
                aiSnake.die();
                aiSnake.startRespawn();
            }
        }
    }
    
    checkFoodCollision() {
        if (!this.food) return;
        
        if (this.playerSnake && this.playerSnake.alive) {
            if (Utils.arrayEquals(this.playerSnake.getHead(), this.food)) {
                this.playerSnake.grow();
                this.score += 10;
                this.foodCount++;
                this.updateScoreDisplay();
                this.spawnFood();
                return;
            }
        }
        
        for (const snake of this.aiSnakes) {
            if (snake.alive && Utils.arrayEquals(snake.getHead(), this.food)) {
                snake.grow();
                this.spawnFood();
                return;
            }
        }
    }
    
    updateRespawnTimers(deltaTime) {
        for (const snake of this.aiSnakes) {
            if (!snake.alive && snake.respawnTimer > 0) {
                const readyToRespawn = snake.updateRespawnTimer(deltaTime);
                if (readyToRespawn && !snake.deathEffect) {
                    const occupied = this.getAllOccupiedPositions();
                    snake.respawn(this.gridWidth, this.gridHeight, occupied);
                }
            }
        }
    }
    
    updateDeathEffects(deltaTime) {
        for (const snake of this.aiSnakes) {
            if (snake.deathEffect) {
                snake.updateDeathEffect(deltaTime);
            }
        }
        
        if (this.playerSnake && this.playerSnake.deathEffect) {
            this.playerSnake.updateDeathEffect(deltaTime);
        }
    }
    
    gameOver() {
        this.gameStatus = 'gameover';
        this.saveGameState();
        
        if (Storage.saveHighScore(this.score)) {
            this.updateHighScoreDisplay();
        }
        
        document.getElementById('final-score').textContent = this.score;
        
        setTimeout(() => {
            this.showOverlay('gameover-overlay');
        }, 1000);
        
        this.updateUI();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawGrid();
        this.drawFood();
        this.drawSnakes();
        this.drawRespawnTimers();
    }
    
    drawBackground() {
        this.ctx.fillStyle = '#faf7f2';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(200, 195, 185, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.gridHeight * this.cellSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.gridWidth * this.cellSize, y * this.cellSize);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawFood() {
        if (!this.food) return;
        
        const x = this.food[0] * this.cellSize + this.cellSize / 2;
        const y = this.food[1] * this.cellSize + this.cellSize / 2;
        const size = this.cellSize - 4;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        const gradient = this.ctx.createRadialGradient(-size/6, -size/6, 0, 0, 0, size/2);
        gradient.addColorStop(0, '#ff8a80');
        gradient.addColorStop(0.4, '#ff5252');
        gradient.addColorStop(0.8, '#d32f2f');
        gradient.addColorStop(1, '#b71c1c');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size/2);
        this.ctx.bezierCurveTo(
            size/2.5, -size/3,
            size/2, size/4,
            0, size/2
        );
        this.ctx.bezierCurveTo(
            -size/2, size/4,
            -size/2.5, -size/3,
            0, -size/2
        );
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(-size/5, -size/5, size/8, 0, Math.PI * 2);
        this.ctx.fill();
        
        const seedColor = '#ffeb3b';
        const seedSize = size/12;
        
        const seedPositions = [
            [0, -size/6],
            [size/5, -size/8],
            [-size/5, -size/8],
            [size/6, size/8],
            [-size/6, size/8],
            [0, size/6],
            [size/4, 0],
            [-size/4, 0]
        ];
        
        this.ctx.fillStyle = seedColor;
        for (const pos of seedPositions) {
            this.ctx.beginPath();
            this.ctx.ellipse(pos[0], pos[1], seedSize * 0.8, seedSize * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        const leafCenterY = -size/2 + 2;
        
        this.ctx.fillStyle = '#388e3c';
        this.ctx.beginPath();
        this.ctx.ellipse(0, leafCenterY - size/10, size/8, size/6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#4caf50';
        this.ctx.beginPath();
        this.ctx.ellipse(-size/5, leafCenterY, size/10, size/8, -Math.PI/5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#66bb6a';
        this.ctx.beginPath();
        this.ctx.ellipse(size/5, leafCenterY, size/10, size/8, Math.PI/5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#795548';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -size/2 + 1, size/15, size/15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawSnakes() {
        if (this.playerSnake) {
            this.drawSnake(this.playerSnake);
        }
        
        for (const snake of this.aiSnakes) {
            this.drawSnake(snake);
        }
    }
    
    drawSnake(snake) {
        if (!snake.alive) {
            if (snake.deathEffect) {
                this.drawDeathEffect(snake);
            }
            return;
        }
        
        const cellSize = this.cellSize;
        const padding = 2;
        const borderRadius = 4;
        
        for (let i = snake.body.length - 1; i >= 0; i--) {
            const segment = snake.body[i];
            const x = segment[0] * cellSize + padding;
            const y = segment[1] * cellSize + padding;
            const size = cellSize - padding * 2;
            
            const alpha = 1 - (i * 0.03);
            
            this.ctx.save();
            
            const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
            gradient.addColorStop(0, snake.gradientColor1);
            gradient.addColorStop(0.5, snake.color);
            gradient.addColorStop(1, snake.gradientColor2);
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = gradient;
            
            this.roundRect(x, y, size, size, borderRadius);
            this.ctx.fill();
            
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.roundRect(x + 2, y + 2, size - 4, size - 4, borderRadius - 1);
            this.ctx.fill();
            
            this.ctx.restore();
            
            if (i === 0) {
                this.drawSnakeEyes(snake, segment, cellSize);
            }
        }
    }
    
    drawSnakeEyes(snake, headPos, cellSize) {
        const centerX = headPos[0] * cellSize + cellSize / 2;
        const centerY = headPos[1] * cellSize + cellSize / 2;
        const eyeRadius = 3;
        const eyeOffset = 4;
        
        let eye1X, eye1Y, eye2X, eye2Y;
        
        const dir = snake.direction;
        if (dir[0] === 1) {
            eye1X = centerX + eyeOffset;
            eye1Y = centerY - eyeOffset;
            eye2X = centerX + eyeOffset;
            eye2Y = centerY + eyeOffset;
        } else if (dir[0] === -1) {
            eye1X = centerX - eyeOffset;
            eye1Y = centerY - eyeOffset;
            eye2X = centerX - eyeOffset;
            eye2Y = centerY + eyeOffset;
        } else if (dir[1] === 1) {
            eye1X = centerX - eyeOffset;
            eye1Y = centerY + eyeOffset;
            eye2X = centerX + eyeOffset;
            eye2Y = centerY + eyeOffset;
        } else {
            eye1X = centerX - eyeOffset;
            eye1Y = centerY - eyeOffset;
            eye2X = centerX + eyeOffset;
            eye2Y = centerY - eyeOffset;
        }
        
        this.ctx.save();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2c3e50';
        const pupilRadius = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(eye1X + dir[0] * 1, eye1Y + dir[1] * 1, pupilRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eye2X + dir[0] * 1, eye2Y + dir[1] * 1, pupilRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawDeathEffect(snake) {
        const effect = snake.deathEffect;
        if (!effect) return;
        
        const progress = effect.progress;
        const fadeOut = 1 - progress;
        
        this.ctx.save();
        
        if (snake.body.length > 0) {
            const head = snake.body[0];
            const centerX = head[0] * this.cellSize + this.cellSize / 2;
            const centerY = head[1] * this.cellSize + this.cellSize / 2;
            
            this.ctx.globalAlpha = fadeOut;
            this.ctx.font = `${this.cellSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('💀', centerX, centerY);
            
            if (snake.body.length > 1) {
                for (let i = 1; i < snake.body.length; i++) {
                    const segment = snake.body[i];
                    const x = segment[0] * this.cellSize + this.cellSize / 2;
                    const y = segment[1] * this.cellSize + this.cellSize / 2;
                    
                    this.ctx.globalAlpha = fadeOut * 0.5;
                    this.ctx.font = `${this.cellSize * 0.6}px Arial`;
                    this.ctx.fillText('☠️', x, y);
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawRespawnTimers() {
        for (const snake of this.aiSnakes) {
            if (!snake.alive && snake.respawnTimer > 0 && !snake.deathEffect) {
                const time = Math.ceil(snake.respawnTimer);
                
                this.ctx.save();
                
                const gridX = this.gridWidth / 2;
                const gridY = this.gridHeight / 2;
                const x = gridX * this.cellSize;
                const y = gridY * this.cellSize;
                
                const scale = 1 + Math.sin(snake.respawnTimer * 10) * 0.1;
                this.ctx.translate(x, y);
                this.ctx.scale(scale, scale);
                
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillStyle = snake.color;
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(time.toString(), 0, 0);
                
                this.ctx.strokeStyle = snake.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
                this.ctx.globalAlpha = 0.3;
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        }
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = Storage.getHighScore();
    }
    
    loadHighScore() {
        this.updateHighScoreDisplay();
    }
    
    tryLoadSavedGame() {
        const savedState = Storage.loadGameState();
        if (savedState) {
            if (Storage.restoreStateFromSerialization(savedState, this)) {
                this.updateScoreDisplay();
                this.updateHighScoreDisplay();
                
                if (this.gameStatus === 'gameover') {
                    this.showOverlay('gameover-overlay');
                    document.getElementById('final-score').textContent = this.score;
                } else if (this.gameStatus === 'playing' || this.gameStatus === 'paused') {
                    this.showOverlay('pause-overlay');
                    this.gameStatus = 'paused';
                }
                this.updateUI();
            }
        }
    }
    
    saveGameState() {
        if (this.gameStatus === 'playing' || this.gameStatus === 'paused' || this.gameStatus === 'gameover') {
            const state = Storage.getStateForSerialization(this);
            Storage.saveGameState(state);
        }
    }
    
    updateUI() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        startBtn.disabled = this.gameStatus === 'playing';
        pauseBtn.disabled = this.gameStatus !== 'playing' && this.gameStatus !== 'paused';
        
        if (this.gameStatus === 'paused') {
            pauseBtn.textContent = '继续';
        } else {
            pauseBtn.textContent = '暂停';
        }
    }
    
    hideAllOverlays() {
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('gameover-overlay').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');
    }
    
    showOverlay(id) {
        this.hideAllOverlays();
        document.getElementById(id).classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
