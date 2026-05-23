var Entities = (function() {

  function Carriage(typeId, x, y) {
    var type = CONFIG.CARRIAGE_TYPES[typeId] || CONFIG.CARRIAGE_TYPES.wooden;

    this.typeId = typeId;
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 80;
    this.height = 70;
    this.hp = type.hp;
    this.maxHp = type.hp;
    this.isJumping = false;
    this.isOnGround = true;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.shielded = false;
    this.shieldTimer = 0;
    this.boosted = false;
    this.boostTimer = 0;
    this.boostMultiplier = 1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.targetLane = 1;
    this.flashTimer = 0;
  }

  Carriage.prototype.update = function(deltaTime) {
    this.vy += CONFIG.PHYSICS.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    var topLimit = 60;
    if (this.y < topLimit) {
      this.y = topLimit;
      if (this.vy < 0) this.vy = 0;
    }

    var groundY = CONFIG.GROUND.Y - this.height;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isJumping = false;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    this.vx *= CONFIG.PHYSICS.GROUND_FRICTION;

    if (this.invincible) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    if (this.shielded) {
      this.shieldTimer -= deltaTime;
      if (this.shieldTimer <= 0) {
        this.shielded = false;
      }
    }

    if (this.boosted) {
      this.boostTimer -= deltaTime;
      if (this.boostTimer <= 0) {
        this.boosted = false;
        this.boostMultiplier = 1;
      }
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
    }

    this.animTimer += deltaTime;
    if (this.animTimer > 100) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  };

  Carriage.prototype.jump = function(holdTime) {
    if (!this.isOnGround) return;

    var basePower = CONFIG.PHYSICS.JUMP_FORCE * this.type.jumpPower;
    var chargeBonus = 0;

    if (holdTime && holdTime > 150) {
      var extraTime = Math.min(holdTime, 500);
      chargeBonus = (extraTime / 500) * (CONFIG.PHYSICS.MAX_JUMP_FORCE - CONFIG.PHYSICS.JUMP_FORCE);
    }

    this.vy = -(basePower + chargeBonus * this.type.jumpPower);
    this.isJumping = true;
    this.isOnGround = false;
  };

  Carriage.prototype.moveLeft = function() {
    var speed = CONFIG.PHYSICS.MOVE_SPEED * this.type.speed;
    this.x -= speed;
  };

  Carriage.prototype.moveRight = function() {
    var speed = CONFIG.PHYSICS.MOVE_SPEED * this.type.speed;
    this.x += speed;
  };

  Carriage.prototype.takeDamage = function(amount) {
    if (this.invincible) return false;

    if (this.shielded) {
      this.shielded = false;
      this.shieldTimer = 0;
      this.invincible = true;
      this.invincibleTimer = 1500;
      this.flashTimer = 300;
      return false;
    }

    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = 1500;
    this.flashTimer = 300;

    return this.hp <= 0;
  };

  Carriage.prototype.heal = function(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  };

  Carriage.prototype.applyShield = function(duration) {
    this.shielded = true;
    this.shieldTimer = duration;
  };

  Carriage.prototype.applyBoost = function(duration, multiplier) {
    this.boosted = true;
    this.boostTimer = duration;
    this.boostMultiplier = multiplier;
  };

  Carriage.prototype.getBounds = function() {
    return {
      x: this.x - this.width / 2 + 10,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 15
    };
  };

  Carriage.prototype.reset = function(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.type.hp;
    this.maxHp = this.type.hp;
    this.isJumping = false;
    this.isOnGround = true;
    this.invincible = false;
    this.shielded = false;
    this.boosted = false;
    this.boostMultiplier = 1;
    this.targetLane = 1;
  };


  function Obstacle(typeId, x, y, lane) {
    var type = CONFIG.OBSTACLE_TYPES[typeId];
    this.typeId = typeId;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = type.width;
    this.height = type.height;
    this.lane = lane !== undefined ? lane : -1;
    this.passed = false;
    this.animFrame = 0;
    this.animTimer = 0;

    if (type.moving) {
      this.moveDir = Math.random() > 0.5 ? 1 : -1;
      this.moveSpeed = 1.5 + Math.random() * 1.5;
      this.originalX = x;
      this.moveRange = 60 + Math.random() * 40;
    }
  }

  Obstacle.prototype.update = function(deltaTime, gameSpeed) {
    this.x -= gameSpeed;

    if (this.type.moving) {
      this.animTimer += deltaTime;
      if (this.animTimer > 100) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
      this.x += Math.sin(Date.now() * 0.003) * this.moveSpeed * this.moveDir;
    }
  };

  Obstacle.prototype.getBounds = function() {
    if (this.typeId === 'pit') {
      return {
        x: this.x - this.width / 2,
        y: CONFIG.GROUND.Y + 5,
        width: this.width,
        height: this.height
      };
    }
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height
    };
  };

  Obstacle.prototype.isOffScreen = function() {
    return this.x + this.width < -50;
  };


  function Item(typeId, x, y) {
    var type = CONFIG.ITEM_TYPES[typeId];
    this.typeId = typeId;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = type.width;
    this.height = type.height;
    this.collected = false;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.animTimer = 0;
  }

  Item.prototype.update = function(deltaTime, gameSpeed) {
    this.x -= gameSpeed;
    this.animTimer += deltaTime;
    this.bobOffset += 0.005 * deltaTime / 16;
  };

  Item.prototype.getBounds = function() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  };

  Item.prototype.isOffScreen = function() {
    return this.x + this.width < -30;
  };

  Item.prototype.getBobY = function() {
    return this.y + Math.sin(this.bobOffset) * 5;
  };


  function Particle(x, y, color, vx, vy, life, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx || (Math.random() - 0.5) * 4;
    this.vy = vy || (Math.random() - 0.5) * 4 - 2;
    this.life = life || 500;
    this.maxLife = this.life;
    this.size = size || 3 + Math.random() * 3;
  }

  Particle.prototype.update = function(deltaTime) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.life -= deltaTime;
  };

  Particle.prototype.isDead = function() {
    return this.life <= 0;
  };

  Particle.prototype.getAlpha = function() {
    return Math.max(0, this.life / this.maxLife);
  };


  return {
    Carriage: Carriage,
    Obstacle: Obstacle,
    Item: Item,
    Particle: Particle
  };
})();
