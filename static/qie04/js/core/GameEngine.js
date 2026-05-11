import { Physics } from './Physics.js';
import { Input } from './Input.js';
import { Renderer } from './Renderer.js';
import { Penguin } from '../objects/Penguin.js';
import { generateProceduralLevel, getMaxLevel } from '../levels/Levels.js';
import { Storage } from '../storage/Storage.js';
import { UIManager } from '../ui/UIManager.js';

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.setupCanvas();
        
        this.physics = new Physics();
        this.renderer = new Renderer(canvas);
        this.storage = new Storage();
        
        this.penguin = new Penguin(100, 300);
        this.input = new Input(canvas, this);
        this.ui = new UIManager(this);
        
        this.currentLevel = 1;
        this.score = 0;
        this.highScore = this.storage.loadHighScore();
        this.pushes = 0;
        this.gameTime = 0;
        this.lastTime = 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        this.levelData = null;
        this.collectedItems = [];
        this.activeCheckpoints = [];
        this.particles = [];
        this.portalCooldown = 0;
        
        this.init();
    }

    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    init() {
        const hasSaveData = this.storage.hasSaveData();
        this.ui.showStartScreen(hasSaveData);
        this.render();
    }

    startGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.highScore = this.storage.loadHighScore();
        this.pushes = 0;
        this.gameTime = 0;
        this.isGameOver = false;
        
        this.storage.clear();
        this.loadLevel(this.currentLevel);
        this.penguin.reset(200, 300);
        this.penguin.vx = 0;
        this.penguin.vy = 0;
        this.beginGame();
    }

    continueGame() {
        if (this.storage.loadGameState(this)) {
            if (this.levelData) {
                this.beginGame();
                this.isPaused = false;
            } else {
                this.startGame();
            }
        } else {
            this.startGame();
        }
    }

    beginGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.ui.updateHUD(this);
        this.ui.updateItemSlots(this.penguin);
        
        this.storage.startAutoSave(() => {
            if (this.isPlaying && !this.isPaused && !this.isGameOver) {
                this.storage.saveGameState(this);
            }
        });
        
        this.lastTime = performance.now();
        this.gameLoop();
    }

    loadLevel(levelNum) {
        this.levelData = generateProceduralLevel(levelNum);
        this.collectedItems = [];
        this.activeCheckpoints = [];
        this.pushes = 0;
        this.gameTime = 0;
        this.portalCooldown = 0;
        this.particles = [];
        
        const start = this.levelData.start;
        this.penguin.reset(start.x, start.y);
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        if (!this.isPaused && !this.isGameOver) {
            this.update(deltaTime);
            this.gameTime += deltaTime;
        }
        
        this.render();
        this.ui.updateHUD(this);
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67;
        
        this.penguin.update(deltaTime);
        
        if (this.portalCooldown > 0) {
            this.portalCooldown -= deltaTime;
        }
        
        this.applyMagnetEffect();
        this.applyTerrainEffects();
        this.applyRotatingIceEffect(dt);
        
        this.physics.updatePosition(this.penguin, dt);
        
        let terrainFriction = 0;
        let maxSpeed = this.physics.maxSpeed;
        
        for (const slow of this.levelData.slowZones) {
            if (this.physics.checkRectCollision(this.penguin, slow)) {
                terrainFriction = 0.05;
            }
        }
        
        for (const boost of this.levelData.speedBoosts) {
            if (this.physics.checkRectCollision(this.penguin, boost)) {
                maxSpeed = this.physics.maxSpeed * 1.5;
            }
        }
        
        this.physics.applyFriction(this.penguin, terrainFriction);
        this.physics.limitSpeed(this.penguin, maxSpeed);
        
        this.physics.handleWallBounce(
            this.penguin,
            this.canvas.width,
            this.canvas.height,
            this.penguin.radius
        );
        
        this.checkCollisions();
        this.updateParticles(deltaTime);
    }

    applyMagnetEffect() {
        if (!this.penguin.hasMagnet || !this.levelData) return;
        
        const goal = this.levelData.goal;
        const dx = goal.x - this.penguin.x;
        const dy = goal.y - this.penguin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            const force = 0.15;
            this.penguin.vx += (dx / distance) * force;
            this.penguin.vy += (dy / distance) * force;
        }
    }

    applyTerrainEffects() {
        if (this.portalCooldown > 0) return;
        
        for (const portal of this.levelData.portals) {
            const portal1 = { x: portal.x1, y: portal.y1, radius: portal.radius };
            const portal2 = { x: portal.x2, y: portal.y2, radius: portal.radius };
            
            if (this.physics.checkCircleCollision(this.penguin, portal1)) {
                this.teleportTo(portal2);
                break;
            } else if (this.physics.checkCircleCollision(this.penguin, portal2)) {
                this.teleportTo(portal1);
                break;
            }
        }
    }

    teleportTo(target) {
        const speed = this.physics.getSpeed(this.penguin);
        const angle = Math.random() * Math.PI * 2;
        
        this.penguin.x = target.x;
        this.penguin.y = target.y;
        this.penguin.vx = Math.cos(angle) * speed;
        this.penguin.vy = Math.sin(angle) * speed;
        this.portalCooldown = 1000;
        
        this.addParticles(target.x, target.y, '#9b59b6', 20);
    }

    applyRotatingIceEffect(dt) {
        for (const rotating of this.levelData.rotatingIces) {
            if (this.physics.checkRectCollision(this.penguin, rotating)) {
                const centerX = rotating.x + rotating.width / 2;
                const centerY = rotating.y + rotating.height / 2;
                
                const angle = Math.atan2(this.penguin.y - centerY, this.penguin.x - centerX);
                const tangentAngle = angle + Math.PI / 2;
                
                const force = 0.08 * rotating.speed;
                this.penguin.vx += Math.cos(tangentAngle) * force * dt;
                this.penguin.vy += Math.sin(tangentAngle) * force * dt;
            }
        }
    }

    checkCollisions() {
        const goal = this.levelData.goal;
        if (this.physics.checkCircleCollision(this.penguin, goal)) {
            this.levelComplete();
            return;
        }
        
        for (const hole of this.levelData.holes) {
            if (this.physics.checkCircleCollision(this.penguin, hole)) {
                this.hitHole();
                return;
            }
        }
        
        for (const spike of this.levelData.spikes) {
            if (this.physics.checkCircleCollision(this.penguin, spike)) {
                this.hitSpike();
                return;
            }
        }
        
        for (let i = this.levelData.items.length - 1; i >= 0; i--) {
            const item = this.levelData.items[i];
            if (!this.collectedItems.includes(i)) {
                if (this.physics.checkCircleCollision(this.penguin, item)) {
                    this.collectItem(item, i);
                }
            }
        }
        
        for (let i = 0; i < this.levelData.checkpoints.length; i++) {
            const checkpoint = this.levelData.checkpoints[i];
            if (!this.activeCheckpoints.includes(i)) {
                const cpCircle = { x: checkpoint.x, y: checkpoint.y, radius: 30 };
                if (this.physics.checkCircleCollision(this.penguin, cpCircle)) {
                    this.activateCheckpoint(checkpoint, i);
                }
            }
        }
    }

    collectItem(item, index) {
        this.penguin.addItem(item.type);
        this.collectedItems.push(index);
        this.score += 50;
        this.ui.updateItemSlots(this.penguin);
        
        const colors = {
            magnet: '#FFD700',
            claw: '#3498db',
            shield: '#9b59b6',
            rocket: '#e74c3c'
        };
        this.addParticles(item.x, item.y, colors[item.type] || '#FFD700', 15);
    }

    activateCheckpoint(checkpoint, index) {
        this.activeCheckpoints.push(index);
        this.penguin.setCheckpoint(checkpoint.x, checkpoint.y);
        this.score += 100;
        this.addParticles(checkpoint.x, checkpoint.y, '#27ae60', 15);
    }

    hitHole() {
        this.addParticles(this.penguin.x, this.penguin.y, '#1a1a2e', 20);
        
        const isDead = this.penguin.loseLife();
        if (isDead) {
            this.gameOver(false);
        }
    }

    hitSpike() {
        this.addParticles(this.penguin.x, this.penguin.y, '#e74c3c', 20);
        
        const isDead = this.penguin.loseLife();
        if (isDead) {
            this.gameOver(false);
        }
    }

    useItem(type) {
        if (!this.isPlaying || this.isPaused || this.isGameOver) return;
        this.penguin.useItem(type);
        this.ui.updateItemSlots(this.penguin);
        
        if (type === 'rocket') {
            this.addParticles(this.penguin.x, this.penguin.y, '#e74c3c', 20);
        }
    }

    pushPenguin(dx, dy) {
        if (!this.isPlaying || this.isPaused || this.isGameOver) return;
        
        this.physics.applyPush(this.penguin, dx, dy, 2.5);
        this.pushes++;
    }

    levelComplete() {
        const timeBonus = Math.max(0, 1000 - Math.floor(this.gameTime / 100));
        const pushBonus = Math.max(0, 300 - this.pushes * 20);
        this.score += 500 + timeBonus + pushBonus;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.storage.saveHighScore(this.highScore);
        }
        
        this.storage.saveGameState(this);
        this.ui.showLevelComplete(this);
        this.isPaused = true;
    }

    nextLevel() {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.ui.updateHUD(this);
        this.ui.updateItemSlots(this.penguin);
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    gameOver(won) {
        this.isGameOver = true;
        this.isPlaying = false;
        this.storage.stopAutoSave();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.storage.saveHighScore(this.highScore);
        }
        
        this.storage.saveGameState(this);
        this.ui.showGameOver(won, this);
    }

    togglePause() {
        if (!this.isPlaying || this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.ui.showPauseMenu();
        } else {
            this.ui.hidePauseMenu();
            this.lastTime = performance.now();
        }
    }

    resumeGame() {
        this.isPaused = false;
        this.ui.hidePauseMenu();
        this.lastTime = performance.now();
    }

    restartLevel() {
        this.loadLevel(this.currentLevel);
        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.ui.updateHUD(this);
        this.ui.updateItemSlots(this.penguin);
        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = performance.now();
    }

    restartGame() {
        this.startGame();
    }

    quitToMenu() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.storage.stopAutoSave();
        this.storage.saveGameState(this);
        
        const hasSaveData = this.storage.hasSaveData();
        this.ui.showStartScreen(hasSaveData);
        this.render();
    }

    addParticles(x, y, color, count = 10) {
        const newParticles = this.ui.createParticles(x, y, color, count);
        this.particles.push(...newParticles);
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime / 1000;
            p.vx *= 0.98;
            p.vy *= 0.98;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.renderer.clear();
        this.renderer.drawIceBackground();
        
        if (!this.levelData) return;
        
        for (const boost of this.levelData.speedBoosts) {
            this.renderer.drawSpeedBoost(boost);
        }
        
        for (const slow of this.levelData.slowZones) {
            this.renderer.drawSlowZone(slow);
        }
        
        for (const rotating of this.levelData.rotatingIces) {
            this.renderer.drawRotatingIce(rotating);
        }
        
        for (const portal of this.levelData.portals) {
            this.renderer.drawPortal({ x: portal.x1, y: portal.y1, radius: portal.radius }, true);
            this.renderer.drawPortal({ x: portal.x2, y: portal.y2, radius: portal.radius }, false);
        }
        
        for (let i = 0; i < this.levelData.checkpoints.length; i++) {
            const checkpoint = this.levelData.checkpoints[i];
            const isActive = this.activeCheckpoints.includes(i);
            this.renderer.drawCheckpoint(checkpoint, isActive);
        }
        
        for (const hole of this.levelData.holes) {
            this.renderer.drawHole(hole);
        }
        
        for (const spike of this.levelData.spikes) {
            this.renderer.drawSpike(spike);
        }
        
        for (let i = 0; i < this.levelData.items.length; i++) {
            if (!this.collectedItems.includes(i)) {
                this.renderer.drawItem(this.levelData.items[i]);
            }
        }
        
        this.renderer.drawGoal(this.levelData.goal);
        
        this.renderer.drawPenguin(this.penguin);
        
        this.renderer.drawParticles(this.particles);
    }
}
