import { CONFIG, KEYS } from './config.js';
import { Character } from './character.js';
import { CombatSystem } from './combat.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';
import { GameStorage } from './storage.js';

class Game {
    constructor() {
        try {
            this.canvas = document.getElementById('game-canvas');
            this.renderer = new Renderer(this.canvas);
            this.combat = new CombatSystem();
            
            this.gameState = 'menu';
            this.selectedChar = 'emperor';
            this.player = null;
            this.enemy = null;
            this.ai = null;
            
            this.gameTime = CONFIG.GAME_DURATION;
            this.lastTime = 0;
            this.animationId = null;
            
            this.keys = {
                left: false,
                right: false,
                up: false,
                down: false,
                light: false,
                heavy: false,
                cone: false,
                ultimate: false,
                jumpAttack: false
            };
            
            this.renderer.clear();
            this.renderer.drawBackground();
            this.renderer.drawArena();
            this.canvas.style.pointerEvents = 'none';
            
            this.init();
        } catch (error) {
        }
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateCharacterSelection();
        this.tryRestoreGameState();
    }

    loadSettings() {
        const settings = GameStorage.loadSettings();
        this.selectedChar = settings.selectedChar || 'emperor';
    }

    tryRestoreGameState() {
        const savedState = GameStorage.loadState();
        if (savedState && (savedState.gameState === 'playing' || savedState.gameState === 'paused')) {
            try {
                document.getElementById('game-hud').classList.remove('hidden');
                document.getElementById('pause-btn').classList.remove('hidden');
                this.canvas.style.pointerEvents = 'auto';
                
                this.player = new Character(savedState.player.type, 
                    savedState.player.x, savedState.player.y, true);
                this.player.loadState(savedState.player);
                
                this.enemy = new Character(savedState.enemy.type,
                    savedState.enemy.x, savedState.enemy.y, false);
                this.enemy.loadState(savedState.enemy);
                
                this.ai = new AI(this.enemy, 'normal');
                this.gameTime = savedState.gameTime;
                this.combat.clear();
                
                if (savedState.combat?.projectiles) {
                    savedState.combat.projectiles.forEach(p => {
                        const projectile = {
                            x: p.x, y: p.y,
                            vx: p.vx, vy: p.vy || 0,
                            damage: p.damage,
                            width: 25, height: 25,
                            rotation: 0,
                            active: true
                        };
                        this.combat.projectiles.push(projectile);
                    });
                }
                
                this.hideAllScreens();
                if (savedState.gameState === 'paused') {
                    document.getElementById('pause-screen').classList.add('active');
                    this.gameState = 'paused';
                } else {
                    this.gameState = 'playing';
                    this.lastTime = performance.now();
                    this.gameLoop();
                }
            } catch (e) {
                GameStorage.clearState();
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        const startBtn = document.getElementById('start-btn');
        const selectCharBtn = document.getElementById('select-char-btn');
        
        startBtn.addEventListener('click', () => this.startGame());
        selectCharBtn.addEventListener('click', () => this.showCharacterSelect());
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedChar = card.dataset.char;
                this.updateCharacterSelection();
                GameStorage.saveSettings({ selectedChar: this.selectedChar });
            });
        });
        
        document.getElementById('back-to-start-btn').addEventListener('click', () => this.showMenu());
        
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.quitGame());
        
        window.addEventListener('beforeunload', () => {
            if (this.gameState === 'playing') {
                this.saveGameState();
            }
        });
    }

    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
        switch (e.code) {
            case KEYS.LEFT: this.keys.left = true; break;
            case KEYS.RIGHT: this.keys.right = true; break;
            case KEYS.UP: this.keys.up = true; break;
            case KEYS.DOWN: this.keys.down = true; break;
            case KEYS.LIGHT: this.keys.light = true; break;
            case KEYS.HEAVY: this.keys.heavy = true; break;
            case KEYS.CONE: this.keys.cone = true; break;
            case KEYS.ULTIMATE: this.keys.ultimate = true; break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case KEYS.LEFT: this.keys.left = false; break;
            case KEYS.RIGHT: this.keys.right = false; break;
            case KEYS.UP: this.keys.up = false; break;
            case KEYS.DOWN: this.keys.down = false; break;
            case KEYS.LIGHT: this.keys.light = false; break;
            case KEYS.HEAVY: this.keys.heavy = false; break;
            case KEYS.CONE: this.keys.cone = false; break;
            case KEYS.ULTIMATE: this.keys.ultimate = false; break;
        }
    }

    updateCharacterSelection() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.char === this.selectedChar);
        });
    }

    showMenu() {
        this.gameState = 'menu';
        this.hideAllScreens();
        document.getElementById('start-screen').classList.add('active');
        this.canvas.style.pointerEvents = 'none';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    showCharacterSelect() {
        this.hideAllScreens();
        document.getElementById('character-screen').classList.add('active');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }

    startGame() {
        this.hideAllScreens();
        document.getElementById('game-hud').classList.remove('hidden');
        document.getElementById('pause-btn').classList.remove('hidden');
        this.canvas.style.pointerEvents = 'auto';
        
        this.player = new Character(this.selectedChar, CONFIG.ARENA.x + 100, CONFIG.ARENA.y - 80, true);
        this.enemy = new Character('fat', CONFIG.ARENA.x + CONFIG.ARENA.width - 180, CONFIG.ARENA.y - 80, false);
        this.ai = new AI(this.enemy, 'normal');
        
        this.gameTime = CONFIG.GAME_DURATION;
        this.combat.clear();
        
        this.gameState = 'playing';
        this.lastTime = performance.now();
        this.gameLoop();
    }

    pauseGame() {
        if (this.gameState !== 'playing') return;
        this.gameState = 'paused';
        document.getElementById('pause-screen').classList.add('active');
        this.canvas.style.pointerEvents = 'none';
        this.saveGameState();
    }

    resumeGame() {
        document.getElementById('pause-screen').classList.remove('active');
        this.canvas.style.pointerEvents = 'auto';
        this.gameState = 'playing';
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restartGame() {
        this.hideAllScreens();
        GameStorage.clearState();
        this.startGame();
    }

    quitGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.hideAllScreens();
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('pause-btn').classList.add('hidden');
        GameStorage.clearState();
        this.showMenu();
    }

    saveGameState() {
        const state = {
            gameState: this.gameState,
            player: this.player.getState(),
            enemy: this.enemy.getState(),
            gameTime: this.gameTime,
            combat: this.combat.getState(),
            timestamp: Date.now()
        };
        GameStorage.saveState(state);
    }

    loadGameState() {
        const state = GameStorage.loadState();
        if (!state) return false;
        
        try {
            this.player = new Character(state.player.type, state.player.x, state.player.y, true);
            this.player.loadState(state.player);
            
            this.enemy = new Character(state.enemy.type, state.enemy.x, state.enemy.y, false);
            this.enemy.loadState(state.enemy);
            
            this.ai = new AI(this.enemy, 'normal');
            this.combat.loadState(state.combat);
            this.gameTime = state.gameTime;
            
            return true;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return false;
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') {
            this.animationId = null;
            return;
        }
        
        if (!this.lastTime || this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        let deltaTime = currentTime - this.lastTime;
        deltaTime = Math.min(deltaTime, 50);
        this.lastTime = currentTime;
        
        try {
            this.update(deltaTime);
            this.render();
        } catch (error) {
            console.error('Game loop error:', error);
        }
        
        if (this.gameState === 'playing') {
            this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
        } else {
            this.animationId = null;
        }
    }

    update(deltaTime) {
        this.gameTime -= deltaTime / 1000;
        if (this.gameTime <= 0) {
            this.endGame(this.player.health > this.enemy.health ? 'player' : 'enemy');
            return;
        }
        
        if (Math.random() < 0.005) {
            this.saveGameState();
        }

        const aiAction = this.ai.update(deltaTime, this.player);
        
        this.player.update(deltaTime, this.keys, this.enemy);
        this.enemy.update(deltaTime, aiAction, this.player);
        
        this.player.applyPhysics(this.enemy);
        this.enemy.applyPhysics();
        
        if (this.keys.cone && this.player.cooldowns.cone <= 0) {
            this.combat.fireProjectile(this.player);
            this.player.cooldowns.cone = 500;
        }
        
        if (aiAction.cone && this.enemy.cooldowns.cone <= 0) {
            this.combat.fireProjectile(this.enemy);
            this.enemy.cooldowns.cone = 500;
        }
        
        if (this.keys.ultimate && this.player.energy >= 50) {
            const ultimateType = this.getUltimateType(this.player);
            this.combat.useUltimate(this.player, ultimateType);
            this.player.energy -= 50;
            this.keys.ultimate = false;
        }
        
        if (aiAction.ultimate && this.enemy.energy >= 50) {
            const ultimateType = this.getUltimateType(this.enemy);
            this.combat.useUltimate(this.enemy, ultimateType);
            this.enemy.energy -= 50;
            aiAction.ultimate = false;
        }
        
        this.combat.update(deltaTime, this.player, this.enemy);
        
        this.checkWinCondition();
        this.updateHUD();
    }

    getUltimateType(character) {
        switch (character.type) {
            case 'emperor': return 'polarWave';
            case 'little': return 'iceStorm';
            case 'fat': return 'whaleRush';
            default: return 'polarWave';
        }
    }

    checkWinCondition() {
        if (this.gameState !== 'playing') return;
        
        const playerOutOfArena = this.player.isOutOfArena();
        const playerDead = this.player.health <= 0;
        const enemyOutOfArena = this.enemy.isOutOfArena();
        const enemyDead = this.enemy.health <= 0;
        
        if (playerOutOfArena || playerDead) {
            this.endGame('enemy');
        } else if (enemyOutOfArena || enemyDead) {
            this.endGame('player');
        }
    }

    endGame(winner) {
        if (this.gameState === 'gameOver') return;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.gameState = 'gameOver';
        GameStorage.clearState();
        document.getElementById('pause-btn').classList.add('hidden');
        this.canvas.style.pointerEvents = 'none';
        
        const resultScreen = document.getElementById('result-screen');
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        
        resultScreen.classList.add('active');
        
        if (winner === 'player') {
            resultTitle.textContent = '🎉 胜利!';
            resultMessage.textContent = '你成功击败了对手!';
        } else {
            resultTitle.textContent = '😢 失败';
            resultMessage.textContent = '再接再厉，下次一定能赢!';
        }
    }

    updateHUD() {
        const playerHealthBar = document.querySelector('#player1-health');
        const enemyHealthBar = document.querySelector('#player2-health');
        
        playerHealthBar.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        enemyHealthBar.style.width = `${(this.enemy.health / this.enemy.maxHealth) * 100}%`;
        
        const playerEnergyBar = document.querySelector('#player1-energy');
        const enemyEnergyBar = document.querySelector('#player2-energy');
        
        playerEnergyBar.style.width = `${(this.player.energy / this.player.maxEnergy) * 100}%`;
        enemyEnergyBar.style.width = `${(this.enemy.energy / this.enemy.maxEnergy) * 100}%`;
        
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('game-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawArena();
        this.renderer.drawCharacter(this.player);
        this.renderer.drawCharacter(this.enemy);
        this.renderer.drawProjectiles(this.combat.projectiles);
        this.renderer.drawUltimateEffects(this.combat.ultimateEffects);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});