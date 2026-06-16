import type { GameState, Ring as RingType, GameStatus } from './types';
import { GAME_CONFIG, GAME_CONFIG as CONFIG } from './config';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { CollisionDetector } from './engine/CollisionDetector';
import { ParticleSystem } from './engine/ParticleSystem';
import { Ball } from './entities/Ball';
import { Ring } from './entities/Ring';
import { SkinManager } from './entities/SkinManager';
import { AudioManager } from './audio/AudioManager';
import { SaveManager } from './storage/SaveManager';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private deltaTime: number = 0;

  private physicsEngine: PhysicsEngine;
  private collisionDetector: CollisionDetector;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private saveManager: SaveManager;
  private skinManager: SkinManager;

  private ball: Ball;
  private rings: RingType[] = [];
  private nextRingY: number = 0;

  private state: GameState;
  private onStateChange?: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange?: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;

    this.physicsEngine = new PhysicsEngine();
    this.collisionDetector = new CollisionDetector();
    this.particleSystem = new ParticleSystem();
    this.audioManager = new AudioManager();
    this.saveManager = new SaveManager();
    this.skinManager = new SkinManager();

    this.ball = new Ball();

    const savedState = this.saveManager.getInitialState();
    this.state = {
      status: 'menu',
      score: 0,
      totalScore: savedState.totalScore || 0,
      highScore: savedState.highScore || 0,
      lives: CONFIG.INITIAL_LIVES,
      combo: 0,
      maxCombo: 0,
      frenzyMode: false,
      frenzyTimeLeft: 0,
      ringsPassed: 0,
      gravity: CONFIG.GRAVITY,
      baseGravity: CONFIG.GRAVITY,
      ringSpeed: CONFIG.RING_SPEED,
      selectedSkin: savedState.selectedSkin || 'default',
      unlockedSkins: savedState.unlockedSkins || ['default'],
      starsCollected: savedState.starsCollected || 0,
    };

    this.skinManager.loadState(this.state.selectedSkin, this.state.unlockedSkins);
    this.physicsEngine.setGravity(this.state.gravity);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const handleInput = (e: Event) => {
      e.preventDefault();
      if (this.state.status === 'playing') {
        this.jump();
      }
    };

    this.canvas.addEventListener('click', handleInput);
    this.canvas.addEventListener('touchstart', handleInput);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state.status === 'playing') {
          this.jump();
        }
      }
    });
  }

  private jump(): void {
    this.physicsEngine.jump(this.ball);
    this.audioManager.playJump();
    this.particleSystem.emit(this.ball.x, this.ball.y + this.ball.radius, this.ball.color, 5);
  }

  start(): void {
    this.resetGame();
    this.state.status = 'playing';
    this.notifyStateChange();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private resetGame(): void {
    this.ball.reset();
    this.rings = [];
    this.nextRingY = GAME_CONFIG.CANVAS_HEIGHT + 100;
    this.generateInitialRings();
    this.particleSystem = new ParticleSystem();
    this.audioManager = new AudioManager();

    this.state.score = 0;
    this.state.lives = CONFIG.INITIAL_LIVES;
    this.state.combo = 0;
    this.state.maxCombo = 0;
    this.state.frenzyMode = false;
    this.state.frenzyTimeLeft = 0;
    this.state.ringsPassed = 0;
    this.state.gravity = this.state.baseGravity;
    this.state.ringSpeed = CONFIG.RING_SPEED;
    this.physicsEngine.setGravity(this.state.gravity);
  }

  private generateInitialRings(): void {
    for (let i = 0; i < 5; i++) {
      this.generateRing();
    }
  }

  private generateRing(): void {
    const isDouble = Math.random() < CONFIG.DOUBLE_RING_CHANCE;
    const spacing = isDouble
      ? CONFIG.DOUBLE_RING_SPACING
      : CONFIG.RING_SPACING_MIN + Math.random() * (CONFIG.RING_SPACING_MAX - CONFIG.RING_SPACING_MIN);

    this.nextRingY += spacing;
    const rotationOffset = Math.random() * Math.PI * 2;
    this.rings.push(new Ring(this.nextRingY, isDouble, rotationOffset));

    if (isDouble) {
      this.nextRingY += CONFIG.DOUBLE_RING_SPACING;
      this.rings.push(new Ring(this.nextRingY, false, rotationOffset + Math.PI / 4));
    }
  }

  private gameLoop = (): void => {
    if (this.state.status !== 'playing') return;

    const currentTime = performance.now();
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update();
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    this.ball.update(this.deltaTime);
    this.physicsEngine.updateBall(this.ball);
    this.particleSystem.update();

    if (this.state.frenzyMode) {
      this.state.frenzyTimeLeft -= this.deltaTime;
      if (this.state.frenzyTimeLeft <= 0) {
        this.state.frenzyMode = false;
        this.notifyStateChange();
      }
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      this.physicsEngine.updateRing(ring, this.state.ringSpeed);

      if (ring.star && !ring.star.collected) {
        if (this.collisionDetector.checkStarCollision(this.ball, ring.star)) {
          ring.collectStar();
          this.state.starsCollected++;
          const multiplier = this.state.frenzyMode ? 3 : 1;
          this.state.score += CONFIG.STAR_SCORE * multiplier;
          this.state.totalScore += CONFIG.STAR_SCORE * multiplier;
          this.audioManager.playStarCollect();
          this.particleSystem.emitStarCollect(ring.star.x, ring.star.y);
          this.notifyStateChange();
        }
      }

      if (this.collisionDetector.checkRingPassed(this.ball, ring)) {
        ring.passed = true;
        this.state.ringsPassed++;
        this.state.combo++;
        if (this.state.combo > this.state.maxCombo) {
          this.state.maxCombo = this.state.combo;
        }

        const multiplier = this.state.frenzyMode ? 3 : 1;
        this.state.score += CONFIG.RING_PASS_SCORE * multiplier;
        this.state.totalScore += CONFIG.RING_PASS_SCORE * multiplier;
        this.audioManager.playScore();
        this.particleSystem.emit(this.ball.x, this.ball.y, this.ball.color, 8);

        if (this.state.combo >= CONFIG.FRENZY_THRESHOLD && !this.state.frenzyMode) {
          this.state.frenzyMode = true;
          this.state.frenzyTimeLeft = CONFIG.FRENZY_DURATION;
          this.audioManager.playFrenzy();
        }

        if (this.state.ringsPassed % CONFIG.DIFFICULTY_INCREASE_INTERVAL === 0) {
          this.state.gravity += CONFIG.DIFFICULTY_INCREASE_AMOUNT;
          this.physicsEngine.setGravity(this.state.gravity);
        }

        this.notifyStateChange();
      }

      const collision = this.collisionDetector.checkRingCollision(this.ball, ring);
      if (collision.collided && !ring.passed) {
        if (!collision.colorMatch) {
          this.handleMiss(ring);
        }
      }

      if (this.collisionDetector.isRingOffScreen(ring)) {
        this.rings.splice(i, 1);
      }
    }

    while (this.nextRingY < GAME_CONFIG.CANVAS_HEIGHT + 300) {
      this.generateRing();
    }

    if (this.physicsEngine.checkBottomCollision(this.ball)) {
      this.handleMiss(null);
    }
  }

  private handleMiss(ring: RingType | null): void {
    this.state.lives--;
    this.state.combo = 0;
    this.audioManager.playHit();
    this.particleSystem.emitHit(this.ball.x, this.ball.y);

    if (this.state.lives <= 0) {
      this.gameOver();
    } else {
      if (ring) {
        this.ball.y = ring.y + ring.radius + 50;
        this.ball.vy = 0;
      } else {
        this.ball.y = GAME_CONFIG.BALL_START_Y;
        this.ball.vy = 0;
      }
    }

    this.notifyStateChange();
  }

  private gameOver(): void {
    this.state.status = 'gameover';
    this.audioManager.playGameOver();

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }

    const newlyUnlocked = this.skinManager.checkUnlocks(this.state.totalScore);
    if (newlyUnlocked.length > 0) {
      this.state.unlockedSkins = this.skinManager.getUnlockedSkins();
    }

    this.saveManager.save(this.state);

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.notifyStateChange();
  }

  private render(): void {
    const ctx = this.ctx;
    const width = GAME_CONFIG.CANVAS_WIDTH;
    const height = GAME_CONFIG.CANVAS_HEIGHT;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a1a3a');
    gradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.particleSystem.render(ctx);

    for (const ring of this.rings) {
      ring.render(ctx);
    }

    this.ball.render(ctx, this.skinManager.getSelectedSkinId());

    if (this.state.frenzyMode) {
      this.renderFrenzyEffect(ctx);
    }
  }

  private renderFrenzyEffect(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(Date.now() / 100) * 0.1 + 0.2;
    const gradient = ctx.createRadialGradient(
      GAME_CONFIG.CANVAS_WIDTH / 2,
      GAME_CONFIG.CANVAS_HEIGHT / 2,
      100,
      GAME_CONFIG.CANVAS_WIDTH / 2,
      GAME_CONFIG.CANVAS_HEIGHT / 2,
      GAME_CONFIG.CANVAS_WIDTH
    );
    gradient.addColorStop(0, 'rgba(255, 0, 100, 0)');
    gradient.addColorStop(1, `rgba(255, 0, 100, ${pulse})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.notifyStateChange();
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
      this.lastTime = performance.now();
      this.gameLoop();
      this.notifyStateChange();
    }
  }

  goToMenu(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.state.status = 'menu';
    this.saveManager.save(this.state);
    this.notifyStateChange();
  }

  selectSkin(skinId: string): boolean {
    const success = this.skinManager.setSelectedSkin(skinId);
    if (success) {
      this.state.selectedSkin = skinId;
      this.saveManager.save(this.state);
      this.notifyStateChange();
    }
    return success;
  }

  getSkins() {
    return this.skinManager.getAllSkins().map(skin => ({
      ...skin,
      unlocked: this.skinManager.isUnlocked(skin.id),
      selected: this.skinManager.getSelectedSkinId() === skin.id,
    }));
  }

  getState(): GameState {
    return { ...this.state };
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
