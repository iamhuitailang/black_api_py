import { CONFIG, GAME_STATE } from './config.js';
import { getCanvasCoordinates } from './utils.js';
import { Storage } from './storage.js';
import { GameEngine } from './gameEngine.js';
import { Renderer } from './renderer.js';
import { UIController } from './uiController.js';

class GameApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvasWidth = window.innerWidth;
        this.canvasHeight = window.innerHeight;

        this.gameEngine = new GameEngine(this.canvasWidth, this.canvasHeight);
        this.renderer = new Renderer(this.canvas);
        this.ui = new UIController();

        this.lastTime = 0;
        this.animationId = null;
        this.isRunning = false;
        this.saveTimer = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupUICallbacks();
        this.setupEventListeners();
        this.ui.showScreen(GAME_STATE.MENU);
        this.startBackgroundAnimation();
    }

    setupUICallbacks() {
        this.ui.setCallbacks({
            onStartGame: () => this.startGame(),
            onPause: () => this.pauseGame(),
            onResume: () => this.resumeGame(),
            onRestart: () => this.restartGame(),
            onQuit: () => this.quitGame(),
            onBackToMenu: () => this.backToMenu(),
            onEscape: () => this.handleEscape()
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    }

    resizeCanvas() {
        this.canvasWidth = window.innerWidth;
        this.canvasHeight = window.innerHeight;
        this.renderer.resize(this.canvasWidth, this.canvasHeight);
        this.gameEngine.resize(this.canvasWidth, this.canvasHeight);
    }

    handleResize() {
        this.resizeCanvas();
    }

    handleClick(e) {
        if (this.gameEngine.getState() !== GAME_STATE.PLAYING) return;
        
        const coords = getCanvasCoordinates(this.canvas, e.clientX, e.clientY);
        const worldCoords = this.renderer.screenToWorld(coords.x, coords.y);
        this.gameEngine.handleClick(worldCoords.x, worldCoords.y);
    }

    handleMouseMove(e) {
        if (this.gameEngine.getState() !== GAME_STATE.PLAYING) return;
        
        const coords = getCanvasCoordinates(this.canvas, e.clientX, e.clientY);
        const worldCoords = this.renderer.screenToWorld(coords.x, coords.y);
        this.gameEngine.handleHover(worldCoords.x, worldCoords.y);
        
        this.canvas.style.cursor = this.gameEngine.hoveredHold ? 'pointer' : 'default';
    }

    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.gameEngine.getState() !== GAME_STATE.PLAYING) return;
        
        const touch = e.touches[0];
        const coords = getCanvasCoordinates(this.canvas, touch.clientX, touch.clientY);
        const worldCoords = this.renderer.screenToWorld(coords.x, coords.y);
        this.gameEngine.handleClick(worldCoords.x, worldCoords.y);
    }

    startGame() {
        const hasSaved = Storage.hasSavedGame();
        
        if (hasSaved) {
            const loaded = this.gameEngine.loadSavedGame();
            if (loaded) {
                const camera = this.gameEngine.getCamera();
                this.renderer.setCamera(camera.x, camera.y, camera.zoom);
                this.ui.showScreen(GAME_STATE.PLAYING);
                return;
            }
        }
        
        this.gameEngine.startNewGame();
        const camera = this.gameEngine.getCamera();
        this.renderer.setCamera(camera.x, camera.y, camera.zoom);
        this.ui.showScreen(GAME_STATE.PLAYING);
    }

    pauseGame() {
        this.gameEngine.pause();
        this.ui.showScreen(GAME_STATE.PAUSED);
    }

    resumeGame() {
        this.gameEngine.resume();
        this.ui.showScreen(GAME_STATE.PLAYING);
    }

    restartGame() {
        Storage.clearGameState();
        this.gameEngine.startNewGame();
        this.ui.showScreen(GAME_STATE.PLAYING);
    }

    quitGame() {
        this.gameEngine.quit();
        this.ui.showScreen(GAME_STATE.MENU);
    }

    backToMenu() {
        this.gameEngine.quit();
        this.ui.showScreen(GAME_STATE.MENU);
    }

    handleEscape() {
        const state = this.gameEngine.getState();
        if (state === GAME_STATE.PLAYING) {
            this.pauseGame();
        } else if (state === GAME_STATE.PAUSED) {
            this.resumeGame();
        }
    }

    startBackgroundAnimation() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stopBackgroundAnimation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min(currentTime - this.lastTime, 1000 / 30);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        const state = this.gameEngine.getState();
        
        if (state === GAME_STATE.PLAYING) {
            this.gameEngine.update(deltaTime);
            
            const altitude = this.gameEngine.getPlayerAltitude();
            const best = Math.max(altitude, Storage.getBestScore());
            const stamina = this.gameEngine.getStamina();
            const maxStamina = this.gameEngine.getMaxStamina();
            
            this.ui.updateHUD(altitude, best, stamina, maxStamina);
            
            const camera = this.gameEngine.getCamera();
            this.renderer.setCamera(camera.x, camera.y, camera.zoom);
            
            this.saveTimer += deltaTime;
            if (this.saveTimer >= 500) {
                this.saveTimer = 0;
                this.gameEngine.saveState();
            }
            
            this.checkGameStateChanges();
        } else if (state === GAME_STATE.MENU || state === GAME_STATE.PAUSED) {
            const camera = this.gameEngine.getCamera();
            this.renderer.setCamera(camera.x, camera.y, camera.zoom);
        }
    }

    checkGameStateChanges() {
        const state = this.gameEngine.getState();
        
        if (state === GAME_STATE.GAME_OVER) {
            const altitude = this.gameEngine.getPlayerAltitude();
            const best = Storage.getBestScore();
            const isNewRecord = altitude >= best && altitude > 0;
            this.ui.showGameOver(altitude, isNewRecord);
            this.ui.showScreen(GAME_STATE.GAME_OVER);
        } else if (state === GAME_STATE.VICTORY) {
            this.ui.showVictory();
            this.ui.showScreen(GAME_STATE.VICTORY);
        }
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        
        const state = this.gameEngine.getState();
        
        if (state !== GAME_STATE.MENU) {
            const minY = this.gameEngine.summitY - 200;
            const maxY = 500;
            
            this.renderer.drawWall(this.gameEngine.wallWidth, minY, maxY);
            this.renderer.drawSummit(this.gameEngine.summitY, this.gameEngine.wallWidth);
            
            for (const hold of this.gameEngine.holds) {
                this.renderer.drawHold(hold);
            }
            
            for (const rock of this.gameEngine.rocks) {
                this.renderer.drawRock(rock);
            }
            
            for (const bird of this.gameEngine.birds) {
                this.renderer.drawBird(bird);
            }
            
            if (this.gameEngine.player) {
                this.renderer.drawPlayer(this.gameEngine.player);
                
                if (this.gameEngine.hoveredHold && !this.gameEngine.player.isJumping) {
                    this.renderer.drawJumpLine(this.gameEngine.player, this.gameEngine.hoveredHold);
                }
            }
            
            for (const particle of this.gameEngine.snowParticles) {
                this.renderer.drawSnowParticle(particle);
            }
            
            const altitude = this.gameEngine.getPlayerAltitude();
            const best = Storage.getBestScore();
            this.renderer.drawAltitudeMarkers(altitude, best);
        } else {
            for (const particle of this.gameEngine.snowParticles) {
                this.renderer.drawSnowParticle(particle);
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
