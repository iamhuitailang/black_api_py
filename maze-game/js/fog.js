class FogOfWar {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.explored = [];
    this.visible = [];
    this.viewRadius = GameConstants.VIEW_RADIUS;

    for (let y = 0; y < height; y++) {
      this.explored[y] = [];
      this.visible[y] = [];
      for (let x = 0; x < width; x++) {
        this.explored[y][x] = false;
        this.visible[y][x] = false;
      }
    }
  }

  update(centerX, centerY, maze) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.visible[y][x] = false;
      }
    }

    this._castRays(centerX + 0.5, centerY + 0.5, maze);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.visible[y][x]) {
          this.explored[y][x] = true;
        }
      }
    }
  }

  _castRays(centerX, centerY, maze) {
    const numRays = 360;
    const radius = this.viewRadius + 0.5;

    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      this._castSingleRay(centerX, centerY, dx, dy, radius, maze);
    }

    const cx = Math.floor(centerX);
    const cy = Math.floor(centerY);
    if (Utils.isInBounds(cx, cy, this.width, this.height)) {
      this.visible[cy][cx] = true;
    }
  }

  _castSingleRay(startX, startY, dx, dy, radius, maze) {
    const maxDist = radius;
    const stepSize = 0.1;

    for (let t = 0; t < maxDist; t += stepSize) {
      const x = startX + dx * t;
      const y = startY + dy * t;

      const gx = Math.floor(x);
      const gy = Math.floor(y);

      if (!Utils.isInBounds(gx, gy, this.width, this.height)) {
        break;
      }

      this.visible[gy][gx] = true;

      if (maze.isWall(gx, gy)) {
        break;
      }
    }
  }

  isVisible(x, y) {
    if (!Utils.isInBounds(x, y, this.width, this.height)) {
      return false;
    }
    return this.visible[y][x];
  }

  isExplored(x, y) {
    if (!Utils.isInBounds(x, y, this.width, this.height)) {
      return false;
    }
    return this.explored[y][x];
  }

  getVisibilityAlpha(x, y) {
    if (this.isVisible(x, y)) {
      return 1;
    } else if (this.isExplored(x, y)) {
      return 0.5;
    }
    return 0;
  }

  reset() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.explored[y][x] = false;
        this.visible[y][x] = false;
      }
    }
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      explored: this.explored.map(row => [...row]),
      viewRadius: this.viewRadius,
    };
  }

  static fromJSON(data) {
    const fog = new FogOfWar(data.width, data.height);
    fog.viewRadius = data.viewRadius;
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        fog.explored[y][x] = data.explored[y][x];
      }
    }
    return fog;
  }
}

if (typeof window !== 'undefined') {
  window.FogOfWar = FogOfWar;
}
