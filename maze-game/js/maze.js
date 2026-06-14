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

    this._addLoops(10);

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

    this._mainPath = this._findShortestPath(startX, startY, exitX, exitY);

    return this;
  }

  _addLoops(count) {
    const candidates = [];
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.grid[y][x] === CellType.WALL) {
          const horizontal =
            this.isWalkable(x - 1, y) && this.isWalkable(x + 1, y);
          const vertical =
            this.isWalkable(x, y - 1) && this.isWalkable(x, y + 1);
          if (horizontal || vertical) {
            candidates.push({ x, y });
          }
        }
      }
    }

    const shuffled = Utils.shuffle(candidates);
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const { x, y } = shuffled[i];
      this.grid[y][x] = CellType.FLOOR;
    }
  }

  _findShortestPath(sx, sy, tx, ty) {
    if (sx === tx && sy === ty) return [{ x: sx, y: sy }];

    const visited = new Set();
    const queue = [{ x: sx, y: sy, path: [{ x: sx, y: sy }] }];
    visited.add(`${sx},${sy}`);

    while (queue.length > 0) {
      const cur = queue.shift();

      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const { dx, dy } of dirs) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        const key = `${nx},${ny}`;

        if (!this.isWalkable(nx, ny) || visited.has(key)) continue;

        const newPath = [...cur.path, { x: nx, y: ny }];
        if (nx === tx && ny === ty) {
          return newPath;
        }

        visited.add(key);
        queue.push({ x: nx, y: ny, path: newPath });
      }
    }

    return [];
  }

  isOnMainPath(x, y) {
    if (!this._mainPath) return false;
    return this._mainPath.some(p => p.x === x && p.y === y);
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

  getRandomFloorPosition(avoidPositions = [], minDistanceFromStart = 3, minDistanceFromExit = 3) {
    const floors = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x] === CellType.FLOOR) {
          const avoid = avoidPositions.some(p => p.x === x && p.y === y);
          if (avoid) continue;

          if (this.startPos) {
            const distStart = Utils.chebyshevDistance(x, y, this.startPos.x, this.startPos.y);
            if (distStart < minDistanceFromStart) continue;
          }
          if (this.exitPos) {
            const distExit = Utils.chebyshevDistance(x, y, this.exitPos.x, this.exitPos.y);
            if (distExit < minDistanceFromExit) continue;
          }

          floors.push({ x, y });
        }
      }
    }
    if (floors.length === 0) {
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
    }
    if (floors.length === 0) return null;
    return floors[Utils.randInt(0, floors.length - 1)];
  }

  getGuardPosition(avoidPositions = []) {
    const candidates = [];
    const fallback = [];

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x] !== CellType.FLOOR) continue;
        const avoid = avoidPositions.some(p => p.x === x && p.y === y);
        if (avoid) continue;

        if (this.startPos) {
          const distStart = Utils.chebyshevDistance(x, y, this.startPos.x, this.startPos.y);
          if (distStart < 4) continue;
        }
        if (this.exitPos) {
          const distExit = Utils.chebyshevDistance(x, y, this.exitPos.x, this.exitPos.y);
          if (distExit < 4) continue;
        }

        const neighbors = [
          { x: x - 1, y }, { x: x + 1, y },
          { x, y: y - 1 }, { x, y: y + 1 },
        ];
        const walkableNeighbors = neighbors.filter(n => this.isWalkable(n.x, n.y)).length;
        if (walkableNeighbors < 2) continue;

        if (!this.isOnMainPath(x, y)) {
          candidates.push({ x, y });
        } else {
          fallback.push({ x, y });
        }
      }
    }

    const pool = candidates.length > 0 ? candidates : fallback;
    if (pool.length === 0) return this.getRandomFloorPosition(avoidPositions);
    return pool[Utils.randInt(0, pool.length - 1)];
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
      _mainPath: this._mainPath,
    };
  }

  static fromJSON(data) {
    const maze = new MazeGenerator(data.width, data.height);
    maze.grid = data.grid;
    maze.startPos = data.startPos;
    maze.exitPos = data.exitPos;
    maze._mainPath = data._mainPath || null;
    if (!maze._mainPath && maze.startPos && maze.exitPos) {
      maze._mainPath = maze._findShortestPath(
        maze.startPos.x, maze.startPos.y,
        maze.exitPos.x, maze.exitPos.y
      );
    }
    return maze;
  }
}

if (typeof window !== 'undefined') {
  window.MazeGenerator = MazeGenerator;
}
