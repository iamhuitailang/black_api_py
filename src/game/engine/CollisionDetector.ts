import type { Ball, Ring, Star } from '../types';
import { GAME_CONFIG } from '../config';

export class CollisionDetector {
  checkRingCollision(ball: Ball, ring: Ring): { collided: boolean; colorMatch: boolean } {
    const ringCenterX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const ringCenterY = ring.y;

    const dx = ball.x - ringCenterX;
    const dy = ball.y - ringCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const innerRadius = ring.radius - ring.thickness / 2;
    const outerRadius = ring.radius + ring.thickness / 2;

    const isInRingArea = distance >= innerRadius - ball.radius && distance <= outerRadius + ball.radius;

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
        const colorMatch = segment.color === ball.color;
        return { collided: true, colorMatch };
      }
    }

    return { collided: false, colorMatch: false };
  }

  checkStarCollision(ball: Ball, star: Star): boolean {
    if (star.collected) return false;

    const dx = ball.x - star.x;
    const dy = ball.y - star.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < ball.radius + 15;
  }

  checkRingPassed(ball: Ball, ring: Ring): boolean {
    return !ring.passed && ball.y < ring.y - ring.radius;
  }

  isRingOffScreen(ring: Ring): boolean {
    return ring.y + ring.radius < -100;
  }
}
