class Snake {
    constructor(options) {
        this.isAI = options.isAI || false;
        this.body = options.body || [];
        this.direction = options.direction || Directions.RIGHT;
        this.nextDirection = options.nextDirection || this.direction;
        this.color = options.color || this.getRandomColor();
        this.gradientColor1 = options.gradientColor1 || this.getGradientColor(this.color, 1);
        this.gradientColor2 = options.gradientColor2 || this.getGradientColor(this.color, 2);
        this.alive = options.alive !== undefined ? options.alive : true;
        this.respawnTimer = options.respawnTimer || 0;
        this.deathEffect = options.deathEffect || null;
        this.growNextMove = options.growNextMove || false;
        this.name = options.name || (this.isAI ? 'AI Snake' : 'Player');
    }
    
    getRandomColor() {
        if (this.isAI) {
            const colors = [
                { main: '#3498db', g1: '#5dade2', g2: '#2980b9' },
                { main: '#2ecc71', g1: '#58d68d', g2: '#27ae60' },
                { main: '#9b59b6', g1: '#bb8fce', g2: '#8e44ad' },
                { main: '#f1c40f', g1: '#f4d03f', g2: '#d4ac0d' },
                { main: '#e67e22', g1: '#eb984e', g2: '#d35400' }
            ];
            const selected = Utils.randomChoice(colors);
            this.color = selected.main;
            this.gradientColor1 = selected.g1;
            this.gradientColor2 = selected.g2;
            return selected.main;
        } else {
            this.color = '#e74c3c';
            this.gradientColor1 = '#f1948a';
            this.gradientColor2 = '#c0392b';
            return '#e74c3c';
        }
    }
    
    getGradientColor(mainColor, index) {
        return mainColor;
    }
    
    getHead() {
        return this.body.length > 0 ? this.body[0] : null;
    }
    
    getTail() {
        return this.body.length > 0 ? this.body[this.body.length - 1] : null;
    }
    
    containsPosition(pos) {
        return Utils.containsArray(this.body, pos);
    }
    
    setDirection(newDir) {
        if (!Directions.isOpposite(this.direction, newDir)) {
            this.nextDirection = newDir;
        }
    }
    
    move() {
        if (!this.alive) return;
        
        this.direction = this.nextDirection;
        const head = this.getHead();
        const newHead = [
            head[0] + this.direction[0],
            head[1] + this.direction[1]
        ];
        
        this.body.unshift(newHead);
        
        if (!this.growNextMove) {
            this.body.pop();
        } else {
            this.growNextMove = false;
        }
    }
    
    grow() {
        this.growNextMove = true;
    }
    
    die() {
        this.alive = false;
        this.deathEffect = {
            progress: 0,
            duration: 1.0
        };
    }
    
    startRespawn() {
        this.respawnTimer = 3.0;
    }
    
    updateRespawnTimer(deltaTime) {
        if (this.respawnTimer > 0) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                return true;
            }
        }
        return false;
    }
    
    updateDeathEffect(deltaTime) {
        if (this.deathEffect) {
            this.deathEffect.progress += deltaTime / this.deathEffect.duration;
            if (this.deathEffect.progress >= 1) {
                this.deathEffect = null;
                return true;
            }
        }
        return false;
    }
    
    respawn(gridWidth, gridHeight, occupiedPositions) {
        const availablePositions = [];
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                if (!Utils.containsArray(occupiedPositions, [x, y])) {
                    availablePositions.push([x, y]);
                }
            }
        }
        
        if (availablePositions.length < 3) {
            return false;
        }
        
        const startPos = Utils.randomChoice(availablePositions);
        
        let startDir = Directions.RIGHT;
        if (startPos[0] > gridWidth / 2) {
            startDir = Directions.LEFT;
        } else if (startPos[1] > gridHeight / 2) {
            startDir = Directions.UP;
        } else if (startPos[1] < gridHeight / 2) {
            startDir = Directions.DOWN;
        }
        
        this.body = [
            startPos,
            [startPos[0] - startDir[0], startPos[1] - startDir[1]],
            [startPos[0] - startDir[0] * 2, startPos[1] - startDir[1] * 2]
        ];
        
        this.direction = startDir;
        this.nextDirection = startDir;
        this.alive = true;
        this.respawnTimer = 0;
        this.deathEffect = null;
        this.growNextMove = false;
        
        return true;
    }
    
    makeAIDecision(gridWidth, gridHeight, allSnakes, food) {
        if (!this.isAI || !this.alive) return;
        
        const head = this.getHead();
        const nextHead = [
            head[0] + this.direction[0],
            head[1] + this.direction[1]
        ];
        
        const willHitWall = nextHead[0] < 0 || nextHead[0] >= gridWidth || 
                           nextHead[1] < 0 || nextHead[1] >= gridHeight;
        
        const willHitBody = this.willHitBody(nextHead, allSnakes);
        
        if (Math.random() < 0.3 || willHitWall || willHitBody) {
            const perpendicularDirs = Directions.getPerpendicular(this.direction);
            const oppositeDir = [-this.direction[0], -this.direction[1]];
            const availableDirs = [];
            
            for (const dir of perpendicularDirs) {
                const testHead = [head[0] + dir[0], head[1] + dir[1]];
                const hitsWall = testHead[0] < 0 || testHead[0] >= gridWidth || 
                                testHead[1] < 0 || testHead[1] >= gridHeight;
                const hitsBody = this.willHitBody(testHead, allSnakes);
                
                if (!hitsWall && !hitsBody) {
                    availableDirs.push(dir);
                }
            }
            
            if (availableDirs.length > 0) {
                this.setDirection(Utils.randomChoice(availableDirs));
            }
        }
    }
    
    willHitBody(testHead, allSnakes) {
        for (const snake of allSnakes) {
            if (!snake.alive) continue;
            
            for (let i = 0; i < snake.body.length; i++) {
                if (snake === this && i === 0) continue;
                
                if (Utils.arrayEquals(testHead, snake.body[i])) {
                    return true;
                }
            }
        }
        return false;
    }
    
    toJSON() {
        return {
            isAI: this.isAI,
            body: this.body,
            direction: this.direction,
            nextDirection: this.nextDirection,
            color: this.color,
            gradientColor1: this.gradientColor1,
            gradientColor2: this.gradientColor2,
            alive: this.alive,
            respawnTimer: this.respawnTimer,
            deathEffect: this.deathEffect,
            growNextMove: this.growNextMove,
            name: this.name
        };
    }
    
    static fromJSON(data, isAI) {
        return new Snake({
            isAI: data.isAI !== undefined ? data.isAI : isAI,
            body: data.body || [],
            direction: data.direction || Directions.RIGHT,
            nextDirection: data.nextDirection || data.direction || Directions.RIGHT,
            color: data.color,
            gradientColor1: data.gradientColor1,
            gradientColor2: data.gradientColor2,
            alive: data.alive,
            respawnTimer: data.respawnTimer,
            deathEffect: data.deathEffect,
            growNextMove: data.growNextMove,
            name: data.name
        });
    }
}
