class Pipe {
    constructor(canvas, x, gapHeight, theme) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.width = CONFIG.GAME.PIPE_WIDTH;
        this.gapHeight = gapHeight;
        this.theme = theme;
        
        const minGapY = 80;
        const maxGapY = this.canvas.height - CONFIG.GAME.GROUND_HEIGHT - gapHeight - 80;
        this.gapY = Math.random() * (maxGapY - minGapY) + minGapY;
        
        this.isPassed = false;
        this.isOffScreen = false;
    }
    
    update() {
        this.x -= CONFIG.GAME.PIPE_SPEED;
        
        if (this.x + this.width < 0) {
            this.isOffScreen = true;
        }
    }
    
    draw() {
        this.drawTopPipe();
        this.drawBottomPipe();
    }
    
    drawTopPipe() {
        const pipeBodyGradient = this.ctx.createLinearGradient(
            this.x, 0,
            this.x + this.width, 0
        );
        pipeBodyGradient.addColorStop(0, this.theme.pipeBottom);
        pipeBodyGradient.addColorStop(0.3, this.theme.pipeTop);
        pipeBodyGradient.addColorStop(0.7, this.theme.pipeTop);
        pipeBodyGradient.addColorStop(1, this.theme.pipeBottom);
        
        this.ctx.fillStyle = pipeBodyGradient;
        this.ctx.fillRect(this.x, 0, this.width, this.gapY);
        
        const capHeight = 25;
        const capWidth = this.width + 10;
        const capX = this.x - 5;
        const capY = this.gapY - capHeight;
        
        const capGradient = this.ctx.createLinearGradient(
            capX, capY,
            capX + capWidth, capY
        );
        capGradient.addColorStop(0, this.theme.pipeBottom);
        capGradient.addColorStop(0.5, this.theme.pipeCap);
        capGradient.addColorStop(1, this.theme.pipeBottom);
        
        this.ctx.fillStyle = capGradient;
        this.ctx.fillRect(capX, capY, capWidth, capHeight);
        
        this.ctx.strokeStyle = this.theme.pipeBottom;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(capX, capY, capWidth, capHeight);
    }
    
    drawBottomPipe() {
        const bottomY = this.gapY + this.gapHeight;
        const bottomHeight = this.canvas.height - CONFIG.GAME.GROUND_HEIGHT - bottomY;
        
        const pipeBodyGradient = this.ctx.createLinearGradient(
            this.x, bottomY,
            this.x + this.width, bottomY
        );
        pipeBodyGradient.addColorStop(0, this.theme.pipeBottom);
        pipeBodyGradient.addColorStop(0.3, this.theme.pipeTop);
        pipeBodyGradient.addColorStop(0.7, this.theme.pipeTop);
        pipeBodyGradient.addColorStop(1, this.theme.pipeBottom);
        
        this.ctx.fillStyle = pipeBodyGradient;
        this.ctx.fillRect(this.x, bottomY, this.width, bottomHeight);
        
        const capHeight = 25;
        const capWidth = this.width + 10;
        const capX = this.x - 5;
        const capY = bottomY;
        
        const capGradient = this.ctx.createLinearGradient(
            capX, capY,
            capX + capWidth, capY
        );
        capGradient.addColorStop(0, this.theme.pipeBottom);
        capGradient.addColorStop(0.5, this.theme.pipeCap);
        capGradient.addColorStop(1, this.theme.pipeBottom);
        
        this.ctx.fillStyle = capGradient;
        this.ctx.fillRect(capX, capY, capWidth, capHeight);
        
        this.ctx.strokeStyle = this.theme.pipeBottom;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(capX, capY, capWidth, capHeight);
    }
    
    checkScore(birdX) {
        if (!this.isPassed && birdX > this.x + this.width) {
            this.isPassed = true;
            return true;
        }
        return false;
    }
}

class PipeManager {
    constructor(canvas, theme) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = theme;
        this.pipes = [];
        this.lastSpawnTime = 0;
        this.score = 0;
    }
    
    setTheme(theme) {
        this.theme = theme;
    }
    
    reset() {
        this.pipes = [];
        this.lastSpawnTime = 0;
        this.score = 0;
    }
    
    getGapHeight() {
        const difficulty = Math.min(this.score * CONFIG.GAME.DIFFICULTY_INCREASE_RATE, CONFIG.GAME.PIPE_GAP_BASE - CONFIG.GAME.PIPE_GAP_MIN);
        return CONFIG.GAME.PIPE_GAP_BASE - difficulty;
    }
    
    update(currentTime, birdX) {
        if (currentTime - this.lastSpawnTime > CONFIG.GAME.PIPE_SPAWN_INTERVAL) {
            this.spawnPipe();
            this.lastSpawnTime = currentTime;
        }
        
        this.pipes.forEach(pipe => {
            pipe.update();
            
            if (pipe.checkScore(birdX)) {
                this.score++;
            }
        });
        
        this.pipes = this.pipes.filter(pipe => !pipe.isOffScreen);
    }
    
    spawnPipe() {
        const gapHeight = this.getGapHeight();
        const x = this.canvas.width + 50;
        this.pipes.push(new Pipe(this.canvas, x, gapHeight, this.theme));
    }
    
    draw() {
        this.pipes.forEach(pipe => pipe.draw());
    }
    
    checkCollision(bird) {
        for (const pipe of this.pipes) {
            if (bird.checkCollision(pipe)) {
                return true;
            }
        }
        return false;
    }
    
    getScore() {
        return this.score;
    }
}
