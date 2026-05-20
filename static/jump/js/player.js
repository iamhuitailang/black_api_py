class Player {
    constructor() {
        this.x = CONFIG.GAME.WORLD_WIDTH / 2;
        this.y = 0;
        this.worldY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.altitude = CONFIG.GAME.START_ALTITUDE;
        this.hasParachute = false;
        this.parachuteOpened = false;
        this.canOpenParachute = false;
        this.stamina = CONFIG.PLAYER.STAMINA_MAX;
        this.isDead = false;
        this.deathReason = '';
        this.hasMagnet = false;
        this.rotation = 0;
        this.animationFrame = 0;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isFastDescending = false;
        this.isSlowDescending = false;
        this.landingSpeed = 0;
        this.landingSuccess = false;
    }
    
    init() {
        this.x = CONFIG.GAME.WORLD_WIDTH / 2;
        this.y = 0;
        this.worldY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.altitude = CONFIG.GAME.START_ALTITUDE;
        this.hasParachute = false;
        this.parachuteOpened = false;
        this.canOpenParachute = false;
        this.stamina = CONFIG.PLAYER.STAMINA_MAX;
        this.isDead = false;
        this.deathReason = '';
        this.hasMagnet = false;
        this.rotation = 0;
        this.animationFrame = 0;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isFastDescending = false;
        this.isSlowDescending = false;
        this.landingSpeed = 0;
        this.landingSuccess = false;
    }
    
    update(windSpeed, obstacleSystem, deltaTime) {
        if (this.isDead) return;
        
        this.animationFrame += deltaTime / 1000;
        
        this.canOpenParachute = this.altitude <= CONFIG.PARACHUTE_OPEN_ALTITUDE && 
                              this.altitude >= CONFIG.MIN_PARACHUTE_OPEN_ALTITUDE &&
                              !this.parachuteOpened;
        
        if (this.altitude <= CONFIG.GAME.DEATH_ALTITUDE && !this.parachuteOpened) {
            this.isDead = true;
            this.deathReason = '高度过低，未能及时开伞!';
            return;
        }
        
        if (this.parachuteOpened) {
            Physics.updateParachuteFall(this, windSpeed, deltaTime);
        } else {
            Physics.updateFreeFall(this, deltaTime);
        }
        
        if (this.velocityX > 0.1) {
            this.rotation = Math.min(15, this.velocityX * 2);
        } else if (this.velocityX < -0.1) {
            this.rotation = Math.max(-15, this.velocityX * 2);
        } else {
            this.rotation *= 0.95;
        }
        
        if (this.isMovingLeft && this.stamina > 0) {
            Physics.applyHorizontalControl(this, -1, deltaTime);
            Physics.applyStaminaCost(this, CONFIG.PLAYER.STAMINA_COST_MOVE, deltaTime);
        }
        if (this.isMovingRight && this.stamina > 0) {
            Physics.applyHorizontalControl(this, 1, deltaTime);
            Physics.applyStaminaCost(this, CONFIG.PLAYER.STAMINA_COST_MOVE, deltaTime);
        }
        
        if (this.parachuteOpened) {
            if (this.isFastDescending) {
                Physics.applyVerticalControl(this, true, false);
            } else if (this.isSlowDescending && this.stamina > 0) {
                Physics.applyVerticalControl(this, false, true);
                Physics.applyStaminaCost(this, CONFIG.PLAYER.STAMINA_COST_SLOW, deltaTime);
            }
        }
        
        if (!this.isMovingLeft && !this.isMovingRight && !this.isSlowDescending) {
            Physics.regenerateStamina(this, deltaTime);
        }
        
        if (obstacleSystem.hasEffect('speedBoost')) {
            this.velocityY *= obstacleSystem.getEffectMultiplier('speedBoost');
        }
        
        this.worldY = this.y;
        
        if (this.altitude <= 0) {
            this.altitude = 0;
            this.landingSpeed = this.velocityY;
            this.checkLanding();
        }
    }
    
    checkLanding() {
        if (this.landingSpeed > CONFIG.GAME.MAX_LANDING_SPEED) {
            this.isDead = true;
            this.deathReason = `着陆速度过快! (${this.landingSpeed.toFixed(1)} m/s > ${CONFIG.GAME.MAX_LANDING_SPEED} m/s)`;
            this.landingSuccess = false;
        } else if (!this.parachuteOpened) {
            this.isDead = true;
            this.deathReason = '没有打开降落伞!';
            this.landingSuccess = false;
        } else {
            this.landingSuccess = true;
        }
    }
    
    openParachute() {
        if (this.canOpenParachute && !this.parachuteOpened) {
            this.parachuteOpened = true;
            this.velocityY = Math.min(this.velocityY, 10);
        }
    }
    
    setInput(keys) {
        this.isMovingLeft = keys.left;
        this.isMovingRight = keys.right;
        this.isFastDescending = keys.down;
        this.isSlowDescending = keys.up;
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            worldY: this.worldY,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            altitude: this.altitude,
            hasParachute: this.hasParachute,
            parachuteOpened: this.parachuteOpened,
            canOpenParachute: this.canOpenParachute,
            stamina: this.stamina,
            isDead: this.isDead,
            deathReason: this.deathReason,
            hasMagnet: this.hasMagnet,
            rotation: this.rotation
        };
    }
    
    deserialize(data) {
        if (!data) return;
        this.x = data.x || CONFIG.GAME.WORLD_WIDTH / 2;
        this.y = data.y || 0;
        this.worldY = data.worldY || 0;
        this.velocityX = data.velocityX || 0;
        this.velocityY = data.velocityY || 0;
        this.altitude = data.altitude || CONFIG.GAME.START_ALTITUDE;
        this.hasParachute = data.hasParachute || false;
        this.parachuteOpened = data.parachuteOpened || false;
        this.canOpenParachute = data.canOpenParachute || false;
        this.stamina = data.stamina || CONFIG.PLAYER.STAMINA_MAX;
        this.isDead = data.isDead || false;
        this.deathReason = data.deathReason || '';
        this.hasMagnet = data.hasMagnet || false;
        this.rotation = data.rotation || 0;
    }
}
