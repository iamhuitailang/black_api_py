(function () {
  const DIFFICULTY_PARAMS = {
    easy: { retargetInterval: 2000, propUseChance: 0.05, reactionDelay: 500, dodgeChance: 0.1, strategyInterval: 3000 },
    normal: { retargetInterval: 1200, propUseChance: 0.15, reactionDelay: 250, dodgeChance: 0.35, strategyInterval: 2000 },
    hard: { retargetInterval: 600, propUseChance: 0.3, reactionDelay: 100, dodgeChance: 0.65, strategyInterval: 1000 },
    expert: { retargetInterval: 300, propUseChance: 0.5, reactionDelay: 30, dodgeChance: 0.9, strategyInterval: 500 }
  };

  const AI_NAMES = {
    easy: ['小白', '雪球', '团子', '棉花', '汤圆'],
    normal: ['冰雪', '旋风', '闪电', '暴风', '极光'],
    hard: ['冰霜领主', '雪域战神', '冰晶女王', '极寒之王', '暴风勇士'],
    expert: ['绝对零度', '永恒寒冬', '冰封万界', '终焉之雪', '太古冰魂']
  };

  class AIController {
    constructor(hamster, difficulty) {
      this.hamster = hamster;
      this.difficulty = difficulty;
      const params = DIFFICULTY_PARAMS[difficulty] || DIFFICULTY_PARAMS.normal;
      this.retargetInterval = params.retargetInterval;
      this.propUseChance = params.propUseChance;
      this.reactionDelay = params.reactionDelay;
      this.dodgeChance = params.dodgeChance;
      this.strategyInterval = params.strategyInterval;

      this.targetX = 0;
      this.targetY = 0;
      this.retargetTimer = 0;
      this.reactionTimer = 0;
      this.strategyMode = 'grow';
      this.strategyTimer = 0;
      this._wanderAngle = 0;
      this._wanderFlipTimer = 0;
    }

    update(dt, gameState) {
      this.retargetTimer += dt;
      this.reactionTimer += dt;
      this.strategyTimer += dt;

      this._assessStrategy(gameState);

      let movement = this._calculateMovement(gameState);

      let dodge = this._checkHazards(gameState);
      if (dodge) {
        movement = dodge;
      }

      if (this.retargetTimer >= this.retargetInterval) {
        this.retargetTimer = 0;
        this._pickNewTarget(gameState);
      }

      if (this.reactionTimer < this.reactionDelay) {
        movement = { dx: 0, dy: 0 };
      }

      let propDecision = this._decidePropUsage(gameState);

      return {
        dx: movement.dx,
        dy: movement.dy,
        useProp: propDecision ? propDecision.propType : null,
        propTarget: propDecision ? propDecision.targetId : null
      };
    }

    _assessStrategy(gameState) {
      if (this.strategyTimer < this.strategyInterval) return;
      this.strategyTimer = 0;

      var mySize = this.hamster.snowball ? this.hamster.snowball.size : 0;
      var pickup = this._findNearestPickup(gameState);
      if (pickup && this._distanceTo(pickup.x, pickup.y) < 200) {
        this.strategyMode = 'collect';
        return;
      }

      if (mySize < 20) {
        this.strategyMode = 'grow';
        return;
      }

      var threat = this._findBiggestThreat(gameState);
      if (threat && this._distanceTo(threat.x, threat.y) < 250) {
        this.strategyMode = 'flee';
        return;
      }

      if (mySize > 40) {
        var prey = this._findWeakestOpponent(gameState);
        if (prey && this._distanceTo(prey.x, prey.y) < 300) {
          this.strategyMode = 'attack';
          return;
        }
      }

      this.strategyMode = 'grow';
    }

    _pickNewTarget(gameState) {
      switch (this.strategyMode) {
        case 'grow': {
          var patch = this._findNearestSnowPatch(gameState);
          if (patch) {
            this.targetX = patch.x;
            this.targetY = patch.y;
          } else {
            this.targetX = Math.random() * gameState.mapWidth;
            this.targetY = Math.random() * gameState.mapHeight;
          }
          if (this.difficulty === 'easy' && Math.random() < 0.3) {
            this.targetX += (Math.random() - 0.5) * 200;
            this.targetY += (Math.random() - 0.5) * 200;
          }
          break;
        }
        case 'attack': {
          var prey = this._findWeakestOpponent(gameState);
          if (prey) {
            this.targetX = prey.x;
            this.targetY = prey.y;
          }
          break;
        }
        case 'flee': {
          var threat = this._findBiggestThreat(gameState);
          if (threat) {
            var dx = this.hamster.x - threat.x;
            var dy = this.hamster.y - threat.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.targetX = this.hamster.x + (dx / dist) * 200;
            this.targetY = this.hamster.y + (dy / dist) * 200;
          }
          break;
        }
        case 'collect': {
          var pickup = this._findNearestPickup(gameState);
          if (pickup) {
            this.targetX = pickup.x;
            this.targetY = pickup.y;
          }
          break;
        }
      }
    }

    _calculateMovement(gameState) {
      var dx = this.targetX - this.hamster.x;
      var dy = this.targetY - this.hamster.y;

      switch (this.strategyMode) {
        case 'grow': {
          if (this.difficulty === 'easy') {
            this._wanderFlipTimer += 16;
            if (this._wanderFlipTimer > 1500) {
              this._wanderFlipTimer = 0;
              this._wanderAngle = (Math.random() - 0.5) * 1.2;
            }
            var cos = Math.cos(this._wanderAngle);
            var sin = Math.sin(this._wanderAngle);
            var rdx = dx * cos - dy * sin;
            var rdy = dx * sin + dy * cos;
            return this._getDirection(rdx, rdy);
          }
          if (this.difficulty === 'expert') {
            var patch = this._findNearestSnowPatch(gameState);
            if (patch) {
              dx = patch.x - this.hamster.x;
              dy = patch.y - this.hamster.y;
            }
          }
          return this._getDirection(dx, dy);
        }
        case 'attack': {
          if (this.difficulty === 'easy' && Math.random() < 0.15) {
            var wrongAngle = Math.random() * Math.PI * 2;
            return this._getDirection(Math.cos(wrongAngle), Math.sin(wrongAngle));
          }
          if (this.difficulty === 'expert') {
            var prey = this._findWeakestOpponent(gameState);
            if (prey && prey.vx !== undefined) {
              var predictX = prey.x + (prey.vx || 0) * 300;
              var predictY = prey.y + (prey.vy || 0) * 300;
              dx = predictX - this.hamster.x;
              dy = predictY - this.hamster.y;
            }
          }
          return this._getDirection(dx, dy);
        }
        case 'flee': {
          var threat = this._findBiggestThreat(gameState);
          if (threat) {
            var awayDx = this.hamster.x - threat.x;
            var awayDy = this.hamster.y - threat.y;
            var awayDist = Math.sqrt(awayDx * awayDx + awayDy * awayDy) || 1;
            var perpX = -awayDy / awayDist;
            var perpY = awayDx / awayDist;
            var angle = Math.sin(Date.now() * 0.002) * 0.4;
            var fleeDx = (awayDx / awayDist) * Math.cos(angle) + perpX * Math.sin(angle);
            var fleeDy = (awayDy / awayDist) * Math.cos(angle) + perpY * Math.sin(angle);
            if (this.difficulty === 'expert') {
              var patch = this._findNearestSnowPatch(gameState);
              if (patch) {
                var toPatchX = patch.x - this.hamster.x;
                var toPatchY = patch.y - this.hamster.y;
                var patchDist = Math.sqrt(toPatchX * toPatchX + toPatchY * toPatchY) || 1;
                fleeDx = fleeDx * 0.6 + (toPatchX / patchDist) * 0.4;
                fleeDy = fleeDy * 0.6 + (toPatchY / patchDist) * 0.4;
              }
            }
            return this._getDirection(fleeDx, fleeDy);
          }
          return this._getDirection(dx, dy);
        }
        case 'collect': {
          return this._getDirection(dx, dy);
        }
      }
      return this._getDirection(dx, dy);
    }

    _decidePropUsage(gameState) {
      if (Math.random() > this.propUseChance) return null;
      if (!this.hamster.props || this.hamster.props.length === 0) return null;
      if (this.hamster.propCooldowns) {
        var allOnCooldown = true;
        for (var k in this.hamster.propCooldowns) {
          if (this.hamster.propCooldowns[k] <= 0) {
            allOnCooldown = false;
            break;
          }
        }
        if (allOnCooldown) return null;
      }

      var availableProps = this.hamster.props.filter(function (p) {
        return !this.hamster.propCooldowns || !this.hamster.propCooldowns[p.type] || this.hamster.propCooldowns[p.type] <= 0;
      }.bind(this));

      if (availableProps.length === 0) return null;

      var chosen = null;
      var targetId = null;

      switch (this.difficulty) {
        case 'easy': {
          chosen = availableProps[Math.floor(Math.random() * availableProps.length)];
          var opponents = gameState.hamsters.filter(function (h) { return h.id !== this.hamster.id; }.bind(this));
          if (opponents.length > 0) {
            targetId = opponents[Math.floor(Math.random() * opponents.length)].id;
          }
          break;
        }
        case 'normal': {
          if (this.strategyMode === 'flee') {
            chosen = availableProps.find(function (p) { return p.type === 'speed'; });
          } else if (this.strategyMode === 'attack') {
            chosen = availableProps.find(function (p) { return p.type === 'freeze'; });
          }
          if (!chosen) {
            chosen = availableProps[Math.floor(Math.random() * availableProps.length)];
          }
          var weakest = this._findWeakestOpponent(gameState);
          if (weakest) targetId = weakest.id;
          break;
        }
        case 'hard': {
          if (this.strategyMode === 'flee') {
            chosen = availableProps.find(function (p) { return p.type === 'speed' || p.type === 'shield'; });
          } else if (this.strategyMode === 'attack') {
            chosen = availableProps.find(function (p) { return p.type === 'freeze' || p.type === 'shrink'; });
          } else if (this.strategyMode === 'collect') {
            chosen = availableProps.find(function (p) { return p.type === 'speed'; });
          } else {
            chosen = availableProps.find(function (p) { return p.type === 'grow'; });
          }
          if (!chosen) {
            chosen = availableProps[0];
          }
          var weak = this._findWeakestOpponent(gameState);
          if (weak) targetId = weak.id;
          break;
        }
        case 'expert': {
          if (this.strategyMode === 'flee') {
            chosen = availableProps.find(function (p) { return p.type === 'speed'; }) ||
                     availableProps.find(function (p) { return p.type === 'shield'; });
          } else if (this.strategyMode === 'attack') {
            chosen = availableProps.find(function (p) { return p.type === 'freeze'; }) ||
                     availableProps.find(function (p) { return p.type === 'shrink'; });
          } else if (this.strategyMode === 'collect') {
            chosen = availableProps.find(function (p) { return p.type === 'speed'; });
          } else {
            chosen = availableProps.find(function (p) { return p.type === 'grow'; }) ||
                     availableProps.find(function (p) { return p.type === 'speed'; });
          }
          if (!chosen) {
            chosen = availableProps[0];
          }
          var threat = this._findBiggestThreat(gameState);
          if (this.strategyMode === 'flee' && threat) {
            targetId = threat.id;
          } else {
            var w = this._findWeakestOpponent(gameState);
            if (w) targetId = w.id;
          }
          break;
        }
      }

      if (!chosen) return null;
      return { propType: chosen.type, targetId: targetId };
    }

    _checkHazards(gameState) {
      if (!gameState.hazards || gameState.hazards.length === 0) return null;
      if (Math.random() > this.dodgeChance) return null;

      var detectionRadius = this.difficulty === 'expert' ? 250 :
                            this.difficulty === 'hard' ? 180 :
                            this.difficulty === 'normal' ? 120 : 70;

      for (var i = 0; i < gameState.hazards.length; i++) {
        var hazard = gameState.hazards[i];
        var dx = hazard.x - this.hamster.x;
        var dy = hazard.y - this.hamster.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < detectionRadius) {
          var hVx = hazard.vx || 0;
          var hVy = hazard.vy || 0;
          var nextHx = hazard.x + hVx * 200;
          var nextHy = hazard.y + hVy * 200;
          var toSelfX = this.hamster.x - hazard.x;
          var toSelfY = this.hamster.y - hazard.y;
          var toNextX = nextHx - hazard.x;
          var toNextY = nextHy - hazard.y;
          var dot = toSelfX * toNextX + toSelfY * toNextY;
          if (dot > 0 || dist < detectionRadius * 0.5) {
            var perpX = -dy / (dist || 1);
            var perpY = dx / (dist || 1);
            var side = (this.hamster.x - hazard.x) * hVy - (this.hamster.y - hazard.y) * hVx;
            var dir = side >= 0 ? 1 : -1;
            return { dx: perpX * dir, dy: perpY * dir };
          }
        }
      }
      return null;
    }

    _findNearestSnowPatch(gameState) {
      if (!gameState.snowPatches || gameState.snowPatches.length === 0) return null;
      var nearest = null;
      var nearestDist = Infinity;
      for (var i = 0; i < gameState.snowPatches.length; i++) {
        var patch = gameState.snowPatches[i];
        var dist = this._distanceTo(patch.x, patch.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = patch;
        }
      }
      return nearest;
    }

    _findNearestPickup(gameState) {
      if (!gameState.pickups || gameState.pickups.length === 0) return null;
      var nearest = null;
      var nearestDist = Infinity;
      for (var i = 0; i < gameState.pickups.length; i++) {
        var pickup = gameState.pickups[i];
        if (pickup.collected) continue;
        var dist = this._distanceTo(pickup.x, pickup.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = pickup;
        }
      }
      return nearest;
    }

    _findWeakestOpponent(gameState) {
      if (!gameState.hamsters) return null;
      var weakest = null;
      var smallestSize = Infinity;
      for (var i = 0; i < gameState.hamsters.length; i++) {
        var h = gameState.hamsters[i];
        if (h.id === this.hamster.id) continue;
        var size = h.snowball ? h.snowball.size : 0;
        if (size < smallestSize) {
          smallestSize = size;
          weakest = h;
        }
      }
      return weakest;
    }

    _findBiggestThreat(gameState) {
      if (!gameState.hamsters) return null;
      var mySize = this.hamster.snowball ? this.hamster.snowball.size : 0;
      var threat = null;
      var nearestDist = Infinity;
      for (var i = 0; i < gameState.hamsters.length; i++) {
        var h = gameState.hamsters[i];
        if (h.id === this.hamster.id) continue;
        var theirSize = h.snowball ? h.snowball.size : 0;
        if (theirSize <= mySize) continue;
        var dist = this._distanceTo(h.x, h.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          threat = h;
        }
      }
      return threat;
    }

    _distanceTo(x, y) {
      var dx = this.hamster.x - x;
      var dy = this.hamster.y - y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    _getDirection(dx, dy) {
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) return { dx: 0, dy: 0 };
      var nx = dx / len;
      var ny = dy / len;
      return {
        dx: nx > 0.3 ? 1 : nx < -0.3 ? -1 : 0,
        dy: ny > 0.3 ? 1 : ny < -0.3 ? -1 : 0
      };
    }
  }

  window.GameAI = { AIController: AIController, AI_NAMES: AI_NAMES };
})();
