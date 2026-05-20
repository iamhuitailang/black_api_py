class WindSystem {
    constructor() {
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.currentType = 'CALM';
        this.lastChangeTime = 0;
        this.nextChangeTime = 0;
        this.fluctuationPhase = 0;
        this.isFluctuating = false;
        this.effects = [];
        this.strengthMultiplier = 1.0;
    }
    
    init() {
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.currentType = 'CALM';
        this.lastChangeTime = Date.now();
        this.nextChangeTime = Date.now() + CONFIG.WIND.BASE_CHANGE_INTERVAL;
        this.fluctuationPhase = 0;
        this.isFluctuating = false;
        this.effects = [];
        this.strengthMultiplier = 1.0;
    }
    
    update(altitude, deltaTime) {
        const now = Date.now();
        
        if (now >= this.nextChangeTime) {
            this.changeWindType(altitude);
        }
        
        const windType = CONFIG.WIND.TYPES[this.currentType];
        
        if (windType.fluctuating) {
            this.fluctuationPhase += deltaTime / 1000 * 3;
            const fluctuation = Math.sin(this.fluctuationPhase) * (windType.maxSpeed - windType.minSpeed);
            const baseSpeed = this.targetSpeed > 0 ? windType.minSpeed : -windType.minSpeed;
            this.currentSpeed = baseSpeed + fluctuation;
        } else if (windType.random) {
            this.fluctuationPhase += deltaTime / 1000 * 5;
            this.currentSpeed = Utils.randomRange(-windType.maxSpeed, windType.maxSpeed);
        } else {
            this.currentSpeed = Utils.lerp(this.currentSpeed, this.targetSpeed, deltaTime / 1000 * 0.5);
        }
        
        this.effects = this.effects.filter(effect => {
            effect.remainingTime -= deltaTime;
            return effect.remainingTime > 0;
        });
    }
    
    changeWindType(altitude) {
        const now = Date.now();
        const availableTypes = ['CALM', 'BREEZE'];
        
        for (const [type, config] of Object.entries(CONFIG.WIND.TYPES)) {
            if (config.minAlt !== undefined && config.maxAlt !== undefined) {
                if (altitude >= config.minAlt && altitude <= config.maxAlt) {
                    availableTypes.push(type);
                }
            }
        }
        
        const weights = {
            CALM: 10,
            BREEZE: 40,
            STRONG: 15,
            GUST: 20,
            TURBULENCE: 15
        };
        
        let totalWeight = 0;
        const weightedTypes = availableTypes.map(type => {
            totalWeight += weights[type] || 10;
            return { type, weight: weights[type] || 10 };
        });
        
        let random = Math.random() * totalWeight;
        let selectedType = 'BREEZE';
        
        for (const wt of weightedTypes) {
            random -= wt.weight;
            if (random <= 0) {
                selectedType = wt.type;
                break;
            }
        }
        
        this.currentType = selectedType;
        const windType = CONFIG.WIND.TYPES[selectedType];
        
        if (windType.maxSpeed > 0) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            this.targetSpeed = Utils.randomRange(windType.minSpeed, windType.maxSpeed) * direction;
        } else {
            this.targetSpeed = 0;
        }
        
        this.lastChangeTime = now;
        
        if (Array.isArray(windType.duration)) {
            this.nextChangeTime = now + Utils.randomRange(windType.duration[0], windType.duration[1]);
        } else if (windType.duration === Infinity) {
            this.nextChangeTime = now + CONFIG.WIND.BASE_CHANGE_INTERVAL * 2;
        } else {
            this.nextChangeTime = now + windType.duration;
        }
        
        this.isFluctuating = windType.fluctuating || false;
        this.fluctuationPhase = 0;
    }
    
    getEffectiveSpeed() {
        let speed = this.currentSpeed * this.strengthMultiplier;
        
        for (const effect of this.effects) {
            if (effect.type === 'tailwind') {
                speed *= effect.multiplier;
            }
        }
        
        return speed;
    }
    
    addEffect(type, multiplier, duration) {
        this.effects.push({
            type,
            multiplier,
            remainingTime: duration
        });
    }
    
    getWindInfo() {
        return {
            speed: this.currentSpeed,
            effectiveSpeed: this.getEffectiveSpeed(),
            type: this.currentType,
            typeName: CONFIG.WIND.TYPES[this.currentType].name
        };
    }
    
    serialize() {
        return {
            currentSpeed: this.currentSpeed,
            targetSpeed: this.targetSpeed,
            currentType: this.currentType,
            lastChangeTime: this.lastChangeTime,
            nextChangeTime: this.nextChangeTime,
            fluctuationPhase: this.fluctuationPhase,
            isFluctuating: this.isFluctuating,
            effects: [...this.effects]
        };
    }
    
    deserialize(data) {
        if (!data) return;
        this.currentSpeed = data.currentSpeed || 0;
        this.targetSpeed = data.targetSpeed || 0;
        this.currentType = data.currentType || 'CALM';
        this.lastChangeTime = data.lastChangeTime || Date.now();
        this.nextChangeTime = data.nextChangeTime || Date.now() + 3000;
        this.fluctuationPhase = data.fluctuationPhase || 0;
        this.isFluctuating = data.isFluctuating || false;
        this.effects = data.effects || [];
    }
}
