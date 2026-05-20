class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = GameConfig.CANVAS_WIDTH;
        this.height = GameConfig.CANVAS_HEIGHT;
        
        this.state = GameData.getInitialState();
        this.state.highScore = StorageManager.loadHighScore();
        
        this.sceneRenderer = new SceneRenderer(this.ctx, this.width, this.height);
        this.ui = new UIManager(this);
        
        this.animationId = null;
        this.lastTime = 0;
        this.autoSaveInterval = null;
        
        this.throwerPosition = { x: 120, y: this.height - 180 };
        
        this.init();
    }

    init() {
        this.ui.updateKnifeOptions(this.state.unlockedKnives);
        this.ui.updateSceneOptions(this.state.unlockedScenes);
        this.ui.updateUI();
        this.ui.disableControls(true);
        
        setTimeout(() => {
            this.ui.showScreen('menuScreen');
        }, 100);
        
        this.startAutoSave();
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'paused') {
                StorageManager.save(this.state);
            }
        }, 5000);
    }

    startGame() {
        this.state.gameStatus = 'playing';
        this.state.score = 0;
        this.state.knivesLeft = GameConfig.INITIAL_KNIVES;
        this.state.knives = [];
        this.state.particles = [];
        this.state.fireworks = [];
        this.state.dustParticles = this.sceneRenderer.createDustParticles();
        this.state.round = 1;
        this.state.targetHits = 0;
        
        this.setupLevel();
        
        this.ui.showScreen('playing');
        this.ui.disableControls(false);
        this.ui.updateUI();
        
        StorageManager.save(this.state);
        
        if (!this.animationId) {
            this.gameLoop();
        }
    }

    setupLevel() {
        const sceneConfig = GameData.getSceneConfig(this.state.currentScene);
        this.state.targets = [];
        this.state.obstacles = [];
        
        const targetStates = ['static', 'moving', 'rotating', 'shaking', 'flashing'];
        const levelIndex = Math.min(this.state.currentLevel - 1, targetStates.length - 1);
        this.state.targetState = targetStates[levelIndex];
        
        const targetCount = 1 + Math.floor(this.state.currentLevel / 3);
        for (let i = 0; i < targetCount; i++) {
            const targetX = 500 + (i - targetCount / 2) * 150;
            const targetY = 200 + Math.random() * 100;
            const target = new Target(targetX, targetY, 60, this.state.targetState, sceneConfig.targetSpeed);
            this.state.targets.push(target);
        }
        
        for (let i = 0; i < sceneConfig.obstacles; i++) {
            const types = ['wood', 'metal', 'cloth'];
            const type = types[Math.floor(Math.random() * types.length)];
            const obstacle = new Obstacle(
                300 + Math.random() * 400,
                150 + Math.random() * 250,
                30 + Math.random() * 40,
                30 + Math.random() * 40,
                type
            );
            this.state.obstacles.push(obstacle);
        }
    }

    throwKnife() {
        if (this.state.gameStatus !== 'playing') return;
        if (this.state.knivesLeft <= 0) return;
        
        const flyingKnives = this.state.knives.filter(k => k.isFlying);
        if (flyingKnives.length > 0) return;
        
        const knife = new Knife(
            this.throwerPosition.x + 30,
            this.throwerPosition.y,
            this.state.angle,
            this.state.power,
            this.state.currentKnifeType
        );
        
        this.state.knives.push(knife);
        this.state.knivesLeft--;
        this.ui.disableControls(true);
        this.ui.updateUI();
        
        StorageManager.save(this.state);
    }

    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 16.67;
        this.lastTime = currentTime;
        
        if (this.state.gameStatus === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        this.state.knives.forEach(knife => {
            PhysicsEngine.updateKnife(knife, deltaTime);
        });
        
        this.state.targets.forEach(target => {
            PhysicsEngine.updateTarget(target, deltaTime);
        });
        
        this.state.obstacles.forEach(obstacle => {
            PhysicsEngine.updateObstacle(obstacle);
        });
        
        this.checkCollisions();
        this.cleanupKnives();
        this.checkGameState();
        
        this.sceneRenderer.updateParticles(this.state.particles);
        this.state.fireworks.forEach(fw => this.sceneRenderer.updateParticles(fw));
        this.updateDustParticles();
    }

    checkCollisions() {
        const groundY = this.height - 100;
        
        this.state.knives.forEach(knife => {
            if (!knife.isFlying || knife.isStuck) return;
            
            for (let target of this.state.targets) {
                const hitResult = PhysicsEngine.checkTargetCollision(knife, target);
                if (hitResult) {
                    this.onTargetHit(knife, target, hitResult);
                    return;
                }
            }
            
            for (let obstacle of this.state.obstacles) {
                if (PhysicsEngine.checkObstacleCollision(knife, obstacle)) {
                    this.onObstacleHit(knife, obstacle);
                    return;
                }
            }
            
            if (PhysicsEngine.checkGroundCollision(knife, groundY)) {
                this.onGroundHit(knife);
                return;
            }
            
            if (PhysicsEngine.checkWallCollision(knife, this.width)) {
                return;
            }
        });
    }

    onTargetHit(knife, target, hitResult) {
        const sceneConfig = GameData.getSceneConfig(this.state.currentScene);
        const score = PhysicsEngine.calculateScore(
            sceneConfig.baseScore,
            hitResult,
            1 + this.state.currentLevel * 0.1,
            knife.damage
        );
        
        this.state.score += score;
        this.state.totalScore += score;
        this.state.targetHits++;
        
        if (this.state.totalScore > this.state.highScore) {
            this.state.highScore = this.state.totalScore;
            StorageManager.saveHighScore(this.state.highScore);
        }
        
        const hitParticles = this.sceneRenderer.createParticles(knife.x, knife.y, '#FFD700', 15);
        this.state.particles.push(...hitParticles);
        
        if (hitResult.score >= 30) {
            const firework = this.sceneRenderer.createFirework(knife.x, knife.y);
            this.state.fireworks.push(firework);
        }
        
        this.ui.showHitFeedback(score, hitResult.zoneName);
        this.ui.updateUI();
        
        setTimeout(() => {
            this.ui.disableControls(false);
        }, 500);
        
        StorageManager.save(this.state);
    }

    onObstacleHit(knife, obstacle) {
        knife.isFlying = false;
        
        const hitParticles = this.sceneRenderer.createParticles(knife.x, knife.y, '#8B4513', 10);
        this.state.particles.push(...hitParticles);
        
        setTimeout(() => {
            this.ui.disableControls(false);
        }, 300);
    }

    onGroundHit(knife) {
        const hitParticles = this.sceneRenderer.createParticles(knife.x, knife.y, '#D2B48C', 8);
        this.state.particles.push(...hitParticles);
        
        setTimeout(() => {
            this.ui.disableControls(false);
        }, 300);
    }

    cleanupKnives() {
        this.state.knives = this.state.knives.filter(knife => {
            return knife.isFlying || knife.isStuck;
        });
        
        this.state.fireworks = this.state.fireworks.filter(fw => fw.length > 0);
    }

    updateDustParticles() {
        this.sceneRenderer.updateParticles(this.state.dustParticles);
        
        if (Math.random() < 0.05 && this.state.dustParticles.length < 30) {
            const newDust = this.sceneRenderer.createDustParticles().slice(0, 2);
            this.state.dustParticles.push(...newDust);
        }
    }

    checkGameState() {
        const activeKnives = this.state.knives.filter(k => k.isFlying);
        
        if (activeKnives.length === 0 && this.state.knivesLeft <= 0) {
            const targetScore = GameConfig.POINTS_PER_LEVEL * this.state.currentLevel;
            
            if (this.state.score >= targetScore) {
                this.levelComplete();
            } else {
                this.gameOver();
            }
        }
    }

    levelComplete() {
        this.state.gameStatus = 'levelComplete';
        
        this.unlockContent();
        
        this.ui.updateUI();
        this.ui.showScreen('levelCompleteScreen');
        StorageManager.save(this.state);
    }

    gameOver() {
        this.state.gameStatus = 'gameOver';
        this.ui.updateUI();
        this.ui.showScreen('gameOverScreen');
        StorageManager.save(this.state);
    }

    unlockContent() {
        const scenes = Object.values(GameConfig.SCENES);
        const currentSceneIndex = scenes.findIndex(s => s.id === this.state.currentScene);
        
        if (currentSceneIndex < scenes.length - 1 && this.state.currentLevel >= 3) {
            const nextScene = scenes[currentSceneIndex + 1];
            if (!this.state.unlockedScenes.includes(nextScene.id)) {
                this.state.unlockedScenes.push(nextScene.id);
                this.ui.updateSceneOptions(this.state.unlockedScenes);
            }
        }
        
        const knives = Object.values(GameConfig.KNIFE_TYPES);
        const unlockedCount = this.state.unlockedKnives.length;
        if (unlockedCount < knives.length && this.state.currentLevel >= unlockedCount * 2) {
            const nextKnife = knives[unlockedCount];
            if (!this.state.unlockedKnives.includes(nextKnife.id)) {
                this.state.unlockedKnives.push(nextKnife.id);
                this.ui.updateKnifeOptions(this.state.unlockedKnives);
            }
        }
    }

    nextLevel() {
        this.state.currentLevel++;
        this.state.score = 0;
        this.state.knivesLeft = GameConfig.INITIAL_KNIVES + Math.floor(this.state.currentLevel / 2);
        this.state.knives = [];
        this.state.particles = [];
        this.state.fireworks = [];
        this.state.targetHits = 0;
        
        this.setupLevel();
        
        this.state.gameStatus = 'playing';
        this.ui.showScreen('playing');
        this.ui.disableControls(false);
        this.ui.updateUI();
        
        StorageManager.save(this.state);
    }

    pauseGame() {
        if (this.state.gameStatus !== 'playing') return;
        
        this.state.gameStatus = 'paused';
        this.ui.updateUI();
        this.ui.showScreen('pauseScreen');
        StorageManager.save(this.state);
    }

    resumeGame() {
        if (this.state.gameStatus !== 'paused') return;
        
        this.state.gameStatus = 'playing';
        this.ui.showScreen('playing');
    }

    restartGame() {
        this.state.currentLevel = 1;
        this.state.score = 0;
        this.state.totalScore = 0;
        this.startGame();
    }

    quitToMenu() {
        this.state.gameStatus = 'menu';
        this.state.knives = [];
        this.state.targets = [];
        this.state.obstacles = [];
        this.state.particles = [];
        this.state.fireworks = [];
        
        this.ui.showScreen('menuScreen');
        this.ui.disableControls(true);
        this.ui.updateUI();
        
        StorageManager.save(this.state);
    }

    render() {
        const sceneConfig = GameData.getSceneConfig(this.state.currentScene);
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.sceneRenderer.drawBackground(sceneConfig);
        
        this.sceneRenderer.drawParticles(this.state.dustParticles);
        
        this.drawThrower();
        
        this.state.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        
        this.state.targets.forEach(target => target.draw(this.ctx));
        
        this.state.knives.forEach(knife => knife.draw(this.ctx));
        
        if (this.state.gameStatus === 'playing') {
            const flyingKnives = this.state.knives.filter(k => k.isFlying);
            if (flyingKnives.length === 0 && this.state.knivesLeft > 0) {
                this.sceneRenderer.drawAimLine(
                    this.throwerPosition.x + 30,
                    this.throwerPosition.y,
                    this.state.angle,
                    this.state.power
                );
                this.sceneRenderer.drawTrajectoryPreview(
                    this.throwerPosition.x + 30,
                    this.throwerPosition.y,
                    this.state.angle,
                    this.state.power,
                    GameConfig.GRAVITY
                );
            }
        }
        
        this.sceneRenderer.drawParticles(this.state.particles);
        this.state.fireworks.forEach(fw => this.sceneRenderer.drawParticles(fw));
    }

    drawThrower() {
        const x = this.throwerPosition.x;
        const y = this.throwerPosition.y;
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 20, 15, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFDAB9';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 15, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x - 5, y - 18, 2, 0, Math.PI * 2);
        this.ctx.arc(x + 5, y - 18, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 10, 4, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y - 30);
        this.ctx.lineTo(x + 15, y - 30);
        this.ctx.lineTo(x, y - 50);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x - 5, y - 45, 10, 8);
        
        const angleRad = this.state.angle * Math.PI / 180;
        this.ctx.save();
        this.ctx.translate(x + 10, y + 5);
        this.ctx.rotate(-angleRad);
        
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.beginPath();
        this.ctx.moveTo(25, 0);
        this.ctx.lineTo(0, -4);
        this.ctx.lineTo(-15, -3);
        this.ctx.lineTo(-15, 3);
        this.ctx.lineTo(0, 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-20, -4, 8, 8);
        
        this.ctx.restore();
    }

    loadSavedGame() {
        const saved = StorageManager.load();
        if (saved) {
            Object.assign(this.state, saved);
            
            if (saved.targets) {
                const sceneConfig = GameData.getSceneConfig(this.state.currentScene);
                this.state.targets = saved.targets.map(t => 
                    new Target(t.x, t.y, t.radius, t.state, sceneConfig.targetSpeed)
                );
            }
            
            if (saved.obstacles) {
                this.state.obstacles = saved.obstacles.map(o =>
                    new Obstacle(o.x, o.y, o.width, o.height, 'wood')
                );
            }
            
            this.ui.updateKnifeOptions(this.state.unlockedKnives);
            this.ui.updateSceneOptions(this.state.unlockedScenes);
            this.ui.updateUI();
            
            if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'paused') {
                this.ui.showScreen('playing');
                if (!this.animationId) {
                    this.gameLoop();
                }
                if (this.state.gameStatus === 'paused') {
                    this.ui.showScreen('pauseScreen');
                }
            } else {
                this.ui.showScreen('menuScreen');
            }
            
            return true;
        }
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
