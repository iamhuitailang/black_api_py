var CELL_SIZE = 40;

class LevelMap {
  constructor(levelData) {
    this.id = levelData.id;
    this.name = levelData.name;
    this.width = levelData.width;
    this.height = levelData.height;
    this.grid = levelData.grid;
    this.entryPoints = levelData.entryPoints;
    this.exitPoint = levelData.exitPoint;
    this.deployNodes = levelData.deployNodes;
    this.waves = levelData.waves;
    this.startingSamples = levelData.startingSamples || 350;
    this.startingLives = levelData.startingLives || 30;
    this.pathfinder = new Pathfinder(this.grid, this.width, this.height);
    this.paths = this.pathfinder.precomputePaths(this.entryPoints, this.exitPoint);
  }

  getCell(gx, gy) {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return 2;
    return this.grid[gy][gx];
  }

  gridToPixel(gx, gy) {
    return {
      x: gx * CELL_SIZE + CELL_SIZE / 2,
      y: gy * CELL_SIZE + CELL_SIZE / 2
    };
  }

  pixelToGrid(px, py) {
    return {
      x: Math.floor(px / CELL_SIZE),
      y: Math.floor(py / CELL_SIZE)
    };
  }

  isWalkable(gx, gy) {
    return this.getCell(gx, gy) === 1;
  }

  isDeployNode(gx, gy) {
    for (var i = 0; i < this.deployNodes.length; i++) {
      if (this.deployNodes[i].x === gx && this.deployNodes[i].y === gy) {
        return this.deployNodes[i];
      }
    }
    return null;
  }

  getPathForEntry(entryIndex) {
    if (entryIndex >= 0 && entryIndex < this.paths.length) {
      return this.paths[entryIndex];
    }
    return [];
  }

  getCanvasWidth() {
    return this.width * CELL_SIZE;
  }

  getCanvasHeight() {
    return this.height * CELL_SIZE;
  }
}
