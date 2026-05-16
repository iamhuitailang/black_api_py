class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.gameTime = GameData.gameConfig.gameDuration;
        
        this.player = null;
        this.enemy = null;
        this.combatSystem = null;
        this.inputHandler = null;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    init(playerCharacterId) {
        this.combatSystem = new CombatSystem();
        this.inputHandler = new InputHandler();
        
        const playerData = GameData.characters[playerCharacterId];
        const enemyIds = Object.keys(GameData.characters).filter(id => id !== playerCharacterId);
        const enemyData = GameData.characters[enemyIds[Math.floor(Math.random() * enemyIds.length)]];
        
        this.player = new Character(playerData, true);
        this.enemy = new Character(enemyData, false);
        
        this.player.init(this.canvas.width, this.canvas.height);
        this.enemy.init(this.canvas.width, this.canvas.height);
        
        this.inputHandler.setPlayer(this.player);
        
        this.gameTime = GameData.gameConfig.gameDuration;
        
        this.isRunning = true;
        this.isPaused = false;
        
        this.lastTime = performance.now();
    }

    start() {
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.gameTime -= deltaTime;
        
        this.inputHandler.handlePlayerInput(this.player, deltaTime);
        
        this.player.update(deltaTime, this.canvas.width, this.canvas.height, this.enemy);
        this.enemy.update(deltaTime, this.canvas.width, this.canvas.height, this.player);
        
        this.combatSystem.updateCombat(this.player, this.enemy);
        this.combatSystem.updateEffects(deltaTime);
        
        const gameOver = this.combatSystem.checkGameOver(this.player, this.enemy);
        if (gameOver) {
            this.handleGameOver(gameOver);
            return;
        }
        
        if (this.gameTime <= 0) {
            this.handleTimeUp();
            return;
        }
        
        this.combatSystem.resetAttackProcessing(this.player, this.enemy);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawGround();
        
        this.drawCharacter(this.enemy);
        this.drawCharacter(this.player);
        
        this.drawHitEffects();
        this.drawFloatingTexts(this.player);
        this.drawFloatingTexts(this.enemy);
        
        if (this.player.isAttackActive()) {
            this.drawAttackEffect(this.player);
        }
        if (this.enemy.isAttackActive()) {
            this.drawAttackEffect(this.enemy);
        }
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.7);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#E0F6FF');
        gradient.addColorStop(1, '#B0C4DE');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.7);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(100, 80, 60);
        this.drawCloud(300, 50, 40);
        this.drawCloud(600, 100, 50);
        this.drawCloud(900, 60, 45);
        
        this.ctx.fillStyle = '#f4f4f4';
        this.ctx.fillRect(0, this.canvas.height * 0.55, this.canvas.width, this.canvas.height * 0.15);
        
        this.ctx.fillStyle = '#ddd';
        for (let i = 0; i < this.canvas.width; i += 100) {
            this.ctx.fillRect(i, this.canvas.height * 0.65, 80, 5);
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGround() {
        const groundY = this.canvas.height * GameData.gameConfig.groundY;
        
        const carpetGradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        carpetGradient.addColorStop(0, '#8B7355');
        carpetGradient.addColorStop(1, '#6B5344');
        this.ctx.fillStyle = carpetGradient;
        this.ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 60) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, groundY);
            this.ctx.lineTo(i + 30, this.canvas.height);
            this.ctx.stroke();
        }
    }

    drawCharacter(character) {
        const x = character.x;
        const y = character.y;
        const w = character.width;
        const h = character.height;
        
        this.ctx.save();
        
        if (character.facing < 0) {
            this.ctx.translate(x + w, y);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-x, -y);
        }
        
        this.drawCharacterBody(character, x, y, w, h);
        this.drawCharacterFace(character, x, y, w, h);
        
        if (character.isDefending) {
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(x + w/2, y + h/2, w * 0.7, h * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawCharacterBody(character, x, y, w, h) {
        const bodyColor = character.isPlayer ? '#3498db' : '#e74c3c';
        
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath();
        this.ctx.roundRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.5, 8);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#f5d0c5';
        this.ctx.beginPath();
        this.ctx.arc(x + w/2, y + h * 0.25, w * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(x + w * 0.4, y + h * 0.23, 4, 0, Math.PI * 2);
        this.ctx.arc(x + w * 0.6, y + h * 0.23, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        if (character.state === 'attacking') {
            this.ctx.arc(x + w/2, y + h * 0.3, 8, 0, Math.PI);
        } else if (character.isDefending) {
            this.ctx.moveTo(x + w * 0.4, y + h * 0.32);
            this.ctx.lineTo(x + w * 0.6, y + h * 0.32);
        } else {
            this.ctx.arc(x + w/2, y + h * 0.3, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        }
        this.ctx.stroke();
    }

    drawCharacterFace(character, x, y, w, h) {
        this.ctx.font = `${w * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(character.characterData.icon, x + w/2, y + h * 0.25);
    }

    drawAttackEffect(character) {
        const attack = character.currentAttack;
        if (!attack) return;
        
        const x = character.x + character.width / 2;
        const y = character.y + character.height / 2;
        const range = attack.range;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = attack.color;
        
        const progress = (character.attackTimer - attack.startup) / (attack.recovery * 0.5);
        const size = range * Math.max(0, Math.min(1, progress));
        
        this.ctx.beginPath();
        if (character.facing > 0) {
            this.ctx.ellipse(x + size / 2, y, size, size * 0.5, 0, 0, Math.PI * 2);
        } else {
            this.ctx.ellipse(x - size / 2, y, size, size * 0.5, 0, 0, Math.PI * 2);
        }
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawHitEffects() {
        this.combatSystem.hitEffects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.life * 2;
            this.ctx.fillStyle = effect.color;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawFloatingTexts(character) {
        character.floatingTexts.forEach(text => {
            this.ctx.save();
            this.ctx.globalAlpha = text.alpha;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = text.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text.text, text.x, text.y);
            this.ctx.restore();
        });
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        if (this.inputHandler && this.player) {
            this.inputHandler.setPlayer(this.player);
        }
    }

    stop() {
        this.isRunning = false;
    }

    handleGameOver(result) {
        this.stop();
        if (this.onGameOver) {
            this.onGameOver(result.winner, result.reason);
        }
    }

    handleTimeUp() {
        this.stop();
        let winner, reason;
        if (this.player.blame < this.enemy.blame) {
            winner = 'player';
            reason = '时间到！你背的锅更少！';
        } else if (this.enemy.blame < this.player.blame) {
            winner = 'enemy';
            reason = '时间到！你背的锅更多...';
        } else {
            winner = 'draw';
            reason = '平局！';
        }
        if (this.onGameOver) {
            this.onGameOver(winner, reason);
        }
    }

    getGameState() {
        return {
            gameTime: this.gameTime,
            player: {
                characterId: this.player.characterData.id,
                state: this.player.getState()
            },
            enemy: {
                characterId: this.enemy.characterData.id,
                state: this.enemy.getState()
            },
            combatSystem: this.combatSystem.getState()
        };
    }

    loadGameState(state) {
        const playerData = GameData.characters[state.player.characterId];
        const enemyData = GameData.characters[state.enemy.characterId];
        
        this.inputHandler = new InputHandler();
        
        this.player = new Character(playerData, true);
        this.enemy = new Character(enemyData, false);
        
        this.player.loadState(state.player.state);
        this.enemy.loadState(state.enemy.state);
        
        this.inputHandler.setPlayer(this.player);
        
        this.combatSystem = new CombatSystem();
        this.combatSystem.loadState(state.combatSystem);
        
        this.gameTime = state.gameTime;
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
    }
}