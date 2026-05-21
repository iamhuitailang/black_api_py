class Game {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.player = null;
        this.enemy = null;
        this.ai = null;
        
        this.timer = GameConfig.GAME_DURATION;
        this.lastTime = 0;
        this.isRunning = false;
        this.gameOver = false;
        
        this.saveInterval = null;
        this.animationId = null;
        
        window.currentGame = this;
    }
    
    init(playerCharacterId) {
        console.log('初始化新游戏，角色:', playerCharacterId);
        
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        
        InputManager.init();
        InputManager.resetAll();
        
        const playerData = CharacterData[playerCharacterId];
        this.player = new Character(playerData, true, 'left');
        
        const enemyIds = ['clown', 'tamer', 'dancer'].filter(id => id !== playerCharacterId);
        const enemyId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
        const enemyData = CharacterData[enemyId];
        this.enemy = new Character(enemyData, false, 'right');
        
        this.ai = new AIController(this.enemy);
        
        this.timer = GameConfig.GAME_DURATION;
        this.gameOver = false;
        
        document.getElementById('player1-name').textContent = this.player.data.name + ' (你)';
        document.getElementById('player2-name').textContent = this.enemy.data.name + ' (NPC)';
        
        return this;
    }
    
    loadFromSavedState(savedState) {
        console.log('从保存状态加载游戏:', savedState);
        
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        
        InputManager.init();
        InputManager.resetAll();
        
        const playerData = CharacterData[savedState.player.dataId];
        this.player = new Character(playerData, true, 'left');
        this.player.health = savedState.player.health;
        this.player.atmosphere = savedState.player.atmosphere;
        this.player.x = savedState.player.x;
        this.player.y = savedState.player.y;
        this.player.facingRight = savedState.player.facingRight;
        this.player.projectiles = [];
        
        const enemyData = CharacterData[savedState.enemy.dataId];
        this.enemy = new Character(enemyData, false, 'right');
        this.enemy.health = savedState.enemy.health;
        this.enemy.atmosphere = savedState.enemy.atmosphere;
        this.enemy.x = savedState.enemy.x;
        this.enemy.y = savedState.enemy.y;
        this.enemy.facingRight = savedState.enemy.facingRight;
        this.enemy.projectiles = [];
        
        this.ai = new AIController(this.enemy);
        
        this.timer = savedState.timer;
        this.gameOver = false;
        
        document.getElementById('player1-name').textContent = this.player.data.name + ' (你)';
        document.getElementById('player2-name').textContent = this.enemy.data.name + ' (NPC)';
        
        console.log('游戏加载完成');
        
        this.resolveCharacterCollision(this.player, this.enemy);
        this.updateFacing(this.player, this.enemy);
        this.updateFacing(this.enemy, this.player);
        
        return this;
    }
    
    serialize() {
        return {
            player: {
                health: this.player.health,
                atmosphere: this.player.atmosphere,
                x: this.player.x,
                y: this.player.y,
                facingRight: this.player.facingRight,
                data: { id: this.player.data.id }
            },
            enemy: {
                health: this.enemy.health,
                atmosphere: this.enemy.atmosphere,
                x: this.enemy.x,
                y: this.enemy.y,
                facingRight: this.enemy.facingRight,
                data: { id: this.enemy.data.id }
            },
            timer: this.timer
        };
    }
    
    start() {
        console.log('游戏开始');
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        this.saveInterval = setInterval(() => {
            if (!this.gameOver && this.isRunning && this.player && this.enemy) {
                Storage.save(this.serialize());
            }
        }, 3000);
    }
    
    stop() {
        console.log('游戏停止');
        this.isRunning = false;
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.033);
        this.lastTime = currentTime;
        
        if (!this.gameOver) {
            this.update(deltaTime);
            this.checkGameOver();
        }
        
        this.render(deltaTime);
    }
    
    update(deltaTime) {
        this.timer -= deltaTime;
        
        this.handlePlayerInput();
        
        if (this.ai && this.enemy && this.player) {
            this.ai.update(deltaTime, this.player);
        }
        
        if (this.player && this.enemy) {
            this.player.update(deltaTime, this.enemy);
            this.enemy.update(deltaTime, this.player);
            
            this.resolveCharacterCollision(this.player, this.enemy);
            
            this.updateFacing(this.player, this.enemy);
            this.updateFacing(this.enemy, this.player);
        }
        
        InputManager.reset();
    }
    
    resolveCharacterCollision(char1, char2) {
        const minDistance = 90;
        const dx = char2.x - char1.x;
        const dy = char2.y - char1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance && distance > 0) {
            const overlap = minDistance - distance;
            const pushX = (dx / distance) * overlap * 0.5;
            const pushY = (dy / distance) * overlap * 0.5;
            
            if (!char1.isStunned && !char1.isAttacking) {
                char1.x -= pushX;
                char1.y -= pushY;
            }
            if (!char2.isStunned && !char2.isAttacking) {
                char2.x += pushX;
                char2.y += pushY;
            }
            
            char1.x = Math.max(50, Math.min(GameConfig.CANVAS_WIDTH - 50, char1.x));
            char2.x = Math.max(50, Math.min(GameConfig.CANVAS_WIDTH - 50, char2.x));
        }
    }
    
    updateFacing(char, opponent) {
        if (char.isAttacking) return;
        char.facingRight = opponent.x > char.x;
    }
    
    handlePlayerInput() {
        if (!this.player || this.player.isStunned) return;
        
        const direction = InputManager.getDirection();
        
        if (direction.x < 0) {
            this.player.moveLeft();
        } else if (direction.x > 0) {
            this.player.moveRight();
        }
        
        if (direction.y < 0) {
            this.player.jump();
        }
        
        this.player.crouch(direction.y > 0);
        
        if (InputManager.checkSpecialInput()) {
            this.player.startAttack('special');
            return;
        }
        
        const attack = InputManager.getAttackInput();
        if (attack) {
            this.player.startAttack(attack);
        }
    }
    
    checkGameOver() {
        if (!this.player || !this.enemy) return;
        
        if (this.player.health <= 0) {
            this.gameOver = true;
            this.showResult(false, '你的活力值耗尽了！');
            Storage.clear();
        } else if (this.enemy.health <= 0) {
            this.gameOver = true;
            this.showResult(true, '全场欢呼！你赢得了表演！');
            Storage.clear();
        } else if (this.timer <= 0) {
            this.gameOver = true;
            if (this.player.health > this.enemy.health) {
                this.showResult(true, '时间到！你的表演更精彩！');
            } else if (this.player.health < this.enemy.health) {
                this.showResult(false, '时间到！对手的表演更胜一筹！');
            } else {
                this.showResult(false, '时间到！平局！');
            }
            Storage.clear();
        }
    }
    
    showResult(isWin, message) {
        const resultScreen = document.getElementById('result-screen');
        const gameScreen = document.getElementById('game-screen');
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        
        resultTitle.textContent = isWin ? '🎉 胜利！🎉' : '😢 失败 😢';
        resultTitle.className = isWin ? 'win' : 'lose';
        resultMessage.textContent = message;
        
        gameScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        if (isWin && this.renderer) {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    if (this.renderer) {
                        this.renderer.addConfetti();
                    }
                }, i * 150);
            }
        }
        
        this.stop();
    }
    
    render(deltaTime) {
        if (this.renderer && this.player && this.enemy) {
            this.renderer.render(this.player, this.enemy, this.timer, deltaTime);
        }
    }
}
