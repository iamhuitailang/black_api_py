class YPGame {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.bpm = options.bpm || 120;
        this.difficulty = options.difficulty || 2;
        this.music = options.music || null;
        this.character = options.character || null;
        this.bonuses = options.bonuses || {};
        
        this.onScore = options.onScore || null;
        this.onCombo = options.onCombo || null;
        this.onBeat = options.onBeat || null;
        this.onGameOver = options.onGameOver || null;
        this.onDistance = options.onDistance || null;
        this.onTime = options.onTime || null;
        this.onVisualizer = options.onVisualizer || null;
        
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.totalTime = 0;
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.distance = 0;
        this.baseSpeed = 8;
        this.currentSpeed = 8;
        this.speedMultiplier = 1;
        
        this.player = null;
        this.obstacles = [];
        this.notes = [];
        this.beatDetector = null;
        this.background = null;
        this.visualizer = null;
        this.jumpBuffer = [];
        
        this.obstacleSpawnTimer = 0;
        this.noteSpawnTimer = 0;
        this.obstacleSpawnInterval = 1.5;
        this.noteSpawnInterval = 0.8;
        
        this.scoreMultiplier = 1;
        this.characterBonus = 0;
        this.skillBonus = 0;
        
        this.init();
    }

    init() {
        const speedBonus = this.bonuses.speed_bonus || 0;
        const jumpBonus = this.bonuses.jump_bonus || 0;
        this.characterBonus = (this.bonuses.character_bonus || 0) / 100;
        this.skillBonus = (this.bonuses.skill_bonus || 0) / 100;
        this.scoreMultiplier = 1 + this.characterBonus + this.skillBonus;

        this.player = new Player(this.canvas, {
            maxJumps: 2,
            jumpPower: -18 * (1 + jumpBonus / 100),
            gravity: 0.8,
            character: this.character,
            shieldCount: this.bonuses.shield_count || 0
        });

        this.beatDetector = new BeatDetector({
            bpm: this.bpm,
            onBeat: (beatCount) => this.handleBeat(beatCount),
            onBeatWindow: (inWindow, progress) => this.handleBeatWindow(inWindow, progress)
        });

        this.background = new Background(this.canvas);
        this.visualizer = new AudioVisualizer(this.canvas, { barCount: 64 });

        this.adjustDifficulty();
    }

    adjustDifficulty() {
        const difficultyMult = 1 + (this.difficulty - 1) * 0.3;
        this.baseSpeed = 8 * difficultyMult;
        this.currentSpeed = this.baseSpeed;
        this.obstacleSpawnInterval = Math.max(0.8, 1.5 / difficultyMult);
        this.noteSpawnInterval = Math.max(0.5, 0.8 / difficultyMult);
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.beatDetector.start();
        this.gameLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    stop() {
        this.isRunning = false;
        this.beatDetector.stop();
    }

    destroy() {
        this.stop();
        this.obstacles = [];
        this.notes = [];
    }

    jump() {
        if (!this.isRunning || this.isPaused) return;
        
        const jumpTime = performance.now();
        const timing = this.beatDetector.checkJumpTiming(jumpTime);
        
        if (this.player.jump()) {
            this.handleJumpTiming(timing);
        }
    }

    handleJumpTiming(timing) {
        if (timing.timing === 'perfect') {
            const bonus = Math.floor(50 * this.scoreMultiplier);
            this.addScore(bonus, 'beat');
            this.addCombo();
        } else if (timing.timing === 'good') {
            const bonus = Math.floor(25 * this.scoreMultiplier);
            this.addScore(bonus, 'good');
            this.addCombo();
        }
    }

    handleBeat(beatCount) {
        if (this.onBeat) {
            this.onBeat(beatCount);
        }

        if (beatCount % 8 === 0 && Math.random() > 0.7) {
            this.background.changeTheme();
        }
    }

    handleBeatWindow(inWindow, progress) {
        this.obstacles.forEach(obs => {
            if (obs.onBeat) {
                obs.beatWindow = inWindow;
            }
        });
    }

    addScore(points, type = 'normal') {
        const finalPoints = Math.floor(points * this.scoreMultiplier);
        this.score += finalPoints;
        
        if (this.onScore) {
            this.onScore(finalPoints, type);
        }
    }

    addCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        if (this.combo % 10 === 0) {
            this.scoreMultiplier += 0.1;
        }
        
        if (this.onCombo) {
            this.onCombo(this.combo);
        }
    }

    breakCombo() {
        if (this.combo >= 5) {
            this.scoreMultiplier = 1 + this.characterBonus + this.skillBonus;
        }
        this.combo = 0;
        
        if (this.onCombo) {
            this.onCombo(0);
        }
    }

    spawnObstacle() {
        const beatProgress = this.beatDetector.getProgress(performance.now());
        const onBeat = beatProgress < 0.2 || beatProgress > 0.8;
        
        const types = ['normal', 'low', 'high', 'floating'];
        const weights = [0.4, 0.25, 0.25, 0.1];
        
        let random = Math.random();
        let type = 'normal';
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                type = types[i];
                break;
            }
        }

        const obstacle = new Obstacle(this.canvas, {
            type,
            onBeat,
            beatWindow: onBeat
        });
        
        this.obstacles.push(obstacle);
    }

    spawnNote() {
        const note = new Note(this.canvas, {
            value: 100 + Math.random() * 100
        });
        this.notes.push(note);
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(this.deltaTime);
            this.draw();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.totalTime += deltaTime;
        
        if (this.onTime) {
            this.onTime(this.totalTime);
        }

        this.speedMultiplier = 1 + this.totalTime * 0.01;
        this.currentSpeed = this.baseSpeed * this.speedMultiplier;
        
        this.distance += this.currentSpeed * deltaTime * 10;
        if (this.onDistance) {
            this.onDistance(this.distance);
        }

        this.beatDetector.update(performance.now());
        
        const visualizerData = this.beatDetector.getVisualizerData();
        if (this.onVisualizer) {
            this.onVisualizer(visualizerData);
        }
        this.visualizer.update(visualizerData);

        this.background.update(deltaTime, this.speedMultiplier);
        this.player.update(deltaTime);

        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.obstacleSpawnTimer = 0;
            this.spawnObstacle();
        }

        this.noteSpawnTimer += deltaTime;
        if (this.noteSpawnTimer >= this.noteSpawnInterval) {
            this.noteSpawnTimer = 0;
            if (Math.random() > 0.3) {
                this.spawnNote();
            }
        }

        this.obstacles.forEach((obs, index) => {
            obs.update(deltaTime, this.currentSpeed);
            
            if (obs.checkCollision(this.player)) {
                if (obs.onBeat && obs.beatWindow) {
                    if (this.player.isJumping && this.player.velocityY < 0) {
                        const bonus = Math.floor(100 * this.scoreMultiplier);
                        this.addScore(bonus, 'perfect');
                        this.addCombo();
                        this.obstacles.splice(index, 1);
                        return;
                    }
                }
                
                if (this.player.takeDamage()) {
                    this.gameOver();
                } else {
                    this.obstacles.splice(index, 1);
                    this.breakCombo();
                    if (this.onScore) {
                        this.onScore(0, 'miss');
                    }
                }
            } else if (!obs.passed && obs.x + obs.width < this.player.x) {
                obs.passed = true;
                if (!obs.onBeat) {
                    this.addScore(10, 'good');
                    this.addCombo();
                }
            }
        });

        this.obstacles = this.obstacles.filter(obs => !obs.isOffScreen());

        this.notes.forEach((note, index) => {
            note.update(deltaTime, this.currentSpeed);
            
            if (note.checkCollision(this.player)) {
                const bonus = Math.floor(note.value * this.scoreMultiplier);
                this.addScore(bonus, 'note');
                this.addCombo();
                this.notes.splice(index, 1);
            }
        });

        this.notes = this.notes.filter(note => !note.isOffScreen() && !note.collected);
    }

    draw() {
        const c = this.ctx;
        
        c.clearRect(0, 0, this.width, this.height);
        
        this.background.draw();
        this.visualizer.draw(0);
        
        this.obstacles.forEach(obs => obs.draw(c));
        this.notes.forEach(note => note.draw(c));
        
        this.player.draw(c);
    }

    gameOver() {
        this.stop();
        
        const stats = {
            score: this.score,
            max_combo: this.maxCombo,
            distance: Math.floor(this.distance),
            play_time: Math.floor(this.totalTime)
        };
        
        if (this.onGameOver) {
            this.onGameOver(stats);
        }
    }
}
