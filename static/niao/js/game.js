class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        this.renderer = new Renderer(this.canvas);
        this.physics = new Physics();
        this.slingshot = new Slingshot();
        this.inputHandler = new InputHandler(this.canvas, this);

        this.birds = [];
        this.pigs = [];
        this.blocks = [];
        this.particles = [];
        this.eggs = [];
        this.explosions = [];

        this.birdQueue = [];
        this.currentBirdIndex = 0;
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.canShoot = true;
        this.prepareNextBirdTimer = null;

        this.lastTime = 0;
        this.animationId = null;
    }

    loadLevel(levelId) {
        this.reset();
        
        const levelData = levelManager.getLevel(levelId);
        if (!levelData) return false;

        this.birdQueue = [...levelData.birds];
        this.currentBirdIndex = 0;

        for (const pigData of levelData.pigs) {
            const pig = new Pig(pigData.x, pigData.y, pigData.type);
            this.pigs.push(pig);
            this.physics.addBody(pig);
        }

        for (const blockData of levelData.blocks) {
            const block = new Block(
                blockData.x, 
                blockData.y, 
                blockData.width, 
                blockData.height, 
                blockData.type
            );
            this.blocks.push(block);
        }

        this.score = 0;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.canShoot = true;

        this.prepareNextBird();
        this.saveGameState();
        return true;
    }

    reset() {
        if (this.prepareNextBirdTimer) {
            clearTimeout(this.prepareNextBirdTimer);
            this.prepareNextBirdTimer = null;
        }
        this.birds = [];
        this.pigs = [];
        this.blocks = [];
        this.particles = [];
        this.eggs = [];
        this.explosions = [];
        this.physics.bodies = [];
        this.slingshot.reset();
    }

    prepareNextBird() {
        if (this.currentBirdIndex >= this.birdQueue.length) {
            this.canShoot = false;
            return;
        }

        const birdType = this.birdQueue[this.currentBirdIndex];
        const bird = new Bird(this.slingshot.x, this.slingshot.y - 20, birdType);
        this.birds.push(bird);
        this.physics.addBody(bird);
        this.slingshot.currentBird = bird;
        this.canShoot = true;
    }

    shootBird(velocity) {
        const bird = this.slingshot.currentBird;
        if (!bird) return;

        bird.launch(velocity);
        this.slingshot.currentBird = null;
        this.canShoot = false;
        this.currentBirdIndex++;

        this.saveGameState();
    }

    getFlyingBird() {
        for (const bird of this.birds) {
            if (bird.isLaunched && bird.isAlive && bird.isMoving()) {
                return bird;
            }
        }
        return null;
    }

    update() {
        if (this.isPaused || this.isGameOver || this.isLevelComplete) return;

        this.physics.update();
        this.updateEggs();
        this.updateParticles();
        this.updateExplosions();
        this.checkCollisions();
        this.checkBirdStopped();
        this.checkGameState();
        this.cleanupDeadObjects();
    }

    updateEggs() {
        for (const egg of this.eggs) {
            if (egg.shouldExplode) {
                this.createExplosion(egg.position.x, egg.position.y, egg.explosionRadius);
            }
        }
    }

    updateParticles() {
        for (const particle of this.particles) {
            particle.update();
        }
        this.particles = this.particles.filter(p => p.isAlive());
    }

    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].progress += 0.05;
            if (this.explosions[i].progress >= 1) {
                this.explosions.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        for (const bird of this.birds) {
            if (!bird.isAlive || !bird.isLaunched) continue;

            for (const pig of this.pigs) {
                if (!pig.isAlive) continue;

                if (this.checkCircleCollision(bird, pig)) {
                    const damage = bird.damage * (bird.getSpeed() / 10 + 0.5);
                    const scoreGain = pig.takeDamage(damage);
                    if (scoreGain > 0) {
                        this.score += scoreGain;
                        this.createParticles(pig.position.x, pig.position.y, pig.color, 10);
                    }
                }
            }

            for (const block of this.blocks) {
                if (!block.isAlive) continue;

                if (block.checkCollisionWithCircle(bird)) {
                    const damage = bird.damage * (bird.getSpeed() / 10 + 0.5);
                    const scoreGain = block.takeDamage(damage);
                    if (scoreGain > 0) {
                        this.score += scoreGain;
                        this.createParticles(block.position.x, block.position.y, block.color, 5);
                    }
                }
            }
        }

        for (const egg of this.eggs) {
            if (!egg.isAlive) continue;

            for (const pig of this.pigs) {
                if (!pig.isAlive) continue;

                if (this.checkCircleCollision(egg, pig)) {
                    const scoreGain = pig.takeDamage(3);
                    if (scoreGain > 0) {
                        this.score += scoreGain;
                    }
                }
            }

            for (const block of this.blocks) {
                if (!block.isAlive) continue;

                if (block.checkCollisionWithCircle(egg)) {
                    block.takeDamage(2);
                }
            }
        }
    }

    checkCircleCollision(a, b) {
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < a.radius + b.radius;
    }

    checkBirdStopped() {
        if (this.canShoot) return;

        const flyingBird = this.getFlyingBird();
        if (!flyingBird && !this.prepareNextBirdTimer) {
            const allBirdsStopped = this.birds.every(b => !b.isMoving() || !b.isAlive);
            const allEggsStopped = this.eggs.every(e => !e.isAlive);

            if (allBirdsStopped && allEggsStopped) {
                this.prepareNextBirdTimer = setTimeout(() => {
                    if (this.currentBirdIndex < this.birdQueue.length) {
                        this.prepareNextBird();
                    }
                    this.prepareNextBirdTimer = null;
                }, 500);
            }
        }
    }

    checkGameState() {
        const alivePigs = this.pigs.filter(p => p.isAlive).length;

        if (alivePigs === 0) {
            this.isLevelComplete = true;
            this.calculateFinalScore();
            this.saveProgress();
            return;
        }

        if (this.currentBirdIndex >= this.birdQueue.length) {
            const allBirdsStopped = this.birds.every(b => !b.isMoving() || !b.isAlive);
            const allEggsStopped = this.eggs.every(e => !e.isAlive);

            if (allBirdsStopped && allEggsStopped && alivePigs > 0) {
                this.isGameOver = true;
            }
        }
    }

    calculateFinalScore() {
        const remainingBirds = this.birdQueue.length - this.currentBirdIndex;
        this.score += remainingBirds * CONFIG.SCORE.REMAINING_BIRD;
    }

    getStars() {
        const remainingBirds = this.birdQueue.length - this.currentBirdIndex;
        const totalBirds = this.birdQueue.length;
        const ratio = remainingBirds / totalBirds;

        if (ratio >= 0.6) return 3;
        if (ratio >= 0.3) return 2;
        return 1;
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    createExplosion(x, y, radius) {
        this.explosions.push({ x, y, radius, progress: 0 });
        this.createParticles(x, y, '#FF4500', 20);
        this.createParticles(x, y, '#FFD700', 15);

        for (const pig of this.pigs) {
            if (!pig.isAlive) continue;
            const dx = pig.position.x - x;
            const dy = pig.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < radius) {
                const damage = (1 - distance / radius) * 5;
                const scoreGain = pig.takeDamage(damage);
                if (scoreGain > 0) {
                    this.score += scoreGain;
                }
            }
        }

        for (const block of this.blocks) {
            if (!block.isAlive) continue;
            const dx = block.position.x - x;
            const dy = block.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < radius) {
                const damage = (1 - distance / radius) * 3;
                block.takeDamage(damage);
            }
        }
    }

    cleanupDeadObjects() {
        this.birds = this.birds.filter(b => b.isAlive);
        this.pigs = this.pigs.filter(p => p.isAlive);
        this.blocks = this.blocks.filter(b => b.isAlive);
        this.eggs = this.eggs.filter(e => e.isAlive);
    }

    render() {
        this.renderer.clear();

        for (const block of this.blocks) {
            this.renderer.drawBlock(block);
        }

        for (const pig of this.pigs) {
            this.renderer.drawPig(pig);
        }

        this.renderer.drawSlingshot(this.slingshot);

        for (const bird of this.birds) {
            this.renderer.drawBird(bird);
        }

        for (const egg of this.eggs) {
            this.renderer.drawEgg(egg);
        }

        for (const particle of this.particles) {
            this.renderer.drawParticle(particle);
        }

        for (const explosion of this.explosions) {
            this.renderer.drawExplosion(explosion.x, explosion.y, explosion.radius, explosion.progress);
        }

        if (this.slingshot.isPulling && this.slingshot.currentBird) {
            const velocity = new Vector(
                this.slingshot.x - this.slingshot.pullX,
                this.slingshot.y - this.slingshot.pullY
            );
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            if (speed > 0) {
                const normalized = velocity.div(speed);
                const power = Math.min(speed / 100, 1) * CONFIG.MAX_SPEED;
                const trajectoryVelocity = normalized.mul(power);
                const trajectoryPoints = this.physics.predictTrajectory(
                    new Vector(this.slingshot.pullX, this.slingshot.pullY),
                    trajectoryVelocity,
                    30
                );
                this.renderer.drawTrajectory(trajectoryPoints);
            }
        }

        const remainingBirds = this.birdQueue.slice(this.currentBirdIndex + (this.canShoot ? 0 : 1));
        if (remainingBirds.length > 0) {
            this.renderer.drawBirdQueue(remainingBirds, 50, 650);
        }

        this.renderer.drawScore(this.score, 50, 50);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update();
        this.render();

        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    start() {
        if (this.animationId) return;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    saveGameState() {
        const state = {
            levelId: levelManager.currentLevel,
            currentBirdIndex: this.currentBirdIndex,
            score: this.score,
            canShoot: this.canShoot
        };
        storage.saveGameState(state);
    }

    saveProgress() {
        const stars = this.getStars();
        storage.saveLevelProgress(levelManager.currentLevel, stars, this.score);
        storage.clearGameState();
    }

    loadSavedState() {
        const savedState = storage.loadGameState();
        if (!savedState || !savedState.levelId) {
            return false;
        }

        this.loadLevel(savedState.levelId);
        this.currentBirdIndex = savedState.currentBirdIndex || 0;
        this.score = savedState.score || 0;
        this.canShoot = savedState.canShoot !== undefined ? savedState.canShoot : true;

        if (this.canShoot && this.currentBirdIndex < this.birdQueue.length) {
            this.birds = [];
            this.prepareNextBird();
        }

        return true;
    }
}
