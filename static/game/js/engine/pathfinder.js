class Pathfinder {
  constructor(grid, width, height) {
    this.grid = grid;
    this.width = width;
    this.height = height;
    this.pathCache = new Map();
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.grid[y][x] === 1;
  }

  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  findPath(start, end) {
    var key = start.x + ',' + start.y + '-' + end.x + ',' + end.y;
    if (this.pathCache.has(key)) return this.pathCache.get(key);

    var openSet = [];
    var closedSet = new Set();
    var cameFrom = new Map();

    var startNode = { x: start.x, y: start.y, g: 0, h: this.heuristic(start, end), f: 0 };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    var dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

    while (openSet.length > 0) {
      openSet.sort(function (a, b) { return a.f - b.f; });
      var current = openSet.shift();

      if (current.x === end.x && current.y === end.y) {
        var path = [];
        var node = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          var nodeKey = node.x + ',' + node.y;
          node = cameFrom.get(nodeKey) || null;
        }
        this.pathCache.set(key, path);
        return path;
      }

      var currentKey = current.x + ',' + current.y;
      closedSet.add(currentKey);

      for (var i = 0; i < dirs.length; i++) {
        var nx = current.x + dirs[i].x;
        var ny = current.y + dirs[i].y;

        if (!this.isWalkable(nx, ny)) continue;

        var nKey = nx + ',' + ny;
        if (closedSet.has(nKey)) continue;

        var g = current.g + 1;
        var existing = null;
        for (var j = 0; j < openSet.length; j++) {
          if (openSet[j].x === nx && openSet[j].y === ny) {
            existing = openSet[j];
            break;
          }
        }

        if (!existing) {
          var h = this.heuristic({ x: nx, y: ny }, end);
          var node = { x: nx, y: ny, g: g, h: h, f: g + h };
          cameFrom.set(nKey, current);
          openSet.push(node);
        } else if (g < existing.g) {
          existing.g = g;
          existing.f = g + existing.h;
          cameFrom.set(nKey, current);
        }
      }
    }

    return null;
  }

  precomputePaths(entries, exit) {
    this.pathCache.clear();
    var paths = [];
    for (var i = 0; i < entries.length; i++) {
      var path = this.findPath(entries[i], exit);
      paths.push(path || []);
    }
    return paths;
  }

  getCachedPath(entryIndex) {
    var keys = Array.from(this.pathCache.keys());
    var count = 0;
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('0,0-') === 0 || keys[i].indexOf(entries)) count++;
    }
    return this.pathCache.get(keys[entryIndex]) || null;
  }
}
