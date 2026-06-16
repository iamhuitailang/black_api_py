import type { GameState, Ring as RingType, GameStatus } from './types';
import { GAME_CONFIG, GAME_CONFIG as CONFIG, COLORS } from './config';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { CollisionDetector } from './engine/CollisionDetector';
import { ParticleSystem } from './engine/ParticleSystem';
import { Ball } from './entities/Ball';
import { Ring } from './entities/Ring';
import { SkinManager } from './entities/SkinManager';
import { AudioManager } from './audio/AudioManager';
import { SaveManager } from './storage/SaveManager';

interface GameSnapshot {
  ballY: number;
  ballVy: number;
  ballColorIndex: number;
  rings: Array<{
    y: number;
    rotation: number;
    rotationSpeed: number;
    passed: boolean;
    isDouble: boolean;
    segments: Array<{ color: string; startAngle: number; endAngle: number }>;
    starCollected?: boolean;
    starX?: number;
    starY?: number;
  }>;
  nextRingY: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private saveTimer: number = 0;

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
    this.nextRingY = -200;
    this.generateInitialRings();
    this.particleSystem = new ParticleSystem();
    this.audioManager = new AudioManager();
    this.saveTimer = 0;

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
    for (let i = 0; i < 6; i++) {
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

    this.saveTimer += this.deltaTime;
    if (this.saveTimer >= 2000) {
      this.saveTimer = 0;
      this.saveGameSnapshot();
    }

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
      ring.y += this.state.ringSpeed;
      ring.rotation += ring.rotationSpeed;

      if (ring.star && !ring.star.collected) {
        ring.star.y = ring.y + Math.sin(Math.atan2(ring.star.y - ring.y, ring.star.x - GAME_CONFIG.CANVAS_WIDTH / 2)) * ring.radius;
        ring.star.x = GAME_CONFIG.CANVAS_WIDTH / 2 + Math.cos(Math.atan2(ring.star.y - ring.y, ring.star.x - GAME_CONFIG.CANVAS_WIDTH / 2)) * ring.radius;
        ring.star.rotation += 0.05;

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

      if (!ring.passed && this.ball.y < ring.y - ring.radius && this.ball.y > ring.y - ring.radius - 50) {
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

      const collision = this.checkRingCollision(ring);
      if (collision.collided && !ring.passed) {
        if (!collision.colorMatch) {
          this.handleMiss(ring);
        }
      }

      if (ring.y - ring.radius > GAME_CONFIG.CANVAS_HEIGHT + 100) {
        this.rings.splice(i, 1);
      }
    }

    while (this.nextRingY < GAME_CONFIG.CANVAS_HEIGHT + 200) {
      this.generateRing();
    }

    if (this.ball.y + this.ball.radius >= GAME_CONFIG.CANVAS_HEIGHT) {
      this.handleMiss(null);
    }

    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy = 0;
    }
  }

  private checkRingCollision(ring: RingType): { collided: boolean; colorMatch: boolean } {
    const ringCenterX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const ringCenterY = ring.y;

    const dx = this.ball.x - ringCenterX;
    const dy = this.ball.y - ringCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const innerRadius = ring.radius - ring.thickness / 2;
    const outerRadius = ring.radius + ring.thickness / 2;

    const isInRingArea = distance >= innerRadius - this.ball.radius && distance <= outerRadius + this.ball.radius;

    if (!isInRingArea) {
      return { collided: false, colorMatch: false };
    }

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI * 2;

    angle = (angle + ring.rotation) % (Math.PI * 2);
    if (angle < 0) angle += Math.PI * 2;

    for (const segment of ring.segments) {
      const adjustedStart = segment.startAngle % (Math.PI * 2);
      const adjustedEnd = segment.endAngle % (Math.PI * 2);

      let isInSegment = false;
      if (adjustedStart < adjustedEnd) {
        isInSegment = angle >= adjustedStart && angle <= adjustedEnd;
      } else {
        isInSegment = angle >= adjustedStart || angle <= adjustedEnd;
      }

      if (isInSegment) {
        const colorMatch = segment.color === this.ball.color;
        return { collided: true, colorMatch };
      }
    }

    return { collided: false, colorMatch: false };
  }

  private handleMiss(ring: RingType | null): void {
    this.state.lives--;
    this.state.combo = 0;
    this.audioManager.playHit();
    this.particleSystem.emitHit(this.ball.x, this.ball.y);

    if (this.state.lives <= 0) {
      this.gameOver();
    } else {
      this.ball.y = ring ? ring.y + ring.radius + 50 : GAME_CONFIG.BALL_START_Y;
      this.ball.vy = 0;
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
    this.clearGameSnapshot();

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

  private saveGameSnapshot(): void {
    const snapshot: GameSnapshot = {
      ballY: this.ball.y,
      ballVy: this.ball.vy,
      ballColorIndex: this.ball.colorIndex,
      rings: this.rings.map(ring => ({
        y: ring.y,
        rotation: ring.rotation,
        rotationSpeed: ring.rotationSpeed,
        passed: ring.passed,
        isDouble: ring.isDouble,
        segments: ring.segments.map(s => ({ ...s })),
        starCollected: ring.star?.collected,
        starX: ring.star?.x,
        starY: ring.star?.y,
      })),
      nextRingY: this.nextRingY,
    };
    localStorage.setItem('color-switch-snapshot', JSON.stringify({
      state: this.state,
      snapshot,
      timestamp: Date.now(),
    }));
  }

  private clearGameSnapshot(): void {
    localStorage.removeItem('color-switch-snapshot');
  }

  loadGameSnapshot(): boolean {
    const data = localStorage.getItem('color-switch-snapshot');
    if (!data) return false;

    try {
      const { state, snapshot, timestamp } = JSON.parse(data);
      
      if (Date.now() - timestamp > 3600000) {
        this.clearGameSnapshot();
        return false;
      }

      this.state = { ...state, status: 'playing' };
      this.skinManager.loadState(this.state.selectedSkin, this.state.unlockedSkins);
      this.physicsEngine.setGravity(this.state.gravity);

      this.ball.y = snapshot.ballY;
      this.ball.vy = snapshot.ballVy;
      this.ball.colorIndex = snapshot.ballColorIndex;
      this.ball.color = COLORS[snapshot.ballColorIndex];

      this.rings = snapshot.rings.map((r: any) => {
        const ring = new Ring(r.y, r.isDouble, 0);
        ring.rotation = r.rotation;
        ring.rotationSpeed = r.rotationSpeed;
        ring.passed = r.passed;
        ring.segments = r.segments;
        if (r.starX !== undefined && r.starY !== undefined) {
          ring.star = {
            x: r.starX,
            y: r.starY,
            collected: r.starCollected || false,
            rotation: 0,
            particles: [],
            render: function() {},
          };
        } else {
          ring.star = undefined;
        }
        return ring;
      });

      this.nextRingY = snapshot.nextRingY;
      this.ball.trail = [];

      this.state.status = 'playing';
      this.notifyStateChange();
      this.lastTime = performance.now();
      this.gameLoop();

      return true;
    } catch (e) {
      console.error('Failed to load snapshot:', e);
      this.clearGameSnapshot();
      return false;
    }
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
      this.saveGameSnapshot();
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
    this.clearGameSnapshot();
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
