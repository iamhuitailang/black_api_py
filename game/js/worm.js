const Worm = {
  create(saveData) {
    const savedState = saveData || {};
    const worm = {
      x: savedState.x || GameConfig.CANVAS_WIDTH / 2,
      y: savedState.y || GameConfig.CANVAS_HEIGHT / 2,
      direction: savedState.direction || { x: 1, y: 0 },
      nextDirection: savedState.nextDirection || { x: 1, y: 0 },
      bodySegments: savedState.bodySegments || GameConfig.INITIAL_BODY_SEGMENTS,
      pathHistory: [],
      baseSpeed: savedState.baseSpeed || GameConfig.BASE_SPEED,
      speedBoostUntil: 0,
      slowUntil: 0,
      foodsEatenForSpeed: savedState.foodsEatenForSpeed || 0,
      isDead: false,
      deathAnimation: null
    };

    const savedHistory = savedState.pathHistory || [];
    if (savedHistory.length > 0) {
      worm.pathHistory = savedHistory.slice();
      while (worm.pathHistory.length < worm.bodySegments * GameConfig.BODY_SEGMENT_INTERVAL + 20) {
        const last = worm.pathHistory[worm.pathHistory.length - 1];
        worm.pathHistory.push({ x: last.x, y: last.y });
      }
    } else {
      for (let i = 0; i < worm.bodySegments * GameConfig.BODY_SEGMENT_INTERVAL + 20; i++) {
        worm.pathHistory.push({ x: worm.x, y: worm.y });
      }
    }

    return worm;
  },

  getCurrentSpeed(worm, now) {
    let speed = worm.baseSpeed;
    if (now < worm.speedBoostUntil) {
      speed *= GameConfig.SPEED_BOOST_MULTIPLIER;
    }
    if (now < worm.slowUntil) {
      speed *= GameConfig.SLOW_MULTIPLIER;
    }
    return speed;
  },

  isSpeedBoosted(worm, now) {
    return now < worm.speedBoostUntil;
  },

  isSlowed(worm, now) {
    return now < worm.slowUntil;
  },

  setDirection(worm, dir) {
    if (!worm || !dir) return;
    if (dir.x === -worm.direction.x && dir.y === -worm.direction.y) {
      return;
    }
    worm.nextDirection = { x: dir.x, y: dir.y };
  },

  update(worm, now) {
    if (!worm || worm.isDead) return false;

    worm.direction = { x: worm.nextDirection.x, y: worm.nextDirection.y };
    const speed = this.getCurrentSpeed(worm, now);

    worm.x += worm.direction.x * speed;
    worm.y += worm.direction.y * speed;

    let teleported = false;
    if (worm.x < 0) {
      worm.x = GameConfig.CANVAS_WIDTH;
      teleported = true;
    } else if (worm.x > GameConfig.CANVAS_WIDTH) {
      worm.x = 0;
      teleported = true;
    }
    if (worm.y < 0) {
      worm.y = GameConfig.CANVAS_HEIGHT;
      teleported = true;
    } else if (worm.y > GameConfig.CANVAS_HEIGHT) {
      worm.y = 0;
      teleported = true;
    }

    worm.pathHistory.unshift({ x: worm.x, y: worm.y });
    const maxHistory = Math.max(
      GameConfig.PATH_HISTORY_LENGTH,
      worm.bodySegments * GameConfig.BODY_SEGMENT_INTERVAL + 50
    );
    while (worm.pathHistory.length > maxHistory) {
      worm.pathHistory.pop();
    }

    return teleported;
  },

  getSegmentPosition(worm, segmentIndex) {
    const historyIndex = segmentIndex * GameConfig.BODY_SEGMENT_INTERVAL;
    if (historyIndex < worm.pathHistory.length) {
      return worm.pathHistory[historyIndex];
    }
    if (worm.pathHistory.length > 0) {
      return worm.pathHistory[worm.pathHistory.length - 1];
    }
    return { x: worm.x, y: worm.y };
  },

  addSegments(worm, count = GameConfig.SEGMENTS_PER_FOOD) {
    worm.bodySegments += count;
  },

  checkSelfCollision(worm) {
    if (!worm || worm.bodySegments <= GameConfig.COLLISION_SAFE_SEGMENTS + 1) return false;
    const headRadius = 8;
    for (let i = GameConfig.COLLISION_SAFE_SEGMENTS; i < worm.bodySegments; i++) {
      const pos = this.getSegmentPosition(worm, i);
      const dx = worm.x - pos.x;
      const dy = worm.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < headRadius * 1.5) {
        return true;
      }
    }
    return false;
  },

  eatFood(worm, food, now) {
    worm.foodsEatenForSpeed++;
    this.addSegments(worm);
    let permanentSpeedUp = false;

    if (worm.foodsEatenForSpeed >= GameConfig.FOODS_FOR_SPEED_BOOST) {
      worm.foodsEatenForSpeed = 0;
      worm.baseSpeed += GameConfig.SPEED_INCREMENT;
      permanentSpeedUp = true;
    }

    if (food.type.id === 'speed') {
      worm.speedBoostUntil = now + GameConfig.SPEED_BOOST_DURATION;
    } else if (food.type.id === 'slow') {
      worm.slowUntil = now + GameConfig.SLOW_DURATION;
    }

    return permanentSpeedUp;
  },

  die(worm, now) {
    worm.isDead = true;
    worm.deathAnimation = {
      startTime: now,
      segments: []
    };
    for (let i = 0; i < worm.bodySegments; i++) {
      const pos = this.getSegmentPosition(worm, i);
      worm.deathAnimation.segments.push({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        exploded: false
      });
    }
  },

  serialize(worm) {
    return {
      x: worm.x,
      y: worm.y,
      direction: worm.direction,
      nextDirection: worm.nextDirection,
      bodySegments: worm.bodySegments,
      pathHistory: worm.pathHistory.slice(0, Math.min(worm.pathHistory.length, 150)),
      baseSpeed: worm.baseSpeed,
      foodsEatenForSpeed: worm.foodsEatenForSpeed
    };
  }
};
