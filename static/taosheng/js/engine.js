class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.state = 'menu';
        this.scene = null;
        this.player = null;
        this.hazardManager = new HazardManager();
        this.crowdManager = new CrowdManager();
        this.itemManager = new ItemManager();
        this.hud = new HUD();
        
        this.timeLeft = GameConfig.TIME.TOTAL * 1000;
        this.elapsedTime = 0;
        this.score = 0;
        
        this.lastTime = 0;
        this.running = false;
        
        this.particles = [];
        this.damageFlashTimer = 0;
        this.phaseTransitionText = '';
        this.phaseTransitionTimer = 0;
        
        this.setupAutoSave();
    }
    
    setupAutoSave() {
        setInterval(() => {
            if (this.state === 'playing') {
                this.saveGameState();
            }
        }, 5000);
    }
    
    startNewGame(sceneIndex) {
        this.scene = new Scene(sceneIndex);
        this.player = new Player(100, GameConfig.CANVAS_HEIGHT / 2);
        this.hazardManager.reset();
        this.crowdManager.reset(this.scene);
        this.itemManager.reset();
        this.hud.reset();
        
        this.timeLeft = GameConfig.TIME.TOTAL * 1000;
        this.elapsedTime = 0;
        this.score = 0;
        this.particles = [];
        this.damageFlashTimer = 0;
        this.phaseTransitionText = '第一阶段：零星掉落 - 注意躲避坠落物！';
        this.phaseTransitionTimer = 3000;
        
        this.state = 'playing';
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        Storage.clearGameState();
    }
    
    continueGame() {
        const savedState = Storage.getGameState();
        if (!savedState) return false;
        
        this.loadGameState(savedState);
        this.state = 'playing';
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        return true;
    }
    
    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.saveGameState();
        }
    }
    
    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    quitGame() {
        this.running = false;
        this.state = 'menu';
        Storage.clearGameState();
    }
    
    gameLoop() {
        if (!this.running || this.state !== 'playing') return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.timeLeft -= deltaTime;
        
        const oldPhase = this.scene.currentPhase;
        this.updatePhase();
        
        if (oldPhase !== this.scene.currentPhase) {
            this.onPhaseChange(this.scene.currentPhase);
        }
        
        if (this.timeLeft <= 0) {
            this.gameOver('逃生时间耗尽，你被困在了废墟中...');
            return;
        }
        
        this.scene.update(deltaTime);
        this.player.update(deltaTime, input, this.scene, this.crowdManager);
        
        if (this.player.isDead()) {
            this.gameOver('生命值耗尽，你不幸被坍塌掩埋...');
            return;
        }
        
        this.hazardManager.update(deltaTime, this.scene);
        this.crowdManager.update(deltaTime, this.player, this.scene);
        this.itemManager.update(deltaTime, this.scene);
        
        const damage = this.hazardManager.checkPlayerCollision(this.player);
        if (damage > 0) {
            this.player.takeDamage(damage);
            this.damageFlashTimer = 200;
            this.createDamageParticles();
        }
        
        if (this.scene.isInCollapseZone(this.player.getRect())) {
            this.player.takeDamage(0.3);
            this.damageFlashTimer = 100;
        }
        
        this.itemManager.checkPlayerPickup(this.player, this.crowdManager);
        
        if (this.scene.isAtExit(this.player)) {
            this.victory();
            return;
        }
        
        this.score = Math.floor(this.elapsedTime / 1000 * 5 + this.player.dodgedCount * GameConfig.SCORE.DODGE_BONUS);
        
        this.updateParticles(deltaTime);
        
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
        }
        
        if (this.phaseTransitionTimer > 0) {
            this.phaseTransitionTimer -= deltaTime;
        }
        
        this.hud.update(this.timeLeft, this.player, this.score, this.scene.currentPhase, this.scene.phaseProgress);
        
        input.clearKeyPressed();
    }
    
    onPhaseChange(newPhase) {
        this.scene.triggerShake(newPhase * 15, 2000);
        
        if (newPhase === 2) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (this.state === 'playing') {
                        this.hazardManager.spawnHazard('wall', this.scene);
                    }
                }, i * 300);
            }
            this.createPhaseTransitionParticles('#e67e22');
            this.phaseTransitionText = '警告：批量损毁阶段开始！';
            this.phaseTransitionTimer = 3000;
        } else if (newPhase === 3) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (this.state === 'playing') {
                        this.hazardManager.spawnHazard('wall', this.scene);
                    }
                }, i * 200);
            }
            this.createPhaseTransitionParticles('#e74c3c');
            this.phaseTransitionText = '警告：全域坍塌阶段开始！';
            this.phaseTransitionTimer = 3000;
        }
        
        this.damageFlashTimer = 500;
    }
    
    createPhaseTransitionParticles(color) {
        const centerX = GameConfig.CANVAS_WIDTH / 2;
        const centerY = GameConfig.CANVAS_HEIGHT / 2;
        
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const speed = Utils.randomRange(5, 12);
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1500,
                maxLife: 1500,
                color: color,
                size: Utils.randomRange(5, 15)
            });
        }
    }
    
    updatePhase() {
        const totalTime = GameConfig.TIME.TOTAL * 1000;
        const elapsed = this.elapsedTime;
        const overallProgress = elapsed / totalTime;
        
        let phase, phaseProgress;
        
        const phase1Duration = GameConfig.COLLAPSE_PHASES.PHASE_1.DURATION * 1000;
        const phase2Duration = GameConfig.COLLAPSE_PHASES.PHASE_2.DURATION * 1000;
        
        if (elapsed < phase1Duration) {
            phase = 1;
            phaseProgress = elapsed / phase1Duration;
        } else if (elapsed < phase1Duration + phase2Duration) {
            phase = 2;
            phaseProgress = (elapsed - phase1Duration) / phase2Duration;
        } else {
            phase = 3;
            const phase3Elapsed = elapsed - phase1Duration - phase2Duration;
            phaseProgress = Math.min(phase3Elapsed / (GameConfig.COLLAPSE_PHASES.PHASE_3.DURATION * 1000), 1);
        }
        
        this.scene.setPhase(phase, phaseProgress);
        
        const baseHazardMultiplier = GameConfig.COLLAPSE_PHASES[`PHASE_${phase}`].HAZARD_MULTIPLIER;
        const baseCrowdMultiplier = GameConfig.COLLAPSE_PHASES[`PHASE_${phase}`].CROWD_MULTIPLIER;
        
        const intraPhaseBoost = 1 + phaseProgress * 0.3;
        
        const hazardMultiplier = baseHazardMultiplier * intraPhaseBoost;
        const crowdMultiplier = baseCrowdMultiplier * (1 + phaseProgress * 0.2);
        
        this.hazardManager.setPhaseMultiplier(hazardMultiplier);
        this.crowdManager.setPhaseMultiplier(crowdMultiplier);
    }
    
    createDamageParticles() {
        const centerX = this.player.getCenterX();
        const centerY = this.player.getCenterY();
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Utils.randomRange(-3, 3),
                vy: Utils.randomRange(-3, 3),
                life: 500,
                maxLife: 500,
                color: '#e74c3c',
                size: Utils.randomRange(3, 8)
            });
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            return p.life > 0;
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        
        this.scene.render(this.ctx);
        this.itemManager.render(this.ctx);
        this.crowdManager.render(this.ctx);
        this.player.render(this.ctx);
        this.hazardManager.render(this.ctx);
        this.renderParticles();
        
        if (this.damageFlashTimer > 0) {
            this.ctx.fillStyle = `rgba(231, 76, 60, ${this.damageFlashTimer / 500 * 0.3})`;
            this.ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        }
        
        if (this.phaseTransitionTimer > 0 && this.phaseTransitionText) {
            const alpha = Math.min(this.phaseTransitionTimer / 1000, 1);
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            let textColor;
            if (this.phaseTransitionText.includes('第一阶段')) {
                textColor = '#3498db';
            } else {
                textColor = '#e74c3c';
            }
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            Utils.drawRoundedRect(this.ctx, GameConfig.CANVAS_WIDTH / 2 - 220, 80, 440, 60, 15);
            this.ctx.fill();
            
            this.ctx.strokeStyle = textColor;
            this.ctx.lineWidth = 3;
            Utils.drawRoundedRect(this.ctx, GameConfig.CANVAS_WIDTH / 2 - 220, 80, 440, 60, 15);
            this.ctx.stroke();
            
            this.ctx.font = 'bold 22px Microsoft YaHei';
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.phaseTransitionText, GameConfig.CANVAS_WIDTH / 2, 118);
            
            this.ctx.restore();
        }
        
        this.renderPhaseIndicator();
    }
    
    renderParticles() {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    renderPhaseIndicator() {
        const elapsed = this.elapsedTime;
        const phase1Duration = GameConfig.COLLAPSE_PHASES.PHASE_1.DURATION * 1000;
        const phase2Duration = GameConfig.COLLAPSE_PHASES.PHASE_2.DURATION * 1000;
        
        let phaseName, phaseDescription, phaseColor;
        
        if (elapsed < phase1Duration) {
            phaseName = '第一阶段';
            phaseDescription = '零星掉落';
            phaseColor = '#3498db';
        } else if (elapsed < phase1Duration + phase2Duration) {
            phaseName = '第二阶段';
            phaseDescription = '批量损毁';
            phaseColor = '#e67e22';
        } else {
            phaseName = '第三阶段';
            phaseDescription = '全域坍塌';
            phaseColor = '#e74c3c';
        }
        
        this.ctx.save();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        Utils.drawRoundedRect(this.ctx, GameConfig.CANVAS_WIDTH / 2 - 120, 8, 240, 55, 10);
        this.ctx.fill();
        
        this.ctx.strokeStyle = phaseColor;
        this.ctx.lineWidth = 2;
        Utils.drawRoundedRect(this.ctx, GameConfig.CANVAS_WIDTH / 2 - 120, 8, 240, 55, 10);
        this.ctx.stroke();
        
        this.ctx.font = 'bold 16px Microsoft YaHei';
        this.ctx.fillStyle = phaseColor;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${phaseName}: ${phaseDescription}`, GameConfig.CANVAS_WIDTH / 2, 30);
        
        const phaseProgress = this.scene.phaseProgress;
        const barWidth = 200;
        const barX = GameConfig.CANVAS_WIDTH / 2 - barWidth / 2;
        const barY = 42;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        Utils.drawRoundedRect(this.ctx, barX, barY, barWidth, 15, 5);
        this.ctx.fill();
        
        this.ctx.fillStyle = phaseColor;
        Utils.drawRoundedRect(this.ctx, barX, barY, barWidth * phaseProgress, 15, 5);
        this.ctx.fill();
        
        this.ctx.font = '10px Microsoft YaHei';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`${Math.floor(phaseProgress * 100)}%`, GameConfig.CANVAS_WIDTH / 2, barY + 12);
        
        this.ctx.restore();
    }
    
    gameOver(reason) {
        this.running = false;
        this.state = 'gameover';
        
        const stats = {
            score: this.score,
            survivalTime: Math.floor(this.elapsedTime / 1000),
            dodgedCount: this.player.dodgedCount
        };
        
        const isNewRecord = Storage.setHighScore(this.score);
        
        Storage.clearGameState();
        
        menuManager.showGameOverMenu(reason, stats, isNewRecord);
    }
    
    victory() {
        this.running = false;
        this.state = 'victory';
        
        const timeBonus = Math.floor(this.timeLeft / 1000 * GameConfig.SCORE.TIME_BONUS);
        const healthBonus = Math.floor(this.player.health * GameConfig.SCORE.HEALTH_BONUS);
        const totalScore = GameConfig.SCORE.BASE_VICTORY + timeBonus + healthBonus + this.player.dodgedCount * GameConfig.SCORE.DODGE_BONUS;
        
        const stats = {
            victoryTime: Math.floor(this.elapsedTime / 1000),
            remainingHealth: this.player.health,
            score: totalScore
        };
        
        const isNewRecord = Storage.setHighScore(totalScore);
        
        Storage.addRecord({
            sceneIndex: this.scene.sceneIndex,
            victoryTime: stats.victoryTime,
            remainingHealth: stats.remainingHealth,
            score: totalScore,
            timestamp: Date.now()
        });
        
        Storage.clearGameState();
        
        menuManager.showVictoryMenu(stats, isNewRecord);
    }
    
    saveGameState() {
        if (this.state !== 'playing') return;
        
        const state = {
            scene: this.scene.getState(),
            player: {
                x: this.player.x,
                y: this.player.y,
                health: this.player.health,
                buffs: {
                    speed: { ...this.player.buffs.speed },
                    shield: { ...this.player.buffs.shield }
                },
                dodgedCount: this.player.dodgedCount,
                invincible: this.player.invincible,
                invincibleTimer: this.player.invincibleTimer
            },
            hazards: this.hazardManager.getState(),
            crowd: this.crowdManager.getState(),
            items: this.itemManager.getState(),
            timeLeft: this.timeLeft,
            elapsedTime: this.elapsedTime,
            score: this.score,
            savedAt: Date.now()
        };
        
        Storage.saveGameState(state);
    }
    
    loadGameState(state) {
        this.scene = new Scene(state.scene.sceneIndex);
        this.scene.loadState(state.scene);
        
        this.player = new Player(state.player.x, state.player.y);
        this.player.health = state.player.health;
        this.player.buffs = state.player.buffs;
        this.player.dodgedCount = state.player.dodgedCount;
        this.player.invincible = state.player.invincible;
        this.player.invincibleTimer = state.player.invincibleTimer;
        
        this.hazardManager.loadState(state.hazards);
        this.crowdManager.loadState(state.crowd, this.scene);
        this.itemManager.loadState(state.items, this.scene);
        
        this.timeLeft = state.timeLeft;
        this.elapsedTime = state.elapsedTime;
        this.score = state.score;
        
        this.hud.reset();
    }
}
