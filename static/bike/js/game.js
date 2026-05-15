import { CONFIG } from './config.js';
import { Player } from './player.js';
import { TerrainManager } from './terrain.js';
import { InputManager } from './input.js';
import { TrickManager } from './trick.js';
import { StorageManager } from './storage.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        this.player = null;
        this.terrain = null;
        this.input = null;
        this.trickManager = null;
        this.storage = new StorageManager();

        this.score = 0;
        this.time = 0;
        this.cameraX = 0;
        this.level = 1;
        this.totalScore = 0;
        this.totalTricks = 0;
        this.currentBike = 'MOUNTAIN';

        this.lastSaveTime = 0;

        this.setupCanvas();
        this.setupUI();
    }

    setupCanvas() {
        var self = this;
        function resize() {
            self.canvas.width = Math.min(window.innerWidth - 40, 1200);
            self.canvas.height = Math.min(window.innerHeight - 40, 700);
            self.width = self.canvas.width;
            self.height = self.canvas.height;
        }
        resize();
        window.addEventListener('resize', resize);
    }

    setupUI() {
        var self = this;
        
        var startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', function() {
            self.startNewGame();
        });
        
        document.getElementById('continue-btn').addEventListener('click', function() {
            self.continueGame();
        });
        document.getElementById('pause-btn').addEventListener('click', function() {
            self.togglePause();
        });
        document.getElementById('resume-btn').addEventListener('click', function() {
            self.togglePause();
        });
        document.getElementById('restart-btn').addEventListener('click', function() {
            self.restartGame();
        });
        document.getElementById('quit-btn').addEventListener('click', function() {
            self.quitGame();
        });
        document.getElementById('retry-btn').addEventListener('click', function() {
            self.restartGame();
        });
        document.getElementById('menu-btn').addEventListener('click', function() {
            self.showMainMenu();
        });

        if (this.storage.hasSave()) {
            document.getElementById('continue-btn').classList.remove('hidden');
        }
    }

    startNewGame() {
        this.storage.clear();
        this.initGame();
        this.start();
    }

    continueGame() {
        var saved = this.storage.load();
        if (saved) {
            this.initGame();
            
            this.player.x = saved.player.x;
            this.player.vx = saved.player.vx;
            this.player.vy = saved.player.vy;
            this.player.angle = saved.player.angle;
            this.player.angularVelocity = saved.player.angularVelocity;
            this.player.isGrounded = saved.player.isGrounded;
            this.player.isFalling = saved.player.isFalling;
            this.player.fallTimer = saved.player.fallTimer || 0;
            
            var groundY = this.terrain.getGroundHeight(saved.player.x);
            this.player.y = Math.min(saved.player.y, groundY - this.player.wheelRadius);
            
            this.score = saved.score || 0;
            this.time = saved.time || 0;
            this.cameraX = Math.max(0, saved.player.x - 200);
            this.level = saved.level || 1;
            this.totalScore = saved.totalScore || 0;
            this.totalTricks = saved.totalTricks || 0;
            this.currentBike = saved.currentBike || 'MOUNTAIN';
            this.start();
        } else {
            this.startNewGame();
        }
    }

    initGame() {
        this.player = new Player(this.canvas, this.currentBike);
        this.terrain = new TerrainManager(this.canvas);
        this.input = new InputManager();
        this.trickManager = new TrickManager();

        this.score = 0;
        this.time = 0;
        this.cameraX = 0;
        this.lastSaveTime = 0;

        this.hideAllMenus();
        document.getElementById('hud').classList.remove('hidden');
        
        if ('ontouchstart' in window) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restartGame() {
        this.hideAllMenus();
        this.player.reset();
        this.trickManager.reset();
        this.score = 0;
        this.time = 0;
        this.cameraX = 0;
        this.isPaused = false;
        this.start();
    }

    quitGame() {
        this.saveGame();
        this.isRunning = false;
        this.showMainMenu();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            document.getElementById('pause-menu').classList.remove('hidden');
            this.saveGame();
        } else {
            document.getElementById('pause-menu').classList.add('hidden');
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;

        var currentTime = performance.now();
        var deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        var self = this;
        requestAnimationFrame(function() {
            self.gameLoop();
        });
    }

    update(deltaTime) {
        this.time += deltaTime / 1000;
        
        this.player.update(this.input, this.terrain, deltaTime);

        var targetCameraX = this.player.x - this.width * 0.3;
        this.cameraX += (targetCameraX - this.cameraX) * 0.1;
        this.cameraX = Math.max(0, this.cameraX);

        var trick = this.trickManager.checkTrick(this.input, this.player, performance.now());
        if (trick) {
            this.score += this.trickManager.completeTrick(trick);
        }

        if (this.terrain.checkFinish(this.player.x)) {
            this.gameOver(true);
        }

        if (this.time >= CONFIG.GAME.TIME_LIMIT) {
            this.gameOver(false);
        }

        this.lastSaveTime += deltaTime;
        if (this.lastSaveTime >= CONFIG.GAME.AUTO_SAVE_INTERVAL) {
            this.saveGame();
            this.lastSaveTime = 0;
        }

        this.updateHUD();
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.terrain.render(this.ctx, this.cameraX);
        this.player.render(this.ctx, this.cameraX);
    }

    updateHUD() {
        var minutes = Math.floor(this.time / 60);
        var seconds = Math.floor(this.time % 60);
        var minStr = minutes < 10 ? '0' + minutes : String(minutes);
        var secStr = seconds < 10 ? '0' + seconds : String(seconds);
        document.getElementById('time-display').textContent = minStr + ':' + secStr;
        
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('speed-display').textContent = Math.floor(this.player.vx * 10) + ' km/h';

        var progress = Math.min((this.player.x / CONFIG.GAME.TRACK_LENGTH) * 100, 100);
        document.getElementById('progress-fill').style.width = progress + '%';
    }

    saveGame() {
        if (!this.player) return;
        
        var gameState = {
            player: {
                x: this.player.x,
                y: this.player.y,
                vx: this.player.vx,
                vy: this.player.vy,
                angle: this.player.angle,
                angularVelocity: this.player.angularVelocity,
                isGrounded: this.player.isGrounded,
                isFalling: this.player.isFalling,
                fallTimer: this.player.fallTimer
            },
            score: this.score,
            time: this.time,
            tricksCompleted: this.trickManager ? this.trickManager.getTrickCount() : 0,
            currentBike: this.currentBike,
            cameraX: this.cameraX,
            level: this.level,
            totalScore: this.totalScore,
            totalTricks: this.totalTricks,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
        this.storage.save(gameState);
    }

    gameOver(won) {
        this.isRunning = false;
        this.storage.clear();
        this.storage.saveHighScore(this.score);

        var finalScore = this.score + Math.floor((CONFIG.GAME.TIME_LIMIT - this.time) * 10);
        this.totalScore += finalScore;
        this.totalTricks += this.trickManager.getTrickCount();

        document.getElementById('game-over-title').textContent = won ? '🎉 恭喜通关！' : '⏰ 时间到！';
        document.getElementById('final-score').textContent = finalScore;
        
        var minutes = Math.floor(this.time / 60);
        var seconds = Math.floor(this.time % 60);
        var minStr = minutes < 10 ? '0' + minutes : String(minutes);
        var secStr = seconds < 10 ? '0' + seconds : String(seconds);
        document.getElementById('final-time').textContent = minStr + ':' + secStr;
        
        document.getElementById('tricks-count').textContent = this.trickManager.getTrickCount();

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mobile-controls').classList.add('hidden');
        document.getElementById('game-over-menu').classList.remove('hidden');
    }

    showMainMenu() {
        this.hideAllMenus();
        document.getElementById('start-menu').classList.remove('hidden');
        
        if (this.storage.hasSave()) {
            document.getElementById('continue-btn').classList.remove('hidden');
        }
    }

    hideAllMenus() {
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mobile-controls').classList.add('hidden');
    }
}
