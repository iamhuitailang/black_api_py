import { CONFIG, GAME_STATE } from './config.js';
import { clamp, distance, rectIntersect, lerp } from './utils.js';
import { Player, Hold, Rock, Bird, SnowParticle, HoldGenerator } from './entities.js';
import { Storage } from './storage.js';

export class GameEngine {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.wallWidth = canvasWidth;
        this.summitY = -CONFIG.GAME.SUMMIT_ALTITUDE * 10;
        
        this.player = null;
        this.holds = [];
        this.rocks = [];
        this.birds = [];
        this.snowParticles = [];
        
        this.cameraX = 0;
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.zoom = 1;
        
        this.gameState = GAME_STATE.MENU;
        this.rockSpawnTimer = 0;
        this.birdSpawnTimer = 0;
        this.windTimer = 0;
        this.isWindActive = false;
        this.windStrength = 0;
        this.windDirection = 1;
        
        this.lastRockSpawnY = 0;
        this.hoveredHold = null;
        this.pendingHold = null;
        
        this.init();
    }

    init() {
        this.initSnowParticles();
    }

    initSnowParticles() {
        this.snowParticles = [];
        for (let i = 0; i < CONFIG.PARTICLES.SNOW_COUNT; i++) {
            this.snowParticles.push(new SnowParticle(this.canvasWidth, this.canvasHeight));
        }
    }

    startNewGame() {
        this.holds = [];
        this.rocks = [];
        this.birds = [];
        this.rockSpawnTimer = 0;
        this.birdSpawnTimer = 0;
        this.windTimer = 0;
        this.isWindActive = false;
        this.hoveredHold = null;
        this.pendingHold = null;
        
        this.generateInitialHolds();
        
        const startHold = this.holds[0];
        this.player = new Player(
            startHold.x + (startHold.width - CONFIG.PLAYER.WIDTH) / 2,
            startHold.y - CONFIG.PLAYER.HEIGHT
        );
        this.player.currentHold = startHold;
        this.player.side = 'left';
        
        this.cameraY = this.player.y;
        this.targetCameraY = this.player.y;
        this.zoom = CONFIG.CAMERA.ZOOM_NORMAL;
        
        this.gameState = GAME_STATE.PLAYING;
        
        this.updateReachableHolds();
        this.saveState();
    }

    generateInitialHolds() {
        const startY = 300;
        const endY = this.summitY;
        
        this.holds = HoldGenerator.generateHolds(startY, endY, this.wallWidth);
        
        this.holds[0].type = CONFIG.HOLD.TYPES.NORMAL;
        this.holds[0].x = this.wallWidth / 2 - CONFIG.HOLD.WIDTH / 2;
        
        if (this.holds.length > 1) {
            this.holds[1].x = this.wallWidth * 0.3;
            this.holds[1].y = startY - 90;
            this.holds[1].type = CONFIG.HOLD.TYPES.NORMAL;
        }
        if (this.holds.length > 2) {
            this.holds[2].x = this.wallWidth * 0.6;
            this.holds[2].y = startY - 90;
            this.holds[2].type = CONFIG.HOLD.TYPES.NORMAL;
        }
        if (this.holds.length > 3) {
            this.holds[3].x = this.wallWidth * 0.45;
            this.holds[3].y = startY - 180;
            this.holds[3].type = CONFIG.HOLD.TYPES.REST;
        }
    }

    loadSavedGame() {
        const savedState = Storage.loadGameState();
        if (!savedState) return false;
        
        try {
            this.holds = savedState.holds.map(h => Hold.deserialize(h));
            this.player = Player.deserialize(savedState.player, this.holds);
            this.rocks = savedState.rocks.map(r => Rock.deserialize(r));
            this.birds = savedState.birds.map(b => Bird.deserialize(b));
            this.snowParticles = savedState.snowParticles.map(p => SnowParticle.deserialize(p));
            
            this.cameraY = savedState.cameraY;
            this.targetCameraY = savedState.targetCameraY;
            this.zoom = savedState.zoom;
            this.rockSpawnTimer = savedState.rockSpawnTimer || 0;
            this.birdSpawnTimer = savedState.birdSpawnTimer || 0;
            if (savedState.pendingHoldIndex !== null && this.holds[savedState.pendingHoldIndex]) {
                this.pendingHold = this.holds[savedState.pendingHoldIndex];
            } else {
                this.pendingHold = null;
            }
            
            this.gameState = GAME_STATE.PLAYING;
            
            if (this.player.isJumping && !this.pendingHold) {
                this.player.isJumping = false;
                if (this.player.currentHold) {
                    this.player.attachToHold(this.player.currentHold);
                }
            }
            
            this.updateReachableHolds();
            return true;
        } catch (e) {
            console.error('Failed to load saved game:', e);
            return false;
        }
    }

    saveState() {
        if (this.gameState !== GAME_STATE.PLAYING) return;
        
        const state = {
            player: this.player.serialize(),
            holds: this.holds.map(h => h.serialize()),
            rocks: this.rocks.map(r => r.serialize()),
            birds: this.birds.map(b => b.serialize()),
            snowParticles: this.snowParticles.map(p => p.serialize()),
            cameraY: this.cameraY,
            targetCameraY: this.targetCameraY,
            zoom: this.zoom,
            rockSpawnTimer: this.rockSpawnTimer,
            birdSpawnTimer: this.birdSpawnTimer,
            pendingHoldIndex: this.pendingHold ? this.pendingHold.index : null,
            timestamp: Date.now()
        };
        
        Storage.saveGameState(state);
    }

    update(deltaTime) {
        if (this.gameState !== GAME_STATE.PLAYING) return;
        
        this.player.update(deltaTime);
        this.checkJumpComplete();
        this.updateHolds(deltaTime);
        this.updateRocks(deltaTime);
        this.updateBirds(deltaTime);
        this.updateSnowParticles(deltaTime);
        this.updateWind(deltaTime);
        this.updateCamera(deltaTime);
        this.checkCollisions();
        this.checkGameConditions();
        
        this.updateReachableHolds();
    }

    checkJumpComplete() {
        if (!this.pendingHold || !this.player.isJumping) return;
        
        if (this.player.jumpProgress >= 1) {
            const hold = this.pendingHold;
            this.player.attachToHold(hold);
            
            if (hold.isIce()) {
                this.player.startSlide();
            } else if (hold.isRestPoint()) {
                this.player.stamina = clamp(
                    this.player.stamina + CONFIG.HOLD.REST_STAMINA_BONUS,
                    0,
                    this.player.maxStamina
                );
            }
            
            this.pendingHold = null;
            this.saveState();
        }
    }

    updateHolds(deltaTime) {
        for (const hold of this.holds) {
            hold.update(deltaTime, this.player);
        }
    }

    updateRocks(deltaTime) {
        this.rockSpawnTimer += deltaTime;
        
        const spawnInterval = CONFIG.OBSTACLE.ROCK.SPAWN_INTERVAL;
        if (this.rockSpawnTimer >= spawnInterval) {
            this.rockSpawnTimer = 0;
            this.spawnRock();
        }
        
        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const rock = this.rocks[i];
            rock.update(deltaTime);
            
            if (rock.y > this.cameraY + this.canvasHeight + 100) {
                this.rocks.splice(i, 1);
            }
        }
    }

    spawnRock() {
        const spawnY = this.cameraY - this.canvasHeight / 2 - 50;
        const x = Math.random() * (this.wallWidth - CONFIG.OBSTACLE.ROCK.WIDTH);
        this.rocks.push(new Rock(x, spawnY));
    }

    updateBirds(deltaTime) {
        this.birdSpawnTimer += deltaTime;
        
        if (this.birdSpawnTimer >= CONFIG.OBSTACLE.BIRD.SPAWN_INTERVAL) {
            this.birdSpawnTimer = 0;
            this.spawnBird();
        }
        
        for (let i = this.birds.length - 1; i >= 0; i--) {
            const bird = this.birds[i];
            bird.update(deltaTime);
            
            if (bird.x < -100 || bird.x > this.wallWidth + 100) {
                this.birds.splice(i, 1);
            }
        }
    }

    spawnBird() {
        const y = this.player.y - 100 + Math.random() * 200;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const x = direction > 0 ? -50 : this.wallWidth + 50;
        this.birds.push(new Bird(x, y, direction));
    }

    updateSnowParticles(deltaTime) {
        for (const particle of this.snowParticles) {
            particle.update(deltaTime, this.canvasWidth, this.canvasHeight, this.cameraY);
        }
    }

    updateWind(deltaTime) {
        this.windTimer += deltaTime;
        
        if (!this.isWindActive && this.windTimer >= CONFIG.OBSTACLE.WIND.INTERVAL) {
            this.windTimer = 0;
            this.isWindActive = true;
            this.windDirection = Math.random() > 0.5 ? 1 : -1;
        }
        
        if (this.isWindActive && this.windTimer >= CONFIG.OBSTACLE.WIND.DURATION) {
            this.isWindActive = false;
            this.windTimer = 0;
        }
        
        if (this.isWindActive) {
            this.windStrength = lerp(this.windStrength, CONFIG.OBSTACLE.WIND.STRENGTH, 0.05);
        } else {
            this.windStrength = lerp(this.windStrength, 0, 0.05);
        }
    }

    updateCamera(deltaTime) {
        const playerPos = this.player.getJumpPosition();
        
        if (this.player.isFalling) {
            this.targetCameraY = playerPos.y + this.canvasHeight * 0.3;
            this.zoom = lerp(this.zoom, CONFIG.CAMERA.ZOOM_FALLING, 0.03);
        } else if (this.player.altitude > CONFIG.GAME.SUMMIT_ALTITUDE * 0.8) {
            this.targetCameraY = playerPos.y - this.canvasHeight * 0.2;
            this.zoom = lerp(this.zoom, CONFIG.CAMERA.ZOOM_SUMMIT, 0.03);
        } else {
            this.targetCameraY = playerPos.y + this.canvasHeight * (1 - CONFIG.CAMERA.PLAYER_OFFSET_Y);
            this.zoom = lerp(this.zoom, CONFIG.CAMERA.ZOOM_NORMAL, 0.05);
        }
        
        this.cameraY = lerp(this.cameraY, this.targetCameraY, CONFIG.CAMERA.FOLLOW_SPEED);
    }

    updateReachableHolds() {
        if (this.player.isJumping || this.player.isFalling || this.player.isSliding) {
            for (const hold of this.holds) {
                hold.isReachable = false;
            }
            return;
        }
        
        const playerPos = this.player.getJumpPosition();
        const playerCenterX = playerPos.x + this.player.width / 2;
        const playerCenterY = playerPos.y + this.player.height / 2;
        
        for (const hold of this.holds) {
            const dist = distance(
                playerCenterX, playerCenterY,
                hold.centerX, hold.centerY
            );
            hold.isReachable = dist >= CONFIG.PLAYER.MIN_JUMP_DISTANCE && 
                               dist <= CONFIG.PLAYER.MAX_JUMP_DISTANCE &&
                               hold.canGrab();
        }
    }

    checkCollisions() {
        const playerPos = this.player.getJumpPosition();
        
        for (const rock of this.rocks) {
            if (rectIntersect(
                playerPos.x, playerPos.y, this.player.width, this.player.height,
                rock.x, rock.y, rock.width, rock.height
            )) {
                this.handleRockCollision(rock);
            }
        }
        
        if (this.isWindActive && this.player.isJumping) {
            const windOffset = this.windStrength * this.windDirection * 0.016;
            this.player.jumpStartX += windOffset;
            this.player.jumpTargetX += windOffset;
        }
    }

    handleRockCollision(rock) {
        this.player.stamina -= CONFIG.OBSTACLE.ROCK.DAMAGE;
        rock.active = false;
        
        const index = this.rocks.indexOf(rock);
        if (index > -1) {
            this.rocks.splice(index, 1);
        }
        
        if (this.player.stamina <= 0) {
            this.player.startFall();
        }
    }

    checkGameConditions() {
        const playerPos = this.player.getJumpPosition();
        
        if (playerPos.y <= this.summitY) {
            this.handleVictory();
            return;
        }
        
        if (this.player.isFalling) {
            this.player.y += CONFIG.PLAYER.FALL_SPEED * 0.016;
            
            if (this.player.y > this.cameraY + this.canvasHeight) {
                this.handleGameOver();
                return;
            }
            
            for (const hold of this.holds) {
                if (hold.canGrab() && rectIntersect(
                    this.player.x, this.player.y + this.player.height - 10, 
                    this.player.width, 20,
                    hold.x, hold.y, hold.width, hold.height
                )) {
                    this.player.attachToHold(hold);
                    if (hold.isRestPoint()) {
                        this.player.stamina = clamp(
                            this.player.stamina + CONFIG.HOLD.REST_STAMINA_BONUS,
                            0,
                            this.player.maxStamina
                        );
                    }
                    break;
                }
            }
        }
        
        if (this.player.isSliding) {
            this.player.y += CONFIG.PLAYER.SLIDE_SPEED * 0.016;
            
            if (!this.player.currentHold || this.player.y > this.player.currentHold.y + 50) {
                this.player.startFall();
            }
        }
        
        if (this.player.stamina <= 0 && !this.player.isFalling && !this.player.isJumping && !this.player.isSliding) {
            this.player.startFall();
        }
    }

    handleJump(hold) {
        if (!hold || !hold.canGrab() || this.player.isJumping || 
            this.player.isFalling || this.player.isSliding) {
            return false;
        }
        
        if (!hold.isReachable) {
            return false;
        }
        
        const targetX = hold.x + (hold.width - this.player.width) / 2;
        const targetY = hold.y - this.player.height;
        
        if (this.player.startJump(targetX, targetY)) {
            this.pendingHold = hold;
            this.saveState();
            return true;
        }
        
        return false;
    }

    handleVictory() {
        this.gameState = GAME_STATE.VICTORY;
        const altitude = this.player.altitude;
        Storage.saveBestScore(altitude);
        Storage.clearGameState();
    }

    handleGameOver() {
        this.gameState = GAME_STATE.GAME_OVER;
        const altitude = this.player.altitude;
        Storage.saveBestScore(altitude);
        Storage.clearGameState();
    }

    pause() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            this.saveState();
        }
    }

    resume() {
        if (this.gameState === GAME_STATE.PAUSED) {
            this.gameState = GAME_STATE.PLAYING;
        }
    }

    quit() {
        this.gameState = GAME_STATE.MENU;
        Storage.clearGameState();
    }

    getState() {
        return this.gameState;
    }

    getPlayerAltitude() {
        return this.player ? this.player.altitude : 0;
    }

    getStamina() {
        return this.player ? this.player.stamina : 0;
    }

    getMaxStamina() {
        return this.player ? this.player.maxStamina : 100;
    }

    getCamera() {
        return {
            x: this.cameraX,
            y: this.cameraY,
            zoom: this.zoom
        };
    }

    handleClick(worldX, worldY) {
        if (this.gameState !== GAME_STATE.PLAYING) return false;
        
        for (const hold of this.holds) {
            if (hold.containsPoint(worldX, worldY)) {
                return this.handleJump(hold);
            }
        }
        
        return false;
    }

    handleHover(worldX, worldY) {
        this.hoveredHold = null;
        
        for (const hold of this.holds) {
            if (hold.containsPoint(worldX, worldY) && hold.isReachable) {
                this.hoveredHold = hold;
                break;
            }
        }
        
        return this.hoveredHold;
    }

    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.wallWidth = width;
    }
}
