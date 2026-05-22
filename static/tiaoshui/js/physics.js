const Physics = {
  config: GameData.PHYSICS_CONFIG,
  gravity: 0.3,
  jumpForce: 12,
  maxSomersaultSpeed: 0.25,
  maxTwistSpeed: 0.2,

  init() {
    this.gravity = this.config.gravity;
    this.jumpForce = this.config.jumpForce;
    this.maxSomersaultSpeed = this.config.maxSomersaultSpeed;
    this.maxTwistSpeed = this.config.maxTwistSpeed;
  },

  applyGravity(diver) {
    diver.vy += this.gravity;
    diver.y += diver.vy;
  },

  applyJump(diver, power) {
    const force = this.jumpForce * (0.5 + power * 0.5);
    diver.vy = -force;
  },

  applySomersault(diver, direction) {
    if (diver.isInAir) {
      diver.somersaultVelocity += direction * 0.008;
      diver.somersaultVelocity = Math.max(-this.maxSomersaultSpeed, 
        Math.min(this.maxSomersaultSpeed, diver.somersaultVelocity));
    }
  },

  applyTwist(diver, direction) {
    if (diver.isInAir && diver.canTwist) {
      diver.twistVelocity += direction * 0.006;
      diver.twistVelocity = Math.max(-this.maxTwistSpeed, 
        Math.min(this.maxTwistSpeed, diver.twistVelocity));
    }
  },

  updateDiver(diver) {
    if (diver.isJumping || diver.isInAir) {
      this.applyGravity(diver);
      diver.x += diver.vx;
      
      diver.somersaultAngle += diver.somersaultVelocity;
      diver.twistAngle += diver.twistVelocity;
      
      diver.somersaultVelocity *= 0.998;
      diver.twistVelocity *= 0.998;
      
      const waterLevel = GameData.CANVAS_CONFIG.waterLevel;
      if (diver.y >= waterLevel - 20 && !diver.hasEnteredWater) {
        this.handleWaterEntry(diver);
      }
    }
  },

  handleWaterEntry(diver) {
    diver.y = GameData.CANVAS_CONFIG.waterLevel - 20;
    diver.vy = 0;
    diver.vx *= 0.3;
    diver.hasEnteredWater = true;
    diver.isInAir = false;
  },

  calculateEntryQuality(diver) {
    const normalizedAngle = ((diver.somersaultAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const verticalDeviation = Math.min(
      Math.abs(normalizedAngle - Math.PI / 2),
      Math.abs(normalizedAngle - Math.PI * 1.5)
    );
    const verticalScore = Math.max(0, 10 - verticalDeviation * 5);
    
    const twistDeviation = Math.abs(diver.twistAngle % (Math.PI * 2));
    const twistScore = Math.max(0, 10 - twistDeviation * 3);
    
    const speedPenalty = Math.abs(diver.vy) * 0.3;
    const speedScore = Math.max(0, 10 - speedPenalty);
    
    const overallScore = (verticalScore * 0.5 + twistScore * 0.2 + speedScore * 0.3);
    
    return {
      verticalScore,
      twistScore,
      speedScore,
      overallScore: Math.max(0, Math.min(10, overallScore))
    };
  },

  calculateSplashSize(diver) {
    const entryAngle = ((diver.somersaultAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const verticalDeviation = Math.min(
      Math.abs(entryAngle - Math.PI / 2),
      Math.abs(entryAngle - Math.PI * 1.5)
    );
    const baseSplash = 25;
    const angleMultiplier = 1 + Math.sin(verticalDeviation) * 3;
    const speedMultiplier = 1 + Math.min(5, Math.abs(diver.vy) * 0.15);
    
    return {
      width: baseSplash * angleMultiplier * speedMultiplier,
      height: baseSplash * angleMultiplier * speedMultiplier * 0.5
    };
  },

  reset() {
    this.init();
  }
};
