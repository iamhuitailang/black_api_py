const Game = {
    canvas: null,
    playerCannon: null,
    enemyCannon: null,
    currentTurn: 'player',
    gameState: 'menu',
    isPaused: false,
    selectedCannon: 'basic',
    totalDamage: 0,
    hitCount: 0,
    lastTime: 0,
    animationId: null,
    rapidFireClicks: [],
    pendingDamage: [],
    autoSaveInterval: null,

    init(canvas) {
        this.canvas = canvas;
        Renderer.init(canvas);
        this.setupEventListeners();
        this.loadSavedGame();
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.quitToMenu());

        document.querySelectorAll('.cannon-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.cannon-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCannon = card.dataset.cannon;
            });
        });

        document.querySelector('.cannon-card[data-cannon="basic"]').classList.add('selected');
    },

    handleKeyDown(e) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        if (this.currentTurn !== 'player') return;

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.playerCannon.adjustAngle(GameConfig.ANGLE_STEP);
                this.updateUI();
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.playerCannon.adjustAngle(-GameConfig.ANGLE_STEP);
                this.updateUI();
                break;
            case 'Space':
                e.preventDefault();
                if (!this.playerCannon.isCharging) {
                    this.playerCannon.startCharging();
                    this.checkRapidFire();
                }
                break;
            case 'Escape':
                this.pauseGame();
                break;
        }
    },

    handleKeyUp(e) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        if (this.currentTurn !== 'player') return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (this.playerCannon.isCharging) {
                const fireData = this.playerCannon.stopCharging();
                if (fireData) {
                    this.playerFire(fireData);
                }
            }
        }
    },

    checkRapidFire() {
        const now = Date.now();
        this.rapidFireClicks.push(now);

        const timeWindow = GameConfig.SPECIAL_SKILLS.rapidFire.condition.timeWindow;
        this.rapidFireClicks = this.rapidFireClicks.filter(t => now - t < timeWindow);

        if (this.rapidFireClicks.length >= GameConfig.SPECIAL_SKILLS.rapidFire.condition.rapidClicks) {
            this.triggerRapidFire();
            this.rapidFireClicks = [];
        }
    },

    triggerRapidFire() {
        this.showSkillIndicator(GameConfig.SPECIAL_SKILLS.rapidFire.name);
        const skill = GameConfig.SPECIAL_SKILLS.rapidFire;

        for (let i = 0; i < skill.count; i++) {
            setTimeout(() => {
                if (this.gameState === 'playing' && !this.isPaused) {
                    const fireData = this.playerCannon.fire(50 + i * 10);
                    if (fireData) {
                        ProjectileManager.createProjectile(
                            fireData.x, fireData.y,
                            fireData.angle, fireData.power,
                            fireData.config, true, skill
                        );
                    }
                }
            }, i * 200);
        }
    },

    playerFire(fireData) {
        const specialSkill = this.playerCannon.checkSpecialSkill(fireData.power, this.playerCannon.angle);

        if (specialSkill) {
            this.showSkillIndicator(specialSkill.name);
        }

        ProjectileManager.createProjectile(
            fireData.x, fireData.y,
            fireData.angle, fireData.power,
            fireData.config, true, specialSkill
        );

        const muzzle = this.playerCannon.getMuzzlePosition();
        Renderer.addBubbleParticles(muzzle.x, muzzle.y, 15, fireData.config.color);

        this.currentTurn = 'enemy';
        this.updateUI();
    },

    enemyFire(fireData) {
        ProjectileManager.createProjectile(
            fireData.x, fireData.y,
            fireData.angle, fireData.power,
            fireData.config, false
        );

        const muzzle = this.enemyCannon.getMuzzlePosition();
        Renderer.addBubbleParticles(muzzle.x, muzzle.y, 15, fireData.config.color);
    },

    showSkillIndicator(text) {
        const indicator = document.getElementById('skillIndicator');
        document.getElementById('skillText').textContent = `✨ ${text} 触发！`;
        indicator.classList.remove('hidden');
        setTimeout(() => indicator.classList.add('hidden'), 1500);
    },

    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');

        this.playerCannon = CannonFactory.createPlayerCannon(this.selectedCannon);
        this.enemyCannon = CannonFactory.createEnemyCannon();
        this.currentTurn = 'player';
        this.gameState = 'playing';
        this.isPaused = false;
        this.totalDamage = 0;
        this.hitCount = 0;
        this.rapidFireClicks = [];

        ProjectileManager.clear();
        Renderer.clearParticles();
        EnemyAI.reset();
        EnemyAI.onFire = (fireData) => this.enemyFire(fireData);

        this.lastTime = performance.now();
        this.gameLoop();
        this.startAutoSave();
        this.updateUI();
    },

    pauseGame() {
        if (this.gameState !== 'playing') return;
        this.isPaused = true;
        document.getElementById('pauseScreen').classList.remove('hidden');
        this.saveGame();
    },

    resumeGame() {
        this.isPaused = false;
        document.getElementById('pauseScreen').classList.add('hidden');
        this.lastTime = performance.now();
    },

    restartGame() {
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.stopAutoSave();
        Storage.clearGameState();
        this.startGame();
    },

    quitToMenu() {
        this.gameState = 'menu';
        this.isPaused = false;
        this.stopAutoSave();
        cancelAnimationFrame(this.animationId);
        Storage.clearGameState();

        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('continueBtn').classList.add('hidden');

        ProjectileManager.clear();
        Renderer.clearParticles();
    },

    gameLoop(currentTime = performance.now()) {
        if (this.gameState !== 'playing') return;

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));

        if (this.isPaused) {
            this.lastTime = currentTime;
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();
    },

    update(deltaTime) {
        Renderer.update(deltaTime);

        if (this.playerCannon) {
            this.playerCannon.update(deltaTime);
        }

        if (this.enemyCannon) {
            this.enemyCannon.update(deltaTime);
        }

        if (this.currentTurn === 'enemy') {
            const activePlayerProjectiles = ProjectileManager.getActiveProjectiles().filter(p => p.isPlayer && p.active);
            if (activePlayerProjectiles.length === 0) {
                EnemyAI.update(this.enemyCannon, this.playerCannon, [], deltaTime);
            }
        }

        ProjectileManager.update();
        this.processExplosions();
        this.checkTurnEnd();
        this.checkGameOver();
    },

    processExplosions() {
        const explosions = ProjectileManager.getExplosions();

        explosions.forEach(projectile => {
            if (!projectile.processed) {
                projectile.processed = true;

                const targetCannon = projectile.isPlayer ? this.enemyCannon : this.playerCannon;
                const damage = projectile.getExplosionDamage(targetCannon.x, targetCannon.y);

                if (damage > 0) {
                    targetCannon.takeDamage(damage);

                    if (projectile.isPlayer) {
                        this.totalDamage += damage;
                        this.hitCount++;
                    }

                    Renderer.addExplosionParticles(
                        projectile.blastData.x,
                        projectile.blastData.y,
                        25,
                        ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8C42']
                    );
                }
            }
        });
    },

    checkTurnEnd() {
        const activeProjectiles = ProjectileManager.getActiveProjectiles().filter(p => p.active);
        if (activeProjectiles.length === 0) {
            if (this.currentTurn === 'enemy' && !EnemyAI.isActing()) {
                this.currentTurn = 'player';
                this.updateUI();
            }
        }
    },

    checkGameOver() {
        if (this.playerCannon && this.playerCannon.isDead()) {
            this.endGame(false);
        } else if (this.enemyCannon && this.enemyCannon.isDead()) {
            this.endGame(true);
        }
    },

    endGame(playerWon) {
        this.gameState = 'gameOver';
        this.stopAutoSave();
        Storage.clearGameState();

        cancelAnimationFrame(this.animationId);

        document.getElementById('gameOverTitle').textContent = playerWon ? '🎉 胜利！' : '💔 失败...';
        document.getElementById('gameOverText').textContent = playerWon ?
            '恭喜你成功击败了对手！' : '被对手击败了，再接再厉！';
        document.getElementById('totalDamage').textContent = this.totalDamage;
        document.getElementById('hitCount').textContent = this.hitCount;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    },

    render() {
        Renderer.render({
            playerCannon: this.playerCannon,
            enemyCannon: this.enemyCannon,
            currentTurn: this.currentTurn
        });
    },

    updateUI() {
        if (this.playerCannon) {
            const playerHealthPercent = this.playerCannon.getHealthPercent();
            document.getElementById('playerHealth').style.width = `${playerHealthPercent}%`;
            document.getElementById('playerHealthText').textContent =
                `${this.playerCannon.health}/${this.playerCannon.maxHealth}`;
        }

        if (this.enemyCannon) {
            const enemyHealthPercent = this.enemyCannon.getHealthPercent();
            document.getElementById('enemyHealth').style.width = `${enemyHealthPercent}%`;
            document.getElementById('enemyHealthText').textContent =
                `${this.enemyCannon.health}/${this.enemyCannon.maxHealth}`;
        }

        if (this.playerCannon) {
            document.getElementById('angleText').textContent = `${Math.round(this.playerCannon.angle)}°`;
        }

        document.getElementById('turnText').textContent =
            this.currentTurn === 'player' ? '🎯 你的回合' : '🤖 敌方回合';

        if (this.playerCannon && this.playerCannon.isCharging) {
            const powerPercent = Math.round(this.playerCannon.power);
            document.getElementById('powerFill').style.width = `${powerPercent}%`;
            document.getElementById('powerText').textContent = `威力: ${powerPercent}%`;
        } else {
            document.getElementById('powerFill').style.width = '0%';
            document.getElementById('powerText').textContent = '威力: 0%';
        }
    },

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.gameState === 'playing' && !this.isPaused) {
                this.saveGame();
            }
        }, 5000);
    },

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    },

    saveGame() {
        Storage.saveGameState({
            gameState: this.gameState,
            selectedCannon: this.selectedCannon,
            playerHealth: this.playerCannon ? this.playerCannon.health : 100,
            enemyHealth: this.enemyCannon ? this.enemyCannon.health : 100,
            playerAngle: this.playerCannon ? this.playerCannon.angle : 45,
            enemyAngle: this.enemyCannon ? this.enemyCannon.angle : 135,
            currentTurn: this.currentTurn,
            isPaused: this.isPaused,
            totalDamage: this.totalDamage,
            hitCount: this.hitCount
        });
    },

    loadSavedGame() {
        const saved = Storage.loadGameState();
        if (saved && saved.gameState === 'playing') {
            this.selectedCannon = saved.selectedCannon || 'basic';
            document.querySelectorAll('.cannon-card').forEach(c => c.classList.remove('selected'));
            document.querySelector(`.cannon-card[data-cannon="${this.selectedCannon}"]`)?.classList.add('selected');
            
            const continueBtn = document.getElementById('continueBtn');
            continueBtn.classList.remove('hidden');
            continueBtn.onclick = () => {
                this.resumeSavedGame(saved);
            };
        }
    },

    resumeSavedGame(saved) {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');

        this.playerCannon = CannonFactory.createPlayerCannon(this.selectedCannon);
        this.enemyCannon = CannonFactory.createEnemyCannon();
        
        this.playerCannon.health = saved.playerHealth || this.playerCannon.maxHealth;
        this.enemyCannon.health = saved.enemyHealth || this.enemyCannon.maxHealth;
        this.playerCannon.angle = saved.playerAngle || 45;
        this.playerCannon.targetAngle = saved.playerAngle || 45;
        this.enemyCannon.angle = saved.enemyAngle || 135;
        this.enemyCannon.targetAngle = saved.enemyAngle || 135;
        
        this.currentTurn = saved.currentTurn || 'player';
        this.gameState = 'playing';
        this.isPaused = false;
        this.totalDamage = saved.totalDamage || 0;
        this.hitCount = saved.hitCount || 0;
        this.rapidFireClicks = [];

        ProjectileManager.clear();
        Renderer.clearParticles();
        EnemyAI.reset();
        EnemyAI.onFire = (fireData) => this.enemyFire(fireData);

        this.lastTime = performance.now();
        this.gameLoop();
        this.startAutoSave();
        this.updateUI();
    }
};
