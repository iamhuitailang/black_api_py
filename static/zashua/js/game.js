class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.groundY = this.renderer.groundY;
        
        this.players = [];
        this.items = [];
        this.buffs = [];
        
        this.score = {};
        this.round = 1;
        this.elapsedTime = 0;
        this.lastTime = 0;
        
        this.isPaused = false;
        this.isGameOver = false;
        this.theme = 'hell';
        this.currentTurn = 0;
        this.currentThrower = null;
        
        this.itemSpeedMultiplier = 1;
        this.isInvincible = false;
        this.hasShield = false;
        
        this.saveInterval = null;
        this.animationId = null;
        this.throwCooldown = 0;
        this.noActivityTimer = 0;
    }
    
    init(playerConfig) {
        this.players = [];
        this.items = [];
        this.buffs = [];
        this.round = 1;
        this.elapsedTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.theme = playerConfig.theme;
        this.currentTurn = 0;
        this.itemSpeedMultiplier = 1;
        this.isInvincible = false;
        this.hasShield = false;
        this.throwCooldown = 0;
        
        this.renderer.setTheme(this.theme);
        
        const playerTypes = Object.keys(GameConfig.CHARACTERS);
        const aiCount = playerConfig.aiCount || 1;
        const humanType = playerConfig.characterType || 'clown';
        
        const humanPlayer = new Player(humanType, false);
        humanPlayer.name = '你 (' + humanPlayer.name + ')';
        this.players.push(humanPlayer);
        
        const availableTypes = playerTypes.filter(t => t !== humanType);
        for (let i = 0; i < aiCount; i++) {
            const type = availableTypes[i % availableTypes.length];
            const aiPlayer = new Player(type, true);
            aiPlayer.name = '电脑' + (i + 1) + ' (' + aiPlayer.name + ')';
            this.players.push(aiPlayer);
        }
        
        this.positionPlayers();
        
        const firstAI = this.players.find(p => p.isAI && !p.isEliminated);
        if (firstAI) {
            this.currentThrower = firstAI.id;
            firstAI.aiThrowTimer = 0;
        } else {
            const firstPlayer = this.players.find(p => !p.isEliminated);
            if (firstPlayer) {
                this.currentThrower = firstPlayer.id;
            }
        }
        
        this.startGameLoop();
        this.startAutoSave();
        
        setTimeout(() => this.spawnItem(), 1000);
    }
    
    positionPlayers() {
        const playerCount = this.players.length;
        const zoneWidth = this.canvas.width / playerCount;
        
        this.players.forEach((player, index) => {
            const zoneX = index * zoneWidth + zoneWidth / 2;
            const y = this.groundY - 30;
            player.setPosition(zoneX, y);
            player.position = index;
            player.zoneWidth = zoneWidth;
        });
    }
    
    getPlayerBounds(player) {
        const playerCount = this.players.length;
        const zoneWidth = this.canvas.width / playerCount;
        const index = player.position;
        
        return {
            minX: index * zoneWidth + 40,
            maxX: (index + 1) * zoneWidth - 40
        };
    }
    
    getHumanPlayer() {
        return this.players.find(p => !p.isAI);
    }
    
    getCatchableItem(player) {
        return this.items.find(item => 
            item.isActive && 
            item.toPlayer === player.id &&
            Physics.checkPlayerCatch(item, player)
        );
    }
    
    getNextTarget(currentPlayer) {
        const validTargets = this.players.filter(p => 
            p.id !== currentPlayer.id && !p.isEliminated
        );
        
        if (validTargets.length === 0) return null;
        
        const currentIndex = this.players.findIndex(p => p.id === currentPlayer.id);
        for (let i = 1; i <= this.players.length; i++) {
            const nextIndex = (currentIndex + i) % this.players.length;
            const player = this.players[nextIndex];
            if (!player.isEliminated) {
                return player;
            }
        }
        
        return validTargets[0];
    }
    
    handleThrow(fromPlayer, toPlayer, throwType = 'normal') {
        if (fromPlayer.isStunned || fromPlayer.isEliminated) return;
        if (toPlayer.isEliminated) return;
        
        if (this.throwCooldown > 0) return;
        this.throwCooldown = 200;
        
        const item = ItemFactory.createRandomItem();
        if (!item) return;
        
        let speed = item.config.speed * fromPlayer.throwSpeed;
        let heightFactor = 1;
        
        if (throwType === 'fast') {
            speed *= 1.3;
            heightFactor = 0.7;
        }
        
        if (fromPlayer.type === 'clown') {
            speed *= 0.9;
        }
        
        item.fromPlayer = fromPlayer.id;
        item.toPlayer = toPlayer.id;
        item.throw(
            fromPlayer.x,
            fromPlayer.y - 40,
            toPlayer.x,
            toPlayer.y - 40,
            speed,
            heightFactor
        );
        
        this.items.push(item);
        this.currentThrower = toPlayer.id;
    }
    
    handleCatch(player, item) {
        if (!item.isActive) return;
        if (player.isStunned || player.isEliminated) return;
        
        item.isActive = false;
        
        const config = item.config;
        
        if (config.type === 'buff') {
            this.applyBuff(config.buffType, config.duration);
            ParticleSystem.createExplosion(item.x, item.y, config.color, 30);
        } else {
            player.addScore(config.score);
            ParticleSystem.createExplosion(item.x, item.y, config.color, 15);
            
            if (config.type === 'danger' && !this.isInvincible) {
                const isEliminated = player.takeDamage(config.missDamage);
                if (isEliminated) {
                    this.showEliminationPopup(player);
                    this.checkGameOver();
                }
            }
        }
        
        this.currentThrower = player.id;
        
        setTimeout(() => {
            if (!this.isPaused && !this.isGameOver) {
                if (!player.isAI) {
                    const aiPlayer = this.players.find(p => p.isAI && !p.isEliminated && !p.isStunned);
                    if (aiPlayer) {
                        this.currentThrower = aiPlayer.id;
                        aiPlayer.aiThrowTimer = 0;
                    }
                } else {
                    this.spawnItem();
                }
            }
        }, 500);
    }
    
    handleMiss(item) {
        if (!item.isActive) return;
        
        item.isActive = false;
        
        if (item.toPlayer) {
            const player = this.players.find(p => p.id === item.toPlayer);
            if (player && !player.isEliminated) {
                if (item.config.type === 'danger' && !this.isInvincible) {
                    const isEliminated = player.takeDamage(item.config.missDamage);
                    ParticleSystem.createExplosion(item.x, item.y, '#ff0000', 25);
                    
                    if (isEliminated) {
                        this.showEliminationPopup(player);
                        this.checkGameOver();
                    }
                }
            }
        }
        
        const nextPlayer = this.getNextAvailableThrower();
        if (nextPlayer) {
            this.currentThrower = nextPlayer.id;
        }
        
        setTimeout(() => {
            if (!this.isPaused && !this.isGameOver) {
                this.spawnItem();
            }
        }, 1000);
    }
    
    handleSkill(player) {
        if (!player.useSkill()) return;
        
        switch (player.type) {
            case 'clown':
                this.itemSpeedMultiplier = 0.7;
                setTimeout(() => {
                    this.itemSpeedMultiplier = 1;
                }, 5000);
                break;
                
            case 'street':
                const target = this.getNextTarget(player);
                if (target) {
                    const item = ItemFactory.createNormalItem();
                    item.fromPlayer = player.id;
                    item.toPlayer = target.id;
                    item.throw(
                        player.x,
                        player.y - 40,
                        target.x,
                        target.y - 40,
                        2.0,
                        0.5
                    );
                    this.items.push(item);
                    this.currentThrower = target.id;
                }
                break;
                
            case 'strong':
                player.hasShield = true;
                break;
                
            case 'girl':
                this.items.forEach(item => {
                    if (item.isActive && item.toPlayer === player.id) {
                        item.vx *= 0.8;
                        item.vy *= 0.9;
                    }
                });
                break;
        }
        
        ParticleSystem.createExplosion(player.x, player.y - 30, '#ffff00', 20);
    }
    
    applyBuff(buffType, duration) {
        switch (buffType) {
            case 'invincible':
                this.isInvincible = true;
                this.buffs.push({ type: 'invincible', endTime: Date.now() + duration });
                setTimeout(() => { this.isInvincible = false; }, duration);
                break;
                
            case 'slow':
                this.itemSpeedMultiplier = 0.6;
                this.buffs.push({ type: 'slow', endTime: Date.now() + duration });
                setTimeout(() => { this.itemSpeedMultiplier = 1; }, duration);
                break;
                
            case 'shield':
                this.players.forEach(p => {
                    if (!p.isEliminated) p.hasShield = true;
                });
                break;
        }
    }
    
    spawnItem() {
        const activeItems = this.items.filter(i => i.isActive);
        if (activeItems.length > 0) return;
        
        const currentThrowerPlayer = this.players.find(p => p.id === this.currentThrower);
        
        if (!currentThrowerPlayer || currentThrowerPlayer.isEliminated || currentThrowerPlayer.isStunned || !currentThrowerPlayer.isAI) {
            const aiPlayer = this.players.find(p => p.isAI && !p.isEliminated && !p.isStunned);
            if (aiPlayer) {
                this.currentThrower = aiPlayer.id;
                aiPlayer.aiThrowTimer = 0;
            }
        } else {
            currentThrowerPlayer.aiThrowTimer = 0;
        }
    }
    
    getNextAvailableThrower() {
        const startIndex = this.players.findIndex(p => p.id === this.currentThrower);
        for (let i = 1; i <= this.players.length; i++) {
            const index = (startIndex + i) % this.players.length;
            const player = this.players[index];
            if (!player.isEliminated) {
                return player;
            }
        }
        return null;
    }
    
    showEliminationPopup(player) {
        const popup = document.getElementById('elimination-popup');
        const nameEl = document.getElementById('elimination-name');
        nameEl.textContent = player.name + ' 出局!';
        popup.classList.remove('hidden');
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 2000);
    }
    
    checkGameOver() {
        const alivePlayers = this.players.filter(p => !p.isEliminated);
        
        if (alivePlayers.length <= 1) {
            this.isGameOver = true;
            this.showGameOver(alivePlayers[0]);
        }
    }
    
    showGameOver(winner) {
        const screen = document.getElementById('game-over-screen');
        const title = document.getElementById('winner-title');
        const scores = document.getElementById('final-scores');
        
        title.textContent = winner ? winner.name + ' 获胜!' : '游戏结束';
        
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        scores.innerHTML = sortedPlayers.map((p, i) => `
            <div class="final-score-item ${i === 0 ? 'winner' : ''}">
                <span>${p.name}</span>
                <span>${p.score} 分</span>
            </div>
        `).join('');
        
        screen.classList.remove('hidden');
        StorageManager.clearState();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseScreen = document.getElementById('pause-screen');
        if (this.isPaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
            this.lastTime = performance.now();
        }
    }
    
    startGameLoop() {
        this.lastTime = performance.now();
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            if (!this.isPaused && !this.isGameOver) {
                this.update(deltaTime);
            }
            
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        
        this.animationId = requestAnimationFrame(loop);
    }
    
    update(deltaTime) {
        this.elapsedTime += deltaTime;
        this.throwCooldown = Math.max(0, this.throwCooldown - deltaTime);
        
        InputManager.update();
        
        this.players.forEach(player => {
            player.update(deltaTime);
            
            if (player.isAI && !player.isStunned && !player.isEliminated) {
                AISystem.updateAIPlayer(player, this, deltaTime);
            }
        });
        
        this.items.forEach(item => {
            if (item.isActive) {
                Physics.updateItem(item, deltaTime, this.itemSpeedMultiplier);
                
                if (item.toPlayer) {
                    const targetPlayer = this.players.find(p => p.id === item.toPlayer);
                    if (targetPlayer && Physics.checkPlayerCatch(item, targetPlayer)) {
                        if (targetPlayer.isAI) {
                            this.handleCatch(targetPlayer, item);
                        }
                    }
                }
                
                if (Physics.checkGroundCollision(item, this.groundY)) {
                    this.handleMiss(item);
                }
            }
        });
        
        this.items = this.items.filter(item => item.isActive);
        
        ParticleSystem.update();
        
        if (ParticleSystem.particles.length > 60) {
            ParticleSystem.particles = ParticleSystem.particles.slice(-50);
        }
        
        this.buffs = this.buffs.filter(b => Date.now() < b.endTime);
        
        this.ensureActivity(deltaTime);
        
        this.updateUI();
    }
    
    ensureActivity(deltaTime) {
        const activeItems = this.items.filter(i => i.isActive);
        if (activeItems.length > 0) {
            this.noActivityTimer = 0;
            return;
        }
        
        this.noActivityTimer += deltaTime;
        
        if (this.noActivityTimer > 3000) {
            this.noActivityTimer = 0;
            const aiPlayer = this.players.find(p => p.isAI && !p.isEliminated && !p.isStunned);
            if (aiPlayer) {
                this.currentThrower = aiPlayer.id;
                aiPlayer.aiThrowTimer = 0;
                
                const target = this.getNextTarget(aiPlayer);
                if (target) {
                    const throwType = Math.random() < 0.7 ? 'normal' : 'fast';
                    this.handleThrow(aiPlayer, target, throwType);
                }
            }
        }
    }
    
    render() {
        this.renderer.groundY = this.groundY;
        this.renderer.render(this);
    }
    
    updateUI() {
        const seconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeText = `时间: ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (document.getElementById('timer').textContent !== timeText) {
            document.getElementById('timer').textContent = timeText;
        }
        
        const roundText = `第 ${this.round} 回合`;
        if (document.getElementById('round-info').textContent !== roundText) {
            document.getElementById('round-info').textContent = roundText;
        }
        
        const scoreBoard = document.getElementById('score-board');
        const newHTML = this.players.map(p => `
            <div class="player-score ${p.isEliminated ? 'eliminated' : ''}">
                <div class="name">${p.emoji} ${p.name}</div>
                <div class="score">${p.score} 分</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${(p.hp / p.maxHp) * 100}%"></div>
                </div>
            </div>
        `).join('');
        
        if (scoreBoard.innerHTML !== newHTML) {
            scoreBoard.innerHTML = newHTML;
        }
        
        const humanPlayer = this.getHumanPlayer();
        if (humanPlayer) {
            const cooldownPercent = Math.floor(humanPlayer.getSkillCooldownPercent() * 100);
            const skillFill = document.getElementById('skill-fill');
            if (skillFill.style.width !== cooldownPercent + '%') {
                skillFill.style.width = cooldownPercent + '%';
            }
        }
        
        const buffsDisplay = document.getElementById('buffs-display');
        const newBuffsHTML = this.buffs.map(b => {
            const emoji = b.type === 'invincible' ? '⭐' : b.type === 'slow' ? '🪶' : '🛡️';
            return `<div class="buff-icon">${emoji}</div>`;
        }).join('');
        
        if (buffsDisplay.innerHTML !== newBuffsHTML) {
            buffsDisplay.innerHTML = newBuffsHTML;
        }
    }
    
    startAutoSave() {
        this.saveInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) {
                const state = StorageManager.buildGameState(this);
                StorageManager.saveState(state);
            }
        }, 3000);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        ParticleSystem.clear();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}