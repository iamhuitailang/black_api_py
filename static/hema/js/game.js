const Game = {
    isRunning: false,
    isPaused: false,
    lastTime: 0,
    deltaTime: 0,
    
    hippo: null,
    enemies: [],
    score: 0,
    wave: 1,
    maxWaves: 7,
    
    combo: 0,
    comboTimer: 0,
    comboDisplay: null,
    
    ultimateReadyNotified: false,
    
    selectedHippoType: 'normal',
    
    init() {
        Input.init();
        Renderer.init();
        
        this.comboDisplay = document.getElementById('combo-display');
        this.score = 0;
        this.wave = 1;
    },
    
    start(hippoType = 'normal') {
        this.selectedHippoType = hippoType;
        this.hippo = new Hippo(hippoType);
        this.enemies = [];
        this.score = 0;
        this.wave = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.ultimateReadyNotified = false;
        
        this.spawnWave();
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        ParticleSystem.clear();
        Input.reset();
        
        this.updateUI();
        this.gameLoop();
    },
    
    pause() {
        this.isPaused = true;
        this.saveState();
    },
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    restart() {
        this.start(this.selectedHippoType);
    },
    
    gameOver(victory = false) {
        this.isRunning = false;
        
        Storage.saveHighScore(this.score);
        
        const gameOverScreen = document.getElementById('gameover-screen');
        const gameOverTitle = document.getElementById('gameover-title');
        const gameOverScore = document.getElementById('gameover-score');
        
        gameOverTitle.textContent = victory ? '🎉 胜利！' : '💀 游戏结束';
        gameOverScore.textContent = `最终得分: ${this.score}`;
        
        gameOverScreen.classList.remove('hidden');
        
        Storage.clear();
    },
    
    gameLoop() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    },
    
    update() {
        Input.update();
        
        if (Input.spaceJustPressed) {
            if (Input.checkUltimateCombo() && this.hippo.ultimateEnergy >= 100) {
                this.hippo.useUltimate();
            } else {
                this.hippo.startBite();
            }
        }
        
        this.hippo.update(this.deltaTime, Input.getState());
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const shouldRemove = enemy.update(this.deltaTime, this.hippo);
            
            if (shouldRemove) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            if (!enemy.isDead && enemy.canDamage()) {
                const dist = Utils.distance(enemy.x, enemy.y, this.hippo.x, this.hippo.y);
                if (dist < 80) {
                    this.hippo.takeDamage(enemy.attack);
                }
            }
        }
        
        this.checkCollisions();
        ParticleSystem.update();
        
        this.updateCombo();
        this.checkWaveComplete();
        this.checkGameOver();
        this.updateUI();
        
        this.saveState();
    },
    
    checkCollisions() {
        const hitbox = this.hippo.getBiteHitbox();
        if (!hitbox) return;
        
        const damage = this.hippo.getDamage();
        
        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const dist = Utils.distance(hitbox.x, hitbox.y, enemy.x, enemy.y);
            if (dist < hitbox.radius + 30) {
                const wasAlive = enemy.health > 0;
                const killed = enemy.takeDamage(damage);
                
                if (wasAlive) {
                    this.hippo.addUltimateEnergy(CONFIG.ULTIMATE_ENERGY_PER_HIT);
                    this.addCombo();
                    
                    if (killed) {
                        this.score += enemy.score * (1 + this.combo * 0.1);
                        ParticleSystem.createWaterSplash(enemy.x, enemy.y);
                    } else {
                        this.score += 10;
                    }
                }
            }
        });
    },
    
    addCombo() {
        this.combo++;
        this.comboTimer = 2000;
        
        if (this.combo > 1) {
            this.showCombo();
        }
    },
    
    updateCombo() {
        if (this.comboTimer > 0) {
            this.comboTimer -= this.deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.hideCombo();
            }
        }
    },
    
    showCombo() {
        const comboText = document.getElementById('combo-text');
        comboText.textContent = `${this.combo} 连击！`;
        this.comboDisplay.classList.remove('hidden');
        this.comboDisplay.style.animation = 'none';
        this.comboDisplay.offsetHeight;
        this.comboDisplay.style.animation = 'combo-pop 0.5s ease-out';
    },
    
    hideCombo() {
        this.comboDisplay.classList.add('hidden');
    },
    
    checkWaveComplete() {
        const aliveEnemies = this.enemies.filter(e => !e.isDead);
        if (aliveEnemies.length === 0 && this.enemies.length > 0) {
            if (this.wave < this.maxWaves) {
                this.wave++;
                this.spawnWave();
            } else {
                this.gameOver(true);
            }
        }
    },
    
    spawnWave() {
        const waveConfig = CONFIG.WAVES[Math.min(this.wave - 1, CONFIG.WAVES.length - 1)];
        
        waveConfig.enemies.forEach(enemyGroup => {
            for (let i = 0; i < enemyGroup.count; i++) {
                const side = Math.random() > 0.5 ? -1 : 1;
                const x = side > 0 ? 
                    CONFIG.CANVAS_WIDTH - 100 - Math.random() * 200 :
                    100 + Math.random() * 200;
                const y = CONFIG.SWAMP_Y + 20 + Math.random() * 100;
                
                this.enemies.push(new Enemy(enemyGroup.type, x, y));
            }
        });
    },
    
    checkGameOver() {
        if (this.hippo.health <= 0) {
            this.gameOver(false);
        }
    },
    
    updateUI() {
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        const healthPercent = (this.hippo.health / this.hippo.maxHealth) * 100;
        
        healthFill.style.width = `${healthPercent}%`;
        healthText.textContent = `${Math.max(0, Math.ceil(this.hippo.health))}/${this.hippo.maxHealth}`;
        
        const ultimateFill = document.getElementById('ultimate-fill');
        ultimateFill.style.width = `${this.hippo.ultimateEnergy}%`;
        
        const ultimateReady = document.getElementById('ultimate-ready');
        if (this.hippo.ultimateEnergy >= 100 && !this.ultimateReadyNotified) {
            ultimateReady.classList.remove('hidden');
            this.ultimateReadyNotified = true;
        } else if (this.hippo.ultimateEnergy < 100) {
            ultimateReady.classList.add('hidden');
            this.ultimateReadyNotified = false;
        }
        
        document.getElementById('score-text').textContent = Math.floor(this.score);
        document.getElementById('wave-text').textContent = this.wave;
        document.getElementById('enemies-text').textContent = this.enemies.filter(e => !e.isDead).length;
    },
    
    render() {
        Renderer.render(this);
    },
    
    saveState() {
        const state = {
            selectedHippoType: this.selectedHippoType,
            hippo: this.hippo.getState(),
            enemies: this.enemies.map(e => e.getState()),
            score: this.score,
            wave: this.wave,
            combo: this.combo
        };
        Storage.save(state);
    },
    
    loadState() {
        const state = Storage.load();
        if (!state) return false;
        
        this.selectedHippoType = state.selectedHippoType;
        this.hippo = new Hippo(state.selectedHippoType);
        this.hippo.loadState(state.hippo);
        
        this.enemies = state.enemies.map(eState => {
            const enemy = new Enemy(eState.type, eState.x, eState.y);
            enemy.loadState(eState);
            return enemy;
        });
        
        this.score = state.score;
        this.wave = state.wave;
        this.combo = state.combo || 0;
        
        return true;
    },
    
    hasSavedState() {
        return Storage.load() !== null;
    }
};