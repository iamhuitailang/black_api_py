import type { Ball, Ring } from '../types';
import { GAME_CONFIG } from '../config';

export class PhysicsEngine {
  private gravity: number;

  constructor(initialGravity: number = GAME_CONFIG.GRAVITY) {
    this.gravity = initialGravity;
  }

  setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  getGravity(): number {
    return this.gravity;
  }

  updateBall(ball: Ball): void {
    ball.vy += this.gravity;
    ball.y += ball.vy;

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = 0;
    }

    if (ball.y + ball.radius > GAME_CONFIG.CANVAS_HEIGHT) {
      ball.y = GAME_CONFIG.CANVAS_HEIGHT - ball.radius;
      ball.vy = 0;
    }
  }

  jump(ball: Ball): void {
    ball.vy = GAME_CONFIG.JUMP_FORCE;
  }

  updateRing(ring: Ring, speed: number): void {
    ring.y -= speed;
    ring.rotation += ring.rotationSpeed;
  }

  checkBottomCollision(ball: Ball): boolean {
    return ball.y + ball.radius >= GAME_CONFIG.CANVAS_HEIGHT;
  }
}
