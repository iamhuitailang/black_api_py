import { CONFIG, FLOOR_THEMES } from './config_v2.js';
import { InputManager } from './input_v2.js';
import { Player } from './player_v2.js';
import { Monster } from './monster_v2.js';
import { Level } from './level_v2.js';
import { Renderer } from './renderer_v2.js';
import { UIManager } from './ui_v2.js';
import { Storage } from './storage_v2.js';

export class Game {
    constructor(canvas, uiContainer) {
        this.canvas = canvas;
        this.uiContainer = uiContainer;
        this.input = new InputManager();
        this.renderer = new Renderer(canvas);
        this.ui = new UIManager(uiContainer);
        
        this.state = 'menu';
        this.player = null;
        this.level = null;
        this.currentFloor = 1;
        this.totalFragments = 0;
        this.autoSaveTimer = 0;
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initUI();
    }

    init() {
    }

    resize() {
        const container = document.getElementById('game-container');
        const width = Math.min(container.clientWidth, CONFIG.GAME_WIDTH);
        const height = Math.min(container.clientHeight, CONFIG.GAME_HEIGHT);
        this.renderer.resize(width, height);
    }

    initUI() {
        this.ui.showContinueButton(Storage.hasSave());
        
        this.ui.on('start', () => this.startNewGame());
        this.ui.on('continue', () => this.continueGame());
        this.ui.on('pause', () => this.togglePause());
        this.ui.on('resume', () => this.togglePause());
        this.ui.on('restart', () => this.restartGame());
        this.ui.on('quit', () => this.quitToMenu());
        this.ui.on('retry', () => this.startNewGame());
        this.ui.on('menu', () => this.quitToMenu());
        this.ui.on('playAgain', () => this.startNewGame());
        this.ui.on('victoryMenu', () => this.quitToMenu());
    }

    startNewGame() {
        Storage.clear();
        this.currentFloor = 1;
        this.totalFragments = 0;
        
        const charType = this.ui.getSelectedCharacter();
        this.loadFloor(this.currentFloor, charType);
    }

    continueGame() {
        const saveData = Storage.load();
        if (!saveData) {
            this.startNewGame();
            return;
        }
        
        this.currentFloor = saveData.currentFloor || 1;
        this.totalFragments = saveData.totalFragments || 0;
        
        if (saveData.player && saveData.level) {
            this.player = Player.deserialize(saveData.player);
            this.level = Level.deserialize(saveData.level, Monster);
            this.startGame();
        } else {
            this.loadFloor(this.currentFloor, saveData.characterType || 'dreamer');
        }
    }

    loadFloor(floor, charType) {
        this.ui.showLevelTransition(floor, FLOOR_THEMES[Math.min(floor - 1, FLOOR_THEMES.length - 1)].name);
        
        setTimeout(() => {
            this.level = new Level(floor);
            this.level.generate(this.renderer.width, this.renderer.height, Monster);
            
            const startPos = this.level.getPlayerStart();
            this.player = new Player(charType || this.player?.type || 'dreamer', startPos.x, startPos.y);
            
            this.startGame();
            this.ui.hideLevelTransition();
        }, 1500);
    }

    startGame() {
        this.state = 'playing';
        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.updateUI();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = performance.now();
        this.gameLoop();
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.ui.showScreen('pauseScreen');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.ui.hideAllScreens();
            this.ui.showHUD();
            this.lastTime = performance.now();
        }
    }

    restartGame() {
        this.ui.hideAllScreens();
        const charType = this.player?.type || this.ui.getSelectedCharacter();
        this.loadFloor(this.currentFloor, charType);
    }

    quitToMenu() {
        this.state = 'menu';
        this.ui.hideAllScreens();
        this.ui.hideHUD();
        this.ui.showScreen('startScreen');
        this.ui.showContinueButton(Storage.hasSave());
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop() {
        if (this.state !== 'playing') {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.autoSaveTimer += deltaTime;
        if (this.autoSaveTimer > 2000) {
            this.saveGame();
            this.autoSaveTimer = 0;
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.input.isPausePressed()) {
            this.togglePause();
        }
        
        if (this.state !== 'playing') return;
        
        this.player.update(this.input, this.level.platforms);
        this.level.update(this.player);
        
        this.level.monsters.forEach(monster => {
            if (monster.checkCollisionWithPlayer(this.player)) {
                const isDead = this.player.takeDamage(monster.damage);
                if (isDead) {
                    this.gameOver();
                }
            }
        });
        
        if (this.player.y > this.renderer.height + 50) {
            this.player.takeDamage(15);
            const startPos = this.level.getPlayerStart();
            this.player.x = startPos.x;
            this.player.y = startPos.y;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.trail = [];
            
            if (this.player.isDead()) {
                this.gameOver();
            }
        }
        
        if (this.level.portal.checkCollision(this.player)) {
            this.nextFloor();
        }
        
        this.input.update();
        this.updateUI();
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground(this.level.theme);
        this.renderer.drawPlatforms(this.level.platforms, this.level.theme);
        this.renderer.drawFragments(this.level.fragments);
        this.renderer.drawPortal(this.level.portal);
        this.renderer.drawMonsters(this.level.monsters);
        this.renderer.drawPlayer(this.player);
    }

    updateUI() {
        this.ui.updateHealth(this.player.health, this.player.maxHealth);
        this.ui.updateShield(this.player.getShieldPercent());
        this.ui.updateFloor(this.currentFloor);
        this.ui.updateFragments(this.level.collectedFragments, this.level.totalFragments);
    }

    nextFloor() {
        this.totalFragments += this.level.collectedFragments;
        this.currentFloor++;
        
        if (this.currentFloor > CONFIG.TOTAL_FLOORS) {
            this.victory();
            return;
        }
        
        this.saveGame();
        this.loadFloor(this.currentFloor, this.player.type);
    }

    gameOver() {
        this.state = 'gameover';
        this.saveGame();
        this.ui.showGameOver(this.currentFloor, this.totalFragments + (this.level?.collectedFragments || 0), false);
    }

    victory() {
        this.state = 'victory';
        this.totalFragments += this.level.collectedFragments;
        Storage.clear();
        this.ui.showGameOver(CONFIG.TOTAL_FLOORS, this.totalFragments, true);
    }

    saveGame() {
        if (!this.player || !this.level) return;
        
        const saveData = {
            currentFloor: this.currentFloor,
            totalFragments: this.totalFragments,
            characterType: this.player.type,
            player: this.player.serialize(),
            level: this.level.serialize(),
            savedAt: Date.now(),
        };
        
        Storage.save(saveData);
    }
}
