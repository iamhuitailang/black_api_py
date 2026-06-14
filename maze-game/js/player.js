class Player {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.targetX = startX;
    this.targetY = startY;
    this.renderX = startX;
    this.renderY = startY;
    this.lives = GameConstants.PLAYER_LIVES;
    this.collectedKeys = [];
    this.direction = Direction.RIGHT;
    this.isMoving = false;
    this.moveStartTime = 0;
    this.startX = startX;
    this.startY = startY;
  }

  setStartPosition(x, y) {
    this.startX = x;
    this.startY = y;
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
    this.moveStartTime = performance.now();

    const dx = x - this.x;
    const dy = y - this.y;
    if (dx > 0) this.direction = Direction.RIGHT;
    else if (dx < 0) this.direction = Direction.LEFT;
    else if (dy > 0) this.direction = Direction.DOWN;
    else if (dy < 0) this.direction = Direction.UP;
  }

  update(currentTime) {
    if (this.isMoving) {
      const elapsed = currentTime - this.moveStartTime;
      const progress = Math.min(elapsed / GameConstants.MOVE_ANIMATION_MS, 1);
      const eased = this._easeOutQuad(progress);

      this.renderX = Utils.lerp(this.x, this.targetX, eased);
      this.renderY = Utils.lerp(this.y, this.targetY, eased);

      if (progress >= 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.renderX = this.x;
        this.renderY = this.y;
        this.isMoving = false;
        return true;
      }
    }
    return false;
  }

  _easeOutQuad(t) {
    return t * (2 - t);
  }

  collectKey(color) {
    if (!this.collectedKeys.includes(color)) {
      this.collectedKeys.push(color);
      return true;
    }
    return false;
  }

  hasAllKeys() {
    return this.collectedKeys.length >= GameConstants.KEYS_PER_FLOOR;
  }

  loseLife() {
    this.lives--;
    return this.lives > 0;
  }

  resetPosition() {
    this.x = this.startX;
    this.y = this.startY;
    this.targetX = this.startX;
    this.targetY = this.startY;
    this.renderX = this.startX;
    this.renderY = this.startY;
    this.isMoving = false;
  }

  resetFloor() {
    this.collectedKeys = [];
    this.resetPosition();
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      lives: this.lives,
      collectedKeys: [...this.collectedKeys],
      startX: this.startX,
      startY: this.startY,
    };
  }

  static fromJSON(data) {
    const player = new Player(data.x, data.y);
    player.lives = data.lives;
    player.collectedKeys = [...data.collectedKeys];
    player.startX = data.startX;
    player.startY = data.startY;
    player.targetX = data.x;
    player.targetY = data.y;
    player.renderX = data.x;
    player.renderY = data.y;
    return player;
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
}
