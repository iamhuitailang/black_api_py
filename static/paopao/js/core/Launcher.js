class Launcher {
    constructor(launcherId = 'balance') {
        this.id = launcherId;
        this.config = getLauncherConfig(launcherId);
        this.x = CONSTANTS.SHOOTER_X;
        this.y = CONSTANTS.SHOOTER_Y;
        this.angle = CONSTANTS.DEFAULT_ANGLE;
        this.targetAngle = CONSTANTS.DEFAULT_ANGLE;
        this.currentBubble = null;
        this.nextBubble = null;
        this.specialBubble = null;
        this.specialBubbleCount = 3;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeLevel = 0;
        this.isFiring = false;
        this.fireCooldown = 0;
        this.aimSpeed = getAimSpeed(launcherId);
        this.rotation = 0;
        this.recoilOffset = 0;
        this.flashEffect = 0;
    }
    
    get baseFirePower() {
        return this.config.baseFirePower;
    }
    
    get scoreMultiplier() {
        return this.config.scoreMultiplier;
    }
    
    get matchTolerance() {
        return this.config.matchTolerance;
    }
    
    get specialBubbleScore() {
        return this.config.specialBubbleScore;
    }
    
    get specialBubbleTypes() {
        return this.config.specialBubbles;
    }
    
    init(levelColors) {
        this.currentBubble = this.createRandomBubble(levelColors);
        this.nextBubble = this.createRandomBubble(levelColors);
        this.specialBubbleCount = 3;
        this.updateSpecialBubble();
    }
    
    createRandomBubble(levelColors) {
        const color = levelColors[Math.floor(Math.random() * levelColors.length)];
        return new Bubble({
            color,
            type: 'normal',
            x: this.x,
            y: this.y
        });
    }
    
    createSpecialBubble() {
        if (this.specialBubbleCount <= 0) return null;
        
        const type = this.specialBubbleTypes[Math.floor(Math.random() * this.specialBubbleTypes.length)];
        const bubble = new Bubble({
            type,
            color: BUBBLE_TYPES_CONFIG[type].color || getRandomBubbleColor(),
            x: this.x,
            y: this.y
        });
        this.specialBubbleCount--;
        this.updateSpecialBubble();
        return bubble;
    }
    
    updateSpecialBubble() {
        if (this.specialBubbleCount > 0) {
            const type = this.specialBubbleTypes[Math.floor(Math.random() * this.specialBubbleTypes.length)];
            this.specialBubble = new Bubble({
                type,
                color: BUBBLE_TYPES_CONFIG[type].color || getRandomBubbleColor()
            });
        } else {
            this.specialBubble = null;
        }
    }
    
    addSpecialBubble() {
        this.specialBubbleCount = Math.min(this.specialBubbleCount + 1, 5);
        this.updateSpecialBubble();
    }
    
    aimLeft() {
        this.targetAngle = Helpers.clamp(this.targetAngle + this.aimSpeed, CONSTANTS.MIN_ANGLE, CONSTANTS.MAX_ANGLE);
    }
    
    aimRight() {
        this.targetAngle = Helpers.clamp(this.targetAngle - this.aimSpeed, CONSTANTS.MIN_ANGLE, CONSTANTS.MAX_ANGLE);
    }
    
    resetAim() {
        this.targetAngle = CONSTANTS.DEFAULT_ANGLE;
    }
    
    startCharge() {
        if (!this.isFiring && this.currentBubble) {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
        }
    }
    
    updateCharge() {
        if (this.isCharging) {
            const elapsed = Date.now() - this.chargeStartTime;
            this.chargeLevel = Math.min(elapsed / CONSTANTS.MAX_CHARGE_TIME, 1);
        }
    }
    
    fire(useSpecial = false) {
        if (this.isFiring || !this.currentBubble) return null;
        
        let bubbleToFire;
        
        if (useSpecial) {
            bubbleToFire = this.createSpecialBubble();
            if (!bubbleToFire) return null;
        } else {
            bubbleToFire = this.currentBubble;
            this.currentBubble = this.nextBubble;
            this.nextBubble = null;
        }
        
        const speedMultiplier = 1 + this.chargeLevel * 0.5;
        const speed = CONSTANTS.BUBBLE_SPEED * speedMultiplier;
        
        bubbleToFire.x = this.x;
        bubbleToFire.y = this.y;
        bubbleToFire.launch(this.angle, speed);
        
        this.isFiring = true;
        this.fireCooldown = bubbleToFire.config.fireDelay * 1000;
        this.recoilOffset = 15;
        this.flashEffect = 1;
        
        this.isCharging = false;
        this.chargeLevel = 0;
        
        return bubbleToFire;
    }
    
    prepareNextBubble(levelColors) {
        this.nextBubble = this.createRandomBubble(levelColors);
        this.isFiring = false;
    }
    
    update(deltaTime, levelColors) {
        const angleDiff = this.targetAngle - this.angle;
        if (Math.abs(angleDiff) > 0.1) {
            this.angle += angleDiff * 0.15;
        }
        
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
            if (this.fireCooldown <= 0) {
                if (!this.nextBubble) {
                    this.nextBubble = this.createRandomBubble(levelColors);
                }
                this.isFiring = false;
            }
        }
        
        if (this.recoilOffset > 0) {
            this.recoilOffset *= 0.85;
            if (this.recoilOffset < 0.5) this.recoilOffset = 0;
        }
        
        if (this.flashEffect > 0) {
            this.flashEffect -= deltaTime / 200;
            if (this.flashEffect < 0) this.flashEffect = 0;
        }
        
        this.updateCharge();
        
        this.rotation += 0.02;
    }
    
    canFire() {
        return !this.isFiring && this.currentBubble && this.fireCooldown <= 0;
    }
    
    serialize() {
        return {
            id: this.id,
            angle: this.angle,
            targetAngle: this.targetAngle,
            currentBubble: this.currentBubble ? this.currentBubble.serialize() : null,
            nextBubble: this.nextBubble ? this.nextBubble.serialize() : null,
            specialBubbleCount: this.specialBubbleCount
        };
    }
    
    static deserialize(data) {
        const launcher = new Launcher(data.id);
        launcher.angle = data.angle;
        launcher.targetAngle = data.targetAngle;
        launcher.currentBubble = data.currentBubble ? Bubble.deserialize(data.currentBubble) : null;
        launcher.nextBubble = data.nextBubble ? Bubble.deserialize(data.nextBubble) : null;
        launcher.specialBubbleCount = data.specialBubbleCount;
        launcher.updateSpecialBubble();
        return launcher;
    }
}
