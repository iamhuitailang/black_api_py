import { GAME_STATES, RIDER_TYPES, AI_COUNT, TRACK_LENGTH, OBSTACLE_TYPES } from './config.js';
import { Storage } from './storage.js';
import { Rider } from './rider.js';
import { Track } from './track.js';
import { ItemManager } from './items.js';
import { AIController } from './ai.js';
import { InputManager } from './input.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = GAME_STATES.MENU;
        this.selectedRider = RIDER_TYPES.BOY;
        
        this.player = null;
        this.aiRiders = [];
        this.aiControllers = [];
        this.track = null;
        this.itemManager = null;
        this.cameraY = 0;
        
        this.gameTime = 0;
        this.startTime = 0;
        this.lastUpdateTime = Date.now();
        this.animationFrameId = null;
        
        this.inputManager = new InputManager();
        this.renderer = new Renderer(this.canvas);
        this.ui = new UIManager(this);
        
        this.ui.initSelectedRider();
        
        this.track = new Track();
        this.itemManager = new ItemManager();
        this.player = new Rider(this.selectedRider, true, 0);
        this.aiRiders = [];
        this.aiControllers = [];
        
        const hasSave = this.loadSavedGame();
        if (!hasSave) {
            this.ui.showScreen(GAME_STATES.MENU);
        }
        
        this.animationLoop();
        
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
        
        this.canvas.addEventListener('click', () => {
            document.body.focus();
        });
    }
    
    animationLoop() {
        const now = Date.now();
        const deltaTime = Math.min(50, now - this.lastUpdateTime);
        this.lastUpdateTime = now;
        
        if (this.state === GAME_STATES.MENU) {
            this.renderMenuBackground();
        } else if (this.state === GAME_STATES.PLAYING) {
            this.update(deltaTime);
            this.render();
        } else if (this.state === GAME_STATES.PAUSED || this.state === GAME_STATES.FINISHED) {
            if (this.player && this.track) {
                this.render();
            }
        }
        
        requestAnimationFrame(() => this.animationLoop());
    }
    
    renderMenuBackground() {
        if (!this.track) this.track = new Track();
        if (!this.itemManager) this.itemManager = new ItemManager();
        if (!this.player) this.player = new Rider(this.selectedRider, true, 0);
        if (this.aiRiders.length === 0) {
            const aiTypes = [RIDER_TYPES.BOY, RIDER_TYPES.GIRL, RIDER_TYPES.UNCLE];
            for (let i = 0; i < AI_COUNT; i++) {
                const aiType = aiTypes[i % aiTypes.length];
                const aiRider = new Rider(aiType, false, -50 - i * 80);
                this.aiRiders.push(aiRider);
            }
        }
        
        this.renderer.render({
            track: this.track,
            player: this.player,
            aiRiders: this.aiRiders,
            itemManager: this.itemManager,
            cameraY: this.cameraY
        });
        
        this.cameraY += 0.5;
        if (this.cameraY > 500) this.cameraY = 0;
    }

    startGame() {
        this.ui.saveSelectedRider(this.selectedRider);
        this.inputManager.reset();
        
        this.track = new Track();
        this.itemManager = new ItemManager();
        
        this.player = new Rider(this.selectedRider, true, 0);
        
        this.aiRiders = [];
        this.aiControllers = [];
        const aiTypes = [RIDER_TYPES.BOY, RIDER_TYPES.GIRL, RIDER_TYPES.UNCLE];
        for (let i = 0; i < AI_COUNT; i++) {
            const aiType = aiTypes[i % aiTypes.length];
            const aiRider = new Rider(aiType, false, -50 - i * 80);
            this.aiRiders.push(aiRider);
            this.aiControllers.push(new AIController(aiRider, 0.6 + Math.random() * 0.3));
        }
        
        this.gameTime = 0;
        this.startTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.cameraY = 0;
        
        this.state = GAME_STATES.PLAYING;
        this.lastUpdateTime = Date.now();
        this.ui.showScreen(GAME_STATES.PLAYING);
        document.body.focus();
    }

    pauseGame() {
        if (this.state !== GAME_STATES.PLAYING) return;
        
        this.state = GAME_STATES.PAUSED;
        this.ui.showScreen(GAME_STATES.PAUSED);
        this.saveGame();
    }

    resumeGame() {
        if (this.state !== GAME_STATES.PAUSED) return;
        
        this.state = GAME_STATES.PLAYING;
        this.lastUpdateTime = Date.now();
        this.ui.showScreen(GAME_STATES.PLAYING);
        document.body.focus();
    }

    restartGame() {
        Storage.clear();
        this.startGame();
    }

    quitToMenu() {
        Storage.clear();
        this.state = GAME_STATES.MENU;
        this.ui.showScreen(GAME_STATES.MENU);
        this.cameraY = 0;
    }

    finishGame() {
        this.state = GAME_STATES.FINISHED;
        this.ui.showScreen(GAME_STATES.FINISHED);
        this.ui.showFinishScreen(this.player, this.getAllRiders(), this.gameTime);
        Storage.clear();
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        
        if (this.inputManager.wasEscapePressed()) {
            this.pauseGame();
            return;
        }
        
        const playerInput = this.inputManager.getInput();
        
        if (playerInput.useItem && this.player.heldItem) {
            this.itemManager.useItem(this.player, this.getAllRiders());
        }
        
        this.player.update(deltaTime, playerInput, this.track);
        
        this.itemManager.checkPickup(this.player);
        this.itemManager.checkTrapCollision(this.player);
        this.checkObstacleCollision(this.player);
        
        for (let i = 0; i < this.aiRiders.length; i++) {
            const aiRider = this.aiRiders[i];
            const aiController = this.aiControllers[i];
            
            const aiInput = aiController.update(deltaTime, this.track, this.itemManager, this.getAllRiders());
            
            if (aiInput.useItem && aiRider.heldItem) {
                this.itemManager.useItem(aiRider, this.getAllRiders());
            }
            
            aiRider.update(deltaTime, aiInput, this.track);
            
            this.itemManager.checkPickup(aiRider);
            this.itemManager.checkTrapCollision(aiRider);
            this.checkObstacleCollision(aiRider);
        }
        
        this.itemManager.update(deltaTime);
        
        this.updateCamera();
        
        this.ui.updateHUD(this.player, this.getAllRiders(), this.gameTime);
        
        if (this.gameTime % 5000 < deltaTime) {
            this.saveGame();
        }
        
        if (this.player.finished || this.aiRiders.some(ai => ai.finished)) {
            const allFinished = this.getAllRiders().every(r => r.finished);
            if (allFinished || this.player.finished || this.gameTime > 180000) {
                this.finishGame();
            }
        }
    }

    checkObstacleCollision(rider) {
        const obstacle = this.track.checkCollision(rider);
        if (!obstacle) return;
        
        if (obstacle.type === OBSTACLE_TYPES.BLOCK) {
            if (!rider.hasShield()) {
                rider.stop(obstacle.stopTime);
            }
        }
    }

    updateCamera() {
        const targetY = this.player.distance + 50;
        this.cameraY += (targetY - this.cameraY) * 0.1;
        this.cameraY = Math.max(0, Math.min(this.cameraY, TRACK_LENGTH + 300));
    }

    render() {
        this.renderer.render({
            track: this.track,
            player: this.player,
            aiRiders: this.aiRiders,
            itemManager: this.itemManager,
            cameraY: this.cameraY
        });
    }

    getAllRiders() {
        return [this.player, ...this.aiRiders];
    }

    saveGame() {
        if (this.state !== GAME_STATES.PLAYING && this.state !== GAME_STATES.PAUSED) return;
        if (!this.track || !this.player) return;
        
        const saveData = {
            state: GAME_STATES.PAUSED,
            selectedRider: this.selectedRider,
            gameTime: this.gameTime,
            cameraY: this.cameraY,
            track: this.track.serialize(),
            itemManager: this.itemManager.serialize(),
            player: this.player.serialize(),
            aiRiders: this.aiRiders.map(r => r.serialize()),
            aiControllers: this.aiControllers.map(ai => ai.serialize())
        };
        
        Storage.save(saveData);
    }

    loadSavedGame() {
        const saved = Storage.load();
        if (!saved) return false;
        
        try {
            this.selectedRider = saved.selectedRider;
            this.gameTime = saved.gameTime;
            this.cameraY = saved.cameraY;
            
            this.track = Track.deserialize(saved.track);
            this.itemManager = ItemManager.deserialize(saved.itemManager);
            this.player = Rider.deserialize(saved.player);
            
            this.aiRiders = saved.aiRiders.map(data => Rider.deserialize(data));
            if (saved.aiControllers && saved.aiControllers.length === this.aiRiders.length) {
                this.aiControllers = saved.aiControllers.map((data, i) => 
                    AIController.deserialize(data, this.aiRiders[i])
                );
            } else {
                this.aiControllers = this.aiRiders.map(rider => 
                    new AIController(rider, 0.6 + Math.random() * 0.3)
                );
            }
            
            this.state = GAME_STATES.PAUSED;
            this.lastUpdateTime = Date.now();
            this.ui.showScreen(GAME_STATES.PAUSED);
            
            return true;
        } catch (e) {
            console.error('加载存档失败:', e);
            Storage.clear();
            return false;
        }
    }
}
