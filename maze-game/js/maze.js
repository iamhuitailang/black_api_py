class MazeGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.startPos = null;
    this.exitPos = null;
  }

  generate() {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = CellType.WALL;
      }
    }

    const startX = 1;
    const startY = 1;
    this.startPos = { x: startX, y: startY };
    this.grid[startY][startX] = CellType.START;

    this._dfs(startX, startY);

    let maxDist = 0;
    let exitX = startX;
    let exitY = startY;
    for (let y = 1; y < this.height - 1; y += 2) {
      for (let x = 1; x < this.width - 1; x += 2) {
        if (this.grid[y][x] === CellType.FLOOR) {
          const dist = Utils.manhattanDistance(startX, startY, x, y);
          if (dist > maxDist) {
            maxDist = dist;
            exitX = x;
            exitY = y;
          }
        }
      }
    }
    this.exitPos = { x: exitX, y: exitY };
    this.grid[exitY][exitX] = CellType.EXIT;

    return this;
  }

  _dfs(x, y) {
    const directions = Utils.shuffle([
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 },
    ]);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const mx = x + dx / 2;
      const my = y + dy / 2;

      if (
        nx > 0 && nx < this.width - 1 &&
        ny > 0 && ny < this.height - 1 &&
        this.grid[ny][nx] === CellType.WALL
      ) {
        this.grid[my][mx] = CellType.FLOOR;
        this.grid[ny][nx] = CellType.FLOOR;
        this._dfs(nx, ny);
      }
    }
  }

  getCell(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return CellType.WALL;
    }
    return this.grid[y][x];
  }

  isWall(x, y) {
    return this.getCell(x, y) === CellType.WALL;
  }

  isWalkable(x, y) {
    return !this.isWall(x, y);
  }

  getRandomFloorPosition(avoidPositions = []) {
    const floors = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x] === CellType.FLOOR) {
          const avoid = avoidPositions.some(p => p.x === x && p.y === y);
          if (!avoid) {
            floors.push({ x, y });
          }
        }
      }
    }
    if (floors.length === 0) return null;
    return floors[Utils.randInt(0, floors.length - 1)];
  }

  generateKeys(count) {
    const keys = [];
    const avoid = [this.startPos, this.exitPos];
    const colors = Utils.shuffle(GameConstants.KEY_COLORS.slice(0, count));

    for (let i = 0; i < count; i++) {
      const pos = this.getRandomFloorPosition([...avoid, ...keys]);
      if (pos) {
        keys.push({ x: pos.x, y: pos.y, color: colors[i], collected: false });
        avoid.push(pos);
      }
    }
    return keys;
  }

  generatePatrolPath(startX, startY, length = 8) {
    const path = [{ x: startX, y: startY }];
    let x = startX;
    let y = startY;

    for (let i = 0; i < length - 1; i++) {
      const dirs = Utils.shuffle([
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ]);

      let moved = false;
      for (const { dx, dy } of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isWalkable(nx, ny)) {
          const exists = path.some(p => p.x === nx && p.y === ny);
          if (!exists || path.length > 4) {
            path.push({ x: nx, y: ny });
            x = nx;
            y = ny;
            moved = true;
            break;
          }
        }
      }
      if (!moved) break;
    }

    return path;
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      grid: this.grid,
      startPos: this.startPos,
      exitPos: this.exitPos,
    };
  }

  static fromJSON(data) {
    const maze = new MazeGenerator(data.width, data.height);
    maze.grid = data.grid;
    maze.startPos = data.startPos;
    maze.exitPos = data.exitPos;
    return maze;
  }
}

if (typeof window !== 'undefined') {
  window.MazeGenerator = MazeGenerator;
}
