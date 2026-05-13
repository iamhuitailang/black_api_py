import { BALL_RADIUS, GRAVITY, FRICTION, BOUNCE } from './constants.js';

export class Physics {
    constructor() {
        this.ball = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: BALL_RADIUS,
        };
        this.tilt = { x: 0, y: 0 };
        this.walls = [];
        this.traps = [];
        this.stars = [];
        this.endPos = { x: 0, y: 0 };
        this.collectedStars = [];
    }

    initLevel(levelData) {
        this.ball.x = levelData.startPos.x;
        this.ball.y = levelData.startPos.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.walls = levelData.walls;
        this.traps = levelData.traps;
        this.stars = [...levelData.stars];
        this.endPos = levelData.endPos;
        this.collectedStars = [];
        this.tilt = { x: 0, y: 0 };
    }

    setTilt(tiltX, tiltY) {
        this.tilt.x = tiltX;
        this.tilt.y = tiltY;
    }

    update() {
        this.ball.vx += this.tilt.x * GRAVITY;
        this.ball.vy += this.tilt.y * GRAVITY;

        this.ball.vx *= FRICTION;
        this.ball.vy *= FRICTION;

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        this.handleWallCollisions();
        this.checkStarCollection();
        return this.checkGameEvents();
    }

    handleWallCollisions() {
        for (const wall of this.walls) {
            const closestX = Math.max(wall.x, Math.min(this.ball.x, wall.x + wall.w));
            const closestY = Math.max(wall.y, Math.min(this.ball.y, wall.y + wall.h));
            
            const distX = this.ball.x - closestX;
            const distY = this.ball.y - closestY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < this.ball.radius) {
                const overlap = this.ball.radius - distance;
                const normX = distance > 0 ? distX / distance : 0;
                const normY = distance > 0 ? distY / distance : 1;

                this.ball.x += normX * overlap;
                this.ball.y += normY * overlap;

                const dotProduct = this.ball.vx * normX + this.ball.vy * normY;
                this.ball.vx -= 2 * dotProduct * normX * BOUNCE;
                this.ball.vy -= 2 * dotProduct * normY * BOUNCE;
            }
        }
    }

    checkStarCollection() {
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            const dist = Math.sqrt(
                Math.pow(this.ball.x - star.x, 2) + 
                Math.pow(this.ball.y - star.y, 2)
            );
            if (dist < this.ball.radius + 15) {
                this.collectedStars.push(star);
                this.stars.splice(i, 1);
            }
        }
    }

    checkGameEvents() {
        for (const trap of this.traps) {
            if (this.ball.x > trap.x && this.ball.x < trap.x + trap.w &&
                this.ball.y > trap.y && this.ball.y < trap.y + trap.h) {
                return { type: 'trap' };
            }
        }

        const endDist = Math.sqrt(
            Math.pow(this.ball.x - this.endPos.x, 2) + 
            Math.pow(this.ball.y - this.endPos.y, 2)
        );
        if (endDist < this.ball.radius + 25) {
            return { type: 'win', stars: this.collectedStars.length };
        }

        return { type: 'continue', stars: this.collectedStars.length };
    }

    getBallState() {
        return { ...this.ball };
    }

    getCollectedStars() {
        return [...this.collectedStars];
    }

    getRemainingStars() {
        return [...this.stars];
    }

    getState() {
        return {
            ball: { ...this.ball },
            tilt: { ...this.tilt },
            collectedStars: [...this.collectedStars],
            remainingStars: [...this.stars],
        };
    }

    restoreState(state) {
        this.ball = { ...state.ball };
        this.tilt = { ...state.tilt };
        this.collectedStars = [...state.collectedStars];
        this.stars = [...state.remainingStars];
    }
}
