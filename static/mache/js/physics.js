var Physics = (function() {

  function checkCollision(boundsA, boundsB) {
    return boundsA.x < boundsB.x + boundsB.width &&
           boundsA.x + boundsA.width > boundsB.x &&
           boundsA.y < boundsB.y + boundsB.height &&
           boundsA.y + boundsA.height > boundsB.y;
  }

  function checkCarriageObstacleCollision(carriage, obstacle) {
    var carriageBounds = carriage.getBounds();
    var obstacleBounds = obstacle.getBounds();

    if (obstacle.typeId === 'pit') {
      if (!carriage.isOnGround) return false;
    }

    if (obstacle.typeId === 'rock' && !carriage.isOnGround) {
      var rockTop = obstacleBounds.y;
      if (carriageBounds.y + carriageBounds.height < rockTop - 5) {
        return false;
      }
    }

    return checkCollision(carriageBounds, obstacleBounds);
  }

  function checkCarriageItemCollision(carriage, item) {
    var carriageBounds = carriage.getBounds();
    var itemBounds = item.getBounds();
    return checkCollision(carriageBounds, itemBounds);
  }

  function clampToLanes(x) {
    var halfWidth = 40;
    var leftBound = CONFIG.LANE.POSITIONS[0] - CONFIG.LANE.WIDTH / 2 + halfWidth;
    var rightBound = CONFIG.LANE.POSITIONS[2] + CONFIG.LANE.WIDTH / 2 - halfWidth;

    if (x < leftBound) x = leftBound;
    if (x > rightBound) x = rightBound;
    return x;
  }

  function getLaneFromX(x) {
    var positions = CONFIG.LANE.POSITIONS;
    var minDist = Infinity;
    var nearestLane = 1;

    for (var i = 0; i < positions.length; i++) {
      var dist = Math.abs(x - positions[i]);
      if (dist < minDist) {
        minDist = dist;
        nearestLane = i;
      }
    }
    return nearestLane;
  }

  function getNearestLaneX(x) {
    var lane = getLaneFromX(x);
    return CONFIG.LANE.POSITIONS[lane];
  }

  return {
    checkCollision: checkCollision,
    checkCarriageObstacleCollision: checkCarriageObstacleCollision,
    checkCarriageItemCollision: checkCarriageItemCollision,
    clampToLanes: clampToLanes,
    getLaneFromX: getLaneFromX,
    getNearestLaneX: getNearestLaneX
  };
})();
