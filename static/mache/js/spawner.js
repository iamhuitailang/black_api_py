var Spawner = (function() {

  var obstacleTimer = 0;
  var itemTimer = 0;
  var coinTimer = 0;

  function reset() {
    obstacleTimer = 500;
    itemTimer = 1000;
    coinTimer = 300;
  }

  function update(deltaTime, game, gameSpeed) {
    var speedFactor = gameSpeed / CONFIG.GAME_SPEED.INITIAL;

    obstacleTimer += deltaTime;
    itemTimer += deltaTime;
    coinTimer += deltaTime;

    var obstacleInterval = Math.max(
      CONFIG.SPAWN.MIN_OBSTACLE_INTERVAL,
      CONFIG.SPAWN.INITIAL_OBSTACLE_INTERVAL / speedFactor
    );
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle(game);
    }

    var itemInterval = Math.max(
      CONFIG.SPAWN.MIN_ITEM_INTERVAL,
      CONFIG.SPAWN.INITIAL_ITEM_INTERVAL / speedFactor
    );
    if (itemTimer >= itemInterval) {
      itemTimer = 0;
      spawnItem(game);
    }

    var coinInterval = Math.max(
      CONFIG.SPAWN.MIN_COIN_INTERVAL,
      CONFIG.SPAWN.INITIAL_COIN_INTERVAL / speedFactor
    );
    if (coinTimer >= coinInterval) {
      coinTimer = 0;
      spawnCoinRow(game);
    }
  }

  function spawnObstacle(game) {
    var types = ['rock', 'pit', 'post', 'beast'];
    var weights = [35, 20, 25, 20];

    if (game.distance > 2000) {
      weights = [25, 25, 25, 25];
    }

    var typeId = weightedRandom(types, weights);
    var type = CONFIG.OBSTACLE_TYPES[typeId];
    var lane = Math.floor(Math.random() * 3);
    var laneX = CONFIG.LANE.POSITIONS[lane];

    var x = CONFIG.CANVAS.WIDTH + type.width;
    var y;

    if (typeId === 'pit') {
      y = CONFIG.GROUND.Y - type.height + 30;
    } else if (typeId === 'post') {
      y = CONFIG.GROUND.Y - type.height;
    } else if (typeId === 'beast') {
      y = CONFIG.GROUND.Y - type.height;
    } else {
      y = CONFIG.GROUND.Y - type.height;
    }

    var obstacle = new Entities.Obstacle(typeId, x, y, lane);

    if (type.laneRequired) {
      obstacle.x = laneX;
    }

    game.obstacles.push(obstacle);
  }

  function spawnItem(game) {
    var types = ['shield', 'boost', 'heart'];
    var weights = [35, 35, 30];
    var typeId = weightedRandom(types, weights);

    var lane = Math.floor(Math.random() * 3);
    var laneX = CONFIG.LANE.POSITIONS[lane];
    var x = CONFIG.CANVAS.WIDTH + 30;
    var y = CONFIG.GROUND.Y - 100 - Math.random() * 80;

    var item = new Entities.Item(typeId, x, y);
    game.items.push(item);
  }

  function spawnCoinRow(game) {
    var lane = Math.floor(Math.random() * 3);
    var laneX = CONFIG.LANE.POSITIONS[lane];
    var count = 3 + Math.floor(Math.random() * 4);
    var y = CONFIG.GROUND.Y - 60 - Math.random() * 120;
    var startX = CONFIG.CANVAS.WIDTH + 30;

    for (var i = 0; i < count; i++) {
      var x = startX + i * 35;
      var coin = new Entities.Item('coin', x, y);
      game.items.push(coin);
    }
  }

  function weightedRandom(items, weights) {
    var total = 0;
    for (var i = 0; i < weights.length; i++) {
      total += weights[i];
    }
    var random = Math.random() * total;
    var cumulative = 0;
    for (var j = 0; j < items.length; j++) {
      cumulative += weights[j];
      if (random <= cumulative) {
        return items[j];
      }
    }
    return items[0];
  }

  return {
    update: update,
    reset: reset
  };
})();
