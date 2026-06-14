const FoodSystem = {
  randomFoodType() {
    const rand = Math.random();
    let cumulative = 0;
    const types = Object.values(GameConfig.FOOD_TYPES);
    for (const type of types) {
      cumulative += type.probability;
      if (rand < cumulative) {
        return type;
      }
    }
    return types[0];
  },

  spawn(worm, existingFood) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    const radius = 12;

    do {
      x = Math.random() * (GameConfig.CANVAS_WIDTH - 40) + 20;
      y = Math.random() * (GameConfig.CANVAS_HEIGHT - 40) + 20;
      attempts++;
    } while (this.isPositionOnWorm(x, y, worm, radius) ||
             this.isPositionOnFood(x, y, existingFood, radius) ||
             attempts < maxAttempts);

    return {
      x,
      y,
      radius,
      type: this.randomFoodType(),
      pulsePhase: Math.random() * Math.PI * 2,
      spawnTime: Date.now()
    };
  },

  isPositionOnWorm(x, y, worm, radius) {
    const headDist = Math.sqrt((x - worm.x) ** 2 + (y - worm.y) ** 2);
    if (headDist < radius + 12) return true;
    for (let i = 0; i < worm.bodySegments; i++) {
      const pos = Worm.getSegmentPosition(worm, i);
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < radius + 10) return true;
    }
    return false;
  },

  isPositionOnFood(x, y, existingFood, radius) {
    if (!existingFood) return false;
    const dist = Math.sqrt((x - existingFood.x) ** 2 + (y - existingFood.y) ** 2);
    return dist < radius * 3;
  },

  checkCollision(worm, food) {
    if (!food) return false;
    const dx = worm.x - food.x;
    const dy = worm.y - food.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < food.radius + 10;
  }
};
