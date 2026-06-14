class Guard {
  constructor(startX, startY, path) {
    this.x = startX;
    this.y = startY;
    this.renderX = startX;
    this.renderY = startY;
    this.path = path || [{ x: startX, y: startY }];
    this.pathIndex = 0;
    this.pathDirection = 1;
    this.direction = Direction.RIGHT;
    this.state = 'patrol';
    this.chaseTarget = null;
    this.chaseStartTime = 0;
    this.lastMoveTime = 0;
    this.moveProgress = 0;
    this.prevX = startX;
    this.prevY = startY;
    this._initDirection();
  }

  _initDirection() {
    if (this.path.length > 1) {
      const next = this.path[1];
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      this.direction = this._getDirection(dx, dy);
    }
  }

  _getDirection(dx, dy) {
    if (dx > 0) return Direction.RIGHT;
    if (dx < 0) return Direction.LEFT;
    if (dy > 0) return Direction.DOWN;
    if (dy < 0) return Direction.UP;
    return this.direction;
  }

  update(currentTime, maze, playerX, playerY) {
    if (this.state === 'chase') {
      this._updateChase(currentTime, maze, playerX, playerY);
    } else {
      this._updatePatrol(currentTime, maze);
    }

    const speed = this.state === 'chase'
      ? GameConstants.GUARD_CHASE_SPEED
      : GameConstants.GUARD_PATROL_SPEED;

    const timeSinceLastMove = currentTime - this.lastMoveTime;
    this.moveProgress = Math.min(timeSinceLastMove / speed, 1);

    this.renderX = Utils.lerp(this.prevX, this.x, this.moveProgress);
    this.renderY = Utils.lerp(this.prevY, this.y, this.moveProgress);
  }

  _updatePatrol(currentTime, maze) {
    const speed = GameConstants.GUARD_PATROL_SPEED;

    if (currentTime - this.lastMoveTime >= speed) {
      if (this.path.length > 1) {
        let nextIndex = this.pathIndex + this.pathDirection;

        if (nextIndex >= this.path.length) {
          this.pathDirection = -1;
          nextIndex = this.pathIndex - 1;
        } else if (nextIndex < 0) {
          this.pathDirection = 1;
          nextIndex = this.pathIndex + 1;
        }

        if (nextIndex >= 0 && nextIndex < this.path.length) {
          this.pathIndex = nextIndex;
          const next = this.path[this.pathIndex];
          this._moveTo(next.x, next.y, currentTime);
        }
      }
    }
  }

  _updateChase(currentTime, maze, playerX, playerY) {
    const speed = GameConstants.GUARD_CHASE_SPEED;

    if (currentTime - this.chaseStartTime >= GameConstants.GUARD_CHASE_DURATION) {
      this.state = 'patrol';
      this.chaseTarget = null;
      return;
    }

    if (currentTime - this.lastMoveTime >= speed) {
      const nextPos = this._findNextStep(maze, playerX, playerY);
      if (nextPos) {
        this._moveTo(nextPos.x, nextPos.y, currentTime);
      }
    }
  }

  _findNextStep(maze, targetX, targetY) {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    let best = null;
    let bestDist = Infinity;

    for (const { dx, dy } of directions) {
      const nx = this.x + dx;
      const ny = this.y + dy;

      if (maze.isWalkable(nx, ny)) {
        const dist = Utils.manhattanDistance(nx, ny, targetX, targetY);
        if (dist < bestDist) {
          bestDist = dist;
          best = { x: nx, y: ny };
        }
      }
    }

    return best;
  }

  _moveTo(x, y, currentTime) {
    const dx = x - this.x;
    const dy = y - this.y;

    this.direction = this._getDirection(dx, dy);

    this.prevX = this.x;
    this.prevY = this.y;
    this.x = x;
    this.y = y;
    this.lastMoveTime = currentTime;
    this.moveProgress = 0;
  }

  startChase(playerX, playerY, currentTime) {
    this.state = 'chase';
    this.chaseTarget = { x: playerX, y: playerY };
    this.chaseStartTime = currentTime;
  }

  canSeePlayer(playerX, playerY, maze) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Utils.euclideanDistance(this.x, this.y, playerX, playerY);

    if (distance > GameConstants.GUARD_VIEW_DISTANCE + 0.5) {
      return false;
    }

    const angleToPlayer = Math.atan2(dy, dx);
    const angleDiff = Utils.angleDifference(angleToPlayer, this.direction.angle);

    if (angleDiff > GameConstants.GUARD_VIEW_ANGLE / 2) {
      return false;
    }

    return this._hasLineOfSight(playerX, playerY, maze);
  }

  _hasLineOfSight(targetX, targetY, maze) {
    const steps = Math.ceil(Utils.euclideanDistance(this.x, this.y, targetX, targetY) * 4);
    if (steps === 0) return true;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = Utils.lerp(this.x, targetX, t);
      const y = Utils.lerp(this.y, targetY, t);
      const gx = Math.floor(x);
      const gy = Math.floor(y);

      if (maze.isWall(gx, gy)) {
        return false;
      }
    }
    return true;
  }

  isAtPlayer(playerX, playerY) {
    return Math.abs(this.x - playerX) < 0.8 && Math.abs(this.y - playerY) < 0.8;
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      path: this.path,
      pathIndex: this.pathIndex,
      pathDirection: this.pathDirection,
      directionAngle: this.direction.angle,
      state: this.state,
      chaseStartTime: this.chaseStartTime,
    };
  }

  static fromJSON(data) {
    const guard = new Guard(data.x, data.y, data.path);
    guard.pathIndex = data.pathIndex || 0;
    guard.pathDirection = data.pathDirection || 1;
    guard.state = data.state || 'patrol';
    guard.prevX = data.x;
    guard.prevY = data.y;
    guard.renderX = data.x;
    guard.renderY = data.y;
    guard.chaseStartTime = data.chaseStartTime || 0;

    if (data.directionAngle !== undefined) {
      if (Math.abs(data.directionAngle - Direction.RIGHT.angle) < 0.1) {
        guard.direction = Direction.RIGHT;
      } else if (Math.abs(data.directionAngle - Direction.LEFT.angle) < 0.1) {
        guard.direction = Direction.LEFT;
      } else if (Math.abs(data.directionAngle - Direction.UP.angle) < 0.1) {
        guard.direction = Direction.UP;
      } else if (Math.abs(data.directionAngle - Direction.DOWN.angle) < 0.1) {
        guard.direction = Direction.DOWN;
      }
    }

    return guard;
  }
}

if (typeof window !== 'undefined') {
  window.Guard = Guard;
}
