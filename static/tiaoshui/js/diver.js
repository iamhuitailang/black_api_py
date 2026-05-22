class Diver {
  constructor() {
    this.reset();
  }

  reset() {
    const config = GameData.CANVAS_CONFIG;
    this.startX = config.platformX;
    this.startY = config.platformY;
    
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    
    this.width = 30;
    this.height = 80;
    
    this.somersaultAngle = 0;
    this.somersaultVelocity = 0;
    
    this.twistAngle = 0;
    this.twistVelocity = 0;
    
    this.isJumping = false;
    this.isInAir = false;
    this.hasEnteredWater = false;
    this.canTwist = true;
    
    this.currentAction = null;
    this.position = 'pike';
    
    this.jumpPower = 0;
    this.isChargingJump = false;
    
    this.targetSomersaults = 0;
    this.targetTwists = 0;
    
    this.splashParticles = [];
    this.waterRipples = [];
  }

  prepareForDive(action) {
    this.reset();
    this.currentAction = action;
    this.position = action.position;
    this.canTwist = action.twist > 0;
    this.targetSomersaults = action.somersault;
    this.targetTwists = action.twist;
  }

  startJumpCharge() {
    this.isChargingJump = true;
    this.jumpPower = 0;
  }

  updateJumpCharge(deltaTime) {
    if (this.isChargingJump) {
      this.jumpPower = Math.min(1, this.jumpPower + deltaTime * 0.001);
      return this.jumpPower;
    }
    return 0;
  }

  executeJump() {
    if (this.isChargingJump) {
      const config = GameData.PHYSICS_CONFIG;
      const force = config.jumpForce * (0.6 + this.jumpPower * 0.4);
      
      this.vy = -force;
      this.vx = (this.currentAction && this.currentAction.type === 'backward') ? 1.5 : 
                (this.currentAction && this.currentAction.type === 'forward') ? -1.5 :
                (Math.random() - 0.5) * 2;
      
      this.isJumping = true;
      this.isInAir = true;
      this.isChargingJump = false;
      
      const airTime = (force * 2) / config.gravity;
      
      if (this.targetSomersaults > 0) {
        this.somersaultVelocity = (this.targetSomersaults * Math.PI * 2) / airTime;
      }
      
      if (this.canTwist && this.targetTwists > 0) {
        this.twistVelocity = (this.targetTwists * Math.PI * 2) / airTime;
      }
      
      return true;
    }
    return false;
  }

  update() {
    if (this.isInAir || this.isJumping) {
      Physics.updateDiver(this);
    }
    
    if (this.hasEnteredWater && this.splashParticles.length === 0) {
      this.createSplash();
    }
    
    this.updateSplash();
    this.updateWaterRipples();
  }

  createSplash() {
    const splashSize = Physics.calculateSplashSize(this);
    const particleCount = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < particleCount; i++) {
      this.splashParticles.push({
        x: this.x,
        y: GameData.CANVAS_CONFIG.waterLevel,
        vx: (Math.random() - 0.5) * splashSize.width * 0.3,
        vy: -Math.random() * splashSize.height * 0.5,
        size: 3 + Math.random() * 6,
        alpha: 1,
        life: 1
      });
    }
    
    this.waterRipples.push({
      x: this.x,
      y: GameData.CANVAS_CONFIG.waterLevel,
      radius: 10,
      alpha: 0.8,
      maxRadius: splashSize.width * 3
    });
  }

  updateSplash() {
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const p = this.splashParticles[i];
      p.vy += 0.15;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.alpha = Math.max(0, p.life);
      
      if (p.life <= 0 || p.y > GameData.CANVAS_CONFIG.waterLevel + 20) {
        this.splashParticles.splice(i, 1);
      }
    }
  }

  updateWaterRipples() {
    for (let i = this.waterRipples.length - 1; i >= 0; i--) {
      const ripple = this.waterRipples[i];
      ripple.radius += 3;
      ripple.alpha -= 0.02;
      
      if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
        this.waterRipples.splice(i, 1);
      }
    }
  }

  getBodyState() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      somersaultAngle: this.somersaultAngle,
      twistAngle: this.twistAngle,
      position: this.position,
      isInAir: this.isInAir,
      hasEnteredWater: this.hasEnteredWater,
      splashParticles: this.splashParticles,
      waterRipples: this.waterRipples
    };
  }

  getEntryScore() {
    return Physics.calculateEntryQuality(this);
  }
}
