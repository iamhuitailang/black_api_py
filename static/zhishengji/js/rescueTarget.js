class RescueTarget {
    constructor(config) {
        const typeConfig = CONFIG.RESCUE_TYPES[config.type];
        this.id = config.id;
        this.type = config.type;
        this.x = config.x;
        this.y = config.y;
        this.width = 40;
        this.height = 40;
        this.name = typeConfig.name;
        this.emoji = typeConfig.emoji;
        this.score = typeConfig.score;
        this.needRope = typeConfig.needRope;
        this.climbTime = typeConfig.climbTime || 0;
        this.hasTimer = typeConfig.hasTimer || false;
        this.timer = typeConfig.timer || 0;
        this.initialTimer = typeConfig.timer || 0;
        this.needSteady = typeConfig.needSteady || false;
        this.willApproach = typeConfig.willApproach || false;
        this.description = typeConfig.description;
        this.levelGround = config.levelGround || 550;
        
        this.state = 'waiting';
        this.climbProgress = 0;
        this.rescued = false;
        this.approachSpeed = 1;
        this.initialY = config.y;
        this.ropeAttachY = 0;
    }

    update(helicopter, deltaTime) {
        if (this.rescued || this.state === 'dead') return;

        if (this.hasTimer && this.state === 'waiting') {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.state = 'dead';
                return;
            }
        }

        if (this.willApproach && this.state === 'waiting') {
            const distance = PhysicsEngine.getDistance(
                this.x + this.width / 2, this.y + this.height / 2,
                helicopter.x + helicopter.width / 2, helicopter.y + helicopter.height / 2
            );
            if (distance < 150 && helicopter.y > this.y) {
                const dx = helicopter.x - this.x;
                const dy = helicopter.y - this.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    this.x += (dx / len) * this.approachSpeed;
                    this.y += (dy / len) * this.approachSpeed * 0.5;
                }
            }
        }

        if (this.state === 'climbing') {
            this.climbProgress += deltaTime;
            const startY = this.ropeAttachY;
            const endY = helicopter.y + helicopter.height / 2 - this.height / 2;
            const climbRatio = Math.min(1, this.climbProgress / this.climbTime);
            this.y = startY + (endY - startY) * climbRatio;
            this.x = helicopter.x + helicopter.width / 2 - this.width / 2;
            
            if (this.climbProgress >= this.climbTime) {
                this.state = 'onboard';
                helicopter.releaseRope();
            }
        }

        if (this.state === 'onboard') {
            this.x = helicopter.x + helicopter.width / 2 - this.width / 2;
            this.y = helicopter.y + helicopter.height / 2 - this.height / 2;
        }
    }

    checkRopeContact(helicopter) {
        if (this.state !== 'waiting') return false;
        if (!this.needRope) return false;
        if (helicopter.ropeState !== 'extended' && helicopter.ropeState !== 'extending') return false;

        const ropeEnd = helicopter.getRopeEndPosition();
        const targetCenterX = this.x + this.width / 2;
        const targetCenterY = this.y + this.height / 2;
        
        const ropeTopX = helicopter.x + helicopter.width / 2;
        const ropeTopY = helicopter.y + helicopter.height;
        
        const A = targetCenterX - ropeTopX;
        const B = targetCenterY - ropeTopY;
        const C = ropeEnd.x - ropeTopX;
        const D = ropeEnd.y - ropeTopY;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = ropeTopX;
            yy = ropeTopY;
        } else if (param > 1) {
            xx = ropeEnd.x;
            yy = ropeEnd.y;
        } else {
            xx = ropeTopX + param * C;
            yy = ropeTopY + param * D;
        }
        
        const distance = PhysicsEngine.getDistance(targetCenterX, targetCenterY, xx, yy);
        return distance < CONFIG.GAME.rescueDistance;
    }

    checkDirectContact(helicopter) {
        if (this.state !== 'waiting') return false;
        if (this.needRope) return false;

        const distance = PhysicsEngine.getDistance(
            helicopter.x + helicopter.width / 2, helicopter.y + helicopter.height / 2,
            this.x + this.width / 2, this.y + this.height / 2
        );

        return distance < CONFIG.GAME.rescueDistance;
    }

    startClimbing(helicopter) {
        if (this.needRope && this.climbTime > 0) {
            this.state = 'climbing';
            this.climbProgress = 0;
            this.ropeAttachY = this.y;
            helicopter.holdRope();
        } else {
            this.state = 'onboard';
        }
    }

    rescue() {
        this.rescued = true;
        this.state = 'rescued';
        return this.score;
    }

    getState() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            initialY: this.initialY,
            state: this.state,
            rescued: this.rescued,
            climbProgress: this.climbProgress,
            timer: this.timer
        };
    }

    restoreState(state) {
        this.x = state.x;
        this.y = state.y;
        this.initialY = state.initialY || this.initialY;
        this.state = state.state;
        this.rescued = state.rescued;
        this.climbProgress = state.climbProgress || 0;
        this.timer = state.timer || this.initialTimer;
    }
}