import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GAME_TIME, COLORS, DEFAULT_GAME_STATE } from './config.js';
import { storageManager } from './storage.js';
import { inputManager } from './input.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { ParticleSystem } from './particle.js';
import { GoombaSprite, KoopaSprite, PiranhaSprite, CoinSprite } from './sprite.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = GAME_TIME;
        this.timeTimer = 0;
        this.cameraX = 0;

        this.player = null;
        this.level = null;
        this.particleSystem = new ParticleSystem(this.ctx);

        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.levelComplete = false;

        this.usedBlocks = [];
        this.collectedCoins = [];
        this.defeatedEnemies = [];

        this.init();
    }

    init() {
        try {
            storageManager.clear();
            
            const savedState = null;

            this.player = new Player(this.ctx, 80, 14 * TILE_SIZE - 32);

            this.level = new Level(this.ctx);
            this.level.game = this;
            this.level.generateLevel1([], [], []);

            this.updateUI();
            
            this.draw();
            
            this.showOverlay('SUPER MARIO', '点击按钮或按空格键开始游戏', '开始游戏');
            
            const overlayButton = document.getElementById('overlay-button');
            overlayButton.onclick = () => {
                this.hideOverlay();
                this.start();
            };
            
            const startHandler = (e) => {
                if (e.code === 'Space' && this.isPaused) {
                    e.preventDefault();
                    this.hideOverlay();
                    window.removeEventListener('keydown', startHandler);
                    this.start();
                }
            };
            window.addEventListener('keydown', startHandler);
            
        } catch (error) {
            console.error('游戏初始化错误:', error);
            alert('游戏加载失败，请刷新页面重试');
        }
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        if (!this.isPaused && !this.gameOver && !this.levelComplete) {
            this.update();
            this.draw();
            this.saveState();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (inputManager.isLeft()) {
            this.player.moveLeft();
        }
        if (inputManager.isRight()) {
            this.player.moveRight();
        }
        if (inputManager.isJump()) {
            this.player.jump();
        }

        this.player.update(this.level.getBlocks(), this.level);

        const targetCameraX = this.player.x - CANVAS_WIDTH / 3;
        this.cameraX = Math.max(0, Math.min(targetCameraX, this.level.width - CANVAS_WIDTH));

        this.level.update(this.cameraX);

        this.particleSystem.update();

        this.checkCollisions();

        this.timeTimer++;
        if (this.timeTimer >= 60) {
            this.timeTimer = 0;
            this.time--;
            if (this.time <= 0) {
                this.playerDeath();
            }
        }

        if (this.player.y > CANVAS_HEIGHT + 100) {
            this.playerDeath();
        }

        this.updateUI();
    }

    checkCollisions() {
        const player = this.player;

        for (const enemy of this.level.getEnemies()) {
            if (enemy instanceof GoombaSprite && enemy.dead) continue;
            if (enemy instanceof PiranhaSprite && !enemy.extended) continue;

            if (this.checkRectCollision(player, enemy)) {
                if (enemy instanceof GoombaSprite || (enemy instanceof KoopaSprite && !enemy.shellMode)) {
                    if (player.vy > 0 && player.y + player.height - 10 < enemy.y + enemy.height / 2) {
                        player.stompEnemy(enemy, this.level);
                        
                        const enemyX = Math.floor(enemy.x / TILE_SIZE);
                        const enemyType = enemy instanceof GoombaSprite ? 'goomba' : 
                                         enemy.type === 'red' ? 'koopa_red' : 'koopa_green';
                        const enemyKey = `${enemyX}_${enemyType}`;
                        if (!this.defeatedEnemies.includes(enemyKey)) {
                            this.defeatedEnemies.push(enemyKey);
                        }
                    } else if (player.isStarPower) {
                        this.level.removeEnemy(enemy);
                        this.addScore(100);
                        this.particleSystem.emitScorePop(enemy.x + TILE_SIZE / 2, enemy.y, 100);
                    } else {
                        if (player.takeDamage()) {
                            this.playerDeath();
                        }
                    }
                } else if (enemy instanceof KoopaSprite && enemy.shellMode) {
                    if (Math.abs(enemy.shellVelocity) > 1) {
                        if (player.takeDamage()) {
                            this.playerDeath();
                        }
                    } else {
                        player.stompEnemy(enemy, this.level);
                    }
                } else if (enemy instanceof PiranhaSprite) {
                    if (player.isStarPower) {
                        this.level.removeEnemy(enemy);
                        this.addScore(200);
                    } else if (player.takeDamage()) {
                        this.playerDeath();
                    }
                }
            }
        }

        for (const coin of this.level.getCoins()) {
            if (this.checkRectCollision(player, coin)) {
                this.level.removeCoin(coin);
                this.addScore(100);
                this.addCoin();
                this.particleSystem.emitCoinCollect(coin.x + TILE_SIZE / 2, coin.y);
                
                const coinX = Math.floor(coin.x / TILE_SIZE);
                const coinY = Math.floor(coin.y / TILE_SIZE);
                const coinKey = `${coinX}_${coinY}`;
                if (!this.collectedCoins.includes(coinKey)) {
                    this.collectedCoins.push(coinKey);
                }
            }
        }

        for (const item of this.level.getItems()) {
            if (this.checkRectCollision(player, item)) {
                player.collectPowerUp(item, this.level);
            }
        }

        const flag = this.level.getFlag();
        if (flag && this.checkRectCollision(player, flag)) {
            this.completeLevel();
        }

        for (const block of this.level.getBlocks()) {
            if (block.type === 'question' && block.used) {
                const blockX = Math.floor(block.x / TILE_SIZE);
                const blockY = Math.floor(block.y / TILE_SIZE);
                const blockKey = `${blockX}_${blockY}`;
                if (!this.usedBlocks.includes(blockKey)) {
                    this.usedBlocks.push(blockKey);
                }
            }
        }
    }

    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    playerDeath() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver = true;
            this.showOverlay('GAME OVER', `最终得分: ${this.score}`, '重新开始');
            storageManager.clear();
            
            const overlayButton = document.getElementById('overlay-button');
            overlayButton.onclick = () => {
                location.reload();
            };
        } else {
            this.player.setPosition(50, 300);
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.setState('small');
            this.player.isInvincible = true;
            this.player.invincibleTime = 120;
            this.cameraX = 0;
            this.time = GAME_TIME;
        }
    }

    completeLevel() {
        this.levelComplete = true;
        const timeBonus = this.time * 50;
        this.score += timeBonus + 1000;
        this.showOverlay('LEVEL COMPLETE!', `得分: ${this.score}\n时间奖励: ${timeBonus}`, '下一关');
        
        storageManager.clear();
        
        const overlayButton = document.getElementById('overlay-button');
        overlayButton.onclick = () => {
            location.reload();
        };
    }

    addScore(points) {
        this.score += points;
    }

    addCoin() {
        this.coins++;
        if (this.coins >= 100) {
            this.coins = 0;
            this.addLife();
        }
    }

    addLife() {
        this.lives++;
    }

    updateUI() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('coins').textContent = this.coins.toString().padStart(2, '0');
        document.getElementById('time').textContent = this.time;
        document.getElementById('lives').textContent = this.lives;
    }

    showOverlay(title, message, buttonText) {
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-message').textContent = message;
        document.getElementById('overlay-button').textContent = buttonText;
        document.getElementById('game-overlay').classList.remove('hidden');
        this.isPaused = true;
    }

    hideOverlay() {
        document.getElementById('game-overlay').classList.add('hidden');
        this.isPaused = false;
    }

    saveState() {
        const state = {
            score: this.score,
            coins: this.coins,
            lives: this.lives,
            time: this.time,
            level: '1-1',
            marioState: this.player.state,
            isInvincible: this.player.isInvincible,
            invincibleTime: this.player.invincibleTime,
            isStarPower: this.player.isStarPower,
            starPowerTime: this.player.starPowerTime,
            cameraX: this.cameraX,
            marioX: this.player.x,
            marioY: this.player.y,
            marioVX: this.player.vx,
            marioVY: this.player.vy,
            facingRight: this.player.facingRight,
            usedBlocks: this.usedBlocks,
            collectedCoins: this.collectedCoins,
            defeatedEnemies: this.defeatedEnemies
        };
        storageManager.save(state);
    }

    draw() {
        this.ctx.fillStyle = COLORS.sky;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.drawBackground();

        this.level.draw(this.cameraX);

        const playerDrawX = this.player.x - this.cameraX;
        this.player.draw(playerDrawX);

        this.particleSystem.draw();
    }

    drawBackground() {
        const cloudY = 50;
        const hillY = 350;
        
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const x = (i * 200 - this.cameraX * 0.3) % (CANVAS_WIDTH + 200) - 100;
            this.drawCloud(x, cloudY + (i % 2) * 30);
        }

        this.ctx.fillStyle = '#00aa00';
        for (let i = 0; i < 4; i++) {
            const x = (i * 250 - this.cameraX * 0.5) % (CANVAS_WIDTH + 250) - 125;
            this.drawHill(x, hillY + (i % 2) * 50);
        }
    }

    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y - 10, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 60, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y + 10, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawHill(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - 60, y + 60);
        this.ctx.quadraticCurveTo(x, y - 30, x + 60, y + 60);
        this.ctx.fill();
    }
}

window.addEventListener('load', () => {
    new Game();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});